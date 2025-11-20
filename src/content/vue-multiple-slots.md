---
title: Vue 多个插槽场景该如何声明与使用？
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  详解 Vue 具名插槽 (Named Slots) 的声明和使用方式，包括默认插槽、具名插槽的组合使用以及作用域插槽的传参。
tags:
  - Vue
  - Slots
  - Named Slots
  - Component Communication
estimatedTime: 15 分钟
keywords:
  - named slots
  - multiple slots
  - v-slot
  - slot props
highlight: 通过具名插槽，我们可以在一个组件中定义多个插槽出口，让父组件精确控制内容的插入位置。
order: 143
---

## 问题 1：为什么需要多个插槽？

在开发复杂组件时，我们经常需要在**不同位置**插入不同的内容。例如，一个卡片组件可能需要：
- 头部区域（标题、操作按钮）
- 主体内容区域
- 底部区域（按钮、链接）

如果只有一个默认插槽，我们无法精确控制内容的插入位置。这时就需要**具名插槽 (Named Slots)**。

---

## 问题 2：如何声明多个插槽？

在子组件中，使用 `<slot>` 元素的 `name` 属性来定义具名插槽。没有 `name` 的 `<slot>` 是默认插槽。

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <!-- 具名插槽：header -->
    <div class="card-header">
      <slot name="header"></slot>
    </div>

    <!-- 默认插槽 -->
    <div class="card-body">
      <slot></slot>
    </div>

    <!-- 具名插槽：footer -->
    <div class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
```

---

## 问题 3：如何使用多个插槽？

### 1. 完整语法 (v-slot)

在父组件中，使用 `<template>` 配合 `v-slot:slotName` 指令来指定内容插入到哪个插槽。

```vue
<Card>
  <template v-slot:header>
    <h3>Card Title</h3>
  </template>

  <!-- 默认插槽的内容可以不用 template 包裹 -->
  <p>This is the main content.</p>

  <template v-slot:footer>
    <button>Action</button>
  </template>
</Card>
```

### 2. 简写语法 (#)

`v-slot:` 可以简写为 `#`。

```vue
<Card>
  <template #header>
    <h3>Card Title</h3>
  </template>

  <p>Main content</p>

  <template #footer>
    <button>Action</button>
  </template>
</Card>
```

---

## 问题 4：具名插槽如何传递数据？(作用域插槽)

子组件可以向插槽传递数据（Props），父组件通过插槽 Props 接收。

### 子组件定义

```vue
<!-- UserList.vue -->
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <!-- 向插槽传递 user 数据 -->
      <slot name="user-item" :user="user" :index="index"></slot>
    </li>
  </ul>
</template>

<script setup>
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]
</script>
```

### 父组件使用

```vue
<UserList>
  <!-- 接收插槽传递的 props -->
  <template #user-item="{ user, index }">
    <strong>{{ index + 1 }}. {{ user.name }}</strong>
  </template>
</UserList>
```

## 总结

**核心概念总结**：

### 1. 声明
使用 `<slot name="slotName">` 定义具名插槽。

### 2. 使用
使用 `<template v-slot:slotName>` 或简写 `<template #slotName>` 指定内容。

### 3. 作用域插槽
子组件通过 `<slot :propName="value">` 传递数据，父组件通过 `v-slot="slotProps"` 接收。

## 延伸阅读

- [Vue 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
- [Vue 官方文档 - 具名插槽](https://cn.vuejs.org/guide/components/slots.html#named-slots)
