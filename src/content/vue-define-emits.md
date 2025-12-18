---
title: Vue defineEmits 详解
category: Vue
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  介绍 Vue 3 中 defineEmits 宏的使用，包括如何声明事件、触发事件以及进行 TypeScript 类型标注和参数验证。
tags:
  - Vue
  - Events
  - defineEmits
  - TypeScript
estimatedTime: 10 分钟
keywords:
  - defineEmits
  - vue custom events
  - component communication
  - typescript events
highlight: defineEmits 是 <script setup> 中声明组件触发事件的核心 API，它提供了完整的类型推导支持。
order: 420
---

## 问题 1：defineEmits 是什么？

`defineEmits` 是 Vue 3 `<script setup>` 语法糖中的一个**编译器宏**（Compiler Macro）。它用于声明组件可以触发的自定义事件。

在 Vue 2 中，我们使用 `this.$emit`。在 Vue 3 的 `setup()` 函数中，我们需要通过 `context.emit`。而在 `<script setup>` 中，`defineEmits` 是最推荐的方式。

---

## 问题 2：基本用法

### 声明和触发

```javascript
<script setup>
// 1. 声明事件
const emit = defineEmits(['change', 'delete'])

function handleChange() {
  // 2. 触发事件
  emit('change', 123)
}

function handleDelete() {
  emit('delete')
}
</script>
```

### 对象语法与验证

除了数组语法，还可以使用对象语法来对触发的事件参数进行验证（类似于 Props 验证）。

```javascript
const emit = defineEmits({
  // 没有验证
  click: null,

  // 验证 submit 事件
  submit: (payload) => {
    if (payload.email && payload.password) {
      return true
    } else {
      console.warn('Invalid submit payload!')
      return false
    }
  }
})
```

---

## 问题 3：TypeScript 类型标注

这是 `defineEmits` 最强大的地方。

```typescript
<script setup lang="ts">
// 纯类型声明 (Type-only)
const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()

// 或者使用别名
// type Emits = { ... }
// const emit = defineEmits<Emits>()
</script>
```

Vue 3.3+ 引入了更简洁的语法：

```typescript
const emit = defineEmits<{
  change: [id: number] // 具名元组
  update: [value: string]
}>()
```

## 总结

**核心概念总结**：

### 1. 宏
`defineEmits` 是宏，不需要导入，只能在 `<script setup>` 中使用。

### 2. 返回值
返回一个 `emit` 函数，用于在 JS 代码中触发事件。

### 3. 类型安全
配合 TypeScript 可以获得极佳的类型检查和自动补全体验。

## 延伸阅读

-   [Vue 3 官方文档 - defineEmits](https://cn.vuejs.org/api/sfc-script-setup.html#defineprops-defineemits)
