---
title: RSC 与传统 SSR 的渲染流程有什么区别？
category: React
difficulty: 高级
updatedAt: 2025-12-04
summary: >-
  深入对比 React Server Component 和传统 SSR 的渲染流程差异，理解两种技术的本质区别和各自的优势场景。
tags:
  - React
  - RSC
  - SSR
  - 渲染流程
estimatedTime: 30 分钟
keywords:
  - RSC vs SSR
  - Server Component
  - 服务端渲染
  - 渲染流程
highlight: 理解 RSC 和 SSR 的本质区别，是掌握现代 React 应用架构的关键
order: 25
---

## 问题 1：传统 SSR 的渲染流程是怎样的？

传统的服务端渲染（SSR）在服务器端生成 HTML，然后在客户端进行水合（Hydration）。

### SSR 的完整流程

```jsx
// 1. 服务器端渲染
// pages/products.tsx (Next.js Pages Router)
export async function getServerSideProps() {
  // 服务器端获取数据
  const products = await db.products.findMany();

  return {
    props: { products },
  };
}

function ProductsPage({ products }) {
  const [filter, setFilter] = useState("");

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

/**
 * 渲染流程：
 *
 * 服务器端：
 * 1. 执行 getServerSideProps 获取数据
 * 2. 使用数据渲染组件为 HTML 字符串
 * 3. 将 HTML 和数据一起发送给客户端
 *
 * 客户端：
 * 4. 浏览器显示 HTML（用户可以看到内容）
 * 5. 下载并执行 JavaScript bundle
 * 6. React 进行 Hydration（为 HTML 添加交互）
 * 7. 页面变为可交互
 */
```

### SSR 的关键特点

**1. 完整的组件代码发送到客户端**

```jsx
// 整个组件的代码都会打包到客户端
function ProductsPage({ products }) {
  // 这些代码都会发送到客户端
  const [filter, setFilter] = useState("");

  const handleFilter = (e) => {
    setFilter(e.target.value);
  };

  const filteredProducts = products.filter((p) => p.name.includes(filter));

  return <div>{/* ... */}</div>;
}

// 客户端 bundle 包含：
// - React 库
// - 组件代码
// - 所有依赖的库
```

**2. Hydration 过程**

```jsx
// 服务器返回的 HTML
<div>
  <input value="" />
  <div>Product 1</div>
  <div>Product 2</div>
</div>

// 客户端 Hydration
// React 会：
// 1. 重新执行组件代码
// 2. 构建虚拟 DOM
// 3. 将虚拟 DOM 与现有 HTML 匹配
// 4. 绑定事件处理器
// 5. 初始化 state

// 问题：需要重新执行所有组件代码
```

**3. 数据序列化**

```jsx
// 服务器端
export async function getServerSideProps() {
  const products = await db.products.findMany({
    include: { category: true, reviews: true }
  })

  // 数据会被序列化为 JSON
  return { props: { products } }
}

// 客户端接收到的 HTML 中包含：
<script id="__NEXT_DATA__">
{
  "props": {
    "products": [/* 完整的产品数据 */]
  }
}
</script>

// 问题：所有数据都要序列化并发送到客户端
```

---

## 问题 2：RSC 的渲染流程有什么不同？

React Server Component 采用了完全不同的渲染模型，不需要 Hydration。

### RSC 的渲染流程

```jsx
// app/products/page.tsx (Server Component)
async function ProductsPage() {
  // 在服务器端获取数据
  const products = await db.products.findMany();

  return (
    <div>
      <h1>Products</h1>
      {/* Server Component 渲染静态内容 */}
      <ProductList products={products} />

      {/* Client Component 处理交互 */}
      <FilterInput />
    </div>
  );
}

/**
 * RSC 渲染流程：
 *
 * 服务器端：
 * 1. 执行 Server Component，获取数据
 * 2. 渲染 Server Component 为特殊格式（RSC Payload）
 * 3. 识别 Client Component 的位置
 * 4. 发送 RSC Payload 到客户端
 *
 * 客户端：
 * 5. 接收 RSC Payload
 * 6. 只下载 Client Component 的代码
 * 7. 将 Server Component 的输出与 Client Component 组合
 * 8. 渲染最终 UI
 *
 * 关键：Server Component 的代码不会发送到客户端
 */
```

