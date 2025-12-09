---
title: React18 的 SSR 有哪些新特性？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  了解 React 18 在服务端渲染方面的新特性，包括 Streaming SSR 和选择性 Hydration。
tags:
  - React
  - React 18
  - SSR
  - Streaming
estimatedTime: 12 分钟
keywords:
  - React 18 SSR
  - Streaming SSR
  - Selective Hydration
  - renderToPipeableStream
highlight: React 18 SSR 新特性：Streaming HTML、选择性 Hydration、Suspense 支持、并发渲染。
order: 279
---

## 问题 1：Streaming SSR

### 传统 SSR 的问题

```jsx
// React 17：必须等待整个页面渲染完成
const html = renderToString(<App />); // 阻塞直到完成
res.send(html);

// 问题：
// 1. 用户等待时间长
// 2. 服务器内存占用高
// 3. TTFB 慢
```

### React 18 Streaming

```jsx
import { renderToPipeableStream } from "react-dom/server";

app.get("/", (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ["/bundle.js"],
    onShellReady() {
      res.setHeader("Content-Type", "text/html");
      pipe(res); // 流式发送
    },
  });
});

// 优势：
// 1. 用户更快看到内容
// 2. 渐进式加载
// 3. 更好的 TTFB
```

---

## 问题 2：选择性 Hydration

### 传统 Hydration

```jsx
// React 17：必须等所有 JS 加载完才能 hydrate
// 整个页面要么全部可交互，要么全部不可交互
```

### React 18 选择性 Hydration

```jsx
function App() {
  return (
    <>
      <Header /> {/* 可以独立 hydrate */}
      <Suspense fallback={<Spinner />}>
        <MainContent /> {/* 可以独立 hydrate */}
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <Comments /> {/* 可以独立 hydrate */}
      </Suspense>
    </>
  );
}

// 优势：
// 1. 部分内容先可交互
// 2. 用户点击的区域优先 hydrate
// 3. 更好的交互体验
```

### 优先级 Hydration

```jsx
// 用户点击 Comments 区域
// React 会优先 hydrate Comments
// 即使 MainContent 的 JS 先加载完成
```

---

## 问题 3：Suspense 支持 SSR

### React 17 的限制

```jsx
// React 17：Suspense 在 SSR 中不工作
// 会直接渲染 fallback 或报错
```

### React 18 的支持

```jsx
// React 18：Suspense 完全支持 SSR
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}

// 服务端：
// 1. 先发送 fallback
// 2. 组件准备好后，发送实际内容
// 3. 客户端自动替换
```

---

## 问题 4：新的 API

### renderToPipeableStream（Node.js）

```jsx
import { renderToPipeableStream } from "react-dom/server";

const { pipe, abort } = renderToPipeableStream(<App />, {
  bootstrapScripts: ["/bundle.js"],

  onShellReady() {
    // shell（非 Suspense 部分）准备好
    pipe(res);
  },

  onShellError(error) {
    // shell 渲染出错
    res.status(500).send("Error");
  },

  onAllReady() {
    // 所有内容（包括 Suspense）准备好
  },

  onError(error) {
    console.error(error);
  },
});

// 超时处理
setTimeout(() => abort(), 10000);
```

### renderToReadableStream（Web Streams）

```jsx
// 用于 Deno、Cloudflare Workers 等
import { renderToReadableStream } from "react-dom/server";

const stream = await renderToReadableStream(<App />, {
  bootstrapScripts: ["/bundle.js"],
});

return new Response(stream, {
  headers: { "Content-Type": "text/html" },
});
```

---

## 问题 5：与 React 17 对比

| 特性         | React 17       | React 18               |
| ------------ | -------------- | ---------------------- |
| 渲染方式     | 一次性         | 流式                   |
| Hydration    | 全量           | 选择性                 |
| Suspense SSR | 不支持         | 支持                   |
| 用户交互     | 全部完成后     | 渐进式                 |
| API          | renderToString | renderToPipeableStream |

## 总结

**React 18 SSR 新特性**：

1. **Streaming SSR**：流式发送 HTML
2. **选择性 Hydration**：部分优先可交互
3. **Suspense SSR**：异步组件支持
4. **优先级 Hydration**：用户交互优先

## 延伸阅读

- [React 18 SSR](https://react.dev/reference/react-dom/server)
- [Streaming SSR 架构](https://github.com/reactwg/react-18/discussions/37)
