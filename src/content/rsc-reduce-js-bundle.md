---
title: RSC 如何减少 JS 体积？
category: React
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解 React Server Component 如何通过服务器端渲染和智能代码分割来减少客户端 JavaScript 体积，提升应用性能。
tags:
  - React
  - RSC
  - 性能优化
  - Bundle Size
estimatedTime: 20 分钟
keywords:
  - RSC
  - JavaScript 体积
  - Bundle Size
  - 性能优化
highlight: RSC 通过将组件代码保留在服务器端，大幅减少客户端 JavaScript 体积
order: 175
---

## 问题 1：RSC 如何避免发送组件代码到客户端？

Server Component 的代码只在服务器端执行，不会被打包到客户端 bundle 中。

### 传统 React 组件

```jsx
// components/ProductCard.tsx
import { format } from "date-fns"; // 67KB
import { marked } from "marked"; // 45KB

export function ProductCard({ product }) {
  const formattedDate = format(new Date(product.createdAt), "PPP");
  const description = marked(product.description);

  return (
    <div>
      <h2>{product.name}</h2>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  );
}

/**
 * 客户端 bundle 包含：
 * - ProductCard 组件代码: ~2KB
 * - date-fns: 67KB
 * - marked: 45KB
 * 总计: ~114KB
 *
 * 即使这些库只在渲染时使用一次，
 * 也必须发送到客户端
 */
```

### Server Component 方式

```jsx
// app/components/ProductCard.tsx (Server Component)
import { format } from "date-fns"; // 不会发送到客户端
import { marked } from "marked"; // 不会发送到客户端

export async function ProductCard({ productId }) {
  const product = await db.products.findById(productId);

  // 在服务器端处理
  const formattedDate = format(new Date(product.createdAt), "PPP");
  const description = marked(product.description);

  return (
    <div>
      <h2>{product.name}</h2>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  );
}

/**
 * 客户端 bundle 包含：
 * - 0KB（Server Component 代码不发送到客户端）
 *
 * 客户端只接收渲染后的 RSC Payload
 */
```

---

## 问题 2：RSC 如何减少第三方库的体积？

Server Component 可以使用大型库而不增加客户端 bundle 大小。

### 1. 数据处理库

```jsx
// ❌ 传统方式：库会打包到客户端
"use client";

import Papa from "papaparse"; // 100KB
import { parse } from "csv-parse"; // 80KB

export function DataProcessor({ csvData }) {
  const [parsed, setParsed] = useState(null);

  useEffect(() => {
    Papa.parse(csvData, {
      complete: (result) => setParsed(result.data),
    });
  }, [csvData]);

  return <div>{/* 显示数据 */}</div>;
}

// 客户端 bundle: +100KB

// ✅ RSC 方式：库只在服务器端使用
import Papa from "papaparse"; // 不会发送到客户端

export async function DataProcessor({ fileId }) {
  const csvData = await fs.readFile(`data/${fileId}.csv`, "utf-8");

  // 在服务器端解析
  const parsed = Papa.parse(csvData, { header: true });

  return (
    <div>
      {parsed.data.map((row, i) => (
        <div key={i}>{row.name}</div>
      ))}
    </div>
  );
}

// 客户端 bundle: +0KB
```

### 2. Markdown 和语法高亮

```jsx
// ❌ 传统方式
"use client";

import { marked } from "marked"; // 45KB
import Prism from "prismjs"; // 30KB
import "prismjs/themes/prism-tomorrow.css";

export function MarkdownRenderer({ content }) {
  const html = marked(content);

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// 客户端 bundle: +75KB

// ✅ RSC 方式
import { marked } from "marked"; // 不会发送到客户端
import Prism from "prismjs"; // 不会发送到客户端

export async function MarkdownRenderer({ postId }) {
  const post = await db.posts.findById(postId);

  // 在服务器端处理
  const html = marked(post.content);
  const highlighted = Prism.highlight(html, Prism.languages.javascript);

  return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

// 客户端 bundle: +0KB
```

