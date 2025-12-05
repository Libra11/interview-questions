---
title: v-if 与 v-show 区别？
category: Vue
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 v-if 和 v-show 的核心区别，掌握不同场景下的选择策略。
tags:
  - Vue
  - v-if
  - v-show
  - 条件渲染
estimatedTime: 8 分钟
keywords:
  - v-if v-show
  - 条件渲染
  - 性能对比
highlight: v-if 是真正的条件渲染，v-show 只是切换 CSS display 属性。
order: 222
---

## 问题 1：核心区别

### v-if

**真正的条件渲染**：条件为 false 时，元素不会被渲染到 DOM 中。

```vue
<template>
  <div v-if="show">内容</div>
</template>

<!-- show 为 false 时，DOM 中没有这个 div -->
```

### v-show

**CSS 切换**：元素始终被渲染，只是通过 `display: none` 隐藏。

```vue
<template>
  <div v-show="show">内容</div>
</template>

<!-- show 为 false 时，DOM 中有这个 div，但 style="display: none" -->
```

---

## 问题 2：对比表格

| 特性          | v-if                | v-show         |
| ------------- | ------------------- | -------------- |
| DOM 操作      | 创建/销毁元素       | 切换 display   |
| 初始渲染      | 条件为 false 不渲染 | 始终渲染       |
| 切换开销      | 高（重建 DOM）      | 低（CSS 切换） |
| 初始开销      | 低（惰性）          | 高（始终渲染） |
| 支持 template | ✅ 支持             | ❌ 不支持      |
| 支持 v-else   | ✅ 支持             | ❌ 不支持      |

---

## 问题 3：如何选择？

### 使用 v-if 的场景

```vue
<!-- 1. 条件很少改变 -->
<AdminPanel v-if="isAdmin" />

<!-- 2. 需要配合 v-else -->
<LoginForm v-if="!isLoggedIn" />
<UserDashboard v-else />

<!-- 3. 需要用在 template 上 -->
<template v-if="showSection">
  <h1>标题</h1>
  <p>内容</p>
</template>

<!-- 4. 初始条件为 false，可能永远不需要渲染 -->
<HeavyComponent v-if="needsHeavyComponent" />
```

### 使用 v-show 的场景

```vue
<!-- 1. 频繁切换 -->
<div v-show="isExpanded">展开的内容</div>

<!-- 2. Tab 切换 -->
<div v-show="activeTab === 'home'">Home 内容</div>
<div v-show="activeTab === 'about'">About 内容</div>

<!-- 3. 下拉菜单、弹出层 -->
<div class="dropdown" v-show="isOpen">
  菜单内容
</div>
```

---

## 问题 4：性能考量

### 初始渲染

```vue
<!-- v-if：条件为 false 时不渲染，节省初始开销 -->
<HeavyChart v-if="showChart" />

<!-- v-show：始终渲染，初始开销大 -->
<HeavyChart v-show="showChart" />
```

### 切换性能

```vue
<script setup>
// 假设这个值每秒切换一次
const toggle = ref(true);
setInterval(() => (toggle.value = !toggle.value), 1000);
</script>

<!-- v-if：每次切换都重建 DOM，开销大 -->
<div v-if="toggle">内容</div>

<!-- v-show：只切换 CSS，开销小 -->
<div v-show="toggle">内容</div>
```

---

## 问题 5：特殊情况

### v-if 与组件

```vue
<!-- v-if 切换时，组件会被销毁和重建 -->
<MyComponent v-if="show" />

<!-- 组件的生命周期会重新执行 -->
<!-- data 会重置，watch 会重新设置 -->
```

### v-show 不能用于 template

```vue
<!-- ❌ 错误：v-show 不能用于 template -->
<template v-show="show">
  <div>内容1</div>
  <div>内容2</div>
</template>

<!-- ✅ 正确：使用 v-if 或包裹元素 -->
<template v-if="show">
  <div>内容1</div>
  <div>内容2</div>
</template>

<div v-show="show">
  <div>内容1</div>
  <div>内容2</div>
</div>
```

## 延伸阅读

- [Vue 官方文档 - 条件渲染](https://cn.vuejs.org/guide/essentials/conditional.html)
