---
title: Fiber 为什么支持可中断渲染？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 Fiber 可中断渲染的实现原理，掌握从递归到循环的架构转变。
tags:
  - React
  - Fiber
  - 可中断
  - 时间切片
estimatedTime: 12 分钟
keywords:
  - interruptible rendering
  - time slicing
  - work loop
  - requestIdleCallback
highlight: Fiber 通过链表结构和循环遍历替代递归，配合时间切片实现可中断渲染。
order: 253
---

## 问题 1：为什么递归不能中断？

### 递归的问题

```jsx
// React 15 的递归协调
function reconcile(element) {
  // 处理当前节点
  processElement(element);

  // 递归处理子节点
  element.children.forEach((child) => {
    reconcile(child); // 递归调用
  });
}

// 调用栈：
// reconcile(App)
//   → reconcile(Header)
//   → reconcile(Main)
//       → reconcile(Article)
//       → reconcile(Sidebar)

// 问题：调用栈无法保存和恢复
// 一旦开始，必须执行完整个树
```

---

## 问题 2：Fiber 如何实现可中断？

### 链表 + 循环

```jsx
// Fiber 使用链表结构
fiber = {
  child: firstChild,
  sibling: nextSibling,
  return: parent,
};

// 循环遍历，而非递归
function workLoop() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 每次只处理一个节点
// 处理完后，workInProgress 指向下一个节点
// 可以随时停止循环
```

### 遍历顺序

```jsx
function performUnitOfWork(fiber) {
  // 1. 处理当前节点
  beginWork(fiber);

  // 2. 有子节点，返回子节点
  if (fiber.child) {
    return fiber.child;
  }

  // 3. 没有子节点，找兄弟或回溯
  let current = fiber;
  while (current) {
    completeWork(current);

    if (current.sibling) {
      return current.sibling;
    }
    current = current.return;
  }

  return null;
}
```

---

## 问题 3：时间切片如何工作？

### 检查是否需要让出

```jsx
function workLoop(deadline) {
  // shouldYield：检查是否需要让出控制权
  while (workInProgress && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  // 还有工作，安排下次执行
  if (workInProgress) {
    requestIdleCallback(workLoop);
  }
}

function shouldYield() {
  // 检查剩余时间
  return deadline.timeRemaining() < 1;
}
```

### 实际实现

```jsx
// React 使用自己的调度器，而非 requestIdleCallback
// 因为 requestIdleCallback 兼容性和精度问题

// Scheduler 包
import { scheduleCallback, shouldYield } from "scheduler";

function workLoop() {
  while (workInProgress && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 每个时间片约 5ms
```

---

## 问题 4：中断后如何恢复？

### 保存进度

```jsx
// workInProgress 指针保存当前进度
let workInProgress = null;

function startWork(fiber) {
  workInProgress = fiber;
  workLoop();
}

// 中断时：
// workInProgress 仍指向未完成的节点
// 下次继续从这个节点开始
```

### 恢复执行

```jsx
function workLoop() {
  while (workInProgress && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (workInProgress) {
    // 安排下次执行，从 workInProgress 继续
    scheduleCallback(workLoop);
  } else {
    // 全部完成，进入 commit 阶段
    commitRoot();
  }
}
```

---

## 问题 5：为什么 commit 阶段不能中断？

### render vs commit

```jsx
// render 阶段：可中断
// - 构建 Fiber 树
// - 计算变化
// - 不涉及 DOM

// commit 阶段：不可中断
// - 执行 DOM 操作
// - 必须一次性完成
// - 否则用户看到不一致的 UI
```

### 原因

```jsx
// 假设 commit 可中断：
// 1. 插入节点 A
// 2. 中断，让出控制权
// 3. 用户看到只有 A 的不完整 UI
// 4. 继续插入节点 B

// 这会导致：
// - UI 闪烁
// - 不一致状态
// - 用户体验差
```

## 总结

**Fiber 可中断的关键**：

| 技术           | 作用                 |
| -------------- | -------------------- |
| 链表结构       | 保存遍历进度         |
| 循环遍历       | 替代递归，可随时停止 |
| 时间切片       | 每 5ms 检查是否让出  |
| workInProgress | 记录当前进度         |

## 延伸阅读

- [React Scheduler](https://github.com/facebook/react/tree/main/packages/scheduler)
- [时间切片原理](https://github.com/acdlite/react-fiber-architecture)
