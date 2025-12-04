---
title: not-found.tsx 如何工作？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js App Router 中 not-found.tsx 文件的作用，掌握如何自定义 404 页面和处理未找到的资源。
tags:
  - Next.js
  - 404
  - not-found
  - 错误处理
estimatedTime: 16 分钟
keywords:
  - not-found.tsx
  - 404 页面
  - notFound
  - 页面未找到
highlight: 理解 not-found.tsx 的工作机制，掌握如何创建用户友好的 404 页面
order: 410
---

## 问题 1：not-found.tsx 是什么？

**自定义 404 页面**

`not-found.tsx` 是 Next.js App Router 提供的特殊文件，用于自定义"页面未找到"的 UI。

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go back home</a>
    </div>
  );
}

// 当用户访问不存在的路由时，显示这个页面
// 例如：/this-page-does-not-exist
```

**自动触发**

当访问不存在的路由时，Next.js 自动显示 `not-found.tsx`。

```typescript
// 文件结构
app/
├── not-found.tsx       // 根级 404 页面
├── page.tsx            // /
├── about/
│   └── page.tsx        // /about
└── blog/
    └── page.tsx        // /blog

// 存在的路由：
// / → 显示 app/page.tsx
// /about → 显示 app/about/page.tsx
// /blog → 显示 app/blog/page.tsx

// 不存在的路由：
// /contact → 显示 app/not-found.tsx
// /products → 显示 app/not-found.tsx
// /anything-else → 显示 app/not-found.tsx
```

---

## 问题 2：如何手动触发 not-found 页面？

**使用 notFound() 函数**

可以在 Server Component 中调用 `notFound()` 函数来手动触发 404 页面。

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

  // 如果文章不存在，显示 404 页面
  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 访问 /blog/non-existent-post
// → 调用 notFound()
// → 显示 not-found.tsx
```

**在数据获取中使用**

```typescript
// app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound(); // 触发 404
  }

  return <ProductDetail product={product} />;
}

// 访问 /products/999（不存在的产品）
// → notFound() 被调用
// → 显示 not-found.tsx
```

**条件触发**

```typescript
// app/admin/page.tsx
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // 如果用户不是管理员，显示 404
  // （隐藏管理页面的存在）
  if (!user || !user.isAdmin) {
    notFound();
  }

  return <AdminDashboard />;
}

// 非管理员访问 /admin
// → 显示 404 页面
// → 不暴露管理页面的存在
```

---

## 问题 3：not-found.tsx 的作用范围是什么？

**嵌套 not-found 页面**

可以在不同的路由段定义不同的 `not-found.tsx`。

```typescript
// 文件结构
app/
├── not-found.tsx           // 根级 404
├── page.tsx
├── blog/
│   ├── not-found.tsx       // 博客 404
│   ├── page.tsx
│   └── [slug]/
│       └── page.tsx
└── products/
    ├── not-found.tsx       // 产品 404
    ├── page.tsx
    └── [id]/
        └── page.tsx

// app/not-found.tsx（根级）
export default function RootNotFound() {
  return <div>Page not found</div>;
}

// app/blog/not-found.tsx（博客专用）
export default function BlogNotFound() {
  return (
    <div>
      <h1>Blog post not found</h1>
      <a href="/blog">View all posts</a>
    </div>
  );
}

// app/products/not-found.tsx（产品专用）
export default function ProductNotFound() {
  return (
    <div>
      <h1>Product not found</h1>
      <a href="/products">Browse products</a>
    </div>
  );
}
```

**触发规则**

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound(); // 触发最近的 not-found.tsx
  }

  return <article>{post.content}</article>;
}

// 访问 /blog/non-existent
// → 调用 notFound()
// → 查找最近的 not-found.tsx
// → 找到 app/blog/not-found.tsx
// → 显示博客专用的 404 页面

// 如果 app/blog/not-found.tsx 不存在
// → 继续向上查找
// → 找到 app/not-found.tsx
// → 显示根级 404 页面
```

---

## 问题 4：如何设计好的 404 页面？

**提供有用的信息和导航**

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      {/* 清晰的错误信息 */}
      <div className="error-code">404</div>
      <h1>Page Not Found</h1>
      <p>Sorry, we couldn't find the page you're looking for.</p>

      {/* 有用的导航链接 */}
      <div className="navigation">
        <Link href="/" className="btn-primary">
          Go to Homepage
        </Link>

        <Link href="/blog" className="btn-secondary">
          Read our Blog
        </Link>

        <Link href="/products" className="btn-secondary">
          Browse Products
        </Link>
      </div>

      {/* 搜索功能 */}
      <div className="search">
        <input type="search" placeholder="Search our site..." />
        <button>Search</button>
      </div>

      {/* 联系方式 */}
      <p className="help-text">
        Need help? <Link href="/contact">Contact us</Link>
      </p>
    </div>
  );
}
```

