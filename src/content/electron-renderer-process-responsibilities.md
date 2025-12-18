---
title: 渲染进程负责哪些工作？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 渲染进程的职责范围，包括 UI 渲染、用户交互处理以及与主进程的通信方式。
tags:
  - Electron
  - 渲染进程
  - UI渲染
  - Web技术
estimatedTime: 8 分钟
keywords:
  - Renderer Process
  - DOM操作
  - 用户界面
highlight: 渲染进程专注于 UI 展示和用户交互，运行在 Chromium 环境中
order: 40
---

## 问题 1：渲染进程的核心职责是什么？

渲染进程运行在 Chromium 环境中，主要负责：

### 1. 页面渲染

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="app">
      <header>应用标题</header>
      <main>主要内容区域</main>
      <footer>底部信息</footer>
    </div>
    <script src="renderer.js"></script>
  </body>
</html>
```

### 2. DOM 操作

```javascript
// renderer.js
document.getElementById("btn").addEventListener("click", () => {
  const content = document.createElement("div");
  content.textContent = "新内容";
  document.body.appendChild(content);
});

// 动态更新 UI
function updateUI(data) {
  document.querySelector(".user-name").textContent = data.name;
  document.querySelector(".user-avatar").src = data.avatar;
}
```

### 3. 用户交互处理

```javascript
// 表单处理
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  // 处理表单数据
});

// 键盘事件
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveDocument();
  }
});

// 拖拽操作
dropZone.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  handleFiles(files);
});
```

---

## 问题 2：渲染进程可以使用哪些 API？

### Web 标准 API

```javascript
// Fetch API
const response = await fetch("https://api.example.com/data");
const data = await response.json();

// Web Storage
localStorage.setItem("theme", "dark");
sessionStorage.setItem("token", "xxx");

// IndexedDB
const db = await indexedDB.open("myDB", 1);

// Web Workers
const worker = new Worker("worker.js");
worker.postMessage({ task: "process" });

// Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillRect(0, 0, 100, 100);
```

### 通过 preload 暴露的 API

```javascript
// 调用主进程功能（通过 preload 暴露）
const result = await window.electronAPI.readFile("/path/to/file");
await window.electronAPI.saveFile("/path", content);
window.electronAPI.showNotification("操作成功");
```

---

## 问题 3：渲染进程如何与主进程通信？

渲染进程不能直接调用主进程 API，需要通过 IPC：

```javascript
// preload.js - 桥接层
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 双向通信（请求-响应）
  openFile: () => ipcRenderer.invoke("dialog:openFile"),

  // 单向发送
  sendMessage: (msg) => ipcRenderer.send("message", msg),

  // 监听主进程消息
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (event, info) => callback(info));
  },
});

// renderer.js - 使用暴露的 API
document.getElementById("open-btn").addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFile();
  console.log("选择的文件:", filePath);
});

// 监听主进程推送
window.electronAPI.onUpdateAvailable((info) => {
  showUpdateDialog(info);
});
```

---

## 问题 4：渲染进程有什么限制？

### 默认情况下不能做的事

```javascript
// ❌ 不能直接使用 Node.js API
const fs = require("fs"); // 报错

// ❌ 不能直接创建窗口
new BrowserWindow(); // 报错

// ❌ 不能直接访问系统对话框
dialog.showOpenDialog(); // 报错

// ❌ 不能直接操作菜单
Menu.setApplicationMenu(); // 报错
```

### 为什么有这些限制？

1. **安全性**：渲染进程可能加载不受信任的内容
2. **职责分离**：UI 逻辑和系统逻辑分开
3. **稳定性**：限制渲染进程的能力范围

### 正确的做法

```javascript
// ✅ 通过 IPC 请求主进程执行
// renderer.js
const content = await window.electronAPI.readFile(path);

// main.js
ipcMain.handle("read-file", async (event, path) => {
  return fs.promises.readFile(path, "utf-8");
});
```

## 延伸阅读

- [Electron 渲染进程](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process)
- [Web API 参考](https://developer.mozilla.org/zh-CN/docs/Web/API)
- [进程间通信](https://www.electronjs.org/docs/latest/tutorial/ipc)
