---
title: 增量静态生成（ISR）是如何实现的？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 增量静态再生成（ISR）的工作原理，掌握如何在不重新构建的情况下更新静态页面。
tags:
  - Next.js
  - ISR
  - 静态生成
  - 缓存策略
estimatedTime: 24 分钟
keywords:
  - ISR
  - 增量静态再生成
  - revalidate
  - 缓存更新
highlight: 理解 ISR 如何平衡静态生成的性能和内容的新鲜度
order: 727
---

## 问题 1：什么是 ISR？

**增量静态再生成（Incremental Static Regeneration）**

ISR 允许在不重新构建整个网站的情况下，更新特定的静态页面。

```typescript
// app/blog/[slug]/page.tsx

export default async function BlogPost({ params }) {
  // 使用 revalidate 启用 ISR
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 60 }, // 每 60 秒重新验证
  });

  return <article>{post.content}</article>;
}

// 工作流程：
// 1. 首次请求：生成静态 HTML，缓存 60 秒
// 2. 60 秒内的请求：返回缓存的 HTML（极快）
// 3. 60 秒后的首次请求：
//    - 立即返回旧的缓存 HTML（用户不等待）
//    - 后台重新生成新的 HTML
//    - 下次请求返回新的 HTML
```

**传统 SSG vs ISR**

```typescript
// 传统 SSG：构建时生成
export default async function Page() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}

// 问题：
// - 数据更新需要重新构建
// - 大型网站构建时间长
// - 内容可能过时

// ISR：按需更新
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // 每小时更新
  });

  return <div>{data.content}</div>;
}

// 优势：
// - 无需重新构建
// - 保持静态生成的性能
// - 内容定期更新
```

---

## 问题 2：ISR 的工作原理是什么？

**Stale-While-Revalidate 策略**

ISR 使用 "stale-while-revalidate" 缓存策略。

```typescript
// app/products/[id]/page.tsx

export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 60 },
  });

  return <div>{product.name}</div>;
}

// 时间线：
// T=0s:  首次请求
//        → 生成 HTML
//        → 缓存 60 秒
//        → 返回 HTML

// T=30s: 第二次请求
//        → 缓存仍有效
//        → 直接返回缓存的 HTML（极快）

// T=70s: 第三次请求（缓存过期）
//        → 立即返回旧的缓存 HTML（用户不等待）
//        → 后台触发重新生成
//        → 更新缓存

// T=80s: 第四次请求
//        → 返回新生成的 HTML
```

**缓存层级**

```typescript
// ISR 的缓存层级：

// 1. CDN 缓存（如果使用）
//    - 最快
//    - 地理位置最近

// 2. Next.js 缓存
//    - 应用服务器缓存
//    - 控制 revalidate

// 3. 数据源
//    - API 或数据库
//    - 只在重新验证时访问
```

---

## 问题 3：如何配置 ISR？

**使用 fetch 的 revalidate**

```typescript
// app/posts/[id]/page.tsx

// 方式 1：fetch 级别的 revalidate
export default async function Post({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: { revalidate: 3600 }, // 每小时重新验证
  });

  return <article>{post.content}</article>;
}

// 方式 2：多个 fetch，不同的 revalidate
export default async function Post({ params }) {
  // 文章内容：每小时更新
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: { revalidate: 3600 },
  });

  // 评论：每分钟更新
  const comments = await fetch(
    `https://api.example.com/posts/${params.id}/comments`,
    {
      next: { revalidate: 60 },
    }
  );

  return (
    <div>
      <article>{post.content}</article>
      <CommentList comments={comments} />
    </div>
  );
}
```

**使用路由段配置**

```typescript
// app/blog/[slug]/page.tsx

// 为整个路由段设置 revalidate
export const revalidate = 3600; // 每小时

