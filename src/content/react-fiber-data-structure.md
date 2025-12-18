---
title: Fiber 的数据结构是什么？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 Fiber 节点的数据结构，掌握各个属性的作用和含义。
tags:
  - React
  - Fiber
  - 数据结构
  - 源码
estimatedTime: 15 分钟
keywords:
  - Fiber node
  - Fiber structure
  - React internals
  - Fiber properties
highlight: Fiber 是一个 JavaScript 对象，包含组件类型、状态、副作用、链表指针等信息。
order: 582
---

## 问题 1：Fiber 节点的基本结构？

### 核心属性

```jsx
const fiber = {
  // === 静态结构 ===
  tag: 0, // 组件类型（函数组件、类组件、原生标签等）
  key: null, // key 属性
  type: "div", // 元素类型（标签名或组件函数/类）
  elementType: "div", // 大多数情况与 type 相同

  // === 节点关系（链表） ===
  return: parentFiber, // 父节点
  child: childFiber, // 第一个子节点
  sibling: siblingFiber, // 下一个兄弟节点
  index: 0, // 在兄弟中的索引

  // === 状态相关 ===
  pendingProps: {}, // 新的 props
  memoizedProps: {}, // 上次渲染的 props
  memoizedState: {}, // 上次渲染的 state

  // === 副作用 ===
  flags: 0, // 副作用标记（Placement、Update、Deletion）
  subtreeFlags: 0, // 子树的副作用

  // === 双缓冲 ===
  alternate: workInProgressFiber, // 指向另一棵树的对应节点

  // === DOM 相关 ===
  stateNode: domElement, // 对应的 DOM 节点或组件实例
};
```

---

## 问题 2：tag 有哪些类型？

### 常见 tag 值

```jsx
const FunctionComponent = 0; // 函数组件
const ClassComponent = 1; // 类组件
const IndeterminateComponent = 2; // 未确定类型
const HostRoot = 3; // 根节点
const HostPortal = 4; // Portal
const HostComponent = 5; // 原生 DOM 元素（div、span）
const HostText = 6; // 文本节点
const Fragment = 7; // Fragment
const Mode = 8; // StrictMode 等
const ContextConsumer = 9; // Context.Consumer
const ContextProvider = 10; // Context.Provider
const ForwardRef = 11; // forwardRef
const Profiler = 12; // Profiler
const SuspenseComponent = 13; // Suspense
const MemoComponent = 14; // memo
const LazyComponent = 16; // lazy
```

---

## 问题 3：链表结构如何工作？

### 树结构 vs 链表

```jsx
// 组件树
<App>
  <Header />
  <Main>
    <Article />
    <Sidebar />
  </Main>
</App>

// Fiber 链表结构
App
 ├── child → Header
 │            └── sibling → Main
 │                           ├── child → Article
 │                           │            └── sibling → Sidebar
 │                           └── return → App
 └── return → null
```

### 遍历方式

```jsx
// 深度优先遍历
function traverse(fiber) {
  // 1. 处理当前节点
  console.log(fiber.type);

  // 2. 有子节点，先处理子节点
  if (fiber.child) {
    traverse(fiber.child);
  }

  // 3. 有兄弟节点，处理兄弟
  if (fiber.sibling) {
    traverse(fiber.sibling);
  }
}

// 可以从任意节点恢复遍历
// 这是可中断的关键
```

---

## 问题 4：双缓冲机制？

### 两棵 Fiber 树

```jsx
// current：当前显示的树
// workInProgress：正在构建的树

// 它们通过 alternate 互相指向
currentFiber.alternate = workInProgressFiber;
workInProgressFiber.alternate = currentFiber;
```

### 工作流程

```jsx
// 1. 初始渲染
// 构建 workInProgress 树
// 完成后，workInProgress 变成 current

// 2. 更新
// 基于 current 构建新的 workInProgress
// 复用未变化的节点
// 完成后交换

// 好处：
// - 可以随时中断，不影响当前显示
// - 复用节点，减少内存分配
```

---

## 问题 5：副作用标记？

### flags 的含义

```jsx
const NoFlags = 0b0000000;
const Placement = 0b0000010; // 新增
const Update = 0b0000100; // 更新
const Deletion = 0b0001000; // 删除
const ChildDeletion = 0b0010000; // 子节点删除

// 使用位运算组合
fiber.flags = Placement | Update; // 既新增又更新

// 检查是否有某个标记
if (fiber.flags & Placement) {
  // 需要插入 DOM
}
```

### 副作用收集

```jsx
// render 阶段：标记副作用
fiber.flags |= Update;

// commit 阶段：执行副作用
function commitWork(fiber) {
  if (fiber.flags & Placement) {
    commitPlacement(fiber);
  }
  if (fiber.flags & Update) {
    commitUpdate(fiber);
  }
  if (fiber.flags & Deletion) {
    commitDeletion(fiber);
  }
}
```

## 总结

**Fiber 数据结构核心**：

| 类别   | 属性                         | 作用          |
| ------ | ---------------------------- | ------------- |
| 类型   | tag, type                    | 标识节点类型  |
| 链表   | child, sibling, return       | 连接节点      |
| 状态   | memoizedState, memoizedProps | 存储状态      |
| 副作用 | flags                        | 标记 DOM 操作 |
| 双缓冲 | alternate                    | 连接两棵树    |

## 延伸阅读

- [React Fiber 源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiber.js)
- [Fiber 架构详解](https://github.com/acdlite/react-fiber-architecture)
