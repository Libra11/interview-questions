---
title: 动态路由 [id]、嵌套路由 [...slug] 如何使用？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 中动态路由和嵌套路由的使用方法，掌握如何处理动态 URL 参数和多层级路径。
tags:
  - Next.js
  - 动态路由
  - 路由参数
  - Catch-all Routes
estimatedTime: 22 分钟
keywords:
  - 动态路由
  - 动态参数
  - Catch-all Routes
  - 可选捕获
highlight: 理解 Next.js 动态路由的三种形式，掌握处理复杂 URL 结构的方法
order: 411
---

## 问题 1：什么是动态路由 [id]？

**动态路由段**

使用方括号 `[param]` 创建动态路由段，可以匹配 URL 中的动态参数。

```typescript
// 文件结构
app/
└── blog/
    └── [slug]/
        └── page.tsx

// app/blog/[slug]/page.tsx
export default function BlogPost({
  params
}: {
  params: { slug: string }
}) {
  // URL: /blog/hello-world
  // params.slug = "hello-world"

  // URL: /blog/nextjs-tutorial
  // params.slug = "nextjs-tutorial"

  return <h1>Blog Post: {params.slug}</h1>;
}

// 匹配的 URL：
// /blog/hello-world ✅
// /blog/nextjs-tutorial ✅
// /blog/any-slug ✅

// 不匹配的 URL：
// /blog ❌（缺少参数）
// /blog/hello/world ❌（多个段）
```

**获取动态参数**

```typescript
// app/products/[id]/page.tsx
export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  // 使用参数获取数据
  const product = await fetchProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Product ID: {params.id}</p>
      <p>Price: ${product.price}</p>
    </div>
  );
}

// URL: /products/123
// params.id = "123"

// URL: /products/abc-xyz
// params.id = "abc-xyz"
```

---

## 问题 2：如何使用多个动态路由段？

**嵌套动态路由**

可以在路径中使用多个动态段。

```typescript
// 文件结构
app/
└── users/
    └── [userId]/
        └── posts/
            └── [postId]/
                └── page.tsx

// app/users/[userId]/posts/[postId]/page.tsx
export default async function UserPost({
  params
}: {
  params: { userId: string; postId: string }
}) {
  // URL: /users/123/posts/456
  // params.userId = "123"
  // params.postId = "456"

  const post = await fetchUserPost(params.userId, params.postId);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Author ID: {params.userId}</p>
      <p>Post ID: {params.postId}</p>
      <p>{post.content}</p>
    </article>
  );
}
```

**实际应用示例**

```typescript
// 电商网站：分类和产品
// app/categories/[category]/products/[id]/page.tsx
export default async function ProductPage({
  params,
}: {
  params: { category: string; id: string };
}) {
  // URL: /categories/electronics/products/laptop-123
  // params.category = "electronics"
  // params.id = "laptop-123"

  const product = await db.product.findUnique({
    where: {
      id: params.id,
      category: params.category,
    },
  });

  return (
    <div>
      <nav>
        <a href="/categories">All Categories</a>
        <span> / </span>
        <a href={`/categories/${params.category}`}>{params.category}</a>
      </nav>

      <h1>{product.name}</h1>
      <p>Category: {params.category}</p>
    </div>
  );
}

// 社交媒体：用户和评论
// app/users/[userId]/comments/[commentId]/page.tsx
export default async function CommentPage({
  params,
}: {
  params: { userId: string; commentId: string };
}) {
  // URL: /users/john/comments/comment-789
  const comment = await fetchComment(params.userId, params.commentId);

  return (
    <div>
      <h2>Comment by User {params.userId}</h2>
      <p>{comment.text}</p>
    </div>
  );
}
```

---

## 问题 3：什么是捕获所有路由 [...slug]？

**Catch-all Segments**

使用 `[...param]` 可以捕获多个路径段。

