---
title: 服务器组件如何与客户端组件交互？
category: React
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解 Server Component 和 Client Component 之间的交互模式，包括数据传递、组件组合和事件处理等方法。
tags:
  - React
  - RSC
  - Server Component
  - Client Component
estimatedTime: 25 分钟
keywords:
  - Server Component
  - Client Component
  - 组件交互
  - 数据传递
highlight: 掌握 Server Component 和 Client Component 的交互模式是构建 RSC 应用的核心技能
order: 31
---

## 问题 1：Server Component 如何向 Client Component 传递数据？

Server Component 可以通过 props 向 Client Component 传递数据，但数据必须是可序列化的。

### 基本数据传递

```tsx
// app/page.tsx (Server Component)
async function Page() {
  // 在服务器端获取数据
  const products = await db.products.findMany();

  return (
    <div>
      {/* 通过 props 传递数据给 Client Component */}
      <ProductList products={products} />
    </div>
  );
}

// app/components/ProductList.tsx (Client Component)
("use client");

import { useState } from "react";

function ProductList({ products }) {
  const [filter, setFilter] = useState("");

  // 在客户端进行过滤
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter products..."
      />
      {filtered.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 可序列化的数据类型

```tsx
// ✅ 可以传递的数据类型
async function Page() {
  const data = {
    // ✅ 基本类型
    string: "hello",
    number: 42,
    boolean: true,
    null: null,

    // ✅ 数组和对象
    array: [1, 2, 3],
    object: { key: "value" },

    // ✅ Date（会被序列化为字符串）
    date: new Date(),

    // ✅ 嵌套结构
    nested: {
      items: [{ id: 1, name: "Item" }],
    },
  };

  return <ClientComponent data={data} />;
}

// ❌ 不能传递的数据类型
async function Page() {
  const data = {
    // ❌ 函数
    callback: () => console.log("hello"),

    // ❌ 类实例
    instance: new MyClass(),

    // ❌ Symbol
    symbol: Symbol("key"),

    // ❌ undefined（会被忽略）
    value: undefined,

    // ❌ Map/Set（会被序列化为空对象）
    map: new Map(),
    set: new Set(),
  };

  return <ClientComponent data={data} />;
}
```

---

## 问题 2：Client Component 如何触发 Server Component 更新？

Client Component 不能直接调用 Server Component，但可以通过路由导航或 Server Actions 来触发更新。

### 方法 1：使用路由导航

```tsx
// app/products/page.tsx (Server Component)
async function ProductsPage({ searchParams }) {
  // 根据 URL 参数获取数据
  const products = await db.products.findMany({
    where: {
      category: searchParams.category,
      minPrice: searchParams.minPrice,
    },
  });

  return (
    <div>
      {/* Client Component 控制过滤 */}
      <FilterControls />

      {/* Server Component 显示结果 */}
      <ProductGrid products={products} />
    </div>
  );
}

// app/components/FilterControls.tsx (Client Component)
("use client");

import { useRouter, useSearchParams } from "next/navigation";

function FilterControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", category);

    // 更新 URL，触发 Server Component 重新渲染
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select onChange={(e) => handleCategoryChange(e.target.value)}>
      <option value="all">All Categories</option>
      <option value="electronics">Electronics</option>
      <option value="clothing">Clothing</option>
    </select>
  );
}
```

### 方法 2：使用 Server Actions

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updateProduct(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");

  // 更新数据库
  await db.products.update({
    where: { id },
    data: { name },
  });

  // 重新验证页面，触发 Server Component 重新渲染
  revalidatePath("/products");
}

// app/components/ProductForm.tsx (Client Component)
("use client");

import { updateProduct } from "@/app/actions";

function ProductForm({ product }) {
  return (
    <form action={updateProduct}>
      <input type="hidden" name="id" value={product.id} />
      <input name="name" defaultValue={product.name} />
      <button type="submit">Update</button>
    </form>
  );
}

// app/products/page.tsx (Server Component)
async function ProductsPage() {
  // 每次重新验证后，这里会重新执行
  const products = await db.products.findMany();

  return (
    <div>
      {products.map((product) => (
        <ProductForm key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 问题 3：如何组合 Server Component 和 Client Component？

Server Component 和 Client Component 可以通过多种模式组合使用。

### 模式 1：Client Component 作为叶子节点

```tsx
// ✅ 推荐：将 Client Component 放在树的叶子位置
// app/page.tsx (Server Component)
async function Page() {
  const data = await fetchData();

  return (
    <div>
      {/* Server Component 渲染大部分内容 */}
      <Header />
      <main>
        <h1>{data.title}</h1>
        <p>{data.description}</p>

        {/* 只在需要交互的地方使用 Client Component */}
        <LikeButton postId={data.id} />
        <ShareButton url={data.url} />
      </main>
      <Footer />
    </div>
  );
}
```

### 模式 2：通过 children 传递 Server Component

```tsx
// app/components/ClientWrapper.tsx (Client Component)
"use client";

import { useState } from "react";

