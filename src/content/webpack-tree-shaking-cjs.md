---
title: 为什么 Tree-shaking 对 CommonJS 无效？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Tree-shaking 无法应用于 CommonJS 的根本原因，对比 ES Module 和 CommonJS 的差异。
tags:
  - Webpack
  - Tree-shaking
  - CommonJS
  - ES Module
estimatedTime: 12 分钟
keywords:
  - CommonJS
  - ES Module
  - 静态分析
  - 动态导入
highlight: CommonJS 是动态的，导入导出在运行时确定，无法在编译时静态分析，因此无法进行 Tree-shaking。
order: 768
---

## 问题 1：ES Module vs CommonJS 的核心差异

| 特性      | ES Module        | CommonJS       |
| --------- | ---------------- | -------------- |
| 导入时机  | 编译时           | 运行时         |
| 导入方式  | 静态             | 动态           |
| 导出绑定  | 实时绑定（引用） | 值的拷贝       |
| 顶层 this | undefined        | module.exports |

**关键差异：ES Module 是静态的，CommonJS 是动态的**。

---

## 问题 2：CommonJS 的动态特性

CommonJS 的 require 可以在任何地方调用，导出也可以动态修改：

```javascript
// CommonJS 可以条件导入
if (condition) {
  const a = require("./a");
}

// 可以动态拼接路径
const module = require("./" + name);

// 可以在运行时修改导出
module.exports.foo = "bar";
setTimeout(() => {
  module.exports.foo = "baz"; // 运行时修改
}, 1000);
```

这些动态特性让静态分析变得不可能。

---

## 问题 3：ES Module 的静态特性

ES Module 的 import/export 必须在模块顶层，且路径必须是字符串字面量：

```javascript
// ✅ 合法：顶层静态导入
import { add } from './utils';

// ❌ 非法：条件导入
if (condition) {
  import { add } from './utils';  // 语法错误！
}

// ❌ 非法：动态路径
import { add } from './' + name;  // 语法错误！
```

这种静态结构让编译器可以在不执行代码的情况下分析依赖关系。

---

## 问题 4：为什么静态分析很重要？

Tree-shaking 需要在**编译时**确定哪些代码被使用：

```javascript
// ES Module：编译时就知道只用了 add
import { add } from "./utils";
// Webpack 可以安全地移除 sub、mul

// CommonJS：运行时才知道用了什么
const utils = require("./utils");
const fn = utils[getMethodName()]; // 无法静态分析
// Webpack 必须保留所有导出
```

---

## 问题 5：CommonJS 的具体问题示例

```javascript
// utils.js (CommonJS)
exports.add = (a, b) => a + b;
exports.sub = (a, b) => a - b;

// app.js
const utils = require("./utils");

// 场景1：解构使用
const { add } = utils;
// Webpack 不知道 sub 是否会被用到
// 因为 utils 对象可能被传递到其他地方

// 场景2：动态访问
const method = "add";
utils[method](1, 2);
// 完全无法静态分析

// 场景3：对象传递
doSomething(utils);
// utils 的任何属性都可能被使用
```

---

## 问题 6：解决方案

### 1. 使用 ES Module 版本的库

```javascript
// ❌ CommonJS 版本
const { debounce } = require("lodash");

// ✅ ES Module 版本
import { debounce } from "lodash-es";
```

### 2. 使用 babel-plugin-import 按需加载

```javascript
// babel.config.js
plugins: [["import", { libraryName: "antd", style: true }]];

// 自动转换
import { Button } from "antd";
// → import Button from 'antd/es/button';
```

### 3. 确保自己的代码使用 ES Module

```javascript
// ❌ 避免
module.exports = { add, sub };

// ✅ 推荐
export { add, sub };
```

## 延伸阅读

- [ES Modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
