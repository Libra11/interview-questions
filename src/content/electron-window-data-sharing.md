---
title: 如何让两个窗口之间共享数据？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 多窗口间数据共享的多种方案，包括 IPC 中转、共享存储和 MessagePort 等方式。
tags:
  - Electron
  - 窗口通信
  - 数据共享
  - IPC
estimatedTime: 12 分钟
keywords:
  - 窗口通信
  - 数据共享
  - MessagePort
highlight: 窗口间数据共享可通过主进程中转、共享存储或 MessagePort 直连实现
order: 145
---

## 问题 1：通过主进程中转数据

这是最常用的方式，主进程作为消息中心：

### 主进程代码

```javascript
// main.js
const { ipcMain, BrowserWindow } = require("electron");

// 存储窗口引用
const windows = new Map();

// 窗口 A 发送数据给窗口 B
ipcMain.on("send-to-window", (event, { targetWindow, channel, data }) => {
  const target = windows.get(targetWindow);
  if (target && !target.isDestroyed()) {
    target.webContents.send(channel, data);
  }
});

// 广播给所有窗口
ipcMain.on("broadcast", (event, { channel, data }) => {
  windows.forEach((win, name) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
});

// 请求-响应模式
ipcMain.handle(
  "request-from-window",
  async (event, { targetWindow, channel, data }) => {
    const target = windows.get(targetWindow);
    if (!target || target.isDestroyed()) {
      throw new Error("Target window not found");
    }

    // 向目标窗口发送请求并等待响应
    return new Promise((resolve) => {
      const responseChannel = `${channel}-response-${Date.now()}`;

      ipcMain.once(responseChannel, (e, response) => {
        resolve(response);
      });

      target.webContents.send(channel, { data, responseChannel });
    });
  }
);
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowComm", {
  // 发送给指定窗口
  sendTo: (targetWindow, channel, data) => {
    ipcRenderer.send("send-to-window", { targetWindow, channel, data });
  },

  // 广播给所有窗口
  broadcast: (channel, data) => {
    ipcRenderer.send("broadcast", { channel, data });
  },

  // 监听消息
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data));
  },

  // 请求其他窗口的数据
  requestFrom: (targetWindow, channel, data) => {
    return ipcRenderer.invoke("request-from-window", {
      targetWindow,
      channel,
      data,
    });
  },
});
```

### 使用示例

```javascript
// 窗口 A - 发送数据
window.windowComm.sendTo("settings", "theme-changed", { theme: "dark" });

// 窗口 B - 接收数据
window.windowComm.on("theme-changed", (data) => {
  applyTheme(data.theme);
});

// 广播给所有窗口
window.windowComm.broadcast("user-logged-in", { userId: 123 });
```

---

## 问题 2：使用共享存储

### localStorage（同源窗口）

```javascript
// 窗口 A - 写入数据
localStorage.setItem("sharedData", JSON.stringify({ count: 42 }));

// 触发 storage 事件通知其他窗口
window.dispatchEvent(
  new StorageEvent("storage", {
    key: "sharedData",
    newValue: JSON.stringify({ count: 42 }),
  })
);

// 窗口 B - 监听变化
window.addEventListener("storage", (event) => {
  if (event.key === "sharedData") {
    const data = JSON.parse(event.newValue);
    console.log("数据更新:", data);
  }
});
```

### electron-store（主进程共享）

```javascript
// main.js
const Store = require("electron-store");
const store = new Store();

// 设置数据
ipcMain.handle("store:set", (event, key, value) => {
  store.set(key, value);
  // 通知所有窗口
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("store:changed", { key, value });
  });
});

// 获取数据
ipcMain.handle("store:get", (event, key) => {
  return store.get(key);
});

// preload.js
contextBridge.exposeInMainWorld("store", {
  get: (key) => ipcRenderer.invoke("store:get", key),
  set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  onChange: (callback) => {
    ipcRenderer.on("store:changed", (e, data) => callback(data));
  },
});
```

---

## 问题 3：使用 MessagePort 直连

MessagePort 允许两个渲染进程直接通信，无需主进程中转：

### 主进程建立连接

```javascript
// main.js
const { MessageChannelMain } = require("electron");

ipcMain.on("request-channel", (event, targetWindowId) => {
  const targetWindow = BrowserWindow.fromId(targetWindowId);
  if (!targetWindow) return;

  // 创建消息通道
  const { port1, port2 } = new MessageChannelMain();

  // 将端口发送给两个窗口
  event.sender.postMessage("port", null, [port1]);
  targetWindow.webContents.postMessage("port", null, [port2]);
});
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

let messagePort = null;

// 接收 MessagePort
ipcRenderer.on("port", (event) => {
  messagePort = event.ports[0];

  messagePort.onmessage = (e) => {
    // 处理收到的消息
    window.dispatchEvent(new CustomEvent("peer-message", { detail: e.data }));
  };

  messagePort.start();
});

contextBridge.exposeInMainWorld("directComm", {
  // 请求与另一个窗口建立直连
  connect: (targetWindowId) => {
    ipcRenderer.send("request-channel", targetWindowId);
  },

  // 发送消息
  send: (data) => {
    if (messagePort) {
      messagePort.postMessage(data);
    }
  },

  // 监听消息
  onMessage: (callback) => {
    window.addEventListener("peer-message", (e) => callback(e.detail));
  },
});
```

### 使用示例

```javascript
// 窗口 A - 建立连接
window.directComm.connect(windowBId);

// 窗口 A - 发送消息
window.directComm.send({ type: "update", data: { x: 100, y: 200 } });

// 窗口 B - 接收消息
window.directComm.onMessage((data) => {
  console.log("收到直连消息:", data);
});
```

---

## 问题 4：使用共享状态管理

### 主进程状态管理

```javascript
// main.js - 简单的状态管理
class SharedState {
  constructor() {
    this.state = {};
    this.subscribers = new Set();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(webContents) {
    this.subscribers.add(webContents);
    webContents.on("destroyed", () => {
      this.subscribers.delete(webContents);
    });
  }

  notify() {
    this.subscribers.forEach((wc) => {
      if (!wc.isDestroyed()) {
        wc.send("state-changed", this.state);
      }
    });
  }
}

const sharedState = new SharedState();

ipcMain.handle("state:get", () => sharedState.getState());
ipcMain.on("state:set", (event, newState) => sharedState.setState(newState));
ipcMain.on("state:subscribe", (event) => sharedState.subscribe(event.sender));
```

---

## 问题 5：选择哪种方案？

| 方案        | 优点       | 缺点           | 适用场景       |
| ----------- | ---------- | -------------- | -------------- |
| IPC 中转    | 简单可靠   | 需要主进程参与 | 大多数场景     |
| 共享存储    | 数据持久化 | 需要序列化     | 配置、状态同步 |
| MessagePort | 直连高效   | 设置复杂       | 高频通信       |
| 状态管理    | 统一管理   | 需要额外实现   | 复杂应用       |

## 延伸阅读

- [MessagePort 文档](https://www.electronjs.org/docs/latest/tutorial/message-ports)
- [进程间通信](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [electron-store](https://github.com/sindresorhus/electron-store)
