---
title: 如何在渲染进程中访问 Node API？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在渲染进程中安全访问 Node.js API 的方法，包括 preload 脚本和 contextBridge 的使用。
tags:
  - Electron
  - 渲染进程
  - Node.js
  - preload
estimatedTime: 12 分钟
keywords:
  - Node API
  - preload
  - contextBridge
highlight: 通过 preload 脚本和 contextBridge 可以安全地在渲染进程中使用 Node.js 功能
order: 59
---

## 问题 1：渲染进程默认能访问 Node API 吗？

**默认不能**。出于安全考虑，Electron 默认禁用了渲染进程的 Node.js 集成：

```javascript
// 默认配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 默认禁用
    contextIsolation: true, // 默认启用
  },
});

// 渲染进程中
require("fs"); // ❌ 报错：require is not defined
```

---

## 问题 2：如何安全地访问 Node API？

推荐使用 **preload 脚本 + contextBridge** 的方式：

### 步骤 1：创建 preload 脚本

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

// 通过 contextBridge 暴露安全的 API
contextBridge.exposeInMainWorld("electronAPI", {
  // 文件操作
  readFile: (filePath) => fs.promises.readFile(filePath, "utf-8"),
  writeFile: (filePath, content) => fs.promises.writeFile(filePath, content),

  // 路径操作
  joinPath: (...args) => path.join(...args),

  // IPC 通信
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});
```

### 步骤 2：配置 BrowserWindow

```javascript
// main.js
const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true, // 保持启用
    nodeIntegration: false, // 保持禁用
  },
});
```

### 步骤 3：在渲染进程中使用

```javascript
// renderer.js
// 通过 window.electronAPI 访问暴露的功能
const content = await window.electronAPI.readFile("/path/to/file");
await window.electronAPI.writeFile("/path/to/file", "new content");

// IPC 通信
const result = await window.electronAPI.invoke("some-channel", data);
```

---

## 问题 3：为什么不直接开启 nodeIntegration？

虽然可以直接开启，但这样做有严重的安全风险：

```javascript
// ⚠️ 不推荐的做法
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
});
```

### 安全风险

```javascript
// 如果渲染进程加载了恶意脚本
// 攻击者可以执行任意系统命令

// 恶意脚本示例
const { exec } = require("child_process");
exec("rm -rf /"); // 删除所有文件

const fs = require("fs");
fs.readFileSync("/etc/passwd"); // 读取敏感文件
```

### 风险场景

- 加载远程 URL 时
- 使用第三方库时
- 显示用户生成的内容时

---

## 问题 4：preload 脚本有什么特殊之处？

### 执行时机

preload 脚本在渲染进程加载页面之前执行：

```
BrowserWindow 创建
       ↓
preload.js 执行 (可以访问 Node.js)
       ↓
页面 DOM 开始加载
       ↓
renderer.js 执行 (只能访问暴露的 API)
```

### 特殊权限

```javascript
// preload.js 可以访问
const { ipcRenderer, contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

// 但应该只暴露必要的功能
contextBridge.exposeInMainWorld("api", {
  // ✅ 暴露具体功能，而不是整个模块
  readConfig: () => fs.readFileSync("./config.json", "utf-8"),

  // ❌ 不要暴露整个 fs 模块
  // fs: fs  // 危险！
});
```

### 最佳实践

```javascript
// preload.js - 安全的 API 设计
contextBridge.exposeInMainWorld("electronAPI", {
  // 1. 限制可操作的路径
  readAppFile: (filename) => {
    const safePath = path.join(app.getPath("userData"), filename);
    return fs.promises.readFile(safePath, "utf-8");
  },

  // 2. 验证输入
  saveDocument: (content) => {
    if (typeof content !== "string") {
      throw new Error("Content must be a string");
    }
    return ipcRenderer.invoke("save-document", content);
  },

  // 3. 限制 IPC 通道
  invoke: (channel, data) => {
    const allowedChannels = ["get-data", "save-data", "open-dialog"];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error("Invalid channel");
  },
});
```

## 延伸阅读

- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [preload 脚本](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)
