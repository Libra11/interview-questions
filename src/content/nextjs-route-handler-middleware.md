---
title: 如何在 Route Handler 中使用 Middleware？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js Route Handlers 中实现中间件模式，包括认证、日志、错误处理等常见中间件的实现方式和最佳实践。
tags:
  - Next.js
  - Route Handlers
  - Middleware
  - 认证授权
estimatedTime: 22 分钟
keywords:
  - Route Handler Middleware
  - 中间件模式
  - 认证中间件
  - Next.js API
highlight: 掌握在 Route Handlers 中实现和使用中间件的方法
order: 312
---

## 问题 1：Route Handler 中的中间件是什么概念？

Route Handler 本身不像 Express 那样内置中间件系统，但可以通过函数组合实现类似的中间件模式。

### 中间件的作用

**常见用途**：

- 认证和授权
- 请求日志
- 错误处理
- 请求验证
- CORS 处理
- 限流

### 基本中间件模式

```typescript
// lib/middleware.ts
import { NextRequest, NextResponse } from "next/server";

// 中间件类型定义
type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type Middleware = (handler: RouteHandler) => RouteHandler;

// 简单的日志中间件
export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.url}`
    );

    const response = await handler(request, context);

    console.log(`[${new Date().toISOString()}] Response: ${response.status}`);

    return response;
  };
}

// 使用中间件
// app/api/users/route.ts
import { withLogging } from "@/lib/middleware";

async function handler(request: NextRequest) {
  return Response.json({ users: [] });
}

export const GET = withLogging(handler);
```

---

## 问题 2：如何实现常见的中间件功能？

通过函数组合可以实现各种中间件功能。

### 1. 认证中间件

```typescript
// lib/middleware/auth.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    // 获取 token
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    try {
      // 验证 token
      const user = await verifyToken(token);

      if (!user) {
        return Response.json({ error: "Invalid token" }, { status: 401 });
      }

      // 将用户信息附加到请求上
      // 使用 headers 传递数据
      const requestWithUser = new NextRequest(request, {
        headers: new Headers(request.headers),
      });
      requestWithUser.headers.set("x-user-id", user.id);
      requestWithUser.headers.set("x-user-email", user.email);

      return handler(requestWithUser, context);
    } catch (error) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }
  };
}

// 使用认证中间件
// app/api/profile/route.ts
import { withAuth } from "@/lib/middleware/auth";

async function handler(request: NextRequest) {
  // 从 headers 中获取用户信息
  const userId = request.headers.get("x-user-id");
  const userEmail = request.headers.get("x-user-email");

  return Response.json({
    userId,
    userEmail,
  });
}

export const GET = withAuth(handler);
```

### 2. 错误处理中间件

```typescript
// lib/middleware/error.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("Route handler error:", error);

      // 根据错误类型返回不同的响应
      if (error instanceof ValidationError) {
        return Response.json(
          { error: error.message, fields: error.fields },
          { status: 400 }
        );
      }

      if (error instanceof NotFoundError) {
        return Response.json({ error: error.message }, { status: 404 });
      }

      if (error instanceof UnauthorizedError) {
        return Response.json({ error: error.message }, { status: 401 });
      }

      // 默认服务器错误
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// 自定义错误类
class ValidationError extends Error {
  constructor(message: string, public fields: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
```

### 3. 请求验证中间件

```typescript
// lib/middleware/validation.ts
import { NextRequest } from "next/server";
import { z } from "zod";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

// 创建验证中间件工厂
export function withValidation<T>(schema: z.Schema<T>) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: any) => {
      try {
        // 解析请求体
        const body = await request.json();

        // 验证数据
        const validatedData = schema.parse(body);

        // 将验证后的数据附加到请求
        const requestWithData = new NextRequest(request, {
          headers: new Headers(request.headers),
        });
        requestWithData.headers.set(
          "x-validated-data",
          JSON.stringify(validatedData)
        );

        return handler(requestWithData, context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return Response.json(
            {
              error: "Validation failed",
              details: error.errors,
            },
            { status: 400 }
          );
        }

        return Response.json(
          { error: "Invalid request body" },
          { status: 400 }
        );
      }
    };
  };
}

