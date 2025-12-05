---
title: 如何优化 TTFB？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握优化 Next.js 应用 TTFB（Time To First Byte）的各种方法，提升首屏加载速度
tags:
  - Next.js
  - 性能优化
  - TTFB
  - 边缘计算
estimatedTime: 22 分钟
keywords:
  - TTFB 优化
  - 首字节时间
  - 性能优化
  - Edge Runtime
highlight: 通过静态生成、边缘部署和缓存策略可以显著降低 TTFB
order: 10
---

## 问题 1：什么是 TTFB？

TTFB（Time To First Byte）是从浏览器发起请求到接收到第一个字节的时间。

### 组成部分

```
TTFB = DNS 查询 + TCP 连接 + TLS 握手 + 服务器处理 + 网络传输
```

**详细分解**：

```javascript
// 1. DNS 查询（20-120ms）
example.com → IP 地址

// 2. TCP 连接（20-100ms）
建立 TCP 连接

// 3. TLS 握手（50-200ms）
HTTPS 加密协商

// 4. 服务器处理（10-1000ms+）
Next.js 渲染页面

// 5. 网络传输（10-100ms）
第一个字节到达浏览器
```

### 理想值

```
优秀：< 200ms
良好：200-500ms
需要优化：500-1000ms
较差：> 1000ms
```

---

## 问题 2：如何通过渲染策略优化 TTFB？

不同的渲染策略对 TTFB 有巨大影响。

### 静态生成（最优）

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// TTFB：10-50ms
// 原因：页面在构建时已生成，直接返回 HTML
```

### ISR（次优）

```javascript
// app/posts/page.tsx
export const revalidate = 3600; // 1 小时

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// 首次访问 TTFB：200-500ms（需要生成）
// 后续访问 TTFB：10-50ms（使用缓存）
```

### 动态渲染（较差）

```javascript
// app/dashboard/page.tsx
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const token = cookies().get("token");
  const user = await fetch("https://api.example.com/user", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  return <Dashboard user={user} />;
}

// TTFB：200-1000ms+
// 原因：每次请求都需要渲染和获取数据
```

### 优化策略

```javascript
// ❌ 全部动态渲染
export default async function Page() {
  const user = await getUserData(); // 500ms
  const posts = await getPosts(); // 300ms
  const comments = await getComments(); // 200ms

  return <div>{/* ... */}</div>;
}
// TTFB：1000ms+

// ✅ 分离静态和动态部分
// 静态部分
export default function Page() {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}

// 动态部分
async function DynamicContent() {
  const user = await getUserData();
  return <UserDashboard user={user} />;
}

// TTFB：50ms（静态部分立即返回）
// 动态内容流式传输
```

---

## 问题 3：如何通过边缘部署优化 TTFB？

将内容部署到离用户更近的位置可以显著降低 TTFB。

### Edge Runtime

```javascript
// app/api/data/route.ts
export const runtime = "edge"; // 使用 Edge Runtime

export async function GET() {
  const data = await fetch("https://api.example.com/data").then((r) =>
    r.json()
  );

  return Response.json(data);
}

// 优势：
// - 全球分布式部署
// - 请求路由到最近的节点
// - 减少网络延迟
```

### Middleware 优化

```javascript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // 在边缘节点处理请求
  const country = request.geo?.country;

  // 根据地理位置重定向
  if (country === "CN" && !request.nextUrl.pathname.startsWith("/cn")) {
    return NextResponse.redirect(new URL("/cn", request.url));
  }

  return NextResponse.next();
}

// 优势：
// - 在边缘节点做决策
// - 避免到源服务器的往返
// - TTFB 降低 50-200ms
```

### 静态资源 CDN

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ["cdn.example.com"],
  },
  assetPrefix:
    process.env.NODE_ENV === "production" ? "https://cdn.example.com" : "",
};

// 效果：
// - 静态资源从 CDN 加载
// - 减少主服务器压力
// - 提升全球访问速度
```

### 地理位置优化

```javascript
// 根据用户位置返回不同内容
// middleware.ts
export function middleware(request: NextRequest) {
  const country = request.geo?.country || "US";
  const city = request.geo?.city || "";

  // 设置请求头
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-country", country);
  requestHeaders.set("x-user-city", city);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// app/page.tsx
import { headers } from "next/headers";

export default function HomePage() {
  const country = headers().get("x-user-country");

  // 根据国家返回本地化内容
  return <LocalizedContent country={country} />;
}
```

---

## 问题 4：如何通过数据获取优化 TTFB？

数据获取是影响 TTFB 的主要因素之一。

### 并行获取

```javascript
// ❌ 串行获取
export default async function Page() {
  const user = await fetch('/api/user').then(r => r.json()); // 200ms
  const posts = await fetch('/api/posts').then(r => r.json()); // 300ms
  const comments = await fetch('/api/comments').then(r => r.json()); // 200ms

  return <div>{/* ... */}</div>;
}
// 总时间：700ms

// ✅ 并行获取
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json()),
  ]);

  return <div>{/* ... */}</div>;
}
// 总时间：300ms（最慢的那个）
```

### 预加载关键数据

