---
title: Hooks 为什么不能放在条件语句中？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 Hooks 规则背后的原理，掌握为什么 Hooks 必须在组件顶层调用。
tags:
  - React
  - Hooks
  - 规则
  - 原理
estimatedTime: 12 分钟
keywords:
  - hooks rules
  - conditional hooks
  - hooks order
  - linked list
highlight: Hooks 依赖调用顺序来关联状态，条件语句会破坏顺序导致状态错乱。
order: 216
---

## 问题 1：Hooks 的规则是什么？

### 两条核心规则

1. **只在顶层调用 Hook**：不要在循环、条件或嵌套函数中调用
2. **只在 React 函数中调用 Hook**：组件或自定义 Hook 中

```jsx
// ❌ 错误：条件语句中
function Example({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);
  }
}

// ❌ 错误：循环中
function Example({ items }) {
  items.forEach((item) => {
    const [value, setValue] = useState(item);
  });
}

// ✅ 正确：顶层调用
function Example({ condition }) {
  const [count, setCount] = useState(0);

  if (condition) {
    // 使用 count
  }
}
```

---

## 问题 2：为什么有这个限制？

### Hooks 依赖调用顺序

React 通过**调用顺序**来关联每个 Hook 和它的状态。

```jsx
function Form() {
  const [name, setName] = useState(""); // Hook 1
  const [email, setEmail] = useState(""); // Hook 2
  const [age, setAge] = useState(0); // Hook 3
}

// React 内部维护一个链表
// Hook1 (name) -> Hook2 (email) -> Hook3 (age)
```

### 条件语句破坏顺序

```jsx
function Form({ showEmail }) {
  const [name, setName] = useState(""); // Hook 1

  if (showEmail) {
    const [email, setEmail] = useState(""); // Hook 2（可能不执行）
  }

  const [age, setAge] = useState(0); // Hook 3 或 Hook 2？
}

// 首次渲染（showEmail = true）
// Hook1 (name) -> Hook2 (email) -> Hook3 (age)

// 第二次渲染（showEmail = false）
// Hook1 (name) -> Hook2 (age) ← 错位了！
// React 把 age 的值给了 email 的位置
```

---

## 问题 3：React 内部如何存储 Hooks？

### 链表结构

```jsx
// 简化的内部实现
let currentHook = null;

function useState(initialValue) {
  // 获取当前 Hook 节点
  const hook = currentHook || { state: initialValue, next: null };

  // 移动到下一个
  currentHook = hook.next;

  return [hook.state, setState];
}

// 渲染时
function renderComponent() {
  currentHook = fiber.memoizedState; // 从头开始
  const result = Component(); // 执行组件
  return result;
}
```

### 顺序必须一致

```jsx
// 每次渲染，Hook 调用顺序必须相同
// 第 1 次调用 useState → 返回第 1 个状态
// 第 2 次调用 useState → 返回第 2 个状态
// ...
```

---

## 问题 4：如何正确处理条件逻辑？

### 把条件放在 Hook 内部

```jsx
// ❌ 错误
if (condition) {
  useEffect(() => { ... }, []);
}

// ✅ 正确
useEffect(() => {
  if (condition) {
    // 条件逻辑
  }
}, [condition]);
```

### 提前返回要小心

```jsx
// ❌ 错误：提前返回导致 Hook 数量不一致
function Example({ user }) {
  if (!user) {
    return <div>Loading...</div>;
  }

  const [data, setData] = useState(null); // 可能不执行
}

// ✅ 正确：Hook 在条件之前
function Example({ user }) {
  const [data, setData] = useState(null);

  if (!user) {
    return <div>Loading...</div>;
  }

  return <div>{data}</div>;
}
```

### 使用 ESLint 插件

```bash
npm install eslint-plugin-react-hooks
```

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## 总结

**Hooks 规则原理**：

1. **存储方式**：Hooks 状态存储在链表中
2. **关联方式**：通过调用顺序关联
3. **为什么限制**：条件语句会改变调用顺序
4. **解决方案**：把条件放在 Hook 内部

## 延伸阅读

- [Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [React Hooks 原理](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)
