---
title: fetch 的缓存模式有哪些：force-cache、no-store、only-cache？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 fetch API 的缓存模式配置，包括 force-cache、no-store 等选项的使用场景和工作原理，掌握如何控制数据缓存策略。
tags:
  - Next.js
  - Fetch API
  - 缓存策略
  - Server Component
estimatedTime: 20 分钟
keywords:
  - fetch cache
  - force-cache
  - no-store
  - Next.js 缓存
highlight: 掌握 Next.js 中 fetch 的缓存模式配置，合理控制数据缓存策略
order: 658
---

## 问题 1：Next.js 中 fetch 支持哪些缓存模式？

Next.js 扩展了原生 fetch API，提供了多种缓存模式来控制数据的缓存行为。

### 主要缓存模式

**1. `force-cache`（默认）**

- 强制使用缓存
- 如果缓存存在则使用缓存，不存在则请求并缓存
- 相当于传统的 SSG 行为

**2. `no-store`**

- 不使用缓存
- 每次都重新请求数据
- 相当于 SSR 的动态渲染

**3. `no-cache`**

- 使用缓存但需要验证
- 每次都会向服务器验证缓存是否过期

```typescript
// force-cache：使用缓存（默认）
const data1 = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// no-store：不使用缓存，每次都请求
const data2 = await fetch("https://api.example.com/data", {
  cache: "no-store",
});

// no-cache：使用缓存但验证新鲜度
const data3 = await fetch("https://api.example.com/data", {
  cache: "no-cache",
});
```

---

## 问题 2：force-cache 和 no-store 的具体使用场景是什么？

不同的缓存模式适用于不同的数据特性和业务需求。

### force-cache 使用场景

**适合不经常变化的数据**：

- 静态内容（文章、文档）
- 配置信息
- 产品目录
- 用户资料（不常更新）

```typescript
// 博客文章列表 - 使用缓存
async function getBlogPosts() {
  const res = await fetch("https://api.blog.com/posts", {
    cache: "force-cache", // 缓存文章列表
  });
  return res.json();
}
```

### no-store 使用场景

**适合实时性要求高的数据**：

- 用户个人信息
- 实时价格
- 库存数量
- 动态内容

```typescript
// 用户个人信息 - 不使用缓存
async function getUserProfile(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}`, {
    cache: "no-store", // 每次都获取最新数据
  });
  return res.json();
}

// 实时股票价格
async function getStockPrice(symbol: string) {
  const res = await fetch(`https://api.stocks.com/${symbol}`, {
    cache: "no-store", // 实时数据不缓存
  });
  return res.json();
}
```

---

## 问题 3：Next.js 中的 revalidate 选项如何与缓存模式配合使用？

除了基本的缓存模式，Next.js 还提供了 `revalidate` 选项来实现定时重新验证缓存。

### revalidate 的工作原理

**时间基础的重新验证**：

- 设置缓存的有效期（秒）
- 超过时间后，下次请求会触发后台重新验证
- 用户仍然先看到旧缓存，新数据在后台更新

```typescript
// 每 60 秒重新验证一次
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 }, // 60 秒后重新验证
});

// 结合 force-cache 使用
const res2 = await fetch("https://api.example.com/data", {
  cache: "force-cache",
  next: { revalidate: 3600 }, // 1 小时后重新验证
});
```

### 不同 revalidate 值的含义

```typescript
// revalidate: 0 - 相当于 no-store
fetch(url, { next: { revalidate: 0 } });

// revalidate: false - 永久缓存
fetch(url, { next: { revalidate: false } });

// revalidate: 数字 - 指定秒数后重新验证
fetch(url, { next: { revalidate: 3600 } });
```

### 实际应用示例

```typescript
// 新闻列表 - 每 5 分钟更新
async function getNews() {
  const res = await fetch("https://api.news.com/latest", {
    next: { revalidate: 300 }, // 5 分钟
  });
  return res.json();
}

// 天气信息 - 每 10 分钟更新
async function getWeather(city: string) {
  const res = await fetch(`https://api.weather.com/${city}`, {
    next: { revalidate: 600 }, // 10 分钟
  });
  return res.json();
}
```

---

## 问题 4：如何在路由级别设置默认的缓存行为？

除了在每个 fetch 请求中单独设置，还可以在路由级别设置默认缓存行为。

### 使用 Route Segment Config

在页面或布局文件中导出配置选项：

```typescript
// app/blog/page.tsx
// 设置整个路由的缓存策略

// 强制动态渲染（相当于所有 fetch 使用 no-store）
export const dynamic = "force-dynamic";

// 强制静态渲染（相当于所有 fetch 使用 force-cache）
export const dynamic = "force-static";

// 设置默认的 revalidate 时间
export const revalidate = 3600; // 1 小时

export default async function BlogPage() {
  // 这个 fetch 会继承路由级别的配置
  const posts = await fetch("https://api.blog.com/posts");
  return <div>...</div>;
}
```

### 配置选项说明

```typescript
// dynamic 选项
export const dynamic = "auto"; // 默认，自动判断
export const dynamic = "force-dynamic"; // 强制动态（SSR）
export const dynamic = "force-static"; // 强制静态（SSG）
export const dynamic = "error"; // 如果有动态函数则报错

// revalidate 选项
export const revalidate = false; // 永久缓存（默认）
export const revalidate = 0; // 不缓存
export const revalidate = 60; // 60 秒后重新验证

// fetchCache 选项
export const fetchCache = "auto"; // 默认
export const fetchCache = "default-cache"; // 默认使用缓存
export const fetchCache = "only-cache"; // 只使用缓存
export const fetchCache = "force-cache"; // 强制缓存
export const fetchCache = "default-no-store"; // 默认不缓存
export const fetchCache = "only-no-store"; // 只能不缓存
export const fetchCache = "force-no-store"; // 强制不缓存
```

### 优先级规则

```typescript
// 优先级：fetch 配置 > 路由配置 > 全局配置

// 路由配置
export const revalidate = 3600;

export default async function Page() {
  // 这个会使用路由配置的 3600 秒
  const data1 = await fetch("https://api.example.com/data1");

  // 这个会覆盖路由配置，使用 60 秒
  const data2 = await fetch("https://api.example.com/data2", {
    next: { revalidate: 60 },
  });

  // 这个会覆盖路由配置，不使用缓存
  const data3 = await fetch("https://api.example.com/data3", {
    cache: "no-store",
  });
}
```

## 总结

**核心概念总结**：

### 1. 缓存模式选择

- **force-cache**：适合静态内容，默认行为
- **no-store**：适合动态内容，实时数据
- **no-cache**：使用缓存但需要验证

### 2. revalidate 时间控制

- 结合缓存模式使用，实现定时更新
- 0 表示不缓存，false 表示永久缓存
- 数字表示秒数后重新验证

### 3. 路由级别配置

- 使用 `dynamic`、`revalidate`、`fetchCache` 导出配置
- fetch 级别配置优先于路由级别配置
- 合理设置可以简化代码

## 延伸阅读

- [Next.js Data Fetching - fetch API](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [MDN - HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
