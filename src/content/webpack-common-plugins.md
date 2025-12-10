---
title: Webpack 常见插件有哪些？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  盘点 Webpack 中最常用的插件，了解它们各自的作用和配置方式。
tags:
  - Webpack
  - Plugin
  - HtmlWebpackPlugin
  - MiniCssExtractPlugin
estimatedTime: 15 分钟
keywords:
  - 常见插件
  - Webpack Plugin
  - 打包优化
highlight: 掌握 HtmlWebpackPlugin、MiniCssExtractPlugin、DefinePlugin 等核心插件的作用和使用场景。
order: 621
---

## 问题 1：HTML 相关插件

### HtmlWebpackPlugin

自动生成 HTML 文件并注入打包后的资源：

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

plugins: [
  new HtmlWebpackPlugin({
    template: "./src/index.html",
    filename: "index.html",
    minify: { collapseWhitespace: true },
  }),
];
```

---

## 问题 2：CSS 相关插件

### MiniCssExtractPlugin

将 CSS 提取到单独的文件：

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],
};
```

### CssMinimizerWebpackPlugin

压缩 CSS：

```javascript
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

optimization: {
  minimizer: ['...', new CssMinimizerPlugin()],
}
```

---

## 问题 3：构建优化插件

### DefinePlugin

定义全局常量（编译时替换）：

```javascript
const { DefinePlugin } = require("webpack");

plugins: [
  new DefinePlugin({
    "process.env.NODE_ENV": JSON.stringify("production"),
    VERSION: JSON.stringify("1.0.0"),
  }),
];
```

### TerserWebpackPlugin

压缩 JavaScript（Webpack 5 内置）：

```javascript
const TerserPlugin = require('terser-webpack-plugin');

optimization: {
  minimizer: [new TerserPlugin({ parallel: true })],
}
```

---

## 问题 4：开发辅助插件

### CleanWebpackPlugin

清理输出目录（Webpack 5 可用 output.clean）：

```javascript
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

plugins: [new CleanWebpackPlugin()];

// Webpack 5 替代方案
output: {
  clean: true;
}
```

### CopyWebpackPlugin

复制静态文件到输出目录：

```javascript
const CopyPlugin = require("copy-webpack-plugin");

plugins: [
  new CopyPlugin({
    patterns: [{ from: "public", to: "assets" }],
  }),
];
```

---

## 问题 5：分析类插件

### BundleAnalyzerPlugin

可视化分析打包结果：

```javascript
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

plugins: [new BundleAnalyzerPlugin()];
```

---

## 问题 6：插件速查表

| 插件                       | 作用         |
| -------------------------- | ------------ |
| HtmlWebpackPlugin          | 生成 HTML    |
| MiniCssExtractPlugin       | 提取 CSS     |
| CssMinimizerPlugin         | 压缩 CSS     |
| TerserPlugin               | 压缩 JS      |
| DefinePlugin               | 定义全局常量 |
| CopyWebpackPlugin          | 复制静态文件 |
| CleanWebpackPlugin         | 清理目录     |
| BundleAnalyzerPlugin       | 打包分析     |
| HotModuleReplacementPlugin | 热更新       |

## 延伸阅读

- [Webpack Plugins](https://webpack.js.org/plugins/)
- [awesome-webpack](https://github.com/webpack-contrib/awesome-webpack)
