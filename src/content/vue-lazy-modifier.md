---
title: Vue 输入绑定修饰符 .lazy 的作用
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  介绍 Vue v-model 的 .lazy 修饰符，解析它如何改变数据同步的时机，从 input 事件改为 change 事件，以及适用场景。
tags:
  - Vue
  - v-model
  - Modifiers
  - Form Input
estimatedTime: 8 分钟
keywords:
  - v-model.lazy
  - lazy modifier
  - input binding
  - change event
highlight: .lazy 修饰符将 v-model 的更新时机从每次输入（input 事件）改为失去焦点或按下回车（change 事件），减少不必要的更新。
order: 429
---

## 问题 1：.lazy 修饰符的作用是什么？

默认情况下，`v-model` 在每次 `input` 事件触发后都会同步数据（即用户每输入一个字符，数据就更新一次）。

添加 `.lazy` 修饰符后，`v-model` 会改为在 `change` 事件触发时才同步数据。

### 触发时机对比

| 修饰符 | 监听事件 | 触发时机 |
|--------|---------|---------|
| 无 | `input` | 每次输入字符 |
| `.lazy` | `change` | 失去焦点 或 按下回车 |

---

## 问题 2：使用示例

### 默认行为（实时同步）

```vue
<script setup>
import { ref } from 'vue'
const message = ref('')
</script>

<template>
  <input v-model="message" />
  <p>{{ message }}</p>
  <!-- 每输入一个字符，message 就更新，p 标签也重新渲染 -->
</template>
```

### 使用 .lazy（延迟同步）

```vue
<template>
  <input v-model.lazy="message" />
  <p>{{ message }}</p>
  <!-- 只有在失去焦点或按回车时，message 才更新 -->
</template>
```

---

## 问题 3：适用场景

### 1. 性能优化
当输入框绑定的数据会触发复杂的计算或渲染时，使用 `.lazy` 可以减少不必要的更新。

```vue
<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')

// 假设这是一个开销很大的计算
const filteredResults = computed(() => {
  return expensiveFilter(searchQuery.value)
})
</script>

<template>
  <!-- 使用 .lazy 避免每次输入都触发过滤 -->
  <input v-model.lazy="searchQuery" />
</template>
```

### 2. 表单验证
只在用户完成输入后才进行验证，而不是每输入一个字符就验证。

```vue
<template>
  <input v-model.lazy="email" @change="validateEmail" />
  <span v-if="emailError">{{ emailError }}</span>
</template>
```

### 3. 避免频繁的 API 请求
配合防抖（debounce）使用，或者直接用 `.lazy` 减少请求次数。

```vue
<template>
  <!-- 只在失去焦点时才发送搜索请求 -->
  <input v-model.lazy="keyword" @change="search" />
</template>
```

---

## 问题 4：注意事项

### 1. 不适用于实时搜索
如果需要实时搜索（如搜索框自动补全），不应该使用 `.lazy`，而应该使用防抖（debounce）。

### 2. 可以与其他修饰符组合

```vue
<!-- 同时使用 .lazy 和 .trim -->
<input v-model.lazy.trim="username" />
```

## 总结

**核心概念总结**：

### 1. 作用
将 `v-model` 的同步时机从 `input` 事件改为 `change` 事件。

### 2. 适用场景
- 性能优化（减少更新频率）
- 表单验证（完成输入后再验证）
- 避免频繁的副作用

### 3. 不适用场景
需要实时反馈的场景（如实时搜索、字符计数）。

## 延伸阅读

- [Vue 官方文档 - v-model 修饰符](https://cn.vuejs.org/guide/essentials/forms.html#modifiers)
