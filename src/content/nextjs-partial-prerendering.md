---
title: 什么是 Partial Prerendering（PPR）？
category: Next.js
difficulty: 高级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 的 Partial Prerendering 特性，掌握如何在同一页面中混合静态和动态内容。
tags:
  - Next.js
  - PPR
  - Partial Prerendering
  - 性能优化
estimatedTime: 22 分钟
keywords:
  - Partial Prerendering
  - PPR
  - 混合渲染
  - 流式渲染
highlight: 理解 PPR 如何结合静态生成和动态渲染的优势，实现最佳性能
order: 726
---

## 问题 1：什么是 Partial Prerendering？

**混合静态和动态内容**

Partial Prerendering (PPR) 允许在同一页面中同时使用静态生成和动态渲染。

```typescript
// app/product/[id]/page.tsx

export default async function ProductPage({ params }) {
  return (
    <div>
      {/* 静态部分：构建时生成 */}
      <ProductLayout>
        <ProductImages productId={params.id} />
        <ProductDescription productId={params.id} />
      </ProductLayout>

      {/* 动态部分：请求时渲染 */}
      <Suspense fallback={<StockSkeleton />}>
        <StockStatus productId={params.id} />
      </Suspense>

      <Suspense fallback={<ReviewsSkeleton />}>
        <UserReviews productId={params.id} />
      </Suspense>
    </div>
  );
}

// 工作原理：
// 1. 静态部分在构建时生成 HTML
// 2. 动态部分在请求时服务端渲染
// 3. 静态 HTML 立即返回
// 4. 动态内容流式传输
```

**传统方式 vs PPR**

```typescript
// 传统方式：全部静态或全部动态

// 方式 1：全部静态（数据可能过时）
export default async function Page() {
  const staticData = await fetchData();
  const stock = await fetchStock(); // 库存可能变化

  return (
    <div>
      <ProductInfo data={staticData} />
      <Stock count={stock.count} /> {/* 可能不准确 */}
    </div>
  );
}

// 方式 2：全部动态（性能差）
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await fetchData();
  const stock = await fetchStock();

  // 等待所有数据，用户看到空白页面
  return (
    <div>
      <ProductInfo data={data} />
      <Stock count={stock.count} />
    </div>
  );
}

// PPR：最佳方案
export default async function Page() {
  return (
    <div>
      {/* 静态：立即显示 */}
      <ProductInfo />

      {/* 动态：流式加载 */}
      <Suspense fallback={<Skeleton />}>
        <Stock />
      </Suspense>
    </div>
  );
}
```

---

## 问题 2：PPR 如何工作？

**启用 PPR**

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true, // 启用 PPR（实验性功能）
  },
};

// 或在路由级别启用
// app/product/[id]/page.tsx
export const experimental_ppr = true;
```

**使用 Suspense 标记动态部分**

```typescript
// app/dashboard/page.tsx
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <div>
      {/* 静态部分：立即渲染 */}
      <header>
        <h1>Dashboard</h1>
        <Navigation />
      </header>

      {/* 动态部分 1：用户信息 */}
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>

      {/* 静态部分：布局 */}
      <div className="grid">
        {/* 动态部分 2：统计数据 */}
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>

        {/* 动态部分 3：最近活动 */}
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>

      {/* 静态部分：页脚 */}
      <footer>
        <Copyright />
      </footer>
    </div>
  );
}

// 静态组件（构建时渲染）
function Navigation() {
  return <nav>...</nav>;
}

// 动态组件（请求时渲染）
async function UserProfile() {
  const user = await fetchCurrentUser();
  return <div>{user.name}</div>;
}

async function Stats() {
  const stats = await fetchStats();
  return <div>{stats.total}</div>;
}
```

---

## 问题 3：PPR 的实际应用场景？

**电商产品页**

```typescript
// app/products/[id]/page.tsx
import { Suspense } from "react";

export const experimental_ppr = true;

export default async function ProductPage({ params }) {
  // 静态数据：产品基本信息
  const product = await fetchProduct(params.id);

  return (
    <div>
      {/* 静态：产品信息 */}
      <ProductImages images={product.images} />
      <ProductTitle title={product.title} />
      <ProductDescription description={product.description} />

      {/* 动态：实时库存 */}
      <Suspense fallback={<div>Loading stock...</div>}>
        <StockStatus productId={params.id} />
      </Suspense>

      {/* 动态：个性化推荐 */}
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <PersonalizedRecommendations productId={params.id} />
      </Suspense>

      {/* 动态：用户评论 */}
      <Suspense fallback={<div>Loading reviews...</div>}>
        <UserReviews productId={params.id} />
      </Suspense>
    </div>
  );
}

// 动态组件
async function StockStatus({ productId }) {
  const stock = await fetchRealTimeStock(productId);
  return <div>In Stock: {stock.count}</div>;
}

async function PersonalizedRecommendations({ productId }) {
  const user = await getCurrentUser();
  const recommendations = await fetchRecommendations(user.id, productId);
  return <RecommendationList items={recommendations} />;
}
```

**新闻网站**

```typescript
// app/news/[id]/page.tsx
import { Suspense } from "react";

