---
title: 组件什么时候会重新渲染？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 组件重新渲染的触发条件，掌握渲染机制的核心原理。
tags:
  - React
  - 渲染
  - 重渲染
  - 性能
estimatedTime: 12 分钟
keywords:
  - React rerender
  - component render
  - state change
  - props change
highlight: 组件重新渲染的三个条件：state 变化、props 变化、父组件渲染。
order: 564
---

## 问题 1：触发重新渲染的条件？

### 三种情况

```jsx
// 1. 组件自身 state 变化
function Counter() {
  const [count, setCount] = useState(0);
  // setCount 触发重新渲染
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// 2. 父组件重新渲染
function Parent() {
  const [value, setValue] = useState(0);
  // Parent 渲染时，Child 也会渲染
  return <Child />;
}

// 3. Context 值变化
function Consumer() {
  const theme = useContext(ThemeContext);
  // theme 变化时重新渲染
  return <div className={theme}>...</div>;
}
```

---

## 问题 2：state 变化如何触发渲染？

### setState 触发

```jsx
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(1); // 触发渲染
    setCount(1); // 值相同，不触发
    setCount((c) => c); // 返回相同值，不触发
  };

  console.log("render");
  return <div>{count}</div>;
}
```

### 对象/数组的陷阱

```jsx
function Component() {
  const [user, setUser] = useState({ name: "John" });

  const handleClick = () => {
    // ❌ 不会触发渲染（引用相同）
    user.name = "Jane";
    setUser(user);

    // ✅ 会触发渲染（新引用）
    setUser({ ...user, name: "Jane" });
  };
}
```

---

## 问题 3：props 变化如何触发渲染？

### 严格来说，props 变化不直接触发渲染

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // Parent 的 state 变化 → Parent 渲染 → Child 渲染
  // 是 Parent 渲染导致 Child 渲染，不是 props 变化
  return <Child count={count} />;
}

function Child({ count }) {
  console.log("Child render");
  return <div>{count}</div>;
}
```

### 即使 props 没变，子组件也会渲染

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      {/* Child 的 props 没变，但仍会渲染 */}
      <Child name="fixed" />
    </div>
  );
}
```

---

## 问题 4：什么情况不会重新渲染？

### 1. state 值相同

```jsx
const [count, setCount] = useState(0);
setCount(0); // 值相同，不渲染
```

### 2. 使用 React.memo

```jsx
const Child = React.memo(function Child({ name }) {
  console.log("Child render");
  return <div>{name}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  // Child 的 props 没变，不会渲染
  return <Child name="fixed" />;
}
```

### 3. 使用 children 模式

```jsx
function Parent({ children }) {
  const [count, setCount] = useState(0);
  // children 在外部创建，不会因 Parent 渲染而重新创建
  return <div>{children}</div>;
}

// 使用
<Parent>
  <ExpensiveChild /> {/* 不会因 Parent 的 state 变化而渲染 */}
</Parent>;
```

---

## 问题 5：渲染 vs DOM 更新？

### 渲染不等于 DOM 更新

```jsx
function Component() {
  const [count, setCount] = useState(0);

  console.log("render"); // 每次 state 变化都打印

  // 但 DOM 只在实际变化时更新
  return <div>Fixed Content</div>;
}

// render 函数执行 ≠ DOM 操作
// React 会对比虚拟 DOM，只更新变化的部分
```

## 总结

**触发重新渲染**：

| 条件         | 说明                      |
| ------------ | ------------------------- |
| state 变化   | 值必须不同（引用比较）    |
| 父组件渲染   | 默认子组件都会渲染        |
| Context 变化 | 消费该 Context 的组件渲染 |

**避免不必要渲染**：React.memo、useMemo、useCallback

## 延伸阅读

- [React 渲染行为](https://react.dev/learn/render-and-commit)
- [为什么 React 会重新渲染](https://www.joshwcomeau.com/react/why-react-re-renders/)
