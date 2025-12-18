---
title: React 的重复渲染日志如何定位？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握定位 React 组件重复渲染问题的方法和工具。
tags:
  - React
  - 调试
  - 重渲染
  - 性能
estimatedTime: 12 分钟
keywords:
  - debug rerender
  - why did you render
  - React DevTools
  - render log
highlight: 使用 React DevTools Profiler、why-did-you-render、console.log 等方法定位重复渲染原因。
order: 696
---

## 问题 1：添加渲染日志

### 简单方法

```jsx
function Component({ data }) {
  console.log("Component render", { data });

  return <div>{data.name}</div>;
}

// 或使用 useRef 计数
function Component() {
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`Rendered ${renderCount.current} times`);

  return <div>...</div>;
}
```

### 封装 Hook

```jsx
function useRenderLog(componentName) {
  const renderCount = useRef(0);
  const prevProps = useRef();

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[${componentName}] Render #${renderCount.current}`);
  });

  return (props) => {
    if (prevProps.current) {
      const changes = Object.keys(props).filter(
        (key) => props[key] !== prevProps.current[key]
      );
      if (changes.length > 0) {
        console.log(`[${componentName}] Changed props:`, changes);
      }
    }
    prevProps.current = props;
  };
}

// 使用
function MyComponent(props) {
  const logRender = useRenderLog("MyComponent");
  logRender(props);

  return <div>...</div>;
}
```

---

## 问题 2：React DevTools Profiler

### 使用步骤

```jsx
// 1. 安装 React DevTools 浏览器扩展
// 2. 打开 DevTools → Profiler 标签
// 3. 点击录制按钮
// 4. 执行导致重渲染的操作
// 5. 停止录制
// 6. 分析结果
```

### 分析内容

```jsx
// Profiler 显示：
// 1. 组件渲染时间
// 2. 渲染原因：
//    - "Props changed"
//    - "State changed"
//    - "Hooks changed"
//    - "Parent rendered"
// 3. 哪些 props/state 变化了
```

### 设置

```jsx
// 在 DevTools 设置中启用：
// "Record why each component rendered while profiling"
// 这样可以看到具体的渲染原因
```

---

## 问题 3：why-did-you-render

### 安装配置

```jsx
// 安装
npm install @welldone-software/why-did-you-render

// wdyr.js
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOnDifferentValues: true
  });
}

// index.js（必须在 React 之前导入）
import './wdyr';
import React from 'react';
```

### 标记组件

```jsx
// 追踪特定组件
function MyComponent() {
  return <div>...</div>;
}
MyComponent.whyDidYouRender = true;

// 追踪 memo 组件
const MemoComponent = React.memo(function MemoComponent() {
  return <div>...</div>;
});
MemoComponent.whyDidYouRender = true;
```

### 输出示例

```
MyComponent re-rendered because of props changes:
  prev: { onClick: ƒ onClick() }
  next: { onClick: ƒ onClick() }

  Different value but equal by reference:
  onClick
```

---

## 问题 4：常见重渲染原因

### 1. 父组件渲染

```jsx
// 父组件渲染导致所有子组件渲染
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Child /> {/* 每次都渲染 */}
    </div>
  );
}

// 解决：React.memo
const Child = React.memo(function Child() {
  return <div>Child</div>;
});
```

### 2. 内联对象/函数

```jsx
// 每次渲染创建新引用
<Child style={{ color: 'red' }} />  // 新对象
<Child onClick={() => {}} />         // 新函数

// 解决：useMemo/useCallback
const style = useMemo(() => ({ color: 'red' }), []);
const handleClick = useCallback(() => {}, []);
```

### 3. Context 变化

```jsx
// Context 值变化导致所有消费者渲染
const value = { user, theme }; // 每次都是新对象

// 解决：拆分 Context 或 useMemo
const value = useMemo(() => ({ user, theme }), [user, theme]);
```

---

## 问题 5：Profiler 组件

### 编程式分析

```jsx
import { Profiler } from "react";

function onRenderCallback(
  id, // 组件 id
  phase, // "mount" 或 "update"
  actualDuration, // 本次渲染耗时
  baseDuration, // 无优化时的预估耗时
  startTime, // 开始时间
  commitTime // 提交时间
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
  });
}

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>;
```

---

## 问题 6：调试清单

```jsx
// 1. 添加 console.log 确认渲染次数
// 2. 使用 Profiler 查看渲染原因
// 3. 检查 props 是否每次都是新引用
// 4. 检查是否有不必要的 state 更新
// 5. 检查 Context 是否频繁变化
// 6. 使用 why-did-you-render 深入分析
```

## 总结

| 工具               | 用途         |
| ------------------ | ------------ |
| console.log        | 快速确认渲染 |
| DevTools Profiler  | 可视化分析   |
| why-did-you-render | 详细原因追踪 |
| Profiler 组件      | 编程式分析   |

## 延伸阅读

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [why-did-you-render](https://github.com/welldone-software/why-did-you-render)
