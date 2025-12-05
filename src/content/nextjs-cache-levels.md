---
title: Next.js 存在哪些级别的缓存？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  全面了解 Next.js 的多层缓存体系，包括请求记忆化、数据缓存、完整路由缓存和路由器缓存
tags:
  - Next.js
  - 缓存
  - 性能优化
  - App Router
estimatedTime: 25 分钟
keywords:
  - Next.js 缓存
  - Request Memoization
  - Data Cache
  - Full Route Cache
highlight: Next.js 提供四层缓存机制，从请求级到客户端全方位优化应用性能
order: 2
---

## 问题 1：Next.js 有哪些缓存层级？

Next.js 13+ App Router 提供了四个层级的缓存机制。

### 四层缓存体系

**1. Request Memoization（请求记忆化）**

- 作用范围：单次请求周期内
- 位置：服务器端
- 目的：避免同一请求中重复的 fetch 调用

**2. Data Cache（数据缓存）**

- 作用范围：跨请求、跨部署持久化
- 位置：服务器端
- 目的：缓存 fetch 请求的响应数据

**3. Full Route Cache（完整路由缓存）**

- 作用范围：构建时和运行时
- 位置：服务器端
- 目的：缓存整个页面的渲染结果（HTML + RSC Payload）

**4. Router Cache（路由器缓存）**

- 作用范围：用户会话期间
- 位置：客户端（浏览器）
- 目的：缓存已访问的路由，实现即时导航

```
用户请求
    ↓
[Router Cache] ← 客户端缓存
    ↓
[Full Route Cache] ← 服务器渲染缓存
    ↓
[Data Cache] ← 数据获取缓存
    ↓
[Request Memoization] ← 请求去重
    ↓
实际数据源
```

---

## 问题 2：Request Memoization 如何工作？

Request Memoization 是最内层的缓存，在单次渲染周期内自动去重相同的请求。

### 工作原理

**自动去重**

- Next.js 自动记忆化相同 URL 和选项的 fetch 请求
- 只在 React 组件树渲染期间有效
- 请求完成后自动清除

```javascript
// app/page.tsx
async function getUser(id: string) {
  // 第一次调用：实际发起请求
  const res = await fetch(`https://api.example.com/user/${id}`);
  return res.json();
}

export default async function Page() {
  // 这三个调用只会发起一次实际请求
  const user1 = await getUser("123"); // 实际请求
  const user2 = await getUser("123"); // 使用记忆化结果
  const user3 = await getUser("123"); // 使用记忆化结果

  return <div>{user1.name}</div>;
}
```

### 记忆化条件

必须满足以下条件才会被记忆化：

- 使用 `fetch` API
- 在同一次渲染周期内
- URL 和请求选项完全相同

```javascript
// ✅ 会被记忆化（URL 和选项相同）
fetch("https://api.example.com/data", { method: "GET" });
fetch("https://api.example.com/data", { method: "GET" });

// ❌ 不会被记忆化（选项不同）
fetch("https://api.example.com/data", { method: "GET" });
fetch("https://api.example.com/data", { method: "POST" });

// ❌ 不会被记忆化（不是 fetch）
axios.get("https://api.example.com/data");
axios.get("https://api.example.com/data");
```

---

## 问题 3：Data Cache 和 Full Route Cache 有什么区别？

这两个缓存经常被混淆，但它们缓存的内容完全不同。

### Data Cache（数据缓存）

**缓存内容**：fetch 请求的响应数据

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  // 这个 fetch 的结果会被缓存
  const res = await fetch("https://api.example.com/posts");
  const posts = await res.json();

  return <PostList posts={posts} />;
}
```

**特点**：

- 默认持久化，跨请求和部署
- 可以通过 `revalidate` 设置过期时间
- 可以通过 `cache: 'no-store'` 禁用

### Full Route Cache（完整路由缓存）

**缓存内容**：整个页面的渲染结果（HTML + RSC Payload）

```javascript
// 静态渲染的页面会被完整缓存
export default async function Page() {
  const data = await fetch("https://api.example.com/data");

  // 整个页面的 HTML 和 React Server Component 输出都会被缓存
  return <div>{/* 渲染内容 */}</div>;
}
```

**特点**：

