---
title: Fiber 架构解决了什么问题？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Fiber 架构解决的具体问题，包括卡顿、优先级、并发等。
tags:
  - React
  - Fiber
  - 性能
  - 并发
estimatedTime: 12 分钟
keywords:
  - Fiber problems
  - main thread blocking
  - priority scheduling
  - concurrent rendering
highlight: Fiber 解决了主线程阻塞、无法区分优先级、无法中断渲染三大问题。
order: 580
---

## 问题 1：解决主线程阻塞

### 问题

```jsx
// React 15：同步递归渲染
function BigList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <ComplexItem key={item.id} data={item} />
      ))}
    </ul>
  );
}

// 10000 个 ComplexItem
// 渲染需要 200ms
// 这 200ms 内：
// - 用户点击无响应
// - 动画卡顿
// - 输入延迟
```

### Fiber 解决方案

```jsx
// 时间切片：每 5ms 检查一次
function workLoop(deadline) {
  while (fiber && deadline.timeRemaining() > 1) {
    fiber = performUnitOfWork(fiber);
  }

  if (fiber) {
    // 让出主线程，处理其他任务
    requestIdleCallback(workLoop);
  }
}

// 渲染过程：
// [5ms渲染][响应点击][5ms渲染][动画帧][5ms渲染]...
```

---

## 问题 2：解决优先级问题

### 问题

```jsx
// React 15：所有更新同等对待
function App() {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleChange = (e) => {
    setInputValue(e.target.value); // 紧急：用户输入
    setSearchResults(search(e.target.value)); // 不紧急：搜索结果
  };

  // 两个更新一起处理
  // 搜索结果计算慢 → 输入也变慢
}
```

### Fiber 解决方案

```jsx
// React 18：区分优先级
function App() {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setInputValue(e.target.value); // 高优先级

    startTransition(() => {
      setSearchResults(search(e.target.value)); // 低优先级
    });
  };

  // 输入立即响应
  // 搜索结果稍后更新
}
```

---

## 问题 3：解决无法中断的问题

### 问题

```jsx
// React 15：一旦开始渲染，无法停止
// 场景：用户快速切换 tab

// 点击 Tab A → 开始渲染 A（耗时 100ms）
// 50ms 后点击 Tab B
// 必须等 A 渲染完，才能开始渲染 B
// 用户体验：卡顿
```

### Fiber 解决方案

```jsx
// React 18：可以中断并丢弃
// 点击 Tab A → 开始渲染 A
// 50ms 后点击 Tab B
// 中断 A 的渲染，开始渲染 B
// 用户体验：流畅

function Tabs() {
  const [tab, setTab] = useState("a");
  const [isPending, startTransition] = useTransition();

  const switchTab = (newTab) => {
    startTransition(() => {
      setTab(newTab); // 可被中断
    });
  };
}
```

---

## 问题 4：支持并发特性

### Suspense

```jsx
// Fiber 让 Suspense 成为可能
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// 组件可以"暂停"渲染，等待数据
// 这需要可中断的渲染机制
```

### 选择性水合

```jsx
// SSR 时，可以优先水合用户交互的区域
<Suspense fallback={<Skeleton />}>
  <Comments /> {/* 用户点击这里 */}
</Suspense>

// Fiber 让 React 可以：
// 1. 检测用户交互
// 2. 中断当前水合
// 3. 优先水合用户点击的区域
```

### 并发渲染

```jsx
// 多个渲染可以"同时"进行
// 实际是交替执行，但用户感知是并发的

// 渲染 A（低优先级）
// 渲染 B（高优先级）插入
// 继续渲染 A
```

---

## 问题 5：总结对比

### 能力对比

| 能力       | React 15 | React 16+ (Fiber) |
| ---------- | -------- | ----------------- |
| 中断渲染   | ❌       | ✅                |
| 优先级调度 | ❌       | ✅                |
| 时间切片   | ❌       | ✅                |
| Suspense   | ❌       | ✅                |
| 并发模式   | ❌       | ✅                |

### 用户体验对比

```
React 15：
用户输入 → [====长时间渲染====] → 显示结果
              ↑ 卡顿

React 16+ Fiber：
用户输入 → [渲染][响应][渲染][响应] → 显示结果
              ↑ 流畅
```

## 总结

**Fiber 解决的核心问题**：

1. **主线程阻塞** → 时间切片
2. **无法区分优先级** → 优先级调度
3. **无法中断渲染** → 可中断架构
4. **无法支持并发** → 并发特性基础

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [并发 React](https://react.dev/blog/2022/03/29/react-v18)
