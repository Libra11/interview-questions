---
title: 如何使用 webPreferences 优化性能？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍 BrowserWindow webPreferences 中与性能相关的配置选项及其优化效果。
tags:
  - Electron
  - 性能优化
  - webPreferences
  - 配置
estimatedTime: 10 分钟
keywords:
  - webPreferences
  - 性能配置
  - 渲染优化
highlight: 合理配置 webPreferences 可以显著提升应用启动速度和运行性能
order: 226
---

## 问题 1：哪些配置影响性能？

### 性能相关配置

```javascript
new BrowserWindow({
  webPreferences: {
    // 性能优化选项
    backgroundThrottling: true,
    offscreen: false,

    // 功能开关（关闭不需要的功能）
    webgl: true,
    plugins: false,
    experimentalFeatures: false,

    // 安全相关（也影响性能）
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  },
});
```

---

## 问题 2：backgroundThrottling 的作用

```javascript
// 后台节流：窗口不可见时降低定时器频率
new BrowserWindow({
  webPreferences: {
    backgroundThrottling: true, // 默认开启
  },
});

// 效果：
// - 后台窗口的 setTimeout/setInterval 频率降低
// - 减少 CPU 使用
// - 节省电量

// 如果需要后台持续运行（如音乐播放）
new BrowserWindow({
  webPreferences: {
    backgroundThrottling: false,
  },
});
```

---

## 问题 3：禁用不需要的功能

```javascript
new BrowserWindow({
  webPreferences: {
    // 如果不需要 WebGL
    webgl: false,

    // 禁用插件
    plugins: false,

    // 禁用实验性功能
    experimentalFeatures: false,

    // 禁用拼写检查（如果不需要）
    spellcheck: false,

    // 禁用图片（特殊场景）
    images: true, // 默认 true

    // 禁用 JavaScript（静态页面）
    javascript: true, // 默认 true
  },
});
```

---

## 问题 4：预加载优化

```javascript
// 使用 preload 脚本减少渲染进程负担
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),

    // 在 DOM 准备好之前执行 preload
    // 可以提前准备数据
  },
});

// preload.js - 提前加载必要数据
const { contextBridge, ipcRenderer } = require("electron");

// 预加载配置
const config = ipcRenderer.sendSync("get-config");

contextBridge.exposeInMainWorld("appConfig", config);
```

---

## 问题 5：其他性能配置

### 窗口级别配置

```javascript
new BrowserWindow({
  // 窗口配置
  show: false, // 先隐藏，加载完成后显示
  backgroundColor: "#fff", // 避免白屏闪烁

  webPreferences: {
    // 禁用同源策略检查（仅本地应用）
    // webSecurity: false,  // 不推荐
    // 启用硬件加速
    // 通过命令行参数控制
  },
});

// 加载完成后显示
win.once("ready-to-show", () => {
  win.show();
});
```

### 命令行参数

```javascript
// main.js
app.commandLine.appendSwitch("disable-gpu"); // 禁用 GPU（某些情况）
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder"); // 硬件解码

// 限制内存
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=512");
```

### 完整优化配置

```javascript
const optimizedWindow = new BrowserWindow({
  show: false,
  backgroundColor: "#ffffff",
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, "preload.js"),
    backgroundThrottling: true,
    spellcheck: false,
    plugins: false,
    experimentalFeatures: false,
  },
});

optimizedWindow.once("ready-to-show", () => {
  optimizedWindow.show();
});
```

## 延伸阅读

- [webPreferences 文档](https://www.electronjs.org/docs/latest/api/browser-window#new-browserwindowoptions)
- [Electron 性能优化](https://www.electronjs.org/docs/latest/tutorial/performance)
