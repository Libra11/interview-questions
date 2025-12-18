---
title: Webpack 如何减少 Polyfill 体积？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握减少 Polyfill 体积的策略，按需引入 Polyfill，避免打包不必要的代码。
tags:
  - Webpack
  - Polyfill
  - core-js
  - 体积优化
estimatedTime: 12 分钟
keywords:
  - Polyfill 优化
  - core-js
  - useBuiltIns
  - browserslist
highlight: 通过 @babel/preset-env 的 useBuiltIns 配置和精确的 browserslist，可以按需引入 Polyfill，大幅减少体积。
order: 810
---

## 问题 1：Polyfill 体积问题

```javascript
// 全量引入 core-js
import "core-js";
// 体积：~150KB（压缩后）

// 按需引入
import "core-js/features/promise";
import "core-js/features/array/includes";
// 体积：~10KB
```

---

## 问题 2：使用 useBuiltIns: 'usage'

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage", // 按需引入
        corejs: 3,
      },
    ],
  ],
};
```

Babel 会分析代码，只引入实际使用的 Polyfill：

```javascript
// 源代码
const arr = [1, 2, 3];
arr.includes(2);

// Babel 自动添加
import "core-js/modules/es.array.includes";
```

---

## 问题 3：配置 browserslist

```json
// package.json
{
  "browserslist": ["> 1%", "last 2 versions", "not dead", "not ie 11"]
}
```

或 `.browserslistrc`：

```
> 1%
last 2 versions
not dead
not ie 11
```

**精确的目标浏览器 = 更少的 Polyfill**。

---

## 问题 4：useBuiltIns 选项对比

| 选项  | 说明                 | 体积 |
| ----- | -------------------- | ---- |
| false | 不自动引入           | 最小 |
| entry | 根据目标浏览器引入   | 中等 |
| usage | 根据代码使用情况引入 | 最小 |

```javascript
// useBuiltIns: 'entry'
// 需要在入口手动引入
import "core-js/stable";
import "regenerator-runtime/runtime";

// useBuiltIns: 'usage'
// 自动按需引入，无需手动
```

---

## 问题 5：排除不需要的 Polyfill

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: 3,
        exclude: [
          "transform-typeof-symbol", // 排除特定转换
        ],
      },
    ],
  ],
};
```

---

## 问题 6：使用 polyfill.io

```html
<!-- 根据浏览器动态返回需要的 Polyfill -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Promise,Array.prototype.includes"></script>
```

现代浏览器返回空文件，旧浏览器返回需要的 Polyfill。

---

## 问题 7：完整配置示例

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: { version: 3, proposals: true },
        // 不转换已支持的语法
        bugfixes: true,
      },
    ],
  ],
};
```

```json
// package.json
{
  "browserslist": {
    "production": ["> 0.5%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version"]
  }
}
```

## 延伸阅读

- [@babel/preset-env](https://babeljs.io/docs/babel-preset-env)
- [core-js](https://github.com/zloirock/core-js)
