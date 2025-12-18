---
title: 什么时候会 cache miss？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中导致缓存未命中的各种场景，掌握缓存失效的原因和优化方法
tags:
  - Next.js
  - 缓存
  - Cache Miss
  - 性能优化
estimatedTime: 22 分钟
keywords:
  - Cache Miss
  - 缓存未命中
  - 缓存失效
  - Next.js 缓存
highlight: 了解缓存未命中的场景有助于优化应用性能和用户体验
order: 42
---

## 问题 1：什么是 Cache Miss？

Cache Miss 指请求的数据在缓存中不存在，需要从源头获取。

### 基本概念

**Cache Hit（缓存命中）**：

```javascript
用户请求 → 检查缓存 → 找到数据 → 直接返回
// 快速响应，无需重新计算或请求
```

**Cache Miss（缓存未命中）**：

```javascript
用户请求 → 检查缓存 → 未找到 → 获取数据 → 存入缓存 → 返回
// 需要额外时间获取数据
```

### 影响

```javascript
// Cache Hit：响应时间 ~10ms
// Cache Miss：响应时间 ~500ms

// 示例：
// 第一次访问 /posts（Cache Miss）
请求 → 渲染页面 → 获取数据 → 返回（500ms）

// 第二次访问 /posts（Cache Hit）
请求 → 返回缓存（10ms）
```

---

## 问题 2：Data Cache 什么时候会 Miss？

Data Cache 缓存 fetch 请求的响应数据。

### 常见 Miss 场景

**1. 首次请求**

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  // 第一次执行：Cache Miss
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  // 第二次请求：Cache Hit
  return <PostList posts={posts} />;
}
```

**2. 缓存过期**

```javascript
// 设置 1 小时过期
const posts = await fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 },
}).then((r) => r.json());

// 时间线：
// 0:00 - 首次请求（Miss）
// 0:30 - 第二次请求（Hit）
// 1:00 - 第三次请求（Hit，但缓存已过期）
// 1:01 - 第四次请求（Miss，重新获取）
```

**3. 使用 cache: 'no-store'**

```javascript
// 每次都是 Cache Miss
const data = await fetch("https://api.example.com/realtime", {
  cache: "no-store", // 禁用缓存
}).then((r) => r.json());

// 每个请求都会实际调用 API
```

**4. 请求参数不同**

```javascript
// 不同的 URL 或选项会导致 Miss
const posts1 = await fetch("https://api.example.com/posts?page=1");
const posts2 = await fetch("https://api.example.com/posts?page=2");

// 这是两个不同的缓存条目
// 即使 posts1 已缓存，posts2 仍然是 Miss
```

**5. 手动清除缓存**

```javascript
"use server";

import { revalidateTag } from "next/cache";

export async function updatePosts() {
  // 清除带有 'posts' 标签的缓存
  revalidateTag("posts");

  // 下次请求会 Miss
}

// 使用标签
const posts = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"] },
}).then((r) => r.json());
```

---

## 问题 3：Full Route Cache 什么时候会 Miss？

Full Route Cache 缓存整个页面的渲染结果。

### 常见 Miss 场景

**1. 动态渲染的路由**

```javascript
// app/dashboard/page.tsx
import { cookies } from "next/headers";

export default async function DashboardPage() {
  // 使用动态函数，强制动态渲染
  const token = cookies().get("token");

  // 这个页面永远不会被缓存
  // 每次请求都是 Cache Miss
  return <div>Dashboard</div>;
}
```

**2. 显式禁用缓存**

```javascript
// app/live/page.tsx
export const dynamic = "force-dynamic"; // 强制动态渲染

export default async function LivePage() {
  // 每次请求都重新渲染（Miss）
  const data = await fetch("https://api.example.com/live").then((r) =>
    r.json()
  );
  return <div>{data.value}</div>;
}
```

**3. 缓存过期**

```javascript
// app/posts/page.tsx
export const revalidate = 60; // 60 秒过期

export default async function PostsPage() {
  return <div>Posts</div>;
}

// 时间线：
// 0:00 - 首次请求（Miss，生成缓存）
// 0:30 - 第二次请求（Hit）
// 1:00 - 第三次请求（Hit，但触发后台重新生成）
// 1:01 - 第四次请求（Hit，使用新缓存）
```

**4. 手动清除缓存**

```javascript
"use server";

import { revalidatePath } from "next/cache";

export async function updatePage() {
  // 清除特定路径的缓存
  revalidatePath("/posts");

  // 下次访问 /posts 会 Miss
}
```

**5. 构建后首次访问（ISR）**

```javascript
// app/posts/[id]/page.tsx
export const revalidate = 3600;

export async function generateStaticParams() {
  // 只预生成前 10 个
  return [{ id: "1" }, { id: "2" } /* ... */, , { id: "10" }];
}

export default async function PostPage({ params }) {
  return <div>Post {params.id}</div>;
}

