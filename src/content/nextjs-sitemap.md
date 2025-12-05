---
title: 如何实现 sitemap.xml？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  学习在 Next.js App Router 中生成 sitemap.xml，帮助搜索引擎更好地索引网站内容
tags:
  - Next.js
  - Sitemap
  - SEO
  - 搜索引擎
estimatedTime: 16 分钟
keywords:
  - sitemap.xml
  - 网站地图
  - SEO
  - 搜索引擎优化
highlight: Sitemap 帮助搜索引擎发现和索引网站的所有页面，是 SEO 的重要组成部分
order: 26
---

## 问题 1：什么是 Sitemap？

Sitemap 是一个 XML 文件，列出网站的所有页面，帮助搜索引擎爬取。

### 基本格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2025-12-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Sitemap 的作用

```javascript
// 帮助搜索引擎：
// 1. 发现所有页面（包括深层页面）
// 2. 了解页面更新频率
// 3. 确定页面优先级
// 4. 获取最后修改时间

// 特别适用于：
// - 新网站（外部链接少）
// - 大型网站（页面很多）
// - 动态内容网站（经常更新）
// - 孤立页面（没有内部链接）
```

---

## 问题 2：静态 Sitemap

### 基本实现

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://example.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}

// 访问 /sitemap.xml 即可看到生成的 sitemap
```

### 字段说明

```typescript
type SitemapEntry = {
  // 必需：页面 URL
  url: string;

  // 可选：最后修改时间
  lastModified?: string | Date;

  // 可选：更新频率
  // 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  changeFrequency?: string;

  // 可选：优先级（0.0 - 1.0）
  priority?: number;

  // 可选：多语言版本
  alternates?: {
    languages?: Record<string, string>;
  };
};
```

---

## 问题 3：动态 Sitemap

### 从数据库获取

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 获取所有文章
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  // 生成文章 URL
  const postUrls = posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 静态页面
  const staticUrls = [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  return [...staticUrls, ...postUrls];
}
```

### 多个数据源

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://example.com";

  // 并行获取多个数据源
  const [posts, products, categories] = await Promise.all([
    fetchPosts(),
    fetchProducts(),
    fetchCategories(),
  ]);

  // 文章 URL
  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 产品 URL
  const productUrls = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // 分类 URL
  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 静态页面
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
  ];

  return [...staticUrls, ...postUrls, ...productUrls, ...categoryUrls];
}
```

---

## 问题 4：多语言 Sitemap

### 添加语言版本

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();

  return posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    alternates: {
      languages: {
        "zh-CN": `https://example.com/zh/blog/${post.slug}`,
        "en-US": `https://example.com/en/blog/${post.slug}`,
        "ja-JP": `https://example.com/ja/blog/${post.slug}`,
      },
    },
  }));
}

// 生成的 XML
<url>
  <loc>https://example.com/blog/my-post</loc>
  <xhtml:link
    rel="alternate"
    hreflang="zh-CN"
    href="https://example.com/zh/blog/my-post"
  />
  <xhtml:link
    rel="alternate"
    hreflang="en-US"
    href="https://example.com/en/blog/my-post"
  />
  <xhtml:link
    rel="alternate"
    hreflang="ja-JP"
    href="https://example.com/ja/blog/my-post"
  />
</url>;
```

### 分语言的 Sitemap

```typescript
// app/[lang]/sitemap.ts
type Props = {
  params: { lang: string };
};

export default async function sitemap({
  params,
}: Props): Promise<MetadataRoute.Sitemap> {
  const { lang } = params;
  const posts = await fetchPosts(lang);

  return posts.map((post) => ({
    url: `https://example.com/${lang}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));
}

// 生成：
// /zh/sitemap.xml
// /en/sitemap.xml
// /ja/sitemap.xml
```

---

## 问题 5：Sitemap Index（大型网站）

### 分割 Sitemap

```typescript
// app/sitemap.ts（主 sitemap index）
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com/sitemap/posts.xml",
      lastModified: new Date(),
    },
    {
      url: "https://example.com/sitemap/products.xml",
      lastModified: new Date(),
    },
    {
      url: "https://example.com/sitemap/pages.xml",
      lastModified: new Date(),
    },
  ];
}

// app/sitemap/posts/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();

  return posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));
}

// app/sitemap/products/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();

  return products.map((product) => ({
    url: `https://example.com/products/${product.slug}`,
    lastModified: new Date(product.updatedAt),
  }));
}
```

### 分页 Sitemap

```typescript
// app/sitemap/[page]/sitemap.ts
const POSTS_PER_SITEMAP = 1000;

