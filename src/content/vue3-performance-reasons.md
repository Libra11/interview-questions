---
title: 为什么 Vue3 的性能比 Vue2 强？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  全面分析 Vue3 相比 Vue2 性能提升的原因，涵盖响应式、编译、运行时等方面。
tags:
  - Vue
  - 性能
  - Vue3
  - 优化
estimatedTime: 15 分钟
keywords:
  - Vue3 性能
  - 性能提升
  - 优化原因
highlight: Vue3 通过 Proxy 响应式、编译优化、Tree-shaking、更高效的 diff 等多方面提升性能。
order: 268
---

## 问题 1：响应式系统优化

### Vue2：Object.defineProperty

```javascript
// 问题 1：需要递归遍历所有属性
function observe(obj) {
  Object.keys(obj).forEach((key) => {
    defineReactive(obj, key);
    if (typeof obj[key] === "object") {
      observe(obj[key]); // 递归
    }
  });
}

// 问题 2：无法检测新增/删除属性
obj.newProp = 1; // 不响应
delete obj.prop; // 不响应

// 问题 3：数组需要特殊处理
arr[0] = 1; // 不响应
arr.length = 0; // 不响应
```

### Vue3：Proxy

```javascript
// 优势 1：惰性响应式
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const value = target[key];
      // 访问时才转换，而非初始化时
      if (typeof value === "object") {
        return reactive(value);
      }
      return value;
    },
  });
}

// 优势 2：可检测新增/删除
obj.newProp = 1; // ✅ 响应
delete obj.prop; // ✅ 响应

// 优势 3：数组原生支持
arr[0] = 1; // ✅ 响应
arr.length = 0; // ✅ 响应
```

---

## 问题 2：编译时优化

### 静态提升

```vue
<template>
  <div>
    <span>静态</span>
    <span>{{ dynamic }}</span>
  </div>
</template>
```

```javascript
// Vue2：每次渲染都创建
function render() {
  return h("div", [
    h("span", "静态"), // 每次都创建
    h("span", this.dynamic),
  ]);
}

// Vue3：静态节点提升
const _hoisted = h("span", "静态"); // 只创建一次

function render() {
  return h("div", [
    _hoisted, // 复用
    h("span", ctx.dynamic),
  ]);
}
```

### PatchFlags

```javascript
// Vue3：标记动态内容类型
h("span", { class: ctx.cls }, ctx.text, 3 /* TEXT | CLASS */);

// diff 时只检查标记的部分
if (patchFlag & TEXT) updateText();
if (patchFlag & CLASS) updateClass();
// 跳过其他属性
```

---

## 问题 3：Tree-shaking 支持

### Vue2

```javascript
// 全量引入
import Vue from "vue";

// 即使不用的功能也会打包
// keep-alive、transition、v-model 等
```

### Vue3

```javascript
// 按需引入
import { ref, computed, watch } from "vue";

// 未使用的 API 会被 tree-shake
// Teleport、Suspense、KeepAlive 等
```

### 包体积对比

| 版本 | 最小运行时 | 全量构建 |
| ---- | ---------- | -------- |
| Vue2 | ~23KB      | ~63KB    |
| Vue3 | ~10KB      | ~22KB    |

---

## 问题 4：Diff 算法优化

### Vue2：双端比较

```javascript
// 遍历所有节点
// 全量比较属性
function patch(oldVNode, newVNode) {
  diffProps(oldVNode.props, newVNode.props);
  diffChildren(oldVNode.children, newVNode.children);
}
```

### Vue3：Block Tree + LIS

```javascript
// 只 diff 动态节点
const block = {
  dynamicChildren: [...]  // 只包含动态节点
}

// 使用最长递增子序列优化移动
function patchKeyedChildren() {
  const seq = getSequence(newIndexToOldIndexMap)
  // 最小化 DOM 移动
}
```

---

## 问题 5：组件实例优化

### Vue2

```javascript
// 组件实例属性多
this.$data;
this.$props;
this.$el;
this.$options;
this.$parent;
this.$root;
this.$children; // 已废弃
this.$refs;
this.$slots;
this.$scopedSlots;
this.$listeners; // 已废弃
// ...
```

### Vue3

```javascript
// 更轻量的实例
// 移除了 $children、$listeners 等
// 使用 Proxy 代替 Object.defineProperty
// 更少的内存占用
```

---

## 问题 6：事件缓存

```vue
<button @click="handleClick">Click</button>
```

```javascript
// Vue2：每次渲染创建新函数
h("button", { on: { click: () => this.handleClick() } });

// Vue3：缓存事件处理函数
h("button", {
  onClick: _cache[0] || (_cache[0] = () => ctx.handleClick()),
});
```

---

## 问题 7：Fragment 支持

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

减少 DOM 节点数量，降低内存占用。

---

## 问题 8：性能提升总结

| 优化点       | 效果                 |
| ------------ | -------------------- |
| Proxy 响应式 | 初始化更快，内存更少 |
| 静态提升     | 减少 VNode 创建      |
| PatchFlags   | 精确更新，减少比较   |
| Block Tree   | 跳过静态节点 diff    |
| LIS 算法     | 最小化 DOM 移动      |
| Tree-shaking | 更小的包体积         |
| 事件缓存     | 避免函数重复创建     |
| Fragment     | 减少 DOM 节点        |

### 实际效果

- 更新性能提升 **1.3~2 倍**
- 内存占用减少 **~50%**
- 包体积减少 **~40%**

## 延伸阅读

- [Vue 3 设计与实现](https://www.ituring.com.cn/book/2953)
- [Vue 3 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
