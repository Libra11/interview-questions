---
title: 什么是 "RSC Payload"？
category: React
difficulty: 高级
updatedAt: 2025-12-04
summary: >-
  深入解析 React Server Component Payload 的结构和作用，理解 RSC 如何在服务器和客户端之间传输组件树信息。
tags:
  - React
  - RSC
  - RSC Payload
  - 序列化
estimatedTime: 25 分钟
keywords:
  - RSC Payload
  - React Server Component
  - 序列化
  - 组件传输
highlight: RSC Payload 是 React Server Component 的核心传输格式，理解它是掌握 RSC 工作原理的关键
order: 170
---

## 问题 1：RSC Payload 是什么？

RSC Payload 是 React Server Component 渲染后生成的特殊数据格式，用于在服务器和客户端之间传输组件树信息。

### 基本概念

```jsx
// Server Component
async function ProductCard({ productId }) {
  const product = await db.products.findById(productId);

  return (
    <div className="card">
      <h2>{product.name}</h2>
      <p>{product.price}</p>
      <AddToCartButton productId={productId} />
    </div>
  );
}

/**
 * 服务器端渲染后生成 RSC Payload：
 *
 * 不是 HTML 字符串，而是一个特殊的 JSON 格式
 * 包含：
 * 1. 组件树结构
 * 2. 渲染后的数据
 * 3. Client Component 的引用
 * 4. 模块信息
 */
```

### RSC Payload 的结构（简化版）

```javascript
// RSC Payload 示例
{
  // 组件类型
  type: 'div',
  props: {
    className: 'card'
  },
  children: [
    {
      type: 'h2',
      children: 'iPhone 15' // 已经渲染的数据
    },
    {
      type: 'p',
      children: '$999'
    },
    {
      // Client Component 的引用
      type: 'client-component',
      module: {
        id: './AddToCartButton',
        name: 'AddToCartButton',
        chunks: ['app-client', 'components-button']
      },
      props: {
        productId: '123'
      }
    }
  ]
}
```

---

## 问题 2：RSC Payload 与 HTML 有什么区别？

RSC Payload 不是传统的 HTML 字符串，而是一种更灵活的数据格式。

### 传统 SSR 返回 HTML

```jsx
// 传统 SSR
function ProductCard({ product }) {
  return (
    <div className="card">
      <h2>{product.name}</h2>
      <p>{product.price}</p>
      <button onClick={() => addToCart(product.id)}>Add to Cart</button>
    </div>
  );
}

// 服务器返回的 HTML 字符串
const html = `
<div class="card">
  <h2>iPhone 15</h2>
  <p>$999</p>
  <button>Add to Cart</button>
</div>
`;

// 问题：
// 1. 丢失了组件结构信息
// 2. 需要完整的 Hydration
// 3. 所有组件代码都要发送到客户端
```

### RSC 返回 Payload

```jsx
// RSC Payload（简化的 JSON 表示）
{
  "type": "div",
  "props": { "className": "card" },
  "children": [
    {
      "type": "h2",
      "children": "iPhone 15"
    },
    {
      "type": "p",
      "children": "$999"
    },
    {
      // 保留了 Client Component 的引用
      "$$typeof": "client-component",
      "module": "AddToCartButton",
      "props": { "productId": "123" }
    }
  ]
}

// 优势：
// 1. 保留了组件树结构
// 2. 明确标识了 Client Component
// 3. 只需要加载 Client Component 的代码
// 4. 可以部分更新
```

### 对比总结

```jsx
/**
 * HTML（传统 SSR）：
 * - 静态字符串
 * - 需要完整 Hydration
 * - 所有交互都需要重新绑定
 *
 * RSC Payload：
 * - 结构化数据
 * - 只 Hydrate Client Component
 * - 保留了组件边界信息
 */

// 传统 SSR 流程
Server: Component → HTML String
Client: HTML String → Parse → Hydrate All

// RSC 流程
Server: Component → RSC Payload
Client: RSC Payload → Render → Hydrate Client Components Only
```

---

## 问题 3：RSC Payload 如何传输和解析？

RSC Payload 使用特殊的流式格式传输，可以边接收边渲染。

### 1. 流式传输格式

```jsx
// Server Component
async function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Loading />}>
        <SlowContent />
      </Suspense>
      <Footer />
    </div>
  );
}

/**
 * RSC Payload 流式传输：
 *
 * Chunk 1（立即发送）:
 * M1:{"id":"./Header","chunks":["app-client"],"name":"Header"}
 * J0:["$","div",null,{"children":[
 *   ["$","$L1",null,{}],
 *   ["$","$L2",null,{"fallback":"Loading..."}]
 * ]}]
 *
 * Chunk 2（Header 渲染完成）:
 * J1:["$","header",null,{"children":"My App"}]
 *
 * Chunk 3（SlowContent 完成）:
 * J2:["$","div",null,{"children":"Slow content loaded"}]
 *
 * 客户端可以边接收边渲染，不需要等待所有数据
 */
```

### 2. 实际的 RSC Payload 格式

```javascript
// 真实的 RSC Payload 使用特殊的序列化格式
// 每一行是一个 JSON 对象，以特殊前缀标识类型

// M: Module reference（模块引用）
M1:{"id":"./components/Button","chunks":["app-client"],"name":"Button"}

// J: JSON chunk（JSON 数据块）
J0:["$","div",null,{"children":[
  ["$","h1",null,{"children":"Hello"}],
  ["$","@1",null,{"onClick":"..."}]
]}]

// S: Suspense boundary（Suspense 边界）
S2:"pending"
S2:["$","div",null,{"children":"Content loaded"}]

/**
 * 特殊符号：
 * $: React 元素
 * @: Client Component 引用
 * $L: Lazy 组件
 */
```

