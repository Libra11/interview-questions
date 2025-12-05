---
title: Auth.js 的 Session 在 Edge 端如何处理？
category: Next.js
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  理解 Auth.js 在 Edge Runtime 中的会话处理机制，掌握边缘环境下的身份验证最佳实践
tags:
  - Auth.js
  - Edge Runtime
  - Session
  - Middleware
estimatedTime: 20 分钟
keywords:
  - Edge Runtime
  - Session
  - JWT
  - Middleware
highlight: Edge Runtime 只支持 JWT 会话策略，需要特殊处理才能在边缘环境中验证用户身份
order: 19
---

## 问题 1：Edge Runtime 的限制

Edge Runtime 不支持所有 Node.js API，这影响了 Auth.js 的使用。

### 主要限制

```javascript
// ❌ Edge Runtime 不支持
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient(); // 错误：不支持数据库连接

// ❌ 不支持文件系统
import fs from "fs";
fs.readFileSync("./data.json"); // 错误：fs 模块不可用

// ❌ 不支持某些加密算法
import crypto from "crypto";
crypto.createHash("sha256"); // 部分功能不支持

// ✅ Edge Runtime 支持
import { cookies } from "next/headers";
const token = cookies().get("token"); // 支持

fetch("https://api.example.com/data"); // 支持
```

### 对 Auth.js 的影响

```javascript
// ❌ Database 会话策略不支持
export const { auth } = NextAuth({
  adapter: PrismaAdapter(prisma), // 需要数据库连接
  session: {
    strategy: "database", // Edge Runtime 不支持
  },
});

// ✅ JWT 会话策略支持
export const { auth } = NextAuth({
  session: {
    strategy: "jwt", // Edge Runtime 支持
  },
});
```

---

## 问题 2：JWT 会话在 Edge 中如何工作？

JWT 会话将所有信息存储在加密的 token 中，无需数据库查询。

### JWT 会话流程

```javascript
// 1. 用户登录
用户提交凭证 → 验证成功 → 生成 JWT

// 2. JWT 内容
{
  sub: 'user-id-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  iat: 1234567890,
  exp: 1234567890 + 2592000 // 30 天后过期
}

// 3. JWT 加密
原始数据 → 使用密钥加密 → 生成 token

// 4. 存储
Set-Cookie: next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 5. 验证
读取 cookie → 解密 JWT → 验证签名 → 返回用户信息
```

### 配置 JWT 会话

```javascript
// auth.ts
import NextAuth from "next-auth";

export const { handlers, auth } = NextAuth({
  providers: [
    /* ... */
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // 首次登录
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }

      // 更新会话
      if (trigger === "update") {
        // 可以更新 token 内容
      }

      return token;
    },

    async session({ session, token }) {
      // 将 JWT 内容添加到 session
      session.user.id = token.id;
      session.user.role = token.role;

      return session;
    },
  },

  // 密钥（必须设置）
  secret: process.env.AUTH_SECRET,
});
```

---

## 问题 3：在 Middleware 中验证会话

Middleware 运行在 Edge Runtime，可以使用 JWT 会话。

### 基本用法

```javascript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { auth: session } = req;

  // 未登录
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 已登录
  return NextResponse.next();
});

// 配置匹配路径
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
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

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

### 添加自定义头

```javascript
// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { auth: session } = req;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 添加用户信息到请求头
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', session.user.id);
  requestHeaders.set('x-user-role', session.user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

// 在 Server Component 中读取
import { headers } from 'next/headers';

export default function Page() {
  const userId = headers().get('x-user-id');
  const userRole = headers().get('x-user-role');

  return <div>User ID: {userId}</div>;
}
```

---

## 问题 4：JWT 会话的安全性

JWT 会话需要特别注意安全性。

### 密钥管理

```javascript
// .env.local
AUTH_SECRET=your-super-secret-key-min-32-chars

// 生成密钥
// npx auth secret

// auth.ts
export const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET, // 必须设置
  // ...
});

// 注意：
// 1. 密钥必须足够长（至少 32 字符）
// 2. 不要提交到版本控制
// 3. 生产环境使用环境变量
// 4. 定期轮换密钥
```

### Token 过期

```javascript
// auth.ts
export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 天过期
  },

  callbacks: {
    async jwt({ token, user }) {
      // 添加过期时间
      if (user) {
        token.exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      }

      // 检查是否过期
      if (token.exp && Date.now() / 1000 > token.exp) {
        // Token 已过期
        return null;
      }

      return token;
    },
  },
});
```

### 敏感信息处理

```javascript
// ❌ 不要在 JWT 中存储敏感信息
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.password = user.password; // 危险！
      token.creditCard = user.creditCard; // 危险！
    }
    return token;
  },
}

