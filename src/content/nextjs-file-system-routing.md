---
title: Next.js 的"文件系统路由"是如何工作的？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 文件系统路由的工作原理，掌握如何通过文件结构自动生成应用路由。
tags:
  - Next.js
  - 路由
  - 文件系统
  - App Router
estimatedTime: 18 分钟
keywords:
  - 文件系统路由
  - Next.js 路由
  - 约定式路由
  - App Router
highlight: 理解 Next.js 如何将文件结构映射为应用路由，掌握约定式路由的核心原理
order: 711
---

## 问题 1：什么是文件系统路由？

**文件系统路由（File-based Routing）** 是 Next.js 的核心特性之一，它允许你通过创建文件和文件夹来自动生成应用的路由，而不需要手动配置路由规则。

```typescript
// 传统 React 路由配置（React Router）
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog/:id" element={<BlogPost />} />
      </Routes>
    </BrowserRouter>
  );
}

// Next.js 文件系统路由
// 只需创建文件，路由自动生成
// app/page.tsx          → /
// app/about/page.tsx    → /about
// app/blog/[id]/page.tsx → /blog/:id
```

**核心原理**：

Next.js 会扫描特定目录（`pages` 或 `app`）下的文件结构，根据文件路径自动生成对应的 URL 路由。

```typescript
// 文件结构
app/
├── page.tsx              // 根路由 /
├── about/
│   └── page.tsx          // /about
├── blog/
│   ├── page.tsx          // /blog
│   └── [slug]/
│       └── page.tsx      // /blog/:slug
└── dashboard/
    ├── page.tsx          // /dashboard
    └── settings/
        └── page.tsx      // /dashboard/settings
```

---

## 问题 2：Pages Router 和 App Router 的文件系统路由有什么区别？

**Pages Router（传统方式）**

在 Pages Router 中，`pages` 目录下的每个文件都会自动成为一个路由。

```typescript
// Pages Router 文件结构
pages/
├── index.tsx           // /
├── about.tsx           // /about
├── blog/
│   ├── index.tsx       // /blog
│   └── [slug].tsx      // /blog/:slug
└── api/
    └── hello.ts        // /api/hello

// pages/index.tsx
export default function Home() {
  return <h1>Home Page</h1>;
}

// pages/about.tsx
export default function About() {
  return <h1>About Page</h1>;
}

// pages/blog/[slug].tsx
export default function BlogPost({ params }) {
  return <h1>Blog Post: {params.slug}</h1>;
}
```

**App Router（新方式）**

在 App Router 中，只有 `page.tsx` 文件才会成为可访问的路由，文件夹用于组织路由结构。

```typescript
// App Router 文件结构
app/
├── page.tsx            // /
├── about/
│   └── page.tsx        // /about
├── blog/
│   ├── page.tsx        // /blog
│   └── [slug]/
│       └── page.tsx    // /blog/:slug
└── dashboard/
    ├── layout.tsx      // 不是路由，是布局
    └── page.tsx        // /dashboard

// app/page.tsx
export default function Home() {
  return <h1>Home Page</h1>;
}

// app/about/page.tsx
export default function About() {
  return <h1>About Page</h1>;
}

// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Blog Post: {params.slug}</h1>;
}
```

**关键区别**：

```typescript
// Pages Router：文件即路由
pages/about.tsx         → /about ✅
pages/blog/post.tsx     → /blog/post ✅

// App Router：只有 page.tsx 是路由
app/about/page.tsx      → /about ✅
app/about/layout.tsx    → 不是路由 ❌
app/about/loading.tsx   → 不是路由 ❌
app/blog/components/    → 不是路由 ❌
```

---

## 问题 3：文件系统路由如何处理动态路由？

**动态路由段（Dynamic Segments）**

使用方括号 `[]` 创建动态路由段，可以匹配 URL 中的动态参数。

```typescript
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  // URL: /blog/hello-world
  // params.slug = "hello-world"

  return <h1>Post: {params.slug}</h1>;
}

// app/products/[category]/[id]/page.tsx
export default function Product({
  params,
}: {
  params: { category: string; id: string };
}) {
  // URL: /products/electronics/123
  // params.category = "electronics"
  // params.id = "123"

  return (
    <div>
      <h1>Category: {params.category}</h1>
      <p>Product ID: {params.id}</p>
    </div>
  );
}
```

**捕获所有路由（Catch-all Segments）**

使用 `[...slug]` 可以匹配多个路径段。

```typescript
// app/docs/[...slug]/page.tsx
export default function Docs({ params }: { params: { slug: string[] } }) {
  // URL: /docs/getting-started/installation
  // params.slug = ["getting-started", "installation"]

  // URL: /docs/api/reference/components
  // params.slug = ["api", "reference", "components"]

  return <h1>Docs: {params.slug.join(" / ")}</h1>;
}
```

**可选捕获所有路由（Optional Catch-all）**

使用 `[[...slug]]` 可以让路由段变为可选。

