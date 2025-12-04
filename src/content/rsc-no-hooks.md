---
title: RSC 为什么不支持 useState/useEffect？
category: React
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入解析 React Server Component 不支持 Hooks 的技术原因，理解服务器组件的执行模型和设计理念。
tags:
  - React
  - RSC
  - Hooks
  - Server Component
estimatedTime: 20 分钟
keywords:
  - React Server Component
  - useState
  - useEffect
  - Hooks 限制
highlight: 理解 RSC 的 Hooks 限制，是掌握服务器组件设计理念的关键
order: 26
---

## 问题 1：Server Component 不支持哪些 Hooks？

React Server Component 不支持所有与客户端状态和生命周期相关的 Hooks。

### 不支持的 Hooks

```jsx
// ❌ Server Component 中不能使用这些 Hooks
async function ServerComponent() {
  // ❌ 状态管理 Hooks
  const [count, setCount] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);

  // ❌ 副作用 Hooks
  useEffect(() => {
    // 不能使用
  }, []);

  useLayoutEffect(() => {
    // 不能使用
  }, []);

  // ❌ 引用 Hooks
  const ref = useRef(null);

  // ❌ 上下文 Hooks（客户端 Context）
  const value = useContext(MyContext);

  // ❌ 其他客户端 Hooks
  useImperativeHandle();
  useInsertionEffect();

  return <div>Server Component</div>;
}
```

### 支持的 Hooks

```jsx
// ✅ Server Component 可以使用的 Hooks
import { cache } from "react";
import { cookies, headers } from "next/headers";

async function ServerComponent() {
  // ✅ 服务器端专用 Hooks
  const cookieStore = cookies();
  const headersList = headers();

  // ✅ 缓存函数
  const getCachedData = cache(async (id) => {
    return await db.findById(id);
  });

  return <div>Server Component</div>;
}
```

---

## 问题 2：为什么 Server Component 不支持 useState？

`useState` 是用于管理客户端状态的，而 Server Component 在服务器端执行，没有持久化的状态。

### 技术原因

**1. 服务器端没有状态持久化**

```jsx
// ❌ 这在 Server Component 中没有意义
async function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

/**
 * 问题：
 *
 * 1. Server Component 在每次请求时执行
 * 2. 执行完成后，组件实例就被销毁了
 * 3. 没有地方可以存储 state
 * 4. 下次请求时，state 会重置为初始值
 *
 * 流程：
 * 请求1: count = 0 -> 渲染 -> 组件销毁
 * 请求2: count = 0 -> 渲染 -> 组件销毁（不是 1）
 */
```

**2. 服务器端没有事件处理**

```jsx
// ❌ Server Component 不能有事件处理器
async function ServerComponent() {
  const [count, setCount] = useState(0);

  // 这个函数无法在服务器端执行
  const handleClick = () => {
    setCount(count + 1); // 谁来触发这个？
  };

  return (
    // onClick 在服务器端没有意义
    <button onClick={handleClick}>{count}</button>
  );
}

/**
 * 问题：
 *
 * 1. 服务器端渲染后返回 HTML
 * 2. HTML 中的 button 元素没有绑定事件
 * 3. 用户点击按钮时，服务器端不知道
 * 4. setCount 永远不会被调用
 */
```

### 正确的做法

使用 Client Component 来管理状态：

```jsx
// ✅ Client Component
"use client";

import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}

// ✅ Server Component 使用 Client Component
async function Page() {
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      {/* 交互部分使用 Client Component */}
      <Counter />
    </div>
  );
}
```

---

## 问题 3：为什么 Server Component 不支持 useEffect？

`useEffect` 是用于处理副作用的，但 Server Component 的执行模型不需要副作用管理。

### 技术原因

**1. 服务器端没有生命周期**

```jsx
// ❌ 这在 Server Component 中没有意义
async function DataFetcher() {
  useEffect(() => {
    // 什么时候执行？
    fetch("/api/data").then(setData);
  }, []);

  return <div>Data</div>;
}

/**
 * 问题：
 *
 * 1. useEffect 在组件挂载后执行
 * 2. Server Component 不会"挂载"到 DOM
 * 3. 渲染完成后，组件就不存在了
 * 4. 没有"组件挂载"的概念
 */
```

**2. 服务器端直接使用 async/await**

```jsx
// ❌ 不需要 useEffect
function ServerComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  return <div>{data?.title}</div>;
}

// ✅ 直接使用 async/await
async function ServerComponent() {
  // 直接在组件中获取数据
  const data = await fetchData();

  return <div>{data.title}</div>;
}

/**
 * 优势：
 *
 * 1. 代码更简洁
 * 2. 不需要处理加载状态
 * 3. 不需要处理错误状态（可以用 Error Boundary）
 * 4. 数据在渲染前就准备好了
 */
```

**3. 副作用在服务器端直接执行**