**添加视觉元素**

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="not-found-page">
      {/* 友好的插图或动画 */}
      <div className="illustration">
        <img src="/404-illustration.svg" alt="Page not found" />
      </div>

      <h1>Oops! Page not found</h1>
      <p>The page you're looking for seems to have wandered off.</p>

      <a href="/">Take me home</a>
    </div>
  );
}

// 或使用动画
("use client");

import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="not-found-page"
    >
      <h1>404</h1>
      <p>Page not found</p>
    </motion.div>
  );
}
```

**针对不同场景的 404 页面**

```typescript
// app/blog/not-found.tsx（博客 404）
export default function BlogNotFound() {
  return (
    <div className="blog-not-found">
      <h1>Blog Post Not Found</h1>
      <p>This blog post doesn't exist or has been removed.</p>

      {/* 推荐相关内容 */}
      <div className="recommendations">
        <h2>You might like these posts:</h2>
        <RecentPosts />
      </div>

      <a href="/blog">View all posts</a>
    </div>
  );
}

// app/products/not-found.tsx（产品 404）
export default function ProductNotFound() {
  return (
    <div className="product-not-found">
      <h1>Product Not Found</h1>
      <p>This product is no longer available.</p>

      {/* 推荐类似产品 */}
      <div className="similar-products">
        <h2>Similar products:</h2>
        <ProductGrid />
      </div>

      <a href="/products">Browse all products</a>
    </div>
  );
}

// app/users/[id]/not-found.tsx（用户 404）
export default function UserNotFound() {
  return (
    <div className="user-not-found">
      <h1>User Not Found</h1>
      <p>This user doesn't exist or has deleted their account.</p>

      <a href="/users">Discover other users</a>
    </div>
  );
}
```

---

## 问题 5：not-found.tsx 的最佳实践是什么？

**保持品牌一致性**

```typescript
// app/not-found.tsx
import { Header, Footer } from "@/components/layout";

export default function NotFound() {
  return (
    <>
      {/* 保持网站的整体布局 */}
      <Header />

      <main className="not-found-page">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go home</a>
      </main>

      <Footer />
    </>
  );
}

// 用户仍然感觉在同一个网站上
// 可以使用导航栏返回其他页面
```

**记录 404 错误**

```typescript
// app/not-found.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    // 记录 404 错误
    fetch("/api/log-404", {
      method: "POST",
      body: JSON.stringify({
        path: pathname,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
      }),
    });
  }, [pathname]);

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page "{pathname}" doesn't exist.</p>
      <a href="/">Go home</a>
    </div>
  );
}

// 优势：
// - 发现断链
// - 了解用户行为
// - 改进网站结构
```

**SEO 优化**

```typescript
// app/not-found.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for could not be found.",
  robots: {
    index: false, // 不索引 404 页面
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/">Go home</a>
    </div>
  );
}
```

**避免常见错误**

```typescript
// ❌ 不好：没有提供任何帮助
export default function NotFound() {
  return <div>404</div>;
}

// ❌ 不好：自动重定向（用户困惑）
export default function NotFound() {
  useEffect(() => {
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, []);

  return <div>Redirecting...</div>;
}

// ✅ 好：清晰的信息和选项
export default function NotFound() {
  return (
    <div>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>

      <div className="actions">
        <a href="/">Go to homepage</a>
        <a href="/search">Search our site</a>
        <a href="/contact">Contact support</a>
      </div>
    </div>
  );
}
```

---

## 总结

**核心概念**：

### 1. not-found.tsx 作用

- 自定义 404 页面
- 自动触发（不存在的路由）
- 手动触发（notFound() 函数）

### 2. 触发方式

**自动触发**：

- 访问不存在的路由
- Next.js 自动显示 not-found.tsx

**手动触发**：

```typescript
import { notFound } from "next/navigation";

if (!data) {
  notFound();
}
```

### 3. 嵌套规则

- 可以在不同路由段定义不同的 not-found.tsx
- 使用最近的 not-found.tsx
- 没有则向上查找

### 4. 设计原则

- 清晰的错误信息
- 有用的导航链接
- 搜索功能
- 保持品牌一致性
- 友好的视觉设计

### 5. 最佳实践

- 提供多个导航选项
- 记录 404 错误
- SEO 优化（noindex）
- 不要自动重定向
- 针对不同场景定制

## 延伸阅读

- [Next.js 官方文档 - not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [Next.js 官方文档 - notFound](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [Web.dev - Custom 404 Pages](https://web.dev/custom-404/)
