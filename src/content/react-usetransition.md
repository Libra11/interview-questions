---
title: useTransition 如何避免卡顿？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 useTransition 的工作原理，掌握如何用它优化用户体验。
tags:
  - React
  - Hooks
  - useTransition
  - 并发
estimatedTime: 12 分钟
keywords:
  - useTransition
  - transition
  - non-blocking update
  - concurrent
highlight: useTransition 将状态更新标记为"可中断"，让紧急更新（如用户输入）优先执行。
order: 528
---

## 问题 1：useTransition 解决什么问题？

### 问题场景

```jsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setResults(heavySearch(e.target.value)); // 耗时操作
  };

  // 问题：输入时界面卡顿
  // 因为 heavySearch 阻塞了渲染
}
```

### useTransition 的解决方案

```jsx
function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setQuery(e.target.value); // 紧急更新

    startTransition(() => {
      setResults(heavySearch(e.target.value)); // 非紧急更新
    });
  };

  // 输入流畅，搜索结果稍后更新
}
```

---

## 问题 2：useTransition 如何工作？

### 优先级分离

```jsx
const [isPending, startTransition] = useTransition();

// startTransition 内的更新被标记为"低优先级"
startTransition(() => {
  setLowPriorityState(newValue);
});

// 普通更新是"高优先级"
setHighPriorityState(newValue);
```

### 执行顺序

```
用户输入 → 高优先级更新 → 渲染 → 低优先级更新 → 渲染
                ↑                      ↑
              立即执行              可被中断
```

---

## 问题 3：isPending 有什么用？

### 显示加载状态

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

      {/* 切换期间显示加载指示 */}
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <TabContent tab={tab} />
      </div>
    </>
  );
}
```

### 保持旧内容可见

```jsx
// 不使用 transition：立即显示 loading
// 使用 transition：保持旧内容，isPending 为 true

// 用户体验更好：
// - 看到旧内容 + 加载指示
// - 而不是突然变成 loading 状态
```

---

## 问题 4：useTransition vs useDeferredValue？

### useTransition

控制**状态更新**的优先级。

```jsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setState(newValue); // 这个更新是低优先级
});
```

### useDeferredValue

延迟**值**的更新。

```jsx
const deferredQuery = useDeferredValue(query);

// query 立即更新
// deferredQuery 延迟更新
```

### 选择原则

```jsx
// 能控制 setState 的地方 → useTransition
const handleChange = (e) => {
  startTransition(() => {
    setQuery(e.target.value);
  });
};

// 不能控制 setState 的地方（如 props）→ useDeferredValue
function Results({ query }) {
  const deferredQuery = useDeferredValue(query);
  return <List query={deferredQuery} />;
}
```

## 总结

**useTransition 核心**：

| 方面      | 说明                       |
| --------- | -------------------------- |
| 作用      | 将更新标记为低优先级       |
| 效果      | 不阻塞紧急更新             |
| isPending | 指示 transition 是否进行中 |
| 适用场景  | 搜索、tab 切换、大列表过滤 |

## 延伸阅读

- [useTransition 文档](https://react.dev/reference/react/useTransition)
- [useDeferredValue 文档](https://react.dev/reference/react/useDeferredValue)
