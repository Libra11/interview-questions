---
title: 如何减少主进程阻塞？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍避免 Electron 主进程阻塞的方法，包括异步操作、任务分片和使用子进程。
tags:
  - Electron
  - 性能优化
  - 主进程
  - 异步
estimatedTime: 10 分钟
keywords:
  - 主进程阻塞
  - 异步操作
  - 子进程
highlight: 主进程阻塞会导致整个应用无响应，应使用异步操作和子进程处理耗时任务
order: 50
---

## 问题 1：为什么主进程阻塞很严重？

### 主进程的职责

```
主进程负责：
├── 窗口管理
├── 系统菜单
├── 托盘图标
├── 全局快捷键
├── IPC 通信
└── 原生对话框

主进程阻塞 = 整个应用无响应
```

---

## 问题 2：如何使用异步操作？

### 避免同步 API

```javascript
// ❌ 阻塞：同步读取
const content = fs.readFileSync(path, "utf-8");

// ✅ 非阻塞：异步读取
const content = await fs.promises.readFile(path, "utf-8");

// ❌ 阻塞：同步对话框
const result = dialog.showMessageBoxSync(win, options);

// ✅ 非阻塞：异步对话框
const result = await dialog.showMessageBox(win, options);
```

### IPC 处理使用 async

```javascript
// ✅ 异步 IPC 处理器
ipcMain.handle("read-file", async (event, path) => {
  return await fs.promises.readFile(path, "utf-8");
});

// ❌ 避免在 IPC 中执行耗时同步操作
ipcMain.handle("process-data", (event, data) => {
  // 这会阻塞主进程
  return heavySyncOperation(data);
});
```

---

## 问题 3：如何使用子进程？

### 使用 fork

```javascript
// main.js
const { fork } = require("child_process");

function processInBackground(data) {
  return new Promise((resolve, reject) => {
    const worker = fork(path.join(__dirname, "worker.js"));

    worker.send(data);

    worker.on("message", (result) => {
      resolve(result);
      worker.kill();
    });

    worker.on("error", reject);
  });
}

// worker.js
process.on("message", (data) => {
  const result = heavyCalculation(data);
  process.send(result);
});
```

### 使用 utilityProcess

```javascript
// Electron 22+ 推荐
const { utilityProcess } = require("electron");

const child = utilityProcess.fork(path.join(__dirname, "worker.js"));

child.postMessage({ type: "process", data: largeData });

child.on("message", (result) => {
  console.log("处理结果:", result);
});
```

---

## 问题 4：如何分片处理？

```javascript
// 将大任务分成小块
async function processLargeData(data) {
  const chunkSize = 1000;
  const results = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const result = processChunk(chunk);
    results.push(result);

    // 让出主线程
    await new Promise((resolve) => setImmediate(resolve));
  }

  return results;
}
```

---

## 问题 5：监控主进程性能

```javascript
// 监控事件循环延迟
const start = process.hrtime.bigint();

setImmediate(() => {
  const delay = Number(process.hrtime.bigint() - start) / 1e6;
  if (delay > 100) {
    console.warn(`事件循环延迟: ${delay}ms`);
  }
});

// 定期检查
setInterval(() => {
  const start = process.hrtime.bigint();
  setImmediate(() => {
    const delay = Number(process.hrtime.bigint() - start) / 1e6;
    if (delay > 50) {
      console.warn(`主进程可能阻塞: ${delay}ms`);
    }
  });
}, 1000);
```

## 延伸阅读

- [Node.js 子进程](https://nodejs.org/api/child_process.html)
- [utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)
- [Electron 性能](https://www.electronjs.org/docs/latest/tutorial/performance)
