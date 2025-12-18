---
title: React.memo 应用场景？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握 React.memo 的正确使用场景，避免过度优化。
tags:
  - React
  - React.memo
  - 性能优化
  - 场景
estimatedTime: 10 分钟
keywords:
  - React.memo
  - memoization
  - when to use memo
  - optimization
highlight: React.memo 适合渲染成本高、props 稳定、频繁重渲染的纯展示组件。
order: 610
---

## 问题 1：适合使用的场景？

### 1. 渲染成本高的组件

```jsx
// 复杂的图表组件
const Chart = React.memo(function Chart({ data }) {
  // 渲染成本高
  return <canvas>{/* 复杂绑制逻辑 */}</canvas>;
});

// 大型表格
const DataTable = React.memo(function DataTable({ rows, columns }) {
  return (
    <table>
      {rows.map((row) => (
        <tr key={row.id}>
          {columns.map((col) => (
            <td key={col}>{row[col]}</td>
          ))}
        </tr>
      ))}
    </table>
  );
});
```

### 2. 频繁重渲染的父组件

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  // count 频繁变化
  useEffect(() => {
    const timer = setInterval(() => setCount((c) => c + 1), 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <span>{count}</span>
      {/* ExpensiveChild 不依赖 count，应该用 memo */}
      <ExpensiveChild data={staticData} />
    </div>
  );
}

const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  return <div>{/* 复杂渲染 */}</div>;
});
```

### 3. props 相对稳定

```jsx
// props 不经常变化
const UserCard = React.memo(function UserCard({ user }) {
  return (
    <div>
      <img src={user.avatar} />
      <h3>{user.name}</h3>
      <p>{user.bio}</p>
    </div>
  );
});

// 使用时确保 user 引用稳定
function UserList({ users }) {
  return users.map((user) => <UserCard key={user.id} user={user} />);
}
```

---

## 问题 2：不适合使用的场景？

### 1. 简单组件

```jsx
// ❌ 不需要 memo
const Button = React.memo(({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
});

// 渲染成本很低，memo 的比较开销可能更大
```

### 2. props 频繁变化

```jsx
// ❌ props 每次都变，memo 无效
const Display = React.memo(({ value }) => {
  return <div>{value}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);
  // count 每次都变，memo 的比较是浪费
  return <Display value={count} />;
}
```

### 3. 接收 children

```jsx
// ❌ children 每次都是新的 React 元素
const Container = React.memo(({ children }) => {
  return <div className="container">{children}</div>;
});

// 使用时
<Container>
  <span>Hello</span> {/* 每次都是新元素 */}
</Container>;
```

---

## 问题 3：配合其他优化？

### 配合 useMemo

```jsx
const Child = React.memo(({ config }) => {
  return <div>{config.title}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // 缓存对象，避免每次创建新引用
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

### 配合 useCallback

```jsx
const Child = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // 缓存函数
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);

  return <Child onClick={handleClick} />;
}
```

## 总结

| 场景           | 是否使用 memo |
| -------------- | ------------- |
| 渲染成本高     | ✅            |
| 父组件频繁更新 | ✅            |
| props 稳定     | ✅            |
| 简单组件       | ❌            |
| props 频繁变化 | ❌            |
| 接收 children  | ❌            |

**原则**：先测量，后优化。不要过早使用 memo。

## 延伸阅读

- [React.memo 文档](https://react.dev/reference/react/memo)
