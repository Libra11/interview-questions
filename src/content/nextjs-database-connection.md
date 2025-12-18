---
title: Next.js 如何连接数据库（例如 Prisma + Postgres）？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js 应用中连接和使用数据库，包括 Prisma ORM 的配置、数据库连接池管理、以及在 Server Components 和 Route Handlers 中查询数据的最佳实践。
tags:
  - Next.js
  - Prisma
  - PostgreSQL
  - 数据库
estimatedTime: 25 分钟
keywords:
  - Next.js 数据库
  - Prisma
  - PostgreSQL
  - ORM
highlight: 掌握在 Next.js 中使用 Prisma 连接数据库的完整方案
order: 698
---

## 问题 1：如何在 Next.js 中设置 Prisma 和 PostgreSQL？

Prisma 是 Next.js 推荐的 ORM，提供类型安全的数据库访问。

### 安装和初始化

```bash
# 安装 Prisma
npm install prisma @prisma/client

# 初始化 Prisma
npx prisma init
```

### 配置数据库连接

```env
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
```

### 定义数据模型

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}
```

### 生成 Prisma Client

```bash
# 创建数据库表
npx prisma db push

# 或使用迁移
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate
```

---

## 问题 2：如何正确创建和使用 Prisma Client 实例？

在 Next.js 中需要特别注意 Prisma Client 的实例化，避免开发环境中的连接泄漏。

### 创建单例 Prisma Client

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 导出类型
export type { User, Post } from "@prisma/client";
```

### 为什么需要单例模式？

```typescript
// ❌ 错误：每次导入都创建新实例
// lib/prisma-wrong.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// 问题：开发环境热重载会创建多个连接
// 导致 "Too many connections" 错误

// ✅ 正确：使用全局单例
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## 问题 3：如何在 Server Components 中查询数据库？

Server Components 可以直接使用 Prisma Client 查询数据库。

### 基本查询

```typescript
// app/posts/page.tsx
import { prisma } from "@/lib/prisma";

export default async function PostsPage() {
  // 直接在 Server Component 中查询
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>By {post.author.name}</p>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}
```

### 动态路由查询

```typescript
// app/posts/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author.name}</p>
      <div>{post.content}</div>
    </article>
  );
}

// 生成静态参数
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { id: true },
  });

  return posts.map((post) => ({
    id: post.id,
  }));
}
```

### 并行查询

```typescript
// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  // 并行执行多个查询
  const [users, posts, stats] = await Promise.all([
    prisma.user.findMany({ take: 5 }),
    prisma.post.findMany({ take: 5 }),
    prisma.post.aggregate({
      _count: true,
      _avg: { authorId: true },
    }),
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <section>
        <h2>Recent Users ({users.length})</h2>
        {/* 渲染用户 */}
      </section>
      <section>
        <h2>Recent Posts ({posts.length})</h2>
        {/* 渲染文章 */}
      </section>
      <section>
        <h2>Stats</h2>
        <p>Total posts: {stats._count}</p>
      </section>
    </div>
  );
}
```

---

## 问题 4：如何在 Route Handlers 和 Server Actions 中操作数据库？

Route Handlers 和 Server Actions 用于数据变更操作。

### Route Handler 中的 CRUD

```typescript
// app/api/posts/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        include: { author: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.post.count(),
    ]);

    return Response.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST - 创建文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, authorId } = body;

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
      },
      include: {
        author: true,
      },
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// app/api/posts/[id]/route.ts
type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT - 更新文章
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const post = await prisma.post.update({
      where: { id },
      data: body,
      include: { author: true },
    });

    return Response.json(post);
  } catch (error) {
    return Response.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE - 删除文章
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.post.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
```

### Server Actions 中的数据操作

```typescript
// app/actions/posts.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const authorId = formData.get("authorId") as string;

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
      },
    });

    revalidatePath("/posts");
    redirect(`/posts/${post.id}`);
  } catch (error) {
    return { error: "Failed to create post" };
  }
}

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  try {
    await prisma.post.update({
      where: { id },
      data: { title, content },
    });

    revalidatePath(`/posts/${id}`);
    revalidatePath("/posts");

    return { success: true };
  } catch (error) {
    return { error: "Failed to update post" };
  }
}

export async function deletePost(id: string) {
  try {
    await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/posts");
    redirect("/posts");
  } catch (error) {
    return { error: "Failed to delete post" };
  }
}

export async function togglePublish(id: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { published: true },
    });

    if (!post) {
      return { error: "Post not found" };
    }

    await prisma.post.update({
      where: { id },
      data: { published: !post.published },
    });

    revalidatePath(`/posts/${id}`);
    revalidatePath("/posts");

    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle publish status" };
  }
}
```

### 使用 Server Actions 的表单

```typescript
// app/posts/new/page.tsx
import { createPost } from "@/app/actions/posts";

export default function NewPostPage() {
  return (
    <div>
      <h1>Create New Post</h1>
      <form action={createPost}>
        <input type="hidden" name="authorId" value="user-id" />

        <div>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" required />
        </div>

        <div>
          <label htmlFor="content">Content</label>
          <textarea id="content" name="content" required />
        </div>

        <button type="submit">Create Post</button>
      </form>
    </div>
  );
}
```

### 事务处理

```typescript
// app/actions/users.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function createUserWithPost(
  userData: { email: string; name: string },
  postData: { title: string; content: string }
) {
  try {
    // 使用事务确保原子性
    const result = await prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: userData,
      });

      // 创建文章
      const post = await tx.post.create({
        data: {
          ...postData,
          authorId: user.id,
        },
      });

      return { user, post };
    });

    return { success: true, data: result };
  } catch (error) {
    return { error: "Transaction failed" };
  }
}
```

## 总结

**核心概念总结**：

### 1. Prisma 设置

- 使用单例模式创建 Prisma Client
- 避免开发环境连接泄漏
- 配置适当的日志级别

### 2. 数据查询

- Server Components 中直接查询
- 使用 Promise.all 并行查询
- 合理使用 include 和 select

### 3. 数据变更

- Route Handlers 用于 RESTful API
- Server Actions 用于表单和内部操作
- 使用事务保证数据一致性

## 延伸阅读

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js with Prisma](https://www.prisma.io/nextjs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
