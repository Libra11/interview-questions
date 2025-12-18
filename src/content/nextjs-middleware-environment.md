---
title: 中间件运行在什么环境？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js Middleware 运行在 Edge Runtime 环境的特点、限制和优势，学习如何编写适合 Edge 环境的代码。
tags:
  - Next.js
  - Middleware
  - Edge Runtime
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - Edge Runtime
  - Middleware 环境
  - Next.js Edge
  - 运行时限制
highlight: 理解 Middleware 的 Edge Runtime 环境及其限制
order: 704
---

## 问题 1：Middleware 运行在什么环境？

Next.js Middleware 运行在 Edge Runtime，而不是 Node.js Runtime。

### Edge Runtime 的特点

**Edge Runtime 是什么**：

- 轻量级的 JavaScript 运行时
- 基于 Web 标准 API
- 部署在全球边缘节点
- 启动速度极快
- 内存占用小

**与 Node.js Runtime 的区别**：

```typescript
// ✅ Edge Runtime 支持
// - Web 标准 API
// - Fetch API
// - Headers, Request, Response
// - URL, URLSearchParams
// - TextEncoder, TextDecoder
// - crypto (Web Crypto API)

// ❌ Edge Runtime 不支持
// - Node.js 内置模块 (fs, path, etc.)
// - 原生 Node.js API
// - 某些 npm 包
// - 文件系统操作
// - 子进程
```

### 为什么使用 Edge Runtime？

**性能优势**：

- 冷启动时间短（<1ms）
- 全球分布式部署
- 更接近用户
- 降低延迟

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 这段代码运行在全球边缘节点
  // 无论用户在哪里，都能快速响应

  const start = Date.now();
  const response = NextResponse.next();
  const duration = Date.now() - start;

  response.headers.set("X-Response-Time", `${duration}ms`);
  return response;
}
```

---

## 问题 2：Edge Runtime 有哪些限制？

Edge Runtime 的轻量特性带来了一些限制。

### 限制 1：不能使用 Node.js API

```typescript
// middleware.ts

// ❌ 错误：不能使用 Node.js 模块
import fs from "fs"; // 错误！
import path from "path"; // 错误！
import { exec } from "child_process"; // 错误！

export function middleware(request: NextRequest) {
  // ❌ 不能读取文件系统
  const data = fs.readFileSync("./data.json"); // 错误！

  // ❌ 不能使用 Node.js Buffer
  const buffer = Buffer.from("hello"); // 错误！

  return NextResponse.next();
}

// ✅ 正确：使用 Web 标准 API
export function middleware(request: NextRequest) {
  // ✅ 使用 Web Crypto API
  const uuid = crypto.randomUUID();

  // ✅ 使用 TextEncoder
  const encoder = new TextEncoder();
  const data = encoder.encode("hello");

  return NextResponse.next();
}
```

### 限制 2：npm 包兼容性

```typescript
// middleware.ts

// ❌ 某些 npm 包不兼容 Edge Runtime
import moment from "moment"; // 可能不兼容
import lodash from "lodash"; // 可能不兼容

// ✅ 使用 Edge 兼容的替代品
import { format } from "date-fns"; // 兼容
import { parseISO } from "date-fns"; // 兼容

export function middleware(request: NextRequest) {
  const now = new Date();
  const formatted = format(now, "yyyy-MM-dd");

  return NextResponse.next();
}
```

### 限制 3：执行时间限制

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // ⚠️ Middleware 有执行时间限制
  // Vercel: 25-50ms（取决于套餐）
  // 超时会导致请求失败

  // ❌ 避免耗时操作
  // - 复杂计算
  // - 大量数据处理
  // - 多次外部 API 调用

  // ✅ 保持 Middleware 轻量快速
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### 限制 4：环境变量

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // ✅ 可以访问环境变量
  const apiKey = process.env.API_KEY;
  const nodeEnv = process.env.NODE_ENV;

  // ⚠️ 注意：只有在构建时可用的环境变量才能访问
  // 需要在 next.config.js 中配置

  return NextResponse.next();
}

// next.config.js
module.exports = {
  env: {
    API_KEY: process.env.API_KEY,
  },
};
```

---

## 问题 3：如何编写 Edge Runtime 兼容的代码？

遵循最佳实践可以确保代码在 Edge Runtime 中正常运行。