```jsx
// ❌ 不需要 useEffect 来执行副作用
function ServerComponent() {
  useEffect(() => {
    // 记录日志
    console.log("Component mounted");

    // 发送分析数据
    analytics.track("page_view");
  }, []);

  return <div>Content</div>;
}

// ✅ 直接执行
async function ServerComponent() {
  // 直接执行副作用
  console.log("Component rendered");
  analytics.track("page_view");

  return <div>Content</div>;
}

/**
 * 区别：
 *
 * Client Component:
 * - 渲染 -> 挂载 -> useEffect 执行
 *
 * Server Component:
 * - 执行代码 -> 渲染 -> 返回结果
 * - 所有代码都是同步执行的（除了 await）
 */
```

### useEffect 的客户端替代方案

如果需要客户端副作用，使用 Client Component：

```jsx
// ✅ Client Component
"use client";

import { useEffect } from "react";

function AnalyticsTracker({ pageId }) {
  useEffect(() => {
    // 客户端副作用
    analytics.track("page_view", { pageId });

    // 清理函数
    return () => {
      analytics.track("page_leave", { pageId });
    };
  }, [pageId]);

  return null;
}

// ✅ Server Component 使用 Client Component
async function Page({ params }) {
  const page = await getPage(params.id);

  return (
    <div>
      <h1>{page.title}</h1>
      <div>{page.content}</div>

      {/* 客户端分析追踪 */}
      <AnalyticsTracker pageId={page.id} />
    </div>
  );
}
```

---

## 问题 4：如何在 Server Component 中实现类似的功能？

虽然不能使用 Hooks，但可以用其他方式实现类似的功能。

### 1. 数据获取：使用 async/await

```jsx
// ❌ Client Component 方式
"use client";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>{/* ... */}</div>;
}

// ✅ Server Component 方式
async function ProductList() {
  // 直接获取数据，不需要 loading 状态
  const products = await fetch("https://api.example.com/products").then((res) =>
    res.json()
  );

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 2. 条件渲染：使用普通的 if 语句

```jsx
// ❌ Client Component 方式
"use client";

function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser().then(setUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  return <div>{user.name}</div>;
}

// ✅ Server Component 方式
async function UserProfile() {
  const user = await fetchUser();

  // 直接使用条件判断
  if (!user) {
    return <div>User not found</div>;
  }

  return <div>{user.name}</div>;
}
```

### 3. 数据缓存：使用 React cache

```jsx
// ✅ 使用 cache 避免重复请求
import { cache } from "react";

// 创建缓存函数
const getUser = cache(async (id: string) => {
  console.log("Fetching user:", id);
  return await db.user.findById(id);
});

async function UserProfile({ userId }) {
  // 第一次调用，执行查询
  const user = await getUser(userId);
  return <div>{user.name}</div>;
}

async function UserPosts({ userId }) {
  // 第二次调用，使用缓存
  const user = await getUser(userId);
  const posts = await db.posts.findByUser(userId);
  return <div>{/* ... */}</div>;
}

async function Page({ params }) {
  return (
    <div>
      {/* getUser 只会执行一次 */}
      <UserProfile userId={params.id} />
      <UserPosts userId={params.id} />
    </div>
  );
}
```

### 4. 共享数据：通过 props 传递

```jsx
// ✅ Server Component 之间通过 props 共享数据
async function ParentComponent() {
  // 在父组件获取数据
  const user = await getUser();
  const posts = await getPosts();

  return (
    <div>
      {/* 通过 props 传递给子组件 */}
      <UserInfo user={user} />
      <PostList posts={posts} user={user} />
    </div>
  );
}

async function UserInfo({ user }) {
  // 直接使用传入的数据
  return <div>{user.name}</div>;
}

async function PostList({ posts, user }) {
  return (
    <div>
      {posts.map((post) => (
        <Post key={post.id} post={post} author={user} />
      ))}
    </div>
  );
}
```

### 5. 客户端交互：组合使用 Client Component

```jsx
// ✅ Server Component 负责数据，Client Component 负责交互
async function ProductPage({ productId }) {
  // Server Component 获取数据
  const product = await getProduct(productId);
  const reviews = await getReviews(productId);

  return (
    <div>
      {/* Server Component 渲染静态内容 */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Client Component 处理交互 */}
      <AddToCartButton product={product} />
      <ReviewForm productId={productId} />
      <ReviewList initialReviews={reviews} />
    </div>
  );
}

// Client Component
("use client");

function AddToCartButton({ product }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = async () => {
    setIsAdding(true);
    await addToCart(product.id);
    setIsAdding(false);
  };

  return (
    <button onClick={handleClick} disabled={isAdding}>
      {isAdding ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

## 延伸阅读

- [React 官方文档 - Server Components Limitations](https://react.dev/reference/react/use-server#limitations)
- [Next.js 官方文档 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Why React Server Components Don't Support Hooks](https://www.joshwcomeau.com/react/server-components/#hooks-and-state)
- [React cache API](https://react.dev/reference/react/cache)
