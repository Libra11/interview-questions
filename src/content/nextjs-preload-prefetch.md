---
title: 什么是 preload、prefetch，它们在 Next.js 中如何运作？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 preload 和 prefetch 的区别，掌握 Next.js 如何利用这些技术优化资源加载和页面导航性能。
tags:
  - Next.js
  - 性能优化
  - preload
  - prefetch
estimatedTime: 22 分钟
keywords:
  - preload
  - prefetch
  - 资源预加载
  - 链接预取
highlight: 理解 preload 和 prefetch 的本质区别，掌握 Next.js 自动优化导航性能的机制
order: 715
---

## 问题 1：preload 和 prefetch 的基本概念是什么？

**preload - 预加载当前页面需要的资源**

`preload` 告诉浏览器当前页面**一定会用到**的资源，应该尽快加载。

```html
<!-- HTML 中的 preload -->
<head>
  <!-- 预加载字体文件 -->
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- 预加载关键 CSS -->
  <link rel="preload" href="/styles/critical.css" as="style" />

  <!-- 预加载关键图片 -->
  <link rel="preload" href="/hero-image.jpg" as="image" />

  <!-- 预加载 JavaScript -->
  <link rel="preload" href="/app.js" as="script" />
</head>

<!-- 
  特点：
  - 高优先级加载
  - 用于当前页面必需的资源
  - 不会执行或应用，只是下载
  - 必须在后续使用，否则浏览器会警告
-->
```

**prefetch - 预取未来可能需要的资源**

`prefetch` 告诉浏览器**未来可能会用到**的资源，可以在空闲时加载。

```html
<!-- HTML 中的 prefetch -->
<head>
  <!-- 预取下一页可能需要的资源 -->
  <link rel="prefetch" href="/about.html" />
  <link rel="prefetch" href="/about.js" />
  <link rel="prefetch" href="/about.css" />
</head>

<!-- 
  特点：
  - 低优先级加载
  - 用于未来可能访问的页面
  - 在浏览器空闲时加载
  - 不会阻塞当前页面
-->
```

**核心区别**：

```typescript
// preload：当前页面马上要用
<link rel="preload" href="/critical.css" as="style" />
// 浏览器：这个资源很重要，立即下载！

// prefetch：未来可能会用
<link rel="prefetch" href="/next-page.js" />
// 浏览器：这个资源可能有用，有空再下载
```

---

## 问题 2：Next.js 如何自动使用 preload？

**自动 preload 关键资源**

Next.js 会自动为关键资源添加 preload 标签。

```typescript
// app/page.tsx
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      <Image
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority // 标记为优先加载
      />
    </div>
  );
}

// Next.js 自动生成的 HTML：
<head>
  <!-- 自动添加 preload -->
  <link rel="preload" as="image" href="/_next/image?url=%2Fhero.jpg&w=1200&q=75" />
</head>

<body>
  <img src="/_next/image?url=%2Fhero.jpg&w=1200&q=75" alt="Hero" />
</body>
```

**字体自动 preload**

使用 `next/font` 时，Next.js 自动 preload 字体文件。

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}

// Next.js 自动生成：
<head>
  <!-- 自动 preload 字体文件 -->
  <link
    rel="preload"
    href="/_next/static/media/inter-latin.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />

  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/_next/static/media/inter-latin.woff2') format('woff2');
    }
  </style>
</head>
```

**手动添加 preload**

可以通过 `Metadata` API 手动添加 preload。

```typescript
// app/page.tsx
export const metadata = {
  // 其他 metadata...
};

export default function Page() {
  return (
    <>
      {/* 手动添加 preload */}
      <link
        rel="preload"
        href="/critical-data.json"
        as="fetch"
        crossOrigin="anonymous"
      />

      <div>Page Content</div>
    </>
  );
}
```

---

## 问题 3：Next.js 的 Link 组件如何使用 prefetch？

**自动 prefetch 链接页面**

Next.js 的 `Link` 组件会自动 prefetch 链接的页面。

```typescript
// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* 默认会 prefetch */}
      <Link href="/about">About</Link>

      {/* 禁用 prefetch */}
      <Link href="/contact" prefetch={false}>
        Contact
      </Link>
    </div>
  );
}