export async function generateStaticParams() {
  const totalPosts = await getPostCount();
  const totalPages = Math.ceil(totalPosts / POSTS_PER_SITEMAP);

  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

export default async function sitemap({
  params,
}: {
  params: { page: string };
}): Promise<MetadataRoute.Sitemap> {
  const page = parseInt(params.page);
  const skip = (page - 1) * POSTS_PER_SITEMAP;

  const posts = await fetchPosts({
    skip,
    take: POSTS_PER_SITEMAP,
  });

  return posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));
}

// 生成：
// /sitemap/1/sitemap.xml
// /sitemap/2/sitemap.xml
// /sitemap/3/sitemap.xml
```

---

## 问题 6：优化和最佳实践

### 缓存 Sitemap

```typescript
// app/sitemap.ts
export const revalidate = 3600; // 1 小时重新生成

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();

  return posts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
  }));
}
```

### 过滤不需要索引的页面

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchPosts();

  // 只包含已发布的文章
  const publishedPosts = posts.filter((post) => post.status === "published");

  return publishedPosts.map((post) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    priority: post.featured ? 0.9 : 0.7, // 特色文章优先级更高
  }));
}
```

### 合理设置优先级

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    // 首页：最高优先级
    {
      url: "https://example.com",
      priority: 1.0,
      changeFrequency: "daily",
    },

    // 主要栏目：高优先级
    {
      url: "https://example.com/blog",
      priority: 0.9,
      changeFrequency: "daily",
    },

    // 文章页：中等优先级
    {
      url: "https://example.com/blog/post-1",
      priority: 0.7,
      changeFrequency: "weekly",
    },

    // 辅助页面：低优先级
    {
      url: "https://example.com/privacy",
      priority: 0.3,
      changeFrequency: "yearly",
    },
  ];
}
```

---

## 问题 7：提交和验证

### 提交到搜索引擎

```bash
# Google Search Console
1. 访问 https://search.google.com/search-console
2. 选择网站
3. 进入"站点地图"
4. 添加新的站点地图：https://example.com/sitemap.xml
5. 点击"提交"

# Bing Webmaster Tools
1. 访问 https://www.bing.com/webmasters
2. 选择网站
3. 进入"站点地图"
4. 提交站点地图 URL

# 在 robots.txt 中声明
Sitemap: https://example.com/sitemap.xml
```

### 验证 Sitemap

```bash
# 在线验证工具
https://www.xml-sitemaps.com/validate-xml-sitemap.html

# 本地验证
curl https://example.com/sitemap.xml

# 检查格式
xmllint --noout https://example.com/sitemap.xml

# Google 验证
https://search.google.com/test/rich-results
```

### 监控索引状态

```typescript
// 在 Google Search Console 中查看：
// 1. 已提交的 URL 数量
// 2. 已索引的 URL 数量
// 3. 错误和警告
// 4. 索引覆盖率

// 定期检查：
// - Sitemap 是否可访问
// - URL 是否正确
// - 是否有 404 错误
// - 索引状态是否正常
```

---

## 总结

**核心概念总结**：

### 1. Sitemap 的作用

- 帮助搜索引擎发现页面
- 提供页面元信息
- 指示更新频率
- 设置页面优先级

### 2. 实现方式

- 静态 sitemap：固定页面
- 动态 sitemap：从数据库获取
- Sitemap index：大型网站分割
- 多语言 sitemap：国际化支持

### 3. 最佳实践

- 只包含可索引的页面
- 合理设置优先级
- 定期更新 lastModified
- 使用缓存提升性能
- 大型网站分割 sitemap

### 4. 提交和维护

- 提交到 Google Search Console
- 在 robots.txt 中声明
- 定期验证格式
- 监控索引状态

## 延伸阅读

- [Next.js Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Sitemaps Protocol](https://www.sitemaps.org/protocol.html)
- [Google Sitemap Guidelines](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google Search Console](https://search.google.com/search-console)
