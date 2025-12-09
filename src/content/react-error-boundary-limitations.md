---
title: 哪些错误无法被 ErrorBoundary 捕获？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  了解错误边界的局限性，掌握不同类型错误的处理方式。
tags:
  - React
  - 错误边界
  - 错误处理
  - 限制
estimatedTime: 10 分钟
keywords:
  - ErrorBoundary limitations
  - uncaught errors
  - event handlers
  - async errors
highlight: 错误边界无法捕获事件处理、异步代码、服务端渲染和自身的错误。
order: 273
---

## 问题 1：无法捕获的错误类型

### 四种情况

```jsx
// 1. 事件处理函数中的错误
// 2. 异步代码（setTimeout、Promise）
// 3. 服务端渲染
// 4. 错误边界自身的错误
```

---

## 问题 2：事件处理函数错误

### 问题

```jsx
function Button() {
  const handleClick = () => {
    throw new Error("Click error"); // 不会被 ErrorBoundary 捕获
  };

  return <button onClick={handleClick}>Click</button>;
}

<ErrorBoundary>
  <Button /> {/* 点击时错误不会被捕获 */}
</ErrorBoundary>;
```

### 原因

```jsx
// 事件处理函数在 React 渲染流程之外执行
// ErrorBoundary 只捕获渲染过程中的错误
```

### 解决方案

```jsx
function Button() {
  const [error, setError] = useState(null);

  const handleClick = () => {
    try {
      riskyOperation();
    } catch (e) {
      setError(e);
      // 或上报错误
      logError(e);
    }
  };

  if (error) {
    return <div>操作失败: {error.message}</div>;
  }

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 问题 3：异步代码错误

### 问题

```jsx
function AsyncComponent() {
  useEffect(() => {
    setTimeout(() => {
      throw new Error("Async error"); // 不会被捕获
    }, 1000);
  }, []);

  return <div>Async</div>;
}

// Promise 错误也不会被捕获
async function fetchData() {
  throw new Error("Fetch error");
}
```

### 解决方案

```jsx
function AsyncComponent() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getData();
        setData(data);
      } catch (e) {
        setError(e); // 手动处理错误
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>加载失败</div>;
  }

  return <div>...</div>;
}
```

### 使用 React Query 等库

```jsx
function DataComponent() {
  const { data, error, isLoading } = useQuery("data", fetchData);

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>{data}</div>;
}
```

---

## 问题 4：服务端渲染错误

### 问题

```jsx
// SSR 时的错误不会被客户端 ErrorBoundary 捕获
// 因为 ErrorBoundary 是客户端组件
```

### 解决方案

```jsx
// Next.js 中使用 error.js
// app/error.js
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

---

## 问题 5：错误边界自身错误

### 问题

```jsx
class ErrorBoundary extends React.Component {
  render() {
    if (this.state.hasError) {
      throw new Error("Fallback error"); // 无法捕获自身错误
    }
    return this.props.children;
  }
}
```

### 解决方案

```jsx
// 嵌套错误边界
<OuterErrorBoundary>
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
</OuterErrorBoundary>

// 或确保 fallback UI 不会出错
render() {
  if (this.state.hasError) {
    // 使用简单、可靠的 fallback
    return <div>出错了</div>;
  }
}
```

---

## 问题 6：全局错误处理

### window.onerror

```jsx
// 捕获未处理的错误
window.onerror = (message, source, lineno, colno, error) => {
  logError({ message, source, lineno, colno, error });
  return true; // 阻止默认处理
};
```

### unhandledrejection

```jsx
// 捕获未处理的 Promise 错误
window.addEventListener("unhandledrejection", (event) => {
  logError(event.reason);
  event.preventDefault();
});
```

## 总结

| 错误类型 | ErrorBoundary | 解决方案             |
| -------- | ------------- | -------------------- |
| 渲染错误 | ✅ 捕获       | ErrorBoundary        |
| 事件处理 | ❌ 不捕获     | try-catch            |
| 异步代码 | ❌ 不捕获     | try-catch / 状态管理 |
| SSR      | ❌ 不捕获     | 框架错误处理         |
| 自身错误 | ❌ 不捕获     | 嵌套边界             |

## 延伸阅读

- [错误边界文档](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
