---
title: 为什么 React 中元素是不可变的？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 元素不可变性的设计原因，掌握不可变数据在 React 中的重要性和实际应用。
tags:
  - React
  - 不可变性
  - Immutable
  - 元素
estimatedTime: 15 分钟
keywords:
  - React immutable
  - immutable elements
  - React element
  - state immutability
highlight: React 元素是不可变的快照，一旦创建就不能修改，这是 React 高效更新和可预测性的基础。
order: 204
---

## 问题 1：什么是 React 元素？

### React 元素的本质

React 元素是描述 UI 的**普通 JavaScript 对象**。

```jsx
// JSX
const element = <h1 className="title">Hello</h1>;

// 实际上是一个对象
const element = {
  type: "h1",
  props: {
    className: "title",
    children: "Hello",
  },
  key: null,
  ref: null,
};
```

### 元素 vs 组件

```jsx
// 元素：描述你想在屏幕上看到什么（对象）
const element = <Button color="blue" />;

// 组件：返回元素的函数或类
function Button({ color, children }) {
  return <button className={color}>{children}</button>;
}
```

---

## 问题 2：为什么元素是不可变的？

### 元素是 UI 的快照

React 元素描述的是**某一时刻**的 UI 状态，就像电影的一帧。

```jsx
function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date()); // 创建新元素，而不是修改旧元素
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 每次渲染都创建新的元素
  return <div>{time.toLocaleTimeString()}</div>;
}
```

### 不可变的好处

**1. 简化比较**

```jsx
// 如果元素可变，需要深度比较
// 如果元素不可变，只需要比较引用
if (prevElement !== nextElement) {
  // 需要更新
}
```

**2. 可预测性**

```jsx
// 元素一旦创建，就不会改变
const element = <div>Hello</div>;

// 不能这样做（也不应该这样做）
element.props.children = "World"; // ❌ 错误
```

**3. 支持并发渲染**

React 18 的并发特性依赖于不可变性，可以安全地中断和恢复渲染。

---

## 问题 3：状态的不可变性为什么重要？

### 错误示例：直接修改状态

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "学习 React", done: false },
  ]);

  const toggleTodo = (id) => {
    // ❌ 错误：直接修改状态
    const todo = todos.find((t) => t.id === id);
    todo.done = !todo.done;
    setTodos(todos); // React 检测不到变化！
  };
}
```

### 正确示例：创建新状态

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "学习 React", done: false },
  ]);

  const toggleTodo = (id) => {
    // ✅ 正确：创建新数组和新对象
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };
}
```

### 为什么 React 检测不到直接修改？

```jsx
// React 使用浅比较
const prevTodos = todos;
todos[0].done = true;
const nextTodos = todos;

prevTodos === nextTodos; // true，引用相同
// React 认为没有变化，不会重新渲染
```

---

## 问题 4：如何正确更新不可变数据？

### 更新对象

```jsx
const [user, setUser] = useState({ name: "John", age: 25 });

// ❌ 错误
user.age = 26;
setUser(user);

// ✅ 正确：展开运算符
setUser({ ...user, age: 26 });

// ✅ 正确：函数式更新
setUser((prev) => ({ ...prev, age: prev.age + 1 }));
```

### 更新嵌套对象

```jsx
const [state, setState] = useState({
  user: {
    name: "John",
    address: { city: "Beijing" },
  },
});

// ✅ 更新嵌套属性
setState((prev) => ({
  ...prev,
  user: {
    ...prev.user,
    address: {
      ...prev.user.address,
      city: "Shanghai",
    },
  },
}));
```

### 更新数组

```jsx
const [items, setItems] = useState([1, 2, 3]);

// 添加元素
setItems([...items, 4]);

// 删除元素
setItems(items.filter((item) => item !== 2));

// 更新元素
setItems(items.map((item) => (item === 2 ? 20 : item)));

// 插入元素
const index = 1;
setItems([...items.slice(0, index), "new", ...items.slice(index)]);
```

---

## 问题 5：不可变性对性能优化有什么影响？

### React.memo 依赖不可变性

```jsx
const TodoItem = React.memo(function TodoItem({ todo, onToggle }) {
  console.log('TodoItem rendered');
  return (
    <li onClick={() => onToggle(todo.id)}>
      {todo.text}
    </li>
  );
});

function TodoList() {
  const [todos, setTodos] = useState([...]);

  const toggleTodo = (id) => {
    // ✅ 只有被修改的 todo 会触发对应 TodoItem 重新渲染
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, done: !todo.done }  // 新对象
        : todo  // 保持原引用
    ));
  };

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
      ))}
    </ul>
  );
}
```

### 结构共享

不可变更新可以共享未变化的部分：

```jsx
const oldState = {
  user: { name: "John" },
  settings: { theme: "dark" },
};

const newState = {
  ...oldState,
  user: { ...oldState.user, name: "Jane" },
};

// settings 对象被共享，没有额外内存开销
oldState.settings === newState.settings; // true
```

## 总结

**不可变性核心要点**：

### 1. React 元素

- 元素是 UI 的快照
- 一旦创建不能修改
- 更新 UI 就是创建新元素

### 2. 状态不可变性

- 不要直接修改 state
- 使用展开运算符创建新对象/数组
- React 依赖引用比较检测变化

### 3. 好处

- 简化变化检测
- 支持性能优化（memo）
- 支持并发渲染
- 可预测的数据流

## 延伸阅读

- [React 官方文档 - 更新 state 中的对象](https://react.dev/learn/updating-objects-in-state)
- [React 官方文档 - 更新 state 中的数组](https://react.dev/learn/updating-arrays-in-state)
- [Immer 库](https://immerjs.github.io/immer/)
