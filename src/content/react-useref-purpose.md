---
title: useRef 的作用是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 useRef 的两个核心用途：访问 DOM 元素和保存可变值，掌握 useRef 与 useState 的区别。
tags:
  - React
  - Hooks
  - useRef
  - DOM
estimatedTime: 12 分钟
keywords:
  - useRef
  - ref
  - DOM access
  - mutable value
highlight: useRef 返回一个可变的 ref 对象，修改 .current 不会触发重新渲染。
order: 212
---

## 问题 1：useRef 的基本用法？

### 访问 DOM 元素

```jsx
function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>聚焦</button>
    </>
  );
}
```

### 保存可变值

```jsx
function Timer() {
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    timerRef.current = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
  };

  const stop = () => {
    clearInterval(timerRef.current);
  };

  return (
    <div>
      <p>{count}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}
```

---

## 问题 2：useRef 和 useState 有什么区别？

### 核心区别

| 特性           | useRef             | useState         |
| -------------- | ------------------ | ---------------- |
| 修改后重新渲染 | ❌ 不会            | ✅ 会            |
| 值的持久性     | ✅ 跨渲染保持      | ✅ 跨渲染保持    |
| 适用场景       | 不需要触发渲染的值 | 需要触发渲染的值 |

### 示例对比

```jsx
function Example() {
  const [stateCount, setStateCount] = useState(0);
  const refCount = useRef(0);

  const handleClick = () => {
    setStateCount(stateCount + 1); // 触发重新渲染
    refCount.current += 1; // 不触发重新渲染

    console.log("state:", stateCount); // 旧值（闭包）
    console.log("ref:", refCount.current); // 新值（引用）
  };
}
```

---

## 问题 3：useRef 的常见使用场景？

### 1. 保存上一次的值

```jsx
function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      现在: {count}, 之前: {prevCount}
    </div>
  );
}
```

### 2. 避免闭包陷阱

```jsx
function Timer() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    const timer = setInterval(() => {
      // 使用 ref 获取最新值
      console.log(countRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
}
```

### 3. 跟踪组件是否已挂载

```jsx
function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function AsyncComponent() {
  const isMounted = useIsMounted();

  const fetchData = async () => {
    const data = await api.getData();
    if (isMounted.current) {
      setData(data); // 只在组件挂载时更新
    }
  };
}
```

---

## 问题 4：使用 ref 的注意事项？

### 不要在渲染期间读写 ref

```jsx
function Bad() {
  const ref = useRef(0);

  // ❌ 错误：渲染期间修改 ref
  ref.current += 1;

  return <div>{ref.current}</div>;
}

function Good() {
  const ref = useRef(0);

  // ✅ 正确：在事件处理或 effect 中修改
  const handleClick = () => {
    ref.current += 1;
  };
}
```

### ref 回调

```jsx
function MeasureExample() {
  const [height, setHeight] = useState(0);

  // ref 回调：元素挂载/卸载时调用
  const measureRef = (node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  };

  return <div ref={measureRef}>内容</div>;
}
```

## 总结

**useRef 核心用途**：

1. **访问 DOM**：获取 DOM 元素引用
2. **保存可变值**：跨渲染保持值，修改不触发渲染
3. **避免闭包问题**：保存最新值的引用

## 延伸阅读

- [useRef 文档](https://react.dev/reference/react/useRef)
- [Refs and the DOM](https://react.dev/learn/manipulating-the-dom-with-refs)
