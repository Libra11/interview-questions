---
title: Webpack SideEffects 字段的作用？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 package.json 中 sideEffects 字段的作用，掌握它如何帮助 Webpack 进行更彻底的 Tree-shaking。
tags:
  - Webpack
  - sideEffects
  - Tree-shaking
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - sideEffects
  - 副作用
  - Tree-shaking
  - 死代码消除
highlight: sideEffects 字段告诉 Webpack 哪些文件是"纯净"的，可以安全地移除未使用的导出，实现更彻底的 Tree-shaking。
order: 635
---

## 问题 1：什么是副作用（Side Effects）？

**副作用是指模块在导入时执行的、除了导出之外的任何操作**。

```javascript
// 有副作用的模块
import "./polyfill.js"; // 修改全局对象
import "./analytics.js"; // 发送请求
import "./styles.css"; // 注入样式

// 无副作用的模块（纯模块）
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;
// 只有导出，没有其他操作
```

---

## 问题 2：sideEffects 字段的作用

在 package.json 中声明 `sideEffects`，告诉 Webpack 哪些文件可以安全地进行 Tree-shaking：

```json
{
  "name": "my-package",
  "sideEffects": false
}
```

`sideEffects: false` 表示**包中所有文件都没有副作用**，Webpack 可以放心地移除未使用的导出。

---

## 问题 3：sideEffects 的配置方式

### 1. 完全无副作用

```json
{
  "sideEffects": false
}
```

### 2. 指定有副作用的文件

```json
{
  "sideEffects": ["*.css", "*.scss", "./src/polyfill.js", "./src/setup.js"]
}
```

这些文件即使没有被显式使用，也不会被移除。

### 3. Webpack 配置中指定

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        sideEffects: false, // 标记这类文件无副作用
      },
      {
        test: /\.css$/,
        sideEffects: true, // CSS 文件有副作用
      },
    ],
  },
};
```

---

## 问题 4：为什么需要 sideEffects？

没有 sideEffects 声明时，Webpack 必须保守处理：

```javascript
// utils/index.js
import { add } from "./math";
import { format } from "./string";
import "./polyfill"; // 有副作用

export { add, format };

// app.js
import { add } from "./utils";
// 只用了 add，但 Webpack 不敢移除 format
// 因为不确定 index.js 是否有副作用
```

声明 sideEffects 后：

```json
{
  "sideEffects": ["./src/utils/polyfill.js"]
}
```

Webpack 知道除了 polyfill.js，其他文件都是纯净的，可以安全移除 format。

---

## 问题 5：常见问题

### CSS 被意外移除

```javascript
import "./button.css";
import { Button } from "./Button";
// 如果 sideEffects: false，CSS 可能被移除！
```

解决方案：

```json
{
  "sideEffects": ["*.css", "*.scss"]
}
```

### 第三方库的 sideEffects

检查第三方库是否正确声明了 sideEffects：

```bash
# 查看 node_modules/lodash-es/package.json
{
  "sideEffects": false  # lodash-es 声明了无副作用
}
```

如果库没有声明，可能无法完全 Tree-shaking。

## 延伸阅读

- [sideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
