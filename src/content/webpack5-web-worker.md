---
title: Webpack5 对 Web Worker 的支持？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  了解 Webpack 5 对 Web Worker 的原生支持，掌握如何在项目中使用 Worker。
tags:
  - Webpack
  - Webpack5
  - Web Worker
  - 多线程
estimatedTime: 10 分钟
keywords:
  - Web Worker
  - Worker 支持
  - 多线程
  - Webpack5
highlight: Webpack 5 原生支持 Web Worker，无需额外 loader，直接使用 new Worker() 语法即可自动打包。
order: 666
---

## 问题 1：Webpack 5 的 Worker 支持

**Webpack 5 原生支持 Web Worker**，无需 worker-loader：

```javascript
// Webpack 4：需要 worker-loader
import Worker from "worker-loader!./worker.js";

// Webpack 5：原生支持
const worker = new Worker(new URL("./worker.js", import.meta.url));
```

---

## 问题 2：基本使用

### worker.js

```javascript
// worker.js
self.onmessage = (event) => {
  const result = heavyComputation(event.data);
  self.postMessage(result);
};

function heavyComputation(data) {
  // 耗时计算
  return data * 2;
}
```

### 主线程

```javascript
// main.js
const worker = new Worker(new URL("./worker.js", import.meta.url));

worker.postMessage(100);

worker.onmessage = (event) => {
  console.log("Result:", event.data); // 200
};
```

---

## 问题 3：为什么使用 new URL()？

```javascript
// 这种语法让 Webpack 能够识别并打包 worker 文件
new URL("./worker.js", import.meta.url);

// Webpack 会：
// 1. 识别这是一个 Worker 入口
// 2. 单独打包 worker.js
// 3. 生成正确的 URL
```

---

## 问题 4：SharedWorker 和 ServiceWorker

Webpack 5 也支持其他类型的 Worker：

```javascript
// SharedWorker
const sharedWorker = new SharedWorker(
  new URL("./shared-worker.js", import.meta.url)
);

// ServiceWorker
navigator.serviceWorker.register(
  new URL("./service-worker.js", import.meta.url)
);
```

---

## 问题 5：TypeScript 支持

```typescript
// worker.ts
const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent<number>) => {
  ctx.postMessage(event.data * 2);
};

// main.ts
const worker = new Worker(new URL("./worker.ts", import.meta.url));
```

需要配置 tsconfig.json：

```json
{
  "compilerOptions": {
    "lib": ["WebWorker"]
  }
}
```

---

## 问题 6：配置选项

```javascript
module.exports = {
  output: {
    // Worker 文件的输出配置
    workerChunkLoading: "import-scripts", // 或 'import'
  },
};
```

## 延伸阅读

- [Web Workers](https://webpack.js.org/guides/web-workers/)
- [Worker 语法](https://developer.mozilla.org/en-US/docs/Web/API/Worker)
