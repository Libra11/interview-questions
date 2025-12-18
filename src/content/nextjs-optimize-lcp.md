---
title: 如何优化 LCP？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握优化 LCP（Largest Contentful Paint）的方法，提升页面加载性能和用户体验
tags:
  - Next.js
  - LCP
  - 性能优化
  - Web Vitals
estimatedTime: 22 分钟
keywords:
  - LCP
  - Largest Contentful Paint
  - 性能优化
  - Core Web Vitals
highlight: LCP 衡量页面主要内容的加载速度，是 Core Web Vitals 的关键指标
order: 169
---

## 问题 1：什么是 LCP？

LCP（Largest Contentful Paint）测量视口内最大可见内容元素的渲染时间。

### LCP 的定义

```javascript
// LCP 测量的元素：
// - <img> 元素
// - <svg> 内的 <image> 元素
// - <video> 元素（使用封面图）
// - 通过 url() 加载背景图的元素
// - 包含文本节点的块级元素

// 示例：
<article>
  <h1>文章标题</h1> {/* 可能是 LCP 元素 */}
  <img src="hero.jpg" /> {/* 可能是 LCP 元素 */}
  <p>文章内容...</p>
</article>
```

### LCP 评分标准

```javascript
// 优秀：< 2.5 秒
// 需要改进：2.5 - 4.0 秒
// 较差：> 4.0 秒

// 测量时间点：
// 从用户开始加载页面
// 到最大内容元素渲染完成
```

---

## 问题 2：图片优化

图片通常是 LCP 元素，优化图片是提升 LCP 的关键。

### 使用 next/image

```typescript
// ❌ 原生 img（未优化）
<img src="/hero.jpg" alt="Hero" />;

// ✅ next/image（自动优化）
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // 关键：预加载 LCP 图片
/>;

// priority 的作用：
// 1. 添加 fetchpriority="high"
// 2. 禁用懒加载
// 3. 预加载图片
```

### 优化图片格式和大小

```typescript
// 使用现代格式
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  quality={75} // 默认 75，已经足够
/>;

// Next.js 自动：
// 1. 转换为 WebP/AVIF
// 2. 调整尺寸
// 3. 压缩质量
// 4. 响应式图片

// 手动优化源图片：
// - 使用 ImageOptim、TinyPNG 等工具
// - 裁剪到实际显示尺寸
// - 移除 EXIF 数据
```

### 响应式图片

```typescript
// 为不同屏幕提供不同尺寸
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// sizes 告诉浏览器：
// - 手机（≤768px）：图片占 100% 视口宽度
// - 平板（≤1200px）：图片占 50% 视口宽度
// - 桌面（>1200px）：图片占 33% 视口宽度

// Next.js 会生成对应尺寸的图片
```

---

## 问题 3：字体优化

自定义字体可能延迟文本渲染，影响 LCP。

### 使用 next/font

```typescript
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // 使用系统字体直到自定义字体加载完成
  preload: true, // 预加载字体
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}

// next/font 的优势：
// 1. 自动优化字体加载
// 2. 零布局偏移
// 3. 自托管字体文件
// 4. 自动子集化
```

### 字体显示策略

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  // 字体显示策略
  display: "swap", // 推荐：立即显示文本
  // display: 'optional', // 可选：如果字体未加载，使用系统字体
  // display: 'block', // 阻塞：等待字体加载（不推荐）
});

// swap vs optional：
// - swap：总是使用自定义字体（可能有闪烁）
// - optional：如果加载慢，放弃自定义字体（更快）
```

### 减少字体文件大小

```typescript
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"], // 只加载需要的字符集
  weight: ["400", "700"], // 只加载需要的字重
  variable: "--font-inter", // 使用 CSS 变量
});

// 自定义字体
import localFont from "next/font/local";

const customFont = localFont({
  src: "./fonts/custom.woff2", // 使用 woff2 格式（最小）
  display: "swap",
});
```

---

## 问题 4：服务端渲染优化

### 使用静态生成

```typescript
// ✅ 静态生成（最快）
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetchPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <Image
        src={post.image}
        alt={post.title}
        width={1200}
        height={600}
        priority
      />
      <div>{post.content}</div>
    </article>
  );
}

// 构建时生成 HTML，LCP 最快
```

### 增量静态再生成

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // 1 小时重新生成

export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <Image
        src={post.image}
        alt={post.title}
        width={1200}
        height={600}
        priority
      />
      <div>{post.content}</div>
    </article>
  );
}

// 首次访问：静态 HTML（快）
// 后续访问：缓存的 HTML（更快）
// 过期后：后台重新生成
```

### 流式渲染

