---
title: Vue 动态插槽 (Dynamic Slots) 介绍
category: Vue
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  解析 Vue 动态插槽名的语法和使用场景，展示如何根据数据动态渲染不同的插槽内容。
tags:
  - Vue
  - Slots
  - Dynamic Slots
estimatedTime: 10 分钟
keywords:
  - dynamic slots
  - v-slot
  - slot name
highlight: 动态插槽允许插槽名称是一个变量，这为构建高度灵活和可配置的组件提供了可能。
order: 136
---

## 问题 1：什么是动态插槽？

在 Vue 中，`<slot>` 允许父组件向子组件传递模板内容。通常我们使用 `v-slot:header` 或简写 `#header` 来指定插槽名称。

**动态插槽**允许插槽的名称是动态计算的，类似于动态属性参数（Dynamic Arguments）。

### 语法

```html
<template v-slot:[dynamicSlotName]>
  ...
</template>

<!-- 简写语法 -->
<template #[dynamicSlotName]>
  ...
</template>
```

---

## 问题 2：使用场景示例

假设我们有一个通用的布局组件 `BaseLayout`，它定义了多个插槽（header, default, footer）。父组件可能根据配置或状态，决定将内容填充到哪个插槽中，或者动态遍历插槽。

### 场景：动态表格列渲染

假设封装一个 `MyTable` 组件，允许用户通过插槽自定义特定列的渲染。

```html
<!-- Parent.vue -->
<MyTable :columns="columns" :data="tableData">
  <!-- 动态遍历列名，为每一列提供自定义渲染插槽 -->
  <!-- slotName 可能是 'name', 'age', 'action' -->
  <template v-for="col in columns" #[col.slotName]="{ row }">
    <span v-if="col.slotName === 'action'">
      <button @click="edit(row)">Edit</button>
    </span>
    <b v-else>{{ row[col.key] }}</b>
  </template>
</MyTable>
```

### 场景：条件性插槽名

```javascript
const slotName = ref('header')

// 切换 slotName 的值，内容会在 header 和 footer 插槽间跳变
// 注意：如果 slotName 为 null，该插槽绑定会被移除
```

---

## 问题 3：注意事项

1.  **参数限制**：动态参数表达式有一些语法限制（如不能包含空格和引号）。建议使用计算属性。
2.  **null 值**：如果动态参数的值为 `null`，则该指令（这里是 v-slot）会被显式移除。

## 总结

**核心概念总结**：

### 1. 语法
`v-slot:[name]` 或 `#[name]`。

### 2. 灵活性
结合 `v-for` 使用时非常强大，常用于数据驱动的组件设计（如动态表单、动态表格）。

## 延伸阅读

-   [Vue 3 官方文档 - 动态插槽名](https://cn.vuejs.org/guide/components/slots.html#dynamic-slot-names)
