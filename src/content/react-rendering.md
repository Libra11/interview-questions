---
title: React 是如何进行渲染的
category: React
difficulty: 高级
updatedAt: 2025-11-21
summary: >-
  深入理解 React 的渲染机制，包括初始渲染、更新渲染、批量更新、并发渲染等核心概念，掌握 React 18 的新特性和优化策略。
tags:
  - React
  - 渲染机制
  - 并发渲染
  - Fiber
estimatedTime: 28 分钟
keywords:
  - React 渲染
  - 并发模式
  - 批量更新
  - Fiber 架构
highlight: 深入理解 React 的完整渲染流程和 React 18 的并发特性
order: 90
---

## 问题 1：React 的初始渲染流程是什么？

### 初始渲染的完整流程

```javascript
// 1. 创建根节点
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));

// 2. 渲染应用
root.render(<App />);

// React 内部的简化流程
function render(element, container) {
  // 1. 创建 Fiber 根节点
  const fiberRoot = createFiberRoot(container);
  
  // 2. 创建更新
  const update = createUpdate();
  update.payload = { element };
  
  // 3. 调度更新
  scheduleUpdateOnFiber(fiberRoot);
  
  // 4. 开始工作循环
  performSyncWorkOnRoot(fiberRoot);
}

function performSyncWorkOnRoot(root) {
  // Render 阶段：构建 Fiber 树
  renderRootSync(root);
  
  // Commit 阶段：更新 DOM
  commitRoot(root);
}
```

### Render 阶段（可中断）

```javascript
function renderRootSync(root) {
  // 准备新的工作栈
  prepareFreshStack(root);
  
  // 工作循环
  workLoopSync();
}

function workLoopSync() {
  // 深度优先遍历 Fiber 树
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  
  // 1. beginWork：处理当前 Fiber 节点
  let next = beginWork(current, unitOfWork);
  
  if (next === null) {
    // 2. completeWork：没有子节点，完成当前节点
    completeUnitOfWork(unitOfWork);
  } else {
    // 3. 继续处理子节点
    workInProgress = next;
  }
}

function beginWork(current, workInProgress) {
  // 根据组件类型进行不同处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      // 调用函数组件
      return updateFunctionComponent(current, workInProgress);
    
    case ClassComponent:
      // 调用类组件的 render
      return updateClassComponent(current, workInProgress);
    
    case HostComponent:
      // 处理原生 DOM 元素
      return updateHostComponent(current, workInProgress);
  }
}
```

### Commit 阶段（不可中断）

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 1. Before Mutation 阶段
  // - 执行 getSnapshotBeforeUpdate
  // - 调度 useEffect
  commitBeforeMutationEffects(finishedWork);
  
  // 2. Mutation 阶段
  // - 执行 DOM 操作
  // - 执行 ref 卸载
  // - 执行 useLayoutEffect 的销毁函数
  commitMutationEffects(finishedWork);
  
  // 切换 current 指针
  root.current = finishedWork;
  
  // 3. Layout 阶段
  // - 执行 componentDidMount/Update
  // - 执行 useLayoutEffect 的回调
  // - 执行 ref 的赋值
  commitLayoutEffects(finishedWork);
  
  // 4. 异步执行 useEffect
  scheduleCallback(() => {
    flushPassiveEffects();
  });
}
```

---

## 问题 2：React 如何处理更新渲染？

### 触发更新的方式

```jsx
function Component() {
  const [count, setCount] = useState(0);
  
  // 1. setState 触发更新
  const handleClick = () => {
    setCount(count + 1);
  };
  
  // 2. forceUpdate 触发更新（类组件）
  // this.forceUpdate();
  
  // 3. props 变化触发更新
  // 父组件重新渲染，传递新的 props
  
  return <button onClick={handleClick}>{count}</button>;
}
```

### 更新的调度流程

```javascript
// setState 的简化实现
function setState(newState) {
  // 1. 创建更新对象
  const update = {
    payload: newState,
    next: null
  };
  
  // 2. 将更新加入队列
  enqueueUpdate(fiber, update);
  
  // 3. 调度更新
  scheduleUpdateOnFiber(fiber);
}

