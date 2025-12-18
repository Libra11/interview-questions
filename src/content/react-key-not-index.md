---
title: 为什么数组的 index 不适合作为 key？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解使用数组索引作为 key 的问题和正确的 key 选择方式。
tags:
  - React
  - key
  - 列表渲染
  - 性能
estimatedTime: 10 分钟
keywords:
  - key index
  - list key
  - React key
  - reconciliation
highlight: 使用 index 作为 key 在列表变化时会导致错误的组件复用、状态混乱和性能问题。
order: 688
---

## 问题 1：key 的作用

### Diff 算法中的身份标识

```jsx
// key 帮助 React 识别哪些元素变化了
<ul>
  <li key="a">A</li>
  <li key="b">B</li>
  <li key="c">C</li>
</ul>

// 当列表变化时，React 通过 key 判断：
// - 哪些元素是新增的
// - 哪些元素被删除
// - 哪些元素只是移动了位置
```

---

## 问题 2：使用 index 的问题

### 问题 1：列表重排序

```jsx
// 初始状态
const items = ["A", "B", "C"];
// 渲染：
// <li key={0}>A</li>
// <li key={1}>B</li>
// <li key={2}>C</li>

// 在开头插入 'D'
const items = ["D", "A", "B", "C"];
// 渲染：
// <li key={0}>D</li>  ← React 认为 key=0 的内容从 A 变成 D
// <li key={1}>A</li>  ← React 认为 key=1 的内容从 B 变成 A
// <li key={2}>B</li>  ← ...
// <li key={3}>C</li>  ← 新增

// 结果：所有元素都被"更新"，而不是只插入一个
```

### 问题 2：状态混乱

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { text: "Learn React" },
    { text: "Build App" },
  ]);

  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem key={index} todo={todo} />
      ))}
    </ul>
  );
}

function TodoItem({ todo }) {
  const [checked, setChecked] = useState(false);

  return (
    <li>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      {todo.text}
    </li>
  );
}

// 勾选第一个 todo
// 然后删除第一个 todo
// 结果：第二个 todo 变成勾选状态！
// 因为 key=0 的组件被复用了，状态保留
```

---

## 问题 3：性能问题

### 不必要的 DOM 操作

```jsx
// 使用 index
['A', 'B', 'C'] → ['D', 'A', 'B', 'C']
// React 认为：
// key=0: A→D (更新)
// key=1: B→A (更新)
// key=2: C→B (更新)
// key=3: 新增 C
// 共 4 次 DOM 操作

// 使用唯一 id
[{id:1,'A'}, {id:2,'B'}, {id:3,'C'}] → [{id:4,'D'}, {id:1,'A'}, {id:2,'B'}, {id:3,'C'}]
// React 认为：
// key=4: 新增 D
// key=1,2,3: 位置移动（不需要更新内容）
// 共 1 次 DOM 插入
```

---

## 问题 4：什么时候可以用 index？

### 安全使用的条件

```jsx
// 满足以下所有条件时可以使用 index：
// 1. 列表是静态的，不会变化
// 2. 列表不会被重新排序
// 3. 列表不会被过滤
// 4. 列表项没有自己的状态

// 例如：静态导航菜单
const navItems = ["Home", "About", "Contact"];

function Nav() {
  return (
    <nav>
      {navItems.map((item, index) => (
        <a key={index} href={`/${item.toLowerCase()}`}>
          {item}
        </a>
      ))}
    </nav>
  );
}
```

---

## 问题 5：正确的 key 选择

### 使用唯一标识

```jsx
// 最佳：使用数据的唯一 ID
{
  items.map((item) => <Item key={item.id} data={item} />);
}

// 可以：使用唯一的业务字段
{
  users.map((user) => <User key={user.email} data={user} />);
}

// 临时方案：生成唯一 ID
const itemsWithId = items.map((item, index) => ({
  ...item,
  id: item.id || `temp-${index}-${Date.now()}`,
}));
```

### 不要这样做

```jsx
// ❌ 使用 Math.random()
{
  items.map((item) => <Item key={Math.random()} data={item} />);
}
// 每次渲染都是新 key，所有组件都会重新创建

// ❌ 使用 index（在动态列表中）
{
  items.map((item, index) => <Item key={index} data={item} />);
}
```

## 总结

| 场景           | 使用 index | 使用唯一 ID |
| -------------- | ---------- | ----------- |
| 静态列表       | ✅         | ✅          |
| 动态列表       | ❌         | ✅          |
| 有状态的列表项 | ❌         | ✅          |
| 可排序列表     | ❌         | ✅          |

**原则**：优先使用数据的唯一标识作为 key。

## 延伸阅读

- [React key 文档](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
