---
title: Webpack css-loader 与 style-loader 区别？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 css-loader 和 style-loader 各自的职责，掌握它们如何配合处理 CSS 文件。
tags:
  - Webpack
  - css-loader
  - style-loader
  - CSS
estimatedTime: 10 分钟
keywords:
  - css-loader
  - style-loader
  - CSS 处理
highlight: css-loader 解析 CSS 文件为 JS 模块，style-loader 将 CSS 注入到 DOM 的 style 标签中。
order: 616
---

## 问题 1：css-loader 的作用

**css-loader 负责解析 CSS 文件**，处理 `@import` 和 `url()` 等语法，将 CSS 转换为 JavaScript 模块。

```css
/* styles.css */
@import "./base.css";
.container {
  background: url("./bg.png");
}
```

css-loader 处理后：

```javascript
// 伪代码展示转换结果
module.exports = [
  [moduleId, ".container { background: url(/dist/bg.abc123.png); }"],
];
```

css-loader 做了什么：

1. 解析 `@import`，将引入的 CSS 合并
2. 解析 `url()`，将资源路径转换为正确的引用
3. 将 CSS 转换为 JavaScript 模块

---

## 问题 2：style-loader 的作用

**style-loader 负责将 CSS 注入到 DOM 中**。它接收 css-loader 的输出，创建 `<style>` 标签并插入到页面。

```javascript
// style-loader 的核心逻辑（简化版）
function injectStyles(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
```

运行时，页面会出现：

```html
<head>
  <style>
    .container {
      background: url(/dist/bg.abc123.png);
    }
  </style>
</head>
```

---

## 问题 3：为什么需要两个 Loader？

**单一职责原则**：每个 Loader 只做一件事。

```javascript
// 配置（注意顺序：从右到左执行）
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
  // 执行顺序：css-loader → style-loader
}
```

工作流程：

```
.css 文件
    ↓
css-loader（解析 CSS → JS 模块）
    ↓
style-loader（JS 模块 → DOM style 标签）
```

如果只用 css-loader：CSS 被转换为 JS 模块，但不会应用到页面。

如果只用 style-loader：无法解析 CSS 文件，会报错。

---

## 问题 4：生产环境的替代方案

style-loader 将 CSS 内联到 JS 中，适合开发环境。生产环境通常使用 **MiniCssExtractPlugin** 提取 CSS 到单独文件：

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // 生产环境用 MiniCssExtractPlugin.loader
          // 开发环境用 style-loader
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader
            : "style-loader",
          "css-loader",
        ],
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

---

## 问题 5：对比总结

| 特性     | css-loader      | style-loader        |
| -------- | --------------- | ------------------- |
| 职责     | 解析 CSS 文件   | 注入 CSS 到 DOM     |
| 输入     | CSS 文件        | JS 模块（CSS 内容） |
| 输出     | JS 模块         | DOM style 标签      |
| 单独使用 | ❌ CSS 不会生效 | ❌ 无法解析 CSS     |
| 适用环境 | 开发 + 生产     | 主要用于开发        |

## 延伸阅读

- [css-loader](https://webpack.js.org/loaders/css-loader/)
- [style-loader](https://webpack.js.org/loaders/style-loader/)
- [MiniCssExtractPlugin](https://webpack.js.org/plugins/mini-css-extract-plugin/)
