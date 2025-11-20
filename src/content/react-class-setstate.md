---
title: React 类组件 setState 做了哪些事？
category: React
difficulty: 高级
updatedAt: 2025-11-20
summary: >-
  深入剖析 React 类组件 setState 的执行流程，包括状态合并、批量更新、异步调度和生命周期触发。
tags:
  - React
  - setState
  - Class Components
  - State Management
estimatedTime: 18 分钟
keywords:
  - setState process
  - react class component
  - state merging
  - batching
  - lifecycle
highlight: setState 不会立即修改 state，而是将更新加入队列，通过 React 的调度机制批量处理，最后触发重新渲染和生命周期方法。
order: 159
---

## 问题 1：setState 的基本用法

```javascript
class Counter extends React.Component {
  state = { count: 0 }
  
  handleClick = () => {
    this.setState({ count: this.state.count + 1 })
  }
  
  render() {
    return <button onClick={this.handleClick}>{this.state.count}</button>
  }
}
```

---

## 问题 2：setState 的执行流程

### 完整流程

1. **创建更新对象**
2. **加入更新队列**
3. **调度更新**（Scheduler）
4. **合并状态**
5. **触发重新渲染**
6. **执行生命周期方法**

### 流程图

```
setState()
  ↓
创建 Update 对象
  ↓
加入 updateQueue
  ↓
调度更新 (scheduleUpdate)
  ↓
批量处理更新 (Batching)
  ↓
合并状态 (Merge State)
  ↓
Render 阶段（计算新的 Virtual DOM）
  ↓
Commit 阶段（更新真实 DOM）
  ↓
触发生命周期
  - componentDidUpdate
  - setState 的回调函数
```

---

## 问题 3：状态合并（Shallow Merge）

### 浅合并

```javascript
class Component extends React.Component {
  state = {
    count: 0,
    name: 'React',
    user: { id: 1 }
  }
  
  handleClick = () => {
    // 只更新 count，其他属性保留
    this.setState({ count: 1 })
    // 结果: { count: 1, name: 'React', user: { id: 1 } }
  }
}
```

### 深层对象不会合并

```javascript
this.state = {
  user: { id: 1, name: 'Alice' }
}

this.setState({
  user: { id: 2 }
})

// 结果: { user: { id: 2 } }
// name 丢失了！应该手动展开
this.setState({
  user: { ...this.state.user, id: 2 }
})
```

---

## 问题 4：批量更新（Batching）

### 同步代码中的批量更新

```javascript
handleClick = () => {
  console.log(this.state.count) // 0
  
  this.setState({ count: this.state.count + 1 })
  console.log(this.state.count) // 0（还没更新）
  
  this.setState({ count: this.state.count + 1 })
  console.log(this.state.count) // 0
  
  this.setState({ count: this.state.count + 1 })
  console.log(this.state.count) // 0
  
  // 最终 count 只会变成 1，不是 3
  // 因为三次 setState 使用的都是同一个 count 值
}
```

### 为什么批量更新？

**性能优化**：避免多次重新渲染。

```javascript
// 如果不批量更新
this.setState({ count: 1 })  // 触发渲染
this.setState({ name: 'Vue' }) // 又触发渲染
this.setState({ flag: true })  // 再触发渲染

// 批量更新后
// 三次 setState 合并为一次渲染
```

---

## 问题 5：函数式更新

### 基于上一次状态更新

```javascript
handleClick = () => {
  this.setState((prevState) => ({
    count: prevState.count + 1
  }))
  
  this.setState((prevState) => ({
    count: prevState.count + 1
  }))
  
  this.setState((prevState) => ({
    count: prevState.count + 1
  }))
  
  // count 会增加 3
}
```

### 原理

```javascript
// 内部实现（简化）
let state = { count: 0 }
const updates = [
  (prev) => ({ count: prev.count + 1 }),
  (prev) => ({ count: prev.count + 1 }),
  (prev) => ({ count: prev.count + 1 })
]

updates.forEach(update => {
  state = { ...state, ...update(state) }
})
// state.count = 3
```

---

## 问题 6：setState 的回调函数

### 第二个参数

