---
title: 如何在任务栏（Dock）显示徽标或进度条？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍如何在 macOS Dock 和 Windows 任务栏上显示徽标、进度条等状态指示器。
tags:
  - Electron
  - Dock
  - 任务栏
  - 徽标
estimatedTime: 10 分钟
keywords:
  - Dock徽标
  - 任务栏进度条
  - badge
highlight: macOS 使用 app.dock API，Windows 使用 BrowserWindow 的任务栏方法
order: 30
---

## 问题 1：如何在 macOS Dock 显示徽标？

### 设置徽标数字

```javascript
const { app } = require("electron");

// 设置徽标（红色圆圈中的数字）
app.dock.setBadge("5");

// 清除徽标
app.dock.setBadge("");

// 显示非数字文本
app.dock.setBadge("新");
app.dock.setBadge("!");
```

### 动态更新徽标

```javascript
class BadgeManager {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count++;
    this.update();
  }

  decrement() {
    this.count = Math.max(0, this.count - 1);
    this.update();
  }

  setCount(count) {
    this.count = count;
    this.update();
  }

  clear() {
    this.count = 0;
    this.update();
  }

  update() {
    if (process.platform === "darwin") {
      // macOS: 使用 Dock 徽标
      app.dock.setBadge(this.count > 0 ? String(this.count) : "");
    } else if (process.platform === "win32") {
      // Windows: 使用覆盖图标
      this.updateWindowsOverlay();
    }
  }

  updateWindowsOverlay() {
    // 见下文 Windows 部分
  }
}
```

### Dock 图标弹跳

```javascript
// 弹跳 Dock 图标以吸引注意
// type: 'critical' - 持续弹跳直到应用获得焦点
// type: 'informational' - 弹跳一次
app.dock.bounce("critical");

// 取消弹跳
const bounceId = app.dock.bounce("critical");
app.dock.cancelBounce(bounceId);
```

---

## 问题 2：如何在 Windows 任务栏显示进度条？

### 设置进度条

```javascript
const { BrowserWindow } = require("electron");

// 获取窗口引用
const win = BrowserWindow.getFocusedWindow();

// 设置进度（0.0 - 1.0）
win.setProgressBar(0.5); // 50%

// 完成时清除
win.setProgressBar(-1); // 或 win.setProgressBar(0, { mode: 'none' })

// 不确定进度（加载动画）
win.setProgressBar(2); // 或任何 > 1 的值
```

### 进度条模式

```javascript
// Windows 支持不同的进度条模式
win.setProgressBar(0.5, {
  mode: "normal", // 默认，蓝色进度条
});

win.setProgressBar(0.5, {
  mode: "error", // 红色，表示错误
});

win.setProgressBar(0.5, {
  mode: "paused", // 黄色，表示暂停
});

win.setProgressBar(0, {
  mode: "indeterminate", // 不确定进度
});

win.setProgressBar(0, {
  mode: "none", // 隐藏进度条
});
```

### 下载进度示例

```javascript
function downloadFile(url, savePath) {
  const win = BrowserWindow.getFocusedWindow();

  // 开始下载
  win.setProgressBar(0);

  const request = net.request(url);
  let receivedBytes = 0;
  let totalBytes = 0;

  request.on("response", (response) => {
    totalBytes = parseInt(response.headers["content-length"], 10);

    response.on("data", (chunk) => {
      receivedBytes += chunk.length;
      const progress = receivedBytes / totalBytes;
      win.setProgressBar(progress);
    });

    response.on("end", () => {
      win.setProgressBar(-1); // 完成，清除进度条
    });

    response.on("error", () => {
      win.setProgressBar(0.5, { mode: "error" });
    });
  });

  request.end();
}
```

---

## 问题 3：如何在 Windows 显示覆盖图标？

### 设置覆盖图标

