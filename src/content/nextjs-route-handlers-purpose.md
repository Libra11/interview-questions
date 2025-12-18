---
title: Next.js Route Handlers（route.ts）作用是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js App Router 中 Route Handlers 的作用和使用场景，学习如何创建 API 端点、处理 HTTP 请求，以及与 Server Components 的协作方式。
tags:
  - Next.js
  - Route Handlers
  - API Routes
  - HTTP
estimatedTime: 20 分钟
keywords:
  - Route Handlers
  - route.ts
  - Next.js API
  - HTTP 请求
highlight: 掌握 Route Handlers 的作用和使用方法，构建强大的 API 端点
order: 682
---

## 问题 1：什么是 Route Handlers，它解决了什么问题？

Route Handlers 是 Next.js App Router 中用于创建自定义 API 端点的方式，替代了 Pages Router 中的 API Routes。

### 基本概念

**Route Handlers 的作用**：

- 创建 RESTful API 端点
- 处理 HTTP 请求（GET、POST、PUT、DELETE 等）
- 在服务端执行代码
- 返回 JSON 或其他格式的响应

```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: "Hello, World!" });
}

// 访问：GET /api/hello
// 返回：{ "message": "Hello, World!" }
```

### 文件命名规则

```
app/
├── api/
│   ├── hello/
│   │   └── route.ts          # /api/hello
│   ├── users/
│   │   ├── route.ts          # /api/users
│   │   └── [id]/
│   │       └── route.ts      # /api/users/:id
│   └── posts/
│       ├── route.ts          # /api/posts
│       └── [slug]/
│           ├── route.ts      # /api/posts/:slug
│           └── comments/
│               └── route.ts  # /api/posts/:slug/comments
```

---

## 问题 2：如何创建和使用 Route Handlers？

Route Handlers 通过导出 HTTP 方法函数来处理不同类型的请求。

### 基本 GET 请求

```typescript
// app/api/posts/route.ts
export async function GET() {
  // 获取数据
  const posts = await db.post.findMany();

  // 返回 JSON 响应
  return Response.json(posts);
}
```

### 带查询参数的 GET 请求

```typescript
// app/api/search/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // 搜索数据
  const results = await searchPosts(query, page, limit);

  return Response.json({
    results,
    page,
    total: results.length,
  });
}

// 访问：GET /api/search?q=nextjs&page=1&limit=10
```

### 动态路由参数

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 根据 ID 获取文章
  const post = await db.post.findUnique({
    where: { id },
  });

  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  return Response.json(post);
}

// 访问：GET /api/posts/123
```

### POST 请求处理

```typescript
// app/api/posts/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { title, content, authorId } = body;

    // 验证数据
    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // 创建文章
    const post = await db.post.create({
      data: { title, content, authorId },
    });

    // 返回创建的资源
    return Response.json(post, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create post" }, { status: 500 });
  }
}
```

---

## 问题 3：Route Handlers 支持哪些功能和特性？

Route Handlers 提供了丰富的功能来处理各种 API 需求。

### 1. 支持的 HTTP 方法

```typescript
// app/api/users/[id]/route.ts
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - 获取用户
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await db.user.findUnique({ where: { id } });
  return Response.json(user);
}

// POST - 创建用户
export async function POST(request: NextRequest) {
  const data = await request.json();
  const user = await db.user.create({ data });
  return Response.json(user, { status: 201 });
}

// PUT - 更新用户（完整更新）
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await request.json();
  const user = await db.user.update({ where: { id }, data });
  return Response.json(user);
}

// PATCH - 更新用户（部分更新）
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await request.json();
  const user = await db.user.update({ where: { id }, data });
  return Response.json(user);
}

// DELETE - 删除用户
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await db.user.delete({ where: { id } });
  return Response.json({ success: true });
}
```

### 2. 请求头处理

```typescript
// app/api/protected/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 读取请求头
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const userAgent = request.headers.get("user-agent");

  // 验证 token
  if (!authorization) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authorization.replace("Bearer ", "");
  const user = await verifyToken(token);

  if (!user) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  return Response.json({ user });
}
```

### 3. 设置响应头

```typescript
// app/api/data/route.ts
export async function GET() {
  const data = await getData();

  // 创建响应并设置自定义头
  return Response.json(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "X-Custom-Header": "custom-value",
    },
  });
}
```

### 4. Cookies 操作

```typescript
// app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  // 验证用户
  const user = await authenticateUser(username, password);

  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 设置 cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", user.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });

  return Response.json({ success: true, user });
}

// 读取 cookie
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await getUserByToken(token.value);
  return Response.json({ user });
}
```

### 5. 重定向

```typescript
// app/api/redirect/route.ts
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (url) {
    // 重定向到指定 URL
    redirect(url);
  }

  // 默认重定向
  redirect("/");
}
```

---

## 问题 4：Route Handlers 的实际应用场景有哪些？

了解常见应用场景可以帮助我们更好地使用 Route Handlers。

### 场景 1：数据 CRUD API

```typescript
// app/api/todos/route.ts
import { NextRequest } from "next/server";

// 获取所有待办事项
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const completed = searchParams.get("completed");

  const todos = await db.todo.findMany({
    where: completed !== null ? { completed: completed === "true" } : undefined,
  });

  return Response.json(todos);
}

// 创建待办事项
export async function POST(request: NextRequest) {
  const { title, description } = await request.json();

  const todo = await db.todo.create({
    data: { title, description, completed: false },
  });

  return Response.json(todo, { status: 201 });
}

// app/api/todos/[id]/route.ts
type RouteContext = {
  params: Promise<{ id: string }>;
};

// 获取单个待办事项
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const todo = await db.todo.findUnique({ where: { id } });

  if (!todo) {
    return Response.json({ error: "Todo not found" }, { status: 404 });
  }

  return Response.json(todo);
}

// 更新待办事项
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const data = await request.json();

  const todo = await db.todo.update({
    where: { id },
    data,
  });

  return Response.json(todo);
}

// 删除待办事项
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await db.todo.delete({ where: { id } });

  return Response.json({ success: true });
}
```

### 场景 2：第三方 API 代理

```typescript
// app/api/proxy/github/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return Response.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    // 代理请求到 GitHub API
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch GitHub data" },
      { status: 500 }
    );
  }
}
```

### 场景 3：Webhook 处理

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  try {
    // 验证 webhook 签名
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 处理不同类型的事件
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: "Webhook error" }, { status: 400 });
  }
}
```

### 场景 4：缓存重新验证

```typescript
// app/api/revalidate/route.ts
import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json();

  // 验证密钥
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    if (path) {
      // 重新验证路径
      revalidatePath(path);
    }

    if (tag) {
      // 重新验证标签
      revalidateTag(tag);
    }

    return Response.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return Response.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
```

## 总结

**核心概念总结**：

### 1. Route Handlers 的作用

- 创建自定义 API 端点
- 处理各种 HTTP 请求方法
- 在服务端执行代码
- 返回 JSON 或其他格式响应

### 2. 主要功能

- 支持所有 HTTP 方法（GET、POST、PUT、PATCH、DELETE）
- 处理请求头和响应头
- 操作 Cookies
- 动态路由参数
- 查询参数处理

### 3. 常见应用场景

- RESTful API 开发
- 第三方 API 代理
- Webhook 处理
- 缓存重新验证
- 认证和授权

## 延伸阅读

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js API Reference - Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [MDN Web API - Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [MDN Web API - Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
