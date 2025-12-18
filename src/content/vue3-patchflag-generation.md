---
title: Vue3 的编译器如何生成 PatchFlag？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 编译器生成 PatchFlag 的过程和原理。
tags:
  - Vue
  - 编译器
  - PatchFlags
  - 源码
estimatedTime: 15 分钟
keywords:
  - PatchFlag 生成
  - Vue 编译器
  - 编译优化
highlight: 编译器在解析模板时分析节点的动态绑定，为每个动态节点生成对应的 PatchFlag。
order: 601
---

## 问题 1：编译流程概览

```
模板字符串
    ↓
  Parse（解析）
    ↓
   AST
    ↓
Transform（转换）← 生成 PatchFlag
    ↓
 优化后的 AST
    ↓
Generate（生成）
    ↓
 渲染函数代码
```

---

## 问题 2：PatchFlag 类型

```typescript
// Vue3 源码中的定义
export const enum PatchFlags {
  TEXT = 1, // 动态文本
  CLASS = 1 << 1, // 动态 class (2)
  STYLE = 1 << 2, // 动态 style (4)
  PROPS = 1 << 3, // 动态属性 (8)
  FULL_PROPS = 1 << 4, // 动态 key 属性 (16)
  HYDRATE_EVENTS = 1 << 5, // 事件监听器 (32)
  STABLE_FRAGMENT = 1 << 6, // 稳定 Fragment (64)
  KEYED_FRAGMENT = 1 << 7, // 带 key 的 Fragment (128)
  UNKEYED_FRAGMENT = 1 << 8, // 无 key 的 Fragment (256)
  NEED_PATCH = 1 << 9, // 需要 patch (512)
  DYNAMIC_SLOTS = 1 << 10, // 动态插槽 (1024)
  DEV_ROOT_FRAGMENT = 1 << 11, // 开发环境根 Fragment
  HOISTED = -1, // 静态提升
  BAIL = -2, // 退出优化
}
```

---

## 问题 3：分析动态绑定

```javascript
// 编译器分析节点属性
function analyzePatchFlag(node) {
  let patchFlag = 0;
  let dynamicPropNames = [];

  for (const prop of node.props) {
    if (prop.type === "directive") {
      const name = prop.name;

      if (name === "bind") {
        const arg = prop.arg;

        if (arg === "class") {
          patchFlag |= PatchFlags.CLASS;
        } else if (arg === "style") {
          patchFlag |= PatchFlags.STYLE;
        } else if (arg) {
          // 动态属性名
          dynamicPropNames.push(arg);
          patchFlag |= PatchFlags.PROPS;
        } else {
          // v-bind="obj" 动态 key
          patchFlag |= PatchFlags.FULL_PROPS;
        }
      }
    }
  }

  // 检查子节点
  if (hasTextInterpolation(node)) {
    patchFlag |= PatchFlags.TEXT;
  }

  return { patchFlag, dynamicPropNames };
}
```

---

## 问题 4：编译示例

### 输入模板

```vue
<template>
  <div :class="cls" :style="styles">
    {{ message }}
  </div>
</template>
```

### 编译过程

```javascript
// 1. Parse: 生成 AST
const ast = {
  type: "Element",
  tag: "div",
  props: [
    { type: "Directive", name: "bind", arg: "class", exp: "cls" },
    { type: "Directive", name: "bind", arg: "style", exp: "styles" },
  ],
  children: [{ type: "Interpolation", content: "message" }],
};

// 2. Transform: 分析并添加 patchFlag
// CLASS (2) | STYLE (4) | TEXT (1) = 7
ast.patchFlag = 7;
ast.dynamicProps = ["class", "style"];

// 3. Generate: 生成代码
const code = `
  createVNode("div", {
    class: _ctx.cls,
    style: _ctx.styles
  }, toDisplayString(_ctx.message), 7 /* TEXT, CLASS, STYLE */)
`;
```

---

## 问题 5：组合标记

```vue
<template>
  <div :id="id" :class="cls" @click="handler">
    {{ text }}
  </div>
</template>
```

```javascript
// 分析结果
// TEXT (1) + CLASS (2) + PROPS (8) = 11
// 注意：事件不影响 patchFlag，因为事件处理函数会被缓存

createVNode(
  "div",
  {
    id: _ctx.id,
    class: _ctx.cls,
    onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handler(...args)),
  },
  toDisplayString(_ctx.text),
  11 /* TEXT, CLASS, PROPS */,
  ["id"]
);
//                              ↑ patchFlag        ↑ dynamicProps
```

---

## 问题 6：特殊情况处理

### 动态组件

```vue
<component :is="comp" />
```

```javascript
// 使用 BAIL 标记，退出优化模式
createVNode(resolveDynamicComponent(_ctx.comp), null, null, -2 /* BAIL */);
```

### v-for

```vue
<div v-for="item in list" :key="item.id">
  {{ item.name }}
</div>
```

```javascript
// Fragment 带 KEYED_FRAGMENT 标记
createVNode(
  Fragment,
  null,
  renderList(_ctx.list, (item) => {
    return createVNode(
      "div",
      { key: item.id },
      toDisplayString(item.name),
      1 /* TEXT */
    );
  }),
  128 /* KEYED_FRAGMENT */
);
```

---

## 问题 7：静态提升判断

```javascript
function shouldHoist(node) {
  // 不提升的情况
  if (node.type !== "Element") return false;
  if (node.props.some((p) => p.type === "Directive")) return false;
  if (hasInterpolation(node)) return false;
  if (node.tag === "component") return false;

  // 递归检查子节点
  return node.children.every(shouldHoist);
}

// 静态节点标记为 HOISTED (-1)
if (shouldHoist(node)) {
  node.patchFlag = PatchFlags.HOISTED;
}
```

---

## 问题 8：查看编译结果

使用 Vue 3 Template Explorer 查看：

```
https://template-explorer.vuejs.org/
```

可以看到：

- 生成的渲染函数代码
- 每个节点的 PatchFlag
- 静态提升的变量
- 动态属性列表

## 延伸阅读

- [Vue 3 编译器源码](https://github.com/vuejs/core/tree/main/packages/compiler-core)
- [Vue 3 Template Explorer](https://template-explorer.vuejs.org/)
