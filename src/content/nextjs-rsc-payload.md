---
title: Next.js 中的 RSC Payload 详解
category: Next.js
difficulty: 高级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js 中 RSC Payload（React Server Components Payload）的格式、内容和工作原理，掌握服务端组件如何在客户端导航中传输。
tags:
  - Next.js
  - RSC
  - Server Components
  - Flight Data
estimatedTime: 25 分钟
keywords:
  - RSC Payload
  - Flight Data
  - Server Components
  - 客户端导航
highlight: 理解 RSC Payload 的本质和工作机制，掌握服务端组件的传输原理
order: 706
---

## 问题 1：什么是 RSC Payload？

**RSC Payload 的定义**

RSC Payload（也称为 Flight Data）是 React Server Components 的**序列化输出格式**。当用户在 Next.js 应用中进行客户端导航时，服务器不会返回完整的 HTML，而是返回一种特殊格式的数据，这就是 RSC Payload。

**为什么需要 RSC Payload？**

```typescript
// 传统的客户端导航
// 1. 用户点击链接
<Link href="/about">About</Link>

// 2. 浏览器请求 /about
// 3. 服务器返回完整的 HTML 页面
// 4. 浏览器解析并渲染 HTML

// RSC 的客户端导航
// 1. 用户点击链接
<Link href="/about">About</Link>

// 2. Next.js 拦截导航，发送特殊请求
// 3. 服务器返回 RSC Payload（不是 HTML）
// 4. React 在客户端解析 Payload 并更新 UI
```

**RSC Payload 解决的核心问题**

1. **服务端组件不包含在客户端 Bundle 中**
2. **客户端导航时需要获取服务端组件的渲染结果**
3. **保持应用的交互性和性能**

---

## 问题 2：RSC Payload 是什么格式？

**RSC Payload 的格式**

RSC Payload 使用一种特殊的**流式序列化格式**，类似于 JSON，但支持更多的数据类型。

```typescript
// 简化的 RSC Payload 示例
// 实际格式更复杂，这里展示概念

// 服务端组件
export default async function Page() {
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      <ClientComponent data={data} />
    </div>
  );
}

// 对应的 RSC Payload（简化版）
{
  "type": "div",
  "props": {
    "children": [
      {
        "type": "h1",
        "props": {
          "children": "Hello World"
        }
      },
      {
        "type": "$ClientComponent",
        "props": {
          "data": { "title": "Hello World" }
        }
      }
    ]
  }
}
```

**实际的 RSC Payload 格式**

```
// 真实的 RSC Payload 使用特殊的行分隔格式
0:["$","div",null,{"children":[["$","h1",null,{"children":"Hello"}],["$","$L1",null,{"data":{"title":"Hello"}}]]}]
1:{"id":"./src/components/ClientComponent.tsx","chunks":["client1"],"name":"default"}
```

**格式特点**

1. **行分隔**：每行代表一个数据块
2. **引用系统**：使用 `$L1`、`$L2` 等引用其他块
3. **类型标记**：使用 `$` 前缀标记特殊类型
4. **流式传输**：可以逐步发送和解析

---

## 问题 3：RSC Payload 包含什么内容？

**核心内容**

```typescript
// 1. 组件树结构
{
  "type": "div",
  "props": {
    "className": "container",
    "children": [...]
  }
}

// 2. 客户端组件的引用
{
  "type": "$ClientComponent",
  "props": { "data": {...} },
  "moduleId": "./src/components/ClientComponent.tsx"
}

// 3. 服务端数据
{
  "user": {
    "id": 1,
    "name": "Alice"
  }
}

// 4. 元数据
{
  "title": "Page Title",
  "description": "Page description"
}
```

**完整示例**

