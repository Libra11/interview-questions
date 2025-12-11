---
title: 如何减少渲染进程的内存占用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍减少 Electron 渲染进程内存占用的方法，包括内存泄漏排查、资源管理和优化策略。
tags:
  - Electron
  - 性能优化
  - 内存管理
  - 渲染进程
estimatedTime: 12 分钟
keywords:
  - 内存优化
  - 内存泄漏
  - 渲染进程
highlight: 通过及时清理资源、避免内存泄漏和合理使用缓存来减少内存占用
order: 46
---

## 问题 1：如何检测内存使用？

### 使用 Electron API

```javascript
// 主进程
const { app } = require("electron");

// 获取进程内存信息
const metrics = app.getAppMetrics();
metrics.forEach((metric) => {
  console.log(`${metric.type}: ${metric.memory.workingSetSize / 1024} KB`);
});

// 渲染进程
const used = process.memoryUsage();
console.log("堆内存使用:", Math.round(used.heapUsed / 1024 / 1024), "MB");
```

### 使用 DevTools

```javascript
// 打开 DevTools 的 Memory 面板
win.webContents.openDevTools();

// 或通过代码
win.webContents.executeJavaScript(`
  console.log(performance.memory);
`);
```

---

## 问题 2：常见的内存泄漏原因

### 事件监听器未移除

```javascript
// ❌ 泄漏：监听器未移除
window.addEventListener("resize", handleResize);

// ✅ 正确：组件销毁时移除
const controller = new AbortController();
window.addEventListener("resize", handleResize, { signal: controller.signal });
// 销毁时
controller.abort();
```

### 定时器未清理

```javascript
// ❌ 泄漏
setInterval(() => updateData(), 1000);

// ✅ 正确
const timer = setInterval(() => updateData(), 1000);
// 销毁时
clearInterval(timer);
```

### 闭包引用

```javascript
// ❌ 泄漏：闭包持有大对象引用
function createHandler() {
  const largeData = new Array(1000000);
  return () => console.log(largeData.length);
}

// ✅ 正确：只保留必要数据
function createHandler() {
  const largeData = new Array(1000000);
  const length = largeData.length;
  return () => console.log(length);
}
```

---

## 问题 3：如何优化图片和资源？

### 懒加载图片

```javascript
// 使用 Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll("img[data-src]").forEach((img) => {
  observer.observe(img);
});
```

### 及时释放资源

```javascript
// 释放 Canvas
const canvas = document.createElement("canvas");
// 使用完毕后
canvas.width = 0;
canvas.height = 0;

// 释放 Blob URL
const url = URL.createObjectURL(blob);
// 使用完毕后
URL.revokeObjectURL(url);
```

---

## 问题 4：如何管理缓存？

### 限制缓存大小

```javascript
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 定期清理

```javascript
// 定期清理过期缓存
setInterval(() => {
  const now = Date.now();
  cache.forEach((value, key) => {
    if (now - value.timestamp > 5 * 60 * 1000) {
      cache.delete(key);
    }
  });
}, 60 * 1000);
```

---

## 问题 5：其他优化策略

### 虚拟列表

```javascript
// 只渲染可见区域的列表项
// 使用 react-window 或 vue-virtual-scroller
import { FixedSizeList } from "react-window";

<FixedSizeList height={400} itemCount={10000} itemSize={35}>
  {({ index, style }) => <div style={style}>Item {index}</div>}
</FixedSizeList>;
```

### 使用 Web Workers

```javascript
// 将重计算移到 Worker
const worker = new Worker("worker.js");
worker.postMessage(largeData);
worker.onmessage = (e) => {
  console.log("结果:", e.data);
};
```

### 手动触发 GC（开发调试）

```javascript
// 仅用于调试，生产环境不要使用
if (global.gc) {
  global.gc();
}
// 启动时需要 --expose-gc 标志
```

## 延伸阅读

- [Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems/)
- [JavaScript 内存管理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)
