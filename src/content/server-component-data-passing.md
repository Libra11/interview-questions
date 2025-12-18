---
title: 服务器组件之间如何传递数据？
category: React
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解 React Server Component 之间传递数据的多种方式，包括 props、cache 函数和数据库查询等方法。
tags:
  - React
  - RSC
  - Server Component
  - 数据传递
estimatedTime: 20 分钟
keywords:
  - Server Component
  - 数据传递
  - React cache
  - props
highlight: 掌握 Server Component 的数据传递方式，是构建高效 RSC 应用的关键
order: 178
---

## 问题 1：通过 props 传递数据

最直接的方式是通过 props 在 Server Component 之间传递数据。

### 基本用法

```tsx
// app/page.tsx
async function Page() {
  // 在父组件获取数据
  const user = await db.user.findById("123");
  const posts = await db.posts.findByUser("123");

  return (
    <div>
      {/* 通过 props 传递给子组件 */}
      <UserProfile user={user} />
      <PostList posts={posts} user={user} />
    </div>
  );
}

// app/components/UserProfile.tsx
async function UserProfile({ user }) {
  // 直接使用传入的数据
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// app/components/PostList.tsx
async function PostList({ posts, user }) {
  return (
    <div>
      {posts.map((post) => (
        <Post key={post.id} post={post} author={user} />
      ))}
    </div>
  );
}
```

### 优势和限制

```tsx
/**
 * 优势：
 * 1. 简单直接，易于理解
 * 2. 数据流清晰
 * 3. 类型安全（TypeScript）
 *
 * 限制：
 * 1. 需要手动传递数据
 * 2. 深层嵌套时 props drilling
 * 3. 父组件需要知道子组件需要什么数据
 */

// ❌ Props drilling 问题
async function Page() {
  const user = await getUser();
  return <Layout user={user} />;
}

function Layout({ user }) {
  return <Sidebar user={user} />;
}

function Sidebar({ user }) {
  return <UserMenu user={user} />;
}

function UserMenu({ user }) {
  // 最终使用 user 的地方
  return <div>{user.name}</div>;
}
```

---

## 问题 2：使用 React cache 函数避免重复请求

React 提供了 `cache` 函数来缓存数据获取，避免重复请求。

### 基本用法

```tsx
// lib/data.ts
import { cache } from "react";

// 创建缓存函数
export const getUser = cache(async (userId: string) => {
  console.log("Fetching user:", userId);
  return await db.user.findById(userId);
});

export const getPosts = cache(async (userId: string) => {
  console.log("Fetching posts for user:", userId);
  return await db.posts.findByUser(userId);
});
```

### 在多个组件中使用

```tsx
// app/page.tsx
import { getUser, getPosts } from "@/lib/data";

async function Page() {
  // 第一次调用，执行查询
  const user = await getUser("123");

  return (
    <div>
      <UserProfile userId="123" />
      <PostList userId="123" />
    </div>
  );
}

// app/components/UserProfile.tsx
import { getUser } from "@/lib/data";

async function UserProfile({ userId }) {
  // 第二次调用，使用缓存，不会重复查询
  const user = await getUser(userId);

  return <div>{user.name}</div>;
}

// app/components/PostList.tsx
import { getUser, getPosts } from "@/lib/data";

async function PostList({ userId }) {
  // 第三次调用 getUser，仍然使用缓存
  const user = await getUser(userId);
  // 第一次调用 getPosts，执行查询
  const posts = await getPosts(userId);

  return (
    <div>
      <h2>{user.name}'s Posts</h2>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}

/**
 * 实际执行的查询：
 * 1. getUser('123') - 执行查询
 * 2. getUser('123') - 使用缓存
 * 3. getUser('123') - 使用缓存
 * 4. getPosts('123') - 执行查询
 *
 * 总共只执行了 2 次数据库查询
 */
```

### cache 的作用域

```tsx
/**
 * cache 的缓存作用域：
 *
 * 1. 单次请求内有效
 *    - 同一个请求中的多次调用会使用缓存
 *    - 不同请求之间不共享缓存
 *
 * 2. 基于参数
 *    - 相同参数使用缓存
 *    - 不同参数重新执行
 */

export const getUser = cache(async (userId: string) => {
  return await db.user.findById(userId);
});

// 请求 A
await getUser("123"); // 执行查询
await getUser("123"); // 使用缓存
await getUser("456"); // 执行查询（不同参数）

// 请求 B（新的请求）
await getUser("123"); // 重新执行查询（新请求）
```

---

## 问题 3：组合使用 props 和 cache

实际应用中，通常组合使用 props 和 cache 来优化性能。

### 策略 1：顶层获取，向下传递

```tsx
// app/dashboard/page.tsx
import { getUser, getStats } from "@/lib/data";

async function DashboardPage() {
  // 在顶层并行获取所有数据
  const [user, stats] = await Promise.all([getUser(), getStats()]);

  return (
    <div>
      {/* 向下传递数据 */}
      <DashboardHeader user={user} />
      <StatsGrid stats={stats} />
      <ActivityFeed user={user} stats={stats} />
    </div>
  );
}
```

### 策略 2：按需获取，使用 cache