export default async function BlogPost({ params }) {
  // 所有数据获取都使用这个 revalidate 时间
  const post = await fetchPost(params.slug);
  const author = await fetchAuthor(post.authorId);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {author.name}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

**不同的 revalidate 值**

```typescript
// 1. 频繁更新的内容
export const revalidate = 60; // 1 分钟

export default async function NewsPage() {
  const news = await fetchLatestNews();
  return <NewsList news={news} />;
}

// 2. 中等更新频率
export const revalidate = 3600; // 1 小时

export default async function BlogPage() {
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}

// 3. 很少更新的内容
export const revalidate = 86400; // 24 小时

export default async function DocsPage() {
  const docs = await fetchDocs();
  return <Documentation docs={docs} />;
}

// 4. 永不过期（直到手动重新验证）
export const revalidate = false;

export default async function StaticPage() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}
```

---

## 问题 4：如何手动触发重新验证？

**On-Demand Revalidation**

```typescript
// app/api/revalidate/route.ts

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 验证密钥
  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    // 方式 1：重新验证特定路径
    revalidatePath("/blog/post-1");

    // 方式 2：重新验证带标签的内容
    revalidateTag("posts");

    return Response.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return Response.json({ message: "Error revalidating" }, { status: 500 });
  }
}

// 使用：
// POST /api/revalidate
// Body: { "secret": "your-secret", "path": "/blog/post-1" }
```

**使用 Cache Tags**

```typescript
// app/blog/[slug]/page.tsx

export default async function BlogPost({ params }) {
  // 为 fetch 添加标签
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: {
      revalidate: 3600,
      tags: ["posts", `post-${params.slug}`],
    },
  });

  return <article>{post.content}</article>;
}

// app/api/revalidate/route.ts
export async function POST(request) {
  const { tag } = await request.json();

  // 重新验证所有带有该标签的内容
  revalidateTag(tag);

  // 重新验证所有文章
  // revalidateTag('posts');

  // 重新验证特定文章
  // revalidateTag('post-123');

  return Response.json({ revalidated: true });
}
```

**Webhook 集成**

```typescript
// app/api/webhooks/cms/route.ts

import { revalidatePath } from "next/cache";

export async function POST(request) {
  const webhook = await request.json();

  // CMS 发送的 webhook
  if (webhook.type === "post.published") {
    // 重新验证博客列表
    revalidatePath("/blog");

    // 重新验证特定文章
    revalidatePath(`/blog/${webhook.data.slug}`);
  }

  if (webhook.type === "post.updated") {
    revalidatePath(`/blog/${webhook.data.slug}`);
  }

  if (webhook.type === "post.deleted") {
    revalidatePath("/blog");
  }

  return Response.json({ received: true });
}

// CMS 配置：
// Webhook URL: https://yoursite.com/api/webhooks/cms
// 事件：post.published, post.updated, post.deleted
```

---

## 问题 5：ISR 的最佳实践和注意事项？

**选择合适的 revalidate 时间**

```typescript
// ✅ 好：根据内容更新频率设置

// 实时数据：不使用 ISR，使用 SSR
export const dynamic = "force-dynamic";

export default async function StockPrice() {
  const price = await fetchRealTimePrice();
  return <div>{price}</div>;
}

// 频繁更新：短 revalidate
export const revalidate = 60; // 1 分钟

export default async function NewsPage() {
  const news = await fetchNews();
  return <NewsList news={news} />;
}

// 中等更新：中等 revalidate
export const revalidate = 3600; // 1 小时

export default async function BlogPage() {
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}

// 很少更新：长 revalidate
export const revalidate = 86400; // 24 小时

export default async function DocsPage() {
  const docs = await fetchDocs();
  return <Docs docs={docs} />;
}
```

**错误处理**

```typescript
// app/products/[id]/page.tsx

export default async function ProductPage({ params }) {
  try {
    const product = await fetch(
      `https://api.example.com/products/${params.id}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!product.ok) {
      throw new Error("Failed to fetch product");
    }

    return <ProductDetail product={product} />;
  } catch (error) {
    // 重新验证失败时，继续使用旧缓存
    console.error("Revalidation failed:", error);

    // 或返回错误页面
    return <ErrorPage />;
  }
}
```

**监控和调试**

```typescript
// middleware.ts

export function middleware(request) {
  const response = NextResponse.next();

  // 检查缓存状态
  const cacheStatus = response.headers.get("x-nextjs-cache");

  console.log({
    url: request.url,
    cache: cacheStatus,
    // HIT: 缓存命中
    // MISS: 缓存未命中
    // STALE: 返回旧缓存，后台重新生成
  });

  return response;
}
```

---

## 总结

**核心概念**：

### 1. ISR 定义

- 在不重新构建的情况下更新静态页面
- 使用 stale-while-revalidate 策略
- 平衡性能和内容新鲜度

### 2. 配置方式

```typescript
// fetch 级别
fetch(url, { next: { revalidate: 60 } });

// 路由段级别
export const revalidate = 60;
```

### 3. 工作流程

1. 首次请求：生成并缓存
2. 缓存期内：返回缓存（快）
3. 缓存过期：返回旧缓存 + 后台更新
4. 下次请求：返回新内容

### 4. 手动重新验证

```typescript
revalidatePath("/blog/post-1");
revalidateTag("posts");
```

### 5. 适用场景

- 博客文章（每小时更新）
- 产品页面（每分钟更新）
- 文档页面（每天更新）
- 新闻列表（每分钟更新）

### 6. 最佳实践

- 根据更新频率选择 revalidate 时间
- 使用 on-demand revalidation 即时更新
- 使用 cache tags 批量更新
- 监控缓存命中率
- 处理重新验证失败

## 延伸阅读

- [Next.js 官方文档 - Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Next.js 官方文档 - revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 官方文档 - revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