### 3. 图表和可视化库

```jsx
// ❌ 传统方式
"use client";

import Chart from "chart.js/auto"; // 200KB

export function ChartComponent({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    new Chart(canvasRef.current, {
      type: "bar",
      data: data,
    });
  }, [data]);

  return <canvas ref={canvasRef} />;
}

// 客户端 bundle: +200KB

// ✅ RSC 方式：生成静态图表
import { createCanvas } from "canvas"; // Node.js 库，不会发送到客户端

export async function StaticChart({ dataId }) {
  const data = await db.getData(dataId);

  // 在服务器端生成图表图片
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // 绘制图表...
  drawChart(ctx, data);

  const buffer = canvas.toBuffer("image/png");
  const base64 = buffer.toString("base64");

  return <img src={`data:image/png;base64,${base64}`} alt="Chart" />;
}

// 客户端 bundle: +0KB
// 如果需要交互，只发送交互部分
```

---

## 问题 3：RSC 如何实现智能代码分割？

RSC 可以根据运行时条件自动进行代码分割。

### 1. 条件渲染的代码分割

```jsx
// ❌ 传统方式：两个组件都会打包
import AdminPanel from "./AdminPanel"; // 100KB
import UserPanel from "./UserPanel"; // 50KB

export function Dashboard({ user }) {
  return <div>{user.isAdmin ? <AdminPanel /> : <UserPanel />}</div>;
}

// 客户端 bundle: +150KB（即使用户不是管理员）

// ✅ RSC 方式：只加载需要的组件
import AdminPanel from "./AdminPanel"; // 100KB
import UserPanel from "./UserPanel"; // 50KB

export async function Dashboard() {
  const user = await getUser();

  return <div>{user.isAdmin ? <AdminPanel /> : <UserPanel />}</div>;
}

/**
 * 客户端 bundle:
 * - 如果是管理员: +100KB（只有 AdminPanel）
 * - 如果是普通用户: +50KB（只有 UserPanel）
 *
 * 自动代码分割，不需要手动配置
 */
```

### 2. 功能开关的代码分割

```jsx
// ✅ 根据功能开关加载代码
export async function FeaturePage() {
  const features = await getFeatureFlags();

  return (
    <div>
      {features.newUI ? (
        // 只有启用新 UI 时才加载
        <NewUIComponent />
      ) : (
        <OldUIComponent />
      )}

      {features.experimentalFeature && (
        // 实验性功能的代码只在启用时加载
        <ExperimentalFeature />
      )}
    </div>
  );
}

/**
 * 优势：
 * - 用户只下载他们能看到的功能的代码
 * - A/B 测试不会增加所有用户的 bundle 大小
 * - 实验性功能可以安全地添加
 */
```

### 3. 地区和语言的代码分割

```jsx
// ✅ 根据地区加载不同的组件
export async function LocalizedPage() {
  const locale = await getLocale();

  return (
    <div>
      {locale === "zh-CN" ? (
        // 中国用户特有的组件
        <ChinaSpecificFeatures />
      ) : locale === "en-US" ? (
        <USSpecificFeatures />
      ) : (
        <DefaultFeatures />
      )}
    </div>
  );
}

// 每个地区的用户只下载对应的代码
```

---

## 问题 4：RSC 减少 JS 体积的实际效果如何？

通过实际案例对比 RSC 的优化效果。

### 案例 1：博客应用

