---
title: Route Handler 如何处理 GET / POST / PUT / DELETE？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js Route Handlers 中处理不同的 HTTP 方法，包括 GET、POST、PUT、DELETE 等，掌握 RESTful API 的实现方式。
tags:
  - Next.js
  - Route Handlers
  - HTTP Methods
  - RESTful API
estimatedTime: 15 分钟
keywords:
  - HTTP Methods
  - GET POST PUT DELETE
  - Route Handlers
  - RESTful
highlight: 掌握 Route Handlers 中各种 HTTP 方法的使用方式
order: 311
---

## 问题 1：Route Handlers 如何定义不同的 HTTP 方法？

在 Route Handlers 中，每个 HTTP 方法对应一个独立的导出函数。

### 基本语法

```typescript
// app/api/example/route.ts

// GET 请求
export async function GET(request: Request) {
  return Response.json({ message: "GET request" });
}

// POST 请求
export async function POST(request: Request) {
  return Response.json({ message: "POST request" });
}

// PUT 请求
export async function PUT(request: Request) {
  return Response.json({ message: "PUT request" });
}

// DELETE 请求
export async function DELETE(request: Request) {
  return Response.json({ message: "DELETE request" });
}

// PATCH 请求
export async function PATCH(request: Request) {
  return Response.json({ message: "PATCH request" });
}

// HEAD 请求
export async function HEAD(request: Request) {
  return new Response(null, { status: 200 });
}

// OPTIONS 请求
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS",
    },
  });
}
```

### 未定义方法的处理

```typescript
// app/api/users/route.ts

// 只定义 GET 和 POST
export async function GET() {
  return Response.json({ users: [] });
}

export async function POST(request: Request) {
  const data = await request.json();
  return Response.json({ user: data }, { status: 201 });
}

// 访问 PUT /api/users 会自动返回 405 Method Not Allowed
// 访问 DELETE /api/users 也会自动返回 405
```

---

## 问题 2：如何实现完整的 CRUD API？

通过组合不同的 HTTP 方法，可以实现完整的 CRUD 操作。

### 列表和创建（Collection）

```typescript
// app/api/posts/route.ts
import { NextRequest } from "next/server";

// GET /api/posts - 获取文章列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await db.post.count();

  return Response.json({
    data: posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/posts - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, authorId } = body;

    // 验证必填字段
    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // 创建文章
    const post = await db.post.create({
      data: {
        title,
        content,
        authorId,
        published: false,
      },
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
}
```

### 单个资源操作（Item）

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/posts/:id - 获取单个文章
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(post);
}

// PUT /api/posts/:id - 完整更新文章
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  try {
    const post = await db.post.update({
      where: { id },
      data: body,
    });

    return Response.json(post);
  } catch (error) {
    return Response.json(
      { error: "Post not found or update failed" },
      { status: 404 }
    );
  }
}

// PATCH /api/posts/:id - 部分更新文章
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  // PATCH 只更新提供的字段
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.published !== undefined) updateData.published = body.published;

  try {
    const post = await db.post.update({
      where: { id },
      data: updateData,
    });

    return Response.json(post);
  } catch (error) {
    return Response.json(
      { error: "Post not found or update failed" },
      { status: 404 }
    );
  }
}

// DELETE /api/posts/:id - 删除文章
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await db.post.delete({
      where: { id },
    });

    // 204 No Content - 删除成功但不返回内容
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json(
      { error: "Post not found or delete failed" },
      { status: 404 }
    );
  }
}
```

---

## 问题 3：PUT 和 PATCH 有什么区别？

PUT 和 PATCH 都用于更新资源，但语义不同。

### PUT - 完整替换

```typescript
// PUT /api/users/:id
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  // PUT 要求提供完整的资源数据
  // 未提供的字段会被设置为默认值或 null
  const user = await db.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      bio: body.bio || null, // 未提供则设为 null
      avatar: body.avatar || null,
    },
  });

  return Response.json(user);
}

// 客户端必须提供所有字段
fetch("/api/users/123", {
  method: "PUT",
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    bio: "Developer",
    avatar: "https://...",
  }),
});
```

### PATCH - 部分更新

```typescript
// PATCH /api/users/:id
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  // PATCH 只更新提供的字段
  // 未提供的字段保持不变
  const updateData: any = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.avatar !== undefined) updateData.avatar = body.avatar;

  const user = await db.user.update({
    where: { id },
    data: updateData,
  });

  return Response.json(user);
}

// 客户端只需提供要更新的字段
fetch("/api/users/123", {
  method: "PATCH",
  body: JSON.stringify({
    name: "John Doe", // 只更新名字
  }),
});
```

### 使用建议

```typescript
// ✅ 推荐：表单完整提交使用 PUT
// 用户编辑个人资料，提交所有字段
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await request.json();

  // 验证所有必填字段
  if (!data.name || !data.email) {
    return Response.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const user = await db.user.update({ where: { id }, data });
  return Response.json(user);
}

// ✅ 推荐：单个字段更新使用 PATCH
// 切换文章发布状态
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { published } = await request.json();

  const post = await db.post.update({
    where: { id },
    data: { published },
  });

  return Response.json(post);
}
```

---

## 问题 4：如何处理请求体和响应？

正确处理请求体和响应是实现 API 的关键。

### 处理不同格式的请求体

```typescript
// JSON 请求体
export async function POST(request: Request) {
  const data = await request.json();
  return Response.json({ received: data });
}

// FormData 请求体
export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  const file = formData.get("file") as File;

  return Response.json({
    name,
    fileName: file.name,
    fileSize: file.size,
  });
}

// 文本请求体
export async function POST(request: Request) {
  const text = await request.text();
  return Response.json({ length: text.length });
}

// 二进制请求体
export async function POST(request: Request) {
  const buffer = await request.arrayBuffer();
  return Response.json({ size: buffer.byteLength });
}
```

### 返回不同格式的响应

```typescript
// JSON 响应
export async function GET() {
  return Response.json({ message: "Hello" });
}

// 文本响应
export async function GET() {
  return new Response("Plain text response", {
    headers: { "Content-Type": "text/plain" },
  });
}

// HTML 响应
export async function GET() {
  return new Response("<h1>Hello</h1>", {
    headers: { "Content-Type": "text/html" },
  });
}

// 文件下载
export async function GET() {
  const fileBuffer = await readFile("document.pdf");

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="document.pdf"',
    },
  });
}

// 重定向
export async function GET() {
  return Response.redirect("https://example.com", 302);
}

// 空响应
export async function DELETE() {
  await deleteResource();
  return new Response(null, { status: 204 });
}
```

### 错误处理

```typescript
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 验证数据
    if (!data.email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 } // Bad Request
      );
    }

    // 检查资源是否存在
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return Response.json(
        { error: "Email already exists" },
        { status: 409 } // Conflict
      );
    }

    // 创建资源
    const user = await db.user.create({ data });

    return Response.json(user, { status: 201 }); // Created
  } catch (error) {
    console.error("Error:", error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## 总结

**核心概念总结**：

### 1. HTTP 方法使用

- GET：获取资源
- POST：创建资源
- PUT：完整更新资源
- PATCH：部分更新资源
- DELETE：删除资源

### 2. PUT vs PATCH

- PUT：替换整个资源，需要提供完整数据
- PATCH：更新部分字段，只提供要更新的字段

### 3. 请求和响应处理

- 使用 `request.json()` 解析 JSON
- 使用 `Response.json()` 返回 JSON
- 正确设置 HTTP 状态码
- 合理的错误处理

## 延伸阅读

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MDN HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [RESTful API Design](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
