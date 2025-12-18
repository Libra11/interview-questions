---
title: NextAuth 如何集成 Next.js App Router？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  学习如何在 Next.js App Router 中集成 NextAuth.js（Auth.js v5），实现完整的身份验证流程
tags:
  - Next.js
  - NextAuth
  - Auth.js
  - 身份验证
estimatedTime: 25 分钟
keywords:
  - NextAuth
  - Auth.js
  - App Router
  - 身份验证
highlight: Auth.js v5 为 App Router 提供了原生支持，包括 Server Components 和 Server Actions
order: 117
---

## 问题 1：NextAuth 和 Auth.js 的关系

NextAuth.js 已经演进为 Auth.js，v5 版本专为 App Router 设计。

### 版本对比

```javascript
// NextAuth v4（Pages Router）
import NextAuth from "next-auth";

export default NextAuth({
  providers: [
    /* ... */
  ],
});

// Auth.js v5（App Router）
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    /* ... */
  ],
});
```

### 核心概念

```javascript
// Auth.js v5 导出的内容
const {
  handlers, // { GET, POST } - API 路由处理器
  auth, // () => Session - 获取会话
  signIn, // (provider) => void - 登录
  signOut, // () => void - 登出
} = NextAuth(config);
```

---

## 问题 2：如何配置 Auth.js？

### 基本配置

```javascript
// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // OAuth 提供商
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),

    // 自定义凭证登录
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // 验证用户
        const user = await verifyUser(credentials.email, credentials.password);

        if (user) {
          return user; // 返回用户对象
        }

        return null; // 验证失败
      },
    }),
  ],

  // 回调函数
  callbacks: {
    async jwt({ token, user }) {
      // 将用户信息添加到 JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // 将 JWT 信息添加到 session
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // 页面配置
  pages: {
    signIn: "/login", // 自定义登录页面
    error: "/auth/error",
  },
});
```

### API 路由设置

```javascript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// 这会创建以下端点：
// GET  /api/auth/signin
// POST /api/auth/signin/:provider
// GET  /api/auth/signout
// POST /api/auth/signout
// GET  /api/auth/callback/:provider
// GET  /api/auth/session
// GET  /api/auth/csrf
// GET  /api/auth/providers
```

---

## 问题 3：如何在 Server Components 中使用？

### 获取会话

```javascript
// app/page.tsx
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>欢迎，{session.user?.name}</h1>
      <p>邮箱：{session.user?.email}</p>
    </div>
  );
}
```

### 保护路由

```javascript
// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>用户 ID：{session.user.id}</p>
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

  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1>管理后台</h1>
    </div>
  );
}
```

---

## 问题 4：如何在 Client Components 中使用？

### SessionProvider

```javascript
// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### useSession Hook

```javascript
// app/components/UserMenu.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>加载中...</div>;
  }

  if (!session) {
    return <button onClick={() => signIn()}>登录</button>;
  }

  return (
    <div>
      <p>欢迎，{session.user?.name}</p>
      <button onClick={() => signOut()}>登出</button>
    </div>
  );
}
```

### 条件渲染

```javascript
"use client";

import { useSession } from "next-auth/react";

export default function ProtectedContent() {
  const { data: session } = useSession({
    required: true, // 未登录时重定向
    onUnauthenticated() {
      // 自定义未认证行为
      window.location.href = "/login";
    },
  });

  return (
    <div>
      <h1>受保护的内容</h1>
      <p>只有登录用户才能看到</p>
    </div>
  );
}
```

---

## 问题 5：如何使用 Server Actions？

### 登录 Action

```javascript
// app/actions/auth.ts
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function handleSignIn(provider: string) {
  try {
    await signIn(provider, { redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: '用户名或密码错误' };
        default:
          return { error: '登录失败' };
      }
    }
    throw error;
  }
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/' });
}

// 凭证登录
export async function handleCredentialsSignIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }
    throw error;
  }
}
```

### 登录表单

```javascript
// app/login/page.tsx
import { handleSignIn, handleCredentialsSignIn } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div>
      <h1>登录</h1>

      {/* OAuth 登录 */}
      <form
        action={async () => {
          "use server";
          await handleSignIn("github");
        }}
      >
        <button type="submit">使用 GitHub 登录</button>
      </form>

      <form
        action={async () => {
          "use server";
          await handleSignIn("google");
        }}
      >
        <button type="submit">使用 Google 登录</button>
      </form>

      {/* 凭证登录 */}
      <form action={handleCredentialsSignIn}>
        <input type="email" name="email" placeholder="邮箱" required />
        <input type="password" name="password" placeholder="密码" required />
        <button type="submit">登录</button>
      </form>
    </div>
  );
}
```

### 登出按钮

```javascript
// app/components/SignOutButton.tsx
import { handleSignOut } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={handleSignOut}>
      <button type="submit">登出</button>
    </form>
  );
}
```

---

## 问题 6：数据库集成

### 使用 Prisma Adapter

```javascript
// auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // ...
  ],

  // 数据库会话
  session: {
    strategy: 'database',
  },
});

// Prisma Schema
// schema.prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### JWT 会话

```javascript
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    /* ... */
  ],

  // JWT 会话（无需数据库）
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // 首次登录时
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // OAuth 登录时
      if (account) {
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.accessToken = token.accessToken;

      return session;
    },
  },
});
```

---

## 总结

**核心概念总结**：

### 1. Auth.js v5 特性

- 原生支持 App Router
- Server Components 集成
- Server Actions 支持
- 类型安全

### 2. 配置方式

- 统一的配置文件（auth.ts）
- 导出 handlers、auth、signIn、signOut
- API 路由自动处理

### 3. 使用场景

- Server Components：使用 `auth()` 函数
- Client Components：使用 `useSession` Hook
- Server Actions：直接调用 `signIn`/`signOut`

### 4. 会话策略

- JWT：无需数据库，适合简单场景
- Database：需要数据库，功能更强大
- 使用 Adapter 连接数据库

## 延伸阅读

- [Auth.js 官方文档](https://authjs.dev/)
- [NextAuth.js v5 升级指南](https://authjs.dev/getting-started/migrating-to-v5)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [OAuth Providers](https://authjs.dev/getting-started/providers)
- [Credentials Provider](https://authjs.dev/getting-started/providers/credentials-tutorial)
