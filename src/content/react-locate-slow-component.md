---
title: 一个组件变慢，你如何定位？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握定位 React 组件性能问题的系统方法。
tags:
  - React
  - 性能
  - 调试
  - 优化
estimatedTime: 12 分钟
keywords:
  - slow component
  - performance debugging
  - React profiler
  - optimization
highlight: 定位慢组件的步骤：Profiler 分析、检查渲染次数、检查渲染耗时、分析原因、针对性优化。
order: 294
---

## 问题 1：使用 React DevTools Profiler

### 第一步：录制性能数据

```jsx
// 1. 打开 React DevTools → Profiler
// 2. 点击录制按钮
// 3. 执行导致卡顿的操作
// 4. 停止录制
```

### 第二步：分析结果

```jsx
// 查看火焰图：
// - 横轴：渲染时间
// - 颜色：黄色/红色表示耗时长

// 关注：
// 1. 哪个组件渲染时间最长？
// 2. 哪个组件渲染次数最多？
// 3. 渲染原因是什么？
```

---

## 问题 2：检查渲染次数

### 添加渲染日志

```jsx
function SlowComponent() {
  console.log("SlowComponent render");
  // 或使用 useRef 计数
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`Rendered ${renderCount.current} times`);

  return <div>...</div>;
}
```

### 使用 why-did-you-render

```jsx
// 安装后标记组件
SlowComponent.whyDidYouRender = true;

// 控制台会显示：
// SlowComponent re-rendered because props changed:
// { onClick: [Function] → [Function] }
```

---

## 问题 3：检查渲染耗时

### console.time

```jsx
function SlowComponent({ data }) {
  console.time("SlowComponent");

  // 组件逻辑
  const result = processData(data);

  console.timeEnd("SlowComponent");
  // 输出：SlowComponent: 234.56ms

  return <div>{result}</div>;
}
```

### 分段计时

```jsx
function SlowComponent({ data }) {
  console.time("calculation");
  const calculated = expensiveCalculation(data);
  console.timeEnd("calculation");

  console.time("render");
  const elements = calculated.map((item) => <Item key={item.id} data={item} />);
  console.timeEnd("render");

  return <div>{elements}</div>;
}
```

---

## 问题 4：常见原因和解决方案

### 原因 1：不必要的重渲染

```jsx
// 问题：父组件渲染导致子组件渲染
// 解决：React.memo
const SlowComponent = React.memo(function SlowComponent({ data }) {
  return <div>{/* ... */}</div>;
});
```

### 原因 2：props 引用变化

```jsx
// 问题：每次都传新的对象/函数
<SlowComponent
  style={{ color: "red" }} // 每次新对象
  onClick={() => {}} // 每次新函数
/>;

// 解决：useMemo/useCallback
const style = useMemo(() => ({ color: "red" }), []);
const handleClick = useCallback(() => {}, []);
```

### 原因 3：昂贵的计算

```jsx
// 问题：每次渲染都计算
function SlowComponent({ items }) {
  const sorted = items.sort((a, b) => a.value - b.value);
  const filtered = sorted.filter((item) => item.active);
  // ...
}

// 解决：useMemo
const processed = useMemo(() => {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  return sorted.filter((item) => item.active);
}, [items]);
```

### 原因 4：大列表渲染

```jsx
// 问题：渲染大量 DOM
function SlowList({ items }) {
  return items.map((item) => <Item key={item.id} {...item} />);
}

// 解决：虚拟列表
import { FixedSizeList } from "react-window";
```

---

## 问题 5：系统化排查流程

### 排查清单

```jsx
// 1. 是否渲染次数过多？
//    → Profiler 查看渲染次数
//    → why-did-you-render 查看原因

// 2. 单次渲染是否耗时？
//    → console.time 计时
//    → 分段定位耗时部分

// 3. 是否有昂贵计算？
//    → useMemo 缓存

// 4. 是否有大量 DOM？
//    → 虚拟列表

// 5. 是否有不必要的 props 变化？
//    → useMemo/useCallback
```

### 优化优先级

```jsx
// 1. 先减少渲染次数（效果最明显）
// 2. 再优化单次渲染耗时
// 3. 最后考虑虚拟化
```

## 总结

| 步骤     | 工具/方法             |
| -------- | --------------------- |
| 发现问题 | Profiler 录制         |
| 定位组件 | 火焰图分析            |
| 分析原因 | why-did-you-render    |
| 测量耗时 | console.time          |
| 针对优化 | memo/useMemo/虚拟列表 |

## 延伸阅读

- [React Profiler](https://react.dev/reference/react/Profiler)
- [性能优化](https://react.dev/learn/render-and-commit)