```typescript
// app/page.tsx
import ClientComponent from "./ClientComponent";

export default async function Page() {
  const user = await fetchUser();

  return (
    <div className="container">
      <h1>Welcome, {user.name}</h1>
      <ClientComponent userId={user.id} />
      <ServerComponent data={user.posts} />
    </div>
  );
}

// 对应的 RSC Payload（简化）
{
  "tree": {
    "type": "div",
    "props": {
      "className": "container",
      "children": [
        {
          "type": "h1",
          "props": { "children": "Welcome, Alice" }
        },
        {
          "type": "$ClientComponent",
          "props": { "userId": 1 },
          "module": "./ClientComponent.tsx"
        },
        {
          "type": "$ServerComponent",
          "props": { "data": [...] }
        }
      ]
    }
  },
  "modules": {
    "./ClientComponent.tsx": {
      "id": "client-1",
      "chunks": ["chunk-1.js"]
    }
  }
}
```

---

## 问题 4：RSC Payload 如何解决"服务端组件不包含在客户端 Bundle 中"的问题？

**问题背景**

```typescript
// 服务端组件包含服务端逻辑
// app/page.tsx
export default async function Page() {
  // 这些代码只在服务端运行
  const db = await connectDatabase();
  const users = await db.query("SELECT * FROM users");

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// ❌ 如果将这个组件打包到客户端 Bundle
// 1. 会暴露数据库连接信息
// 2. 会增加 Bundle 大小
// 3. 浏览器无法执行数据库操作
```

**RSC Payload 的解决方案**

```typescript
// 1. 服务端执行组件，获取数据
const users = await db.query("SELECT * FROM users");

// 2. 将渲染结果序列化为 RSC Payload
const payload = {
  type: "div",
  props: {
    children: [
      { type: "div", props: { children: "Alice" } },
      { type: "div", props: { children: "Bob" } },
    ],
  },
};

// 3. 发送 Payload 到客户端
// 客户端只接收渲染结果，不包含服务端代码

// 4. 客户端 React 解析 Payload 并渲染
// 不需要服务端组件的源代码
```

**工作流程**

```typescript
// 服务端
// 1. 接收客户端导航请求
GET /about?_rsc=xxx

// 2. 执行服务端组件
export default async function AboutPage() {
  const data = await fetchData(); // 服务端逻辑

  return (
    <div>
      <h1>{data.title}</h1>
      <ClientComponent data={data} />
    </div>
  );
}

// 3. 生成 RSC Payload
const payload = serializeRSC({
  tree: renderToRSC(<AboutPage />),
  modules: getClientModules(),
});

// 4. 返回 Payload
Response: RSC Payload (流式传输)

// 客户端
// 5. 接收 Payload
const payload = await fetch('/about?_rsc=xxx');

// 6. 解析并渲染
React.hydrateRoot(container, parseRSC(payload));

// 7. 加载客户端组件
import('./ClientComponent.tsx');
```

---

## 问题 5：RSC Payload 与传统 HTML 响应的区别是什么？

**传统的服务端渲染（SSR）**

```typescript
// 1. 服务器返回完整的 HTML
GET /about
Response:
<!DOCTYPE html>
<html>
  <head>
    <title>About</title>
    <script src="/bundle.js"></script>
  </head>
  <body>
    <div id="root">
      <div class="container">
        <h1>About Us</h1>
        <p>Content...</p>
      </div>
    </div>
  </body>
</html>

// 2. 浏览器解析 HTML 并渲染
// 3. 加载 JavaScript Bundle
// 4. React hydration（激活交互）
```

**RSC 的客户端导航**

```typescript
// 1. 服务器返回 RSC Payload
GET /about?_rsc=xxx
Response:
0:["$","div",null,{"className":"container","children":[["$","h1",null,{"children":"About Us"}],["$","p",null,{"children":"Content..."}]]}]

// 2. React 在客户端解析 Payload
// 3. 更新现有的 DOM（不需要完整的页面刷新）
// 4. 保持客户端状态和交互
```

**对比**

