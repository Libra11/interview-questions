---
title: Next.js 数据获取方法详解
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面解析 Next.js 提供的数据获取方法，包括 getStaticProps、getServerSideProps、getStaticPaths 等，掌握它们的工作原理和应用场景。
tags:
  - Next.js
  - 数据获取
  - getStaticProps
  - getServerSideProps
estimatedTime: 30 分钟
keywords:
  - 数据获取
  - getStaticProps
  - getServerSideProps
  - getStaticPaths
highlight: 掌握 Next.js 各种数据获取方法的使用场景和最佳实践
order: 709
---

## 问题 1：Next.js 提供了哪些数据获取方法？

**Pages Router 的数据获取方法**

```typescript
// 1. getStaticProps - 静态生成（SSG）
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 2. getServerSideProps - 服务器端渲染（SSR）
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 3. getStaticPaths - 动态路由的静态生成
export async function getStaticPaths() {
  const paths = await fetchPaths();
  return { paths, fallback: false };
}

// 4. getInitialProps - 旧版 API（不推荐）
Page.getInitialProps = async (context) => {
  const data = await fetchData();
  return { data };
};
```

**App Router 的数据获取方法**

```typescript
// 1. Server Components（默认）
export default async function Page() {
  const data = await fetch("https://api.example.com/data");
  return <div>{data.title}</div>;
}

// 2. Client Components
("use client");

import { useState, useEffect } from "react";

export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/data").then((res) => setData(res.json()));
  }, []);

  return <div>{data?.title}</div>;
}

// 3. Route Handlers（API Routes）
// app/api/data/route.ts
export async function GET() {
  const data = await fetchData();
  return Response.json(data);
}

// 4. Server Actions
("use server");

export async function getData() {
  const data = await fetchData();
  return data;
}
```

---

## 问题 2：getStaticProps 的工作原理和使用场景是什么？

**getStaticProps 的工作原理**

`getStaticProps` 在**构建时**运行，生成静态 HTML 页面。

```typescript
// pages/blog/[slug].tsx
interface Post {
  title: string;
  content: string;
  publishedAt: string;
}

interface Props {
  post: Post;
}

// 1. 构建时执行（npm run build）
export async function getStaticProps({ params }) {
  // 获取数据
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then(
    (res) => res.json()
  );

  // 返回 props
  return {
    props: {
      post,
    },
    // 可选：重新验证时间（ISR）
    revalidate: 3600, // 每小时重新生成
  };
}

// 2. 组件接收 props
export default function BlogPost({ post }: Props) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// 3. 构建产物：静态 HTML 文件
// .next/server/pages/blog/[slug].html
```

**getStaticProps 的配置选项**

```typescript
export async function getStaticProps(context) {
  const { params, preview, previewData } = context;

  return {
    props: {
      data: {},
    },
    // ISR：增量静态再生成
    revalidate: 60, // 60 秒后重新生成

    // 404 页面
    notFound: true,

    // 重定向
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}
```

**使用场景**

```typescript
// 1. 博客文章
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
    revalidate: 3600, // 每小时更新
  };
}

// 2. 产品页面
export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id);

  return {
    props: { product },
    revalidate: 600, // 每 10 分钟更新
  };
}

// 3. 文档页面
export async function getStaticProps({ params }) {
  const doc = await fetchDoc(params.slug);

  return {
    props: { doc },
    // 不设置 revalidate，永久缓存
  };
}
```

---

## 问题 3：getServerSideProps 的工作原理和使用场景是什么？

**getServerSideProps 的工作原理**

`getServerSideProps` 在**每次请求时**在服务器端运行。

```typescript
// pages/dashboard.tsx
interface DashboardData {
  user: User;
  stats: Stats;
}

// 每次请求时执行
export async function getServerSideProps(context) {
  const { req, res, params, query } = context;

  // 1. 可以访问请求对象
  const cookies = req.cookies;
  const userAgent = req.headers["user-agent"];

  // 2. 获取数据
  const user = await fetchUser(cookies.userId);
  const stats = await fetchStats(user.id);

  // 3. 设置响应头
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );

  // 4. 返回 props
  return {
    props: {
      user,
      stats,
    },
  };
}

export default function Dashboard({ user, stats }: DashboardData) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <Stats data={stats} />
    </div>
  );
}
```

