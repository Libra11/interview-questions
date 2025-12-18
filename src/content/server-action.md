---
title: 什么是 Server Action？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面讲解 Next.js Server Action 的概念、工作原理和使用场景，理解这一革命性的服务器端数据变更机制。
tags:
  - Next.js
  - Server Action
  - React
  - 表单处理
estimatedTime: 25 分钟
keywords:
  - Server Action
  - Next.js
  - 服务器端操作
  - 表单提交
highlight: Server Action 是 Next.js 提供的服务器端数据变更机制，简化了表单处理和数据更新
order: 186
---

## 问题 1：Server Action 的基本概念是什么？

Server Action 是 Next.js 提供的一种在服务器端执行异步操作的机制，主要用于处理表单提交和数据变更。

### 基本定义

```tsx
// app/actions.ts
"use server"; // 声明这是 Server Action 文件

export async function createPost(formData: FormData) {
  // 这个函数在服务器端执行
  const title = formData.get("title");
  const content = formData.get("content");

  // 直接访问数据库
  const post = await db.posts.create({
    data: { title, content },
  });

  return { success: true, post };
}
```

### 在表单中使用

```tsx
// app/posts/new/page.tsx
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}

/**
 * 工作流程：
 * 1. 用户填写表单并提交
 * 2. 表单数据发送到服务器
 * 3. createPost 在服务器端执行
 * 4. 直接操作数据库
 * 5. 返回结果给客户端
 *
 * 优势：
 * - 不需要创建 API 路由
 * - 自动处理序列化
 * - 类型安全
 */
```

---

## 问题 2：Server Action 与传统 API 路由有什么区别？

Server Action 提供了比传统 API 路由更简洁的数据变更方式。

### 传统 API 路由方式

```tsx
// app/api/posts/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // 验证数据
  if (!body.title || !body.content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // 操作数据库
  const post = await db.posts.create({
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return Response.json({ post });
}

// app/posts/new/page.tsx
("use client");

import { useState } from "react";

export default function NewPostPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = {
      title: formData.get("title"),
      content: formData.get("content"),
    };

    // 调用 API
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      <textarea name="content" />
      <button disabled={loading}>{loading ? "Creating..." : "Create"}</button>
    </form>
  );
}

/**
 * 问题：
 * 1. 需要创建单独的 API 路由
 * 2. 需要手动处理请求和响应
 * 3. 需要 Client Component 来处理表单
 * 4. 需要管理加载状态
 * 5. 需要手动序列化数据
 */
```

### Server Action 方式

```tsx
// app/actions.ts
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title");
  const content = formData.get("content");

  // 验证数据
  if (!title || !content) {
    return { error: "Missing fields" };
  }

  // 操作数据库
  const post = await db.posts.create({
    data: { title, content },
  });

  // 重新验证页面
  revalidatePath("/posts");

  // 重定向到新文章
  redirect(`/posts/${post.id}`);
}

// app/posts/new/page.tsx (Server Component)
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  );
}

/**
 * 优势：
 * 1. 不需要 API 路由
 * 2. 不需要 Client Component
 * 3. 不需要手动管理加载状态（浏览器原生支持）
 * 4. 自动处理序列化
 * 5. 代码更简洁
 */
```

### 对比总结

| 特性                  | API 路由             | Server Action      |
| --------------------- | -------------------- | ------------------ |
| 需要单独文件          | ✅ 是                | ❌ 否              |
| 需要 Client Component | ✅ 是                | ❌ 否              |
| 手动序列化            | ✅ 是                | ❌ 否              |
| 类型安全              | ⚠️ 需要额外配置      | ✅ 原生支持        |
| 代码量                | 多                   | 少                 |
| 适用场景              | 复杂 API、第三方调用 | 表单提交、数据变更 |

---

## 问题 3：Server Action 可以在哪里使用？

Server Action 可以在多种场景中使用，不仅限于表单。

### 1. 表单 action 属性

```tsx
// 最常见的用法
export default function Page() {
  return (
    <form action={serverAction}>
      <input name="email" type="email" />
      <button type="submit">Subscribe</button>
    </form>
  );
}
```

### 2. Client Component 中调用

