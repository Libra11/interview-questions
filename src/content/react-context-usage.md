---
title: Context API 使用场景？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React Context 的适用场景，掌握何时使用 Context 以及如何正确使用。
tags:
  - React
  - Context
  - 状态管理
  - 组件通信
estimatedTime: 12 分钟
keywords:
  - React Context
  - useContext
  - Provider
  - global state
highlight: Context 适合传递"全局"数据，如主题、用户信息、语言设置等，避免 props 层层传递。
order: 231
---

## 问题 1：Context 解决什么问题？

### Props Drilling 问题

```jsx
// 层层传递 props
function App() {
  const [theme, setTheme] = useState("dark");
  return <Layout theme={theme} />;
}

function Layout({ theme }) {
  return <Sidebar theme={theme} />;
}

function Sidebar({ theme }) {
  return <Button theme={theme} />;
}

function Button({ theme }) {
  return <button className={theme}>Click</button>;
}
```

### Context 解决方案

```jsx
const ThemeContext = createContext("light");

function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click</button>;
}
```

---

## 问题 2：Context 适合什么场景？

### 1. 主题切换

```jsx
const ThemeContext = createContext({ theme: "light", toggle: () => {} });

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. 用户认证

```jsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 3. 国际化

```jsx
const I18nContext = createContext({ locale: "zh", t: (key) => key });

function useTranslation() {
  return useContext(I18nContext);
}

function Button() {
  const { t } = useTranslation();
  return <button>{t("submit")}</button>;
}
```

### 4. 全局 UI 状态

```jsx
// Modal、Toast、Drawer 等
const ModalContext = createContext({ open: () => {}, close: () => {} });

function useModal() {
  return useContext(ModalContext);
}
```

---

## 问题 3：Context 的基本用法？

### 创建和使用

```jsx
// 1. 创建 Context
const MyContext = createContext(defaultValue);

// 2. 提供值
function App() {
  return (
    <MyContext.Provider value={someValue}>
      <Child />
    </MyContext.Provider>
  );
}

// 3. 消费值
function Child() {
  const value = useContext(MyContext);
  return <div>{value}</div>;
}
```

### 封装自定义 Hook

```jsx
const UserContext = createContext(null);

// 封装 Hook，添加错误检查
function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

// 使用
function Profile() {
  const { user } = useUser();
  return <div>{user.name}</div>;
}
```

---

## 问题 4：Context 的最佳实践？

### 分离状态和更新函数

```jsx
const StateContext = createContext(null);
const DispatchContext = createContext(null);

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 只读取状态的组件不会因 dispatch 变化而重渲染
function Display() {
  const state = useContext(StateContext);
  return <div>{state.count}</div>;
}

// 只需要 dispatch 的组件
function Controls() {
  const dispatch = useContext(DispatchContext);
  return <button onClick={() => dispatch({ type: "increment" })}>+</button>;
}
```

## 总结

**Context 适用场景**：

| 场景    | 示例               |
| ------- | ------------------ |
| 主题    | 深色/浅色模式      |
| 用户    | 登录状态、用户信息 |
| 语言    | 国际化             |
| UI 状态 | Modal、Toast       |

**不适合**：频繁变化的状态、复杂的状态逻辑。

## 延伸阅读

- [Context 文档](https://react.dev/reference/react/useContext)
- [使用 Context 深层传递数据](https://react.dev/learn/passing-data-deeply-with-context)
