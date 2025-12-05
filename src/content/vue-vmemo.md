---
title: v-memo 的作用？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue3 v-memo 指令的作用，掌握如何用它优化大型列表的渲染性能。
tags:
  - Vue
  - v-memo
  - 性能优化
  - 列表渲染
estimatedTime: 10 分钟
keywords:
  - v-memo
  - 性能优化
  - 缓存渲染
highlight: v-memo 用于缓存模板子树，只有依赖值变化时才重新渲染，适合优化大型列表。
order: 224
---

## 问题 1：v-memo 是什么？

`v-memo` 是 Vue 3.2+ 引入的指令，用于**缓存模板的一部分**。只有当指定的依赖值变化时，才会重新渲染该部分。

```vue
<template>
  <!-- 只有 valueA 或 valueB 变化时才重新渲染 -->
  <div v-memo="[valueA, valueB]">
    <!-- 复杂的模板内容 -->
  </div>
</template>
```

---

## 问题 2：基本用法

### 语法

```vue
<template>
  <div v-memo="[dep1, dep2, ...]">
    <!-- 被缓存的内容 -->
  </div>
</template>
```

`v-memo` 接收一个**依赖数组**，类似于 React 的 `useMemo`。

### 示例

```vue
<script setup>
import { ref } from "vue";

const count = ref(0);
const message = ref("Hello");
</script>

<template>
  <!-- 只有 count 变化时才重新渲染 -->
  <div v-memo="[count]">
    <p>Count: {{ count }}</p>
    <p>Message: {{ message }}</p>
    <!-- message 变化不会触发重渲染 -->
  </div>
</template>
```

---

## 问题 3：优化大型列表

`v-memo` 最常见的用途是优化 `v-for` 列表：

```vue
<script setup>
import { ref } from "vue";

const items = ref([
  { id: 1, name: "Item 1", selected: false },
  { id: 2, name: "Item 2", selected: false },
  // ... 大量数据
]);

const selectedId = ref(null);

function select(id) {
  selectedId.value = id;
}
</script>

<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.id === selectedId]"
    :class="{ selected: item.id === selectedId }"
    @click="select(item.id)"
  >
    {{ item.name }}
  </div>
</template>
```

### 效果

- 点击选中某项时，只有**之前选中的**和**新选中的**两项会重新渲染
- 其他项的 `v-memo` 依赖没变化，直接复用缓存

---

## 问题 4：v-memo 与 v-for 配合

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.id === selected]">
    <p>ID: {{ item.id }}</p>
    <p>Name: {{ item.name }}</p>
    <ChildComponent :data="item" />
  </div>
</template>
```

### 注意事项

1. **v-memo 必须和 v-for 在同一元素上**
2. **v-memo 在 v-for 内部时，依赖数组可以访问 v-for 的变量**

```vue
<!-- ✅ 正确 -->
<div v-for="item in items" :key="item.id" v-memo="[item.active]">

<!-- ❌ 错误：v-memo 不能在 v-for 外层 -->
<div v-memo="[someValue]">
  <div v-for="item in items" :key="item.id">
```

---

## 问题 5：空依赖数组

```vue
<!-- 空数组：永远不重新渲染（类似 v-once） -->
<div v-memo="[]">
  {{ staticContent }}
</div>

<!-- 等价于 -->
<div v-once>
  {{ staticContent }}
</div>
```

---

## 问题 6：何时使用 v-memo？

### 适合使用

```vue
<!-- 1. 大型列表（100+ 项） -->
<div v-for="item in largeList" :key="item.id" v-memo="[item.selected]">

<!-- 2. 复杂的列表项模板 -->
<div v-for="item in items" :key="item.id" v-memo="[item.status]">
  <ComplexComponent :data="item" />
  <AnotherComponent :config="item.config" />
</div>

<!-- 3. 频繁更新但大部分项不变的列表 -->
```

### 不需要使用

```vue
<!-- 1. 小型列表 -->
<!-- 2. 简单的模板 -->
<!-- 3. 每次都需要更新的内容 -->
```

### 性能提示

```vue
<!-- ⚠️ 过度使用 v-memo 可能适得其反 -->
<!-- 比较依赖数组也有开销 -->

<!-- ❌ 不必要 -->
<span v-memo="[text]">{{ text }}</span>

<!-- ✅ 有意义 -->
<ComplexComponent v-memo="[data.id]" :data="data" />
```

## 延伸阅读

- [Vue 官方文档 - v-memo](https://cn.vuejs.org/api/built-in-directives.html#v-memo)
- [Vue 官方文档 - 列表渲染性能](https://cn.vuejs.org/guide/best-practices/performance.html#virtualize-large-lists)
