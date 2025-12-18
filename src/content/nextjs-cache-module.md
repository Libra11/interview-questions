---
title: next/cache 的作用是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面讲解 Next.js next/cache 模块提供的缓存控制函数，包括 revalidatePath、revalidateTag 和 unstable_cache 等核心 API。
tags:
  - Next.js
  - 缓存
  - revalidate
  - next/cache
estimatedTime: 20 分钟
keywords:
  - next/cache
  - revalidatePath
  - revalidateTag
  - Next.js 缓存
highlight: next/cache 模块提供了强大的缓存控制能力，是 Next.js 缓存系统的核心
order: 210
---

## 问题 1：next/cache 模块提供了哪些功能？

next/cache 是 Next.js 提供的缓存控制模块，包含多个用于管理缓存的函数。

### 核心 API

```tsx
import {
  revalidatePath, // 重新验证路径
  revalidateTag, // 重新验证标签
  unstable_cache, // 缓存函数结果
  unstable_noStore, // 禁用缓存
} from "next/cache";
```

### 基本使用

```tsx
// app/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  // 创建文章
  await db.posts.create({
    data: {
      title: formData.get("title"),
      content: formData.get("content"),
    },
  });

  // 重新验证路径
  revalidatePath("/posts");

  // 重新验证标签
  revalidateTag("posts");

  return { success: true };
}
```

---

## 问题 2：revalidatePath 如何使用？

`revalidatePath` 用于重新验证特定路径的缓存。

### 基本用法

```tsx
"use server";

import { revalidatePath } from "next/cache";

export async function updatePost(postId: string, data: any) {
  await db.posts.update({
    where: { id: postId },
    data,
  });

  // 重新验证单个路径
  revalidatePath(`/posts/${postId}`);

  return { success: true };
}
```

### 重新验证多个路径

```tsx
"use server";

import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  await db.posts.delete({
    where: { id: postId },
  });

  // 重新验证多个相关路径
  revalidatePath("/posts"); // 列表页
  revalidatePath(`/posts/${postId}`); // 详情页
  revalidatePath("/"); // 首页

  return { success: true };
}
```

### 路径类型选项

```tsx
"use server";

import { revalidatePath } from "next/cache";

export async function updateCategory(categoryId: string) {
  await db.categories.update({
    where: { id: categoryId },
    data: {
      /* ... */
    },
  });

  // 重新验证特定页面
  revalidatePath("/categories", "page");

  // 重新验证整个路由段（包括所有子路径）
  revalidatePath("/categories", "layout");

  /**
   * 'page' vs 'layout':
   *
   * revalidatePath('/blog', 'page')
   * - 只重新验证 /blog 页面
   *
   * revalidatePath('/blog', 'layout')
   * - 重新验证 /blog 及其所有子路径
   * - /blog, /blog/post-1, /blog/post-2, etc.
   */
}
```

---

## 问题 3：revalidateTag 如何使用？

`revalidateTag` 用于重新验证带有特定标签的所有缓存。

### 基本用法

```tsx
// 在 fetch 请求中添加标签
async function getPosts() {
  const posts = await fetch("https://api.example.com/posts", {
    next: {
      tags: ["posts", "blog"],
    },
  }).then((res) => res.json());

  return posts;
}

async function getComments() {
  const comments = await fetch("https://api.example.com/comments", {
    next: {
      tags: ["comments", "blog"],
    },
  }).then((res) => res.json());

  return comments;
}

// 在 Server Action 中重新验证
("use server");

import { revalidateTag } from "next/cache";

export async function createPost() {
  await db.posts.create({
    /* ... */
  });

  // 重新验证所有带 'posts' 标签的请求
  revalidateTag("posts");
}

export async function updateBlogSettings() {
  await db.settings.update({
    /* ... */
  });

  // 重新验证所有带 'blog' 标签的请求
  // 包括 posts 和 comments
  revalidateTag("blog");
}
```

### 使用多个标签

```tsx
// 为不同类型的数据添加不同标签
async function getPostWithDetails(postId: string) {
  const post = await fetch(`https://api.example.com/posts/${postId}`, {
    next: {
      tags: ["posts", `post-${postId}`, "blog"],
    },
  }).then((res) => res.json());

  return post;
}

// 精确控制重新验证
("use server");

import { revalidateTag } from "next/cache";

export async function updatePost(postId: string) {
  await db.posts.update({
    /* ... */
  });

  // 只重新验证这一篇文章
  revalidateTag(`post-${postId}`);
}

export async function updateAllPosts() {
  await db.posts.updateMany({
    /* ... */
  });

  // 重新验证所有文章
  revalidateTag("posts");
}
```

### 标签命名策略

```tsx
/**
 * 推荐的标签命名策略：
 *
 * 1. 资源类型标签
 *    - 'posts', 'users', 'comments'
 *
 * 2. 特定资源标签
 *    - 'post-123', 'user-456'
 *
 * 3. 功能模块标签
 *    - 'blog', 'dashboard', 'admin'
 *
 * 4. 关系标签
 *    - 'user-123-posts', 'post-123-comments'
 */

