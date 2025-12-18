---
title: 静态提升（hoistStatic）如何实现？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 静态提升的实现原理，掌握其对性能优化的作用。
tags:
  - Vue
  - 静态提升
  - 编译优化
  - 性能
estimatedTime: 12 分钟
keywords:
  - hoistStatic
  - 静态提升
  - 编译优化
highlight: 静态提升将不变的 VNode 提升到渲染函数外部，避免每次渲染重复创建。
order: 565
---

## 问题 1：什么是静态提升？

静态提升是将**纯静态的 VNode** 提升到渲染函数外部，使其只创建一次，后续渲染直接复用。

```vue
<template>
  <div>
    <span>静态内容</span>
    <span>{{ dynamic }}</span>
  </div>
</template>
```

### 无静态提升

```javascript
function render() {
  return createVNode("div", null, [
    createVNode("span", null, "静态内容"), // 每次都创建
    createVNode("span", null, ctx.dynamic),
  ]);
}
```

### 有静态提升

```javascript
// 提升到渲染函数外部，只创建一次
const _hoisted_1 = createVNode("span", null, "静态内容");

function render() {
  return createVNode("div", null, [
    _hoisted_1, // 直接复用
    createVNode("span", null, ctx.dynamic),
  ]);
}
```

---

## 问题 2：哪些内容会被提升？

### 会被提升

```vue
<template>
  <!-- 纯静态元素 -->
  <span>Hello</span>

  <!-- 静态属性 -->
  <div class="container" id="app"></div>

  <!-- 静态子树 -->
  <div>
    <span>1</span>
    <span>2</span>
  </div>
</template>
```

### 不会被提升

```vue
<template>
  <!-- 动态内容 -->
  <span>{{ message }}</span>

  <!-- 动态属性 -->
  <div :class="cls"></div>

  <!-- 包含动态子节点 -->
  <div>
    <span>{{ text }}</span>
  </div>

  <!-- 带有 ref -->
  <div ref="divRef"></div>

  <!-- 带有指令 -->
  <div v-show="visible"></div>
</template>
```

---

## 问题 3：实现原理

### 编译阶段分析

```javascript
// 编译器遍历 AST，标记静态节点
function analyze(node) {
  if (isStaticNode(node)) {
    node.hoisted = true;
  }
}

function isStaticNode(node) {
  // 没有动态绑定
  // 没有 v-if、v-for 等指令
  // 没有组件
  // 子节点也都是静态的
}
```

### 代码生成

```javascript
// 生成代码时，将静态节点提升
function generate(ast) {
  const hoists = [];

  // 收集需要提升的节点
  walk(ast, (node) => {
    if (node.hoisted) {
      hoists.push(node);
    }
  });

  // 生成提升的变量声明
  const hoistCode = hoists
    .map((node, i) => `const _hoisted_${i} = ${genNode(node)}`)
    .join("\n");

  // 生成渲染函数
  return `
    ${hoistCode}
    
    function render() {
      return ${genNode(ast)}
    }
  `;
}
```

---

## 问题 4：静态属性提升

不仅元素可以提升，静态属性对象也可以提升：

```vue
<template>
  <div class="foo" style="color: red">
    {{ message }}
  </div>
</template>
```

```javascript
// 属性对象被提升
const _hoisted_1 = {
  class: "foo",
  style: { color: "red" },
};

function render() {
  return createVNode("div", _hoisted_1, ctx.message);
}
```

---

## 问题 5：预字符串化

当静态节点数量较多时，会进一步优化为静态 HTML 字符串：

```vue
<template>
  <div>
    <span>1</span>
    <span>2</span>
    <span>3</span>
    <span>4</span>
    <span>5</span>
  </div>
</template>
```

```javascript
// 多个静态节点合并为字符串
const _hoisted_1 = createStaticVNode(
  "<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>"
);

function render() {
  return createVNode("div", null, [_hoisted_1]);
}
```

使用 `innerHTML` 一次性设置，比逐个创建 VNode 更高效。

---

## 问题 6：性能收益

### 减少 VNode 创建

```javascript
// 无提升：每次渲染创建 N 个 VNode
// 有提升：只在初始化时创建一次

// 假设组件渲染 1000 次
// 无提升：创建 1000 * N 个 VNode
// 有提升：创建 N 个 VNode（复用 999 次）
```

### 减少内存分配

```javascript
// 静态 VNode 只占用一份内存
// 不会产生垃圾回收压力
```

### 加速 diff

```javascript
// 静态节点在 diff 时可以直接跳过
// 因为引用相同，无需比较
if (oldVNode === newVNode) {
  return; // 跳过
}
```

---

## 问题 7：查看编译结果

使用 Vue 3 Template Explorer 查看编译输出：

```
https://template-explorer.vuejs.org/
```

可以看到：

- 哪些节点被提升
- 生成的渲染函数代码
- Patch Flags 标记

## 延伸阅读

- [Vue 3 Template Explorer](https://template-explorer.vuejs.org/)
- [Vue 3 编译器源码](https://github.com/vuejs/core/tree/main/packages/compiler-core)
