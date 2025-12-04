---
title: Next.js 中 CSR、SSR 和 SSG 的区别
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面对比 Next.js 中客户端渲染（CSR）、服务器端渲染（SSR）和静态站点生成（SSG）的区别，掌握在不同场景下的选择策略。
tags:
  - Next.js
  - CSR
  - SSR
  - SSG
estimatedTime: 28 分钟
keywords:
  - 客户端渲染
  - 服务器端渲染
  - 静态生成
  - 渲染模式
highlight: 理解三种渲染模式的本质区别，掌握在实际项目中的最佳实践
order: 319
---

## 问题 1：什么是 CSR、SSR 和 SSG？

**客户端渲染（CSR - Client-Side Rendering）**

在客户端渲染中，服务器只返回一个基本的 HTML 框架和 JavaScript Bundle，页面内容由 JavaScript 在浏览器中动态生成。

```typescript
// CSR 示例（传统 React 应用）
// 服务器返回的 HTML
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>

// 客户端 JavaScript 渲染内容
import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 在客户端获取数据
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{data?.title}</div>;
}

ReactDOM.render(<App />, document.getElementById('root'));
```

**服务器端渲染（SSR - Server-Side Rendering）**

在服务器端渲染中，每次请求时，服务器都会生成完整的 HTML 页面，然后发送给客户端。

```typescript
// Next.js SSR 示例
// app/page.tsx（App Router）
export default async function Page() {
  // 每次请求时在服务器端获取数据
  const res = await fetch("https://api.example.com/data", {
    cache: "no-cache", // 不缓存，每次都重新获取
  });
  const data = await res.json();

  return <div>{data.title}</div>;
}

// Pages Router 示例
export async function getServerSideProps() {
  const res = await fetch("https://api.example.com/data");
  const data = await res.json();

  return {
    props: { data },
  };
}

export default function Page({ data }) {
  return <div>{data.title}</div>;
}
```

**静态站点生成（SSG - Static Site Generation）**

在静态站点生成中，页面在**构建时**生成 HTML，然后在每次请求时直接返回预生成的 HTML。

```typescript
// Next.js SSG 示例
// app/page.tsx（App Router）
export default async function Page() {
  // 构建时获取数据
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // 每小时重新验证
  });
  const data = await res.json();

  return <div>{data.title}</div>;
}

// Pages Router 示例
export async function getStaticProps() {
  const res = await fetch("https://api.example.com/data");
  const data = await res.json();

  return {
    props: { data },
    revalidate: 3600, // ISR：每小时重新生成
  };
}

export default function Page({ data }) {
  return <div>{data.title}</div>;
}
```

---

## 问题 2：CSR、SSR 和 SSG 的工作流程有什么区别？

**CSR 的工作流程**

```typescript
// 1. 用户访问页面
GET /products

// 2. 服务器返回基本 HTML
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script src="/bundle.js"></script>
  </body>
</html>

// 3. 浏览器下载并执行 JavaScript
// 4. JavaScript 发起 API 请求
fetch('/api/products')

// 5. 获取数据后渲染页面
// 用户看到内容（可能有延迟）
```

**SSR 的工作流程**

```typescript
// 1. 用户访问页面
GET /products

// 2. 服务器执行组件代码
export default async function ProductsPage() {
  const products = await fetchProducts(); // 服务器端获取数据
  return <ProductList products={products} />;
}

// 3. 服务器生成完整的 HTML
<!DOCTYPE html>
<html>
  <body>
    <div id="root">
      <div class="product-list">
        <div class="product">Product 1</div>
        <div class="product">Product 2</div>
      </div>
    </div>
    <script src="/bundle.js"></script>
  </body>
</html>

// 4. 浏览器接收并显示 HTML（用户立即看到内容）
// 5. JavaScript 加载后进行 hydration（激活交互）
```

**SSG 的工作流程**

```typescript
// 构建时（npm run build）
// 1. Next.js 执行所有页面的组件代码
export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}

// 2. 生成静态 HTML 文件
// .next/server/pages/products.html

// 运行时
// 3. 用户访问页面
GET / products;

// 4. 服务器直接返回预生成的 HTML（极快）
// 5. 浏览器显示内容（用户立即看到）
// 6. JavaScript 加载后进行 hydration
```

