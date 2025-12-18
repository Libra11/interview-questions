---
title: Vue 条件插槽 (Conditional Slots) 介绍
category: Vue
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  介绍如何在 Vue 组件中检测插槽是否存在，从而实现根据插槽内容动态渲染包裹元素或备用内容。
tags:
  - Vue
  - Slots
  - Conditional Rendering
estimatedTime: 10 分钟
keywords:
  - conditional slots
  - $slots
  - useSlots
  - scoped slots
highlight: 通过检查 $slots 对象，我们可以判断父组件是否传递了特定插槽的内容，从而优化组件的 DOM 结构。
order: 419
---

## 问题 1：什么是条件插槽？

在开发通用组件时，我们经常需要根据**父组件是否提供了插槽内容**来决定是否渲染某些 DOM 元素。

例如，一个 `Card` 组件，只有当父组件传递了 `header` 插槽内容时，才渲染 `<div class="card-header">` 容器。如果父组件没传，渲染一个空的 div 是不必要的，甚至可能破坏布局（如 padding/border）。

---

## 问题 2：如何检测插槽是否存在？

### 1. 在模板中 (Template)

Vue 提供了 `$slots` 对象，包含了所有传递进来的插槽。

```html
<template>
  <div class="card">
    <!-- 只有当 header 插槽存在时，才渲染这个 div -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header"></slot>
    </div>
    
    <div class="card-body">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
```

### 2. 在 Script Setup 中

使用 `useSlots` 辅助函数。

```javascript
<script setup>
import { useSlots, computed } from 'vue'

const slots = useSlots()

// 判断是否传入了 header
const hasHeader = computed(() => !!slots.header)
</script>
```

---

## 问题 3：注意事项

-   **非空判断**：`$slots.name` 存在并不代表内容不为空（例如父组件传了空格）。但在大多数场景下，检查 `$slots.name` 是否为 Truthy 值已经足够。
-   **作用域插槽**：即使是作用域插槽，也可以通过 `$slots.name` 访问到渲染函数。

## 总结

**核心概念总结**：

### 1. 目的
避免渲染空的容器元素，保持 DOM 结构整洁。

### 2. 方法
使用 `v-if="$slots.slotName"` 进行条件判断。

## 延伸阅读

-   [Vue 3 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
