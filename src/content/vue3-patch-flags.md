---
title: PatchFlags（补丁标记）作用是什么？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 Vue3 PatchFlags 的作用，掌握其如何优化 diff 过程。
tags:
  - Vue
  - PatchFlags
  - diff
  - 编译优化
estimatedTime: 12 分钟
keywords:
  - PatchFlags
  - 补丁标记
  - diff 优化
highlight: PatchFlags 标记 VNode 的动态部分类型，让 diff 只检查需要更新的内容。
order: 244
---

## 问题 1：什么是 PatchFlags？

PatchFlags 是 Vue3 编译器为动态节点添加的**标记**，告诉运行时该节点的哪些部分是动态的，需要在 diff 时检查。

```vue
<template>
  <span>{{ text }}</span>
</template>
```

```javascript
// 编译后
createVNode("span", null, ctx.text, 1 /* TEXT */);
//                                  ↑ PatchFlag
```

`1` 表示只有文本内容是动态的，diff 时只需要比较文本。

---

## 问题 2：PatchFlags 类型

```typescript
// Vue3 源码中的 PatchFlags 定义
export const enum PatchFlags {
  TEXT = 1, // 动态文本
  CLASS = 2, // 动态 class
  STYLE = 4, // 动态 style
  PROPS = 8, // 动态属性（非 class/style）
  FULL_PROPS = 16, // 有动态 key 的属性
  HYDRATE_EVENTS = 32, // 需要事件监听器
  STABLE_FRAGMENT = 64, // 稳定的 Fragment
  KEYED_FRAGMENT = 128, // 带 key 的 Fragment
  UNKEYED_FRAGMENT = 256, // 无 key 的 Fragment
  NEED_PATCH = 512, // 需要 patch（ref、指令等）
  DYNAMIC_SLOTS = 1024, // 动态插槽
  HOISTED = -1, // 静态提升的节点
  BAIL = -2, // 退出优化模式
}
```

---

## 问题 3：标记示例

### 动态文本

```vue
<span>{{ message }}</span>
```

```javascript
createVNode("span", null, ctx.message, 1 /* TEXT */);
```

### 动态 class

```vue
<div :class="cls"></div>
```

```javascript
createVNode("div", { class: ctx.cls }, null, 2 /* CLASS */);
```

### 动态 style

```vue
<div :style="styles"></div>
```

```javascript
createVNode("div", { style: ctx.styles }, null, 4 /* STYLE */);
```

### 组合标记

```vue
<div :class="cls" :style="styles">{{ text }}</div>
```

```javascript
// 1 | 2 | 4 = 7
createVNode(
  "div",
  { class: ctx.cls, style: ctx.styles },
  ctx.text,
  7 /* TEXT | CLASS | STYLE */
);
```

---

## 问题 4：diff 时如何使用

```javascript
function patchElement(n1, n2) {
  const el = (n2.el = n1.el);
  const patchFlag = n2.patchFlag;

  // 根据 patchFlag 决定检查什么
  if (patchFlag > 0) {
    if (patchFlag & PatchFlags.TEXT) {
      // 只更新文本
      if (n1.children !== n2.children) {
        el.textContent = n2.children;
      }
    }

    if (patchFlag & PatchFlags.CLASS) {
      // 只更新 class
      if (n1.props.class !== n2.props.class) {
        el.className = n2.props.class;
      }
    }

    if (patchFlag & PatchFlags.STYLE) {
      // 只更新 style
      patchStyle(el, n1.props.style, n2.props.style);
    }

    // ... 其他标记
  } else {
    // 没有标记，全量 diff
    patchProps(el, n1.props, n2.props);
  }
}
```

---

## 问题 5：动态属性名

```vue
<div :[key]="value"></div>
```

```javascript
// FULL_PROPS 表示属性名是动态的
createVNode("div", { [ctx.key]: ctx.value }, null, 16 /* FULL_PROPS */);
```

此时需要全量比较属性，因为不知道哪个属性会变化。

---

## 问题 6：性能收益

### 无 PatchFlags（Vue2 方式）

```javascript
function diff(oldVNode, newVNode) {
  // 比较所有属性
  diffProps(oldVNode.props, newVNode.props);
  // 比较所有子节点
  diffChildren(oldVNode.children, newVNode.children);
}
```

### 有 PatchFlags（Vue3 方式）

```javascript
function diff(oldVNode, newVNode) {
  const flag = newVNode.patchFlag;

  if (flag === 1) {
    // 只比较文本，跳过属性
    if (oldVNode.children !== newVNode.children) {
      el.textContent = newVNode.children;
    }
    return;
  }

  // 其他情况...
}
```

### 效果

| 场景                           | Vue2                | Vue3         |
| ------------------------------ | ------------------- | ------------ |
| `<span>{{ text }}</span>`      | 比较所有属性+子节点 | 只比较文本   |
| `<div :class="cls">静态</div>` | 比较所有属性+子节点 | 只比较 class |

---

## 问题 7：查看 PatchFlags

使用 Vue 3 Template Explorer：

```
https://template-explorer.vuejs.org/
```

勾选 "hoistStatic" 和 "Show PatchFlags" 选项，可以看到每个节点的标记。

## 延伸阅读

- [Vue 3 Template Explorer](https://template-explorer.vuejs.org/)
- [Vue 3 源码 - PatchFlags](https://github.com/vuejs/core/blob/main/packages/shared/src/patchFlags.ts)
