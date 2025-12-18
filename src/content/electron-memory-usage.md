---
title: 如何查看内存使用？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  详细介绍在 Electron 应用中查看和分析内存使用的方法，包括使用 process.memoryUsage、
  Chrome DevTools、以及构建内存监控系统。
tags:
  - Electron
  - 内存分析
  - 性能优化
  - DevTools
estimatedTime: 15 分钟
keywords:
  - electron 内存使用
  - 内存分析
  - 性能监控
highlight: 掌握 Electron 内存使用的监控和分析方法，及时发现和解决内存问题。
order: 280
---

## 问题 1：如何获取进程的内存使用信息？

Electron 提供了多种方式获取内存使用信息：

```javascript
// main.js
const { app } = require('electron')

// 使用 Node.js 的 process.memoryUsage()
function getMainProcessMemory() {
  const memory = process.memoryUsage()
  return {
    rss: formatBytes(memory.rss),           // 常驻内存
    heapTotal: formatBytes(memory.heapTotal), // V8 堆总大小
    heapUsed: formatBytes(memory.heapUsed),   // V8 堆已使用
    external: formatBytes(memory.external)     // C++ 对象内存
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// 获取所有进程的内存信息
function getAllProcessMemory() {
  const metrics = app.getAppMetrics()
  return metrics.map(m => ({
    pid: m.pid,
    type: m.type,
    memory: formatBytes(m.memory.workingSetSize * 1024)
  }))
}
```

---

## 问题 2：如何获取渲染进程的内存信息？

```javascript
// preload.js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('memoryAPI', {
  getMemoryInfo: () => ({
    nodeMemory: process.memoryUsage(),
    browserMemory: performance.memory ? {
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usedJSHeapSize: performance.memory.usedJSHeapSize
    } : null
  })
})
```

---

## 问题 3：如何使用 Chrome DevTools 分析内存？

在 DevTools 的 Memory 面板中：

1. **Heap Snapshot** - 查看堆中对象，对比找出泄漏
2. **Allocation timeline** - 记录内存分配过程
3. **Allocation sampling** - 低开销的长期分析

---

## 问题 4：如何构建内存监控系统？

```javascript
class MemoryMonitor {
  constructor() {
    this.warningThreshold = 500 * 1024 * 1024 // 500MB
  }
  
  start(interval = 5000) {
    this.timer = setInterval(() => {
      const metrics = app.getAppMetrics()
      const total = metrics.reduce((sum, m) => 
        sum + m.memory.workingSetSize * 1024, 0)
      
      if (total > this.warningThreshold) {
        console.warn('⚠️ 内存使用较高:', this.formatBytes(total))
      }
    }, interval)
  }
  
  formatBytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
}
```

---

## 延伸阅读

- [Electron app.getAppMetrics 文档](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics)
- [Chrome DevTools Memory 面板](https://developer.chrome.com/docs/devtools/memory-problems/)
