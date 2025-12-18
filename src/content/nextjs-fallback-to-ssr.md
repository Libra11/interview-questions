---
title: 什么时候页面会自动 fallback 到 SSR？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 页面从静态生成降级到服务端渲染的机制，掌握 fallback 行为的触发条件。
tags:
  - Next.js
  - SSR
  - fallback
  - 动态渲染
estimatedTime: 18 分钟
keywords:
  - fallback
  - SSR
  - 动态渲染
  - 降级机制
highlight: 理解 Next.js 何时以及为何从静态生成切换到服务端渲染
order: 725
---

## 问题 1：什么是 fallback 到 SSR？

**从静态到动态的切换**

当页面无法静态生成时，Next.js 会自动切换到服务端渲染（SSR）。

```typescript
// app/products/[id]/page.tsx

// 尝试静态生成
export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export const dynamicParams = true; // 允许动态参数

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);
  return <div>{product.name}</div>;
}

// 构建时：
// - /products/1 → 静态生成
// - /products/2 → 静态生成

// 运行时：
// - 访问 /products/3 → fallback 到 SSR
// - 服务端动态渲染
// - 返回 HTML
```

---

## 问题 2：哪些情况会触发 fallback 到 SSR？

**1. 访问未预生成的动态路由**

```typescript
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  // 只生成前 10 篇文章
  const posts = await fetchRecentPosts(10);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export const dynamicParams = true; // 允许其他参数

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}

// 构建时：
// - 生成 10 个静态页面

// 运行时：
// - 访问预生成的文章 → 返回静态 HTML
// - 访问其他文章 → fallback 到 SSR
```

**2. 使用动态函数**

```typescript
// app/dashboard/page.tsx
import { cookies } from "next/headers";

export default function Dashboard() {
  // 使用 cookies() 触发动态渲染
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  // 无法静态生成，自动 fallback 到 SSR
  return <div>Token: {token?.value}</div>;
}
```

**3. 使用 no-cache 的 fetch**

```typescript
// app/news/page.tsx

export default async function NewsPage() {
  // cache: 'no-cache' 触发动态渲染
  const news = await fetch("https://api.example.com/news", {
    cache: "no-cache",
  });

  // 无法静态生成，fallback 到 SSR
  return <div>{news.data}</div>;
}
```

**4. 使用 searchParams**

```typescript
// app/search/page.tsx

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  // 访问 searchParams 触发动态渲染
  const query = searchParams.q;

  // 无法静态生成，fallback 到 SSR
  return <div>Search: {query}</div>;
}
```

---

## 问题 3：如何控制 fallback 行为？

**dynamicParams 配置**

```typescript
// app/products/[id]/page.tsx

// 允许 fallback（默认）
export const dynamicParams = true;

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export default function ProductPage({ params }) {
  // 访问 /products/3 → fallback 到 SSR
  return <div>Product {params.id}</div>;
}

// 禁止 fallback
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export default function ProductPage({ params }) {
  // 访问 /products/3 → 404
  return <div>Product {params.id}</div>;
}
```

**dynamic 配置**

```typescript
// 强制动态渲染（总是 SSR）
export const dynamic = "force-dynamic";

export default async function Page() {
  // 总是服务端渲染，不尝试静态生成
  return <div>Always SSR</div>;
}

// 强制静态生成（禁止 fallback）
export const dynamic = "force-static";

export default async function Page() {
  // 必须静态生成，使用动态特性会报错
  return <div>Always Static</div>;
}
```

---

## 问题 4：fallback 到 SSR 的性能影响？

**性能对比**

```typescript
// 静态生成（最快）
export default async function StaticPage() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 },
  });

  return <div>{data.content}</div>;
}

// 访问时：
// - 直接返回预生成的 HTML
// - TTFB: ~10ms
// - 极快的加载速度

// Fallback 到 SSR（较慢）
export const dynamicParams = true;

export default async function DynamicPage({ params }) {
  const data = await fetchData(params.id);

  return <div>{data.content}</div>;
}

// 访问未预生成的页面时：
// - 服务端获取数据
// - 服务端渲染 HTML
// - 返回 HTML
// - TTFB: ~200-500ms
// - 比静态慢，但比 CSR 快
```

**优化策略**

```typescript
// 1. 生成热门页面
export async function generateStaticParams() {
  // 生成访问量最高的页面
  const popularProducts = await fetchPopularProducts(100);

  return popularProducts.map((product) => ({
    id: product.id,
  }));
}

// 2. 使用 ISR 缓存 fallback 页面
export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 60 }, // 缓存 60 秒
  });

  return <div>{product.name}</div>;
}

// 首次访问：SSR（慢）
// 后续访问：返回缓存（快）
```

---

## 问题 5：如何监控和调试 fallback 行为？

**查看构建输出**

```bash
npm run build

# 输出示例：
Route (app)                              Size     First Load JS
├ ○ /products/1                          1.5 kB         81 kB
├ ○ /products/2                          1.5 kB         81 kB
└ ƒ /products/[id]                       1.5 kB         81 kB

# ○ - 静态生成的页面
# ƒ - 动态渲染（fallback）
```

**运行时日志**

```typescript
// app/products/[id]/page.tsx

export default async function ProductPage({ params }) {
  // 记录渲染模式
  console.log("[Render]", {
    id: params.id,
    mode: "SSR",
    timestamp: new Date().toISOString(),
  });

  const product = await fetchProduct(params.id);

  return <div>{product.name}</div>;
}

// 服务端日志：
// [Render] { id: '3', mode: 'SSR', timestamp: '2025-12-04T...' }
```

**性能监控**

```typescript
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(request) {
  const start = Date.now();

  const response = NextResponse.next();

  const duration = Date.now() - start;

  // 记录响应时间
  console.log({
    url: request.url,
    duration,
    cached: response.headers.get("x-nextjs-cache"),
  });

  return response;
}
```

---

## 总结

**核心概念**：

### 1. fallback 到 SSR 的触发条件

- 访问未预生成的动态路由
- 使用动态函数（cookies、headers）
- 使用 no-cache 的 fetch
- 使用 searchParams

### 2. 控制 fallback

```typescript
// 允许 fallback
export const dynamicParams = true;

// 禁止 fallback（返回 404）
export const dynamicParams = false;

// 强制 SSR
export const dynamic = "force-dynamic";

// 强制静态
export const dynamic = "force-static";
```

### 3. 性能影响

**静态生成**：

- TTFB: ~10ms
- 极快

**Fallback SSR**：

- TTFB: ~200-500ms
- 较慢，但比 CSR 快

### 4. 优化策略

- 生成热门页面
- 使用 ISR 缓存 fallback 页面
- 监控 fallback 频率
- 调整预生成数量

### 5. 最佳实践

- 为热门内容预生成静态页面
- 允许 dynamicParams 处理长尾内容
- 使用 ISR 缓存动态生成的页面
- 监控性能指标

## 延伸阅读

- [Next.js 官方文档 - generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js 官方文档 - dynamicParams](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams)
- [Next.js 官方文档 - Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
