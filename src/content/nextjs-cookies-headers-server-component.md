---
title: cookies、headers 在 Server Component 中怎么使用？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解如何在 Next.js Server Components 中使用 cookies 和 headers API，学习读取和设置 cookies、访问请求头信息的正确方式和最佳实践。
tags:
  - Next.js
  - Server Components
  - Cookies
  - Headers
estimatedTime: 22 分钟
keywords:
  - Next.js cookies
  - Next.js headers
  - Server Component
  - 请求头
highlight: 掌握在 Server Components 中使用 cookies 和 headers 的方法和注意事项
order: 306
---

## 问题 1：如何在 Server Component 中读取 cookies 和 headers？

Next.js 提供了 `cookies()` 和 `headers()` 函数来在 Server Components 中访问请求信息。

### 读取 Cookies

```typescript
// app/page.tsx
import { cookies } from "next/headers";

export default async function Page() {
  // 获取 cookies 对象
  const cookieStore = await cookies();

  // 读取单个 cookie
  const token = cookieStore.get("token");
  console.log(token?.value); // cookie 的值

  // 读取所有 cookies
  const allCookies = cookieStore.getAll();
  console.log(allCookies); // [{ name: 'token', value: '...' }, ...]

  // 检查 cookie 是否存在
  const hasToken = cookieStore.has("token");

  return (
    <div>
      <p>Token: {token?.value}</p>
      <p>Has token: {hasToken ? "Yes" : "No"}</p>
    </div>
  );
}
```

### 读取 Headers

```typescript
// app/page.tsx
import { headers } from "next/headers";

export default async function Page() {
  // 获取 headers 对象
  const headersList = await headers();

  // 读取单个 header
  const userAgent = headersList.get("user-agent");
  const referer = headersList.get("referer");

  // 读取自定义 header
  const customHeader = headersList.get("x-custom-header");

  return (
    <div>
      <p>User Agent: {userAgent}</p>
      <p>Referer: {referer || "Direct visit"}</p>
      <p>Custom: {customHeader}</p>
    </div>
  );
}
```

### Cookie 对象的属性

```typescript
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (sessionCookie) {
    console.log(sessionCookie.name); // 'session'
    console.log(sessionCookie.value); // cookie 的值
    // 注意：在读取时，只能获取 name 和 value
    // 其他属性（如 httpOnly、secure）在读取时不可用
  }

  return <div>Session: {sessionCookie?.value}</div>;
}
```

---

## 问题 2：如何在 Server Component 中设置 cookies？

在 Server Components 中可以设置 cookies，但需要注意一些限制和最佳实践。

### 基本设置方法

```typescript
// app/page.tsx
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();

  // 设置简单的 cookie
  cookieStore.set("theme", "dark");

  // 设置带选项的 cookie
  cookieStore.set("session", "abc123", {
    httpOnly: true, // 只能通过 HTTP 访问，JS 无法读取
    secure: true, // 只在 HTTPS 下发送
    sameSite: "strict", // CSRF 保护
    maxAge: 60 * 60 * 24 * 7, // 7 天（秒）
    path: "/", // cookie 的路径
  });

  // 设置带过期时间的 cookie
  cookieStore.set("temp", "value", {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 小时后
  });

  return <div>Cookies set</div>;
}
```

### 删除 Cookies

```typescript
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();

  // 方法 1：使用 delete
  cookieStore.delete("theme");

  // 方法 2：设置过期时间为过去
  cookieStore.set("session", "", {
    expires: new Date(0),
  });

  // 方法 3：设置 maxAge 为 0
  cookieStore.set("token", "", {
    maxAge: 0,
  });

  return <div>Cookies deleted</div>;
}
```

### 在 Server Actions 中设置 Cookies

```typescript
// app/actions.ts
"use server";

import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");

  // 验证用户
  const user = await authenticateUser(username, password);

  if (user) {
    // 设置认证 cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });

    return { success: true };
  }

  return { success: false, error: "Invalid credentials" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}
```

---

## 问题 3：cookies 和 headers 的使用有什么限制？

在 Server Components 中使用 cookies 和 headers 有一些重要的限制需要了解。

### 限制 1：只能在异步组件中使用

```typescript
// ✅ 正确：异步 Server Component
export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return <div>{token?.value}</div>;
}

// ❌ 错误：同步组件
export default function Page() {
  const cookieStore = cookies(); // 错误！
  return <div>...</div>;
}
```

### 限制 2：cookies() 和 headers() 会导致动态渲染

```typescript
// 使用 cookies() 或 headers() 会让页面变成动态渲染
export default async function Page() {
  // 这行代码会让整个页面变成动态渲染（SSR）
  const cookieStore = await cookies();

  // 页面无法被静态生成（SSG）
  // 每次请求都会重新渲染

  return <div>Dynamic page</div>;
}
```

