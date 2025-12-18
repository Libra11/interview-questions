---
title: 如何管理 Worker Thread？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  详细介绍在 Electron 主进程中使用 Worker Thread 处理 CPU 密集型任务，
  包括创建、通信、池化管理以及最佳实践。
tags:
  - Electron
  - Worker Thread
  - 多线程
  - 性能优化
estimatedTime: 15 分钟
keywords:
  - electron worker thread
  - 工作线程
  - 多线程处理
highlight: 掌握 Electron 中 Worker Thread 的使用，避免主进程阻塞。
order: 293
---

## 问题 1：什么是 Worker Thread，何时使用？

Worker Thread 是 Node.js 的多线程方案，适用于 CPU 密集型任务：

- 图像/视频处理
- 加密/解密运算
- 大数据计算
- 文件压缩/解压

```javascript
// main/workers/compute.worker.js
const { parentPort } = require('worker_threads')

parentPort.on('message', (data) => {
  // 执行耗时计算
  const result = heavyComputation(data)
  parentPort.postMessage(result)
})

function heavyComputation(data) {
  // CPU 密集型操作
  return processedData
}
```

---

## 问题 2：如何创建和使用 Worker？

```javascript
// main/services/workerService.js
const { Worker } = require('worker_threads')
const path = require('path')

function runWorker(workerPath, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: data
    })
    
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with code ${code}`))
      }
    })
  })
}

// 使用
async function processImage(imagePath) {
  const workerPath = path.join(__dirname, 'workers/image.worker.js')
  const result = await runWorker(workerPath, { imagePath })
  return result
}
```

---

## 问题 3：如何实现 Worker 线程池？

```javascript
const { Worker } = require('worker_threads')

class WorkerPool {
  constructor(workerPath, poolSize = 4) {
    this.workerPath = workerPath
    this.poolSize = poolSize
    this.workers = []
    this.queue = []
    this.init()
  }
  
  init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.addWorker()
    }
  }
  
  addWorker() {
    const worker = new Worker(this.workerPath)
    worker.busy = false
    
    worker.on('message', (result) => {
      worker.busy = false
      worker.resolve(result)
      this.processQueue()
    })
    
    this.workers.push(worker)
  }
  
  processQueue() {
    if (this.queue.length === 0) return
    
    const idleWorker = this.workers.find(w => !w.busy)
    if (!idleWorker) return
    
    const { data, resolve } = this.queue.shift()
    idleWorker.busy = true
    idleWorker.resolve = resolve
    idleWorker.postMessage(data)
  }
  
  exec(data) {
    return new Promise((resolve) => {
      this.queue.push({ data, resolve })
      this.processQueue()
    })
  }
  
  destroy() {
    this.workers.forEach(w => w.terminate())
  }
}

// 使用
const pool = new WorkerPool('./compute.worker.js', 4)
const result = await pool.exec({ task: 'process', data: [...] })
```

---

## 问题 4：Worker 与主进程如何共享数据？

```javascript
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')

if (isMainThread) {
  // 使用 SharedArrayBuffer 共享内存
  const sharedBuffer = new SharedArrayBuffer(1024)
  const worker = new Worker(__filename, {
    workerData: { sharedBuffer }
  })
} else {
  // Worker 中访问共享内存
  const { sharedBuffer } = workerData
  const array = new Int32Array(sharedBuffer)
  // 可以直接读写 array
}
```

---

## 延伸阅读

- [Node.js Worker Threads 文档](https://nodejs.org/api/worker_threads.html)
- [Electron 性能优化指南](https://www.electronjs.org/docs/latest/tutorial/performance)
