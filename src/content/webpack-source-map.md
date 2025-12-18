---
title: 什么是 Source Map？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 Source Map 的概念和作用，掌握它如何帮助调试压缩后的代码。
tags:
  - Webpack
  - Source Map
  - 调试
  - 开发工具
estimatedTime: 12 分钟
keywords:
  - Source Map
  - 源码映射
  - 调试
  - devtool
highlight: Source Map 是源代码与编译后代码的映射文件，让浏览器调试时能显示原始源代码而非压缩后的代码。
order: 802
---

## 问题 1：为什么需要 Source Map？

现代前端代码经过编译和压缩后，与源代码差异很大：

```javascript
// 源代码
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 压缩后
function calculateTotal(t) {
  return t.reduce((t, e) => t + e.price, 0);
}
```

当压缩后的代码报错时，很难定位到源代码的位置。**Source Map 建立了源代码与编译后代码的映射关系**。

---

## 问题 2：Source Map 的工作原理

```
源代码 (source.js)
    │
    │ 编译/压缩
    ↓
编译后代码 (bundle.js)
    │
    │ 生成映射
    ↓
Source Map (bundle.js.map)
```

Source Map 文件包含：

- 源文件路径
- 源代码内容（可选）
- 行列映射关系

---

## 问题 3：Source Map 文件结构

```json
{
  "version": 3,
  "sources": ["src/index.js", "src/utils.js"],
  "names": ["calculateTotal", "items", "reduce"],
  "mappings": "AAAA,SAASA,eAAe...",
  "sourcesContent": ["function calculateTotal..."]
}
```

- **sources**：源文件列表
- **names**：变量名列表
- **mappings**：位置映射（Base64 VLQ 编码）
- **sourcesContent**：源代码内容

---

## 问题 4：在 Webpack 中配置

```javascript
module.exports = {
  // 通过 devtool 配置 Source Map
  devtool: "source-map",
};
```

生成的文件：

```
dist/
├── bundle.js
└── bundle.js.map
```

bundle.js 末尾会有引用：

```javascript
//# sourceMappingURL=bundle.js.map
```

---

## 问题 5：浏览器中的效果

```
没有 Source Map：
错误显示在 bundle.js 第 1 行第 1234 列

有 Source Map：
错误显示在 src/utils.js 第 15 行
可以直接在源代码上设置断点
```

Chrome DevTools 会自动加载 Source Map，在 Sources 面板显示原始源代码。

---

## 问题 6：Source Map 的类型

Webpack 提供多种 Source Map 类型：

| 类型             | 质量 | 速度 | 适用场景 |
| ---------------- | ---- | ---- | -------- |
| source-map       | 最好 | 最慢 | 生产环境 |
| eval-source-map  | 好   | 慢   | 开发环境 |
| cheap-source-map | 中等 | 快   | 开发环境 |
| eval             | 差   | 最快 | 开发环境 |

开发环境追求速度，生产环境追求质量。

## 延伸阅读

- [Devtool](https://webpack.js.org/configuration/devtool/)
- [Source Map 规范](https://sourcemaps.info/spec.html)
