---
title: layout.tsx、page.tsx、template.tsx 的作用区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js App Router 中三种核心文件的作用和区别，掌握如何使用它们构建高效的应用结构。
tags:
  - Next.js
  - App Router
  - layout
  - template
estimatedTime: 20 分钟
keywords:
  - layout.tsx
  - page.tsx
  - template.tsx
  - 布局组件
highlight: 理解 layout、page 和 template 的核心区别，掌握何时使用每种文件类型
order: 716
---

## 问题 1：page.tsx 的作用是什么？

**page.tsx 定义路由页面**

`page.tsx` 是唯一会成为可访问路由的文件，它定义了路由的 UI 内容。

```typescript
// app/page.tsx → /
export default function HomePage() {
  return <h1>Home Page</h1>;
}

// app/about/page.tsx → /about
export default function AboutPage() {
  return <h1>About Page</h1>;
}

// app/blog/[slug]/page.tsx → /blog/:slug
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Blog Post: {params.slug}</h1>;
}

// 只有 page.tsx 文件才会创建路由
// 其他文件（如 layout.tsx、loading.tsx）不会创建路由
```

**page.tsx 可以是 Server Component**

```typescript
// app/products/page.tsx（Server Component）
export default async function ProductsPage() {
  // 在服务端获取数据
  const products = await fetchProducts();

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}

// 优势：
// - 可以直接访问后端资源
// - 减少客户端 JavaScript
// - 更好的 SEO
```

**page.tsx 接收的 props**

```typescript
// app/blog/[slug]/page.tsx
export default function BlogPost({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // params: 动态路由参数
  // URL: /blog/hello-world
  // params.slug = "hello-world"

  // searchParams: 查询参数
  // URL: /blog/hello-world?sort=date&filter=tech
  // searchParams.sort = "date"
  // searchParams.filter = "tech"

  return (
    <article>
      <h1>Post: {params.slug}</h1>
      <p>Sort: {searchParams.sort}</p>
      <p>Filter: {searchParams.filter}</p>
    </article>
  );
}
```

---

## 问题 2：layout.tsx 的作用是什么？

**layout.tsx 定义共享布局**

`layout.tsx` 定义了多个页面共享的 UI 结构，它会包裹子页面和子布局。

```typescript
// app/layout.tsx（根布局）
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>Global Navigation</nav>
        </header>

        {/* children 是子页面或子布局 */}
        <main>{children}</main>

        <footer>Global Footer</footer>
      </body>
    </html>
  );
}

// app/page.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}

// 渲染结果：
<html>
  <body>
    <header>
      <nav>Global Navigation</nav>
    </header>
    <main>
      <h1>Home</h1> {/* children */}
    </main>
    <footer>Global Footer</footer>
  </body>
</html>;
```

**嵌套布局**

布局可以嵌套，每个层级都可以有自己的布局。

```typescript
// app/layout.tsx（根布局）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalHeader />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx（仪表板布局）
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}

// 渲染结果（嵌套）：
<html>
  <body>
    <GlobalHeader />
    <div className="dashboard">
      <Sidebar />
      <main>
        <h1>Dashboard</h1>
      </main>
    </div>
    <GlobalFooter />
  </body>
</html>;
```

**布局持久化**

布局在导航时不会重新渲染，状态会保持。

```typescript
// app/dashboard/layout.tsx
"use client";

import { useState } from "react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle Sidebar
      </button>

      {sidebarOpen && <Sidebar />}

      <main>{children}</main>
    </div>
  );
}

// 当从 /dashboard 导航到 /dashboard/settings 时：
// - DashboardLayout 不会重新渲染
// - sidebarOpen 状态会保持
// - 只有 page.tsx 会重新渲染

// 优势：
// - 更好的性能
// - 保持用户的 UI 状态
// - 避免不必要的重新渲染
```

---

## 问题 3：template.tsx 的作用是什么？

**template.tsx 类似 layout，但每次都会重新挂载**

`template.tsx` 和 `layout.tsx` 类似，但在导航时会重新创建实例。

```typescript
// app/dashboard/template.tsx
"use client";

import { useEffect } from "react";

export default function DashboardTemplate({ children }) {
  useEffect(() => {
    console.log("Template mounted");

    return () => {
      console.log("Template unmounted");
    };
  }, []);

  return <div className="template-wrapper">{children}</div>;
}

// 当从 /dashboard 导航到 /dashboard/settings 时：
// 1. 旧的 template 实例被卸载（unmounted）
// 2. 新的 template 实例被创建（mounted）
// 3. useEffect 会重新执行

// 对比 layout：
// - layout 不会重新挂载
// - template 每次导航都会重新挂载
```

**template.tsx 的使用场景**

```typescript
// 1. 页面切换动画
"use client";

import { motion } from "framer-motion";

export default function AnimatedTemplate({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// 每次导航时都会触发动画

// 2. 页面浏览统计
("use client");

import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export default function AnalyticsTemplate({ children }) {
  useEffect(() => {
    // 每次页面切换都会执行
    trackPageView(window.location.pathname);
  }, []);

  return <>{children}</>;
}

// 3. 重置滚动位置
("use client");

import { useEffect } from "react";

export default function ScrollTemplate({ children }) {
  useEffect(() => {
    // 每次导航时滚动到顶部
    window.scrollTo(0, 0);
  }, []);

  return <>{children}</>;
}
```