// 当 Link 进入视口时，Next.js 会：
// 1. 下载 /about 页面的 JavaScript
// 2. 下载 /about 页面的数据（如果是 SSG）
// 3. 缓存到客户端

// 用户点击链接时：
// - 几乎瞬间完成导航（因为已经预取）
// - 无需等待网络请求
```

**prefetch 的工作机制**

```typescript
// 1. Link 组件进入视口
<Link href="/blog">Blog</Link>;

// 2. Next.js 自动发起 prefetch 请求
GET / _next / data / build - id / blog.json; // 预取数据
GET / _next / static / chunks / pages / blog.js; // 预取 JavaScript

// 3. 响应被缓存到客户端

// 4. 用户点击链接
// - 从缓存读取数据和代码
// - 立即渲染页面
// - 无需网络请求
```

**不同渲染模式的 prefetch 行为**

```typescript
// 静态生成（SSG）
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}

// prefetch 时：
// - 下载页面的 JavaScript
// - 下载预渲染的数据（JSON）
// - 完全缓存，导航极快

// 服务端渲染（SSR）
// app/dashboard/page.tsx
export default async function Dashboard() {
  const data = await fetch("https://api.example.com/data", {
    cache: "no-cache",
  });
  return <div>{data.content}</div>;
}

// prefetch 时：
// - 只下载页面的 JavaScript
// - 不预取数据（因为数据是动态的）
// - 导航时仍需请求最新数据

// 客户端组件
// app/interactive/page.tsx
("use client");

export default function InteractivePage() {
  return <div>Interactive Content</div>;
}

// prefetch 时：
// - 下载页面的 JavaScript
// - 下载客户端组件的代码
```

---

## 问题 4：如何控制 prefetch 的行为？

**prefetch 属性**

`Link` 组件的 `prefetch` 属性可以控制预取行为。

```typescript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 默认：自动 prefetch（生产环境） */}
      <Link href="/about">About</Link>

      {/* 显式启用 prefetch */}
      <Link href="/blog" prefetch={true}>
        Blog
      </Link>

      {/* 禁用 prefetch */}
      <Link href="/contact" prefetch={false}>
        Contact
      </Link>

      {/* 条件 prefetch */}
      <Link href="/premium" prefetch={user.isPremium}>
        Premium Content
      </Link>
    </nav>
  );
}

// 何时禁用 prefetch：
// 1. 页面很大，不想预加载
// 2. 用户不太可能访问的页面
// 3. 需要认证的页面
// 4. 动态内容频繁变化的页面
```

**使用 router.prefetch 手动预取**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // 手动预取页面
    router.prefetch("/dashboard");
    router.prefetch("/settings");
  }, [router]);

  return (
    <div>
      <button onClick={() => router.push("/dashboard")}>Go to Dashboard</button>
    </div>
  );
}

// 使用场景：
// - 根据用户行为预测导航
// - 在特定条件下预取
// - 预取多个相关页面
```

**预取策略示例**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SmartPrefetch() {
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState(null);

  // 鼠标悬停时预取
  const handleMouseEnter = (href: string) => {
    setHoveredLink(href);
    router.prefetch(href);
  };

  // 用户空闲时预取常用页面
  useEffect(() => {
    const idleCallback = requestIdleCallback(() => {
      // 预取常用页面
      router.prefetch("/popular-page-1");
      router.prefetch("/popular-page-2");
    });

    return () => cancelIdleCallback(idleCallback);
  }, [router]);

  return (
    <nav>
      <a href="/about" onMouseEnter={() => handleMouseEnter("/about")}>
        About
      </a>
    </nav>
  );
}
```

---

## 问题 5：preload 和 prefetch 的最佳实践是什么？

**preload 最佳实践**

```typescript
// ✅ 好：preload 关键资源
// app/page.tsx
import Image from 'next/image';

