---
title: 为什么 Next.js 要引入 React Server Components（RSC）？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 React Server Components 的设计动机和核心价值，掌握服务端组件如何改变 React 应用的架构模式。
tags:
  - Next.js
  - React Server Components
  - RSC
  - 服务端渲染
estimatedTime: 26 分钟
keywords:
  - React Server Components
  - RSC
  - 服务端组件
  - 客户端组件
highlight: 理解 RSC 解决的核心问题，掌握服务端组件与客户端组件的协作模式
order: 713
---

## 问题 1：传统 React 应用存在什么问题？

**JavaScript Bundle 体积过大**

传统 React 应用的所有组件代码都需要发送到客户端，导致 JavaScript Bundle 体积庞大。

```typescript
// 传统 React 应用
import React from "react";
import { marked } from "marked"; // 大型 Markdown 库
import { format } from "date-fns"; // 日期格式化库
import { Prism } from "prismjs"; // 代码高亮库

export default function BlogPost({ post }) {
  // 所有这些库都会被打包到客户端
  const html = marked(post.content); // ~50KB
  const date = format(post.date, "PPP"); // ~200KB
  const highlighted = Prism.highlight(post.code, Prism.languages.javascript); // ~100KB

  return (
    <article>
      <h1>{post.title}</h1>
      <time>{date}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </article>
  );
}

// 客户端需要下载：
// - React 库
// - 组件代码
// - marked 库（50KB）
// - date-fns 库（200KB）
// - prismjs 库（100KB）
// 总计：~350KB+ 的额外代码
```

**数据获取的瀑布流问题**

传统 React 应用中，数据获取往往形成瀑布流，导致加载时间过长。

```typescript
// 传统 React 应用的数据获取
export default function Page() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState(null);
  const [comments, setComments] = useState(null);

  // 1. 首先获取用户信息
  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  // 2. 等用户信息返回后，获取文章
  useEffect(() => {
    if (user) {
      fetchPosts(user.id).then(setPosts);
    }
  }, [user]);

  // 3. 等文章返回后，获取评论
  useEffect(() => {
    if (posts) {
      fetchComments(posts[0].id).then(setComments);
    }
  }, [posts]);

  // 瀑布流：User → Posts → Comments
  // 总时间 = 请求1 + 请求2 + 请求3
}
```

**无法直接访问后端资源**

传统 React 组件运行在浏览器中，无法直接访问数据库、文件系统等后端资源。

```typescript
// ❌ 传统 React 组件无法这样做
export default function BlogPost({ slug }) {
  // 无法直接访问数据库
  const post = await db.post.findOne({ slug }); // 错误！

  // 无法直接读取文件
  const content = await fs.readFile("post.md"); // 错误！

  // 无法使用服务端环境变量
  const apiKey = process.env.SECRET_KEY; // 会暴露到客户端！

  return <div>{post.title}</div>;
}

// 必须通过 API 路由
export default function BlogPost({ slug }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    // 需要额外的 API 请求
    fetch(`/api/posts/${slug}`)
      .then((res) => res.json())
      .then(setPost);
  }, [slug]);

  return <div>{post?.title}</div>;
}
```

---

## 问题 2：React Server Components 如何解决这些问题？

**减少客户端 JavaScript 体积**

Server Components 在服务端执行，代码和依赖不会发送到客户端。

```typescript
// app/blog/[slug]/page.tsx（Server Component）
import { marked } from "marked"; // 不会发送到客户端
import { format } from "date-fns"; // 不会发送到客户端
import { Prism } from "prismjs"; // 不会发送到客户端

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);

  // 这些处理都在服务端完成
  const html = marked(post.content);
  const date = format(post.date, "PPP");
  const highlighted = Prism.highlight(post.code, Prism.languages.javascript);

  // 客户端只接收最终的 HTML
  return (
    <article>
      <h1>{post.title}</h1>
      <time>{date}</time>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </article>
  );
}

// 客户端 JavaScript 体积：几乎为 0
// marked、date-fns、prismjs 都不会发送到客户端
```

**并行数据获取**

Server Components 可以在服务端并行获取数据，消除瀑布流。

```typescript
// Server Component 并行获取数据
export default async function Page() {
  // 所有请求在服务端并行发起
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments(),
  ]);

  // 总时间 = max(请求1, 请求2, 请求3)
  // 而不是 请求1 + 请求2 + 请求3

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <CommentList comments={comments} />
    </div>
  );
}
```

