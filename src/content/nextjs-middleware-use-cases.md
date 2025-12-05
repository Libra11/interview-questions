---
title: 中间件常见使用场景有哪些？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  总结 Next.js Middleware 的常见使用场景和实战案例，包括认证授权、国际化、A/B 测试、重定向、日志记录等实用功能的完整实现。
tags:
  - Next.js
  - Middleware
  - 实战案例
  - 最佳实践
estimatedTime: 25 分钟
keywords:
  - Middleware 使用场景
  - Next.js 实战
  - 认证授权
  - 国际化
highlight: 掌握 Middleware 的常见使用场景和实战技巧
order: 320
---

## 问题 1：认证和授权场景如何实现？

认证是 Middleware 最常见的使用场景之一。

### 基础认证保护

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要认证的路径
const protectedPaths = ["/dashboard", "/profile", "/settings", "/admin"];

// 公开路径
const publicPaths = ["/", "/login", "/register", "/about"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路径
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isPublic = publicPaths.includes(pathname);

  if (isProtected) {
    const token = request.cookies.get("auth_token");

    if (!token) {
      // 未登录，重定向到登录页
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 可以在这里验证 token
    // const isValid = await verifyToken(token.value);
  }

  // 已登录用户访问登录页，重定向到首页
  if (pathname === "/login") {
    const token = request.cookies.get("auth_token");
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 基于角色的访问控制（RBAC）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// 路径权限配置
const pathPermissions: Record<string, string[]> = {
  "/admin": ["admin"],
  "/admin/users": ["admin"],
  "/admin/settings": ["admin", "moderator"],
  "/dashboard": ["user", "admin", "moderator"],
  "/profile": ["user", "admin", "moderator"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查路径是否需要权限
  const requiredRoles = Object.entries(pathPermissions).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (requiredRoles) {
    const token = request.cookies.get("auth_token");

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // 验证 token 并获取用户角色
      const payload = await verifyToken(token.value);
      const userRole = payload.role as string;

      // 检查用户是否有权限
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/forbidden", request.url));
      }

      // 将用户信息添加到请求头
      const response = NextResponse.next();
      response.headers.set("X-User-Id", payload.sub as string);
      response.headers.set("X-User-Role", userRole);

      return response;
    } catch (error) {
      // Token 无效
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

---

## 问题 2：国际化（i18n）如何实现？

Middleware 可以优雅地处理多语言路由。

### 完整的国际化方案

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "zh", "ja", "ko"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  // 1. 检查 URL 路径中的语言
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
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].split("-")[0].trim());

    for (const lang of languages) {
      if (locales.includes(lang)) {
        return lang;
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 跳过 API 路由和静态文件
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 检查路径是否已包含语言前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // 获取用户语言偏好
    const locale = getLocale(request);

    // 重定向到带语言前缀的 URL
    const newUrl = new URL(`/${locale}${pathname}${search}`, request.url);

    const response = NextResponse.redirect(newUrl);

    // 保存语言偏好到 cookie
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      path: "/",
    });

    return response;
  }

  // 提取当前语言并设置到 header
  const currentLocale = pathname.split("/")[1];
  const response = NextResponse.next();
  response.headers.set("X-Locale", currentLocale);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 问题 3：A/B 测试和功能开关如何实现？

Middleware 非常适合实现 A/B 测试和功能开关。

### A/B 测试实现

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Variant = "A" | "B";

// A/B 测试配置
const abTests = {
  homepage: {
    enabled: true,
    variants: ["A", "B"] as Variant[],
    weights: [0.5, 0.5], // 50% / 50%
  },
  pricing: {
    enabled: true,
    variants: ["A", "B"] as Variant[],
    weights: [0.7, 0.3], // 70% / 30%
  },
};

function getVariant(request: NextRequest, testName: string): Variant {
  // 检查是否已分配变体
  const cookieName = `ab_test_${testName}`;
  const existingVariant = request.cookies.get(cookieName)?.value as Variant;

  if (existingVariant) {
    return existingVariant;
  }

  // 根据权重随机分配
  const test = abTests[testName as keyof typeof abTests];
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < test.variants.length; i++) {
    cumulative += test.weights[i];
    if (random < cumulative) {
      return test.variants[i];
    }
  }

  return test.variants[0];
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 首页 A/B 测试
  if (pathname === "/" && abTests.homepage.enabled) {
    const variant = getVariant(request, "homepage");

    // 重写到不同的页面
    const response = NextResponse.rewrite(
      new URL(`/home-${variant.toLowerCase()}`, request.url)
    );

    // 保存变体到 cookie
    response.cookies.set(`ab_test_homepage`, variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    // 添加响应头用于分析
    response.headers.set("X-AB-Test-Homepage", variant);

    return response;
  }

  // 价格页 A/B 测试
  if (pathname === "/pricing" && abTests.pricing.enabled) {
    const variant = getVariant(request, "pricing");

    const response = NextResponse.rewrite(
      new URL(`/pricing-${variant.toLowerCase()}`, request.url)
    );

    response.cookies.set(`ab_test_pricing`, variant, {
      maxAge: 60 * 60 * 24 * 30,
    });

    response.headers.set("X-AB-Test-Pricing", variant);

    return response;
  }

  return NextResponse.next();
}
```

### 功能开关（Feature Flags）

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 功能开关配置
const featureFlags = {
  newDashboard: {
    enabled: true,
    allowedUsers: ["user1@example.com", "user2@example.com"],
    percentage: 10, // 10% 的用户
  },
  betaFeatures: {
    enabled: true,
    allowedUsers: [],
    percentage: 100, // 所有用户
  },
};

function isFeatureEnabled(
  featureName: string,
  userId?: string,
  userEmail?: string
): boolean {
  const feature = featureFlags[featureName as keyof typeof featureFlags];

  if (!feature || !feature.enabled) {
    return false;
  }

  // 检查是否在允许列表中
  if (userEmail && feature.allowedUsers.includes(userEmail)) {
    return true;
  }

  // 基于百分比随机启用
  if (userId) {
    const hash = userId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return Math.abs(hash % 100) < feature.percentage;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 新仪表板功能
  if (pathname.startsWith("/dashboard")) {
    const userId = request.headers.get("x-user-id");
    const userEmail = request.headers.get("x-user-email");

    if (
      isFeatureEnabled(
        "newDashboard",
        userId || undefined,
        userEmail || undefined
      )
    ) {
      // 重写到新仪表板
      const response = NextResponse.rewrite(
        new URL(`/dashboard-v2${pathname.slice(10)}`, request.url)
      );

      response.headers.set("X-Feature-New-Dashboard", "true");
      return response;
    }
  }

  return NextResponse.next();
}
```

---

## 问题 4：其他常见场景如何实现？

还有许多其他实用的 Middleware 场景。

### 场景 1：URL 重定向和重写

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 重定向规则
const redirects: Record<string, string> = {
  "/old-blog": "/blog",
  "/docs/v1": "/docs/v2",
  "/products": "/shop",
};

// 重写规则（多租户）
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 永久重定向
  if (redirects[pathname]) {
    return NextResponse.redirect(
      new URL(redirects[pathname], request.url),
      { status: 308 } // 永久重定向
    );
  }

  // 2. 多租户重写
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
    // subdomain.example.com -> /sites/subdomain
    return NextResponse.rewrite(
      new URL(`/sites/${subdomain}${pathname}`, request.url)
    );
  }

  // 3. 用户友好的 URL 重写
  if (pathname.startsWith("/u/")) {
    // /u/username -> /profile?username=username
    const username = pathname.split("/")[2];
    return NextResponse.rewrite(
      new URL(`/profile?username=${username}`, request.url)
    );
  }

  return NextResponse.next();
}
```

### 场景 2：限流和安全

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 简单的内存限流器
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// 机器人检测
function isBot(userAgent: string): boolean {
  const botPatterns = [/bot/i, /crawler/i, /spider/i, /scraper/i];
  return botPatterns.some((pattern) => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "";

  // 1. 限流
  if (!rateLimit(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // 2. 机器人检测
  const response = NextResponse.next();

  if (isBot(userAgent)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // 3. 安全头
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );

  return response;
}
```

