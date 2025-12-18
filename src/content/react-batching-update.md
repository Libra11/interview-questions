---
title: 批量更新（Batching Update）是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 批量更新机制，掌握 React 18 自动批处理的改进。
tags:
  - React
  - 批量更新
  - Batching
  - 性能
estimatedTime: 10 分钟
keywords:
  - batching update
  - automatic batching
  - setState
  - React 18
highlight: 批量更新将多次 setState 合并为一次渲染，React 18 扩展到所有场景自动批处理。
order: 574
---

## 问题 1：什么是批量更新？

### 定义

多次 setState 合并为**一次渲染**。

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    setCount((c) => c + 1); // 不立即渲染
    setFlag((f) => !f); // 不立即渲染
    // 函数结束后，一次性渲染
  };

  console.log("render"); // 只打印一次

  return <button onClick={handleClick}>{count}</button>;
}
```

### 好处

```jsx
// 没有批量更新：
setCount(1); // 渲染
setFlag(true); // 渲染
// 共 2 次渲染

// 有批量更新：
setCount(1); // 标记
setFlag(true); // 标记
// 共 1 次渲染
```

---

## 问题 2：React 17 的批量更新限制？

### 只在事件处理函数中批量

```jsx
// React 17
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // ✅ 事件处理函数：批量更新
  const handleClick = () => {
    setCount((c) => c + 1);
    setFlag((f) => !f);
    // 1 次渲染
  };

  // ❌ setTimeout：不批量
  const handleAsync = () => {
    setTimeout(() => {
      setCount((c) => c + 1); // 渲染
      setFlag((f) => !f); // 渲染
      // 2 次渲染
    }, 0);
  };

  // ❌ Promise：不批量
  const handleFetch = async () => {
    await fetch("/api");
    setCount((c) => c + 1); // 渲染
    setFlag((f) => !f); // 渲染
    // 2 次渲染
  };
}
```

---

## 问题 3：React 18 的自动批处理？

### 所有场景都批量

```jsx
// React 18
function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  // ✅ setTimeout：自动批量
  const handleAsync = () => {
    setTimeout(() => {
      setCount((c) => c + 1);
      setFlag((f) => !f);
      // 1 次渲染
    }, 0);
  };

  // ✅ Promise：自动批量
  const handleFetch = async () => {
    await fetch("/api");
    setCount((c) => c + 1);
    setFlag((f) => !f);
    // 1 次渲染
  };

  // ✅ 原生事件：自动批量
  useEffect(() => {
    document.addEventListener("click", () => {
      setCount((c) => c + 1);
      setFlag((f) => !f);
      // 1 次渲染
    });
  }, []);
}
```

---

## 问题 4：如何退出批量更新？

### 使用 flushSync

```jsx
import { flushSync } from "react-dom";

function Component() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    flushSync(() => {
      setCount((c) => c + 1);
    });
    // 立即渲染

    flushSync(() => {
      setFlag((f) => !f);
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
  // DOM 已更新，可以滚动到新元素
  listRef.current.lastChild.scrollIntoView();
};
```

---

## 问题 5：批量更新的原理？

### 简化原理

```jsx
// React 内部（简化）
let isBatching = false;
let pendingUpdates = [];

function setState(update) {
  pendingUpdates.push(update);

  if (!isBatching) {
    // 不在批量模式，立即处理
    flushUpdates();
  }
  // 在批量模式，等待批量结束
}

function batchedUpdates(fn) {
  isBatching = true;
  fn();
  isBatching = false;
  flushUpdates(); // 批量结束，统一处理
}

// React 18：所有更新都自动包裹在 batchedUpdates 中
```

## 总结

| 版本     | 批量场景         |
| -------- | ---------------- |
| React 17 | 仅事件处理函数   |
| React 18 | 所有场景（自动） |

**退出批量**：使用 `flushSync`

## 延伸阅读

- [React 18 自动批处理](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- [flushSync 文档](https://react.dev/reference/react-dom/flushSync)
