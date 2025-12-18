---
title: 中间件与 Edge Runtime 的关系？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中间件与 Edge Runtime 的关系，掌握边缘计算的核心概念和应用场景
tags:
  - Next.js
  - Middleware
  - Edge Runtime
  - 边缘计算
estimatedTime: 22 分钟
keywords:
  - Next.js Middleware
  - Edge Runtime
  - 边缘计算
  - Vercel Edge
highlight: Next.js 中间件运行在 Edge Runtime 上，提供低延迟的全球化请求处理能力
order: 4
---

## 问题 1：什么是 Edge Runtime？

Edge Runtime 是一个轻量级的 JavaScript 运行时环境，专门为边缘计算场景设计。

### 核心特点

**1. 轻量级设计**

- 相比 Node.js Runtime，Edge Runtime 体积更小
- 启动速度极快，冷启动时间通常在几毫秒内
- 内存占用更少，适合大规模分布式部署

**2. 全球分布**

- 代码部署在全球多个边缘节点
- 请求会被路由到离用户最近的节点
- 显著降低网络延迟（TTFB）

**3. API 限制**

- 不支持所有 Node.js API（如 `fs`、`child_process`）
- 只支持 Web 标准 API（如 `fetch`、`Response`、`Request`）
- 这是为了保证代码可以在任何边缘节点上运行

```javascript
// ✅ Edge Runtime 支持
const response = await fetch("https://api.example.com/data");
const data = await response.json();

// ❌ Edge Runtime 不支持
const fs = require("fs"); // 错误：fs 模块不可用
const file = fs.readFileSync("./data.txt");
```

---

## 问题 2：Next.js 中间件为什么必须运行在 Edge Runtime？

中间件的设计目标决定了它必须运行在 Edge Runtime 上。

### 设计考量

**1. 性能要求**

- 中间件在每个请求到达时都会执行
- 必须极快响应，不能成为性能瓶颈
- Edge Runtime 的快速启动特性正好满足这个需求

**2. 全局拦截能力**

- 中间件需要在请求到达服务器之前处理
- 边缘节点部署让拦截发生在离用户最近的位置
- 减少不必要的跨区域网络请求

**3. 可扩展性**

- 中间件可能需要处理大量并发请求
- Edge Runtime 的分布式特性天然支持水平扩展
- 每个边缘节点独立处理请求，互不影响

```javascript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 这段代码运行在全球边缘节点上
  // 而不是在中心服务器上

  const country = request.geo?.country || "US";

  // 根据用户地理位置重定向
  if (country === "CN" && !request.nextUrl.pathname.startsWith("/cn")) {
    return NextResponse.redirect(new URL("/cn", request.url));
  }

  return NextResponse.next();
}
```

---

## 问题 3：Edge Runtime 有哪些限制？

由于 Edge Runtime 的特殊设计，它有一些重要限制。

### 主要限制

**1. 不支持 Node.js 原生模块**

```javascript
// ❌ 这些都不能在 Edge Runtime 中使用
import fs from "fs";
import path from "path";
import crypto from "crypto"; // 部分功能不支持
import { exec } from "child_process";
```

**2. 执行时间限制**

- Vercel 上默认限制为 25 秒（Pro 计划）
- 其他平台可能有不同限制
- 超时会导致请求失败

**3. 内存限制**

- 通常限制在 128MB 左右
- 不适合处理大文件或复杂计算
- 需要保持代码轻量

**4. 不支持动态导入某些模块**

```javascript
// ❌ 不能动态导入 Node.js 模块
const module = await import("some-node-module");

// ✅ 可以使用 Web 标准 API
const response = await fetch("https://api.example.com");
```

### 解决方案

如果需要使用 Node.js 特性，可以：

- 将逻辑移到 API Route（使用 Node.js Runtime）
- 使用支持 Edge 的第三方库
- 通过外部 API 调用实现功能

```javascript
// middleware.ts - Edge Runtime
export function middleware(request: NextRequest) {
  // 简单的逻辑判断和重定向
  return NextResponse.next();
}

// app/api/complex/route.ts - Node.js Runtime
export const runtime = "nodejs"; // 显式指定使用 Node.js Runtime

export async function POST(request: Request) {
  // 这里可以使用 fs、crypto 等 Node.js 模块
  const fs = require("fs");
  // ... 复杂逻辑
}
```

---

## 问题 4：如何在中间件中处理复杂逻辑？

当中间件需要执行复杂操作时，需要采用特殊策略。

### 策略一：请求头传递

将判断结果通过请求头传递给后续处理：

```javascript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  // 在边缘做简单验证
  const isValid = token && token.value.length > 0;

  // 通过请求头传递信息
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-valid", isValid.toString());
  requestHeaders.set("x-user-ip", request.ip || "");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// app/api/user/route.ts
export async function GET(request: Request) {
  // 读取中间件设置的请求头
  const isAuthValid = request.headers.get("x-auth-valid") === "true";
  const userIp = request.headers.get("x-user-ip");

  // 在这里做复杂的数据库查询等操作
  if (isAuthValid) {
    // 使用 Node.js Runtime 的完整能力
  }
}
```

### 策略二：外部 API 调用

将复杂逻辑封装为独立的 API：

```javascript
// middleware.ts
export async function middleware(request: NextRequest) {
  // 调用外部验证服务
  const response = await fetch("https://auth.example.com/verify", {
    headers: {
      Authorization: request.cookies.get("token")?.value || "",
    },
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### 策略三：边缘数据库

使用支持边缘访问的数据库：

```javascript
// middleware.ts
import { createClient } from "@vercel/edge-config";

export async function middleware(request: NextRequest) {
  // Vercel Edge Config 专为 Edge Runtime 设计
  const edgeConfig = createClient(process.env.EDGE_CONFIG);
  const featureFlags = await edgeConfig.get("features");

  // 根据特性开关决定路由
  if (!featureFlags?.newUI) {
    return NextResponse.rewrite(new URL("/old-ui", request.url));
  }

  return NextResponse.next();
}
```

---

## 总结

**核心概念总结**：

### 1. Edge Runtime 本质

- 轻量级 JavaScript 运行时，专为边缘计算设计
- 全球分布式部署，降低延迟
- 只支持 Web 标准 API，不支持 Node.js 特有功能

### 2. 中间件与 Edge Runtime 的关系

- 中间件强制运行在 Edge Runtime 上
- 这是为了实现低延迟的全局请求拦截
- 需要遵守 Edge Runtime 的 API 限制

### 3. 实践建议

- 保持中间件逻辑简单快速
- 复杂逻辑移到 API Route 或外部服务
- 使用请求头传递信息给后续处理
- 选择支持边缘访问的数据库和服务

## 延伸阅读

- [Next.js Middleware 官方文档](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime 文档](https://edge-runtime.vercel.app/)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Web Standard APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Edge Config 文档](https://vercel.com/docs/storage/edge-config)
