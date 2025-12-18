---
title: generateMetadata 的作用是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 generateMetadata 函数的工作原理，掌握动态生成页面元数据的方法
tags:
  - Next.js
  - Metadata
  - SEO
  - 动态生成
estimatedTime: 20 分钟
keywords:
  - generateMetadata
  - 动态 Metadata
  - SEO
  - Next.js
highlight: generateMetadata 允许基于动态数据生成页面元数据，是实现动态 SEO 的关键
order: 151
---

## 问题 1：generateMetadata 的基本作用

`generateMetadata` 用于根据路由参数或其他动态数据生成页面元数据。

### 静态 vs 动态

```typescript
// ❌ 静态 metadata（无法访问动态数据）
export const metadata = {
  title: "文章详情", // 所有文章都是同一个标题
  description: "查看文章内容",
};

// ✅ 动态 metadata（可以访问路由参数）
export async function generateMetadata({ params }: Props) {
  const post = await fetchPost(params.slug);

  return {
    title: post.title, // 每篇文章有不同的标题
    description: post.excerpt,
  };
}
```

### 基本用法

```typescript
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // 1. 获取路由参数
  const slug = params.slug;

  // 2. 获取数据
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(
    (res) => res.json()
  );

  // 3. 返回 metadata
  return {
    title: post.title,
    description: post.excerpt,
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

---

## 问题 2：访问路由参数和搜索参数

### 路由参数

```typescript
// app/blog/[category]/[slug]/page.tsx
type Props = {
  params: { category: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = params;

  const post = await fetchPost(category, slug);

  return {
    title: `${post.title} - ${category}`,
    description: post.excerpt,
  };
}

// URL: /blog/tech/nextjs-guide
// params: { category: 'tech', slug: 'nextjs-guide' }
```

### 搜索参数

```typescript
// app/search/page.tsx
type Props = {
  searchParams: { q?: string; page?: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const query = searchParams.q || "";
  const page = searchParams.page || "1";

  if (!query) {
    return {
      title: "搜索",
      description: "搜索文章",
    };
  }

  return {
    title: `搜索：${query} - 第 ${page} 页`,
    description: `搜索结果：${query}`,
    robots: {
      index: false, // 搜索结果页不索引
    },
  };
}

// URL: /search?q=nextjs&page=2
// searchParams: { q: 'nextjs', page: '2' }
```

---

## 问题 3：继承和扩展父级 Metadata

### 使用 parent 参数

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
    type: "website",
  },
};

// app/blog/[slug]/page.tsx
import { ResolvingMetadata } from "next";

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  // 获取父级的 openGraph
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: post.title,
    openGraph: {
      // 继承父级的 siteName 和 locale
      images: [post.coverImage, ...previousImages], // 扩展父级的 images
    },
  };
}
```

### 覆盖父级配置

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    title: {
      absolute: post.title, // 不使用父级的 template
    },
    robots: {
      index: post.published, // 根据发布状态决定是否索引
      follow: true,
    },
  };
}
```

---

## 问题 4：数据获取和缓存

### 自动请求去重

```typescript
// app/blog/[slug]/page.tsx

// generateMetadata 中获取数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug); // 第一次请求

  return {
    title: post.title,
  };
}

// Page 组件中获取数据
export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug); // 使用缓存，不会重复请求

  return <article>{post.content}</article>;
}

// Next.js 自动去重相同的请求
// 两次 fetchPost 只会发送一次网络请求
```

### 使用 fetch 缓存

```typescript
// 默认缓存
async function fetchPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  // 默认 cache: 'force-cache'
  return res.json();
}

// 不缓存
async function fetchPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    cache: "no-store",
  });
  return res.json();
}

// 定时重新验证
async function fetchPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 3600 }, // 1 小时后重新验证
  });
  return res.json();
}
```

### 使用 React cache

```typescript
// lib/data.ts
import { cache } from "react";

export const fetchPost = cache(async (slug: string) => {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json();
});

// app/blog/[slug]/page.tsx
import { fetchPost } from "@/lib/data";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug); // 缓存

  return {
    title: post.title,
  };
}

