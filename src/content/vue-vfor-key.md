---
title: v-for 为什么需要 key？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 v-for 中 key 的作用，掌握 key 对 diff 算法和组件状态的影响。
tags:
  - Vue
  - v-for
  - key
  - diff 算法
estimatedTime: 12 分钟
keywords:
  - v-for key
  - diff 算法
  - 列表渲染
highlight: key 帮助 Vue 识别节点身份，使 diff 算法能够正确复用和重排元素。
order: 223
---

## 问题 1：key 的作用

`key` 是 Vue 识别 VNode 的**唯一标识**，用于在 diff 算法中判断两个节点是否是"同一个"。

```vue
<template>
  <!-- 有 key：Vue 能追踪每个节点的身份 -->
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>

  <!-- 无 key：Vue 使用"就地更新"策略 -->
  <li v-for="item in items">
    {{ item.name }}
  </li>
</template>
```

---

## 问题 2：没有 key 会怎样？

### 就地更新策略

没有 key 时，Vue 采用**就地更新**：尽可能复用现有 DOM 元素，只更新内容。

```javascript
// 原列表
["A", "B", "C"][
  // 新列表（在开头插入 D）
  ("D", "A", "B", "C")
];

// 没有 key 时的更新方式：
// 第1个 li：'A' → 'D'（更新文本）
// 第2个 li：'B' → 'A'（更新文本）
// 第3个 li：'C' → 'B'（更新文本）
// 第4个 li：创建新元素 'C'
```

### 问题：状态错乱

```vue
<script setup>
import { ref } from "vue";

const items = ref([
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "C" },
]);

function addFirst() {
  items.value.unshift({ id: 4, name: "D" });
}
</script>

<template>
  <!-- 没有 key -->
  <div v-for="item in items">
    {{ item.name }}
    <input />
    <!-- 输入框的内容会错乱！ -->
  </div>
</template>
```

当在 A 的输入框中输入内容后，点击添加 D，输入的内容会"留在"第一个位置（现在是 D）。

---

## 问题 3：有 key 时的 diff 算法

```javascript
// 原列表
[
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "C" },
][
  // 新列表（在开头插入 D）
  ({ id: 4, name: "D" },
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "C" })
];

// 有 key 时的更新方式：
// key=1 的节点：移动到第2位
// key=2 的节点：移动到第3位
// key=3 的节点：移动到第4位
// key=4 的节点：创建新元素，插入第1位
```

Vue 通过 key 识别出 A、B、C 还是原来的节点，只需要**移动**它们，而不是更新内容。

---

## 问题 4：为什么不用 index 作为 key？

```vue
<!-- ❌ 不推荐：使用 index -->
<li v-for="(item, index) in items" :key="index">
  {{ item.name }}
  <input />
</li>
```

### 问题：index 不是稳定标识

```javascript
// 原列表
items = ["A", "B", "C"];
// index:   0    1    2

// 删除 B 后
items = ["A", "C"];
// index:   0    1

// C 的 index 从 2 变成了 1
// Vue 认为 key=1 的节点内容从 'B' 变成了 'C'
// 导致不必要的更新
```

### 什么时候可以用 index？

```vue
<!-- ✅ 可以：静态列表，不会增删改 -->
<li v-for="(item, index) in staticList" :key="index">
  {{ item }}
</li>

<!-- ✅ 可以：纯展示，没有组件状态 -->
<span v-for="(tag, index) in tags" :key="index">
  {{ tag }}
</span>
```

---

## 问题 5：key 的最佳实践

### 使用唯一且稳定的 ID

```vue
<!-- ✅ 推荐：使用数据的唯一 ID -->
<li v-for="user in users" :key="user.id">
  {{ user.name }}
</li>

<!-- ✅ 推荐：组合字段生成唯一 key -->
<li v-for="item in items" :key="`${item.type}-${item.id}`">
  {{ item.name }}
</li>
```

### 避免使用随机数

```vue
<!-- ❌ 错误：每次渲染都生成新 key -->
<li v-for="item in items" :key="Math.random()">
  {{ item.name }}
</li>
```

### 组件必须有 key

```vue
<!-- 组件有自己的状态，必须用 key 正确追踪 -->
<UserCard v-for="user in users" :key="user.id" :user="user" />
```

---

## 问题 6：key 的其他用途

### 强制重新渲染组件

```vue
<script setup>
const componentKey = ref(0);

function resetComponent() {
  componentKey.value++; // 改变 key，组件会被销毁重建
}
</script>

<template>
  <MyComponent :key="componentKey" />
</template>
```

### 触发过渡动画

```vue
<template>
  <Transition>
    <!-- key 变化时触发过渡 -->
    <span :key="count">{{ count }}</span>
  </Transition>
</template>
```

## 延伸阅读

- [Vue 官方文档 - 列表渲染](https://cn.vuejs.org/guide/essentials/list.html#maintaining-state-with-key)
- [Vue 官方文档 - key 属性](https://cn.vuejs.org/api/built-in-special-attributes.html#key)
