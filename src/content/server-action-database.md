---
title: Server Action 如何与数据库交互？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解如何在 Server Action 中进行数据库操作，包括 ORM 使用、事务处理和错误处理等最佳实践。
tags:
  - Next.js
  - Server Action
  - 数据库
  - Prisma
estimatedTime: 25 分钟
keywords:
  - Server Action
  - 数据库操作
  - Prisma
  - ORM
highlight: Server Action 可以直接访问数据库，无需中间层，简化数据操作流程
order: 201
---

## 问题 1：Server Action 如何连接数据库？

Server Action 在服务器端执行，可以直接使用数据库客户端进行操作。

### 使用 Prisma ORM

```tsx
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// app/actions/posts.ts
("use server");

import { db } from "@/lib/db";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // 直接使用 Prisma 客户端
  const post = await db.post.create({
    data: {
      title,
      content,
      published: false,
    },
  });

  return { success: true, post };
}

export async function getPosts() {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return posts;
}
```

### 使用原生 SQL

```tsx
"use server";

import { db } from "@/lib/db";

export async function getPostStats() {
  // 使用原生 SQL 查询
  const stats = await db.$queryRaw`
    SELECT 
      COUNT(*) as total,
      AVG(views) as avgViews,
      MAX(views) as maxViews
    FROM posts
    WHERE published = true
  `;

  return stats;
}

export async function searchPosts(query: string) {
  // 参数化查询，防止 SQL 注入
  const posts = await db.$queryRaw`
    SELECT * FROM posts
    WHERE title ILIKE ${`%${query}%`}
    OR content ILIKE ${`%${query}%`}
    LIMIT 20
  `;

  return posts;
}
```

---

## 问题 2：如何处理复杂的数据库操作？

Server Action 支持事务、关联查询等复杂操作。

### 使用事务

```tsx
"use server";

import { db } from "@/lib/db";

export async function transferPoints(
  fromUserId: string,
  toUserId: string,
  amount: number
) {
  try {
    // 使用事务确保数据一致性
    const result = await db.$transaction(async (tx) => {
      // 1. 检查发送者余额
      const sender = await tx.user.findUnique({
        where: { id: fromUserId },
      });

      if (!sender || sender.points < amount) {
        throw new Error("Insufficient points");
      }

      // 2. 扣除发送者积分
      await tx.user.update({
        where: { id: fromUserId },
        data: { points: { decrement: amount } },
      });

      // 3. 增加接收者积分
      await tx.user.update({
        where: { id: toUserId },
        data: { points: { increment: amount } },
      });

      // 4. 创建转账记录
      const transfer = await tx.transfer.create({
        data: {
          fromUserId,
          toUserId,
          amount,
          type: "POINTS",
        },
      });

      return transfer;
    });

    revalidatePath("/points");
    return { success: true, transfer: result };
  } catch (error) {
    console.error("Transfer failed:", error);
    return { success: false, error: error.message };
  }
}
```

### 关联查询

```tsx
"use server";

export async function getPostWithDetails(postId: string) {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      // 包含作者信息
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      // 包含评论
      comments: {
        include: {
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      // 包含标签
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
      // 统计信息
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return post;
}
```

### 批量操作

```tsx
"use server";

export async function bulkUpdatePosts(postIds: string[], data: any) {
  // 批量更新
  const result = await db.post.updateMany({
    where: {
      id: { in: postIds },
    },
    data: {
      published: data.published,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/posts");
  return { success: true, count: result.count };
}

export async function bulkDeletePosts(postIds: string[]) {
  // 批量删除
  await db.$transaction([
    // 先删除关联数据
    db.comment.deleteMany({
      where: { postId: { in: postIds } },
    }),
    db.like.deleteMany({
      where: { postId: { in: postIds } },
    }),
    // 再删除文章
    db.post.deleteMany({
      where: { id: { in: postIds } },
    }),
  ]);

  revalidatePath("/posts");
  return { success: true };
}
```

---

## 问题 3：如何优化数据库查询性能？