```javascript
this.setState(
  { count: 1 },
  () => {
    // 在状态更新和 DOM 更新完成后执行
    console.log('Updated:', this.state.count) // 1
    console.log('DOM:', this.divRef.textContent) // 最新的 DOM
  }
)
```

### 执行时机

回调函数在 `componentDidUpdate` **之后**执行。

```
setState()
  ↓
更新 state
  ↓
重新渲染
  ↓
componentDidUpdate()
  ↓
setState 的回调函数
```

---

## 问题 7：异步 vs 同步

### "异步"的 setState（批量更新）

```javascript
// React 事件处理函数中
handleClick = () => {
  this.setState({ count: 1 })
  console.log(this.state.count) // 0（旧值）
}
```

### "同步"的 setState（非批量更新）

在 React 18 之前，以下场景中 setState 是"同步"的（立即更新）：

```javascript
// setTimeout
setTimeout(() => {
  this.setState({ count: 1 })
  console.log(this.state.count) // 1（新值）
}, 0)

// 原生事件
componentDidMount() {
  document.addEventListener('click', () => {
    this.setState({ count: 1 })
    console.log(this.state.count) // 1
  })
}

// Promise
fetch('/api').then(() => {
  this.setState({ count: 1 })
  console.log(this.state.count) // 1
})
```

### React 18 的自动批量更新

React 18 引入了**自动批量更新**（Automatic Batching），所有场景下都会批量更新。

```javascript
// React 18
setTimeout(() => {
  this.setState({ count: 1 })
  console.log(this.state.count) // 0（批量更新）
}, 0)
```

如果需要强制同步更新，使用 `flushSync`：

```javascript
import { flushSync } from 'react-dom'

flushSync(() => {
  this.setState({ count: 1 })
})
console.log(this.state.count) // 1
```

---

## 问题 8：触发的生命周期方法

### 更新流程中的生命周期

```javascript
class Component extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 返回 false 可以阻止更新
    return true
  }
  
  componentDidUpdate(prevProps, prevState) {
    // 更新完成后调用
    console.log('Updated from', prevState, 'to', this.state)
  }
  
  handleClick = () => {
    this.setState({ count: 1 })
  }
}
```

### 执行顺序

```
setState()
  ↓
shouldComponentUpdate()
  ↓
render()
  ↓
更新 DOM
  ↓
componentDidUpdate()
  ↓
setState 的回调函数
```

---

## 问题 9：setState 的简化实现

```javascript
class Component {
  state = {}
  updateQueue = []
  
  setState(partialState, callback) {
    // 1. 将更新加入队列
    this.updateQueue.push({
      partialState,
      callback
    })
    
    // 2. 调度更新
    this.scheduleUpdate()
  }
  
  scheduleUpdate() {
    // 批量更新：在下一个事件循环中执行
    Promise.resolve().then(() => {
      this.flushUpdates()
    })
  }
  
  flushUpdates() {
    // 3. 合并所有更新
    let newState = { ...this.state }
    const callbacks = []
    
    this.updateQueue.forEach(update => {
      const { partialState, callback } = update
      
      // 支持函数式更新
      const stateChange = typeof partialState === 'function'
        ? partialState(newState)
        : partialState
      
      // 浅合并
      newState = { ...newState, ...stateChange }
      
      if (callback) callbacks.push(callback)
    })
    
    // 清空队列
    this.updateQueue = []
    
    // 4. 更新状态
    this.state = newState
    
    // 5. 触发重新渲染
    this.forceUpdate()
    
    // 6. 执行回调
    callbacks.forEach(cb => cb())
  }
}
```

## 总结

**核心概念总结**：

### 1. 执行流程
创建更新 → 加入队列 → 调度 → 合并 → 渲染 → 生命周期

### 2. 关键特性
- **浅合并**：只合并第一层属性
- **批量更新**：多次 setState 合并为一次渲染
- **函数式更新**：基于最新状态更新

### 3. React 18 变化
所有场景下都自动批量更新，使用 `flushSync` 强制同步。

## 延伸阅读

- [React 官方文档 - State 和生命周期](https://react.dev/learn/state-a-components-memory)
- [React 18 自动批量更新](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
