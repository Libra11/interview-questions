---
title: 如何打造企业级的错误上报体系？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍 Electron 应用的企业级错误上报系统设计，包括错误捕获、
  上报策略、崩溃收集以及 Sentry 集成。
tags:
  - Electron
  - 错误上报
  - 监控
  - 企业级
estimatedTime: 15 分钟
keywords:
  - electron 错误上报
  - 崩溃收集
  - sentry electron
highlight: 掌握 Electron 错误上报体系的设计，及时发现和解决线上问题。
order: 103
---

## 问题 1：需要捕获哪些类型的错误？

- **JavaScript 异常** - 主进程和渲染进程
- **Promise 拒绝** - 未处理的 Promise 错误
- **进程崩溃** - 渲染进程、GPU 进程崩溃
- **原生模块错误** - Node 原生模块异常

---

## 问题 2：如何捕获各类错误？

```javascript
// main.js - 错误捕获
class ErrorCollector {
  constructor() {
    this.errors = []
  }
  
  setup() {
    // 主进程异常
    process.on('uncaughtException', (error) => {
      this.capture('uncaughtException', error)
    })
    
    process.on('unhandledRejection', (reason) => {
      this.capture('unhandledRejection', reason)
    })
    
    // 渲染进程崩溃
    app.on('render-process-gone', (event, webContents, details) => {
      this.capture('render-process-gone', details)
    })
    
    // GPU 进程崩溃
    app.on('child-process-gone', (event, details) => {
      this.capture('child-process-gone', details)
    })
  }
  
  capture(type, error) {
    const errorData = {
      type,
      message: error.message || String(error),
      stack: error.stack,
      timestamp: Date.now(),
      appVersion: app.getVersion(),
      platform: process.platform
    }
    
    this.errors.push(errorData)
    this.report(errorData)
  }
  
  async report(errorData) {
    try {
      await fetch('https://errors.example.com/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      })
    } catch (e) {
      // 离线时缓存，稍后上报
      this.saveToLocal(errorData)
    }
  }
}
```

---

## 问题 3：如何集成 Sentry？

```javascript
const Sentry = require('@sentry/electron')

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  release: app.getVersion(),
  environment: process.env.NODE_ENV,
  
  // 自定义上下文
  beforeSend(event) {
    event.contexts = {
      ...event.contexts,
      app: {
        version: app.getVersion(),
        locale: app.getLocale()
      }
    }
    return event
  }
})

// 手动上报
Sentry.captureException(new Error('Something went wrong'))
Sentry.captureMessage('User did something')

// 添加上下文
Sentry.setUser({ id: userId })
Sentry.setTag('feature', 'export')
```

---

## 问题 4：如何收集崩溃报告？

```javascript
const { crashReporter } = require('electron')

crashReporter.start({
  productName: 'MyApp',
  companyName: 'MyCompany',
  submitURL: 'https://crashes.example.com/upload',
  uploadToServer: true,
  extra: {
    version: app.getVersion()
  }
})

// 获取崩溃报告目录
const crashesDir = app.getPath('crashDumps')
```

---

## 问题 5：如何设计上报策略？

```javascript
class ReportStrategy {
  constructor() {
    this.queue = []
    this.maxQueueSize = 100
    this.batchSize = 10
    this.interval = 60000
  }
  
  add(error) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift() // 丢弃最老的
    }
    this.queue.push(error)
    
    // 严重错误立即上报
    if (error.severity === 'critical') {
      this.flush()
    }
  }
  
  startBatchReport() {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.interval)
  }
  
  async flush() {
    const batch = this.queue.splice(0, this.batchSize)
    await this.sendBatch(batch)
  }
}
```

---

## 延伸阅读

- [Sentry Electron SDK](https://docs.sentry.io/platforms/javascript/guides/electron/)
- [Electron crashReporter](https://www.electronjs.org/docs/latest/api/crash-reporter)
