---
title: 为什么修改 React 组件不刷新状态？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 React Fast Refresh 如何保留组件状态，以及哪些情况会导致状态丢失。
tags:
  - Webpack
  - React
  - HMR
  - Fast Refresh
estimatedTime: 12 分钟
keywords:
  - React HMR
  - Fast Refresh
  - 状态保留
  - 热更新
highlight: React Fast Refresh 通过保留组件实例和 Hooks 状态实现热更新时不丢失状态，但修改 Hooks 顺序等情况会触发重置。
order: 644
---

## 问题 1：React Fast Refresh 的工作原理

**React Fast Refresh 是 React 官方的热更新方案**，它能在代码更新时保留组件状态。

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

// 修改按钮文字后，count 的值会保留
```

原理：

1. 保留组件的 Fiber 节点
2. 保留 Hooks 的状态
3. 只替换组件的渲染函数
4. 重新执行 render

---

## 问题 2：哪些情况会保留状态？

### ✅ 状态会保留

```javascript
// 修改 JSX
return <button>{count}</button>;
// → return <button>Count: {count}</button>;

// 修改样式
<button style={{ color: 'red' }}>

// 修改事件处理逻辑
onClick={() => setCount(count + 1)}
// → onClick={() => setCount(count + 2)}
```

---

## 问题 3：哪些情况会丢失状态？

### ❌ 状态会重置

```javascript
// 1. 修改 Hooks 的顺序或数量
const [count, setCount] = useState(0);
// 添加新的 Hook
const [name, setName] = useState('');  // 状态重置！

// 2. 组件从函数组件变为类组件（或反过来）
function Counter() {}
// → class Counter extends React.Component {}

// 3. 导出的不是 React 组件
export default function notAComponent() {
  return 'string';  // 不是 JSX
}

// 4. 文件导出了非组件的内容
export const config = {};  // 混合导出可能导致问题
export default function App() {}
```

---

## 问题 4：如何配置 React Fast Refresh？

```javascript
// webpack.config.js
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  mode: "development",
  plugins: [new ReactRefreshWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: ["react-refresh/babel"],
          },
        },
      },
    ],
  },
};
```

---

## 问题 5：调试技巧

### 强制重置状态

如果需要测试初始状态，可以手动触发重置：

```javascript
// 方法1：修改组件的 key
<Counter key={Date.now()} />;

// 方法2：添加/删除一个 Hook（临时）
const [_, set_] = useState(0); // 添加后删除
```

### 查看 Fast Refresh 日志

```javascript
// 在控制台查看 Fast Refresh 的工作状态
// [Fast Refresh] Rebuilding...
// [Fast Refresh] Done in 50ms
```

如果看到 "Full reload" 说明状态被重置了。

## 延伸阅读

- [React Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin)
- [Fast Refresh 原理](https://github.com/facebook/react/issues/16604)
