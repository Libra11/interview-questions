---
title: nextTick 的原理是什么？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 nextTick 的实现原理和使用场景。
tags:
  - Vue
  - nextTick
  - 异步更新
  - 微任务
estimatedTime: 12 分钟
keywords:
  - nextTick
  - 异步更新
  - Promise
highlight: nextTick 利用 Promise 微任务，在 DOM 更新后执行回调。
order: 264
---

## 问题 1：为什么需要 nextTick？

Vue 的 DOM 更新是**异步**的：

```javascript
const count = ref(0);

count.value = 1;
console.log(document.querySelector("#count").textContent);
// 输出 0，DOM 还没更新

await nextTick();
console.log(document.querySelector("#count").textContent);
// 输出 1，DOM 已更新
```

---

## 问题 2：Vue3 实现

```javascript
// Vue3 源码简化版
const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;

export function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(fn) : p;
}
```

### 使用方式

```javascript
// 方式一：回调函数
nextTick(() => {
  // DOM 已更新
});

// 方式二：async/await
await nextTick();
// DOM 已更新
```

---

## 问题 3：与调度器的关系

```javascript
// 响应式数据变化时
count.value++;

// 1. 触发 effect.scheduler
// 2. queueJob(componentUpdate)
// 3. queueFlush() 创建 currentFlushPromise

// nextTick 等待这个 Promise
await nextTick();
// flushJobs 已执行完毕，DOM 已更新
```

### 时序图

```
count.value++
      ↓
queueFlush()
      ↓
currentFlushPromise = Promise.resolve().then(flushJobs)
      ↓
nextTick() 返回 currentFlushPromise
      ↓
[微任务队列执行]
      ↓
flushJobs() → DOM 更新
      ↓
nextTick 回调执行
```

---

## 问题 4：Vue2 vs Vue3

### Vue2

```javascript
// Vue2 使用降级策略
// Promise → MutationObserver → setImmediate → setTimeout

if (typeof Promise !== "undefined") {
  timerFunc = () => Promise.resolve().then(flushCallbacks);
} else if (typeof MutationObserver !== "undefined") {
  // ...
} else if (typeof setImmediate !== "undefined") {
  // ...
} else {
  timerFunc = () => setTimeout(flushCallbacks, 0);
}
```

### Vue3

```javascript
// Vue3 只使用 Promise
// 因为 Vue3 不支持 IE11
const resolvedPromise = Promise.resolve();
```

---

## 问题 5：常见使用场景

### 获取更新后的 DOM

```vue
<script setup>
const inputRef = ref(null);
const show = ref(false);

async function showInput() {
  show.value = true;
  await nextTick();
  inputRef.value.focus(); // 元素已渲染
}
</script>

<template>
  <input v-if="show" ref="inputRef" />
  <button @click="showInput">显示</button>
</template>
```

### 获取更新后的尺寸

```javascript
const height = ref(0);
const content = ref("short");

async function updateContent() {
  content.value = "very long content...";
  await nextTick();
  height.value = element.offsetHeight;
}
```

### 批量更新后操作

```javascript
async function batchUpdate() {
  items.value.push(item1);
  items.value.push(item2);
  items.value.push(item3);

  await nextTick();
  // 所有项都已渲染
  scrollToBottom();
}
```

---

## 问题 6：与 watch flush: 'post' 的区别

```javascript
// watch flush: 'post'
watch(
  count,
  (val) => {
    console.log("watch:", document.querySelector("#count").textContent);
  },
  { flush: "post" }
);

// nextTick
watch(count, async (val) => {
  await nextTick();
  console.log("nextTick:", document.querySelector("#count").textContent);
});

// 两者效果相同，但 flush: 'post' 更语义化
```

---

## 问题 7：注意事项

### 不要过度使用

```javascript
// ❌ 不必要的 nextTick
const doubled = computed(() => count.value * 2);
await nextTick();
console.log(doubled.value); // computed 是同步的

// ✅ 直接使用
console.log(doubled.value);
```

### 多次调用合并

```javascript
// 多次 nextTick 会合并到同一个微任务
nextTick(() => console.log(1));
nextTick(() => console.log(2));
nextTick(() => console.log(3));

// 输出顺序：1, 2, 3
// 都在同一个微任务中执行
```

---

## 问题 8：手动实现

```javascript
function myNextTick(fn) {
  return new Promise((resolve) => {
    // 使用 queueMicrotask 或 Promise
    queueMicrotask(() => {
      fn?.();
      resolve();
    });
  });
}

// 或更简单
const myNextTick = (fn) => Promise.resolve().then(fn);
```

## 延伸阅读

- [Vue 官方文档 - nextTick](https://cn.vuejs.org/api/general.html#nexttick)
- [JavaScript 事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop)