```jsx
// 传统 React 应用
// pages/post/[id].tsx
import { format } from 'date-fns' // 67KB
import { marked } from 'marked' // 45KB
import Prism from 'prismjs' // 30KB
import { useComments } from '@/hooks/useComments' // 10KB

export default function PostPage({ post }) {
  const comments = useComments(post.id)
  const formattedDate = format(new Date(post.date), 'PPP')
  const html = marked(post.content)

  return (
    <article>
      <h1>{post.title}</h1>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Comments comments={comments} />
    </article>
  )
}

/**
 * 客户端 bundle:
 * - React: 40KB
 * - 页面代码: 5KB
 * - date-fns: 67KB
 * - marked: 45KB
 * - prismjs: 30KB
 * - useComments: 10KB
 * 总计: ~197KB
 */

// RSC 应用
// app/post/[id]/page.tsx
import { format } from 'date-fns' // 服务器端
import { marked } from 'marked' // 服务器端
import Prism from 'prismjs' // 服务器端

export default async function PostPage({ params }) {
  const post = await db.posts.findById(params.id)

  // 服务器端处理
  const formattedDate = format(new Date(post.date), 'PPP')
  const html = marked(post.content)
  const highlighted = Prism.highlight(html, Prism.languages.javascript)

  return (
    <article>
      <h1>{post.title}</h1>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: highlighted }} />
      {/* 只有评论区是 Client Component */}
      <CommentsSection postId={post.id} />
    </article>
  )
}

/**
 * 客户端 bundle:
 * - React: 40KB
 * - CommentsSection: 15KB
 * 总计: ~55KB
 *
 * 减少: 142KB (72%)
 */
```

### 案例 2：数据仪表板

```jsx
// 传统方式
import Chart from "chart.js/auto"; // 200KB
import { parse } from "csv-parse"; // 80KB
import { format } from "date-fns"; // 67KB
import lodash from "lodash"; // 70KB

// 客户端 bundle: ~417KB

// RSC 方式
// 所有数据处理在服务器端完成
async function Dashboard() {
  const rawData = await fetchData();

  // 服务器端处理数据
  const processed = processData(rawData);
  const formatted = formatData(processed);

  return (
    <div>
      {/* 静态图表（服务器端生成） */}
      <StaticChart data={formatted} />

      {/* 只有交互部分是 Client Component */}
      <InteractiveFilters />
    </div>
  );
}

// 客户端 bundle: ~60KB
// 减少: 357KB (85%)
```

### 案例 3：电商产品页

```jsx
// 传统方式
import { ImageZoom } from "react-image-zoom"; // 50KB
import { Carousel } from "react-responsive-carousel"; // 80KB
import { format } from "date-fns"; // 67KB
import { useCart } from "@/hooks/useCart"; // 20KB

// 客户端 bundle: ~217KB

// RSC 方式
async function ProductPage({ params }) {
  const product = await db.products.findById(params.id);

  return (
    <div>
      {/* Server Component 渲染静态内容 */}
      <ProductInfo product={product} />
      <ProductImages images={product.images} />

      {/* 只有购物车功能是 Client Component */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}

// 客户端 bundle: ~35KB
// 减少: 182KB (84%)
```

### 总结

```jsx
/**
 * RSC 减少 JS 体积的关键策略：
 *
 * 1. 组件代码不发送到客户端
 *    - Server Component 代码保留在服务器端
 *
 * 2. 第三方库不打包到客户端
 *    - 数据处理、格式化、解析等库只在服务器端使用
 *
 * 3. 智能代码分割
 *    - 根据运行时条件只加载需要的代码
 *
 * 4. 最小化 Client Component
 *    - 只在需要交互时使用 Client Component
 *
 * 实际效果：
 * - 通常可以减少 60-85% 的 JavaScript 体积
 * - 首屏加载时间显著缩短
 * - TTI (Time to Interactive) 大幅改善
 */
```

## 延伸阅读

- [Next.js 官方文档 - Optimizing Bundle Size](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [React Server Components and Bundle Size](https://vercel.com/blog/understanding-react-server-components)
- [How RSC Reduces JavaScript](https://www.joshwcomeau.com/react/server-components/#reducing-bundle-size)
- [Bundle Size Optimization with RSC](https://nextjs.org/docs/app/building-your-application/optimizing)
