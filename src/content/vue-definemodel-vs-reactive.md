---
title: Vue defineModel 和 reactive 有何不同？
category: Vue
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  对比 Vue 3.4+ 引入的 defineModel 宏和 reactive API，解析它们在双向绑定（v-model）和本地响应式状态管理上的本质区别。
tags:
  - Vue
  - defineModel
  - reactive
  - v-model
  - Two-way Binding
estimatedTime: 15 分钟
keywords:
  - defineModel
  - reactive
  - vue 3.4
  - two-way binding
  - props vs state
highlight: reactive 用于创建组件内部的响应式对象，而 defineModel 是专门用于简化父子组件双向绑定 (v-model) 的语法糖。
order: 421
---

## 问题 1：defineModel 和 reactive 的核心区别是什么？

虽然它们都涉及“响应式数据”，但用途完全不同：

1.  **`reactive`**: 用于创建**组件内部**的响应式状态（Local State）。它是 Vue 响应式系统的基石之一（类似 `ref`）。
2.  **`defineModel`**: 用于实现**父子组件间的双向绑定**（`v-model`）。它本质上是一个 Prop 和一个 Emit 的组合。

---

## 问题 2：defineModel 解决了什么痛点？

在 Vue 3.4 之前，实现 `v-model` 需要手动声明 props 和 emit：

**Vue 3.3 及以前 (繁琐)**:
```javascript
<script setup>
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

function update() {
  emit('update:modelValue', newValue)
}
</script>

<template>
  <input :value="props.modelValue" @input="emit('update:modelValue', $event.target.value)" />
</template>
```

**Vue 3.4+ 使用 defineModel (简洁)**:
`defineModel` 返回一个 ref，修改这个 ref 会自动触发 update 事件通知父组件，读取它则是读取父组件传下来的 props。

```javascript
<script setup>
// model 就像一个普通的 ref，但它与父组件双向绑定
const model = defineModel() 
</script>

<template>
  <input v-model="model" />
</template>
```

---

## 问题 3：reactive 的使用场景？

`reactive` 用于定义复杂的、深层嵌套的对象状态。

```javascript
const state = reactive({
  count: 0,
  user: {
    name: 'Vue'
  }
})
```

**误区**：不要混淆 `defineModel` 返回的 ref 和 `reactive` 对象。`defineModel` 返回的是一个特殊的 Ref，它的值的来源是 Props。

## 总结

**核心概念总结**：

### 1. reactive
-   **领域**：组件内部状态。
-   **机制**：Proxy 代理对象。
-   **用途**：管理本地数据。

### 2. defineModel
-   **领域**：组件通信 (Props + Events)。
-   **机制**：宏，编译为 `props` + `emit`。
-   **用途**：简化 `v-model` 的实现。

## 延伸阅读

-   [Vue 3 官方文档 - defineModel](https://cn.vuejs.org/guide/components/v-model.html#definemodel)
