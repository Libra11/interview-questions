---
title: React Scheduler 调度机制原理
category: React
difficulty: 高级
updatedAt: 2025-11-20
summary: >-
  深入解析 React Scheduler 的工作原理，包括任务优先级、时间切片、可中断渲染和 MessageChannel 的使用。
tags:
  - React
  - Scheduler
  - Fiber
  - Concurrent Mode
  - Performance
estimatedTime: 25 分钟
keywords:
  - react scheduler
  - time slicing
  - task priority
  - concurrent rendering
  - fiber architecture
highlight: Scheduler 通过任务优先级和时间切片机制，实现了可中断的渲染，让高优先级任务能够快速响应，提升用户体验。
order: 443
---

## 问题 1：为什么需要 Scheduler？

### React 15 的问题

React 15 使用**递归**的方式进行组件树的遍历和更新，一旦开始就无法中断。

```javascript
// React 15 的递归渲染（简化）
function renderComponent(component) {
  const children = component.render()
  children.forEach(child => {
    renderComponent(child) // 递归，无法中断
  })
}
```

**问题**：
- 如果组件树很大，渲染时间过长（超过 16ms），会导致**掉帧**。
- 用户输入、动画等高优先级任务无法及时响应。

### React 16+ 的解决方案

引入 **Fiber 架构** 和 **Scheduler 调度器**，实现：
1. **可中断渲染**：将渲染工作拆分成小任务。
2. **任务优先级**：高优先级任务优先执行。
3. **时间切片**：每个任务执行一小段时间后让出主线程。

---

## 问题 2：Scheduler 的核心概念

### 1. 任务优先级

Scheduler 定义了 5 个优先级：

```javascript
// 优先级常量
const ImmediatePriority = 1      // 立即执行（同步）
const UserBlockingPriority = 2   // 用户交互（250ms 超时）
const NormalPriority = 3         // 正常优先级（5s 超时）
const LowPriority = 4            // 低优先级（10s 超时）
const IdlePriority = 5           // 空闲时执行（永不超时）
```

**示例**：
- 用户点击按钮 → `UserBlockingPriority`
- 数据获取后更新 → `NormalPriority`
- 分析统计 → `LowPriority`

### 2. 时间切片（Time Slicing）

每个任务执行 **5ms** 后，检查是否需要让出主线程。

```javascript
const frameYieldMs = 5 // 每 5ms 检查一次

function workLoop() {
  while (workInProgress && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

function shouldYield() {
  return getCurrentTime() - startTime >= frameYieldMs
}
```

### 3. 任务队列

Scheduler 维护两个队列：
- **taskQueue**：未过期的任务（按优先级排序）
- **timerQueue**：延迟任务（按开始时间排序）

---

## 问题 3：Scheduler 的工作流程

### 1. 调度任务

```javascript
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime()
  
  // 计算任务的过期时间
  const timeout = timeoutForPriority(priorityLevel)
  const expirationTime = currentTime + timeout
  
  // 创建任务对象
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    expirationTime,
    sortIndex: expirationTime
  }
  
  // 加入任务队列（最小堆）
  push(taskQueue, newTask)
  
  // 请求调度
  requestHostCallback(flushWork)
  
  return newTask
}
```

### 2. 执行任务

```javascript
function flushWork(hasTimeRemaining, initialTime) {
  // 执行任务队列中的任务
  return workLoop(hasTimeRemaining, initialTime)
}

function workLoop(hasTimeRemaining, initialTime) {
  let currentTask = peek(taskQueue)
  
  while (currentTask !== null) {
    // 检查是否需要让出主线程
    if (
      currentTask.expirationTime > currentTime &&
      (!hasTimeRemaining || shouldYieldToHost())
    ) {
      break // 让出主线程
    }
    
    // 执行任务
    const callback = currentTask.callback
    const continuationCallback = callback()
    
    // 如果任务返回函数，说明还没完成
    if (typeof continuationCallback === 'function') {
      currentTask.callback = continuationCallback
    } else {
      // 任务完成，移除
      pop(taskQueue)
    }
    
    currentTask = peek(taskQueue)
  }
  
  // 返回是否还有任务
  return currentTask !== null
}
```

