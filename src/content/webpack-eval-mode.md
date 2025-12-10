---
title: Webpack eval 模式为什么快？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack eval 模式的工作原理，了解它为什么能提供最快的构建速度。
tags:
  - Webpack
  - eval
  - Source Map
  - 构建速度
estimatedTime: 10 分钟
keywords:
  - eval
  - 构建速度
  - sourceURL
  - 开发模式
highlight: eval 模式将每个模块包装在 eval() 中执行，使用 sourceURL 标记来源，无需生成完整的 Source Map 文件。
order: 675
---

## 问题 1：eval 模式的工作原理

**eval 模式将每个模块的代码包装在 eval() 函数中**：

```javascript
// 普通模式
__webpack_modules__["./src/index.js"] = function (module, exports) {
  console.log("hello");
};

// eval 模式
__webpack_modules__["./src/index.js"] = function (module, exports) {
  eval("console.log('hello');\n//# sourceURL=webpack:///./src/index.js");
};
```

关键是 `//# sourceURL=...` 注释，它告诉浏览器这段代码来自哪个文件。

---

## 问题 2：为什么 eval 更快？

### 1. 不需要生成 Source Map 文件

```javascript
// source-map 模式
// 需要生成完整的映射文件
// 包含行列映射、变量名等

// eval 模式
// 只需要添加 sourceURL 注释
// 几乎没有额外开销
```

### 2. 不需要计算映射关系

```javascript
// source-map 需要计算：
// 源代码第 10 行第 5 列 → 编译后第 1 行第 1234 列

// eval 不需要计算：
// 每个模块独立，直接标记来源文件
```

### 3. 增量构建更快

```javascript
// 修改一个文件时：
// source-map：需要重新计算整个映射
// eval：只需要重新 eval 这一个模块
```

---

## 问题 3：eval 的缺点

### 调试体验差

```javascript
// 只能定位到文件，无法定位到具体行列
// 错误显示：./src/index.js
// 而不是：./src/index.js:10:5
```

### 代码显示问题

```javascript
// 在 DevTools 中，代码显示在 eval 上下文中
// 不如 source-map 直观
```

---

## 问题 4：eval 的变体

```javascript
// eval：最快，只有 sourceURL
devtool: 'eval',

// eval-source-map：eval + 完整 Source Map
devtool: 'eval-source-map',

// eval-cheap-source-map：eval + 行映射
devtool: 'eval-cheap-source-map',

// eval-cheap-module-source-map：eval + 行映射 + loader 源码
devtool: 'eval-cheap-module-source-map',
```

---

## 问题 5：速度对比

```
构建速度（从快到慢）：
1. eval                        +++
2. eval-cheap-source-map       ++
3. eval-cheap-module-source-map +
4. eval-source-map             -
5. source-map                  --
```

---

## 问题 6：使用建议

```javascript
module.exports = {
  // 开发环境：追求速度
  devtool:
    process.env.NODE_ENV === "development"
      ? "eval-cheap-module-source-map" // 平衡速度和质量
      : false,
};

// 如果项目很大，构建很慢
// 可以使用 'eval' 获得最快速度
// 牺牲一些调试体验
```

## 延伸阅读

- [Devtool](https://webpack.js.org/configuration/devtool/)
- [eval 和 sourceURL](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#using_eval_with_source_urls)
