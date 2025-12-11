---
title: Offscreen rendering（离屏渲染）是什么？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 离屏渲染的概念、使用场景和实现方式，理解如何在不显示窗口的情况下渲染内容。
tags:
  - Electron
  - 离屏渲染
  - 截图
  - 高级特性
estimatedTime: 10 分钟
keywords:
  - offscreen rendering
  - 离屏渲染
  - 页面截图
highlight: 离屏渲染允许在不显示窗口的情况下渲染页面内容，常用于截图和视频生成
order: 25
---

## 问题 1：什么是离屏渲染？

离屏渲染（Offscreen Rendering）是指在不显示窗口的情况下，将网页内容渲染到内存中的位图。

### 主要用途

- 网页截图
- 生成缩略图
- 视频录制
- PDF 生成
- 服务端渲染

### 基本配置

```javascript
const { BrowserWindow } = require("electron");

const win = new BrowserWindow({
  width: 1920,
  height: 1080,
  show: false, // 不显示窗口
  webPreferences: {
    offscreen: true, // 启用离屏渲染
  },
});

win.loadURL("https://example.com");
```

---

## 问题 2：如何获取渲染结果？

### 监听 paint 事件

```javascript
const win = new BrowserWindow({
  show: false,
  webPreferences: {
    offscreen: true,
  },
});

// 监听绘制事件
win.webContents.on("paint", (event, dirty, image) => {
  // dirty: 需要重绘的区域 { x, y, width, height }
  // image: NativeImage 对象

  // 获取 PNG 数据
  const pngData = image.toPNG();

  // 保存到文件
  fs.writeFileSync("screenshot.png", pngData);
});

// 设置帧率
win.webContents.setFrameRate(30);

win.loadURL("https://example.com");
```

### 使用 capturePage

```javascript
// 更简单的截图方式
win.webContents.on("did-finish-load", async () => {
  // 等待页面完全渲染
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 截取整个页面
  const image = await win.webContents.capturePage();
  fs.writeFileSync("screenshot.png", image.toPNG());

  // 截取指定区域
  const partialImage = await win.webContents.capturePage({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  });
});
```

---

## 问题 3：离屏渲染的实际应用

### 网页截图服务

```javascript
class ScreenshotService {
  constructor() {
    this.window = null;
  }

  async init() {
    this.window = new BrowserWindow({
      width: 1920,
      height: 1080,
      show: false,
      webPreferences: {
        offscreen: true,
      },
    });
  }

  async capture(url, options = {}) {
    const { width = 1920, height = 1080, fullPage = false } = options;

    // 设置视口大小
    this.window.setSize(width, height);

    // 加载页面
    await this.window.loadURL(url);

    // 等待页面加载完成
    await new Promise((resolve) => {
      this.window.webContents.on("did-finish-load", resolve);
    });

    // 额外等待动态内容
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (fullPage) {
      // 获取完整页面高度
      const scrollHeight = await this.window.webContents.executeJavaScript(
        "document.documentElement.scrollHeight"
      );
      this.window.setSize(width, scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 截图
    const image = await this.window.webContents.capturePage();
    return image.toPNG();
  }

  destroy() {
    if (this.window) {
      this.window.destroy();
    }
  }
}

// 使用
const screenshot = new ScreenshotService();
await screenshot.init();
const pngBuffer = await screenshot.capture("https://example.com", {
  width: 1280,
  height: 800,
});
fs.writeFileSync("output.png", pngBuffer);
```

### 生成视频帧

```javascript
const frames = [];

win.webContents.on("paint", (event, dirty, image) => {
  frames.push(image.toPNG());

  if (frames.length >= 300) {
    // 10秒 @ 30fps
    // 停止录制
    win.webContents.setFrameRate(1);
    saveVideo(frames);
  }
});

win.webContents.setFrameRate(30);
```

---

## 问题 4：离屏渲染的注意事项

### 1. 性能考虑

```javascript
// 控制帧率以平衡性能
win.webContents.setFrameRate(30); // 默认 60fps

// 只在需要时启用
win.webContents.startPainting();
win.webContents.stopPainting();

// 检查是否正在绘制
const isPainting = win.webContents.isPainting();
```

### 2. 内存管理

```javascript
// paint 事件会频繁触发，注意内存
win.webContents.on("paint", (event, dirty, image) => {
  // 及时处理或丢弃不需要的帧
  if (shouldCapture) {
    processFrame(image);
  }
  // image 会在事件处理后被回收
});
```

### 3. GPU 加速

```javascript
// 某些情况下可能需要禁用 GPU 加速
app.disableHardwareAcceleration();

// 或者在创建窗口时
const win = new BrowserWindow({
  webPreferences: {
    offscreen: true,
  },
});

// 禁用特定窗口的 GPU
win.webContents.setBackgroundThrottling(false);
```

---

## 问题 5：与普通渲染的区别

| 特性       | 普通渲染 | 离屏渲染  |
| ---------- | -------- | --------- |
| 显示窗口   | 是       | 否        |
| 渲染目标   | 屏幕     | 内存位图  |
| 帧率控制   | 系统控制 | 可自定义  |
| paint 事件 | 不触发   | 触发      |
| 资源占用   | 正常     | 可能更高  |
| 用途       | 用户交互 | 截图/录制 |

```javascript
// 普通窗口
const normalWindow = new BrowserWindow({
  show: true,
  // 没有 offscreen 选项
});

// 离屏窗口
const offscreenWindow = new BrowserWindow({
  show: false,
  webPreferences: {
    offscreen: true,
  },
});
```

## 延伸阅读

- [离屏渲染文档](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering)
- [webContents API](https://www.electronjs.org/docs/latest/api/web-contents)
- [NativeImage API](https://www.electronjs.org/docs/latest/api/native-image)
