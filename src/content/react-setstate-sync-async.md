---
title: setState 是同步还是异步？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 setState 的执行时机，掌握 React 17 和 React 18 的差异。
tags:
  - React
  - setState
  - 批量更新
  - 异步
estimatedTime: 12 分钟
keywords:
  - setState sync async
  - batching
  - automatic batching
  - React 18
highlight: setState 本身是同步的，但更新是批量的。React 18 实现了自动批处理，所有场景都是"异步"表现。
order: 686
---

## 问题 1：setState 的本质

### 同步调用，批量更新

```jsx
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(1); // 同步调用
    console.log(count); // 仍然是 0
    // 因为更新被"批量"处理，还没有执行
  };
}

// setState 调用是同步的
// 但状态更新是批量的（看起来像"异步"）
```

---

## 问题 2：React 17 的行为

### 事件处理函数中：批量

```jsx
// React 17
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    setCount(1);
    setFlag(true);
    // 只触发一次渲染（批量）
  };
}
```

### setTimeout/Promise 中：不批量

```jsx
// React 17
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    setTimeout(() => {
      setCount(1); // 立即渲染
      console.log(count); // 仍然是 0（闭包）
      setFlag(true); // 再次渲染
      // 共 2 次渲染
    }, 0);
  };

  const handleFetch = async () => {
    await fetch("/api");
    setCount(1); // 立即渲染
    setFlag(true); // 再次渲染
    // 共 2 次渲染
  };
}
```

---

## 问题 3：React 18 的自动批处理

### 所有场景都批量

```jsx
// React 18
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // 事件处理：批量 ✅
  const handleClick = () => {
    setCount(1);
    setFlag(true);
    // 1 次渲染
  };

  // setTimeout：批量 ✅
  const handleTimeout = () => {
    setTimeout(() => {
      setCount(1);
      setFlag(true);
      // 1 次渲染
    }, 0);
  };

  // Promise：批量 ✅
  const handleFetch = async () => {
    await fetch("/api");
    setCount(1);
    setFlag(true);
    // 1 次渲染
  };

  // 原生事件：批量 ✅
  useEffect(() => {
    document.addEventListener("click", () => {
      setCount(1);
      setFlag(true);
      // 1 次渲染
    });
  }, []);
}
```

---

## 问题 4：如何获取更新后的值？

### 使用 useEffect

```jsx
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("count updated:", count);
  }, [count]);

  const handleClick = () => {
    setCount((c) => c + 1);
    // 这里 count 还是旧值
  };
}
```

### 使用函数式更新

```jsx
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount((c) => c + 1); // c 是最新值
    setCount((c) => c + 1); // c 是上一步的结果
    setCount((c) => c + 1); // c 是上一步的结果
    // 最终 count = 3
  };
}
```

---

## 问题 5：如何退出批量更新？

### 使用 flushSync

```jsx
import { flushSync } from "react-dom";

function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    flushSync(() => {
      setCount(1);
    });
    // 立即渲染，DOM 已更新

    flushSync(() => {
      setFlag(true);
    });
    // 再次渲染

    // 共 2 次渲染
  };
}
```

### 使用场景

```jsx
// 需要立即读取 DOM
const handleClick = () => {
  flushSync(() => {
    setItems([...items, newItem]);
  });
  // DOM 已更新
  listRef.current.lastChild.scrollIntoView();
};
```

---

## 问题 6：类组件的 setState

### 回调函数

```jsx
class Component extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    this.setState({ count: 1 }, () => {
      // 回调在更新后执行
      console.log(this.state.count); // 1
    });
  };
}
```

### 函数式更新

```jsx
this.setState((prevState) => ({
  count: prevState.count + 1,
}));
```

## 总结

| 版本     | 事件处理 | setTimeout | Promise |
| -------- | -------- | ---------- | ------- |
| React 17 | 批量     | 不批量     | 不批量  |
| React 18 | 批量     | 批量       | 批量    |

**记住**：

- setState 调用是同步的
- 状态更新是批量的
- React 18 自动批处理所有场景

## 延伸阅读

- [React 18 自动批处理](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- [flushSync](https://react.dev/reference/react-dom/flushSync)
