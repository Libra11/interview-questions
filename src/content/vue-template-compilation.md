---
title: Template 是怎样编译成渲染函数的？
category: Vue
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  深入理解 Vue 模板编译的完整流程，掌握 parse、transform、generate 三个阶段的工作原理。
tags:
  - Vue
  - 模板编译
  - AST
  - 渲染函数
estimatedTime: 20 分钟
keywords:
  - vue template compilation
  - AST
  - render function
highlight: 模板编译分为三步：解析成 AST、转换优化 AST、生成渲染函数代码。
order: 201
---

## 问题 1：模板编译的整体流程

Vue 的模板编译分为三个阶段：

```
Template → Parse → AST → Transform → 优化后的 AST → Generate → 渲染函数
```

### 简单示例

```html
<!-- 模板 -->
<div id="app">{{ message }}</div>

<!-- 编译后的渲染函数 -->
function render() { return h('div', { id: 'app' }, this.message) }
```

---

## 问题 2：Parse 阶段做了什么？

Parse 阶段将模板字符串解析成 **AST（抽象语法树）**。

### 解析过程

```javascript
// 输入模板
const template = '<div class="container"><span>{{ text }}</span></div>';

// 解析后的 AST
const ast = {
  type: "Element",
  tag: "div",
  props: [{ name: "class", value: "container" }],
  children: [
    {
      type: "Element",
      tag: "span",
      children: [
        {
          type: "Interpolation", // 插值表达式
          content: { type: "Expression", content: "text" },
        },
      ],
    },
  ],
};
```

### 解析器的工作方式

```javascript
// 简化的解析逻辑
function parse(template) {
  const context = { source: template };

  while (context.source) {
    if (context.source.startsWith("<")) {
      // 解析标签
      parseElement(context);
    } else if (context.source.startsWith("{{")) {
      // 解析插值
      parseInterpolation(context);
    } else {
      // 解析文本
      parseText(context);
    }
  }
}
```

---

## 问题 3：Transform 阶段做了什么？

Transform 阶段对 AST 进行**遍历和转换**，主要做两件事：

### 1. 节点转换

将模板 AST 转换为 JavaScript AST：

```javascript
// 模板 AST 节点
{ type: 'Element', tag: 'div', children: [...] }

// 转换为 JS AST（表示 h() 函数调用）
{
  type: 'CallExpression',
  callee: 'h',
  arguments: ['div', null, children]
}
```

### 2. 静态提升优化

```html
<template>
  <div>
    <span>静态文本</span>
    <!-- 静态节点，可提升 -->
    <span>{{ dynamic }}</span>
    <!-- 动态节点 -->
  </div>
</template>
```

```javascript
// 静态节点被提升到渲染函数外部
const _hoisted_1 = h("span", null, "静态文本");

function render() {
  return h("div", null, [
    _hoisted_1, // 复用静态节点，不重复创建
    h("span", null, this.dynamic),
  ]);
}
```

### 3. 标记动态节点（PatchFlags）

```javascript
// Vue 3 使用 PatchFlags 标记动态内容类型
const PatchFlags = {
  TEXT: 1, // 动态文本
  CLASS: 2, // 动态 class
  STYLE: 4, // 动态 style
  PROPS: 8, // 动态属性
};

// 编译时标记，运行时只检查标记的部分
h("div", { class: dynamicClass }, text, PatchFlags.TEXT | PatchFlags.CLASS);
```

---

## 问题 4：Generate 阶段做了什么？

Generate 阶段将转换后的 AST 生成**可执行的渲染函数代码字符串**。

### 代码生成示例

```javascript
// 转换后的 JS AST
const jsAST = {
  type: "FunctionDecl",
  id: "render",
  body: [
    {
      type: "ReturnStatement",
      return: {
        type: "CallExpression",
        callee: "h",
        arguments: ["div", '{ id: "app" }', "ctx.message"],
      },
    },
  ],
};

// 生成的代码字符串
const code = `
function render(ctx) {
  return h('div', { id: 'app' }, ctx.message)
}
`;
```

### 生成器的工作方式

```javascript
function generate(ast) {
  const context = {
    code: "",
    push(str) {
      this.code += str;
    },
  };

  // 递归遍历 AST，生成代码
  genNode(ast, context);

  return context.code;
}

function genNode(node, context) {
  switch (node.type) {
    case "FunctionDecl":
      genFunctionDecl(node, context);
      break;
    case "CallExpression":
      genCallExpression(node, context);
      break;
    // ...
  }
}
```

---

## 问题 5：编译发生在什么时候？

### 运行时编译

```javascript
// 包含编译器的完整版 Vue
import { createApp } from "vue";

createApp({
  template: "<div>{{ message }}</div>", // 运行时编译
  data: () => ({ message: "Hello" }),
});
```

### 构建时编译（推荐）

```vue
<!-- .vue 文件在构建时被 vue-loader 编译 -->
<template>
  <div>{{ message }}</div>
</template>
```

构建时编译的优势：

- **更小的包体积**：不需要包含编译器
- **更好的性能**：编译在构建时完成，不占用运行时

## 延伸阅读

- [Vue 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 3 模板编译原理](https://github.com/vuejs/core/tree/main/packages/compiler-core)
