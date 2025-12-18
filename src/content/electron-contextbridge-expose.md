---
title: contextBridge.exposeInMainWorld 为什么必须使用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  解释为什么在开启 contextIsolation 时必须使用 contextBridge 来暴露 API，以及它的安全机制。
tags:
  - Electron
  - contextBridge
  - 安全
  - API暴露
estimatedTime: 10 分钟
keywords:
  - contextBridge
  - exposeInMainWorld
  - 上下文隔离
highlight: contextBridge 是在隔离的上下文间安全传递 API 的唯一方式
order: 115
---

## 问题 1：为什么不能直接修改 window？

当 `contextIsolation: true` 时，preload 脚本和页面脚本运行在不同的 JavaScript 上下文中：

```javascript
// preload.js
window.myAPI = {
  doSomething: () => console.log("Hello"),
};

console.log(window.myAPI); // { doSomething: [Function] }

// renderer.js (页面脚本)
console.log(window.myAPI); // undefined ❌
```

这是因为两个上下文有各自独立的 `window` 对象：

```
┌─────────────────────────────────────────┐
│            渲染进程                      │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │ Preload 上下文   │ │  页面上下文     ││
│  │                 │ │                 ││
│  │ window (A)      │ │ window (B)      ││
│  │ - myAPI ✓       │ │ - myAPI ✗       ││
│  │                 │ │                 ││
│  └─────────────────┘ └─────────────────┘│
│         不同的 window 对象               │
└─────────────────────────────────────────┘
```

---

## 问题 2：contextBridge 做了什么？

`contextBridge.exposeInMainWorld` 在两个隔离的上下文之间建立安全的桥梁：

```javascript
// preload.js
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("myAPI", {
  doSomething: () => console.log("Hello"),
});

// renderer.js
window.myAPI.doSomething(); // 'Hello' ✅
```

### 工作原理

```
┌─────────────────────────────────────────────────┐
│                  渲染进程                        │
│  ┌─────────────────┐     ┌─────────────────┐   │
│  │ Preload 上下文   │     │   页面上下文     │   │
│  │                 │     │                 │   │
│  │ 原始 API 对象    │     │ window.myAPI    │   │
│  │ { doSomething } │────►│ (代理对象)       │   │
│  │                 │     │                 │   │
│  └─────────────────┘     └─────────────────┘   │
│                                                 │
│         contextBridge 安全复制/代理              │
└─────────────────────────────────────────────────┘
```

---

## 问题 3：contextBridge 的安全机制是什么？

### 1. 值的复制而非引用

```javascript
// preload.js
const sensitiveData = { secret: "password123" };

contextBridge.exposeInMainWorld("api", {
  getData: () => sensitiveData,
});

// renderer.js
const data = window.api.getData();
data.secret = "hacked"; // 只修改了副本

// preload 中的 sensitiveData 不受影响
```

### 2. 函数的包装

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  process: (input) => {
    // 这个函数在 preload 上下文中执行
    return input.toUpperCase();
  },
});

// renderer.js
// 页面脚本无法访问 preload 上下文中的变量
window.api.process("hello"); // 'HELLO'
```

### 3. 防止原型链污染

```javascript
// renderer.js (恶意代码)
Object.prototype.malicious = function () {
  // 尝试污染原型链
};

Array.prototype.map = function () {
  // 尝试劫持数组方法
};

// preload 上下文不受影响
// 因为它有独立的原型链
```

---

## 问题 4：哪些类型可以通过 contextBridge 传递？

### 支持的类型

```javascript
contextBridge.exposeInMainWorld("api", {
  // 原始类型
  string: "hello",
  number: 42,
  boolean: true,
  null: null,
  undefined: undefined,

  // 对象和数组
  object: { key: "value", nested: { a: 1 } },
  array: [1, 2, 3, { x: "y" }],

  // 函数
  syncFunction: () => "result",
  asyncFunction: async () => "async result",

  // Promise
  getPromise: () => Promise.resolve("data"),
});
```

### 不支持的类型

```javascript
// ❌ 这些类型不能直接暴露
contextBridge.exposeInMainWorld("api", {
  // Symbol
  symbol: Symbol("test"), // 错误

  // 类实例（会丢失方法）
  date: new Date(), // 会变成普通对象

  // 原型链上的方法
  proto: Object.prototype, // 错误

  // DOM 元素
  element: document.body, // 错误
});
```

### 处理特殊类型

```javascript
// preload.js
contextBridge.exposeInMainWorld("api", {
  // Date 需要序列化
  getDate: () => new Date().toISOString(),

  // 复杂对象需要转换
  getError: () => {
    try {
      throw new Error("test");
    } catch (e) {
      return { message: e.message, stack: e.stack };
    }
  },
});
```

---

## 问题 5：不使用 contextBridge 会怎样？

### 方案 1：关闭 contextIsolation（不推荐）

```javascript
// main.js
new BrowserWindow({
  webPreferences: {
    contextIsolation: false, // ⚠️ 不安全
    preload: path.join(__dirname, "preload.js"),
  },
});

// preload.js
// 可以直接修改 window
window.myAPI = {
  /* ... */
};

// 但这样会有安全风险：原型链污染
```

### 方案 2：使用 postMessage（复杂）

```javascript
// preload.js
window.addEventListener("message", (event) => {
  if (event.data.type === "request") {
    // 处理请求
    window.postMessage({ type: "response", data: result });
  }
});

// renderer.js
window.postMessage({ type: "request", action: "getData" });
window.addEventListener("message", (event) => {
  if (event.data.type === "response") {
    // 处理响应
  }
});

// 这种方式更复杂，而且仍然有安全问题
```

### 结论

`contextBridge.exposeInMainWorld` 是在保持安全性的同时暴露 API 的最佳方式：

```javascript
// ✅ 推荐做法
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  saveFile: (path, content) => ipcRenderer.invoke("save-file", path, content),
  onUpdate: (callback) => ipcRenderer.on("update", (e, d) => callback(d)),
});
```

## 延伸阅读

- [contextBridge API 文档](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Context Isolation 详解](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
