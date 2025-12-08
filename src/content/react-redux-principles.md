---
title: Redux 的核心三个原则是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 Redux 的三大核心原则：单一数据源、状态只读、纯函数修改。
tags:
  - React
  - Redux
  - 状态管理
  - 原则
estimatedTime: 12 分钟
keywords:
  - Redux principles
  - single source of truth
  - immutable state
  - pure reducer
highlight: Redux 三原则：单一数据源、状态只读、使用纯函数修改，保证状态变化可预测。
order: 233
---

## 问题 1：三大原则是什么？

### 1. 单一数据源（Single Source of Truth）

整个应用的状态存储在**一个 store** 中。

```jsx
// 整个应用只有一个 store
const store = createStore(rootReducer);

// store 包含所有状态
{
  user: { name: 'John', isLoggedIn: true },
  todos: [{ id: 1, text: 'Learn Redux' }],
  settings: { theme: 'dark' }
}
```

### 2. 状态只读（State is Read-Only）

唯一改变状态的方式是**派发 action**。

```jsx
// ❌ 不能直接修改
store.getState().todos.push(newTodo);

// ✅ 必须派发 action
store.dispatch({
  type: "ADD_TODO",
  payload: { id: 2, text: "New Todo" },
});
```

### 3. 纯函数修改（Changes with Pure Functions）

Reducer 必须是**纯函数**。

```jsx
// reducer 是纯函数
function todosReducer(state = [], action) {
  switch (action.type) {
    case "ADD_TODO":
      // 返回新数组，不修改原数组
      return [...state, action.payload];
    default:
      return state;
  }
}
```

---

## 问题 2：为什么需要单一数据源？

### 好处

```jsx
// 1. 状态可追踪
console.log(store.getState()); // 查看整个应用状态

// 2. 便于调试
// Redux DevTools 可以查看完整状态树

// 3. 服务端渲染
// 可以序列化整个状态，传递给客户端
const preloadedState = window.__PRELOADED_STATE__;
const store = createStore(reducer, preloadedState);

// 4. 持久化
localStorage.setItem("state", JSON.stringify(store.getState()));
```

---

## 问题 3：为什么状态必须只读？

### 可预测性

```jsx
// 所有状态变化都通过 action
// 可以记录每一次变化

// Action 日志
[
  { type: "ADD_TODO", payload: { text: "Learn Redux" } },
  { type: "TOGGLE_TODO", payload: { id: 1 } },
  { type: "DELETE_TODO", payload: { id: 1 } },
];

// 可以：
// - 回放操作
// - 时间旅行调试
// - 撤销/重做
```

### 变化检测

```jsx
// 不可变更新让变化检测变得简单
if (prevState !== nextState) {
  // 状态变化了，需要更新 UI
}
```

---

## 问题 4：为什么 reducer 必须是纯函数？

### 纯函数的特点

```jsx
// 1. 相同输入 → 相同输出
function add(a, b) {
  return a + b; // 永远返回相同结果
}

// 2. 无副作用
// ❌ 不纯：有副作用
function impureReducer(state, action) {
  fetch("/api"); // 副作用
  state.count++; // 修改输入
  return state;
}

// ✅ 纯函数
function pureReducer(state, action) {
  return { ...state, count: state.count + 1 };
}
```

### 好处

```jsx
// 1. 可测试
expect(reducer({ count: 0 }, { type: "INCREMENT" })).toEqual({ count: 1 });

// 2. 可预测
// 给定相同的 state 和 action，永远得到相同结果

// 3. 支持时间旅行
// 可以重放任意 action 序列
```

---

## 问题 5：实际代码示例？

### 完整示例

```jsx
// Action Types
const ADD_TODO = "ADD_TODO";
const TOGGLE_TODO = "TOGGLE_TODO";

// Action Creators
const addTodo = (text) => ({
  type: ADD_TODO,
  payload: { id: Date.now(), text, completed: false },
});

// Reducer（纯函数）
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    case TOGGLE_TODO:
      return state.map((todo) =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    default:
      return state;
  }
}

// Store（单一数据源）
const store = createStore(todosReducer);

// 使用（状态只读，通过 dispatch 修改）
store.dispatch(addTodo("Learn Redux"));
```

## 总结

| 原则       | 说明                 | 好处               |
| ---------- | -------------------- | ------------------ |
| 单一数据源 | 一个 store           | 可追踪、可调试     |
| 状态只读   | 只能通过 action 修改 | 可预测、可回放     |
| 纯函数修改 | reducer 是纯函数     | 可测试、可时间旅行 |

## 延伸阅读

- [Redux 三大原则](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [Redux 基础教程](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
