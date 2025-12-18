---
title: revalidate 如何控制缓存失效？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入讲解 Next.js 中 revalidate 的工作原理、配置方式和使用场景，掌握增量静态再生成（ISR）的核心机制。
tags:
  - Next.js
  - ISR
  - Caching
  - Revalidation
estimatedTime: 25 分钟
keywords:
  - Next.js revalidate
  - ISR
  - 缓存失效
  - 增量静态再生成
highlight: revalidate 是实现 ISR 的核心配置，让静态页面也能保持数据新鲜度
order: 148
---

## 问题 1：revalidate 的基本工作原理是什么？

`revalidate` 是 Next.js 实现增量静态再生成（ISR）的核心机制，它允许在指定时间后重新生成静态页面。

### 基本概念

```typescript
// app/posts/page.tsx
// 设置页面每 60 秒重新验证一次
export const revalidate = 60;

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

### 工作流程

**1. 首次请求**

- 页面在构建时生成（或首次访问时生成）
- 返回静态 HTML 给用户（快速）

**2. 缓存期内的请求**

- 直接返回缓存的 HTML
- 不会重新生成页面

**3. 缓存过期后的首次请求**

- 仍然返回旧的缓存 HTML（用户体验不受影响）
- 后台触发页面重新生成

**4. 重新生成完成后**

- 新的请求会收到更新后的 HTML
- 新的缓存周期开始

```typescript
// 时间轴示例
// t=0s:   用户 A 访问 -> 返回缓存页面（构建时生成）
// t=30s:  用户 B 访问 -> 返回缓存页面（同一份）
// t=65s:  用户 C 访问 -> 返回旧缓存 + 触发后台重新生成
// t=66s:  用户 D 访问 -> 返回旧缓存（重新生成还在进行中）
// t=70s:  重新生成完成
// t=75s:  用户 E 访问 -> 返回新生成的页面
```

---

## 问题 2：revalidate 有哪些配置方式？

Next.js 提供了多种方式来配置 `revalidate`：

### 1. 路由段配置（Route Segment Config）

在页面或布局中导出 `revalidate` 变量：

```typescript
// app/blog/page.tsx
// 整个页面每 3600 秒（1 小时）重新验证
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return <div>{/* ... */}</div>;
}
```

### 2. fetch 请求级别配置

为单个 fetch 请求设置重新验证时间：

```typescript
export default async function Page() {
  // 这个请求每 60 秒重新验证
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  });

  // 这个请求每 3600 秒重新验证
  const users = await fetch("https://api.example.com/users", {
    next: { revalidate: 3600 },
  });

  return <div>{/* ... */}</div>;
}
```

### 3. 不同数据源的最小值

当页面有多个数据源时，使用最小的 `revalidate` 值：

```typescript
// app/dashboard/page.tsx
export const revalidate = 300; // 5 分钟

export default async function DashboardPage() {
  // 这个请求设置为 60 秒
  const stats = await fetch("https://api.example.com/stats", {
    next: { revalidate: 60 },
  });

  // 页面实际会每 60 秒重新验证（取最小值）
  return <div>{/* ... */}</div>;
}
```

### 4. 按需重新验证（On-Demand Revalidation）

通过 API 手动触发重新验证：

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const { path, tag } = await request.json();

  if (path) {
    // 重新验证特定路径
    revalidatePath(path);
  }

  if (tag) {
    // 重新验证特定标签的所有请求
    revalidateTag(tag);
  }

  return Response.json({ revalidated: true });
}
```

使用标签进行按需重新验证：

```typescript
// app/posts/page.tsx
export default async function PostsPage() {
  // 为 fetch 请求添加标签
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      revalidate: 3600,
      tags: ["posts"], // 添加标签
    },
  });

  return <div>{/* ... */}</div>;
}

// 在其他地方触发重新验证
// POST /api/revalidate
// { "tag": "posts" }
```

---

## 问题 3：revalidate 的不同值有什么含义？

`revalidate` 可以设置不同的值，每个值都有特定的含义：

### 1. 数字值（秒数）

设置缓存的有效期：

```typescript
// 60 秒后重新验证
export const revalidate = 60;

// 1 小时后重新验证
export const revalidate = 3600;

// 1 天后重新验证
export const revalidate = 86400;
```

### 2. false（默认值）

无限期缓存，直到手动重新验证：