| 特性       | 传统 HTML             | RSC Payload            |
| ---------- | --------------------- | ---------------------- |
| 格式       | HTML 文本             | 序列化的 React 树      |
| 大小       | 较大（包含完整 HTML） | 较小（只包含必要数据） |
| 解析       | 浏览器 HTML 解析器    | React 运行时           |
| 状态保持   | 丢失（页面刷新）      | 保持（客户端更新）     |
| 交互性     | 需要 hydration        | 即时可用               |
| 服务端代码 | 可能泄露              | 完全隔离               |

**实际示例**

```typescript
// 服务端组件
export default async function ProductPage({ params }: { params: { id: string } }) {
  // 服务端逻辑（不会发送到客户端）
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { reviews: true },
  });

  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <ClientReviews reviews={product.reviews} />
    </div>
  );
}

// 客户端导航时的 RSC Payload（简化）
{
  "tree": {
    "type": "div",
    "children": [
      { "type": "h1", "children": "iPhone 15" },
      { "type": "p", "children": "$999" },
      {
        "type": "$ClientReviews",
        "props": {
          "reviews": [
            { "id": 1, "text": "Great!" },
            { "id": 2, "text": "Love it!" }
          ]
        }
      }
    ]
  }
}

// 注意：
// 1. 数据库查询代码不在 Payload 中
// 2. 只包含渲染结果
// 3. 客户端组件的 props 被序列化
```

---

## 问题 6：RSC Payload 的性能优势是什么？

**优势 1：更小的传输大小**

```typescript
// HTML 响应（传统 SSR）
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="root">
      <div class="container">
        <h1>Title</h1>
        <div class="content">...</div>
      </div>
    </div>
    <script>
      // 完整的 React 代码
      // 完整的应用代码
      // 可能包含重复的数据
    </script>
  </body>
</html>
// 大小：~100KB

// RSC Payload
0:["$","div",null,{"className":"container","children":[...]}]
1:{"module":"./ClientComponent.tsx","chunks":["client-1"]}
// 大小：~10KB（只包含必要数据）
```

**优势 2：流式传输**

```typescript
// RSC Payload 支持流式传输
export default async function Page() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <SlowComponent />
      </Suspense>
      <FastComponent />
    </div>
  );
}

// 传输过程：
// 1. 立即发送 FastComponent 的 Payload
0:["$","div",null,{"children":[["$","$L1",null,{}],["$","FastComponent",null,{}]]}]

// 2. SlowComponent 完成后，发送其 Payload
1:["$","SlowComponent",null,{"data":{...}}]

// 3. 客户端逐步渲染，无需等待所有数据
```

**优势 3：避免重复数据**

```typescript
// 传统 SSR：数据可能重复
<script>
  window.__INITIAL_DATA__ = { users: [...] }; // 在 HTML 中
</script>
<script src="/bundle.js"></script> // Bundle 中也包含相同的数据结构

// RSC Payload：数据只发送一次
0:["$","UserList",null,{"users":[...]}] // 数据只在这里
```

---

## 总结

**核心概念**：

### 1. RSC Payload 是什么

- React Server Components 的序列化输出
- 客户端导航时的数据传输格式
- 也称为 Flight Data

### 2. 格式特点

- 行分隔的序列化格式
- 支持引用和流式传输
- 包含组件树、数据和模块信息

### 3. 包含的内容

- 组件树结构
- 客户端组件引用
- 服务端数据
- 元数据和模块信息

### 4. 解决的问题

- 服务端组件不包含在客户端 Bundle
- 保持客户端状态和交互性
- 减少传输大小
- 支持流式渲染

### 5. 性能优势

- 更小的传输大小
- 流式传输支持
- 避免重复数据
- 更快的导航体验

### 6. 与 HTML 的区别

- 格式：序列化的 React 树 vs HTML 文本
- 大小：更小
- 状态：保持 vs 丢失
- 解析：React 运行时 vs 浏览器

## 延伸阅读

- [React 官方文档 - Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js 官方文档 - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Understanding React Server Components](https://www.joshwcomeau.com/react/server-components/)
