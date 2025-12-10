---
title: Webpack Plugin 的作用是什么？与 Loader 区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack Plugin 的作用和工作原理，掌握 Plugin 与 Loader 的核心区别。
tags:
  - Webpack
  - Plugin
  - Loader
  - 前端工程化
estimatedTime: 15 分钟
keywords:
  - Webpack Plugin
  - Plugin vs Loader
  - 钩子机制
highlight: Loader 专注于文件转换，Plugin 通过钩子介入整个构建流程，功能更强大、范围更广。
order: 619
---

## 问题 1：Plugin 的作用是什么？

**Plugin 用于扩展 Webpack 的功能**，它可以介入构建流程的各个阶段，执行更广泛的任务。

常见的 Plugin 功能：

- **打包优化**：压缩代码、分离 CSS
- **资源管理**：生成 HTML、复制静态文件
- **注入变量**：定义环境变量
- **构建分析**：生成构建报告

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [
    // 自动生成 HTML 并注入打包后的资源
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    // 将 CSS 提取到单独文件
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],
};
```

---

## 问题 2：Plugin 与 Loader 的核心区别

| 特性     | Loader       | Plugin            |
| -------- | ------------ | ----------------- |
| 作用范围 | 单个文件     | 整个构建流程      |
| 执行时机 | 模块加载时   | 构建的任意阶段    |
| 功能定位 | 文件转换     | 功能扩展          |
| 配置位置 | module.rules | plugins           |
| 本质     | 函数         | 带 apply 方法的类 |

简单记忆：

- **Loader**：转换器，处理文件内容
- **Plugin**：扩展器，介入构建流程

---

## 问题 3：Plugin 的工作原理

Plugin 通过 **Tapable 钩子机制** 介入 Webpack 构建流程：

```javascript
// Plugin 的基本结构
class MyPlugin {
  apply(compiler) {
    // compiler 是 Webpack 的核心对象
    // 通过钩子注册回调
    compiler.hooks.emit.tap("MyPlugin", (compilation) => {
      // 在生成资源到输出目录之前执行
      console.log("即将输出文件");
    });
  }
}

module.exports = MyPlugin;
```

Webpack 在构建过程中会触发各种钩子，Plugin 监听这些钩子来执行自定义逻辑。

---

## 问题 4：常用的 Webpack 钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 编译开始
    compiler.hooks.compile.tap("MyPlugin", () => {});

    // 生成资源前
    compiler.hooks.emit.tap("MyPlugin", (compilation) => {});

    // 编译完成
    compiler.hooks.done.tap("MyPlugin", (stats) => {});
  }
}
```

主要钩子：

| 钩子        | 触发时机         |
| ----------- | ---------------- |
| compile     | 开始编译         |
| compilation | 创建 compilation |
| emit        | 输出资源前       |
| afterEmit   | 输出资源后       |
| done        | 构建完成         |

---

## 问题 5：什么时候用 Loader，什么时候用 Plugin？

### 用 Loader

当你需要**转换某种类型的文件**时：

```javascript
// 转换 TypeScript
{ test: /\.ts$/, use: 'ts-loader' }

// 转换 Sass
{ test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
```

### 用 Plugin

当你需要**做文件转换以外的事情**时：

```javascript
plugins: [
  new HtmlWebpackPlugin(), // 生成 HTML
  new CleanWebpackPlugin(), // 清理目录
  new DefinePlugin({ VERSION: "1.0" }), // 定义变量
  new BundleAnalyzerPlugin(), // 分析打包结果
];
```

---

## 问题 6：常见 Plugin 速查

| Plugin               | 作用            |
| -------------------- | --------------- |
| HtmlWebpackPlugin    | 生成 HTML 文件  |
| MiniCssExtractPlugin | 提取 CSS 到文件 |
| DefinePlugin         | 定义环境变量    |
| CopyWebpackPlugin    | 复制静态文件    |
| CleanWebpackPlugin   | 清理输出目录    |
| BundleAnalyzerPlugin | 打包分析        |

## 延伸阅读

- [Plugins](https://webpack.js.org/concepts/plugins/)
- [Writing a Plugin](https://webpack.js.org/contribute/writing-a-plugin/)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