---

## 问题 4：MessageChannel 的使用

### 为什么不用 setTimeout？

`setTimeout` 有最小延迟（4ms），且优先级低。

### 为什么不用 requestAnimationFrame？

`rAF` 在后台标签页中不执行。

### 使用 MessageChannel

```javascript
const channel = new MessageChannel()
const port = channel.port2

channel.port1.onmessage = () => {
  // 执行调度的任务
  performWorkUntilDeadline()
}

function requestHostCallback(callback) {
  scheduledHostCallback = callback
  // 发送消息，触发宏任务
  port.postMessage(null)
}
```

**优势**：
- 宏任务，优先级高于 `setTimeout`
- 在后台标签页也能执行
- 没有最小延迟

---

## 问题 5：可中断渲染的实现

### Fiber 架构

Fiber 将渲染工作拆分成多个小单元（Fiber 节点）。

```javascript
function performUnitOfWork(fiber) {
  // 1. 处理当前 Fiber
  beginWork(fiber)
  
  // 2. 返回下一个要处理的 Fiber
  if (fiber.child) {
    return fiber.child
  }
  
  while (fiber) {
    completeWork(fiber)
    
    if (fiber.sibling) {
      return fiber.sibling
    }
    
    fiber = fiber.return
  }
}
```

### 工作循环

```javascript
function workLoop() {
  while (workInProgress && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress)
  }
  
  // 如果还有工作，继续调度
  if (workInProgress) {
    return true // 继续
  }
  
  return false // 完成
}
```

---

## 问题 6：优先级调度示例

### 场景：用户输入时更新列表

```javascript
function SearchList() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  
  const handleChange = (e) => {
    const value = e.target.value
    
    // 高优先级：立即更新输入框
    setQuery(value)
    
    // 低优先级：延迟更新列表
    startTransition(() => {
      setList(filterList(value))
    })
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      <List items={list} />
    </>
  )
}
```

**执行流程**：
1. 用户输入 → `setQuery` → 高优先级任务
2. `startTransition` → `setList` → 低优先级任务
3. 高优先级任务先执行，输入框立即响应
4. 低优先级任务可被中断，列表延迟更新

---

## 问题 7：饥饿问题的解决

### 问题

如果高优先级任务不断产生，低优先级任务可能永远得不到执行。

### 解决方案：过期时间

每个任务都有过期时间（expirationTime）。

```javascript
function workLoop() {
  let currentTask = peek(taskQueue)
  
  while (currentTask) {
    const currentTime = getCurrentTime()
    
    // 如果任务过期，必须执行（即使有更高优先级任务）
    if (currentTask.expirationTime <= currentTime) {
      // 强制执行
      callback()
    }
    
    currentTask = peek(taskQueue)
  }
}
```

---

## 问题 8：Concurrent Mode 的应用

### 启用 Concurrent Mode

```javascript
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)
```

### 并发特性

1. **useTransition**：标记低优先级更新
2. **useDeferredValue**：延迟更新值
3. **Suspense**：异步加载

```javascript
function App() {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  
  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          startTransition(() => {
            setQuery(e.target.value)
          })
        }}
      />
      {isPending && <Spinner />}
      <SearchResults query={deferredQuery} />
    </>
  )
}
```

## 总结

**核心概念总结**：

### 1. 核心机制
- **任务优先级**：5 个优先级级别
- **时间切片**：每 5ms 检查是否让出主线程
- **可中断渲染**：通过 Fiber 架构实现

### 2. 实现细节
- 使用 MessageChannel 调度宏任务
- 最小堆维护任务队列
- 过期时间防止饥饿

### 3. 应用场景
- 用户交互优先响应
- 大列表渲染优化
- 并发模式（Concurrent Mode）

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [React 官方文档 - Concurrent Features](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)
- [Scheduler 源码](https://github.com/facebook/react/tree/main/packages/scheduler)
