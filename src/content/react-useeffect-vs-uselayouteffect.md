---
title: useEffect 与 useLayoutEffect 的区别？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  对比 useEffect 和 useLayoutEffect 的执行时机差异，理解何时需要使用 useLayoutEffect。
tags:
  - React
  - Hooks
  - useEffect
  - useLayoutEffect
estimatedTime: 12 分钟
keywords:
  - useEffect vs useLayoutEffect
  - layout effect
  - synchronous effect
  - DOM measurement
highlight: useLayoutEffect 在 DOM 更新后同步执行，适合需要在浏览器绘制前读取或修改 DOM 的场景。
order: 488
---

## 问题 1：执行时机有什么不同？

### useEffect

在浏览器**绘制之后**异步执行。

```
渲染 → DOM 更新 → 浏览器绘制 → useEffect
```

### useLayoutEffect

在 DOM 更新后、浏览器**绘制之前**同步执行。

```
渲染 → DOM 更新 → useLayoutEffect → 浏览器绘制
```

### 对比示例

```jsx
function Example() {
  useEffect(() => {
    console.log("useEffect"); // 后执行
  });

  useLayoutEffect(() => {
    console.log("useLayoutEffect"); // 先执行
  });
}

// 输出：
// useLayoutEffect
// useEffect
```

---

## 问题 2：什么时候用 useLayoutEffect？

### 需要在绘制前修改 DOM

```jsx
function Tooltip({ targetRef, children }) {
  const tooltipRef = useRef();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // ✅ 使用 useLayoutEffect 避免闪烁
  useLayoutEffect(() => {
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 10,
      left: rect.left,
    });
  }, [targetRef]);

  return (
    <div ref={tooltipRef} style={{ position: "absolute", ...position }}>
      {children}
    </div>
  );
}
```

如果用 useEffect，tooltip 会先显示在错误位置，然后跳到正确位置（闪烁）。

### 需要同步读取 DOM 布局

```jsx
function AutoHeight({ children }) {
  const ref = useRef();
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    // 同步读取高度，避免布局抖动
    setHeight(ref.current.scrollHeight);
  }, [children]);

  return (
    <div ref={ref} style={{ height }}>
      {children}
    </div>
  );
}
```

---

## 问题 3：为什么默认用 useEffect？

### useLayoutEffect 会阻塞渲染

```jsx
useLayoutEffect(() => {
  // 这里的代码会阻塞浏览器绘制
  // 如果执行时间长，用户会感觉卡顿
  heavyComputation();
});
```

### 大多数场景不需要同步

```jsx
// ✅ 数据获取：用 useEffect
useEffect(() => {
  fetchData();
}, []);

// ✅ 事件监听：用 useEffect
useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

// ✅ 日志记录：用 useEffect
useEffect(() => {
  analytics.track("page_view");
}, []);
```

---

## 问题 4：SSR 中的注意事项？

### useLayoutEffect 在 SSR 中会警告

```jsx
// 服务端没有 DOM，useLayoutEffect 无法执行
// React 会发出警告

// 解决方案：条件使用
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
```

## 总结

| 特性     | useEffect    | useLayoutEffect |
| -------- | ------------ | --------------- |
| 执行时机 | 绘制后异步   | 绘制前同步      |
| 阻塞渲染 | 否           | 是              |
| 适用场景 | 大多数副作用 | DOM 测量/修改   |
| SSR      | 正常         | 需要特殊处理    |

**选择原则**：默认用 useEffect，只有在需要避免视觉闪烁时才用 useLayoutEffect。

## 延伸阅读

- [useLayoutEffect 文档](https://react.dev/reference/react/useLayoutEffect)
- [useEffect vs useLayoutEffect](https://kentcdodds.com/blog/useeffect-vs-uselayouteffect)
