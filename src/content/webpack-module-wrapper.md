---
title: Webpack 如何实现模块包装（IIFE）？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 如何将模块包装成函数，实现模块隔离和依赖管理。
tags:
  - Webpack
  - IIFE
  - 模块包装
  - 运行时
estimatedTime: 15 分钟
keywords:
  - 模块包装
  - IIFE
  - Webpack 运行时
  - 模块隔离
highlight: Webpack 将每个模块包装成函数，通过运行时的 __webpack_require__ 实现模块加载和缓存。
order: 763
---

## 问题 1：为什么需要模块包装？

浏览器原生不支持模块系统（ES Module 除外），Webpack 需要：

1. **隔离作用域**：避免变量污染全局
2. **管理依赖**：实现模块间的引用
3. **缓存模块**：避免重复执行

Webpack 通过将模块包装成函数来实现这些目标。

---

## 问题 2：打包后的代码结构

```javascript
// Webpack 打包输出（简化版）
(function (modules) {
  // 模块缓存
  var installedModules = {};

  // 模块加载函数
  function __webpack_require__(moduleId) {
    // 检查缓存
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    // 创建新模块并缓存
    var module = (installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {},
    });

    // 执行模块函数
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    module.loaded = true;
    return module.exports;
  }

  // 从入口开始执行
  return __webpack_require__("./src/index.js");
})({
  // 模块映射表
  "./src/index.js": function (module, exports, __webpack_require__) {
    var utils = __webpack_require__("./src/utils.js");
    console.log(utils.add(1, 2));
  },
  "./src/utils.js": function (module, exports, __webpack_require__) {
    exports.add = function (a, b) {
      return a + b;
    };
  },
});
```

---

## 问题 3：模块包装的核心机制

### 1. 模块函数签名

每个模块被包装成统一格式的函数：

```javascript
function (module, exports, __webpack_require__) {
  // 模块代码
}
```

参数说明：

- **module**：当前模块对象
- **exports**：导出对象（module.exports 的引用）
- ****webpack_require****：模块加载函数

### 2. 模块缓存

```javascript
// 第一次加载：执行模块函数，缓存结果
__webpack_require__("./utils.js"); // 执行

// 第二次加载：直接返回缓存
__webpack_require__("./utils.js"); // 不执行，返回缓存
```

### 3. 作用域隔离

```javascript
// 每个模块都是独立的函数作用域
// 模块内的变量不会污染全局
function (module, exports, __webpack_require__) {
  var privateVar = 'only in this module';
  exports.publicVar = 'exported';
}
```

---

## 问题 4：ES Module 的特殊处理

对于 ES Module，Webpack 会添加额外的标记：

```javascript
// 原始代码
export const name = 'test';
export default function () {}

// 打包后
function (module, __webpack_exports__, __webpack_require__) {
  // 标记为 ES Module
  __webpack_require__.r(__webpack_exports__);

  // 定义导出
  __webpack_require__.d(__webpack_exports__, {
    name: () => name,
    default: () => __WEBPACK_DEFAULT_EXPORT__
  });

  const name = 'test';
  const __WEBPACK_DEFAULT_EXPORT__ = function() {};
}
```

---

## 问题 5：Webpack 5 的优化

Webpack 5 引入了更高效的模块格式：

```javascript
// Webpack 5 使用数组而非对象
var __webpack_modules__ = [
  ,
  /* 0 */ /* unused */
  /* 1 */ (module, exports, __webpack_require__) => {
    // 模块代码
  },
];

// 使用箭头函数，代码更简洁
```

还支持输出 ES Module 格式：

```javascript
// webpack.config.js
output: {
  module: true,  // 输出 ES Module
}
```

## 延伸阅读

- [Module Methods](https://webpack.js.org/api/module-methods/)
- [Output Library](https://webpack.js.org/configuration/output/#outputlibrary)
