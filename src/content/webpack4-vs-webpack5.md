---
title: Webpack4 与 Webpack5 的最大区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  对比 Webpack 4 和 Webpack 5 的主要差异，了解 Webpack 5 带来的重要新特性和改进。
tags:
  - Webpack
  - Webpack5
  - 版本对比
  - 新特性
estimatedTime: 15 分钟
keywords:
  - Webpack4
  - Webpack5
  - 版本区别
  - 新特性
highlight: Webpack 5 最大的改进是持久化缓存、Module Federation、更好的 Tree-shaking 和内置资源模块。
order: 661
---

## 问题 1：核心差异对比

| 特性             | Webpack 4   | Webpack 5          |
| ---------------- | ----------- | ------------------ |
| 持久化缓存       | 需要插件    | 内置支持           |
| 模块联邦         | 不支持      | 内置支持           |
| 资源模块         | 需要 loader | 内置 Asset Modules |
| Tree-shaking     | 基础支持    | 更强大             |
| Node.js polyfill | 自动注入    | 不再自动注入       |
| 构建速度         | 较慢        | 更快               |

---

## 问题 2：持久化缓存

**Webpack 5 内置了文件系统缓存**：

```javascript
// Webpack 5
module.exports = {
  cache: {
    type: "filesystem",
  },
};

// Webpack 4 需要使用插件
// cache-loader, hard-source-webpack-plugin
```

效果：二次构建速度提升 50%-90%。

---

## 问题 3：Module Federation

**Webpack 5 引入了模块联邦**，支持跨应用共享模块：

```javascript
// Webpack 5
const { ModuleFederationPlugin } = require("webpack").container;

new ModuleFederationPlugin({
  name: "app1",
  remotes: {
    app2: "app2@http://localhost:3002/remoteEntry.js",
  },
  shared: ["react", "react-dom"],
});

// Webpack 4 不支持，需要其他方案
```

---

## 问题 4：Asset Modules

**Webpack 5 内置了资源处理**，不再需要 file-loader、url-loader：

```javascript
// Webpack 5
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',  // 内置支持
}

// Webpack 4
{
  test: /\.(png|jpg|gif)$/,
  use: 'url-loader',  // 需要安装 loader
}
```

---

## 问题 5：Tree-shaking 增强

Webpack 5 的 Tree-shaking 更强大：

```javascript
// 嵌套的 Tree-shaking
import { a } from "./module";
// Webpack 5 可以分析 a 内部未使用的导出

// CommonJS Tree-shaking
const { pick } = require("lodash");
// Webpack 5 对 CommonJS 也有一定的 Tree-shaking 能力
```

---

## 问题 6：Node.js Polyfill

**Webpack 5 不再自动注入 Node.js polyfill**：

```javascript
// Webpack 4：自动注入 Buffer、process 等
// Webpack 5：需要手动配置

// 如果需要 polyfill
resolve: {
  fallback: {
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser'),
  },
}
```

---

## 问题 7：其他改进

### 更好的长期缓存

```javascript
// 默认使用 deterministic 模块 ID
optimization: {
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',
}
```

### 更小的运行时代码

Webpack 5 生成的运行时代码更小、更高效。

### 更好的开发体验

- 更清晰的错误信息
- 更快的 HMR
- 更好的 Source Map 支持

## 延伸阅读

- [Webpack 5 Release](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
- [Webpack 5 Migration](https://webpack.js.org/migrate/5/)
