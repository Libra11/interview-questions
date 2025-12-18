---
title: Webpack 多入口应用如何配置？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 Webpack 多入口配置方案，包括多页面应用的完整配置示例和常见问题处理。
tags:
  - Webpack
  - 多入口
  - MPA
  - 配置
estimatedTime: 15 分钟
keywords:
  - Webpack 多入口
  - 多页面应用
  - MPA 配置
highlight: 多入口配置需要 entry 对象形式 + HtmlWebpackPlugin 多实例 + 合理的代码分割策略。
order: 736
---

## 问题 1：基本的多入口配置

多入口应用需要配置多个 entry 和对应的 HTML 文件：

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/pages/index/index.js",
    about: "./src/pages/about/index.js",
    contact: "./src/pages/contact/index.js",
  },
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    // 每个入口对应一个 HtmlWebpackPlugin 实例
    new HtmlWebpackPlugin({
      template: "./src/pages/index/index.html",
      filename: "index.html",
      chunks: ["index"], // 只引入 index chunk
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/about/index.html",
      filename: "about.html",
      chunks: ["about"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/pages/contact/index.html",
      filename: "contact.html",
      chunks: ["contact"],
    }),
  ],
};
```

---

## 问题 2：如何提取公共代码？

多入口应用通常有公共依赖，需要提取避免重复打包：

```javascript
module.exports = {
  entry: {
    index: "./src/pages/index/index.js",
    about: "./src/pages/about/index.js",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // 提取 node_modules 中的公共依赖
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
        // 提取业务代码中的公共模块
        common: {
          minChunks: 2, // 至少被 2 个入口引用
          name: "common",
          chunks: "all",
        },
      },
    },
  },
};
```

提取后，HTML 需要引入公共 chunk：

```javascript
new HtmlWebpackPlugin({
  chunks: ["vendors", "common", "index"],
});
```

---

## 问题 3：动态生成多入口配置

当页面很多时，手动配置很繁琐，可以动态生成：

```javascript
const glob = require("glob");

// 自动扫描 pages 目录下的入口文件
function getEntries() {
  const entries = {};
  const entryFiles = glob.sync("./src/pages/*/index.js");

  entryFiles.forEach((filePath) => {
    // 提取页面名称：./src/pages/about/index.js → about
    const pageName = filePath.match(/pages\/(.+)\/index\.js/)[1];
    entries[pageName] = filePath;
  });

  return entries;
}

// 自动生成 HtmlWebpackPlugin 实例
function getHtmlPlugins(entries) {
  return Object.keys(entries).map((pageName) => {
    return new HtmlWebpackPlugin({
      template: `./src/pages/${pageName}/index.html`,
      filename: `${pageName}.html`,
      chunks: ["vendors", "common", pageName],
    });
  });
}

const entries = getEntries();

module.exports = {
  entry: entries,
  plugins: [...getHtmlPlugins(entries)],
};
```

---

## 问题 4：多入口的目录结构建议

```
src/
├── pages/
│   ├── index/
│   │   ├── index.js
│   │   ├── index.html
│   │   └── style.css
│   ├── about/
│   │   ├── index.js
│   │   ├── index.html
│   │   └── style.css
│   └── contact/
│       ├── index.js
│       ├── index.html
│       └── style.css
├── components/     # 公共组件
├── utils/          # 公共工具
└── styles/         # 公共样式
```

每个页面独立一个目录，包含自己的入口、模板和样式，便于维护和自动化配置。

## 延伸阅读

- [Multiple Entry Points](https://webpack.js.org/concepts/entry-points/#multi-page-application)
- [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin)
- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
