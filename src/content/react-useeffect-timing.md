---
title: useEffect 的执行时机？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 useEffect 的执行时机，掌握依赖数组的作用和清理函数的调用时机。
tags:
  - React
  - Hooks
  - useEffect
  - 副作用
estimatedTime: 15 分钟
keywords:
  - useEffect timing
  - effect cleanup
  - dependency array
  - side effects
highlight: useEffect 在渲染完成后异步执行，清理函数在下次 effect 执行前或组件卸载时调用。
order: 483
---

## 问题 1：useEffect 什么时候执行？

### 基本执行时机

useEffect 在**浏览器完成布局和绘制之后**异步执行，不会阻塞渲染。

```jsx
function Example() {
  console.log("1. render");

  useEffect(() => {
    console.log("3. effect");
  });

  console.log("2. render end");

  return <div>Hello</div>;
}

// 输出顺序：
// 1. render
// 2. render end
// 3. effect（渲染完成后）
```

### 执行流程

```
组件渲染 → DOM 更新 → 浏览器绘制 → useEffect 执行
```

---

## 问题 2：依赖数组如何影响执行？

### 无依赖数组

每次渲染后都执行。

```jsx
useEffect(() => {
  console.log("每次渲染后都执行");
});
```

### 空依赖数组

只在挂载时执行一次。

```jsx
useEffect(() => {
  console.log("只在挂载时执行");
}, []);
```

### 有依赖项

依赖变化时执行。

```jsx
useEffect(() => {
  console.log("id 变化时执行");
  fetchUser(id);
}, [id]);
```

---

## 问题 3：清理函数什么时候执行？

### 清理时机

1. **组件卸载时**
2. **下次 effect 执行前**

```jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    console.log(`连接到房间 ${roomId}`);
    const connection = connect(roomId);

    return () => {
      console.log(`断开房间 ${roomId}`);
      connection.disconnect();
    };
  }, [roomId]);
}

// roomId 从 1 变为 2 时：
// 1. 断开房间 1（清理旧 effect）
// 2. 连接到房间 2（执行新 effect）
```

### 完整执行顺序

```jsx
function Example({ id }) {
  useEffect(() => {
    console.log(`effect: ${id}`);
    return () => console.log(`cleanup: ${id}`);
  }, [id]);
}

// id: 1 → 2 → 卸载
// effect: 1
// cleanup: 1
// effect: 2
// cleanup: 2（卸载时）
```

---

## 问题 4：常见使用模式？

### 数据获取

```jsx
function User({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchUser(userId).then((data) => {
      if (!cancelled) {
        setUser(data);
      }
    });

    return () => {
      cancelled = true; // 防止设置已卸载组件的状态
    };
  }, [userId]);
}
```

### 事件监听

```jsx
function WindowSize() {
  const [size, setSize] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setSize(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);
}
```

### 定时器

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
}
```

## 总结

| 依赖数组 | 执行时机   | 清理时机            |
| -------- | ---------- | ------------------- |
| 无       | 每次渲染后 | 每次渲染前          |
| []       | 挂载后     | 卸载时              |
| [dep]    | dep 变化后 | dep 变化前 + 卸载时 |

## 延伸阅读

- [useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React 官方文档 - useEffect](https://react.dev/reference/react/useEffect)
