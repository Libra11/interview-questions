---
title: metadata API 如何使用？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  掌握 Next.js App Router 中 Metadata API 的使用方法，优化 SEO 和社交媒体分享
tags:
  - Next.js
  - Metadata
  - SEO
  - App Router
estimatedTime: 18 分钟
keywords:
  - Metadata API
  - SEO
  - meta 标签
  - Next.js
highlight: Metadata API 提供类型安全的方式来定义页面元数据，支持静态和动态生成
order: 147
---

## 问题 1：什么是 Metadata API？

Metadata API 是 Next.js App Router 提供的声明式元数据管理方案。

### 基本概念

```typescript
// app/page.tsx
import { Metadata } from "next";

// 导出 metadata 对象
export const metadata: Metadata = {
  title: "首页",
  description: "这是网站首页",
};

export default function Page() {
  return <div>首页内容</div>;
}

// 生成的 HTML
<head>
  <title>首页</title>
  <meta name="description" content="这是网站首页" />
</head>;
```

### 对比 Pages Router

```javascript
// ❌ Pages Router（旧方式）
import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>首页</title>
        <meta name="description" content="这是网站首页" />
      </Head>
      <div>首页内容</div>
    </>
  );
}

// ✅ App Router（新方式）
export const metadata = {
  title: '首页',
  description: '这是网站首页',
};

export default function Page() {
  return <div>首页内容</div>;
}

// 优势：
// 1. 类型安全
// 2. 服务端生成
// 3. 更好的性能
// 4. 自动去重
```

---

## 问题 2：基本 Metadata 配置

### 常用字段

```typescript
// app/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  // 标题
  title: "我的网站",

  // 描述
  description: "这是一个很棒的网站",

  // 关键词
  keywords: ["Next.js", "React", "TypeScript"],

  // 作者
  authors: [{ name: "John Doe", url: "https://example.com" }],

  // 创建者
  creator: "John Doe",

  // 发布者
  publisher: "Example Inc",

  // 版权
  copyright: "© 2025 Example Inc",

  // 机器人
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // 图标
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  // 清单文件
  manifest: "/manifest.json",
};
```

### 标题模板

```typescript
// app/layout.tsx（根布局）
export const metadata: Metadata = {
  title: {
    default: "我的网站",
    template: "%s | 我的网站", // %s 会被替换为页面标题
  },
  description: "默认描述",
};

// app/about/page.tsx
export const metadata: Metadata = {
  title: "关于我们", // 实际标题：关于我们 | 我的网站
};

// app/blog/page.tsx
export const metadata: Metadata = {
  title: "博客", // 实际标题：博客 | 我的网站
};

// 如果不想使用模板
export const metadata: Metadata = {
  title: {
    absolute: "完整标题", // 不使用模板
  },
};
```

---

## 问题 3：Open Graph 和 Twitter Card

### Open Graph

```typescript
// app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '我的文章',
  description: '这是一篇很棒的文章',

  // Open Graph
  openGraph: {
    type: 'article',
    title: '我的文章',
    description: '这是一篇很棒的文章',
    url: 'https://example.com/article',
    siteName: '我的网站',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '文章封面',
      },
    ],
    locale: 'zh_CN',
    publishedTime: '2025-12-05T00:00:00.000Z',
    authors: ['John Doe'],
  },
};

// 生成的 HTML
<meta property="og:type" content="article" />
<meta property="og:title" content="我的文章" />
<meta property="og:description" content="这是一篇很棒的文章" />
<meta property="og:url" content="https://example.com/article" />
<meta property="og:site_name" content="我的网站" />
<meta property="og:image" content="https://example.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="文章封面" />
<meta property="og:locale" content="zh_CN" />
<meta property="article:published_time" content="2025-12-05T00:00:00.000Z" />
<meta property="article:author" content="John Doe" />
```

### Twitter Card

```typescript
// app/page.tsx
export const metadata: Metadata = {
  title: '我的文章',
  description: '这是一篇很棒的文章',

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@mywebsite',
    creator: '@johndoe',
    title: '我的文章',
    description: '这是一篇很棒的文章',
    images: ['https://example.com/twitter-image.jpg'],
  },
};

// 生成的 HTML
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@mywebsite" />
<meta name="twitter:creator" content="@johndoe" />
<meta name="twitter:title" content="我的文章" />
<meta name="twitter:description" content="这是一篇很棒的文章" />
<meta name="twitter:image" content="https://example.com/twitter-image.jpg" />
```

