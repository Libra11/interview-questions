---
title: 中间件能读取请求 body 吗？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  了解 Next.js Middleware 中读取请求体的限制和替代方案，学习如何在 Edge Runtime 环境下正确处理请求数据。
tags:
  - Next.js
  - Middleware
  - Request Body
  - Edge Runtime
estimatedTime: 15 分钟
keywords:
  - Middleware Request Body
  - 请求体读取
  - Edge Runtime 限制
  - Next.js 中间件
highlight: 理解 Middleware 读取请求体的限制和正确的处理方式
order: 708
---

## 问题 1：Middleware 能读取请求 body 吗？

技术上可以，但有重要的限制和注意事项。

### 基本读取方式

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ⚠️ 可以读取，但有限制
  if (request.method === "POST") {
    try {
      // 读取 JSON body
      const body = await request.json();
      console.log("Request body:", body);

      // ❌ 问题：body 只能读取一次
      // 后续的 Route Handler 将无法再次读取

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  return NextResponse.next();
}
```

### 主要限制

**限制 1：Body 只能读取一次**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.method === "POST") {
    // 第一次读取
    const body1 = await request.json();

    // ❌ 第二次读取会失败
    // const body2 = await request.json(); // 错误！

    // ❌ 后续的 Route Handler 也无法读取
    // 因为 stream 已经被消费了
  }

  return NextResponse.next();
}
```

**限制 2：性能影响**

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ⚠️ 读取 body 会增加延迟
  // Middleware 应该保持快速

  if (request.method === "POST") {
    const body = await request.json(); // 等待 body 解析

    // 这会延迟所有 POST 请求
    // 即使不需要验证 body 的请求也会受影响
  }

  return NextResponse.next();
}
```

---

## 问题 2：如何正确处理需要读取 body 的场景？

有几种替代方案可以避免直接在 Middleware 中读取 body。

### 方案 1：使用请求头验证

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ✅ 推荐：验证请求头而不是 body
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type");

    // 验证 Content-Type
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // 验证认证 token
    const authToken = request.headers.get("authorization");
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}
```

### 方案 2：在 Route Handler 中验证

```typescript
// middleware.ts - 只做认证检查
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware 只检查认证
  const token = request.headers.get("authorization");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 不读取 body，让 Route Handler 处理
  return NextResponse.next();
}

// app/api/posts/route.ts - 在这里验证 body
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ 在 Route Handler 中读取和验证 body
    const body = await request.json();

    // 验证必填字段
    if (!body.title || !body.content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // 处理请求
    const post = await createPost(body);

    return Response.json(post, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

### 方案 3：克隆请求（高级）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.method === "POST") {
    try {
      // 克隆请求以读取 body
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      // 验证 body
      if (!body.apiKey || body.apiKey !== process.env.API_KEY) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      // ✅ 原始请求的 body 仍然可以被后续处理读取
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  return NextResponse.next();
}
```

---

## 问题 3：什么时候应该在 Middleware 中读取 body？

只在特定场景下才应该在 Middleware 中读取 body。

### 适合的场景

**场景 1：Webhook 签名验证**

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

export async function middleware(request: NextRequest) {
  // Webhook 路径需要验证签名
  if (request.nextUrl.pathname.startsWith("/api/webhooks")) {
    const signature = request.headers.get("x-webhook-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    try {
      // 克隆请求以读取 body
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();

      // 验证签名
      const expectedSignature = crypto
        .createHmac("sha256", process.env.WEBHOOK_SECRET!)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }

      // 签名有效，继续处理
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/webhooks/:path*",
};
```

**场景 2：请求日志（谨慎使用）**

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.method === "POST" && process.env.NODE_ENV === "development") {
    try {
      // 仅在开发环境记录请求
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      console.log("POST request:", {
        url: request.url,
        body,
        headers: Object.fromEntries(request.headers),
      });
    } catch (error) {
      // 忽略解析错误
    }
  }

  return NextResponse.next();
}
```

### 不适合的场景

```typescript
// ❌ 不推荐：在 Middleware 中做复杂的 body 验证
export async function middleware(request: NextRequest) {
  if (request.method === "POST") {
    const body = await request.json();

    // ❌ 复杂的验证逻辑应该在 Route Handler 中
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { error: "Password too short" },
        { status: 400 }
      );
    }

    // ... 更多验证
  }

  return NextResponse.next();
}

// ✅ 推荐：在 Route Handler 中验证
// app/api/register/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 在这里做所有验证
  const validation = validateRegistrationData(body);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  // 处理注册
  const user = await createUser(body);
  return Response.json(user, { status: 201 });
}
```

---

## 问题 4：如何处理不同类型的请求体？

不同类型的请求体需要不同的处理方式。

### JSON 请求体

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      // 处理 JSON
      console.log("JSON body:", body);
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  return NextResponse.next();
}
```

### FormData 请求体

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    // ⚠️ FormData 通常包含文件，不建议在 Middleware 中处理
    // 让 Route Handler 处理文件上传

    // 只验证请求头
    const contentLength = request.headers.get("content-length");
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
  }

  return NextResponse.next();
}
```

### 文本请求体

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.headers.get("content-type")?.includes("text/plain")) {
    try {
      const clonedRequest = request.clone();
      const text = await clonedRequest.text();

      // 处理文本
      console.log("Text body:", text);
    } catch (error) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
  }

  return NextResponse.next();
}
```

### 二进制请求体

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (
    request.headers.get("content-type")?.includes("application/octet-stream")
  ) {
    // ⚠️ 二进制数据不建议在 Middleware 中处理
    // 只检查大小
    const contentLength = request.headers.get("content-length");

    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }
  }

  return NextResponse.next();
}
```

## 总结

**核心概念总结**：

### 1. Body 读取限制

- Body 只能读取一次
- 读取会消费 stream
- 影响后续处理

### 2. 推荐做法

- 优先验证请求头
- 在 Route Handler 中验证 body
- 只在必要时使用 clone()

### 3. 适用场景

- Webhook 签名验证
- 简单的格式检查
- 开发环境日志

### 4. 避免场景

- 复杂的 body 验证
- 文件上传处理
- 大量数据处理

## 延伸阅读

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
- [Request.clone()](https://developer.mozilla.org/en-US/docs/Web/API/Request/clone)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
