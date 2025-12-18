---
title: 什么是错误边界？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 React 错误边界的概念和用法，掌握组件错误处理机制。
tags:
  - React
  - 错误边界
  - 错误处理
  - ErrorBoundary
estimatedTime: 10 分钟
keywords:
  - Error Boundary
  - getDerivedStateFromError
  - componentDidCatch
  - error handling
highlight: 错误边界是捕获子组件渲染错误的 React 组件，防止整个应用崩溃。
order: 622
---

## 问题 1：错误边界是什么？

### 定义

错误边界是一种 React 组件，可以**捕获子组件树中的 JavaScript 错误**，记录错误，并显示备用 UI。

### 作用

```jsx
// 没有错误边界：一个组件错误导致整个应用白屏
// 有错误边界：只有出错的部分显示错误 UI，其他部分正常

<ErrorBoundary>
  <BuggyComponent />  {/* 出错 */}
</ErrorBoundary>
<NormalComponent />   {/* 正常显示 */}
```

---

## 问题 2：如何实现错误边界？

### 类组件实现

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  // 捕获错误，更新 state
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 记录错误信息
  componentDidCatch(error, errorInfo) {
    console.error("Error:", error);
    console.error("Error Info:", errorInfo.componentStack);
    // 上报错误到监控服务
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>出错了</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 使用

```jsx
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <Main />
      <Footer />
    </ErrorBoundary>
  );
}
```

---

## 问题 3：多个错误边界？

### 细粒度错误处理

```jsx
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<HeaderError />}>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary fallback={<MainError />}>
        <Main />
      </ErrorBoundary>

      <ErrorBoundary fallback={<FooterError />}>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}

// Header 出错不影响 Main 和 Footer
```

### 带 fallback 的错误边界

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // 使用传入的 fallback
      return this.props.fallback || <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}

// 使用
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>;
```

---

## 问题 4：函数组件能实现吗？

### 目前不能

```jsx
// ❌ 函数组件没有 getDerivedStateFromError 和 componentDidCatch
function ErrorBoundary({ children }) {
  // 无法捕获子组件的渲染错误
}
```

### 使用第三方库

```jsx
// react-error-boundary
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>出错了: {error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => logError(error, info)}
      onReset={() => {
        // 重置应用状态
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## 问题 5：两个生命周期的区别？

| 方法                     | 用途                     | 调用时机 |
| ------------------------ | ------------------------ | -------- |
| getDerivedStateFromError | 更新 state 显示 fallback | 渲染阶段 |
| componentDidCatch        | 记录错误信息             | 提交阶段 |

```jsx
class ErrorBoundary extends React.Component {
  // 静态方法，用于更新 state
  static getDerivedStateFromError(error) {
    // 不能有副作用
    return { hasError: true };
  }

  // 实例方法，用于副作用
  componentDidCatch(error, errorInfo) {
    // 可以有副作用：日志、上报等
    logError(error, errorInfo);
  }
}
```

## 总结

| 特性 | 说明                  |
| ---- | --------------------- |
| 作用 | 捕获子组件渲染错误    |
| 实现 | 类组件 + 特定生命周期 |
| 粒度 | 可以包裹任意组件树    |
| 限制 | 不能捕获所有错误      |

## 延伸阅读

- [错误边界文档](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
