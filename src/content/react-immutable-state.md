---
title: React 如何实践数据不可变状态 (Immutable State)？
category: React
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  探讨 React 中不可变数据的重要性，介绍如何使用原生 JavaScript 和 Immer 等库来优雅地管理不可变状态。
tags:
  - React
  - Immutability
  - State Management
  - Immer
estimatedTime: 15 分钟
keywords:
  - immutable state
  - react state mutation
  - immer
  - spread operator
  - shallow copy
highlight: React 依赖引用相等性来检测变更，直接修改状态会导致更新丢失。使用 Spread 语法或 Immer 库是最佳实践。
order: 402
---

## 问题 1：为什么 React 强调数据不可变性 (Immutability)？

在 React 中，**不可变性**不是一种偏好，而是核心机制的一部分。

### 1. 变更检测 (Change Detection)
React 使用**浅比较 (Shallow Comparison)** 来决定组件是否需要重新渲染（例如在 `React.memo`、`PureComponent` 或 Hooks 的依赖数组中）。

如果你直接修改对象属性（Mutation）：
```javascript
const user = { name: 'Alice' };
user.name = 'Bob'; // 引用地址没变！

// React 比较：oldUser === newUser 为 true
// 结果：React 认为数据没变，不会触发重新渲染
```

只有创建新对象（改变引用），React 才能感知到变化：
```javascript
const newUser = { ...user, name: 'Bob' }; // 新的引用地址
```

### 2. 性能优化
不可变数据使得跟踪变更变得非常廉价（只需比较引用地址 `prevProps !== nextProps`），这对于构建高性能 UI 至关重要。

---

## 问题 2：如何使用原生 JavaScript 实现不可变更新？

对于简单的状态结构，ES6+ 的语法特性已经足够好用。

### 1. 数组操作
避免使用会改变原数组的方法（如 `push`, `pop`, `splice`, `sort`）。

```javascript
const [list, setList] = useState([1, 2, 3]);

// ❌ 错误：直接修改
list.push(4);
setList(list);

// ✅ 正确：添加
setList([...list, 4]);

// ✅ 正确：删除 (filter)
setList(list.filter(item => item !== 2));

// ✅ 正确：修改 (map)
setList(list.map(item => item === 2 ? 20 : item));
```

### 2. 对象操作
使用对象展开运算符 (Spread Operator)。

```javascript
const [user, setUser] = useState({ name: 'Alice', age: 25 });

// ✅ 正确：更新属性
setUser({
  ...user,
  age: 26
});
```

### 3. 嵌套对象的痛点
原生语法在处理深层嵌套对象时会变得非常繁琐且易错。

```javascript
// 想要修改 state.user.address.city
setData({
  ...data,
  user: {
    ...data.user,
    address: {
      ...data.user.address,
      city: 'New York'
    }
  }
});
```

---

## 问题 3：如何处理复杂的嵌套状态 (Immer)？

当状态结构较深时，推荐使用 **Immer**。它允许你使用**可变（Mutable）**的语法来编写代码，但它会自动将其转换为**不可变（Immutable）**的更新。

### Immer 的原理
Immer 利用 ES6 Proxy 创建一个临时草稿（Draft），你对草稿的所有修改都会被记录下来，最后生成一个新的不可变状态。

### 使用示例

```javascript
import { produce } from 'immer';

const [state, setState] = useState({
  user: {
    address: { city: 'London' }
  }
});

const updateCity = () => {
  setState(produce(draft => {
    // 😍 像修改普通对象一样直接赋值
    draft.user.address.city = 'New York';
  }));
};
```

很多现代 React 状态库（如 **Redux Toolkit**, **Zustand**）内部已经集成了 Immer，因此你可以直接在 reducer 中写可变逻辑。

```javascript
// Redux Toolkit Slice
reducers: {
  updateName(state, action) {
    // 直接修改，无需返回新 state
    state.name = action.payload;
  }
}
```

## 总结

**核心概念总结**：

### 1. 为什么需要不可变性
- 确保 React 能正确检测到状态变化（引用对比）。
- 避免副作用，让数据流更可预测。

### 2. 原生实现
- 使用 `...` 展开运算符、`map`、`filter` 等非破坏性方法。
- 适用于扁平或浅层嵌套的数据结构。

### 3. 复杂场景
- 对于深层嵌套数据，手动拷贝容易出错且代码冗余。
- 强烈推荐使用 **Immer**，它结合了可变代码的简洁性和不可变数据的安全性。

## 延伸阅读

- [React 官方文档 - 更新对象状态](https://react.dev/learn/updating-objects-in-state)
- [React 官方文档 - 更新数组状态](https://react.dev/learn/updating-arrays-in-state)
- [Immer 官方文档](https://immerjs.github.io/immer/)