// ✅ 只存储必要的标识信息
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id; // 安全
      token.role = user.role; // 安全
      token.email = user.email; // 相对安全
    }
    return token;
  },
}

// 敏感信息在需要时从数据库查询
async function getUserDetails(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      // 不包含敏感字段
    },
  });
}
```

---

## 问题 5：JWT 会话的限制和解决方案

### 限制 1：无法主动失效

```javascript
// 问题：JWT 在过期前一直有效
// 即使用户被封禁，token 仍然可用

// 解决方案 1：短过期时间 + Refresh Token
export const { auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 分钟短过期
  },
});

// 解决方案 2：黑名单（需要外部存储）
// middleware.ts
import { auth } from '@/auth';
import { redis } from '@/lib/redis';

export default auth(async (req) => {
  const { auth: session } = req;

  if (session) {
    // 检查黑名单
    const isBlacklisted = await redis.get(`blacklist:${session.user.id}`);

    if (isBlacklisted) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

// 解决方案 3：版本号
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.version = user.tokenVersion; // 存储版本号
    }
    return token;
  },

  async session({ session, token }) {
    // 验证版本号
    const user = await getUserFromDB(token.id);

    if (user.tokenVersion !== token.version) {
      // 版本不匹配，token 失效
      throw new Error('Token expired');
    }

    return session;
  },
}
```

### 限制 2：Token 大小

```javascript
// JWT 存储在 cookie 中，有大小限制（通常 4KB）

// ❌ Token 过大
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.permissions = user.permissions; // 可能很大
      token.settings = user.settings; // 可能很大
      token.metadata = user.metadata; // 可能很大
    }
    return token;
  },
}

// ✅ 只存储必要信息
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id; // 小
      token.role = user.role; // 小
    }
    return token;
  },

  async session({ session, token }) {
    // 需要时从数据库查询详细信息
    const userDetails = await getUserDetails(token.id);
    session.user = { ...session.user, ...userDetails };
    return session;
  },
}
```

### 限制 3：无法实时更新

```javascript
// 问题：用户信息更新后，JWT 不会立即反映

// 解决方案 1：客户端手动刷新
"use client";

import { useSession } from "next-auth/react";

export function ProfileUpdater() {
  const { update } = useSession();

  async function updateProfile() {
    // 更新用户信息
    await fetch("/api/user/update", {
      method: "POST",
      body: JSON.stringify({ name: "New Name" }),
    });

    // 刷新 session
    await update();
  }

  return <button onClick={updateProfile}>更新</button>;
}

// 解决方案 2：短过期时间
// 用户信息会在下次 token 刷新时更新

// 解决方案 3：混合策略
// 关键信息使用 JWT
// 非关键信息实时查询
async function getSession() {
  const session = await auth();

  if (session) {
    // 实时查询最新信息
    const latestInfo = await getUserLatestInfo(session.user.id);
    return { ...session, user: { ...session.user, ...latestInfo } };
  }

  return null;
}
```

---

## 总结

**核心概念总结**：

### 1. Edge Runtime 限制

- 不支持数据库连接
- 不支持完整的 Node.js API
- 只能使用 JWT 会话策略

### 2. JWT 会话特点

- 所有信息存储在加密 token 中
- 无需数据库查询
- 适合 Edge Runtime
- 需要设置密钥

### 3. Middleware 使用

- 可以在边缘验证会话
- 支持角色检查
- 可以添加自定义请求头
- 高性能，低延迟

### 4. 安全考虑

- 使用强密钥
- 设置合理的过期时间
- 不存储敏感信息
- 考虑黑名单机制

### 5. JWT 限制

- 无法主动失效（需要额外机制）
- Token 大小限制（4KB）
- 无法实时更新（需要刷新）

## 延伸阅读

- [Auth.js Edge Compatibility](https://authjs.dev/reference/core#edge-compatibility)
- [JWT Session Strategy](https://authjs.dev/concepts/session-strategies#jwt-session)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime](https://edge-runtime.vercel.app/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
