---
title: 什么时候使用 no-store？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Next.js 中 cache: 'no-store' 的使用场景，掌握何时需要禁用缓存以获取实时数据
tags:
  - Next.js
  - 缓存
  - no-store
  - 动态数据
estimatedTime: 18 分钟
keywords:
  - no-store
  - 禁用缓存
  - 实时数据
  - 动态渲染
highlight: no-store 用于需要每次都获取最新数据的场景，会触发动态渲染
order: 8
---

## 问题 1：no-store 是什么？

`cache: 'no-store'` 是 fetch API 的选项，用于完全禁用缓存。

### 基本用法

```javascript
// 禁用缓存
const data = await fetch("https://api.example.com/data", {
  cache: "no-store",
}).then((r) => r.json());

// 等价于
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 0 },
}).then((r) => r.json());
```

### 效果

**使用 no-store**：

```javascript
// 每次请求都会实际调用 API
请求 1 → 调用 API → 返回数据
请求 2 → 调用 API → 返回数据
请求 3 → 调用 API → 返回数据
```

**不使用 no-store**：

```javascript
// 使用缓存
请求 1 → 调用 API → 缓存 → 返回数据
请求 2 → 读取缓存 → 返回数据
请求 3 → 读取缓存 → 返回数据
```

---

## 问题 2：no-store 会触发什么？

使用 `no-store` 会触发动态渲染，影响整个路由。

### 触发动态渲染

```javascript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // 使用 no-store
  const stats = await fetch("https://api.example.com/stats", {
    cache: "no-store",
  }).then((r) => r.json());

  // 这会导致整个页面变成动态渲染
  // Full Route Cache 不会缓存这个页面
  return <div>{stats.value}</div>;
}

// 结果：
// - 每次请求都重新渲染整个页面
// - 不仅 stats 数据是实时的，整个页面都是动态的
```

### 影响范围

```javascript
// app/posts/page.tsx
export default async function PostsPage() {
  // 静态数据：会被缓存
  const config = await fetch("https://api.example.com/config", {
    next: { revalidate: 3600 },
  }).then((r) => r.json());

  // 实时数据：使用 no-store
  const stats = await fetch("https://api.example.com/stats", {
    cache: "no-store",
  }).then((r) => r.json());

  return (
    <div>
      <Config data={config} />
      <Stats data={stats} />
    </div>
  );
}

// 问题：
// - stats 使用了 no-store
// - 整个页面变成动态渲染
// - config 虽然设置了 revalidate，但页面不会被缓存
// - 每次请求都会重新渲染，包括获取 config
```

---

## 问题 3：什么场景需要使用 no-store？

只有在需要绝对实时数据时才使用 `no-store`。

### 适合使用的场景

**1. 用户特定数据**

```javascript
// app/profile/page.tsx
import { cookies } from "next/headers";

export default async function ProfilePage() {
  const token = cookies().get("token")?.value;

  // 用户个人信息，必须实时
  const user = await fetch("https://api.example.com/user", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => r.json());

  return <UserProfile user={user} />;
}
```

**2. 实时统计数据**

```javascript
// app/admin/stats/page.tsx
export default async function StatsPage() {
  // 实时访问统计
  const stats = await fetch("https://api.example.com/stats/realtime", {
    cache: "no-store",
  }).then((r) => r.json());

  return (
    <div>
      <h1>实时统计</h1>
      <p>当前在线：{stats.online}</p>
      <p>今日访问：{stats.todayVisits}</p>
    </div>
  );
}
```

**3. 购物车和订单**

```javascript
// app/cart/page.tsx
export default async function CartPage() {
  // 购物车数据必须实时
  const cart = await fetch("https://api.example.com/cart", {
    cache: "no-store",
  }).then((r) => r.json());

  return <ShoppingCart items={cart.items} />;
}
```

**4. 表单提交后的数据**

```javascript
// app/posts/[id]/page.tsx
export default async function PostPage({ params, searchParams }) {
  // 如果是刚提交的，获取最新数据
  const shouldRefresh = searchParams.refresh === "true";

  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    cache: shouldRefresh ? "no-store" : "force-cache",
    next: { revalidate: shouldRefresh ? 0 : 3600 },
  }).then((r) => r.json());

  return <Post data={post} />;
}
```

**5. 敏感操作的确认页面**

```javascript
// app/delete-confirm/page.tsx
export default async function DeleteConfirmPage({ searchParams }) {
  const itemId = searchParams.id;

  // 确认删除前，获取最新的项目信息
  const item = await fetch(`https://api.example.com/items/${itemId}`, {
    cache: "no-store",
  }).then((r) => r.json());

  return (
    <div>
      <p>确定要删除 {item.name} 吗？</p>
      <p>最后修改时间：{item.updatedAt}</p>
    </div>
  );
}
```

---

## 问题 4：什么场景不应该使用 no-store？

大多数情况下不需要使用 `no-store`。

### 不适合使用的场景

**1. 公共内容**

```javascript
// ❌ 不需要 no-store
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // 过度使用
  }).then(r => r.json());

  return <PostList posts={posts} />;
}

