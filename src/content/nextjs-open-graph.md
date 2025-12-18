---
title: App Router 中如何设置 Open Graph？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  学习在 Next.js App Router 中配置 Open Graph 标签，优化社交媒体分享效果
tags:
  - Next.js
  - Open Graph
  - SEO
  - 社交分享
estimatedTime: 18 分钟
keywords:
  - Open Graph
  - OG 标签
  - 社交分享
  - Facebook
highlight: Open Graph 让你的网页在社交媒体上分享时显示丰富的预览信息
order: 155
---

## 问题 1：什么是 Open Graph？

Open Graph 是 Facebook 创建的协议，用于控制网页在社交媒体上的显示效果。

### 基本概念

```html
<!-- 没有 Open Graph -->
分享链接时只显示： - 网址 - 可能的标题

<!-- 有 Open Graph -->
分享链接时显示： - 标题 - 描述 - 图片 - 网站名称 - 更多信息
```

### Open Graph 标签示例

```html
<meta property="og:title" content="我的文章标题" />
<meta property="og:description" content="这是一篇很棒的文章" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:url" content="https://example.com/article" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="我的网站" />
```

---

## 问题 2：基本 Open Graph 配置

### 静态配置

```typescript
// app/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "我的网站",
    description: "这是一个很棒的网站",
    url: "https://example.com",
    siteName: "我的网站",
    images: [
      {
        url: "https://example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "网站封面",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
};

export default function Page() {
  return <div>首页</div>;
}
```

### 必需字段

```typescript
export const metadata: Metadata = {
  openGraph: {
    // 必需字段
    title: "页面标题", // og:title
    type: "website", // og:type
    url: "https://example.com", // og:url
    images: ["https://example.com/og.jpg"], // og:image

    // 推荐字段
    description: "页面描述", // og:description
    siteName: "网站名称", // og:site_name
    locale: "zh_CN", // og:locale
  },
};
```

---

## 问题 3：不同类型的 Open Graph

### Website（网站）

```typescript
// app/page.tsx
export const metadata: Metadata = {
  openGraph: {
    type: "website",
    title: "我的网站",
    description: "欢迎访问我的网站",
    url: "https://example.com",
    siteName: "我的网站",
    images: ["/og-home.jpg"],
  },
};
```

### Article（文章）

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `https://example.com/blog/${params.slug}`,
      siteName: "我的博客",
      images: [post.coverImage],

      // Article 特有字段
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      expirationTime: post.expiresAt,
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
    },
  };
}
```

### Profile（个人资料）

```typescript
// app/user/[username]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await fetchUser(params.username);

  return {
    openGraph: {
      type: "profile",
      title: user.name,
      description: user.bio,
      url: `https://example.com/user/${params.username}`,
      images: [user.avatar],

      // Profile 特有字段
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      gender: user.gender,
    },
  };
}
```

### Video（视频）

```typescript
// app/video/[id]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const video = await fetchVideo(params.id);

  return {
    openGraph: {
      type: "video.other",
      title: video.title,
      description: video.description,
      url: `https://example.com/video/${params.id}`,
      images: [video.thumbnail],

      // Video 特有字段
      videos: [
        {
          url: video.url,
          secureUrl: video.secureUrl,
          type: "video/mp4",
          width: 1920,
          height: 1080,
        },
      ],
    },
  };
}
```

---

## 问题 4：Open Graph 图片优化

### 图片尺寸要求

```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://example.com/og-image.jpg",
        width: 1200, // 推荐宽度
        height: 630, // 推荐高度（1.91:1 比例）
        alt: "图片描述",
        type: "image/jpeg",
      },
    ],
  },
};

// 常用尺寸：
// - Facebook: 1200x630
// - Twitter: 1200x675
// - LinkedIn: 1200x627
//
// 最小尺寸：600x315
// 最大文件大小：8MB
```

### 多张图片

```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://example.com/og-image-1.jpg",
        width: 1200,
        height: 630,
        alt: "主图",
      },
      {
        url: "https://example.com/og-image-2.jpg",
        width: 1200,
        height: 630,
        alt: "备用图",
      },
    ],
  },
};

