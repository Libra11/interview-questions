---
title: Next.js 是如何决定页面是否"动态"？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 如何判断页面的渲染模式，掌握静态生成和动态渲染的决策机制。
tags:
  - Next.js
  - 动态渲染
  - 静态生成
  - 渲染模式
estimatedTime: 20 分钟
keywords:
  - 动态渲染
  - 静态生成
  - force-dynamic
  - 渲染决策
highlight: 理解 Next.js 如何自动检测页面是否需要动态渲染，掌握控制渲染模式的方法
order: 414
---

## 问题 1：Next.js 如何判断页面是动态还是静态？

**默认行为：尽可能静态**

Next.js 默认会尝试将页面静态生成（SSG），除非检测到动态特性。

```typescript
// app/page.tsx
// ✅ 静态页面（默认）
export default function HomePage() {
  return <h1>Welcome</h1>;
}

// 构建时：
// - 生成静态 HTML
// - 部署后直接返回 HTML
// - 极快的加载速度
```

**触发动态渲染的因素**

```typescript
// 1. 使用动态函数
import { cookies, headers } from "next/headers";

export default function Page() {
  const cookieStore = cookies(); // 动态
  const headersList = headers(); // 动态

  return <div>Dynamic Page</div>;
}

// 2. 使用 no-cache 的 fetch
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "no-cache", // 或 'no-store'
  });

  return <div>Dynamic Page</div>;
}

// 3. 使用 searchParams
export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  // 访问 searchParams 使页面动态
  return <div>Query: {searchParams.q}</div>;
}

// 4. 设置 dynamic 配置
export const dynamic = "force-dynamic";

export default function Page() {
  return <div>Dynamic Page</div>;
}
```

---

## 问题 2：哪些 API 会触发动态渲染？

**动态函数（Dynamic Functions）**

```typescript
// app/page.tsx
import { cookies, headers, draftMode, searchParams } from "next/headers";

// 1. cookies() - 读取 Cookie
export default function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  // 触发动态渲染
  return <div>Token: {token?.value}</div>;
}

// 2. headers() - 读取请求头
export default function Page() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");

  // 触发动态渲染
  return <div>User Agent: {userAgent}</div>;
}

// 3. draftMode() - 草稿模式
export default async function Page() {
  const { isEnabled } = draftMode();

  if (isEnabled) {
    // 触发动态渲染
    return <div>Draft Mode</div>;
  }

  return <div>Published</div>;
}

// 4. searchParams - 查询参数
export default function Page({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  // 触发动态渲染
  return <div>Search: {searchParams.q}</div>;
}
```

**动态 fetch 配置**

```typescript
// 1. cache: 'no-cache'
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "no-cache",
  });

  // 触发动态渲染
  return <div>{data.content}</div>;
}

// 2. cache: 'no-store'
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });

  // 触发动态渲染
  return <div>{data.content}</div>;
}

// 3. revalidate: 0
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 0 },
  });

  // 触发动态渲染
  return <div>{data.content}</div>;
}
```

---

## 问题 3：如何显式控制渲染模式？

**Route Segment Config**

```typescript
// 1. force-dynamic - 强制动态渲染
export const dynamic = "force-dynamic";

export default async function Page() {
  // 即使没有动态特性，也会动态渲染
  return <div>Always Dynamic</div>;
}

// 2. force-static - 强制静态生成
export const dynamic = "force-static";

export default async function Page() {
  // 即使有动态特性，也尝试静态生成
  // 注意：某些动态特性无法静态化，会报错
  return <div>Always Static</div>;
}

// 3. error - 检测到动态特性时报错
export const dynamic = "error";

export default async function Page() {
  // 如果使用动态特性，构建时会报错
  return <div>Static Only</div>;
}

// 4. auto - 自动检测（默认）
export const dynamic = "auto";

export default async function Page() {
  // Next.js 自动决定渲染模式
  return <div>Auto Detect</div>;
}
```

**dynamicParams 配置**

