---
title: Webpack vs Rollup？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  对比 Webpack 和 Rollup 的特点，了解各自的适用场景。
tags:
  - Webpack
  - Rollup
  - 构建工具
  - 对比
estimatedTime: 12 分钟
keywords:
  - Rollup
  - 库打包
  - 工具对比
  - Tree-shaking
highlight: Rollup 更适合打包库，输出更干净；Webpack 更适合打包应用，功能更全面。
order: 817
---

## 问题 1：核心差异

| 特性         | Webpack            | Rollup              |
| ------------ | ------------------ | ------------------- |
| 定位         | 应用打包           | 库打包              |
| 输出格式     | 多种（主要是应用） | 多种（ESM/CJS/UMD） |
| Tree-shaking | 支持               | 更彻底              |
| 代码分割     | 强大               | 基础支持            |
| 插件生态     | 丰富               | 较少                |
| 输出体积     | 较大（有运行时）   | 更小（更干净）      |

---

## 问题 2：输出代码对比

```javascript
// 源代码
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;

// Webpack 输出（简化）
(function(modules) {
  // webpack 运行时代码
  function __webpack_require__(moduleId) { ... }
  // ...
})({
  "./src/math.js": function(module, exports) {
    exports.add = (a, b) => a + b;
    exports.sub = (a, b) => a - b;
  }
});

// Rollup 输出
const add = (a, b) => a + b;
const sub = (a, b) => a - b;
export { add, sub };
```

Rollup 输出更干净，没有额外的运行时代码。

---

## 问题 3：Tree-shaking 对比

```javascript
// Rollup 的 Tree-shaking 更彻底
// 可以移除更多未使用的代码

// Webpack 需要更多配置才能达到类似效果
// sideEffects, usedExports 等
```

---

## 问题 4：适用场景

### 选择 Webpack

- Web 应用开发
- 需要 HMR
- 需要代码分割
- 需要处理各种资源（图片、CSS 等）
- 大型企业级项目

### 选择 Rollup

- 打包 JavaScript 库
- 需要输出多种格式（ESM/CJS/UMD）
- 追求最小的输出体积
- 打包 npm 包

---

## 问题 5：配置对比

```javascript
// Webpack 配置
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    library: { type: "umd", name: "MyLib" },
  },
  module: {
    rules: [{ test: /\.js$/, use: "babel-loader" }],
  },
};

// Rollup 配置
export default {
  input: "src/index.js",
  output: [
    { file: "dist/bundle.cjs.js", format: "cjs" },
    { file: "dist/bundle.esm.js", format: "es" },
    { file: "dist/bundle.umd.js", format: "umd", name: "MyLib" },
  ],
  plugins: [babel()],
};
```

Rollup 更容易输出多种格式。

---

## 问题 6：实际选择

```
打包应用 → Webpack
打包库   → Rollup
两者都需要 → 应用用 Webpack，库用 Rollup

流行库的选择：
React → Rollup
Vue   → Rollup
lodash-es → Rollup
```

## 延伸阅读

- [Rollup](https://rollupjs.org/)
- [Webpack vs Rollup](https://webpack.js.org/comparison/)
