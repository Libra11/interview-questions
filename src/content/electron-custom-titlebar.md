---
title: 如何实现自定义标题栏？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  详细介绍 Electron 自定义标题栏的完整实现方案，包括样式设计、拖拽功能和跨平台适配。
tags:
  - Electron
  - 自定义标题栏
  - UI定制
  - 跨平台
estimatedTime: 12 分钟
keywords:
  - custom titlebar
  - 标题栏
  - 窗口控制
highlight: 自定义标题栏需要处理拖拽、窗口控制按钮和跨平台差异
order: 21
---

## 问题 1：自定义标题栏的基本结构是什么？

### 主进程配置

```javascript
// main.js
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  frame: false, // 移除系统标题栏
  titleBarStyle: "hidden", // macOS: 隐藏但保留交通灯
  trafficLightPosition: { x: 10, y: 10 }, // macOS: 交通灯位置
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
  },
});
```

### HTML 结构

```html
<div class="titlebar">
  <!-- 拖拽区域 -->
  <div class="titlebar-drag">
    <img src="icon.png" class="app-icon" />
    <span class="app-title">My Application</span>
  </div>

  <!-- 窗口控制按钮（Windows/Linux） -->
  <div class="titlebar-controls">
    <button class="btn-minimize">─</button>
    <button class="btn-maximize">□</button>
    <button class="btn-close">×</button>
  </div>
</div>

<div class="content">
  <!-- 应用内容 -->
</div>
```

---

## 问题 2：如何实现拖拽和按钮交互？

### CSS 样式

```css
/* 标题栏容器 */
.titlebar {
  height: 32px;
  background: linear-gradient(to bottom, #3c3c3c, #2d2d2d);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* 拖拽区域 */
.titlebar-drag {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 8px;
  -webkit-app-region: drag; /* 关键：启用拖拽 */
  user-select: none;
}

/* macOS 为交通灯留空间 */
.platform-darwin .titlebar-drag {
  padding-left: 78px;
}

/* 控制按钮区域 */
.titlebar-controls {
  display: flex;
  -webkit-app-region: no-drag; /* 关键：禁用拖拽以允许点击 */
}

/* 按钮样式 */
.titlebar-controls button {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.titlebar-controls button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-close:hover {
  background: #e81123 !important;
}

/* 内容区域偏移 */
.content {
  margin-top: 32px;
  height: calc(100vh - 32px);
  overflow: auto;
}
```

---

## 问题 3：如何实现窗口控制功能？

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  // 获取平台信息
  platform: process.platform,

  // 监听窗口状态
  onMaximizeChange: (callback) => {
    ipcRenderer.on("window:maximized", () => callback(true));
    ipcRenderer.on("window:unmaximized", () => callback(false));
  },

  // 获取初始最大化状态
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
});
```

### main.js - IPC 处理

```javascript
const { ipcMain, BrowserWindow } = require("electron");

function setupWindowControls(win) {
  ipcMain.on("window:minimize", () => win.minimize());

  ipcMain.on("window:maximize", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on("window:close", () => win.close());

  ipcMain.handle("window:isMaximized", () => win.isMaximized());

  // 状态变化通知
  win.on("maximize", () => {
    win.webContents.send("window:maximized");
  });

  win.on("unmaximize", () => {
    win.webContents.send("window:unmaximized");
  });
}
```

### renderer.js

```javascript
// 平台适配
document.body.classList.add(`platform-${window.windowAPI.platform}`);

// macOS 隐藏自定义按钮
if (window.windowAPI.platform === "darwin") {
  document.querySelector(".titlebar-controls").style.display = "none";
}

// 绑定按钮事件
document.querySelector(".btn-minimize").onclick = () => {
  window.windowAPI.minimize();
};

document.querySelector(".btn-maximize").onclick = () => {
  window.windowAPI.maximize();
};

document.querySelector(".btn-close").onclick = () => {
  window.windowAPI.close();
};

// 更新最大化按钮图标
window.windowAPI.onMaximizeChange((isMaximized) => {
  const btn = document.querySelector(".btn-maximize");
  btn.textContent = isMaximized ? "❐" : "□";
});

// 初始化状态
window.windowAPI.isMaximized().then((isMaximized) => {
  const btn = document.querySelector(".btn-maximize");
  btn.textContent = isMaximized ? "❐" : "□";
});
```

---

## 问题 4：如何处理双击最大化？

```css
/* 双击标题栏最大化 */
.titlebar-drag {
  -webkit-app-region: drag;
}
```

系统会自动处理双击拖拽区域的最大化行为。如果需要自定义：

```javascript
// renderer.js
let lastClickTime = 0;

document.querySelector(".titlebar-drag").addEventListener("click", (e) => {
  const now = Date.now();
  if (now - lastClickTime < 300) {
    window.windowAPI.maximize();
  }
  lastClickTime = now;
});
```

---

## 问题 5：完整的跨平台标题栏组件

```javascript
// TitleBar.js (React 示例)
import { useEffect, useState } from "react";
import "./TitleBar.css";

export function TitleBar({ title }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = window.windowAPI.platform === "darwin";

  useEffect(() => {
    window.windowAPI.isMaximized().then(setIsMaximized);
    window.windowAPI.onMaximizeChange(setIsMaximized);
  }, []);

  return (
    <div className="titlebar">
      <div className="titlebar-drag" style={{ paddingLeft: isMac ? 78 : 8 }}>
        {!isMac && <img src="/icon.png" className="app-icon" alt="" />}
        <span className="app-title">{title}</span>
      </div>

      {!isMac && (
        <div className="titlebar-controls">
          <button onClick={() => window.windowAPI.minimize()}>
            <MinimizeIcon />
          </button>
          <button onClick={() => window.windowAPI.maximize()}>
            {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
          </button>
          <button
            className="btn-close"
            onClick={() => window.windowAPI.close()}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
```

## 延伸阅读

- [无边框窗口文档](https://www.electronjs.org/docs/latest/tutorial/window-customization)
- [自定义标题栏库 custom-electron-titlebar](https://github.com/AlexxNB/custom-electron-titlebar)
- [Electron Titlebar 设计指南](https://www.electronjs.org/docs/latest/tutorial/window-customization#create-frameless-windows)
