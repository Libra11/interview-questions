---
title: getServerSideProps 与 getStaticProps 的区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入对比 Next.js Pages Router 中 getServerSideProps 和 getStaticProps 的区别，掌握不同数据获取方式的使用场景。
tags:
  - Next.js
  - getServerSideProps
  - getStaticProps
  - Pages Router
estimatedTime: 22 分钟
keywords:
  - getServerSideProps
  - getStaticProps
  - SSR
  - SSG
highlight: 理解 Pages Router 两种主要数据获取方法的核心差异和适用场景
order: 418
---

## 问题 1：getStaticProps 是什么？

**静态生成时获取数据**

`getStaticProps` 在构建时运行，用于静态生成页面。

```typescript
// pages/blog/[slug].tsx

export async function getStaticProps(context) {
  const { params } = context;

  // 在构建时获取数据
  const post = await fetchPost(params.slug);

  return {
    props: {
      post,
    },
    // 可选：ISR 配置
    revalidate: 3600, // 每小时重新生成
  };
}

export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 构建时（npm run build）：
// - getStaticProps 执行
// - 获取数据
// - 生成静态 HTML
// - 保存到 .next 目录

// 运行时：
// - 直接返回预生成的 HTML
// - 极快的加载速度
```

**getStaticProps 的特点**

```typescript
export async function getStaticProps(context) {
  // ✅ 只在服务端运行
  // ✅ 可以直接访问数据库
  // ✅ 可以使用服务端专用库
  // ✅ 不会发送到客户端

  const db = require("database");
  const data = await db.query("SELECT * FROM posts");

  // 可以使用 Node.js API
  const fs = require("fs");
  const file = fs.readFileSync("data.json");

  // 可以使用环境变量
  const apiKey = process.env.SECRET_API_KEY;

  return {
    props: { data },
  };
}
```

---

## 问题 2：getServerSideProps 是什么？

**每次请求时获取数据**

`getServerSideProps` 在每次请求时运行，用于服务端渲染。

```typescript
// pages/dashboard.tsx

export async function getServerSideProps(context) {
  const { req, res, query } = context;

  // 每次请求都执行
  const user = await fetchUser(req.cookies.token);
  const stats = await fetchStats(user.id);

  return {
    props: {
      user,
      stats,
    },
  };
}

export default function Dashboard({ user, stats }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <Stats data={stats} />
    </div>
  );
}

// 每次请求：
// - getServerSideProps 执行
// - 获取最新数据
// - 渲染 HTML
// - 返回给客户端
```

**getServerSideProps 的特点**

```typescript
export async function getServerSideProps(context) {
  // 访问请求对象
  const { req, res, query, params } = context;

  // 读取 Cookie
  const token = req.cookies.token;

  // 读取请求头
  const userAgent = req.headers["user-agent"];

  // 读取查询参数
  const page = query.page || "1";

  // 设置响应头
  res.setHeader("Cache-Control", "public, max-age=60");

  // 重定向
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // 返回 404
  if (!data) {
    return {
      notFound: true,
    };
  }

  return {
    props: { data },
  };
}
```

---

## 问题 3：getStaticProps 和 getServerSideProps 的核心区别？

**执行时机**

```typescript
// getStaticProps：构建时执行
export async function getStaticProps() {
  console.log("This runs at BUILD TIME");

  const data = await fetchData();

  return { props: { data } };
}

// 只在 npm run build 时执行
// 生产环境不会再次执行（除非使用 ISR）

// getServerSideProps：每次请求时执行
export async function getServerSideProps() {
  console.log("This runs on EVERY REQUEST");

  const data = await fetchData();

  return { props: { data } };
}

// 每次用户访问页面都执行
// 服务器压力大
```

**性能对比**

```typescript
// getStaticProps：极快
export async function getStaticProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 访问时：
// - 直接返回预生成的 HTML
// - TTFB: ~10ms
// - 可以部署到 CDN
// - 极佳的性能

// getServerSideProps：较慢
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// 访问时：
// - 等待数据获取
// - 渲染 HTML
// - 返回响应
// - TTFB: ~200-500ms
// - 服务器压力大
```

**数据新鲜度**

```typescript
// getStaticProps：数据可能过时
export async function getStaticProps() {
  const data = await fetchData();

  return {
    props: { data },
    revalidate: 3600, // 使用 ISR 每小时更新
  };
}

// 数据在构建时固定
// 需要 ISR 或重新构建来更新

// getServerSideProps：数据总是最新
export async function getServerSideProps() {
  const data = await fetchData();

  return { props: { data } };
}

// 每次请求都获取最新数据
// 保证数据新鲜度
```

---

## 问题 4：何时使用 getStaticProps 和 getServerSideProps？

**使用 getStaticProps 的场景**

