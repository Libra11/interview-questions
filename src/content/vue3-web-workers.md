---
title: 如何在 Vue3 中使用 Web Workers？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握在 Vue3 中使用 Web Workers 处理耗时任务的方法，避免阻塞主线程。
tags:
  - Vue
  - Web Workers
  - 性能优化
  - 多线程
estimatedTime: 15 分钟
keywords:
  - Web Workers
  - 多线程
  - 性能优化
highlight: Web Workers 在独立线程执行耗时任务，配合 Vue3 的响应式系统实现非阻塞的数据处理。
order: 249
---

## 问题 1：为什么需要 Web Workers？

JavaScript 是单线程的，耗时任务会阻塞 UI：

```javascript
// ❌ 阻塞主线程
function heavyComputation() {
  // 耗时计算...
  for (let i = 0; i < 1e9; i++) {
    // 页面会卡住
  }
}
```

Web Workers 在**独立线程**执行，不阻塞主线程。

---

## 问题 2：基本使用方式

### 创建 Worker 文件

```javascript
// workers/heavy.worker.js
self.onmessage = function (e) {
  const { data } = e;

  // 执行耗时计算
  const result = heavyComputation(data);

  // 返回结果
  self.postMessage(result);
};

function heavyComputation(data) {
  // 耗时操作...
  return processedData;
}
```

### 在 Vue 组件中使用

```vue
<script setup>
import { ref, onUnmounted } from "vue";

const result = ref(null);
const loading = ref(false);

// 创建 Worker
const worker = new Worker(
  new URL("../workers/heavy.worker.js", import.meta.url),
  { type: "module" }
);

// 接收结果
worker.onmessage = (e) => {
  result.value = e.data;
  loading.value = false;
};

// 发送任务
function startComputation(data) {
  loading.value = true;
  worker.postMessage(data);
}

// 清理
onUnmounted(() => {
  worker.terminate();
});
</script>
```

---

## 问题 3：封装成 Composable

```javascript
// composables/useWorker.js
import { ref, onUnmounted, shallowRef } from "vue";

export function useWorker(workerFactory) {
  const result = shallowRef(null);
  const error = ref(null);
  const loading = ref(false);

  let worker = null;

  function init() {
    worker = workerFactory();

    worker.onmessage = (e) => {
      result.value = e.data;
      loading.value = false;
    };

    worker.onerror = (e) => {
      error.value = e.message;
      loading.value = false;
    };
  }

  function run(data) {
    if (!worker) init();
    loading.value = true;
    error.value = null;
    worker.postMessage(data);
  }

  function terminate() {
    worker?.terminate();
    worker = null;
  }

  onUnmounted(terminate);

  return { result, error, loading, run, terminate };
}
```

### 使用

```vue
<script setup>
import { useWorker } from "@/composables/useWorker";

const { result, loading, run } = useWorker(
  () =>
    new Worker(new URL("../workers/heavy.worker.js", import.meta.url), {
      type: "module",
    })
);

function handleClick() {
  run({ data: largeDataset });
}
</script>

<template>
  <button @click="handleClick" :disabled="loading">
    {{ loading ? "处理中..." : "开始计算" }}
  </button>
  <div v-if="result">{{ result }}</div>
</template>
```

---

## 问题 4：使用 VueUse

```javascript
import { useWebWorkerFn } from "@vueuse/core";

const { workerFn, workerStatus, workerTerminate } = useWebWorkerFn(
  // 要在 Worker 中执行的函数
  (data) => {
    // 这个函数在 Worker 线程执行
    let result = 0;
    for (let i = 0; i < data.iterations; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }
);

// 使用
async function compute() {
  const result = await workerFn({ iterations: 1e8 });
  console.log(result);
}
```

---

## 问题 5：Transferable Objects

对于大型数据，使用 Transferable 避免复制：

```javascript
// 主线程
const buffer = new ArrayBuffer(1024 * 1024); // 1MB

// 普通传输：复制数据
worker.postMessage(buffer);

// Transferable：转移所有权，零拷贝
worker.postMessage(buffer, [buffer]);
// 注意：传输后 buffer 在主线程不可用
```

### 在 Vue 中使用

```vue
<script setup>
function processLargeData(imageData) {
  const buffer = imageData.data.buffer;

  worker.postMessage(
    { buffer, width: imageData.width, height: imageData.height },
    [buffer] // 转移 buffer
  );
}
</script>
```

---

## 问题 6：Comlink 简化通信

```javascript
// worker.js
import * as Comlink from "comlink";

const api = {
  async heavyTask(data) {
    // 耗时操作
    return result;
  },

  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  },
};

Comlink.expose(api);
```

```vue
<script setup>
import * as Comlink from "comlink";

const worker = new Worker(
  new URL("../workers/api.worker.js", import.meta.url),
  { type: "module" }
);

const api = Comlink.wrap(worker);

// 像调用普通函数一样使用
async function compute() {
  const result = await api.heavyTask(data);
  // 或
  const fib = await api.fibonacci(40);
}
</script>
```

---

## 问题 7：常见使用场景

### 图片处理

```javascript
// worker
self.onmessage = async (e) => {
  const { imageData, filter } = e.data;
  const processed = applyFilter(imageData, filter);
  self.postMessage(processed, [processed.data.buffer]);
};
```

### 数据处理

```javascript
// worker
self.onmessage = (e) => {
  const { data, sortKey } = e.data;
  const sorted = data.sort((a, b) => a[sortKey] - b[sortKey]);
  self.postMessage(sorted);
};
```

### 加密/解密

```javascript
// worker
import { encrypt, decrypt } from "crypto-lib";

self.onmessage = async (e) => {
  const { action, data, key } = e.data;
  const result =
    action === "encrypt" ? await encrypt(data, key) : await decrypt(data, key);
  self.postMessage(result);
};
```

## 延伸阅读

- [MDN - Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
- [VueUse - useWebWorkerFn](https://vueuse.org/core/useWebWorkerFn/)
- [Comlink](https://github.com/GoogleChromeLabs/comlink)
