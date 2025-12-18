---
title: 页面缓存与数据缓存有什么区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 Full Route Cache（页面缓存）和 Data Cache（数据缓存）的本质区别和使用场景
tags:
  - Next.js
  - 缓存
  - Full Route Cache
  - Data Cache
estimatedTime: 20 分钟
keywords:
  - 页面缓存
  - 数据缓存
  - Next.js 缓存机制
highlight: 页面缓存存储渲染结果，数据缓存存储原始数据，两者相互独立但协同工作
order: 16
---

## 问题 1：页面缓存和数据缓存分别缓存什么？

这两种缓存的内容完全不同。

### Full Route Cache（页面缓存）

**缓存内容**：

- 渲染后的 HTML
- React Server Component Payload（RSC Payload）
- 整个页面的渲染结果

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  // 页面缓存会存储这个组件渲染后的完整输出
  return (
    <div>
      <h1>文章列表</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}

// 页面缓存存储的是渲染后的结果，类似：
// <div><h1>文章列表</h1><article>...</article>...</div>
```

### Data Cache（数据缓存）

**缓存内容**：

- fetch 请求的原始响应数据
- API 返回的 JSON、文本等数据
- 未经处理的数据

```javascript
// 同样的例子
export default async function PostsPage() {
  // 数据缓存会存储这个 fetch 的响应
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  return <div>{/* ... */}</div>;
}

// 数据缓存存储的是原始数据，类似：
// [{ id: 1, title: "...", content: "..." }, ...]
```

### 核心区别

| 特性     | 页面缓存               | 数据缓存            |
| -------- | ---------------------- | ------------------- |
| 缓存内容 | 渲染结果（HTML + RSC） | 原始数据（JSON 等） |
| 生成时机 | 渲染时                 | fetch 时            |
| 可复用性 | 只能用于同一路由       | 可跨路由复用        |
| 依赖关系 | 依赖数据缓存           | 独立存在            |

---

## 问题 2：两种缓存的生命周期有什么不同？

它们的失效和更新机制完全独立。

### 页面缓存的生命周期

**生成时机**：

- 构建时（静态生成）
- 首次请求时（ISR）

**失效条件**：

- 达到 `revalidate` 时间
- 手动调用 `revalidatePath()` 或 `revalidateTag()`
- 重新部署应用

```javascript
// app/posts/page.tsx
export const revalidate = 3600; // 页面缓存 1 小时后失效

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 }, // 数据缓存 1 分钟后失效
  }).then((r) => r.json());

  return <div>{/* ... */}</div>;
}

// 时间线：
// 0:00 - 首次请求，生成页面缓存和数据缓存
// 1:00 - 数据缓存失效，但页面缓存仍然有效
// 60:00 - 页面缓存失效，重新渲染时会获取新数据
```

### 数据缓存的生命周期

**生成时机**：

- 每次 fetch 调用时（如果未缓存）

**失效条件**：

- 达到 fetch 的 `revalidate` 时间
- 手动调用 `revalidateTag()`（如果设置了 tag）
- 使用 `cache: 'no-store'`

```javascript
// 不同数据源可以有不同的缓存策略
async function getData() {
  // 用户数据：缓存 5 分钟
  const users = await fetch("https://api.example.com/users", {
    next: { revalidate: 300 },
  });

  // 文章数据：缓存 1 小时
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 },
  });

  // 实时数据：不缓存
  const stats = await fetch("https://api.example.com/stats", {
    cache: "no-store",
  });

  return { users, posts, stats };
}
```

---

## 问题 3：页面缓存和数据缓存如何协同工作？

它们之间有依赖关系，但可以独立失效。

### 协同场景

**场景 1：数据缓存命中，页面缓存未命中**

```javascript
// app/posts/[id]/page.tsx
export const revalidate = 3600; // 页面 1 小时

export default async function PostPage({ params }) {
  // 数据缓存 10 分钟
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: { revalidate: 600 },
  }).then((r) => r.json());

  return <article>{post.title}</article>;
}

