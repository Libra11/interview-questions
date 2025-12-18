---
title: Middleware 中如何做权限检查？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握在 Next.js Middleware 中实现权限检查的各种方法，保护路由和 API 端点
tags:
  - Next.js
  - Middleware
  - 权限检查
  - 身份验证
estimatedTime: 22 分钟
keywords:
  - Middleware
  - 权限检查
  - 路由保护
  - RBAC
highlight: Middleware 在边缘运行，可以高效地进行权限检查和路由保护
order: 128
---

## 问题 1：Middleware 权限检查的基本原理

Middleware 在请求到达页面之前执行，是权限检查的理想位置。

### 执行流程

```javascript
用户请求 /dashboard
    ↓
Middleware 检查权限
    ↓
有权限 → 继续访问 /dashboard
无权限 → 重定向到 /login
```

### 基本实现

```javascript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 获取 token
  const token = request.cookies.get("token")?.value;

  // 未登录
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 已登录，继续访问
  return NextResponse.next();
}

// 配置需要保护的路径
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

---

## 问题 2：使用 Auth.js 进行权限检查

Auth.js 提供了便捷的 Middleware 集成。

### 基本保护

```javascript
// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  const { auth: session } = req;

  // 未登录
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 已登录
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### 角色检查

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  // 未登录
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 管理员路由
  if (pathname.startsWith("/admin")) {
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // VIP 路由
  if (pathname.startsWith("/vip")) {
    if (session.user.role !== "vip" && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/upgrade", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/vip/:path*"],
};
```

### 多级权限

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 权限层级
const ROLES = {
  admin: 3,
  moderator: 2,
  user: 1,
  guest: 0,
};

// 路由权限要求
const ROUTE_PERMISSIONS = {
  "/admin": "admin",
  "/moderator": "moderator",
  "/dashboard": "user",
};

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  // 查找匹配的路由权限
  const requiredRole = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (!requiredRole) {
    return NextResponse.next();
  }

  // 未登录
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 检查权限等级
  const userLevel = ROLES[session.user.role] || 0;
  const requiredLevel = ROLES[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});
```

---

## 问题 3：基于资源的权限检查

有时需要检查用户对特定资源的权限。

### 资源所有权检查

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 检查文章所有权
  // /posts/123/edit
  const postMatch = pathname.match(/^\/posts\/(\d+)\/edit$/);
  if (postMatch) {
    const postId = postMatch[1];

    // 调用 API 检查所有权
    const response = await fetch(
      `${req.nextUrl.origin}/api/posts/${postId}/owner`,
      {
        headers: {
          "x-user-id": session.user.id,
        },
      }
    );

    const { isOwner } = await response.json();

    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});
```

### 使用边缘数据库

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createClient } from "@vercel/edge-config";

export default auth(async (req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 使用 Edge Config 存储权限配置
  const edgeConfig = createClient(process.env.EDGE_CONFIG);
  const permissions = await edgeConfig.get("user-permissions");

  // 检查用户权限
  const userPermissions = permissions[session.user.id] || [];

  if (pathname.startsWith("/admin") && !userPermissions.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});
```

---

## 问题 4：API 路由保护

Middleware 也可以保护 API 路由。

