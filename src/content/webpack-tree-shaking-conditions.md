---
title: Tree-shaking 的前提条件是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 Tree-shaking 生效的必要条件，了解如何正确配置以获得最佳的代码消除效果。
tags:
  - Webpack
  - Tree-shaking
  - ES Module
  - 配置
estimatedTime: 12 分钟
keywords:
  - Tree-shaking 条件
  - ES Module
  - sideEffects
  - production 模式
highlight: Tree-shaking 需要 ES Module 语法、production 模式、正确的 sideEffects 配置，以及支持 Tree-shaking 的第三方库。
order: 767
---

## 问题 1：必须使用 ES Module

**Tree-shaking 只对 ES Module 有效**，因为 ES Module 的 import/export 是静态的：

```javascript
// ✅ ES Module（可以 Tree-shaking）
import { add } from "./utils";
export const result = add(1, 2);

// ❌ CommonJS（无法 Tree-shaking）
const { add } = require("./utils");
module.exports = { result: add(1, 2) };
```

确保 Babel 不要将 ES Module 转换为 CommonJS：

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false, // 保留 ES Module 语法
      },
    ],
  ],
};
```

---

## 问题 2：使用 production 模式

Tree-shaking 需要在 production 模式下才能完全生效：

```javascript
module.exports = {
  mode: "production", // 启用 Tree-shaking 和代码压缩
};
```

production 模式会自动启用：

- `usedExports: true`：标记未使用的导出
- `minimize: true`：压缩代码，移除死代码

---

## 问题 3：正确配置 sideEffects

在 package.json 中声明 sideEffects：

```json
{
  "name": "my-project",
  "sideEffects": false
}
```

或指定有副作用的文件：

```json
{
  "sideEffects": ["*.css", "*.scss", "./src/polyfill.js"]
}
```

没有 sideEffects 声明，Webpack 会保守处理，可能无法移除某些代码。

---

## 问题 4：第三方库的支持

第三方库需要满足以下条件才能被 Tree-shaking：

### 1. 提供 ES Module 版本

```json
// package.json
{
  "main": "lib/index.js", // CommonJS
  "module": "es/index.js" // ES Module（Webpack 优先使用）
}
```

### 2. 声明 sideEffects

```json
{
  "sideEffects": false
}
```

### 常见库的 Tree-shaking 支持

| 库        | 支持情况                     |
| --------- | ---------------------------- |
| lodash    | ❌ 需要用 lodash-es          |
| lodash-es | ✅ 完全支持                  |
| antd      | ✅ 支持（需要 babel-plugin） |
| rxjs      | ✅ 支持                      |

---

## 问题 5：检查 Tree-shaking 是否生效

### 1. 使用 stats 配置

```javascript
module.exports = {
  stats: {
    usedExports: true, // 显示哪些导出被使用
  },
};
```

### 2. 查看打包结果

```javascript
// 开发模式下，未使用的导出会有注释标记
/* unused harmony export sub */
```

### 3. 使用 webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

plugins: [new BundleAnalyzerPlugin()];
```

可视化查看哪些代码被打包进来。

---

## 问题 6：条件清单

确保 Tree-shaking 生效的检查清单：

- [ ] 使用 ES Module 语法（import/export）
- [ ] Babel 配置 `modules: false`
- [ ] Webpack 使用 `mode: 'production'`
- [ ] package.json 配置 `sideEffects`
- [ ] 第三方库提供 ES Module 版本
- [ ] 避免在模块顶层执行有副作用的代码

## 延伸阅读

- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [sideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
