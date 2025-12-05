---
title: 为什么在 RSC 中 fetch 默认是缓存的？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 在 React Server Components 中为什么将 fetch 默认设置为缓存模式，以及这种设计背后的性能优化考虑和最佳实践。
tags:
  - Next.js
  - React Server Components
  - Fetch 缓存
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - RSC
  - fetch 缓存
  - Server Components
  - Next.js 默认行为
highlight: 理解 RSC 中 fetch 默认缓存的设计理念和性能优势
order: 303
---

## 问题 1：RSC 中 fetch 的默认缓存行为是什么？

在 Next.js 的 React Server Components (RSC) 中，fetch 请求默认会被缓存，这与浏览器中的 fetch 行为不同。

### 默认行为对比

**浏览器中的 fetch**：

- 默认不缓存或使用浏览器缓存
- 每次请求都会发送到服务器

**Next.js RSC 中的 fetch**：

- 默认使用 `force-cache` 模式
- 请求结果会被持久化缓存
- 相当于静态生成（SSG）的行为

```typescript
// 在 Server Component 中
async function getData() {
  // 默认会被缓存，相当于 cache: 'force-cache'
  const res = await fetch("https://api.example.com/data");
  return res.json();
}

// 等同于
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    cache: "force-cache", // 显式指定
  });
  return res.json();
}
```

---

## 问题 2：为什么 Next.js 要将 fetch 默认设置为缓存？

这个设计决策背后有多个重要的原因，主要围绕性能优化和开发体验。

### 1. 性能优化考虑

**减少不必要的网络请求**：

- 避免每次渲染都重新请求相同的数据
- 降低外部 API 的负载
- 提升页面加载速度

```typescript
// 如果不缓存，每次访问都会请求
async function ProductPage({ id }: { id: string }) {
  // 假设这个 API 很慢，每次都请求会很慢
  const product = await fetch(`https://api.example.com/products/${id}`);

  // 有了缓存，第一次请求后就会被缓存
  // 后续访问直接使用缓存，速度很快
  return <div>{product.name}</div>;
}
```

### 2. 静态优先的理念

**Next.js 推崇静态优先**：

- 尽可能生成静态页面
- 静态页面可以部署到 CDN
- 提供最快的访问速度

```typescript
// 默认缓存让页面可以被静态生成
export default async function BlogPage() {
  // 这个请求会在构建时执行并缓存
  const posts = await fetch("https://api.blog.com/posts");

  // 页面可以被静态生成，部署到 CDN
  return <PostList posts={posts} />;
}
```

### 3. 开发体验优化

**简化开发者的决策**：

- 不需要每次都考虑是否缓存
- 默认获得最佳性能
- 需要动态数据时再显式指定

```typescript
// 大多数情况下，默认缓存就够了
async function getStaticData() {
  const data = await fetch("https://api.example.com/config");
  return data.json();
}

// 只有需要动态数据时才显式指定
async function getDynamicData() {
  const data = await fetch("https://api.example.com/user", {
    cache: "no-store", // 显式指定不缓存
  });
  return data.json();
}
```

---

## 问题 3：默认缓存会带来什么问题，如何解决？

虽然默认缓存有很多好处，但也可能导致一些问题，特别是对于动态数据。

### 常见问题

**1. 数据过期问题**

```typescript
// 问题：用户信息可能已经更新，但还在显示旧数据
async function UserProfile({ userId }: { userId: string }) {
  // 默认缓存，可能显示过期的用户信息
  const user = await fetch(`https://api.example.com/users/${userId}`);
  return <div>{user.name}</div>;
}
```

**解决方案 1：使用 no-store**

```typescript
// 对于实时性要求高的数据，不使用缓存
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetch(`https://api.example.com/users/${userId}`, {
    cache: "no-store", // 每次都获取最新数据
  });
  return <div>{user.name}</div>;
}
```

**解决方案 2：使用 revalidate**

```typescript
// 使用定时重新验证，平衡性能和实时性
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetch(`https://api.example.com/users/${userId}`, {
    next: { revalidate: 60 }, // 60 秒后重新验证
  });
  return <div>{user.name}</div>;
}
```

**解决方案 3：使用 revalidateTag**

```typescript
// 数据更新时主动刷新缓存
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetch(`https://api.example.com/users/${userId}`, {
    next: { tags: [`user-${userId}`] }, // 打标签
  });
  return <div>{user.name}</div>;
}

