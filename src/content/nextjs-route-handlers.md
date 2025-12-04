---
title: route.ts 文件用于做什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js App Router 中 route.ts 文件的作用，掌握如何使用 Route Handlers 创建 API 端点。
tags:
  - Next.js
  - API Routes
  - Route Handlers
  - 后端接口
estimatedTime: 22 分钟
keywords:
  - route.ts
  - Route Handlers
  - API Routes
  - RESTful API
highlight: 理解 route.ts 如何替代 Pages Router 的 API Routes，掌握创建 API 端点的最佳实践
order: 407
---

## 问题 1：route.ts 是什么？

**Route Handlers - API 路由处理器**

`route.ts` 文件用于在 App Router 中创建自定义的 API 端点，它是 Pages Router 中 `pages/api` 的替代方案。

```typescript
// App Router: app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: "Hello from App Router!" });
}

// 访问: GET /api/hello
// 响应: { "message": "Hello from App Router!" }

// Pages Router 对比: pages/api/hello.ts
export default function handler(req, res) {
  res.status(200).json({ message: "Hello from Pages Router!" });
}
```

**支持的 HTTP 方法**

```typescript
// app/api/users/route.ts
import { NextRequest } from "next/server";

// GET 请求
export async function GET(request: NextRequest) {
  const users = await fetchUsers();
  return Response.json(users);
}

// POST 请求
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}

// PUT 请求
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const user = await updateUser(body);
  return Response.json(user);
}

// DELETE 请求
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  await deleteUser(id);
  return new Response(null, { status: 204 });
}

// PATCH 请求
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const user = await partialUpdateUser(body);
  return Response.json(user);
}
```

---

## 问题 2：如何在 route.ts 中处理请求和响应？

**读取请求数据**

```typescript
// app/api/posts/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // 1. 读取 JSON 数据
  const body = await request.json();
  console.log(body); // { title: "...", content: "..." }

  // 2. 读取查询参数
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page"); // ?page=1
  const limit = searchParams.get("limit"); // &limit=10

  // 3. 读取请求头
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  // 4. 读取 Cookies
  const token = request.cookies.get("token");

  // 5. 读取 FormData
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;

  return Response.json({ success: true });
}
```

**返回响应**

```typescript
// app/api/products/route.ts
export async function GET(request: NextRequest) {
  const products = await fetchProducts();

  // 1. 返回 JSON
  return Response.json(products);

  // 2. 返回 JSON 并设置状态码
  return Response.json(products, { status: 200 });

  // 3. 返回 JSON 并设置响应头
  return Response.json(products, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });

  // 4. 返回文本
  return new Response("Hello World", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

  // 5. 返回 HTML
  return new Response("<h1>Hello</h1>", {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });

  // 6. 返回重定向
  return Response.redirect("https://example.com");

  // 7. 返回空响应
  return new Response(null, { status: 204 });
}
```

**错误处理**

```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await fetchUser(params.id);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 问题 3：如何处理动态路由参数？

**动态路由段**

```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // URL: /api/posts/123
  // params.id = "123"

  const post = await fetchPost(params.id);
  return Response.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await deletePost(params.id);
  return new Response(null, { status: 204 });
}
```

**多个动态段**

```typescript
// app/api/users/[userId]/posts/[postId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; postId: string } }
) {
  // URL: /api/users/1/posts/123
  // params.userId = "1"
  // params.postId = "123"

  const post = await fetchUserPost(params.userId, params.postId);
  return Response.json(post);
}
```

**捕获所有路由**

```typescript
// app/api/files/[...path]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // URL: /api/files/documents/2024/report.pdf
  // params.path = ["documents", "2024", "report.pdf"]

  const filePath = params.path.join("/");
  const file = await readFile(filePath);

  return new Response(file, {
    headers: { "Content-Type": "application/pdf" },
  });
}
```

---

## 问题 4：route.ts 有哪些实际应用场景？

**RESTful API 端点**

```typescript
// app/api/products/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// 获取所有产品
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const products = await db.product.findMany({
    where: category ? { category } : undefined,
    skip: (page - 1) * limit,
    take: limit,
  });

  return Response.json(products);
}

