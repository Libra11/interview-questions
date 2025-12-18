---
title: App Router 与 Pages Router 的区别有哪些？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入对比 Next.js 的 App Router 和 Pages Router，理解两种路由系统的设计理念、功能差异和使用场景。
tags:
  - Next.js
  - App Router
  - Pages Router
  - 路由系统
estimatedTime: 25 分钟
keywords:
  - App Router
  - Pages Router
  - Next.js 路由
  - React Server Components
highlight: 全面理解 Next.js 两种路由系统的核心差异，掌握迁移和选择策略
order: 712
---

## 问题 1：App Router 和 Pages Router 的基本结构有什么不同？

**Pages Router（Next.js 12 及之前）**

Pages Router 使用 `pages` 目录，每个文件直接对应一个路由。

```typescript
// Pages Router 文件结构
pages/
├── _app.tsx            // 全局应用组件
├── _document.tsx       // HTML 文档结构
├── index.tsx           // /
├── about.tsx           // /about
├── blog/
│   ├── index.tsx       // /blog
│   └── [slug].tsx      // /blog/:slug
└── api/
    └── hello.ts        // /api/hello

// pages/index.tsx
export default function Home() {
  return <h1>Home Page</h1>;
}

// pages/blog/[slug].tsx
export default function BlogPost({ slug }) {
  return <h1>Post: {slug}</h1>;
}
```

**App Router（Next.js 13+）**

App Router 使用 `app` 目录，只有 `page.tsx` 文件才是路由，支持更多特殊文件。

```typescript
// App Router 文件结构
app/
├── layout.tsx          // 根布局（替代 _app.tsx）
├── page.tsx            // /
├── about/
│   └── page.tsx        // /about
├── blog/
│   ├── layout.tsx      // 博客布局
│   ├── page.tsx        // /blog
│   └── [slug]/
│       ├── page.tsx    // /blog/:slug
│       ├── loading.tsx // 加载状态
│       └── error.tsx   // 错误处理
└── api/
    └── hello/
        └── route.ts    // /api/hello

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx
export default function Home() {
  return <h1>Home Page</h1>;
}

// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Post: {params.slug}</h1>;
}
```

---

## 问题 2：数据获取方式有什么区别？

**Pages Router 的数据获取**

Pages Router 使用特定的函数来获取数据，这些函数在页面级别定义。

```typescript
// pages/blog/[slug].tsx

// 服务端渲染（SSR）
export async function getServerSideProps(context) {
  const { slug } = context.params;
  const post = await fetchPost(slug);

  return {
    props: { post },
  };
}

// 静态生成（SSG）
export async function getStaticProps(context) {
  const { slug } = context.params;
  const post = await fetchPost(slug);

  return {
    props: { post },
    revalidate: 60, // ISR：每 60 秒重新生成
  };
}

// 生成静态路径
export async function getStaticPaths() {
  const posts = await fetchAllPosts();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: "blocking",
  };
}

// 页面组件
export default function BlogPost({ post }) {
  return <h1>{post.title}</h1>;
}
```

**App Router 的数据获取**

App Router 使用原生的 `async/await` 和扩展的 `fetch` API。

```typescript
// app/blog/[slug]/page.tsx

// 服务端渲染（SSR）
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  // 每次请求都获取最新数据
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    cache: "no-cache", // 或 cache: 'no-store'
  }).then((res) => res.json());

  return <h1>{post.title}</h1>;
}

// 静态生成（SSG）
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  // 构建时获取数据
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    cache: "force-cache", // 默认行为
  }).then((res) => res.json());

  return <h1>{post.title}</h1>;
}

// ISR（增量静态再生成）
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 60 }, // 每 60 秒重新验证
  }).then((res) => res.json());

  return <h1>{post.title}</h1>;
}

// 生成静态路径
export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

**关键区别**：

```typescript
// Pages Router：特殊函数
getServerSideProps(); // SSR
getStaticProps(); // SSG
getStaticPaths(); // 静态路径

// App Router：fetch 配置
cache: "no-cache"; // SSR
cache: "force-cache"; // SSG（默认）
next: {
  revalidate: 60;
} // ISR
generateStaticParams(); // 静态路径
```

---

## 问题 3：组件类型和渲染方式有什么不同？

**Pages Router：全部是客户端组件**

在 Pages Router 中，所有组件默认都是客户端组件，可以使用 React Hooks 和浏览器 API。

```typescript
// pages/dashboard.tsx
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [data, setData] = useState(null);

  // 可以使用所有 React Hooks
  useEffect(() => {
    fetchData().then(setData);
  }, []);

  // 可以访问浏览器 API
  const handleClick = () => {
    localStorage.setItem("key", "value");
    window.alert("Hello");
  };

  return <div onClick={handleClick}>{data?.content}</div>;
}
```

**App Router：服务端组件 + 客户端组件**

App Router 引入了 React Server Components（RSC），组件默认在服务端渲染。

```typescript
// app/dashboard/page.tsx（Server Component - 默认）
export default async function Dashboard() {
  // 可以直接在组件中获取数据
  const data = await fetchData();

  // ❌ 不能使用 React Hooks
  // const [state, setState] = useState(null); // 错误！

  // ❌ 不能使用浏览器 API
  // localStorage.setItem('key', 'value'); // 错误！

  // ❌ 不能使用事件处理器
  // <button onClick={() => {}}>Click</button> // 错误！

  return (
    <div>
      <h1>{data.title}</h1>
      {/* 可以嵌套客户端组件 */}
      <ClientComponent data={data} />
    </div>
  );
}

