---
title: 什么是 Declarative（声明式 UI）？
category: React
difficulty: 入门
updatedAt: 2025-12-08
summary: >-
  理解声明式编程与命令式编程的区别，掌握 React 声明式 UI 的设计理念和实际优势。
tags:
  - React
  - 声明式
  - Declarative
  - 编程范式
estimatedTime: 12 分钟
keywords:
  - declarative UI
  - imperative
  - React paradigm
  - UI programming
highlight: 声明式 UI 让你描述"想要什么"，而不是"怎么做"，React 负责处理 DOM 更新的细节。
order: 447
---

## 问题 1：什么是声明式编程？

### 声明式 vs 命令式

**命令式（Imperative）**：告诉计算机**怎么做**，一步步描述过程。

**声明式（Declarative）**：告诉计算机**要什么**，描述期望的结果。

```jsx
// 命令式：手动操作 DOM
function updateCounterImperative(count) {
  const element = document.getElementById("counter");
  element.innerText = `Count: ${count}`;

  if (count > 10) {
    element.classList.add("highlight");
  } else {
    element.classList.remove("highlight");
  }
}

// 声明式：描述 UI 应该是什么样
function Counter({ count }) {
  return <div className={count > 10 ? "highlight" : ""}>Count: {count}</div>;
}
```

### 生活中的类比

```
// 命令式：自己做饭
1. 打开冰箱
2. 拿出食材
3. 切菜
4. 开火
5. 炒菜
6. 装盘

// 声明式：去餐厅点餐
"我要一份宫保鸡丁"
```

---

## 问题 2：React 的声明式体现在哪里？

### 1. 状态驱动视图

你只需要管理状态，React 自动更新 UI。

```jsx
function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    // 只更新状态，不操作 DOM
    setTodos([...todos, { id: Date.now(), text: input }]);
    setInput("");
  };

  // 声明 UI 应该是什么样
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTodo}>添加</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. 条件渲染

直接描述不同状态下的 UI，而不是手动切换。

```jsx
function UserStatus({ isLoggedIn, user }) {
  // 声明式：描述两种状态的 UI
  if (isLoggedIn) {
    return <div>欢迎，{user.name}</div>;
  }
  return <div>请登录</div>;
}

// 命令式写法（不推荐）
function updateUserStatus(isLoggedIn, user) {
  const container = document.getElementById("status");
  if (isLoggedIn) {
    container.innerHTML = `<div>欢迎，${user.name}</div>`;
  } else {
    container.innerHTML = "<div>请登录</div>";
  }
}
```

### 3. 列表渲染

描述列表应该如何映射，而不是手动创建元素。

```jsx
function UserList({ users }) {
  // 声明式：描述数据到 UI 的映射
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <span>{user.name}</span>
          <span>{user.email}</span>
        </li>
      ))}
    </ul>
  );
}
```

---

## 问题 3：声明式 UI 有什么优势？

### 1. 代码更简洁

```jsx
// 命令式：需要处理各种边界情况
function updateList(oldItems, newItems) {
  const list = document.getElementById("list");

  // 删除多余的
  while (list.children.length > newItems.length) {
    list.removeChild(list.lastChild);
  }

  // 更新现有的
  for (let i = 0; i < list.children.length; i++) {
    list.children[i].textContent = newItems[i];
  }

  // 添加新的
  for (let i = list.children.length; i < newItems.length; i++) {
    const li = document.createElement("li");
    li.textContent = newItems[i];
    list.appendChild(li);
  }
}

// 声明式：一行搞定
function List({ items }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
```

### 2. 更容易理解

声明式代码读起来像是在描述 UI 的结构，而不是操作步骤。

```jsx
// 一眼就能看出 UI 结构
function Card({ title, content, footer }) {
  return (
    <div className="card">
      <header>{title}</header>
      <main>{content}</main>
      <footer>{footer}</footer>
    </div>
  );
}
```

### 3. 更少的 Bug

不需要手动同步状态和 UI，减少了出错的可能。

```jsx
// 命令式：容易忘记更新某个地方
function updateUI(state) {
  document.getElementById("count").textContent = state.count;
  document.getElementById("total").textContent = state.total;
  // 忘记更新 average 了...
}

// 声明式：状态变化自动反映到所有地方
function Stats({ count, total }) {
  return (
    <div>
      <span>Count: {count}</span>
      <span>Total: {total}</span>
      <span>Average: {total / count}</span>
    </div>
  );
}
```

---

## 问题 4：声明式的局限性是什么？

### 1. 需要学习新的思维方式

从命令式转向声明式需要适应期。

```jsx
// 习惯命令式的开发者可能会这样写（错误）
function Form() {
  const handleSubmit = () => {
    // ❌ 命令式思维：直接操作 DOM
    document.getElementById("input").value = "";
  };

  // ✅ 声明式思维：通过状态控制
  const [value, setValue] = useState("");
  const handleSubmitCorrect = () => {
    setValue("");
  };
}
```

### 2. 某些场景需要命令式 API

动画、焦点管理、第三方库集成等场景。

```jsx
function AutoFocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    // 命令式操作：聚焦输入框
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

## 总结

**声明式 UI 核心要点**：

### 1. 核心区别

- 命令式：描述"怎么做"
- 声明式：描述"要什么"

### 2. React 的声明式体现

- 状态驱动视图
- 条件渲染
- 列表映射

### 3. 优势

- 代码简洁
- 易于理解
- 减少 Bug

## 延伸阅读

- [React 官方文档 - Describing the UI](https://react.dev/learn/describing-the-ui)
- [Declarative vs Imperative Programming](https://ui.dev/imperative-vs-declarative-programming)
- [React 设计原则](https://legacy.reactjs.org/docs/design-principles.html)