// 创建产品
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 验证数据
  if (!body.name || !body.price) {
    return Response.json(
      { error: "Name and price are required" },
      { status: 400 }
    );
  }

  const product = await db.product.create({
    data: body,
  });

  return Response.json(product, { status: 201 });
}

// app/api/products/[id]/route.ts
// 获取单个产品
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json(product);
}

// 更新产品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const product = await db.product.update({
    where: { id: params.id },
    data: body,
  });

  return Response.json(product);
}

// 删除产品
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db.product.delete({
    where: { id: params.id },
  });

  return new Response(null, { status: 204 });
}
```

**文件上传**

```typescript
// app/api/upload/route.ts
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  // 读取文件内容
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 保存文件
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, file.name);
  await writeFile(filePath, buffer);

  return Response.json({
    success: true,
    filename: file.name,
    url: `/uploads/${file.name}`,
  });
}
```

**Webhook 处理**

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // 验证 webhook 签名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 处理不同的事件类型
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
  }

  return Response.json({ received: true });
}
```

**代理 API 请求**

```typescript
// app/api/proxy/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // 代理请求到外部 API
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    const data = await response.json();

    return Response.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
```

---

## 问题 5：route.ts 与 Pages Router API Routes 有什么区别？

**语法差异**

```typescript
// Pages Router: pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json({ message: "Hello" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// App Router: app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: "Hello" });
}

// 不需要手动处理不支持的方法
// Next.js 自动返回 405 Method Not Allowed
```

**功能差异**

```typescript
// Pages Router: 基于 Node.js API
export default function handler(req, res) {
  // 使用 Node.js 的 req 和 res 对象
  const cookies = req.cookies;
  res.setHeader("Set-Cookie", "token=abc");
  res.status(200).json({ data: "hello" });
}

// App Router: 基于 Web 标准 API
export async function GET(request: Request) {
  // 使用 Web 标准的 Request 和 Response
  const cookies = request.cookies;

  return Response.json(
    { data: "hello" },
    {
      headers: {
        "Set-Cookie": "token=abc",
      },
    }
  );
}

// 优势：
// - 更接近 Web 标准
// - 可以在 Edge Runtime 运行
// - 更好的类型安全
```

**Edge Runtime 支持**

```typescript
// app/api/edge/route.ts
export const runtime = "edge"; // 在 Edge Runtime 运行

export async function GET(request: Request) {
  // Edge Runtime 限制：
  // - 不能使用 Node.js API（如 fs、path）
  // - 不能使用某些 npm 包
  // - 启动更快，延迟更低

  return Response.json({ message: "Running on Edge" });
}

// Pages Router 不支持 Edge Runtime（API Routes）
```

---

## 总结

**route.ts 核心概念**：

### 1. 基本用法

- 用于创建 API 端点
- 支持所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
- 基于 Web 标准 API

### 2. 请求处理

- `request.json()` - 读取 JSON
- `request.formData()` - 读取表单数据
- `request.headers` - 读取请求头
- `request.cookies` - 读取 Cookies
- `searchParams` - 读取查询参数

### 3. 响应处理

- `Response.json()` - 返回 JSON
- `new Response()` - 返回自定义响应
- `Response.redirect()` - 重定向
- 设置状态码和响应头

### 4. 应用场景

- RESTful API 端点
- 文件上传
- Webhook 处理
- API 代理
- 数据库操作

### 5. 与 Pages Router 对比

**Pages Router（pages/api）**：

- 基于 Node.js API
- 单个处理函数
- 不支持 Edge Runtime

**App Router（route.ts）**：

- 基于 Web 标准 API
- 每个 HTTP 方法独立函数
- 支持 Edge Runtime
- 更好的类型安全

## 延伸阅读

- [Next.js 官方文档 - Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js 官方文档 - API Routes (Pages)](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [MDN - Request API](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- [MDN - Response API](https://developer.mozilla.org/en-US/docs/Web/API/Response)
