---
title: Webpack HtmlWebpackPlugin 的作用？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  详解 HtmlWebpackPlugin 的功能和配置，理解它如何自动生成 HTML 并注入资源。
tags:
  - Webpack
  - HtmlWebpackPlugin
  - HTML
  - 自动化
estimatedTime: 12 分钟
keywords:
  - HtmlWebpackPlugin
  - HTML 生成
  - 资源注入
highlight: HtmlWebpackPlugin 自动生成 HTML 文件，并将打包后的 JS、CSS 等资源自动注入到 HTML 中。
order: 622
---

## 问题 1：HtmlWebpackPlugin 解决什么问题？

打包后的文件名通常包含 hash，每次构建都会变化：

```
dist/
├── main.abc123.js
├── vendor.def456.js
└── styles.ghi789.css
```

手动维护 HTML 中的引用非常麻烦。**HtmlWebpackPlugin 自动生成 HTML 并注入正确的资源引用**。

---

## 问题 2：基本使用

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html", // 模板文件
      filename: "index.html", // 输出文件名
    }),
  ],
};
```

生成的 HTML 会自动包含打包后的资源：

```html
<!DOCTYPE html>
<html>
  <head>
    <link href="styles.ghi789.css" rel="stylesheet" />
  </head>
  <body>
    <div id="app"></div>
    <script src="main.abc123.js"></script>
    <script src="vendor.def456.js"></script>
  </body>
</html>
```

---

## 问题 3：常用配置选项

```javascript
new HtmlWebpackPlugin({
  // 模板文件路径
  template: "./src/index.html",

  // 输出文件名
  filename: "index.html",

  // 注入位置：'head' | 'body' | true | false
  inject: "body",

  // 页面标题（需要模板支持）
  title: "My App",

  // 只注入指定的 chunk
  chunks: ["main", "vendor"],

  // 排除某些 chunk
  excludeChunks: ["dev"],

  // 压缩 HTML
  minify: {
    collapseWhitespace: true,
    removeComments: true,
  },

  // 自定义变量，可在模板中使用
  templateParameters: {
    env: "production",
  },
});
```

---

## 问题 4：多页面应用配置

每个页面需要一个 HtmlWebpackPlugin 实例：

```javascript
module.exports = {
  entry: {
    index: "./src/pages/index/index.js",
    about: "./src/pages/about/index.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/pages/index/index.html",
      filename: "index.html",
      chunks: ["index"], // 只注入 index chunk
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/about/index.html",
      filename: "about.html",
      chunks: ["about"], // 只注入 about chunk
    }),
  ],
};
```

---

## 问题 5：在模板中使用变量

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <div id="app"></div>
    <% if (htmlWebpackPlugin.options.env === 'development') { %>
    <script src="debug.js"></script>
    <% } %>
  </body>
</html>
```

模板使用 EJS 语法，可以访问 `htmlWebpackPlugin.options` 中的配置。

## 延伸阅读

- [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin)
- [HtmlWebpackPlugin 配置](https://github.com/jantimon/html-webpack-plugin#options)
