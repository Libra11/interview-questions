---
title: Webpack runtimeChunk 的作用是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 runtimeChunk 配置的作用，掌握它如何帮助优化长期缓存。
tags:
  - Webpack
  - runtimeChunk
  - 缓存优化
  - 代码分割
estimatedTime: 12 分钟
keywords:
  - runtimeChunk
  - runtime
  - 长期缓存
  - contenthash
highlight: runtimeChunk 将 Webpack 运行时代码提取到单独文件，避免业务代码变化影响其他 chunk 的 hash，优化缓存。
order: 777
---

## 问题 1：什么是 Runtime？

**Runtime 是 Webpack 的运行时代码**，包含：

- 模块加载逻辑（`__webpack_require__`）
- 模块缓存
- 异步加载逻辑
- 模块 ID 映射

```javascript
// Runtime 代码示例（简化）
var __webpack_modules__ = {};
var __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  if (__webpack_module_cache__[moduleId]) {
    return __webpack_module_cache__[moduleId].exports;
  }
  // ...
}
```

---

## 问题 2：为什么要提取 Runtime？

默认情况下，Runtime 代码内嵌在入口 chunk 中。问题是：

```javascript
// 场景：只修改了 utils.js
// 但 main.js 的 hash 也变了！

// 原因：
// 1. utils.js 变化，其 moduleId 可能变化
// 2. Runtime 中的模块映射表更新
// 3. main.js 包含 Runtime，所以 hash 变化
```

提取 Runtime 后：

```javascript
// utils.js 变化
// runtime.js 的 hash 变化（模块映射更新）
// main.js 的 hash 不变（不包含 Runtime）
// vendor.js 的 hash 不变
```

---

## 问题 3：如何配置？

```javascript
module.exports = {
  optimization: {
    // 提取 runtime 到单独文件
    runtimeChunk: "single",

    // 或者每个入口单独的 runtime
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },
  },
};
```

配置选项：

| 值             | 说明                      |
| -------------- | ------------------------- |
| `'single'`     | 所有入口共享一个 runtime  |
| `true`         | 每个入口单独的 runtime    |
| `{ name: fn }` | 自定义 runtime chunk 名称 |

---

## 问题 4：配合 moduleIds 使用

```javascript
module.exports = {
  optimization: {
    // 提取 runtime
    runtimeChunk: "single",

    // 使用确定性的模块 ID
    moduleIds: "deterministic",

    // 使用确定性的 chunk ID
    chunkIds: "deterministic",
  },
};
```

`moduleIds: 'deterministic'` 确保模块 ID 稳定，进一步优化缓存。

---

## 问题 5：完整的缓存优化配置

```javascript
module.exports = {
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
  },
  optimization: {
    runtimeChunk: "single",
    moduleIds: "deterministic",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};
```

输出结果：

```
dist/
├── runtime.abc123.js    # Runtime（很小，变化频繁）
├── vendors.def456.js    # 第三方库（较大，很少变化）
└── main.ghi789.js       # 业务代码（中等，经常变化）
```

这样，修改业务代码时，vendors 的缓存不会失效。

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [optimization.runtimeChunk](https://webpack.js.org/configuration/optimization/#optimizationruntimechunk)
