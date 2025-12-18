---
title: 如何创建无边框窗口？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 无边框窗口的创建方法，包括自定义标题栏、窗口拖拽和控制按钮的实现。
tags:
  - Electron
  - 无边框窗口
  - 自定义标题栏
  - UI定制
estimatedTime: 12 分钟
keywords:
  - frameless window
  - 无边框
  - 自定义标题栏
highlight: 通过 frame false 创建无边框窗口，然后用 CSS 和 IPC 实现自定义标题栏
order: 127
---

## 问题 1：如何创建基本的无边框窗口？

### 设置 frame: false

```javascript
const { BrowserWindow } = require("electron");

const win = new BrowserWindow({
  width: 800,
  height: 600,
  frame: false, // 关键配置：无边框
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### 无边框窗口的特点

- 没有系统标题栏
- 没有窗口控制按钮（最小化、最大化、关闭）
- 默认无法拖动
- 需要自己实现这些功能

---

## 问题 2：如何实现窗口拖拽？

### 方法 1：CSS -webkit-app-region

```css
/* 整个标题栏区域可拖拽 */
.titlebar {
  -webkit-app-region: drag;
  height: 32px;
  background: #333;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

/* 按钮区域不可拖拽（否则无法点击） */
.titlebar-buttons {
  -webkit-app-region: no-drag;
}

/* 输入框等交互元素也需要设置 no-drag */
.titlebar input,
.titlebar button {
  -webkit-app-region: no-drag;
}
```

### 方法 2：透明标题栏（macOS）

```javascript
const win = new BrowserWindow({
  titleBarStyle: "hidden", // 隐藏标题栏但保留交通灯
  trafficLightPosition: { x: 10, y: 10 }, // 调整交通灯位置
  // ...
});
```

```css
/* 为交通灯留出空间 */
.titlebar {
  padding-left: 80px; /* macOS 交通灯宽度 */
  -webkit-app-region: drag;
}
```

---

## 问题 3：如何实现自定义窗口控制按钮？

### HTML 结构

```html
<div class="titlebar">
  <div class="titlebar-drag-area">
    <span class="title">My App</span>
  </div>
  <div class="titlebar-buttons">
    <button id="minimize-btn" class="titlebar-btn">
      <svg><!-- 最小化图标 --></svg>
    </button>
    <button id="maximize-btn" class="titlebar-btn">
      <svg><!-- 最大化图标 --></svg>
    </button>
    <button id="close-btn" class="titlebar-btn close">
      <svg><!-- 关闭图标 --></svg>
    </button>
  </div>
</div>
```

### CSS 样式

```css
.titlebar {
  height: 32px;
  background: #2d2d2d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.titlebar-drag-area {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 12px;
  -webkit-app-region: drag;
}

.title {
  color: #fff;
  font-size: 13px;
}

.titlebar-buttons {
  display: flex;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.titlebar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.titlebar-btn.close:hover {
  background: #e81123;
}
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),

  // 监听最大化状态变化
  onMaximizeChange: (callback) => {
    ipcRenderer.on("maximize-change", (event, isMaximized) => {
      callback(isMaximized);
    });
  },
});
```

### main.js

```javascript
const { ipcMain, BrowserWindow } = require("electron");

ipcMain.on("window-minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.minimize();
});

ipcMain.on("window-maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on("window-close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.close();
});

// 通知渲染进程最大化状态变化
win.on("maximize", () => {
  win.webContents.send("maximize-change", true);
});

win.on("unmaximize", () => {
  win.webContents.send("maximize-change", false);
});
```

### renderer.js

```javascript
// 绑定按钮事件
document.getElementById("minimize-btn").addEventListener("click", () => {
  window.electronAPI.minimize();
});

document.getElementById("maximize-btn").addEventListener("click", () => {
  window.electronAPI.maximize();
});

document.getElementById("close-btn").addEventListener("click", () => {
  window.electronAPI.close();
});

// 更新最大化按钮图标
window.electronAPI.onMaximizeChange((isMaximized) => {
  const btn = document.getElementById("maximize-btn");
  btn.innerHTML = isMaximized ? "❐" : "□"; // 或使用不同的 SVG 图标
});
```

---

## 问题 4：如何处理不同平台的差异？

### 平台检测

```javascript
// preload.js
contextBridge.exposeInMainWorld("platform", {
  isMac: process.platform === "darwin",
  isWindows: process.platform === "win32",
  isLinux: process.platform === "linux",
});
```

### 条件渲染标题栏

```javascript
// renderer.js
if (window.platform.isMac) {
  // macOS: 使用系统交通灯，只需要拖拽区域
  document.querySelector(".titlebar-buttons").style.display = "none";
  document.querySelector(".titlebar").style.paddingLeft = "80px";
} else {
  // Windows/Linux: 显示自定义按钮
  document.querySelector(".titlebar-buttons").style.display = "flex";
}
```

### macOS 特殊处理

```javascript
// main.js
const win = new BrowserWindow({
  frame: false,
  titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  trafficLightPosition: { x: 10, y: 10 },
  // ...
});
```

---

## 问题 5：完整的无边框窗口示例

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    backgroundColor: "#1e1e1e",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 窗口控制 IPC
  ipcMain.on("window-minimize", () => win.minimize());
  ipcMain.on("window-maximize", () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("window-close", () => win.close());

  // 状态同步
  win.on("maximize", () => {
    win.webContents.send("maximize-change", true);
  });
  win.on("unmaximize", () => {
    win.webContents.send("maximize-change", false);
  });

  win.once("ready-to-show", () => win.show());
  win.loadFile("index.html");

  return win;
}

app.whenReady().then(createWindow);
```

## 延伸阅读

- [无边框窗口文档](https://www.electronjs.org/docs/latest/tutorial/window-customization#create-frameless-windows)
- [自定义标题栏](https://www.electronjs.org/docs/latest/tutorial/window-customization)
- [-webkit-app-region CSS 属性](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-app-region)
