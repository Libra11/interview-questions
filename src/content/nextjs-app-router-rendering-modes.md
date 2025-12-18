---
title: App Router 中如何控制页面的渲染模式？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入讲解 Next.js App Router 中的渲染模式控制机制，包括静态渲染、动态渲染、流式渲染等多种模式的配置方法和使用场景。
tags:
  - Next.js
  - App Router
  - SSR
  - SSG
estimatedTime: 25 分钟
keywords:
  - Next.js 渲染模式
  - App Router
  - 静态渲染
  - 动态渲染
highlight: 掌握 App Router 中渲染模式的控制方法，是优化 Next.js 应用性能的关键
order: 137
---

## 问题 1：App Router 中有哪些渲染模式？

Next.js App Router 提供了三种主要的渲染模式：

### 1. 静态渲染（Static Rendering）

这是默认的渲染模式，页面在构建时生成 HTML：

```typescript
// app/posts/page.tsx
// 默认就是静态渲染
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

### 2. 动态渲染（Dynamic Rendering）

当检测到动态函数或动态数据时，自动切换为请求时渲染：

```typescript
// app/profile/page.tsx
import { cookies } from "next/headers";

export default async function ProfilePage() {
  // 使用 cookies() 会触发动态渲染
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  return <div>User Profile</div>;
}
```

### 3. 流式渲染（Streaming）

允许页面分块发送，提升首屏加载速度：

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* 这部分会先渲染 */}
      <Suspense fallback={<div>Loading...</div>}>
        {/* 这部分会流式传输 */}
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

---

## 问题 2：如何显式控制渲染模式？

Next.js 提供了多种方式来显式控制渲染模式：

### 1. 使用 Route Segment Config

通过导出配置变量来控制：

```typescript
// app/posts/page.tsx

// 强制动态渲染
export const dynamic = "force-dynamic";

// 或者强制静态渲染
export const dynamic = "force-static";

// 设置重新验证时间（ISR）
export const revalidate = 3600; // 每小时重新生成

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts");
  return <div>{/* ... */}</div>;
}
```

### 2. 在 fetch 请求中控制

可以为单个请求设置缓存策略：

```typescript
// 静态数据获取
const staticData = await fetch("https://api.example.com/static", {
  cache: "force-cache", // 默认值
});

// 动态数据获取
const dynamicData = await fetch("https://api.example.com/dynamic", {
  cache: "no-store", // 每次请求都重新获取
});

// ISR 数据获取
const isrData = await fetch("https://api.example.com/isr", {
  next: { revalidate: 60 }, // 60 秒后重新验证
});
```

### 3. 使用动态函数触发

某些函数会自动触发动态渲染：

```typescript
import { cookies, headers, searchParams } from "next/headers";

export default async function Page({ searchParams }) {
  // 使用这些函数会触发动态渲染
  const cookieStore = cookies();
  const headersList = headers();
  const params = searchParams;

  return <div>Dynamic Page</div>;
}
```

---

## 问题 3：静态渲染和动态渲染如何选择？

选择渲染模式需要考虑数据特性和用户体验：

### 静态渲染适用场景

**适合内容不常变化的页面**：

```typescript
// app/about/page.tsx
// 关于我们页面 - 内容很少变化
export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <p>公司介绍内容...</p>
    </div>
  );
}
```

**优势**：

- 构建时生成，响应速度极快
- 可以部署到 CDN，全球加速
- 服务器压力小，成本低

### 动态渲染适用场景

**适合个性化或实时数据的页面**：

```typescript
// app/dashboard/page.tsx
// 用户仪表板 - 需要实时数据
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 获取当前用户的实时数据
  const user = await getCurrentUser();
  const notifications = await getNotifications(user.id);

  return (
    <div>
      <h1>欢迎, {user.name}</h1>
      <NotificationList items={notifications} />
    </div>
  );
}
```

**优势**：

- 数据始终是最新的
- 可以根据请求上下文个性化内容
- 支持用户认证和授权

### 混合模式（ISR）

**适合需要定期更新的内容**：

```typescript
// app/blog/page.tsx
// 博客列表 - 每 10 分钟更新一次
export const revalidate = 600;

export default async function BlogPage() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

**优势**：

- 兼顾性能和数据新鲜度
- 后台自动重新生成
- 用户始终看到缓存版本（快速）

---

## 问题 4：如何调试和验证渲染模式？

Next.js 提供了多种方式来验证页面的渲染模式：

### 1. 开发模式下的指示器

在开发环境中，Next.js 会在控制台显示渲染信息：

```bash
# 静态渲染
○ /about (Static)

# 动态渲染
λ /dashboard (Dynamic)

# ISR
◐ /blog (ISR: 60s)
```

### 2. 使用 Response Headers

可以检查响应头来判断渲染模式：

```typescript
// app/api/check/route.ts
export async function GET() {
  return new Response("OK", {
    headers: {
      "x-nextjs-cache": "HIT", // 或 MISS, STALE
    },
  });
}
```

### 3. 构建输出分析

运行 `npm run build` 后查看输出：

```bash
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         87.3 kB
├ ○ /about                               1.1 kB         83.2 kB
├ λ /dashboard                           2.3 kB         84.4 kB
└ ◐ /blog (ISR: 600 Seconds)            3.4 kB         85.5 kB

○  (Static)  automatically rendered as static HTML
λ  (Dynamic) server-rendered on demand
◐  (ISR)     incremental static regeneration
```

### 4. 添加调试日志

在组件中添加日志来验证渲染时机：

```typescript
export default async function Page() {
  // 这个日志在构建时出现 = 静态渲染
  // 这个日志在每次请求时出现 = 动态渲染
  console.log("Page rendered at:", new Date().toISOString());

  return <div>Page Content</div>;
}
```

## 延伸阅读

- [Next.js App Router 官方文档 - Rendering](https://nextjs.org/docs/app/building-your-application/rendering)
- [Next.js App Router 官方文档 - Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Next.js App Router 官方文档 - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Understanding Static and Dynamic Rendering in Next.js](https://vercel.com/blog/understanding-static-and-dynamic-rendering)
