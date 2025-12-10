---
title: HMR 与 Live Reload 的区别？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  对比 HMR（热模块替换）和 Live Reload（自动刷新）的区别，理解 HMR 的优势。
tags:
  - Webpack
  - HMR
  - Live Reload
  - 开发体验
estimatedTime: 10 分钟
keywords:
  - HMR
  - Live Reload
  - 热更新
  - 自动刷新
highlight: Live Reload 刷新整个页面，HMR 只替换变化的模块，保留应用状态，开发体验更好。
order: 641
---

## 问题 1：Live Reload 是什么？

**Live Reload 是自动刷新整个页面**。当文件变化时，浏览器会完全重新加载页面。

```
文件修改 → 触发构建 → 通知浏览器 → 刷新整个页面
```

特点：

- 简单粗暴，整页刷新
- 所有状态丢失
- 需要重新加载所有资源

---

## 问题 2：HMR 是什么？

**HMR（Hot Module Replacement）是热模块替换**。只替换变化的模块，不刷新整个页面。

```
文件修改 → 触发构建 → 通知浏览器 → 只替换变化的模块
```

特点：

- 精确替换变化的模块
- 保留应用状态
- 更新速度快

---

## 问题 3：核心区别对比

| 特性       | Live Reload  | HMR            |
| ---------- | ------------ | -------------- |
| 更新方式   | 刷新整个页面 | 只替换变化模块 |
| 应用状态   | 丢失         | 保留           |
| 更新速度   | 较慢         | 快             |
| 实现复杂度 | 简单         | 复杂           |
| 适用场景   | 简单项目     | 复杂应用       |

---

## 问题 4：实际体验差异

### 场景：修改一个表单组件的样式

**Live Reload**：

1. 页面刷新
2. 表单数据清空
3. 需要重新填写表单才能看到效果

**HMR**：

1. 样式即时更新
2. 表单数据保留
3. 立即看到效果

### 场景：调试一个深层嵌套的弹窗

**Live Reload**：

1. 页面刷新，弹窗关闭
2. 需要重新点击打开弹窗
3. 重复操作很繁琐

**HMR**：

1. 弹窗保持打开状态
2. 代码更新即时生效
3. 调试效率大幅提升

---

## 问题 5：如何启用 HMR？

```javascript
// webpack.config.js
const webpack = require("webpack");

module.exports = {
  devServer: {
    hot: true, // 启用 HMR
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};
```

对于 React 项目，配合 react-refresh：

```javascript
// babel.config.js
plugins: [
  process.env.NODE_ENV === "development" && "react-refresh/babel",
].filter(Boolean);
```

## 延伸阅读

- [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)
- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
