---
title: fetch deduplication 是如何工作的？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 fetch 请求去重（Deduplication）的工作机制，学习如何通过自动去重优化应用性能，以及去重与缓存、记忆化的关系。
tags:
  - Next.js
  - Fetch Deduplication
  - 性能优化
  - Request Memoization
estimatedTime: 18 分钟
keywords:
  - fetch deduplication
  - 请求去重
  - Next.js 优化
  - 性能优化
highlight: 掌握 Next.js fetch 去重机制，理解自动去重的工作原理和优化效果
order: 670
---

## 问题 1：什么是 fetch deduplication？

Fetch deduplication（请求去重）是 Next.js 自动合并相同 fetch 请求的优化机制，它是 Request Memoization 的底层实现。

### 基本概念

**去重的作用**：

- 自动识别相同的 fetch 请求
- 将多个相同请求合并为一个
- 所有请求共享同一个响应结果

```typescript
// 多个组件同时请求相同数据
async function Component1() {
  const data = await fetch("https://api.example.com/data"); // 发起请求
  return <div>{data.title}</div>;
}

async function Component2() {
  const data = await fetch("https://api.example.com/data"); // 等待第一个请求
  return <div>{data.description}</div>;
}

async function Component3() {
  const data = await fetch("https://api.example.com/data"); // 等待第一个请求
  return <div>{data.author}</div>;
}

// 虽然有 3 个 fetch 调用，但只会发送 1 个网络请求
// 其他两个会等待第一个请求完成，然后共享结果
```

### 去重 vs 缓存

**Deduplication（去重）**：

- 针对正在进行的请求
- 合并同时发起的相同请求
- 请求完成后不保留结果

**Cache（缓存）**：

- 针对已完成的请求
- 保存请求结果供后续使用
- 持久化存储

```typescript
// 场景 1：并行请求（去重生效）
async function Page() {
  // 这两个请求几乎同时发起
  const [data1, data2] = await Promise.all([
    fetch("https://api.example.com/data"), // 实际发送请求
    fetch("https://api.example.com/data"), // 等待第一个请求，共享结果
  ]);
  // 只发送 1 个网络请求
}

// 场景 2：顺序请求（缓存生效）
async function Page() {
  const data1 = await fetch("https://api.example.com/data"); // 发送请求并缓存
  // ... 一些其他操作
  const data2 = await fetch("https://api.example.com/data"); // 使用缓存结果
  // 第一个请求已完成，第二个使用缓存
}
```

---

## 问题 2：fetch deduplication 的工作原理是什么？

理解去重的工作原理可以帮助我们更好地优化应用。

### 去重的判断条件

**相同请求的标准**：

- 完全相同的 URL
- 相同的 HTTP 方法
- 相同的请求选项

```typescript
// 这些请求会被去重
const req1 = fetch("https://api.example.com/data");
const req2 = fetch("https://api.example.com/data");
const req3 = fetch("https://api.example.com/data");
// 只发送 1 个请求

// 这些请求不会被去重
const req4 = fetch("https://api.example.com/data");
const req5 = fetch("https://api.example.com/data?v=2"); // URL 不同
const req6 = fetch("https://api.example.com/data", {
  method: "POST", // 方法不同
});
// 发送 3 个不同的请求
```

### 去重的时机

**在请求飞行期间（in-flight）**：

- 第一个请求发送到服务器
- 后续相同请求进入等待队列
- 第一个请求完成后，所有等待的请求获得相同结果

```typescript
async function Page() {
  console.log("开始请求");

  // 时间点 0ms：第一个请求发起
  const promise1 = fetch("https://api.example.com/data");

  // 时间点 5ms：第二个请求发起（第一个还在进行中）
  const promise2 = fetch("https://api.example.com/data");

  // 时间点 10ms：第三个请求发起（第一个还在进行中）
  const promise3 = fetch("https://api.example.com/data");

  // 时间点 100ms：第一个请求完成
  // 所有 promise 同时 resolve，获得相同的结果
  const [data1, data2, data3] = await Promise.all([
    promise1,
    promise2,
    promise3,
  ]);

  console.log("所有请求完成");
  // 实际只发送了 1 个网络请求
}
```