**直接访问后端资源**

Server Components 可以直接访问数据库、文件系统等后端资源。

```typescript
// Server Component 直接访问后端
import { db } from "@/lib/db";
import fs from "fs/promises";

export default async function BlogPost({ params }) {
  // ✅ 直接访问数据库
  const post = await db.post.findOne({
    where: { slug: params.slug },
  });

  // ✅ 直接读取文件
  const content = await fs.readFile(`posts/${params.slug}.md`, "utf-8");

  // ✅ 安全使用环境变量（不会暴露到客户端）
  const apiKey = process.env.SECRET_KEY;
  const data = await fetch("https://api.example.com/data", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  return <article>{post.title}</article>;
}

// 不需要额外的 API 路由
// 不需要客户端请求
// 数据获取更快，更安全
```

---

## 问题 3：Server Components 和 Client Components 如何协作？

**Server Component（默认）**

在 App Router 中，组件默认是 Server Component。

```typescript
// app/page.tsx（Server Component - 默认）
export default async function Page() {
  const posts = await fetchPosts();

  // ✅ 可以使用 async/await
  // ✅ 可以直接访问后端资源
  // ✅ 可以使用服务端专用库

  // ❌ 不能使用 React Hooks
  // ❌ 不能使用浏览器 API
  // ❌ 不能使用事件处理器

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

**Client Component（需要标记）**

使用 `'use client'` 指令标记客户端组件。

```typescript
// app/components/LikeButton.tsx（Client Component）
"use client";

import { useState } from "react";

export default function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  // ✅ 可以使用 React Hooks
  // ✅ 可以使用浏览器 API
  // ✅ 可以使用事件处理器

  // ❌ 不能使用 async/await（在组件顶层）
  // ❌ 不能直接访问后端资源

  const handleLike = async () => {
    setLiked(!liked);
    // 通过 API 路由与后端交互
    await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    setCount(count + 1);
  };

  return (
    <button onClick={handleLike}>
      {liked ? "❤️" : "🤍"} {count}
    </button>
  );
}
```

**组合使用**

Server Component 可以导入 Client Component，但反过来不行。

```typescript
// ✅ Server Component 导入 Client Component
// app/blog/[slug]/page.tsx（Server Component）
import LikeButton from "@/components/LikeButton"; // Client Component

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      {/* Server Component 中使用 Client Component */}
      <LikeButton postId={post.id} />
    </article>
  );
}

// ❌ Client Component 不能导入 Server Component
// app/components/Sidebar.tsx（Client Component）
("use client");

import ServerComponent from "./ServerComponent"; // 错误！

export default function Sidebar() {
  return (
    <div>
      <ServerComponent /> {/* 这不会按预期工作 */}
    </div>
  );
}

// ✅ 正确做法：通过 children 传递
// app/layout.tsx（Server Component）
import Sidebar from "./components/Sidebar"; // Client Component
import ServerComponent from "./components/ServerComponent"; // Server Component

export default function Layout({ children }) {
  return (
    <div>
      <Sidebar>
        {/* 将 Server Component 作为 children 传递 */}
        <ServerComponent />
      </Sidebar>
      {children}
    </div>
  );
}

// app/components/Sidebar.tsx（Client Component）
("use client");

export default function Sidebar({ children }) {
  return <aside>{children}</aside>;
}
```

---

## 问题 4：Server Components 如何传输数据到客户端？

**RSC Payload（React Server Component Payload）**

Server Components 渲染后会生成一个特殊的 JSON 格式，称为 RSC Payload。

```typescript
// Server Component
export default async function Page() {
  const user = await fetchUser();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <ClientComponent userId={user.id} />
    </div>
  );
}

// 生成的 RSC Payload（简化版）
{
  "type": "div",
  "props": null,
  "children": [
    {
      "type": "h1",
      "props": null,
      "children": ["Welcome, ", "John Doe"]
    },
    {
      "type": "ClientComponent",
      "props": { "userId": 123 },
      "children": []
    }
  ]
}

