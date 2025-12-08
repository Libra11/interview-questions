---
title: key 的作用是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 中 key 的作用，掌握为什么不能用 index 作为 key 以及正确的 key 选择。
tags:
  - React
  - Key
  - 列表渲染
  - Diff
estimatedTime: 12 分钟
keywords:
  - React key
  - list rendering
  - key prop
  - index key problem
highlight: key 帮助 React 识别列表中哪些元素变化了，是 Diff 算法高效工作的关键。
order: 222
---

## 问题 1：key 的作用是什么？

### 身份标识

key 是元素在列表中的**唯一身份标识**，帮助 React 追踪元素。

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### 没有 key 的问题

```jsx
// 没有 key，React 按索引比较
// 旧：[A, B, C]
// 新：[B, C, A]

// React 认为：
// 索引0: A内容 → B内容（更新）
// 索引1: B内容 → C内容（更新）
// 索引2: C内容 → A内容（更新）
// 三个都要更新！
```

### 有 key 的优化

```jsx
// 有 key，React 按 key 匹配
// 旧：[A:1, B:2, C:3]
// 新：[B:2, C:3, A:1]

// React 认为：
// key=1 的 A 移动到末尾
// key=2 的 B 移动到开头
// key=3 的 C 位置不变
// 只需要移动，不需要更新内容！
```

---

## 问题 2：为什么不能用 index 作为 key？

### 问题场景

```jsx
// ❌ 使用 index 作为 key
{
  items.map((item, index) => <Item key={index} data={item} />);
}
```

### 问题 1：列表重排序

```jsx
// 原列表：[A, B, C]，index：[0, 1, 2]
// 新列表：[C, A, B]，index：[0, 1, 2]

// key 没变（都是 0,1,2），但内容变了
// React 会更新所有元素的内容，而不是移动
```

### 问题 2：状态错乱

```jsx
function Item({ data }) {
  const [checked, setChecked] = useState(false);
  return <input type="checkbox" checked={checked} />;
}

// 如果删除第一项：
// 原：[A:0, B:1, C:2]
// 新：[B:0, C:1]

// B 继承了 A 的状态（key=0）
// C 继承了 B 的状态（key=1）
// 状态全乱了！
```

---

## 问题 3：什么是好的 key？

### 好的 key 特征

1. **稳定**：不随渲染变化
2. **唯一**：在兄弟节点中唯一
3. **可预测**：相同数据产生相同 key

```jsx
// ✅ 好的 key：数据库 ID
{
  users.map((user) => <User key={user.id} data={user} />);
}

// ✅ 好的 key：唯一业务标识
{
  products.map((p) => <Product key={p.sku} data={p} />);
}

// ❌ 差的 key：随机数
{
  items.map((item) => <Item key={Math.random()} />);
}

// ❌ 差的 key：索引（大多数情况）
{
  items.map((item, i) => <Item key={i} />);
}
```

### 什么时候可以用 index？

```jsx
// ✅ 可以用 index：静态列表，不会重排序、增删
const tabs = ["首页", "产品", "关于"];
{
  tabs.map((tab, i) => <Tab key={i}>{tab}</Tab>);
}
```

---

## 问题 4：key 的其他用途？

### 强制重新挂载组件

```jsx
function App() {
  const [userId, setUserId] = useState(1);

  // 改变 key 会卸载旧组件，挂载新组件
  return <UserProfile key={userId} userId={userId} />;
}

// userId 变化时，UserProfile 完全重置
// 所有状态清空，effect 重新执行
```

### 重置表单状态

```jsx
function EditForm({ recordId }) {
  // key 变化时，表单状态重置
  return (
    <form key={recordId}>
      <input defaultValue="" />
    </form>
  );
}
```

## 总结

**key 核心要点**：

| 方面     | 说明                       |
| -------- | -------------------------- |
| 作用     | 帮助 React 识别元素身份    |
| 好的 key | 稳定、唯一、可预测         |
| 避免     | 随机数、大多数情况的 index |
| 额外用途 | 强制重新挂载组件           |

## 延伸阅读

- [React 官方文档 - 列表和 Key](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [Index as Key 反模式](https://robinpokorny.com/blog/index-as-a-key-is-an-anti-pattern/)
