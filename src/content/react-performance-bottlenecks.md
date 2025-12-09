---
title: React 性能常见瓶颈有哪些？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  识别 React 应用中常见的性能瓶颈，了解问题根源和优化方向。
tags:
  - React
  - 性能
  - 优化
  - 瓶颈
estimatedTime: 12 分钟
keywords:
  - React performance
  - performance bottlenecks
  - render optimization
  - React profiler
highlight: 常见瓶颈包括不必要的重渲染、大列表渲染、频繁状态更新、大型 bundle 等。
order: 265
---

## 问题 1：不必要的重渲染

### 问题表现

```jsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* 每次 count 变化，ExpensiveChild 都重新渲染 */}
      <ExpensiveChild />
    </div>
  );
}
```

### 常见原因

```jsx
// 1. 父组件渲染导致子组件渲染
// 2. 每次创建新的对象/数组/函数
<Child style={{ color: 'red' }} />  // 每次都是新对象
<Child onClick={() => {}} />         // 每次都是新函数
<Child items={items.filter(...)} />  // 每次都是新数组
```

---

## 问题 2：大列表渲染

### 问题表现

```jsx
// 渲染 10000 个项目
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
// 首次渲染慢，滚动卡顿
```

### 解决方向

```jsx
// 使用虚拟列表
import { FixedSizeList } from "react-window";

function VirtualList({ items }) {
  return (
    <FixedSizeList height={400} itemCount={items.length} itemSize={35}>
      {({ index, style }) => <div style={style}>{items[index].name}</div>}
    </FixedSizeList>
  );
}
```

---

## 问题 3：频繁状态更新

### 问题表现

```jsx
// 拖拽时每帧都更新状态
function Draggable() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setPosition({ x: e.clientX, y: e.clientY }); // 每帧触发
  };

  // 导致整个组件树频繁重渲染
}
```

### 解决方向

```jsx
// 1. 使用 ref 存储不需要触发渲染的值
// 2. 使用 CSS transform 代替位置状态
// 3. 使用 requestAnimationFrame 节流
```

---

## 问题 4：大型 Bundle

### 问题表现

```
main.js: 2MB
首屏加载时间: 5s+
```

### 常见原因

```jsx
// 1. 没有代码分割
import HeavyComponent from "./HeavyComponent";

// 2. 引入整个库
import _ from "lodash"; // 引入全部
import moment from "moment"; // 包含所有语言包

// 3. 未 tree-shaking
```

---

## 问题 5：Context 滥用

### 问题表现

```jsx
// 频繁变化的值放在 Context
const AppContext = createContext();

function App() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <AppContext.Provider value={{ mousePosition }}>
      {/* 所有消费者都会频繁重渲染 */}
      <Header />
      <Main />
      <Footer />
    </AppContext.Provider>
  );
}
```

---

## 问题 6：昂贵的计算

### 问题表现

```jsx
function Component({ items }) {
  // 每次渲染都重新计算
  const sortedItems = items.sort((a, b) => a.value - b.value);
  const filteredItems = sortedItems.filter((item) => item.active);
  const total = filteredItems.reduce((sum, item) => sum + item.value, 0);

  return <div>{total}</div>;
}
```

### 解决方向

```jsx
// 使用 useMemo 缓存计算结果
const processedData = useMemo(() => {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const filtered = sorted.filter((item) => item.active);
  return filtered.reduce((sum, item) => sum + item.value, 0);
}, [items]);
```

## 总结

| 瓶颈         | 解决方向                         |
| ------------ | -------------------------------- |
| 不必要重渲染 | React.memo、useMemo、useCallback |
| 大列表       | 虚拟列表（react-window）         |
| 频繁更新     | ref、节流、CSS 动画              |
| 大 Bundle    | 代码分割、按需引入               |
| Context 滥用 | 拆分 Context、状态下移           |
| 昂贵计算     | useMemo                          |

## 延伸阅读

- [React Profiler](https://react.dev/reference/react/Profiler)
- [性能优化](https://react.dev/learn/render-and-commit)