```typescript
// 文件结构
app/
└── docs/
    └── [...slug]/
        └── page.tsx

// app/docs/[...slug]/page.tsx
export default function DocsPage({
  params
}: {
  params: { slug: string[] }
}) {
  // URL: /docs/getting-started
  // params.slug = ["getting-started"]

  // URL: /docs/api/reference
  // params.slug = ["api", "reference"]

  // URL: /docs/guides/installation/windows
  // params.slug = ["guides", "installation", "windows"]

  const path = params.slug.join(' / ');

  return (
    <div>
      <h1>Documentation</h1>
      <p>Path: {path}</p>
    </div>
  );
}

// 匹配的 URL：
// /docs/intro ✅
// /docs/api/users ✅
// /docs/guides/setup/macos ✅
// /docs/a/b/c/d/e ✅（任意深度）

// 不匹配的 URL：
// /docs ❌（至少需要一个段）
```

**实际应用：文档网站**

```typescript
// app/docs/[...slug]/page.tsx
import { readFile } from "fs/promises";
import path from "path";

export default async function DocsPage({
  params,
}: {
  params: { slug: string[] };
}) {
  // 根据 slug 读取对应的 Markdown 文件
  const filePath = path.join(
    process.cwd(),
    "content",
    "docs",
    ...params.slug,
    "index.md"
  );

  const content = await readFile(filePath, "utf-8");

  return (
    <div>
      <nav>
        {params.slug.map((segment, index) => (
          <span key={index}>
            <a href={`/docs/${params.slug.slice(0, index + 1).join("/")}`}>
              {segment}
            </a>
            {index < params.slug.length - 1 && " / "}
          </span>
        ))}
      </nav>

      <article>{content}</article>
    </div>
  );
}

// URL: /docs/api/authentication/oauth
// 读取: content/docs/api/authentication/oauth/index.md
```

**实际应用：文件浏览器**

```typescript
// app/files/[...path]/page.tsx
export default async function FileBrowser({
  params,
}: {
  params: { path: string[] };
}) {
  const currentPath = params.path.join("/");
  const files = await listFiles(currentPath);

  return (
    <div>
      <h1>Files: /{currentPath}</h1>

      <ul>
        {files.map((file) => (
          <li key={file.name}>
            {file.isDirectory ? (
              <a href={`/files/${currentPath}/${file.name}`}>📁 {file.name}</a>
            ) : (
              <span>📄 {file.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// URL: /files/documents/2024/reports
// params.path = ["documents", "2024", "reports"]
```

---

## 问题 4：什么是可选捕获所有路由 [[...slug]]？

**Optional Catch-all Segments**

使用双方括号 `[[...param]]` 使捕获所有路由变为可选。

```typescript
// 文件结构
app/
└── shop/
    └── [[...categories]]/
        └── page.tsx

// app/shop/[[...categories]]/page.tsx
export default function ShopPage({
  params
}: {
  params: { categories?: string[] }
}) {
  // URL: /shop
  // params.categories = undefined

  // URL: /shop/electronics
  // params.categories = ["electronics"]

  // URL: /shop/electronics/phones
  // params.categories = ["electronics", "phones"]

  // URL: /shop/electronics/phones/iphone
  // params.categories = ["electronics", "phones", "iphone"]

  if (!params.categories) {
    return <h1>All Products</h1>;
  }

  const category = params.categories.join(' > ');

  return (
    <div>
      <h1>Category: {category}</h1>
    </div>
  );
}

// 匹配的 URL：
// /shop ✅（可选，categories 为 undefined）
// /shop/electronics ✅
// /shop/electronics/phones ✅
// /shop/a/b/c ✅
```

**与普通捕获所有路由的区别**

```typescript
// [...slug] - 必需至少一个段
app / docs / [...slug] / page.tsx;
// /docs ❌
// /docs/intro ✅
// /docs/api/users ✅

// [[...slug]] - 可选，可以没有段
app / docs / [[...slug]] / page.tsx;
// /docs ✅
// /docs/intro ✅
// /docs/api/users ✅
```

**实际应用：产品筛选**

```typescript
// app/products/[[...filters]]/page.tsx
export default async function ProductsPage({
  params,
}: {
  params: { filters?: string[] };
}) {
  let products;

  if (!params.filters) {
    // /products - 显示所有产品
    products = await fetchAllProducts();
  } else {
    // /products/electronics/phones/samsung
    // 根据过滤器获取产品
    products = await fetchFilteredProducts(params.filters);
  }

  return (
    <div>
      <h1>Products</h1>

      {params.filters && (
        <div className="filters">
          Active filters: {params.filters.join(" > ")}
          <a href="/products">Clear filters</a>
        </div>
      )}

      <ProductGrid products={products} />
    </div>
  );
}

// URL: /products
// 显示所有产品

// URL: /products/electronics
// 显示电子产品

// URL: /products/electronics/phones/samsung
// 显示三星手机
```

