---
title: 什么是 Suspense？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React Suspense 的概念和用法，掌握它如何简化异步加载的处理。
tags:
  - React
  - Suspense
  - 异步
  - 懒加载
estimatedTime: 15 分钟
keywords:
  - React Suspense
  - lazy loading
  - fallback
  - code splitting
highlight: Suspense 让组件可以"等待"某些操作完成，在等待期间显示 fallback 内容。
order: 534
---

## 问题 1：Suspense 是什么？

### 基本概念

Suspense 让你可以**声明式地**处理加载状态。

```jsx
import { Suspense, lazy } from "react";

const LazyComponent = lazy(() => import("./HeavyComponent"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

### 工作原理

```jsx
// 1. LazyComponent 开始加载
// 2. 加载期间，显示 <Loading />
// 3. 加载完成，显示 <LazyComponent />
```

---

## 问题 2：Suspense 的常见用法？

### 1. 代码分割

```jsx
// 按需加载组件
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. 嵌套 Suspense

```jsx
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Header />
      <Suspense fallback={<ContentLoader />}>
        <MainContent />
      </Suspense>
      <Footer />
    </Suspense>
  );
}

// Header 和 Footer 先显示
// MainContent 单独加载
```

### 3. 配合 Transition

```jsx
function TabContainer() {
  const [tab, setTab] = useState("home");
  const [isPending, startTransition] = useTransition();

  const switchTab = (newTab) => {
    startTransition(() => {
      setTab(newTab);
    });
  };

  return (
    <>
      <TabButtons onSwitch={switchTab} />
      <Suspense fallback={<TabLoader />}>
        {/* 使用 transition 时，会保持显示旧 tab */}
        {/* 而不是立即显示 fallback */}
        <TabContent tab={tab} />
      </Suspense>
    </>
  );
}
```

---

## 问题 3：Suspense 的边界行为？

### 就近原则

```jsx
<Suspense fallback={<Outer />}>
  <ComponentA />
  <Suspense fallback={<Inner />}>
    <ComponentB /> {/* 使用 Inner fallback */}
  </Suspense>
  <ComponentC /> {/* 使用 Outer fallback */}
</Suspense>
```

### 多个组件共享边界

```jsx
<Suspense fallback={<Loading />}>
  <LazyA />
  <LazyB />
  <LazyC />
</Suspense>

// 任一组件加载中，都显示 Loading
// 全部加载完成，才显示内容
```

---

## 问题 4：Suspense 的限制？

### 目前支持的场景

```jsx
// ✅ 支持：React.lazy
const LazyComponent = lazy(() => import("./Component"));

// ✅ 支持：支持 Suspense 的框架（Next.js、Relay）
<Suspense fallback={<Loading />}>
  <DataComponent />
</Suspense>;

// ❌ 不支持：普通的 useEffect 数据获取
function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api").then(setData); // 不会触发 Suspense
  }, []);
}
```

### 需要特殊集成

```jsx
// 数据获取需要使用支持 Suspense 的库
// - React Query (TanStack Query)
// - SWR
// - Relay
// - Next.js 的 use() hook
```

## 总结

**Suspense 核心**：

| 方面 | 说明                         |
| ---- | ---------------------------- |
| 作用 | 声明式处理加载状态           |
| 用法 | 包裹异步组件，提供 fallback  |
| 支持 | lazy 组件、特定框架          |
| 优势 | 简化加载逻辑、更好的用户体验 |

## 延伸阅读

- [Suspense 文档](https://react.dev/reference/react/Suspense)
- [代码分割指南](https://react.dev/reference/react/lazy)
