---
title: IPC Main 与 IPC Renderer 的区别？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  对比 ipcMain 和 ipcRenderer 两个模块的职责、API 差异以及在进程间通信中的角色。
tags:
  - Electron
  - IPC
  - 进程通信
  - ipcMain
estimatedTime: 10 分钟
keywords:
  - ipcMain
  - ipcRenderer
  - 进程间通信
highlight: ipcMain 在主进程中接收消息，ipcRenderer 在渲染进程中发送和接收消息
order: 80
---

## 问题 1：ipcMain 和 ipcRenderer 分别是什么？

这是 Electron 提供的两个 IPC（进程间通信）模块：

### ipcMain

运行在**主进程**中，用于接收和处理来自渲染进程的消息：

```javascript
// main.js (主进程)
const { ipcMain } = require("electron");

// 监听渲染进程的消息
ipcMain.on("message-from-renderer", (event, data) => {
  console.log("收到消息:", data);
});
```

### ipcRenderer

运行在**渲染进程**中，用于向主进程发送消息和接收主进程的响应：

```javascript
// preload.js 或渲染进程
const { ipcRenderer } = require("electron");

// 向主进程发送消息
ipcRenderer.send("message-from-renderer", { hello: "world" });
```

---

## 问题 2：两者的 API 有什么区别？

### ipcMain 的 API

```javascript
const { ipcMain } = require("electron");

// 1. 监听单向消息
ipcMain.on("channel", (event, ...args) => {
  // event.sender 是发送消息的 webContents
  // 可以用它回复消息
  event.sender.send("reply-channel", response);
});

// 2. 处理双向请求（推荐）
ipcMain.handle("channel", async (event, ...args) => {
  // 返回值会作为 Promise 结果返回给渲染进程
  return await doSomething(args);
});

// 3. 只监听一次
ipcMain.once("channel", (event, ...args) => {
  // 处理后自动移除监听
});

// 4. 移除监听
ipcMain.removeListener("channel", listener);
ipcMain.removeAllListeners("channel");
```

### ipcRenderer 的 API

```javascript
const { ipcRenderer } = require("electron");

// 1. 发送单向消息
ipcRenderer.send("channel", data);

// 2. 发送并等待响应（推荐）
const result = await ipcRenderer.invoke("channel", data);

// 3. 同步发送（阻塞，不推荐）
const result = ipcRenderer.sendSync("channel", data);

// 4. 监听主进程消息
ipcRenderer.on("channel", (event, ...args) => {
  // 处理主进程发来的消息
});

// 5. 只监听一次
ipcRenderer.once("channel", (event, ...args) => {});
```

---

## 问题 3：通信模式有哪些？

### 模式 1：渲染进程 → 主进程（单向）

```javascript
// 渲染进程发送
ipcRenderer.send("log", { message: "hello" });

// 主进程接收
ipcMain.on("log", (event, data) => {
  console.log(data.message);
  // 不需要返回值
});
```

### 模式 2：渲染进程 ↔ 主进程（双向）

```javascript
// 渲染进程请求
const userData = await ipcRenderer.invoke("get-user", userId);

// 主进程处理并返回
ipcMain.handle("get-user", async (event, userId) => {
  const user = await database.findUser(userId);
  return user; // 返回给渲染进程
});
```

### 模式 3：主进程 → 渲染进程

```javascript
// 主进程主动发送
win.webContents.send("update-available", { version: "2.0.0" });

// 渲染进程监听
ipcRenderer.on("update-available", (event, info) => {
  showUpdateDialog(info);
});
```

### 模式 4：渲染进程 ↔ 渲染进程

```javascript
// 通过主进程中转
// 窗口 A 发送
ipcRenderer.send("message-to-window", { targetId: 2, data: "hello" });

// 主进程转发
ipcMain.on("message-to-window", (event, { targetId, data }) => {
  const targetWindow = BrowserWindow.fromId(targetId);
  targetWindow.webContents.send("message-from-window", data);
});

// 窗口 B 接收
ipcRenderer.on("message-from-window", (event, data) => {
  console.log(data);
});
```

---

## 问题 4：使用时有什么注意事项？

### 1. 在 preload 中使用 ipcRenderer

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// 不要直接暴露 ipcRenderer
// ❌ 危险
contextBridge.exposeInMainWorld("ipc", ipcRenderer);

// ✅ 安全：只暴露特定的通道
contextBridge.exposeInMainWorld("api", {
  getUser: (id) => ipcRenderer.invoke("get-user", id),
  onNotification: (callback) => {
    ipcRenderer.on("notification", (e, data) => callback(data));
  },
});
```

### 2. 避免使用 sendSync

```javascript
// ❌ 同步调用会阻塞渲染进程
const result = ipcRenderer.sendSync("heavy-task");

// ✅ 使用异步调用
const result = await ipcRenderer.invoke("heavy-task");
```

### 3. 验证消息来源

```javascript
// main.js
ipcMain.handle("sensitive-operation", (event, data) => {
  // 验证请求来源
  const senderFrame = event.senderFrame;
  if (senderFrame.url.startsWith("file://")) {
    // 只处理本地页面的请求
    return performOperation(data);
  }
  throw new Error("Unauthorized");
});
```

### 4. 清理监听器

```javascript
// 避免内存泄漏
const handler = (event, data) => {
  /* ... */
};
ipcRenderer.on("channel", handler);

// 组件卸载时移除
ipcRenderer.removeListener("channel", handler);
```

## 延伸阅读

- [ipcMain 文档](https://www.electronjs.org/docs/latest/api/ipc-main)
- [ipcRenderer 文档](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [IPC 教程](https://www.electronjs.org/docs/latest/tutorial/ipc)
