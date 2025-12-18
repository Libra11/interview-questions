---
title: 为什么 memo 包裹也不生效？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  分析 React.memo 不生效的常见原因和解决方案。
tags:
  - React
  - React.memo
  - 性能优化
  - 调试
estimatedTime: 12 分钟
keywords:
  - memo not working
  - React.memo issues
  - shallow comparison
  - props reference
highlight: memo 不生效的常见原因：对象/函数 props 每次都是新引用、children 变化、自定义比较函数问题。
order: 700
---

## 问题 1：对象 props 每次都是新引用

### 问题

```jsx
const Child = React.memo(function Child({ style }) {
  console.log("Child render");
  return <div style={style}>Child</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* ❌ 每次渲染都创建新对象 */}
      <Child style={{ color: "red" }} />
    </div>
  );
}

// Child 每次都渲染！
// 因为 { color: 'red' } === { color: 'red' } 是 false
```

### 解决

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 使用 useMemo 缓存对象
  const style = useMemo(() => ({ color: "red" }), []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child style={style} />
    </div>
  );
}
```

---

## 问题 2：函数 props 每次都是新引用

### 问题

```jsx
const Child = React.memo(function Child({ onClick }) {
  console.log("Child render");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* ❌ 每次渲染都创建新函数 */}
      <Child onClick={() => console.log("clicked")} />
    </div>
  );
}
```

### 解决

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 使用 useCallback 缓存函数
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </div>
  );
}
```

---

## 问题 3：children 每次都是新元素

### 问题

```jsx
const Container = React.memo(function Container({ children }) {
  console.log("Container render");
  return <div className="container">{children}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* ❌ children 每次都是新的 React 元素 */}
      <Container>
        <span>Hello</span>
      </Container>
    </div>
  );
}
```

### 解决

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 使用 useMemo 缓存 children
  const children = useMemo(() => <span>Hello</span>, []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Container>{children}</Container>
    </div>
  );
}

// 或者使用 children 提升模式
function App() {
  return (
    <Parent>
      <Container>
        <span>Hello</span>
      </Container>
    </Parent>
  );
}
```

---

## 问题 4：数组/对象展开

### 问题

```jsx
const Child = React.memo(function Child({ items }) {
  console.log("Child render");
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
});

function Parent() {
  const [count, setCount] = useState(0);
  const items = [1, 2, 3];

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* ❌ 每次都是新数组 */}
      <Child items={items} />
    </div>
  );
}
```

### 解决

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 使用 useMemo 或移到组件外部
  const items = useMemo(() => [1, 2, 3], []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child items={items} />
    </div>
  );
}

// 或者移到组件外部（如果是常量）
const items = [1, 2, 3];

function Parent() {
  // ...
  return <Child items={items} />;
}
```

---

## 问题 5：自定义比较函数问题

### 问题

```jsx
const Child = React.memo(
  function Child({ user }) {
    console.log("Child render");
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // ❌ 比较函数返回值错误
    // 返回 true 表示相等，不需要渲染
    // 返回 false 表示不等，需要渲染
    return prevProps.user !== nextProps.user; // 逻辑反了！
  }
);
```

### 解决

```jsx
const Child = React.memo(
  function Child({ user }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // ✅ 正确的比较逻辑
    // 返回 true = props 相等 = 不渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

---

## 问题 6：调试清单

### 检查步骤

```jsx
// 1. 确认 memo 正确包裹
const Child = React.memo(function Child() { ... });

// 2. 检查所有 props 的引用稳定性
// - 对象 → useMemo
// - 函数 → useCallback
// - 数组 → useMemo

// 3. 检查 children
// - 使用 useMemo 缓存
// - 或使用 children 提升模式

// 4. 使用 why-did-you-render 分析
Child.whyDidYouRender = true;

// 5. 检查自定义比较函数的返回值
```

## 总结

| 原因         | 解决方案       |
| ------------ | -------------- |
| 对象 props   | useMemo        |
| 函数 props   | useCallback    |
| children     | useMemo 或提升 |
| 数组 props   | useMemo        |
| 比较函数错误 | 检查返回值逻辑 |

## 延伸阅读

- [React.memo 文档](https://react.dev/reference/react/memo)
- [何时使用 useMemo](https://react.dev/reference/react/useMemo)
