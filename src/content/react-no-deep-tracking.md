---
title: React 为什么无需像 Vue 那样依赖深度追踪？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  理解 React 和 Vue 响应式系统的设计差异，以及各自的权衡。
tags:
  - React
  - Vue
  - 响应式
  - 设计理念
estimatedTime: 12 分钟
keywords:
  - deep tracking
  - reactivity
  - React vs Vue
  - state management
highlight: React 采用不可变数据 + 显式更新，通过引用比较判断变化，无需深度追踪依赖。
order: 665
---

## 问题 1：两种响应式模型

### Vue：依赖追踪

```javascript
// Vue 使用 Proxy 追踪依赖
const state = reactive({ count: 0, user: { name: "John" } });

// 自动追踪：访问 state.count 时，记录依赖
// 自动更新：修改 state.count 时，触发相关组件更新

state.count++; // 自动触发更新
state.user.name = "Jane"; // 深层属性也能追踪
```

### React：不可变数据

```jsx
// React 使用不可变数据
const [state, setState] = useState({ count: 0, user: { name: "John" } });

// 显式更新：必须调用 setState
// 引用比较：通过新旧引用判断是否变化

setState({ ...state, count: state.count + 1 }); // 创建新对象
setState({ ...state, user: { ...state.user, name: "Jane" } });
```

---

## 问题 2：React 为什么不需要深度追踪？

### 不可变数据的特性

```jsx
// 数据变化 = 引用变化
const oldState = { count: 0 };
const newState = { count: 1 };

oldState === newState; // false，引用不同

// React 只需比较引用，无需深度比较
if (oldState !== newState) {
  // 触发更新
}
```

### 显式更新

```jsx
// React 要求显式调用 setState
// 不需要"追踪"哪些属性被访问

function Counter() {
  const [count, setCount] = useState(0);

  // React 知道：调用 setCount 就需要更新
  // 不需要追踪 count 在哪里被使用
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

---

## 问题 3：两种方式的对比

### Vue 的深度追踪

```javascript
// 优点：
// 1. 自动追踪，开发体验好
// 2. 精确更新，只更新依赖的组件
// 3. 直接修改，代码简洁

// 缺点：
// 1. 运行时开销（Proxy 拦截）
// 2. 调试困难（隐式依赖）
// 3. 某些边界情况（数组索引、新增属性）
```

### React 的不可变数据

```jsx
// 优点：
// 1. 可预测性强（显式更新）
// 2. 易于调试（数据流清晰）
// 3. 时间旅行调试（状态快照）
// 4. 并发安全（不可变）

// 缺点：
// 1. 需要手动创建新对象
// 2. 深层更新代码繁琐
// 3. 可能有不必要的渲染
```

---

## 问题 4：React 如何判断是否需要更新？

### 引用比较

```jsx
// React 使用 Object.is 比较
function shouldUpdate(oldProps, newProps) {
  return !Object.is(oldProps, newProps);
}

// 基本类型：值比较
Object.is(1, 1); // true
Object.is("a", "a"); // true

// 引用类型：引用比较
Object.is({}, {}); // false
Object.is([], []); // false
```

### 组件更新条件

```jsx
// 组件更新的条件：
// 1. state 变化（引用不同）
// 2. props 变化（引用不同）
// 3. 父组件渲染

// 使用 React.memo 可以跳过 props 未变化的渲染
const MemoComponent = React.memo(Component);
```

---

## 问题 5：为什么 React 选择这种方式？

### 设计理念

```jsx
// 1. 函数式编程思想
// 纯函数：相同输入 → 相同输出
// 不可变数据：数据不被修改

// 2. 可预测性
// 显式更新，数据流清晰
// 易于理解和调试

// 3. 并发渲染
// 不可变数据支持中断和恢复
// 不会出现数据不一致
```

### 并发渲染的需要

```jsx
// Vue 的可变数据在并发场景下可能有问题
// 渲染过程中数据可能被修改

// React 的不可变数据
// 渲染基于某个时刻的快照
// 即使中断，数据也不会变化
```

## 总结

| 方面       | React         | Vue        |
| ---------- | ------------- | ---------- |
| 响应式     | 不可变数据    | 依赖追踪   |
| 更新方式   | 显式 setState | 自动追踪   |
| 判断变化   | 引用比较      | Proxy 拦截 |
| 运行时开销 | 低            | 较高       |
| 开发体验   | 需要手动更新  | 自动更新   |

## 延伸阅读

- [React 设计理念](https://react.dev/learn/thinking-in-react)
- [Vue 响应式原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)
