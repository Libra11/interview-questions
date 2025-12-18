---
title: startTransition 与普通 setState 区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 startTransition 和普通 setState 的差异，理解何时使用 startTransition。
tags:
  - React
  - startTransition
  - setState
  - 并发
estimatedTime: 10 分钟
keywords:
  - startTransition
  - setState
  - transition
  - priority
highlight: startTransition 将更新标记为非紧急，可被用户交互打断，而普通 setState 是紧急更新。
order: 532
---

## 问题 1：两者有什么区别？

### 普通 setState

```jsx
// 紧急更新，立即执行，不可中断
setState(newValue);
```

### startTransition

```jsx
import { startTransition } from "react";

// 非紧急更新，可被中断
startTransition(() => {
  setState(newValue);
});
```

### 对比

| 特性     | setState     | startTransition |
| -------- | ------------ | --------------- |
| 优先级   | 高（紧急）   | 低（可延迟）    |
| 可中断   | 否           | 是              |
| 阻塞输入 | 可能         | 不会            |
| 适用场景 | 用户直接交互 | 大量计算/渲染   |

---

## 问题 2：什么时候用 startTransition？

### 适合的场景

```jsx
// 1. 搜索过滤
const handleSearch = (query) => {
  setQuery(query); // 紧急：更新输入框

  startTransition(() => {
    setResults(filter(data, query)); // 非紧急：过滤结果
  });
};

// 2. Tab 切换
const switchTab = (tab) => {
  startTransition(() => {
    setActiveTab(tab); // 切换可能触发大量渲染
  });
};

// 3. 大列表渲染
startTransition(() => {
  setItems(largeDataSet);
});
```

### 不适合的场景

```jsx
// ❌ 用户直接输入
<input onChange={e => {
  startTransition(() => {
    setValue(e.target.value);  // 输入会有延迟感
  });
}} />

// ✅ 正确做法
<input onChange={e => setValue(e.target.value)} />
```

---

## 问题 3：startTransition vs useTransition？

### startTransition

```jsx
import { startTransition } from "react";

// 不提供 pending 状态
startTransition(() => {
  setState(value);
});
```

### useTransition

```jsx
import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

// 提供 pending 状态
startTransition(() => {
  setState(value);
});

// 可以显示加载指示
{
  isPending && <Spinner />;
}
```

### 选择原则

```jsx
// 需要显示加载状态 → useTransition
// 不需要加载状态 → startTransition
```

---

## 问题 4：实际效果对比？

### 普通 setState

```jsx
function SlowList({ query }) {
  const handleChange = (e) => {
    setQuery(e.target.value);
    // 如果 List 渲染很慢，输入会卡顿
  };

  return (
    <>
      <input onChange={handleChange} />
      <List query={query} /> {/* 10000 项 */}
    </>
  );
}
```

### 使用 startTransition

```jsx
function SlowList({ query }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setInputValue(e.target.value); // 立即响应

    startTransition(() => {
      setQuery(e.target.value); // 延迟更新列表
    });
  };

  return (
    <>
      <input onChange={handleChange} />
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <List query={query} />
      </div>
    </>
  );
}
// 输入流畅，列表稍后更新
```

## 总结

| 方面     | setState | startTransition |
| -------- | -------- | --------------- |
| 用途     | 紧急更新 | 非紧急更新      |
| 响应性   | 可能阻塞 | 保持流畅        |
| 使用场景 | 用户输入 | 大量计算/渲染   |

## 延伸阅读

- [startTransition 文档](https://react.dev/reference/react/startTransition)
- [useTransition 文档](https://react.dev/reference/react/useTransition)
