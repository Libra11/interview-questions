---
title: 如何在 Electron 中创建多窗口应用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 多窗口应用的创建和管理方法，包括窗口间通信、状态同步和生命周期管理。
tags:
  - Electron
  - 多窗口
  - 窗口管理
  - BrowserWindow
estimatedTime: 12 分钟
keywords:
  - 多窗口
  - 窗口管理
  - 窗口通信
highlight: 通过 BrowserWindow 创建多个窗口，使用 IPC 或主进程作为中介实现窗口间通信
order: 140
---

## 问题 1：如何创建多个窗口？

### 基本创建方式

```javascript
// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");

// 窗口管理器
const windows = new Map();

function createWindow(name, options = {}) {
  const defaultOptions = {
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  const win = new BrowserWindow({ ...defaultOptions, ...options });

  // 存储窗口引用
  windows.set(name, win);

  // 窗口关闭时清理
  win.on("closed", () => {
    windows.delete(name);
  });

  return win;
}

app.whenReady().then(() => {
  // 创建主窗口
  const mainWindow = createWindow("main", { width: 1200, height: 800 });
  mainWindow.loadFile("index.html");

  // 创建设置窗口
  const settingsWindow = createWindow("settings", {
    width: 600,
    height: 400,
    parent: mainWindow, // 设置父窗口
    modal: false, // 非模态
  });
  settingsWindow.loadFile("settings.html");
});
```

---

## 问题 2：如何管理多个窗口？

### 窗口管理类

```javascript
// WindowManager.js
class WindowManager {
  constructor() {
    this.windows = new Map();
  }

  create(name, options, url) {
    if (this.windows.has(name)) {
      // 如果窗口已存在，聚焦它
      const existingWin = this.windows.get(name);
      existingWin.focus();
      return existingWin;
    }

    const win = new BrowserWindow({
      width: 800,
      height: 600,
      ...options,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        ...options.webPreferences,
      },
    });

    // 加载页面
    if (url.startsWith("http")) {
      win.loadURL(url);
    } else {
      win.loadFile(url);
    }

    // 注册窗口
    this.windows.set(name, win);
    win.on("closed", () => this.windows.delete(name));

    return win;
  }

  get(name) {
    return this.windows.get(name);
  }

  getAll() {
    return Array.from(this.windows.values());
  }

  close(name) {
    const win = this.windows.get(name);
    if (win) {
      win.close();
    }
  }

  closeAll() {
    this.windows.forEach((win) => win.close());
  }

  broadcast(channel, data) {
    this.windows.forEach((win) => {
      win.webContents.send(channel, data);
    });
  }
}

module.exports = new WindowManager();
```

### 使用窗口管理器

```javascript
// main.js
const windowManager = require("./WindowManager");

app.whenReady().then(() => {
  windowManager.create("main", { width: 1200 }, "index.html");
});

// 打开新窗口的 IPC 处理
ipcMain.on("open-window", (event, { name, options, url }) => {
  windowManager.create(name, options, url);
});

// 广播消息给所有窗口
ipcMain.on("broadcast", (event, { channel, data }) => {
  windowManager.broadcast(channel, data);
});
```

---

## 问题 3：窗口类型有哪些？

### 普通窗口

```javascript
const win = new BrowserWindow({ width: 800, height: 600 });
```

### 子窗口

```javascript
const child = new BrowserWindow({
  parent: mainWindow, // 指定父窗口
  // 子窗口会跟随父窗口最小化
});
```

### 模态窗口

```javascript
const modal = new BrowserWindow({
  parent: mainWindow,
  modal: true, // 模态：阻止与父窗口交互
  show: false,
});

modal.once("ready-to-show", () => modal.show());
```

### 工具窗口

```javascript
const toolWindow = new BrowserWindow({
  type: "toolbar", // macOS
  alwaysOnTop: true,
  frame: false,
  width: 300,
  height: 200,
});
```

---

## 问题 4：如何处理窗口间的关系？

### 父子窗口关系

```javascript
// 创建子窗口
const child = new BrowserWindow({
  parent: mainWindow,
  // 子窗口特性：
  // - 跟随父窗口最小化
  // - 父窗口关闭时子窗口也关闭
});

// 获取父窗口
const parent = child.getParentWindow();

// 获取所有子窗口
const children = mainWindow.getChildWindows();
```

### 窗口焦点管理

```javascript
// 聚焦窗口
win.focus();

// 将窗口移到最前
win.moveTop();

// 监听焦点变化
win.on("focus", () => {
  console.log("窗口获得焦点");
});

win.on("blur", () => {
  console.log("窗口失去焦点");
});

// 获取当前聚焦的窗口
const focusedWindow = BrowserWindow.getFocusedWindow();
```

---

## 问题 5：多窗口应用的最佳实践

### 统一的窗口配置

```javascript
// config/windows.js
module.exports = {
  main: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    url: "index.html",
  },
  settings: {
    width: 600,
    height: 400,
    resizable: false,
    url: "settings.html",
  },
  about: {
    width: 400,
    height: 300,
    resizable: false,
    minimizable: false,
    maximizable: false,
    url: "about.html",
  },
};
```

### 窗口状态持久化

```javascript
const Store = require("electron-store");
const store = new Store();

function createWindowWithState(name, defaultOptions) {
  // 恢复上次的窗口状态
  const savedBounds = store.get(`window.${name}.bounds`);

  const win = new BrowserWindow({
    ...defaultOptions,
    ...savedBounds,
  });

  // 保存窗口状态
  const saveBounds = () => {
    if (!win.isMaximized() && !win.isMinimized()) {
      store.set(`window.${name}.bounds`, win.getBounds());
    }
  };

  win.on("resize", saveBounds);
  win.on("move", saveBounds);

  return win;
}
```

## 延伸阅读

- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
- [多窗口应用示例](https://github.com/electron/electron/tree/main/docs/tutorial)
- [electron-store 状态持久化](https://github.com/sindresorhus/electron-store)
