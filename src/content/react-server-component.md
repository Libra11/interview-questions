---
title: 什么是 React Server Component？
category: React
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  全面讲解 React Server Component 的概念、工作原理和核心特性，理解这一革命性的 React 新特性如何改变前端开发模式。
tags:
  - React
  - Server Component
  - RSC
  - Next.js
estimatedTime: 30 分钟
keywords:
  - React Server Component
  - RSC
  - 服务器组件
  - React 18
highlight: React Server Component 是 React 18 引入的革命性特性，重新定义了前端组件的渲染模式
order: 24
---

## 问题 1：React Server Component 的基本概念是什么？

React Server Component（RSC）是 React 18 引入的一种新的组件类型，它在服务器端渲染并且不会发送 JavaScript 代码到客户端。

### 传统 React 组件的问题

```jsx
// 传统的 React 组件
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // 客户端获取数据
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 问题：
// 1. 组件代码和所有依赖都要发送到客户端
// 2. 需要等待 JavaScript 加载和执行才能获取数据
// 3. 会出现加载状态，用户体验不佳
```

### Server Component 的解决方案

```jsx
// Server Component（在服务器端运行）
async function ProductList() {
  // 直接在服务器端获取数据
  const products = await db.query("SELECT * FROM products");

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 优势：
// 1. 组件代码不会发送到客户端
// 2. 可以直接访问数据库、文件系统等服务器资源
// 3. 返回的是渲染结果，不是 JavaScript 代码
// 4. 减少客户端 JavaScript 体积
```

### 核心特点

**1. 在服务器端执行**

- 组件代码只在服务器端运行
- 可以使用服务器端的 API（数据库、文件系统等）

**2. 零客户端 JavaScript**

- 组件本身不会增加客户端 bundle 大小
- 只发送渲染结果到客户端

**3. 支持异步**

- 可以直接使用 async/await
- 不需要 useEffect 来获取数据

---

## 问题 2：Server Component 与 Client Component 有什么区别？

React 现在有两种组件类型，它们有明确的分工和限制：

### Server Component（默认）

在 Next.js App Router 中，组件默认是 Server Component：

```jsx
// app/products/page.tsx
// 这是一个 Server Component（默认）
async function ProductsPage() {
  // ✅ 可以直接访问数据库
  const products = await db.products.findMany();

  // ✅ 可以使用 Node.js API
  const fs = require("fs");

  // ✅ 可以使用环境变量（不会暴露给客户端）
  const apiKey = process.env.SECRET_API_KEY;

  // ❌ 不能使用 useState, useEffect 等 Hook
  // ❌ 不能使用浏览器 API
  // ❌ 不能添加事件处理器

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Client Component

需要显式声明 `'use client'`：

```jsx
// app/components/Counter.tsx
"use client"; // 声明为 Client Component

import { useState } from "react";

function Counter() {
  // ✅ 可以使用 useState, useEffect 等 Hook
  const [count, setCount] = useState(0);

  // ✅ 可以添加事件处理器
  const handleClick = () => setCount(count + 1);

  // ✅ 可以使用浏览器 API
  useEffect(() => {
    localStorage.setItem("count", count.toString());
  }, [count]);

  // ❌ 不能直接访问数据库
  // ❌ 不能使用 Node.js API

  return <button onClick={handleClick}>Count: {count}</button>;
}
```

### 对比表格

| 特性       | Server Component | Client Component |
| ---------- | ---------------- | ---------------- |
| 声明方式   | 默认             | `'use client'`   |
| 运行位置   | 服务器           | 服务器 + 客户端  |
| 数据获取   | 直接访问数据库   | 通过 API         |
| React Hook | ❌ 不支持        | ✅ 支持          |
| 事件处理   | ❌ 不支持        | ✅ 支持          |
| 浏览器 API | ❌ 不支持        | ✅ 支持          |
| 异步组件   | ✅ 支持          | ❌ 不支持        |
| JS 体积    | 不增加           | 增加             |

---

## 问题 3：Server Component 如何与 Client Component 组合使用？

Server Component 和 Client Component 可以组合使用，但需要遵循一些规则：

### 1. Server Component 可以导入 Client Component

```jsx
// app/page.tsx (Server Component)
import ClientCounter from "./ClientCounter"; // Client Component

async function HomePage() {
  const data = await fetchData();

  return (
    <div>
      <h1>Server Component</h1>
      {/* ✅ 可以使用 Client Component */}
      <ClientCounter />
    </div>
  );
}
```

### 2. Client Component 不能直接导入 Server Component

```jsx
// ❌ 错误做法
"use client";

import ServerComponent from "./ServerComponent"; // Server Component

function ClientComponent() {
  return (
    <div>
      <ServerComponent /> {/* 错误！*/}
    </div>
  );
}
```

### 3. 通过 children 传递 Server Component

可以通过 props 将 Server Component 传递给 Client Component：

```jsx
// app/components/ClientWrapper.tsx
"use client";

function ClientWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}

// app/page.tsx (Server Component)
import ClientWrapper from "./components/ClientWrapper";
import ServerContent from "./components/ServerContent";

