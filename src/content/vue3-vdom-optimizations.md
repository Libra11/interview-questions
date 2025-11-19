---
title: Vue 3 对虚拟 DOM 做了哪些优化？
category: Vue
difficulty: 高级
updatedAt: 2025-11-19
summary: >-
  深入解析 Vue 3 在编译阶段对虚拟 DOM 进行的静态分析和优化，包括 Patch Flags、静态提升和 Block Tree 等核心机制。
tags:
  - Vue 3
  - Virtual DOM
  - Optimization
  - Diff Algorithm
estimatedTime: 20 分钟
keywords:
  - patch flags
  - hoist static
  - block tree
  - vue 3 compiler
  - diff algorithm
highlight: Vue 3 通过编译时的静态分析，引入 Patch Flags 和 Block Tree，将 Diff 算法的复杂度从树的大小降低到了动态节点的数量。
order: 125
---

## 问题 1：什么是 Patch Flags (静态标记)？

Vue 2 的 Diff 算法是全量比较（Full Diff），即每当数据变化时，会生成新的 VDOM 树，并与旧树进行全量递归对比，即使很多节点是静态的（永远不会变）。

Vue 3 在编译阶段对模板进行了静态分析，引入了 **Patch Flags**。

### 核心机制

编译器会在动态节点的 VNode 上打上标记（Patch Flag），标识该节点**哪里是动态的**。

```javascript
// 模板
// <div>
//   <span>Hello World</span>  <!-- 静态节点 -->
//   <span :class="cls">{{ msg }}</span> <!-- 动态节点 -->
// </div>

// 编译后的 VNode (伪代码)
export function render() {
  return (openBlock(), createBlock('div', null, [
    createVNode('span', null, 'Hello World'), // 没有标记，视为静态
    createVNode('span', { class: _ctx.cls }, _ctx.msg, 1 /* TEXT */) // 标记为 1
  ]))
}
```

### 常见的 Patch Flags

- `1`: TEXT - 只有文本内容是动态的
- `2`: CLASS - 只有 class 是动态的
- `4`: STYLE - 只有 style 是动态的
- `8`: PROPS - 只有 props 是动态的
- ...

**优化效果**：在 Diff 过程中，Vue 3 只需要检查带有 Patch Flag 的节点，并且只检查标记指出的变化部分（例如只比对 Text 或只比对 Class），从而跳过大量无关的对比。

---

## 问题 2：什么是 Hoist Static (静态提升) 和 Cache Handlers？

除了标记动态节点，Vue 3 还尽量减少静态节点的重复创建。

### 1. Hoist Static (静态提升)

在 Vue 2 中，无论节点是否是静态的，每次组件重新渲染时，`render` 函数都会重新执行，重新创建所有的 VNode 对象。

Vue 3 会将**静态节点**提升到 `render` 函数之外。

```javascript
// 静态提升前
export function render() {
  return (openBlock(), createBlock('div', null, [
    createVNode('span', null, 'Hello World'), // 每次渲染都重新创建
    createVNode('span', null, _ctx.msg)
  ]))
}

// ✅ 静态提升后
const _hoisted_1 = createVNode('span', null, 'Hello World') // 只创建一次

export function render() {
  return (openBlock(), createBlock('div', null, [
    _hoisted_1, // 直接复用
    createVNode('span', null, _ctx.msg)
  ]))
}
```

**优化效果**：大幅减少了内存占用和垃圾回收（GC）的开销。

### 2. Cache Handlers (事件监听缓存)

默认情况下，像 `@click="handler"` 这样的事件绑定会被视为动态 props，导致每次更新都要追踪它的变化。Vue 3 提供了事件缓存机制。

```javascript
// 开启缓存前
// onClick: _ctx.handler // 视为动态属性

// ✅ 开启缓存后
// onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handler(...args))
```

**优化效果**：事件处理函数被缓存，不会触发组件的非必要更新。

---

## 问题 3：什么是 Block Tree (块级树)？

这是 Vue 3 性能提升最关键的一环。

### 传统 Diff 的痛点

传统 Virtual DOM 的 Diff 算法是**深度优先递归**的。其复杂度与**模板整体大小**（Total Node Count）成正比，而不是与**动态节点数量**成正比。

### Block Tree 的改进

Vue 3 引入了 **Block** 的概念。一个 Block 是一个特殊的 VNode（通常是组件根节点或 `v-if`/`v-for` 块）。

Block 内部维护了一个 `dynamicChildren` 数组，只收集该 Block 内部所有的**带 Patch Flag 的动态子节点**。

```javascript
// 模板
// <div>
//   <p>Static</p>
//   <p>{{ msg }}</p> <!-- 动态 -->
//   <p>Static</p>
//   <p :class="cls">Static</p> <!-- 动态 -->
// </div>

// Block Tree 结构 (概念)
const block = {
  type: 'div',
  dynamicChildren: [
    { type: 'p', children: ctx.msg, patchFlag: 1 },
    { type: 'p', props: { class: ctx.cls }, patchFlag: 2 }
  ]
  // 静态节点不在 dynamicChildren 中
}
```

**优化效果**：
当组件更新时，Vue 3 不再需要遍历整棵 VNode 树，而是直接遍历 `dynamicChildren` 数组。这使得 Diff 的性能**只与动态节点的数量相关**，而与模板整体大小无关。这被称为 **"靶向更新"**。

## 总结

**核心概念总结**：

### 1. 编译时优化 (Compile-time Optimization)
Vue 3 的性能提升很大程度上归功于编译器。它在编译阶段分析模板，生成带有优化提示的代码。

### 2. 三大核心策略
- **Patch Flags**：给动态节点打标签，明确告知 Diff 算法哪里变了。
- **Hoist Static**：将静态节点提升到渲染函数外，避免重复创建。
- **Block Tree**：将树形结构打平为数组，Diff 时只遍历动态节点列表。

### 3. 结果
Vue 3 的 Diff 算法实现了从 $O(n)$ (模板大小) 到 $O(d)$ (动态节点数量) 的性能飞跃。

## 延伸阅读

- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 3 Template Explorer (在线查看编译结果)](https://template-explorer.vuejs.org/)
- [Deep Dive into Vue 3 Virtual DOM](https://vueschool.io/articles/vuejs-tutorials/faster-web-applications-with-vue-3/)