### 场景 3：日志和监控

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, search } = request.nextUrl;

  // 记录请求信息
  console.log(
    `[${new Date().toISOString()}] ${request.method} ${pathname}${search}`
  );

  const response = NextResponse.next();

  // 计算响应时间
  const duration = Date.now() - start;

  // 添加响应头
  response.headers.set("X-Response-Time", `${duration}ms`);
  response.headers.set("X-Request-Id", crypto.randomUUID());

  // 记录响应信息
  console.log(`[${new Date().toISOString()}] ${response.status} ${duration}ms`);

  return response;
}
```

### 场景 4：地理位置路由

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Vercel 提供的地理位置信息
  const country = request.geo?.country || "US";
  const city = request.geo?.city;

  // 根据地理位置重定向
  if (country === "CN") {
    // 中国用户重定向到中文站点
    return NextResponse.redirect(new URL("/zh", request.url));
  }

  // 添加地理位置信息到响应头
  const response = NextResponse.next();
  response.headers.set("X-User-Country", country);

  if (city) {
    response.headers.set("X-User-City", city);
  }

  return response;
}
```

## 总结

**核心概念总结**：

### 1. 认证和授权

- 路径保护和重定向
- 基于角色的访问控制
- Token 验证和用户信息传递

### 2. 国际化

- 自动语言检测
- URL 语言前缀
- Cookie 语言偏好

### 3. A/B 测试

- 变体分配和持久化
- URL 重写
- 分析数据收集

### 4. 其他场景

- URL 重定向和重写
- 限流和安全防护
- 日志和监控
- 地理位置路由

## 延伸阅读

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
