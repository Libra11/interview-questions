---
title: loading.tsx 使用场景是什么？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js App Router 中 loading.tsx 文件的作用，掌握如何优雅地处理页面加载状态。
tags:
  - Next.js
  - loading
  - Suspense
  - 加载状态
estimatedTime: 18 分钟
keywords:
  - loading.tsx
  - 加载状态
  - Suspense
  - 流式渲染
highlight: 理解 loading.tsx 如何基于 React Suspense 实现自动加载状态，提升用户体验
order: 718
---

## 问题 1：loading.tsx 是什么？

**自动加载状态**

`loading.tsx` 是 Next.js App Router 提供的特殊文件，用于在页面或布局加载数据时自动显示加载状态。

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  // 数据获取需要时间
  const data = await fetchDashboardData(); // 假设需要 2 秒

  return <DashboardContent data={data} />;
}

// 用户访问 /dashboard 时：
// 1. 立即显示 loading.tsx 的内容
// 2. 后台获取数据
// 3. 数据准备好后，显示 page.tsx 的内容
```

**基于 React Suspense**

`loading.tsx` 实际上是 React Suspense 的语法糖。

```typescript
// loading.tsx 等价于：
import { Suspense } from "react";

export default function Layout({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

// Next.js 自动为你创建这个 Suspense 边界
// 你只需要提供 loading.tsx 文件
```

---

## 问题 2：loading.tsx 的作用范围是什么？

**作用于同级和子级路由**

`loading.tsx` 会为同级的 `page.tsx` 和所有子路由提供加载状态。

```typescript
// 文件结构
app/
├── dashboard/
│   ├── loading.tsx       // 加载状态
│   ├── page.tsx          // /dashboard
│   ├── analytics/
│   │   └── page.tsx      // /dashboard/analytics
│   └── settings/
│       └── page.tsx      // /dashboard/settings

// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <div>Loading dashboard...</div>;
}

// 这个 loading.tsx 会在以下情况显示：
// 1. 访问 /dashboard 时
// 2. 访问 /dashboard/analytics 时
// 3. 访问 /dashboard/settings 时

// 如果子路由有自己的 loading.tsx，会优先使用子路由的
```

**嵌套加载状态**

```typescript
// 文件结构
app/
├── dashboard/
│   ├── loading.tsx           // 仪表板加载状态
│   ├── page.tsx
│   └── analytics/
│       ├── loading.tsx       // 分析页加载状态
│       └── page.tsx

// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <div>Loading dashboard...</div>;
}

// app/dashboard/analytics/loading.tsx
export default function AnalyticsLoading() {
  return <div>Loading analytics...</div>;
}

// 访问 /dashboard 时：
// 显示 DashboardLoading

// 访问 /dashboard/analytics 时：
// 显示 AnalyticsLoading（更具体的加载状态）
```

---

## 问题 3：如何设计好的加载状态？

**骨架屏（Skeleton）**

骨架屏是最常见的加载状态设计。

```typescript
// app/blog/loading.tsx
export default function BlogLoading() {
  return (
    <div className="blog-skeleton">
      {/* 模拟博客列表的结构 */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="post-skeleton">
          {/* 标题骨架 */}
          <div className="skeleton-title" />

          {/* 摘要骨架 */}
          <div className="skeleton-text" />
          <div className="skeleton-text" />
          <div className="skeleton-text short" />

          {/* 元信息骨架 */}
          <div className="skeleton-meta">
            <div className="skeleton-avatar" />
            <div className="skeleton-name" />
          </div>
        </div>
      ))}
    </div>
  );
}

