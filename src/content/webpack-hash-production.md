---
title: 为什么生产环境不能用 hash？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 hash、chunkhash、contenthash 的区别，以及为什么生产环境应该使用 contenthash。
tags:
  - Webpack
  - hash
  - contenthash
  - 缓存优化
estimatedTime: 10 分钟
keywords:
  - hash 区别
  - contenthash
  - 生产环境
  - 缓存失效
highlight: hash 是项目级别的，任何文件变化都会导致所有文件 hash 变化，缓存全部失效，应使用 contenthash。
order: 782
---

## 问题 1：hash 的问题

**hash 是整个项目的 hash**，任何文件变化都会导致所有文件的 hash 变化：

```javascript
output: {
  filename: '[name].[hash].js',  // ❌ 不推荐
}
```

问题演示：

```
修改 index.js 后：
main.abc123.js    → main.def456.js    ✓ 应该变
vendor.abc123.js  → vendor.def456.js  ✗ 不应该变，但也变了
styles.abc123.css → styles.def456.css ✗ 不应该变，但也变了
```

**所有文件的缓存都失效了**，即使 vendor 和 styles 的内容没有任何变化。

---

## 问题 2：三种 hash 对比

| 类型        | 作用范围   | 变化条件          |
| ----------- | ---------- | ----------------- |
| hash        | 整个项目   | 任何文件变化      |
| chunkhash   | 单个 chunk | 该 chunk 内容变化 |
| contenthash | 单个文件   | 该文件内容变化    |

---

## 问题 3：chunkhash 的问题

chunkhash 比 hash 好，但仍有问题：

```javascript
// index.js 引入了 CSS
import "./styles.css";

// 使用 chunkhash
output: {
  filename: "[name].[chunkhash].js";
}
```

问题：

```
修改 styles.css 后：
index.js 的 hash 也变了！
因为它们属于同一个 chunk
```

---

## 问题 4：contenthash 是正确选择

**contenthash 基于文件自身内容**，是生产环境的正确选择：

```javascript
output: {
  filename: '[name].[contenthash:8].js',
}

plugins: [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash:8].css',
  }),
]
```

效果：

```
修改 styles.css 后：
index.abc123.js   → index.abc123.js   ✓ 不变
styles.def456.css → styles.xyz789.css ✓ 变了
vendor.ghi000.js  → vendor.ghi000.js  ✓ 不变
```

---

## 问题 5：最佳实践配置

```javascript
module.exports = {
  mode: "production",
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
    // 确保 hash 稳定
    moduleIds: "deterministic",
    runtimeChunk: "single",
  },
};
```

**总结**：生产环境始终使用 `contenthash`，实现最优的缓存效果。

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [Output filename](https://webpack.js.org/configuration/output/#outputfilename)