export default function Home() {
  return (
    <>
      {/* 首屏大图使用 priority */}
      <Image
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority // 自动 preload
      />

      {/* 其他图片懒加载 */}
      <Image
        src="/feature.jpg"
        alt="Feature"
        width={800}
        height={400}
        // 不使用 priority，默认懒加载
      />
    </>
  );
}

// ❌ 不好：preload 太多资源
<head>
  <link rel="preload" href="/image1.jpg" as="image" />
  <link rel="preload" href="/image2.jpg" as="image" />
  <link rel="preload" href="/image3.jpg" as="image" />
  <link rel="preload" href="/image4.jpg" as="image" />
  {/* 太多 preload 会降低关键资源的优先级 */}
</head>

// ✅ 好：只 preload 最关键的资源
<head>
  <link rel="preload" href="/hero.jpg" as="image" />
  {/* 只预加载首屏最重要的图片 */}
</head>
```

**prefetch 最佳实践**

```typescript
// ✅ 好：为常用导航启用 prefetch
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 主导航：启用 prefetch */}
      <Link href="/">Home</Link>
      <Link href="/products">Products</Link>
      <Link href="/about">About</Link>

      {/* 次要链接：禁用 prefetch */}
      <Link href="/terms" prefetch={false}>
        Terms
      </Link>
      <Link href="/privacy" prefetch={false}>
        Privacy
      </Link>
    </nav>
  );
}

// ✅ 好：根据用户行为智能 prefetch
("use client");

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProductCard({ product }) {
  const router = useRouter();

  // 用户查看产品卡片时，预取产品详情页
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          router.prefetch(`/products/${product.id}`);
        }
      });
    });

    const element = document.getElementById(`product-${product.id}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [product.id, router]);

  return (
    <div id={`product-${product.id}`}>
      <h3>{product.name}</h3>
      <Link href={`/products/${product.id}`}>View Details</Link>
    </div>
  );
}
```

**避免过度优化**

```typescript
// ❌ 不好：预取所有可能的页面
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // 预取太多页面
    router.prefetch("/page1");
    router.prefetch("/page2");
    router.prefetch("/page3");
    // ... 预取 50 个页面
    router.prefetch("/page50");
  }, [router]);

  // 问题：
  // - 浪费带宽
  // - 可能影响当前页面性能
  // - 用户可能不会访问这些页面
}

// ✅ 好：只预取最可能访问的页面
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // 只预取用户最可能访问的 2-3 个页面
    router.prefetch("/next-step");
    router.prefetch("/popular-page");
  }, [router]);
}
```

---

## 总结

**核心概念**：

### 1. preload vs prefetch

**preload**：

- 当前页面必需的资源
- 高优先级
- 立即加载
- 用于关键资源（字体、首屏图片、关键 CSS）

**prefetch**：

- 未来可能需要的资源
- 低优先级
- 空闲时加载
- 用于下一页的资源

### 2. Next.js 的自动优化

- 自动 preload 关键资源（字体、priority 图片）
- 自动 prefetch Link 组件指向的页面
- 智能缓存预取的资源

### 3. Link prefetch 行为

- **SSG**：预取 JavaScript 和数据
- **SSR**：只预取 JavaScript
- **Client Component**：预取 JavaScript

### 4. 控制 prefetch

- `prefetch={true}` - 启用预取
- `prefetch={false}` - 禁用预取
- `router.prefetch()` - 手动预取

### 5. 最佳实践

- 只 preload 最关键的资源（1-2 个）
- 为主导航启用 prefetch
- 根据用户行为智能预取
- 避免过度优化
- 监控性能指标

## 延伸阅读

- [Next.js 官方文档 - Link prefetch](https://nextjs.org/docs/app/api-reference/components/link#prefetch)
- [Next.js 官方文档 - Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [MDN - Link types: preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)
- [MDN - Link types: prefetch](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/prefetch)
- [Web.dev - Preload critical assets](https://web.dev/preload-critical-assets/)