```typescript
// 页面会被永久缓存
export const revalidate = false;

export default async function Page() {
  // 这个页面只在构建时生成一次
  // 除非手动触发 revalidatePath
  return <div>Static Forever</div>;
}
```

### 3. 0

禁用缓存，等同于动态渲染：

```typescript
// 每次请求都重新生成
export const revalidate = 0;

export default async function Page() {
  // 这个页面不会被缓存
  // 等同于 dynamic = 'force-dynamic'
  return <div>Always Fresh</div>;
}
```

### 不同值的使用场景

```typescript
// 新闻网站首页 - 频繁更新
export const revalidate = 60; // 1 分钟

// 博客文章列表 - 偶尔更新
export const revalidate = 3600; // 1 小时

// 产品目录 - 每天更新
export const revalidate = 86400; // 1 天

// 关于我们页面 - 很少更新
export const revalidate = false; // 永久缓存

// 用户仪表板 - 需要实时数据
export const revalidate = 0; // 不缓存
```

---

## 问题 4：revalidate 与其他缓存机制的关系是什么？

`revalidate` 是 Next.js 缓存系统的一部分，需要理解它与其他缓存机制的关系：

### 1. 与 fetch cache 的关系

`revalidate` 会影响 fetch 请求的缓存行为：

```typescript
// 页面级别的 revalidate
export const revalidate = 60;

export default async function Page() {
  // 这个请求会继承页面的 revalidate 设置
  const data1 = await fetch("https://api.example.com/data1");

  // 这个请求使用自己的 revalidate 设置（优先级更高）
  const data2 = await fetch("https://api.example.com/data2", {
    next: { revalidate: 30 },
  });

  // 这个请求不会被缓存
  const data3 = await fetch("https://api.example.com/data3", {
    cache: "no-store",
  });

  return <div>{/* ... */}</div>;
}
```

### 2. 与 dynamic 的关系

`dynamic` 配置会覆盖 `revalidate`：

```typescript
// ❌ revalidate 会被忽略
export const dynamic = "force-dynamic";
export const revalidate = 60; // 无效

// ✅ 正确的组合
export const dynamic = "auto"; // 或不设置
export const revalidate = 60;
```

### 3. 与 generateStaticParams 的关系

`revalidate` 可以与动态路由的静态生成结合使用：

```typescript
// app/posts/[id]/page.tsx
export const revalidate = 3600; // 1 小时

// 构建时生成这些页面
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return posts.map((post) => ({
    id: post.id,
  }));
}

export default async function PostPage({ params }) {
  // 每个页面都会每小时重新验证
  const post = await fetch(`https://api.example.com/posts/${params.id}`).then(
    (res) => res.json()
  );

  return <div>{post.title}</div>;
}
```

### 4. 缓存层级

Next.js 有多层缓存，`revalidate` 主要影响 Data Cache：

```typescript
/**
 * Next.js 缓存层级：
 *
 * 1. Request Memoization（请求记忆化）
 *    - 同一个渲染周期内的重复请求会被自动去重
 *
 * 2. Data Cache（数据缓存）
 *    - revalidate 主要控制这一层
 *    - 持久化存储，跨请求共享
 *
 * 3. Full Route Cache（完整路由缓存）
 *    - 缓存渲染后的 HTML 和 RSC Payload
 *    - 也受 revalidate 影响
 *
 * 4. Router Cache（路由器缓存）
 *    - 客户端缓存，存储在浏览器中
 */

export const revalidate = 60;

export default async function Page() {
  // 这个请求会被缓存在 Data Cache 中
  // 60 秒后重新验证
  const data = await fetch("https://api.example.com/data");

  return <div>{/* ... */}</div>;
}
```

### 5. 按需重新验证的优先级

按需重新验证会立即使缓存失效：

```typescript
// app/posts/page.tsx
export const revalidate = 3600; // 1 小时

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  });

  return <div>{/* ... */}</div>;
}

// app/api/revalidate/route.ts
export async function POST() {
  // 立即使缓存失效，不等待 3600 秒
  revalidateTag("posts");

  return Response.json({ revalidated: true });
}
```

## 延伸阅读

- [Next.js 官方文档 - Revalidating Data](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Next.js 官方文档 - Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#incremental-static-regeneration-isr)
- [Next.js 官方文档 - Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js 官方文档 - revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 官方文档 - revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
