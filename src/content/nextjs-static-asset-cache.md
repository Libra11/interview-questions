---
title: 静态资源缓存策略有哪些？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  了解 Next.js 中静态资源的缓存策略，包括自动哈希、不可变资源和 CDN 配置
tags:
  - Next.js
  - 静态资源
  - 缓存策略
  - CDN
estimatedTime: 18 分钟
keywords:
  - 静态资源缓存
  - Cache-Control
  - 资源哈希
  - immutable
highlight: Next.js 通过内容哈希和 immutable 指令实现静态资源的永久缓存
order: 34
---

## 问题 1：Next.js 如何处理静态资源缓存？

Next.js 对不同类型的静态资源采用不同的缓存策略。

### 资源分类

**1. 构建产物（Build Artifacts）**

- JavaScript bundles（`_next/static/chunks/`）
- CSS 文件（`_next/static/css/`）
- 自动添加内容哈希

**2. 公共资源（Public Assets）**

- `public/` 目录下的文件
- 图片、字体、图标等
- 不会自动添加哈希

**3. 优化后的图片**

- 通过 `next/image` 处理的图片
- 存储在 `_next/image/` 路径下

```
项目结构：
public/
  ├── logo.png          → /logo.png（无哈希）
  ├── fonts/
  │   └── custom.woff2  → /fonts/custom.woff2（无哈希）

构建后：
.next/static/
  ├── chunks/
  │   └── app-abc123.js  → /_next/static/chunks/app-abc123.js（有哈希）
  ├── css/
  │   └── app-def456.css → /_next/static/css/app-def456.css（有哈希）
```

---

## 问题 2：内容哈希如何实现永久缓存？

Next.js 通过内容哈希实现安全的永久缓存。

### 工作原理

**1. 自动生成哈希**

```javascript
// 源文件
app / page.tsx;

// 构建后
_next / static / chunks / app - page - a1b2c3d4.js;

// 文件内容变化时
_next / static / chunks / app - page - e5f6g7h8.js;
```

**2. 缓存策略**

```
Cache-Control: public, max-age=31536000, immutable
```

- `public`：允许 CDN 和浏览器缓存
- `max-age=31536000`：缓存 1 年
- `immutable`：告诉浏览器文件永不改变

**3. 缓存失效**

```javascript
// 旧版本
<script src="/_next/static/chunks/app-abc123.js"></script>

// 代码更新后，HTML 引用新文件
<script src="/_next/static/chunks/app-xyz789.js"></script>

// 浏览器会请求新文件，旧文件缓存自然失效
```

### 优势

```javascript
// ✅ 好处 1：永久缓存
// 用户第二次访问时，所有 JS/CSS 都从缓存读取
// 只需要下载 HTML

// ✅ 好处 2：精确失效
// 只有修改的文件会生成新哈希
// 未修改的文件继续使用缓存

// 示例：
// 修改 app/page.tsx
_next / static / chunks / app - page - NEW_HASH.js; // 新哈希
_next / static / chunks / framework - OLD_HASH.js; // 哈希不变，继续缓存
```

---

## 问题 3：public 目录的资源如何缓存？

`public/` 目录下的资源没有自动哈希，需要手动管理。

### 默认行为

```javascript
// public/logo.png
// 访问路径：/logo.png

// Next.js 不会添加哈希
// 每次构建后路径保持不变
```

### 缓存策略

**方案 1：手动添加版本号**

```javascript
// public/logo-v2.png
import Image from "next/image";

export default function Logo() {
  return <Image src="/logo-v2.png" alt="Logo" width={200} height={50} />;
}

// 更新时修改文件名
// public/logo-v3.png
```

**方案 2：查询参数版本控制**

```javascript
// next.config.js
module.exports = {
  env: {
    ASSET_VERSION: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
  },
};

// 组件中使用
export default function Logo() {
  const version = process.env.ASSET_VERSION;
  return <img src={`/logo.png?v=${version}`} alt="Logo" />;
}

// 每次部署后，查询参数会变化
// /logo.png?v=abc123
// /logo.png?v=def456
```

**方案 3：使用 import 导入**

```javascript
// 导入图片会自动添加哈希
import logo from "@/public/logo.png";

export default function Logo() {
  return <img src={logo.src} alt="Logo" />;
}

// 构建后自动生成：
// /_next/static/media/logo.a1b2c3d4.png
```

### 推荐做法

```javascript
// 对于需要频繁更新的资源
// 使用 import 方式
import heroImage from "@/public/hero.jpg";

// 对于不常变化的资源（如 favicon）
// 直接放在 public/ 目录
// public/favicon.ico → /favicon.ico
```