// CSS
.skeleton-title,
.skeleton-text,
.skeleton-avatar {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**加载指示器**

```typescript
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="loading-container">
      {/* 旋转加载器 */}
      <div className="spinner" />

      {/* 加载文本 */}
      <p>Loading your dashboard...</p>

      {/* 进度条 */}
      <div className="progress-bar">
        <div className="progress-fill" />
      </div>
    </div>
  );
}

// 简单的加载器
export default function SimpleLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

**保持布局一致性**

```typescript
// app/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div className="products-page">
      {/* 保持与实际页面相同的布局 */}
      <header className="products-header">
        <div className="skeleton-title" />
        <div className="skeleton-filter" />
      </header>

      <div className="products-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="product-card-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-text" />
            <div className="skeleton-price" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 优势：
// - 用户知道页面的大致结构
// - 避免布局跳动（Layout Shift）
// - 更好的用户体验
```

---

## 问题 4：loading.tsx 与手动 Suspense 有什么区别？

**loading.tsx - 自动处理**

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}

// Next.js 自动：
// 1. 创建 Suspense 边界
// 2. 在数据加载时显示 loading.tsx
// 3. 数据准备好后显示 page.tsx
```

**手动 Suspense - 更精细的控制**

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      {/* 立即显示的内容 */}
      <h1>Dashboard</h1>

      {/* 延迟加载的内容 1 */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <Stats />
      </Suspense>

      {/* 延迟加载的内容 2 */}
      <Suspense fallback={<div>Loading chart...</div>}>
        <Chart />
      </Suspense>

      {/* 延迟加载的内容 3 */}
      <Suspense fallback={<div>Loading activity...</div>}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

// 每个组件独立加载，有自己的加载状态
async function Stats() {
  const stats = await fetchStats();
  return <div>{/* 统计数据 */}</div>;
}

async function Chart() {
  const data = await fetchChartData();
  return <div>{/* 图表 */}</div>;
}

async function RecentActivity() {
  const activity = await fetchActivity();
  return <div>{/* 活动列表 */}</div>;
}
```

**组合使用**

```typescript
// app/dashboard/loading.tsx（页面级加载）
export default function Loading() {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-content" />
    </div>
  );
}

// app/dashboard/page.tsx（组件级加载）
import { Suspense } from "react";

export default async function DashboardPage() {
  // 关键数据在服务端获取
  const user = await fetchUser();

  return (
    <div>
      {/* 立即显示用户信息 */}
      <UserProfile user={user} />

      {/* 次要内容使用 Suspense 延迟加载 */}
      <Suspense fallback={<ChartSkeleton />}>
        <Chart userId={user.id} />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity userId={user.id} />
      </Suspense>
    </div>
  );
}

// 优势：
// - 关键内容快速显示
// - 次要内容流式加载
// - 更好的用户体验
```

---

## 问题 5：loading.tsx 的最佳实践是什么？

**匹配实际内容的结构**

```typescript
// ✅ 好：骨架屏匹配实际内容
// app/blog/loading.tsx
export default function BlogLoading() {
  return (
    <div className="blog-layout">
      <div className="blog-header">
        <div className="skeleton-title w-64 h-8" />
        <div className="skeleton-text w-96 h-4" />
      </div>

      <div className="blog-grid">
        {[1, 2, 3].map((i) => (
          <article key={i} className="blog-card">
            <div className="skeleton-image h-48" />
            <div className="skeleton-title w-full h-6" />
            <div className="skeleton-text w-full h-4" />
          </article>
        ))}
      </div>
    </div>
  );
}

// ❌ 不好：简单的加载器
export default function BlogLoading() {
  return <div>Loading...</div>;
}

// 问题：
// - 用户不知道页面结构
// - 可能有布局跳动
// - 用户体验差
```

**避免过长的加载时间**

```typescript
// ❌ 不好：一次性加载所有数据
export default async function DashboardPage() {
  // 等待所有数据加载完成
  const [user, posts, comments, analytics] = await Promise.all([
    fetchUser(), // 100ms
    fetchPosts(), // 500ms
    fetchComments(), // 300ms
    fetchAnalytics(), // 2000ms  ← 最慢的请求
  ]);

  // 用户需要等待 2000ms 才能看到任何内容
  return <div>...</div>;
}

// ✅ 好：关键数据优先，次要数据流式加载
export default async function DashboardPage() {
  // 只等待关键数据
  const user = await fetchUser(); // 100ms

  return (
    <div>
      {/* 立即显示用户信息 */}
      <UserProfile user={user} />

      {/* 次要数据流式加载 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics />
      </Suspense>
    </div>
  );
}

// 用户只需等待 100ms 就能看到内容
```

**提供有意义的加载信息**

```typescript
// ✅ 好：告诉用户正在发生什么
export default function Loading() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading your personalized dashboard...</p>
      <p className="text-sm text-gray-500">This may take a few seconds</p>
    </div>
  );
}

// ❌ 不好：没有任何信息
export default function Loading() {
  return <div className="spinner" />;
}
```

**考虑不同的加载速度**

```typescript
// app/products/loading.tsx
"use client";

import { useState, useEffect } from "react";

export default function ProductsLoading() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    // 如果加载超过 3 秒，显示额外信息
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="spinner" />
      <p>Loading products...</p>

      {showSlowMessage && (
        <p className="text-sm text-gray-500">
          This is taking longer than usual. Please wait...
        </p>
      )}
    </div>
  );
}
```

---

## 总结

**loading.tsx 核心概念**：

### 1. 基本作用

- 自动显示加载状态
- 基于 React Suspense
- 在数据获取时显示

### 2. 作用范围

- 作用于同级和子级路由
- 可以嵌套（子路由优先）
- 自动创建 Suspense 边界

### 3. 设计原则

- 使用骨架屏匹配实际内容
- 保持布局一致性
- 提供有意义的加载信息
- 避免布局跳动

### 4. 与 Suspense 对比

**loading.tsx**：

- 页面级加载状态
- 自动处理
- 简单易用

**手动 Suspense**：

- 组件级加载状态
- 精细控制
- 流式渲染

### 5. 最佳实践

- 骨架屏 > 简单加载器
- 关键数据优先加载
- 次要数据流式加载
- 提供加载进度反馈
- 考虑慢速网络情况

## 延伸阅读

- [Next.js 官方文档 - Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React 官方文档 - Suspense](https://react.dev/reference/react/Suspense)
- [Web.dev - Skeleton Screens](https://web.dev/skeleton-screens/)
