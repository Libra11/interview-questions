---
title: SSR 页面如何检测用户登录状态？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握在 Next.js Server Components 中检测用户登录状态的多种方法，实现服务端渲染的权限控制
tags:
  - Next.js
  - SSR
  - 身份验证
  - Server Components
estimatedTime: 20 分钟
keywords:
  - SSR
  - Server Components
  - 身份验证
  - 登录状态
highlight: Server Components 可以直接在服务端检测登录状态，无需客户端 JavaScript
order: 143
---

## 问题 1：为什么要在 SSR 中检测登录状态？

服务端检测可以提供更好的用户体验和安全性。

### 客户端检测的问题

```javascript
// ❌ 客户端检测（不推荐）
"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>加载中...</div>; // 闪烁
  }

  if (!user) {
    return <div>请先登录</div>; // 内容闪烁
  }

  return <div>欢迎，{user.name}</div>;
}

// 问题：
// 1. 页面闪烁（loading → 未登录 → 已登录）
// 2. SEO 不友好（爬虫看不到内容）
// 3. 安全性差（敏感内容先渲染再隐藏）
// 4. 需要额外的 API 请求
```

### 服务端检测的优势

```javascript
// ✅ 服务端检测（推荐）
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login"); // 服务端重定向
  }

  return <div>欢迎，{session.user.name}</div>;
}

// 优势：
// 1. 无闪烁（服务端已经决定渲染什么）
// 2. SEO 友好（搜索引擎看到正确内容）
// 3. 更安全（未授权用户根本看不到内容）
// 4. 无额外请求（服务端直接检查）
```

---

## 问题 2：使用 Auth.js 检测登录状态

Auth.js 提供了简单的服务端检测方法。

### 基本用法

```javascript
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  // 未登录
  if (!session) {
    redirect("/login");
  }

  // 已登录
  return (
    <div>
      <h1>Dashboard</h1>
      <p>欢迎，{session.user.name}</p>
      <p>邮箱：{session.user.email}</p>
    </div>
  );
}
```

### 角色检查

```javascript
// app/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 检查角色
  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1>管理后台</h1>
      <p>管理员：{session.user.name}</p>
    </div>
  );
}
```

### 可选登录

```javascript
// app/page.tsx
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  // 根据登录状态显示不同内容
  return (
    <div>
      <h1>首页</h1>
      {session ? (
        <div>
          <p>欢迎回来，{session.user.name}</p>
          <a href="/dashboard">进入控制台</a>
        </div>
      ) : (
        <div>
          <p>欢迎访问</p>
          <a href="/login">登录</a>
        </div>
      )}
    </div>
  );
}
```

---

## 问题 3：使用 Cookies 检测登录状态

直接读取和验证 cookies。

### 读取 Cookie

```javascript
// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  // 验证 token
  const user = await verifyToken(token);

  if (!user) {
    redirect("/login");
  }

  return <div>欢迎，{user.name}</div>;
}
```

### JWT 验证

```javascript
// lib/auth.ts
import { jwtVerify } from "jose";

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function DashboardPage() {
  const token = cookies().get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);

  if (!payload) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>用户 ID：{payload.userId}</p>
    </div>
  );
}
```

### Session 验证

```javascript
// lib/session.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getSession(sessionId: string) {
  const session = await redis.hgetall(`session:${sessionId}`);

  if (!session || !session.userId) {
    return null;
  }

  return session;
}

// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Page() {
  const sessionId = cookies().get("session-id")?.value;

  if (!sessionId) {
    redirect("/login");
  }

  const session = await getSession(sessionId);

  if (!session) {
    redirect("/login");
  }

  // 从数据库获取用户信息
  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  return <div>欢迎，{user.name}</div>;
}
```

---

## 问题 4：创建可复用的认证工具

### 认证 Wrapper

```javascript
// lib/auth-wrapper.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireRole(role: string) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect('/unauthorized');
  }

  return session;
}

// 使用
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth-wrapper';

export default async function DashboardPage() {
  const session = await requireAuth();

  return <div>欢迎，{session.user.name}</div>;
}

// app/admin/page.tsx
import { requireRole } from '@/lib/auth-wrapper';

export default async function AdminPage() {
  const session = await requireRole('admin');

  return <div>管理后台</div>;
}
```

### 高阶组件