### 限制 3：不能在 Client Components 中直接使用

```typescript
// ❌ 错误：Client Component 中不能使用
"use client";

import { cookies } from "next/headers";

export default function ClientPage() {
  const cookieStore = cookies(); // 错误！只能在 Server Component 中使用
  return <div>...</div>;
}

// ✅ 正确：通过 props 传递
// Server Component
import { cookies } from "next/headers";
import ClientComponent from "./ClientComponent";

export default async function ServerPage() {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;

  return <ClientComponent theme={theme} />;
}

// Client Component
("use client");
export default function ClientComponent({ theme }: { theme: string }) {
  return <div>Theme: {theme}</div>;
}
```

### 限制 4：设置 cookies 的时机限制

```typescript
// ✅ 可以在 Server Actions 中设置
"use server";
export async function updateTheme(theme: string) {
  const cookieStore = await cookies();
  cookieStore.set("theme", theme);
}

// ✅ 可以在 Route Handlers 中设置
// app/api/theme/route.ts
export async function POST(request: Request) {
  const { theme } = await request.json();
  const cookieStore = await cookies();
  cookieStore.set("theme", theme);
  return Response.json({ success: true });
}

// ⚠️ 在 Server Component 中设置可能不会立即生效
export default async function Page() {
  const cookieStore = await cookies();
  cookieStore.set("theme", "dark"); // 会在响应中设置，但当前渲染看不到

  const theme = cookieStore.get("theme"); // 可能还是旧值
  return <div>{theme?.value}</div>;
}
```

---

## 问题 4：cookies 和 headers 的实际应用场景有哪些？

了解常见的应用场景可以帮助我们更好地使用这些 API。

### 场景 1：用户认证

```typescript
// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");

  // 检查用户是否登录
  if (!authToken) {
    redirect("/login");
  }

  // 验证 token
  const user = await validateToken(authToken.value);

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### 场景 2：主题切换

```typescript
// app/layout.tsx
import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";

  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}

// app/actions.ts
("use server");
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleTheme() {
  const cookieStore = await cookies();
  const currentTheme = cookieStore.get("theme")?.value || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  cookieStore.set("theme", newTheme, {
    maxAge: 60 * 60 * 24 * 365, // 1 年
  });

  revalidatePath("/");
}
```

### 场景 3：语言/地区检测

```typescript
// app/page.tsx
import { headers, cookies } from "next/headers";

export default async function Page() {
  const headersList = await headers();
  const cookieStore = await cookies();

  // 优先使用用户设置的语言
  let locale = cookieStore.get("locale")?.value;

  // 如果没有设置，从 Accept-Language header 中获取
  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");
    locale = parseAcceptLanguage(acceptLanguage); // 解析语言偏好
  }

  // 获取内容
  const content = await getLocalizedContent(locale);

  return <div>{content}</div>;
}

function parseAcceptLanguage(header: string | null): string {
  if (!header) return "en";
  // 简单解析：取第一个语言
  return header.split(",")[0].split("-")[0];
}
```

### 场景 4：A/B 测试

```typescript
// app/page.tsx
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();

  // 检查用户是否已经分配了测试组
  let variant = cookieStore.get("ab_test_variant")?.value;

  // 如果没有，随机分配
  if (!variant) {
    variant = Math.random() < 0.5 ? "A" : "B";
    cookieStore.set("ab_test_variant", variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 天
    });
  }

  // 根据测试组显示不同内容
  return (
    <div>
      {variant === "A" ? (
        <h1>Welcome to our site!</h1>
      ) : (
        <h1>Discover amazing content!</h1>
      )}
    </div>
  );
}
```

### 场景 5：用户代理检测

```typescript
// app/page.tsx
import { headers } from "next/headers";

export default async function Page() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // 检测设备类型
  const isMobile = /mobile/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const isBot = /bot|crawler|spider/i.test(userAgent);

  return (
    <div>
      <p>Device: {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}</p>
      <p>Is Bot: {isBot ? "Yes" : "No"}</p>
      {isMobile && <MobileLayout />}
      {!isMobile && <DesktopLayout />}
    </div>
  );
}
```

## 总结

**核心概念总结**：

### 1. 基本使用

- 使用 `cookies()` 读取和设置 cookies
- 使用 `headers()` 读取请求头
- 只能在 Server Components 和 Server Actions 中使用

### 2. 重要限制

- 必须在异步组件中使用
- 会导致页面动态渲染
- 不能在 Client Components 中直接使用
- 设置 cookies 需要注意时机

### 3. 常见应用

- 用户认证和授权
- 主题和偏好设置
- 语言和地区检测
- A/B 测试
- 设备检测

## 延伸阅读

- [Next.js cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Next.js headers API](https://nextjs.org/docs/app/api-reference/functions/headers)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