// 这个 Payload 会被发送到客户端
// 客户端使用它来渲染 UI
```

**数据序列化**

传递给 Client Component 的 props 必须是可序列化的。

```typescript
// ✅ 可序列化的数据
<ClientComponent
  name="John"              // 字符串
  age={30}                 // 数字
  isActive={true}          // 布尔值
  tags={['react', 'next']} // 数组
  meta={{ views: 100 }}    // 对象
  date={new Date().toISOString()} // 日期（序列化为字符串）
/>

// ❌ 不可序列化的数据
<ClientComponent
  onClick={() => {}}       // 函数 - 错误！
  date={new Date()}        // Date 对象 - 错误！
  element={<div />}        // React 元素 - 错误！
/>

// 解决方案：在 Client Component 中创建函数
// Server Component
<ClientComponent postId={post.id} />

// Client Component
'use client';

export default function ClientComponent({ postId }) {
  // 在客户端创建函数
  const handleClick = () => {
    console.log(postId);
  };

  return <button onClick={handleClick}>Click</button>;
}
```

---

## 问题 5：什么时候应该使用 Server Component 和 Client Component？

**使用 Server Component 的场景**

```typescript
// 1. 数据获取
export default async function ProductList() {
  const products = await fetchProducts();
  return <div>{/* 渲染产品列表 */}</div>;
}

// 2. 访问后端资源
export default async function BlogPost({ params }) {
  const post = await db.post.findOne({ slug: params.slug });
  return <article>{post.content}</article>;
}

// 3. 保护敏感信息
export default async function Dashboard() {
  const apiKey = process.env.SECRET_KEY; // 不会暴露到客户端
  const data = await fetchWithAuth(apiKey);
  return <div>{data.content}</div>;
}

// 4. 减少客户端 JavaScript
import { marked } from "marked"; // 大型库，不会发送到客户端

export default async function MarkdownPage({ content }) {
  const html = marked(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

**使用 Client Component 的场景**

```typescript
// 1. 交互性（事件处理器）
"use client";

export default function Button() {
  return <button onClick={() => alert("Clicked!")}>Click</button>;
}

// 2. 状态管理（React Hooks）
("use client");

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 3. 浏览器 API
("use client");

import { useEffect } from "react";

export default function GeolocationComponent() {
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position);
    });
  }, []);

  return <div>Getting location...</div>;
}

// 4. 生命周期效果
("use client");

import { useEffect } from "react";

export default function Analytics() {
  useEffect(() => {
    // 页面浏览统计
    trackPageView();
  }, []);

  return null;
}
```

**最佳实践：尽可能使用 Server Component**

```typescript
// ❌ 不好：整个页面都是 Client Component
"use client";

export default function Page() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Header />
      <StaticContent />
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Footer />
    </div>
  );
}

// ✅ 好：只有需要交互的部分是 Client Component
// app/page.tsx（Server Component）
import Counter from "./Counter"; // Client Component

export default async function Page() {
  const data = await fetchData(); // 在服务端获取数据

  return (
    <div>
      <Header />
      <StaticContent data={data} />
      <Counter /> {/* 只有这个是 Client Component */}
      <Footer />
    </div>
  );
}

// app/Counter.tsx（Client Component）
("use client");

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## 总结

**React Server Components 的核心价值**：

### 1. 解决的问题

- **减少客户端 JavaScript 体积**：服务端代码和依赖不发送到客户端
- **消除数据获取瀑布流**：在服务端并行获取数据
- **直接访问后端资源**：无需额外的 API 路由
- **提升安全性**：敏感信息不暴露到客户端

### 2. 工作原理

- Server Component 在服务端渲染
- 生成 RSC Payload 发送到客户端
- 客户端使用 Payload 渲染 UI
- Client Component 在客户端激活（hydration）

### 3. 组件选择

**Server Component（默认）**：

- 数据获取
- 访问后端资源
- 静态内容
- 大型依赖库

**Client Component（'use client'）**：

- 交互性（事件处理器）
- 状态管理（React Hooks）
- 浏览器 API
- 生命周期效果

### 4. 最佳实践

- 默认使用 Server Component
- 只在需要交互时使用 Client Component
- 将 Client Component 推到组件树的叶子节点
- Server Component 可以导入 Client Component
- Client Component 通过 children 接收 Server Component

## 延伸阅读

- [Next.js 官方文档 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 官方文档 - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React 官方文档 - Server Components](https://react.dev/reference/react/use-server)
- [React Server Components 介绍](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