---

## 问题 4：如何配置 CDN 缓存？

Next.js 自动设置合适的缓存头，但可以根据需求调整。

### 默认缓存头

**构建产物**：

```
/_next/static/*
Cache-Control: public, max-age=31536000, immutable
```

**优化图片**：

```
/_next/image/*
Cache-Control: public, max-age=60, must-revalidate
```

**页面**：

```
/posts
Cache-Control: s-maxage=60, stale-while-revalidate
```

### 自定义缓存头

**方法 1：next.config.js**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        // 匹配所有静态资源
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 匹配特定文件类型
        source: "/:path*.{jpg,jpeg,png,gif,webp}",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};
```

**方法 2：Middleware**

```javascript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 为特定路径设置缓存头
  if (request.nextUrl.pathname.startsWith("/api/public")) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return response;
}
```

**方法 3：API Route**

```javascript
// app/api/data/route.ts
export async function GET() {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
```

### CDN 配置示例

**Vercel（自动配置）**：

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Cloudflare**：

```javascript
// 使用 Page Rules 或 Workers
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);

  if (request.url.includes("/_next/static/")) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return newResponse;
  }

  return response;
}
```

---

## 问题 5：stale-while-revalidate 策略如何工作？

这是一种平衡性能和新鲜度的缓存策略。

### 工作原理

```
Cache-Control: s-maxage=60, stale-while-revalidate=300
```

**含义**：

- `s-maxage=60`：CDN 缓存 60 秒
- `stale-while-revalidate=300`：过期后 300 秒内可以返回旧内容，同时后台更新

### 时间线示例

```javascript
// app/posts/page.tsx
export const revalidate = 60;

export default async function PostsPage() {
  const posts = await fetch("https://api.example.com/posts").then((r) =>
    r.json()
  );
  return <PostList posts={posts} />;
}

// 响应头：
// Cache-Control: s-maxage=60, stale-while-revalidate

// 时间线：
// 0:00 - 用户 A 访问，生成页面，CDN 缓存
// 0:30 - 用户 B 访问，CDN 返回缓存（新鲜）
// 1:00 - 用户 C 访问，CDN 返回缓存（新鲜）
// 1:05 - 用户 D 访问，CDN 返回旧缓存（过期但在 stale-while-revalidate 期间）
//        同时触发后台重新生成
// 1:06 - 用户 E 访问，CDN 返回新内容（后台更新完成）
```

### 优势

```javascript
// ✅ 好处 1：用户永远不会等待
// 即使缓存过期，也立即返回旧内容
// 不会因为重新生成而阻塞用户

// ✅ 好处 2：内容保持相对新鲜
// 后台自动更新，下一个用户看到新内容

// ✅ 好处 3：减少服务器压力
// 不是每个请求都触发重新生成
// 只有在 stale 期间的首次请求才触发
```

### 实际应用

```javascript
// 不同场景的配置

// 1. 高频更新内容（新闻、股票）
export const revalidate = 10; // 10 秒
// Cache-Control: s-maxage=10, stale-while-revalidate=60

// 2. 中频更新内容（博客文章）
export const revalidate = 300; // 5 分钟
// Cache-Control: s-maxage=300, stale-while-revalidate=3600

// 3. 低频更新内容（文档）
export const revalidate = 3600; // 1 小时
// Cache-Control: s-maxage=3600, stale-while-revalidate=86400

// 4. 静态内容（关于页面）
export const revalidate = false; // 永久缓存
// Cache-Control: s-maxage=31536000, immutable
```

---

## 总结

**核心概念总结**：

### 1. 资源分类

- **构建产物**：自动哈希，永久缓存（1 年）
- **Public 资源**：无哈希，需手动版本控制
- **优化图片**：短期缓存（60 秒），可重新验证

### 2. 缓存策略

- **immutable**：告诉浏览器文件永不改变
- **max-age**：设置缓存时长
- **stale-while-revalidate**：过期后返回旧内容，后台更新

### 3. 最佳实践

- 充分利用内容哈希实现永久缓存
- Public 资源使用 import 或版本号
- 根据更新频率选择合适的 revalidate 时间
- 使用 stale-while-revalidate 平衡性能和新鲜度

### 4. CDN 配置

- Next.js 自动设置合适的缓存头
- 可通过 next.config.js 或 Middleware 自定义
- 不同 CDN 提供商有不同的配置方式

## 延伸阅读

- [Next.js Static Assets](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Vercel Caching](https://vercel.com/docs/edge-network/caching)
- [next.config.js headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
