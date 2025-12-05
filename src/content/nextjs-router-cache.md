---
title: 路由缓存（Router Cache）如何工作？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入了解 Next.js 客户端路由缓存机制，掌握预取、缓存时长和手动控制方法
tags:
  - Next.js
  - Router Cache
  - 客户端缓存
  - 预取
estimatedTime: 20 分钟
keywords:
  - Router Cache
  - 客户端缓存
  - Prefetch
  - Next.js 导航
highlight: Router Cache 是唯一的客户端缓存，通过预取和缓存 RSC Payload 实现即时导航
order: 5
---

## 问题 1：Router Cache 是什么？

Router Cache 是 Next.js 在客户端浏览器中维护的路由缓存。

### 核心特点

**1. 客户端缓存**

- 唯一运行在浏览器中的 Next.js 缓存
- 存储在内存中，不是 localStorage 或 sessionStorage
- 页面刷新后清空

**2. 缓存内容**

- RSC Payload（React Server Component 序列化数据）
- 不是完整的 HTML
- 包含组件树结构和数据

```javascript
// 用户访问流程
用户访问 /posts
  ↓
服务器返回 RSC Payload
  ↓
Router Cache 存储 /posts 的 Payload
  ↓
用户点击链接访问 /about
  ↓
Router Cache 存储 /about 的 Payload
  ↓
用户返回 /posts
  ↓
直接从 Router Cache 读取，即时显示
```

**3. 作用**

- 实现即时的前进/后退导航
- 避免重复的服务器请求
- 提升用户体验

---

## 问题 2：Router Cache 的缓存时长是多少？

缓存时长取决于路由类型和预取方式。

### 默认缓存时长

**静态路由**：5 分钟

```javascript
// app/about/page.tsx
export default function AboutPage() {
  return <div>关于我们</div>;
}

// 这个页面的 RSC Payload 会被缓存 5 分钟
```

**动态路由**：30 秒

```javascript
// app/posts/[id]/page.tsx
export const dynamic = "force-dynamic";

export default async function PostPage({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    cache: "no-store",
  }).then((r) => r.json());

  return <article>{post.title}</article>;
}

// 这个页面的 RSC Payload 会被缓存 30 秒
```

### 缓存时长的影响因素

**1. 路由类型**

- 静态渲染：5 分钟
- 动态渲染：30 秒

**2. 预取方式**

```javascript
import Link from 'next/link';

// 自动预取（默认）- 使用默认缓存时长
<Link href="/posts">文章</Link>

// 禁用预取 - 访问时才缓存
<Link href="/admin" prefetch={false}>管理</Link>

// 手动预取
const router = useRouter();
router.prefetch('/posts'); // 使用默认缓存时长
```

**3. 用户行为**

```javascript
// 场景 1：通过 Link 导航
<Link href="/posts">文章</Link>
// 缓存时长：5 分钟或 30 秒

// 场景 2：浏览器前进/后退
// 缓存时长：与原始访问相同

// 场景 3：刷新页面
// 缓存被清空，重新开始
```

---

## 问题 3：预取（Prefetch）如何工作？

Next.js 会自动预取可见的链接，提前加载数据。

### 自动预取

**触发条件**：

- `<Link>` 组件进入视口
- 默认开启（`prefetch={true}`）

```javascript
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      {/* 这些链接会被自动预取 */}
      <Link href="/posts">文章</Link>
      <Link href="/about">关于</Link>

      {/* 禁用预取 */}
      <Link href="/admin" prefetch={false}>
        管理
      </Link>
    </nav>
  );
}

// 工作流程：
// 1. 页面加载，Link 组件渲染
// 2. Link 进入视口（用户可见）
// 3. Next.js 在后台请求 /posts 和 /about 的 RSC Payload
// 4. 数据存入 Router Cache
// 5. 用户点击链接时，即时显示（从缓存读取）
```

### 预取行为差异

**开发环境 vs 生产环境**：

```javascript
// 开发环境（next dev）
<Link href="/posts">文章</Link>
// 只在点击时才加载

// 生产环境（next build + next start）
<Link href="/posts">文章</Link>
// Link 进入视口时自动预取
```

### 手动预取

使用 `useRouter` 手动控制预取：

```javascript
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Component() {
  const router = useRouter();

  useEffect(() => {
    // 预取重要路由
    router.prefetch("/posts");
    router.prefetch("/dashboard");
  }, [router]);

  return (
    <button
      onClick={() => {
        // 点击时即时导航（已预取）
        router.push("/posts");
      }}
    >
      查看文章
    </button>
  );
}
```

### 预取策略

