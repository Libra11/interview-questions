---
title: 使用 JWT 还是 Session？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入对比 JWT 和 Session 两种身份验证方案，掌握在 Next.js 中的选择标准和实现方法
tags:
  - Next.js
  - JWT
  - Session
  - 身份验证
estimatedTime: 25 分钟
keywords:
  - JWT
  - Session
  - 身份验证
  - Token
highlight: JWT 适合无状态场景和 Edge Runtime，Session 适合需要即时控制的场景
order: 21
---

## 问题 1：JWT 和 Session 的基本区别

两种方案在存储位置和验证方式上有本质区别。

### JWT（JSON Web Token）

```javascript
// 工作流程
用户登录 → 服务器生成 JWT → 返回给客户端 → 客户端存储 → 后续请求携带 JWT

// JWT 结构
{
  header: {
    alg: 'HS256',
    typ: 'JWT'
  },
  payload: {
    sub: 'user-id-123',
    name: 'John Doe',
    role: 'admin',
    exp: 1735689600
  },
  signature: '...'
}

// 特点：
// 1. 自包含：所有信息都在 token 中
// 2. 无状态：服务器不存储 token
// 3. 可验证：通过签名验证真实性
```

### Session

```javascript
// 工作流程
用户登录 → 服务器创建 session → 返回 session ID → 客户端存储 ID → 后续请求携带 ID → 服务器查询 session

// Session 存储（服务器端）
{
  'session-id-abc123': {
    userId: 'user-id-123',
    name: 'John Doe',
    role: 'admin',
    createdAt: '2025-12-05T10:00:00Z',
    expiresAt: '2025-12-06T10:00:00Z'
  }
}

// 客户端只存储 session ID
Cookie: session-id=abc123

// 特点：
// 1. 服务器存储：session 数据在服务器
// 2. 有状态：需要维护 session 存储
// 3. 可控制：可以随时失效 session
```

---

## 问题 2：JWT 的优势和劣势

### 优势

```javascript
// 1. 无状态，易扩展
// 不需要服务器存储，多台服务器都能验证
const jwt = require("jsonwebtoken");

// 服务器 A 生成
const token = jwt.sign(
  { userId: "123", role: "admin" },
  process.env.JWT_SECRET
);

// 服务器 B 验证（只需要相同的密钥）
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 2. 跨域友好
// 可以在不同域名之间传递
fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 3. 移动端友好
// 不依赖 cookie，适合 App
const response = await fetch("/api/data", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// 4. 支持 Edge Runtime
// 可以在边缘节点验证，无需访问数据库
export default auth((req) => {
  const { auth: session } = req; // JWT 解码
  // 在边缘节点完成验证
});
```

### 劣势

```javascript
// 1. 无法主动失效
// 用户被封禁，但 token 在过期前仍然有效
const token = jwt.sign(
  { userId: '123' },
  secret,
  { expiresIn: '7d' } // 7 天内都有效
);

// 解决方案：黑名单（需要额外存储）
const isBlacklisted = await redis.get(`blacklist:${userId}`);

// 2. Token 大小限制
// 存储在 cookie 中有 4KB 限制
const token = jwt.sign({
  userId: '123',
  name: 'John Doe',
  email: 'john@example.com',
  permissions: [...], // 如果权限很多，可能超出限制
  metadata: {...}
}, secret);

// 3. 无法实时更新
// 用户信息更新后，token 不会立即反映
// 需要等到 token 过期或手动刷新

// 4. 安全性考虑
// 如果密钥泄露，所有 token 都不安全
// 需要妥善保管密钥
```

---

## 问题 3：Session 的优势和劣势

### 优势

```javascript
// 1. 可以主动失效
// 服务器端删除 session 即可
await redis.del(`session:${sessionId}`);
// 用户立即失去访问权限

// 2. 实时更新
// 更新 session 数据，立即生效
await redis.hset(`session:${sessionId}`, {
  role: "admin", // 升级为管理员
  updatedAt: Date.now(),
});

// 3. 更安全
// 敏感信息存储在服务器端
await redis.hset(`session:${sessionId}`, {
  userId: "123",
  permissions: ["read", "write", "delete"],
  creditCard: "****1234", // 敏感信息不会发送到客户端
});

// 4. 灵活控制
// 可以限制同时登录设备数
const sessions = await redis.keys(`session:user:${userId}:*`);
if (sessions.length >= 3) {
  // 删除最旧的 session
  await redis.del(sessions[0]);
}
```

### 劣势

```javascript
// 1. 需要存储
// 需要 Redis、数据库等存储方案
const session = await redis.get(`session:${sessionId}`);

// 增加了基础设施成本

// 2. 扩展性问题
// 多台服务器需要共享 session 存储
// 服务器 A 创建的 session，服务器 B 也要能访问

// 解决方案：使用 Redis 等中心化存储
const redis = new Redis({
  host: "redis.example.com",
  port: 6379,
});

// 3. 不支持 Edge Runtime
// Edge Runtime 无法访问数据库
// middleware.ts
export default async function middleware(req) {
  const sessionId = req.cookies.get("session-id");
  // ❌ 无法在 Edge 中查询数据库
  const session = await db.session.findUnique({ where: { id: sessionId } });
}

// 4. 跨域复杂
// Cookie 的跨域限制
// 需要配置 CORS 和 SameSite
```

---

## 问题 4：在 Next.js 中如何选择？

### 选择 JWT 的场景

