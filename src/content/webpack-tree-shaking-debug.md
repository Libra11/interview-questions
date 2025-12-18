---
title: 为什么 Tree-shaking 不生效？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  排查 Tree-shaking 不生效的常见原因，掌握调试和解决问题的方法。
tags:
  - Webpack
  - Tree-shaking
  - 问题排查
  - 调试
estimatedTime: 12 分钟
keywords:
  - Tree-shaking 不生效
  - 问题排查
  - 调试
  - 解决方案
highlight: Tree-shaking 不生效通常由 CommonJS 模块、Babel 配置、缺少 sideEffects 或开发模式导致。
order: 833
---

## 问题 1：检查模块格式

```javascript
// ❌ CommonJS 无法 Tree-shaking
const { add } = require("./utils");
module.exports = { add };

// ✅ ES Module 可以 Tree-shaking
import { add } from "./utils";
export { add };
```

---

## 问题 2：检查 Babel 配置

```javascript
// ❌ Babel 将 ES Module 转换为 CommonJS
// babel.config.js
module.exports = {
  presets: ["@babel/preset-env"], // 默认转换
};

// ✅ 保留 ES Module
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: false, // 关键配置
      },
    ],
  ],
};
```

---

## 问题 3：检查 sideEffects

```json
// package.json
{
  "sideEffects": false
}

// 或指定有副作用的文件
{
  "sideEffects": [
    "*.css",
    "./src/polyfill.js"
  ]
}
```

没有 sideEffects 配置，Webpack 会保守处理。

---

## 问题 4：检查构建模式

```javascript
// ❌ 开发模式只标记，不移除
mode: "development";

// ✅ 生产模式才真正移除
mode: "production";
```

开发模式下可以看到标记：

```javascript
/* unused harmony export unusedFunc */
```

---

## 问题 5：检查第三方库

```javascript
// 检查库的 package.json
{
  "main": "lib/index.js",      // CommonJS
  "module": "es/index.js",     // ES Module（需要有这个）
  "sideEffects": false         // 需要声明
}

// 常见问题库
// lodash → 使用 lodash-es
// moment → 使用 dayjs
```

---

## 问题 6：调试方法

### 查看 Webpack 输出

```javascript
// webpack.config.js
stats: {
  usedExports: true,
  optimizationBailout: true,  // 显示未优化原因
}
```

### 使用 webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

plugins: [new BundleAnalyzerPlugin()];
```

### 搜索打包结果

```bash
# 搜索未使用的函数是否存在
grep -r "unusedFunction" dist/
```

---

## 问题 7：排查清单

```
□ 使用 ES Module 语法（import/export）
□ Babel 配置 modules: false
□ package.json 配置 sideEffects
□ Webpack mode: 'production'
□ 第三方库提供 ES Module 版本
□ 没有动态属性访问（obj[key]）
□ 没有顶层副作用代码
```

如果以上都检查过了还不生效，可能是代码本身有副作用，Webpack 无法安全移除。

## 延伸阅读

- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [sideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