function scheduleUpdateOnFiber(fiber) {
  // 1. 标记 Fiber 及其父节点需要更新
  markUpdateLaneFromFiberToRoot(fiber);
  
  // 2. 确保根节点被调度
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // 根据优先级调度更新
  if (lane === SyncLane) {
    // 同步更新
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else {
    // 并发更新
    scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
}
```

---

## 问题 3：React 的批量更新是如何工作的？

### React 17 的批量更新

```jsx
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  // React 17：只在事件处理器中批量更新
  const handleClick = () => {
    setCount(c => c + 1); // 不会立即重新渲染
    setFlag(f => !f);     // 不会立即重新渲染
    // 批量更新，只重新渲染一次
  };
  
  // React 17：setTimeout 中不会批量更新
  const handleClickAsync = () => {
    setTimeout(() => {
      setCount(c => c + 1); // 立即重新渲染
      setFlag(f => !f);     // 立即重新渲染
      // 两次更新，重新渲染两次
    }, 0);
  };
  
  console.log('render');
  
  return (
    <div>
      <button onClick={handleClick}>Sync Update</button>
      <button onClick={handleClickAsync}>Async Update</button>
    </div>
  );
}
```

### React 18 的自动批量更新

```jsx
import { createRoot } from 'react-dom/client';

function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  // React 18：所有更新都会自动批量处理
  const handleClick = () => {
    setCount(c => c + 1);
    setFlag(f => !f);
    // 批量更新，只重新渲染一次
  };
  
  const handleClickAsync = () => {
    setTimeout(() => {
      setCount(c => c + 1);
      setFlag(f => !f);
      // ✅ React 18：也会批量更新
    }, 0);
  };
  
  const handleFetch = async () => {
    const data = await fetch('/api/data');
    setCount(c => c + 1);
    setFlag(f => !f);
    // ✅ React 18：Promise 中也会批量更新
  };
  
  console.log('render'); // 只打印一次
  
  return (
    <div>
      <button onClick={handleClick}>Sync</button>
      <button onClick={handleClickAsync}>Async</button>
      <button onClick={handleFetch}>Fetch</button>
    </div>
  );
}

// 使用 createRoot 启用 React 18 特性
const root = createRoot(document.getElementById('root'));
root.render(<Component />);
```

### 退出批量更新

```jsx
import { flushSync } from 'react-dom';

function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  const handleClick = () => {
    // ✅ 使用 flushSync 强制同步更新
    flushSync(() => {
      setCount(c => c + 1);
    });
    // 这里 DOM 已经更新
    
    setFlag(f => !f);
    // 这个更新会单独执行
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

---

## 问题 4：React 18 的并发渲染是什么？

### 并发特性概述

```jsx
import { useState, useTransition, useDeferredValue } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [list, setList] = useState([]);
  
  // 1. useTransition：标记低优先级更新
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    const value = e.target.value;
    
    // 高优先级：立即更新输入框
    setInput(value);
    
    // 低优先级：可以被中断的更新
    startTransition(() => {
      const newList = generateLargeList(value);
      setList(newList);
    });
  };
  
  return (
    <div>
      <input value={input} onChange={handleChange} />
      {isPending && <div>Loading...</div>}
      <List items={list} />
    </div>
  );
}

// 2. useDeferredValue：延迟更新值
function SearchResults({ query }) {
  // deferredQuery 会延迟更新
  const deferredQuery = useDeferredValue(query);
  
  // 使用延迟的值进行搜索
  const results = useMemo(
    () => searchData(deferredQuery),
    [deferredQuery]
  );
  
  return (
    <div>
      {results.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Suspense 和并发渲染

```jsx
import { Suspense, lazy } from 'react';

// 懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <h1>My App</h1>
      
      {/* ✅ Suspense 边界 */}
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
      
      {/* 嵌套 Suspense */}
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
        
        <Suspense fallback={<div>Loading comments...</div>}>
          <Comments />
        </Suspense>
      </Suspense>
    </div>
  );
}

// 数据获取与 Suspense
function Posts() {
  // 使用支持 Suspense 的数据获取库
  const posts = use(fetchPosts());
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

---

## 问题 5：React 的性能优化策略有哪些？

### 优化策略总结

```jsx
import { memo, useMemo, useCallback, useState } from 'react';

// 1. React.memo：避免不必要的重渲染
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  console.log('ExpensiveComponent render');
  return <div>{data}</div>;
});

// 2. useMemo：缓存计算结果
function Component({ items }) {
  const expensiveValue = useMemo(() => {
    console.log('Computing expensive value');
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  return <div>Total: {expensiveValue}</div>;
}

// 3. useCallback：缓存函数
function Parent() {
  const [count, setCount] = useState(0);
  
  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log('clicked');
  };
  
  // ✅ 缓存函数
  const handleClickMemo = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return (
    <div>
      <Child onClick={handleClickMemo} />
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

const Child = memo(({ onClick }) => {
  console.log('Child render');
  return <button onClick={onClick}>Click</button>;
});

// 4. 列表虚拟化
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 5. 代码分割
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

---

## 总结

**核心流程**：

### 1. 初始渲染

- 创建 Fiber 根节点
- Render 阶段：构建 Fiber 树
- Commit 阶段：更新 DOM
- 执行副作用

### 2. 更新渲染

- 触发更新（setState、props 变化）
- 调度更新
- Diff 算法比较
- 最小化 DOM 操作

### 3. 批量更新

- React 17：只在事件处理器中批量
- React 18：所有更新自动批量
- flushSync：强制同步更新

### 4. 并发渲染

- useTransition：标记低优先级更新
- useDeferredValue：延迟更新值
- Suspense：处理异步加载
- 可中断的渲染

### 5. 性能优化

- React.memo：避免重渲染
- useMemo/useCallback：缓存值和函数
- 列表虚拟化
- 代码分割
- 懒加载

## 延伸阅读

- [React 官方文档 - Render and Commit](https://react.dev/learn/render-and-commit)
- [React 18 新特性](https://react.dev/blog/2022/03/29/react-v18)
- [React 并发模式](https://react.dev/reference/react/useTransition)
- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
