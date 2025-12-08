---
title: 如何阻止事件冒泡？
category: React
difficulty: 入门
updatedAt: 2025-12-08
summary: >-
  掌握 React 中阻止事件冒泡的方法，理解合成事件与原生事件的冒泡差异。
tags:
  - React
  - 事件
  - 冒泡
  - stopPropagation
estimatedTime: 8 分钟
keywords:
  - stopPropagation
  - event bubbling
  - prevent bubbling
  - React events
highlight: 使用 e.stopPropagation() 阻止合成事件冒泡，但注意它不能阻止原生事件。
order: 241
---

## 问题 1：如何阻止 React 事件冒泡？

### 使用 stopPropagation

```jsx
function Child() {
  const handleClick = (e) => {
    e.stopPropagation(); // 阻止冒泡
    console.log("child clicked");
  };

  return <button onClick={handleClick}>Click</button>;
}

function Parent() {
  return (
    <div onClick={() => console.log("parent clicked")}>
      <Child />
    </div>
  );
}

// 点击按钮：只输出 "child clicked"
// parent 的 onClick 不会触发
```

---

## 问题 2：stopPropagation vs preventDefault？

### stopPropagation

阻止事件**向上冒泡**。

```jsx
function handleClick(e) {
  e.stopPropagation();
  // 父元素的 onClick 不会触发
}
```

### preventDefault

阻止**默认行为**。

```jsx
function handleSubmit(e) {
  e.preventDefault();  // 阻止表单提交
  // 自定义处理
}

function handleClick(e) {
  e.preventDefault();  // 阻止链接跳转
}

<form onSubmit={handleSubmit}>...</form>
<a href="/page" onClick={handleClick}>Link</a>
```

### 同时使用

```jsx
function handleClick(e) {
  e.stopPropagation(); // 不冒泡
  e.preventDefault(); // 不执行默认行为
}
```

---

## 问题 3：合成事件 vs 原生事件的冒泡？

### 合成事件的 stopPropagation

```jsx
function App() {
  return (
    <div onClick={() => console.log("div")}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log("button");
        }}
      >
        Click
      </button>
    </div>
  );
}
// 只输出 "button"
```

### 无法阻止原生事件

```jsx
function App() {
  useEffect(() => {
    document.addEventListener("click", () => {
      console.log("document"); // 仍然会触发
    });
  }, []);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // 只阻止 React 事件
        console.log("button");
      }}
    >
      Click
    </button>
  );
}
// 输出："button" 和 "document"
```

### 解决方案

```jsx
function App() {
  const handleClick = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // 阻止原生事件
    console.log("button");
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 问题 4：捕获阶段阻止？

### 使用 onClickCapture

```jsx
function App() {
  return (
    <div
      onClickCapture={(e) => {
        e.stopPropagation(); // 在捕获阶段阻止
        console.log("captured");
      }}
    >
      <button onClick={() => console.log("button")}>Click</button>
    </div>
  );
}
// 只输出 "captured"
// button 的 onClick 不会触发
```

## 总结

| 方法                                       | 作用             |
| ------------------------------------------ | ---------------- |
| `e.stopPropagation()`                      | 阻止合成事件冒泡 |
| `e.preventDefault()`                       | 阻止默认行为     |
| `e.nativeEvent.stopImmediatePropagation()` | 阻止原生事件     |
| `onClickCapture`                           | 捕获阶段处理     |

## 延伸阅读

- [React 事件处理](https://react.dev/learn/responding-to-events)
- [stopPropagation 文档](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation)
