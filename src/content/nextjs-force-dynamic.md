---
title: Dynamic = force-dynamic 有哪些作用？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细解析 Next.js App Router 中 force-dynamic 配置的作用机制、使用场景和注意事项，帮助开发者正确控制页面的动态渲染行为。
tags:
  - Next.js
  - App Router
  - Dynamic Rendering
  - Route Config
estimatedTime: 20 分钟
keywords:
  - force-dynamic
  - Next.js 动态渲染
  - Route Segment Config
highlight: force-dynamic 是控制页面动态渲染的关键配置，理解它的作用对优化应用至关重要
order: 142
---

## 问题 1：force-dynamic 的基本作用是什么？

`force-dynamic` 是 Next.js App Router 中的一个路由段配置选项，用于强制页面采用动态渲染模式。

### 基本用法

```typescript
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 这个页面会在每次请求时重新渲染
  const data = await fetch("https://api.example.com/data");

  return <div>Dashboard</div>;
}
```

### 核心作用

**1. 禁用静态优化**

即使页面没有使用动态函数，也会在请求时渲染：

```typescript
// 没有 force-dynamic 时，这个页面会被静态生成
export default function Page() {
  return <div>Hello World</div>;
}

// 添加 force-dynamic 后，每次请求都会重新渲染
export const dynamic = "force-dynamic";

export default function Page() {
  return <div>Hello World</div>;
}
```

**2. 覆盖 fetch 缓存**

所有 fetch 请求默认变为 `cache: 'no-store'`：

```typescript
export const dynamic = "force-dynamic";

export default async function Page() {
  // 这个请求不会被缓存，即使没有指定 cache 选项
  const data = await fetch("https://api.example.com/data");

  return <div>{data.title}</div>;
}
```

---

## 问题 2：force-dynamic 与其他 dynamic 选项有什么区别？

Next.js 提供了多个 `dynamic` 配置选项，每个都有不同的行为：

### 1. auto（默认值）

Next.js 自动决定渲染模式：

```typescript
export const dynamic = "auto"; // 默认值，可以不写

export default async function Page() {
  // 如果使用了 cookies()、headers() 等动态函数，会自动变为动态渲染
  // 否则会尝试静态渲染
  return <div>Page</div>;
}
```

### 2. force-dynamic

强制动态渲染，每次请求都重新生成：

```typescript
export const dynamic = "force-dynamic";

export default async function Page() {
  // 总是在请求时渲染
  // 所有 fetch 默认 cache: 'no-store'
  return <div>Current time: {new Date().toISOString()}</div>;
}
```

### 3. force-static

强制静态渲染，即使使用了动态函数：

```typescript
export const dynamic = "force-static";

export default async function Page() {
  // 即使使用了 cookies()，也会在构建时渲染
  // 运行时 cookies() 会返回空值
  const cookieStore = cookies();

  return <div>Static Page</div>;
}
```

### 4. error

如果页面尝试动态渲染，会抛出错误：

```typescript
export const dynamic = "error";

export default async function Page() {
  // 如果这里使用了 cookies() 或其他动态函数
  // 构建时会报错
  return <div>Must be static</div>;
}
```

### 对比总结

| 选项            | 行为     | 使用场景     |
| --------------- | -------- | ------------ |
| `auto`          | 自动决定 | 大多数情况   |
| `force-dynamic` | 强制动态 | 需要实时数据 |
| `force-static`  | 强制静态 | 确保静态生成 |
| `error`         | 禁止动态 | 严格静态站点 |

---

## 问题 3：什么时候应该使用 force-dynamic？

使用 `force-dynamic` 的典型场景：

### 1. 用户个性化内容

需要根据用户信息展示不同内容：

```typescript
// app/profile/page.tsx
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // 获取当前登录用户的信息
  const user = await getCurrentUser();

  // 根据用户权限显示不同内容
  const content = await getPersonalizedContent(user.id);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <div>{content}</div>
    </div>
  );
}
```

### 2. 实时数据展示

需要显示最新数据，不能使用缓存：

```typescript
// app/stock/[symbol]/page.tsx
export const dynamic = "force-dynamic";

export default async function StockPage({ params }) {
  // 股票价格需要实时获取
  const price = await getStockPrice(params.symbol);

  return (
    <div>
      <h1>{params.symbol}</h1>
      <p>Current Price: ${price}</p>
      <p>Updated: {new Date().toLocaleString()}</p>
    </div>
  );
}
```

### 3. 基于请求的路由逻辑

需要根据请求头或 Cookie 进行路由判断：

```typescript
// app/admin/page.tsx
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token");

  // 根据 token 验证管理员权限
  if (!token || !(await verifyAdminToken(token.value))) {
    redirect("/login");
  }

  return <div>Admin Dashboard</div>;
}
```

### 4. A/B 测试或特性开关

需要在服务端决定显示哪个版本：

```typescript
// app/feature/page.tsx
export const dynamic = "force-dynamic";

export default async function FeaturePage() {
  // 根据用户 ID 或随机数决定显示哪个版本
  const variant = await getABTestVariant();

  return <div>{variant === "A" ? <FeatureA /> : <FeatureB />}</div>;
}
```

---

## 问题 4：使用 force-dynamic 有哪些注意事项？

使用 `force-dynamic` 时需要注意以下几点：

### 1. 性能影响

每次请求都会重新渲染，增加服务器负载：

```typescript
// ❌ 不必要的 force-dynamic
export const dynamic = "force-dynamic";

export default function StaticContent() {
  // 这个页面内容完全静态，不需要 force-dynamic
  return <div>Static Content</div>;
}

// ✅ 只在必要时使用
export default function StaticContent() {
  // 让 Next.js 自动优化为静态页面
  return <div>Static Content</div>;
}
```

### 2. 与 revalidate 的冲突

`force-dynamic` 会覆盖 `revalidate` 设置：

```typescript
// revalidate 会被忽略
export const dynamic = "force-dynamic";
export const revalidate = 60; // 这个配置无效

export default async function Page() {
  // 页面总是动态渲染，不会使用 ISR
  return <div>Page</div>;
}
```

### 3. 影响范围

`force-dynamic` 会影响整个路由段及其子路由：

```typescript
// app/dashboard/layout.tsx
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  // 这个 layout 下的所有页面都会是动态渲染
  return <div>{children}</div>;
}

// app/dashboard/settings/page.tsx
// 即使这里没有设置 force-dynamic，也会是动态渲染
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

### 4. 开发环境 vs 生产环境

开发环境下所有页面都是动态的，需要构建后才能看到真实效果：

```bash
# 构建项目查看实际渲染模式
npm run build

# 查看输出中的渲染模式标记
# λ = 动态渲染
# ○ = 静态渲染
```

### 5. 与 generateStaticParams 的关系

使用 `force-dynamic` 时，`generateStaticParams` 不会在构建时生成页面：

```typescript
// app/posts/[id]/page.tsx
export const dynamic = "force-dynamic";

// 这个函数在构建时不会执行
export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export default function PostPage({ params }) {
  // 页面会在请求时动态生成
  return <div>Post {params.id}</div>;
}
```

## 延伸阅读

- [Next.js 官方文档 - Route Segment Config: dynamic](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic)
- [Next.js 官方文档 - Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
- [Next.js 官方文档 - Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel - Understanding Next.js Rendering](https://vercel.com/docs/concepts/next.js/overview)
