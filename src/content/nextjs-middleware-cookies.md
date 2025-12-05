---
title: 中间件能访问 cookies 吗？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js Middleware 中读取、设置和删除 cookies，以及 cookies 操作的最佳实践和常见应用场景。
tags:
  - Next.js
  - Middleware
  - Cookies
  - 认证
estimatedTime: 15 分钟
keywords:
  - Middleware Cookies
  - Next.js Cookies
  - Cookie 操作
  - 认证状态
highlight: 掌握在 Middleware 中操作 cookies 的方法和技巧
order: 318
---

## 问题 1：Middleware 如何访问 cookies？

Middleware 可以完全访问请求和响应的 cookies。

### 读取 Cookies

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 方法 1：使用 cookies() 方法
  const token = request.cookies.get("auth_token");
  console.log("Token:", token?.value);

  // 方法 2：获取所有 cookies
  const allCookies = request.cookies.getAll();
  console.log("All cookies:", allCookies);

  // 方法 3：检查 cookie 是否存在
  const hasToken = request.cookies.has("auth_token");
  console.log("Has token:", hasToken);

  // Cookie 对象结构
  if (token) {
    console.log("Name:", token.name); // 'auth_token'
    console.log("Value:", token.value); // cookie 的值
  }

  return NextResponse.next();
}
```

### 设置 Cookies

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 设置简单的 cookie
  response.cookies.set("theme", "dark");

  // 设置带选项的 cookie
  response.cookies.set("session_id", "abc123", {
    httpOnly: true, // 只能通过 HTTP 访问，JS 无法读取
    secure: true, // 只在 HTTPS 下发送
    sameSite: "strict", // CSRF 保护
    maxAge: 60 * 60 * 24, // 24 小时（秒）
    path: "/", // cookie 的路径
  });

  // 设置带过期时间的 cookie
  response.cookies.set("temp_data", "value", {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 小时后
  });

  return response;
}
```

### 删除 Cookies

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 方法 1：使用 delete
  response.cookies.delete("auth_token");

  // 方法 2：设置过期时间为过去
  response.cookies.set("session_id", "", {
    expires: new Date(0),
  });

  // 方法 3：设置 maxAge 为 0
  response.cookies.set("temp_data", "", {
    maxAge: 0,
  });

  return response;
}
```

---

## 问题 2：Middleware 中 cookies 操作的常见场景？

Cookies 在 Middleware 中有很多实际应用场景。

### 场景 1：认证检查

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 需要认证的路径
  if (pathname.startsWith("/dashboard")) {
    const authToken = request.cookies.get("auth_token");

    if (!authToken) {
      // 未登录，重定向到登录页
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 可以在这里验证 token 的有效性
    // const isValid = await verifyToken(authToken.value);
    // if (!isValid) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### 场景 2：主题切换

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 读取主题 cookie
  let theme = request.cookies.get("theme")?.value;

  // 如果没有设置，使用默认主题
  if (!theme) {
    theme = "light";
    response.cookies.set("theme", theme, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
      path: "/",
    });
  }

  // 将主题信息添加到请求头，供页面使用
  response.headers.set("X-Theme", theme);

  return response;
}
```

### 场景 3：语言偏好

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "zh", "ja"];
const defaultLocale = "en";

export function middleware(request: NextRequest) {
  // 读取语言 cookie
  let locale = request.cookies.get("locale")?.value;

  // 如果没有设置，从 Accept-Language header 获取
  if (!locale || !locales.includes(locale)) {
    const acceptLanguage = request.headers.get("accept-language");
    locale = acceptLanguage?.split(",")[0].split("-")[0] || defaultLocale;

    if (!locales.includes(locale)) {
      locale = defaultLocale;
    }
  }

  const { pathname } = request.nextUrl;

  // 检查 URL 是否已包含语言前缀
  const pathnameHasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );

  if (!pathnameHasLocale) {
    // 重定向到带语言前缀的 URL
    const response = NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );

    // 保存语言偏好到 cookie
    response.cookies.set("locale", locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 年
    });

    return response;
  }

  return NextResponse.next();
}
```

### 场景 4：会话管理

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 读取会话 ID
  let sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    // 创建新会话 ID
    sessionId = crypto.randomUUID();

    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: "/",
    });
  }

  // 更新最后访问时间
  response.cookies.set("last_visit", new Date().toISOString(), {
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });

  return response;
}
```

