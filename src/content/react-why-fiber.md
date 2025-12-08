---
title: React 为何使用 Fiber 架构？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 引入 Fiber 架构的原因，掌握它解决的核心问题。
tags:
  - React
  - Fiber
  - 架构
  - 性能
estimatedTime: 12 分钟
keywords:
  - React Fiber
  - reconciliation
  - interruptible rendering
  - scheduling
highlight: Fiber 架构让 React 渲染可中断，支持优先级调度，解决了同步渲染阻塞主线程的问题。
order: 250
---

## 问题 1：React 15 有什么问题？

### Stack Reconciler 的问题

React 15 使用递归方式处理组件树，称为 **Stack Reconciler**。

```jsx
// React 15 的渲染过程（简化）
function render(element, container) {
  // 递归处理整个组件树
  // 一旦开始，无法中断
  reconcileChildren(element);
  commitChanges();
}

// 问题：大型组件树渲染时
// 主线程被长时间占用
// 用户交互无响应
```

### 具体表现

```
渲染 10000 个节点：
[==========渲染 100ms==========]
        ↑
    主线程被阻塞
    用户点击无响应
    动画卡顿
```

---

## 问题 2：Fiber 如何解决？

### 可中断的渲染

```jsx
// Fiber 架构：渲染可以分片执行
[==渲染==][响应输入][==渲染==][动画][==渲染==]...
    ↑         ↑
  时间片    让出主线程
```

### 核心改变

```jsx
// React 15：递归（不可中断）
function reconcile(element) {
  processElement(element);
  element.children.forEach((child) => reconcile(child)); // 递归
}

// React 16+：循环（可中断）
function workLoop() {
  while (workInProgress && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
  // shouldYield() 检查是否需要让出控制权
}
```

---

## 问题 3：Fiber 带来了什么能力？

### 1. 可中断渲染

```jsx
// 渲染过程可以暂停
function workLoop(deadline) {
  while (workInProgress && deadline.timeRemaining() > 0) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (workInProgress) {
    // 还有工作，下次继续
    requestIdleCallback(workLoop);
  }
}
```

### 2. 优先级调度

```jsx
// 不同更新有不同优先级
const priorities = {
  Immediate: 1, // 同步，如 flushSync
  UserBlocking: 2, // 用户交互
  Normal: 3, // 普通更新
  Low: 4, // 低优先级
  Idle: 5, // 空闲时执行
};

// 高优先级可以打断低优先级
```

### 3. 并发特性

```jsx
// React 18 的并发特性基于 Fiber
useTransition(); // 标记低优先级更新
useDeferredValue(); // 延迟值更新
<Suspense />; // 异步边界
```

---

## 问题 4：Fiber 的设计思想？

### 增量渲染

```jsx
// 将大任务拆分成小任务
// 每个 Fiber 节点是一个工作单元

// 大任务：渲染整个应用
// 小任务：处理一个 Fiber 节点

// 每处理完一个节点，检查是否需要让出
```

### 双缓冲

```jsx
// 两棵 Fiber 树
current; // 当前显示的
workInProgress; // 正在构建的

// 构建完成后交换
// 类似游戏的双缓冲渲染
```

### 链表结构

```jsx
// Fiber 节点通过链表连接
fiber = {
  child,    // 第一个子节点
  sibling,  // 下一个兄弟节点
  return,   // 父节点
};

// 可以从任意节点恢复遍历
```

## 总结

| 方面     | Stack (React 15) | Fiber (React 16+) |
| -------- | ---------------- | ----------------- |
| 渲染方式 | 递归             | 循环              |
| 可中断   | ❌               | ✅                |
| 优先级   | ❌               | ✅                |
| 并发     | ❌               | ✅                |

**Fiber 的价值**：让 React 从同步渲染升级为可中断的异步渲染。

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [React 设计原理](https://react.dev/learn/preserving-and-resetting-state)
