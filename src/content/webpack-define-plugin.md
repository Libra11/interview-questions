---
title: Webpack DefinePlugin 用来做什么？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 DefinePlugin 的作用和原理，掌握如何在构建时注入全局常量。
tags:
  - Webpack
  - DefinePlugin
  - 环境变量
  - 编译时替换
estimatedTime: 10 分钟
keywords:
  - DefinePlugin
  - 环境变量
  - 全局常量
highlight: DefinePlugin 在编译时将代码中的变量替换为指定的值，常用于注入环境变量和版本信息。
order: 753
---

## 问题 1：DefinePlugin 的作用

**DefinePlugin 在编译时进行文本替换**，将代码中的指定变量替换为配置的值。

```javascript
const { DefinePlugin } = require("webpack");

module.exports = {
  plugins: [
    new DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      VERSION: JSON.stringify("1.0.0"),
      IS_DEBUG: false,
    }),
  ],
};
```

源代码：

```javascript
if (process.env.NODE_ENV === "production") {
  console.log("生产环境");
}
console.log(VERSION);
```

编译后：

```javascript
if ("production" === "production") {
  console.log("生产环境");
}
console.log("1.0.0");
```

---

## 问题 2：为什么要用 JSON.stringify？

DefinePlugin 是**直接文本替换**，不是赋值：

```javascript
// ❌ 错误：会替换为 production（没有引号，变成变量）
new DefinePlugin({
  "process.env.NODE_ENV": "production",
});
// 结果：if (production === 'production')  // 报错！

// ✅ 正确：替换为 "production"（带引号的字符串）
new DefinePlugin({
  "process.env.NODE_ENV": JSON.stringify("production"),
});
// 结果：if ("production" === "production")
```

数字和布尔值不需要 `JSON.stringify`：

```javascript
new DefinePlugin({
  VERSION: JSON.stringify("1.0.0"), // 字符串需要
  BUILD_NUMBER: 123, // 数字不需要
  IS_DEBUG: false, // 布尔值不需要
});
```

---

## 问题 3：常见用途

### 1. 区分开发/生产环境

```javascript
new DefinePlugin({
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
});

// 代码中使用
if (process.env.NODE_ENV === "development") {
  // 开发环境特有逻辑
}
```

### 2. 注入版本信息

```javascript
const pkg = require("./package.json");

new DefinePlugin({
  APP_VERSION: JSON.stringify(pkg.version),
  BUILD_TIME: JSON.stringify(new Date().toISOString()),
});
```

### 3. 功能开关

```javascript
new DefinePlugin({
  FEATURE_FLAG_NEW_UI: JSON.stringify(true),
});

// 代码中
if (FEATURE_FLAG_NEW_UI) {
  // 新 UI 逻辑
}
```

---

## 问题 4：与 Tree-shaking 配合

DefinePlugin 配合 Tree-shaking 可以移除无用代码：

```javascript
// 配置
new DefinePlugin({
  "process.env.NODE_ENV": JSON.stringify("production"),
});

// 源代码
if (process.env.NODE_ENV === "development") {
  console.log("开发调试信息");
}

// 编译后（production 模式）
if (false) {
  console.log("开发调试信息");
}

// Tree-shaking 后：这段代码会被完全移除
```

---

## 问题 5：TypeScript 类型声明

使用 TypeScript 时，需要声明全局变量类型：

```typescript
// global.d.ts
declare const VERSION: string;
declare const IS_DEBUG: boolean;

// 使用
console.log(VERSION); // 不会报类型错误
```

## 延伸阅读

- [DefinePlugin](https://webpack.js.org/plugins/define-plugin/)
- [环境变量](https://webpack.js.org/guides/environment-variables/)
