---
title: fetch request memoization 是什么？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 fetch 请求记忆化（Request Memoization）的工作原理，学习如何在单次渲染中自动去重相同的请求，优化应用性能。
tags:
  - Next.js
  - Request Memoization
  - 性能优化
  - React Server Components
estimatedTime: 20 分钟
keywords:
  - fetch memoization
  - 请求记忆化
  - 请求去重
  - Next.js 优化
highlight: 掌握 Next.js 请求记忆化机制，理解单次渲染中的自动去重优化
order: 667
---

## 问题 1：什么是 fetch request memoization？

Request Memoization（请求记忆化）是 Next.js 在 React 渲染周期内自动对相同的 fetch 请求进行去重的优化机制。

### 基本概念

**记忆化的作用**：

- 在同一次渲染中，相同的 fetch 请求只会执行一次
- 其他相同的请求会直接使用第一次请求的结果
- 自动发生，无需手动配置

```typescript
// 假设有两个组件都请求相同的数据
async function UserProfile({ userId }: { userId: string }) {
  // 第一次请求，实际发送网络请求
  const user = await fetch(`https://api.example.com/users/${userId}`);
  return <div>{user.name}</div>;
}

async function UserAvatar({ userId }: { userId: string }) {
  // 相同的请求，直接使用记忆化的结果，不会发送网络请求
  const user = await fetch(`https://api.example.com/users/${userId}`);
  return <img src={user.avatar} />;
}

// 在同一个页面中使用
export default function Page() {
  return (
    <>
      <UserProfile userId="123" />
      <UserAvatar userId="123" />
      {/* 虽然有两个 fetch，但只会发送一次网络请求 */}
    </>
  );
}
```

### 与缓存的区别

**Request Memoization（请求记忆化）**：

- 作用范围：单次渲染周期
- 生命周期：渲染结束后清除
- 目的：避免重复请求

**Data Cache（数据缓存）**：

- 作用范围：跨请求、跨部署
- 生命周期：持久化存储
- 目的：避免重复获取数据

```typescript
// Request Memoization：在同一次渲染中生效
async function Page() {
  const data1 = await fetch("https://api.example.com/data"); // 发送请求
  const data2 = await fetch("https://api.example.com/data"); // 使用记忆化结果
  // 渲染结束后，记忆化清除
}

// Data Cache：跨请求生效
async function Page() {
  const data = await fetch("https://api.example.com/data", {
    cache: "force-cache", // 缓存结果
  });
  // 下次访问页面时，直接使用缓存
}
```

---

## 问题 2：request memoization 的工作原理是什么？

理解记忆化的工作原理可以帮助我们更好地利用这个特性。

### 记忆化的判断标准

**相同请求的条件**：

- 相同的 URL
- 相同的请求方法（GET、POST 等）
- 相同的请求选项

```typescript
// 这些请求会被记忆化
const req1 = await fetch("https://api.example.com/data");
const req2 = await fetch("https://api.example.com/data"); // 相同 URL

// 这些请求不会被记忆化
const req3 = await fetch("https://api.example.com/data");
const req4 = await fetch("https://api.example.com/data", {
  cache: "no-store", // 不同的选项
});

const req5 = await fetch("https://api.example.com/data", { method: "GET" });
const req6 = await fetch("https://api.example.com/data", { method: "POST" }); // 不同的方法
```

### 作用范围

**仅在 Server Component 树中生效**：

- 只在 React 服务器组件渲染期间有效
- 不跨越不同的渲染周期
- 不在 Client Component 中生效

```typescript
// app/page.tsx - Server Component
async function ServerPage() {
  // 在服务器组件树中，这些请求会被记忆化
  const data1 = await fetch("https://api.example.com/data");

  return (
    <>
      <ServerChild /> {/* 这里的相同请求会被记忆化 */}
      <ClientChild /> {/* 客户端组件中的请求不会被记忆化 */}
    </>
  );
}

async function ServerChild() {
  // 这个请求会使用记忆化的结果
  const data = await fetch("https://api.example.com/data");
  return <div>{data}</div>;
}

// 客户端组件
("use client");
function ClientChild() {
  // 客户端组件中的 fetch 不会被记忆化
  useEffect(() => {
    fetch("https://api.example.com/data"); // 独立的请求
  }, []);
  return <div>Client</div>;
}
```

### 生命周期

```typescript
// 请求 1：用户访问页面
async function Page() {
  const data1 = await fetch("https://api.example.com/data"); // 发送请求
  const data2 = await fetch("https://api.example.com/data"); // 使用记忆化
  // 渲染完成，记忆化清除
}

// 请求 2：用户刷新页面
async function Page() {
  const data1 = await fetch("https://api.example.com/data"); // 重新发送请求
  const data2 = await fetch("https://api.example.com/data"); // 使用新的记忆化
  // 渲染完成，记忆化清除
}
```

---

## 问题 3：request memoization 解决了什么实际问题？

请求记忆化主要解决了组件化开发中的重复请求问题。

### 问题场景 1：组件独立性

**没有记忆化的问题**：

- 每个组件独立请求数据
- 相同的数据被请求多次
- 增加服务器负载和响应时间

```typescript
// 没有记忆化：每个组件都发送请求
async function Header() {
  const user = await fetch("/api/user"); // 请求 1
  return <div>{user.name}</div>;
}

