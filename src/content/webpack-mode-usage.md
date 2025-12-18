---
title: webpack 中 mode 是做什么用的
category: Webpack
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  深入理解 webpack 的 mode 配置选项，掌握 development、production 和 none 三种模式的区别与应用场景，了解不同模式下 webpack 的内置优化策略。
tags:
  - Webpack
  - 构建工具
  - 性能优化
  - 配置
estimatedTime: 18 分钟
keywords:
  - webpack mode
  - development
  - production
  - 构建优化
highlight: mode 是 webpack 4 引入的核心配置，通过简单的配置即可启用对应环境的内置优化
order: 6
---

## 问题 1：webpack 的 mode 配置是什么？

### 基本概念

`mode` 是 webpack 4.0 引入的一个重要配置项，用于指定当前的构建环境。它有三个可选值：

- **`development`**：开发模式
- **`production`**：生产模式
- **`none`**：不使用任何默认优化选项

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // 设置为生产模式
  // 其他配置...
};
```

### 为什么需要 mode？

在 webpack 4 之前，开发者需要手动配置大量的优化选项，比如代码压缩、Tree Shaking、环境变量等。这不仅繁琐，还容易出错。

`mode` 的出现就是为了简化这个过程，通过一个配置项就能自动启用对应环境的最佳实践配置。

---

## 问题 2：development 和 production 模式有什么区别？

### development 模式特点

开发模式主要关注**构建速度**和**调试体验**：

```javascript
// development 模式会自动启用以下配置
module.exports = {
  mode: 'development',
  devtool: 'eval', // 快速的 source map
  cache: true, // 启用缓存
  performance: {
    hints: false, // 不显示性能提示
  },
  optimization: {
    moduleIds: 'named', // 使用可读的模块 ID
    chunkIds: 'named', // 使用可读的 chunk ID
    nodeEnv: 'development', // 设置 process.env.NODE_ENV
  },
};
```

**主要特性**：
- 启用详细的错误信息和堆栈跟踪
- 使用 `eval` 模式的 source map，构建速度快
- 不会压缩代码，保持可读性
- 启用模块热替换（HMR）支持

### production 模式特点

生产模式主要关注**输出质量**和**性能优化**：

```javascript
// production 模式会自动启用以下配置
module.exports = {
  mode: 'production',
  performance: {
    hints: 'warning', // 显示性能警告
  },
  optimization: {
    minimize: true, // 启用代码压缩
    moduleIds: 'deterministic', // 使用确定性的模块 ID
    chunkIds: 'deterministic', // 使用确定性的 chunk ID
    nodeEnv: 'production', // 设置 process.env.NODE_ENV
    usedExports: true, // 标记未使用的导出
    sideEffects: true, // 识别 package.json 中的 sideEffects
    concatenateModules: true, // 模块串联（作用域提升）
    splitChunks: { chunks: 'all' }, // 代码分割
  },
};
```

**主要特性**：
- 自动启用 TerserPlugin 压缩代码
- 启用 Tree Shaking 删除未使用的代码
- 启用作用域提升（Scope Hoisting）
- 自动设置 `process.env.NODE_ENV` 为 `'production'`

### 对比示例

```javascript
// 开发环境打包结果（可读性好）
/***/ "./src/index.js":
/***/ (function(module, exports) {
  console.log('Hello World');
})

// 生产环境打包结果（体积小）
!function(e){console.log("Hello World")}();
```

---

## 问题 3：mode 如何影响 process.env.NODE_ENV？

### 自动设置环境变量

webpack 的 `mode` 配置会自动通过 `DefinePlugin` 设置 `process.env.NODE_ENV`：

```javascript
// mode: 'production' 等同于
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
};
```

### 代码中的应用

这使得我们可以在代码中根据环境执行不同的逻辑：

```javascript
// src/index.js
if (process.env.NODE_ENV === 'development') {
  console.log('开发环境：启用调试工具');
  // 加载开发工具
} else {
  console.log('生产环境：优化性能');
  // 移除调试代码
}
```

### Tree Shaking 的作用

在生产模式下，上面的 `if` 语句会被识别为死代码并删除：

```javascript
// 生产环境打包后
console.log('生产环境：优化性能');
// if 分支被完全移除
```

这就是为什么很多第三方库（如 React、Vue）会根据 `NODE_ENV` 提供不同的构建版本。

---

## 问题 4：什么时候使用 none 模式？

### none 模式的特点

`none` 模式会禁用所有默认优化，webpack 只做最基础的打包工作：

```javascript
module.exports = {
  mode: 'none',
  // 需要手动配置所有优化选项
};
```

### 适用场景

**1. 自定义优化策略**

当你需要完全控制优化过程时：

```javascript
module.exports = {
  mode: 'none',
  optimization: {
    minimize: true,
    minimizer: [
      // 使用自定义压缩插件
      new CustomMinifier(),
    ],
  },
};
```

**2. 调试 webpack 行为**

当你想了解 webpack 的原始输出，不受任何优化干扰：

```javascript
// 用于学习和调试
module.exports = {
  mode: 'none',
  // 查看最原始的打包结果
};
```

**3. 特殊构建需求**

某些特殊场景下，默认优化可能不适用：

```javascript
// 例如：构建 library 时可能需要特殊配置
module.exports = {
  mode: 'none',
  output: {
    library: 'MyLibrary',
    libraryTarget: 'umd',
  },
};
```

---

## 问题 5：如何在不同环境使用不同的 mode？

### 通过命令行参数

最简单的方式是通过 `--mode` 参数：

```json
// package.json
{
  "scripts": {
    "dev": "webpack --mode development",
    "build": "webpack --mode production"
  }
}
```

### 通过环境变量

使用 Node.js 的环境变量动态设置：

```javascript
// webpack.config.js
module.exports = {
  mode: process.env.NODE_ENV || 'development',
};
```

```json
// package.json
{
  "scripts": {
    "dev": "NODE_ENV=development webpack",
    "build": "NODE_ENV=production webpack"
  }
}
```

### 多配置文件

为不同环境创建独立的配置文件：

```javascript
// webpack.dev.js
module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  // 开发环境特定配置
};

// webpack.prod.js
module.exports = {
  mode: 'production',
  // 生产环境特定配置
};
```

```json
// package.json
{
  "scripts": {
    "dev": "webpack --config webpack.dev.js",
    "build": "webpack --config webpack.prod.js"
  }
}
```

### 使用 webpack-merge

推荐使用 `webpack-merge` 合并通用配置和环境特定配置：

```javascript
// webpack.common.js
module.exports = {
  entry: './src/index.js',
  // 通用配置
};

// webpack.prod.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  // 生产环境特定配置
});
```

---

## 总结

**核心概念总结**：

### 1. mode 的三种模式

- **development**：快速构建，便于调试
- **production**：优化输出，适合部署
- **none**：无默认优化，完全自定义

### 2. 自动优化

- mode 会自动启用对应环境的最佳实践配置
- 无需手动配置大量优化选项
- 提高开发效率，减少配置错误

### 3. 环境变量

- 自动设置 `process.env.NODE_ENV`
- 支持代码中的条件编译
- 配合 Tree Shaking 删除无用代码

## 延伸阅读

- [Webpack Mode 官方文档](https://webpack.js.org/configuration/mode/)
- [Webpack 优化指南](https://webpack.js.org/guides/production/)
- [深入理解 webpack 的 mode](https://webpack.js.org/concepts/mode/)
- [Tree Shaking 原理](https://webpack.js.org/guides/tree-shaking/)
- [DefinePlugin 文档](https://webpack.js.org/plugins/define-plugin/)