// 示例
async function getUserWithPosts(userId: string) {
  const user = await fetch(`https://api.example.com/users/${userId}`, {
    next: {
      tags: [
        "users", // 资源类型
        `user-${userId}`, // 特定资源
        "profile", // 功能模块
      ],
    },
  }).then((res) => res.json());

  const posts = await fetch(`https://api.example.com/users/${userId}/posts`, {
    next: {
      tags: [
        "posts",
        `user-${userId}-posts`, // 关系标签
        "profile",
      ],
    },
  }).then((res) => res.json());

  return { user, posts };
}

// 重新验证策略
("use server");

export async function updateUserProfile(userId: string) {
  await db.users.update({
    /* ... */
  });

  // 只重新验证这个用户的数据
  revalidateTag(`user-${userId}`);
}

export async function updateUserPost(userId: string, postId: string) {
  await db.posts.update({
    /* ... */
  });

  // 重新验证用户的所有文章
  revalidateTag(`user-${userId}-posts`);
}
```

---

## 问题 4：unstable_cache 和 unstable_noStore 的作用

这两个函数用于更细粒度的缓存控制。

### unstable_cache - 缓存函数结果

```tsx
import { unstable_cache } from "next/cache";

// 缓存函数结果
const getCachedUser = unstable_cache(
  async (userId: string) => {
    console.log("Fetching user:", userId);
    return await db.user.findUnique({
      where: { id: userId },
    });
  },
  ["user"], // 缓存键
  {
    revalidate: 3600, // 1 小时后重新验证
    tags: ["users"], // 缓存标签
  }
);

// 使用
async function Page({ params }) {
  const user = await getCachedUser(params.id);
  return <div>{user.name}</div>;
}

/**
 * 优势：
 * - 缓存数据库查询结果
 * - 减少数据库负载
 * - 支持重新验证
 */
```

### unstable_noStore - 禁用缓存

```tsx
import { unstable_noStore } from "next/cache";

async function DynamicComponent() {
  // 禁用这个组件的缓存
  unstable_noStore();

  // 这些数据不会被缓存
  const currentTime = new Date();
  const randomNumber = Math.random();

  return (
    <div>
      <p>Time: {currentTime.toISOString()}</p>
      <p>Random: {randomNumber}</p>
    </div>
  );
}

/**
 * 使用场景：
 * - 需要实时数据
 * - 个性化内容
 * - 随机内容
 */
```

### 完整示例

```tsx
// lib/cache.ts
import { unstable_cache } from "next/cache";
import { db } from "./db";

// 缓存用户数据
export const getCachedUser = unstable_cache(
  async (userId: string) => {
    return await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });
  },
  ["user"],
  {
    revalidate: 3600,
    tags: ["users"],
  }
);

// 缓存文章列表
export const getCachedPosts = unstable_cache(
  async (category?: string) => {
    return await db.post.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },
  ["posts"],
  {
    revalidate: 300,
    tags: ["posts"],
  }
);

// app/posts/page.tsx
import { getCachedPosts } from "@/lib/cache";
import { unstable_noStore } from "next/cache";

async function PostsPage({ searchParams }) {
  // 文章列表使用缓存
  const posts = await getCachedPosts(searchParams.category);

  // 用户特定数据不缓存
  unstable_noStore();
  const session = await getSession();

  return (
    <div>
      <h1>Posts</h1>
      {session && <p>Welcome, {session.user.name}</p>}

      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  );
}

// app/actions/posts.ts
("use server");

import { revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({
    data: {
      title: formData.get("title"),
      content: formData.get("content"),
    },
  });

  // 重新验证缓存的文章列表
  revalidateTag("posts");

  return { success: true };
}

export async function updateUser(userId: string, data: any) {
  await db.user.update({
    where: { id: userId },
    data,
  });

  // 重新验证缓存的用户数据
  revalidateTag("users");

  return { success: true };
}
```

### 最佳实践总结

```tsx
/**
 * 何时使用 revalidatePath：
 * ✅ 更新影响特定页面
 * ✅ 需要重新生成静态页面
 * ✅ 路径明确且有限
 *
 * 何时使用 revalidateTag：
 * ✅ 更新影响多个页面
 * ✅ 需要重新验证 fetch 请求
 * ✅ 数据关系复杂
 *
 * 何时使用 unstable_cache：
 * ✅ 缓存数据库查询
 * ✅ 缓存计算结果
 * ✅ 需要细粒度控制
 *
 * 何时使用 unstable_noStore：
 * ✅ 需要实时数据
 * ✅ 个性化内容
 * ✅ 禁用特定组件的缓存
 */

// 综合示例
"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

// 缓存热门文章
const getPopularPosts = unstable_cache(
  async () => {
    return await db.post.findMany({
      orderBy: { views: "desc" },
      take: 10,
    });
  },
  ["popular-posts"],
  {
    revalidate: 3600,
    tags: ["posts", "popular"],
  }
);

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get("title"),
      content: formData.get("content"),
    },
  });

  // 重新验证相关路径
  revalidatePath("/posts");
  revalidatePath("/", "layout"); // 重新验证首页及子页面

  // 重新验证相关标签
  revalidateTag("posts");
  revalidateTag("popular"); // 可能影响热门文章

  return { success: true, post };
}
```

## 延伸阅读

- [Next.js 官方文档 - next/cache](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 官方文档 - revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 官方文档 - revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Data Fetching and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
