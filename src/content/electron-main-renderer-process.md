---
title: 主进程（Main Process）和渲染进程（Renderer Process）的区别是什么？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  深入理解 Electron 的双进程模型，掌握主进程和渲染进程各自的职责、能力边界以及它们之间的通信方式。
tags:
  - Electron
  - 主进程
  - 渲染进程
  - 进程模型
estimatedTime: 12 分钟
keywords:
  - Main Process
  - Renderer Process
  - 进程通信
highlight: 主进程管理应用生命周期和原生功能，渲染进程负责展示 UI
order: 2
---

## 问题 1：主进程和渲染进程分别是什么？

### 主进程（Main Process）

主进程是 Electron 应用的入口点，通常是 `main.js` 文件。它运行在 Node.js 环境中，拥有完整的系统访问权限。

```javascript
// main.js - 主进程入口
const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  // 主进程创建窗口
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadFile("index.html");
});
```

### 渲染进程（Renderer Process）

每个 BrowserWindow 都会创建一个独立的渲染进程，运行在 Chromium 环境中，负责渲染 Web 页面。

```html
<!-- index.html - 渲染进程加载的页面 -->
<!DOCTYPE html>
<html>
  <body>
    <h1>这是渲染进程的内容</h1>
    <script src="renderer.js"></script>
  </body>
</html>
```

---

## 问题 2：两者的核心区别是什么？

| 特性          | 主进程       | 渲染进程        |
| ------------- | ------------ | --------------- |
| 数量          | 只有一个     | 可以有多个      |
| 运行环境      | Node.js      | Chromium        |
| 访问 DOM      | ❌ 不能      | ✅ 可以         |
| 访问 Node API | ✅ 完整访问  | ⚠️ 需要配置     |
| 访问原生 API  | ✅ 可以      | ❌ 不能直接访问 |
| 崩溃影响      | 整个应用退出 | 只影响当前窗口  |

### 能力边界示意

```javascript
// ✅ 主进程可以做的事
const { app, BrowserWindow, Menu, Tray, dialog } = require("electron");
const fs = require("fs"); // 完整 Node.js API
const path = require("path");

// ❌ 主进程不能做的事
document.getElementById("btn"); // 没有 DOM

// ✅ 渲染进程可以做的事
document.getElementById("btn").addEventListener("click", () => {});
fetch("/api/data"); // Web API

// ❌ 渲染进程默认不能做的事（出于安全考虑）
require("fs"); // 默认禁用
new BrowserWindow(); // 无法访问
```

---

## 问题 3：为什么要分成两个进程？

### 1. 安全隔离

渲染进程运行的是 Web 内容，可能加载不受信任的远程资源。将其与主进程隔离可以防止恶意代码访问系统资源。

### 2. 稳定性

一个渲染进程崩溃不会影响其他窗口和主进程：

```javascript
// 主进程可以监听渲染进程崩溃
win.webContents.on("crashed", () => {
  // 可以选择重新加载或提示用户
  win.reload();
});
```

### 3. 职责分离

- 主进程专注于应用级别的逻辑
- 渲染进程专注于 UI 展示

这种分离让代码结构更清晰，也更容易维护。

---

## 问题 4：两个进程如何通信？

主进程和渲染进程之间通过 IPC（进程间通信）进行交互：

```javascript
// 主进程 - main.js
const { ipcMain } = require("electron");

ipcMain.handle("read-file", async (event, filePath) => {
  const fs = require("fs").promises;
  return await fs.readFile(filePath, "utf-8");
});

// 预加载脚本 - preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
});

// 渲染进程 - renderer.js
const content = await window.electronAPI.readFile("/path/to/file");
```

这种模式确保了渲染进程不能直接访问 Node.js API，而是通过受控的接口与主进程通信。

## 延伸阅读

- [Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [进程间通信](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
