---
title: generateStaticParams 的用途是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 中 generateStaticParams 函数的作用，掌握如何在构建时生成静态页面。
tags:
  - Next.js
  - generateStaticParams
  - 静态生成
  - SSG
estimatedTime: 20 分钟
keywords:
  - generateStaticParams
  - 静态生成
  - getStaticPaths
  - 预渲染
highlight: 理解 generateStaticParams 如何替代 getStaticPaths，掌握静态页面生成的最佳实践
order: 722
---

## 问题 1：generateStaticParams 是什么？

**静态参数生成**

`generateStaticParams` 用于在构建时为动态路由生成静态页面。

```typescript
// app/blog/[slug]/page.tsx

// 生成静态参数
export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 页面组件
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}

// 构建时生成：
// /blog/post-1 → 静态 HTML
// /blog/post-2 → 静态 HTML
// /blog/post-3 → 静态 HTML
```

**工作原理**

```typescript
// 构建过程：
// 1. Next.js 调用 generateStaticParams()
// 2. 获取所有可能的参数组合
// 3. 为每个参数组合生成静态页面
// 4. 保存为 HTML 文件

// 运行时：
// 用户访问 /blog/post-1
// → 直接返回预生成的 HTML
// → 极快的加载速度
```

---

## 问题 2：generateStaticParams 与 getStaticPaths 有什么区别？

**Pages Router: getStaticPaths**

```typescript
// pages/blog/[slug].tsx

export async function getStaticPaths() {
  const posts = await fetchAllPosts();

  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
  };
}

export default function BlogPost({ post }) {
  return <article>{post.content}</article>;
}
```

**App Router: generateStaticParams**

```typescript
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}

// 更简洁：
// - 不需要 getStaticProps
// - 直接在组件中获取数据
// - 不需要 fallback 配置
```

**主要区别**

```typescript
// getStaticPaths（Pages Router）
// 1. 返回 paths 和 fallback
// 2. 需要配合 getStaticProps
// 3. 数据获取分离

// generateStaticParams（App Router）
// 1. 只返回参数数组
// 2. 数据获取在组件中
// 3. 更简洁的 API
```

---

## 问题 3：如何处理多个动态段？

**嵌套动态路由**

```typescript
// app/categories/[category]/products/[id]/page.tsx

export async function generateStaticParams() {
  // 获取所有分类
  const categories = await fetchCategories();

  // 为每个分类获取产品
  const params = [];

  for (const category of categories) {
    const products = await fetchProductsByCategory(category.slug);

    for (const product of products) {
      params.push({
        category: category.slug,
        id: product.id,
      });
    }
  }

  return params;
}

export default async function ProductPage({
  params,
}: {
  params: { category: string; id: string };
}) {
  const product = await fetchProduct(params.category, params.id);
  return <div>{product.name}</div>;
}

// 生成的路径：
// /categories/electronics/products/laptop-1
// /categories/electronics/products/phone-2
// /categories/clothing/products/shirt-3
// ...
```

**优化：分层生成**

```typescript
// app/categories/[category]/page.tsx
export async function generateStaticParams() {
  const categories = await fetchCategories();

  return categories.map((category) => ({
    category: category.slug,
  }));
}

// app/categories/[category]/products/[id]/page.tsx
export async function generateStaticParams({
  params,
}: {
  params: { category: string };
}) {
  // 只获取当前分类的产品
  const products = await fetchProductsByCategory(params.category);

  return products.map((product) => ({
    id: product.id,
  }));
}

// 优势：
// - 更高效的数据获取
// - 利用父级参数
// - 减少重复查询
```

---

## 问题 4：如何处理大量页面？

**分批生成**

```typescript
// app/products/[id]/page.tsx

export async function generateStaticParams() {
  // 只生成最重要的页面
  const popularProducts = await fetchPopularProducts(100);

  return popularProducts.map((product) => ({
    id: product.id,
  }));
}

export const dynamicParams = true; // 允许动态生成其他页面

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await fetchProduct(params.id);
  return <div>{product.name}</div>;
}

// 构建时：
// - 生成 100 个热门产品的静态页面

// 运行时：
// - 访问其他产品时，动态生成页面
// - 生成后缓存（ISR）
```

**按需生成（ISR）**