async function Sidebar() {
  const user = await fetch("/api/user"); // 请求 2（重复）
  return <div>{user.avatar}</div>;
}

async function Content() {
  const user = await fetch("/api/user"); // 请求 3（重复）
  return <div>{user.bio}</div>;
}

// 总共发送 3 次相同的请求
```

**有记忆化的优化**：

```typescript
// 有记忆化：只发送一次请求
async function Header() {
  const user = await fetch("/api/user"); // 实际请求
  return <div>{user.name}</div>;
}

async function Sidebar() {
  const user = await fetch("/api/user"); // 使用记忆化结果
  return <div>{user.avatar}</div>;
}

async function Content() {
  const user = await fetch("/api/user"); // 使用记忆化结果
  return <div>{user.bio}</div>;
}

// 只发送 1 次请求，其他使用记忆化结果
```

### 问题场景 2：数据依赖关系

**复杂的组件树**：

```typescript
// 父组件需要用户数据
async function UserPage({ userId }: { userId: string }) {
  const user = await fetch(`/api/users/${userId}`); // 请求 1

  return (
    <div>
      <h1>{user.name}</h1>
      <UserPosts userId={userId} />
      <UserComments userId={userId} />
    </div>
  );
}

// 子组件也需要用户数据来显示作者信息
async function UserPosts({ userId }: { userId: string }) {
  const posts = await fetch(`/api/users/${userId}/posts`);
  const user = await fetch(`/api/users/${userId}`); // 使用记忆化，不重复请求

  return (
    <div>
      <p>Posts by {user.name}</p>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
}

async function UserComments({ userId }: { userId: string }) {
  const comments = await fetch(`/api/users/${userId}/comments`);
  const user = await fetch(`/api/users/${userId}`); // 使用记忆化，不重复请求

  return (
    <div>
      <p>Comments by {user.name}</p>
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
```

### 问题场景 3：并行数据获取

```typescript
// 多个组件并行渲染，同时请求相同数据
async function Dashboard() {
  return (
    <div>
      {/* 这些组件会并行渲染 */}
      <Suspense fallback={<Loading />}>
        <UserStats />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <UserActivity />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <UserProfile />
      </Suspense>
    </div>
  );
}

async function UserStats() {
  const user = await fetch("/api/user"); // 第一个请求
  return <div>Posts: {user.postCount}</div>;
}

async function UserActivity() {
  const user = await fetch("/api/user"); // 记忆化，等待第一个请求完成
  return <div>Last active: {user.lastActive}</div>;
}

async function UserProfile() {
  const user = await fetch("/api/user"); // 记忆化，等待第一个请求完成
  return <div>Name: {user.name}</div>;
}
```

---

## 问题 4：如何在需要时绕过 request memoization？

某些情况下，你可能需要绕过记忆化机制，确保每次都发送新的请求。

### 方法 1：使用 AbortController

```typescript
// 每次创建新的 AbortController，请求就不会被记忆化
async function getData() {
  const controller1 = new AbortController();
  const data1 = await fetch("https://api.example.com/data", {
    signal: controller1.signal,
  });

  const controller2 = new AbortController();
  const data2 = await fetch("https://api.example.com/data", {
    signal: controller2.signal, // 不同的 signal，不会被记忆化
  });
}
```

### 方法 2：添加唯一参数

```typescript
// 通过添加时间戳或随机数使 URL 不同
async function getData() {
  const data1 = await fetch(`https://api.example.com/data?t=${Date.now()}`);
  const data2 = await fetch(`https://api.example.com/data?t=${Date.now()}`);
  // URL 不同，不会被记忆化
}
```

### 方法 3：使用 cache: 'no-store'

```typescript
// no-store 会绕过记忆化和数据缓存
async function getData() {
  const data1 = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });
  const data2 = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });
  // 每次都发送新请求
}
```

### 实际应用场景

```typescript
// 场景：需要获取数据的不同版本
async function CompareData() {
  // 获取缓存版本
  const cachedData = await fetch("https://api.example.com/data");

  // 获取最新版本（绕过记忆化）
  const freshData = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });

  return (
    <div>
      <h2>Cached: {cachedData.version}</h2>
      <h2>Fresh: {freshData.version}</h2>
    </div>
  );
}
```

## 总结

**核心概念总结**：

### 1. Request Memoization 的特点

- 在单次渲染周期内自动去重相同请求
- 只在 Server Component 中生效
- 渲染结束后自动清除

### 2. 与数据缓存的区别

- Request Memoization：单次渲染内有效
- Data Cache：跨请求持久化
- 两者可以同时生效，互不冲突

### 3. 实际价值

- 简化组件开发，无需担心重复请求
- 提升性能，减少网络请求
- 保持组件独立性，每个组件可以独立请求数据

## 延伸阅读

- [Next.js Request Memoization](https://nextjs.org/docs/app/building-your-application/caching#request-memoization)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
