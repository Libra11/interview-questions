---
title: 你能否从 0 实现 useState？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  通过实现简化版 useState，深入理解 Hooks 的工作原理。
tags:
  - React
  - Hooks
  - useState
  - 原理
estimatedTime: 15 分钟
keywords:
  - implement useState
  - Hooks internals
  - useState principle
  - custom hooks
highlight: useState 通过闭包和链表实现，每个组件维护一个 Hooks 链表，按调用顺序存储状态。
order: 309
---

## 问题 1：最简实现

### 基础版本

```javascript
let state;

function useState(initialValue) {
  state = state ?? initialValue;

  function setState(newValue) {
    state = typeof newValue === "function" ? newValue(state) : newValue;
    render(); // 触发重新渲染
  }

  return [state, setState];
}

// 问题：只能有一个 state
```

---

## 问题 2：支持多个 state

### 使用数组

```javascript
let states = [];
let index = 0;

function useState(initialValue) {
  const currentIndex = index;

  states[currentIndex] = states[currentIndex] ?? initialValue;

  function setState(newValue) {
    states[currentIndex] =
      typeof newValue === "function"
        ? newValue(states[currentIndex])
        : newValue;
    render();
  }

  index++;
  return [states[currentIndex], setState];
}

function render() {
  index = 0; // 重置索引
  ReactDOM.render(<App />, document.getElementById("root"));
}

// 使用
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}
```

---

## 问题 3：使用链表结构

### 更接近 React 的实现

```javascript
let workInProgressHook = null;
let currentHook = null;
let isMount = true;

function useState(initialValue) {
  let hook;

  if (isMount) {
    // 首次渲染：创建新 hook
    hook = {
      memoizedState: initialValue,
      queue: [],
      next: null,
    };

    if (!workInProgressHook) {
      // 第一个 hook
      fiber.memoizedState = hook;
    } else {
      // 链接到上一个 hook
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    // 更新：复用现有 hook
    hook = currentHook;
    currentHook = currentHook.next;

    // 处理更新队列
    hook.queue.forEach((action) => {
      hook.memoizedState =
        typeof action === "function" ? action(hook.memoizedState) : action;
    });
    hook.queue = [];
  }

  const setState = (action) => {
    hook.queue.push(action);
    scheduleUpdate();
  };

  return [hook.memoizedState, setState];
}

function scheduleUpdate() {
  isMount = false;
  currentHook = fiber.memoizedState;
  workInProgressHook = null;

  // 重新渲染
  render();
}
```

---

## 问题 4：完整示例

### 可运行的实现

```javascript
// 简化的 React 实现
const React = (function () {
  let hooks = [];
  let currentIndex = 0;

  function useState(initialValue) {
    const index = currentIndex;

    if (hooks[index] === undefined) {
      hooks[index] = initialValue;
    }

    const setState = (newValue) => {
      if (typeof newValue === "function") {
        hooks[index] = newValue(hooks[index]);
      } else {
        hooks[index] = newValue;
      }
      rerender();
    };

    currentIndex++;
    return [hooks[index], setState];
  }

  function useEffect(callback, deps) {
    const index = currentIndex;
    const prevDeps = hooks[index];

    const hasChanged = prevDeps
      ? !deps.every((dep, i) => dep === prevDeps[i])
      : true;

    if (hasChanged) {
      callback();
      hooks[index] = deps;
    }

    currentIndex++;
  }

  function render(Component) {
    currentIndex = 0;
    const element = Component();
    return element;
  }

  function rerender() {
    // 触发重新渲染
    console.log("Rerendering...");
  }

  return { useState, useEffect, render };
})();

// 使用
function Counter() {
  const [count, setCount] = React.useState(0);
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    console.log("Count changed:", count);
  }, [count]);

  return {
    count,
    text,
    increment: () => setCount((c) => c + 1),
    updateText: (t) => setText(t),
  };
}
```

---

## 问题 5：为什么 Hooks 不能在条件中使用？

### 原因

```javascript
// Hooks 依赖调用顺序
function Component() {
  // 第一次渲染
  const [a, setA] = useState(1); // hooks[0]
  const [b, setB] = useState(2); // hooks[1]

  // 如果条件改变
  if (condition) {
    const [a, setA] = useState(1); // hooks[0]
  }
  const [b, setB] = useState(2); // hooks[1] 或 hooks[0]？

  // 索引错乱，状态混乱！
}
```

### 链表结构

```
首次渲染：
hook1 → hook2 → hook3

更新时按相同顺序读取：
hook1 → hook2 → hook3

如果顺序变化，链表对应关系就乱了
```

---

## 问题 6：批量更新

### 实现批量更新

```javascript
let isBatching = false;
let pendingUpdates = [];

function setState(action) {
  pendingUpdates.push({ hook, action });

  if (!isBatching) {
    flushUpdates();
  }
}

function flushUpdates() {
  pendingUpdates.forEach(({ hook, action }) => {
    hook.memoizedState =
      typeof action === "function" ? action(hook.memoizedState) : action;
  });
  pendingUpdates = [];
  render();
}

// 批量更新
function batchedUpdates(fn) {
  isBatching = true;
  fn();
  isBatching = false;
  flushUpdates();
}
```

## 总结

| 概念      | 说明               |
| --------- | ------------------ |
| 存储结构  | 数组或链表         |
| 索引/顺序 | 按调用顺序对应     |
| 更新队列  | 收集更新，批量处理 |
| 限制      | 不能在条件中调用   |

## 延伸阅读

- [React Hooks 源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js)
- [Hooks 原理](https://react.dev/learn/state-a-components-memory)
