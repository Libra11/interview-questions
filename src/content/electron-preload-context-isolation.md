---
title: 如何正确使用 preload + contextIsolation？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  详细介绍 preload 脚本和 contextIsolation 的正确使用方式，构建安全的 Electron 应用架构。
tags:
  - Electron
  - 安全
  - preload
  - contextIsolation
estimatedTime: 15 分钟
keywords:
  - preload脚本
  - 上下文隔离
  - contextBridge
highlight: preload + contextIsolation 是 Electron 安全架构的核心，正确使用可以有效防止安全漏洞
order: 40
---

## 问题 1：正确的架构是什么样的？

### 安全架构概览

```
主进程 (main.js)
    │
    │ IPC 通信
    ▼
预加载脚本 (preload.js)
    │
    │ contextBridge
    ▼
渲染进程 (renderer.js)
```

### 基本配置

```javascript
// main.js
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 禁用 Node.js 集成
    contextIsolation: true, // 启用上下文隔离
    sandbox: true, // 启用沙箱
    preload: path.join(__dirname, "preload.js"),
  },
});
```

---

## 问题 2：preload 脚本应该怎么写？

### 基本结构

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// 只暴露必要的、安全的 API
contextBridge.exposeInMainWorld("electronAPI", {
  // 文件操作
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  saveFile: (content) => ipcRenderer.invoke("dialog:saveFile", content),

  // 应用信息
  getVersion: () => ipcRenderer.invoke("app:getVersion"),

  // 事件监听
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (event, info) => callback(info));
  },
});
```

### 安全原则

```javascript
// ❌ 不要暴露通用能力
contextBridge.exposeInMainWorld("api", {
  invoke: ipcRenderer.invoke, // 危险：可调用任意通道
  send: ipcRenderer.send, // 危险
  on: ipcRenderer.on, // 危险
});

// ✅ 只暴露具体功能
contextBridge.exposeInMainWorld("api", {
  loadDocument: (id) => ipcRenderer.invoke("document:load", id),
  saveDocument: (doc) => ipcRenderer.invoke("document:save", doc),
});
```

---

## 问题 3：主进程如何处理 IPC？

### IPC 处理器

```javascript
// main.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs").promises;

// 打开文件
ipcMain.handle("dialog:openFile", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "文本", extensions: ["txt", "md"] }],
  });

  if (result.canceled) return null;

  const content = await fs.readFile(result.filePaths[0], "utf-8");
  return { path: result.filePaths[0], content };
});

// 保存文件
ipcMain.handle("dialog:saveFile", async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: "文本", extensions: ["txt"] }],
  });

  if (result.canceled) return null;

  await fs.writeFile(result.filePath, content);
  return result.filePath;
});

// 获取版本
ipcMain.handle("app:getVersion", () => app.getVersion());
```

---

## 问题 4：渲染进程如何使用暴露的 API？

```javascript
// renderer.js

// 打开文件
document.getElementById("open-btn").addEventListener("click", async () => {
  const file = await window.electronAPI.openFile();
  if (file) {
    document.getElementById("editor").value = file.content;
  }
});

// 保存文件
document.getElementById("save-btn").addEventListener("click", async () => {
  const content = document.getElementById("editor").value;
  const path = await window.electronAPI.saveFile(content);
  if (path) {
    console.log("已保存到:", path);
  }
});

// 监听更新
window.electronAPI.onUpdateAvailable((info) => {
  alert(`新版本 ${info.version} 可用`);
});
```

---

## 问题 5：完整的安全实践示例

### preload.js - 带验证的 API

```javascript
const { contextBridge, ipcRenderer } = require("electron");

// 允许的 IPC 通道白名单
const validInvokeChannels = ["file:open", "file:save", "app:info"];
const validSendChannels = ["log", "analytics"];
const validReceiveChannels = ["update", "notification"];

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  send: (channel, ...args) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },

  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      const handler = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    }
  },
});
```

### main.js - 验证请求来源

```javascript
ipcMain.handle("file:open", async (event) => {
  // 验证请求来源
  const url = event.sender.getURL();
  if (!url.startsWith("file://") && !url.startsWith("app://")) {
    throw new Error("Unauthorized");
  }

  // 执行操作
  const result = await dialog.showOpenDialog({
    /* ... */
  });
  return result;
});
```

### 类型安全（TypeScript）

```typescript
// preload.ts
export interface ElectronAPI {
  openFile: () => Promise<{ path: string; content: string } | null>;
  saveFile: (content: string) => Promise<string | null>;
  onUpdate: (callback: (info: UpdateInfo) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// renderer.ts
const file = await window.electronAPI.openFile();
// TypeScript 知道 file 的类型
```

## 延伸阅读

- [Context Isolation 文档](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
