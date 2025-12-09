---
title: SSR 为什么对 SEO 友好？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解 SSR 对 SEO 友好的原因，掌握搜索引擎爬虫的工作方式。
tags:
  - React
  - SSR
  - SEO
  - 搜索引擎
estimatedTime: 10 分钟
keywords:
  - SSR SEO
  - search engine
  - crawler
  - indexing
highlight: SSR 返回完整 HTML，搜索引擎爬虫无需执行 JS 即可获取页面内容，提高索引效率。
order: 276
---

## 问题 1：搜索引擎爬虫如何工作？

### 传统爬虫

```
1. 请求 URL
2. 获取 HTML
3. 解析 HTML 内容
4. 提取文本、链接、图片
5. 建立索引
```

### 对 JavaScript 的支持

```jsx
// 大多数爬虫不执行 JavaScript
// 或执行 JavaScript 的能力有限

// Google 爬虫可以执行 JS，但：
// 1. 有延迟（可能几天后才渲染）
// 2. 有资源限制
// 3. 不保证完全渲染
```

---

## 问题 2：CSR 的 SEO 问题

### 返回的 HTML

```html
<!-- CSR 应用返回的 HTML -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>
```

### 爬虫看到的内容

```
标题：My App
正文：（空）
链接：（无）
```

### 问题

```jsx
// 1. 内容不可见
// 爬虫看不到实际内容

// 2. 索引延迟
// 即使 Google 能渲染 JS，也需要额外时间

// 3. 动态内容问题
// 需要用户交互才显示的内容无法被索引
```

---

## 问题 3：SSR 如何解决？

### 返回的 HTML

```html
<!-- SSR 应用返回的 HTML -->
<!DOCTYPE html>
<html>
  <head>
    <title>产品详情 - iPhone 15</title>
    <meta name="description" content="iPhone 15 详细介绍..." />
  </head>
  <body>
    <div id="root">
      <header>
        <nav>
          <a href="/">首页</a>
          <a href="/products">产品</a>
        </nav>
      </header>
      <main>
        <h1>iPhone 15</h1>
        <p>最新款 iPhone，搭载 A17 芯片...</p>
        <img src="iphone15.jpg" alt="iPhone 15" />
      </main>
    </div>
    <script src="bundle.js"></script>
  </body>
</html>
```

### 爬虫看到的内容

```
标题：产品详情 - iPhone 15
描述：iPhone 15 详细介绍...
正文：iPhone 15, 最新款 iPhone，搭载 A17 芯片...
图片：iphone15.jpg
链接：/, /products
```

---

## 问题 4：动态 Meta 标签

### 每个页面独立的 meta

```jsx
// Next.js 示例
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);

  return {
    title: `${product.name} - 我的商店`,
    description: product.description,
    keywords: product.tags.join(", "),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}
```

### 结构化数据

```jsx
// 添加 JSON-LD 结构化数据
function ProductPage({ product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "CNY",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductContent product={product} />
    </>
  );
}
```

---

## 问题 5：SSR SEO 最佳实践

### 1. 语义化 HTML

```jsx
// 使用正确的标签
<header>...</header>
<nav>...</nav>
<main>
  <article>
    <h1>标题</h1>
    <p>内容</p>
  </article>
</main>
<footer>...</footer>
```

### 2. 完整的 meta 信息

```jsx
<head>
  <title>页面标题</title>
  <meta name="description" content="页面描述" />
  <meta name="keywords" content="关键词" />
  <link rel="canonical" href="规范URL" />
</head>
```

### 3. 图片优化

```jsx
// 提供 alt 文本
<img src="product.jpg" alt="产品描述" />;

// 使用 Next.js Image 组件
import Image from "next/image";
<Image src="product.jpg" alt="产品描述" width={800} height={600} />;
```

## 总结

| 方面      | CSR         | SSR      |
| --------- | ----------- | -------- |
| HTML 内容 | 空          | 完整     |
| 爬虫可见  | 需要执行 JS | 直接可见 |
| 索引速度  | 慢/不确定   | 快       |
| Meta 标签 | 静态        | 动态     |

## 延伸阅读

- [Google SEO 指南](https://developers.google.com/search/docs)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
