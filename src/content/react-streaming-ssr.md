---
title: 什么是 Streaming SSR？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 18 流式 SSR 的概念和优势，掌握它如何提升首屏加载体验。
tags:
  - React
  - SSR
  - Streaming
  - 服务端渲染
estimatedTime: 15 分钟
keywords:
  - streaming SSR
  - renderToPipeableStream
  - selective hydration
  - server rendering
highlight: Streaming SSR 允许服务端边渲染边发送 HTML，客户端可以选择性水合，大幅提升首屏体验。
order: 230
---

## 问题 1：传统 SSR 的问题？

### 传统 SSR 流程

```
服务端：[===渲染全部 HTML===] → 发送
客户端：                        接收 → [===下载 JS===] → [===水合全部===]
```

### 问题

1. **全部渲染完才发送**：慢的组件阻塞整个页面
2. **全部下载完才水合**：大 JS 包阻塞交互
3. **全部水合完才可交互**：用户等待时间长

---

## 问题 2：Streaming SSR 如何解决？

### 流式渲染

```jsx
// 服务端
import { renderToPipeableStream } from "react-dom/server";

app.get("/", (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ["/main.js"],
    onShellReady() {
      res.setHeader("Content-Type", "text/html");
      pipe(res); // 开始流式发送
    },
  });
});
```

### 流式发送过程

```
服务端：[Header] → [Shell] → [Content A] → [Content B] → ...
客户端：接收 Header → 显示骨架 → 填充 A → 填充 B → ...
```

---

## 问题 3：Suspense 如何配合 Streaming？

### 服务端 Suspense

```jsx
function App() {
  return (
    <html>
      <body>
        <Header /> {/* 立即发送 */}
        <Suspense fallback={<Spinner />}>
          <SlowContent /> {/* 稍后发送 */}
        </Suspense>
        <Footer /> {/* 立即发送 */}
      </body>
    </html>
  );
}
```

### 发送顺序

```html
<!-- 第一批：Shell -->
<html>
  <body>
    <header>...</header>
    <div id="content"><span>Loading...</span></div>
    <footer>...</footer>
  </body>
</html>

<!-- 第二批：替换内容 -->
<script>
  // 替换 #content 的内容
  $RC("content", "<div>Actual Content</div>");
</script>
```

---

## 问题 4：什么是选择性水合？

### 传统水合

```jsx
// 必须等所有 JS 加载完才能水合
hydrateRoot(document, <App />);

// 问题：用户点击按钮，但还没水合，无响应
```

### 选择性水合

```jsx
function App() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <HeavyComponent />
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <AnotherComponent />
      </Suspense>
    </>
  );
}

// 每个 Suspense 边界可以独立水合
// 用户点击的区域优先水合
```

### 优先级水合

```
用户点击 AnotherComponent 区域
  ↓
React 优先水合 AnotherComponent
  ↓
AnotherComponent 可交互
  ↓
继续水合 HeavyComponent
```

---

## 问题 5：实际使用示例？

### Next.js App Router

```jsx
// app/page.js
import { Suspense } from "react";

async function SlowData() {
  const data = await fetchSlowData(); // 3秒
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>标题</h1> {/* 立即显示 */}
      <Suspense fallback={<Loading />}>
        <SlowData /> {/* 流式发送 */}
      </Suspense>
    </div>
  );
}
```

### 效果

```
0s: 用户看到标题 + Loading
3s: Loading 被替换为实际内容
```

而不是：

```
3s: 用户才看到整个页面
```

## 总结

| 特性       | 传统 SSR   | Streaming SSR |
| ---------- | ---------- | ------------- |
| 发送时机   | 全部渲染完 | 边渲染边发送  |
| 水合方式   | 全部水合   | 选择性水合    |
| 首屏时间   | 慢         | 快            |
| 可交互时间 | 慢         | 渐进式        |

## 延伸阅读

- [renderToPipeableStream 文档](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [New Suspense SSR Architecture](https://github.com/reactwg/react-18/discussions/37)
