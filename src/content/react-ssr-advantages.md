---
title: SSR 的优势是什么？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解服务端渲染（SSR）的优势，掌握其适用场景。
tags:
  - React
  - SSR
  - 服务端渲染
  - 性能
estimatedTime: 10 分钟
keywords:
  - SSR advantages
  - server side rendering
  - SEO
  - performance
highlight: SSR 的主要优势：更快的首屏渲染、更好的 SEO、更好的社交分享支持。
order: 275
---

## 问题 1：更快的首屏渲染

### CSR 的问题

```
用户请求 → 下载 HTML（空） → 下载 JS → 执行 JS → 渲染页面
                                              ↑
                                         用户才看到内容
```

### SSR 的优势

```
用户请求 → 服务器渲染 HTML → 返回完整 HTML → 用户看到内容
                                    ↑
                              首屏立即可见
                                    ↓
                            下载 JS → Hydration → 可交互
```

### 对比

```jsx
// CSR：首屏时间 = 下载 HTML + 下载 JS + 执行 JS + 渲染
// SSR：首屏时间 = 服务器渲染 + 网络传输

// 对于慢网络/低端设备，SSR 优势更明显
```

---

## 问题 2：更好的 SEO

### CSR 的问题

```html
<!-- CSR 返回的 HTML -->
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <!-- 空的 -->
    <script src="bundle.js"></script>
  </body>
</html>

<!-- 搜索引擎爬虫看到的是空页面 -->
```

### SSR 的优势

```html
<!-- SSR 返回的 HTML -->
<!DOCTYPE html>
<html>
  <body>
    <div id="root">
      <h1>产品标题</h1>
      <p>产品描述...</p>
      <img src="product.jpg" alt="产品图片" />
    </div>
  </body>
</html>

<!-- 搜索引擎爬虫能看到完整内容 -->
```

---

## 问题 3：更好的社交分享

### Open Graph 标签

```jsx
// SSR 可以动态生成 meta 标签
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}
```

### 分享效果

```
CSR：分享链接只显示默认标题和图片
SSR：分享链接显示具体页面的标题、描述和图片
```

---

## 问题 4：更好的性能感知

### 渐进式加载

```jsx
// 使用 Streaming SSR
import { renderToPipeableStream } from "react-dom/server";

// 服务器可以流式发送 HTML
// 用户逐步看到内容，而不是等待全部完成
```

### 选择性 Hydration

```jsx
// React 18 支持选择性 Hydration
<Suspense fallback={<Loading />}>
  <Comments /> {/* 可以独立 hydrate */}
</Suspense>

// 用户点击某区域时，优先 hydrate 该区域
```

---

## 问题 5：SSR 的适用场景

### 适合 SSR

```jsx
// 1. 内容型网站（博客、新闻、电商）
// 2. 需要 SEO 的页面
// 3. 首屏性能要求高
// 4. 需要社交分享的页面
```

### 不适合 SSR

```jsx
// 1. 后台管理系统（不需要 SEO）
// 2. 高度交互的应用（如在线编辑器）
// 3. 用户登录后才能访问的页面
// 4. 实时数据展示（WebSocket）
```

---

## 问题 6：SSR 的代价

### 需要考虑的问题

```jsx
// 1. 服务器成本
// 需要 Node.js 服务器，不能纯静态部署

// 2. 开发复杂度
// 需要处理服务端/客户端差异
if (typeof window !== "undefined") {
  // 客户端代码
}

// 3. TTFB 可能增加
// 服务器渲染需要时间

// 4. 缓存策略
// 需要合理的缓存策略
```

## 总结

| 优势     | 说明             |
| -------- | ---------------- |
| 首屏速度 | 用户更快看到内容 |
| SEO      | 搜索引擎可索引   |
| 社交分享 | 动态 meta 标签   |
| 性能感知 | 渐进式加载       |

**记住**：SSR 不是银弹，需要根据场景选择。

## 延伸阅读

- [Next.js SSR](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)
- [React 服务端渲染](https://react.dev/reference/react-dom/server)
