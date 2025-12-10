---
title: Webpack Scope Hoisting 如何提升性能？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 Scope Hoisting（作用域提升）的原理和作用，掌握它如何减少代码体积和提升运行效率。
tags:
  - Webpack
  - Scope Hoisting
  - 性能优化
  - ModuleConcatenationPlugin
estimatedTime: 12 分钟
keywords:
  - Scope Hoisting
  - 作用域提升
  - 模块合并
  - 性能优化
highlight: Scope Hoisting 将多个模块合并到一个函数作用域中，减少函数声明和闭包开销，提升运行性能。
order: 634
---

## 问题 1：什么是 Scope Hoisting？

**Scope Hoisting（作用域提升）是将多个模块的代码合并到一个函数作用域中**，而不是每个模块都包装成单独的函数。

```javascript
// 没有 Scope Hoisting（每个模块一个函数）
(function (modules) {
  // ...
})({
  "./a.js": function (module, exports) {
    exports.a = "a";
  },
  "./b.js": function (module, exports, require) {
    var a = require("./a.js");
    console.log(a.a);
  },
});

// 有 Scope Hoisting（合并到一个作用域）
(function () {
  var a = "a";
  console.log(a);
})();
```

---

## 问题 2：Scope Hoisting 的好处

### 1. 减少代码体积

```javascript
// 之前：每个模块都有函数包装
function(module, exports, require) { ... }
function(module, exports, require) { ... }

// 之后：合并后没有额外的函数包装
// 减少了函数声明的代码
```

### 2. 减少函数调用

```javascript
// 之前：通过 require 调用
var a = require("./a.js");

// 之后：直接访问变量
var a = "a";
```

### 3. 提升运行效率

- 减少了闭包的创建
- 减少了作用域链的查找
- JavaScript 引擎可以更好地优化

---

## 问题 3：如何启用 Scope Hoisting？

Webpack 4+ 在 production 模式下自动启用：

```javascript
module.exports = {
  mode: "production", // 自动启用
};
```

手动配置：

```javascript
const webpack = require("webpack");

module.exports = {
  plugins: [new webpack.optimize.ModuleConcatenationPlugin()],
};
```

---

## 问题 4：Scope Hoisting 的限制

**只对 ES Module 有效**，以下情况无法应用：

```javascript
// ❌ CommonJS 模块
const a = require("./a");
module.exports = a;

// ❌ 动态导入
import("./dynamic-module");

// ❌ 被多个 chunk 引用的模块
// 这些模块需要保持独立，无法合并

// ✅ 静态 ES Module 导入
import { a } from "./a";
export const b = a;
```

---

## 问题 5：查看 Scope Hoisting 效果

使用 stats 查看哪些模块被合并：

```javascript
module.exports = {
  stats: {
    optimizationBailout: true, // 显示未能优化的原因
  },
};
```

或使用 webpack-bundle-analyzer 可视化查看。

常见的无法优化原因：

```
ModuleConcatenation bailout: Module is not an ECMAScript module
ModuleConcatenation bailout: Module is referenced from these modules with unsupported syntax
```

确保使用 ES Module 语法，并检查第三方库是否提供 ES Module 版本。

## 延伸阅读

- [ModuleConcatenationPlugin](https://webpack.js.org/plugins/module-concatenation-plugin/)
- [Scope Hoisting in Webpack](https://medium.com/webpack/brief-introduction-to-scope-hoisting-in-webpack-8435084c171f)