```typescript
// app/blog/[slug]/page.tsx

// 允许动态参数
export const dynamicParams = true; // 默认

export async function generateStaticParams() {
  return [{ slug: "post-1" }, { slug: "post-2" }];
}

export default function Page({ params }) {
  // 访问 /blog/post-1 → 静态页面
  // 访问 /blog/post-3 → 动态生成
  return <div>Post: {params.slug}</div>;
}

// 禁止动态参数
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ slug: "post-1" }, { slug: "post-2" }];
}

export default function Page({ params }) {
  // 访问 /blog/post-1 → 静态页面
  // 访问 /blog/post-3 → 404
  return <div>Post: {params.slug}</div>;
}
```

---

## 问题 4：如何查看页面的渲染模式？

**构建输出**

```bash
# 运行构建
npm run build

# 输出示例：
Route (app)                              Size     First Load JS
┌ ○ /                                    1.2 kB         80 kB
├ ● /blog                                2.3 kB         82 kB
├ ○ /blog/[slug]                         1.5 kB         81 kB
└ ƒ /dashboard                           3.1 kB         83 kB

# 符号说明：
# ○ (Static)  - 静态生成
# ● (SSG)     - 静态生成（带数据）
# ƒ (Dynamic) - 动态渲染
# λ (Server)  - 服务端渲染
```

**开发环境检查**

```typescript
// app/page.tsx
export default function Page() {
  // 开发环境中查看
  console.log("Rendering mode:", process.env.NODE_ENV);

  return <div>Page</div>;
}

// 或使用 Next.js 的调试工具
// 打开浏览器开发者工具
// 查看 Network 标签
// 查找 _next/data 请求
```

---

## 问题 5：如何优化页面的渲染模式？

**尽可能使用静态生成**

```typescript
// ✅ 好：静态生成
export default async function BlogPost({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 3600 }, // ISR：每小时更新
  });

  return <article>{post.content}</article>;
}

// ❌ 不好：完全动态
export default async function BlogPost({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    cache: "no-cache", // 每次请求都获取
  });

  return <article>{post.content}</article>;
}
```

**分离动态和静态部分**

```typescript
// ✅ 好：静态页面 + 客户端动态内容
// app/blog/[slug]/page.tsx（Server Component - 静态）
export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      {/* 动态部分在客户端 */}
      <LikeButton postId={post.id} />
      <Comments postId={post.id} />
    </article>
  );
}

// components/LikeButton.tsx（Client Component）
("use client");

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>{liked ? "❤️" : "🤍"}</button>
  );
}
```

**使用 ISR 代替完全动态**

```typescript
// ❌ 不好：完全动态
export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);
  return <div>{product.name}</div>;
}

// ✅ 好：ISR
export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 60 }, // 每分钟更新
  });

  return <div>{product.name}</div>;
}

// 优势：
// - 首次访问返回缓存的静态页面
// - 后台更新内容
// - 更好的性能
```

---

## 总结

**核心概念**：

### 1. 默认行为

- Next.js 默认尝试静态生成
- 检测到动态特性时自动切换

### 2. 触发动态渲染

**动态函数**：

- `cookies()`
- `headers()`
- `draftMode()`
- `searchParams`

**动态 fetch**：

- `cache: 'no-cache'`
- `cache: 'no-store'`
- `revalidate: 0`

### 3. 显式控制

```typescript
export const dynamic = "force-dynamic"; // 强制动态
export const dynamic = "force-static"; // 强制静态
export const dynamic = "error"; // 禁止动态
export const dynamic = "auto"; // 自动（默认）
```

### 4. 构建输出符号

- `○` - 静态生成
- `●` - 静态生成（带数据）
- `ƒ` - 动态渲染
- `λ` - 服务端渲染

### 5. 优化策略

- 优先使用静态生成
- 使用 ISR 更新内容
- 分离动态和静态部分
- 避免不必要的动态函数

## 延伸阅读

- [Next.js 官方文档 - Static and Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#static-rendering-default)
- [Next.js 官方文档 - Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Next.js 官方文档 - Dynamic Functions](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-functions)
