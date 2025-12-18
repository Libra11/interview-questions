---
title: BrowserWindow 的常见配置项有哪些？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 BrowserWindow 的常用配置选项，包括窗口尺寸、外观、行为和安全相关的配置。
tags:
  - Electron
  - BrowserWindow
  - 窗口配置
  - API
estimatedTime: 12 分钟
keywords:
  - BrowserWindow配置
  - 窗口选项
  - webPreferences
highlight: BrowserWindow 提供丰富的配置选项来控制窗口的外观、行为和安全特性
order: 122
---

## 问题 1：窗口尺寸和位置相关的配置有哪些？

### 基本尺寸

```javascript
const win = new BrowserWindow({
  // 初始尺寸
  width: 1200,
  height: 800,

  // 最小尺寸
  minWidth: 400,
  minHeight: 300,

  // 最大尺寸
  maxWidth: 1920,
  maxHeight: 1080,

  // 是否可调整大小
  resizable: true,
});
```

### 位置控制

```javascript
const win = new BrowserWindow({
  // 指定位置
  x: 100,
  y: 100,

  // 或者居中显示
  center: true,

  // 是否可移动
  movable: true,
});
```

### 响应式尺寸

```javascript
const win = new BrowserWindow({
  // 使用屏幕工作区域的百分比
  width: Math.floor(screen.getPrimaryDisplay().workAreaSize.width * 0.8),
  height: Math.floor(screen.getPrimaryDisplay().workAreaSize.height * 0.8),
  center: true,
});
```

---

## 问题 2：窗口外观相关的配置有哪些？

### 标题栏和边框

```javascript
const win = new BrowserWindow({
  // 窗口标题
  title: "我的应用",

  // 窗口图标
  icon: path.join(__dirname, "icon.png"),

  // 是否显示标题栏
  titleBarStyle: "default", // 'default' | 'hidden' | 'hiddenInset'

  // 无边框窗口
  frame: true, // false 则无边框

  // 透明窗口
  transparent: false,

  // 背景颜色
  backgroundColor: "#ffffff",
});
```

### macOS 特有配置

```javascript
const win = new BrowserWindow({
  // 交通灯按钮位置
  trafficLightPosition: { x: 10, y: 10 },

  // 标题栏样式
  titleBarStyle: "hiddenInset", // 隐藏标题栏但保留交通灯

  // 是否显示在所有工作区
  visibleOnAllWorkspaces: false,

  // 全屏时隐藏交通灯
  fullscreenWindowTitle: true,
});
```

### Windows 特有配置

```javascript
const win = new BrowserWindow({
  // 任务栏图标闪烁
  // win.flashFrame(true);
  // 缩略图工具栏
  // win.setThumbarButtons([...]);
  // 覆盖图标
  // win.setOverlayIcon(icon, 'description');
});
```

---

## 问题 3：窗口行为相关的配置有哪些？

### 显示控制

```javascript
const win = new BrowserWindow({
  // 创建时是否显示
  show: false, // 推荐 false，等 ready-to-show 再显示

  // 是否在任务栏显示
  skipTaskbar: false,

  // 是否总在最前
  alwaysOnTop: false,

  // 是否全屏
  fullscreen: false,
  fullscreenable: true,

  // 是否可最大化/最小化
  maximizable: true,
  minimizable: true,

  // 是否可关闭
  closable: true,
});

// 等内容加载完成再显示
win.once("ready-to-show", () => {
  win.show();
});
```

### 焦点控制

```javascript
const win = new BrowserWindow({
  // 创建时是否获取焦点
  focusable: true,

  // 是否接受第一次鼠标点击
  acceptFirstMouse: false, // macOS
});
```

### 模态窗口

```javascript
// 创建模态窗口
const modal = new BrowserWindow({
  parent: mainWindow, // 父窗口
  modal: true, // 模态
  show: false,
});
```

---

## 问题 4：webPreferences 有哪些重要配置？

### 安全相关（最重要）

```javascript
const win = new BrowserWindow({
  webPreferences: {
    // 预加载脚本
    preload: path.join(__dirname, "preload.js"),

    // 上下文隔离（必须开启）
    contextIsolation: true,

    // Node.js 集成（必须关闭）
    nodeIntegration: false,

    // 沙箱模式
    sandbox: true,

    // Web 安全策略
    webSecurity: true,

    // 禁止运行不安全内容
    allowRunningInsecureContent: false,
  },
});
```

### 功能开关

```javascript
const win = new BrowserWindow({
  webPreferences: {
    // 开发者工具
    devTools: true,

    // 拼写检查
    spellcheck: true,

    // 默认编码
    defaultEncoding: "UTF-8",

    // 默认字体大小
    defaultFontSize: 16,

    // 是否启用 WebGL
    webgl: true,

    // 是否启用插件
    plugins: false,

    // 是否启用实验性功能
    experimentalFeatures: false,
  },
});
```

### 远程内容相关

```javascript
const win = new BrowserWindow({
  webPreferences: {
    // 是否允许在 HTTPS 页面中加载 HTTP 内容
    allowRunningInsecureContent: false,

    // 图片加载
    images: true,

    // JavaScript 执行
    javascript: true,

    // 是否启用同源策略
    webSecurity: true,
  },
});
```

---

## 问题 5：完整的配置示例

### 生产环境推荐配置

```javascript
const { BrowserWindow, screen } = require("electron");
const path = require("path");

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    // 尺寸
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8),
    minWidth: 800,
    minHeight: 600,
    center: true,

    // 外观
    title: "My App",
    icon: path.join(__dirname, "assets/icon.png"),
    backgroundColor: "#f5f5f5",

    // 行为
    show: false, // 等 ready-to-show

    // 安全配置
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // 优雅显示
  win.once("ready-to-show", () => {
    win.show();
  });

  // 加载页面
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }

  return win;
}
```

## 延伸阅读

- [BrowserWindow API 文档](https://www.electronjs.org/docs/latest/api/browser-window)
- [webPreferences 完整列表](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)
- [窗口定制教程](https://www.electronjs.org/docs/latest/tutorial/window-customization)
