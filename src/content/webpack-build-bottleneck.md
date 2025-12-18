---
title: 为什么 Webpack 构建慢？瓶颈通常在哪里？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  分析 Webpack 构建慢的常见原因，定位性能瓶颈，掌握针对性的优化策略。
tags:
  - Webpack
  - 构建性能
  - 性能分析
  - 优化
estimatedTime: 15 分钟
keywords:
  - 构建慢
  - 性能瓶颈
  - 构建分析
  - 优化策略
highlight: Webpack 构建瓶颈通常在 Loader 处理、模块解析、代码压缩三个阶段，可通过分析工具定位具体问题。
order: 789
---

## 问题 1：常见的性能瓶颈

### 1. Loader 处理（最常见）

```javascript
// babel-loader 处理大量 JS 文件
// ts-loader 编译 TypeScript
// sass-loader 编译 Sass
```

Loader 需要对每个文件进行转换，文件越多越慢。

### 2. 模块解析

```javascript
// 解析 import/require 语句
// 查找模块路径
// 读取文件内容
```

大量的模块和深层的 node_modules 会拖慢解析。

### 3. 代码压缩

```javascript
// TerserPlugin 压缩 JS
// CssMinimizerPlugin 压缩 CSS
```

压缩是 CPU 密集型操作，大文件压缩很耗时。

---

## 问题 2：如何分析构建性能？

### speed-measure-webpack-plugin

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // webpack 配置
});
```

输出示例：

```
SMP  ⏱
General output time took 12.5 secs

SMP  ⏱  Loaders
babel-loader took 8.2 secs
css-loader took 2.1 secs
```

### webpack --profile

```bash
webpack --profile --json > stats.json
```

然后使用 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 分析。

---

## 问题 3：针对性优化策略

### Loader 处理慢

```javascript
// 1. 缩小处理范围
{
  test: /\.js$/,
  include: path.resolve('src'),  // 只处理 src
  exclude: /node_modules/,
}

// 2. 使用缓存
{
  loader: 'babel-loader',
  options: { cacheDirectory: true },
}

// 3. 使用更快的工具
// babel-loader → esbuild-loader
// ts-loader → swc-loader
```

### 模块解析慢

```javascript
resolve: {
  // 减少扩展名尝试
  extensions: ['.js', '.jsx'],

  // 指定模块目录
  modules: [path.resolve('src'), 'node_modules'],

  // 使用别名
  alias: { '@': path.resolve('src') },
}

// 不解析已知无依赖的库
module: {
  noParse: /jquery|lodash/,
}
```

### 代码压缩慢

```javascript
optimization: {
  minimizer: [
    new TerserPlugin({
      parallel: true,  // 并行压缩
      terserOptions: {
        compress: {
          drop_console: true,  // 移除 console
        },
      },
    }),
  ],
}
```

---

## 问题 4：开发环境特定优化

```javascript
// 开发环境不需要的优化
module.exports = {
  mode: "development",

  // 快速 source map
  devtool: "eval-cheap-module-source-map",

  // 关闭压缩
  optimization: {
    minimize: false,
  },
};
```

---

## 问题 5：瓶颈定位清单

| 症状           | 可能原因       | 解决方案               |
| -------------- | -------------- | ---------------------- |
| 首次构建慢     | Loader 处理    | 缓存、并行、更快工具   |
| 二次构建也慢   | 没有缓存       | 开启持久化缓存         |
| 生产构建特别慢 | 代码压缩       | 并行压缩、减少压缩范围 |
| 模块数量多时慢 | 模块解析       | 优化 resolve 配置      |
| HMR 更新慢     | 重新编译范围大 | 检查依赖关系           |

## 延伸阅读

- [Build Performance](https://webpack.js.org/guides/build-performance/)
- [speed-measure-webpack-plugin](https://github.com/stephencookdev/speed-measure-webpack-plugin)
