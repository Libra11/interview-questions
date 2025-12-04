---
title: getStaticPaths 有什么作用？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js Pages Router 中 getStaticPaths 的作用，掌握如何为动态路由生成静态页面。
tags:
  - Next.js
  - getStaticPaths
  - 动态路由
  - Pages Router
estimatedTime: 20 分钟
keywords:
  - getStaticPaths
  - 动态路由
  - 静态生成
  - fallback
highlight: 理解 getStaticPaths 如何为动态路由预生成静态页面，掌握 fallback 模式的使用
order: 419
---

## 问题 1：getStaticPaths 是什么？

**为动态路由生成静态路径**

`getStaticPaths` 用于指定哪些动态路由应该在构建时预渲染。

```typescript
// pages/blog/[slug].tsx

// 指定要预渲染的路径
export async function getStaticPaths() {
  // 获取所有博客文章
  const posts = await fetchAllPosts();

  // 生成路径数组
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: false,
  };
}

// 为每个路径获取数据
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
  };
}

export default function BlogPost({ post }) {
  return <article>{post.content}</article>;
}

// 构建时：
// 1. getStaticPaths 返回所有路径
// 2. 为每个路径调用 getStaticProps
// 3. 生成静态 HTML 文件
```

**为什么需要 getStaticPaths？**

```typescript
// 动态路由：pages/products/[id].tsx

// ❌ 没有 getStaticPaths
// Next.js 不知道要生成哪些页面
// 构建时无法预渲染

// ✅ 有 getStaticPaths
export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: "1" } },
      { params: { id: "2" } },
      { params: { id: "3" } },
    ],
    fallback: false,
  };
}

// Next.js 知道要生成：
// - /products/1
// - /products/2
// - /products/3
```

---

## 问题 2：getStaticPaths 的返回值是什么？

**paths 数组**

```typescript
export async function getStaticPaths() {
  return {
    paths: [
      // 单个动态段
      { params: { id: "1" } },
      { params: { id: "2" } },

      // 多个动态段
      { params: { category: "electronics", id: "123" } },

      // 带 locale（国际化）
      { params: { slug: "hello" }, locale: "en" },
      { params: { slug: "hola" }, locale: "es" },
    ],
    fallback: false,
  };
}
```

**fallback 选项**

```typescript
// 1. fallback: false
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "1" } }, { params: { id: "2" } }],
    fallback: false,
  };
}

// 行为：
// - 只有 paths 中的路径可访问
// - 其他路径返回 404
// - 适合：页面数量少且固定

// 2. fallback: true
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "1" } }],
    fallback: true,
  };
}

export default function Page({ post }) {
  const router = useRouter();

  // 首次访问未预生成的页面时
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <article>{post.content}</article>;
}

// 行为：
// - paths 中的路径：立即返回静态 HTML
// - 其他路径：
//   1. 显示 fallback UI（Loading...）
//   2. 后台生成页面
//   3. 生成后显示内容
//   4. 后续访问返回静态 HTML
// - 适合：页面数量多

// 3. fallback: 'blocking'
export async function getStaticPaths() {
  return {
    paths: [{ params: { id: "1" } }],
    fallback: "blocking",
  };
}

// 行为：
// - paths 中的路径：立即返回静态 HTML
// - 其他路径：
//   1. 服务端生成页面（用户等待）
//   2. 返回完整 HTML
//   3. 后续访问返回静态 HTML
// - 不显示 fallback UI
// - 适合：需要 SEO 的页面
```

---

## 问题 3：如何处理大量动态路由？

**只生成重要页面**

```typescript
// pages/products/[id].tsx

export async function getStaticPaths() {
  // 只生成热门产品
  const popularProducts = await fetchPopularProducts(100);

  const paths = popularProducts.map((product) => ({
    params: { id: product.id },
  }));

  return {
    paths,
    fallback: "blocking", // 其他产品按需生成
  };
}

export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    return { notFound: true };
  }

  return {
    props: { product },
    revalidate: 60, // ISR：每分钟更新
  };
}

// 构建时：生成 100 个热门产品
// 运行时：其他产品按需生成
```

**分批生成**

```typescript
// pages/blog/[slug].tsx

export async function getStaticPaths() {
  // 只生成最近的文章
  const recentPosts = await fetchRecentPosts(50);

  const paths = recentPosts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: "blocking",
  };
}

// 优势：
// - 减少构建时间
// - 按需生成其他页面
// - 使用 ISR 保持更新
```

---

