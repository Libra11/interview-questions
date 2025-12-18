---
title: Webpack 如何给输出文件加 hash？为什么要加 hash？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 文件 hash 的作用和配置方式，掌握缓存优化的核心策略。
tags:
  - Webpack
  - hash
  - 缓存
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - Webpack hash
  - 文件指纹
  - 缓存策略
highlight: 给文件加 hash 是为了实现长期缓存，文件内容变化时 hash 变化，浏览器才会重新请求。
order: 738
---

## 问题 1：为什么要给文件加 hash？

**为了实现浏览器的长期缓存（Long-term Caching）**。

浏览器会根据文件 URL 来缓存资源。如果文件名不变，浏览器可能使用旧的缓存版本：

```html
<!-- 没有 hash，浏览器可能使用缓存的旧版本 -->
<script src="bundle.js"></script>

<!-- 有 hash，内容变化后文件名变化，浏览器会重新请求 -->
<script src="bundle.abc123.js"></script>
```

加 hash 的好处：

- **内容不变，hash 不变**：浏览器使用缓存，加载更快
- **内容变化，hash 变化**：浏览器请求新文件，用户看到最新内容

---

## 问题 2：如何配置 hash？

在 output 配置中使用占位符：

```javascript
module.exports = {
  output: {
    // JS 文件
    filename: "[name].[contenthash].js",
    chunkFilename: "[name].[contenthash].chunk.js",
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        type: "asset/resource",
        generator: {
          // 图片等资源文件
          filename: "images/[name].[hash][ext]",
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // CSS 文件
      filename: "[name].[contenthash].css",
    }),
  ],
};
```

---

## 问题 3：hash 长度如何控制？

可以指定 hash 的长度：

```javascript
module.exports = {
  output: {
    // 默认 20 位，可以指定长度
    filename: "[name].[contenthash:8].js", // 8 位 hash
  },
};
```

一般 8 位就足够了，既能保证唯一性，又不会让文件名太长。

---

## 问题 4：生产环境的完整配置示例

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "production",
  output: {
    filename: "js/[name].[contenthash:8].js",
    chunkFilename: "js/[name].[contenthash:8].chunk.js",
    clean: true, // 清理旧文件
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:8].css",
    }),
  ],
  optimization: {
    // 将 runtime 代码单独提取，避免影响业务代码的 hash
    runtimeChunk: "single",
    // 使用确定性的模块 ID
    moduleIds: "deterministic",
  },
};
```

`runtimeChunk: 'single'` 很重要，它能避免模块 ID 变化导致不相关文件的 hash 变化。

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [Output filename](https://webpack.js.org/configuration/output/#outputfilename)
- [Template strings](https://webpack.js.org/configuration/output/#template-strings)