### RSC Payload 的结构

```jsx
// Server Component
async function ProductCard({ productId }) {
  const product = await db.products.findById(productId)

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.price}</p>
      <AddToCartButton productId={productId} />
    </div>
  )
}

// RSC Payload（简化版）
{
  type: 'div',
  props: {},
  children: [
    { type: 'h2', children: 'iPhone 15' },
    { type: 'p', children: '$999' },
    {
      type: 'client-component',
      module: 'AddToCartButton',
      props: { productId: '123' }
    }
  ]
}

// 客户端只需要：
// 1. 渲染已经生成的 HTML 结构
// 2. 加载 AddToCartButton 组件的代码
// 3. 在正确位置插入 Client Component
```

### 无需 Hydration

```jsx
// Server Component（不需要 Hydration）
async function StaticContent() {
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {/* 这些内容不需要 Hydration */}
    </div>
  );
}

// Client Component（需要 Hydration）
("use client");

function InteractiveButton() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 组合使用
async function Page() {
  return (
    <div>
      {/* 不需要 Hydration */}
      <StaticContent />

      {/* 只有这部分需要 Hydration */}
      <InteractiveButton />
    </div>
  );
}

// 优势：大幅减少需要 Hydration 的代码量
```

---

## 问题 3：RSC 和 SSR 在性能上有什么差异？

两种技术在性能特征上有显著差异：

### 1. JavaScript Bundle 大小

**传统 SSR**：

```jsx
// pages/dashboard.tsx
import { Chart } from "chart.js"; // 200KB
import { format } from "date-fns"; // 100KB
import { marked } from "marked"; // 50KB

export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

function Dashboard({ data }) {
  const formattedDate = format(data.date, "PPP");
  const chartData = processChartData(data);
  const html = marked(data.description);

  return <div>{/* ... */}</div>;
}

// 客户端 bundle 包含：
// - React: ~40KB
// - 组件代码: ~10KB
// - chart.js: 200KB
// - date-fns: 100KB
// - marked: 50KB
// 总计: ~400KB
```

**RSC**：

```jsx
// app/dashboard/page.tsx (Server Component)
import { Chart } from "chart.js"; // 不会发送到客户端
import { format } from "date-fns"; // 不会发送到客户端
import { marked } from "marked"; // 不会发送到客户端

async function Dashboard() {
  const data = await fetchData();

  // 在服务器端处理
  const formattedDate = format(data.date, "PPP");
  const chartData = processChartData(data);
  const html = marked(data.description);

  return (
    <div>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {/* 只有交互部分是 Client Component */}
      <InteractiveChart data={chartData} />
    </div>
  );
}

// 客户端 bundle 包含：
// - React: ~40KB
// - InteractiveChart: ~15KB
// 总计: ~55KB（减少了 85%）
```

### 2. 首屏加载时间

**传统 SSR 的时间线**：

```
0ms:    服务器开始处理请求
50ms:   数据获取完成
100ms:  HTML 渲染完成，发送给客户端
150ms:  客户端接收到 HTML，显示内容（FCP）
200ms:  开始下载 JavaScript
500ms:  JavaScript 下载完成
600ms:  JavaScript 执行完成
700ms:  Hydration 完成，页面可交互（TTI）

FCP: 150ms
TTI: 700ms（用户需要等待 550ms 才能交互）
```

**RSC 的时间线**：

```
0ms:    服务器开始处理请求
50ms:   数据获取完成
100ms:  Server Component 渲染完成
150ms:  客户端接收到内容，显示（FCP）
200ms:  开始下载 Client Component 代码
300ms:  Client Component 代码下载完成
350ms:  Client Component Hydration 完成（TTI）

FCP: 150ms
TTI: 350ms（减少了 50%）
```

### 3. 数据传输

**传统 SSR**：

