---
title: Webpack Module、Chunk、Bundle 分别是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 中 Module、Chunk、Bundle 三个核心概念的区别和关系。
tags:
  - Webpack
  - Module
  - Chunk
  - Bundle
estimatedTime: 12 分钟
keywords:
  - Module
  - Chunk
  - Bundle
  - 概念区分
highlight: Module 是源文件，Chunk 是模块的集合，Bundle 是最终输出的文件，它们是构建过程中的不同阶段产物。
order: 762
---

## 问题 1：Module（模块）

**Module 是 Webpack 处理的基本单位，对应源代码中的每个文件**。

```javascript
// 每个文件都是一个 Module
import App from "./App.js"; // App.js 是一个 Module
import "./styles.css"; // styles.css 是一个 Module
import logo from "./logo.png"; // logo.png 是一个 Module
```

Module 的特点：

- 对应源代码文件
- 经过 Loader 处理
- 包含依赖信息
- 是构建的输入

---

## 问题 2：Chunk（代码块）

**Chunk 是一组 Module 的集合，是 Webpack 内部的中间产物**。

Chunk 的产生方式：

```javascript
// 1. 入口产生的 Chunk
entry: {
  main: './src/index.js',    // → main chunk
  admin: './src/admin.js',   // → admin chunk
}

// 2. 动态导入产生的 Chunk
import('./lazy-module');     // → 异步 chunk

// 3. SplitChunks 产生的 Chunk
optimization: {
  splitChunks: { chunks: 'all' }  // → vendors chunk, common chunk
}
```

Chunk 的特点：

- 是 Module 的集合
- 有名称（name）和 ID
- 是 Webpack 内部概念
- 是构建的中间产物

---

## 问题 3：Bundle（包）

**Bundle 是最终输出的文件，是 Chunk 经过处理后的产物**。

```
dist/
├── main.js           # main chunk → main bundle
├── admin.js          # admin chunk → admin bundle
├── vendors.js        # vendors chunk → vendors bundle
└── 1.js              # 异步 chunk → 异步 bundle
```

Bundle 的特点：

- 是最终输出的文件
- 可以直接在浏览器运行
- 包含运行时代码
- 是构建的输出

---

## 问题 4：三者的关系

```
源文件 (Source Files)
    ↓
Module (模块)
    ↓ 根据依赖关系组合
Chunk (代码块)
    ↓ 生成代码、优化
Bundle (输出文件)
```

对应关系：

| 阶段 | 概念   | 说明           |
| ---- | ------ | -------------- |
| 输入 | Module | 源代码文件     |
| 中间 | Chunk  | 模块的逻辑分组 |
| 输出 | Bundle | 最终的物理文件 |

---

## 问题 5：实际示例

```javascript
// webpack.config.js
module.exports = {
  entry: {
    main: "./src/index.js",
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /node_modules/,
          name: "vendors",
        },
      },
    },
  },
};
```

假设 index.js 引用了 React 和一个本地模块：

```
Modules:
├── ./src/index.js
├── ./src/App.js
├── react
└── react-dom

    ↓ 分组

Chunks:
├── main (index.js + App.js)
└── vendors (react + react-dom)

    ↓ 输出

Bundles:
├── main.js
└── vendors.js
```

通常情况下，**一个 Chunk 对应一个 Bundle**，但也可能多个 Chunk 合并成一个 Bundle，或一个 Chunk 拆分成多个 Bundle（如 CSS 提取）。

## 延伸阅读

- [Concepts](https://webpack.js.org/concepts/)
- [Glossary](https://webpack.js.org/glossary/)