export const experimental_ppr = true;

export default async function NewsArticle({ params }) {
  // 静态：文章内容
  const article = await fetchArticle(params.id);

  return (
    <article>
      {/* 静态：文章主体 */}
      <h1>{article.title}</h1>
      <div>{article.content}</div>

      {/* 动态：实时评论数 */}
      <Suspense fallback={<div>Loading...</div>}>
        <CommentCount articleId={params.id} />
      </Suspense>

      {/* 动态：相关新闻 */}
      <Suspense fallback={<div>Loading related...</div>}>
        <RelatedNews articleId={params.id} />
      </Suspense>

      {/* 动态：用户评论 */}
      <Suspense fallback={<div>Loading comments...</div>}>
        <Comments articleId={params.id} />
      </Suspense>
    </article>
  );
}
```

**社交媒体个人主页**

```typescript
// app/users/[username]/page.tsx
import { Suspense } from "react";

export const experimental_ppr = true;

export default async function UserProfile({ params }) {
  // 静态：用户基本信息
  const user = await fetchUser(params.username);

  return (
    <div>
      {/* 静态：个人资料 */}
      <UserAvatar avatar={user.avatar} />
      <UserBio bio={user.bio} />

      {/* 动态：在线状态 */}
      <Suspense fallback={<div>...</div>}>
        <OnlineStatus username={params.username} />
      </Suspense>

      {/* 动态：最新帖子 */}
      <Suspense fallback={<PostsSkeleton />}>
        <RecentPosts username={params.username} />
      </Suspense>

      {/* 动态：关注者 */}
      <Suspense fallback={<div>Loading...</div>}>
        <Followers username={params.username} />
      </Suspense>
    </div>
  );
}
```

---

## 问题 4：PPR 的优势和限制？

**优势**

```typescript
// 1. 更快的首次内容绘制（FCP）
// 静态内容立即显示，无需等待动态数据

// 2. 更好的用户体验
// 用户立即看到页面结构，动态内容逐步加载

// 3. 更好的 SEO
// 静态内容被搜索引擎索引

// 4. 灵活性
// 可以精确控制哪些部分静态，哪些动态

// 5. 性能优化
// 减少服务器负载（静态部分不需要服务器渲染）
```

**限制和注意事项**

```typescript
// 1. 实验性功能
// PPR 目前是实验性功能，API 可能变化

// 2. 需要合理规划
// 需要仔细决定哪些内容静态，哪些动态

// 3. Suspense 边界
// 必须使用 Suspense 包裹动态部分

// 4. 缓存策略
// 需要为动态部分配置合适的缓存策略

// 示例：不当使用
export default function Page() {
  return (
    <div>
      {/* ❌ 不好：整个页面在 Suspense 中 */}
      <Suspense fallback={<Loading />}>
        <EntirePage />
      </Suspense>
    </div>
  );
}

// ✅ 好：只包裹动态部分
export default function Page() {
  return (
    <div>
      <StaticHeader />

      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>

      <StaticFooter />
    </div>
  );
}
```

---

## 问题 5：PPR 与其他渲染模式的对比？

**渲染模式对比**

```typescript
// 1. 纯静态生成（SSG）
export default async function Page() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}
// 优点：极快
// 缺点：数据可能过时

// 2. 纯服务端渲染（SSR）
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}
// 优点：数据最新
// 缺点：每次请求都渲染，慢

// 3. 增量静态再生成（ISR）
export default async function Page() {
  const data = await fetch("...", {
    next: { revalidate: 60 },
  });
  return <div>{data.content}</div>;
}
// 优点：平衡性能和新鲜度
// 缺点：整个页面一起更新

// 4. Partial Prerendering（PPR）
export default function Page() {
  return (
    <div>
      <StaticContent />
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
// 优点：最佳性能 + 最新数据
// 缺点：需要更多规划
```

---

## 总结

**核心概念**：

### 1. PPR 定义

- 在同一页面混合静态和动态内容
- 静态部分构建时生成
- 动态部分请求时渲染

### 2. 启用 PPR

```typescript
// next.config.js
experimental: {
  ppr: true;
}

// 或路由级别
export const experimental_ppr = true;
```

### 3. 使用方式

```typescript
<div>
  <StaticContent />

  <Suspense fallback={<Loading />}>
    <DynamicContent />
  </Suspense>
</div>
```

### 4. 适用场景

- 电商产品页（静态信息 + 动态库存）
- 新闻文章（静态内容 + 动态评论）
- 用户主页（静态资料 + 动态状态）

### 5. 优势

- 更快的 FCP
- 更好的用户体验
- 更好的 SEO
- 灵活的性能优化

### 6. 最佳实践

- 静态内容：不常变化的数据
- 动态内容：实时数据、个性化内容
- 使用 Suspense 包裹动态部分
- 提供有意义的 fallback

## 延伸阅读

- [Next.js 官方文档 - Partial Prerendering](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [Next.js Blog - Partial Prerendering](https://nextjs.org/blog/next-14#partial-prerendering-preview)
- [React 官方文档 - Suspense](https://react.dev/reference/react/Suspense)
