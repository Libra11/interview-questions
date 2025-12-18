---
title: 什么是 Tree-shaking？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Tree-shaking 的概念和原理，掌握它如何帮助减少打包体积。
tags:
  - Webpack
  - Tree-shaking
  - 死代码消除
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - Tree-shaking
  - 死代码消除
  - DCE
  - 打包优化
highlight: Tree-shaking 是一种死代码消除技术，通过静态分析移除 JavaScript 中未使用的代码，减少打包体积。
order: 766
---

## 问题 1：什么是 Tree-shaking？

**Tree-shaking 是一种死代码消除（Dead Code Elimination）技术**，它通过静态分析，找出并移除 JavaScript 模块中未被使用的代码。

名字来源于"摇树"的比喻：把代码想象成一棵树，摇一摇，没用的"枯叶"（死代码）就会掉落。

```javascript
// utils.js
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;
export const mul = (a, b) => a * b;

// app.js
import { add } from "./utils";
console.log(add(1, 2));

// Tree-shaking 后，sub 和 mul 会被移除
// 因为它们没有被使用
```

---

## 问题 2：Tree-shaking 的原理

Tree-shaking 依赖于 **ES Module 的静态结构**：

```javascript
// ES Module 的 import/export 是静态的
// 在编译时就能确定依赖关系
import { add } from "./utils"; // 编译时确定只用了 add

// CommonJS 是动态的，无法静态分析
const utils = require("./utils");
utils[someVariable](); // 运行时才知道用了什么
```

Webpack 的 Tree-shaking 流程：

1. **标记**：分析代码，标记哪些导出被使用
2. **摇树**：移除未被标记的导出
3. **压缩**：Terser 进一步移除死代码

---

## 问题 3：Tree-shaking 的效果示例

```javascript
// 打包前
// utils.js 包含 add, sub, mul 三个函数

// 打包后（只使用了 add）
// 只保留 add 函数，sub 和 mul 被移除
```

对于大型库效果明显：

```javascript
// 不使用 Tree-shaking
import _ from "lodash"; // 打包整个 lodash（~70KB）

// 使用 Tree-shaking
import { debounce } from "lodash-es"; // 只打包 debounce
```

---

## 问题 4：如何启用 Tree-shaking？

Webpack 4+ 在 production 模式下自动启用：

```javascript
module.exports = {
  mode: "production", // 自动启用 Tree-shaking
};
```

关键配置：

```javascript
module.exports = {
  mode: "production",
  optimization: {
    usedExports: true, // 标记未使用的导出
    minimize: true, // 启用压缩（移除死代码）
  },
};
```

---

## 问题 5：Tree-shaking 的局限性

### 1. 只对 ES Module 有效

```javascript
// ✅ ES Module
import { add } from "./utils";

// ❌ CommonJS（无法 Tree-shaking）
const { add } = require("./utils");
```

### 2. 副作用代码无法移除

```javascript
// 这段代码有副作用，不会被移除
import "./polyfill";

// 即使没有使用导出，模块也会被保留
import "./analytics";
```

### 3. 动态导入无法分析

```javascript
// 无法静态分析，不能 Tree-shaking
const module = await import(`./${name}.js`);
```

## 延伸阅读

- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Webpack Tree Shaking 原理](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#major-changes-optimization)
