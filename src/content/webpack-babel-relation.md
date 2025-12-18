---
title: Webpack 与 Babel 之间的关系？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 和 Babel 各自的职责，以及它们如何协同工作。
tags:
  - Webpack
  - Babel
  - 编译
  - 打包
estimatedTime: 10 分钟
keywords:
  - Webpack Babel
  - babel-loader
  - 编译打包
  - 职责分工
highlight: Webpack 负责模块打包，Babel 负责代码转换。通过 babel-loader，Webpack 在打包过程中调用 Babel 转换代码。
order: 815
---

## 问题 1：各自的职责

### Webpack

**模块打包器**，负责：

- 解析模块依赖
- 打包成 bundle
- 代码分割
- 资源处理

### Babel

**JavaScript 编译器**，负责：

- ES6+ 转换为 ES5
- JSX 转换
- TypeScript 转换（可选）
- 语法转换和 Polyfill

---

## 问题 2：协同工作

```
源代码 (.js/.jsx)
       │
       ↓
   Webpack 解析依赖
       │
       ↓
   babel-loader 调用 Babel
       │
       ↓
   Babel 转换代码
       │
       ↓
   Webpack 打包输出
```

---

## 问题 3：配置示例

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: "babel-loader", // Webpack 通过 loader 调用 Babel
        exclude: /node_modules/,
      },
    ],
  },
};

// babel.config.js
module.exports = {
  presets: [["@babel/preset-env", { modules: false }], "@babel/preset-react"],
};
```

---

## 问题 4：为什么需要 modules: false？

```javascript
// babel.config.js
presets: [
  [
    "@babel/preset-env",
    {
      modules: false, // 不转换 ES Module
    },
  ],
];
```

原因：

- Webpack 需要 ES Module 语法来做 Tree-shaking
- 如果 Babel 转换为 CommonJS，Tree-shaking 失效

---

## 问题 5：没有 Babel 可以吗？

**可以**，但有限制：

```javascript
// Webpack 5 可以直接处理现代 JavaScript
// 但不会做语法转换

// 如果目标浏览器支持 ES6+，可以不用 Babel
// 如果需要支持旧浏览器，必须用 Babel
```

替代方案：

- **esbuild-loader**：更快，但功能有限
- **swc-loader**：Rust 实现，速度快

---

## 问题 6：常见误解

```javascript
// ❌ 误解：Webpack 负责转换 ES6
// ✅ 正确：Babel 负责转换，Webpack 只是调用

// ❌ 误解：Babel 可以打包代码
// ✅ 正确：Babel 只做转换，不做打包

// ❌ 误解：必须同时使用
// ✅ 正确：可以单独使用，但通常一起使用
```

## 延伸阅读

- [babel-loader](https://github.com/babel/babel-loader)
- [Babel](https://babeljs.io/)
