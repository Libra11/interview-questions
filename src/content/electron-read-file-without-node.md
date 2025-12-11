---
title: NodeIntegration = false 时如何读取本地文件？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在禁用 nodeIntegration 的安全配置下，如何通过 preload 脚本和 IPC 实现文件读取功能。
tags:
  - Electron
  - 文件读取
  - 安全
  - preload
estimatedTime: 10 分钟
keywords:
  - nodeIntegration
  - 文件读取
  - IPC
highlight: 通过 preload 脚本暴露受控的文件读取 API，在主进程中执行实际的文件操作
order: 35
---

## 问题 1：为什么 nodeIntegration = false 时不能直接读取文件？

### 默认安全配置

```javascript
// 现代 Electron 的默认配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 禁用 Node.js 集成
    contextIsolation: true, // 启用上下文隔离
    preload: path.join(__dirname, "preload.js"),
  },
});
```

### 渲染进程的限制

```javascript
// renderer.js
// ❌ 这些都不可用
const fs = require("fs"); // require is not defined
const path = require("path"); // require is not defined
import fs from "fs"; // 无法导入 Node 模块

// ✅ 只能使用 Web API
fetch("/api/data");
localStorage.setItem("key", "value");
```

---

## 问题 2：如何通过 preload + IPC 读取文件？

### 步骤 1：主进程设置 IPC 处理器

```javascript
// main.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs").promises;
const path = require("path");

// 通过对话框选择并读取文件
ipcMain.handle("file:openAndRead", async (event, options = {}) => {
  const result = await dialog.showOpenDialog({
    title: options.title || "选择文件",
    filters: options.filters || [{ name: "所有文件", extensions: ["*"] }],
    properties: ["openFile"],
  });

  if (result.canceled) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf-8");

  return {
    path: filePath,
    name: path.basename(filePath),
    content,
  };
});

// 读取应用数据目录中的文件
ipcMain.handle("file:readAppData", async (event, filename) => {
  // 验证文件名
  if (typeof filename !== "string" || filename.includes("..")) {
    throw new Error("Invalid filename");
  }

  const filePath = path.join(app.getPath("userData"), filename);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null; // 文件不存在
    }
    throw error;
  }
});

// 保存到应用数据目录
ipcMain.handle("file:saveAppData", async (event, filename, content) => {
  if (typeof filename !== "string" || filename.includes("..")) {
    throw new Error("Invalid filename");
  }

  const filePath = path.join(app.getPath("userData"), filename);
  await fs.writeFile(filePath, content);
  return true;
});
```

### 步骤 2：preload 脚本暴露 API

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fileAPI", {
  // 打开文件对话框并读取
  openAndRead: (options) => ipcRenderer.invoke("file:openAndRead", options),

  // 读取应用数据
  readAppData: (filename) => ipcRenderer.invoke("file:readAppData", filename),

  // 保存应用数据
  saveAppData: (filename, content) =>
    ipcRenderer.invoke("file:saveAppData", filename, content),
});
```

### 步骤 3：渲染进程使用

```javascript
// renderer.js

// 打开并读取文件
async function openFile() {
  const result = await window.fileAPI.openAndRead({
    title: "打开文档",
    filters: [{ name: "文本文件", extensions: ["txt", "md"] }],
  });

  if (result) {
    console.log("文件路径:", result.path);
    console.log("文件名:", result.name);
    console.log("内容:", result.content);

    document.getElementById("editor").value = result.content;
  }
}

// 读取配置文件
async function loadConfig() {
  const configJson = await window.fileAPI.readAppData("config.json");

  if (configJson) {
    return JSON.parse(configJson);
  }

  // 返回默认配置
  return { theme: "light", fontSize: 14 };
}

// 保存配置
async function saveConfig(config) {
  await window.fileAPI.saveAppData(
    "config.json",
    JSON.stringify(config, null, 2)
  );
}
```

---

## 问题 3：如何处理拖放文件？

### 获取拖放文件的路径

```javascript
// preload.js
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("fileAPI", {
  // 获取拖放文件的路径
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // 读取指定路径的文件（需要用户授权）
  readDroppedFile: (filePath) =>
    ipcRenderer.invoke("file:readDropped", filePath),
});

// main.js
const droppedFiles = new Set(); // 记录用户拖放的文件

ipcMain.handle("file:readDropped", async (event, filePath) => {
  // 只允许读取用户拖放的文件
  if (!droppedFiles.has(filePath)) {
    throw new Error("File not authorized");
  }

  return await fs.readFile(filePath, "utf-8");
});

// 当渲染进程报告拖放时，记录文件路径
ipcMain.on("file:dropped", (event, filePath) => {
  droppedFiles.add(filePath);
});
```

### 渲染进程处理拖放

```javascript
// renderer.js
const dropZone = document.getElementById("drop-zone");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");

  const file = e.dataTransfer.files[0];
  if (!file) return;

  // 获取文件路径
  const filePath = window.fileAPI.getPathForFile(file);

  // 通知主进程这是用户拖放的文件
  // 然后读取内容
  const content = await window.fileAPI.readDroppedFile(filePath);

  document.getElementById("editor").value = content;
});
```

---

## 问题 4：如何使用 File API 读取文件内容？

### 纯 Web API 方式（不需要 IPC）

```javascript
// renderer.js
// 使用 FileReader API 读取用户选择的文件

const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 方式 1：使用 FileReader
  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    document.getElementById("editor").value = content;
  };
  reader.readAsText(file);

  // 方式 2：使用 file.text()（更简洁）
  const content = await file.text();
  document.getElementById("editor").value = content;
});

// 拖放也可以使用 File API
dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();

  const file = e.dataTransfer.files[0];
  if (file) {
    const content = await file.text();
    document.getElementById("editor").value = content;
  }
});
```

### 局限性

```javascript
// Web File API 的局限：
// 1. 只能读取用户选择/拖放的文件
// 2. 无法获取文件的完整路径（安全限制）
// 3. 无法保存文件到原位置
// 4. 无法访问任意文件系统路径

// 如果需要这些能力，必须通过 IPC 调用主进程
```

---

## 问题 5：完整的文件操作封装

```javascript
// preload.js
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("fileSystem", {
  // 通过对话框操作
  dialog: {
    open: (options) => ipcRenderer.invoke("dialog:open", options),
    save: (content, options) =>
      ipcRenderer.invoke("dialog:save", content, options),
  },

  // 应用数据操作
  appData: {
    read: (filename) => ipcRenderer.invoke("appData:read", filename),
    write: (filename, content) =>
      ipcRenderer.invoke("appData:write", filename, content),
    delete: (filename) => ipcRenderer.invoke("appData:delete", filename),
    list: () => ipcRenderer.invoke("appData:list"),
  },

  // 拖放支持
  drop: {
    getPath: (file) => webUtils.getPathForFile(file),
    read: (filePath) => ipcRenderer.invoke("drop:read", filePath),
  },
});

// 使用示例
// renderer.js

// 打开文件
const file = await window.fileSystem.dialog.open({
  filters: [{ name: "文本", extensions: ["txt"] }],
});

// 保存文件
await window.fileSystem.dialog.save(content, {
  defaultPath: "document.txt",
});

// 读写应用数据
const config = await window.fileSystem.appData.read("config.json");
await window.fileSystem.appData.write("config.json", JSON.stringify(newConfig));

// 处理拖放
const filePath = window.fileSystem.drop.getPath(droppedFile);
const content = await window.fileSystem.drop.read(filePath);
```

## 延伸阅读

- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Web File API](https://developer.mozilla.org/zh-CN/docs/Web/API/File_API)
