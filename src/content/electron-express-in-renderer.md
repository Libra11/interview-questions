---
title: 为什么不能在渲染进程直接启动 Express？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  解释为什么不应该在渲染进程中启动 Express 服务器，以及正确的替代方案。
tags:
  - Electron
  - Express
  - 渲染进程
  - 安全
estimatedTime: 10 分钟
keywords:
  - Express
  - 渲染进程
  - 安全限制
highlight: 渲染进程应保持纯前端代码，服务器逻辑应放在主进程或子进程中
order: 268
---

## 问题 1：为什么不能这样做？

### 安全原因

```javascript
// ❌ 渲染进程中启动 Express
// 需要 nodeIntegration: true，这是不安全的

const express = require("express"); // 需要 Node.js
const app = express();
app.listen(3000);

// 风险：
// 1. 开启 nodeIntegration 会暴露系统 API
// 2. XSS 攻击可以执行任意 Node.js 代码
// 3. 违反最小权限原则
```

### 架构原因

```
渲染进程的职责：
├── 显示 UI
├── 处理用户交互
├── 调用 API
└── 不应该运行服务器

主进程的职责：
├── 管理窗口
├── 系统集成
├── 运行后端服务
└── 处理 IPC
```

---

## 问题 2：正确的做法

### 方案 1：主进程运行 Express

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const express = require("express");

let server;

app.whenReady().then(() => {
  // 在主进程启动 Express
  const expressApp = express();
  expressApp.get("/api/data", (req, res) => {
    res.json({ message: "Hello" });
  });
  server = expressApp.listen(3001);

  createWindow();
});

// 渲染进程通过 fetch 访问
// fetch('http://localhost:3001/api/data')
```

### 方案 2：使用 IPC 替代 HTTP

```javascript
// main.js
ipcMain.handle("api:getData", async () => {
  return { message: "Hello" };
});

// preload.js
contextBridge.exposeInMainWorld("api", {
  getData: () => ipcRenderer.invoke("api:getData"),
});

// renderer.js
const data = await window.api.getData();
```

---

## 问题 3：使用子进程

```javascript
// main.js
const { fork } = require("child_process");
const path = require("path");

let serverProcess;

function startServer() {
  serverProcess = fork(path.join(__dirname, "server.js"));

  serverProcess.on("message", (msg) => {
    console.log("Server:", msg);
  });
}

// server.js
const express = require("express");
const app = express();

app.get("/api/data", (req, res) => {
  res.json({ data: "from server" });
});

app.listen(3001, () => {
  process.send({ status: "ready", port: 3001 });
});
```

---

## 问题 4：使用 utilityProcess

```javascript
// main.js (Electron 22+)
const { utilityProcess } = require("electron");
const path = require("path");

const server = utilityProcess.fork(path.join(__dirname, "server.js"));

server.on("message", (msg) => {
  console.log("Server ready:", msg);
});

// server.js
const express = require("express");
const app = express();

app.listen(3001, () => {
  process.parentPort.postMessage({ status: "ready" });
});
```

---

## 问题 5：对比总结

```
方案对比：

IPC 方式：
├── 最安全
├── 无需端口
├── 类型安全
└── 推荐大多数场景

主进程 Express：
├── 简单直接
├── 可能阻塞主进程
└── 适合轻量 API

子进程 Express：
├── 不阻塞主进程
├── 可复用现有代码
├── 需要进程间通信
└── 适合复杂后端
```

## 延伸阅读

- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)
