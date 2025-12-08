---
title: React 中如何避免子组件重复渲染？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 React 中避免子组件不必要渲染的多种方法和最佳实践。
tags:
  - React
  - 性能优化
  - 重渲染
  - memo
estimatedTime: 12 分钟
keywords:
  - prevent rerender
  - React.memo
  - useMemo
  - useCallback
highlight: 避免重复渲染的方法：React.memo、useMemo、useCallback、状态下移、children 模式。
order: 247
---

## 问题 1：使用 React.memo

### 基本用法

```jsx
// 包裹组件，props 不变则不渲染
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  console.log("ExpensiveList render");
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

function Parent() {
  const [count, setCount] = useState(0);
  const items = useMemo(() => [{ id: 1, name: "Item" }], []);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <ExpensiveList items={items} /> {/* 不会重复渲染 */}
    </div>
  );
}
```

---

## 问题 2：使用 useMemo 和 useCallback

### 缓存对象 props

```jsx
const Child = React.memo(({ config }) => {
  return <div>{config.title}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 缓存对象
  const config = useMemo(
    () => ({
      title: "Hello",
      theme: "dark",
    }),
    []
  );

  return <Child config={config} />;
}
```

### 缓存函数 props

```jsx
const Child = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ✅ 缓存函数
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return <Child onClick={handleClick} />;
}
```

---

## 问题 3：状态下移

### 问题

```jsx
// ❌ 状态在顶层，所有子组件都渲染
function App() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <ExpensiveChart /> {/* 每次输入都渲染 */}
      <ExpensiveTable /> {/* 每次输入都渲染 */}
    </div>
  );
}
```

### 解决

```jsx
// ✅ 状态下移到需要的组件
function App() {
  return (
    <div>
      <SearchInput /> {/* 状态在这里 */}
      <ExpensiveChart /> {/* 不受影响 */}
      <ExpensiveTable /> {/* 不受影响 */}
    </div>
  );
}

function SearchInput() {
  const [inputValue, setInputValue] = useState("");
  return (
    <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
  );
}
```

---

## 问题 4：children 模式

### 原理

```jsx
// children 在父组件外部创建，不受父组件状态影响
function SlowParent({ children }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children} {/* 不会重新渲染 */}
    </div>
  );
}

// 使用
<SlowParent>
  <ExpensiveChild /> {/* 在外部创建 */}
</SlowParent>;
```

### 对比

```jsx
// ❌ 子组件在内部创建
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <ExpensiveChild /> {/* 每次都渲染 */}
    </div>
  );
}

// ✅ 子组件通过 children 传入
function Parent({ children }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children} {/* 不渲染 */}
    </div>
  );
}
```

---

## 问题 5：状态提升到 URL/Context

### URL 状态

```jsx
// 使用 URL 参数代替 state
function ProductList() {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");

  // filter 变化不会导致兄弟组件渲染
}
```

### Context 分离

```jsx
// 分离频繁变化和不频繁变化的 Context
const UserContext = createContext(null); // 不频繁
const UIStateContext = createContext(null); // 频繁

// 只订阅需要的 Context
function UserInfo() {
  const user = useContext(UserContext); // 只订阅 user
  return <div>{user.name}</div>;
}
```

## 总结

| 方法          | 适用场景                 |
| ------------- | ------------------------ |
| React.memo    | 纯展示组件               |
| useMemo       | 缓存对象/数组 props      |
| useCallback   | 缓存函数 props           |
| 状态下移      | 状态只被部分组件使用     |
| children 模式 | 父组件有状态，子组件无关 |

## 延伸阅读

- [React 性能优化](https://react.dev/learn/render-and-commit)
- [避免不必要的渲染](https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render)
