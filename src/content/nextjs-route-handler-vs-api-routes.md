---
title: Route Handler 与 API Routes 的区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入对比 Next.js App Router 中的 Route Handlers 与 Pages Router 中的 API Routes 的区别，理解两者的设计理念、使用方式和迁移策略。
tags:
  - Next.js
  - Route Handlers
  - API Routes
  - App Router
estimatedTime: 18 分钟
keywords:
  - Route Handlers
  - API Routes
  - App Router vs Pages Router
  - Next.js 迁移
highlight: 理解 Route Handlers 与 API Routes 的核心区别和迁移方法
order: 685
---

## 问题 1：Route Handlers 和 API Routes 的基本区别是什么？

Route Handlers 是 App Router 的 API 解决方案，而 API Routes 是 Pages Router 的方案，两者在设计和使用上有显著差异。

### 文件位置和命名

**API Routes (Pages Router)**：

```
pages/
└── api/
    ├── hello.ts          # /api/hello
    ├── users/
    │   └── [id].ts       # /api/users/:id
    └── posts/
        └── index.ts      # /api/posts
```

**Route Handlers (App Router)**：

```
app/
└── api/
    ├── hello/
    │   └── route.ts      # /api/hello
    ├── users/
    │   └── [id]/
    │       └── route.ts  # /api/users/:id
    └── posts/
        └── route.ts      # /api/posts
```

### 代码对比

**API Routes (Pages Router)**：

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json({ message: "Hello" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
```

**Route Handlers (App Router)**：

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello" });
}

// 不需要手动处理 405，未定义的方法自动返回 405
```

---

## 问题 2：Route Handlers 相比 API Routes 有哪些改进？

Route Handlers 在多个方面进行了改进和优化。

### 改进 1：更符合 Web 标准

**API Routes**：

- 使用 Next.js 特定的 API
- `NextApiRequest` 和 `NextApiResponse`

**Route Handlers**：

- 使用 Web 标准 API
- 标准的 `Request` 和 `Response` 对象

```typescript
// API Routes - Next.js 特定 API
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, body, headers } = req;
  res.status(200).json({ data: "value" });
}

// Route Handlers - Web 标准 API
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const headers = request.headers;

  return Response.json({ data: "value" }, { status: 200 });
}
```

### 改进 2：更清晰的 HTTP 方法处理

**API Routes**：

- 单个处理函数处理所有方法
- 需要手动判断 `req.method`

**Route Handlers**：

- 每个 HTTP 方法独立导出
- 自动处理未定义的方法

```typescript
// API Routes - 需要手动判断方法
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      // GET 逻辑
      break;
    case "POST":
      // POST 逻辑
      break;
    case "PUT":
      // PUT 逻辑
      break;
    default:
      res.status(405).json({ error: "Method not allowed" });
  }
}

// Route Handlers - 方法分离，更清晰
export async function GET(request: NextRequest) {
  // GET 逻辑
}

export async function POST(request: NextRequest) {
  // POST 逻辑
}

export async function PUT(request: NextRequest) {
  // PUT 逻辑
}
// 未定义的方法自动返回 405
```

### 改进 3：更好的类型安全

**Route Handlers 提供更好的类型推断**：

```typescript
// Route Handlers - 更好的类型安全
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params; // 类型安全的参数
  return Response.json({ id });
}
```

### 改进 4：支持流式响应

```typescript
// Route Handlers - 支持流式响应
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(encoder.encode(`data: ${i}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
```

---

## 问题 3：如何从 API Routes 迁移到 Route Handlers？

迁移过程相对直接，主要是调整文件结构和 API 使用方式。

### 迁移步骤

**步骤 1：调整文件结构**

```
# 从
pages/api/users/[id].ts

# 到
app/api/users/[id]/route.ts
```

**步骤 2：重写处理函数**

```typescript
// Before: pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    const user = await db.user.findUnique({ where: { id: id as string } });
    return res.status(200).json(user);
  }

  if (req.method === "PUT") {
    const data = req.body;
    const user = await db.user.update({
      where: { id: id as string },
      data,
    });
    return res.status(200).json(user);
  }

  if (req.method === "DELETE") {
    await db.user.delete({ where: { id: id as string } });
    return res.status(204).end();
  }

  res.status(405).json({ error: "Method not allowed" });
}

// After: app/api/users/[id]/route.ts
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await db.user.findUnique({ where: { id } });
  return Response.json(user);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await request.json();
  const user = await db.user.update({ where: { id }, data });
  return Response.json(user);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await db.user.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
```

### 常见迁移模式

**模式 1：查询参数**

```typescript
// API Routes
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page, limit } = req.query;
  // ...
}

// Route Handlers
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  // ...
}
```

**模式 2：请求体**

```typescript
// API Routes
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { title, content } = req.body;
  // ...
}

// Route Handlers
export async function POST(request: NextRequest) {
  const { title, content } = await request.json();
  // ...
}
```

**模式 3：Cookies**

```typescript
// API Routes
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 读取 cookie
  const token = req.cookies.token;

  // 设置 cookie
  res.setHeader(
    "Set-Cookie",
    serialize("token", "value", {
      httpOnly: true,
      maxAge: 3600,
    })
  );
}

// Route Handlers
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  // 读取 cookie
  const token = cookieStore.get("token");

  // 设置 cookie
  cookieStore.set("token", "value", {
    httpOnly: true,
    maxAge: 3600,
  });

  return Response.json({ success: true });
}
```

---

## 问题 4：什么时候应该使用 Route Handlers，什么时候使用 Server Actions？

在 App Router 中，除了 Route Handlers，还可以使用 Server Actions 处理数据变更。

### Route Handlers 的使用场景

**适合 RESTful API**：

- 需要对外提供 API
- 第三方服务调用
- Webhook 处理
- 需要自定义响应格式

```typescript
// app/api/public/posts/route.ts
// 对外提供的公开 API
export async function GET() {
  const posts = await db.post.findMany({
    where: { published: true },
  });

  return Response.json({
    data: posts,
    meta: {
      total: posts.length,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Server Actions 的使用场景

**适合表单提交和数据变更**：

- 表单处理
- 内部数据变更
- 不需要对外暴露的操作
- 与 React 组件紧密集成

```typescript
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const post = await db.post.create({
    data: { title, content },
  });

  revalidatePath("/posts");
  return { success: true, post };
}

// app/posts/new/page.tsx
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

### 对比总结

| 特性          | Route Handlers    | Server Actions     |
| ------------- | ----------------- | ------------------ |
| 用途          | RESTful API       | 表单和数据变更     |
| 访问方式      | HTTP 请求         | 函数调用           |
| 响应格式      | 自定义            | 自动序列化         |
| 对外暴露      | 是                | 否                 |
| 与 React 集成 | 需要手动          | 原生支持           |
| 适用场景      | 公开 API、Webhook | 表单提交、内部操作 |

## 总结

**核心概念总结**：

### 1. 主要区别

- 文件结构：Route Handlers 使用 `route.ts`，API Routes 使用文件名
- API 设计：Route Handlers 使用 Web 标准，API Routes 使用 Next.js 特定 API
- 方法处理：Route Handlers 方法分离，API Routes 统一处理

### 2. Route Handlers 的优势

- 更符合 Web 标准
- 更清晰的代码组织
- 更好的类型安全
- 支持流式响应

### 3. 迁移建议

- 逐步迁移，不需要一次性完成
- 调整文件结构和 API 使用方式
- 考虑使用 Server Actions 替代部分 API

## 延伸阅读

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js API Routes (Pages)](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
