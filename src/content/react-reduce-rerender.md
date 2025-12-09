---
title: 如何减少 re-render？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握减少 React 组件重渲染的各种方法和最佳实践。
tags:
  - React
  - 性能优化
  - 重渲染
  - memo
estimatedTime: 12 分钟
keywords:
  - reduce rerender
  - React optimization
  - prevent rerender
  - performance
highlight: 减少重渲染的方法：React.memo、状态下移、children 模式、useMemo/useCallback、Context 拆分。
order: 267
---

## 问题 1：使用 React.memo

### 基本用法

```jsx
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
      <ExpensiveList items={items} />
    </div>
  );
}
```

---

## 问题 2：状态下移

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
      <ExpensiveChart />
      <ExpensiveTable />
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
      <SearchInput />
      <ExpensiveChart />
      <ExpensiveTable />
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

## 问题 3：children 模式

### 原理

```jsx
// children 在父组件外部创建，不受父组件状态影响
function Parent({ children }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children} {/* 不会重新渲染 */}
    </div>
  );
}

// 使用
<Parent>
  <ExpensiveChild />
</Parent>;
```

---

## 问题 4：useMemo 和 useCallback

### 缓存对象

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次都创建新对象
  const config = { theme: "dark" };

  // ✅ 缓存对象
  const config = useMemo(() => ({ theme: "dark" }), []);

  return <Child config={config} />;
}
```

### 缓存函数

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次都创建新函数
  const handleClick = () => console.log("click");

  // ✅ 缓存函数
  const handleClick = useCallback(() => console.log("click"), []);

  return <Child onClick={handleClick} />;
}
```

---

## 问题 5：拆分 Context

### 问题

```jsx
// ❌ 所有值放一个 Context
const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0); // 频繁变化

  return (
    <AppContext.Provider value={{ user, theme, count }}>
      {/* count 变化导致所有消费者重渲染 */}
    </AppContext.Provider>
  );
}
```

### 解决

```jsx
// ✅ 拆分 Context
const UserContext = createContext();
const ThemeContext = createContext();
const CountContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [count, setCount] = useState(0);

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <CountContext.Provider value={count}>
          {/* 只有使用 count 的组件会重渲染 */}
        </CountContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
```

---

## 问题 6：避免内联定义

### 问题

```jsx
// ❌ 每次渲染都创建新的
<Child
  style={{ color: "red" }}
  onClick={() => handleClick()}
  items={data.filter((x) => x.active)}
/>
```

### 解决

```jsx
// ✅ 提取到外部或使用 useMemo/useCallback
const style = useMemo(() => ({ color: 'red' }), []);
const handleClick = useCallback(() => { ... }, []);
const activeItems = useMemo(() => data.filter(x => x.active), [data]);

<Child style={style} onClick={handleClick} items={activeItems} />
```

## 总结

| 方法          | 适用场景                 |
| ------------- | ------------------------ |
| React.memo    | 纯展示组件               |
| 状态下移      | 状态只被部分组件使用     |
| children 模式 | 父组件有状态，子组件无关 |
| useMemo       | 缓存对象/计算结果        |
| useCallback   | 缓存函数                 |
| Context 拆分  | 避免无关组件重渲染       |

## 延伸阅读

- [React 性能优化](https://react.dev/learn/render-and-commit)
