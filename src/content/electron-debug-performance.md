---
title: 如何调试性能瓶颈？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍调试 Electron 应用性能问题的工具和方法，包括 DevTools、性能分析和内存分析。
tags:
  - Electron
  - 性能调试
  - DevTools
  - 性能分析
estimatedTime: 12 分钟
keywords:
  - 性能调试
  - 性能分析
  - 内存分析
highlight: 使用 Chrome DevTools 的 Performance 和 Memory 面板定位性能瓶颈
order: 232
---

## 问题 1：如何使用 DevTools 分析性能？

### 打开 DevTools

```javascript
// 主进程
win.webContents.openDevTools();

// 或快捷键 Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
```

### Performance 面板

```
1. 打开 DevTools → Performance 标签
2. 点击录制按钮
3. 执行要分析的操作
4. 停止录制
5. 分析火焰图和时间线
```

### 关键指标

```
- Scripting: JavaScript 执行时间
- Rendering: 布局和绘制时间
- Painting: 像素绘制时间
- Loading: 资源加载时间
```

---

## 问题 2：如何分析内存问题？

### Memory 面板

```javascript
// 1. 打开 DevTools → Memory 标签
// 2. 选择 "Heap snapshot"
// 3. 点击 "Take snapshot"
// 4. 执行操作后再次快照
// 5. 比较两次快照找出泄漏
```

### 代码中检测内存

```javascript
// 渲染进程
console.log("内存使用:", performance.memory);

// 主进程
const v8 = require("v8");
console.log("堆统计:", v8.getHeapStatistics());

// 进程内存
console.log("进程内存:", process.memoryUsage());
```

---

## 问题 3：如何分析主进程性能？

### 使用 --inspect 启动

```bash
# 启动时开启调试
electron --inspect=5858 .

# 或在代码中
app.commandLine.appendSwitch('inspect', '5858');
```

### 连接调试器

```
1. 打开 Chrome
2. 访问 chrome://inspect
3. 点击 "inspect" 连接到 Electron 主进程
4. 使用 Performance 面板分析
```

---

## 问题 4：使用 Electron 内置工具

### app.getAppMetrics()

```javascript
const metrics = app.getAppMetrics();
metrics.forEach((metric) => {
  console.log(`
    类型: ${metric.type}
    PID: ${metric.pid}
    CPU: ${metric.cpu.percentCPUUsage}%
    内存: ${metric.memory.workingSetSize / 1024} KB
  `);
});
```

### contentTracing

```javascript
const { contentTracing } = require("electron");

async function tracePerformance() {
  await contentTracing.startRecording({
    included_categories: ["*"],
  });

  // 执行要分析的操作
  await new Promise((r) => setTimeout(r, 5000));

  const path = await contentTracing.stopRecording();
  console.log("Trace 文件:", path);
  // 在 chrome://tracing 中打开分析
}
```

---

## 问题 5：常见性能问题排查

### 启动慢

```javascript
// 测量启动时间
const startTime = Date.now();

app.on("ready", () => {
  console.log("App ready:", Date.now() - startTime, "ms");
});

win.once("ready-to-show", () => {
  console.log("Window ready:", Date.now() - startTime, "ms");
});
```

### 渲染卡顿

```javascript
// 检测长任务
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn("长任务:", entry.duration, "ms");
    }
  }
});
observer.observe({ entryTypes: ["longtask"] });
```

### IPC 延迟

```javascript
// 测量 IPC 往返时间
const start = performance.now();
const result = await ipcRenderer.invoke("test");
console.log("IPC 延迟:", performance.now() - start, "ms");
```

## 延伸阅读

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Electron 性能](https://www.electronjs.org/docs/latest/tutorial/performance)
- [Node.js 性能分析](https://nodejs.org/en/docs/guides/simple-profiling/)
