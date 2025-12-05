---
title: v-once 如何工作的？
category: Vue
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 v-once 指令的工作原理，掌握一次性渲染的使用场景。
tags:
  - Vue
  - v-once
  - 性能优化
  - 静态内容
estimatedTime: 8 分钟
keywords:
  - v-once
  - 一次性渲染
  - 静态优化
highlight: v-once 让元素和组件只渲染一次，后续更新会被跳过，适合纯静态内容。
order: 225
---

## 问题 1：v-once 是什么？

`v-once` 指令让元素或组件**只渲染一次**，之后的更新会被完全跳过。

```vue
<script setup>
import { ref } from "vue";
const message = ref("Hello");
</script>

<template>
  <!-- 只渲染一次，message 变化不会更新 -->
  <span v-once>{{ message }}</span>

  <!-- 正常响应式 -->
  <span>{{ message }}</span>
</template>
```

---

## 问题 2：工作原理

### 编译时优化

Vue 编译器会将 `v-once` 标记的内容提升为**静态节点**：

```javascript
// 编译前
<div v-once>{{ staticText }}</div>;

// 编译后（简化）
const _hoisted = createVNode("div", null, staticText);

function render() {
  return _hoisted; // 直接返回缓存的 VNode
}
```

### 跳过 diff

带有 `v-once` 的节点在后续更新时：

1. 不会重新执行渲染函数中的相关代码
2. 不会参与 diff 比较
3. 直接复用之前的 DOM

---

## 问题 3：使用场景

### 1. 纯静态内容

```vue
<template>
  <!-- 页面标题、版权信息等 -->
  <footer v-once>
    <p>© 2024 My Company. All rights reserved.</p>
    <p>Version: 1.0.0</p>
  </footer>
</template>
```

### 2. 初始值展示

```vue
<script setup>
const props = defineProps(["initialValue"]);
</script>

<template>
  <!-- 只显示初始值，不随 props 更新 -->
  <span v-once>初始值: {{ initialValue }}</span>
</template>
```

### 3. 大型静态列表

```vue
<template>
  <!-- 静态配置列表 -->
  <ul v-once>
    <li v-for="option in staticOptions" :key="option.id">
      {{ option.label }}
    </li>
  </ul>
</template>
```

---

## 问题 4：v-once 与子组件

```vue
<template>
  <!-- 子组件也只渲染一次 -->
  <div v-once>
    <ChildComponent :data="data" />
  </div>
</template>
```

**注意**：子组件的 props 变化也不会触发更新。

---

## 问题 5：v-once vs v-memo

| 特性     | v-once     | v-memo         |
| -------- | ---------- | -------------- |
| 更新条件 | 永不更新   | 依赖变化时更新 |
| 灵活性   | 低         | 高             |
| 使用场景 | 纯静态内容 | 条件性缓存     |

```vue
<template>
  <!-- v-once：永远不更新 -->
  <div v-once>{{ staticContent }}</div>

  <!-- v-memo：依赖变化时更新 -->
  <div v-memo="[condition]">{{ dynamicContent }}</div>

  <!-- v-memo="[]" 等价于 v-once -->
  <div v-memo="[]">{{ staticContent }}</div>
</template>
```

---

## 问题 6：注意事项

### 不要滥用

```vue
<!-- ❌ 错误：需要响应式更新的内容 -->
<div v-once>
  <span>{{ user.name }}</span>  <!-- user 变化不会更新！ -->
</div>

<!-- ✅ 正确：确实是静态的内容 -->
<div v-once>
  <span>Welcome to our site!</span>
</div>
```

### 调试困难

使用 `v-once` 后，如果发现内容不更新，可能会造成困惑。建议：

- 只用于明确的静态内容
- 添加注释说明为什么使用 `v-once`

```vue
<!-- 静态版权信息，使用 v-once 优化 -->
<footer v-once>
  ...
</footer>
```

## 延伸阅读

- [Vue 官方文档 - v-once](https://cn.vuejs.org/api/built-in-directives.html#v-once)
- [Vue 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
