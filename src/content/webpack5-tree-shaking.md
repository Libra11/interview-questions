---
title: Webpack5 如何实现更好的 Tree-shaking？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  了解 Webpack 5 在 Tree-shaking 方面的改进，包括嵌套 Tree-shaking 和 CommonJS 支持。
tags:
  - Webpack
  - Webpack5
  - Tree-shaking
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - Webpack5 Tree-shaking
  - 嵌套 Tree-shaking
  - CommonJS Tree-shaking
  - 死代码消除
highlight: Webpack 5 支持嵌套的 Tree-shaking、内部模块 Tree-shaking，以及对 CommonJS 的部分 Tree-shaking 支持。
order: 665
---

## 问题 1：嵌套的 Tree-shaking

**Webpack 5 可以分析嵌套的导出**：

```javascript
// utils.js
export const utils = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
};

// app.js
import { utils } from "./utils";
console.log(utils.add(1, 2));

// Webpack 4：保留整个 utils 对象
// Webpack 5：可以移除 utils.sub
```

---

## 问题 2：内部模块 Tree-shaking

**Webpack 5 可以分析模块内部的导出关系**：

```javascript
// module.js
import { something } from "./other";

export function used() {
  return something();
}

export function unused() {
  return "unused";
}

// Webpack 5 可以追踪：
// - used 被使用
// - unused 未被使用
// - something 只被 used 使用
```

---

## 问题 3：CommonJS Tree-shaking

**Webpack 5 对 CommonJS 有一定的 Tree-shaking 能力**：

```javascript
// Webpack 4：CommonJS 完全无法 Tree-shaking

// Webpack 5：可以分析简单的 CommonJS 模式
const { pick } = require("lodash");
// 可以识别只使用了 pick

// 但复杂模式仍然无法分析
const _ = require("lodash");
_[dynamicMethod](); // 无法分析
```

---

## 问题 4：export \* 的优化

```javascript
// barrel.js
export * from "./a";
export * from "./b";
export * from "./c";

// app.js
import { funcA } from "./barrel";

// Webpack 4：可能保留 b、c 的导出
// Webpack 5：只保留 a 中被使用的导出
```

---

## 问题 5：配置优化

```javascript
module.exports = {
  mode: "production",
  optimization: {
    // 启用更激进的优化
    usedExports: true,
    minimize: true,

    // 内部模块优化
    innerGraph: true, // 默认开启

    // 副作用分析
    sideEffects: true,
  },
};
```

配合 package.json：

```json
{
  "sideEffects": false
}
```

---

## 问题 6：验证 Tree-shaking 效果

```javascript
// 开发模式下查看标记
module.exports = {
  mode: "development",
  optimization: {
    usedExports: true,
  },
};

// 打包结果中会有注释
/* unused harmony export unusedFunc */
```

使用 webpack-bundle-analyzer 可视化分析打包结果。

## 延伸阅读

- [Webpack 5 Tree Shaking](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#major-changes-optimization)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
