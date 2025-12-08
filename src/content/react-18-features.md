---
title: React 18 的主要新特性有哪些？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  了解 React 18 的核心新特性，包括并发渲染、自动批处理、Suspense 增强等。
tags:
  - React
  - React18
  - 并发渲染
  - 新特性
estimatedTime: 15 分钟
keywords:
  - React 18
  - concurrent rendering
  - automatic batching
  - Suspense
highlight: React 18 引入并发渲染机制，让 React 可以中断渲染、优先处理紧急更新。
order: 223
---

## 问题 1：React 18 有哪些核心新特性？

### 特性概览

1. **并发渲染（Concurrent Rendering）**
2. **自动批处理（Automatic Batching）**
3. **Transitions**
4. **Suspense 增强**
5. **新的 Hooks**

---

## 问题 2：并发渲染是什么？

### 核心概念

React 18 可以**中断渲染**，优先处理更紧急的更新。

```jsx
// React 17：渲染是同步的，不可中断
// 大列表渲染会阻塞用户输入

// React 18：渲染可以被中断
// 用户输入可以打断列表渲染
```

### 启用方式

```jsx
// React 17
import { render } from "react-dom";
render(<App />, document.getElementById("root"));

// React 18
import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById("root"));
root.render(<App />);
```

---

## 问题 3：自动批处理有什么改进？

### React 17 的限制

```jsx
// React 17：只在事件处理函数中批处理
function handleClick() {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // ✅ 批处理，只渲染一次
}

setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // ❌ 不批处理，渲染两次
}, 1000);
```

### React 18 的改进

```jsx
// React 18：所有更新都自动批处理
setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // ✅ 自动批处理，只渲染一次
}, 1000);

fetch("/api").then(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // ✅ 自动批处理
});
```

---

## 问题 4：Transitions 是什么？

### 区分紧急和非紧急更新

```jsx
import { useTransition } from "react";

function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 紧急：更新输入框
    setQuery(e.target.value);

    // 非紧急：更新搜索结果
    startTransition(() => {
      setResults(search(e.target.value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results data={results} />}
    </>
  );
}
```

---

## 问题 5：新增了哪些 Hooks？

### useTransition

```jsx
const [isPending, startTransition] = useTransition();
```

### useDeferredValue

```jsx
// 延迟更新非紧急值
const deferredQuery = useDeferredValue(query);
```

### useId

```jsx
// 生成稳定的唯一 ID（SSR 安全）
const id = useId();
return <input id={id} />;
```

### useSyncExternalStore

```jsx
// 安全订阅外部数据源
const state = useSyncExternalStore(subscribe, getSnapshot);
```

---

## 问题 6：Suspense 有什么增强？

### 服务端支持

```jsx
// React 18：Suspense 支持 SSR
<Suspense fallback={<Loading />}>
  <Comments />
</Suspense>

// 服务端可以流式发送 HTML
// 客户端可以选择性水合
```

### 与 Transitions 配合

```jsx
// Suspense + Transition = 更好的加载体验
startTransition(() => {
  setTab("comments"); // 切换到需要加载的 tab
});

// 在加载期间保持显示旧内容，而不是 fallback
```

## 总结

| 特性          | 说明                               |
| ------------- | ---------------------------------- |
| 并发渲染      | 可中断的渲染，优先级调度           |
| 自动批处理    | 所有场景自动批处理                 |
| Transitions   | 区分紧急/非紧急更新                |
| Suspense 增强 | SSR 支持、流式渲染                 |
| 新 Hooks      | useTransition、useDeferredValue 等 |

## 延伸阅读

- [React 18 发布博客](https://react.dev/blog/2022/03/29/react-v18)
- [React 18 升级指南](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
