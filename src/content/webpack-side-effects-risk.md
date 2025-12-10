---
title: sideEffects false 有什么风险？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  了解 sideEffects: false 配置的潜在风险，掌握如何正确配置以避免代码被意外移除。
tags:
  - Webpack
  - sideEffects
  - Tree-shaking
  - 常见问题
estimatedTime: 10 分钟
keywords:
  - sideEffects 风险
  - CSS 丢失
  - 副作用
  - 配置错误
highlight: sideEffects false 可能导致 CSS、polyfill 等有副作用的代码被意外移除，需要正确配置例外文件。
order: 640
---

## 问题 1：CSS 文件被移除

最常见的问题是 CSS 文件被意外删除：

```javascript
// Button.js
import "./button.css"; // 只是导入，没有使用导出
import { Button } from "./Button";

export { Button };
```

如果配置了 `sideEffects: false`，Webpack 认为 `button.css` 没有被"使用"，会将其移除。

**解决方案**：

```json
{
  "sideEffects": ["*.css", "*.scss", "*.less"]
}
```

---

## 问题 2：Polyfill 被移除

```javascript
// 入口文件
import "core-js/stable";
import "regenerator-runtime/runtime";
import "./app";
```

Polyfill 只是执行代码修改全局对象，没有导出。`sideEffects: false` 会导致它们被移除。

**解决方案**：

```json
{
  "sideEffects": ["./src/polyfill.js", "core-js/**", "regenerator-runtime/**"]
}
```

---

## 问题 3：全局注册代码被移除

```javascript
// register-components.js
import Vue from "vue";
import Button from "./Button.vue";

Vue.component("Button", Button); // 全局注册，有副作用
```

这种全局注册的代码也会被移除。

**解决方案**：

```json
{
  "sideEffects": ["./src/register-*.js"]
}
```

---

## 问题 4：正确的配置方式

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "*.less",
    "*.vue",
    "./src/polyfill.js",
    "./src/setup.js",
    "./src/**/*.css"
  ]
}
```

或者在 Webpack 中配置：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        sideEffects: true, // 标记 CSS 有副作用
      },
      {
        test: /\.js$/,
        sideEffects: false, // JS 文件无副作用
      },
    ],
  },
};
```

---

## 问题 5：如何排查问题？

### 1. 检查构建警告

Webpack 可能会输出相关警告信息。

### 2. 对比打包结果

```bash
# 移除 sideEffects 配置前后对比
# 检查哪些文件消失了
```

### 3. 使用 stats 配置

```javascript
stats: {
  optimizationBailout: true,
}
```

会显示哪些模块因为什么原因没有被优化。

**建议**：宁可保守一些，把可能有副作用的文件都列出来，避免线上问题。

## 延伸阅读

- [sideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
- [Tree Shaking Caveats](https://webpack.js.org/guides/tree-shaking/#clarifying-tree-shaking-and-sideeffects)
