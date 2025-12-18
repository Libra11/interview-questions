---
title: React 介绍一下 useReducer
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 useReducer 的使用场景、工作原理和最佳实践，掌握如何使用 useReducer 管理复杂的组件状态，以及它与 useState 的区别。
tags:
  - React
  - Hooks
  - useReducer
  - 状态管理
estimatedTime: 22 分钟
keywords:
  - useReducer
  - React Hooks
  - 状态管理
  - reducer
highlight: 掌握 useReducer 的核心概念和使用场景，理解何时选择 useReducer 而非 useState
order: 23
---

## 问题 1：useReducer 是什么？

### 基本概念

`useReducer` 是 React 提供的一个用于管理复杂状态逻辑的 Hook，它是 `useState` 的替代方案。

```jsx
// 基本语法
const [state, dispatch] = useReducer(reducer, initialState);

// 完整示例
function Counter() {
  // reducer 函数：接收当前状态和 action，返回新状态
  function reducer(state, action) {
    switch (action.type) {
      case 'increment':
        return { count: state.count + 1 };
      case 'decrement':
        return { count: state.count - 1 };
      default:
        return state;
    }
  }
  
  // 使用 useReducer
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
```

### 三个核心概念

1. **State（状态）**：当前的状态值
2. **Action（动作）**：描述"发生了什么"的对象
3. **Reducer（归约器）**：根据 action 计算新状态的纯函数

```javascript
// Reducer 的签名
type Reducer<S, A> = (state: S, action: A) => S;

// Action 的常见结构
type Action = {
  type: string;      // 动作类型
  payload?: any;     // 携带的数据（可选）
};
```

---

## 问题 2：useReducer 与 useState 有什么区别？

### 使用场景对比

```jsx
// ❌ useState 管理复杂状态会很混乱
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await submitForm({ name, email, age });
    } catch (err) {
      setErrors(err.errors);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 多个 setState 调用，逻辑分散
}

// ✅ useReducer 集中管理状态逻辑
function Form() {
  function reducer(state, action) {
    switch (action.type) {
      case 'SET_FIELD':
        return {
          ...state,
          [action.field]: action.value,
          errors: { ...state.errors, [action.field]: null }
        };
      case 'SET_ERRORS':
        return { ...state, errors: action.errors, isSubmitting: false };
      case 'SUBMIT_START':
        return { ...state, isSubmitting: true, errors: {} };
      case 'SUBMIT_SUCCESS':
        return { ...state, isSubmitting: false };
      default:
        return state;
    }
  }
  
  const [state, dispatch] = useReducer(reducer, {
    name: '',
    email: '',
    age: 0,
    errors: {},
    isSubmitting: false
  });
  
  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' });
    
    try {
      await submitForm(state);
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (err) {
      dispatch({ type: 'SET_ERRORS', errors: err.errors });
    }
  };
  
  // 状态逻辑集中在 reducer 中，更易维护
}
```

### 何时使用 useReducer

**推荐使用 useReducer 的场景**：

1. **状态逻辑复杂**：多个子值或状态之间有依赖关系
2. **下一个状态依赖前一个状态**：需要基于旧状态计算新状态
3. **状态更新逻辑复杂**：涉及多个步骤或条件判断
4. **需要优化性能**：dispatch 函数是稳定的，不会导致子组件重渲染

```jsx
// useState 适合的场景
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);

// useReducer 适合的场景
const [state, dispatch] = useReducer(reducer, {
  user: null,
  posts: [],
  comments: [],
  loading: false,
  error: null
});
```

---

## 问题 3：useReducer 的工作原理是什么？

### 内部实现机制

```javascript
// React 内部 useReducer 的简化实现
function useReducer(reducer, initialState) {
  // 获取当前 Hook
  const hook = updateWorkInProgressHook();
  
  // 获取当前状态
  let currentState = hook.memoizedState;
  
  // 获取更新队列
  const queue = hook.queue;
  
  // 处理所有待处理的更新
  if (queue.pending !== null) {
    let update = queue.pending.next;
    
    do {
      // 调用 reducer 计算新状态
      const action = update.action;
      currentState = reducer(currentState, action);
      
      update = update.next;
    } while (update !== queue.pending.next);
    
    // 清空队列
    queue.pending = null;
  }
  
  // 保存新状态
  hook.memoizedState = currentState;
  
  // 返回状态和 dispatch 函数
  return [currentState, dispatch];
}

// dispatch 函数的实现
function dispatch(action) {
  // 创建更新对象
  const update = {
    action,
    next: null
  };
  
  // 将更新添加到队列
  const queue = hook.queue;
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;
  
  // 触发重新渲染
  scheduleUpdateOnFiber(currentFiber);
}
```

### 更新队列机制