```typescript
// app/blog/[slug]/page.tsx

export async function generateStaticParams() {
  // 只生成最近的文章
  const recentPosts = await fetchRecentPosts(50);

  return recentPosts.map((post) => ({
    slug: post.slug,
  }));
}

export const dynamicParams = true;

export default async function BlogPost({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 3600 }, // 每小时重新验证
  }).then((res) => res.json());

  return <article>{post.content}</article>;
}

// 构建时：生成 50 篇最近的文章
// 运行时：
// - 访问旧文章时，动态生成
// - 每小时重新验证内容
```

---

## 问题 5：generateStaticParams 的最佳实践是什么？

**只生成必要的页面**

```typescript
// ✅ 好：只生成热门页面
export async function generateStaticParams() {
  // 生成访问量最高的 100 个页面
  const popularPages = await fetchPopularPages(100);
  return popularPages.map((page) => ({ id: page.id }));
}

export const dynamicParams = true; // 其他页面动态生成

// ❌ 不好：生成所有页面
export async function generateStaticParams() {
  // 生成 10000 个页面，构建时间过长
  const allPages = await fetchAllPages(); // 10000 条
  return allPages.map((page) => ({ id: page.id }));
}
```

**使用并行请求**

```typescript
// ✅ 好：并行获取数据
export async function generateStaticParams() {
  const [posts, products, users] = await Promise.all([
    fetchPosts(),
    fetchProducts(),
    fetchUsers(),
  ]);

  return [
    ...posts.map((p) => ({ type: "post", id: p.id })),
    ...products.map((p) => ({ type: "product", id: p.id })),
    ...users.map((u) => ({ type: "user", id: u.id })),
  ];
}

// ❌ 不好：串行请求
export async function generateStaticParams() {
  const posts = await fetchPosts();
  const products = await fetchProducts();
  const users = await fetchUsers();

  return [...posts, ...products, ...users];
}
```

**缓存数据**

```typescript
// lib/data.ts
const cache = new Map();

export async function fetchAllPosts() {
  if (cache.has("posts")) {
    return cache.get("posts");
  }

  const posts = await db.post.findMany();
  cache.set("posts", posts);

  return posts;
}

// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  // 使用缓存的数据
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// app/blog/page.tsx
export default async function BlogList() {
  // 复用相同的缓存数据
  const posts = await fetchAllPosts();
  return <PostList posts={posts} />;
}
```

**类型安全**

```typescript
// ✅ 好：使用 TypeScript 类型
type Params = {
  slug: string;
};

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function Page({ params }: { params: Params }) {
  // params 有类型提示
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}
```

**错误处理**

```typescript
export async function generateStaticParams() {
  try {
    const posts = await fetchAllPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch (error) {
    console.error("Failed to generate static params:", error);

    // 返回空数组或默认值
    return [];

    // 或者抛出错误，让构建失败
    // throw error;
  }
}
```

---

## 总结

**核心概念**：

### 1. generateStaticParams 作用

- 在构建时生成静态页面
- 为动态路由提供参数
- 替代 Pages Router 的 getStaticPaths

### 2. 基本用法

```typescript
export async function generateStaticParams() {
  const items = await fetchItems();

  return items.map((item) => ({
    id: item.id,
  }));
}
```

### 3. 多个动态段

```typescript
// 嵌套路由
export async function generateStaticParams({ params }) {
  // 使用父级参数
  const items = await fetchItems(params.category);

  return items.map((item) => ({
    id: item.id,
  }));
}
```

### 4. dynamicParams 配置

```typescript
export const dynamicParams = true; // 允许动态生成
export const dynamicParams = false; // 只允许静态页面
```

### 5. 最佳实践

- 只生成必要的页面（热门、重要）
- 使用 `dynamicParams = true` 处理其他页面
- 并行获取数据
- 缓存重复使用的数据
- 使用 TypeScript 类型
- 处理错误情况
- 结合 ISR 使用

### 6. 性能优化

**构建时**：

- 生成热门页面（100-1000 个）
- 使用并行请求
- 缓存数据

**运行时**：

- 动态生成其他页面
- 使用 ISR 更新内容
- 缓存生成的页面

## 延伸阅读

- [Next.js 官方文档 - generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js 官方文档 - Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js 官方文档 - Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
