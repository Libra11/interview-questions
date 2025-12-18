---
title: middleware.ts 主要功能有哪些？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入了解 Next.js Middleware 的主要功能和使用场景，包括请求拦截、重定向、重写、认证授权等核心能力。
tags:
  - Next.js
  - Middleware
  - 路由拦截
  - 认证授权
estimatedTime: 20 分钟
keywords:
  - Next.js Middleware
  - middleware.ts
  - 请求拦截
  - 路由控制
highlight: 掌握 Next.js Middleware 的核心功能和实际应用
order: 701
---

## 问题 1：Next.js Middleware 是什么，它的作用是什么？

Middleware 是在请求完成之前运行的代码，可以修改请求和响应。

### 基本概念

**Middleware 的执行时机**：

- 在路由匹配之前
- 在页面渲染之前
- 在 API 路由执行之前
- 在静态文件服务之前

**主要功能**：

- 请求重定向
- URL 重写
- 设置请求头和响应头
- 认证和授权
- 国际化
- A/B 测试
- 机器人检测

### 创建 Middleware

```typescript
// middleware.ts (项目根目录)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware executed for:", request.url);

  // 继续处理请求
  return NextResponse.next();
}

// 配置 Middleware 匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

## 问题 2：Middleware 的主要功能有哪些？

Middleware 提供了多种强大的功能来控制请求处理流程。

### 功能 1：请求重定向

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 重定向旧路径到新路径
  if (request.nextUrl.pathname.startsWith("/old-blog")) {
    return NextResponse.redirect(new URL("/blog", request.url));
  }

  // 根据条件重定向
  if (request.nextUrl.pathname === "/admin") {
    const token = request.cookies.get("auth_token");

    if (!token) {
      // 未登录，重定向到登录页
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

### 功能 2：URL 重写

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 重写 URL（用户看到的 URL 不变，但实际渲染不同的页面）
  if (request.nextUrl.pathname.startsWith("/user")) {
    // /user/john -> /profile?username=john
    const username = request.nextUrl.pathname.split("/")[2];
    return NextResponse.rewrite(
      new URL(`/profile?username=${username}`, request.url)
    );
  }

  // 多租户应用：根据子域名重写
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  if (subdomain && subdomain !== "www") {
    // subdomain.example.com -> /sites/subdomain
    return NextResponse.rewrite(
      new URL(`/sites/${subdomain}${request.nextUrl.pathname}`, request.url)
    );
  }

  return NextResponse.next();
}
```

### 功能 3：设置请求头和响应头

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 创建响应
  const response = NextResponse.next();

  // 设置响应头
  response.headers.set("X-Custom-Header", "my-value");
  response.headers.set("X-Request-Time", new Date().toISOString());

  // 设置安全相关的响应头
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 添加请求头（传递给后续处理）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-url", request.url);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
    headers: response.headers,
  });
}
```

### 功能 4：Cookie 操作

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 读取 cookie
  const theme = request.cookies.get("theme");
  console.log("Current theme:", theme?.value);

  // 设置 cookie
  if (!theme) {
    response.cookies.set("theme", "light", {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      path: "/",
    });
  }

  // 删除 cookie
  if (request.nextUrl.pathname === "/logout") {
    response.cookies.delete("auth_token");
  }

  return response;
}
```

---

## 问题 3：如何实现常见的 Middleware 应用场景？

通过组合不同功能，可以实现复杂的应用场景。

### 场景 1：认证保护

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要认证的路径
const protectedPaths = ["/dashboard", "/profile", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路径
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const token = request.cookies.get("auth_token");

    if (!token) {
      // 未登录，重定向到登录页，并保存原始 URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 可以在这里验证 token（简化示例）
    // const isValid = await verifyToken(token.value);
    // if (!isValid) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*"],
};
```

### 场景 2：国际化（i18n）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "zh", "ja"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  // 1. 检查 URL 中的语言
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameLocale) return pathnameLocale;

  // 2. 检查 cookie
  const cookieLocale = request.cookies.get("locale")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 3. 检查 Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(",")[0].split("-")[0];
    if (locales.includes(browserLocale)) {
      return browserLocale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查路径是否已经包含语言前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // 获取用户语言偏好
    const locale = getLocale(request);

    // 重定向到带语言前缀的 URL
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 场景 3：A/B 测试

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 只对首页进行 A/B 测试
  if (request.nextUrl.pathname === "/") {
    // 检查用户是否已经分配了变体
    let variant = request.cookies.get("ab_test_variant")?.value;

    if (!variant) {
      // 随机分配变体 A 或 B
      variant = Math.random() < 0.5 ? "A" : "B";
    }

    // 根据变体重写到不同的页面
    const response = NextResponse.rewrite(
      new URL(`/home-${variant.toLowerCase()}`, request.url)
    );

    // 保存变体到 cookie
    response.cookies.set("ab_test_variant", variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    // 添加响应头用于分析
    response.headers.set("X-AB-Test-Variant", variant);

    return response;
  }

  return NextResponse.next();
}
```

### 场景 4：机器人检测和限流

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 简单的内存限流器（生产环境应使用 Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isBot(userAgent: string): boolean {
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 100; // 每分钟 100 次请求
  const windowMs = 60 * 1000; // 1 分钟

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 检测机器人
  if (isBot(userAgent)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // 限流检查
  if (!checkRateLimit(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
      },
    });
  }

  return NextResponse.next();
}
```

---

## 问题 4：Middleware 的配置选项有哪些？

通过 config 对象可以精确控制 Middleware 的执行范围。

### Matcher 配置

```typescript
// middleware.ts
export const config = {
  // 1. 简单路径匹配
  matcher: "/dashboard",

  // 2. 多个路径
  matcher: ["/dashboard", "/profile", "/settings"],

  // 3. 通配符匹配
  matcher: "/dashboard/:path*", // 匹配 /dashboard 及其所有子路径

  // 4. 正则表达式（使用命名捕获组）
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],

  // 5. 多个模式组合
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/((?!api|_next/static|_next/image).*)",
  ],
};
```

### 条件执行

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 根据不同路径执行不同逻辑
  if (pathname.startsWith("/api")) {
    return handleAPI(request);
  }

  if (pathname.startsWith("/admin")) {
    return handleAdmin(request);
  }

  if (pathname.startsWith("/blog")) {
    return handleBlog(request);
  }

  return NextResponse.next();
}

function handleAPI(request: NextRequest) {
  // API 特定逻辑
  const response = NextResponse.next();
  response.headers.set("X-API-Version", "1.0");
  return response;
}

function handleAdmin(request: NextRequest) {
  // 管理员认证逻辑
  const token = request.cookies.get("admin_token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

function handleBlog(request: NextRequest) {
  // 博客特定逻辑
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## 总结

**核心概念总结**：

### 1. Middleware 主要功能

- 请求重定向和 URL 重写
- 设置请求头和响应头
- Cookie 操作
- 认证和授权
- 国际化和 A/B 测试

### 2. 执行特点

- 在请求处理的最早阶段执行
- 运行在 Edge Runtime
- 可以修改请求和响应
- 通过 matcher 控制执行范围

### 3. 最佳实践

- 保持 Middleware 轻量
- 使用 matcher 精确匹配路径
- 合理使用重定向和重写
- 注意性能影响

## 延伸阅读

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [NextResponse API](https://nextjs.org/docs/app/api-reference/functions/next-response)
- [Middleware Patterns](https://nextjs.org/docs/app/building-your-application/routing/middleware#matching-paths)