// /posts/1 到 /posts/10：构建时生成（Hit）
// /posts/11：首次访问时生成（Miss）
// /posts/11 后续访问：使用缓存（Hit）
```

---

## 问题 4：Router Cache 什么时候会 Miss？

Router Cache 是客户端缓存，在浏览器中维护。

### 常见 Miss 场景

**1. 首次访问路由**

```javascript
// 用户首次访问应用
用户访问 /posts → Router Cache 为空 → Miss → 从服务器获取

// 后续导航
用户访问 /about → Router Cache 无此路由 → Miss → 从服务器获取
用户返回 /posts → Router Cache 有缓存 → Hit → 即时显示
```

**2. 缓存过期**

```javascript
// 静态路由：5 分钟过期
// 动态路由：30 秒过期

// 时间线（静态路由）：
// 0:00 - 访问 /posts（Miss）
// 0:30 - 返回 /posts（Hit）
// 5:00 - 再次访问 /posts（Miss，缓存已过期）
```

**3. 页面刷新**

```javascript
// Router Cache 存储在内存中
// 刷新页面会清空所有缓存

用户访问 /posts → 缓存 /posts
用户访问 /about → 缓存 /about
用户刷新页面 → Router Cache 清空
用户访问 /posts → Miss（需要重新获取）
```

**4. 手动刷新**

```javascript
"use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // 清除当前路由的 Router Cache
        router.refresh();
        // 下次访问会 Miss
      }}
    >
      刷新
    </button>
  );
}
```

**5. 禁用预取**

```javascript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 禁用预取，点击时才加载（Miss） */}
      <Link href="/admin" prefetch={false}>
        管理后台
      </Link>

      {/* 启用预取，提前缓存（可能 Hit） */}
      <Link href="/posts">文章列表</Link>
    </nav>
  );
}
```

---

## 问题 5：如何减少 Cache Miss？

通过优化缓存策略可以提高命中率。

### 策略 1：合理设置缓存时间

```javascript
// ❌ 缓存时间过短
export const revalidate = 10; // 10 秒
// 导致频繁 Miss，增加服务器压力

// ✅ 根据更新频率设置
export const revalidate = 3600; // 1 小时
// 对于不常更新的内容，使用较长的缓存时间
```

### 策略 2：使用标签统一管理

```javascript
// 相关数据使用相同标签
const posts = await fetch("https://api.example.com/posts", {
  next: { tags: ["posts"], revalidate: 3600 },
});

const featured = await fetch("https://api.example.com/posts/featured", {
  next: { tags: ["posts"], revalidate: 3600 },
});

// 更新时统一清除
("use server");
import { revalidateTag } from "next/cache";

export async function updatePosts() {
  revalidateTag("posts"); // 同时清除所有相关缓存
}
```

### 策略 3：预取重要路由

```javascript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function App() {
  const router = useRouter();

  useEffect(() => {
    // 预取常用路由
    router.prefetch("/posts");
    router.prefetch("/dashboard");

    // 减少用户访问时的 Miss
  }, [router]);

  return <div>{/* ... */}</div>;
}
```

### 策略 4：预生成动态路由

```javascript
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  // 预生成所有文章页面
  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

// 构建时生成所有页面，避免运行时 Miss
```

### 策略 5：使用 stale-while-revalidate

```javascript
// app/posts/page.tsx
export const revalidate = 60;

export default async function PostsPage() {
  return <div>Posts</div>;
}

// 响应头：
// Cache-Control: s-maxage=60, stale-while-revalidate

// 即使缓存过期，也返回旧内容（技术上是 Hit）
// 同时后台更新，下次请求使用新内容
```

### 策略 6：分层缓存

```javascript
// 不同数据使用不同的缓存策略
export default async function Page() {
  // 静态配置：长期缓存
  const config = await fetch("https://api.example.com/config", {
    next: { revalidate: 86400 }, // 1 天
  });

  // 文章列表：中期缓存
  const posts = await fetch("https://api.example.com/posts", {
    next: { revalidate: 3600 }, // 1 小时
  });

  // 用户数据：短期缓存
  const user = await fetch("https://api.example.com/user", {
    next: { revalidate: 60 }, // 1 分钟
  });

  return <div>{/* ... */}</div>;
}
```

---

## 总结

**核心概念总结**：

### 1. Cache Miss 的主要场景

- **首次请求**：缓存尚未建立
- **缓存过期**：超过 revalidate 时间
- **手动清除**：调用 revalidatePath/revalidateTag
- **动态渲染**：使用动态函数或 no-store

### 2. 不同缓存层级的 Miss 特点

- **Data Cache**：按 URL 和选项区分
- **Full Route Cache**：只影响静态渲染的路由
- **Router Cache**：客户端缓存，刷新页面清空

### 3. 减少 Miss 的策略

- 合理设置缓存时间
- 使用标签统一管理相关缓存
- 预取重要路由
- 预生成动态路由
- 使用 stale-while-revalidate

### 4. 监控和优化

- 关注 Cache Miss 率
- 根据访问模式调整缓存策略
- 平衡缓存命中率和数据新鲜度

## 延伸阅读

- [Next.js Caching 官方文档](https://nextjs.org/docs/app/building-your-application/caching)
- [Cache Miss 和 Cache Hit](<https://en.wikipedia.org/wiki/Cache_(computing)>)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
