---
title: 什么是 stale-while-revalidate？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 stale-while-revalidate 缓存策略，掌握如何平衡数据新鲜度和用户体验
tags:
  - Next.js
  - 缓存策略
  - SWR
  - HTTP 缓存
estimatedTime: 20 分钟
keywords:
  - stale-while-revalidate
  - SWR
  - 缓存策略
  - ISR
highlight: stale-while-revalidate 允许返回过期缓存的同时后台更新，实现零等待的用户体验
order: 9
---

## 问题 1：stale-while-revalidate 是什么？

stale-while-revalidate（SWR）是一种 HTTP 缓存策略，允许在缓存过期后继续使用旧内容，同时在后台更新。

### 基本概念

**传统缓存策略**：

```
缓存新鲜 → 返回缓存（快）
缓存过期 → 重新获取 → 返回新数据（慢）
```

**SWR 策略**：

```
缓存新鲜 → 返回缓存（快）
缓存过期 → 返回旧缓存（快）+ 后台更新 → 下次返回新数据
```

### HTTP 头示例

```
Cache-Control: max-age=60, stale-while-revalidate=300
```

**含义**：

- `max-age=60`：缓存 60 秒内是新鲜的
- `stale-while-revalidate=300`：过期后 300 秒内可以返回旧内容，同时后台更新

---

## 问题 2：Next.js 如何实现 stale-while-revalidate？

Next.js 通过 ISR（Incremental Static Regeneration）实现 SWR 策略。

### 配置方式

```javascript
// app/posts/page.tsx
export const revalidate = 60; // 60 秒后重新验证

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// Next.js 自动设置响应头：
// Cache-Control: s-maxage=60, stale-while-revalidate
```

### 工作流程

```javascript
// 时间线示例
// 0:00 - 用户 A 访问
请求 → 生成页面 → 缓存 → 返回（500ms）

// 0:30 - 用户 B 访问
请求 → 返回缓存 → 响应（10ms）

// 1:00 - 用户 C 访问（缓存刚过期）
请求 → 返回旧缓存（10ms）
     → 后台触发重新生成
     → 更新缓存

// 1:05 - 用户 D 访问
请求 → 返回新缓存 → 响应（10ms）
```

### 代码示例

```javascript
// app/posts/page.tsx
export const revalidate = 3600; // 1 小时

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  return (
    <div>
      <h1>文章列表</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <time>{post.publishedAt}</time>
        </article>
      ))}
    </div>
  );
}

// 效果：
// - 1 小时内所有用户看到相同的缓存内容
// - 1 小时后首次访问触发后台更新
// - 用户立即看到内容（旧的），无需等待
// - 后台更新完成后，后续用户看到新内容
```

---

## 问题 3：SWR 的优势是什么？

SWR 策略在性能和用户体验之间取得了很好的平衡。

### 优势 1：零等待时间

```javascript
// ❌ 传统缓存：用户需要等待
缓存过期 → 用户请求 → 等待生成（500ms）→ 返回

// ✅ SWR：用户无需等待
缓存过期 → 用户请求 → 立即返回旧内容（10ms）
                    → 后台更新（不阻塞用户）
```

### 优势 2：减少服务器压力

```javascript
// 场景：高并发访问
// 0:00 - 生成页面并缓存
// 1:00 - 缓存过期，100 个用户同时访问

// ❌ 传统缓存：可能触发 100 次重新生成
用户 1 → 触发生成
用户 2 → 触发生成
// ... 100 次生成

// ✅ SWR：只触发 1 次重新生成
用户 1 → 返回旧缓存 + 触发后台生成
用户 2 → 返回旧缓存（使用同一个）
用户 3-100 → 返回旧缓存
// 后台只生成一次
```

### 优势 3：渐进式更新

```javascript
// app/posts/page.tsx
export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// 更新流程：
// 1. 发布新文章
// 2. 等待下一次访问（最多 60 秒）
// 3. 自动触发后台更新
// 4. 新内容逐步推送给用户

// 不需要：
// - 手动触发重新部署
// - 清除 CDN 缓存
// - 等待全局更新完成
```

### 优势 4：容错性

```javascript
// 如果后台更新失败
export const revalidate = 60;

export default async function PostsPage() {
  try {
    const posts = await fetch("https://api.example.com/posts").then((r) =>
      r.json()
    );
    return <PostList posts={posts} />;
  } catch (error) {
    // 更新失败，继续使用旧缓存
    // 用户仍然能看到内容，而不是错误页面
  }
}

// 优势：
// - API 暂时不可用时，用户仍能访问
// - 旧内容总比错误页面好
// - 下次访问会再次尝试更新
```

