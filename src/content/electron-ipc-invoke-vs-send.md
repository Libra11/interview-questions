---
title: ipcRenderer.invoke 和 ipcRenderer.send 用法区别？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  对比 ipcRenderer.invoke 和 ipcRenderer.send 的使用方式，理解双向通信和单向通信的区别。
tags:
  - Electron
  - IPC
  - ipcRenderer
  - 异步通信
estimatedTime: 8 分钟
keywords:
  - ipcRenderer.invoke
  - ipcRenderer.send
  - 双向通信
highlight: invoke 返回 Promise 用于双向通信，send 用于单向消息发送
order: 94
---

## 问题 1：两者的基本用法是什么？

### ipcRenderer.send

发送单向消息，不等待返回值：

```javascript
// 渲染进程
ipcRenderer.send("log-message", "Hello from renderer");
ipcRenderer.send("update-settings", { theme: "dark" });

// 主进程
ipcMain.on("log-message", (event, message) => {
  console.log(message);
});

ipcMain.on("update-settings", (event, settings) => {
  applySettings(settings);
});
```

### ipcRenderer.invoke

发送请求并等待响应，返回 Promise：

```javascript
// 渲染进程
const result = await ipcRenderer.invoke("get-user-data", userId);
console.log(result);

// 主进程
ipcMain.handle("get-user-data", async (event, userId) => {
  const user = await database.findUser(userId);
  return user;
});
```

---

## 问题 2：什么时候用 invoke，什么时候用 send？

### 使用 invoke 的场景

**需要获取结果的操作**：

```javascript
// 文件操作
const content = await ipcRenderer.invoke("read-file", "/path/to/file");

// 数据查询
const users = await ipcRenderer.invoke("query-users", { active: true });

// 系统对话框
const filePath = await ipcRenderer.invoke("show-save-dialog");

// 配置获取
const config = await ipcRenderer.invoke("get-app-config");
```

### 使用 send 的场景

**不需要返回值的通知**：

```javascript
// 日志记录
ipcRenderer.send("log", { level: "info", message: "User clicked button" });

// 分析事件
ipcRenderer.send("track-event", { name: "page_view", page: "/home" });

// 窗口控制
ipcRenderer.send("minimize-window");
ipcRenderer.send("close-window");

// 状态同步
ipcRenderer.send("sync-state", { isPlaying: true });
```

---

## 问题 3：两者的代码模式有什么区别？

### send + on 模式（传统方式）

```javascript
// 渲染进程 - 发送请求
ipcRenderer.send("fetch-data", { id: 123 });

// 渲染进程 - 监听响应
ipcRenderer.on("fetch-data-response", (event, data) => {
  updateUI(data);
});

// 主进程
ipcMain.on("fetch-data", async (event, params) => {
  const data = await fetchData(params.id);
  event.sender.send("fetch-data-response", data);
});
```

这种模式的问题：

- 需要两个通道（请求和响应）
- 难以关联请求和响应
- 错误处理复杂

### invoke + handle 模式（推荐）

```javascript
// 渲染进程 - 一行代码完成请求和响应
const data = await ipcRenderer.invoke("fetch-data", { id: 123 });
updateUI(data);

// 主进程
ipcMain.handle("fetch-data", async (event, params) => {
  return await fetchData(params.id);
});
```

优势：

- 代码更简洁
- 自动关联请求和响应
- 原生支持 async/await
- 错误自动传递

---

## 问题 4：错误处理有什么区别？

### invoke 的错误处理

```javascript
// 主进程抛出错误
ipcMain.handle("may-fail", async () => {
  throw new Error("Operation failed");
});

// 渲染进程捕获错误
try {
  await ipcRenderer.invoke("may-fail");
} catch (error) {
  console.error("Error:", error.message); // 'Operation failed'
}
```

### send 的错误处理

```javascript
// 主进程
ipcMain.on("may-fail", async (event) => {
  try {
    await riskyOperation();
    event.sender.send("operation-success");
  } catch (error) {
    event.sender.send("operation-error", error.message);
  }
});

// 渲染进程 - 需要监听两个通道
ipcRenderer.on("operation-success", () => {
  console.log("Success");
});

ipcRenderer.on("operation-error", (event, message) => {
  console.error("Error:", message);
});

ipcRenderer.send("may-fail");
```

---

## 问题 5：在 preload 中如何封装？

### 推荐的封装方式

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // invoke 封装 - 用于需要返回值的操作
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  saveFile: (path, content) => ipcRenderer.invoke("save-file", path, content),
  showDialog: (options) => ipcRenderer.invoke("show-dialog", options),

  // send 封装 - 用于单向通知
  log: (message) => ipcRenderer.send("log", message),
  minimize: () => ipcRenderer.send("minimize"),

  // 监听主进程推送
  onNotification: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("notification", handler);
    // 返回取消订阅函数
    return () => ipcRenderer.removeListener("notification", handler);
  },
});

// renderer.js - 使用封装的 API
// 双向通信
const content = await window.electronAPI.readFile("/path/to/file");

// 单向通知
window.electronAPI.log("User action");

// 监听推送
const unsubscribe = window.electronAPI.onNotification((data) => {
  showNotification(data);
});
// 组件卸载时取消订阅
unsubscribe();
```

### 对比总结

| 特性       | ipcRenderer.send | ipcRenderer.invoke |
| ---------- | ---------------- | ------------------ |
| 返回值     | 无               | Promise            |
| 配对方法   | ipcMain.on       | ipcMain.handle     |
| 错误处理   | 手动             | 自动 (try/catch)   |
| 代码复杂度 | 较高             | 较低               |
| 适用场景   | 单向通知         | 请求-响应          |

## 延伸阅读

- [ipcRenderer 文档](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [IPC 通信教程](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [进程间通信最佳实践](https://www.electronjs.org/docs/latest/tutorial/message-ports)
