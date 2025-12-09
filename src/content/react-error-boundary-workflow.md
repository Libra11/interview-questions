---
title: 错误边界的工作流程？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解错误边界捕获和处理错误的完整流程。
tags:
  - React
  - 错误边界
  - 工作流程
  - 生命周期
estimatedTime: 10 分钟
keywords:
  - ErrorBoundary workflow
  - error handling flow
  - getDerivedStateFromError
  - componentDidCatch
highlight: 错误边界通过 getDerivedStateFromError 更新状态显示 fallback，通过 componentDidCatch 记录错误。
order: 274
---

## 问题 1：整体流程

### 流程图

```
子组件抛出错误
      ↓
React 捕获错误
      ↓
向上查找最近的 ErrorBoundary
      ↓
调用 getDerivedStateFromError（渲染阶段）
      ↓
更新 state，触发重新渲染
      ↓
渲染 fallback UI
      ↓
调用 componentDidCatch（提交阶段）
      ↓
记录错误信息
```

---

## 问题 2：详细步骤

### 步骤 1：错误发生

```jsx
function BuggyComponent() {
  throw new Error("Crash!"); // 渲染时抛出错误
  return <div>Never rendered</div>;
}
```

### 步骤 2：React 捕获错误

```jsx
// React 内部在渲染过程中捕获错误
// 开始向上查找 ErrorBoundary
```

### 步骤 3：调用 getDerivedStateFromError

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  // 静态方法，在渲染阶段调用
  static getDerivedStateFromError(error) {
    console.log("1. getDerivedStateFromError called");
    // 返回新的 state
    return { hasError: true, error };
  }
}
```

### 步骤 4：重新渲染

```jsx
render() {
  console.log('2. render called');

  if (this.state.hasError) {
    // 显示 fallback UI
    return <div>Something went wrong</div>;
  }

  return this.props.children;
}
```

### 步骤 5：调用 componentDidCatch

```jsx
// 在提交阶段调用
componentDidCatch(error, errorInfo) {
  console.log('3. componentDidCatch called');
  console.log('Error:', error);
  console.log('Component Stack:', errorInfo.componentStack);

  // 可以执行副作用
  logErrorToService(error, errorInfo);
}
```

---

## 问题 3：两个方法的区别？

### getDerivedStateFromError

```jsx
static getDerivedStateFromError(error) {
  // 特点：
  // 1. 静态方法
  // 2. 渲染阶段调用
  // 3. 不能有副作用
  // 4. 必须返回 state 更新

  return { hasError: true };
}
```

### componentDidCatch

```jsx
componentDidCatch(error, errorInfo) {
  // 特点：
  // 1. 实例方法
  // 2. 提交阶段调用
  // 3. 可以有副作用
  // 4. 接收 errorInfo（组件栈）

  // errorInfo.componentStack 示例：
  // in BuggyComponent
  // in div
  // in ErrorBoundary
  // in App

  logError(error, errorInfo);
}
```

---

## 问题 4：错误信息包含什么？

### error 对象

```jsx
componentDidCatch(error, errorInfo) {
  console.log(error.name);     // "Error"
  console.log(error.message);  // "Crash!"
  console.log(error.stack);    // 调用栈
}
```

### errorInfo 对象

```jsx
componentDidCatch(error, errorInfo) {
  console.log(errorInfo.componentStack);
  // 组件栈，显示错误发生的组件层级

  /*
  输出示例：

  at BuggyComponent (BuggyComponent.js:5)
  at div
  at ErrorBoundary (ErrorBoundary.js:10)
  at App (App.js:15)
  */
}
```

---

## 问题 5：恢复机制？

### 重置错误状态

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>出错了</p>
          <button onClick={this.handleReset}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 配合 key 强制重新挂载

```jsx
function App() {
  const [key, setKey] = useState(0);

  return (
    <ErrorBoundary key={key} onReset={() => setKey((k) => k + 1)}>
      <BuggyComponent />
    </ErrorBoundary>
  );
}
```

## 总结

| 阶段     | 方法                     | 作用       |
| -------- | ------------------------ | ---------- |
| 渲染阶段 | getDerivedStateFromError | 更新 state |
| 提交阶段 | componentDidCatch        | 记录错误   |

**流程**：错误发生 → 捕获 → 更新状态 → 渲染 fallback → 记录日志

## 延伸阅读

- [错误边界文档](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
