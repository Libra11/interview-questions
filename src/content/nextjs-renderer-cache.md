---
title: 渲染器缓存（Renderer Cache）是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Next.js 中的 Full Route Cache（完整路由缓存），也被称为渲染器缓存，掌握静态渲染的缓存机制
tags:
  - Next.js
  - 缓存
  - Full Route Cache
  - 静态渲染
estimatedTime: 18 分钟
keywords:
  - Renderer Cache
  - Full Route Cache
  - 渲染缓存
  - 静态生成
highlight: Full Route Cache 缓存静态渲染的完整输出，包括 HTML 和 RSC Payload
order: 4
---

## 问题 1：什么是 Full Route Cache（渲染器缓存）？

Full Route Cache 是 Next.js 在服务器端缓存整个路由渲染结果的机制。

### 核心概念

**缓存内容**：

- 静态渲染的 HTML
- React Server Component Payload（RSC Payload）
- 完整的页面输出

**工作时机**：

- 构建时（`next build`）
- 运行时首次请求（ISR）

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  // 这个页面的完整渲染结果会被缓存
  return (
    <div>
      <h1>文章列表</h1>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}

// 缓存的内容包括：
// 1. HTML: <div><h1>文章列表</h1><article>...</article></div>
// 2. RSC Payload: React 组件树的序列化数据
```

### 为什么叫"渲染器缓存"？

因为它缓存的是 React 渲染器的输出结果：

- 不是源代码
- 不是原始数据
- 而是渲染后的最终产物

---

## 问题 2：Full Route Cache 只对静态渲染有效吗？

是的，只有静态渲染的路由才会被缓存。

### 静态渲染 vs 动态渲染

**静态渲染（会被缓存）**：

```javascript
// app/about/page.tsx
export default function AboutPage() {
  // 没有动态数据获取
  // 没有使用动态函数
  return <div>关于我们</div>;
}

// 或者使用静态数据
export default async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // 设置了 revalidate
  }).then(r => r.json());

  return <PostList posts={posts} />;
}
```

**动态渲染（不会被缓存）**：

```javascript
// app/dashboard/page.tsx
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  // 使用了动态函数 cookies()
  const token = cookies().get('token');

  // 这个页面每次请求都会重新渲染
  return <div>Dashboard</div>;
}

// 或者显式声明动态渲染
export const dynamic = 'force-dynamic';

export default function Page() {
  return <div>动态内容</div>;
}
```

### 触发动态渲染的条件

以下情况会自动切换到动态渲染：

- 使用 `cookies()`、`headers()`
- 使用 `searchParams`（页面组件）
- fetch 使用 `cache: 'no-store'`
- 设置 `dynamic = 'force-dynamic'`

```javascript
// 示例：自动切换到动态渲染
export default async function Page({ searchParams }) {
  // 使用 searchParams 会触发动态渲染
  const query = searchParams.q;

  const results = await fetch(`https://api.example.com/search?q=${query}`, {
    cache: "no-store", // 也会触发动态渲染
  }).then((r) => r.json());

  return <SearchResults results={results} />;
}
```

---

## 问题 3：如何控制 Full Route Cache 的行为？

可以通过路由段配置来控制缓存行为。

### 配置选项

**1. 设置重新验证时间**

```javascript
// app/posts/page.tsx
export const revalidate = 3600; // 1 小时后重新生成

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// 工作流程：
// 1. 构建时生成静态页面
// 2. 1 小时内所有请求返回缓存
// 3. 1 小时后首次请求触发后台重新生成
// 4. 重新生成完成后更新缓存
```

**2. 禁用静态渲染**

```javascript
// app/dashboard/page.tsx
export const dynamic = "force-dynamic"; // 强制动态渲染

export default async function DashboardPage() {
  // 每次请求都会重新渲染
  const data = await fetch("https://api.example.com/user").then((r) =>
    r.json()
  );
  return <Dashboard data={data} />;
}
```

**3. 控制动态参数**

```javascript
// app/posts/[id]/page.tsx
export const dynamicParams = true; // 允许动态参数（默认）

// 预生成特定参数的页面
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );

  // 只预生成这些页面
  return posts.slice(0, 10).map((post) => ({
    id: post.id.toString(),
  }));
}