// 社交平台会选择第一张图片
// 提供多张图片作为备选
```

### 使用文件基础的 OG 图片

```typescript
// app/opengraph-image.jpg
// 或 app/opengraph-image.png
// 自动作为 og:image

// 动态生成 OG 图片
// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "linear-gradient(to bottom, #4f46e5, #7c3aed)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
        }}
      >
        我的网站
      </div>
    ),
    {
      ...size,
    }
  );
}
```

---

## 问题 5：动态 Open Graph

### 基于路由参数

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `https://example.com/blog/${params.slug}`,
      siteName: "我的博客",
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
  };
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

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <h1 style={{ fontSize: 60, marginBottom: 20 }}>{post.title}</h1>
        <p style={{ fontSize: 30, color: "#666" }}>{post.author.name}</p>
        <p style={{ fontSize: 24, color: "#999" }}>
          {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
```

---

## 问题 6：Open Graph 最佳实践

### 完整配置

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  const url = `https://example.com/blog/${params.slug}`;

  return {
    // 基本 metadata
    title: post.title,
    description: post.excerpt,

    // Open Graph
    openGraph: {
      // 基本信息
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      siteName: "我的博客",

      // 图片
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
          type: "image/jpeg",
        },
      ],

      // 本地化
      locale: "zh_CN",
      alternateLocale: ["en_US", "ja_JP"],

      // 文章特有
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: post.category,
      tags: post.tags,
    },

    // Twitter Card（也会使用 OG 数据）
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      creator: post.author.twitter,
    },
  };
}
```

### 回退机制

```typescript
// lib/metadata.ts
export function createOpenGraph({
  title,
  description,
  image,
  url,
  type = "website",
}: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
}) {
  const siteName = "我的网站";
  const defaultImage = "https://example.com/default-og.jpg";
  const defaultDescription = "欢迎访问我的网站";

  return {
    type,
    title,
    description: description || defaultDescription,
    url: url || "https://example.com",
    siteName,
    images: [
      {
        url: image || defaultImage,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: "zh_CN",
  };
}

// 使用
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    openGraph: createOpenGraph({
      title: post.title,
      description: post.excerpt,
      image: post.coverImage,
      url: `https://example.com/blog/${params.slug}`,
      type: "article",
    }),
  };
}
```

---

## 问题 7：测试和调试

### Facebook Sharing Debugger

```bash
# 访问 Facebook 分享调试工具
https://developers.facebook.com/tools/debug/

# 输入你的 URL
https://example.com/blog/my-post

# 查看：
# - 抓取的 OG 标签
# - 图片预览
# - 警告和错误
# - 刷新缓存
```

### Twitter Card Validator

```bash
# 访问 Twitter Card 验证工具
https://cards-dev.twitter.com/validator

# 输入你的 URL
https://example.com/blog/my-post

# 查看：
# - Card 预览
# - 标签信息
# - 错误提示
```

### LinkedIn Post Inspector

```bash
# 访问 LinkedIn 检查工具
https://www.linkedin.com/post-inspector/

# 输入你的 URL 并检查预览
```

### 本地测试

```typescript
// 查看生成的 HTML
// 访问页面并查看源代码（Ctrl+U）
// 搜索 "og:" 查看 Open Graph 标签

// 或使用 curl
curl https://example.com/blog/my-post | grep "og:"

// 输出：
// <meta property="og:title" content="我的文章" />
// <meta property="og:description" content="文章描述" />
// <meta property="og:image" content="https://example.com/image.jpg" />
```

---

## 总结

**核心概念总结**：

### 1. Open Graph 作用

- 控制社交媒体分享预览
- 显示标题、描述、图片
- 提升分享点击率
- 改善品牌形象

### 2. 基本配置

- type：内容类型（website、article 等）
- title：标题
- description：描述
- url：页面 URL
- images：预览图片

### 3. 图片要求

- 推荐尺寸：1200x630
- 最小尺寸：600x315
- 最大文件：8MB
- 比例：1.91:1

### 4. 最佳实践

- 为每个页面配置 OG 标签
- 使用高质量图片
- 提供回退值
- 定期测试分享效果

## 延伸阅读

- [Open Graph Protocol](https://ogp.me/)
- [Next.js Open Graph](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#opengraph)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