// 在更新用户信息时
("use server");
import { revalidateTag } from "next/cache";

async function updateUser(userId: string, data: any) {
  await fetch(`https://api.example.com/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  // 刷新缓存
  revalidateTag(`user-${userId}`);
}
```

### 2. 开发环境的困扰

**问题：开发时修改了 API 数据，但页面不更新**

```typescript
// 开发时，API 返回的数据变了，但页面还是显示旧数据
async function DevPage() {
  const data = await fetch("http://localhost:3001/api/data");
  return <div>{JSON.stringify(data)}</div>;
}
```

**解决方案：开发环境禁用缓存**

```typescript
// 方式 1：在 fetch 中判断环境
async function getData() {
  const res = await fetch("http://localhost:3001/api/data", {
    cache: process.env.NODE_ENV === "development" ? "no-store" : "force-cache",
  });
  return res.json();
}

// 方式 2：在路由配置中设置
// app/dev/page.tsx
export const dynamic =
  process.env.NODE_ENV === "development" ? "force-dynamic" : "auto";
```

---

## 问题 4：如何判断什么时候应该使用缓存，什么时候不应该？

选择合适的缓存策略需要根据数据的特性和业务需求来决定。

### 决策流程

**1. 数据更新频率**

```typescript
// 很少更新 -> 使用缓存
async function getAppConfig() {
  return fetch("https://api.example.com/config", {
    cache: "force-cache", // 或使用默认
  });
}

// 频繁更新 -> 不使用缓存
async function getStockPrice(symbol: string) {
  return fetch(`https://api.stocks.com/${symbol}`, {
    cache: "no-store",
  });
}

// 定期更新 -> 使用 revalidate
async function getNews() {
  return fetch("https://api.news.com/latest", {
    next: { revalidate: 300 }, // 5 分钟
  });
}
```

**2. 数据个性化程度**

```typescript
// 公共数据 -> 使用缓存
async function getPublicPosts() {
  return fetch("https://api.blog.com/posts", {
    cache: "force-cache",
  });
}

// 用户特定数据 -> 不使用缓存
async function getUserDashboard(userId: string) {
  return fetch(`https://api.example.com/users/${userId}/dashboard`, {
    cache: "no-store",
  });
}
```

**3. 实时性要求**

```typescript
// 实时性要求低 -> 使用缓存
async function getBlogPost(slug: string) {
  return fetch(`https://api.blog.com/posts/${slug}`, {
    next: { revalidate: 3600 }, // 1 小时
  });
}

// 实时性要求高 -> 不使用缓存
async function getOrderStatus(orderId: string) {
  return fetch(`https://api.example.com/orders/${orderId}`, {
    cache: "no-store",
  });
}
```

### 实用决策表

| 数据类型 | 更新频率 | 个性化 | 实时性 | 推荐策略                       |
| -------- | -------- | ------ | ------ | ------------------------------ |
| 博客文章 | 低       | 否     | 低     | `force-cache` + `revalidate`   |
| 产品列表 | 中       | 否     | 中     | `revalidate: 300-3600`         |
| 用户资料 | 中       | 是     | 中     | `no-store` 或 `revalidate: 60` |
| 实时价格 | 高       | 否     | 高     | `no-store`                     |
| 配置信息 | 极低     | 否     | 低     | `force-cache`                  |
| 订单状态 | 高       | 是     | 高     | `no-store`                     |

## 总结

**核心概念总结**：

### 1. 默认缓存的原因

- 性能优化：减少不必要的网络请求
- 静态优先：支持静态生成和 CDN 部署
- 开发体验：简化决策，默认获得最佳性能

### 2. 缓存策略选择

- 根据数据更新频率、个性化程度、实时性要求选择
- 静态内容使用默认缓存
- 动态内容显式指定 `no-store` 或 `revalidate`

### 3. 解决缓存问题

- 使用 `no-store` 禁用缓存
- 使用 `revalidate` 定时更新
- 使用 `revalidateTag` 按需刷新

## 延伸阅读

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js fetch API](https://nextjs.org/docs/app/api-reference/functions/fetch)
