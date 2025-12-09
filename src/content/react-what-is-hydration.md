---
title: 什么是 hydration？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 React hydration（水合）的概念、过程和注意事项。
tags:
  - React
  - Hydration
  - SSR
  - 服务端渲染
estimatedTime: 10 分钟
keywords:
  - hydration
  - hydrateRoot
  - SSR
  - server rendering
highlight: Hydration 是将服务端渲染的静态 HTML 与客户端 React 关联，添加事件监听使其可交互。
order: 278
---

## 问题 1：Hydration 的定义？

### 概念

Hydration（水合）是将服务端渲染的**静态 HTML** "激活"为**可交互应用**的过程。

```
服务端 HTML（静态、不可交互）
        ↓
    Hydration
        ↓
React 应用（动态、可交互）
```

### 形象比喻

```jsx
// 服务端渲染的 HTML 像是"干燥的骨架"
// Hydration 就是给骨架"注入水分"，让它活起来

// 具体来说：
// 1. 复用现有 DOM 结构
// 2. 添加事件监听器
// 3. 关联 React 组件状态
```

---

## 问题 2：Hydration 的过程？

### 完整流程

```jsx
// 1. 服务端渲染 HTML
const html = renderToString(<App />);

// 2. 返回给浏览器
<html>
  <body>
    <div id="root">
      <button>Clicked 0 times</button>  <!-- 静态 HTML -->
    </div>
    <script src="bundle.js"></script>
  </body>
</html>

// 3. 用户立即看到内容（但不可交互）

// 4. JavaScript 加载完成

// 5. Hydration
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);

// 6. React 遍历 DOM，关联组件，添加事件
// 7. 按钮现在可以点击了
```

---

## 问题 3：hydrateRoot vs createRoot？

### createRoot（客户端渲染）

```jsx
import { createRoot } from "react-dom/client";

// 清空容器，从头创建 DOM
createRoot(document.getElementById("root")).render(<App />);
```

### hydrateRoot（水合）

```jsx
import { hydrateRoot } from "react-dom/client";

// 复用现有 DOM，只添加事件和状态
hydrateRoot(document.getElementById("root"), <App />);
```

### 区别

| 方面     | createRoot | hydrateRoot |
| -------- | ---------- | ----------- |
| DOM 处理 | 从头创建   | 复用现有    |
| 首屏     | 白屏等待   | 立即显示    |
| 适用场景 | CSR        | SSR         |

---

## 问题 4：Hydration 不匹配问题？

### 常见错误

```jsx
// Warning: Text content did not match.
// Server: "Server" Client: "Client"

function App() {
  // ❌ 服务端和客户端返回不同内容
  return <div>{typeof window === "undefined" ? "Server" : "Client"}</div>;
}
```

### 解决方案

```jsx
function App() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // 只在客户端执行
  }, []);

  return <div>{isClient ? "Client" : "Server"}</div>;
}
```

### 常见不匹配原因

```jsx
// 1. 使用 Date
<span>{new Date().toLocaleString()}</span>

// 2. 使用 Math.random
<span>{Math.random()}</span>

// 3. 检测 window/document
{typeof window !== 'undefined' && <ClientOnly />}
```

---

## 问题 5：suppressHydrationWarning？

### 允许不匹配

```jsx
// 某些情况下允许服务端和客户端不一致
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>

// 只用于确实需要不同内容的场景
// 不要滥用
```

## 总结

| 概念 | 说明                   |
| ---- | ---------------------- |
| 定义 | 静态 HTML → 可交互应用 |
| 作用 | 复用 DOM、添加事件     |
| 要求 | 服务端/客户端渲染一致  |
| API  | hydrateRoot            |

## 延伸阅读

- [hydrateRoot 文档](https://react.dev/reference/react-dom/client/hydrateRoot)
