---
title: 如何处理路径分隔符差异？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 跨平台开发中处理文件路径分隔符差异的方法。
tags:
  - Electron
  - 跨平台
  - 路径处理
  - Node.js
estimatedTime: 8 分钟
keywords:
  - 路径分隔符
  - path模块
  - 跨平台路径
highlight: 使用 Node.js path 模块处理路径，避免硬编码分隔符
order: 263
---

## 问题 1：路径分隔符差异

### 各平台差异

```
Windows: 反斜杠 \
  C:\Users\name\Documents\file.txt

macOS/Linux: 正斜杠 /
  /Users/name/Documents/file.txt
```

---

## 问题 2：使用 path 模块

### 基本用法

```javascript
const path = require("path");

// ✅ 正确：使用 path.join
const filePath = path.join(__dirname, "assets", "icon.png");
// Windows: C:\app\assets\icon.png
// macOS:   /app/assets/icon.png

// ❌ 错误：硬编码分隔符
const filePath = __dirname + "/assets/icon.png";
// Windows 上可能出问题
```

### 常用方法

```javascript
const path = require("path");

// 拼接路径
path.join("folder", "subfolder", "file.txt");

// 解析为绝对路径
path.resolve("folder", "file.txt");

// 获取目录名
path.dirname("/user/docs/file.txt"); // /user/docs

// 获取文件名
path.basename("/user/docs/file.txt"); // file.txt

// 获取扩展名
path.extname("file.txt"); // .txt

// 规范化路径
path.normalize("/user//docs/../file.txt"); // /user/file.txt
```

---

## 问题 3：路径转换

```javascript
const path = require("path");

// 获取当前平台分隔符
console.log(path.sep); // Windows: \ , macOS/Linux: /

// 转换为 POSIX 风格（正斜杠）
function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

// 转换为当前平台风格
function toNativePath(p) {
  return p.split("/").join(path.sep);
}

// 或使用 path.posix 和 path.win32
path.posix.join("a", "b", "c"); // a/b/c
path.win32.join("a", "b", "c"); // a\b\c
```

---

## 问题 4：特殊目录处理

```javascript
const { app } = require("electron");
const path = require("path");

// 使用 Electron 提供的路径
const userDataPath = app.getPath("userData");
const documentsPath = app.getPath("documents");
const tempPath = app.getPath("temp");

// 拼接用户数据路径
const configPath = path.join(userDataPath, "config.json");
const cachePath = path.join(userDataPath, "cache");

// 获取应用路径
const appPath = app.getAppPath();
const exePath = app.getPath("exe");
```

---

## 问题 5：URL 和文件路径转换

```javascript
const { pathToFileURL, fileURLToPath } = require("url");
const path = require("path");

// 文件路径转 URL
const filePath = path.join(__dirname, "index.html");
const fileUrl = pathToFileURL(filePath).href;
// file:///C:/app/index.html (Windows)
// file:///app/index.html (macOS)

// URL 转文件路径
const backToPath = fileURLToPath(fileUrl);

// 在 BrowserWindow 中使用
win.loadFile(path.join(__dirname, "index.html"));
// 或
win.loadURL(pathToFileURL(path.join(__dirname, "index.html")).href);
```

## 延伸阅读

- [Node.js path 模块](https://nodejs.org/api/path.html)
- [Electron app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
