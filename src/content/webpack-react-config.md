---
title: Webpack 中常见的 React 配置？
category: 工程化
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握 Webpack 中配置 React 项目的常见设置。
tags:
  - Webpack
  - React
  - 配置
  - 工程化
estimatedTime: 12 分钟
keywords:
  - Webpack React
  - babel-loader
  - React configuration
  - webpack config
highlight: React 项目的 Webpack 配置包括 Babel 转译、JSX 处理、热更新、代码分割等。
order: 643
---

## 问题 1：基础配置

### 入口和输出

```javascript
// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
```

---

## 问题 2：Babel 配置

### babel-loader

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
};
```

### babel.config.js

```javascript
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "defaults" }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
  plugins: [
    // 按需引入 antd
    ["import", { libraryName: "antd", style: "css" }],
  ],
};
```

---

## 问题 3：开发服务器配置

### devServer

```javascript
module.exports = {
  devServer: {
    port: 3000,
    hot: true, // 热更新
    open: true, // 自动打开浏览器
    historyApiFallback: true, // SPA 路由支持
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
};
```

### React Fast Refresh

```javascript
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  plugins: [new ReactRefreshWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: ["react-refresh/babel"],
          },
        },
      },
    ],
  },
};
```

---

## 问题 4：生产环境优化

### 代码分割

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          chunks: "all",
          priority: 10,
        },
      },
    },
  },
};
```

### 压缩

```javascript
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
};
```

---

## 问题 5：样式配置

### CSS/SCSS

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
      },
      {
        test: /\.module\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true, // CSS Modules
            },
          },
        ],
      },
    ],
  },
};
```

---

## 问题 6：完整配置示例

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isDev = process.env.NODE_ENV === "development";

module.exports = {
  mode: isDev ? "development" : "production",
  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isDev ? "[name].js" : "[name].[contenthash].js",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          isDev ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
    !isDev && new MiniCssExtractPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
};
```

## 总结

| 配置项            | 作用        |
| ----------------- | ----------- |
| babel-loader      | 转译 JSX/TS |
| devServer         | 开发服务器  |
| splitChunks       | 代码分割    |
| CSS loaders       | 样式处理    |
| HtmlWebpackPlugin | 生成 HTML   |

## 延伸阅读

- [Webpack 文档](https://webpack.js.org/)
- [Create React App 配置](https://create-react-app.dev/)
