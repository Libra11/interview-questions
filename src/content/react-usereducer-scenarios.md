---
title: useReducer 适合什么场景？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 useReducer 的适用场景，掌握何时选择 useReducer 而不是 useState。
tags:
  - React
  - Hooks
  - useReducer
  - 状态管理
estimatedTime: 15 分钟
keywords:
  - useReducer
  - reducer pattern
  - complex state
  - state management
highlight: useReducer 适合复杂状态逻辑、多个相关状态、需要可预测状态更新的场景。
order: 214
---

## 问题 1：useReducer 的基本用法？

### 语法

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

### 基本示例

```jsx
// reducer 函数
function counterReducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </>
  );
}
```

---

## 问题 2：什么时候用 useReducer？

### 1. 复杂的状态逻辑

```jsx
// ❌ useState：逻辑分散
function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setErrors({});
    // ...
  };
}

// ✅ useReducer：逻辑集中
function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, errors: {} };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, errors: action.errors };
    default:
      return state;
  }
}

function Form() {
  const [state, dispatch] = useReducer(formReducer, {
    name: "",
    email: "",
    errors: {},
    isSubmitting: false,
  });
}
```

### 2. 多个相关状态

```jsx
// 购物车状态
function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM":
      return {
        items: [...state.items, action.item],
        total: state.total + action.item.price,
      };
    case "REMOVE_ITEM":
      const item = state.items.find((i) => i.id === action.id);
      return {
        items: state.items.filter((i) => i.id !== action.id),
        total: state.total - item.price,
      };
    case "CLEAR":
      return { items: [], total: 0 };
    default:
      return state;
  }
}
```

### 3. 下一个状态依赖前一个状态

```jsx
function todoReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [...state, { id: Date.now(), text: action.text, done: false }];
    case "TOGGLE":
      return state.map((todo) =>
        todo.id === action.id ? { ...todo, done: !todo.done } : todo
      );
    case "DELETE":
      return state.filter((todo) => todo.id !== action.id);
    default:
      return state;
  }
}
```

---

## 问题 3：useReducer vs useState？

### 对比

| 场景             | useState          | useReducer       |
| ---------------- | ----------------- | ---------------- |
| 简单状态         | ✅ 推荐           | 可以但没必要     |
| 复杂状态逻辑     | 逻辑分散          | ✅ 推荐          |
| 多个相关状态     | 需要多次 setState | ✅ 一次 dispatch |
| 状态更新可预测性 | 一般              | ✅ 更好          |
| 测试             | 一般              | ✅ 更容易        |

### 选择原则

```jsx
// ✅ 用 useState：简单独立的状态
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);

// ✅ 用 useReducer：复杂关联的状态
const [state, dispatch] = useReducer(reducer, {
  items: [],
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
});
```

---

## 问题 4：useReducer 的高级用法？

### 惰性初始化

```jsx
function init(initialCount) {
  return { count: initialCount };
}

function Counter({ initialCount }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);
  // init 函数只在初始渲染时调用
}
```

### 配合 Context 使用

```jsx
const TodoContext = createContext();

function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);

  return (
    <TodoContext.Provider value={{ todos, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}

function TodoList() {
  const { todos, dispatch } = useContext(TodoContext);
  // ...
}
```

## 总结

**useReducer 适用场景**：

1. **复杂状态逻辑**：多种更新方式
2. **多个相关状态**：需要同时更新
3. **可预测性要求高**：状态变化集中管理
4. **便于测试**：reducer 是纯函数

**选择原则**：简单用 useState，复杂用 useReducer。

## 延伸阅读

- [useReducer 文档](https://react.dev/reference/react/useReducer)
- [从 useState 迁移到 useReducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
