---
title: keep-alive 如何缓存组件？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  深入理解 keep-alive 的缓存机制，掌握其工作原理和使用技巧。
tags:
  - Vue
  - keep-alive
  - 缓存
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - keep-alive
  - 组件缓存
  - LRU 缓存
highlight: keep-alive 使用 LRU 缓存策略，将组件实例保存在内存中，切换时复用而非重建。
order: 573
---

## 问题 1：keep-alive 的作用

`<keep-alive>` 缓存动态组件，避免重复创建和销毁：

```vue
<template>
  <!-- 不使用 keep-alive：每次切换都销毁/重建组件 -->
  <component :is="currentComponent" />

  <!-- 使用 keep-alive：组件被缓存，保留状态 -->
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

---

## 问题 2：缓存机制原理

### 内部数据结构

```javascript
// keep-alive 内部维护的缓存
const cache = new Map(); // 缓存的组件 VNode
const keys = new Set(); // 缓存的 key 集合

// 缓存结构
cache = {
  ComponentA: vnode1,
  ComponentB: vnode2,
  // ...
};
```

### 缓存流程

```javascript
// 1. 组件首次渲染
if (!cache.has(key)) {
  // 渲染组件
  // 将 vnode 存入缓存
  cache.set(key, vnode);
  keys.add(key);
}

// 2. 组件再次激活
if (cache.has(key)) {
  // 从缓存取出 vnode
  // 复用组件实例，不重新创建
  vnode = cache.get(key);
}

// 3. 组件失活
// 不销毁组件，保留在缓存中
// 触发 deactivated 钩子
```

---

## 问题 3：LRU 缓存策略

当缓存数量超过 `max` 时，使用 **LRU（最近最少使用）** 策略淘汰：

```vue
<keep-alive :max="10">
  <component :is="currentComponent" />
</keep-alive>
```

```javascript
// LRU 实现原理
function pruneCacheEntry(key) {
  const cached = cache.get(key);
  // 销毁组件实例
  cached.component.unmount();
  // 从缓存移除
  cache.delete(key);
  keys.delete(key);
}

// 缓存新组件时
if (keys.size > max) {
  // 淘汰最久未使用的（Set 的第一个元素）
  const oldestKey = keys.values().next().value;
  pruneCacheEntry(oldestKey);
}

// 访问缓存时，更新顺序
keys.delete(key);
keys.add(key); // 移到最后，表示最近使用
```

---

## 问题 4：include 和 exclude

```vue
<template>
  <!-- 只缓存指定组件 -->
  <keep-alive include="ComponentA,ComponentB">
    <component :is="current" />
  </keep-alive>

  <!-- 排除指定组件 -->
  <keep-alive exclude="ComponentC">
    <component :is="current" />
  </keep-alive>

  <!-- 使用正则 -->
  <keep-alive :include="/^Tab/">
    <component :is="current" />
  </keep-alive>

  <!-- 使用数组 -->
  <keep-alive :include="['TabA', 'TabB']">
    <component :is="current" />
  </keep-alive>
</template>
```

### 匹配规则

```javascript
// 匹配组件的 name 选项
export default {
  name: "ComponentA", // 用于 include/exclude 匹配
};

// <script setup> 中使用 defineOptions
defineOptions({
  name: "ComponentA",
});
```

---

## 问题 5：生命周期钩子

```vue
<script setup>
import { onActivated, onDeactivated } from "vue";

// 组件被激活时（从缓存恢复）
onActivated(() => {
  console.log("组件激活");
  // 适合：刷新数据、恢复滚动位置等
});

// 组件失活时（进入缓存）
onDeactivated(() => {
  console.log("组件失活");
  // 适合：保存状态、清理定时器等
});
</script>
```

### 生命周期顺序

```
首次渲染：setup → onMounted → onActivated
再次激活：onActivated
失活：onDeactivated
```

---

## 问题 6：配合路由使用

```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="cachedViews">
      <component :is="Component" :key="$route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup>
// 动态控制缓存的页面
const cachedViews = ref(["Home", "List"]);

function addCache(name) {
  cachedViews.value.push(name);
}

function removeCache(name) {
  const index = cachedViews.value.indexOf(name);
  if (index > -1) {
    cachedViews.value.splice(index, 1);
  }
}
</script>
```

---

## 问题 7：注意事项

### 内存占用

```vue
<!-- 缓存过多组件会占用内存 -->
<keep-alive :max="5">  <!-- 限制缓存数量 -->
  <component :is="current" />
</keep-alive>
```

### 状态更新

```vue
<script setup>
onActivated(() => {
  // 每次激活时检查是否需要刷新数据
  if (needsRefresh()) {
    fetchData();
  }
});
</script>
```

### 清理缓存

```javascript
// 手动清理缓存（需要获取 keep-alive 实例）
// 通常通过改变 include/exclude 或 key 来实现
```

## 延伸阅读

- [Vue 官方文档 - KeepAlive](https://cn.vuejs.org/guide/built-ins/keep-alive.html)
- [Vue Router - 路由缓存](https://router.vuejs.org/zh/guide/advanced/transitions.html)
