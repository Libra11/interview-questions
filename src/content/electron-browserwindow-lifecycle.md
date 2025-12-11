---
title: BrowserWindow 的生命周期有哪些？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  详解 BrowserWindow 从创建到销毁的完整生命周期，掌握各个阶段的事件钩子和使用场景。
tags:
  - Electron
  - BrowserWindow
  - 生命周期
  - 事件
estimatedTime: 12 分钟
keywords:
  - 窗口生命周期
  - 窗口事件
  - ready-to-show
highlight: 理解 BrowserWindow 生命周期是管理窗口状态和优化用户体验的关键
order: 8
---

## 问题 1：BrowserWindow 的生命周期有哪些阶段？

BrowserWindow 的生命周期可以分为以下几个阶段：

```
创建 → 加载 → 显示 → 交互 → 关闭 → 销毁
```

### 完整的生命周期流程

```javascript
const { BrowserWindow } = require("electron");

const win = new BrowserWindow({
  width: 800,
  height: 600,
  show: false, // 先不显示，等内容加载完成
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
  },
});

// 1. 页面开始加载
win.webContents.on("did-start-loading", () => {
  console.log("开始加载页面");
});

// 2. DOM 准备就绪
win.webContents.on("dom-ready", () => {
  console.log("DOM 已就绪");
});

// 3. 页面加载完成
win.webContents.on("did-finish-load", () => {
  console.log("页面加载完成");
});

// 4. 窗口准备好显示
win.once("ready-to-show", () => {
  console.log("窗口准备好显示");
  win.show();
});

// 5. 窗口显示
win.on("show", () => {
  console.log("窗口已显示");
});

// 加载页面
win.loadFile("index.html");
```

---

## 问题 2：窗口显示相关的事件有哪些？

### ready-to-show（推荐）

窗口内容渲染完成，可以无闪烁地显示：

```javascript
const win = new BrowserWindow({ show: false });

win.once("ready-to-show", () => {
  win.show(); // 避免白屏闪烁
});

win.loadFile("index.html");
```

### show / hide

窗口显示或隐藏时触发：

```javascript
win.on("show", () => {
  console.log("窗口显示了");
  // 可以开始一些动画或数据加载
});

win.on("hide", () => {
  console.log("窗口隐藏了");
  // 可以暂停一些后台任务
});
```

### focus / blur

窗口获得或失去焦点：

```javascript
win.on("focus", () => {
  console.log("窗口获得焦点");
  // 恢复实时更新
});

win.on("blur", () => {
  console.log("窗口失去焦点");
  // 可以降低更新频率
});
```

---

## 问题 3：窗口状态变化的事件有哪些？

### 最大化 / 最小化

```javascript
win.on("maximize", () => {
  console.log("窗口最大化");
});

win.on("unmaximize", () => {
  console.log("窗口取消最大化");
});

win.on("minimize", () => {
  console.log("窗口最小化");
});

win.on("restore", () => {
  console.log("窗口从最小化恢复");
});
```

### 全屏

```javascript
win.on("enter-full-screen", () => {
  console.log("进入全屏");
});

win.on("leave-full-screen", () => {
  console.log("退出全屏");
});
```

### 窗口移动和缩放

```javascript
win.on("move", () => {
  console.log("窗口位置:", win.getPosition());
});

win.on("resize", () => {
  console.log("窗口大小:", win.getSize());
});

// 移动或缩放结束后（减少频繁触发）
win.on("moved", () => {
  saveWindowPosition(win.getPosition());
});

win.on("resized", () => {
  saveWindowSize(win.getSize());
});
```

---

## 问题 4：窗口关闭相关的事件有哪些？

### close（可阻止）

窗口即将关闭，可以阻止关闭：

```javascript
let isQuitting = false;

win.on("close", (event) => {
  if (!isQuitting) {
    event.preventDefault(); // 阻止关闭

    // 询问用户是否保存
    dialog
      .showMessageBox(win, {
        type: "question",
        buttons: ["保存", "不保存", "取消"],
        message: "是否保存更改？",
      })
      .then(({ response }) => {
        if (response === 0) {
          saveDocument().then(() => win.destroy());
        } else if (response === 1) {
          win.destroy(); // 强制关闭
        }
        // response === 2 取消，不做任何事
      });
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
```

### closed

窗口已关闭，此时窗口对象已不可用：

```javascript
win.on("closed", () => {
  console.log("窗口已关闭");
  win = null; // 释放引用
});
```

---

## 问题 5：如何优雅地管理窗口生命周期？

### 保存和恢复窗口状态

```javascript
const Store = require("electron-store");
const store = new Store();

function createWindow() {
  // 恢复上次的窗口状态
  const bounds = store.get("windowBounds", {
    width: 800,
    height: 600,
  });

  const win = new BrowserWindow({
    ...bounds,
    show: false,
  });

  // 保存窗口状态
  const saveBounds = () => {
    store.set("windowBounds", win.getBounds());
  };

  win.on("resized", saveBounds);
  win.on("moved", saveBounds);

  win.once("ready-to-show", () => {
    win.show();
  });

  return win;
}
```

### 生命周期事件顺序

```
new BrowserWindow()
    ↓
loadFile() / loadURL()
    ↓
did-start-loading
    ↓
dom-ready
    ↓
did-finish-load
    ↓
ready-to-show
    ↓
show() → show 事件
    ↓
[用户交互阶段]
    ↓
close 事件 (可阻止)
    ↓
closed 事件 (已销毁)
```

## 延伸阅读

- [BrowserWindow 事件](https://www.electronjs.org/docs/latest/api/browser-window#instance-events)
- [webContents 事件](https://www.electronjs.org/docs/latest/api/web-contents#instance-events)
- [窗口状态管理最佳实践](https://www.electronjs.org/docs/latest/tutorial/window-customization)