```typescript
// 1. 博客文章
// pages/blog/[slug].tsx
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
    revalidate: 3600, // ISR
  };
}

// 2. 产品页面
// pages/products/[id].tsx
export async function getStaticProps({ params }) {
  const product = await fetchProduct(params.id);

  return {
    props: { product },
    revalidate: 60,
  };
}

// 3. 文档页面
// pages/docs/[...slug].tsx
export async function getStaticProps({ params }) {
  const doc = await fetchDoc(params.slug);

  return {
    props: { doc },
  };
}

// 4. 营销页面
// pages/index.tsx
export async function getStaticProps() {
  const features = await fetchFeatures();

  return {
    props: { features },
  };
}

// 特点：
// - 内容相对固定
// - 不需要实时数据
// - 需要最佳性能
// - 需要 SEO
```

**使用 getServerSideProps 的场景**

```typescript
// 1. 用户仪表板
// pages/dashboard.tsx
export async function getServerSideProps({ req }) {
  const user = await getUserFromCookie(req.cookies.token);
  const stats = await fetchUserStats(user.id);

  return {
    props: { user, stats },
  };
}

// 2. 搜索结果
// pages/search.tsx
export async function getServerSideProps({ query }) {
  const results = await search(query.q);

  return {
    props: { results, query: query.q },
  };
}

// 3. 实时数据
// pages/stock/[symbol].tsx
export async function getServerSideProps({ params }) {
  const stock = await fetchRealTimeStock(params.symbol);

  return {
    props: { stock },
  };
}

// 4. 个性化内容
// pages/recommendations.tsx
export async function getServerSideProps({ req }) {
  const user = await getCurrentUser(req);
  const recommendations = await fetchRecommendations(user.id);

  return {
    props: { recommendations },
  };
}

// 特点：
// - 需要实时数据
// - 个性化内容
// - 需要请求上下文（Cookie、Header）
// - 数据频繁变化
```

---

## 问题 5：如何在两者之间做选择？

**决策流程图**

```typescript
// 问题 1：数据是否需要实时？
// 是 → 使用 getServerSideProps
// 否 → 继续

// 问题 2：是否需要请求上下文（Cookie、Header）？
// 是 → 使用 getServerSideProps
// 否 → 继续

// 问题 3：内容是否对所有用户相同？
// 是 → 使用 getStaticProps
// 否 → 使用 getServerSideProps

// 问题 4：是否可以接受短暂的数据延迟？
// 是 → 使用 getStaticProps + ISR
// 否 → 使用 getServerSideProps
```

**混合使用**

```typescript
// 不同页面使用不同方法

// pages/index.tsx - 静态生成
export async function getStaticProps() {
  const features = await fetchFeatures();
  return { props: { features } };
}

// pages/blog/[slug].tsx - 静态生成 + ISR
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);
  return {
    props: { post },
    revalidate: 3600,
  };
}

// pages/dashboard.tsx - 服务端渲染
export async function getServerSideProps({ req }) {
  const user = await getUser(req);
  return { props: { user } };
}

// pages/search.tsx - 服务端渲染
export async function getServerSideProps({ query }) {
  const results = await search(query.q);
  return { props: { results } };
}
```

**性能优化建议**

```typescript
// ✅ 好：优先使用 getStaticProps
export async function getStaticProps() {
  const data = await fetchData();

  return {
    props: { data },
    revalidate: 60, // ISR 保持数据新鲜
  };
}

// ❌ 不好：过度使用 getServerSideProps
export async function getServerSideProps() {
  // 这些数据其实不需要实时
  const staticData = await fetchStaticData();

  return { props: { staticData } };
}

// 💡 更好：静态 + 客户端获取动态数据
export async function getStaticProps() {
  const staticData = await fetchStaticData();

  return { props: { staticData } };
}

export default function Page({ staticData }) {
  const [dynamicData, setDynamicData] = useState(null);

  useEffect(() => {
    // 客户端获取动态数据
    fetchDynamicData().then(setDynamicData);
  }, []);

  return (
    <div>
      <StaticContent data={staticData} />
      <DynamicContent data={dynamicData} />
    </div>
  );
}
```

---

## 总结

**核心区别**：

### 1. 执行时机

**getStaticProps**：

- 构建时执行
- 生成静态 HTML

**getServerSideProps**：

- 每次请求时执行
- 动态渲染 HTML

### 2. 性能

**getStaticProps**：

- TTFB: ~10ms
- 极快
- 可部署到 CDN

**getServerSideProps**：

- TTFB: ~200-500ms
- 较慢
- 服务器压力大

### 3. 数据新鲜度

**getStaticProps**：

- 数据可能过时
- 使用 ISR 更新

**getServerSideProps**：

- 数据总是最新
- 每次请求获取

### 4. 使用场景

**getStaticProps**：

- 博客、文档
- 产品页面
- 营销页面
- 内容相对固定

**getServerSideProps**：

- 用户仪表板
- 搜索结果
- 实时数据
- 个性化内容

### 5. 选择建议

- 默认使用 getStaticProps（性能最佳）
- 需要实时数据时使用 getServerSideProps
- 使用 ISR 平衡性能和新鲜度
- 考虑静态 + 客户端动态获取

## 延伸阅读

- [Next.js 官方文档 - getStaticProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)
- [Next.js 官方文档 - getServerSideProps](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props)
- [Next.js 官方文档 - Incremental Static Regeneration](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
