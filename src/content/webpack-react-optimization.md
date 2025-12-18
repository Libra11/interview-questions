---
title: Webpack 如何优化 React 项目构建？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 React 项目的 Webpack 优化策略，包括构建速度和产物体积优化。
tags:
  - Webpack
  - React
  - 构建优化
  - 性能
estimatedTime: 15 分钟
keywords:
  - React 优化
  - 构建速度
  - 代码分割
  - Fast Refresh
highlight: React 项目优化包括使用 Fast Refresh、代码分割、生产环境配置、以及使用更快的编译工具如 SWC。
order: 812
---

## 问题 1：开发体验优化

### React Fast Refresh

```javascript
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  mode: "development",
  plugins: [new ReactRefreshWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
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

Fast Refresh 保留组件状态，提升开发体验。

---

## 问题 2：构建速度优化

### 使用 SWC 替代 Babel

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: "swc-loader",
          options: {
            jsc: {
              parser: { syntax: "ecmascript", jsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
      },
    ],
  },
};
```

SWC 比 Babel 快 20-70 倍。

### 使用缓存

```javascript
module.exports = {
  cache: { type: "filesystem" },
};
```

---

## 问题 3：代码分割

```javascript
// 路由级别分割
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));

// Webpack 配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          priority: 20,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
      },
    },
  },
};
```

---

## 问题 4：生产环境优化

```javascript
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true },
        },
      }),
    ],
  },
  // 使用生产版本的 React
  resolve: {
    alias: {
      "react-dom$": "react-dom/profiling",
      "scheduler/tracing": "scheduler/tracing-profiling",
    },
  },
};
```

---

## 问题 5：减少 React 体积

```javascript
// 1. 使用 preact 替代（如果兼容）
resolve: {
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
  },
}

// 2. 按需引入 UI 库
// antd 使用 babel-plugin-import
plugins: [
  ['import', { libraryName: 'antd', style: true }],
]
```

---

## 问题 6：完整配置示例

```javascript
const path = require("path");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

const isDev = process.env.NODE_ENV === "development";

module.exports = {
  mode: isDev ? "development" : "production",
  devtool: isDev ? "eval-cheap-module-source-map" : false,
  cache: { type: "filesystem" },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
          options: {
            jsc: {
              parser: { syntax: "ecmascript", jsx: true },
              transform: {
                react: {
                  runtime: "automatic",
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
    ],
  },
  plugins: [isDev && new ReactRefreshWebpackPlugin()].filter(Boolean),
};
```

## 延伸阅读

- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
- [SWC](https://swc.rs/)
