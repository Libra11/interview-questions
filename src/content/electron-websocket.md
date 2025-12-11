---
title: 如何实现 WebSocket 通信？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 应用中实现 WebSocket 通信的方法，包括客户端和服务端实现。
tags:
  - Electron
  - WebSocket
  - 实时通信
  - 网络
estimatedTime: 12 分钟
keywords:
  - WebSocket
  - 实时通信
  - ws
highlight: 可以在渲染进程使用浏览器 WebSocket API，或在主进程使用 ws 库
order: 74
---

## 问题 1：渲染进程中使用 WebSocket

### 浏览器原生 API

```javascript
// renderer.js
const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
  console.log("连接已建立");
  ws.send("Hello Server");
};

ws.onmessage = (event) => {
  console.log("收到消息:", event.data);
};

ws.onclose = () => {
  console.log("连接已关闭");
};

ws.onerror = (error) => {
  console.error("WebSocket 错误:", error);
};
```

---

## 问题 2：主进程中使用 WebSocket

### 使用 ws 库

```bash
npm install ws
```

```javascript
// main.js - 作为客户端
const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  ws.send("Hello from Electron");
});

ws.on("message", (data) => {
  // 转发到渲染进程
  mainWindow.webContents.send("ws-message", data.toString());
});
```

### 作为服务端

```javascript
// main.js - 作为服务端
const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("客户端已连接");

  ws.on("message", (message) => {
    console.log("收到:", message.toString());
    ws.send("收到你的消息");
  });
});
```

---

## 问题 3：通过 IPC 桥接

```javascript
// main.js
const WebSocket = require("ws");
const { ipcMain } = require("electron");

let ws;

ipcMain.handle("ws:connect", (event, url) => {
  ws = new WebSocket(url);

  ws.on("open", () => {
    event.sender.send("ws:open");
  });

  ws.on("message", (data) => {
    event.sender.send("ws:message", data.toString());
  });

  ws.on("close", () => {
    event.sender.send("ws:close");
  });
});

ipcMain.handle("ws:send", (event, message) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  }
});

ipcMain.handle("ws:close", () => {
  if (ws) {
    ws.close();
  }
});
```

```javascript
// preload.js
contextBridge.exposeInMainWorld("ws", {
  connect: (url) => ipcRenderer.invoke("ws:connect", url),
  send: (message) => ipcRenderer.invoke("ws:send", message),
  close: () => ipcRenderer.invoke("ws:close"),
  onOpen: (callback) => ipcRenderer.on("ws:open", callback),
  onMessage: (callback) =>
    ipcRenderer.on("ws:message", (e, data) => callback(data)),
  onClose: (callback) => ipcRenderer.on("ws:close", callback),
});
```

---

## 问题 4：重连机制

```javascript
// 自动重连
class ReconnectingWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxRetries = options.maxRetries || 10;
    this.retries = 0;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retries = 0;
      this.onopen?.();
    };

    this.ws.onclose = () => {
      this.onclose?.();
      this.reconnect();
    };

    this.ws.onmessage = (e) => this.onmessage?.(e);
    this.ws.onerror = (e) => this.onerror?.(e);
  }

  reconnect() {
    if (this.retries < this.maxRetries) {
      this.retries++;
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close() {
    this.maxRetries = 0;
    this.ws.close();
  }
}
```

---

## 问题 5：Socket.IO 集成

```bash
npm install socket.io-client
```

```javascript
// renderer.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("已连接");
});

socket.on("message", (data) => {
  console.log("收到:", data);
});

socket.emit("chat", { text: "Hello" });
```

## 延伸阅读

- [WebSocket API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [ws 库](https://github.com/websockets/ws)
- [Socket.IO](https://socket.io/)
