---
title: Webpack hash、chunkhash、contenthash 的区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 Webpack 三种 hash 类型的区别和使用场景，掌握正确的缓存策略配置。
tags:
  - Webpack
  - hash
  - chunkhash
  - contenthash
estimatedTime: 12 分钟
keywords:
  - hash 区别
  - chunkhash
  - contenthash
  - 缓存优化
highlight: hash 是项目级别，chunkhash 是 chunk 级别，contenthash 是文件内容级别，推荐使用 contenthash。
order: 609
---

## 问题 1：三种 hash 的定义

| 类型        | 作用范围   | 变化条件                     |
| ----------- | ---------- | ---------------------------- |
| hash        | 整个项目   | 任何文件变化，所有 hash 都变 |
| chunkhash   | 单个 chunk | 该 chunk 内容变化才变        |
| contenthash | 单个文件   | 该文件内容变化才变           |

---

## 问题 2：hash（项目级）

**hash 是整个项目的 hash**，只要项目中任何文件发生变化，所有文件的 hash 都会改变。

```javascript
module.exports = {
  output: {
    filename: "[name].[hash].js",
  },
};
```

问题：修改一个文件，所有文件的 hash 都变了，缓存全部失效。

```
修改 index.js 后：
main.abc123.js  → main.def456.js  ✓ 应该变
vendor.abc123.js → vendor.def456.js  ✗ 不应该变，但也变了
```

**不推荐使用**，缓存效果差。

---

## 问题 3：chunkhash（chunk 级）

**chunkhash 是每个 chunk 独立的 hash**，只有当该 chunk 的内容变化时，hash 才会变。

```javascript
module.exports = {
  output: {
    filename: "[name].[chunkhash].js",
  },
};
```

比 hash 好，但仍有问题：**同一个 chunk 中的 JS 和 CSS 共享 hash**。

```javascript
// index.js 引入了 style.css
import "./style.css";

// 修改 style.css 后，index.js 的 hash 也会变
// 因为它们属于同一个 chunk
```

---

## 问题 4：contenthash（文件级）

**contenthash 是根据文件内容生成的 hash**，只有文件自身内容变化时，hash 才会变。

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  output: {
    filename: "[name].[contenthash].js",
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],
};
```

这样 JS 和 CSS 的 hash 是独立的：

```
修改 style.css 后：
index.abc123.js   → index.abc123.js   ✓ 不变
style.def456.css  → style.ghi789.css  ✓ 变了
```

**推荐使用 contenthash**，缓存效果最好。

---

## 问题 5：最佳实践配置

```javascript
module.exports = {
  output: {
    // JS 使用 contenthash
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
  },
  plugins: [
    new MiniCssExtractPlugin({
      // CSS 使用 contenthash
      filename: "[name].[contenthash:8].css",
    }),
  ],
  optimization: {
    // 提取 runtime，避免模块 ID 变化影响 hash
    runtimeChunk: "single",
    // 使用确定性的模块 ID
    moduleIds: "deterministic",
  },
};
```

**总结**：

- **开发环境**：不需要 hash，直接用 `[name].js`
- **生产环境**：使用 `contenthash`，实现最优缓存

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [contenthash vs chunkhash](https://webpack.js.org/configuration/output/#outputfilename)