```typescript
// app/shop/[[...categories]]/page.tsx
export default function Shop({
  params,
}: {
  params: { categories?: string[] };
}) {
  // URL: /shop
  // params.categories = undefined

  // URL: /shop/electronics
  // params.categories = ["electronics"]

  // URL: /shop/electronics/phones
  // params.categories = ["electronics", "phones"]

  return (
    <div>
      {params.categories ? (
        <h1>Category: {params.categories.join(" > ")}</h1>
      ) : (
        <h1>All Products</h1>
      )}
    </div>
  );
}
```

---

## 问题 4：文件系统路由如何处理特殊文件？

**特殊文件约定**

App Router 定义了一系列特殊文件名，每个都有特定的用途。

```typescript
// 路由文件
app/
├── layout.tsx          // 布局组件（共享 UI）
├── page.tsx            // 页面组件（路由入口）
├── loading.tsx         // 加载状态
├── error.tsx           // 错误处理
├── not-found.tsx       // 404 页面
├── route.ts            // API 路由
└── template.tsx        // 模板组件（每次重新挂载）

// layout.tsx - 共享布局
export default function Layout({ children }) {
  return (
    <div>
      <nav>Navigation</nav>
      {children}
      <footer>Footer</footer>
    </div>
  );
}

// page.tsx - 页面内容
export default function Page() {
  return <h1>Page Content</h1>;
}

// loading.tsx - 加载状态
export default function Loading() {
  return <div>Loading...</div>;
}

// error.tsx - 错误边界
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**路由组（Route Groups）**

使用 `(folder)` 创建路由组，可以组织文件而不影响 URL 路径。

```typescript
// 文件结构
app/
├── (marketing)/
│   ├── about/
│   │   └── page.tsx    // /about（不包含 marketing）
│   └── contact/
│       └── page.tsx    // /contact
└── (shop)/
    ├── products/
    │   └── page.tsx    // /products
    └── cart/
        └── page.tsx    // /cart

// (marketing) 和 (shop) 不会出现在 URL 中
// 但可以有各自的 layout.tsx

// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <div className="marketing-layout">
      <header>Marketing Header</header>
      {children}
    </div>
  );
}

// app/(shop)/layout.tsx
export default function ShopLayout({ children }) {
  return (
    <div className="shop-layout">
      <header>Shop Header</header>
      {children}
    </div>
  );
}
```

---

## 问题 5：文件系统路由如何处理并行路由和拦截路由？

**并行路由（Parallel Routes）**

使用 `@folder` 语法可以在同一个布局中同时渲染多个页面。

```typescript
// 文件结构
app/
├── layout.tsx
├── page.tsx
├── @team/
│   └── page.tsx
└── @analytics/
    └── page.tsx

// app/layout.tsx
export default function Layout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <div>
      <div>{children}</div>
      <div className="sidebar">
        <div>{team}</div>
        <div>{analytics}</div>
      </div>
    </div>
  );
}

// 访问 / 时，会同时渲染：
// - app/page.tsx
// - app/@team/page.tsx
// - app/@analytics/page.tsx
```

**拦截路由（Intercepting Routes）**

使用 `(..)` 语法可以拦截路由，在当前页面显示其他路由的内容。

```typescript
// 文件结构
app/
├── page.tsx
├── photos/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── @modal/
    └── (..)photos/
        └── [id]/
            └── page.tsx

// app/page.tsx
export default function Home() {
  return (
    <div>
      <h1>Photo Gallery</h1>
      <Link href="/photos/1">Photo 1</Link>
      <Link href="/photos/2">Photo 2</Link>
    </div>
  );
}

// app/@modal/(..)photos/[id]/page.tsx
export default function PhotoModal({ params }) {
  // 当从首页点击链接时，显示为模态框
  // 直接访问 /photos/1 时，显示完整页面

  return (
    <div className="modal">
      <img src={`/photos/${params.id}.jpg`} />
    </div>
  );
}

// 拦截规则：
// (.)  - 匹配同级
// (..) - 匹配上一级
// (..)(..) - 匹配上两级
// (...) - 匹配根目录
```

---

## 总结

**核心概念**：

### 1. 文件系统路由原理

- 通过文件和文件夹结构自动生成路由
- 无需手动配置路由规则
- 约定优于配置

### 2. Pages Router vs App Router

- **Pages Router**：每个文件都是路由
- **App Router**：只有 `page.tsx` 是路由
- App Router 支持更多特殊文件（layout、loading、error 等）

### 3. 动态路由

- `[slug]` - 单个动态段
- `[...slug]` - 捕获所有段
- `[[...slug]]` - 可选捕获所有段

### 4. 特殊文件

- `page.tsx` - 路由页面
- `layout.tsx` - 共享布局
- `loading.tsx` - 加载状态
- `error.tsx` - 错误处理
- `not-found.tsx` - 404 页面

### 5. 高级特性

- `(folder)` - 路由组（不影响 URL）
- `@folder` - 并行路由（同时渲染多个页面）
- `(..)folder` - 拦截路由（模态框等场景）

## 延伸阅读

- [Next.js 官方文档 - Routing Fundamentals](https://nextjs.org/docs/app/building-your-application/routing)
- [Next.js 官方文档 - Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js 官方文档 - Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js 官方文档 - Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Next.js 官方文档 - Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
