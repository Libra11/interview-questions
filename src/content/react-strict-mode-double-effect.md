---
title: 为什么无依赖 useEffect 会执行两次（StrictMode）？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 React StrictMode 下 useEffect 执行两次的原因和目的。
tags:
  - React
  - StrictMode
  - useEffect
  - 开发模式
estimatedTime: 10 分钟
keywords:
  - StrictMode
  - useEffect twice
  - double invoke
  - development mode
highlight: StrictMode 故意执行两次 effect 来帮助发现副作用清理问题，只在开发模式生效。
order: 312
---

## 问题 1：现象

### 开发模式下的行为

```jsx
function App() {
  useEffect(() => {
    console.log("effect"); // 打印两次！

    return () => {
      console.log("cleanup"); // 也打印两次！
    };
  }, []);

  return <div>App</div>;
}

// 控制台输出：
// effect
// cleanup
// effect
```

### 只在开发模式

```jsx
// 开发模式（npm start）：执行两次
// 生产模式（npm run build）：执行一次

// 只有被 StrictMode 包裹的组件会这样
<React.StrictMode>
  <App />
</React.StrictMode>
```

---

## 问题 2：为什么这样设计？

### 目的：发现副作用问题

```jsx
// React 18 的并发特性可能导致组件：
// 1. 挂载
// 2. 卸载
// 3. 重新挂载

// StrictMode 模拟这个过程
// 帮助你发现 effect 清理不当的问题
```

### 发现的问题示例

```jsx
// ❌ 问题代码：没有清理
useEffect(() => {
  const subscription = api.subscribe((data) => {
    setData(data);
  });
  // 没有 return cleanup
}, []);

// 执行两次后：
// 第一次订阅
// 第二次订阅（没有取消第一次）
// 导致内存泄漏和重复回调

// ✅ 正确代码：有清理
useEffect(() => {
  const subscription = api.subscribe((data) => {
    setData(data);
  });

  return () => {
    subscription.unsubscribe(); // 清理
  };
}, []);
```

---

## 问题 3：常见需要清理的场景

### 订阅

```jsx
useEffect(() => {
  const unsubscribe = store.subscribe(handleChange);
  return () => unsubscribe();
}, []);
```

### 定时器

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    // ...
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### 事件监听

```jsx
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### WebSocket

```jsx
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => ws.close();
}, [url]);
```

---

## 问题 4：如何正确处理？

### 确保 effect 是幂等的

```jsx
// 幂等：执行多次和执行一次效果相同

// ❌ 非幂等
useEffect(() => {
  count++; // 每次执行都增加
}, []);

// ✅ 幂等
useEffect(() => {
  document.title = "My App"; // 多次执行结果相同
}, []);
```

### 确保清理函数正确

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
    cancelled = true; // 防止设置已卸载组件的状态
  };
}, []);
```

---

## 问题 5：如何禁用？

### 移除 StrictMode

```jsx
// 不推荐，但可以这样做
// index.js
root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
```

### 只在特定组件禁用

```jsx
// 没有官方方法
// StrictMode 是为了帮助你写出更好的代码
// 应该修复问题，而不是禁用检查
```

---

## 问题 6：与 React 18 并发特性的关系

### Offscreen API（未来特性）

```jsx
// React 未来可能支持组件"隐藏"而不卸载
// 类似于 keep-alive

// 当组件从隐藏变为显示时
// effect 需要重新执行
// 所以 cleanup 必须正确实现

// StrictMode 的双重调用就是为此做准备
```

## 总结

| 方面 | 说明                    |
| ---- | ----------------------- |
| 原因 | 检测副作用清理问题      |
| 时机 | 仅开发模式 + StrictMode |
| 解决 | 确保 cleanup 正确       |
| 目的 | 为并发特性做准备        |

**记住**：这是特性，不是 bug。修复你的 effect，而不是禁用 StrictMode。

## 延伸阅读

- [StrictMode 文档](https://react.dev/reference/react/StrictMode)
- [useEffect 需要清理](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