```tsx
// lib/data.ts
import { cache } from "react";

export const getUser = cache(async () => {
  const session = await getSession();
  return await db.user.findById(session.userId);
});

// app/components/UserAvatar.tsx
import { getUser } from "@/lib/data";

async function UserAvatar() {
  // 按需获取，不需要从父组件传递
  const user = await getUser();
  return <img src={user.avatar} alt={user.name} />;
}

// app/components/UserMenu.tsx
import { getUser } from "@/lib/data";

async function UserMenu() {
  // 使用缓存，不会重复查询
  const user = await getUser();
  return <div>{user.name}</div>;
}

// app/page.tsx
async function Page() {
  return (
    <div>
      <header>
        <UserAvatar /> {/* 自己获取 user */}
        <UserMenu /> {/* 使用缓存的 user */}
      </header>
    </div>
  );
}
```

### 策略 3：混合模式

```tsx
// app/post/[id]/page.tsx
import { getPost, getUser } from "@/lib/data";

async function PostPage({ params }) {
  // 获取文章数据
  const post = await getPost(params.id);

  return (
    <article>
      {/* 传递 post 数据 */}
      <PostHeader post={post} />
      <PostContent post={post} />

      {/* 传递 authorId，组件内部使用 cache 获取 */}
      <AuthorInfo authorId={post.authorId} />

      {/* 不传递数据，组件内部自己获取 */}
      <RelatedPosts />
    </article>
  );
}

// app/components/AuthorInfo.tsx
import { getUser } from "@/lib/data";

async function AuthorInfo({ authorId }) {
  // 使用 cache 函数获取作者信息
  const author = await getUser(authorId);
  return <div>{author.name}</div>;
}

// app/components/RelatedPosts.tsx
import { getRelatedPosts } from "@/lib/data";

async function RelatedPosts() {
  // 完全独立获取数据
  const posts = await getRelatedPosts();
  return <div>{/* ... */}</div>;
}
```

---

## 问题 4：Server Component 数据传递的最佳实践

### 1. 选择合适的数据传递方式

```tsx
/**
 * 何时使用 props：
 * - 数据已经在父组件中获取
 * - 子组件是纯展示组件
 * - 需要明确的数据流
 */

// ✅ 适合使用 props
async function ProductPage({ params }) {
  const product = await getProduct(params.id);

  return (
    <div>
      <ProductImages images={product.images} />
      <ProductInfo product={product} />
      <ProductReviews reviews={product.reviews} />
    </div>
  );
}

/**
 * 何时使用 cache：
 * - 多个组件需要相同的数据
 * - 组件层级较深
 * - 数据获取逻辑复杂
 */

// ✅ 适合使用 cache
import { cache } from "react";

const getCurrentUser = cache(async () => {
  const session = await getSession();
  return await db.user.findById(session.userId);
});

// 多个组件可以独立调用
async function UserAvatar() {
  const user = await getCurrentUser();
  return <img src={user.avatar} />;
}

async function UserMenu() {
  const user = await getCurrentUser();
  return <div>{user.name}</div>;
}
```

### 2. 优化数据获取性能

```tsx
// ✅ 并行获取数据
async function Page() {
  // 同时发起多个请求
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);

  return <div>{/* ... */}</div>;
}

// ❌ 串行获取数据（慢）
async function Page() {
  const user = await getUser(); // 等待
  const posts = await getPosts(); // 等待
  const comments = await getComments(); // 等待

  return <div>{/* ... */}</div>;
}
```

### 3. 使用 TypeScript 确保类型安全

```tsx
// lib/data.ts
import { cache } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
};

export const getUser = cache(async (userId: string): Promise<User> => {
  return await db.user.findById(userId);
});

export const getPosts = cache(async (userId: string): Promise<Post[]> => {
  return await db.posts.findByUser(userId);
});

// 组件中使用时有类型提示
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId); // user 的类型是 User
  return <div>{user.name}</div>;
}
```

### 4. 处理错误情况

```tsx
// lib/data.ts
import { cache } from "react";

export const getUser = cache(async (userId: string) => {
  try {
    return await db.user.findById(userId);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("User not found");
  }
});

// app/page.tsx
import { notFound } from "next/navigation";

async function Page({ params }) {
  try {
    const user = await getUser(params.id);
    return <UserProfile user={user} />;
  } catch (error) {
    // 显示 404 页面
    notFound();
  }
}
```

### 5. 避免过度缓存

```tsx
// ❌ 不要缓存会变化的数据
import { cache } from "react";

// 错误：当前时间每次都应该不同
const getCurrentTime = cache(() => {
  return new Date();
});

// ✅ 只缓存相对稳定的数据
const getUser = cache(async (userId: string) => {
  return await db.user.findById(userId);
});

// ✅ 需要实时数据时，不使用 cache
async function RealTimeStats() {
  // 每次都重新获取
  const stats = await db.stats.getCurrent();
  return <div>{stats.activeUsers}</div>;
}
```

## 延伸阅读

- [React 官方文档 - cache](https://react.dev/reference/react/cache)
- [Next.js 官方文档 - Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
- [React Server Components Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Optimizing Data Fetching in RSC](https://vercel.com/blog/understanding-react-server-components)