### 最佳实践 1：使用 Web 标准 API

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ✅ 使用 Web Crypto API
  const randomId = crypto.randomUUID();

  // ✅ 使用 TextEncoder/TextDecoder
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const encoded = encoder.encode("Hello");
  const decoded = decoder.decode(encoded);

  // ✅ 使用 URL API
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // ✅ 使用 Headers API
  const headers = new Headers();
  headers.set("X-Custom-Header", "value");

  return NextResponse.next({
    headers,
  });
}
```

### 最佳实践 2：使用轻量级库

```typescript
// middleware.ts
// ✅ 推荐：轻量级、Edge 兼容的库
import { jwtVerify } from "jose"; // JWT 验证
import { parse } from "cookie"; // Cookie 解析

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (token) {
    try {
      // 使用 jose 验证 JWT（Edge 兼容）
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // 将用户信息添加到请求头
      const response = NextResponse.next();
      response.headers.set("X-User-Id", payload.sub as string);

      return response;
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

### 最佳实践 3：避免复杂计算

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // ❌ 避免：复杂计算
  // function complexCalculation() {
  //   let result = 0;
  //   for (let i = 0; i < 1000000; i++) {
  //     result += Math.sqrt(i);
  //   }
  //   return result;
  // }

  // ✅ 推荐：简单快速的操作
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/dashboard");

  if (isProtected) {
    const token = request.cookies.get("auth");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

### 最佳实践 4：缓存和优化

```typescript
// middleware.ts
// 使用 Map 缓存数据（注意：在 Edge 环境中，每个请求都是独立的）
const cache = new Map<string, any>();

export function middleware(request: NextRequest) {
  const cacheKey = request.url;

  // 检查缓存
  if (cache.has(cacheKey)) {
    const response = NextResponse.next();
    response.headers.set("X-Cache", "HIT");
    return response;
  }

  // 处理请求
  const response = NextResponse.next();
  cache.set(cacheKey, true);
  response.headers.set("X-Cache", "MISS");

  return response;
}
```

---

## 问题 4：如何检测代码是否兼容 Edge Runtime？

Next.js 提供了工具来检测和确保代码兼容性。

### 使用 runtime 配置

```typescript
// app/api/edge/route.ts
// 显式声明使用 Edge Runtime
export const runtime = "edge";

export async function GET() {
  // 这个 API 路由将在 Edge Runtime 中运行
  return Response.json({ message: "Running on Edge" });
}

// app/api/nodejs/route.ts
// 使用 Node.js Runtime
export const runtime = "nodejs";

export async function GET() {
  // 这个 API 路由将在 Node.js Runtime 中运行
  // 可以使用 Node.js API
  const fs = require("fs");
  return Response.json({ message: "Running on Node.js" });
}
```

### 检查兼容性

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 检查运行环境
  const isEdge = typeof EdgeRuntime !== "undefined";

  console.log("Running on Edge:", isEdge);

  // 根据环境执行不同逻辑
  if (isEdge) {
    // Edge Runtime 特定逻辑
  }

  return NextResponse.next();
}
```

### 常见错误和解决方案

```typescript
// ❌ 错误 1：使用 Node.js Buffer
// const buffer = Buffer.from('hello');

// ✅ 解决：使用 Uint8Array
const encoder = new TextEncoder();
const buffer = encoder.encode("hello");

// ❌ 错误 2：使用 fs 模块
// import fs from 'fs';
// const data = fs.readFileSync('./file.txt');

// ✅ 解决：使用 fetch 或将数据移到 API 路由
const response = await fetch("https://api.example.com/data");
const data = await response.text();

// ❌ 错误 3：使用不兼容的 npm 包
// import moment from 'moment';

// ✅ 解决：使用 Edge 兼容的替代品
import { format } from "date-fns";

// ❌ 错误 4：复杂的同步操作
// function heavyComputation() {
//   // 大量计算...
// }

// ✅ 解决：将复杂操作移到 API 路由或后台任务
// Middleware 只做简单的路由判断和重定向
```

## 总结

**核心概念总结**：

### 1. Edge Runtime 特点

- 轻量级、快速启动
- 全球分布式部署
- 基于 Web 标准 API
- 有执行时间和功能限制

### 2. 主要限制

- 不支持 Node.js API
- 某些 npm 包不兼容
- 有执行时间限制
- 不能访问文件系统

### 3. 最佳实践

- 使用 Web 标准 API
- 选择 Edge 兼容的库
- 保持代码轻量快速
- 避免复杂计算和 I/O 操作

## 延伸阅读

- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Web Standards API](https://developer.mozilla.org/en-US/docs/Web/API)
- [Edge Runtime Limitations](https://nextjs.org/docs/app/api-reference/edge#unsupported-apis)
