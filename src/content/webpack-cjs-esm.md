---
title: 为什么 Webpack 能支持 CommonJS + ESModule？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 如何同时支持 CommonJS 和 ES Module 两种模块系统，以及它们的互操作机制。
tags:
  - Webpack
  - CommonJS
  - ESModule
  - 模块系统
estimatedTime: 15 分钟
keywords:
  - CommonJS
  - ESModule
  - 模块互操作
  - 模块转换
highlight: Webpack 将所有模块统一转换为自己的模块格式，通过运行时代码实现 CJS 和 ESM 的互操作。
order: 759
---

## 问题 1：两种模块系统的区别

### CommonJS（CJS）

```javascript
// 导出
module.exports = { name: "cjs" };
exports.name = "cjs";

// 导入
const module = require("./module");
```

特点：**同步加载、运行时确定依赖、值的拷贝**

### ES Module（ESM）

```javascript
// 导出
export const name = "esm";
export default { name: "esm" };

// 导入
import { name } from "./module";
import module from "./module";
```

特点：**静态分析、编译时确定依赖、值的引用**

---

## 问题 2：Webpack 如何统一处理？

**Webpack 将所有模块转换为自己的内部格式**，不管原始代码是 CJS 还是 ESM。

```javascript
// 原始 ESM 代码
import { add } from "./math";
export const result = add(1, 2);

// Webpack 转换后（简化）
__webpack_require__.r(__webpack_exports__);
var _math__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./math.js");
var result = (0, _math__WEBPACK_IMPORTED_MODULE_0__.add)(1, 2);
__webpack_require__.d(__webpack_exports__, { result: () => result });
```

核心函数：

- `__webpack_require__`：模块加载函数
- `__webpack_require__.r`：标记为 ES 模块
- `__webpack_require__.d`：定义导出

---

## 问题 3：CJS 和 ESM 如何互相引用？

### ESM 引用 CJS

```javascript
// cjs-module.js (CommonJS)
module.exports = { name: "cjs" };

// esm-module.js (ES Module)
import cjs from "./cjs-module";
// cjs = { name: 'cjs' }
```

Webpack 会将 CJS 的 `module.exports` 作为 ESM 的默认导出。

### CJS 引用 ESM

```javascript
// esm-module.js (ES Module)
export const name = "esm";
export default { type: "esm" };

// cjs-module.js (CommonJS)
const esm = require("./esm-module");
// esm = { name: 'esm', default: { type: 'esm' } }
```

注意：CJS 引用 ESM 时，default 导出需要通过 `.default` 访问。

---

## 问题 4：Webpack 的模块包装

Webpack 将每个模块包装成函数：

```javascript
// Webpack 打包结果（简化）
var __webpack_modules__ = {
  "./src/index.js": function (module, exports, __webpack_require__) {
    // 模块代码
  },
  "./src/utils.js": function (module, exports, __webpack_require__) {
    // 模块代码
  },
};

// 模块加载函数
function __webpack_require__(moduleId) {
  // 检查缓存
  if (__webpack_module_cache__[moduleId]) {
    return __webpack_module_cache__[moduleId].exports;
  }
  // 创建模块并缓存
  var module = (__webpack_module_cache__[moduleId] = { exports: {} });
  // 执行模块函数
  __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  return module.exports;
}
```

这种统一的包装方式让 CJS 和 ESM 可以无缝混用。

---

## 问题 5：注意事项

### 1. default 导出的处理

```javascript
// ESM
export default function () {}

// CJS 引用时
const fn = require("./esm").default; // 需要 .default
```

### 2. 命名导出的处理

```javascript
// ESM
export const name = "test";

// CJS 引用时
const { name } = require("./esm"); // 可以直接解构
```

### 3. 推荐做法

项目中尽量统一使用一种模块系统，推荐使用 ESM，因为：

- 支持 Tree-shaking
- 是 JavaScript 标准
- 静态分析更友好

## 延伸阅读

- [Modules](https://webpack.js.org/concepts/modules/)
- [Module Methods](https://webpack.js.org/api/module-methods/)