---

## 问题 4：动态 Metadata

### 使用 generateMetadata

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 获取文章数据
  const post = await fetchPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### 访问搜索参数

```typescript
// app/search/page.tsx
import { Metadata } from "next";

type Props = {
  searchParams: { q?: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const query = searchParams.q || "";

  return {
    title: query ? `搜索：${query}` : "搜索",
    description: query ? `搜索结果：${query}` : "搜索页面",
  };
}

export default function SearchPage({ searchParams }: Props) {
  return <div>搜索：{searchParams.q}</div>;
}
```

### 父级 Metadata 继承

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "我的网站",
    template: "%s | 我的网站",
  },
  openGraph: {
    siteName: "我的网站",
    locale: "zh_CN",
  },
};

// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    title: post.title, // 会使用父级的 template
    openGraph: {
      // siteName 和 locale 会从父级继承
      title: post.title,
      images: [post.coverImage],
    },
  };
}

// 最终生成：
// <title>文章标题 | 我的网站</title>
// <meta property="og:site_name" content="我的网站" />
// <meta property="og:locale" content="zh_CN" />
// <meta property="og:title" content="文章标题" />
```

---

## 问题 5：特殊 Metadata

### Viewport

```typescript
// app/layout.tsx
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

// 生成的 HTML
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
```

### Verification

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-verification-code',
    other: {
      'baidu-site-verification': 'baidu-code',
    },
  },
};

// 生成的 HTML
<meta name="google-site-verification" content="google-site-verification-code" />
<meta name="yandex-verification" content="yandex-verification-code" />
<meta name="yahoo-verification" content="yahoo-verification-code" />
<meta name="baidu-site-verification" content="baidu-code" />
```

### Alternate Languages

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://example.com',
    languages: {
      'en-US': 'https://example.com/en',
      'zh-CN': 'https://example.com/zh',
      'ja-JP': 'https://example.com/ja',
    },
  },
};

// 生成的 HTML
<link rel="canonical" href="https://example.com" />
<link rel="alternate" hreflang="en-US" href="https://example.com/en" />
<link rel="alternate" hreflang="zh-CN" href="https://example.com/zh" />
<link rel="alternate" hreflang="ja-JP" href="https://example.com/ja" />
```

---

## 问题 6：文件基础的 Metadata

### 图标文件

```bash
# 自动识别的图标文件
app/
  favicon.ico          # 自动作为 favicon
  icon.png            # 自动作为 icon
  icon.svg            # 自动作为 icon
  apple-icon.png      # 自动作为 apple-touch-icon
  opengraph-image.jpg # 自动作为 og:image
  twitter-image.jpg   # 自动作为 twitter:image
```

### 动态图标

```typescript
// app/icon.tsx
import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        A
      </div>
    ),
    {
      ...size,
    }
  );
}
```

### 动态 OG 图片

```typescript
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>{post.title}</h1>
        <p>{post.author}</p>
      </div>
    ),
    {
      ...size,
    }
  );
}
```

---

## 问题 7：最佳实践

### 完整的 SEO 配置

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  const url = `https://example.com/blog/${params.slug}`;

  return {
    // 基本信息
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author.name, url: post.author.url }],

    // 规范链接
    alternates: {
      canonical: url,
    },

    // Open Graph
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      siteName: "我的博客",
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "zh_CN",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      creator: post.author.twitter,
    },

    // 机器人
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}
```

### 避免重复

```typescript
// lib/metadata.ts
import { Metadata } from "next";

export function createMetadata({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
}): Metadata {
  const siteName = "我的网站";
  const defaultImage = "https://example.com/default-og.jpg";

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [image || defaultImage],
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image || defaultImage],
    },
  };
}

// 使用
// app/blog/[slug]/page.tsx
import { createMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.coverImage,
    url: `https://example.com/blog/${params.slug}`,
  });
}
```

---

## 总结

**核心概念总结**：

### 1. Metadata API 优势

- 类型安全
- 服务端生成
- 自动去重
- 更好的性能

### 2. 基本用法

- 导出 `metadata` 对象（静态）
- 导出 `generateMetadata` 函数（动态）
- 使用文件基础的 metadata

### 3. 常用配置

- 基本信息（title、description）
- Open Graph
- Twitter Card
- 图标和清单

### 4. 最佳实践

- 使用标题模板
- 创建可复用的 metadata 工具
- 配置完整的 SEO 信息
- 使用动态 OG 图片

## 延伸阅读

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search/docs)
