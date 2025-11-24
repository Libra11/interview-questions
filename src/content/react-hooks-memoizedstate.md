---
title: React Hooks 和 memoizedState 是什么关系
category: React
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  深入探讨 React Hooks 的底层实现机制，理解 memoizedState 如何存储和管理 Hooks 的状态，
  以及为什么 Hooks 必须按照固定顺序调用。掌握这些原理有助于更好地理解和使用 Hooks。
tags:
  - React
  - Hooks
  - memoizedState
  - 状态管理
estimatedTime: 25 分钟
keywords:
  - React Hooks
  - memoizedState
  - Fiber
  - 链表结构
highlight: memoizedState 是 Hooks 状态存储的核心，通过链表结构实现多个 Hooks 的状态管理
order: 101
---

## 问题 1：什么是 memoizedState？

**memoizedState 是 Fiber 节点上用于存储 Hooks 状态的属性**。

在 React 中，每个函数组件对应一个 Fiber 节点，这个 Fiber 节点有一个 `memoizedState` 属性，用来存储该组件中所有 Hooks 的状态信息。

### Fiber 节点的结构

```javascript
// Fiber 节点的简化结构
function FiberNode() {
  this.memoizedState = null; // 存储 Hooks 链表的头节点
  this.updateQueue = null;   // 存储更新队列
  // ... 其他属性
}
```

### memoizedState 的作用

- **状态持久化**：在组件重新渲染时，保持 Hooks 的状态不丢失
- **链表头节点**：指向第一个 Hook 对象，形成链表结构
- **区分不同组件**：每个组件实例都有自己的 memoizedState

---

## 问题 2：Hooks 是如何通过 memoizedState 存储的？

**Hooks 通过单向链表的形式存储在 memoizedState 中**。

每个 Hook 都是链表中的一个节点，包含自己的状态和指向下一个 Hook 的指针。

### Hook 对象的结构

```javascript
// 单个 Hook 对象的结构
const hook = {
  memoizedState: null,  // 当前 Hook 的状态值
  baseState: null,      // 基础状态
  baseQueue: null,      // 基础更新队列
  queue: null,          // 更新队列
  next: null            // 指向下一个 Hook
};
```

### 链表结构示例

```javascript
// 假设组件中使用了三个 Hooks
function Component() {
  const [count, setCount] = useState(0);      // Hook 1
  const [name, setName] = useState('React');  // Hook 2
  useEffect(() => {}, []);                    // Hook 3
}

// 对应的链表结构
// Fiber.memoizedState -> Hook1 -> Hook2 -> Hook3 -> null
```

### 链表的建立过程

```javascript
// 首次渲染时创建 Hook 链表
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // 第一个 Hook，设置为链表头
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 后续 Hook，追加到链表尾部
    workInProgressHook = workInProgressHook.next = hook;
  }
  
  return workInProgressHook;
}
```

---

## 问题 3：不同类型的 Hook 如何使用 memoizedState？

**不同类型的 Hook 在 memoizedState 中存储不同类型的数据**。

### useState 的 memoizedState

```javascript
// useState 的 memoizedState 直接存储状态值
const [count, setCount] = useState(0);

// 对应的 Hook 对象
{
  memoizedState: 0,  // 直接存储状态值
  queue: {           // 更新队列
    pending: null,
    dispatch: setCount,
  },
  next: null
}
```

### useEffect 的 memoizedState

```javascript
// useEffect 的 memoizedState 存储 effect 对象
useEffect(() => {
  console.log('effect');
  return () => console.log('cleanup');
}, [dep]);

// 对应的 Hook 对象
{
  memoizedState: {
    tag: HookHasEffect,     // effect 标记
    create: () => {},       // effect 函数
    destroy: () => {},      // 清理函数
    deps: [dep],            // 依赖数组
    next: null              // 指向下一个 effect
  },
  next: null
}
```

### useMemo 的 memoizedState

```javascript
// useMemo 的 memoizedState 存储 [计算值, 依赖数组]
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// 对应的 Hook 对象
{
  memoizedState: [
    computedValue,  // 缓存的计算结果
    [a, b]          // 依赖数组
  ],
  next: null
}
```

### useRef 的 memoizedState

```javascript
// useRef 的 memoizedState 存储 ref 对象
const ref = useRef(initialValue);

// 对应的 Hook 对象
{
  memoizedState: {
    current: initialValue  // ref 对象
  },
  next: null
}
```

