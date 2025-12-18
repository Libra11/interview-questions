---
title: 为什么 watchEffect 会立即执行？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 watchEffect 立即执行的设计原因，掌握它与 watch 的核心区别和适用场景。
tags:
  - Vue
  - watchEffect
  - watch
  - 响应式
estimatedTime: 12 分钟
keywords:
  - watchEffect
  - 立即执行
  - 依赖收集
highlight: watchEffect 必须立即执行才能自动收集依赖，这是它"自动追踪"特性的基础。
order: 464
---

## 问题 1：watchEffect 为什么要立即执行？

`watchEffect` 立即执行是为了**自动收集依赖**。

```javascript
const count = ref(0);

watchEffect(() => {
  console.log(count.value); // 立即输出: 0
});

// 对比 watch：需要显式指定依赖
watch(count, (newVal) => {
  console.log(newVal); // 不会立即执行
});
```

### 依赖收集原理

Vue 的响应式系统通过**访问**来收集依赖：

```javascript
watchEffect(() => {
  // 执行这个函数时，访问了 count.value
  // Vue 就知道这个 effect 依赖 count
  console.log(count.value);
});
```

如果不立即执行，Vue 就无法知道这个函数依赖哪些响应式数据。

---

## 问题 2：watchEffect vs watch 的区别

### watchEffect：自动追踪

```javascript
const firstName = ref("John");
const lastName = ref("Doe");

// 自动追踪所有访问的响应式数据
watchEffect(() => {
  console.log(`${firstName.value} ${lastName.value}`);
});

// firstName 或 lastName 变化都会触发
```

### watch：显式指定

```javascript
// 需要明确指定监听的数据
watch([firstName, lastName], ([first, last]) => {
  console.log(`${first} ${last}`);
});

// 或者监听单个
watch(firstName, (newVal) => {
  console.log(newVal);
});
```

### 核心区别对比

| 特性     | watchEffect | watch            |
| -------- | ----------- | ---------------- |
| 立即执行 | 是          | 默认否（可配置） |
| 依赖收集 | 自动        | 手动指定         |
| 访问旧值 | 不能        | 能               |
| 适用场景 | 副作用同步  | 数据变化响应     |

---

## 问题 3：watchEffect 的执行时机

```javascript
const count = ref(0);

watchEffect(() => {
  console.log("effect:", count.value);
});

console.log("同步代码");
count.value = 1;
count.value = 2;
console.log("修改完成");

// 输出顺序：
// effect: 0        ← 立即执行
// 同步代码
// 修改完成
// effect: 2        ← 异步批量执行，只执行一次
```

### 为什么修改两次只执行一次？

Vue 会将多次修改**批量处理**，在下一个微任务中统一执行 effect，避免重复计算。

---

## 问题 4：如何让 watch 也立即执行？

```javascript
const count = ref(0);

// 使用 immediate 选项
watch(
  count,
  (newVal, oldVal) => {
    console.log(`${oldVal} -> ${newVal}`);
  },
  { immediate: true }
);

// 输出: undefined -> 0
```

### 什么时候用 watch + immediate？

当你需要**访问旧值**，但又想立即执行时：

```javascript
watch(
  searchQuery,
  async (newQuery, oldQuery) => {
    // 可以对比新旧值
    if (newQuery !== oldQuery) {
      results.value = await search(newQuery);
    }
  },
  { immediate: true }
);
```

---

## 问题 5：watchEffect 的清理机制

```javascript
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    console.log(count.value);
  }, 1000);

  // 在下次执行前或组件卸载时调用
  onCleanup(() => {
    clearInterval(timer);
  });
});
```

### 清理函数的执行时机

1. **依赖变化时**：在重新执行 effect 之前
2. **组件卸载时**：清理所有副作用

```javascript
const id = ref(1);

watchEffect(async (onCleanup) => {
  const controller = new AbortController();

  onCleanup(() => {
    // id 变化时，取消之前的请求
    controller.abort();
  });

  const data = await fetch(`/api/${id.value}`, {
    signal: controller.signal,
  });
});
```

## 延伸阅读

- [Vue 官方文档 - watchEffect](https://cn.vuejs.org/api/reactivity-core.html#watcheffect)
- [Vue 官方文档 - watch vs watchEffect](https://cn.vuejs.org/guide/essentials/watchers.html#watch-vs-watcheffect)
