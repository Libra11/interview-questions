---
title: fetch() 在 Next.js 中与浏览器 fetch 的区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入讲解 Next.js 对原生 fetch API 的扩展和增强，理解其缓存机制和特殊配置选项。
tags:
  - Next.js
  - fetch
  - 数据获取
  - 缓存
estimatedTime: 20 分钟
keywords:
  - Next.js fetch
  - fetch 缓存
  - revalidate
  - 数据获取
highlight: Next.js 扩展了原生 fetch API，添加了强大的缓存和重新验证功能
order: 39
---

## 问题 1：Next.js fetch 的基本扩展是什么？

Next.js 扩展了原生 fetch API，添加了缓存和重新验证功能。

### 原生浏览器 fetch

```javascript
// 浏览器中的标准 fetch
const response = await fetch("https://api.example.com/data");
const data = await response.json();

/**
 * 浏览器 fetch 特点：
 * - 每次都发起新请求
 * - 使用浏览器的 HTTP 缓存
 * - 没有服务器端缓存
 * - 不支持重新验证
 */
```

### Next.js 扩展的 fetch

```tsx
// Next.js 中的 fetch（Server Component）
const response = await fetch("https://api.example.com/data", {
  // Next.js 扩展选项
  next: {
    revalidate: 3600, // 1 小时后重新验证
    tags: ["posts"], // 缓存标签
  },
});
const data = await response.json();

/**
 * Next.js fetch 特点：
 * - 默认缓存所有请求
 * - 支持时间基础的重新验证
 * - 支持按需重新验证
 * - 服务器端持久化缓存
 */
```

---

## 问题 2：Next.js fetch 的缓存选项有哪些？

Next.js fetch 提供了多种缓存控制选项。

### 1. cache 选项

```tsx
// force-cache（默认）：缓存请求
const data1 = await fetch("https://api.example.com/data", {
  cache: "force-cache", // 默认值
});
// 请求会被缓存，后续请求使用缓存

// no-store：不缓存，每次都重新请求
const data2 = await fetch("https://api.example.com/data", {
  cache: "no-store",
});
// 每次都发起新请求，类似浏览器 fetch

// no-cache：重新验证缓存
const data3 = await fetch("https://api.example.com/data", {
  cache: "no-cache",
});
// 每次都向服务器验证缓存是否有效
```

### 2. next.revalidate 选项

```tsx
// 时间基础的重新验证（秒）
const data = await fetch("https://api.example.com/posts", {
  next: { revalidate: 60 }, // 60 秒后重新验证
});

/**
 * 工作流程：
 * 0-60s:   使用缓存
 * 60s:     缓存过期
 * 61s:     第一个请求返回旧缓存 + 触发后台重新获取
 * 62s:     后续请求使用新数据
 */

// 不同的重新验证时间
const staticData = await fetch("https://api.example.com/config", {
  next: { revalidate: false }, // 永不重新验证
});

const frequentData = await fetch("https://api.example.com/stats", {
  next: { revalidate: 10 }, // 10 秒
});

const dailyData = await fetch("https://api.example.com/reports", {
  next: { revalidate: 86400 }, // 24 小时
});
```

### 3. next.tags 选项

```tsx
// 使用标签进行按需重新验证
const posts = await fetch("https://api.example.com/posts", {
  next: {
    tags: ["posts", "blog"],
  },
});

const comments = await fetch("https://api.example.com/comments", {
  next: {
    tags: ["comments", "blog"],
  },
});

// 在 Server Action 中重新验证
("use server");

import { revalidateTag } from "next/cache";

export async function createPost() {
  await db.posts.create({
    /* ... */
  });

  // 重新验证所有带 'posts' 标签的请求
  revalidateTag("posts");

  // 或重新验证多个标签
  revalidateTag("blog");
}
```

---

## 问题 3：Next.js fetch 的缓存行为

### 默认缓存行为

```tsx
// 在 Server Component 中
async function Page() {
  // 默认会被缓存
  const data1 = await fetch("https://api.example.com/data");

  // 同一个 URL，使用缓存
  const data2 = await fetch("https://api.example.com/data");

  // 不同 URL，分别缓存
  const data3 = await fetch("https://api.example.com/other");

  return <div>{/* ... */}</div>;
}

/**
 * 缓存特点：
 * - 基于完整 URL（包括查询参数）
 * - 跨请求共享
 * - 持久化存储
 * - 自动去重
 */
```