### 3. 客户端解析过程

```jsx
/**
 * 客户端解析 RSC Payload：
 *
 * 1. 接收流式数据
 * 2. 解析每个 chunk
 * 3. 构建虚拟 DOM 树
 * 4. 识别 Client Component
 * 5. 加载 Client Component 代码
 * 6. 渲染最终 UI
 */

// 伪代码
async function parseRSCPayload(stream) {
  const chunks = [];

  // 流式读取
  for await (const chunk of stream) {
    if (chunk.startsWith("M")) {
      // 模块引用，记录需要加载的 Client Component
      const module = JSON.parse(chunk.slice(2));
      await loadClientComponent(module);
    } else if (chunk.startsWith("J")) {
      // JSON 数据，构建组件树
      const data = JSON.parse(chunk.slice(2));
      chunks.push(data);
    }
  }

  // 组合所有 chunks 成完整的组件树
  return combineChunks(chunks);
}
```

---

## 问题 4：RSC Payload 如何优化性能？

RSC Payload 的设计带来了多个性能优化点。

### 1. 减少数据传输

```jsx
// 传统 SSR
export async function getServerSideProps() {
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
      images: true,
      variants: true,
    },
  });

  // 所有数据都要序列化并发送
  return { props: { products } };
}

/**
 * 传输的数据：
 * - HTML: 100KB
 * - JSON data: 500KB（完整的产品数据）
 * - JavaScript: 300KB
 * 总计: 900KB
 */

// RSC
async function ProductList() {
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
      images: true,
      variants: true,
    },
  });

  return (
    <div>
      {products.map((product) => (
        // 只发送渲染后的结果
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * 传输的数据：
 * - RSC Payload: 150KB（只包含渲染后的 HTML 结构）
 * - Client Component JS: 50KB
 * 总计: 200KB（减少了 78%）
 */
```

### 2. 选择性 Hydration

```jsx
// 传统 SSR：所有组件都需要 Hydration
function Page() {
  return (
    <div>
      <Header /> {/* 需要 Hydration */}
      <StaticContent /> {/* 需要 Hydration（即使是静态的）*/}
      <Button /> {/* 需要 Hydration */}
      <Footer /> {/* 需要 Hydration */}
    </div>
  );
}

// RSC：只 Hydrate Client Component
async function Page() {
  return (
    <div>
      <Header /> {/* Server Component，不需要 Hydration */}
      <StaticContent /> {/* Server Component，不需要 Hydration */}
      <Button /> {/* Client Component，需要 Hydration */}
      <Footer /> {/* Server Component，不需要 Hydration */}
    </div>
  );
}

/**
 * Hydration 时间对比：
 *
 * 传统 SSR:
 * - 需要 Hydrate 所有组件
 * - 时间: ~500ms
 *
 * RSC:
 * - 只需要 Hydrate Button
 * - 时间: ~50ms（减少了 90%）
 */
```

### 3. 并行加载

```jsx
// RSC Payload 可以并行加载多个 Client Component
async function Page() {
  return (
    <div>
      <ClientComponentA /> {/* 并行加载 */}
      <ClientComponentB /> {/* 并行加载 */}
      <ClientComponentC /> {/* 并行加载 */}
    </div>
  );
}

/**
 * RSC Payload 包含所有 Client Component 的引用：
 *
 * M1:{"id":"./ComponentA","chunks":["chunk-a"]}
 * M2:{"id":"./ComponentB","chunks":["chunk-b"]}
 * M3:{"id":"./ComponentC","chunks":["chunk-c"]}
 *
 * 客户端可以并行下载：
 * - chunk-a.js
 * - chunk-b.js
 * - chunk-c.js
 *
 * 而不是串行等待
 */
```

### 4. 增量更新

```jsx
// RSC Payload 支持部分更新
"use client";

import { useState, useTransition } from "react";

function FilterableList() {
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (value) => {
    setFilter(value);

    // 触发 Server Component 重新渲染
    startTransition(() => {
      // 只更新列表部分，不重新加载整个页面
      router.push(`?filter=${value}`);
    });
  };

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => handleFilterChange(e.target.value)}
      />
      {/* 这部分会通过新的 RSC Payload 更新 */}
      <ServerList filter={filter} />
    </div>
  );
}

/**
 * 更新流程：
 * 1. 用户输入 filter
 * 2. 发送请求到服务器
 * 3. 服务器返回新的 RSC Payload（只包含 ServerList）
 * 4. 客户端合并新的 Payload
 * 5. 只更新 ServerList 部分
 *
 * 优势：不需要重新加载整个页面
 */
```

### 5. 代码分割

```jsx
// RSC 自动进行代码分割
async function Page() {
  const showAdmin = await checkAdminPermission();

  return (
    <div>
      {showAdmin ? (
        // AdminPanel 的代码只在需要时加载
        <AdminPanel />
      ) : (
        <UserPanel />
      )}
    </div>
  );
}

/**
 * RSC Payload 只包含实际渲染的组件引用：
 *
 * 如果 showAdmin = true:
 * M1:{"id":"./AdminPanel","chunks":["admin-panel"]}
 *
 * 如果 showAdmin = false:
 * M1:{"id":"./UserPanel","chunks":["user-panel"]}
 *
 * 客户端只下载需要的代码
 */
```

## 延伸阅读

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [How React Server Components Work](https://www.plasmic.app/blog/how-react-server-components-work)
- [Understanding the RSC Wire Format](https://github.com/reactwg/server-components/discussions/3)
- [Deep Dive into React Server Components](https://www.joshwcomeau.com/react/server-components/)
