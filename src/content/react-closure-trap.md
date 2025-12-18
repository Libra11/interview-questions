---
title: React 中如何避免闭包陷阱？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 React Hooks 中的闭包陷阱，掌握避免和解决的方法。
tags:
  - React
  - 闭包
  - Hooks
  - 陷阱
estimatedTime: 12 分钟
keywords:
  - closure trap
  - stale closure
  - React hooks
  - useRef
highlight: 闭包陷阱是指 Hooks 中捕获了过时的 state/props 值，可通过 useRef、函数式更新等方式解决。
order: 620
---

## 问题 1：什么是闭包陷阱？

### 问题表现

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 永远是 0
      setCount(count + 1); // 永远是 0 + 1 = 1
    }, 1000);

    return () => clearInterval(timer);
  }, []); // 空依赖，闭包捕获了初始的 count

  return <div>{count}</div>;
}
// count 永远显示 1
```

### 原因

```jsx
// useEffect 的回调在组件首次渲染时创建
// 此时 count = 0
// 回调函数"记住"了 count = 0
// 即使 count 后来变化，回调中的 count 仍是 0
```

---

## 问题 2：使用函数式更新

### 解决方案

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // ✅ 函数式更新，不依赖外部 count
      setCount((c) => c + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

### 原理

```jsx
// setCount(count + 1)  → 依赖闭包中的 count
// setCount(c => c + 1) → 接收最新的 state 作为参数
```

---

## 问题 3：使用 useRef

### 保存最新值

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 每次 count 变化，更新 ref
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const timer = setInterval(() => {
      // ✅ 通过 ref 获取最新值
      console.log(countRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

### 封装 Hook

```jsx
function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// 使用
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useLatest(count);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current); // 始终是最新值
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```

---

## 问题 4：正确设置依赖

### 添加依赖

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 现在能获取最新值
    }, 1000);

    return () => clearInterval(timer);
  }, [count]); // ✅ 添加 count 依赖

  // 但这会导致每次 count 变化都重新创建定时器
}
```

### 权衡

```jsx
// 方案 1：函数式更新（推荐）
setCount(c => c + 1);

// 方案 2：useRef（需要读取值时）
const countRef = useLatest(count);

// 方案 3：添加依赖（可能有副作用）
useEffect(() => { ... }, [count]);
```

---

## 问题 5：事件处理中的闭包

### 问题

```jsx
function Chat() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    setTimeout(() => {
      // 3 秒后发送的是点击时的 message
      // 不是最新的 message
      sendMessage(message);
    }, 3000);
  };

  return (
    <div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSend}>发送</button>
    </div>
  );
}
```

### 解决

```jsx
function Chat() {
  const [message, setMessage] = useState("");
  const messageRef = useRef(message);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const handleSend = () => {
    setTimeout(() => {
      // ✅ 发送最新的 message
      sendMessage(messageRef.current);
    }, 3000);
  };
}
```

## 总结

| 场景              | 解决方案           |
| ----------------- | ------------------ |
| setState 依赖旧值 | 函数式更新         |
| 需要读取最新值    | useRef             |
| 定时器/事件监听   | useRef + useEffect |

**记住**：闭包捕获的是创建时的值，不是最新值。

## 延伸阅读

- [useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [Hooks FAQ](https://react.dev/reference/react/useState#im-getting-stale-props-or-state)
