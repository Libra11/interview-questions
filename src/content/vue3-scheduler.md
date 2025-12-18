---
title: scheduler（调度器）原理是什么？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 调度器的工作原理，掌握更新队列和批量处理机制。
tags:
  - Vue
  - scheduler
  - 调度器
  - 源码
estimatedTime: 15 分钟
keywords:
  - Vue scheduler
  - 调度器
  - 更新队列
highlight: 调度器负责收集更新任务，在微任务中批量执行，避免重复渲染。
order: 605
---

## 问题 1：调度器的作用

调度器解决的问题：

```javascript
// 没有调度器：每次修改都触发更新
count.value = 1; // 触发更新
count.value = 2; // 触发更新
count.value = 3; // 触发更新
// 共 3 次更新

// 有调度器：批量处理
count.value = 1; // 加入队列
count.value = 2; // 加入队列
count.value = 3; // 加入队列
// 微任务中执行 1 次更新
```

---

## 问题 2：核心数据结构

```javascript
// 简化的调度器实现
const queue = []; // 更新任务队列
const pendingPostFlushCbs = []; // 后置回调队列
let isFlushing = false; // 是否正在执行
let isFlushPending = false; // 是否等待执行

const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;
```

---

## 问题 3：任务入队

```javascript
function queueJob(job) {
  // 去重：相同任务不重复入队
  if (!queue.includes(job)) {
    queue.push(job);
  }

  // 触发执行
  queueFlush();
}

function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    // 在微任务中执行
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
```

---

## 问题 4：执行队列

```javascript
function flushJobs() {
  isFlushPending = false;
  isFlushing = true;

  // 排序：父组件先于子组件更新
  queue.sort((a, b) => a.id - b.id);

  try {
    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];
      if (job) {
        job();
      }
    }
  } finally {
    // 清空队列
    queue.length = 0;

    // 执行后置回调（如 watch 的回调）
    flushPostFlushCbs();

    isFlushing = false;

    // 如果执行过程中有新任务，继续执行
    if (queue.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}
```

---

## 问题 5：组件更新调度

```javascript
// 组件 effect 的调度器
const effect = new ReactiveEffect(componentUpdateFn, () => {
  // 不立即执行，而是加入队列
  queueJob(instance.update);
});

instance.update = () => {
  if (effect.dirty) {
    effect.run();
  }
};

// 组件 id 用于排序
instance.update.id = instance.uid;
```

---

## 问题 6：watch 的调度

```javascript
function watch(source, cb, options) {
  const job = () => {
    // 执行回调
    cb(newValue, oldValue);
  };

  if (options.flush === "sync") {
    // 同步执行
    job();
  } else if (options.flush === "post") {
    // DOM 更新后执行
    queuePostFlushCb(job);
  } else {
    // 默认：组件更新前执行
    queueJob(job);
  }
}
```

### flush 选项

```javascript
watch(source, callback, {
  flush: 'pre'   // 默认，组件更新前
  flush: 'post'  // 组件更新后
  flush: 'sync'  // 同步执行
})
```

---

## 问题 7：nextTick 实现

```javascript
function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}

// 使用
await nextTick();
// 此时 DOM 已更新
```

### 原理

```javascript
count.value++;
// 触发 queueJob，创建 currentFlushPromise

await nextTick();
// 等待 currentFlushPromise 完成
// 即等待 flushJobs 执行完毕
```

---

## 问题 8：完整流程

```
响应式数据变化
      ↓
触发 effect.scheduler
      ↓
queueJob(update)
      ↓
queueFlush()
      ↓
Promise.resolve().then(flushJobs)
      ↓
[微任务队列]
      ↓
flushJobs()
  ├── 排序队列
  ├── 执行组件更新
  ├── 执行 pre watch
  └── flushPostFlushCbs()
        ├── 执行 post watch
        └── 执行 nextTick 回调
```

### 代码示例

```javascript
const count = ref(0);

watch(count, () => console.log("watch"), { flush: "post" });

count.value++;
console.log("sync");

nextTick(() => console.log("nextTick"));

// 输出顺序：
// sync
// watch
// nextTick
```

## 延伸阅读

- [Vue 3 源码 - scheduler.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/scheduler.ts)
