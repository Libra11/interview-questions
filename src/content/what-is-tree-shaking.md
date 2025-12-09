---
title: 什么是 Tree-shaking？
category: 工程化
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 Tree-shaking 的概念、原理和使用条件。
tags:
  - Webpack
  - Tree-shaking
  - 打包优化
  - 工程化
estimatedTime: 10 分钟
keywords:
  - Tree-shaking
  - dead code elimination
  - ES modules
  - bundle optimization
highlight: Tree-shaking 是移除未使用代码的优化技术，依赖 ES Modules 的静态分析特性。
order: 287
---

## 问题 1：什么是 Tree-shaking？

### 定义

Tree-shaking 是一种**移除未使用代码**（Dead Code）的优化技术。

```javascript
// math.js
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export function multiply(a, b) {
  return a * b;
}

// app.js
import { add } from "./math";
console.log(add(1, 2));

// 打包结果：只包含 add 函数
// subtract 和 multiply 被"摇掉"了
```

### 名称由来

```
想象一棵树，摇晃它（shake）
枯死的叶子（未使用的代码）会掉落
只留下活着的部分（使用的代码）
```

---

## 问题 2：Tree-shaking 的原理？

### 依赖 ES Modules

```javascript
// ES Modules 是静态的
import { add } from "./math"; // 编译时确定

// CommonJS 是动态的
const math = require("./math"); // 运行时确定
const fn = math[condition ? "add" : "subtract"];

// Tree-shaking 只能分析静态导入
```

### 工作流程

```javascript
// 1. 分析模块依赖图
// 2. 标记使用的导出（used exports）
// 3. 压缩时移除未使用的代码

// Webpack 配置
module.exports = {
  mode: "production", // 生产模式自动启用
  optimization: {
    usedExports: true, // 标记未使用导出
    minimize: true, // 压缩时移除
  },
};
```

---

## 问题 3：使用条件？

### 必须使用 ES Modules

```javascript
// ✅ 可以 Tree-shaking
export function add() {}
export function subtract() {}

// ❌ 不能 Tree-shaking
module.exports = {
  add: function () {},
  subtract: function () {},
};
```

### 标记 sideEffects

```json
// package.json
{
  "sideEffects": false  // 标记所有模块无副作用
}

// 或指定有副作用的文件
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}
```

### 什么是副作用？

```javascript
// 有副作用：导入时执行代码
import "./polyfills"; // 执行 polyfills
import "./styles.css"; // 注入样式

// 无副作用：只导出，不执行
export function add() {}
```

---

## 问题 4：常见问题？

### 问题 1：整个库被打包

```javascript
// ❌ 引入整个 lodash
import _ from "lodash";
_.debounce();

// ✅ 按路径引入
import debounce from "lodash/debounce";

// ✅ 使用 lodash-es
import { debounce } from "lodash-es";
```

### 问题 2：类方法无法 Tree-shake

```javascript
// 类的方法无法被移除
class Utils {
  static add() {}
  static subtract() {} // 即使未使用也会保留
}

// 改用独立函数
export function add() {}
export function subtract() {}
```

### 问题 3：重导出问题

```javascript
// index.js
export * from "./a";
export * from "./b";

// 可能导致整个模块被打包
// 建议具名导出
export { funcA } from "./a";
export { funcB } from "./b";
```

---

## 问题 5：验证 Tree-shaking？

### 使用 webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
```

### 检查打包结果

```bash
# 查看打包后的代码
# 确认未使用的函数是否被移除
```

## 总结

| 条件        | 说明                   |
| ----------- | ---------------------- |
| ES Modules  | 必须使用 import/export |
| sideEffects | 标记无副作用           |
| 生产模式    | mode: 'production'     |
| 压缩        | minimize: true         |

## 延伸阅读

- [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
