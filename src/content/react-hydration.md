---
title: 什么是 hydration（水合）？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React hydration 的概念和过程，掌握 SSR 中水合的作用和注意事项。
tags:
  - React
  - Hydration
  - SSR
  - 服务端渲染
estimatedTime: 12 分钟
keywords:
  - hydration
  - hydrateRoot
  - SSR
  - server rendering
highlight: Hydration 是将服务端渲染的静态 HTML 与客户端 React 关联，使其变为可交互应用。
order: 576
---

## 问题 1：什么是 Hydration？

### 定义

Hydration（水合）是将服务端渲染的**静态 HTML** 与客户端 **React 组件**关联的过程。

```
服务端 HTML（静态）+ React 代码 = 可交互应用
```

### 过程

```jsx
// 1. 服务端渲染 HTML
<div id="root">
  <button>Clicked 0 times</button>
</div>;

// 2. 客户端加载 React
import { hydrateRoot } from "react-dom/client";

// 3. Hydration：关联 HTML 和 React
hydrateRoot(document.getElementById("root"), <App />);

// 4. 按钮变为可交互
```

---

## 问题 2：Hydration vs Render？

### render（客户端渲染）

```jsx
import { createRoot } from "react-dom/client";

// 清空容器，从头创建 DOM
createRoot(document.getElementById("root")).render(<App />);
```

### hydrateRoot（水合）

```jsx
import { hydrateRoot } from "react-dom/client";

// 复用现有 DOM，只添加事件监听和状态
hydrateRoot(document.getElementById("root"), <App />);
```

### 区别

| 方面 | render   | hydrateRoot |
| ---- | -------- | ----------- |
| DOM  | 从头创建 | 复用现有    |
| 首屏 | 白屏等待 | 立即显示    |
| 性能 | 较慢     | 较快        |
| 适用 | CSR      | SSR         |

---

## 问题 3：Hydration 的过程？

### 详细步骤

```jsx
// 1. 用户请求页面
// 2. 服务端执行 React 组件，生成 HTML
const html = renderToString(<App />);

// 3. 返回 HTML 给浏览器
<html>
  <body>
    <div id="root">
      <!-- 服务端渲染的内容 -->
      <div class="app">
        <h1>Hello</h1>
        <button>Click me</button>
      </div>
    </div>
    <script src="/bundle.js"></script>
  </body>
</html>

// 4. 浏览器显示 HTML（可见但不可交互）

// 5. JavaScript 加载完成

// 6. Hydration 开始
hydrateRoot(document.getElementById('root'), <App />);

// 7. React 遍历 DOM，关联组件
// 8. 添加事件监听器
// 9. 应用变为可交互
```

---

## 问题 4：Hydration 的注意事项？

### 1. 服务端和客户端必须一致

```jsx
// ❌ 不一致会报错
function App() {
  // 服务端和客户端返回不同内容
  return <div>{typeof window === "undefined" ? "Server" : "Client"}</div>;
}

// Warning: Text content did not match.

// ✅ 使用 useEffect 处理客户端特有逻辑
function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <div>{isClient ? "Client" : "Server"}</div>;
}
```

### 2. suppressHydrationWarning

```jsx
// 某些情况下允许不一致
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>
```

### 3. 避免 Hydration 不匹配的常见原因

```jsx
// ❌ 使用 Date
<span>{new Date().toLocaleString()}</span>

// ❌ 使用 Math.random
<span>{Math.random()}</span>

// ❌ 检测 window
{typeof window !== 'undefined' && <ClientOnly />}

// ✅ 使用 useEffect
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);
```

---

## 问题 5：React 18 的选择性水合？

### 传统水合的问题

```jsx
// 必须等所有 JS 加载完才能水合
// 大型应用：用户等待时间长
```

### 选择性水合

```jsx
function App() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <Header /> {/* 可以独立水合 */}
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <MainContent /> {/* 可以独立水合 */}
      </Suspense>
    </>
  );
}

// 用户点击 MainContent 区域
// React 优先水合 MainContent
```

## 总结

**Hydration 核心**：

| 方面     | 说明                       |
| -------- | -------------------------- |
| 定义     | 静态 HTML + React = 可交互 |
| 作用     | 复用服务端 HTML，添加交互  |
| 要求     | 服务端/客户端渲染一致      |
| React 18 | 支持选择性水合             |

## 延伸阅读

- [hydrateRoot 文档](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Hydration 错误排查](https://react.dev/link/hydration-mismatch)
