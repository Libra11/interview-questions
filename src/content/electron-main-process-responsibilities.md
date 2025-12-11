---
title: 主进程的职责有哪些？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  详细介绍 Electron 主进程的核心职责，包括应用生命周期管理、窗口管理、系统 API 调用等关键功能。
tags:
  - Electron
  - 主进程
  - 应用生命周期
  - 窗口管理
estimatedTime: 10 分钟
keywords:
  - Main Process
  - 应用管理
  - BrowserWindow
highlight: 主进程是 Electron 应用的大脑，负责管理整个应用的生命周期和所有窗口
order: 6
---

## 问题 1：主进程负责哪些核心工作？

主进程是 Electron 应用的控制中心，主要职责包括：

### 1. 应用生命周期管理

```javascript
const { app } = require("electron");

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();
});

// 所有窗口关闭时
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 应用激活时（macOS 特有）
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用即将退出
app.on("before-quit", () => {
  // 清理工作
});
```

### 2. 窗口创建和管理

```javascript
const { BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");

  // 管理窗口状态
  win.on("close", () => {
    /* 保存窗口位置 */
  });
  win.on("focus", () => {
    /* 窗口获得焦点 */
  });
}
```

### 3. 系统级 API 调用

```javascript
const { dialog, shell, clipboard, nativeTheme } = require("electron");

// 系统对话框
dialog.showOpenDialog({ properties: ["openFile"] });

// 打开外部链接
shell.openExternal("https://example.com");

// 剪贴板操作
clipboard.writeText("Hello");

// 系统主题
console.log(nativeTheme.shouldUseDarkColors);
```

---

## 问题 2：主进程如何管理原生功能？

### 菜单管理

```javascript
const { Menu } = require("electron");

const template = [
  {
    label: "文件",
    submenu: [
      { label: "新建", accelerator: "CmdOrCtrl+N", click: () => {} },
      { label: "打开", accelerator: "CmdOrCtrl+O", click: () => {} },
      { type: "separator" },
      { label: "退出", role: "quit" },
    ],
  },
  {
    label: "编辑",
    submenu: [
      { label: "撤销", role: "undo" },
      { label: "重做", role: "redo" },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

### 系统托盘

```javascript
const { Tray, Menu } = require("electron");

let tray = null;
app.whenReady().then(() => {
  tray = new Tray("/path/to/icon.png");

  const contextMenu = Menu.buildFromTemplate([
    { label: "显示窗口", click: () => win.show() },
    { label: "退出", click: () => app.quit() },
  ]);

  tray.setToolTip("我的应用");
  tray.setContextMenu(contextMenu);
});
```

### 全局快捷键

```javascript
const { globalShortcut } = require("electron");

app.whenReady().then(() => {
  // 注册全局快捷键
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    console.log("全局快捷键被触发");
  });
});

app.on("will-quit", () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});
```

---

## 问题 3：主进程如何处理 IPC 通信？

主进程是 IPC 通信的中心枢纽：

```javascript
const { ipcMain } = require("electron");

// 处理异步请求
ipcMain.handle("get-user-data", async (event, userId) => {
  const data = await fetchUserData(userId);
  return data;
});

// 处理单向消息
ipcMain.on("log-message", (event, message) => {
  console.log("来自渲染进程:", message);
});

// 向渲染进程发送消息
function notifyRenderer(win, channel, data) {
  win.webContents.send(channel, data);
}
```

### 窗口间通信

```javascript
// 主进程作为中转站
ipcMain.on("message-to-other-window", (event, { targetId, data }) => {
  const targetWindow = BrowserWindow.fromId(targetId);
  if (targetWindow) {
    targetWindow.webContents.send("message-from-other-window", data);
  }
});
```

---

## 问题 4：主进程还能做什么？

### 自动更新

```javascript
const { autoUpdater } = require("electron-updater");

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on("update-available", () => {
  // 通知用户有更新
});

autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall();
});
```

### 崩溃报告

```javascript
const { crashReporter } = require("electron");

crashReporter.start({
  productName: "MyApp",
  submitURL: "https://my-server.com/crash-report",
});
```

### 电源监控

```javascript
const { powerMonitor } = require("electron");

powerMonitor.on("suspend", () => {
  console.log("系统即将休眠");
});

powerMonitor.on("resume", () => {
  console.log("系统从休眠中恢复");
});
```

## 延伸阅读

- [Electron app 模块](https://www.electronjs.org/docs/latest/api/app)
- [BrowserWindow 文档](https://www.electronjs.org/docs/latest/api/browser-window)
- [主进程模块列表](https://www.electronjs.org/docs/latest/api/app)
