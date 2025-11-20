---
title: Vue computed 和普通函数有何区别？
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  对比 Vue 计算属性 (computed) 和普通方法 (methods) 的区别，重点解析缓存机制、响应式依赖追踪和使用场景。
tags:
  - Vue
  - Computed
  - Methods
  - Reactivity
estimatedTime: 12 分钟
keywords:
  - computed vs methods
  - vue caching
  - reactive dependencies
  - computed properties
highlight: computed 具有缓存机制，只有依赖的响应式数据变化时才重新计算；而普通函数每次调用都会执行，无缓存。
order: 150
---

## 问题 1：核心区别是什么？

| 特性 | computed | methods |
|------|----------|---------|
| **缓存** | ✅ 有缓存 | ❌ 无缓存 |
| **依赖追踪** | ✅ 自动追踪响应式依赖 | ❌ 不追踪 |
| **调用方式** | 作为属性访问 | 作为函数调用 |
| **执行时机** | 依赖变化时 | 每次调用时 |

---

## 问题 2：缓存机制详解

### computed（有缓存）

```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)

const doubleCount = computed(() => {
  console.log('computed executed')
  return count.value * 2
})
</script>

<template>
  <div>
    <!-- 多次访问，只执行一次计算 -->
    <p>{{ doubleCount }}</p>
    <p>{{ doubleCount }}</p>
    <p>{{ doubleCount }}</p>
  </div>
</template>
```

**输出**：`computed executed` 只打印一次。

### methods（无缓存）

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function getDoubleCount() {
  console.log('method executed')
  return count.value * 2
}
</script>

<template>
  <div>
    <!-- 每次调用都执行 -->
    <p>{{ getDoubleCount() }}</p>
    <p>{{ getDoubleCount() }}</p>
    <p>{{ getDoubleCount() }}</p>
  </div>
</template>
```

**输出**：`method executed` 打印三次。

---

## 问题 3：何时使用 computed？

### 1. 需要基于响应式数据进行计算

```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// ✅ 使用 computed
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})
</script>
```

### 2. 计算开销较大，需要缓存

```vue
<script setup>
import { ref, computed } from 'vue'

const list = ref([/* 大量数据 */])

// ✅ 使用 computed，避免重复计算
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})
</script>
```

### 3. 模板中多次使用同一计算结果

```vue
<template>
  <!-- 使用 computed，只计算一次 -->
  <div>{{ expensiveComputation }}</div>
  <div>{{ expensiveComputation }}</div>
</template>
```

---

## 问题 4：何时使用 methods？

### 1. 需要传递参数

```vue
<script setup>
// ❌ computed 不支持参数
// const formatPrice = computed((price) => { ... })

// ✅ 使用 methods
function formatPrice(price) {
  return `$${price.toFixed(2)}`
}
</script>

<template>
  <div>{{ formatPrice(19.99) }}</div>
</template>
```

### 2. 执行副作用操作

```vue
<script setup>
// ✅ 使用 methods
function handleClick() {
  console.log('Button clicked')
  // 发送 API 请求
  // 修改多个状态
}
</script>

<template>
  <button @click="handleClick">Click</button>
</template>
```

### 3. 每次都需要重新执行

```vue
<script setup>
// ✅ 使用 methods，每次都获取最新时间
function getCurrentTime() {
  return new Date().toLocaleTimeString()
}
</script>

<template>
  <!-- 每次渲染都获取最新时间 -->
  <div>{{ getCurrentTime() }}</div>
</template>
```

---

## 问题 5：注意事项

### 1. computed 应该是纯函数

```vue
<script setup>
// ❌ 不要在 computed 中修改状态
const badComputed = computed(() => {
  count.value++ // 错误！
  return count.value
})

// ✅ 只读取和计算
const goodComputed = computed(() => {
  return count.value * 2
})
</script>
```

### 2. computed 不支持异步

```vue
<script setup>
// ❌ computed 不支持 async
const asyncComputed = computed(async () => {
  const data = await fetchData()
  return data
})

// ✅ 使用 watchEffect 或自定义 Hook
watchEffect(async () => {
  data.value = await fetchData()
})
</script>
```

### 3. 依赖非响应式数据时不会更新

```vue
<script setup>
let normalVar = 10 // 非响应式

// ❌ normalVar 变化时不会重新计算
const result = computed(() => {
  return normalVar * 2
})
</script>
```

## 总结

**核心概念总结**：

### 1. 选择 computed
- 基于响应式数据的派生状态
- 计算开销大，需要缓存
- 模板中多次使用

### 2. 选择 methods
- 需要传递参数
- 执行副作用
- 每次都需要重新执行

### 3. 性能考虑
computed 的缓存机制可以显著提升性能，但只有在依赖是响应式数据时才有效。

## 延伸阅读

- [Vue 官方文档 - 计算属性](https://cn.vuejs.org/guide/essentials/computed.html)
