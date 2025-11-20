---
title: Vue useTemplateRef 的作用是什么？
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  介绍 Vue 3.5+ 引入的 useTemplateRef API，解析它如何简化模板引用的获取，以及与传统 ref 方式的区别。
tags:
  - Vue
  - Template Refs
  - useTemplateRef
  - Composition API
estimatedTime: 10 分钟
keywords:
  - useTemplateRef
  - template refs
  - vue 3.5
  - ref attribute
highlight: useTemplateRef 是 Vue 3.5 引入的新 API，提供了更明确和类型安全的方式来获取模板引用，避免了 ref 名称冲突问题。
order: 142
---

## 问题 1：什么是 useTemplateRef？

`useTemplateRef` 是 Vue 3.5+ 引入的一个新的组合式 API，专门用于获取**模板引用**（Template Refs）。

在此之前，我们通常使用 `ref()` 来创建一个响应式引用，然后在模板中通过 `ref` 属性绑定同名变量来获取 DOM 元素或组件实例。这种方式虽然可行，但存在一些问题：

1. **命名冲突**：响应式数据的 ref 和模板引用的 ref 使用同一个变量，容易混淆。
2. **类型推导**：TypeScript 难以准确推导模板引用的类型。

---

## 问题 2：如何使用 useTemplateRef？

### 传统方式 (Vue 3.0 - 3.4)

```vue
<script setup>
import { ref, onMounted } from 'vue'

// 创建一个 ref，名称需要与模板中的 ref 属性匹配
const inputRef = ref(null)

onMounted(() => {
  inputRef.value.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

### 新方式 (Vue 3.5+)

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

// 更明确的语义：这是一个模板引用
const inputRef = useTemplateRef('inputRef')

onMounted(() => {
  inputRef.value.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

---

## 问题 3：useTemplateRef 的优势是什么？

### 1. 语义更清晰

`useTemplateRef` 明确表示这是一个模板引用，而不是普通的响应式数据，提高了代码可读性。

### 2. 避免命名冲突

```vue
<script setup>
import { ref, useTemplateRef } from 'vue'

// 响应式数据
const count = ref(0)

// 模板引用（不会冲突）
const buttonRef = useTemplateRef('myButton')
</script>
```

### 3. 更好的 TypeScript 支持

```typescript
<script setup lang="ts">
import { useTemplateRef } from 'vue'

// 可以明确指定元素类型
const inputRef = useTemplateRef<HTMLInputElement>('input')

// TypeScript 会正确推导类型
inputRef.value?.focus() // ✅ 类型安全
</script>
```

### 4. 支持动态 ref

```vue
<script setup>
import { useTemplateRef } from 'vue'

const dynamicRef = useTemplateRef('dynamic')
</script>

<template>
  <div :ref="someCondition ? 'dynamic' : null">
    Content
  </div>
</template>
```

## 总结

**核心概念总结**：

### 1. 定义
`useTemplateRef` 是专门用于获取模板引用的组合式 API。

### 2. 优势
- 语义更明确，代码更易读。
- 避免与响应式 ref 混淆。
- 提供更好的 TypeScript 类型推导。

### 3. 兼容性
Vue 3.5+ 可用，向后兼容传统的 `ref()` 方式。

## 延伸阅读

- [Vue 3.5 发布说明](https://blog.vuejs.org/posts/vue-3-5)
- [Vue 官方文档 - 模板引用](https://cn.vuejs.org/guide/essentials/template-refs.html)