**getServerSideProps 的配置选项**

```typescript
export async function getServerSideProps(context) {
  // 访问请求信息
  const { req, res, params, query, resolvedUrl } = context;

  // 认证检查
  const session = await getSession(req);
  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // 404 处理
  const data = await fetchData(params.id);
  if (!data) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      data,
      session,
    },
  };
}
```

**使用场景**

```typescript
// 1. 需要认证的页面
export async function getServerSideProps({ req }) {
  const session = await getSession(req);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const userData = await fetchUserData(session.userId);

  return {
    props: { userData },
  };
}

// 2. 个性化内容
export async function getServerSideProps({ req, params }) {
  const userId = req.cookies.userId;
  const product = await fetchProduct(params.id);
  const recommendations = await fetchRecommendations(userId, product.category);

  return {
    props: {
      product,
      recommendations,
    },
  };
}

// 3. 实时数据
export async function getServerSideProps() {
  const liveData = await fetchLiveData();

  return {
    props: { liveData },
  };
}
```

---

## 问题 4：getStaticPaths 的工作原理和使用场景是什么？

**getStaticPaths 的工作原理**

`getStaticPaths` 用于定义哪些动态路由需要在构建时预渲染。

```typescript
// pages/posts/[id].tsx

// 1. 定义要预渲染的路径
export async function getStaticPaths() {
  // 获取所有文章 ID
  const posts = await fetchAllPosts();

  // 生成路径
  const paths = posts.map((post) => ({
    params: { id: post.id.toString() },
  }));

  return {
    paths, // 要预渲染的路径
    fallback: false, // 其他路径返回 404
  };
}

// 2. 为每个路径获取数据
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.id);

  return {
    props: { post },
  };
}

// 3. 渲染组件
export default function Post({ post }) {
  return <article>{post.content}</article>;
}
```

**fallback 选项详解**

```typescript
export async function getStaticPaths() {
  const paths = await fetchPaths();

  return {
    paths,

    // fallback: false
    // - 未在 paths 中的路径返回 404
    // - 适合：路径数量少且固定
    fallback: false,

    // fallback: true
    // - 未在 paths 中的路径会在请求时生成
    // - 首次请求会看到 fallback 页面
    // - 适合：路径数量多
    fallback: true,

    // fallback: 'blocking'
    // - 未在 paths 中的路径会在请求时生成
    // - 等待页面生成完成后再返回（SSR）
    // - 适合：需要完整 SEO 的页面
    fallback: "blocking",
  };
}
```

**使用 fallback: true**

```typescript
// pages/products/[id].tsx
export async function getStaticPaths() {
  // 只预渲染热门产品
  const popularProducts = await fetchPopularProducts();

  const paths = popularProducts.map((product) => ({
    params: { id: product.id },
  }));

  return {
    paths,
    fallback: true, // 其他产品在请求时生成
  };
}

export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id);

  if (!product) {
    return {
      notFound: true,
    };
  }

  return {
    props: { product },
    revalidate: 60,
  };
}

export default function Product({ product }) {
  const router = useRouter();

  // 处理 fallback 状态
  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return <ProductDetail product={product} />;
}
```

**使用 fallback: 'blocking'**

```typescript
export async function getStaticPaths() {
  return {
    paths: [], // 不预渲染任何路径
    fallback: "blocking", // 所有路径在请求时生成
  };
}

export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
    revalidate: 3600,
  };
}

// 用户首次访问时会等待页面生成
// 后续访问会使用缓存的静态页面
```

---

## 问题 5：App Router 中如何进行数据获取？

**Server Components（默认方式）**

