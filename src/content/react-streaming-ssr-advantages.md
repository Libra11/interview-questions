---
title: Streaming SSR 的优势？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  理解 Streaming SSR 相比传统 SSR 的优势和适用场景。
tags:
  - React
  - Streaming SSR
  - 性能
  - SSR
estimatedTime: 10 分钟
keywords:
  - Streaming SSR
  - streaming advantages
  - TTFB
  - progressive rendering
highlight: Streaming SSR 优势：更快的 TTFB、渐进式渲染、更好的用户体验、更低的服务器压力。
order: 280
---

## 问题 1：更快的 TTFB

### 传统 SSR

```
请求 → [====服务器渲染整个页面====] → 返回 HTML → 用户看到内容
                                        ↑
                                   TTFB 很长
```

### Streaming SSR

```
请求 → [渲染 Header] → 发送 → 用户看到 Header
       [渲染 Main]   → 发送 → 用户看到 Main
       [渲染 Footer] → 发送 → 用户看到 Footer
              ↑
         TTFB 很短
```

### 代码示例

```jsx
// 传统：等待所有数据
const data = await fetchAllData(); // 可能需要 2 秒
const html = renderToString(<App data={data} />);
res.send(html); // 2 秒后才开始发送

// Streaming：立即开始发送
const { pipe } = renderToPipeableStream(<App />);
pipe(res); // 立即开始发送
```

---

## 问题 2：渐进式渲染

### 用户体验

```jsx
function App() {
  return (
    <>
      <Header /> {/* 立即显示 */}
      <Suspense fallback={<Skeleton />}>
        <SlowContent /> {/* 稍后显示 */}
      </Suspense>
      <Footer /> {/* 立即显示 */}
    </>
  );
}

// 用户看到的顺序：
// 1. Header + Skeleton + Footer（立即）
// 2. SlowContent 替换 Skeleton（数据准备好后）
```

### 对比

```
传统 SSR：
[========等待========] → [完整页面]
        2秒                  ↑
                        用户才看到内容

Streaming SSR：
[Header] → [Main加载中] → [Main内容] → [完成]
   ↑           ↑              ↑
  0.1秒      0.2秒          2秒
用户立即看到骨架，逐步看到内容
```

---

## 问题 3：更低的服务器压力

### 内存使用

```jsx
// 传统 SSR：整个 HTML 在内存中
const html = renderToString(<App />); // 可能很大
res.send(html);

// Streaming SSR：分块发送，内存占用低
const { pipe } = renderToPipeableStream(<App />);
pipe(res); // 边渲染边发送
```

### 并发处理

```jsx
// 传统：一个请求占用资源直到完成
// Streaming：资源可以更快释放

// 相同服务器资源下，Streaming 可以处理更多并发请求
```

---

## 问题 4：更好的错误处理

### 部分失败不影响整体

```jsx
function App() {
  return (
    <>
      <Header /> {/* 正常显示 */}
      <ErrorBoundary fallback={<ErrorUI />}>
        <Suspense fallback={<Loading />}>
          <BuggyComponent /> {/* 出错 */}
        </Suspense>
      </ErrorBoundary>
      <Footer /> {/* 正常显示 */}
    </>
  );
}

// BuggyComponent 出错不影响 Header 和 Footer
```

### 超时处理

```jsx
const { pipe, abort } = renderToPipeableStream(<App />, {
  onShellReady() {
    pipe(res);
  },
});

// 10 秒超时
setTimeout(() => {
  abort(); // 中止渲染，返回已有内容
}, 10000);
```

---

## 问题 5：SEO 友好

### 搜索引擎爬虫

```jsx
// Streaming SSR 对 SEO 同样友好
// 爬虫会等待完整内容

// 重要内容放在前面
function App() {
  return (
    <>
      <MainContent /> {/* SEO 重要内容先发送 */}
      <Suspense fallback={<Loading />}>
        <Comments /> {/* 次要内容后发送 */}
      </Suspense>
    </>
  );
}
```

## 总结

| 优势           | 说明               |
| -------------- | ------------------ |
| 更快 TTFB      | 立即开始发送       |
| 渐进式渲染     | 用户更快看到内容   |
| 低内存占用     | 边渲染边发送       |
| 更好的错误处理 | 部分失败不影响整体 |
| SEO 友好       | 完整内容可被索引   |

## 延伸阅读

- [Streaming SSR 架构](https://github.com/reactwg/react-18/discussions/37)
- [renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
