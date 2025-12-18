---
title: Chromium、多进程架构在 Electron 中的作用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  理解 Chromium 多进程架构如何被 Electron 继承和利用，以及这种架构带来的稳定性和安全性优势。
tags:
  - Electron
  - Chromium
  - 多进程架构
  - 浏览器架构
estimatedTime: 12 分钟
keywords:
  - Chromium
  - 多进程
  - 进程隔离
highlight: Electron 继承了 Chromium 的多进程架构，实现了窗口间的进程隔离
order: 25
---

## 问题 1：Chromium 的多进程架构是什么？

Chromium 采用多进程架构，将不同的功能分配给不同的进程：

```
┌─────────────────────────────────────────────────┐
│                 Browser Process                  │
│            (浏览器主进程/协调者)                   │
│  - UI 管理                                       │
│  - 网络请求                                      │
│  - 存储管理                                      │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Renderer   │  │  Renderer   │  │  Renderer   │
│  Process 1  │  │  Process 2  │  │  Process 3  │
│  (标签页1)   │  │  (标签页2)   │  │  (标签页3)   │
└─────────────┘  └─────────────┘  └─────────────┘
         │
         ▼
┌─────────────┐
│    GPU      │
│  Process    │
│  (图形渲染)  │
└─────────────┘
```

每个标签页运行在独立的渲染进程中，相互隔离。

---

## 问题 2：Electron 如何继承这种架构？

Electron 直接复用了 Chromium 的多进程模型：

```
┌─────────────────────────────────────────────────┐
│              Main Process (主进程)               │
│  对应 Chromium 的 Browser Process               │
│  - 应用生命周期管理                              │
│  - 窗口创建和管理                                │
│  - 系统 API 调用                                 │
│  - IPC 通信中心                                  │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Renderer   │  │  Renderer   │  │  Renderer   │
│  Process    │  │  Process    │  │  Process    │
│ (窗口 A)    │  │ (窗口 B)    │  │ (窗口 C)    │
│ BrowserWindow│ │ BrowserWindow│ │ BrowserWindow│
└─────────────┘  └─────────────┘  └─────────────┘
```

```javascript
// 每个 BrowserWindow 创建一个独立的渲染进程
const win1 = new BrowserWindow(); // 渲染进程 1
const win2 = new BrowserWindow(); // 渲染进程 2
const win3 = new BrowserWindow(); // 渲染进程 3
```

---

## 问题 3：多进程架构带来了什么好处？

### 1. 稳定性：进程隔离

一个窗口崩溃不会影响其他窗口：

```javascript
// 主进程可以监听渲染进程崩溃
win.webContents.on("crashed", (event, killed) => {
  console.log("渲染进程崩溃了");

  // 可以选择重新加载
  dialog
    .showMessageBox({
      type: "error",
      message: "页面崩溃了，是否重新加载？",
      buttons: ["重新加载", "关闭窗口"],
    })
    .then(({ response }) => {
      if (response === 0) {
        win.reload();
      } else {
        win.close();
      }
    });
});
```

### 2. 安全性：沙箱隔离

渲染进程运行在沙箱中，限制了对系统资源的访问：

```javascript
new BrowserWindow({
  webPreferences: {
    sandbox: true, // 启用沙箱
    // 沙箱模式下，渲染进程：
    // - 不能直接访问文件系统
    // - 不能执行系统命令
    // - 不能加载原生模块
  },
});
```

### 3. 资源管理

每个进程有独立的内存空间，便于监控和管理：

```javascript
// 获取进程内存信息
const { app } = require("electron");

// 获取所有进程的内存使用情况
app.getAppMetrics().forEach((metric) => {
  console.log(`进程 ${metric.pid}: ${metric.memory.workingSetSize} bytes`);
});
```

---

## 问题 4：多进程架构有什么代价？

### 1. 内存开销

每个渲染进程都有独立的 V8 实例和内存空间：

```javascript
// 10 个窗口 = 10 个渲染进程
// 每个进程至少占用 30-50MB 内存
for (let i = 0; i < 10; i++) {
  new BrowserWindow(); // 内存占用会显著增加
}
```

### 2. 通信成本

进程间通信需要序列化和反序列化：

```javascript
// 跨进程传递大数据有性能开销
ipcMain.handle("get-large-data", () => {
  // 这个大对象需要序列化后传输
  return {
    /* 大量数据 */
  };
});
```

### 3. 启动时间

多进程启动比单进程慢：

```javascript
// 可以延迟创建窗口来优化启动体验
app.whenReady().then(() => {
  // 先显示启动画面
  const splash = new BrowserWindow({
    /* ... */
  });

  // 后台准备主窗口
  setTimeout(() => {
    const mainWindow = new BrowserWindow({ show: false });
    mainWindow.once("ready-to-show", () => {
      splash.close();
      mainWindow.show();
    });
  }, 100);
});
```

## 延伸阅读

- [Chromium 多进程架构](https://www.chromium.org/developers/design-documents/multi-process-architecture/)
- [Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [进程沙箱化](https://www.electronjs.org/docs/latest/tutorial/sandbox)
