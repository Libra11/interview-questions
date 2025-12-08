---
title: JSX 为什么不是 HTML？
category: React
difficulty: 入门
updatedAt: 2025-12-08
summary: >-
  理解 JSX 的本质是 JavaScript 语法扩展，掌握 JSX 与 HTML 的关键区别以及编译原理。
tags:
  - React
  - JSX
  - JavaScript
  - 编译
estimatedTime: 12 分钟
keywords:
  - JSX
  - React.createElement
  - Babel
  - JavaScript syntax
highlight: JSX 是 JavaScript 的语法扩展，会被编译成 React.createElement 调用，而不是真正的 HTML。
order: 203
---

## 问题 1：JSX 的本质是什么？

### JSX 是 JavaScript

JSX 看起来像 HTML，但它是 **JavaScript 的语法扩展**。

```jsx
// 这是 JSX
const element = <h1 className="title">Hello</h1>;

// 编译后的 JavaScript
const element = React.createElement("h1", { className: "title" }, "Hello");
```

### 编译过程

JSX 需要通过 Babel 等工具编译才能运行：

```jsx
// 编译前（JSX）
function App() {
  return (
    <div>
      <h1>标题</h1>
      <p>内容</p>
    </div>
  );
}

// 编译后（JavaScript）
function App() {
  return React.createElement(
    "div",
    null,
    React.createElement("h1", null, "标题"),
    React.createElement("p", null, "内容")
  );
}
```

---

## 问题 2：JSX 和 HTML 有哪些语法区别？

### 1. 属性命名

```jsx
// HTML
<div class="container" tabindex="1" for="input"></div>

// JSX - 使用 camelCase
<div className="container" tabIndex="1" htmlFor="input"></div>
```

**原因**：`class` 和 `for` 是 JavaScript 保留字。

### 2. 样式写法

```jsx
// HTML
<div style="color: red; font-size: 16px;"></div>

// JSX - 使用对象
<div style={{ color: 'red', fontSize: '16px' }}></div>
// 或
<div style={{ color: 'red', fontSize: 16 }}></div>
```

### 3. 事件处理

```jsx
// HTML
<button onclick="handleClick()">点击</button>

// JSX - camelCase + 函数引用
<button onClick={handleClick}>点击</button>
<button onClick={() => console.log('clicked')}>点击</button>
```

### 4. 自闭合标签

```jsx
// HTML - 可以不闭合
<input type="text">
<img src="logo.png">
<br>

// JSX - 必须闭合
<input type="text" />
<img src="logo.png" />
<br />
```

### 5. 布尔属性

```jsx
// HTML
<input disabled>
<input disabled="disabled">

// JSX
<input disabled />
<input disabled={true} />
<input disabled={false} />  // 不会渲染 disabled 属性
```

---

## 问题 3：为什么 JSX 中可以写 JavaScript 表达式？

### 花括号语法

JSX 中的 `{}` 可以嵌入任何 JavaScript 表达式：

```jsx
function Greeting({ user, items }) {
  return (
    <div>
      {/* 变量 */}
      <h1>Hello, {user.name}</h1>

      {/* 表达式 */}
      <p>Total: {items.length * 10}</p>

      {/* 函数调用 */}
      <p>Date: {new Date().toLocaleDateString()}</p>

      {/* 三元表达式 */}
      <p>{user.isAdmin ? "管理员" : "普通用户"}</p>

      {/* 数组映射 */}
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 为什么可以这样？

因为 JSX 编译后就是 JavaScript：

```jsx
// JSX
<p>Count: {count}</p>;

// 编译后
React.createElement("p", null, "Count: ", count);
```

`count` 就是普通的 JavaScript 变量。

---

## 问题 4：JSX 的编译原理是什么？

### React 17 之前

需要显式导入 React：

```jsx
import React from "react";

// JSX
const element = <div>Hello</div>;

// 编译为
const element = React.createElement("div", null, "Hello");
```

### React 17+ 新转换

不需要导入 React：

```jsx
// JSX
const element = <div>Hello</div>;

// 编译为（自动导入）
import { jsx as _jsx } from "react/jsx-runtime";
const element = _jsx("div", { children: "Hello" });
```

### createElement 的结构

```jsx
React.createElement(
  type,       // 标签名或组件
  props,      // 属性对象
  ...children // 子元素
)

// 返回一个对象（虚拟 DOM 节点）
{
  type: 'div',
  props: {
    className: 'container',
    children: 'Hello'
  },
  key: null,
  ref: null
}
```

---

## 问题 5：JSX 有哪些常见陷阱？

### 1. 返回多个元素

```jsx
// ❌ 错误：多个根元素
function App() {
  return (
    <h1>标题</h1>
    <p>内容</p>
  );
}

// ✅ 正确：使用 Fragment
function App() {
  return (
    <>
      <h1>标题</h1>
      <p>内容</p>
    </>
  );
}
```

### 2. 条件渲染的陷阱

```jsx
// ❌ 可能渲染 0
function List({ items }) {
  return <div>{items.length && <ul>...</ul>}</div>;
}
// 当 items.length 为 0 时，会渲染数字 0

// ✅ 正确
function List({ items }) {
  return <div>{items.length > 0 && <ul>...</ul>}</div>;
}
```

### 3. 注释写法

```jsx
function App() {
  return (
    <div>
      {/* 这是 JSX 中的注释 */}
      <h1>Hello</h1>
    </div>
  );
}
```

### 4. 动态标签名

```jsx
// ❌ 错误
function Icon({ name }) {
  return <name />; // 会被当作 HTML 标签
}

// ✅ 正确：首字母大写
function Icon({ name }) {
  const IconComponent = icons[name];
  return <IconComponent />;
}
```

## 总结

**JSX 核心要点**：

### 1. 本质

- JSX 是 JavaScript 语法扩展
- 编译为 `React.createElement` 调用

### 2. 与 HTML 的区别

- 属性名使用 camelCase
- `class` → `className`
- 样式使用对象
- 必须闭合标签

### 3. 特性

- `{}` 中可以写 JavaScript 表达式
- 需要单一根元素
- 组件名必须大写

## 延伸阅读

- [React 官方文档 - JSX](https://react.dev/learn/writing-markup-with-jsx)
- [Babel JSX 转换](https://babeljs.io/docs/babel-plugin-transform-react-jsx)
- [React 17 新 JSX 转换](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
