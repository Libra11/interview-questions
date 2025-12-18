---
title: Context 为什么不能乱用？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 Context 的性能问题和使用限制，掌握如何避免 Context 滥用。
tags:
  - React
  - Context
  - 性能
  - 重渲染
estimatedTime: 12 分钟
keywords:
  - Context performance
  - Context rerender
  - Context pitfalls
  - optimization
highlight: Context 值变化会导致所有消费者重新渲染，不适合存储频繁变化的状态。
order: 542
---

## 问题 1：Context 的性能问题？

### 所有消费者都会重渲染

```jsx
const AppContext = createContext();

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("React");

  // 任何值变化，所有消费者都重渲染
  return (
    <AppContext.Provider value={{ count, name, setCount, setName }}>
      <CountDisplay /> {/* count 变化时重渲染 */}
      <NameDisplay /> {/* count 变化时也重渲染！ */}
    </AppContext.Provider>
  );
}

function NameDisplay() {
  const { name } = useContext(AppContext);
  console.log("NameDisplay rendered"); // count 变化时也会打印
  return <div>{name}</div>;
}
```

### 原因

Context 使用**引用比较**，每次渲染创建新对象。

```jsx
// 每次 App 渲染，value 都是新对象
<AppContext.Provider value={{ count, name }}>
  {/* 新对象 !== 旧对象，触发所有消费者更新 */}
</AppContext.Provider>
```

---

## 问题 2：如何优化 Context 性能？

### 1. 拆分 Context

```jsx
// ❌ 一个大 Context
const AppContext = createContext({ user, theme, settings, ... });

// ✅ 拆分成多个小 Context
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const SettingsContext = createContext({});

// 只有相关的消费者会重渲染
```

### 2. 分离状态和方法

```jsx
const CountContext = createContext(0);
const CountDispatchContext = createContext(() => {});

function CountProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CountContext.Provider value={count}>
      <CountDispatchContext.Provider value={setCount}>
        {children}
      </CountDispatchContext.Provider>
    </CountContext.Provider>
  );
}

// 只需要 setCount 的组件不会因 count 变化而重渲染
function IncrementButton() {
  const setCount = useContext(CountDispatchContext);
  return <button onClick={() => setCount((c) => c + 1)}>+</button>;
}
```

### 3. 使用 useMemo

```jsx
function App() {
  const [count, setCount] = useState(0);

  // 缓存 value 对象
  const value = useMemo(() => ({ count, setCount }), [count]);

  return (
    <CountContext.Provider value={value}>{children}</CountContext.Provider>
  );
}
```

---

## 问题 3：什么情况不该用 Context？

### 1. 频繁变化的状态

```jsx
// ❌ 鼠标位置（每秒变化 60 次）
const MouseContext = createContext({ x: 0, y: 0 });

// ✅ 使用 ref 或状态管理库
```

### 2. 大量数据

```jsx
// ❌ 整个应用状态
const StoreContext = createContext({
  users: [...],      // 1000 条
  products: [...],   // 5000 条
  orders: [...]      // 10000 条
});

// ✅ 使用状态管理库（Redux、Zustand）
```

### 3. 需要细粒度更新

```jsx
// ❌ 表格数据
const TableContext = createContext({ rows: [...] });

// 任何单元格变化，整个表格重渲染
// ✅ 使用状态管理库 + 选择器
```

---

## 问题 4：Context vs 状态管理库？

### Context 适合

```jsx
// 不频繁变化的全局数据
-主题 - 用户认证状态 - 语言设置 - 功能开关;
```

### 状态管理库适合

```jsx
// 复杂、频繁变化的状态
-表单数据 - 列表数据 - 实时数据 - 需要细粒度订阅的数据;
```

### 对比

| 特性       | Context      | Redux/Zustand |
| ---------- | ------------ | ------------- |
| 细粒度更新 | ❌           | ✅            |
| 中间件     | ❌           | ✅            |
| DevTools   | ❌           | ✅            |
| 学习成本   | 低           | 中            |
| 适用场景   | 简单全局状态 | 复杂状态管理  |

## 总结

**Context 使用原则**：

1. **适合**：不频繁变化的全局数据
2. **避免**：频繁更新、大量数据、需要细粒度订阅
3. **优化**：拆分 Context、分离状态和方法、useMemo

## 延伸阅读

- [优化 Context 重渲染](https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions)
- [Before You Use Context](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context)
