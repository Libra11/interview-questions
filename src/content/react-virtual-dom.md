---
title: 虚拟 DOM 是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解虚拟 DOM 的概念和本质，掌握它在 React 中的作用和工作原理。
tags:
  - React
  - 虚拟DOM
  - Virtual DOM
  - 渲染
estimatedTime: 12 分钟
keywords:
  - virtual DOM
  - React element
  - DOM abstraction
  - reconciliation
highlight: 虚拟 DOM 是真实 DOM 的 JavaScript 对象表示，React 通过它实现高效的 UI 更新。
order: 511
---

## 问题 1：什么是虚拟 DOM？

### 定义

虚拟 DOM（Virtual DOM）是真实 DOM 的**轻量级 JavaScript 对象表示**。

```jsx
// JSX
<div className="container">
  <h1>Hello</h1>
  <p>World</p>
</div>

// 虚拟 DOM（简化）
{
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } }
    ]
  }
}
```

### 虚拟 DOM vs 真实 DOM

```jsx
// 真实 DOM 节点
const div = document.createElement("div");
console.log(div); // 包含大量属性和方法

// 虚拟 DOM 节点
const vdom = { type: "div", props: {} };
console.log(vdom); // 只是普通 JS 对象
```

---

## 问题 2：虚拟 DOM 的工作流程？

### 更新流程

```
状态变化 → 生成新虚拟 DOM → Diff 对比 → 计算最小更新 → 更新真实 DOM
```

### 代码示例

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // 每次 count 变化：
  // 1. 组件重新执行，生成新的虚拟 DOM
  // 2. React 对比新旧虚拟 DOM
  // 3. 只更新变化的部分（这里是文本节点）
  return <div>Count: {count}</div>;
}
```

### 内部过程

```jsx
// 旧虚拟 DOM
{ type: 'div', props: { children: 'Count: 0' } }

// 新虚拟 DOM
{ type: 'div', props: { children: 'Count: 1' } }

// Diff 结果：只需更新文本内容
// 真实 DOM 操作：textNode.textContent = 'Count: 1'
```

---

## 问题 3：为什么需要虚拟 DOM？

### 1. 跨平台抽象

```jsx
// 同一份代码，不同渲染目标
function App() {
  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}

// react-dom → 浏览器 DOM
// react-native → iOS/Android 原生组件
// react-three-fiber → WebGL 3D 场景
```

### 2. 声明式编程

```jsx
// 不需要手动操作 DOM
function TodoList({ todos }) {
  // 只描述 UI 应该是什么样
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
// React 负责计算如何更新
```

### 3. 批量更新

```jsx
function handleClick() {
  setA(1);
  setB(2);
  setC(3);
  // React 会批量处理，只触发一次 DOM 更新
}
```

---

## 问题 4：虚拟 DOM 的结构是什么？

### React Element

```jsx
// React.createElement 返回的对象
const element = {
  $$typeof: Symbol.for("react.element"), // 类型标识
  type: "div", // 标签名或组件
  key: null, // 列表 key
  ref: null, // ref 引用
  props: {
    // 属性
    className: "container",
    children: "Hello",
  },
};
```

### 组件的虚拟 DOM

```jsx
function Button({ children }) {
  return <button>{children}</button>;
}

// <Button>Click</Button> 的虚拟 DOM
{
  type: Button,  // 函数引用
  props: { children: 'Click' }
}

// React 调用 Button(props) 得到：
{
  type: 'button',
  props: { children: 'Click' }
}
```

## 总结

**虚拟 DOM 核心要点**：

1. **本质**：描述 UI 的 JavaScript 对象
2. **作用**：跨平台抽象、声明式编程、批量更新
3. **流程**：状态变化 → 新虚拟 DOM → Diff → 最小更新

## 延伸阅读

- [React 官方文档 - 渲染元素](https://react.dev/learn/rendering-lists)
- [Virtual DOM 详解](https://legacy.reactjs.org/docs/faq-internals.html)
