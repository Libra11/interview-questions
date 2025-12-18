---
title: Webpack 如何处理循环依赖（Circular Dependency）？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 处理循环依赖的机制，掌握循环依赖的问题和解决方案。
tags:
  - Webpack
  - 循环依赖
  - 模块系统
  - 常见问题
estimatedTime: 12 分钟
keywords:
  - 循环依赖
  - Circular Dependency
  - 模块加载
highlight: Webpack 通过模块缓存机制处理循环依赖，但可能导致获取到未完成初始化的模块，需要注意代码设计。
order: 760
---

## 问题 1：什么是循环依赖？

**循环依赖是指两个或多个模块相互引用，形成闭环**。

```javascript
// a.js
import { b } from "./b.js";
export const a = "a";
console.log("a.js:", b);

// b.js
import { a } from "./a.js";
export const b = "b";
console.log("b.js:", a);
```

依赖关系：a → b → a（形成环）

---

## 问题 2：Webpack 如何处理？

Webpack 使用**模块缓存**来处理循环依赖：

```javascript
// Webpack 运行时（简化）
var cache = {};

function require(moduleId) {
  // 1. 检查缓存，如果存在直接返回（即使模块未执行完）
  if (cache[moduleId]) {
    return cache[moduleId].exports;
  }

  // 2. 创建模块对象并缓存（此时 exports 是空对象）
  var module = (cache[moduleId] = { exports: {} });

  // 3. 执行模块代码
  modules[moduleId](module, module.exports, require);

  // 4. 返回 exports
  return module.exports;
}
```

关键点：**模块在执行前就被缓存了**，所以循环引用时返回的是未完成初始化的 exports。

---

## 问题 3：循环依赖的执行过程

```javascript
// a.js
import { b } from "./b.js";
export const a = "a";

// b.js
import { a } from "./a.js";
export const b = "b";
console.log(a); // 输出什么？
```

执行顺序：

```
1. 开始执行 a.js
2. 遇到 import b，暂停 a.js，去执行 b.js
3. 开始执行 b.js
4. 遇到 import a，但 a.js 已在缓存中（未执行完）
5. 返回 a.js 当前的 exports（此时 a 还未定义！）
6. b.js 中 console.log(a) 输出 undefined
7. b.js 执行完毕
8. 继续执行 a.js
```

---

## 问题 4：CommonJS vs ESM 的差异

### CommonJS

```javascript
// a.js
const b = require("./b");
module.exports.a = "a";

// b.js
const a = require("./a");
module.exports.b = "b";
console.log(a); // { }（空对象，因为 a 还没赋值）
```

### ES Module

```javascript
// a.js
import { b } from "./b.js";
export const a = "a";

// b.js
import { a } from "./a.js";
export const b = "b";
console.log(a); // undefined（变量提升但未初始化）
```

ESM 的导出是**实时绑定**，如果在正确的时机访问，可以获取到值：

```javascript
// b.js
import { a } from "./a.js";
export const b = "b";
setTimeout(() => console.log(a), 0); // 'a'（此时 a.js 已执行完）
```

---

## 问题 5：如何避免循环依赖问题？

### 1. 重构代码结构

将公共部分提取到第三个模块：

```javascript
// 之前：a ↔ b
// 之后：a → common ← b

// common.js
export const shared = "shared";

// a.js
import { shared } from "./common";

// b.js
import { shared } from "./common";
```

### 2. 延迟访问

将访问时机推迟到模块初始化完成后：

```javascript
// b.js
import { a } from "./a.js";

export function getA() {
  return a; // 函数调用时 a 已经初始化
}
```

### 3. 使用检测工具

```javascript
// webpack.config.js
const CircularDependencyPlugin = require("circular-dependency-plugin");

plugins: [
  new CircularDependencyPlugin({
    exclude: /node_modules/,
    failOnError: true,
  }),
];
```

## 延伸阅读

- [Circular Dependency Plugin](https://github.com/aackerman/circular-dependency-plugin)
- [ES Modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
