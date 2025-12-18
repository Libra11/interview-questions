---
title: 不同平台的窗口差异？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 在 macOS、Windows 和 Linux 上的窗口行为差异和适配方法。
tags:
  - Electron
  - 跨平台
  - 窗口
  - 平台差异
estimatedTime: 10 分钟
keywords:
  - 窗口差异
  - 跨平台适配
  - 平台特性
highlight: 不同平台的窗口控制按钮位置、标题栏样式和行为都有差异
order: 259
---

## 问题 1：窗口控制按钮位置

### 平台差异

```
macOS：
├── 控制按钮在左上角
├── 红黄绿三个圆形按钮
└── 关闭、最小化、最大化

Windows：
├── 控制按钮在右上角
├── 方形按钮
└── 最小化、最大化、关闭

Linux：
├── 取决于桌面环境
├── GNOME 类似 macOS
└── KDE 类似 Windows
```

### 适配代码

```javascript
const isMac = process.platform === "darwin";

new BrowserWindow({
  titleBarStyle: isMac ? "hiddenInset" : "default",
  frame: true,
  // macOS 特有的交通灯位置
  trafficLightPosition: isMac ? { x: 10, y: 10 } : undefined,
});
```

---

## 问题 2：标题栏样式

### macOS 特有选项

```javascript
new BrowserWindow({
  // 隐藏标题栏但保留控制按钮
  titleBarStyle: "hiddenInset",

  // 完全透明标题栏
  titleBarStyle: "customButtonsOnHover",

  // 标准标题栏
  titleBarStyle: "default",
});
```

### Windows 特有选项

```javascript
new BrowserWindow({
  // Windows 11 云母效果
  backgroundMaterial: "mica",

  // 标题栏覆盖模式
  titleBarOverlay: {
    color: "#2f3241",
    symbolColor: "#74b1be",
    height: 30,
  },
});
```

---

## 问题 3：全屏行为

```javascript
const win = new BrowserWindow();

// macOS 全屏是独立空间
// Windows/Linux 全屏覆盖任务栏

win.setFullScreen(true);

// macOS 简单全屏（不创建新空间）
win.setSimpleFullScreen(true);

// 监听全屏变化
win.on("enter-full-screen", () => {
  console.log("进入全屏");
});
```

---

## 问题 4：窗口状态

```javascript
// 最小化行为
win.minimize();

// macOS: 最小化到 Dock
// Windows: 最小化到任务栏
// Linux: 取决于窗口管理器

// 隐藏窗口
win.hide();

// macOS: 窗口隐藏，应用继续运行
// Windows: 窗口隐藏
// Linux: 窗口隐藏

// 关闭窗口
win.close();

// macOS: 默认只关闭窗口，应用继续运行
// Windows/Linux: 最后一个窗口关闭时退出应用
```

---

## 问题 5：跨平台适配

```javascript
// 统一处理
const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";
const isLinux = process.platform === "linux";

function createWindow() {
  const options = {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  };

  // 平台特定配置
  if (isMac) {
    options.titleBarStyle = "hiddenInset";
    options.trafficLightPosition = { x: 10, y: 10 };
  }

  if (isWin) {
    options.titleBarOverlay = {
      color: "#ffffff",
      symbolColor: "#000000",
    };
  }

  return new BrowserWindow(options);
}

// 处理 macOS 关闭行为
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

## 延伸阅读

- [BrowserWindow 配置](https://www.electronjs.org/docs/latest/api/browser-window)
- [macOS 窗口定制](https://www.electronjs.org/docs/latest/tutorial/window-customization)