### 去重的生命周期

```typescript
// 阶段 1：请求发起
const req1 = fetch("https://api.example.com/data"); // 发送网络请求
const req2 = fetch("https://api.example.com/data"); // 加入去重队列

// 阶段 2：请求进行中
// req1 正在等待服务器响应
// req2 等待 req1 完成

// 阶段 3：请求完成
// req1 获得响应
// req2 获得相同的响应（不发送网络请求）

// 阶段 4：去重结束
// 下次再请求相同 URL 时，如果第一个请求已完成，会使用缓存而不是去重
const req3 = fetch("https://api.example.com/data"); // 使用缓存
```

---

## 问题 3：deduplication 在实际应用中如何优化性能？

去重机制在实际应用中可以显著减少网络请求，提升性能。

### 场景 1：并行组件渲染

```typescript
// 多个组件并行渲染，请求相同数据
async function Dashboard() {
  return (
    <div className="grid grid-cols-3">
      {/* 这些组件会并行渲染 */}
      <UserCard />
      <UserStats />
      <UserActivity />
    </div>
  );
}

async function UserCard() {
  // 第一个发起的请求
  const user = await fetch("/api/user");
  return <div>{user.name}</div>;
}

async function UserStats() {
  // 这个请求会被去重，等待 UserCard 的请求完成
  const user = await fetch("/api/user");
  return <div>Posts: {user.postCount}</div>;
}

async function UserActivity() {
  // 这个请求也会被去重
  const user = await fetch("/api/user");
  return <div>Last seen: {user.lastSeen}</div>;
}

// 结果：只发送 1 个 /api/user 请求
// 性能提升：减少了 2 个网络请求
```

### 场景 2：嵌套组件数据获取

```typescript
// 父子组件都需要相同的数据
async function BlogPost({ postId }: { postId: string }) {
  // 父组件获取文章数据
  const post = await fetch(`/api/posts/${postId}`);

  return (
    <article>
      <h1>{post.title}</h1>
      <PostMeta postId={postId} />
      <PostContent postId={postId} />
      <PostComments postId={postId} />
    </article>
  );
}

async function PostMeta({ postId }: { postId: string }) {
  // 子组件也获取文章数据（去重）
  const post = await fetch(`/api/posts/${postId}`);
  return (
    <div>
      By {post.author} on {post.date}
    </div>
  );
}

async function PostContent({ postId }: { postId: string }) {
  // 子组件获取文章数据（去重）
  const post = await fetch(`/api/posts/${postId}`);
  return <div>{post.content}</div>;
}

async function PostComments({ postId }: { postId: string }) {
  // 子组件获取文章数据（去重）
  const post = await fetch(`/api/posts/${postId}`);
  const comments = await fetch(`/api/posts/${postId}/comments`);

  return (
    <div>
      <h3>{post.commentCount} Comments</h3>
      {comments.map((c) => (
        <Comment key={c.id} comment={c} />
      ))}
    </div>
  );
}

// 结果：4 个组件都调用了相同的 fetch，但只发送 1 个请求
```

### 场景 3：Suspense 边界

```typescript
// 使用 Suspense 的并行数据获取
async function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <Header />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <Sidebar />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <MainContent />
      </Suspense>
    </div>
  );
}

// 这些组件会并行开始渲染
async function Header() {
  const config = await fetch("/api/config"); // 请求 1
  return <header>{config.siteName}</header>;
}

async function Sidebar() {
  const config = await fetch("/api/config"); // 去重，等待请求 1
  return <aside>{config.menu}</aside>;
}

async function MainContent() {
  const config = await fetch("/api/config"); // 去重，等待请求 1
  return <main>{config.content}</main>;
}

// 结果：3 个 Suspense 边界并行渲染，但只发送 1 个 /api/config 请求
```