---

## 问题 3：CSR、SSR 和 SSG 的优缺点是什么？

**CSR 的优缺点**

```typescript
// ✅ 优点
// 1. 服务器压力小
"use client";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 数据获取在客户端进行
    fetchData().then(setData);
  }, []);

  return <div>{data?.content}</div>;
}

// 2. 丰富的交互体验
// 3. 适合高度交互的应用（如 SPA）

// ❌ 缺点
// 1. 首屏加载慢（需要等待 JavaScript 下载和执行）
// 2. SEO 不友好（搜索引擎难以抓取内容）
// 3. 白屏时间长
```

**SSR 的优缺点**

```typescript
// ✅ 优点
// 1. 首屏加载快（服务器返回完整 HTML）
export default async function Page() {
  const data = await fetchData();
  return <div>{data.content}</div>;
}

// 2. SEO 友好（搜索引擎可以直接抓取内容）
// 3. 更好的首次内容绘制（FCP）

// ❌ 缺点
// 1. 服务器压力大（每次请求都需要渲染）
export default async function Page() {
  // 每次请求都执行
  const data = await fetch("https://api.example.com/data", {
    cache: "no-cache",
  });
}

// 2. TTFB（Time To First Byte）可能较长
// 3. 服务器成本较高
```

**SSG 的优缺点**

```typescript
// ✅ 优点
// 1. 性能最佳（直接返回静态 HTML）
export default async function Page() {
  // 只在构建时执行一次
  const data = await fetchData();
  return <div>{data.content}</div>;
}

// 2. SEO 友好
// 3. 服务器压力最小
// 4. 可以部署到 CDN

// ❌ 缺点
// 1. 数据可能过时
// 2. 构建时间长（页面多时）
// 3. 不适合频繁变化的内容

// 解决方案：ISR（Incremental Static Regeneration）
export default async function Page() {
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 60 }, // 每 60 秒重新生成
  });
}
```

---

## 问题 4：在什么场景下应该选择哪种渲染方式？

**选择 CSR 的场景**

```typescript
// 1. 高度交互的应用（如仪表板、管理后台）
"use client";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState(null);

  // 频繁的用户交互
  // 实时数据更新
  // 不需要 SEO

  return (
    <div>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="overview">Overview</Tab>
        <Tab value="analytics">Analytics</Tab>
      </Tabs>
      <TabContent data={data} />
    </div>
  );
}

// 2. 需要用户认证的页面
("use client");

export default function UserProfile() {
  const { user } = useAuth();

  // 用户特定的内容
  // 不需要 SEO
  // 需要客户端状态管理

  return <div>Welcome, {user.name}</div>;
}

// 3. 实时应用（如聊天、协作工具）
("use client");

export default function Chat() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // WebSocket 连接
    const ws = new WebSocket("ws://...");
    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };
  }, []);

  return <MessageList messages={messages} />;
}
```

**选择 SSR 的场景**

```typescript
// 1. 需要 SEO 且内容频繁变化
export default async function NewsPage() {
  // 新闻内容频繁更新
  // 需要搜索引擎索引
  const news = await fetchLatestNews();

  return <NewsList news={news} />;
}

// 2. 个性化内容
export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  // 根据用户或请求动态生成内容
  const product = await fetchProduct(params.id);
  const recommendations = await fetchRecommendations(userId);

  return (
    <div>
      <ProductDetail product={product} />
      <Recommendations items={recommendations} />
    </div>
  );
}

// 3. 需要最新数据的页面
export default async function StockPage() {
  // 股票价格需要实时更新
  const stocks = await fetch("https://api.example.com/stocks", {
    cache: "no-cache",
  });

  return <StockList stocks={stocks} />;
}
```

**选择 SSG 的场景**

