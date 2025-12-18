---
title: link prefetch 是如何自动工作的？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js Link 组件的自动预取机制，掌握如何优化页面导航性能。
tags:
  - Next.js
  - Link
  - prefetch
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - Link prefetch
  - 自动预取
  - 导航优化
  - 性能提升
highlight: 理解 Next.js Link 组件如何自动预取页面，实现近乎瞬时的导航体验
order: 723
---

## 问题 1：Link prefetch 的基本原理是什么？

**自动预取机制**

Next.js 的 `Link` 组件会自动预取链接的页面，当链接进入视口时开始预取。

```typescript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 默认会自动 prefetch */}
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
      <Link href="/contact">Contact</Link>
    </nav>
  );
}

// 工作流程：
// 1. Link 组件渲染到页面
// 2. 当 Link 进入视口（用户可见）
// 3. Next.js 自动开始预取页面
// 4. 预取的内容缓存到客户端
// 5. 用户点击时，几乎瞬间完成导航
```

**预取的内容**

```typescript
// 预取时下载的内容取决于渲染模式：

// 1. 静态生成（SSG）
<Link href="/blog/post-1">Post 1</Link>
// 预取：
// - 页面的 JavaScript 代码
// - 预渲染的数据（JSON）
// - 完全缓存，导航极快

// 2. 服务端渲染（SSR）
<Link href="/dashboard">Dashboard</Link>
// 预取：
// - 页面的 JavaScript 代码
// - 不预取数据（数据是动态的）
// - 点击时仍需请求最新数据

// 3. 客户端组件
<Link href="/interactive">Interactive</Link>
// 预取：
// - 页面的 JavaScript 代码
// - 客户端组件的代码
```

---

## 问题 2：如何控制 prefetch 行为？

**prefetch 属性**

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
      <Link href="/admin" prefetch={false}>
        Admin
      </Link>

      {/* 条件 prefetch */}
      <Link href="/premium" prefetch={user.isPremium}>
        Premium Content
      </Link>
    </nav>
  );
}
```

**何时禁用 prefetch**

```typescript
// 1. 需要认证的页面
<Link href="/dashboard" prefetch={false}>
  Dashboard
</Link>

// 2. 大型页面
<Link href="/heavy-page" prefetch={false}>
  Heavy Page
</Link>

// 3. 不常访问的页面
<Link href="/terms" prefetch={false}>
  Terms of Service
</Link>

// 4. 外部链接（自动禁用）
<Link href="https://example.com">
  External Link
</Link>
```

---

## 问题 3：prefetch 在不同环境下的行为？

**开发环境 vs 生产环境**

```typescript
// 开发环境（npm run dev）
<Link href="/about">About</Link>
// ❌ 不会自动 prefetch
// 原因：避免开发时的额外请求

// 生产环境（npm run build && npm start）
<Link href="/about">About</Link>
// ✅ 自动 prefetch
// 当 Link 进入视口时开始预取
```

**视口检测**

```typescript
// Link 组件使用 Intersection Observer API
// 检测链接是否进入视口

export default function BlogList({ posts }) {
  return (
    <div>
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      ))}
    </div>
  );
}

// 工作流程：
// 1. 页面加载，显示前 5 个链接
// 2. 前 5 个链接自动开始 prefetch
// 3. 用户向下滚动
// 4. 更多链接进入视口
// 5. 新的链接开始 prefetch
```

---

## 问题 4：如何手动触发 prefetch？

**使用 router.prefetch()**

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
```

**智能预取策略**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SmartPrefetch() {
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // 鼠标悬停时预取
  const handleMouseEnter = (href: string) => {
    setHoveredLink(href);
    router.prefetch(href);
  };

  return (
    <nav>
      <a href="/about" onMouseEnter={() => handleMouseEnter("/about")}>
        About
      </a>

      <a href="/blog" onMouseEnter={() => handleMouseEnter("/blog")}>
        Blog
      </a>
    </nav>
  );
}

// 优势：
// - 用户悬停时才预取
// - 更精确的预测
// - 节省带宽
```

**空闲时预取**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function IdlePrefetch() {
  const router = useRouter();

  useEffect(() => {
    // 浏览器空闲时预取
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        router.prefetch("/popular-page-1");
        router.prefetch("/popular-page-2");
        router.prefetch("/popular-page-3");
      });
    }
  }, [router]);

  return <div>Content</div>;
}
```

---

## 问题 5：prefetch 的性能影响和优化？

**性能监控**

```typescript
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PrefetchMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    // 监控预取性能
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes("_next/data")) {
          console.log("Prefetch:", {
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      }
    });

    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
```

**优化策略**

```typescript
// 1. 只预取重要页面
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

// 2. 根据网络状况调整
("use client");

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdaptivePrefetch() {
  const [shouldPrefetch, setShouldPrefetch] = useState(true);

  useEffect(() => {
    // 检测网络状况
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      // 慢速网络：禁用 prefetch
      if (connection.effectiveType === "2g" || connection.saveData) {
        setShouldPrefetch(false);
      }
    }
  }, []);

  return (
    <Link href="/blog" prefetch={shouldPrefetch}>
      Blog
    </Link>
  );
}

// 3. 分优先级预取
("use client");

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PriorityPrefetch() {
  const router = useRouter();

  useEffect(() => {
    // 高优先级：立即预取
    router.prefetch("/dashboard");

    // 中优先级：延迟预取
    setTimeout(() => {
      router.prefetch("/settings");
    }, 2000);

    // 低优先级：空闲时预取
    requestIdleCallback(() => {
      router.prefetch("/help");
    });
  }, [router]);

  return <div>Content</div>;
}
```

---

## 总结

**核心概念**：

### 1. 自动 prefetch

- Link 组件默认启用（生产环境）
- 进入视口时自动预取
- 预取内容缓存到客户端

### 2. 预取内容

**SSG**：

- JavaScript 代码
- 预渲染数据
- 完全缓存

**SSR**：

- JavaScript 代码
- 不预取数据

### 3. 控制 prefetch

```typescript
<Link href="/page" prefetch={true}>  // 启用
<Link href="/page" prefetch={false}> // 禁用
<Link href="/page">                  // 默认（生产环境启用）
```

### 4. 手动预取

```typescript
router.prefetch("/page");
```

### 5. 优化策略

- 只预取重要页面
- 根据网络状况调整
- 分优先级预取
- 鼠标悬停时预取
- 空闲时预取

### 6. 最佳实践

- 主导航启用 prefetch
- 次要链接禁用 prefetch
- 监控预取性能
- 考虑用户网络状况
- 避免过度预取

## 延伸阅读

- [Next.js 官方文档 - Link prefetch](https://nextjs.org/docs/app/api-reference/components/link#prefetch)
- [Next.js 官方文档 - useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [MDN - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
