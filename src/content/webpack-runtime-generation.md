---
title: Webpack 如何生成最终的 Runtime？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack Runtime 的生成过程，掌握运行时代码的组成和作用。
tags:
  - Webpack
  - Runtime
  - 原理
  - 打包
estimatedTime: 15 分钟
keywords:
  - Runtime
  - 运行时
  - __webpack_require__
  - 模块系统
highlight: Webpack Runtime 是打包后代码的运行时环境，包含模块加载、缓存、异步加载等核心功能。
order: 701
---

## 问题 1：Runtime 的组成

```javascript
// Webpack 打包后的 Runtime（简化）
(function() {
  // 1. 模块缓存
  var __webpack_module_cache__ = {};

  // 2. 模块加载函数
  function __webpack_require__(moduleId) { ... }

  // 3. 异步加载函数
  __webpack_require__.e = function(chunkId) { ... };

  // 4. 公共路径
  __webpack_require__.p = '/dist/';

  // 5. 模块定义
  var __webpack_modules__ = { ... };

  // 6. 启动入口
  __webpack_require__('./src/index.js');
})();
```

---

## 问题 2：**webpack_require** 实现

```javascript
function __webpack_require__(moduleId) {
  // 检查缓存
  var cachedModule = __webpack_module_cache__[moduleId];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }

  // 创建新模块
  var module = (__webpack_module_cache__[moduleId] = {
    id: moduleId,
    loaded: false,
    exports: {},
  });

  // 执行模块函数
  __webpack_modules__[moduleId].call(
    module.exports,
    module,
    module.exports,
    __webpack_require__
  );

  // 标记已加载
  module.loaded = true;

  // 返回导出
  return module.exports;
}
```

---

## 问题 3：ES Module 互操作

```javascript
// 处理 ES Module 的 default 导出
__webpack_require__.n = function (module) {
  var getter =
    module && module.__esModule
      ? function () {
          return module["default"];
        }
      : function () {
          return module;
        };
  __webpack_require__.d(getter, { a: getter });
  return getter;
};

// 定义导出属性
__webpack_require__.d = function (exports, definition) {
  for (var key in definition) {
    if (
      __webpack_require__.o(definition, key) &&
      !__webpack_require__.o(exports, key)
    ) {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: definition[key],
      });
    }
  }
};

// 标记为 ES Module
__webpack_require__.r = function (exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
};
```

---

## 问题 4：模块代码包装

```javascript
// 源代码
import { add } from './math';
console.log(add(1, 2));

// 打包后的模块
{
  './src/index.js': function(module, exports, __webpack_require__) {
    __webpack_require__.r(exports);
    var _math__WEBPACK_IMPORTED_MODULE_0__ =
      __webpack_require__('./src/math.js');
    console.log(
      (0, _math__WEBPACK_IMPORTED_MODULE_0__.add)(1, 2)
    );
  }
}
```

---

## 问题 5：Runtime 生成过程

```
1. 收集 Runtime 需求
   - 是否有异步加载？
   - 是否有 ES Module？
   - 是否有 HMR？
       │
       ↓
2. 选择 Runtime 模块
   - 基础模块系统
   - 异步加载模块
   - HMR 模块
       │
       ↓
3. 生成 Runtime 代码
   - 组合所需模块
   - 注入配置（publicPath 等）
       │
       ↓
4. 输出到文件
   - 内联到入口 Chunk
   - 或单独的 runtime Chunk
```

---

## 问题 6：提取 Runtime

```javascript
// 配置
optimization: {
  runtimeChunk: 'single',
}

// 输出
// runtime.js - 包含 Runtime 代码
// main.js - 只包含业务代码
// vendors.js - 只包含第三方库
```

提取 Runtime 的好处：

- 业务代码变化不影响 Runtime 的 hash
- 更好的长期缓存

## 延伸阅读

- [Runtime](https://webpack.js.org/concepts/manifest/)
- [optimization.runtimeChunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk)