---

## 问题 4：如何验证 deduplication 是否生效？

在开发中，我们可以通过多种方式验证去重是否正常工作。

### 方法 1：查看网络请求

```typescript
// app/test/page.tsx
async function TestPage() {
  // 故意发起多个相同请求
  const [data1, data2, data3] = await Promise.all([
    fetch("https://jsonplaceholder.typicode.com/posts/1"),
    fetch("https://jsonplaceholder.typicode.com/posts/1"),
    fetch("https://jsonplaceholder.typicode.com/posts/1"),
  ]);

  return (
    <div>
      <p>Data 1: {data1.title}</p>
      <p>Data 2: {data2.title}</p>
      <p>Data 3: {data3.title}</p>
    </div>
  );
}

// 打开浏览器开发者工具 -> Network 标签
// 应该只看到 1 个网络请求，而不是 3 个
```

### 方法 2：添加日志

```typescript
// 创建一个带日志的 fetch 包装函数
async function fetchWithLog(url: string, options?: RequestInit) {
  console.log(`[Fetch] 发起请求: ${url}`);
  const response = await fetch(url, options);
  console.log(`[Fetch] 请求完成: ${url}`);
  return response;
}

async function TestPage() {
  console.log("开始并行请求");

  const [data1, data2, data3] = await Promise.all([
    fetchWithLog("https://api.example.com/data"),
    fetchWithLog("https://api.example.com/data"),
    fetchWithLog("https://api.example.com/data"),
  ]);

  console.log("所有请求完成");

  // 查看控制台输出：
  // 开始并行请求
  // [Fetch] 发起请求: https://api.example.com/data
  // [Fetch] 发起请求: https://api.example.com/data
  // [Fetch] 发起请求: https://api.example.com/data
  // [Fetch] 请求完成: https://api.example.com/data
  // [Fetch] 请求完成: https://api.example.com/data
  // [Fetch] 请求完成: https://api.example.com/data
  // 所有请求完成

  return <div>Check console</div>;
}
```

### 方法 3：测量请求时间

```typescript
async function TestPage() {
  // 测试去重效果
  const start1 = Date.now();
  const data1 = await fetch("https://api.example.com/data");
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  const data2 = await fetch("https://api.example.com/data");
  const time2 = Date.now() - start2;

  return (
    <div>
      <p>第一次请求耗时: {time1}ms</p>
      <p>第二次请求耗时: {time2}ms</p>
      {/* 如果去重生效，第二次应该是 0ms 或很小 */}
    </div>
  );
}
```

### 方法 4：使用 React DevTools

```typescript
// 在组件中添加标记
async function Component1() {
  console.log("Component1 开始渲染");
  const data = await fetch("https://api.example.com/data");
  console.log("Component1 获得数据");
  return <div>Component1</div>;
}

async function Component2() {
  console.log("Component2 开始渲染");
  const data = await fetch("https://api.example.com/data");
  console.log("Component2 获得数据");
  return <div>Component2</div>;
}

// 查看控制台输出顺序：
// Component1 开始渲染
// Component2 开始渲染
// Component1 获得数据
// Component2 获得数据（几乎同时）
```

## 总结

**核心概念总结**：

### 1. Deduplication 的特点

- 自动合并正在进行中的相同请求
- 所有请求共享同一个响应结果
- 只在 Server Component 渲染期间生效

### 2. 与其他机制的关系

- Deduplication：合并进行中的请求
- Request Memoization：Deduplication 的上层抽象
- Data Cache：持久化已完成的请求结果

### 3. 性能优化价值

- 减少网络请求数量
- 降低服务器负载
- 提升页面渲染速度
- 简化组件开发，无需手动管理请求

## 延伸阅读

- [Next.js Request Memoization](https://nextjs.org/docs/app/building-your-application/caching#request-memoization)
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
