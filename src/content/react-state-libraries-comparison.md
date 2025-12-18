---
title: Recoil、Jotai、Zustand 各自的特点是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 Recoil、Jotai、Zustand 三个现代状态管理库的特点和适用场景。
tags:
  - React
  - 状态管理
  - Recoil
  - Jotai
  - Zustand
estimatedTime: 15 分钟
keywords:
  - Recoil
  - Jotai
  - Zustand
  - state management
highlight: Recoil 原子化+选择器，Jotai 极简原子化，Zustand 类 Redux 但更简单。
order: 550
---

## 问题 1：Zustand 的特点？

### 核心特点

- **极简 API**：几行代码创建 store
- **无 Provider**：不需要包裹组件
- **类 Redux**：熟悉的模式

### 基本用法

```jsx
import { create } from "zustand";

// 创建 store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// 使用
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

### 适用场景

- 中小型项目
- 需要简单直接的状态管理
- 不想要 Redux 的复杂性

---

## 问题 2：Jotai 的特点？

### 核心特点

- **原子化**：状态拆分为独立原子
- **极简**：API 非常简单
- **自动依赖追踪**：只订阅使用的原子

### 基本用法

```jsx
import { atom, useAtom } from "jotai";

// 创建原子
const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

// 使用
function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const [double] = useAtom(doubleAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}
```

### 适用场景

- 需要细粒度状态管理
- 状态之间有派生关系
- 喜欢 React 原生的使用体验

---

## 问题 3：Recoil 的特点？

### 核心特点

- **原子 + 选择器**：atom 存储状态，selector 派生状态
- **Facebook 出品**：与 React 深度集成
- **异步支持**：selector 原生支持异步

### 基本用法

```jsx
import { atom, selector, useRecoilState, useRecoilValue } from "recoil";

// 原子
const countState = atom({
  key: "countState",
  default: 0,
});

// 选择器（派生状态）
const doubleState = selector({
  key: "doubleState",
  get: ({ get }) => get(countState) * 2,
});

// 异步选择器
const userState = selector({
  key: "userState",
  get: async ({ get }) => {
    const id = get(userIdState);
    return await fetchUser(id);
  },
});

// 使用
function Counter() {
  const [count, setCount] = useRecoilState(countState);
  const double = useRecoilValue(doubleState);

  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

### 适用场景

- 复杂的状态依赖关系
- 需要异步派生状态
- 大型应用

---

## 问题 4：三者对比？

### 对比表

| 特性       | Zustand    | Jotai  | Recoil        |
| ---------- | ---------- | ------ | ------------- |
| 模式       | 单一 store | 原子化 | 原子 + 选择器 |
| 包大小     | ~1KB       | ~2KB   | ~20KB         |
| Provider   | 不需要     | 可选   | 需要          |
| 学习成本   | 低         | 低     | 中            |
| TypeScript | ✅         | ✅     | ✅            |
| DevTools   | ✅         | ✅     | ✅            |
| 异步       | 手动       | 支持   | 原生支持      |

### 代码风格对比

```jsx
// Zustand：类 Redux
const useStore = create((set) => ({
  todos: [],
  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo],
    })),
}));

// Jotai：原子化
const todosAtom = atom([]);
const addTodoAtom = atom(null, (get, set, todo) => {
  set(todosAtom, [...get(todosAtom), todo]);
});

// Recoil：原子 + 选择器
const todosState = atom({ key: "todos", default: [] });
const todoCountState = selector({
  key: "todoCount",
  get: ({ get }) => get(todosState).length,
});
```

---

## 问题 5：如何选择？

### 选择建议

```jsx
// 选 Zustand：
// - 想要简单直接
// - 熟悉 Redux 模式
// - 不想要 Provider

// 选 Jotai：
// - 需要细粒度更新
// - 喜欢原子化思维
// - 想要最小的包体积

// 选 Recoil：
// - 复杂的派生状态
// - 需要原生异步支持
// - Facebook 技术栈
```

## 总结

| 库      | 一句话总结                |
| ------- | ------------------------- |
| Zustand | 简化版 Redux，无 Provider |
| Jotai   | 极简原子化，类似 useState |
| Recoil  | 原子 + 选择器，异步友好   |

## 延伸阅读

- [Zustand 文档](https://github.com/pmndrs/zustand)
- [Jotai 文档](https://jotai.org/)
- [Recoil 文档](https://recoiljs.org/)