### 请求去重

```tsx
async function Page() {
  // 这三个请求会被自动去重，只发起一次
  const [data1, data2, data3] = await Promise.all([
    fetch("https://api.example.com/data"),
    fetch("https://api.example.com/data"),
    fetch("https://api.example.com/data"),
  ]);

  console.log("Only one request was made!");

  return <div>{/* ... */}</div>;
}
```

### 不同环境的行为

```tsx
/**
 * 开发环境（npm run dev）：
 * - 缓存功能有限
 * - 每次刷新页面都会重新请求
 * - 方便开发和调试
 *
 * 生产环境（npm run build && npm start）：
 * - 完整的缓存功能
 * - 持久化缓存
 * - 按配置重新验证
 */

// 查看缓存状态
const response = await fetch("https://api.example.com/data");

// 在开发环境
console.log(response.headers.get("x-nextjs-cache"));
// null 或 'MISS'

// 在生产环境
console.log(response.headers.get("x-nextjs-cache"));
// 'HIT', 'MISS', 'STALE'
```

---

## 问题 4：Next.js fetch 与浏览器 fetch 的对比

### 功能对比

```tsx
/**
 * 浏览器 fetch：
 * ✅ 标准 Web API
 * ✅ 客户端和服务器端都可用
 * ✅ 使用浏览器 HTTP 缓存
 * ❌ 没有服务器端缓存
 * ❌ 不支持重新验证
 * ❌ 每次都可能发起新请求
 *
 * Next.js fetch：
 * ✅ 扩展的 fetch API
 * ✅ 服务器端持久化缓存
 * ✅ 支持时间基础的重新验证
 * ✅ 支持按需重新验证
 * ✅ 自动请求去重
 * ⚠️ 只在 Server Component 中有扩展功能
 * ⚠️ Client Component 中是标准 fetch
 */
```

### 使用场景对比

```tsx
// Server Component 中使用 Next.js fetch
async function ServerComponent() {
  // ✅ 使用 Next.js 扩展功能
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 60 },
  });

  return <div>{/* ... */}</div>;
}

// Client Component 中使用标准 fetch
("use client");

import { useEffect, useState } from "react";

function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // ⚠️ 这是标准的浏览器 fetch
    // next.revalidate 等选项不起作用
    fetch("https://api.example.com/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return <div>{/* ... */}</div>;
}
```

### 最佳实践

```tsx
// ✅ 推荐：在 Server Component 中获取数据
async function Page() {
  // 利用 Next.js 缓存
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  }).then((res) => res.json());

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// ✅ 需要客户端交互时，传递数据给 Client Component
async function Page() {
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 60 },
  }).then((res) => res.json());

  return <InteractivePostList initialPosts={posts} />;
}

("use client");

function InteractivePostList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState("");

  const filtered = posts.filter((p) => p.title.includes(filter));

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// ❌ 避免：在 Client Component 中频繁请求
("use client");

function BadExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 每次组件挂载都会请求
    // 无法利用 Next.js 缓存
    fetch("https://api.example.com/data")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return <div>{/* ... */}</div>;
}
```

### 完整示例

```tsx
// app/posts/page.tsx (Server Component)
async function PostsPage({ searchParams }) {
  // 使用 Next.js fetch 缓存
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      revalidate: 300, // 5 分钟
      tags: ["posts"],
    },
  }).then((res) => res.json());

  // 根据查询参数过滤
  const filtered = searchParams.category
    ? posts.filter((p) => p.category === searchParams.category)
    : posts;

  return (
    <div>
      <h1>Posts</h1>
      <PostList posts={filtered} />
    </div>
  );
}

// app/actions/posts.ts
("use server");

import { revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  await db.posts.create({
    data: {
      title: formData.get("title"),
      content: formData.get("content"),
    },
  });

  // 重新验证所有带 'posts' 标签的 fetch 请求
  revalidateTag("posts");

  return { success: true };
}

// 对比：如果使用标准 fetch
async function StandardFetchExample() {
  // ❌ 每次都重新请求，无法利用缓存
  const posts = await fetch("https://api.example.com/posts", {
    cache: "no-store",
  }).then((res) => res.json());

  return <div>{/* ... */}</div>;
}
```

## 延伸阅读

- [Next.js 官方文档 - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Next.js 官方文档 - fetch API](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