```javascript
"use client";

import Link from "next/link";

export default function SmartNavigation() {
  return (
    <div>
      {/* 高优先级：自动预取 */}
      <Link href="/posts">文章列表</Link>

      {/* 低优先级：禁用预取 */}
      <Link href="/archive" prefetch={false}>
        归档
      </Link>

      {/* 条件预取 */}
      <Link href="/premium" prefetch={user?.isPremium ? true : false}>
        高级功能
      </Link>
    </div>
  );
}
```

---

## 问题 4：如何手动控制 Router Cache？

Next.js 提供了几个 API 来控制客户端缓存。

### router.refresh()

刷新当前路由，清除缓存并重新获取：

```javascript
"use client";

import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        // 清除当前路由的 Router Cache
        // 重新从服务器获取数据
        router.refresh();
      }}
    >
      刷新数据
    </button>
  );
}

// 使用场景：
// - 用户提交表单后刷新页面数据
// - 定时刷新实时数据
// - 手动触发数据更新
```

### router.push() 和 router.replace()

导航到新路由：

```javascript
"use client";

import { useRouter } from "next/navigation";

export default function NavigationButtons() {
  const router = useRouter();

  return (
    <div>
      <button
        onClick={() => {
          // 导航到新路由（可以后退）
          router.push("/posts");
        }}
      >
        查看文章
      </button>

      <button
        onClick={() => {
          // 替换当前路由（不能后退）
          router.replace("/login");
        }}
      >
        登录
      </button>

      <button
        onClick={() => {
          // 返回上一页（使用 Router Cache）
          router.back();
        }}
      >
        返回
      </button>
    </div>
  );
}
```

### 服务器端清除缓存

通过 Server Actions 触发客户端刷新：

```javascript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updatePost(id: string, data: any) {
  // 更新数据
  await fetch(`https://api.example.com/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  // 清除服务器端缓存
  revalidatePath(`/posts/${id}`);

  // 这会自动触发客户端的 router.refresh()
  // Router Cache 也会被清除
}

// app/posts/[id]/edit/page.tsx
("use client");

import { updatePost } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function EditPage({ params }) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await updatePost(params.id, {
      title: formData.get("title"),
    });

    // revalidatePath 会自动刷新客户端
    // 也可以手动调用 router.refresh()
    router.push(`/posts/${params.id}`);
  }

  return <form action={handleSubmit}>{/* ... */}</form>;
}
```

---

## 问题 5：Router Cache 的常见问题和解决方案

### 问题 1：数据不更新

**现象**：修改数据后，页面显示旧数据

```javascript
// ❌ 问题代码
'use client';

export default function PostPage() {
  async function deletePost() {
    await fetch('/api/posts/1', { method: 'DELETE' });
    // 数据已删除，但页面仍显示旧内容
  }

  return <button onClick={deletePost}>删除</button>;
}

// ✅ 解决方案 1：使用 router.refresh()
'use client';

import { useRouter } from 'next/navigation';

export default function PostPage() {
  const router = useRouter();

  async function deletePost() {
    await fetch('/api/posts/1', { method: 'DELETE' });
    router.refresh(); // 刷新当前页面
  }

  return <button onClick={deletePost}>删除</button>;
}

// ✅ 解决方案 2：使用 Server Action
'use server';

import { revalidatePath } from 'next/cache';

export async function deletePost(id: string) {
  await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  revalidatePath('/posts'); // 自动刷新客户端
}
```

### 问题 2：缓存时间过长

**现象**：动态数据被缓存 30 秒，需要更实时的更新

```javascript
// ✅ 解决方案：定时刷新
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RealtimePage() {
  const router = useRouter();

  useEffect(() => {
    // 每 10 秒刷新一次
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  return <div>实时数据</div>;
}
```

### 问题 3：预取消耗过多带宽

**现象**：页面有大量链接，预取导致网络请求过多

```javascript
// ✅ 解决方案：选择性预取
import Link from "next/link";

export default function PostList({ posts }) {
  return (
    <div>
      {posts.map((post, index) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          // 只预取前 5 个
          prefetch={index < 5}
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}
```

---

## 总结

**核心概念总结**：

### 1. Router Cache 特点

- 唯一的客户端缓存，存储在浏览器内存中
- 缓存 RSC Payload，不是完整 HTML
- 页面刷新后清空

### 2. 缓存时长

- 静态路由：5 分钟
- 动态路由：30 秒
- 可通过 `router.refresh()` 手动清除

### 3. 预取机制

- `<Link>` 组件自动预取（生产环境）
- 进入视口时触发预取
- 可通过 `prefetch={false}` 禁用

### 4. 控制方法

- `router.refresh()`：刷新当前路由
- `router.push()`/`router.replace()`：导航到新路由
- `revalidatePath()`：服务器端触发客户端刷新

## 延伸阅读

- [Router Cache 官方文档](https://nextjs.org/docs/app/building-your-application/caching#router-cache)
- [useRouter Hook](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
