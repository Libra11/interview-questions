---
title: Fragment 是什么？为什么 Vue3 引入 Fragment？
category: Vue
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 Vue3 Fragment 特性，掌握多根节点组件的使用方式和注意事项。
tags:
  - Vue
  - Fragment
  - 多根节点
  - Vue3
estimatedTime: 10 分钟
keywords:
  - Fragment
  - 多根节点
  - Vue3 新特性
highlight: Fragment 允许组件拥有多个根节点，减少不必要的 DOM 嵌套。
order: 518
---

## 问题 1：什么是 Fragment？

**Fragment** 是 Vue3 引入的特性，允许组件模板拥有**多个根节点**，而不需要包裹在单一的父元素中。

```vue
<!-- Vue 2：必须有单一根节点 -->
<template>
  <div>
    <!-- 必须的包裹元素 -->
    <header>头部</header>
    <main>内容</main>
    <footer>底部</footer>
  </div>
</template>

<!-- Vue 3：支持多根节点（Fragment） -->
<template>
  <header>头部</header>
  <main>内容</main>
  <footer>底部</footer>
</template>
```

---

## 问题 2：为什么 Vue2 需要单一根节点？

Vue2 的虚拟 DOM diff 算法基于**单一根节点**设计：

```javascript
// Vue2 组件的 VNode 结构
{
  tag: 'div',
  children: [/* 子节点 */]
}

// 如果有多个根节点，无法表示为单一 VNode
```

Vue2 的解决方案是强制要求单一根节点，但这导致了**不必要的 DOM 嵌套**。

---

## 问题 3：Vue3 如何实现 Fragment？

Vue3 重新设计了虚拟 DOM，支持 **Fragment 类型的 VNode**：

```javascript
// Vue3 可以用 Fragment 包裹多个根节点
{
  type: Fragment,
  children: [
    { type: 'header', ... },
    { type: 'main', ... },
    { type: 'footer', ... }
  ]
}
```

Fragment 本身**不会渲染为真实 DOM 元素**，只是一个逻辑容器。

---

## 问题 4：Fragment 的优势

### 1. 减少 DOM 层级

```vue
<!-- 不需要额外的包裹元素 -->
<template>
  <td>列1</td>
  <td>列2</td>
  <td>列3</td>
</template>

<!-- 用于表格行组件时特别有用 -->
<tr>
  <TableCells />  <!-- 直接渲染 td 元素 -->
</tr>
```

### 2. 更灵活的组件结构

```vue
<!-- 列表项组件 -->
<template>
  <li>项目 1</li>
  <li>项目 2</li>
</template>

<!-- 父组件 -->
<ul>
  <ListItems />  <!-- 直接渲染多个 li -->
</ul>
```

### 3. 更干净的 HTML 结构

```vue
<!-- 布局组件 -->
<template>
  <header>...</header>
  <slot></slot>
  <footer>...</footer>
</template>
```

---

## 问题 5：使用 Fragment 的注意事项

### Attributes 继承

多根节点组件不会自动继承 attributes，需要显式绑定：

```vue
<!-- 子组件 -->
<template>
  <!-- 多根节点时，需要指定谁继承 attrs -->
  <header v-bind="$attrs">头部</header>
  <main>内容</main>
</template>

<!-- 或者禁用继承 -->
<script setup>
defineOptions({
  inheritAttrs: false,
});
</script>
```

### 使用 ref 获取元素

```vue
<script setup>
import { ref } from "vue";

// 多根节点时，需要为每个元素单独设置 ref
const headerRef = ref(null);
const mainRef = ref(null);
</script>

<template>
  <header ref="headerRef">头部</header>
  <main ref="mainRef">内容</main>
</template>
```

## 延伸阅读

- [Vue 官方文档 - 多根节点](https://cn.vuejs.org/guide/components/attrs.html#attribute-inheritance-on-multiple-root-nodes)
- [Vue 3 迁移指南 - 片段](https://v3-migration.vuejs.org/zh/new/fragments.html)