---

## 问题 4：更新时如何通过 memoizedState 获取状态？

**更新时通过遍历链表，按顺序读取每个 Hook 的状态**。

### 更新阶段的 Hook 读取

```javascript
// 更新时获取 Hook
function updateWorkInProgressHook() {
  // currentHook 指向当前正在处理的旧 Hook
  // workInProgressHook 指向当前正在处理的新 Hook
  
  let nextCurrentHook;
  
  if (currentHook === null) {
    // 第一个 Hook，从 Fiber 的 memoizedState 开始
    const current = currentlyRenderingFiber.alternate;
    nextCurrentHook = current.memoizedState;
  } else {
    // 后续 Hook，从链表中获取下一个
    nextCurrentHook = currentHook.next;
  }
  
  // 复制旧 Hook 的状态到新 Hook
  const newHook = {
    memoizedState: nextCurrentHook.memoizedState,
    baseState: nextCurrentHook.baseState,
    baseQueue: nextCurrentHook.baseQueue,
    queue: nextCurrentHook.queue,
    next: null,
  };
  
  // 更新链表指针
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  
  currentHook = nextCurrentHook;
  return workInProgressHook;
}
```

### 为什么必须按顺序调用

```javascript
// ✅ 正确：Hooks 顺序固定
function Component({ condition }) {
  const [count, setCount] = useState(0);      // 总是 Hook 1
  const [name, setName] = useState('React');  // 总是 Hook 2
  useEffect(() => {}, []);                    // 总是 Hook 3
  
  // 链表顺序：Hook1 -> Hook2 -> Hook3
}

// ❌ 错误：条件调用导致顺序变化
function Component({ condition }) {
  const [count, setCount] = useState(0);      // 总是 Hook 1
  
  if (condition) {
    const [name, setName] = useState('React'); // 有时是 Hook 2，有时不存在
  }
  
  useEffect(() => {}, []);                    // 有时是 Hook 2，有时是 Hook 3
  
  // 链表顺序不一致，导致状态错乱
}
```

---

## 问题 5：为什么类组件的 state 不用 memoizedState 链表？

**类组件只有一个 state 对象，而函数组件可能有多个 Hooks**。

### 类组件的状态存储

```javascript
class Component extends React.Component {
  state = {
    count: 0,
    name: 'React',
    // 所有状态都在一个对象中
  };
}

// 类组件的 Fiber 节点
{
  memoizedState: {
    count: 0,
    name: 'React'
  }  // 直接存储 state 对象，不需要链表
}
```

### 函数组件的状态存储

```javascript
function Component() {
  const [count, setCount] = useState(0);      // 独立的 Hook
  const [name, setName] = useState('React');  // 独立的 Hook
  // 每个 Hook 都是独立的
}

// 函数组件的 Fiber 节点
{
  memoizedState: Hook1 -> Hook2 -> null  // 需要链表管理多个 Hook
}
```

### 设计差异的原因

1. **类组件**：
   - 状态集中在 `this.state` 对象中
   - 通过 `this.setState()` 统一更新
   - 只需要一个存储位置

2. **函数组件**：
   - 每个 Hook 调用都是独立的
   - 没有 `this` 来存储状态
   - 需要链表来管理多个独立的状态

---

## 总结

**核心概念总结**：

### 1. memoizedState 的本质

- Fiber 节点上的属性，用于存储 Hooks 状态
- 指向 Hooks 链表的头节点
- 在组件重新渲染时保持状态持久化

### 2. Hooks 链表结构

- 每个 Hook 是链表中的一个节点
- 通过 `next` 指针连接
- 按照调用顺序形成单向链表

### 3. 不同 Hook 的存储方式

- `useState`: 存储状态值
- `useEffect`: 存储 effect 对象
- `useMemo`: 存储 `[值, 依赖]` 数组
- `useRef`: 存储 ref 对象

### 4. 顺序调用的重要性

- 更新时按链表顺序读取状态
- 条件调用会导致链表顺序错乱
- 这是 Hooks 规则的底层原因

## 延伸阅读

- [React Hooks 官方文档](https://react.dev/reference/react)
- [React Fiber 架构详解](https://github.com/acdlite/react-fiber-architecture)
- [深入理解 React Hooks 实现原理](https://github.com/facebook/react/tree/main/packages/react-reconciler/src)
- [React 源码解析 - Hooks](https://react.iamkasong.com/hooks/prepare.html)
