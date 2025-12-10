---
title: 如何优化 Webpack 构建速度？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 Webpack 构建速度优化的常用方法，包括缓存、并行处理、减少构建范围等策略。
tags:
  - Webpack
  - 构建优化
  - 性能
  - 开发体验
estimatedTime: 18 分钟
keywords:
  - 构建速度
  - 优化策略
  - 缓存
  - 并行构建
highlight: 通过缓存、并行处理、缩小构建范围、使用更快的工具等策略，可以显著提升 Webpack 构建速度。
order: 654
---

## 问题 1：使用缓存

### Webpack 5 持久化缓存

```javascript
module.exports = {
  cache: {
    type: "filesystem", // 文件系统缓存
    buildDependencies: {
      config: [__filename], // 配置文件变化时失效
    },
  },
};
```

### babel-loader 缓存

```javascript
{
  test: /\.js$/,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,  // 开启缓存
      cacheCompression: false,  // 不压缩缓存
    },
  },
}
```

---

## 问题 2：缩小构建范围

### 精确指定 include/exclude

```javascript
{
  test: /\.js$/,
  include: path.resolve(__dirname, 'src'),  // 只处理 src
  exclude: /node_modules/,  // 排除 node_modules
  use: 'babel-loader',
}
```

### 配置 resolve

```javascript
resolve: {
  // 减少扩展名尝试
  extensions: ['.js', '.jsx'],

  // 指定模块目录
  modules: [path.resolve(__dirname, 'src'), 'node_modules'],

  // 使用别名
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```

### 使用 noParse

```javascript
module: {
  // 不解析已知没有依赖的库
  noParse: /jquery|lodash/,
}
```

---

## 问题 3：并行处理

### thread-loader

```javascript
{
  test: /\.js$/,
  use: [
    {
      loader: 'thread-loader',
      options: {
        workers: 4,  // 工作进程数
      },
    },
    'babel-loader',
  ],
}
```

### TerserPlugin 并行压缩

```javascript
optimization: {
  minimizer: [
    new TerserPlugin({
      parallel: true,  // 并行压缩
    }),
  ],
}
```

---

## 问题 4：使用更快的工具

### 使用 esbuild-loader 替代 babel-loader

```javascript
{
  test: /\.js$/,
  loader: 'esbuild-loader',
  options: {
    target: 'es2015',
  },
}
```

### 使用 swc-loader

```javascript
{
  test: /\.js$/,
  use: {
    loader: 'swc-loader',
    options: {
      jsc: {
        parser: { syntax: 'ecmascript' },
      },
    },
  },
}
```

---

## 问题 5：开发环境特定优化

```javascript
// 开发环境配置
module.exports = {
  mode: "development",

  // 快速 source map
  devtool: "eval-cheap-module-source-map",

  // 关闭不必要的优化
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },

  // 输出不带 hash
  output: {
    filename: "[name].js",
  },
};
```

---

## 问题 6：优化策略速查表

| 策略       | 方法                            | 效果       |
| ---------- | ------------------------------- | ---------- |
| 缓存       | filesystem cache                | ⭐⭐⭐⭐⭐ |
| 缩小范围   | include/exclude                 | ⭐⭐⭐⭐   |
| 并行处理   | thread-loader                   | ⭐⭐⭐     |
| 更快的工具 | esbuild-loader/swc-loader       | ⭐⭐⭐⭐   |
| 减少解析   | noParse, resolve 优化           | ⭐⭐⭐     |
| DLL        | DllPlugin（Webpack 5 后较少用） | ⭐⭐       |

## 延伸阅读

- [Build Performance](https://webpack.js.org/guides/build-performance/)
- [Cache](https://webpack.js.org/configuration/cache/)