Server Action 中可以使用多种技术优化数据库性能。

### 1. 选择性查询字段

```tsx
"use server";

// ❌ 查询所有字段
export async function getUsers() {
  const users = await db.user.findMany();
  // 返回所有字段，包括不需要的
  return users;
}

// ✅ 只查询需要的字段
export async function getUsers() {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      // 不查询 password, createdAt 等字段
    },
  });

  return users;
}
```

### 2. 分页查询

```tsx
"use server";

export async function getPosts(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;

  const [posts, total] = await Promise.all([
    // 查询当前页数据
    db.post.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    // 查询总数
    db.post.count(),
  ]);

  return {
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
```

### 3. 使用索引

```prisma
// schema.prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())

  // 添加索引提升查询性能
  @@index([published, createdAt])
  @@index([authorId])
  @@index([title]) // 用于搜索
}
```

```tsx
"use server";

// 利用索引的查询
export async function getPublishedPosts() {
  // 这个查询会使用 [published, createdAt] 索引
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return posts;
}
```

### 4. 缓存查询结果

```tsx
"use server";

import { cache } from "react";

// 使用 React cache 缓存查询
export const getUser = cache(async (userId: string) => {
  console.log("Querying user:", userId);

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  return user;
});

// 在同一个请求中多次调用，只查询一次
async function Page() {
  const user1 = await getUser("123"); // 查询数据库
  const user2 = await getUser("123"); // 使用缓存
  const user3 = await getUser("123"); // 使用缓存
}
```

---

## 问题 4：如何处理数据库错误？

Server Action 中需要妥善处理各种数据库错误。

### 错误处理模式

```tsx
"use server";

import { Prisma } from "@prisma/client";

export async function createUser(data: { email: string; name: string }) {
  try {
    const user = await db.user.create({ data });

    return { success: true, user };
  } catch (error) {
    // 处理 Prisma 特定错误
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // 唯一约束冲突
      if (error.code === "P2002") {
        return {
          success: false,
          error: "Email already exists",
        };
      }

      // 外键约束失败
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid reference",
        };
      }
    }

    // 其他错误
    console.error("Database error:", error);
    return {
      success: false,
      error: "Failed to create user",
    };
  }
}
```

### 验证和错误处理结合

```tsx
"use server";

import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(20),
  categoryId: z.string(),
});

export async function createPost(formData: FormData) {
  // 1. 验证输入
  const result = createPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId"),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 2. 验证用户权限
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 3. 执行数据库操作
    const post = await db.post.create({
      data: {
        ...result.data,
        authorId: session.user.id,
      },
    });

    revalidatePath("/posts");
    return { success: true, post };
  } catch (error) {
    // 4. 处理数据库错误
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid category",
        };
      }
    }

    console.error("Failed to create post:", error);
    return {
      success: false,
      error: "Failed to create post",
    };
  }
}
```

### 完整的 CRUD 示例

```tsx
// app/actions/posts.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create
export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const post = await db.post.create({
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      authorId: session.user.id,
    },
  });

  revalidatePath("/posts");
  redirect(`/posts/${post.id}`);
}

// Read
export async function getPost(id: string) {
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, avatar: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!post) throw new Error("Post not found");
  return post;
}

// Update
export async function updatePost(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // 验证权限
  const post = await db.post.findUnique({ where: { id } });
  if (post?.authorId !== session.user.id) {
    throw new Error("Forbidden");
  }

  const updated = await db.post.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    },
  });

  revalidatePath(`/posts/${id}`);
  return { success: true, post: updated };
}

// Delete
export async function deletePost(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const post = await db.post.findUnique({ where: { id } });
  if (post?.authorId !== session.user.id) {
    throw new Error("Forbidden");
  }

  await db.post.delete({ where: { id } });

  revalidatePath("/posts");
  redirect("/posts");
}
```

## 延伸阅读

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Next.js Database Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Database Query Optimization](https://www.prisma.io/docs/guides/performance-and-optimization)
