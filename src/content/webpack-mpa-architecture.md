---
title: 如何设计一个 Webpack 多页面应用架构？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  掌握 Webpack 多页面应用（MPA）的架构设计，包括入口配置、公共代码提取和自动化。
tags:
  - Webpack
  - MPA
  - 多页面
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 多页面应用
  - MPA
  - 入口配置
  - HtmlWebpackPlugin
highlight: 多页面应用需要配置多入口、自动生成 HTML、提取公共代码，并考虑构建性能优化。
order: 689
---

## 问题 1：基本架构

```
src/
├── pages/
│   ├── home/
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
├── common/
│   ├── utils.js
│   └── components/
└── assets/
```

---

## 问题 2：自动生成入口配置

```javascript
const glob = require("glob");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function getEntries() {
  const entries = {};
  const htmlPlugins = [];

  const entryFiles = glob.sync("./src/pages/*/index.js");

  entryFiles.forEach((filePath) => {
    const pageName = path.dirname(filePath).split("/").pop();

    entries[pageName] = filePath;

    htmlPlugins.push(
      new HtmlWebpackPlugin({
        template: `./src/pages/${pageName}/index.html`,
        filename: `${pageName}.html`,
        chunks: ["common", pageName],
        minify: {
          collapseWhitespace: true,
          removeComments: true,
        },
      })
    );
  });

  return { entries, htmlPlugins };
}

const { entries, htmlPlugins } = getEntries();
```

---

## 问题 3：完整配置

```javascript
const { entries, htmlPlugins } = getEntries();

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].[contenthash:8].js",
    clean: true,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        // 公共模块
        common: {
          name: "common",
          chunks: "all",
          minChunks: 2,
          priority: 10,
        },
        // 第三方库
        vendors: {
          name: "vendors",
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          priority: 20,
        },
      },
    },
  },
  plugins: [...htmlPlugins],
};
```

---

## 问题 4：页面间共享代码

```javascript
// common/utils.js
export function formatDate(date) { ... }
export function request(url) { ... }

// pages/home/index.js
import { formatDate } from '../../common/utils';

// pages/about/index.js
import { formatDate } from '../../common/utils';

// Webpack 会自动提取到 common chunk
```

---

## 问题 5：开发服务器配置

```javascript
devServer: {
  static: './dist',
  hot: true,
  // 多页面路由
  historyApiFallback: {
    rewrites: [
      { from: /^\/about/, to: '/about.html' },
      { from: /^\/contact/, to: '/contact.html' },
      { from: /./, to: '/home.html' },
    ],
  },
}
```

---

## 问题 6：构建性能优化

```javascript
// 并行构建
const threadLoader = require("thread-loader");

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["thread-loader", "babel-loader"],
      },
    ],
  },
  // 持久化缓存
  cache: {
    type: "filesystem",
  },
};
```

---

## 问题 7：输出结构

```
dist/
├── js/
│   ├── home.abc123.js
│   ├── about.def456.js
│   ├── contact.ghi789.js
│   ├── common.jkl012.js
│   └── vendors.mno345.js
├── css/
│   ├── home.abc123.css
│   └── ...
├── home.html
├── about.html
└── contact.html
```

## 延伸阅读

- [Multiple Entry Points](https://webpack.js.org/concepts/entry-points/#multi-page-application)
- [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/)