// 使用验证中间件
// app/api/posts/route.ts
import { z } from "zod";
import { withValidation } from "@/lib/middleware/validation";

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

async function handler(request: NextRequest) {
  // 获取验证后的数据
  const validatedData = JSON.parse(
    request.headers.get("x-validated-data") || "{}"
  );

  const post = await db.post.create({
    data: validatedData,
  });

  return Response.json(post, { status: 201 });
}

export const POST = withValidation(createPostSchema)(handler);
```

### 4. CORS 中间件

```typescript
// lib/middleware/cors.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type CorsOptions = {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
};

export function withCors(options: CorsOptions = {}) {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders = ["Content-Type", "Authorization"],
    credentials = false,
  } = options;

  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: any) => {
      // 处理 OPTIONS 预检请求
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": Array.isArray(origin)
              ? origin.join(",")
              : origin,
            "Access-Control-Allow-Methods": methods.join(","),
            "Access-Control-Allow-Headers": allowedHeaders.join(","),
            "Access-Control-Allow-Credentials": credentials.toString(),
          },
        });
      }

      // 处理实际请求
      const response = await handler(request, context);

      // 添加 CORS 头
      const headers = new Headers(response.headers);
      headers.set(
        "Access-Control-Allow-Origin",
        Array.isArray(origin) ? origin.join(",") : origin
      );
      headers.set("Access-Control-Allow-Methods", methods.join(","));
      headers.set("Access-Control-Allow-Headers", allowedHeaders.join(","));

      if (credentials) {
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
}

// 使用 CORS 中间件
// app/api/public/route.ts
import { withCors } from "@/lib/middleware/cors";

async function handler(request: NextRequest) {
  return Response.json({ message: "Public API" });
}

export const GET = withCors({
  origin: ["https://example.com", "https://app.example.com"],
  methods: ["GET", "POST"],
  credentials: true,
})(handler);
```

---

## 问题 3：如何组合多个中间件？

实际应用中常需要组合多个中间件，可以通过函数组合实现。

### 方法 1：手动嵌套

```typescript
// app/api/posts/route.ts
import { withAuth } from "@/lib/middleware/auth";
import { withLogging } from "@/lib/middleware/logging";
import { withErrorHandler } from "@/lib/middleware/error";

async function handler(request: NextRequest) {
  return Response.json({ posts: [] });
}

// 手动嵌套中间件
export const GET = withErrorHandler(withLogging(withAuth(handler)));
```

### 方法 2：创建组合函数

```typescript
// lib/middleware/compose.ts
type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type Middleware = (handler: RouteHandler) => RouteHandler;

// 组合多个中间件
export function compose(...middlewares: Middleware[]) {
  return (handler: RouteHandler): RouteHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

// 使用组合函数
// app/api/posts/route.ts
import { compose } from "@/lib/middleware/compose";
import { withAuth } from "@/lib/middleware/auth";
import { withLogging } from "@/lib/middleware/logging";
import { withErrorHandler } from "@/lib/middleware/error";
import { withCors } from "@/lib/middleware/cors";

async function handler(request: NextRequest) {
  return Response.json({ posts: [] });
}

// 组合所有中间件
export const GET = compose(
  withErrorHandler,
  withLogging,
  withCors(),
  withAuth
)(handler);
```

### 方法 3：创建中间件管道

```typescript
// lib/middleware/pipeline.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type Middleware = (handler: RouteHandler) => RouteHandler;

class MiddlewarePipeline {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  execute(handler: RouteHandler): RouteHandler {
    return this.middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  }
}

// 创建管道
export function createPipeline() {
  return new MiddlewarePipeline();
}

// 使用管道
// app/api/posts/route.ts
import { createPipeline } from "@/lib/middleware/pipeline";
import { withAuth } from "@/lib/middleware/auth";
import { withLogging } from "@/lib/middleware/logging";
import { withErrorHandler } from "@/lib/middleware/error";

async function handler(request: NextRequest) {
  return Response.json({ posts: [] });
}

const pipeline = createPipeline()
  .use(withErrorHandler)
  .use(withLogging)
  .use(withAuth);

export const GET = pipeline.execute(handler);
```

---

## 问题 4：如何实现高级中间件功能？

一些高级场景需要更复杂的中间件实现。

### 1. 限流中间件

```typescript
// lib/middleware/rate-limit.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

// 简单的内存限流器
class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private maxRequests: number, private windowMs: number) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // 清理过期的时间戳
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }
}