```javascript
// 更新队列的结构
type Update<A> = {
  action: A,           // action 对象
  next: Update<A>      // 指向下一个更新（环形链表）
};

type UpdateQueue<A> = {
  pending: Update<A> | null,  // 待处理的更新链表
  dispatch: (A) => void       // dispatch 函数
};

// 示例：多次 dispatch 的处理
dispatch({ type: 'increment' });
dispatch({ type: 'increment' });
dispatch({ type: 'decrement' });

// React 会批量处理这些更新
// 最终状态 = reducer(reducer(reducer(initialState, action1), action2), action3)
```

---

## 问题 4：useReducer 的高级用法有哪些？

### 惰性初始化

当初始状态需要复杂计算时，可以使用惰性初始化。

```jsx
// ❌ 每次渲染都会执行复杂计算
function Component({ userId }) {
  const [state, dispatch] = useReducer(
    reducer,
    expensiveComputation(userId) // 每次渲染都执行
  );
}

// ✅ 使用惰性初始化，只在首次渲染时执行
function Component({ userId }) {
  const [state, dispatch] = useReducer(
    reducer,
    userId,                      // 初始参数
    (userId) => {                // init 函数
      return expensiveComputation(userId);
    }
  );
}

// 实际示例
function TodoList({ initialTodos }) {
  function init(initialTodos) {
    return {
      todos: initialTodos,
      filter: 'all',
      nextId: initialTodos.length
    };
  }
  
  const [state, dispatch] = useReducer(reducer, initialTodos, init);
}
```

### 结合 Context 使用

`useReducer` 与 Context 配合可以实现简单的全局状态管理。

```jsx
// 创建 Context
const StateContext = createContext();
const DispatchContext = createContext();

// Provider 组件
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 自定义 Hooks
function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

function useAppDispatch() {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}

// 使用
function TodoList() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  
  return (
    <div>
      {state.todos.map(todo => (
        <div key={todo.id}>
          {todo.text}
          <button onClick={() => dispatch({ type: 'REMOVE', id: todo.id })}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 使用 TypeScript 增强类型安全

```typescript
// 定义 State 类型
type State = {
  count: number;
  user: User | null;
  loading: boolean;
};

// 定义 Action 类型（使用联合类型）
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer 函数
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_USER':
      return { ...state, user: action.payload }; // payload 类型安全
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      // TypeScript 会检查是否处理了所有 action 类型
      const _exhaustiveCheck: never = action;
      return state;
  }
}

// 使用
function Component() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    user: null,
    loading: false
  });
  
  // ✅ 类型安全
  dispatch({ type: 'INCREMENT' });
  dispatch({ type: 'SET_USER', payload: user });
  
  // ❌ TypeScript 会报错
  // dispatch({ type: 'INVALID' });
  // dispatch({ type: 'SET_USER' }); // 缺少 payload
}
```

### 使用 Immer 简化不可变更新

```jsx
import { useImmerReducer } from 'use-immer';

function reducer(draft, action) {
  switch (action.type) {
    case 'ADD_TODO':
      // 直接修改 draft，Immer 会处理不可变更新
      draft.todos.push({
        id: draft.nextId++,
        text: action.text,
        completed: false
      });
      break;
    case 'TOGGLE_TODO':
      const todo = draft.todos.find(t => t.id === action.id);
      if (todo) {
        todo.completed = !todo.completed;
      }
      break;
    case 'REMOVE_TODO':
      const index = draft.todos.findIndex(t => t.id === action.id);
      if (index !== -1) {
        draft.todos.splice(index, 1);
      }
      break;
  }
}

function TodoApp() {
  const [state, dispatch] = useImmerReducer(reducer, {
    todos: [],
    nextId: 1
  });
  
  // 使用方式与 useReducer 相同
}
```

---

## 总结

**核心概念**：

### 1. useReducer 的特点

- 适合管理复杂的状态逻辑
- 将状态更新逻辑集中到 reducer 函数中
- dispatch 函数是稳定的，不会变化
- 可以配合 Context 实现全局状态管理

### 2. 与 useState 的选择

- 简单状态：使用 useState
- 复杂状态：使用 useReducer
- 状态之间有关联：useReducer
- 需要优化性能：useReducer（dispatch 稳定）

### 3. 最佳实践

- 使用 TypeScript 增强类型安全
- 结合 Context 实现状态共享
- 使用惰性初始化优化性能
- 考虑使用 Immer 简化不可变更新

### 4. Reducer 设计原则

- 必须是纯函数
- 不要直接修改 state
- 使用 switch 语句处理不同的 action
- 为 action 定义清晰的类型

## 延伸阅读

- [React 官方文档 - useReducer](https://react.dev/reference/react/useReducer)
- [React 官方文档 - Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [use-immer 库](https://github.com/immerjs/use-immer)
- [TypeScript 与 useReducer](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/hooks#usereducer)