---

## 问题 3：Cookie 操作的最佳实践是什么？

遵循最佳实践可以提高安全性和用户体验。

### 最佳实践 1：安全设置

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ✅ 敏感信息使用 httpOnly
  response.cookies.set("auth_token", "token_value", {
    httpOnly: true, // 防止 XSS 攻击
    secure: true, // 只在 HTTPS 下发送
    sameSite: "strict", // 防止 CSRF 攻击
    path: "/",
    maxAge: 60 * 60 * 24, // 24 小时
  });

  // ✅ 非敏感信息可以不用 httpOnly
  response.cookies.set("theme", "dark", {
    httpOnly: false, // 允许 JavaScript 访问
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 年
  });

  return response;
}
```

### 最佳实践 2：适当的过期时间

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 短期会话 cookie（关闭浏览器后失效）
  response.cookies.set("session_token", "value", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    // 不设置 maxAge 或 expires，成为会话 cookie
  });

  // 记住我功能（长期有效）
  const rememberMe = request.cookies.get("remember_me")?.value === "true";

  if (rememberMe) {
    response.cookies.set("auth_token", "value", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });
  } else {
    response.cookies.set("auth_token", "value", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 天
    });
  }

  return response;
}
```

### 最佳实践 3：Cookie 大小限制

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ⚠️ Cookie 大小限制：通常 4KB
  // 避免存储大量数据在 cookie 中

  // ❌ 不好：存储大量数据
  // const userData = JSON.stringify({ /* 大量数据 */ });
  // response.cookies.set('user_data', userData);

  // ✅ 好：只存储 ID，数据存在服务器
  response.cookies.set("user_id", "user123", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return response;
}
```

### 最佳实践 4：Cookie 前缀

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 使用前缀组织 cookies
  response.cookies.set("app_auth_token", "value", {
    httpOnly: true,
    secure: true,
  });

  response.cookies.set("app_user_id", "user123", {
    httpOnly: true,
    secure: true,
  });

  response.cookies.set("app_theme", "dark", {
    httpOnly: false,
  });

  // 方便批量操作
  const allAppCookies = request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("app_"));

  return response;
}
```

---

## 问题 4：如何处理 Cookie 相关的常见问题？

了解常见问题和解决方案可以避免踩坑。

### 问题 1：Cookie 未设置成功

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // ❌ 错误：直接修改 request.cookies
  // request.cookies.set('theme', 'dark'); // 不会生效！

  // ✅ 正确：创建 response 并设置 cookies
  const response = NextResponse.next();
  response.cookies.set("theme", "dark");
  return response;
}
```

### 问题 2：跨域 Cookie

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 跨域请求需要特殊设置
  response.cookies.set("cross_site_cookie", "value", {
    sameSite: "none", // 允许跨站发送
    secure: true, // sameSite=none 必须配合 secure
  });

  return response;
}
```

### 问题 3：Cookie 同步问题

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 读取 cookie
  const theme = request.cookies.get("theme")?.value;

  // 设置新的 cookie
  response.cookies.set("theme", "dark");

  // ⚠️ 注意：在同一个 middleware 中
  // 设置的 cookie 不会立即反映在 request.cookies 中
  // 需要在下一次请求才能读取到新值

  return response;
}
```

### 问题 4：Cookie 删除

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 登出时删除所有认证相关的 cookies
  if (pathname === "/logout") {
    const response = NextResponse.redirect(new URL("/", request.url));

    // 删除多个 cookies
    response.cookies.delete("auth_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("user_id");

    return response;
  }

  return NextResponse.next();
}
```

## 总结

**核心概念总结**：

### 1. Cookie 访问

- 使用 `request.cookies` 读取
- 使用 `response.cookies` 设置和删除
- 支持完整的 cookie 选项配置

### 2. 常见应用

- 认证和会话管理
- 用户偏好设置（主题、语言）
- A/B 测试和功能开关
- 追踪和分析

### 3. 最佳实践

- 敏感信息使用 httpOnly 和 secure
- 设置适当的过期时间
- 注意 cookie 大小限制
- 使用前缀组织 cookies

## 延伸阅读

- [Next.js Middleware Cookies](https://nextjs.org/docs/app/api-reference/functions/next-request#cookies)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Cookie Security Best Practices](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [SameSite Cookies](https://web.dev/samesite-cookies-explained/)