```jsx
// 服务器端
export async function getServerSideProps() {
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
      images: true,
    },
  });

  // 所有数据都要序列化并发送
  return { props: { products } };
}

// 传输的数据：
// - HTML: 50KB
// - JSON 数据: 200KB
// - JavaScript: 400KB
// 总计: 650KB
```

**RSC**：

```jsx
// Server Component
async function ProductList() {
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
      images: true,
    },
  });

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 传输的数据：
// - RSC Payload: 100KB（已经是渲染后的结构）
// - Client Component JS: 50KB
// 总计: 150KB（减少了 75%）
```

---

## 问题 4：RSC 和 SSR 各自适合什么场景？

两种技术有不同的适用场景，可以根据需求选择：

### 传统 SSR 适合的场景

**1. 高度交互的应用**

```jsx
// 整个应用都需要客户端状态管理
function InteractiveApp() {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("name");

  // 大量的客户端逻辑
  useEffect(() => {
    // 复杂的客户端处理
  }, [data, filters, sort]);

  return <div>{/* 高度交互的 UI */}</div>;
}

// 这种情况下，RSC 的优势不明显
```

**2. 需要向后兼容**

```jsx
// 已有的 Next.js Pages Router 应用
// 迁移到 App Router 成本较高
export async function getServerSideProps() {
  // 现有的数据获取逻辑
}

function Page({ data }) {
  // 现有的组件逻辑
}
```

### RSC 适合的场景

**1. 内容为主的应用**

```jsx
// 博客、新闻网站、文档站点
async function BlogPost({ postId }) {
  const post = await db.posts.findById(postId);
  const relatedPosts = await db.posts.findRelated(postId);

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>

      {/* 只有评论区需要交互 */}
      <Comments postId={postId} />
    </article>
  );
}

// 优势：大部分内容是静态的，只有少量交互
```

**2. 需要直接访问后端资源**

```jsx
// 需要访问数据库、文件系统、内部 API
async function Dashboard() {
  // 直接访问数据库
  const stats = await db.stats.aggregate();

  // 读取文件系统
  const config = await fs.readFile("config.json");

  // 调用内部 API（不暴露给客户端）
  const analytics = await internalAPI.getAnalytics();

  return <div>{/* ... */}</div>;
}

// 优势：不需要创建 API 路由层
```

**3. 需要优化 JavaScript 体积**

```jsx
// 使用大型库进行数据处理
import { parse } from "csv-parse"; // 只在服务器端使用
import { PDFDocument } from "pdf-lib"; // 只在服务器端使用

async function ReportPage() {
  const csvData = await fs.readFile("data.csv");
  const records = parse(csvData);

  const pdf = await PDFDocument.create();
  // 生成 PDF...

  return <div>{/* 显示报告 */}</div>;
}

// 优势：这些库不会增加客户端 bundle
```

**4. 混合模式**

实际应用中，通常是混合使用：

```jsx
// app/dashboard/page.tsx
async function DashboardPage() {
  // Server Component 获取数据
  const user = await getUser();
  const stats = await getStats();

  return (
    <div>
      {/* Server Component 渲染静态内容 */}
      <header>
        <h1>Welcome, {user.name}</h1>
        <UserAvatar url={user.avatar} />
      </header>

      {/* Server Component 渲染数据展示 */}
      <StatsGrid stats={stats} />

      {/* Client Component 处理交互 */}
      <InteractiveChart data={stats} />
      <NotificationCenter userId={user.id} />
    </div>
  );
}

// 原则：
// - 静态内容用 Server Component
// - 交互部分用 Client Component
// - 数据获取在 Server Component 中进行
```

## 延伸阅读

- [Next.js 官方文档 - Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [React 官方文档 - Server Components vs SSR](https://react.dev/blog/2020/12/21/data-fetching-with-react-server-components)
- [Understanding React Server Components](https://vercel.com/blog/understanding-react-server-components)
- [The Two Reacts](https://overreacted.io/the-two-reacts/)
- [A Chain Reaction: How React Server Components Work](https://www.plasmic.app/blog/how-react-server-components-work)