## 问题 4：getStaticPaths 与 getStaticProps 如何配合？

**完整示例**

```typescript
// pages/blog/[slug].tsx

// 1. 指定要生成的路径
export async function getStaticPaths() {
  const posts = await fetchAllPosts();

  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: "blocking",
  };
}

// 2. 为每个路径获取数据
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  if (!post) {
    return { notFound: true };
  }

  return {
    props: { post },
    revalidate: 3600, // ISR
  };
}

// 3. 渲染页面
export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 构建流程：
// 1. getStaticPaths 返回所有 slug
// 2. 对每个 slug 调用 getStaticProps
// 3. 生成静态 HTML
```

**嵌套动态路由**

```typescript
// pages/categories/[category]/products/[id].tsx

export async function getStaticPaths() {
  const categories = await fetchCategories();

  const paths = [];

  for (const category of categories) {
    const products = await fetchProductsByCategory(category.slug);

    for (const product of products) {
      paths.push({
        params: {
          category: category.slug,
          id: product.id,
        },
      });
    }
  }

  return {
    paths,
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.category, params.id);

  return {
    props: { product },
  };
}
```

---

## 问题 5：getStaticPaths 的最佳实践？

**性能优化**

```typescript
// ✅ 好：并行获取数据
export async function getStaticPaths() {
  const [posts, products, pages] = await Promise.all([
    fetchPosts(),
    fetchProducts(),
    fetchPages(),
  ]);

  const paths = [
    ...posts.map((p) => ({ params: { type: "post", id: p.id } })),
    ...products.map((p) => ({ params: { type: "product", id: p.id } })),
    ...pages.map((p) => ({ params: { type: "page", id: p.id } })),
  ];

  return { paths, fallback: "blocking" };
}

// ❌ 不好：串行获取
export async function getStaticPaths() {
  const posts = await fetchPosts();
  const products = await fetchProducts();
  const pages = await fetchPages();

  // ...
}
```

**错误处理**

```typescript
export async function getStaticPaths() {
  try {
    const posts = await fetchAllPosts();

    const paths = posts.map((post) => ({
      params: { slug: post.slug },
    }));

    return {
      paths,
      fallback: "blocking",
    };
  } catch (error) {
    console.error("Error in getStaticPaths:", error);

    // 返回空数组，所有页面按需生成
    return {
      paths: [],
      fallback: "blocking",
    };
  }
}
```

**选择合适的 fallback**

```typescript
// 场景 1：页面数量少（< 100）
export async function getStaticPaths() {
  const pages = await fetchAllPages(); // 50 个页面

  return {
    paths: pages.map((p) => ({ params: { id: p.id } })),
    fallback: false, // 全部预生成
  };
}

// 场景 2：页面数量多，需要 SEO
export async function getStaticPaths() {
  const popularPages = await fetchPopularPages(100);

  return {
    paths: popularPages.map((p) => ({ params: { id: p.id } })),
    fallback: "blocking", // SEO 友好
  };
}

// 场景 3：页面数量多，不需要 SEO
export async function getStaticPaths() {
  const popularPages = await fetchPopularPages(100);

  return {
    paths: popularPages.map((p) => ({ params: { id: p.id } })),
    fallback: true, // 显示 loading
  };
}
```

---

## 总结

**核心概念**：

### 1. getStaticPaths 作用

- 指定动态路由的预渲染路径
- 必须与 getStaticProps 配合使用
- 只在构建时运行

### 2. 返回值

```typescript
{
  paths: [
    { params: { id: '1' } },
    { params: { id: '2' } },
  ],
  fallback: false | true | 'blocking'
}
```

### 3. fallback 模式

**false**：

- 只有 paths 中的路径可访问
- 其他返回 404
- 适合页面少

**true**：

- 显示 fallback UI
- 后台生成页面
- 适合页面多

**'blocking'**：

- 服务端生成（用户等待）
- 不显示 fallback UI
- SEO 友好

### 4. 使用场景

- 博客文章
- 产品页面
- 文档页面
- 用户资料

### 5. 最佳实践

- 只生成重要页面（100-1000 个）
- 使用 fallback: 'blocking' 处理其他页面
- 并行获取数据
- 结合 ISR 使用
- 处理错误情况

## 延伸阅读

- [Next.js 官方文档 - getStaticPaths](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-paths)
- [Next.js 官方文档 - fallback](https://nextjs.org/docs/pages/api-reference/functions/get-static-paths#fallback-false)
- [Next.js 官方文档 - Dynamic Routes](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
