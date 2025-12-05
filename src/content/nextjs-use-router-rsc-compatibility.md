---
title: useRouter 与 RSC 的兼容性问题？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 useRouter Hook 在 React Server Components 环境下的兼容性问题，学习如何正确使用 useRouter 以及 Server Components 中的导航替代方案。
tags:
  - Next.js
  - useRouter
  - React Server Components
  - 路由导航
estimatedTime: 20 分钟
keywords:
  - useRouter
  - RSC
  - Server Components
  - 路由导航
highlight: 掌握 useRouter 在 RSC 中的使用限制和正确的导航方式
order: 308
---

## 问题 1：useRouter 在 RSC 中有什么限制？

`useRouter` 是一个 Client Hook，只能在 Client Components 中使用，不能在 Server Components 中使用。

### 基本限制

```typescript
// ❌ 错误：不能在 Server Component 中使用
export default async function ServerPage() {
  const router = useRouter(); // 错误！
  return <div>...</div>;
}

// ✅ 正确：只能在 Client Component 中使用
("use client");

import { useRouter } from "next/navigation";

export default function ClientPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/dashboard");
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### useRouter 提供的方法

```typescript
"use client";

import { useRouter } from "next/navigation";

export default function NavigationExample() {
  const router = useRouter();

  return (
    <div>
      {/* 导航到新页面 */}
      <button onClick={() => router.push("/about")}>Push to About</button>

      {/* 替换当前页面（不添加历史记录） */}
      <button onClick={() => router.replace("/login")}>
        Replace with Login
      </button>

      {/* 返回上一页 */}
      <button onClick={() => router.back()}>Go Back</button>

      {/* 前进到下一页 */}
      <button onClick={() => router.forward()}>Go Forward</button>

      {/* 刷新当前路由 */}
      <button onClick={() => router.refresh()}>Refresh</button>

      {/* 预取页面 */}
      <button onClick={() => router.prefetch("/products")}>
        Prefetch Products
      </button>
    </div>
  );
}
```

---

## 问题 2：Server Components 中如何实现导航？

Server Components 不能使用 useRouter，需要使用其他方式实现导航。

### 方法 1：使用 Link 组件

```typescript
// Server Component 中使用 Link
import Link from "next/link";

export default async function ServerPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <div key={post.id}>
          {/* ✅ 使用 Link 组件进行导航 */}
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </div>
      ))}

      {/* 带查询参数的导航 */}
      <Link href="/search?q=nextjs">Search Next.js</Link>

      {/* 使用对象形式 */}
      <Link
        href={{
          pathname: "/products",
          query: { category: "electronics", sort: "price" },
        }}
      >
        Electronics
      </Link>
    </div>
  );
}
```

### 方法 2：使用 redirect 函数

```typescript
// Server Component 或 Server Action 中使用 redirect
import { redirect } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

  // 如果用户不存在，重定向到 404
  if (!user) {
    redirect("/404");
  }

  // 如果用户未激活，重定向到激活页面
  if (!user.isActive) {
    redirect(`/activate?userId=${id}`);
  }

  return <div>Welcome, {user.name}</div>;
}

// 在 Server Action 中使用
("use server");

import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const post = await savePost(formData);

  // 创建成功后重定向到文章页面
  redirect(`/posts/${post.slug}`);
}
```

### 方法 3：使用 permanentRedirect

```typescript
// 永久重定向（301）
import { permanentRedirect } from "next/navigation";

export default async function OldPage() {
  // 页面已永久移动到新地址
  permanentRedirect("/new-page");
}

// 使用场景：URL 结构变更
export default async function LegacyBlogPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 旧的 URL 格式：/blog/123
  // 新的 URL 格式：/posts/post-title-123
  const post = await getPost(id);

  if (post) {
    permanentRedirect(`/posts/${post.slug}`);
  }

  return <div>Post not found</div>;
}
```

---

## 问题 3：如何在 Server 和 Client 之间协调导航？

实际应用中，常需要在 Server 和 Client Components 之间协调导航逻辑。

### 模式 1：Server Component + Client Component 组合

```typescript
// app/posts/page.tsx - Server Component
import PostList from "./PostList";
import CreatePostButton from "./CreatePostButton";

export default async function PostsPage() {
  // 服务端获取数据
  const posts = await getPosts();

  return (
    <div>
      <h1>Blog Posts</h1>
      {/* Server Component 渲染列表 */}
      <PostList posts={posts} />
      {/* Client Component 处理交互 */}
      <CreatePostButton />
    </div>
  );
}

// PostList.tsx - Server Component
import Link from "next/link";

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {/* 使用 Link 进行导航 */}
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