---

## 问题 4：layout、page 和 template 如何组合使用？

**文件组合示例**

```typescript
// 文件结构
app/
├── layout.tsx          // 根布局
├── template.tsx        // 根模板
├── page.tsx            // 首页
└── dashboard/
    ├── layout.tsx      // 仪表板布局
    ├── template.tsx    // 仪表板模板
    ├── page.tsx        // 仪表板首页
    └── settings/
        └── page.tsx    // 设置页面

// 渲染层次（访问 /dashboard/settings）：
<RootLayout>
  <RootTemplate>
    <DashboardLayout>
      <DashboardTemplate>
        <SettingsPage />
      </DashboardTemplate>
    </DashboardLayout>
  </RootTemplate>
</RootLayout>
```

**实际应用示例**

```typescript
// app/layout.tsx（根布局 - 全局共享）
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalHeader />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}

// app/template.tsx（根模板 - 页面切换动画）
("use client");

import { motion } from "framer-motion";

export default function RootTemplate({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// app/dashboard/layout.tsx（仪表板布局 - 持久化侧边栏）
("use client");

import { useState } from "react";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard">
      <Sidebar open={sidebarOpen} onToggle={setSidebarOpen} />
      <main>{children}</main>
    </div>
  );
}

// app/dashboard/template.tsx（仪表板模板 - 页面统计）
("use client");

import { useEffect } from "react";

export default function DashboardTemplate({ children }) {
  useEffect(() => {
    trackPageView();
  }, []);

  return <>{children}</>;
}

// app/dashboard/page.tsx（仪表板页面）
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <DashboardContent data={data} />;
}
```

---

## 问题 5：何时使用 layout、page 和 template？

**使用 page.tsx**

```typescript
// ✅ 总是需要：定义路由内容
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}

// 每个路由都必须有 page.tsx
// 没有 page.tsx 的文件夹不会成为路由
```

**使用 layout.tsx**

```typescript
// ✅ 使用场景：共享 UI 结构

// 1. 全局布局（必需）
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// 2. 区域布局
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />
      {children}
    </div>
  );
}

// 3. 需要保持状态的布局
// app/shop/layout.tsx
("use client");

export default function ShopLayout({ children }) {
  const [cart, setCart] = useState([]);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 何时使用：
// - 多个页面共享相同的 UI 结构
// - 需要在导航时保持状态
// - 需要共享上下文（Context）
```

**使用 template.tsx**

```typescript
// ✅ 使用场景：需要重新挂载的 UI

// 1. 页面切换动画
// app/template.tsx
"use client";

export default function Template({ children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {children}
    </motion.div>
  );
}

// 2. 页面级别的副作用
// app/blog/template.tsx
("use client");

export default function BlogTemplate({ children }) {
  useEffect(() => {
    // 每次导航都执行
    trackPageView();
    resetScrollPosition();
  }, []);

  return <>{children}</>;
}

// 何时使用：
// - 需要页面切换动画
// - 需要在每次导航时执行副作用
// - 需要重置组件状态
// - 需要重新触发 useEffect

// ❌ 不要用于：
// - 需要保持状态的场景（使用 layout）
// - 简单的共享 UI（使用 layout）
```

**选择决策树**

```typescript
// 问：需要定义路由内容吗？
// 答：是 → 使用 page.tsx

// 问：需要共享 UI 结构吗？
// 答：是 → 继续
//     否 → 只用 page.tsx

// 问：需要在导航时保持状态吗？
// 答：是 → 使用 layout.tsx
//     否 → 继续

// 问：需要在每次导航时重新挂载吗？
// 答：是 → 使用 template.tsx
//     否 → 使用 layout.tsx
```

---

## 总结

**核心区别**：

### 1. page.tsx

- **作用**：定义路由的 UI 内容
- **特点**：唯一会成为路由的文件
- **重新渲染**：每次导航到该路由时重新渲染
- **使用场景**：所有路由都需要

### 2. layout.tsx

- **作用**：定义共享的 UI 结构
- **特点**：包裹子页面和子布局
- **重新渲染**：导航时不重新渲染，状态保持
- **使用场景**：
  - 共享导航、侧边栏、页脚
  - 需要保持状态
  - 共享上下文

### 3. template.tsx

- **作用**：类似 layout，但每次都重新挂载
- **特点**：导航时重新创建实例
- **重新渲染**：每次导航都重新渲染
- **使用场景**：
  - 页面切换动画
  - 页面浏览统计
  - 重置滚动位置
  - 需要重新触发副作用

### 4. 渲染层次

```
<Layout>           ← 不重新渲染
  <Template>       ← 每次重新渲染
    <Page>         ← 每次重新渲染
  </Template>
</Layout>
```

### 5. 选择建议

- 默认使用 `layout.tsx`（性能更好）
- 只在需要重新挂载时使用 `template.tsx`
- 每个路由必须有 `page.tsx`

## 延伸阅读

- [Next.js 官方文档 - Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Next.js 官方文档 - Templates](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates)
- [Next.js 官方文档 - Defining Routes](https://nextjs.org/docs/app/building-your-application/routing/defining-routes)
