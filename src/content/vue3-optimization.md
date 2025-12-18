---
title: Vue3 的优化点有哪些？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  全面了解 Vue3 相比 Vue2 的性能优化，包括编译优化、响应式优化、Tree-shaking 等。
tags:
  - Vue
  - Vue3
  - 性能优化
  - 编译优化
estimatedTime: 15 分钟
keywords:
  - Vue3 优化
  - 性能提升
  - 编译优化
highlight: Vue3 通过 Proxy 响应式、编译优化、Tree-shaking 等多方面优化，性能提升显著。
order: 561
---

## 问题 1：响应式系统优化

### Vue2：Object.defineProperty

```javascript
// Vue2 的问题
// 1. 无法检测属性的添加/删除
// 2. 数组变化检测需要特殊处理
// 3. 需要递归遍历所有属性

const obj = { a: 1 };
obj.b = 2; // 无法检测
```

### Vue3：Proxy

```javascript
// Vue3 使用 Proxy
// 1. 可以检测属性的添加/删除
// 2. 可以检测数组索引和 length 变化
// 3. 惰性响应式（访问时才转换）

const obj = reactive({ a: 1 });
obj.b = 2; // 可以检测
```

---

## 问题 2：编译优化

### 静态提升（Static Hoisting）

```vue
<template>
  <div>
    <span>静态内容</span>
    <!-- 提升到渲染函数外 -->
    <span>{{ dynamic }}</span>
  </div>
</template>

<!-- 编译后 -->
const _hoisted = createVNode("span", null, "静态内容") function render() {
return createVNode("div", null, [ _hoisted, // 复用，不重新创建
createVNode("span", null, ctx.dynamic) ]) }
```

### 补丁标记（Patch Flags）

```javascript
// Vue3 为动态节点添加标记
createVNode("span", null, ctx.msg, 1 /* TEXT */);

// diff 时只检查标记的部分
// 1: TEXT - 文本变化
// 2: CLASS - class 变化
// 4: STYLE - style 变化
// 8: PROPS - 动态属性
```

### 树结构打平（Block Tree）

```javascript
// Vue3 将动态节点收集到 block 中
// diff 时只遍历动态节点，跳过静态节点
```

---

## 问题 3：Tree-shaking 支持

### Vue2

```javascript
// Vue2 全量引入
import Vue from "vue";

// 即使不用 keep-alive，也会打包进去
```

### Vue3

```javascript
// Vue3 按需引入
import { ref, computed, watch } from "vue";

// 未使用的 API 会被 tree-shake 掉
// 最小化打包体积
```

### 核心 API 可摇树

```javascript
// 这些 API 不使用就不会打包
import {
  Teleport, // 不用就不打包
  Suspense, // 不用就不打包
  KeepAlive, // 不用就不打包
  Transition, // 不用就不打包
} from "vue";
```

---

## 问题 4：源码体积优化

| 对比项   | Vue2  | Vue3  |
| -------- | ----- | ----- |
| 运行时   | ~23KB | ~10KB |
| 全量构建 | ~63KB | ~22KB |

### 优化手段

- 移除不常用 API（filter、$on 等）
- 更好的代码组织
- 使用 ES Module 格式

---

## 问题 5：Diff 算法优化

### Vue2 Diff

```javascript
// 双端比较
// 需要遍历整个虚拟 DOM 树
```

### Vue3 Diff

```javascript
// 1. 静态节点跳过
// 2. 只 diff 动态节点（通过 Block）
// 3. 最长递增子序列算法优化移动操作
```

---

## 问题 6：内存优化

### 组件实例更轻量

```javascript
// Vue3 组件实例属性更少
// 移除了 $children、$listeners 等
// 使用 Proxy 代替 Object.defineProperty
```

### Fragment 减少节点

```vue
<!-- Vue2：必须有根节点 -->
<template>
  <div>
    <!-- 额外的 DOM 节点 -->
    <span>1</span>
    <span>2</span>
  </div>
</template>

<!-- Vue3：支持多根节点 -->
<template>
  <span>1</span>
  <span>2</span>
</template>
```

---

## 问题 7：优化总结

| 优化类型 | 具体优化                   | 效果             |
| -------- | -------------------------- | ---------------- |
| 响应式   | Proxy 替代 defineProperty  | 更好的性能和功能 |
| 编译     | 静态提升、Patch Flags      | 减少运行时开销   |
| 打包     | Tree-shaking               | 更小的包体积     |
| Diff     | Block Tree、最长递增子序列 | 更快的更新       |
| 内存     | 更轻量的实例、Fragment     | 更少的内存占用   |

## 延伸阅读

- [Vue 3 设计与实现](https://www.ituring.com.cn/book/2953)
- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