export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 分钟
) {
  const limiter = new RateLimiter(maxRequests, windowMs);

  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: any) => {
      // 使用 IP 地址作为限流键
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      if (!limiter.isAllowed(ip)) {
        return Response.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(windowMs / 1000)),
            },
          }
        );
      }

      return handler(request, context);
    };
  };
}

// 使用限流中间件
// app/api/search/route.ts
import { withRateLimit } from "@/lib/middleware/rate-limit";

async function handler(request: NextRequest) {
  return Response.json({ results: [] });
}

// 每分钟最多 10 次请求
export const GET = withRateLimit(10, 60000)(handler);
```

### 2. 缓存中间件

```typescript
// lib/middleware/cache.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

// 简单的内存缓存
class Cache {
  private store = new Map<string, { data: any; expires: number }>();

  get(key: string): any | null {
    const item = this.store.get(key);

    if (!item) return null;

    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any, ttl: number) {
    this.store.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }
}

const cache = new Cache();

export function withCache(ttl: number = 60000) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: any) => {
      // 只缓存 GET 请求
      if (request.method !== "GET") {
        return handler(request, context);
      }

      // 使用 URL 作为缓存键
      const cacheKey = request.url;

      // 检查缓存
      const cached = cache.get(cacheKey);
      if (cached) {
        return Response.json(cached, {
          headers: {
            "X-Cache": "HIT",
          },
        });
      }

      // 执行处理器
      const response = await handler(request, context);

      // 缓存响应
      if (response.ok) {
        const data = await response.clone().json();
        cache.set(cacheKey, data, ttl);
      }

      return new Response(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers),
          "X-Cache": "MISS",
        },
      });
    };
  };
}
```

### 3. 角色权限中间件

```typescript
// lib/middleware/rbac.ts
import { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest, context?: any) => Promise<Response>;

type Role = "admin" | "user" | "guest";

export function withRole(...allowedRoles: Role[]) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest, context?: any) => {
      // 假设用户角色已经通过认证中间件设置
      const userRole = request.headers.get("x-user-role") as Role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return Response.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      return handler(request, context);
    };
  };
}

// 使用角色权限中间件
// app/api/admin/users/route.ts
import { compose } from "@/lib/middleware/compose";
import { withAuth } from "@/lib/middleware/auth";
import { withRole } from "@/lib/middleware/rbac";

async function handler(request: NextRequest) {
  return Response.json({ users: [] });
}

// 只有 admin 可以访问
export const GET = compose(withAuth, withRole("admin"))(handler);
```

## 总结

**核心概念总结**：

### 1. 中间件模式

- Route Handler 通过函数组合实现中间件
- 中间件可以在处理器前后执行逻辑
- 支持链式组合多个中间件

### 2. 常见中间件类型

- 认证和授权
- 错误处理
- 请求验证
- CORS 处理
- 限流和缓存

### 3. 中间件组合

- 手动嵌套
- 使用 compose 函数
- 创建中间件管道
- 保持执行顺序

## 延伸阅读

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Express Middleware Pattern](https://expressjs.com/en/guide/using-middleware.html)
- [Zod Validation](https://zod.dev/)
- [Rate Limiting Strategies](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)
