---
title: 如何调试 React 性能问题？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握调试 React 性能问题的工具和方法。
tags:
  - React
  - 性能调试
  - DevTools
  - Profiler
estimatedTime: 12 分钟
keywords:
  - React performance debugging
  - React DevTools
  - Profiler
  - performance optimization
highlight: 使用 React DevTools Profiler、Chrome DevTools、console.time 等工具定位性能瓶颈。
order: 647
---

## 问题 1：React DevTools Profiler

### 基本使用

```jsx
// 1. 安装 React DevTools 浏览器扩展
// 2. 打开 DevTools → Profiler 标签
// 3. 点击录制按钮
// 4. 执行操作
// 5. 停止录制，分析结果
```

### 分析结果

```jsx
// Profiler 显示：
// 1. 每个组件的渲染时间
// 2. 渲染原因（props 变化、state 变化、父组件渲染）
// 3. 渲染次数
// 4. 火焰图/排名图

// 关注：
// - 渲染时间长的组件
// - 不必要的重复渲染
```

### Profiler 组件

```jsx
import { Profiler } from "react";

function onRenderCallback(
  id, // 组件 id
  phase, // "mount" 或 "update"
  actualDuration, // 本次渲染耗时
  baseDuration, // 无优化时的预估耗时
  startTime, // 开始时间
  commitTime // 提交时间
) {
  console.log({ id, phase, actualDuration });
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>;
```

---

## 问题 2：Chrome DevTools

### Performance 面板

```jsx
// 1. 打开 DevTools → Performance
// 2. 点击录制
// 3. 执行操作
// 4. 停止录制

// 分析：
// - Main 线程活动
// - JavaScript 执行时间
// - 布局/绘制时间
// - 长任务（Long Tasks）
```

### Memory 面板

```jsx
// 检测内存泄漏
// 1. 打开 Memory 面板
// 2. 拍摄堆快照
// 3. 执行操作
// 4. 再次拍摄快照
// 5. 对比两次快照
```

---

## 问题 3：console 调试

### console.time

```jsx
function ExpensiveComponent({ data }) {
  console.time("ExpensiveComponent render");

  const result = expensiveCalculation(data);

  console.timeEnd("ExpensiveComponent render");
  // 输出：ExpensiveComponent render: 123.45ms

  return <div>{result}</div>;
}
```

### 渲染计数

```jsx
function Component() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`Component rendered ${renderCount.current} times`);

  return <div>...</div>;
}
```

---

## 问题 4：why-did-you-render

### 安装和配置

```jsx
// 安装
npm install @welldone-software/why-did-you-render

// wdyr.js
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true
  });
}

// index.js
import './wdyr';  // 必须在 React 之前导入
import React from 'react';
```

### 使用

```jsx
// 标记要追踪的组件
function MyComponent() {
  return <div>...</div>;
}

MyComponent.whyDidYouRender = true;

// 控制台会显示不必要渲染的原因
```

---

## 问题 5：常见性能问题定位

### 问题 1：不必要的重渲染

```jsx
// 症状：Profiler 显示组件频繁渲染
// 原因：父组件渲染、props 引用变化

// 解决：
// 1. 使用 React.memo
// 2. 使用 useMemo/useCallback
// 3. 检查 props 是否每次都是新对象
```

### 问题 2：大列表渲染慢

```jsx
// 症状：滚动卡顿，渲染时间长
// 原因：一次渲染太多 DOM 节点

// 解决：
// 使用虚拟列表
import { FixedSizeList } from "react-window";
```

### 问题 3：昂贵的计算

```jsx
// 症状：组件渲染时间长
// 原因：每次渲染都执行复杂计算

// 解决：
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

---

## 问题 6：性能检查清单

```jsx
// 1. 是否有不必要的重渲染？
//    → React DevTools Profiler

// 2. 是否有内存泄漏？
//    → Chrome Memory 面板

// 3. 是否有长任务阻塞主线程？
//    → Chrome Performance 面板

// 4. 是否有大量 DOM 操作？
//    → 虚拟列表

// 5. 是否有重复计算？
//    → useMemo
```

## 总结

| 工具                    | 用途           |
| ----------------------- | -------------- |
| React DevTools Profiler | 组件渲染分析   |
| Chrome Performance      | 整体性能分析   |
| Chrome Memory           | 内存泄漏检测   |
| why-did-you-render      | 追踪不必要渲染 |
| console.time            | 简单计时       |

## 延伸阅读

- [React Profiler](https://react.dev/reference/react/Profiler)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
