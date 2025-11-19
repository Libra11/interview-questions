---
title: React setState 执行时发生了什么？
category: React
difficulty: 高级
updatedAt: 2025-11-19
summary: >-
  深入剖析 React setState 的执行流程，从触发更新到 Fiber 调度，再到 Diff 算法和最终的 Commit 阶段，以及 React 18 的自动批处理机制。
tags:
  - React
  - setState
  - Fiber
  - Reconciliation
  - Batching
estimatedTime: 20 分钟
keywords:
  - setState process
  - react fiber
  - reconciliation
  - automatic batching
  - render phase
highlight: setState 并不会立即修改 DOM，而是触发一次状态更新调度。React 会通过 Render 阶段计算差异，并在 Commit 阶段统一应用变更。
order: 127
---

## 问题 1：setState 的宏观流程是怎样的？

当你在组件中调用 `setState` (类组件) 或 `useState` 的 setter (函数组件) 时，React 会执行以下三个主要阶段：

### 1. 触发阶段 (Trigger)
React 不会立即改变 `this.state` 或重绘 DOM。它会创建一个**更新对象 (Update Object)**，将其放入该组件对应的 Fiber 节点的更新队列中，并通知调度器 (Scheduler) 需要安排一次更新。

### 2. 渲染阶段 (Render Phase)
这是一个**纯计算**阶段，可能会被 React 中断或重启（在 Concurrent Mode 下）。
- React 从根节点开始遍历 Fiber 树（或从更新的节点开始）。
- 调用组件的 `render` 方法（或执行函数组件），生成新的 Virtual DOM 树。
- **Reconciliation (协调/Diff)**：将新的 Virtual DOM 与旧的 Fiber 树进行对比，找出差异。
- 标记差异：将需要进行的 DOM 操作（增删改）记录在 Fiber 节点上（Effect Tag）。

### 3. 提交阶段 (Commit Phase)
这是一个**同步**阶段，不可中断。
- React 根据 Render 阶段计算出的差异，一次性将所有变更应用到真实的 DOM 上。
- 此时 DOM 发生改变。
- 执行生命周期方法 (`componentDidUpdate`) 或副作用 (`useEffect`, `useLayoutEffect`)。

---

## 问题 2：setState 是同步还是异步的？

这是一个经典的面试题。准确的说法是：**`setState` 是异步的（批处理的），但在某些特定条件下表现为同步。**

### 1. 表现为“异步” (Batching)
为了性能优化，React 会将多次 `setState` 调用合并为一次更新。

```javascript
handleClick = () => {
  this.setState({ count: this.state.count + 1 });
  this.setState({ count: this.state.count + 1 });
  this.setState({ count: this.state.count + 1 });
  // 最终 count 只加了 1，且 render 只触发一次
  console.log(this.state.count); // 打印旧值
}
```

### 2. React 18 的自动批处理 (Automatic Batching)
在 React 18 之前，只有在 React 事件处理函数中的更新会被批处理。在 `setTimeout`、Promise 或原生事件中，`setState` 是同步的（不批处理）。

**但在 React 18 中，所有更新默认都是自动批处理的**，无论它们在哪里触发。

```javascript
// React 18
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 只会触发一次重新渲染
}, 1000);
```

如果需要强制同步更新（极少见），可以使用 `flushSync`。

---

## 问题 3：类组件 setState 和 Hooks 更新有什么区别？

虽然流程大致相同，但在状态合并处理上有所不同。

### 1. 类组件 (Automatic Merging)
类组件的 `this.setState` 会自动将新状态**浅合并**到旧状态中。

```javascript
this.state = { name: 'A', age: 18 };
this.setState({ age: 19 }); 
// 结果: { name: 'A', age: 19 }，name 被保留
```

### 2. 函数组件 Hooks (Replacement)
`useState` 的 setter 函数是**替换**（Replace）而不是合并。如果状态是对象，你需要手动展开旧状态。

```javascript
const [state, setState] = useState({ name: 'A', age: 18 });
setState({ age: 19 }); 
// 结果: { age: 19 }，name 丢失了！

// ✅ 正确做法
setState(prev => ({ ...prev, age: 19 }));
```

## 总结

**核心概念总结**：

### 1. 执行流程
`setState` -> 创建 Update -> 调度更新 -> **Render 阶段** (Diff 计算) -> **Commit 阶段** (DOM 更新 & 副作用)。

### 2. 批处理 (Batching)
React 通过批处理机制将多次状态更新合并为一次渲染，以提升性能。React 18 实现了全场景的自动批处理。

### 3. 状态更新策略
类组件自动合并状态，Hooks 默认替换状态。

## 延伸阅读

- [React 官方文档 - State 如同一张快照](https://react.dev/learn/state-as-a-snapshot)
- [React 官方文档 - Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Dan Abramov - A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