export function ClientWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>

      {/* children 可以是 Server Component */}
      {isOpen && <div>{children}</div>}
    </div>
  );
}

// app/page.tsx (Server Component)
import { ClientWrapper } from "./components/ClientWrapper";

async function Page() {
  const content = await fetchContent();

  return (
    <ClientWrapper>
      {/* 这是 Server Component，会在服务器端渲染 */}
      <ServerContent data={content} />
    </ClientWrapper>
  );
}

async function ServerContent({ data }) {
  // 可以在这里进行数据库查询
  const details = await db.getDetails(data.id);

  return <div>{details.text}</div>;
}
```

### 模式 3：使用 slots 模式

```tsx
// app/components/Layout.tsx (Client Component)
"use client";

type LayoutProps = {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  content: React.ReactNode;
};

export function Layout({ header, sidebar, content }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div>
      <header>{header}</header>

      <div className="flex">
        {sidebarOpen && <aside>{sidebar}</aside>}
        <main>{content}</main>
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle Sidebar
      </button>
    </div>
  );
}

// app/page.tsx (Server Component)
import { Layout } from "./components/Layout";

async function Page() {
  const [user, posts, stats] = await Promise.all([
    getUser(),
    getPosts(),
    getStats(),
  ]);

  return (
    <Layout
      header={<Header user={user} />}
      sidebar={<Sidebar stats={stats} />}
      content={<PostList posts={posts} />}
    />
  );
}

// 所有传入的内容都是 Server Component
async function Header({ user }) {
  return <h1>Welcome, {user.name}</h1>;
}

async function Sidebar({ stats }) {
  return <div>Stats: {stats.total}</div>;
}

async function PostList({ posts }) {
  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  );
}
```

---

## 问题 4：Server Component 和 Client Component 交互的最佳实践

### 1. 明确组件边界

```tsx
/**
 * 设计原则：
 * 1. 默认使用 Server Component
 * 2. 只在需要交互时使用 Client Component
 * 3. 将 Client Component 推到树的叶子节点
 */

// ✅ 好的设计
async function Page() {
  const data = await fetchData();

  return (
    <div>
      {/* 大部分是 Server Component */}
      <StaticHeader />
      <StaticContent data={data} />

      {/* 只有交互部分是 Client Component */}
      <InteractiveWidget />
    </div>
  );
}

// ❌ 不好的设计
("use client");

async function Page() {
  // 整个页面都是 Client Component
  // 失去了 Server Component 的优势
  return <div>...</div>;
}
```

### 2. 优化数据传递

```tsx
// ✅ 只传递必要的数据
async function Page() {
  const product = await getProduct();

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* 只传递需要的字段 */}
      <AddToCartButton productId={product.id} price={product.price} />
    </div>
  );
}

// ❌ 传递过多数据
async function Page() {
  const product = await getProduct();

  return (
    <div>
      {/* 传递了整个 product 对象，包括不需要的字段 */}
      <AddToCartButton product={product} />
    </div>
  );
}
```

### 3. 使用 Context 共享客户端状态

```tsx
// app/components/CartProvider.tsx (Client Component)
"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    setItems([...items, item]);
  };

  return (
    <CartContext.Provider value={{ items, addItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

// app/layout.tsx (Server Component)
import { CartProvider } from "./components/CartProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Client Component 提供 context */}
        <CartProvider>
          {/* children 可以是 Server Component */}
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

// app/components/AddToCartButton.tsx (Client Component)
("use client");

import { useCart } from "./CartProvider";

export function AddToCartButton({ product }) {
  const { addItem } = useCart();

  return <button onClick={() => addItem(product)}>Add to Cart</button>;
}
```

### 4. 处理加载和错误状态

```tsx
// app/page.tsx (Server Component)
import { Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";

async function Page() {
  return (
    <div>
      <h1>Products</h1>

      {/* 使用 Suspense 处理加载状态 */}
      <Suspense fallback={<LoadingSpinner />}>
        <ProductList />
      </Suspense>

      {/* 使用 Error Boundary 处理错误 */}
      <ErrorBoundary fallback={<ErrorMessage />}>
        <Suspense fallback={<LoadingSpinner />}>
          <RelatedProducts />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// app/components/ErrorBoundary.tsx (Client Component)
("use client");

import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

### 5. 避免常见陷阱

```tsx
// ❌ 错误：Client Component 导入 Server Component
"use client";

import ServerComponent from "./ServerComponent"; // 错误！

function ClientComponent() {
  return <ServerComponent />; // 不会按预期工作
}

// ✅ 正确：通过 props 传递
("use client");

function ClientComponent({ children }) {
  return <div>{children}</div>;
}

// 在 Server Component 中使用
async function Page() {
  return (
    <ClientComponent>
      <ServerComponent /> {/* 正确 */}
    </ClientComponent>
  );
}
```

## 延伸阅读

- [Next.js 官方文档 - Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [React 官方文档 - Server and Client Components](https://react.dev/reference/react/use-client)
- [Passing Data Between Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#passing-props-from-server-to-client-components-serialization)
- [Interleaving Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#interleaving-server-and-client-components)