export default async function PostPage({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`).then(
    (r) => r.json()
  );

  return <article>{post.title}</article>;
}

// 结果：
// - /posts/1 到 /posts/10 在构建时生成并缓存
// - /posts/11 及以后在首次请求时生成并缓存（如果 dynamicParams = true）
```

**4. 完全静态导出**

```javascript
// next.config.js
module.exports = {
  output: "export", // 生成纯静态 HTML
};

// 所有页面都会在构建时生成
// 不支持 ISR 和服务器端功能
```

---

## 问题 4：如何手动清除 Full Route Cache？

Next.js 提供了两个 API 来手动清除缓存。

### revalidatePath

清除特定路径的缓存：

```javascript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  // 创建文章
  await fetch("https://api.example.com/posts", {
    method: "POST",
    body: JSON.stringify({
      title: formData.get("title"),
      content: formData.get("content"),
    }),
  });

  // 清除文章列表页的缓存
  revalidatePath("/posts");

  // 清除整个 /posts 布局下的所有页面
  revalidatePath("/posts", "layout");
}
```

### revalidateTag

通过标签清除相关缓存：

```javascript
// 1. 给 fetch 请求打标签
export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      revalidate: 3600,
      tags: ["posts"], // 打标签
    },
  }).then((r) => r.json());

  return <PostList posts={posts} />;
}

// 2. 通过标签清除缓存
("use server");

import { revalidateTag } from "next/cache";

export async function updatePost(id: string) {
  await fetch(`https://api.example.com/posts/${id}`, {
    method: "PUT",
    // ...
  });

  // 清除所有带 'posts' 标签的缓存
  revalidateTag("posts");

  // 这会影响：
  // - 所有使用 tags: ['posts'] 的 fetch 请求的数据缓存
  // - 所有依赖这些数据的页面的 Full Route Cache
}
```

### 使用场景对比

```javascript
// 场景 1：更新特定页面
export async function updateAboutPage() {
  // 只更新 /about 页面
  revalidatePath("/about");
}

// 场景 2：更新一组相关页面
export async function updatePostSection() {
  // 更新 /posts 下的所有页面
  revalidatePath("/posts", "layout");
}

// 场景 3：更新所有使用某类数据的页面
export async function updateAllPostPages() {
  // 更新所有使用 'posts' 数据的页面
  // 无论它们在哪个路径下
  revalidateTag("posts");
}
```

---

## 问题 5：Full Route Cache 和 CDN 缓存有什么关系？

它们是两个不同层级的缓存，可以协同工作。

### 缓存层级

```
用户请求
    ↓
CDN 缓存（如 Vercel Edge Network）
    ↓ 未命中
Next.js Full Route Cache
    ↓ 未命中
重新渲染页面
```

### CDN 缓存配置

Next.js 会自动设置合适的 HTTP 缓存头：

```javascript
// app/posts/page.tsx
export const revalidate = 3600;

export default async function PostsPage() {
  return <div>内容</div>;
}

// Next.js 自动设置响应头：
// Cache-Control: s-maxage=3600, stale-while-revalidate
```

### 自定义缓存头

```javascript
// app/api/data/route.ts
export async function GET() {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      // 自定义缓存策略
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
```

### 协同工作

```javascript
export const revalidate = 3600; // Full Route Cache: 1 小时

export default async function Page() {
  return <div>内容</div>;
}

// 实际效果：
// 1. CDN 缓存 1 小时（根据 Cache-Control）
// 2. CDN 缓存失效后，请求到达 Next.js 服务器
// 3. Next.js 检查 Full Route Cache（也是 1 小时）
// 4. 如果 Full Route Cache 也失效，重新渲染
```

---

## 总结

**核心概念总结**：

### 1. Full Route Cache 本质

- 缓存静态渲染的完整输出（HTML + RSC Payload）
- 只对静态渲染的路由有效
- 在构建时或首次请求时生成

### 2. 控制方法

- `revalidate`：设置缓存过期时间
- `dynamic = 'force-dynamic'`：禁用缓存
- `generateStaticParams`：预生成动态路由

### 3. 手动清除

- `revalidatePath()`：按路径清除
- `revalidateTag()`：按标签清除
- 两者都会同时清除 Data Cache 和 Full Route Cache

### 4. 与其他缓存的关系

- 依赖 Data Cache 提供数据
- 可以与 CDN 缓存协同工作
- 独立于 Router Cache（客户端缓存）

## 延伸阅读

- [Full Route Cache 官方文档](https://nextjs.org/docs/app/building-your-application/caching#full-route-cache)
- [Static and Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#static-rendering-default)
- [revalidatePath API](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [revalidateTag API](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