### 基本 API 保护

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  // API 路由保护
  if (pathname.startsWith("/api/")) {
    // 公开 API
    if (pathname.startsWith("/api/public")) {
      return NextResponse.next();
    }

    // 需要认证的 API
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 管理员 API
    if (pathname.startsWith("/api/admin")) {
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
```

### API 速率限制

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 秒内最多 10 次请求
});

export default auth(async (req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // 未登录用户更严格的限制
    const identifier = session?.user.id || req.ip || "anonymous";
    const { success, limit, reset, remaining } = await ratelimit.limit(
      identifier
    );

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
});
```

---

## 问题 5：高级权限模式

### RBAC（基于角色的访问控制）

```javascript
// lib/permissions.ts
export const PERMISSIONS = {
  // 文章权限
  "posts:read": ["user", "moderator", "admin"],
  "posts:create": ["user", "moderator", "admin"],
  "posts:update": ["moderator", "admin"],
  "posts:delete": ["admin"],

  // 用户权限
  "users:read": ["moderator", "admin"],
  "users:update": ["admin"],
  "users:delete": ["admin"],

  // 设置权限
  "settings:read": ["admin"],
  "settings:update": ["admin"],
};

export function hasPermission(role: string, permission: string): boolean {
  return PERMISSIONS[permission]?.includes(role) || false;
}

// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";

const ROUTE_PERMISSIONS = {
  "/posts/new": "posts:create",
  "/posts/[id]/edit": "posts:update",
  "/admin/users": "users:read",
  "/admin/settings": "settings:read",
};

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 查找所需权限
  const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (requiredPermission) {
    if (!hasPermission(session.user.role, requiredPermission)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});
```

### ABAC（基于属性的访问控制）

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 基于用户属性的访问控制
  const user = session.user;

  // 检查账户状态
  if (user.status === "suspended") {
    return NextResponse.redirect(new URL("/suspended", req.url));
  }

  // 检查邮箱验证
  if (!user.emailVerified && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/verify-email", req.url));
  }

  // 检查订阅状态
  if (pathname.startsWith("/premium")) {
    if (!user.isPremium || new Date(user.premiumExpiry) < new Date()) {
      return NextResponse.redirect(new URL("/upgrade", req.url));
    }
  }

  // 检查地理位置
  const country = req.geo?.country;
  if (pathname.startsWith("/restricted") && country === "XX") {
    return NextResponse.redirect(new URL("/not-available", req.url));
  }

  return NextResponse.next();
});
```

### 动态权限

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default auth(async (req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 从 Redis 获取用户权限
  const userPermissions = await redis.smembers(
    `permissions:${session.user.id}`
  );

  // 检查路由权限
  if (pathname.startsWith("/admin")) {
    if (!userPermissions.includes("admin")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (pathname.startsWith("/analytics")) {
    if (!userPermissions.includes("analytics:view")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 将权限添加到请求头
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-permissions", userPermissions.join(","));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});
```

---

## 问题 6：错误处理和日志

### 错误处理

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  try {
    const { auth: session } = req;
    const { pathname } = req.nextUrl;

    // 权限检查逻辑
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ... 其他检查

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);

    // 返回错误页面
    return NextResponse.redirect(new URL("/error", req.url));
  }
});
```

### 访问日志

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { auth: session } = req;
  const { pathname } = req.nextUrl;

  // 记录访问日志
  const log = {
    timestamp: new Date().toISOString(),
    userId: session?.user.id || "anonymous",
    path: pathname,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers.get("user-agent"),
  };

  // 发送到日志服务（不阻塞请求）
  fetch("https://logs.example.com/access", {
    method: "POST",
    body: JSON.stringify(log),
  }).catch(console.error);

  // 权限检查
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});
```

---

## 总结

**核心概念总结**：

### 1. Middleware 优势

- 在边缘运行，低延迟
- 请求到达前检查权限
- 统一的权限控制点
- 支持重定向和修改请求

### 2. 权限检查类型

- 基本认证（登录/未登录）
- 角色检查（admin、user 等）
- 资源所有权检查
- API 路由保护

### 3. 高级模式

- RBAC（基于角色）
- ABAC（基于属性）
- 动态权限
- 速率限制

### 4. 最佳实践

- 使用 Auth.js 简化集成
- 合理配置 matcher
- 添加错误处理
- 记录访问日志
- 使用边缘数据库提升性能

## 延伸阅读

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth.js Middleware](https://authjs.dev/getting-started/session-management/protecting)
- [RBAC vs ABAC](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/)
- [Edge Config](https://vercel.com/docs/storage/edge-config)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
