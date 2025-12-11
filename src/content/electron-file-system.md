---
title: 如何使用 Electron 访问文件系统？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中访问文件系统的方法，包括使用 Node.js fs 模块和 Electron dialog API。
tags:
  - Electron
  - 文件系统
  - Node.js
  - fs模块
estimatedTime: 12 分钟
keywords:
  - 文件系统
  - fs模块
  - 文件读写
highlight: 在主进程中使用 Node.js fs 模块，通过 IPC 向渲染进程提供文件操作能力
order: 33
---

## 问题 1：主进程如何访问文件系统？

### 使用 Node.js fs 模块

```javascript
// main.js
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

// 同步读取
const content = fs.readFileSync("/path/to/file.txt", "utf-8");

// 异步读取（推荐）
const data = await fsPromises.readFile("/path/to/file.txt", "utf-8");

// 写入文件
await fsPromises.writeFile("/path/to/file.txt", "Hello World");

// 追加内容
await fsPromises.appendFile("/path/to/log.txt", "New log entry\n");

// 检查文件是否存在
const exists = fs.existsSync("/path/to/file.txt");

// 获取文件信息
const stats = await fsPromises.stat("/path/to/file.txt");
console.log(stats.size, stats.mtime);

// 创建目录
await fsPromises.mkdir("/path/to/dir", { recursive: true });

// 读取目录
const files = await fsPromises.readdir("/path/to/dir");

// 删除文件
await fsPromises.unlink("/path/to/file.txt");

// 删除目录
await fsPromises.rmdir("/path/to/dir", { recursive: true });
```

### 使用 Electron 的 app 路径

```javascript
const { app } = require("electron");

// 获取常用路径
const userDataPath = app.getPath("userData"); // 用户数据目录
const documentsPath = app.getPath("documents"); // 文档目录
const downloadsPath = app.getPath("downloads"); // 下载目录
const tempPath = app.getPath("temp"); // 临时目录
const homePath = app.getPath("home"); // 用户主目录
const desktopPath = app.getPath("desktop"); // 桌面

// 应用相关路径
const appPath = app.getAppPath(); // 应用目录
const exePath = app.getPath("exe"); // 可执行文件路径

// 在用户数据目录中存储配置
const configPath = path.join(userDataPath, "config.json");
await fsPromises.writeFile(configPath, JSON.stringify(config));
```

---

## 问题 2：如何使用对话框选择文件？

### 打开文件对话框

```javascript
const { dialog } = require("electron");

// 选择文件
const result = await dialog.showOpenDialog({
  title: "选择文件",
  defaultPath: app.getPath("documents"),
  buttonLabel: "选择",
  filters: [
    { name: "文本文件", extensions: ["txt", "md"] },
    { name: "图片", extensions: ["jpg", "png", "gif"] },
    { name: "所有文件", extensions: ["*"] },
  ],
  properties: [
    "openFile", // 允许选择文件
    "multiSelections", // 允许多选
  ],
});

if (!result.canceled) {
  console.log(result.filePaths); // 选中的文件路径数组
}
```

### 保存文件对话框

```javascript
const result = await dialog.showSaveDialog({
  title: "保存文件",
  defaultPath: path.join(app.getPath("documents"), "untitled.txt"),
  buttonLabel: "保存",
  filters: [{ name: "文本文件", extensions: ["txt"] }],
});

if (!result.canceled) {
  await fsPromises.writeFile(result.filePath, content);
}
```

### 选择文件夹

```javascript
const result = await dialog.showOpenDialog({
  title: "选择文件夹",
  properties: ["openDirectory"],
});

if (!result.canceled) {
  const folderPath = result.filePaths[0];
  const files = await fsPromises.readdir(folderPath);
}
```

---

## 问题 3：如何通过 IPC 提供文件操作？

### 主进程处理器

```javascript
// main.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs").promises;
const path = require("path");

// 读取文件
ipcMain.handle("fs:readFile", async (event, filePath) => {
  // 安全检查：确保路径在允许的范围内
  const safePath = validatePath(filePath);
  return await fs.readFile(safePath, "utf-8");
});

// 写入文件
ipcMain.handle("fs:writeFile", async (event, filePath, content) => {
  const safePath = validatePath(filePath);
  await fs.writeFile(safePath, content);
  return true;
});

// 打开文件对话框
ipcMain.handle("dialog:openFile", async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  if (result.canceled) return null;

  // 读取选中的文件内容
  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, "utf-8");

  return { path: filePath, content };
});

// 保存文件对话框
ipcMain.handle("dialog:saveFile", async (event, content, options) => {
  const result = await dialog.showSaveDialog(options);
  if (result.canceled) return null;

  await fs.writeFile(result.filePath, content);
  return result.filePath;
});

// 路径验证函数
function validatePath(filePath) {
  const userDataPath = app.getPath("userData");
  const resolved = path.resolve(filePath);

  // 只允许访问用户数据目录
  if (!resolved.startsWith(userDataPath)) {
    throw new Error("Access denied");
  }

  return resolved;
}
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fileSystem", {
  readFile: (path) => ipcRenderer.invoke("fs:readFile", path),
  writeFile: (path, content) =>
    ipcRenderer.invoke("fs:writeFile", path, content),

  openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
  saveFile: (content, options) =>
    ipcRenderer.invoke("dialog:saveFile", content, options),
});
```

### 渲染进程使用

```javascript
// renderer.js

// 打开文件
async function openDocument() {
  const result = await window.fileSystem.openFile({
    filters: [{ name: "文档", extensions: ["txt", "md"] }],
  });

  if (result) {
    document.getElementById("editor").value = result.content;
    currentFilePath = result.path;
  }
}

// 保存文件
async function saveDocument() {
  const content = document.getElementById("editor").value;

  const savedPath = await window.fileSystem.saveFile(content, {
    defaultPath: currentFilePath || "untitled.txt",
    filters: [{ name: "文本文件", extensions: ["txt"] }],
  });

  if (savedPath) {
    currentFilePath = savedPath;
    showMessage("文件已保存");
  }
}
```

---

## 问题 4：如何处理大文件？

### 使用流式读写

```javascript
const fs = require("fs");

// 流式读取大文件
function readLargeFile(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = fs.createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: 64 * 1024, // 64KB 块
    });

    stream.on("data", (chunk) => {
      chunks.push(chunk);
      // 可以发送进度到渲染进程
    });

    stream.on("end", () => {
      resolve(chunks.join(""));
    });

    stream.on("error", reject);
  });
}

// 流式写入大文件
function writeLargeFile(filePath, content) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", resolve);
    stream.on("error", reject);

    // 分块写入
    const chunkSize = 64 * 1024;
    for (let i = 0; i < content.length; i += chunkSize) {
      stream.write(content.slice(i, i + chunkSize));
    }

    stream.end();
  });
}
```

### 复制大文件

```javascript
const { pipeline } = require("stream/promises");

async function copyFile(src, dest) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);

  await pipeline(readStream, writeStream);
}
```

---

## 问题 5：文件操作的错误处理

```javascript
async function safeReadFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: "文件不存在" };
    }
    if (error.code === "EACCES") {
      return { success: false, error: "没有访问权限" };
    }
    if (error.code === "EISDIR") {
      return { success: false, error: "路径是目录而非文件" };
    }
    return { success: false, error: error.message };
  }
}

async function safeWriteFile(filePath, content) {
  try {
    // 确保目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 延伸阅读

- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Electron dialog API](https://www.electronjs.org/docs/latest/api/dialog)
- [app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