---

## 问题 4：如何控制 stale 期间的长度？

Next.js 的 SWR 行为是自动的，但可以通过配置调整。

### 默认行为

```javascript
// app/posts/page.tsx
export const revalidate = 60;

// 响应头：
// Cache-Control: s-maxage=60, stale-while-revalidate

// stale-while-revalidate 没有具体时间
// 意味着可以无限期返回旧内容，直到更新完成
```

### 自定义缓存头

```javascript
// app/api/data/route.ts
export async function GET() {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      // 自定义 SWR 时间
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

// 含义：
// - 60 秒内：返回新鲜缓存
// - 60-360 秒：返回旧缓存 + 后台更新
// - 360 秒后：必须等待新数据
```

### 使用 Middleware

```javascript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 为特定路径设置自定义缓存策略
  if (request.nextUrl.pathname.startsWith("/api/posts")) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
  }

  return response;
}
```

### 不同场景的配置

```javascript
// 高频更新内容（新闻）
export const revalidate = 60; // 1 分钟
// Cache-Control: s-maxage=60, stale-while-revalidate

// 中频更新内容（博客）
export const revalidate = 3600; // 1 小时
// Cache-Control: s-maxage=3600, stale-while-revalidate

// 低频更新内容（文档）
export const revalidate = 86400; // 1 天
// Cache-Control: s-maxage=86400, stale-while-revalidate

// 实时内容（不使用 SWR）
export const dynamic = "force-dynamic";
// Cache-Control: no-cache, no-store
```

---

## 问题 5：SWR 和按需重新验证的区别？

这两种策略适用于不同的场景。

### Stale-While-Revalidate（时间触发）

```javascript
// app/posts/page.tsx
export const revalidate = 3600; // 1 小时后自动更新

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// 特点：
// - 基于时间自动触发
// - 不需要手动干预
// - 适合定期更新的内容
```

### On-Demand Revalidation（事件触发）

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      revalidate: false, // 不自动过期
      tags: ["posts"],
    },
  }).then((r) => r.json());

  return <PostList posts={posts} />;
}

// app/actions.ts
("use server");
import { revalidateTag } from "next/cache";

export async function publishPost(post: Post) {
  await savePost(post);

  // 手动触发更新
  revalidateTag("posts");
}

// 特点：
// - 基于事件手动触发
// - 精确控制更新时机
// - 适合不定期更新的内容
```

### 组合使用

```javascript
// 最佳实践：结合两种策略
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      revalidate: 3600, // 兜底：1 小时自动更新
      tags: ["posts"], // 可以手动触发更新
    },
  }).then((r) => r.json());

  return <PostList posts={posts} />;
}

// 效果：
// - 正常情况：1 小时自动更新
// - 发布新文章：立即手动更新
// - 两全其美
```

### 场景对比

```javascript
// 场景 1：定期更新的数据（股票价格、天气）
// ✅ 使用 SWR（时间触发）
export const revalidate = 60;

// 场景 2：用户操作后需要更新（发布文章、修改设置）
// ✅ 使用 On-Demand（事件触发）
revalidateTag("posts");

// 场景 3：既有定期更新，又有用户操作
// ✅ 组合使用
export const revalidate = 3600;
// + revalidateTag('posts')

// 场景 4：完全实时（聊天、实时协作）
// ❌ 不使用缓存
export const dynamic = "force-dynamic";
```

---

## 总结

**核心概念总结**：

### 1. SWR 的本质

- 缓存过期后返回旧内容，同时后台更新
- 用户无需等待，体验流畅
- Next.js 通过 ISR 自动实现

### 2. 工作机制

- `revalidate` 设置缓存新鲜期
- 过期后首次访问触发后台更新
- 更新期间继续返回旧内容
- 更新完成后提供新内容

### 3. 主要优势

- 零等待时间，即时响应
- 减少服务器压力，避免重复生成
- 渐进式更新，无需手动干预
- 容错性好，API 故障时仍可访问

### 4. 使用建议

- 定期更新的内容使用 SWR
- 不定期更新的内容使用 On-Demand
- 组合使用获得最佳效果
- 实时内容不使用缓存

## 延伸阅读

- [HTTP Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [SWR Strategy](https://web.dev/stale-while-revalidate/)
- [On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation)
- [SWR Library](https://swr.vercel.app/)