```typescript
// app/posts/[id]/page.tsx
interface Post {
  id: string;
  title: string;
  content: string;
}

// 默认是 Server Component
export default async function PostPage({ params }: { params: { id: string } }) {
  // 直接在组件中获取数据
  const post: Post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: {
      revalidate: 3600, // 类似 getStaticProps 的 revalidate
    },
  }).then((res) => res.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// 生成静态路径（类似 getStaticPaths）
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return posts.map((post: Post) => ({
    id: post.id,
  }));
}
```

**不同的缓存策略**

```typescript
// 1. 静态生成（默认）
const data = await fetch("https://api.example.com/data");
// 或
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// 2. 服务器端渲染（每次请求）
const data = await fetch("https://api.example.com/data", {
  cache: "no-cache",
});

// 3. 增量静态再生成（ISR）
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 },
});

// 4. 按需重新验证
const data = await fetch("https://api.example.com/data", {
  next: { tags: ["posts"] },
});

// 在 Server Action 中触发
("use server");
import { revalidateTag } from "next/cache";

export async function updatePost() {
  await db.post.update({});
  revalidateTag("posts");
}
```

**并行数据获取**

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  // 并行获取多个数据源
  const [user, posts, stats] = await Promise.all([
    fetch("https://api.example.com/user").then((res) => res.json()),
    fetch("https://api.example.com/posts").then((res) => res.json()),
    fetch("https://api.example.com/stats").then((res) => res.json()),
  ]);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <Statistics stats={stats} />
    </div>
  );
}
```

**流式渲染和 Suspense**

```typescript
// app/page.tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      {/* 立即渲染 */}
      <Header />

      {/* 延迟加载 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// 独立的异步组件
async function Posts() {
  const posts = await fetchPosts(); // 可能很慢
  return <PostList posts={posts} />;
}

async function Comments() {
  const comments = await fetchComments(); // 可能很慢
  return <CommentList comments={comments} />;
}
```

**Client Components 中的数据获取**

```typescript
// app/components/UserProfile.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

// 方式 1：使用 useEffect
export function UserProfile1() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then(setUser);
  }, []);

  return <div>{user?.name}</div>;
}

// 方式 2：使用 SWR（推荐）
export function UserProfile2() {
  const { data: user, error, isLoading } = useSWR("/api/user", fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <div>{user.name}</div>;
}

// 方式 3：使用 React Query
import { useQuery } from "@tanstack/react-query";

export function UserProfile3() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => fetch("/api/user").then((res) => res.json()),
  });

  return <div>{user?.name}</div>;
}
```

---

## 总结

**Pages Router 数据获取方法**：

### 1. getStaticProps

- **时机**：构建时
- **用途**：静态生成（SSG）
- **场景**：博客、文档、产品页面
- **特点**：性能最佳，支持 ISR

### 2. getServerSideProps

- **时机**：每次请求
- **用途**：服务器端渲染（SSR）
- **场景**：认证页面、个性化内容、实时数据
- **特点**：数据最新，服务器压力大

### 3. getStaticPaths

- **时机**：构建时
- **用途**：定义动态路由的预渲染路径
- **场景**：配合 getStaticProps 使用
- **特点**：支持 fallback 模式

**App Router 数据获取方法**：

### 1. Server Components

- 默认方式，直接在组件中 await
- 支持多种缓存策略
- 更简洁的 API

### 2. generateStaticParams

- 替代 getStaticPaths
- 生成静态路径

### 3. 缓存控制

- `cache: 'force-cache'`（SSG）
- `cache: 'no-cache'`（SSR）
- `next: { revalidate }`（ISR）
- `next: { tags }`（按需重新验证）

### 4. 最佳实践

- 优先使用 Server Components
- 使用 Suspense 实现流式渲染
- 并行获取数据
- Client Components 使用 SWR 或 React Query

## 延伸阅读

- [Next.js 官方文档 - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js 官方文档 - getStaticProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)
- [Next.js 官方文档 - getServerSideProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props)
- [SWR Documentation](https://swr.vercel.app/)
