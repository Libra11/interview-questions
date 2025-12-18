---
title: preload 脚本的作用是什么？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  详解 Electron preload 脚本的作用、执行时机和使用方式，理解它在安全架构中的关键角色。
tags:
  - Electron
  - preload
  - 安全
  - 进程通信
estimatedTime: 10 分钟
keywords:
  - preload脚本
  - 预加载
  - 安全桥接
highlight: preload 脚本是连接主进程和渲染进程的安全桥梁，在页面加载前执行
order: 108
---

## 问题 1：preload 脚本是什么？

preload 脚本是一个在渲染进程加载页面之前执行的 JavaScript 文件。它有特殊的权限：

- 可以访问 Node.js API
- 可以访问 Electron API（如 ipcRenderer）
- 可以访问 DOM（在 DOMContentLoaded 之后）

```javascript
// main.js - 配置 preload 脚本
const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

---

## 问题 2：preload 脚本的执行时机是什么？

```
BrowserWindow 创建
       ↓
preload.js 开始执行
       ↓
contextBridge.exposeInMainWorld() 暴露 API
       ↓
页面 HTML 开始加载
       ↓
DOMContentLoaded 事件
       ↓
页面脚本执行（可以使用暴露的 API）
       ↓
load 事件
```

### 验证执行顺序

```javascript
// preload.js
console.log("1. Preload script started");

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  test: () => console.log("API called"),
});

console.log("2. API exposed");

document.addEventListener("DOMContentLoaded", () => {
  console.log("3. DOM ready in preload");
});

// renderer.js (页面脚本)
console.log("4. Page script started");
window.api.test(); // '5. API called'
```

---

## 问题 3：preload 脚本的主要用途是什么？

### 1. 安全地暴露 API

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 文件操作
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  saveFile: (path, content) => ipcRenderer.invoke("save-file", path, content),

  // 系统对话框
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),

  // 应用信息
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => process.platform,
});
```

### 2. 设置 IPC 监听

```javascript
// preload.js
contextBridge.exposeInMainWorld("electronAPI", {
  // 监听主进程推送
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (event, info) => callback(info));
  },

  onDownloadProgress: (callback) => {
    ipcRenderer.on("download-progress", (event, progress) =>
      callback(progress)
    );
  },

  // 带清理功能的监听
  onNotification: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("notification", handler);
    return () => ipcRenderer.removeListener("notification", handler);
  },
});
```

### 3. 提供环境信息

```javascript
// preload.js
contextBridge.exposeInMainWorld("env", {
  platform: process.platform,
  arch: process.arch,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  isDev: process.env.NODE_ENV === "development",
});
```

---

## 问题 4：preload 脚本有什么限制？

### 1. contextIsolation 开启时的限制

```javascript
// preload.js
// ❌ 不能直接修改 window 对象
window.myAPI = {
  /* ... */
}; // 页面脚本看不到

// ✅ 必须使用 contextBridge
contextBridge.exposeInMainWorld("myAPI", {
  /* ... */
});
```

### 2. 不能暴露某些类型

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  // ✅ 可以暴露
  string: "hello",
  number: 42,
  boolean: true,
  array: [1, 2, 3],
  object: { key: "value" },
  function: () => "result",
  promise: async () => "async result",

  // ❌ 不能暴露
  // symbol: Symbol('test'),
  // class: MyClass,
  // prototype: Object.prototype
});
```

### 3. 暴露的函数会被包装

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  getData: () => {
    return { value: 42 };
  },
});

// renderer.js
const result = window.api.getData();
// result 是原对象的副本，不是引用
```

---

## 问题 5：preload 脚本的最佳实践

### 最小化暴露的 API

```javascript
// ❌ 不好：暴露太多能力
contextBridge.exposeInMainWorld("api", {
  invoke: ipcRenderer.invoke, // 可以调用任意通道
  fs: require("fs"), // 完整的文件系统访问
});

// ✅ 好：只暴露必要的功能
contextBridge.exposeInMainWorld("api", {
  loadDocument: (id) => ipcRenderer.invoke("load-document", id),
  saveDocument: (doc) => ipcRenderer.invoke("save-document", doc),
});
```

### 输入验证

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  readFile: (filename) => {
    // 在 preload 中也做基本验证
    if (typeof filename !== "string") {
      throw new TypeError("Filename must be a string");
    }
    if (filename.includes("..")) {
      throw new Error("Invalid filename");
    }
    return ipcRenderer.invoke("read-file", filename);
  },
});
```

### 清理监听器

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  subscribe: (channel, callback) => {
    const validChannels = ["update", "notification"];
    if (!validChannels.includes(channel)) {
      throw new Error("Invalid channel");
    }

    const handler = (event, data) => callback(data);
    ipcRenderer.on(channel, handler);

    // 返回取消订阅函数
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },
});

// renderer.js
const unsubscribe = window.api.subscribe("update", handleUpdate);
// 组件卸载时
unsubscribe();
```

## 延伸阅读

- [Preload 脚本教程](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [进程间通信](https://www.electronjs.org/docs/latest/tutorial/ipc)
