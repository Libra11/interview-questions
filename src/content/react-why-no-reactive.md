---
title: React 为什么不做响应式系统（如 Vue）？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  理解 React 选择不采用响应式系统的设计考量和权衡。
tags:
  - React
  - Vue
  - 响应式
  - 设计理念
estimatedTime: 12 分钟
keywords:
  - reactive system
  - React design
  - immutability
  - state management
highlight: React 选择不可变数据而非响应式，是为了可预测性、并发渲染支持和函数式编程理念。
order: 304
---

## 问题 1：响应式系统是什么？

### Vue 的响应式

```javascript
// Vue 3 使用 Proxy 实现响应式
const state = reactive({ count: 0 });

// 读取时：自动收集依赖
console.log(state.count); // 记录：这个组件依赖 count

// 修改时：自动触发更新
state.count++; // 通知：所有依赖 count 的组件更新
```

### React 的方式

```jsx
// React 使用显式更新
const [count, setCount] = useState(0);

// 读取：普通变量访问
console.log(count);

// 修改：必须调用 setter
setCount(count + 1); // 显式告诉 React 需要更新
```

---

## 问题 2：React 为什么不做响应式？

### 原因 1：可预测性

```jsx
// 响应式：隐式依赖，难以追踪
// 修改 state.a 可能触发意想不到的更新

// React：显式更新，数据流清晰
// 调用 setState 才会更新，一目了然

// 调试时：
// Vue：为什么这个组件更新了？需要追踪依赖
// React：谁调用了 setState？查看调用栈即可
```

### 原因 2：并发渲染

```jsx
// 响应式系统的问题：
// 渲染过程中，数据可能被修改
// 导致渲染结果不一致

// React 的不可变数据：
// 渲染基于某个时刻的快照
// 即使渲染被中断，数据也不会变化

function Component() {
  const [count, setCount] = useState(0);

  // 这次渲染中，count 永远是同一个值
  // 不会因为其他地方修改而变化
  return <div>{count}</div>;
}
```

### 原因 3：函数式编程

```jsx
// React 推崇函数式编程
// 组件是纯函数：props → UI
// 状态是不可变的

// 纯函数的好处：
// 1. 相同输入 → 相同输出
// 2. 无副作用
// 3. 易于测试
// 4. 易于并行

function Greeting({ name }) {
  // 纯函数：只依赖 props，无副作用
  return <h1>Hello, {name}</h1>;
}
```

---

## 问题 3：两种方式的权衡

### 响应式的优势

```javascript
// 1. 开发体验好
state.count++; // 直接修改，简单直观

// 2. 精确更新
// 只有依赖 count 的组件会更新

// 3. 代码简洁
// 不需要手动创建新对象
```

### 不可变数据的优势

```jsx
// 1. 可预测性
// 数据流清晰，易于调试

// 2. 时间旅行
// 可以保存历史状态快照
const history = [state1, state2, state3];
// 可以回退到任意状态

// 3. 并发安全
// 渲染过程中数据不会变化

// 4. 性能优化
// 引用比较即可判断是否变化
if (prevProps !== nextProps) {
  // 需要更新
}
```

---

## 问题 4：React 的"响应式"替代方案

### useSyncExternalStore

```jsx
// React 18 提供的订阅外部数据源的 Hook
import { useSyncExternalStore } from "react";

const count = useSyncExternalStore(
  store.subscribe, // 订阅函数
  store.getSnapshot // 获取当前值
);
```

### 状态管理库

```jsx
// Zustand：类似响应式的体验
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const count = useStore((state) => state.count);
  // 只有 count 变化时才重新渲染
}
```

### Signals（实验性）

```jsx
// React 社区也在探索 Signals
// 但 React 团队目前没有采纳
// 因为与并发渲染的理念冲突
```

---

## 问题 5：总结对比

| 方面     | React         | Vue      |
| -------- | ------------- | -------- |
| 更新方式 | 显式 setState | 自动追踪 |
| 数据模型 | 不可变        | 可变     |
| 依赖追踪 | 无            | Proxy    |
| 并发渲染 | 支持          | 不支持   |
| 调试     | 简单          | 需要工具 |
| 开发体验 | 需要手动更新  | 自动更新 |

## 总结

React 不做响应式的原因：

1. **可预测性**：显式更新，数据流清晰
2. **并发渲染**：不可变数据支持中断和恢复
3. **函数式理念**：纯函数、无副作用
4. **调试友好**：易于追踪状态变化

## 延伸阅读

- [React 设计理念](https://react.dev/learn/thinking-in-react)
- [为什么 React 不使用 Signals](https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024)
