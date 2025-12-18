---
title: 如何分环境配置 Webpack？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 Webpack 多环境配置的方法，实现开发、测试、生产环境的差异化配置。
tags:
  - Webpack
  - 环境配置
  - 多环境
  - 配置管理
estimatedTime: 12 分钟
keywords:
  - 环境配置
  - development
  - production
  - webpack-merge
highlight: 通过 webpack-merge 合并基础配置和环境特定配置，配合环境变量实现灵活的多环境构建。
order: 821
---

## 问题 1：配置文件分离

```
build/
├── webpack.base.js    # 公共配置
├── webpack.dev.js     # 开发环境
├── webpack.prod.js    # 生产环境
└── webpack.test.js    # 测试环境
```

---

## 问题 2：使用 webpack-merge

```javascript
// webpack.base.js
module.exports = {
  entry: "./src/index.js",
  module: {
    rules: [{ test: /\.js$/, use: "babel-loader" }],
  },
};

// webpack.dev.js
const { merge } = require("webpack-merge");
const base = require("./webpack.base");

module.exports = merge(base, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  devServer: {
    hot: true,
    port: 3000,
  },
});

// webpack.prod.js
const { merge } = require("webpack-merge");
const base = require("./webpack.base");

module.exports = merge(base, {
  mode: "production",
  devtool: false,
  optimization: {
    minimize: true,
  },
});
```

---

## 问题 3：环境变量注入

```javascript
// webpack.config.js
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.env.API_URL": JSON.stringify(process.env.API_URL),
    }),
  ],
};
```

在代码中使用：

```javascript
if (process.env.NODE_ENV === "development") {
  console.log("开发模式");
}

fetch(process.env.API_URL + "/users");
```

---

## 问题 4：使用 .env 文件

```bash
# .env.development
API_URL=http://localhost:3000
DEBUG=true

# .env.production
API_URL=https://api.example.com
DEBUG=false
```

```javascript
// webpack.config.js
const dotenv = require("dotenv");
const env = dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
}).parsed;

new webpack.DefinePlugin({
  "process.env": JSON.stringify(env),
});
```

---

## 问题 5：npm scripts 配置

```json
{
  "scripts": {
    "dev": "webpack serve --config build/webpack.dev.js",
    "build": "webpack --config build/webpack.prod.js",
    "build:test": "NODE_ENV=test webpack --config build/webpack.test.js"
  }
}
```

跨平台兼容：

```json
{
  "scripts": {
    "build": "cross-env NODE_ENV=production webpack"
  }
}
```

---

## 问题 6：函数式配置

```javascript
// webpack.config.js
module.exports = (env, argv) => {
  const isDev = argv.mode === "development";

  return {
    mode: argv.mode,
    devtool: isDev ? "eval-cheap-module-source-map" : false,
    optimization: {
      minimize: !isDev,
    },
  };
};
```

使用：

```bash
webpack --mode development
webpack --mode production
```

## 延伸阅读

- [webpack-merge](https://github.com/survivejs/webpack-merge)
- [Environment Variables](https://webpack.js.org/guides/environment-variables/)
