---
title: HardSourceWebpackPlugin 是做什么的？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 HardSourceWebpackPlugin 的作用，了解它如何通过模块缓存加速 Webpack 构建。
tags:
  - Webpack
  - HardSourceWebpackPlugin
  - 缓存
  - 构建优化
estimatedTime: 10 分钟
keywords:
  - HardSourceWebpackPlugin
  - 模块缓存
  - 构建加速
  - 中间缓存
highlight: HardSourceWebpackPlugin 缓存 Webpack 的中间模块结果，二次构建时跳过未变化模块的处理，大幅提升构建速度。
order: 657
---

## 问题 1：HardSourceWebpackPlugin 的作用

**HardSourceWebpackPlugin 为 Webpack 提供中间缓存**，缓存模块的解析和转换结果。

```javascript
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

module.exports = {
  plugins: [new HardSourceWebpackPlugin()],
};
```

效果：

- 首次构建：正常速度
- 二次构建：速度提升 50%-90%

---

## 问题 2：与 cache-loader 的区别

| 特性     | cache-loader       | HardSourceWebpackPlugin |
| -------- | ------------------ | ----------------------- |
| 缓存范围 | 单个 loader 结果   | 整个模块处理结果        |
| 配置方式 | 在 loader 链中配置 | 作为插件配置            |
| 缓存粒度 | 细粒度             | 粗粒度                  |
| 效果     | 中等               | 显著                    |

HardSourceWebpackPlugin 缓存的内容更全面，效果通常更好。

---

## 问题 3：工作原理

```
首次构建：
源文件 → 解析 → Loader 处理 → 模块对象
                                  ↓
                            缓存到磁盘

二次构建（文件未变）：
源文件 → 检查缓存 → 直接使用缓存的模块对象
         （跳过解析和 Loader 处理）
```

---

## 问题 4：配置选项

```javascript
new HardSourceWebpackPlugin({
  // 缓存目录
  cacheDirectory: "node_modules/.cache/hard-source/[confighash]",

  // 环境 hash，用于区分不同环境的缓存
  environmentHash: {
    root: process.cwd(),
    directories: [],
    files: ["package-lock.json", "yarn.lock"],
  },

  // 缓存清理配置
  cachePrune: {
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 天
    sizeThreshold: 50 * 1024 * 1024, // 50 MB
  },
});
```

---

## 问题 5：Webpack 5 中的替代方案

**Webpack 5 内置了持久化缓存，不再需要 HardSourceWebpackPlugin**：

```javascript
// Webpack 5 配置
module.exports = {
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
};
```

Webpack 5 的内置缓存：

- 更稳定，官方维护
- 更全面，缓存更多内容
- 更智能，自动处理缓存失效

**总结**：Webpack 4 项目可以使用 HardSourceWebpackPlugin，Webpack 5 项目使用内置缓存。

## 延伸阅读

- [hard-source-webpack-plugin](https://github.com/mzgoddard/hard-source-webpack-plugin)
- [Webpack 5 Persistent Caching](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#persistent-caching)
