---
title: 如何把后端部分打包进应用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍将后端服务（如 Express、数据库）打包进 Electron 应用的方法和最佳实践。
tags:
  - Electron
  - 后端集成
  - Express
  - 打包
estimatedTime: 12 分钟
keywords:
  - 后端打包
  - Express集成
  - 本地服务器
highlight: 后端代码在主进程中运行，通过 IPC 或本地 HTTP 与渲染进程通信
order: 63
---

## 问题 1：后端代码放在哪里？

### 架构选择

```
方案 1：主进程直接运行
├── 简单直接
├── 共享 Node.js 环境
└── 可能阻塞主进程

方案 2：子进程运行
├── 独立进程
├── 不阻塞主进程
└── 需要进程间通信

方案 3：使用 utilityProcess
├── Electron 推荐
├── 轻量级子进程
└── 更好的资源管理
```

---

## 问题 2：主进程中运行 Express

```javascript
// main.js
const { app, BrowserWindow } = require("electron");
const express = require("express");

let server;

function startServer() {
  const expressApp = express();

  expressApp.use(express.json());

  expressApp.get("/api/data", (req, res) => {
    res.json({ message: "Hello from backend" });
  });

  server = expressApp.listen(3001, () => {
    console.log("Backend running on port 3001");
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("before-quit", () => {
  if (server) server.close();
});
```

---

## 问题 3：使用子进程

```javascript
// main.js
const { fork } = require("child_process");
const path = require("path");

let serverProcess;

function startBackend() {
  serverProcess = fork(path.join(__dirname, "server.js"));

  serverProcess.on("message", (msg) => {
    if (msg.type === "ready") {
      console.log("Backend ready on port", msg.port);
    }
  });
}

// server.js
const express = require("express");
const app = express();

app.get("/api/data", (req, res) => {
  res.json({ data: "from backend" });
});

const server = app.listen(0, () => {
  process.send({ type: "ready", port: server.address().port });
});
```

---

## 问题 4：打包配置

### 包含后端依赖

```json
// package.json
{
  "dependencies": {
    "express": "^4.18.0",
    "better-sqlite3": "^9.0.0"
  },
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

### electron-builder 配置

```json
{
  "files": ["dist/**/*", "server/**/*", "package.json"],
  "asarUnpack": ["**/*.node", "**/better-sqlite3/**"],
  "extraResources": [
    {
      "from": "database/",
      "to": "database/"
    }
  ]
}
```

---

## 问题 5：使用 IPC 替代 HTTP

```javascript
// main.js - 更推荐的方式
const { ipcMain } = require("electron");
const db = require("./database");

ipcMain.handle("api:getData", async () => {
  return db.query("SELECT * FROM items");
});

ipcMain.handle("api:saveData", async (event, data) => {
  return db.insert("items", data);
});

// preload.js
contextBridge.exposeInMainWorld("api", {
  getData: () => ipcRenderer.invoke("api:getData"),
  saveData: (data) => ipcRenderer.invoke("api:saveData", data),
});

// renderer.js
const data = await window.api.getData();
```

### 优势对比

```
IPC 方式：
├── 无需启动 HTTP 服务器
├── 更安全（无端口暴露）
├── 更简单的错误处理
└── 更好的类型支持

HTTP 方式：
├── 可复用现有后端代码
├── 便于调试（可用 Postman）
├── 支持 WebSocket
└── 可独立部署
```

## 延伸阅读

- [Electron 主进程](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)
