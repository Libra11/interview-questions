---
title: 为什么渲染进程卡死？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  分析 Electron 渲染进程卡死的常见原因，包括主线程阻塞、
  内存泄漏、死循环以及相应的排查和解决方法。
tags:
  - Electron
  - 渲染进程
  - 卡死
  - 性能问题
estimatedTime: 12 分钟
keywords:
  - electron 卡死
  - 渲染进程阻塞
  - UI 无响应
highlight: 掌握渲染进程卡死问题的排查和解决方法。
order: 106
---

## 问题 1：渲染进程卡死的常见原因

1. **同步操作阻塞** - 同步 IPC、同步 I/O
2. **死循环** - 无限循环消耗 CPU
3. **大量 DOM 操作** - 频繁重排重绘
4. **内存泄漏** - 内存耗尽导致 GC 频繁
5. **长时间脚本** - 复杂计算阻塞主线程

---

## 问题 2：如何排查同步阻塞？

```javascript
// ❌ 同步 IPC 会阻塞渲染进程
const result = ipcRenderer.sendSync('heavy-task', data)

// ✅ 改用异步
const result = await ipcRenderer.invoke('heavy-task', data)

// 检测长时间运行的脚本
let lastTime = Date.now()
setInterval(() => {
  const now = Date.now()
  const delta = now - lastTime
  if (delta > 100) {
    console.warn(`主线程阻塞 ${delta}ms`)
  }
  lastTime = now
}, 50)
```

---

## 问题 3：如何将耗时任务移到 Worker？

```javascript
// 渲染进程
const worker = new Worker('worker.js')

worker.postMessage({ type: 'process', data: largeData })

worker.onmessage = (e) => {
  const result = e.data
  updateUI(result)
}

// worker.js
self.onmessage = (e) => {
  const { type, data } = e.data
  
  if (type === 'process') {
    const result = heavyProcess(data)
    self.postMessage(result)
  }
}
```

---

## 问题 4：如何使用 DevTools 分析？

1. 打开 DevTools Performance 面板
2. 点击录制，复现卡死场景
3. 查看火焰图找出耗时函数
4. 检查是否有长任务（Long Tasks）

```javascript
// 监控长任务
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('长任务:', entry.duration, 'ms')
    }
  }
})

observer.observe({ entryTypes: ['longtask'] })
```

---

## 问题 5：如何优化大量 DOM 操作？

```javascript
// ❌ 频繁操作 DOM
items.forEach(item => {
  const div = document.createElement('div')
  div.textContent = item.name
  container.appendChild(div)  // 每次都触发重排
})

// ✅ 使用 DocumentFragment
const fragment = document.createDocumentFragment()
items.forEach(item => {
  const div = document.createElement('div')
  div.textContent = item.name
  fragment.appendChild(div)
})
container.appendChild(fragment)  // 只触发一次重排

// ✅ 或使用虚拟列表
// 只渲染可见区域的元素
```

---

## 问题 6：如何设置无响应检测？

```javascript
// 主进程检测渲染进程是否响应
async function checkRendererAlive(win) {
  try {
    await Promise.race([
      win.webContents.executeJavaScript('1'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ])
    return true
  } catch {
    return false
  }
}
```

---

## 延伸阅读

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
