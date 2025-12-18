---
title: Tree-shaking 仍然无效的可能原因有哪些？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  排查 Tree-shaking 不生效的常见原因，掌握确保 Tree-shaking 正常工作的方法。
tags:
  - Webpack
  - Tree-shaking
  - 问题排查
  - 优化
estimatedTime: 15 分钟
keywords:
  - Tree-shaking 失效
  - 问题排查
  - sideEffects
  - ES Module
highlight: Tree-shaking 失效通常由 CommonJS 模块、Babel 配置错误、缺少 sideEffects 声明或代码副作用导致。
order: 811
---

## 问题 1：使用了 CommonJS

```javascript
// ❌ CommonJS 无法 Tree-shaking
const { add } = require("./utils");
module.exports = { add };

// ✅ 使用 ES Module
import { add } from "./utils";
export { add };
```

---

## 问题 2：Babel 将 ES Module 转换为 CommonJS

```javascript
// ❌ 错误配置
// babel.config.js
module.exports = {
  presets: ["@babel/preset-env"], // 默认转换为 CommonJS
};

// ✅ 正确配置
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false, // 保留 ES Module
      },
    ],
  ],
};
```

---

## 问题 3：缺少 sideEffects 配置

```json
// ❌ 没有 sideEffects 配置
// Webpack 会保守处理，保留可能有副作用的代码

// ✅ 添加 sideEffects 配置
// package.json
{
  "sideEffects": false
}

// 或指定有副作用的文件
{
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

---

## 问题 4：代码有副作用

```javascript
// ❌ 模块顶层有副作用
let counter = 0;
export function increment() {
  counter++;
}
// counter 的初始化是副作用，模块会被保留

// ❌ 立即执行的代码
console.log("Module loaded");
export const value = 1;

// ✅ 纯函数，无副作用
export function add(a, b) {
  return a + b;
}
```

---

## 问题 5：第三方库不支持

```javascript
// ❌ lodash 是 CommonJS
import { debounce } from "lodash";

// ✅ 使用 ES Module 版本
import { debounce } from "lodash-es";

// ✅ 或单独引入
import debounce from "lodash/debounce";
```

检查第三方库的 package.json：

```json
{
  "main": "lib/index.js", // CommonJS
  "module": "es/index.js", // ES Module（Webpack 优先使用）
  "sideEffects": false // 声明无副作用
}
```

---

## 问题 6：开发模式下不生效

```javascript
// Tree-shaking 只在 production 模式下完全生效
module.exports = {
  mode: "production", // 必须是 production
};

// 开发模式下只会标记，不会移除
// /* unused harmony export unusedFunc */
```

---

## 问题 7：动态导入无法分析

```javascript
// ❌ 动态属性访问
import * as utils from "./utils";
const method = getMethodName();
utils[method](); // 无法静态分析

// ✅ 静态导入
import { add } from "./utils";
add(1, 2);
```

---

## 问题 8：排查清单

```
□ 使用 ES Module 语法（import/export）
□ Babel 配置 modules: false
□ package.json 配置 sideEffects
□ Webpack mode: 'production'
□ 第三方库提供 ES Module 版本
□ 代码没有顶层副作用
□ 没有动态属性访问
```

## 延伸阅读

- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [sideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
