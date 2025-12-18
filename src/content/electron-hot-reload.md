---
title: 开发环境如何热更新？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 开发环境中实现热更新的方法，包括渲染进程和主进程的热更新。
tags:
  - Electron
  - 热更新
  - 开发环境
  - HMR
estimatedTime: 10 分钟
keywords:
  - 热更新
  - HMR
  - 开发效率
highlight: 渲染进程使用 Vite/Webpack HMR，主进程使用 electron-reload 或手动重启
order: 267
---

## 问题 1：渲染进程热更新

### 使用 Vite

```javascript
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

```javascript
// main.js
if (process.env.NODE_ENV === "development") {
  win.loadURL("http://localhost:5173");
  win.webContents.openDevTools();
} else {
  win.loadFile("dist/index.html");
}
```

### 使用 Webpack

```javascript
// webpack.config.js
module.exports = {
  devServer: {
    hot: true,
    port: 3000,
  },
};
```

---

## 问题 2：主进程热更新

### 使用 electron-reload

```bash
npm install electron-reload -D
```

```javascript
// main.js
if (process.env.NODE_ENV === "development") {
  require("electron-reload")(__dirname, {
    electron: require("electron"),
    hardResetMethod: "exit",
  });
}
```

### 使用 nodemon

```json
// package.json
{
  "scripts": {
    "dev:main": "nodemon --watch src/main --exec electron ."
  }
}
```

```javascript
// nodemon.json
{
  "watch": ["src/main"],
  "ext": "js,ts,json",
  "exec": "electron ."
}
```

---

## 问题 3：使用 electron-vite

```bash
npm create electron-vite@latest
```

```javascript
// electron.vite.config.js
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    // 主进程配置
  },
  preload: {
    // preload 配置
  },
  renderer: {
    // 渲染进程配置
  },
});
```

```json
// package.json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build"
  }
}
```

---

## 问题 4：手动实现热更新

```javascript
// main.js
const { app, BrowserWindow } = require("electron");
const chokidar = require("chokidar");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    /* ... */
  });
  mainWindow.loadURL("http://localhost:5173");
}

if (process.env.NODE_ENV === "development") {
  // 监听主进程文件变化
  const watcher = chokidar.watch("./src/main", {
    ignored: /node_modules/,
  });

  watcher.on("change", () => {
    console.log("主进程文件变化，重启应用...");
    app.relaunch();
    app.exit(0);
  });
}

app.whenReady().then(createWindow);
```

---

## 问题 5：完整开发脚本

```json
// package.json
{
  "scripts": {
    "dev": "concurrently -k \"npm:dev:*\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .",
    "build": "vite build && electron-builder"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "wait-on": "^7.0.0",
    "cross-env": "^7.0.0"
  }
}
```

### 开发流程

```
1. npm run dev
2. Vite 启动开发服务器 (localhost:5173)
3. wait-on 等待服务器就绪
4. Electron 启动并加载 Vite 服务器
5. 修改渲染进程代码 → HMR 自动更新
6. 修改主进程代码 → 手动重启或使用 electron-reload
```

## 延伸阅读

- [electron-vite](https://electron-vite.org/)
- [Vite HMR](https://vitejs.dev/guide/features.html#hot-module-replacement)
- [electron-reload](https://github.com/yan-foto/electron-reload)