// 流程：
// 1. 页面缓存失效，需要重新渲染
// 2. 渲染时发现数据缓存仍然有效
// 3. 直接使用缓存的数据，无需实际请求
// 4. 生成新的页面缓存
```

**场景 2：跨路由复用数据缓存**

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  // 获取文章列表
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 600, tags: ['posts'] }
  }).then(r => r.json());

  return <PostList posts={posts} />;
}

// app/featured/page.tsx
export default async function FeaturedPage() {
  // 同样的请求，复用数据缓存
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 600, tags: ['posts'] }
  }).then(r => r.json());

  const featured = posts.filter(p => p.featured);
  return <PostList posts={featured} />;
}

// 两个不同的页面共享同一份数据缓存
// 但各自有独立的页面缓存
```

### 独立失效

```javascript
// app/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function updatePost(id: string) {
  await fetch(`https://api.example.com/posts/${id}`, {
    method: "PUT",
    // ...
  });

  // 只清除数据缓存
  revalidateTag("posts");

  // 只清除特定页面缓存
  revalidatePath("/posts");

  // 清除所有相关页面缓存
  revalidatePath("/posts", "layout"); // 清除整个 /posts 布局下的所有页面
}
```

---

## 问题 4：什么时候会出现缓存不一致？

由于两种缓存独立管理，可能出现数据不一致的情况。

### 常见不一致场景

**场景 1：页面缓存过期时间长于数据缓存**

```javascript
export const revalidate = 3600; // 页面 1 小时

export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 60 }, // 数据 1 分钟
  }).then((r) => r.json());

  return <div>{data.value}</div>;
}

// 问题：
// - 数据每分钟更新
// - 但页面每小时才重新渲染
// - 用户看到的是旧的渲染结果
```

**解决方案**：确保页面缓存时间 ≤ 最短的数据缓存时间

```javascript
// 方案 1：统一时间
export const revalidate = 60; // 与数据缓存保持一致

// 方案 2：使用最小值
const dataRevalidate = 60;
export const revalidate = dataRevalidate;

export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: dataRevalidate },
  }).then((r) => r.json());

  return <div>{data.value}</div>;
}
```

**场景 2：部分数据不缓存**

```javascript
export const revalidate = 3600; // 页面缓存 1 小时

export default async function Page() {
  // 静态数据：缓存
  const config = await fetch("https://api.example.com/config", {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  // 实时数据：不缓存
  const stats = await fetch("https://api.example.com/stats", {
    cache: "no-store",
  }).then((r) => r.json());

  return (
    <div>
      <Config data={config} />
      <Stats data={stats} /> {/* 这个数据永远是旧的！ */}
    </div>
  );
}

// 问题：
// - stats 虽然设置了 no-store
// - 但页面缓存会保存渲染结果
// - 用户看到的 stats 是 1 小时前的
```

**解决方案**：如果有实时数据，禁用页面缓存

```javascript
export const dynamic = "force-dynamic"; // 禁用页面缓存

export default async function Page() {
  const config = await fetch("https://api.example.com/config", {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  const stats = await fetch("https://api.example.com/stats", {
    cache: "no-store",
  }).then((r) => r.json());

  // 现在每次请求都会重新渲染，stats 始终是最新的
  return <div>{/* ... */}</div>;
}
```

---

## 总结

**核心概念总结**：

### 1. 缓存内容差异

- **页面缓存**：存储渲染后的 HTML 和 RSC Payload
- **数据缓存**：存储 fetch 请求的原始响应数据

### 2. 生命周期管理

- 两种缓存有独立的失效时间
- 页面缓存依赖数据缓存，但可以独立失效
- 数据缓存可以跨路由复用

### 3. 配置方式

- **页面缓存**：通过路由段配置（`revalidate`、`dynamic`）
- **数据缓存**：通过 fetch 选项（`next.revalidate`、`cache`）

### 4. 最佳实践

- 页面缓存时间应 ≤ 最短的数据缓存时间
- 包含实时数据的页面应禁用页面缓存
- 使用 `revalidateTag` 统一管理相关缓存
- 合理利用数据缓存的跨路由复用特性

## 延伸阅读

- [Next.js Caching 官方文档](https://nextjs.org/docs/app/building-your-application/caching)
- [Data Cache 详解](https://nextjs.org/docs/app/building-your-application/caching#data-cache)
- [Full Route Cache 详解](https://nextjs.org/docs/app/building-your-application/caching#full-route-cache)
- [revalidatePath 和 revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
