---
title: Next.js 15 中 fetch 请求的缓存行为变化
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 15 中 fetch 请求缓存默认行为的重大变化，掌握新的缓存策略和最佳实践。
tags:
  - Next.js
  - 缓存
  - fetch
  - 性能优化
estimatedTime: 20 分钟
keywords:
  - Next.js 15
  - fetch缓存
  - 缓存策略
  - no-cache
highlight: 掌握 Next.js 15 中 fetch 缓存的新默认行为，理解如何正确配置缓存策略
order: 317
---

## 问题 1：Next.js 15 之前的 fetch 缓存行为是什么？

**Next.js 13-14 的默认缓存行为**

在 Next.js 15 之前，`fetch` 请求**默认会被缓存**，这是一个激进的优化策略：

```typescript
// Next.js 13-14
// app/page.tsx
export default async function Page() {
  // ✅ 默认会被缓存（force-cache）
  const res = await fetch("https://api.example.com/data");
  const data = await res.json();

  return <div>{data.title}</div>;
}

// 等价于
const res = await fetch("https://api.example.com/data", {
  cache: "force-cache", // 默认值
});
```

**默认缓存的影响**

```typescript
// 问题：数据可能过时
export default async function Page() {
  // 这个请求会被永久缓存
  const res = await fetch("https://api.example.com/posts");
  const posts = await res.json();

  // 即使数据更新了，页面仍然显示旧数据
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**如何在 Next.js 14 中禁用缓存**

```typescript
// 方式 1：使用 cache: 'no-store'
const res = await fetch("https://api.example.com/data", {
  cache: "no-store", // 禁用缓存
});

// 方式 2：使用 revalidate
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 0 }, // 每次请求都重新获取
});

// 方式 3：在路由段配置
export const revalidate = 0; // 禁用整个页面的缓存
```

---

## 问题 2：Next.js 15 的 fetch 缓存行为有什么变化？

**新的默认行为：不缓存（no-cache）**

Next.js 15 改变了默认策略，`fetch` 请求**默认不再缓存**：

```typescript
// Next.js 15
// app/page.tsx
export default async function Page() {
  // ✅ 默认不缓存（no-cache）
  const res = await fetch("https://api.example.com/data");
  const data = await res.json();

  return <div>{data.title}</div>;
}

// 等价于
const res = await fetch("https://api.example.com/data", {
  cache: "no-cache", // 新的默认值
});
```

**为什么要改变默认行为？**

1. **更符合直觉**：大多数开发者期望获取最新数据
2. **减少困惑**：避免"为什么数据没更新"的问题
3. **更安全的默认值**：避免意外缓存敏感数据

```typescript
// Next.js 14：容易出现问题
export default async function Dashboard() {
  // ❌ 用户数据被缓存，可能显示过时信息
  const res = await fetch("https://api.example.com/user/profile");
  const user = await res.json();

  return <div>Welcome, {user.name}</div>;
}

// Next.js 15：默认行为更安全
export default async function Dashboard() {
  // ✅ 每次都获取最新数据
  const res = await fetch("https://api.example.com/user/profile");
  const user = await res.json();

  return <div>Welcome, {user.name}</div>;
}
```

---

## 问题 3：如何在 Next.js 15 中启用缓存？

**显式启用缓存**

如果需要缓存，必须显式指定：

```typescript
// 方式 1：使用 cache: 'force-cache'
const res = await fetch("https://api.example.com/data", {
  cache: "force-cache", // 永久缓存
});

// 方式 2：使用 next.revalidate（推荐）
const res = await fetch("https://api.example.com/data", {
  next: {
    revalidate: 3600, // 缓存 1 小时
  },
});

// 方式 3：在路由段配置
export const revalidate = 3600; // 整个页面缓存 1 小时

export default async function Page() {
  const res = await fetch("https://api.example.com/data");
  // 会使用路由段的 revalidate 配置
}
```

**不同缓存策略的对比**

```typescript
// 1. 不缓存（默认）
const res1 = await fetch("https://api.example.com/data");
// 或
const res1 = await fetch("https://api.example.com/data", {
  cache: "no-cache",
});

// 2. 永久缓存
const res2 = await fetch("https://api.example.com/data", {
  cache: "force-cache",
});

// 3. 定时重新验证（推荐）
const res3 = await fetch("https://api.example.com/data", {
  next: { revalidate: 60 }, // 60 秒后重新验证
});

// 4. 按需重新验证
const res4 = await fetch("https://api.example.com/data", {
  next: {
    tags: ["posts"], // 使用标签
  },
});

// 在 Server Action 中触发重新验证
("use server");
import { revalidateTag } from "next/cache";

export async function createPost() {
  await db.post.create({});
  revalidateTag("posts"); // 重新验证带有 'posts' 标签的请求
}
```

---

## 问题 4：缓存策略的最佳实践是什么？

**场景 1：静态内容（很少变化）**

```typescript
// 博客文章、产品信息等
export default async function BlogPost({ params }: { params: { id: string } }) {
  // 使用较长的重新验证时间
  const res = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: {
      revalidate: 3600, // 1 小时
      tags: ["posts"],
    },
  });

  const post = await res.json();
  return <article>{post.content}</article>;
}