async function HomePage() {
  return (
    <ClientWrapper>
      {/* ✅ 通过 children 传递 Server Component */}
      <ServerContent />
    </ClientWrapper>
  );
}
```

### 4. 数据从 Server 传递到 Client

Server Component 可以将数据作为 props 传递给 Client Component：

```jsx
// app/page.tsx (Server Component)
import ProductList from "./ProductList"; // Client Component

async function HomePage() {
  // 在服务器端获取数据
  const products = await db.products.findMany();

  return (
    <div>
      {/* ✅ 将数据作为 props 传递 */}
      <ProductList products={products} />
    </div>
  );
}

// app/ProductList.tsx (Client Component)
("use client");

function ProductList({ products }) {
  const [filter, setFilter] = useState("");

  // 在客户端进行过滤
  const filtered = products.filter((p) => p.name.includes(filter));

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 5. 组合模式的最佳实践

```jsx
// 推荐的组合模式
// app/dashboard/page.tsx (Server Component)
async function DashboardPage() {
  // 服务器端获取数据
  const user = await getUser();
  const stats = await getStats();

  return (
    <div>
      {/* Server Component 负责数据获取和静态内容 */}
      <h1>Welcome, {user.name}</h1>
      <StaticStats stats={stats} />

      {/* Client Component 负责交互 */}
      <InteractiveChart data={stats} />
      <UserSettings userId={user.id} />
    </div>
  );
}

// 原则：
// 1. 尽可能多使用 Server Component
// 2. 只在需要交互时使用 Client Component
// 3. 在 Server Component 中获取数据，传递给 Client Component
```

---

## 问题 4：为什么需要 React Server Component？

React Server Component 解决了传统 React 应用的几个核心问题：

### 1. 减少客户端 JavaScript 体积

**传统方式**：所有组件代码都发送到客户端

```jsx
// 传统 React 应用
import { format } from "date-fns"; // 整个库都会打包到客户端
import { marked } from "marked"; // Markdown 解析库也会打包

function BlogPost({ post }) {
  const formattedDate = format(new Date(post.date), "PPP");
  const html = marked(post.content);

  return (
    <article>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

// 问题：date-fns 和 marked 都会增加客户端 bundle 大小
```

**Server Component 方式**：库只在服务器端使用

```jsx
// Server Component
import { format } from "date-fns"; // 只在服务器端使用，不会发送到客户端
import { marked } from "marked"; // 同样不会发送到客户端

async function BlogPost({ postId }) {
  const post = await db.posts.findById(postId);

  const formattedDate = format(new Date(post.date), "PPP");
  const html = marked(post.content);

  return (
    <article>
      <time>{formattedDate}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}

// 优势：客户端 bundle 不包含这些库
```

### 2. 直接访问后端资源

**传统方式**：需要创建 API 路由

```jsx
// pages/api/products.ts
export default async function handler(req, res) {
  const products = await db.products.findMany();
  res.json(products);
}

// pages/products.tsx
function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  return <div>{/* ... */}</div>;
}

// 问题：需要额外的 API 层，增加延迟
```

**Server Component 方式**：直接访问数据库

```jsx
// app/products/page.tsx
async function ProductsPage() {
  // 直接访问数据库，不需要 API 路由
  const products = await db.products.findMany();

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

// 优势：减少网络往返，更快的数据获取
```

### 3. 自动代码分割

Server Component 天然支持代码分割：

```jsx
// app/page.tsx
async function HomePage() {
  const showAdmin = await checkAdminPermission();

  return (
    <div>
      {showAdmin ? (
        // 只有管理员才会加载这个组件的代码
        <AdminPanel />
      ) : (
        <UserPanel />
      )}
    </div>
  );
}

// AdminPanel 的代码只在需要时才发送到客户端
```

### 4. 更好的数据获取模式

**传统方式**：瀑布式请求

```jsx
function Page() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // 第一个请求
    fetch("/api/user").then((res) => {
      setUser(res);
      // 第二个请求依赖第一个
      fetch(`/api/posts?userId=${res.id}`).then(setPosts);
    });
  }, []);

  // 问题：串行请求，总时间 = 请求1 + 请求2
}
```

**Server Component 方式**：并行请求

```jsx
async function Page() {
  // 并行获取数据
  const [user, posts] = await Promise.all([getUser(), getPosts()]);

  // 优势：总时间 = max(请求1, 请求2)
  return <div>{/* ... */}</div>;
}
```

### 5. 更好的 SEO 和首屏性能

Server Component 返回完整的 HTML，对 SEO 和首屏性能都有帮助：

```jsx
// Server Component 返回完整的 HTML
async function ProductPage({ productId }) {
  const product = await db.products.findById(productId);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <img src={product.image} alt={product.name} />
    </div>
  );
}

// 优势：
// 1. 搜索引擎可以直接抓取内容
// 2. 用户立即看到内容，不需要等待 JavaScript
// 3. 即使 JavaScript 加载失败，内容仍然可见
```

## 延伸阅读

- [React 官方文档 - Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js 官方文档 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Making Sense of React Server Components](https://www.joshwcomeau.com/react/server-components/)
- [Understanding React Server Components](https://vercel.com/blog/understanding-react-server-components)
- [RFC: React Server Components](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
