---
title: 什么是 Concurrent Rendering（并发渲染）？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 并发渲染的概念、原理和价值，掌握它如何提升用户体验。
tags:
  - React
  - 并发渲染
  - Concurrent
  - React18
estimatedTime: 15 分钟
keywords:
  - concurrent rendering
  - interruptible rendering
  - time slicing
  - priority
highlight: 并发渲染让 React 可以中断长时间渲染，优先响应用户交互，保持界面流畅。
order: 224
---

## 问题 1：什么是并发渲染？

### 同步渲染的问题

React 17 及之前，渲染是**同步且不可中断**的。

```jsx
// 渲染 10000 个列表项
function BigList({ items }) {
  return items.map((item) => <Item key={item.id} data={item} />);
}

// 问题：渲染期间，用户输入会被阻塞
// 用户感觉：界面卡顿
```

### 并发渲染的解决方案

React 18 的渲染是**可中断**的。

```
同步渲染：[========渲染 100ms========] → 用户输入被阻塞

并发渲染：[==渲染==][响应输入][==渲染==][响应输入]...
          ↑ 可以中断
```

---

## 问题 2：并发渲染如何工作？

### 时间切片

将长任务拆分成小块，每块执行后检查是否有更高优先级任务。

```jsx
// 简化的调度逻辑
function workLoop(deadline) {
  while (workInProgress && deadline.timeRemaining() > 0) {
    // 执行一小块工作
    workInProgress = performUnitOfWork(workInProgress);
  }

  if (workInProgress) {
    // 还有工作，让出控制权，稍后继续
    requestIdleCallback(workLoop);
  }
}
```

### 优先级调度

```jsx
// 不同更新有不同优先级
// 高优先级：用户输入、点击
// 低优先级：数据获取、大列表渲染

function handleInput(e) {
  // 高优先级：立即响应
  setInputValue(e.target.value);

  // 低优先级：可以被中断
  startTransition(() => {
    setSearchResults(search(e.target.value));
  });
}
```

---

## 问题 3：并发渲染带来什么好处？

### 1. 保持响应性

```jsx
function SearchApp() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value); // 立即响应

    startTransition(() => {
      // 可以被中断，不阻塞输入
      setResults(heavySearch(e.target.value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results data={results} />
    </>
  );
}
```

### 2. 更好的加载体验

```jsx
// 切换 tab 时，保持显示旧内容
function Tabs() {
  const [tab, setTab] = useState("home");

  const switchTab = (newTab) => {
    startTransition(() => {
      setTab(newTab);
    });
  };

  // 在新 tab 加载期间，继续显示旧 tab
  // 而不是显示 loading
}
```

---

## 问题 4：并发渲染的注意事项？

### 渲染可能执行多次

```jsx
function Component() {
  console.log("render"); // 可能打印多次

  // ❌ 不要在渲染中产生副作用
  someGlobalVariable++;

  // ✅ 副作用放在 useEffect 中
  useEffect(() => {
    someGlobalVariable++;
  }, []);
}
```

### 需要使用 createRoot

```jsx
// ❌ 旧 API 不支持并发特性
import { render } from "react-dom";
render(<App />, container);

// ✅ 新 API 启用并发特性
import { createRoot } from "react-dom/client";
createRoot(container).render(<App />);
```

## 总结

**并发渲染核心**：

| 方面 | 说明                       |
| ---- | -------------------------- |
| 本质 | 可中断的渲染               |
| 机制 | 时间切片 + 优先级调度      |
| 好处 | 保持响应性、更好的加载体验 |
| 启用 | 使用 createRoot API        |

## 延伸阅读

- [React 18 并发特性](https://react.dev/blog/2022/03/29/react-v18)
- [Concurrent React 介绍](https://react.dev/learn/react-compiler)
