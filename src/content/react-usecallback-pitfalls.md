---
title: useCallback 在性能优化中的陷阱？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 useCallback 的常见误用，掌握正确使用 useCallback 进行性能优化的方法。
tags:
  - React
  - useCallback
  - 性能优化
  - Hooks
estimatedTime: 12 分钟
keywords:
  - useCallback
  - performance pitfalls
  - memoization
  - optimization
highlight: useCallback 本身有开销，只有配合 React.memo 或作为依赖时才有意义。
order: 570
---

## 问题 1：useCallback 的常见误用？

### 误区：到处使用 useCallback

```jsx
function Component() {
  // ❌ 无意义的 useCallback
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  // 这个 button 不是 memo 组件
  // useCallback 没有任何优化效果
  return <button onClick={handleClick}>Click</button>;
}
```

### 为什么没用？

```jsx
// useCallback 只是缓存函数引用
// 但如果没有人"关心"这个引用是否变化
// 缓存就没有意义

// button 是原生元素，不会因为 onClick 变化而跳过渲染
// 所以 useCallback 只增加了开销，没有收益
```

---

## 问题 2：useCallback 什么时候有用？

### 场景 1：配合 React.memo

```jsx
const Child = React.memo(({ onClick }) => {
  console.log("Child render");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 有意义：Child 是 memo 组件
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <Child onClick={handleClick} />
    </div>
  );
}
```

### 场景 2：作为 useEffect 依赖

```jsx
function Component({ userId }) {
  // ✅ 有意义：作为 useEffect 依赖
  const fetchUser = useCallback(() => {
    return api.getUser(userId);
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
}
```

### 场景 3：传递给自定义 Hook

```jsx
function useDebounce(callback, delay) {
  useEffect(() => {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
  }, [callback, delay]);
}

function Component() {
  // ✅ 有意义：传递给依赖它的 Hook
  const search = useCallback(() => {
    // ...
  }, [query]);

  useDebounce(search, 300);
}
```

---

## 问题 3：useCallback 的隐藏开销？

### 开销分析

```jsx
// 不使用 useCallback
const handleClick = () => console.log("click");
// 开销：创建函数

// 使用 useCallback
const handleClick = useCallback(() => console.log("click"), []);
// 开销：创建函数 + 调用 useCallback + 比较依赖 + 缓存管理

// 如果没有实际优化效果，useCallback 反而更慢
```

### 依赖数组的陷阱

```jsx
function Component({ data }) {
  // ❌ 依赖频繁变化，缓存失效
  const processData = useCallback(() => {
    return data.map((item) => item.value);
  }, [data]); // data 每次都是新数组

  // 每次 data 变化，useCallback 都返回新函数
  // 缓存毫无意义
}
```

---

## 问题 4：正确的优化思路？

### 先测量，后优化

```jsx
// 1. 先不用 useCallback
function Component() {
  const handleClick = () => {
    /* ... */
  };
  return <Child onClick={handleClick} />;
}

// 2. 发现性能问题（使用 React DevTools Profiler）

// 3. 确认问题原因是子组件重复渲染

// 4. 添加 React.memo + useCallback
const Child = React.memo(({ onClick }) => {
  /* ... */
});

function Component() {
  const handleClick = useCallback(() => {
    /* ... */
  }, []);
  return <Child onClick={handleClick} />;
}
```

### 替代方案

```jsx
// 方案 1：状态下移
function Parent() {
  return <ChildWithState />; // 状态在子组件内部
}

// 方案 2：children 模式
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return <div>{children}</div>; // children 不受影响
}

// 方案 3：组件拆分
function Parent() {
  return (
    <>
      <Counter /> {/* 有状态 */}
      <ExpensiveList /> {/* 无状态，不受影响 */}
    </>
  );
}
```

## 总结

**useCallback 使用原则**：

| 场景                | 是否使用    |
| ------------------- | ----------- |
| 传给原生元素        | ❌ 不需要   |
| 传给 memo 组件      | ✅ 需要     |
| 作为 useEffect 依赖 | ✅ 需要     |
| 传给自定义 Hook     | ✅ 可能需要 |

**记住**：useCallback 不是免费的，只在有实际收益时使用。

## 延伸阅读

- [useCallback 文档](https://react.dev/reference/react/useCallback)
- [何时使用 useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