```javascript
const { BrowserWindow, nativeImage } = require("electron");

const win = BrowserWindow.getFocusedWindow();

// 设置覆盖图标（显示在任务栏图标右下角）
const overlayIcon = nativeImage.createFromPath("path/to/overlay.png");
win.setOverlayIcon(overlayIcon, "有新消息");

// 清除覆盖图标
win.setOverlayIcon(null, "");
```

### 动态生成徽标图标

```javascript
const { nativeImage } = require("electron");

function createBadgeIcon(count) {
  // 创建一个 canvas 来绘制徽标
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;

  const ctx = canvas.getContext("2d");

  // 绘制红色圆形背景
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, Math.PI * 2);
  ctx.fill();

  // 绘制数字
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(count > 99 ? "99+" : String(count), 8, 9);

  // 转换为 nativeImage
  return nativeImage.createFromDataURL(canvas.toDataURL());
}

// 使用
function updateBadge(count) {
  const win = BrowserWindow.getFocusedWindow();

  if (count > 0) {
    const icon = createBadgeIcon(count);
    win.setOverlayIcon(icon, `${count} 条未读消息`);
  } else {
    win.setOverlayIcon(null, "");
  }
}
```

---

## 问题 4：如何让任务栏图标闪烁？

### Windows 任务栏闪烁

```javascript
const win = BrowserWindow.getFocusedWindow();

// 开始闪烁
win.flashFrame(true);

// 停止闪烁
win.flashFrame(false);

// 窗口获得焦点时自动停止
win.on("focus", () => {
  win.flashFrame(false);
});
```

### 跨平台通知提醒

```javascript
function notifyUser() {
  const win = BrowserWindow.getFocusedWindow();

  if (process.platform === "darwin") {
    // macOS: Dock 弹跳
    app.dock.bounce("informational");
  } else if (process.platform === "win32") {
    // Windows: 任务栏闪烁
    win.flashFrame(true);
  }
}
```

---

## 问题 5：完整的跨平台徽标管理

```javascript
// BadgeManager.js
const { app, BrowserWindow, nativeImage } = require("electron");

class BadgeManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.count = 0;
  }

  setCount(count) {
    this.count = Math.max(0, count);
    this.updateBadge();
  }

  increment(amount = 1) {
    this.count += amount;
    this.updateBadge();
  }

  clear() {
    this.count = 0;
    this.updateBadge();
  }

  updateBadge() {
    if (process.platform === "darwin") {
      this.updateMacOSBadge();
    } else if (process.platform === "win32") {
      this.updateWindowsBadge();
    } else {
      this.updateLinuxBadge();
    }
  }

  updateMacOSBadge() {
    app.dock.setBadge(this.count > 0 ? String(this.count) : "");
  }

  updateWindowsBadge() {
    if (this.count > 0) {
      const icon = this.createBadgeIcon(this.count);
      this.mainWindow.setOverlayIcon(icon, `${this.count} 条未读`);
    } else {
      this.mainWindow.setOverlayIcon(null, "");
    }
  }

  updateLinuxBadge() {
    // Linux: 使用 Unity launcher API（如果可用）
    if (app.isUnityRunning && app.isUnityRunning()) {
      app.setBadgeCount(this.count);
    }
  }

  createBadgeIcon(count) {
    // 使用预制的图标或动态生成
    const size = 16;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // 红色圆形
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // 白色文字
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = count > 99 ? "99+" : String(count);
    ctx.fillText(text, size / 2, size / 2);

    return nativeImage.createFromBuffer(
      Buffer.from(canvas.convertToBlob({ type: "image/png" }))
    );
  }
}

module.exports = BadgeManager;
```

## 延伸阅读

- [app.dock API (macOS)](https://www.electronjs.org/docs/latest/api/app#appdock-macos)
- [BrowserWindow 任务栏方法](https://www.electronjs.org/docs/latest/api/browser-window#winsetprogressbarprogress-options)
- [Windows 任务栏功能](https://www.electronjs.org/docs/latest/tutorial/windows-taskbar)