export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug); // 使用缓存的结果

  return <article>{post.content}</article>;
}
```

---

## 问题 5：错误处理

### 处理数据获取失败

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await fetchPost(params.slug);

    return {
      title: post.title,
      description: post.excerpt,
    };
  } catch (error) {
    // 返回默认 metadata
    return {
      title: "文章未找到",
      description: "该文章不存在或已被删除",
      robots: {
        index: false,
      },
    };
  }
}

export default async function Page({ params }: Props) {
  const post = await fetchPost(params.slug);

  if (!post) {
    notFound(); // 显示 404 页面
  }

  return <article>{post.content}</article>;
}
```

### 处理缺失字段

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  return {
    title: post.title || "无标题",
    description: post.excerpt || post.content?.substring(0, 160) || "暂无描述",
    openGraph: {
      images: post.coverImage ? [post.coverImage] : ["/default-og.jpg"],
    },
  };
}
```

---

## 问题 6：高级用法

### 条件性 Metadata

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  // 基础 metadata
  const metadata: Metadata = {
    title: post.title,
    description: post.excerpt,
  };

  // 如果是付费文章，添加 noindex
  if (post.isPremium) {
    metadata.robots = {
      index: false,
      follow: true,
    };
  }

  // 如果有视频，添加视频 metadata
  if (post.video) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "video.other",
      videos: [
        {
          url: post.video.url,
          width: post.video.width,
          height: post.video.height,
        },
      ],
    };
  }

  return metadata;
}
```

### 多语言支持

```typescript
// app/[lang]/blog/[slug]/page.tsx
type Props = {
  params: { lang: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = params;
  const post = await fetchPost(slug, lang);

  // 获取其他语言版本
  const alternateLanguages = await fetchAlternateLanguages(slug);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://example.com/${lang}/blog/${slug}`,
      languages: alternateLanguages.reduce((acc, alt) => {
        acc[alt.lang] = `https://example.com/${alt.lang}/blog/${slug}`;
        return acc;
      }, {} as Record<string, string>),
    },
    openGraph: {
      locale: lang === "zh" ? "zh_CN" : "en_US",
    },
  };
}
```

### 基于用户的 Metadata

```typescript
// app/dashboard/page.tsx
import { auth } from "@/auth";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();

  if (!session) {
    return {
      title: "登录 - Dashboard",
      robots: {
        index: false,
      },
    };
  }

  return {
    title: `${session.user.name} 的 Dashboard`,
    description: `欢迎回来，${session.user.name}`,
    robots: {
      index: false, // 私人页面不索引
    },
  };
}
```

---

## 问题 7：性能优化

### 并行数据获取

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 并行获取多个数据
  const [post, author, relatedPosts] = await Promise.all([
    fetchPost(params.slug),
    fetchAuthor(params.slug),
    fetchRelatedPosts(params.slug),
  ]);

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: author.name, url: author.url }],
    openGraph: {
      images: [post.coverImage],
    },
  };
}
```

### 最小化数据获取

```typescript
// ❌ 获取完整数据
async function fetchPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  return res.json(); // 返回所有字段
}

// ✅ 只获取需要的字段
async function fetchPostMetadata(slug: string) {
  const res = await fetch(
    `https://api.example.com/posts/${slug}?fields=title,excerpt,coverImage,author`
  );
  return res.json(); // 只返回 metadata 需要的字段
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPostMetadata(params.slug); // 更快

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

### 使用边缘函数

```typescript
// app/blog/[slug]/page.tsx
export const runtime = "edge"; // 在边缘运行

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 从最近的边缘节点获取数据
  const post = await fetchPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

---

## 总结

**核心概念总结**：

### 1. generateMetadata 的作用

- 根据动态数据生成 metadata
- 访问路由参数和搜索参数
- 继承和扩展父级 metadata
- 实现动态 SEO

### 2. 数据获取

- 自动请求去重
- 使用 fetch 缓存
- 使用 React cache
- 与 Page 组件共享数据

### 3. 高级特性

- 错误处理
- 条件性 metadata
- 多语言支持
- 基于用户的 metadata

### 4. 性能优化

- 并行数据获取
- 最小化数据获取
- 使用边缘函数
- 合理使用缓存

## 延伸阅读

- [generateMetadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Metadata Object](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [React cache](https://react.dev/reference/react/cache)
- [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