```typescript
// 1. 静态内容（如博客、文档）
export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  // 博客文章不经常变化
  const post = await fetchPost(params.slug);

  return <Article post={post} />;
}

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 2. 营销页面（如首页、关于页）
export default async function HomePage() {
  // 内容相对固定
  // 需要最佳性能
  const features = await fetchFeatures();

  return <LandingPage features={features} />;
}

// 3. 产品目录（使用 ISR）
export default async function ProductsPage() {
  const products = await fetch("https://api.example.com/products", {
    next: { revalidate: 3600 }, // 每小时更新
  });

  return <ProductGrid products={products} />;
}
```

---

## 问题 5：如何在 Next.js 中实现混合渲染？

**混合使用不同的渲染策略**

```typescript
// app/layout.tsx（SSG - 布局很少变化）
export default async function RootLayout({ children }) {
  const navigation = await fetchNavigation();

  return (
    <html>
      <body>
        <Header navigation={navigation} />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// app/page.tsx（SSG - 首页内容相对固定）
export default async function HomePage() {
  const features = await fetch("https://api.example.com/features", {
    next: { revalidate: 86400 }, // 24 小时
  });

  return <LandingPage features={features} />;
}

// app/blog/[slug]/page.tsx（SSG + ISR - 博客文章）
export default async function BlogPost({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`, {
    next: { revalidate: 3600 }, // 1 小时
  });

  return <Article post={post} />;
}

// app/dashboard/page.tsx（CSR - 用户仪表板）
("use client");

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchUserData().then(setData);
  }, []);

  return <DashboardContent data={data} />;
}

// app/news/page.tsx（SSR - 新闻列表）
export default async function NewsPage() {
  const news = await fetch("https://api.example.com/news", {
    cache: "no-cache", // 每次请求都获取最新数据
  });

  return <NewsList news={news} />;
}
```

**组件级别的混合渲染**

```typescript
// app/page.tsx（Server Component）
import ClientComponent from "./ClientComponent";

export default async function Page() {
  // 服务端获取数据
  const staticData = await fetchStaticData();

  return (
    <div>
      {/* 服务端渲染的内容 */}
      <StaticContent data={staticData} />

      {/* 客户端渲染的交互组件 */}
      <ClientComponent />
    </div>
  );
}

// ClientComponent.tsx（Client Component）
("use client");

import { useState, useEffect } from "react";

export default function ClientComponent() {
  const [dynamicData, setDynamicData] = useState(null);

  useEffect(() => {
    // 客户端获取动态数据
    fetchDynamicData().then(setDynamicData);
  }, []);

  return <div>{/* 交互式内容 */}</div>;
}
```

**使用 Suspense 实现流式 SSR**

```typescript
// app/page.tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      {/* 立即渲染的内容 */}
      <Header />

      {/* 延迟加载的内容 */}
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>

      {/* 立即渲染的内容 */}
      <Footer />
    </div>
  );
}

async function SlowComponent() {
  // 慢速数据获取
  const data = await fetchSlowData();
  return <div>{data.content}</div>;
}
```

---

## 总结

**核心区别**：

### 1. 渲染时机

- **CSR**：浏览器运行时
- **SSR**：每次请求时
- **SSG**：构建时

### 2. 性能特点

- **CSR**：首屏慢，交互快
- **SSR**：首屏快，服务器压力大
- **SSG**：性能最佳，数据可能过时

### 3. SEO 友好度

- **CSR**：❌ 不友好
- **SSR**：✅ 友好
- **SSG**：✅ 友好

### 4. 适用场景

**CSR**：

- 高度交互的应用
- 用户认证页面
- 实时应用

**SSR**：

- 需要 SEO 且内容频繁变化
- 个性化内容
- 需要最新数据

**SSG**：

- 静态内容（博客、文档）
- 营销页面
- 产品目录（配合 ISR）

### 5. Next.js 最佳实践

- 默认使用 SSG（性能最佳）
- 需要实时数据时使用 SSR
- 高度交互的部分使用 CSR
- 使用 ISR 平衡性能和数据新鲜度
- 混合使用不同策略

## 延伸阅读

- [Next.js 官方文档 - Rendering](https://nextjs.org/docs/app/building-your-application/rendering)
- [Next.js 官方文档 - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Web.dev - Rendering on the Web](https://web.dev/rendering-on-the-web/)
