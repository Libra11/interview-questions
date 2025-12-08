---
title: useCallback 与 useMemo 的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 useCallback 和 useMemo 的用途差异，理解它们在性能优化中的作用和正确使用场景。
tags:
  - React
  - Hooks
  - useCallback
  - useMemo
estimatedTime: 15 分钟
keywords:
  - useCallback vs useMemo
  - memoization
  - performance optimization
  - React hooks
highlight: useCallback 缓存函数本身，useMemo 缓存函数的返回值，两者都用于避免不必要的重新计算。
order: 213
---

## 问题 1：两者的基本区别？

### useCallback

缓存**函数本身**，返回一个 memoized 函数。

```jsx
const memoizedFn = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### useMemo

缓存**函数的返回值**，返回一个 memoized 值。

```jsx
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### 等价关系

```jsx
// useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
useCallback(fn, [a, b]);
// 等同于
useMemo(() => fn, [a, b]);
```

---

## 问题 2：什么时候用 useCallback？

### 传递给子组件的回调

```jsx
const Parent = () => {
  const [count, setCount] = useState(0);

  // ✅ 缓存回调，避免子组件不必要的重新渲染
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <MemoizedChild onClick={handleClick} />
    </>
  );
};

const MemoizedChild = React.memo(({ onClick }) => {
  console.log("Child rendered");
  return <button onClick={onClick}>Click me</button>;
});
```

### 作为 useEffect 的依赖

```jsx
function SearchResults({ query }) {
  const fetchResults = useCallback(() => {
    return fetch(`/api/search?q=${query}`);
  }, [query]);

  useEffect(() => {
    fetchResults().then(setResults);
  }, [fetchResults]); // fetchResults 只在 query 变化时改变
}
```

---

## 问题 3：什么时候用 useMemo？

### 计算开销大的值

```jsx
function ProductList({ products, filter }) {
  // ✅ 避免每次渲染都重新过滤
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  return (
    <ul>
      {filteredProducts.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### 避免引用变化

```jsx
function Chart({ data }) {
  // ✅ 保持对象引用稳定
  const options = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { position: "top" } },
    }),
    []
  );

  return <ChartComponent data={data} options={options} />;
}
```

---

## 问题 4：什么时候不需要使用？

### 不需要 useCallback

```jsx
// ❌ 没有传递给子组件，不需要缓存
function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []); // 没必要

  return <button onClick={increment}>{count}</button>;
}

// ✅ 简单写法
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### 不需要 useMemo

```jsx
// ❌ 计算很简单，不需要缓存
const doubled = useMemo(() => count * 2, [count]);

// ✅ 直接计算
const doubled = count * 2;
```

---

## 问题 5：常见误区？

### 过度优化

```jsx
// ❌ 过度使用
function Example({ items }) {
  const length = useMemo(() => items.length, [items]);
  const handleClick = useCallback(() => {}, []);
  // ...
}

// ✅ 只在需要时使用
function Example({ items }) {
  const length = items.length; // 简单计算，不需要缓存
  // ...
}
```

### 依赖数组不完整

```jsx
// ❌ 缺少依赖
const handleSubmit = useCallback(() => {
  submitForm(formData); // formData 应该在依赖数组中
}, []);

// ✅ 完整依赖
const handleSubmit = useCallback(() => {
  submitForm(formData);
}, [formData]);
```

## 总结

| 特性     | useCallback   | useMemo           |
| -------- | ------------- | ----------------- |
| 缓存内容 | 函数          | 值                |
| 返回值   | memoized 函数 | memoized 值       |
| 主要用途 | 稳定回调引用  | 避免重复计算      |
| 配合使用 | React.memo    | 复杂计算/引用稳定 |

**使用原则**：先写简单代码，遇到性能问题再优化。

## 延伸阅读

- [useCallback 文档](https://react.dev/reference/react/useCallback)
- [useMemo 文档](https://react.dev/reference/react/useMemo)
- [何时使用 useMemo 和 useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
