---
title: computed() 的内部实现机制？
category: Vue
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  深入理解 Vue computed 的实现原理，掌握惰性求值、缓存机制和依赖追踪的工作方式。
tags:
  - Vue
  - computed
  - 响应式
  - 缓存
estimatedTime: 18 分钟
keywords:
  - computed 原理
  - 惰性求值
  - 缓存机制
highlight: computed 通过 dirty 标志实现缓存，只有依赖变化时才重新计算，且是惰性求值的。
order: 461
---

## 问题 1：computed 的核心特性

`computed` 有两个核心特性：

1. **缓存**：只有依赖变化时才重新计算
2. **惰性求值**：只有被访问时才计算

```javascript
const count = ref(0);
const double = computed(() => {
  console.log("计算中...");
  return count.value * 2;
});

// 第一次访问，执行计算
console.log(double.value); // 输出: 计算中... 0

// 再次访问，使用缓存，不重新计算
console.log(double.value); // 输出: 0（没有"计算中..."）

// 依赖变化后访问，重新计算
count.value = 1;
console.log(double.value); // 输出: 计算中... 2
```

---

## 问题 2：computed 的简化实现

```javascript
function computed(getter) {
  let value; // 缓存的值
  let dirty = true; // 是否需要重新计算

  // 创建一个 effect，但不立即执行（lazy）
  const effect = new ReactiveEffect(getter, () => {
    // 调度器：依赖变化时，只标记 dirty，不立即计算
    if (!dirty) {
      dirty = true;
      // 通知依赖 computed 的 effect
      triggerRefValue(obj);
    }
  });

  const obj = {
    get value() {
      // 只有 dirty 时才重新计算
      if (dirty) {
        value = effect.run();
        dirty = false;
      }
      // 收集依赖 computed 的 effect
      trackRefValue(obj);
      return value;
    },
  };

  return obj;
}
```

---

## 问题 3：dirty 标志的作用

`dirty` 是实现缓存的关键：

```javascript
const count = ref(0);
const double = computed(() => count.value * 2);

// 初始状态：dirty = true
double.value; // dirty=true，执行计算，设置 dirty=false

// 再次访问：dirty = false
double.value; // dirty=false，直接返回缓存值

// 依赖变化：dirty 被设为 true
count.value = 1; // 触发调度器，dirty=true

// 下次访问：dirty = true
double.value; // dirty=true，重新计算
```

### 为什么不在依赖变化时立即计算？

因为 computed 是**惰性**的：

```javascript
const expensive = computed(() => {
  // 复杂计算
  return heavyCalculation();
});

count.value = 1; // 只标记 dirty，不计算
count.value = 2; // 只标记 dirty，不计算
count.value = 3; // 只标记 dirty，不计算

// 只有真正访问时才计算一次
console.log(expensive.value);
```

---

## 问题 4：computed 的依赖收集

computed 既是**依赖的消费者**，也是**依赖的提供者**：

```javascript
const firstName = ref("John");
const lastName = ref("Doe");

// computed 依赖 firstName 和 lastName
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

// 模板依赖 fullName
// <div>{{ fullName }}</div>
```

### 依赖关系图

```
firstName ──┐
            ├──→ fullName ──→ 组件渲染 effect
lastName ───┘
```

### 更新流程

```
1. firstName.value = 'Jane'
2. 触发 fullName 的调度器，dirty = true
3. 触发组件渲染 effect
4. 渲染时访问 fullName.value
5. dirty=true，重新计算 fullName
6. 返回新值，更新 DOM
```

---

## 问题 5：computed 与 method 的区别

```javascript
// computed：有缓存
const double = computed(() => count.value * 2);

// method：每次调用都执行
function getDouble() {
  return count.value * 2;
}
```

```html
<template>
  <!-- computed：多次使用只计算一次 -->
  <div>{{ double }}</div>
  <div>{{ double }}</div>
  <div>{{ double }}</div>

  <!-- method：每次都重新计算 -->
  <div>{{ getDouble() }}</div>
  <div>{{ getDouble() }}</div>
  <div>{{ getDouble() }}</div>
</template>
```

---

## 问题 6：可写的 computed

```javascript
const firstName = ref("John");
const lastName = ref("Doe");

const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  set(newValue) {
    const [first, last] = newValue.split(" ");
    firstName.value = first;
    lastName.value = last;
  },
});

// 读取
console.log(fullName.value); // 'John Doe'

// 写入
fullName.value = "Jane Smith";
console.log(firstName.value); // 'Jane'
console.log(lastName.value); // 'Smith'
```

## 延伸阅读

- [Vue 官方文档 - computed](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue 源码 - computed 实现](https://github.com/vuejs/core/blob/main/packages/reactivity/src/computed.ts)