// CreatePostButton.tsx - Client Component
("use client");

import { useRouter } from "next/navigation";

export default function CreatePostButton() {
  const router = useRouter();

  const handleCreate = async () => {
    // 客户端逻辑
    const confirmed = confirm("Create new post?");
    if (confirmed) {
      router.push("/posts/new");
    }
  };

  return <button onClick={handleCreate}>Create Post</button>;
}
```

### 模式 2：Server Action + Client Component

```typescript
// actions.ts - Server Action
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } });

  // 重新验证缓存
  revalidatePath("/posts");

  // 重定向到列表页
  redirect("/posts");
}

// DeletePostButton.tsx - Client Component
("use client");

import { deletePost } from "./actions";
import { useTransition } from "react";

export default function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      startTransition(async () => {
        // 调用 Server Action，会自动处理重定向
        await deletePost(postId);
      });
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
```

### 模式 3：条件导航

```typescript
// app/checkout/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  // 服务端检查认证状态
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");

  if (!authToken) {
    // 未登录，重定向到登录页
    redirect("/login?redirect=/checkout");
  }

  // 检查购物车
  const cart = await getCart(authToken.value);

  if (cart.items.length === 0) {
    // 购物车为空，重定向到商品页
    redirect("/products");
  }

  // 都通过，显示结账页面
  return <CheckoutForm cart={cart} />;
}

// CheckoutForm.tsx - Client Component
("use client");

import { useRouter } from "next/navigation";

export default function CheckoutForm({ cart }: { cart: Cart }) {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const order = await createOrder(cart);
      // 客户端导航到订单确认页
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## 问题 4：useRouter 的常见使用场景和最佳实践？

了解常见场景可以帮助我们更好地选择合适的导航方式。

### 场景 1：表单提交后导航

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreatePostForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const post = await response.json();

      // 提交成功，导航到新文章页面
      router.push(`/posts/${post.slug}`);

      // 或者刷新当前页面
      // router.refresh();
    } catch (error) {
      console.error("Failed to create post:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
```

### 场景 2：编程式导航与查询参数

```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // 更新 URL 但不刷新页面
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <select
        value={searchParams.get("category") || ""}
        onChange={(e) => updateFilter("category", e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>

      <select
        value={searchParams.get("sort") || "date"}
        onChange={(e) => updateFilter("sort", e.target.value)}
      >
        <option value="date">Date</option>
        <option value="price">Price</option>
        <option value="name">Name</option>
      </select>
    </div>
  );
}
```

### 场景 3：条件导航和权限检查

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    // 客户端检查认证状态
    const checkAuth = async () => {
      const response = await fetch("/api/auth/check");
      const { authenticated } = await response.json();

      if (!authenticated) {
        // 未认证，重定向到登录页
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return <div>Protected Content</div>;
}
```

### 场景 4：预取优化

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 预取可能访问的页面
    router.prefetch("/dashboard");
    router.prefetch("/products");
  }, [router]);

  return (
    <div>
      <h1>Welcome</h1>
      <button onClick={() => router.push("/dashboard")}>
        Go to Dashboard (Prefetched)
      </button>
    </div>
  );
}
```

### 最佳实践总结

```typescript
// ✅ 推荐：优先使用 Link 组件
import Link from "next/link";

<Link href="/about">About</Link>;

// ✅ 推荐：Server Component 中使用 redirect
import { redirect } from "next/navigation";

if (!user) {
  redirect("/login");
}

// ✅ 推荐：Client Component 中使用 useRouter 处理交互
("use client");
const router = useRouter();
const handleClick = () => router.push("/dashboard");

// ❌ 避免：在 Server Component 中使用 useRouter
// Server Component 中不能使用 useRouter

// ❌ 避免：过度使用编程式导航
// 能用 Link 就用 Link，更好的 SEO 和可访问性
```

## 总结

**核心概念总结**：

### 1. useRouter 的限制

- 只能在 Client Components 中使用
- 不能在 Server Components 中使用
- 提供编程式导航能力

### 2. Server Components 的替代方案

- 使用 `Link` 组件进行声明式导航
- 使用 `redirect` 函数进行服务端重定向
- 使用 `permanentRedirect` 进行永久重定向

### 3. 最佳实践

- 优先使用 Link 组件
- Server Components 中使用 redirect
- Client Components 中使用 useRouter 处理交互
- 合理组合 Server 和 Client Components

## 延伸阅读

- [Next.js useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Next.js Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js redirect](https://nextjs.org/docs/app/api-reference/functions/redirect)
- [Next.js Navigation](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating)
