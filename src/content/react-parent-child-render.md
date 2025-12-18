---
title: 父组件渲染是否会导致子组件一定渲染？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 父子组件渲染关系，掌握避免子组件不必要渲染的方法。
tags:
  - React
  - 渲染
  - 性能
  - 优化
estimatedTime: 10 分钟
keywords:
  - parent render
  - child render
  - React.memo
  - render optimization
highlight: 默认情况下父组件渲染会导致所有子组件渲染，但可以通过 React.memo 等方式避免。
order: 566
---

## 问题 1：默认行为是什么？

### 父组件渲染 → 子组件渲染

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  console.log("Parent render");

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <Child /> {/* 每次都会渲染 */}
    </div>
  );
}

function Child() {
  console.log("Child render");
  return <div>Child</div>;
}

// 点击按钮：
// Parent render
// Child render
```

### 即使 props 没变

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      {/* name 永远是 "fixed"，但 Child 仍然渲染 */}
      <Child name="fixed" />
    </div>
  );
}
```

---

## 问题 2：如何避免子组件渲染？

### 方法 1：React.memo

```jsx
const Child = React.memo(function Child({ name }) {
  console.log("Child render");
  return <div>{name}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <Child name="fixed" /> {/* props 没变，不渲染 */}
    </div>
  );
}
```

### 方法 2：children 模式

```jsx
function Parent({ children }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      {children} {/* 不会重新渲染 */}
    </div>
  );
}

// 使用
<Parent>
  <ExpensiveChild />
</Parent>;
```

### 方法 3：状态下移

```jsx
// ❌ 状态在顶层，所有子组件都渲染
function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Counter count={count} setCount={setCount} />
      <ExpensiveList /> {/* 不需要 count，但会渲染 */}
    </div>
  );
}

// ✅ 状态下移到需要的组件
function App() {
  return (
    <div>
      <Counter /> {/* 状态在这里 */}
      <ExpensiveList /> {/* 不受影响 */}
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

---

## 问题 3：React.memo 的注意事项？

### 对象/函数 props 的陷阱

```jsx
const Child = React.memo(function Child({ style, onClick }) {
  console.log("Child render");
  return (
    <div style={style} onClick={onClick}>
      Child
    </div>
  );
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新对象和函数
  return (
    <Child
      style={{ color: "red" }} // 新对象
      onClick={() => {}} // 新函数
    />
  );
  // Child 每次都会渲染！
}
```

### 解决方案

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 使用 useMemo 和 useCallback
  const style = useMemo(() => ({ color: "red" }), []);
  const handleClick = useCallback(() => {}, []);

  return <Child style={style} onClick={handleClick} />;
}
```

---

## 问题 4：为什么 React 默认全部渲染？

### 设计考量

```jsx
// 1. 简单可预测
// 父组件渲染 → 子组件渲染，逻辑简单

// 2. 渲染不等于 DOM 更新
// 渲染只是执行函数，生成虚拟 DOM
// 真正的 DOM 更新由 diff 算法决定

// 3. 过早优化的代价
// React.memo 有比较成本
// 不是所有组件都需要优化
```

### 何时需要优化

```jsx
// 需要优化的情况：
// 1. 组件渲染成本高（复杂计算、大列表）
// 2. 组件频繁渲染
// 3. 实际测量发现性能问题

// 不需要优化的情况：
// 大多数简单组件
```

## 总结

| 情况                    | 子组件是否渲染 |
| ----------------------- | -------------- |
| 默认                    | ✅ 渲染        |
| React.memo + props 不变 | ❌ 不渲染      |
| children 模式           | ❌ 不渲染      |
| 状态下移                | ❌ 不受影响    |

## 延伸阅读

- [React.memo 文档](https://react.dev/reference/react/memo)
- [优化渲染性能](https://react.dev/learn/render-and-commit)
