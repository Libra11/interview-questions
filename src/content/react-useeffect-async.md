---
title: useEffect(async) 为什么不被允许？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 useEffect 不能直接使用 async 函数的原因和正确的异步处理方式。
tags:
  - React
  - useEffect
  - async
  - 异步
estimatedTime: 10 分钟
keywords:
  - useEffect async
  - async effect
  - cleanup function
  - Promise
highlight: useEffect 回调必须返回 cleanup 函数或 undefined，而 async 函数返回 Promise，会破坏清理机制。
order: 693
---

## 问题 1：问题现象

### 错误写法

```jsx
// ❌ 错误：直接使用 async
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);

// React 警告：
// Effect callbacks are synchronous to prevent race conditions.
```

### 为什么报错？

```jsx
// useEffect 期望回调返回：
// 1. undefined（无清理）
// 2. 函数（清理函数）

// async 函数返回 Promise
// Promise 不是有效的清理函数
```

---

## 问题 2：深入原因

### useEffect 的返回值

```jsx
useEffect(() => {
  // 设置副作用
  const subscription = api.subscribe();

  // 返回清理函数
  return () => {
    subscription.unsubscribe();
  };
}, []);

// React 在组件卸载或依赖变化时调用清理函数
```

### async 函数的返回值

```jsx
// async 函数总是返回 Promise
async function example() {
  return "hello";
}
example(); // Promise { 'hello' }

// 所以
useEffect(async () => {
  await something();
  return () => cleanup(); // 这个清理函数被包装在 Promise 里
}, []);

// React 收到的是 Promise，不是清理函数
// 无法正确执行清理
```

---

## 问题 3：正确的写法

### 方法 1：内部定义 async 函数

```jsx
useEffect(() => {
  async function fetchData() {
    const result = await api.getData();
    setData(result);
  }

  fetchData();
}, []);
```

### 方法 2：IIFE

```jsx
useEffect(() => {
  (async () => {
    const result = await api.getData();
    setData(result);
  })();
}, []);
```

### 方法 3：使用 .then()

```jsx
useEffect(() => {
  api.getData().then((result) => {
    setData(result);
  });
}, []);
```

---

## 问题 4：处理清理和竞态

### 防止设置已卸载组件的状态

```jsx
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    const result = await api.getData();

    if (!cancelled) {
      setData(result);
    }
  }

  fetchData();

  return () => {
    cancelled = true;
  };
}, []);
```

### 使用 AbortController

```jsx
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error);
      }
    }
  }

  fetchData();

  return () => {
    controller.abort();
  };
}, [url]);
```

---

## 问题 5：封装自定义 Hook

### useAsyncEffect

```jsx
function useAsyncEffect(effect, deps) {
  useEffect(() => {
    let cancelled = false;

    const promise = effect(() => cancelled);

    return () => {
      cancelled = true;
      // 如果 effect 返回清理函数，执行它
      if (promise && typeof promise.then === "function") {
        promise.then((cleanup) => {
          if (typeof cleanup === "function") {
            cleanup();
          }
        });
      }
    };
  }, deps);
}

// 使用
useAsyncEffect(async (isCancelled) => {
  const data = await fetchData();

  if (!isCancelled()) {
    setData(data);
  }
}, []);
```

### 使用 React Query

```jsx
// 更好的方案：使用专门的数据获取库
import { useQuery } from "@tanstack/react-query";

function Component() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
  });

  // 自动处理：
  // - 竞态条件
  // - 取消请求
  // - 缓存
  // - 重试
}
```

---

## 问题 6：为什么 React 不自动处理？

### 设计考量

```jsx
// 1. 清理时机不确定
// async 函数可能还在执行，清理函数何时返回？

// 2. 竞态条件复杂
// 多次调用 effect，哪个结果是最新的？

// 3. 保持简单
// useEffect 的心智模型应该简单
// 复杂的异步逻辑应该用专门的库

// React 的建议：
// 使用 React Query、SWR 等库处理数据获取
```

## 总结

| 写法                                                | 是否正确 |
| --------------------------------------------------- | -------- |
| `useEffect(async () => {})`                         | ❌       |
| `useEffect(() => { async function fn() {} fn(); })` | ✅       |
| `useEffect(() => { (async () => {})(); })`          | ✅       |
| 使用 React Query                                    | ✅ 推荐  |

## 延伸阅读

- [useEffect 文档](https://react.dev/reference/react/useEffect)
- [React Query](https://tanstack.com/query/latest)