---

## 问题 5：动态路由的最佳实践是什么？

**类型安全**

```typescript
// ✅ 好：使用 TypeScript 类型
export default function ProductPage({ params }: { params: { id: string } }) {
  // params.id 有类型提示
  return <div>Product {params.id}</div>;
}

// ❌ 不好：没有类型
export default function ProductPage({ params }) {
  // params 类型为 any
  return <div>Product {params.id}</div>;
}
```

**参数验证**

```typescript
// app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  // 验证参数格式
  if (!/^\d+$/.test(params.id)) {
    notFound(); // 无效的 ID 格式
  }

  const product = await fetchProduct(params.id);

  if (!product) {
    notFound(); // 产品不存在
  }

  return <ProductDetail product={product} />;
}
```

**SEO 友好的 URL**

```typescript
// ✅ 好：使用 slug 而不是 ID
// app/blog/[slug]/page.tsx
// URL: /blog/nextjs-tutorial

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPostBySlug(params.slug);
  return <article>{post.content}</article>;
}

// ❌ 不好：只使用数字 ID
// app/blog/[id]/page.tsx
// URL: /blog/123

// 💡 更好：同时使用 slug 和 ID
// app/blog/[slug]/page.tsx
// URL: /blog/123-nextjs-tutorial

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  // 从 slug 中提取 ID
  const id = params.slug.split("-")[0];
  const post = await fetchPost(id);

  return <article>{post.content}</article>;
}
```

**处理特殊字符**

```typescript
// app/search/[query]/page.tsx
export default function SearchPage({ params }: { params: { query: string } }) {
  // URL 参数会自动解码
  // URL: /search/hello%20world
  // params.query = "hello world"

  // URL: /search/%E4%B8%AD%E6%96%87
  // params.query = "中文"

  const decodedQuery = decodeURIComponent(params.query);

  return <h1>Search: {decodedQuery}</h1>;
}
```

**生成静态路径**

```typescript
// app/blog/[slug]/page.tsx

// 为所有博客文章生成静态页面
export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);
  return <article>{post.content}</article>;
}

// 构建时生成：
// /blog/post-1
// /blog/post-2
// /blog/post-3
// ...
```

---

## 总结

**核心概念**：

### 1. 动态路由 [param]

- 匹配单个路径段
- 参数通过 `params` 对象访问
- 用于 ID、slug 等单个参数

```typescript
app / blog / [slug] / page.tsx;
// /blog/hello-world
// params.slug = "hello-world"
```

### 2. 捕获所有路由 [...param]

- 匹配多个路径段
- 参数是字符串数组
- 至少需要一个段

```typescript
app / docs / [...slug] / page.tsx;
// /docs/api/users
// params.slug = ["api", "users"]
```

### 3. 可选捕获所有路由 [[...param]]

- 匹配零个或多个路径段
- 参数可能是 undefined
- 可以没有段

```typescript
app / shop / [[...categories]] / page.tsx;
// /shop
// params.categories = undefined

// /shop/electronics
// params.categories = ["electronics"]
```

### 4. 使用场景

**[param]**：

- 博客文章 `/blog/[slug]`
- 产品详情 `/products/[id]`
- 用户资料 `/users/[username]`

**[...param]**：

- 文档网站 `/docs/[...slug]`
- 文件浏览器 `/files/[...path]`
- 多级分类 `/categories/[...path]`

**[[...param]]**：

- 可选过滤器 `/products/[[...filters]]`
- 可选分类 `/shop/[[...categories]]`

### 5. 最佳实践

- 使用 TypeScript 类型
- 验证参数格式
- 使用 SEO 友好的 URL
- 处理不存在的资源（notFound）
- 使用 generateStaticParams 生成静态页面

## 延伸阅读

- [Next.js 官方文档 - Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js 官方文档 - generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js 官方文档 - Route Segments](https://nextjs.org/docs/app/building-your-application/routing/defining-routes)
