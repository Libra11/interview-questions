---
title: 为什么 onClick 写成 onClick={() => fn()} 而不是 fn()？
category: React
difficulty: 入门
updatedAt: 2025-12-08
summary: >-
  理解 React 事件处理函数的正确写法，避免常见的事件绑定错误。
tags:
  - React
  - 事件
  - onClick
  - 函数调用
estimatedTime: 8 分钟
keywords:
  - onClick
  - event handler
  - arrow function
  - function reference
highlight: onClick 需要传递函数引用，而不是函数调用结果。fn() 会立即执行，() => fn() 传递的是函数。
order: 562
---

## 问题 1：两种写法的区别？

### 错误写法：fn()

```jsx
function App() {
  const handleClick = () => {
    console.log("clicked");
  };

  // ❌ 错误：fn() 会立即执行
  return <button onClick={handleClick()}>Click</button>;
}

// 组件渲染时就会打印 "clicked"
// 点击按钮不会有任何反应
```

### 正确写法：fn 或 () => fn()

```jsx
function App() {
  const handleClick = () => {
    console.log("clicked");
  };

  // ✅ 正确：传递函数引用
  return <button onClick={handleClick}>Click</button>;

  // ✅ 也正确：传递箭头函数
  return <button onClick={() => handleClick()}>Click</button>;
}
```

---

## 问题 2：为什么会这样？

### onClick 期望的是函数

```jsx
// onClick 的类型
onClick: (event: MouseEvent) => void

// 传递函数引用 ✅
onClick={handleClick}  // handleClick 是函数

// 传递函数调用结果 ❌
onClick={handleClick()}  // handleClick() 返回 undefined
```

### 执行时机

```jsx
// handleClick：渲染时不执行，点击时执行
<button onClick={handleClick}>

// handleClick()：渲染时立即执行，返回值传给 onClick
<button onClick={handleClick()}>
// 等价于
<button onClick={undefined}>
```

---

## 问题 3：什么时候用箭头函数？

### 需要传参数时

```jsx
function List({ items }) {
  const handleClick = (id) => {
    console.log("clicked:", id);
  };

  return (
    <ul>
      {items.map((item) => (
        // 需要传递 item.id，所以用箭头函数
        <li key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 不需要参数时

```jsx
function Button() {
  const handleClick = () => {
    console.log("clicked");
  };

  // 两种都可以，直接传引用更简洁
  return <button onClick={handleClick}>Click</button>;
  // 或
  return <button onClick={() => handleClick()}>Click</button>;
}
```

---

## 问题 4：箭头函数的性能问题？

### 每次渲染创建新函数

```jsx
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        // 每次渲染都创建新的箭头函数
        <li key={item.id} onClick={() => handleClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 优化方案

```jsx
// 方案 1：使用 useCallback（通常不必要）
const handleClick = useCallback((id) => {
  console.log(id);
}, []);

// 方案 2：使用 data 属性
function List({ items }) {
  const handleClick = (e) => {
    const id = e.currentTarget.dataset.id;
    console.log(id);
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} data-id={item.id} onClick={handleClick}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### 实际建议

```jsx
// 大多数情况下，箭头函数的性能影响可以忽略
// 只有在以下情况才需要优化：
// 1. 列表非常长（1000+）
// 2. 子组件使用了 React.memo
// 3. 实际测量发现性能问题
```

## 总结

| 写法                   | 含义           | 结果          |
| ---------------------- | -------------- | ------------- |
| `onClick={fn}`         | 传递函数引用   | ✅ 点击时执行 |
| `onClick={() => fn()}` | 传递箭头函数   | ✅ 点击时执行 |
| `onClick={fn()}`       | 传递函数返回值 | ❌ 渲染时执行 |

## 延伸阅读

- [React 事件处理](https://react.dev/learn/responding-to-events)
- [传递参数给事件处理函数](https://react.dev/learn/responding-to-events#passing-arguments-to-event-handlers)