```javascript
// lib/with-auth.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export function withAuth(Component: any, options?: {
  requireRole?: string;
  redirectTo?: string;
}) {
  return async function AuthenticatedComponent(props: any) {
    const session = await auth();

    if (!session) {
      redirect(options?.redirectTo || '/login');
    }

    if (options?.requireRole && session.user.role !== options.requireRole) {
      redirect('/unauthorized');
    }

    return <Component {...props} session={session} />;
  };
}

// 使用
// app/dashboard/page.tsx
import { withAuth } from '@/lib/with-auth';

async function DashboardPage({ session }: { session: any }) {
  return <div>欢迎，{session.user.name}</div>;
}

export default withAuth(DashboardPage);

// app/admin/page.tsx
async function AdminPage({ session }: { session: any }) {
  return <div>管理后台</div>;
}

export default withAuth(AdminPage, { requireRole: 'admin' });
```

---

## 问题 5：处理加载状态和错误

### Suspense 边界

```javascript
// app/dashboard/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function DashboardContent() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 获取用户数据（可能较慢）
  const userData = await fetchUserData(session.user.id);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>欢迎，{session.user.name}</p>
      <div>{userData.content}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
```

### 错误边界

```javascript
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>出错了</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
}

// app/dashboard/page.tsx
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    throw new Error('未登录'); // 会被 error.tsx 捕获
  }

  return <div>Dashboard</div>;
}
```

---

## 问题 6：优化性能

### 缓存会话

```javascript
// lib/auth.ts
import { cache } from 'react';
import { auth as nextAuth } from '@/auth';

// 使用 React cache 避免重复调用
export const auth = cache(async () => {
  return await nextAuth();
});

// 在同一个请求中多次调用 auth()，只会执行一次
// app/layout.tsx
import { auth } from '@/lib/auth';

export default async function Layout({ children }) {
  const session = await auth(); // 第一次调用

  return (
    <html>
      <body>
        <Header session={session} />
        {children}
      </body>
    </html>
  );
}

// app/page.tsx
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth(); // 使用缓存的结果

  return <div>欢迎</div>;
}
```

### 并行数据获取

```javascript
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 并行获取多个数据
  const [user, posts, stats] = await Promise.all([
    fetchUser(session.user.id),
    fetchPosts(session.user.id),
    fetchStats(session.user.id),
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <UserProfile user={user} />
      <PostsList posts={posts} />
      <StatsPanel stats={stats} />
    </div>
  );
}
```

### 部分预渲染

```javascript
// app/dashboard/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// 静态部分（立即渲染）
async function StaticHeader() {
  return (
    <header>
      <h1>Dashboard</h1>
    </header>
  );
}

// 动态部分（需要认证）
async function DynamicContent() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const data = await fetchData(session.user.id);

  return <div>{data.content}</div>;
}

export default function DashboardPage() {
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<div>加载中...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

---

## 问题 7：测试认证逻辑

### 单元测试

```javascript
// __tests__/auth.test.ts
import { requireAuth } from '@/lib/auth-wrapper';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

jest.mock('@/auth');
jest.mock('next/navigation');

describe('requireAuth', () => {
  it('应该在未登录时重定向', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    await requireAuth();

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('应该在已登录时返回 session', async () => {
    const mockSession = { user: { id: '123', name: 'John' } };
    (auth as jest.Mock).mockResolvedValue(mockSession);

    const result = await requireAuth();

    expect(result).toEqual(mockSession);
  });
});
```

### E2E 测试

```javascript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("未登录用户访问 dashboard 应该重定向到登录页", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL("/login");
});

test("已登录用户可以访问 dashboard", async ({ page }) => {
  // 先登录
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');

  // 访问 dashboard
  await page.goto("/dashboard");

  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
```

---

## 总结

**核心概念总结**：

### 1. 服务端检测优势

- 无页面闪烁
- SEO 友好
- 更安全
- 无额外请求

### 2. 检测方法

- Auth.js：`await auth()`
- Cookies：`cookies().get('token')`
- JWT 验证：`jwtVerify()`
- Session 查询：从数据库/Redis 获取

### 3. 最佳实践

- 创建可复用的认证工具
- 使用 React cache 避免重复调用
- 并行获取数据
- 添加 Suspense 和错误边界

### 4. 性能优化

- 缓存会话
- 并行数据获取
- 部分预渲染
- 避免不必要的数据库查询

## 延伸阅读

- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Auth.js with Next.js](https://authjs.dev/getting-started/installation?framework=next.js)
- [React cache](https://react.dev/reference/react/cache)
- [Suspense](https://react.dev/reference/react/Suspense)