// 当内容更新时，手动触发重新验证
("use server");
import { revalidateTag } from "next/cache";

export async function updatePost(id: string) {
  await db.post.update({ where: { id } });
  revalidateTag("posts");
}
```

**场景 2：动态内容（频繁变化）**

```typescript
// 用户仪表板、实时数据等
export default async function Dashboard() {
  // 不缓存，每次获取最新数据
  const res = await fetch("https://api.example.com/dashboard", {
    cache: "no-cache",
  });

  const data = await res.json();
  return <div>{/* 显示实时数据 */}</div>;
}

// 或使用短的重新验证时间
const res = await fetch("https://api.example.com/dashboard", {
  next: { revalidate: 10 }, // 10 秒
});
```

**场景 3：混合策略**

```typescript
export default async function Page() {
  // 静态数据：长时间缓存
  const categories = await fetch("https://api.example.com/categories", {
    next: { revalidate: 86400 }, // 24 小时
  }).then((res) => res.json());

  // 动态数据：不缓存
  const trending = await fetch("https://api.example.com/trending", {
    cache: "no-cache",
  }).then((res) => res.json());

  return (
    <div>
      <Categories data={categories} />
      <Trending data={trending} />
    </div>
  );
}
```

**场景 4：按需重新验证**

```typescript
// 使用标签管理缓存
export default async function ProductList() {
  const res = await fetch("https://api.example.com/products", {
    next: {
      revalidate: 3600,
      tags: ["products"],
    },
  });

  const products = await res.json();
  return <div>{/* 产品列表 */}</div>;
}

// 在管理后台更新产品时，触发重新验证
("use server");
import { revalidateTag, revalidatePath } from "next/cache";

export async function updateProduct(id: string) {
  await db.product.update({ where: { id } });

  // 重新验证所有带有 'products' 标签的请求
  revalidateTag("products");

  // 或重新验证特定路径
  revalidatePath("/products");
}
```

---

## 问题 5：如何从 Next.js 14 迁移到 Next.js 15？

**迁移步骤**

```typescript
// 1. 审查现有的 fetch 请求
// Next.js 14
export default async function Page() {
  // 这个请求在 14 中会被缓存
  const res = await fetch("https://api.example.com/data");
}

// 2. 决定是否需要缓存
// 如果需要缓存，添加显式配置
export default async function Page() {
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // 添加缓存配置
  });
}

// 3. 对于不需要缓存的请求，无需修改
export default async function Page() {
  // Next.js 15 中默认不缓存，符合预期
  const res = await fetch("https://api.example.com/user");
}
```

**迁移检查清单**

```typescript
// ✅ 检查所有 fetch 请求
// ✅ 确定哪些需要缓存
// ✅ 添加适当的缓存配置
// ✅ 测试数据更新是否正常
// ✅ 监控性能指标

// 示例：迁移前后对比
// Next.js 14
export const revalidate = 0; // 禁用默认缓存

export default async function Page() {
  const res = await fetch("https://api.example.com/data");
}

// Next.js 15
// 移除 revalidate = 0（不再需要）
export default async function Page() {
  const res = await fetch("https://api.example.com/data");
  // 默认不缓存，无需额外配置
}
```

**性能优化建议**

```typescript
// 1. 为静态内容启用缓存
const staticData = await fetch("https://api.example.com/config", {
  next: { revalidate: 86400 }, // 24 小时
});

// 2. 使用标签管理缓存
const posts = await fetch("https://api.example.com/posts", {
  next: {
    revalidate: 3600,
    tags: ["posts"],
  },
});

// 3. 并行请求
const [users, posts] = await Promise.all([
  fetch("https://api.example.com/users", {
    next: { revalidate: 300 },
  }),
  fetch("https://api.example.com/posts", {
    next: { revalidate: 600 },
  }),
]);

// 4. 使用 Suspense 和流式渲染
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
```

---

## 总结

**核心变化**：

### 1. 默认行为

- **Next.js 14**：`cache: 'force-cache'`（默认缓存）
- **Next.js 15**：`cache: 'no-cache'`（默认不缓存）

### 2. 变化原因

- 更符合开发者直觉
- 避免数据过时问题
- 更安全的默认值
- 减少意外缓存

### 3. 如何启用缓存

- 使用 `cache: 'force-cache'`（永久缓存）
- 使用 `next.revalidate`（定时重新验证）
- 使用路由段配置
- 使用标签和按需重新验证

### 4. 最佳实践

**静态内容**：使用较长的 revalidate 时间
**动态内容**：使用 no-cache 或短的 revalidate
**混合策略**：根据数据特性分别配置
**按需更新**：使用标签和 revalidateTag

### 5. 迁移建议

- 审查所有 fetch 请求
- 为需要缓存的请求添加配置
- 测试数据更新行为
- 监控性能变化

## 延伸阅读

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Next.js 官方文档 - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Next.js 官方文档 - Caching](https://nextjs.org/docs/app/building-your-application/caching)
