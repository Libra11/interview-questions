---
title: HMR 更新 CSS 与 JS 的差异？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 HMR 处理 CSS 和 JavaScript 更新的不同方式，以及为什么 CSS 热更新更简单。
tags:
  - Webpack
  - HMR
  - CSS
  - JavaScript
estimatedTime: 10 分钟
keywords:
  - CSS HMR
  - JS HMR
  - 热更新差异
  - style-loader
highlight: CSS 热更新只需替换样式表，无副作用；JS 热更新需要处理模块状态和依赖关系，更复杂。
order: 773
---

## 问题 1：CSS 热更新的简单性

**CSS 热更新非常简单**，因为 CSS 是声明式的，没有状态：

```javascript
// style-loader 的 HMR 实现（简化）
if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // 移除旧的 style 标签
    oldStyle.remove();
  });
  // 插入新的 style 标签
  insertStyle(newCSS);
}
```

CSS 更新流程：

1. 移除旧的 `<style>` 标签
2. 插入新的 `<style>` 标签
3. 完成，无需其他处理

---

## 问题 2：JavaScript 热更新的复杂性

**JS 热更新很复杂**，因为 JS 是命令式的，有状态和副作用：

```javascript
// 一个有状态的模块
let count = 0;

export function increment() {
  count++;
}

export function getCount() {
  return count;
}

// 热更新时，count 的值怎么办？
```

JS 更新需要考虑：

- **状态保留**：变量值是否需要保留？
- **副作用清理**：定时器、事件监听需要清理
- **依赖更新**：依赖此模块的其他模块如何处理？

---

## 问题 3：对比总结

| 特性     | CSS 热更新           | JS 热更新        |
| -------- | -------------------- | ---------------- |
| 复杂度   | 简单                 | 复杂             |
| 状态处理 | 无状态               | 需要处理状态     |
| 副作用   | 无                   | 需要清理         |
| 实现方式 | 替换 style 标签      | 执行模块替换逻辑 |
| 开箱即用 | ✅ style-loader 支持 | ❌ 需要框架支持  |

---

## 问题 4：为什么 React 组件需要特殊处理？

```javascript
// React 组件有状态
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 普通 HMR 会丢失 count 状态
// React Fast Refresh 能保留状态
```

React Fast Refresh 的工作原理：

1. 保留组件的 state
2. 只替换组件的渲染逻辑
3. 重新执行 render，使用保留的 state

---

## 问题 5：CSS 热更新的配置

使用 style-loader 自动支持 HMR：

```javascript
// 开发环境
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],  // style-loader 支持 HMR
}

// 生产环境
{
  test: /\.css$/,
  use: [MiniCssExtractPlugin.loader, 'css-loader'],  // 提取到文件
}
```

style-loader 内置了 HMR 支持，无需额外配置。

## 延伸阅读

- [style-loader HMR](https://github.com/webpack-contrib/style-loader#hot-module-replacement)
- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