```typescript
// app/blog/[slug]/page.tsx
import { Suspense } from "react";

// 快速渲染的部分
async function PostHeader({ slug }: { slug: string }) {
  const post = await fetchPostHeader(slug); // 快速查询

  return (
    <header>
      <h1>{post.title}</h1>
      <Image
        src={post.image}
        alt={post.title}
        width={1200}
        height={600}
        priority
      />
    </header>
  );
}

// 慢速渲染的部分
async function PostContent({ slug }: { slug: string }) {
  const content = await fetchPostContent(slug); // 慢速查询

  return <div>{content}</div>;
}

export default function Page({ params }: Props) {
  return (
    <article>
      {/* 立即渲染 LCP 元素 */}
      <PostHeader slug={params.slug} />

      {/* 延迟渲染其他内容 */}
      <Suspense fallback={<div>加载中...</div>}>
        <PostContent slug={params.slug} />
      </Suspense>
    </article>
  );
}
```

---

## 问题 5：资源加载优化

### 预加载关键资源

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* 预加载 LCP 图片 */}
        <link
          rel="preload"
          as="image"
          href="/hero.jpg"
          imageSrcSet="/hero-640.jpg 640w, /hero-1200.jpg 1200w"
          imageSizes="100vw"
        />

        {/* 预连接到外部域名 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.example.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 延迟非关键资源

```typescript
// app/page.tsx
import dynamic from "next/dynamic";

// 延迟加载非关键组件
const Comments = dynamic(() => import("@/components/Comments"), {
  loading: () => <p>加载评论中...</p>,
  ssr: false, // 不在服务端渲染
});

export default function Page() {
  return (
    <article>
      {/* LCP 元素：立即渲染 */}
      <h1>文章标题</h1>
      <Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
      <div>文章内容...</div>

      {/* 非关键内容：延迟加载 */}
      <Comments />
    </article>
  );
}
```

### 减少阻塞资源

```typescript
// ❌ 阻塞渲染的脚本
<script src="/analytics.js"></script>

// ✅ 异步加载
<script src="/analytics.js" async></script>

// ✅ 延迟加载
<script src="/analytics.js" defer></script>

// Next.js Script 组件
import Script from 'next/script';

<Script
  src="/analytics.js"
  strategy="afterInteractive" // 页面交互后加载
/>
```

---

## 问题 6：CDN 和缓存

### 使用 CDN

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ["cdn.example.com"],
  },
};

// 使用 CDN 图片
<Image
  src="https://cdn.example.com/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>;

// CDN 优势：
// 1. 全球分发
// 2. 低延迟
// 3. 高可用
// 4. 自动优化
```

### 设置缓存头

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

---

## 问题 7：测量和监控

### 使用 Web Vitals

```typescript
// app/layout.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (metric.name === "LCP") {
      console.log("LCP:", metric.value);

      // 发送到分析服务
      fetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
        }),
      });
    }
  });

  return null;
}
```

### Chrome DevTools

```javascript
// 1. 打开 Chrome DevTools
// 2. 切换到 Performance 面板
// 3. 勾选 "Web Vitals"
// 4. 录制页面加载
// 5. 查看 LCP 时间和元素

// 查看 LCP 元素：
// - 在 Performance 面板中找到 LCP 标记
// - 点击查看是哪个元素
// - 分析为什么加载慢
```

### Lighthouse

```bash
# 运行 Lighthouse
npx lighthouse https://example.com --view

# 查看 LCP 分数和建议
# - LCP 时间
# - LCP 元素
# - 优化建议
# - 机会列表
```

### 实时监控

```typescript
// lib/vitals.ts
export function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);

  // 使用 sendBeacon（不阻塞页面）
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body);
  } else {
    fetch("/api/analytics", {
      method: "POST",
      body,
      keepalive: true,
    });
  }
}

// app/layout.tsx
("use client");

import { useReportWebVitals } from "next/web-vitals";
import { sendToAnalytics } from "@/lib/vitals";

export function WebVitals() {
  useReportWebVitals(sendToAnalytics);
  return null;
}
```

---

## 总结

**核心概念总结**：

### 1. LCP 的重要性

- 衡量主要内容加载速度
- Core Web Vitals 关键指标
- 影响 SEO 排名
- 影响用户体验

### 2. 图片优化

- 使用 next/image
- 添加 priority 属性
- 优化格式和大小
- 响应式图片

### 3. 字体优化

- 使用 next/font
- display: swap
- 减少字体文件大小
- 字体子集化

### 4. 渲染优化

- 静态生成
- 增量静态再生成
- 流式渲染
- Suspense

### 5. 资源优化

- 预加载关键资源
- 延迟非关键资源
- 使用 CDN
- 设置缓存

### 6. 监控

- Web Vitals API
- Chrome DevTools
- Lighthouse
- 实时监控

## 延伸阅读

- [Largest Contentful Paint (LCP)](https://web.dev/lcp/)
- [Optimize LCP](https://web.dev/optimize-lcp/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [next/font](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Web Vitals](https://web.dev/vitals/)