```tsx
// app/actions.ts
"use server";

export async function updateProfile(data: { name: string; bio: string }) {
  await db.user.update({
    where: { id: "current-user" },
    data,
  });

  revalidatePath("/profile");
}

// app/components/ProfileForm.tsx
("use client");

import { useState } from "react";
import { updateProfile } from "@/app/actions";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 在 Client Component 中调用 Server Action
    await updateProfile({ name, bio });

    alert("Profile updated!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      <button type="submit">Update</button>
    </form>
  );
}
```

### 3. 事件处理器中调用

```tsx
// app/actions.ts
"use server";

export async function deletePost(postId: string) {
  await db.posts.delete({
    where: { id: postId },
  });

  revalidatePath("/posts");
}

// app/components/DeleteButton.tsx
("use client");

import { deletePost } from "@/app/actions";

export function DeleteButton({ postId }) {
  const handleClick = async () => {
    if (confirm("Are you sure?")) {
      // 在点击事件中调用 Server Action
      await deletePost(postId);
    }
  };

  return <button onClick={handleClick}>Delete</button>;
}
```

### 4. useTransition 中调用

```tsx
// app/components/LikeButton.tsx
"use client";

import { useTransition } from "react";
import { likePost } from "@/app/actions";

export function LikeButton({ postId, initialLikes }) {
  const [isPending, startTransition] = useTransition();
  const [likes, setLikes] = useState(initialLikes);

  const handleLike = () => {
    // 乐观更新
    setLikes(likes + 1);

    // 在 transition 中调用 Server Action
    startTransition(async () => {
      await likePost(postId);
    });
  };

  return (
    <button onClick={handleLike} disabled={isPending}>
      ❤️ {likes} {isPending && "..."}
    </button>
  );
}
```

---

## 问题 4：Server Action 的核心特性有哪些？

Server Action 提供了多个强大的特性。

### 1. 自动序列化和反序列化

```tsx
// app/actions.ts
"use server";

// 可以接收和返回复杂对象
export async function createUser(data: {
  name: string;
  email: string;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}) {
  const user = await db.user.create({ data });

  // 返回的对象会自动序列化
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt, // Date 会被序列化
    },
  };
}

// 客户端调用
const result = await createUser({
  name: "John",
  email: "john@example.com",
  preferences: {
    theme: "dark",
    notifications: true,
  },
});

console.log(result.user.createdAt); // 字符串（已序列化）
```

### 2. 内置安全性

```tsx
// Server Action 自动包含 CSRF 保护
"use server";

export async function sensitiveOperation() {
  // Next.js 自动验证请求来源
  // 防止 CSRF 攻击

  await db.performSensitiveOperation();
}
```

### 3. 渐进增强

```tsx
// 即使 JavaScript 未加载，表单仍然可以工作
export default function Page() {
  return (
    <form action={createPost}>
      {/* 没有 JavaScript 时，表单会正常提交 */}
      {/* 有 JavaScript 时，使用 AJAX 提交 */}
      <input name="title" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 4. 错误处理

```tsx
// app/actions.ts
"use server";

export async function createPost(formData: FormData) {
  try {
    const title = formData.get("title");

    if (!title) {
      // 返回错误信息
      return { error: "Title is required" };
    }

    const post = await db.posts.create({
      data: { title },
    });

    revalidatePath("/posts");
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { error: "Failed to create post" };
  }
}

// app/components/PostForm.tsx
("use client");

import { useFormState } from "react-dom";
import { createPost } from "@/app/actions";

export function PostForm() {
  const [state, formAction] = useFormState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" />

      {/* 显示错误信息 */}
      {state?.error && <p className="error">{state.error}</p>}

      {/* 显示成功信息 */}
      {state?.success && <p className="success">Post created!</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 5. 重新验证和重定向

```tsx
// app/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const post = await db.posts.create({
    data: {
      title: formData.get("title"),
      content: formData.get("content"),
    },
  });

  // 重新验证特定路径
  revalidatePath("/posts");

  // 重新验证特定标签
  revalidateTag("posts");

  // 重定向到新页面
  redirect(`/posts/${post.id}`);
}
```

## 延伸阅读

- [Next.js 官方文档 - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 官方文档 - Server Actions](https://react.dev/reference/react/use-server)
- [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Form Handling with Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)