- 只适用于静态渲染的路由
- 在构建时生成，运行时复用
- 动态渲染的路由不会被缓存

### 关系图

```
请求 → Full Route Cache（检查页面缓存）
         ↓ 未命中
       渲染页面
         ↓
       Data Cache（检查数据缓存）
         ↓ 未命中
       实际 fetch 请求
```

---

## 问题 4：Router Cache 在客户端如何工作？

Router Cache 是唯一的客户端缓存，用于优化导航体验。

### 缓存机制

**1. 自动缓存已访问路由**

```javascript
// 用户访问流程
用户访问 /posts → 缓存 /posts 的 RSC Payload
用户访问 /about → 缓存 /about 的 RSC Payload
用户返回 /posts → 从缓存读取，即时显示
```

**2. 缓存内容**

- RSC Payload（React Server Component 输出）
- 不是完整的 HTML，而是 React 组件树的序列化数据

**3. 缓存时长**

- 静态路由：5 分钟
- 动态路由：30 秒
- 可以通过 `router.refresh()` 手动清除

```javascript
"use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // 清除当前路由的缓存并重新获取
        router.refresh();
      }}
    >
      刷新数据
    </button>
  );
}
```

### 预取行为

Next.js 会自动预取可见的 `<Link>` 组件：

```javascript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 这些链接会被自动预取并缓存 */}
      <Link href="/posts">文章</Link>
      <Link href="/about">关于</Link>

      {/* 禁用预取 */}
      <Link href="/admin" prefetch={false}>
        管理
      </Link>
    </nav>
  );
}
```

---

## 问题 5：如何控制不同层级的缓存？

每个缓存层级都有对应的控制方法。

### Request Memoization

无法手动控制，自动工作：

```javascript
// 自动记忆化，无需配置
const data1 = await fetch("https://api.example.com/data");
const data2 = await fetch("https://api.example.com/data"); // 自动复用
```

### Data Cache

通过 fetch 选项控制：

```javascript
// 1. 设置重新验证时间（秒）
fetch("https://api.example.com/posts", {
  next: { revalidate: 3600 }, // 1小时后过期
});

// 2. 禁用缓存
fetch("https://api.example.com/posts", {
  cache: "no-store", // 每次都重新获取
});

// 3. 强制缓存
fetch("https://api.example.com/posts", {
  cache: "force-cache", // 永久缓存
});
```

### Full Route Cache

通过路由段配置控制：

```javascript
// app/posts/page.tsx

// 1. 设置整个路由的重新验证时间
export const revalidate = 3600; // 1小时

// 2. 禁用静态渲染（也就禁用了 Full Route Cache）
export const dynamic = "force-dynamic";

// 3. 指定动态参数
export const dynamicParams = true;

export default async function Page() {
  return <div>内容</div>;
}
```

### Router Cache

通过客户端方法控制：

```javascript
"use client";

import { useRouter } from "next/navigation";

export default function Component() {
  const router = useRouter();

  // 刷新当前路由
  router.refresh();

  // 预取特定路由
  router.prefetch("/posts");

  return <div>内容</div>;
}
```

---

## 总结

**核心概念总结**：

### 1. 四层缓存体系

- **Request Memoization**：单次请求内的自动去重
- **Data Cache**：持久化的数据获取缓存
- **Full Route Cache**：静态页面的完整渲染缓存
- **Router Cache**：客户端的路由导航缓存

### 2. 缓存位置

- 服务器端：Request Memoization、Data Cache、Full Route Cache
- 客户端：Router Cache

### 3. 控制方法

- Data Cache：通过 `fetch` 选项（`cache`、`next.revalidate`）
- Full Route Cache：通过路由段配置（`revalidate`、`dynamic`）
- Router Cache：通过 `router.refresh()` 和 `prefetch`

### 4. 缓存策略

- 静态内容：充分利用所有缓存层级
- 动态内容：选择性禁用 Data Cache 和 Full Route Cache
- 实时数据：使用 `cache: 'no-store'` 和 `dynamic = 'force-dynamic'`

## 延伸阅读

- [Next.js Caching 官方文档](https://nextjs.org/docs/app/building-your-application/caching)
- [Data Fetching and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [useRouter Hook](https://nextjs.org/docs/app/api-reference/functions/use-router)
