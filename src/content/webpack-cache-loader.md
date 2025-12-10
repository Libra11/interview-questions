---
title: Webpack cache-loader 的作用？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 cache-loader 的作用和原理，了解它在 Webpack 5 之前如何帮助加速构建。
tags:
  - Webpack
  - cache-loader
  - 缓存
  - 构建优化
estimatedTime: 10 分钟
keywords:
  - cache-loader
  - 构建缓存
  - loader 缓存
  - 构建加速
highlight: cache-loader 将 loader 的处理结果缓存到磁盘，下次构建时直接读取缓存，跳过耗时的转换过程。
order: 656
---

## 问题 1：cache-loader 的作用

**cache-loader 将其后面 loader 的处理结果缓存到磁盘**。下次构建时，如果文件没有变化，直接读取缓存，跳过 loader 处理。

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          "cache-loader", // 缓存后续 loader 的结果
          "babel-loader", // 耗时的 loader
        ],
      },
    ],
  },
};
```

---

## 问题 2：工作原理

```
首次构建：
file.js → cache-loader → babel-loader → 结果
                ↓
           保存到磁盘缓存

二次构建（文件未变）：
file.js → cache-loader → 直接返回缓存结果
           （跳过 babel-loader）

二次构建（文件已变）：
file.js → cache-loader → babel-loader → 结果
                ↓
           更新磁盘缓存
```

---

## 问题 3：配置选项

```javascript
{
  loader: 'cache-loader',
  options: {
    // 缓存目录
    cacheDirectory: path.resolve('.cache'),

    // 缓存标识符（配置变化时使缓存失效）
    cacheIdentifier: 'v1',

    // 是否压缩缓存
    cacheCompression: true,

    // 自定义比较函数
    compare: (stats, dep) => stats.mtime === dep.mtime,
  },
}
```

---

## 问题 4：Webpack 5 中的替代方案

**Webpack 5 内置了持久化缓存，不再需要 cache-loader**：

```javascript
// Webpack 5 配置
module.exports = {
  cache: {
    type: "filesystem", // 文件系统缓存
    cacheDirectory: path.resolve(__dirname, ".cache"),
  },
};
```

Webpack 5 的缓存更全面，不仅缓存 loader 结果，还缓存模块解析、依赖分析等。

---

## 问题 5：何时使用 cache-loader？

### Webpack 4 项目

```javascript
// 推荐用于耗时的 loader
{
  test: /\.js$/,
  use: ['cache-loader', 'babel-loader'],
}

{
  test: /\.tsx?$/,
  use: ['cache-loader', 'ts-loader'],
}
```

### Webpack 5 项目

```javascript
// 不需要 cache-loader，使用内置缓存
module.exports = {
  cache: { type: "filesystem" },
};
```

**总结**：Webpack 5 项目直接使用内置缓存，Webpack 4 项目可以使用 cache-loader 加速构建。

## 延伸阅读

- [cache-loader](https://github.com/webpack-contrib/cache-loader)
- [Webpack 5 Cache](https://webpack.js.org/configuration/cache/)
