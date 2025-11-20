---
title: React useState 的原理是什么？
category: React
difficulty: 高级
updatedAt: 2025-11-20
summary: >-
  深入解析 React useState Hook 的底层实现原理，包括 Fiber 节点的状态存储、链表结构和闭包机制。
tags:
  - React
  - Hooks
  - useState
  - Fiber
estimatedTime: 20 分钟
keywords:
  - useState principle
  - react hooks
  - fiber memoizedState
  - hooks linked list
highlight: useState 通过在 Fiber 节点上维护一个链表来存储状态，利用闭包和调用顺序来关联状态和更新函数。
order: 158
---

## 问题 1：useState 的基本用法

```javascript
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

**问题**：
1. `count` 的值存储在哪里？
2. 为什么多次调用 `useState` 能正确对应？
3. `setCount` 如何触发重新渲染？

---

## 问题 2：核心原理 - Fiber 节点的状态存储

### 1. Fiber 节点结构

每个组件对应一个 Fiber 节点，节点上有一个 `memoizedState` 属性，用于存储 Hooks 的状态。

```javascript
// Fiber 节点（简化）
const fiber = {
  type: Counter,        // 组件类型
  memoizedState: null,  // Hooks 链表的头节点
  // ...其他属性
}
```

### 2. Hook 链表结构

多个 Hook 通过链表连接。

```javascript
// Hook 对象结构
const hook = {
  memoizedState: 0,     // 当前状态值
  queue: null,          // 更新队列
  next: null            // 指向下一个 Hook
}
```

### 3. 多个 useState 的存储

```javascript
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  const [flag, setFlag] = useState(true)
}
```

**Fiber 节点的 memoizedState**：
```
Hook1 (count: 0) -> Hook2 (name: 'React') -> Hook3 (flag: true) -> null
```

---

## 问题 3：useState 的简化实现

### 1. 全局变量

```javascript
let currentFiber = null  // 当前正在渲染的 Fiber
let hookIndex = 0        // 当前 Hook 的索引
```

### 2. useState 实现

```javascript
function useState(initialState) {
  // 获取当前 Fiber 节点
  const fiber = currentFiber
  
  // 获取当前 Hook（首次渲染时创建）
  const hook = fiber.memoizedState?.[hookIndex] || {
    memoizedState: initialState,
    queue: []
  }
  
  // 执行更新队列中的所有更新
  hook.queue.forEach(update => {
    hook.memoizedState = update(hook.memoizedState)
  })
  hook.queue = []
  
  // 创建 setState 函数
  const setState = (action) => {
    // 将更新加入队列
    hook.queue.push(
      typeof action === 'function' ? action : () => action
    )
    
    // 触发重新渲染
    scheduleUpdate(fiber)
  }
  
  // 保存 Hook 到 Fiber
  if (!fiber.memoizedState) {
    fiber.memoizedState = []
  }
  fiber.memoizedState[hookIndex] = hook
  
  hookIndex++
  
  return [hook.memoizedState, setState]
}
```

### 3. 渲染流程

```javascript
function renderComponent(fiber) {
  currentFiber = fiber
  hookIndex = 0
  
  // 执行组件函数
  const result = fiber.type()
  
  currentFiber = null
  return result
}
```

---

## 问题 4：为什么 Hooks 不能在条件语句中使用？

### 错误示例

```javascript
function Component() {
  if (condition) {
    const [count, setCount] = useState(0) // ❌ 错误！
  }
  const [name, setName] = useState('React')
}
```

### 原因

Hooks 依赖**调用顺序**来关联状态。

**首次渲染**：
```
Hook1 (count) -> Hook2 (name)
```

**第二次渲染（condition 为 false）**：
```
Hook1 (name) // 错位了！应该是 count
```

React 会报错：`Rendered more hooks than during the previous render`。

### 正确做法

```javascript
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  
  // ✅ 在 Hook 之后使用条件语句
  if (condition) {
    // 使用 count
  }
}
```

---

## 问题 5：setState 的更新机制

### 1. 批量更新（Batching）

```javascript
function handleClick() {
  setCount(count + 1)
  setCount(count + 1)
  setCount(count + 1)
  // count 只会增加 1，不是 3
}
```

**原因**：三次 `setCount` 使用的都是同一个 `count` 值（闭包）。

### 2. 函数式更新

```javascript
function handleClick() {
  setCount(c => c + 1)
  setCount(c => c + 1)
  setCount(c => c + 1)
  // count 会增加 3
}
```

**原因**：每次更新都基于最新的状态值。

### 3. 更新队列

```javascript
// 内部实现（简化）
const queue = [
  c => c + 1,
  c => c + 1,
  c => c + 1
]

let state = 0
queue.forEach(update => {
  state = update(state)
})
// state = 3
```

---

## 问题 6：useState 和类组件 setState 的区别

| 特性 | useState | setState (类组件) |
|------|----------|------------------|
| **状态合并** | 替换 | 浅合并 |
| **批量更新** | ✅ | ✅ |
| **函数式更新** | ✅ | ✅ |
| **存储位置** | Fiber.memoizedState（链表） | Fiber.memoizedState（对象） |

### 状态合并的区别

```javascript
// useState（替换）
const [state, setState] = useState({ count: 0, name: 'React' })
setState({ count: 1 })
// 结果: { count: 1 }，name 丢失了！

// 正确做法
setState(prev => ({ ...prev, count: 1 }))

// 类组件 setState（浅合并）
this.setState({ count: 1 })
// 结果: { count: 1, name: 'React' }，name 保留
```

---

## 问题 7：闭包陷阱

### 问题示例

```javascript
function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1) // ❌ count 永远是 0
    }, 1000)
    
    return () => clearInterval(timer)
  }, []) // 空依赖数组
}
```

### 原因

`setInterval` 的回调函数捕获了首次渲染时的 `count`（0），后续渲染不会更新这个闭包。

### 解决方案

```javascript
// 方案 1: 函数式更新
setCount(c => c + 1)

// 方案 2: 添加依赖
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1)
  }, 1000)
  
  return () => clearInterval(timer)
}, [count])

// 方案 3: useRef
const countRef = useRef(count)
countRef.current = count

useEffect(() => {
  const timer = setInterval(() => {
    setCount(countRef.current + 1)
  }, 1000)
  
  return () => clearInterval(timer)
}, [])
```

## 总结

**核心概念总结**：

### 1. 存储机制
- 状态存储在 Fiber 节点的 `memoizedState` 链表中
- 通过调用顺序关联状态

### 2. 更新机制
- setState 将更新加入队列
- 触发调度，重新渲染组件
- 批量处理多次更新

### 3. 注意事项
- 不能在条件语句中使用
- 状态是替换，不是合并
- 注意闭包陷阱

## 延伸阅读

- [React 官方文档 - Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