```javascript
// 1. 使用 Edge Runtime / Middleware
// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  // JWT 可以在边缘验证
  const { auth: session } = req;
});

// 2. 无状态 API
// app/api/data/route.ts
import { verify } from "jsonwebtoken";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.split(" ")[1];
  const decoded = verify(token, process.env.JWT_SECRET);

  // 无需查询数据库
  return Response.json({ data: "..." });
}

// 3. 微服务架构
// 多个服务共享 JWT 验证
// Service A, B, C 都可以验证同一个 JWT

// 4. 移动应用
// App 使用 JWT 更方便
const token = await AsyncStorage.getItem("token");
fetch("/api/data", {
  headers: { Authorization: `Bearer ${token}` },
});

// 5. 简单场景
// 不需要复杂的会话管理
export const { auth } = NextAuth({
  session: { strategy: "jwt" },
});
```

### 选择 Session 的场景

```javascript
// 1. 需要即时控制
// 封禁用户立即生效
async function banUser(userId: string) {
  const sessions = await redis.keys(`session:user:${userId}:*`);
  await Promise.all(sessions.map(s => redis.del(s)));
  // 用户所有 session 立即失效
}

// 2. 需要实时更新
// 用户权限变更立即生效
async function updateUserRole(userId: string, newRole: string) {
  const sessions = await redis.keys(`session:user:${userId}:*`);
  await Promise.all(sessions.map(s =>
    redis.hset(s, 'role', newRole)
  ));
}

// 3. 存储大量数据
// Session 可以存储更多信息
await redis.hset(`session:${sessionId}`, {
  userId: '123',
  preferences: {...}, // 大量用户偏好
  cart: [...], // 购物车数据
  history: [...], // 浏览历史
});

// 4. 高安全性要求
// 敏感信息不离开服务器
await redis.hset(`session:${sessionId}`, {
  userId: '123',
  twoFactorVerified: true,
  lastLoginIP: '1.2.3.4',
});

// 5. 传统 Web 应用
// 主要使用 Server Components
export default async function Page() {
  const session = await getServerSession();
  // 从数据库获取完整的 session 数据
}
```

---

## 问题 5：混合方案

实际项目中可以结合两种方案的优势。

### JWT + Redis

```javascript
// 使用 JWT，但维护黑名单
// auth.ts
export const { auth, signOut } = NextAuth({
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      // 检查黑名单
      const isBlacklisted = await redis.get(`blacklist:${token.sub}`);
      if (isBlacklisted) {
        return null; // token 失效
      }
      return token;
    },
  },
});

// 登出时加入黑名单
export async function handleSignOut(userId: string) {
  await redis.set(`blacklist:${userId}`, "1", "EX", 7 * 24 * 60 * 60);
  await signOut();
}
```

### Session + JWT

```javascript
// 使用 Session，但生成 JWT 给第三方
// app/api/auth/token/route.ts
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 生成短期 JWT 给第三方 API
  const token = jwt.sign({ userId: session.user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return Response.json({ token });
}
```

### 双 Token 方案

```javascript
// Access Token（JWT，短期）+ Refresh Token（Session，长期）

// 登录时返回两个 token
export async function login(credentials) {
  const user = await verifyCredentials(credentials);

  // 短期 Access Token（15 分钟）
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  // 长期 Refresh Token（30 天）
  const refreshToken = crypto.randomBytes(32).toString("hex");
  await redis.set(`refresh:${refreshToken}`, user.id, "EX", 30 * 24 * 60 * 60);

  return { accessToken, refreshToken };
}

// 刷新 Access Token
export async function refresh(refreshToken: string) {
  const userId = await redis.get(`refresh:${refreshToken}`);

  if (!userId) {
    throw new Error("Invalid refresh token");
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
}
```

---

## 问题 6：实际实现示例

### JWT 实现

```javascript
// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await verifyUser(email, password);

  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken({
    userId: user.id,
    role: user.role,
  });

  return Response.json({ token });
}

// middleware.ts
import { verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### Session 实现

```javascript
// lib/session.ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();

  await redis.hset(`session:${sessionId}`, {
    userId,
    createdAt: Date.now(),
  });

  await redis.expire(`session:${sessionId}`, 7 * 24 * 60 * 60);

  return sessionId;
}

export async function getSession(sessionId: string) {
  return await redis.hgetall(`session:${sessionId}`);
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}

// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await verifyUser(email, password);

  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionId = await createSession(user.id);

  const response = Response.json({ success: true });
  response.headers.set(
    "Set-Cookie",
    `session-id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Max-Age=${
      7 * 24 * 60 * 60
    }`
  );

  return response;
}

// app/page.tsx
import { cookies } from "next/headers";
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

  return <div>Welcome, User {session.userId}</div>;
}
```

---

## 总结

**核心概念总结**：

### 1. JWT 特点

- 无状态，易扩展
- 支持 Edge Runtime
- 无法主动失效
- 有大小限制

### 2. Session 特点

- 有状态，需要存储
- 可以主动失效
- 实时更新
- 不支持 Edge Runtime

### 3. 选择标准

- Edge Runtime → JWT
- 即时控制 → Session
- 微服务 → JWT
- 高安全性 → Session
- 移动端 → JWT

### 4. 混合方案

- JWT + 黑名单
- Session + JWT
- 双 Token（Access + Refresh）

## 延伸阅读

- [JWT Introduction](https://jwt.io/introduction)
- [Session vs Token Authentication](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Auth.js Session Strategies](https://authjs.dev/concepts/session-strategies)
- [OAuth 2.0 and OpenID Connect](https://oauth.net/2/)
