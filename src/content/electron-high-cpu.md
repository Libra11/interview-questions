---
title: 为什么 CPU 占用高？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  分析 Electron 应用 CPU 占用过高的常见原因，包括无限循环、
  频繁渲染、后台任务以及排查和优化方法。
tags:
  - Electron
  - CPU 占用
  - 性能优化
  - 故障排查
estimatedTime: 12 分钟
keywords:
  - electron cpu 高
  - 性能问题
  - cpu 优化
highlight: 掌握 Electron 应用 CPU 占用过高的排查和优化方法。
order: 342
---

## 问题 1：CPU 占用高的常见原因

1. **无限循环或定时器** - 未清理的 setInterval
2. **频繁渲染** - CSS 动画、高频重绘
3. **后台轮询** - 频繁的网络请求
4. **复杂计算** - 未优化的算法
5. **内存压力** - 频繁 GC

---

## 问题 2：如何定位 CPU 消耗来源？

```javascript
// 使用 app.getAppMetrics() 查看各进程 CPU
function monitorCPU() {
  setInterval(() => {
    const metrics = app.getAppMetrics()
    
    metrics.forEach(m => {
      if (m.cpu.percentCPUUsage > 10) {
        console.warn(`进程 ${m.type} (${m.pid}) CPU: ${m.cpu.percentCPUUsage.toFixed(1)}%`)
      }
    })
  }, 5000)
}

// 使用 DevTools Performance 面板
// 1. 录制一段时间
// 2. 分析 CPU 使用分布
// 3. 找出热点函数
```

---

## 问题 3：如何优化定时器？

```javascript
// ❌ 高频定时器
setInterval(() => {
  updateUI()
}, 16)  // 60fps

// ✅ 使用 requestAnimationFrame
function animate() {
  updateUI()
  requestAnimationFrame(animate)
}

// ✅ 窗口不可见时暂停
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAnimation()
  } else {
    startAnimation()
  }
})

// ✅ 清理不需要的定时器
const timerId = setInterval(task, 1000)
// 不需要时清理
clearInterval(timerId)
```

---

## 问题 4：如何优化渲染性能？

```javascript
// ❌ 频繁触发重排
element.style.width = '100px'
element.style.height = '100px'
element.style.left = '50px'

// ✅ 批量修改
element.style.cssText = 'width: 100px; height: 100px; left: 50px'

// ✅ 使用 transform 代替 top/left
element.style.transform = 'translateX(50px)'

// ✅ 使用 will-change 提示浏览器
.animated {
  will-change: transform;
}

// ✅ 减少 CSS 复杂度
// 避免深层选择器和复杂计算
```

---

## 问题 5：如何优化后台任务？

```javascript
// ❌ 高频轮询
setInterval(async () => {
  await fetchData()
}, 100)

// ✅ 使用 WebSocket 替代轮询
const ws = new WebSocket('wss://api.example.com')
ws.onmessage = handleData

// ✅ 使用指数退避
let delay = 1000
async function poll() {
  await fetchData()
  delay = Math.min(delay * 2, 30000)
  setTimeout(poll, delay)
}

// ✅ 窗口最小化时降低频率
if (win.isMinimized()) {
  pollInterval = 60000
} else {
  pollInterval = 5000
}
```

---

## 问题 6：使用 Chrome 任务管理器

在 Electron 应用的 DevTools 中，按 Shift+Esc 打开 Chrome 任务管理器，可以看到各 Tab 的资源使用情况。

---

## 延伸阅读

- [Chrome Performance 分析](https://developer.chrome.com/docs/devtools/performance/)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
