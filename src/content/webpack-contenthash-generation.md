---
title: Webpack contenthash 是如何生成的？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack contenthash 的生成原理，了解影响 hash 变化的因素。
tags:
  - Webpack
  - contenthash
  - 缓存
  - 构建原理
estimatedTime: 12 分钟
keywords:
  - contenthash
  - hash 生成
  - 文件指纹
  - 缓存策略
highlight: contenthash 基于文件内容生成，Webpack 对模块内容进行 hash 计算，只有内容变化时 hash 才会变化。
order: 651
---

## 问题 1：contenthash 的生成原理

**contenthash 是基于文件最终内容计算的 hash 值**。

```javascript
// 简化的 hash 计算过程
const crypto = require("crypto");

function generateContentHash(content) {
  return crypto
    .createHash("md4") // Webpack 默认使用 md4
    .update(content)
    .digest("hex")
    .slice(0, 20); // 默认取前 20 位
}
```

Webpack 在生成最终文件时，对文件内容进行 hash 计算。

---

## 问题 2：影响 contenthash 的因素

### 1. 模块自身内容

```javascript
// 修改代码会改变 hash
export const name = "old";
// → export const name = 'new';
```

### 2. 依赖模块的变化

```javascript
// 如果依赖的模块内容变了
// 当前模块的 hash 可能也会变（取决于打包方式）
import { util } from "./util"; // util 变了
```

### 3. Webpack 配置变化

```javascript
// 某些配置变化会影响输出内容
mode: "development"; // → mode: 'production'
// 压缩、优化等会改变内容
```

---

## 问题 3：为什么有时 hash 意外变化？

### 模块 ID 变化

```javascript
// 新增或删除模块可能导致模块 ID 重新分配
// 解决：使用 deterministic 模块 ID
optimization: {
  moduleIds: 'deterministic',
}
```

### Runtime 代码变化

```javascript
// Runtime 包含模块映射，模块变化会影响 runtime
// 解决：提取 runtime 到单独文件
optimization: {
  runtimeChunk: 'single',
}
```

### 异步 chunk 的 ID 变化

```javascript
// 动态导入的 chunk ID 变化会影响引用它的模块
// 解决：使用 deterministic chunk ID
optimization: {
  chunkIds: 'deterministic',
}
```

---

## 问题 4：hash 长度配置

```javascript
output: {
  // 完整 hash（默认 20 位）
  filename: '[name].[contenthash].js',

  // 指定长度（8 位通常足够）
  filename: '[name].[contenthash:8].js',
}
```

8 位 hex 有 16^8 ≈ 43 亿种可能，足以避免冲突。

---

## 问题 5：调试 hash 变化

使用 webpack-stats-plugin 分析：

```javascript
const { StatsWriterPlugin } = require("webpack-stats-plugin");

plugins: [
  new StatsWriterPlugin({
    filename: "stats.json",
    fields: ["hash", "chunks", "modules"],
  }),
];
```

或使用 webpack --json 输出详细信息：

```bash
webpack --json > stats.json
```

然后对比两次构建的 stats.json，找出变化的模块。

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [Output filename](https://webpack.js.org/configuration/output/#outputfilename)
