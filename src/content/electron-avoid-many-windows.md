---
title: 如何避免创建过多 BrowserWindow？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍管理 Electron 窗口数量的策略，包括窗口复用、池化和按需创建。
tags:
  - Electron
  - 性能优化
  - BrowserWindow
  - 窗口管理
estimatedTime: 10 分钟
keywords:
  - 窗口管理
  - 窗口复用
  - 性能优化
highlight: 每个 BrowserWindow 都是独立进程，过多窗口会消耗大量内存
order: 47
---

## 问题 1：为什么要限制窗口数量？

### 资源消耗

```
每个 BrowserWindow：
├── 独立的渲染进程
├── 独立的 V8 实例
├── 独立的 DOM 树
└── 约 30-100MB 内存

10 个窗口 = 300MB-1GB 内存
```

---

## 问题 2：如何复用窗口？

### 单例窗口模式

```javascript
// main.js
let settingsWindow = null;

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    /* ... */
  });
  settingsWindow.loadFile("settings.html");

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}
```

### 隐藏而非关闭

```javascript
// 隐藏窗口而不是销毁
win.on("close", (event) => {
  if (!app.isQuitting) {
    event.preventDefault();
    win.hide();
  }
});

// 需要时显示
function showWindow() {
  if (win) {
    win.show();
    win.focus();
  }
}
```

---

## 问题 3：如何使用窗口池？

```javascript
// WindowPool.js
class WindowPool {
  constructor(options = {}) {
    this.pool = [];
    this.maxSize = options.maxSize || 3;
    this.windowOptions = options.windowOptions || {};
  }

  acquire() {
    // 从池中获取或创建新窗口
    let win = this.pool.pop();

    if (!win) {
      win = new BrowserWindow(this.windowOptions);
    }

    return win;
  }

  release(win) {
    // 归还到池中或销毁
    if (this.pool.length < this.maxSize) {
      win.loadURL("about:blank");
      win.hide();
      this.pool.push(win);
    } else {
      win.destroy();
    }
  }

  clear() {
    this.pool.forEach((win) => win.destroy());
    this.pool = [];
  }
}

// 使用
const pool = new WindowPool({ maxSize: 3 });

function openDocument(path) {
  const win = pool.acquire();
  win.loadFile(path);
  win.show();

  win.on("close", (event) => {
    event.preventDefault();
    pool.release(win);
  });
}
```

---

## 问题 4：使用 BrowserView 替代

```javascript
// 在单个窗口中使用多个 BrowserView
const mainWindow = new BrowserWindow({ width: 800, height: 600 });

const views = new Map();

function addView(id, url) {
  const view = new BrowserView();
  mainWindow.addBrowserView(view);
  view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
  view.webContents.loadURL(url);
  views.set(id, view);
}

function switchView(id) {
  views.forEach((view, viewId) => {
    if (viewId === id) {
      view.setBounds({ x: 0, y: 0, width: 800, height: 600 });
    } else {
      view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
  });
}
```

---

## 问题 5：窗口管理器

```javascript
// WindowManager.js
class WindowManager {
  constructor() {
    this.windows = new Map();
    this.maxWindows = 10;
  }

  create(id, options) {
    if (this.windows.has(id)) {
      return this.focus(id);
    }

    if (this.windows.size >= this.maxWindows) {
      throw new Error("Maximum windows reached");
    }

    const win = new BrowserWindow(options);
    this.windows.set(id, win);

    win.on("closed", () => {
      this.windows.delete(id);
    });

    return win;
  }

  get(id) {
    return this.windows.get(id);
  }

  focus(id) {
    const win = this.windows.get(id);
    if (win) {
      win.show();
      win.focus();
    }
    return win;
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      win.close();
    }
  }

  closeAll() {
    this.windows.forEach((win) => win.close());
  }
}

module.exports = new WindowManager();
```

## 延伸阅读

- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
- [BrowserView API](https://www.electronjs.org/docs/latest/api/browser-view)
