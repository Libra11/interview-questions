---
title: React 组件间通信方式有哪些？
category: React
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  全面总结 React 中不同层级组件之间的数据传递方式，从基础的 Props 到 Context API，再到状态管理库的选择。
tags:
  - React
  - Components
  - Props
  - Context
  - State Management
estimatedTime: 20 分钟
keywords:
  - component communication
  - props
  - context api
  - lifting state up
  - redux
highlight: React 数据流是单向的，但通过提升状态、Context API 和外部状态管理库，可以实现灵活的组件通信。
order: 124
---

## 问题 1：父子组件之间如何通信？

这是 React 中最基础的通信方式，遵循“单向数据流”原则。

### 1. 父传子（Props）

父组件通过 **Props** 将数据传递给子组件。这是 React 最核心的数据传递机制。

```jsx
// 父组件
function Parent() {
  const name = "React";
  return <Child message={name} />;
}

// 子组件
function Child({ message }) {
  return <h1>Hello, {message}</h1>;
}
```

### 2. 子传父（Callback）

子组件不能直接修改父组件的数据。父组件需要将一个**回调函数**通过 Props 传递给子组件，子组件调用该函数并将数据作为参数传递回去。

```jsx
// 父组件
function Parent() {
  const handleData = (data) => {
    console.log("Received from child:", data);
  };
  return <Child onSend={handleData} />;
}

// 子组件
function Child({ onSend }) {
  return <button onClick={() => onSend("Data")}>Send to Parent</button>;
}
```

### 3. 父组件调用子组件方法（useImperativeHandle）

虽然不推荐过度使用，但在某些场景（如控制子组件的 focus、滚动、动画）下，父组件需要直接调用子组件的方法。这可以通过 `ref` 和 `useImperativeHandle` 实现。

---

## 问题 2：非父子组件（兄弟/跨层级）如何通信？

当组件之间没有直接的父子关系时，需要采用其他策略。

### 1. 状态提升 (Lifting State Up)

对于**兄弟组件**，通常将共享状态提升到它们最近的**共同父组件**中。父组件管理状态，并通过 Props 分发给子组件。

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <CounterDisplay count={count} />
      <CounterControl onIncrement={() => setCount(c => c + 1)} />
    </>
  );
}
```

### 2. Context API

对于**跨层级**（祖孙关系或更深层级）的通信，如果通过 Props 一层层传递（Props Drilling）会非常繁琐。React Context 提供了一种无需手动传递 Props 就能在组件树间共享数据的方法。

**适用场景**：主题（Theme）、用户信息（User）、语言设置（Locale）等全局或半全局数据。

```jsx
// 1. 创建 Context
const ThemeContext = createContext('light');

// 2. 提供数据
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 3. 消费数据 (任意深度的子组件)
function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>I am styled!</button>;
}
```

---

## 问题 3：什么时候应该引入状态管理库？

当应用变得复杂时，单纯依赖 Props 和 Context 可能会遇到瓶颈。

### Context 的局限性

- **性能问题**：Context 的值更新会导致所有消费该 Context 的组件重新渲染（除非配合 `memo` 细致优化）。
- **复用性差**：过度依赖 Context 会让组件难以在 Context 之外的环境复用。
- **逻辑分散**：业务逻辑分散在各个组件中，难以统一管理。

### 状态管理库 (Redux, Zustand, MobX)

当遇到以下情况时，应考虑引入 Redux、Zustand 或 Recoil 等库：

1.  **全局状态多且更新频繁**：需要更细粒度的性能优化。
2.  **复杂的异步逻辑**：需要统一管理 API 请求和状态变更（如 Redux Thunk/Saga）。
3.  **状态逻辑复杂**：状态之间存在复杂的依赖关系。
4.  **调试需求**：需要时间旅行（Time Travel）调试或详细的日志记录。

---

## 总结

**核心概念总结**：

### 1. 基础通信
- **父 -> 子**：Props
- **子 -> 父**：Callback 函数
- **兄弟组件**：状态提升（Lifting State Up）

### 2. 高级通信
- **跨层级**：Context API
- **父 -> 子（命令式）**：useImperativeHandle + Ref

### 3. 全局状态
- **简单场景**：Context + useReducer
- **复杂场景**：Redux, Zustand, MobX 等第三方库

## 延伸阅读

- [React 官方文档 - 组件间状态共享](https://react.dev/learn/sharing-state-between-components)
- [React 官方文档 - Context](https://react.dev/learn/passing-data-deeply-with-context)
- [Redux 官方文档 - 何时使用 Redux](https://redux.js.org/faq/general#when-should-i-use-redux)