// app/dashboard/ClientComponent.tsx（Client Component）
("use client"); // 标记为客户端组件

import { useState } from "react";

export default function ClientComponent({ data }) {
  const [count, setCount] = useState(0);

  // ✅ 可以使用 React Hooks
  // ✅ 可以使用浏览器 API
  // ✅ 可以使用事件处理器

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

**服务端组件的优势**：

```typescript
// Server Component 可以直接访问后端资源
export default async function Page() {
  // 直接访问数据库
  const posts = await db.post.findMany();

  // 直接读取文件系统
  const content = await fs.readFile("data.json", "utf-8");

  // 直接使用服务端 API
  const secret = process.env.SECRET_KEY;

  // 减少客户端 JavaScript 体积
  // 这些代码不会发送到浏览器

  return <PostList posts={posts} />;
}
```

---

## 问题 4：布局和嵌套路由有什么区别？

**Pages Router：使用 \_app.tsx 和手动嵌套**

Pages Router 只有一个全局的 `_app.tsx`，嵌套布局需要手动实现。

```typescript
// pages/_app.tsx（全局布局）
export default function App({ Component, pageProps }) {
  return (
    <div>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}

// 嵌套布局需要手动实现
// pages/dashboard/index.tsx
export default function Dashboard() {
  return (
    <DashboardLayout>
      <h1>Dashboard</h1>
    </DashboardLayout>
  );
}

// pages/dashboard/settings.tsx
export default function Settings() {
  return (
    <DashboardLayout>
      <h1>Settings</h1>
    </DashboardLayout>
  );
}

// 每个页面都需要手动包裹布局
```

**App Router：原生支持嵌套布局**

App Router 的 `layout.tsx` 可以在任何层级定义，自动嵌套。

```typescript
// app/layout.tsx（根布局）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx（仪表板布局）
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// app/dashboard/page.tsx
export default function Dashboard() {
  // 自动被 DashboardLayout 和 RootLayout 包裹
  return <h1>Dashboard</h1>;
}

// app/dashboard/settings/page.tsx
export default function Settings() {
  // 同样自动被两个布局包裹
  return <h1>Settings</h1>;
}
```

**布局持久化**：

```typescript
// App Router 的布局不会重新渲染
// 当从 /dashboard 导航到 /dashboard/settings 时：
// - RootLayout 不重新渲染
// - DashboardLayout 不重新渲染
// - 只有 page.tsx 重新渲染

// 这提供了更好的性能和用户体验
// 布局中的状态会保持
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 导航时 sidebarOpen 状态会保持
  return (
    <div>
      <Sidebar open={sidebarOpen} />
      {children}
    </div>
  );
}
```

---

## 问题 5：加载状态和错误处理有什么不同？

**Pages Router：手动实现**

Pages Router 需要手动实现加载状态和错误处理。

```typescript
// pages/blog/[slug].tsx
import { useState, useEffect } from "react";

export default function BlogPost({ slug }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost(slug)
      .then(setPost)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <h1>{post.title}</h1>;
}
```

**App Router：使用特殊文件**

App Router 提供了 `loading.tsx` 和 `error.tsx` 文件来处理加载和错误状态。

```typescript
// app/blog/[slug]/loading.tsx
export default function Loading() {
  // 自动在数据加载时显示
  return <div>Loading blog post...</div>;
}

// app/blog/[slug]/error.tsx
("use client");

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  // 自动在发生错误时显示
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  // 加载时自动显示 loading.tsx
  // 错误时自动显示 error.tsx
  const post = await fetchPost(params.slug);

  return <h1>{post.title}</h1>;
}
```

**使用 Suspense 实现流式渲染**：

```typescript
// App Router 支持 React Suspense
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      {/* 立即渲染的内容 */}
      <Header />

      {/* 延迟加载的内容 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowComponent />
      </Suspense>

      {/* 立即渲染的内容 */}
      <Footer />
    </div>
  );
}

async function SlowComponent() {
  // 这个组件的数据获取不会阻塞页面其他部分
  const data = await fetchSlowData();
  return <div>{data.content}</div>;
}
```

---

## 总结

**核心区别**：

### 1. 文件结构

- **Pages Router**：每个文件都是路由
- **App Router**：只有 `page.tsx` 是路由，支持更多特殊文件

### 2. 数据获取

- **Pages Router**：`getServerSideProps`、`getStaticProps`、`getStaticPaths`
- **App Router**：原生 `async/await`，扩展的 `fetch` API

### 3. 组件类型

- **Pages Router**：全部是客户端组件
- **App Router**：默认是服务端组件，需要时使用 `'use client'`

### 4. 布局系统

- **Pages Router**：只有 `_app.tsx`，嵌套布局需手动实现
- **App Router**：原生支持嵌套 `layout.tsx`，自动持久化

### 5. 加载和错误处理

- **Pages Router**：手动实现
- **App Router**：`loading.tsx` 和 `error.tsx` 文件

### 6. 何时使用

**继续使用 Pages Router**：

- 现有项目且不需要新特性
- 团队不熟悉 React Server Components
- 依赖大量客户端状态管理

**迁移到 App Router**：

- 新项目
- 需要更好的性能和 SEO
- 想要使用 React Server Components
- 需要更灵活的布局系统

## 延伸阅读

- [Next.js 官方文档 - App Router](https://nextjs.org/docs/app)
- [Next.js 官方文档 - Pages Router](https://nextjs.org/docs/pages)
- [Next.js 官方文档 - Upgrading to App Router](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React 官方文档 - Server Components](https://react.dev/reference/react/use-server)
