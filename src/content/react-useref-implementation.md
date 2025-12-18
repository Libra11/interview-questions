---
title: React useRef 是如何实现的？
category: React
difficulty: 中级
updatedAt: 2025-11-20
summary: >-
  解析 React useRef Hook 的实现原理，包括可变对象的创建、与 useState 的区别以及常见应用场景。
tags:
  - React
  - Hooks
  - useRef
  - DOM Refs
estimatedTime: 15 分钟
keywords:
  - useRef implementation
  - react hooks
  - mutable object
  - dom ref
highlight: useRef 返回一个可变的 ref 对象，其 .current 属性在组件的整个生命周期内保持不变，修改它不会触发重新渲染。
order: 442
---

## 问题 1：useRef 的基本用法

```javascript
import { useRef } from 'react'

function Component() {
  // 创建 ref
  const inputRef = useRef(null)
  const countRef = useRef(0)
  
  const handleClick = () => {
    // 访问 DOM 元素
    inputRef.current.focus()
    
    // 存储可变值
    countRef.current += 1
    console.log(countRef.current)
  }
  
  return <input ref={inputRef} />
}
```

---

## 问题 2：useRef 的实现原理

### 简化实现

```javascript
function useRef(initialValue) {
  // 获取当前 Hook
  const hook = getCurrentHook()
  
  // 首次渲染：创建 ref 对象
  if (!hook.memoizedState) {
    hook.memoizedState = {
      current: initialValue
    }
  }
  
  // 返回同一个对象
  return hook.memoizedState
}
```

### 关键点

1. **只创建一次**：ref 对象在首次渲染时创建，后续渲染返回同一个对象。
2. **可变对象**：返回的对象是可变的，修改 `.current` 不会触发重新渲染。
3. **存储在 Fiber**：ref 对象存储在 Fiber 节点的 `memoizedState` 链表中。

---

## 问题 3：useRef vs useState

| 特性 | useRef | useState |
|------|--------|----------|
| **返回值** | `{ current: value }` | `[value, setValue]` |
| **修改方式** | 直接修改 `.current` | 调用 `setValue` |
| **触发渲染** | ❌ 不触发 | ✅ 触发 |
| **值的持久性** | ✅ 跨渲染保持 | ✅ 跨渲染保持 |
| **适用场景** | 存储不需要触发渲染的值 | 存储需要触发渲染的状态 |

### 示例对比

```javascript
function Component() {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  
  const handleClick = () => {
    // useState：触发重新渲染
    setCount(count + 1)
    console.log('Render!')
    
    // useRef：不触发渲染
    countRef.current += 1
    console.log(countRef.current) // 值会更新
    // 但组件不会重新渲染
  }
  
  return <button onClick={handleClick}>Click</button>
}
```

---

## 问题 4：useRef 的常见应用场景

### 1. 访问 DOM 元素

```javascript
function AutoFocusInput() {
  const inputRef = useRef(null)
  
  useEffect(() => {
    inputRef.current.focus()
  }, [])
  
  return <input ref={inputRef} />
}
```

### 2. 存储上一次的值

```javascript
function usePrevious(value) {
  const ref = useRef()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

function Counter() {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)
  
  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
    </div>
  )
}
```

### 3. 存储定时器 ID

```javascript
function Timer() {
  const [count, setCount] = useState(0)
  const timerRef = useRef(null)
  
  const start = () => {
    timerRef.current = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
  }
  
  const stop = () => {
    clearInterval(timerRef.current)
  }
  
  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  )
}
```

### 4. 避免闭包陷阱

```javascript
function Component() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)
  
  // 保持 ref 和 state 同步
  useEffect(() => {
    countRef.current = count
  }, [count])
  
  useEffect(() => {
    const timer = setInterval(() => {
      // 使用 ref 获取最新值
      console.log(countRef.current)
    }, 1000)
    
    return () => clearInterval(timer)
  }, []) // 空依赖数组
}
```

### 5. 存储不需要触发渲染的值

```javascript
function ClickCounter() {
  const clickCountRef = useRef(0)
  
  const handleClick = () => {
    clickCountRef.current += 1
    console.log('Total clicks:', clickCountRef.current)
    // 不会触发重新渲染
  }
  
  return <button onClick={handleClick}>Click me</button>
}
```

---

## 问题 5：useRef 和 createRef 的区别

### createRef（类组件）

```javascript
class Component extends React.Component {
  constructor(props) {
    super(props)
    this.inputRef = React.createRef()
  }
  
  componentDidMount() {
    this.inputRef.current.focus()
  }
  
  render() {
    return <input ref={this.inputRef} />
  }
}
```

### 区别

| 特性 | useRef | createRef |
|------|--------|-----------|
| **使用场景** | 函数组件 | 类组件 |
| **创建时机** | 首次渲染 | 每次渲染 |
| **对象复用** | ✅ 同一个对象 | ❌ 每次新对象 |

**重要**：在函数组件中不要使用 `createRef`，因为每次渲染都会创建新对象。

```javascript
// ❌ 错误用法
function Component() {
  const ref = React.createRef() // 每次渲染都创建新对象
  return <input ref={ref} />
}

// ✅ 正确用法
function Component() {
  const ref = useRef(null) // 只创建一次
  return <input ref={ref} />
}
```

---

## 问题 6：forwardRef 和 useImperativeHandle

### forwardRef

将 ref 传递给子组件。

```javascript
const FancyInput = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />
})

function Parent() {
  const inputRef = useRef(null)
  
  return <FancyInput ref={inputRef} />
}
```

### useImperativeHandle

自定义暴露给父组件的 ref 值。

```javascript
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef(null)
  
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus()
    },
    clear: () => {
      inputRef.current.value = ''
    }
  }))
  
  return <input ref={inputRef} />
})

function Parent() {
  const inputRef = useRef(null)
  
  const handleClick = () => {
    inputRef.current.focus()
    inputRef.current.clear()
  }
  
  return (
    <>
      <FancyInput ref={inputRef} />
      <button onClick={handleClick}>Focus and Clear</button>
    </>
  )
}
```

## 总结

**核心概念总结**：

### 1. 实现原理
返回一个可变对象 `{ current: value }`，存储在 Fiber 的 memoizedState 中。

### 2. 关键特性
- 不触发重新渲染
- 跨渲染保持引用
- 可以存储任意值

### 3. 常见用途
- 访问 DOM 元素
- 存储定时器 ID
- 保存上一次的值
- 避免闭包陷阱

## 延伸阅读

- [React 官方文档 - useRef](https://react.dev/reference/react/useRef)
- [React 官方文档 - forwardRef](https://react.dev/reference/react/forwardRef)
- [React 官方文档 - useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)