```javascript
// app/posts/[id]/page.tsx
export async function generateMetadata({ params }) {
  // 预加载数据用于 metadata
  const post = await fetch(`https://api.example.com/posts/${params.id}`).then(
    (r) => r.json()
  );

  return {
    title: post.title,
  };
}

export default async function PostPage({ params }) {
  // Request Memoization 会复用上面的请求
  const post = await fetch(`https://api.example.com/posts/${params.id}`).then(
    (r) => r.json()
  );

  return <Article post={post} />;
}

// 优势：
// - 同一个请求只发起一次
// - metadata 和页面内容共享数据
```

### 使用缓存

```javascript
// ✅ 充分利用缓存
export default async function Page() {
  // 静态配置：长期缓存
  const config = await fetch("https://api.example.com/config", {
    next: { revalidate: 86400 }, // 1 天
  }).then((r) => r.json());

  // 文章列表：中期缓存
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 }, // 1 小时
  }).then((r) => r.json());

  return <div>{/* ... */}</div>;
}

// 缓存命中时 TTFB：10-50ms
// 缓存未命中时 TTFB：200-500ms
```

### Streaming 和 Suspense

```javascript
// app/posts/page.tsx
import { Suspense } from "react";

export default function PostsPage() {
  return (
    <div>
      {/* 快速返回静态部分 */}
      <Header />

      {/* 慢速数据流式传输 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

async function Posts() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

async function Comments() {
  const comments = await fetch("https://api.example.com/comments").then((r) =>
    r.json()
  );
  return <CommentList comments={comments} />;
}

// TTFB：50ms（Header 立即返回）
// Posts 和 Comments 流式传输，不阻塞 TTFB
```

---

## 问题 5：其他优化 TTFB 的方法

### 减少服务器处理时间

```javascript
// ❌ 复杂的服务器端计算
export default async function Page() {
  const data = await fetch('/api/data').then(r => r.json());

  // 复杂的数据处理
  const processed = data.map(item => {
    // 大量计算...
    return heavyComputation(item);
  });

  return <div>{/* ... */}</div>;
}

// ✅ 将计算移到客户端或后台
export default async function Page() {
  const data = await fetch('/api/data').then(r => r.json());

  // 直接返回原始数据
  return <ClientSideProcessor data={data} />;
}

// 客户端处理
'use client';
export function ClientSideProcessor({ data }) {
  const processed = useMemo(() => {
    return data.map(item => heavyComputation(item));
  }, [data]);

  return <div>{/* ... */}</div>;
}
```

### 数据库查询优化

```javascript
// ❌ N+1 查询问题
export default async function PostsPage() {
  const posts = await db.post.findMany();

  // 为每个 post 单独查询作者
  const postsWithAuthors = await Promise.all(
    posts.map(async post => ({
      ...post,
      author: await db.user.findUnique({ where: { id: post.authorId } })
    }))
  );

  return <PostList posts={postsWithAuthors} />;
}

// ✅ 使用 JOIN 或 include
export default async function PostsPage() {
  const posts = await db.post.findMany({
    include: {
      author: true, // 一次查询获取所有数据
    },
  });

  return <PostList posts={posts} />;
}
```

### HTTP/2 和 HTTP/3

```javascript
// next.config.js
module.exports = {
  // Vercel 自动启用 HTTP/2 和 HTTP/3
  // 自托管时确保服务器支持
};

// 优势：
// - 多路复用，减少连接开销
// - 头部压缩，减少传输数据
// - 服务器推送（HTTP/2）
```

### 预连接和 DNS 预解析

```javascript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="https://api.example.com" />

        {/* 预连接 */}
        <link rel="preconnect" href="https://api.example.com" />
        <link rel="preconnect" href="https://cdn.example.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}

// 效果：
// - 提前进行 DNS 查询
// - 提前建立 TCP 连接
// - 减少后续请求的延迟
```

### 监控和分析

```javascript
// 使用 Next.js Analytics
// next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};

// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // 监控服务器端性能
    const { registerOTel } = await import("@vercel/otel");
    registerOTel("next-app");
  }
}

// 使用 Web Vitals
// app/layout.tsx
("use client");

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (metric.name === "TTFB") {
      console.log("TTFB:", metric.value);
      // 发送到分析服务
    }
  });
}
```

---

## 总结

**核心概念总结**：

### 1. 渲染策略优化

- 优先使用静态生成（TTFB < 50ms）
- ISR 平衡性能和新鲜度
- 避免不必要的动态渲染
- 使用 Streaming 和 Suspense

### 2. 边缘部署

- 使用 Edge Runtime 处理请求
- Middleware 在边缘做决策
- CDN 加速静态资源
- 地理位置优化

### 3. 数据获取优化

- 并行获取多个数据源
- 充分利用缓存
- Request Memoization 避免重复请求
- 优化数据库查询

### 4. 其他优化

- 减少服务器端计算
- 使用 HTTP/2 和 HTTP/3
- DNS 预解析和预连接
- 持续监控和分析

## 延伸阅读

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Edge Runtime](https://edge-runtime.vercel.app/)
- [HTTP/2](https://developers.google.com/web/fundamentals/performance/http2)
- [Vercel Analytics](https://vercel.com/docs/analytics)