// ✅ 使用合理的缓存时间
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 300 } // 5 分钟缓存
  }).then(r => r.json());

  return <PostList posts={posts} />;
}
```

**2. 静态配置**

```javascript
// ❌ 配置数据不需要实时
const config = await fetch("https://api.example.com/config", {
  cache: "no-store",
});

// ✅ 长期缓存
const config = await fetch("https://api.example.com/config", {
  next: { revalidate: 86400 }, // 1 天
});
```

**3. 列表页面**

```javascript
// ❌ 列表不需要绝对实时
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    cache: 'no-store'
  }).then(r => r.json());

  return <ProductList products={products} />;
}

// ✅ 使用 ISR
export const revalidate = 60; // 1 分钟

export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products')
    .then(r => r.json());

  return <ProductList products={products} />;
}
```

**4. 详情页面**

```javascript
// ❌ 文章内容不需要实时
export default async function PostPage({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    cache: 'no-store'
  }).then(r => r.json());

  return <Article post={post} />;
}

// ✅ 使用按需重新验证
export default async function PostPage({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: {
      revalidate: 3600, // 1 小时
      tags: ['posts'] // 可以手动清除
    }
  }).then(r => r.json());

  return <Article post={post} />;
}
```

---

## 问题 5：no-store 的替代方案有哪些？

在很多情况下，有比 `no-store` 更好的选择。

### 替代方案 1：短期缓存

```javascript
// 使用短期缓存代替 no-store
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 10 }, // 10 秒缓存
});

// 优势：
// - 减少服务器压力
// - 10 秒内的多个请求共享缓存
// - 数据仍然相对实时
```

### 替代方案 2：按需重新验证

```javascript
// 使用标签管理缓存
const data = await fetch("https://api.example.com/data", {
  next: {
    revalidate: 3600, // 默认 1 小时
    tags: ["data"],
  },
});

// 需要更新时手动清除
("use server");
import { revalidateTag } from "next/cache";

export async function updateData() {
  await saveData();
  revalidateTag("data"); // 清除缓存
}

// 优势：
// - 大部分时间使用缓存
// - 只在数据变化时清除
// - 更高效的缓存利用
```

### 替代方案 3：客户端获取

```javascript
// 服务器端：使用缓存
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const staticData = await fetch("https://api.example.com/static").then((r) =>
    r.json()
  );

  return (
    <div>
      <StaticContent data={staticData} />
      <RealtimeStats /> {/* 客户端组件 */}
    </div>
  );
}

// 客户端：实时获取
("use client");
import { useEffect, useState } from "react";

export function RealtimeStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // 客户端实时获取
    const fetchStats = async () => {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // 每 5 秒更新

    return () => clearInterval(interval);
  }, []);

  return <div>{stats?.value}</div>;
}

// 优势：
// - 页面可以静态渲染
// - 只有实时部分在客户端更新
// - 更好的性能和用户体验
```

### 替代方案 4：Streaming

```javascript
// 使用 Suspense 和 Streaming
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <StaticContent />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}

async function DynamicContent() {
  // 这部分可以使用 no-store
  const data = await fetch("https://api.example.com/dynamic", {
    cache: "no-store",
  }).then((r) => r.json());

  return <div>{data.value}</div>;
}

// 优势：
// - 静态内容快速显示
// - 动态内容异步加载
// - 更好的用户体验
```

### 方案对比

```javascript
// 场景 1：数据每分钟变化
// ❌ no-store：每次请求都获取
// ✅ revalidate: 60：1 分钟缓存

// 场景 2：数据不定期变化
// ❌ no-store：过度获取
// ✅ tags + revalidateTag：按需清除

// 场景 3：部分数据需要实时
// ❌ 整个页面 no-store
// ✅ 客户端获取或 Streaming

// 场景 4：用户特定数据
// ✅ no-store：确实需要实时
```

---

## 总结

**核心概念总结**：

### 1. no-store 的作用

- 完全禁用缓存，每次都获取最新数据
- 触发动态渲染，影响整个路由
- 增加服务器压力和响应时间

### 2. 适用场景

- 用户特定数据（个人信息、购物车）
- 实时统计和监控数据
- 敏感操作的确认页面
- 表单提交后需要立即看到变化

### 3. 不适用场景

- 公共内容（博客、新闻）
- 静态配置
- 列表和详情页面
- 可以接受短期延迟的数据

### 4. 替代方案

- 短期缓存（10-60 秒）
- 按需重新验证（tags + revalidateTag）
- 客户端获取实时数据
- Streaming 和 Suspense

## 延伸阅读

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [fetch API cache option](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)
- [Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
