---
title: Webpack 的四大核心概念是什么？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  详解 Webpack 的四大核心概念：entry、output、loader、plugin，理解它们各自的作用和配置方式。
tags:
  - Webpack
  - entry
  - output
  - loader
  - plugin
estimatedTime: 18 分钟
keywords:
  - Webpack 核心概念
  - entry
  - output
  - loader
  - plugin
highlight: entry 定义入口、output 定义输出、loader 转换模块、plugin 扩展功能，这四个概念构成了 Webpack 的基础。
order: 602
---

## 问题 1：Entry（入口）是什么？

**Entry 是 Webpack 构建依赖图的起点**。Webpack 会从入口文件开始，递归地找出所有依赖的模块。

```javascript
// webpack.config.js
module.exports = {
  // 单入口（字符串形式）
  entry: "./src/index.js",

  // 多入口（对象形式）
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
};
```

入口决定了 Webpack "从哪里开始"，是整个打包流程的第一步。

---

## 问题 2：Output（输出）是什么？

**Output 告诉 Webpack 在哪里输出打包后的文件，以及如何命名这些文件**。

```javascript
const path = require("path");

module.exports = {
  output: {
    // 输出目录（必须是绝对路径）
    path: path.resolve(__dirname, "dist"),
    // 输出文件名
    filename: "bundle.js",
    // 公共路径（用于 CDN 等场景）
    publicPath: "/",
  },
};
```

主要配置项：

- **path**：输出目录的绝对路径
- **filename**：输出文件的名称
- **publicPath**：资源的公共 URL 前缀

---

## 问题 3：Loader 是什么？

**Loader 让 Webpack 能够处理非 JavaScript 文件**。Webpack 本身只理解 JavaScript 和 JSON，Loader 可以将其他类型的文件转换为有效模块。

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/, // 匹配文件的正则
        use: ["style-loader", "css-loader"], // 使用的 loader
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
};
```

Loader 的特点：

- **转换文件**：将文件从一种格式转换为另一种格式
- **链式调用**：多个 loader 可以串联使用
- **从右到左执行**：`['style-loader', 'css-loader']` 先执行 css-loader

---

## 问题 4：Plugin（插件）是什么？

**Plugin 用于执行范围更广的任务**，从打包优化、资源管理到注入环境变量，几乎可以做任何事情。

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    // 自动生成 HTML 文件
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    // 提取 CSS 到单独文件
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
};
```

Plugin 与 Loader 的区别：

- **Loader**：专注于转换特定类型的文件
- **Plugin**：可以介入整个构建流程，功能更强大

---

## 问题 5：四个概念如何协同工作？

一个完整的 Webpack 配置将这四个概念组合在一起：

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // 1. Entry：从哪里开始
  entry: "./src/index.js",

  // 2. Output：输出到哪里
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },

  // 3. Loader：如何转换模块
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.js$/, use: "babel-loader" },
    ],
  },

  // 4. Plugin：额外的功能
  plugins: [new HtmlWebpackPlugin()],
};
```

工作流程：**Entry → 构建依赖图 → Loader 转换模块 → Plugin 处理 → Output 输出**

## 延伸阅读

- [Entry Points](https://webpack.js.org/concepts/entry-points/)
- [Output](https://webpack.js.org/concepts/output/)
- [Loaders](https://webpack.js.org/concepts/loaders/)
- [Plugins](https://webpack.js.org/concepts/plugins/)
