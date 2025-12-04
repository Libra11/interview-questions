---
title: Client Component 如何声明？
category: React
difficulty: 入门
updatedAt: 2025-12-04
summary: >-
  详细讲解如何在 Next.js App Router 中声明和使用 Client Component，理解 'use client' 指令的作用和使用规范。
tags:
  - React
  - Next.js
  - Client Component
  - use client
estimatedTime: 15 分钟
keywords:
  - Client Component
  - use client
  - React 客户端组件
highlight: 正确声明 Client Component 是使用 Next.js App Router 的基础
order: 27
---

## 问题 1：如何声明一个 Client Component？

在 Next.js App Router 中，使用 `'use client'` 指令来声明 Client Component。

### 基本语法

```tsx
// app/components/Counter.tsx
"use client"; // 必须在文件最顶部

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### 关键规则

**1. 必须在文件最顶部**

```tsx
// ✅ 正确
"use client";

import { useState } from "react";

function Component() {
  return <div>Client Component</div>;
}

// ❌ 错误：不在最顶部
import { useState } from "react";

("use client"); // 太晚了

function Component() {
  return <div>Client Component</div>;
}

// ❌ 错误：有其他代码在前面
const API_URL = "https://api.example.com";

("use client"); // 太晚了

function Component() {
  return <div>Client Component</div>;
}
```

**2. 只需要在入口文件声明**

```tsx
// components/Button.tsx
"use client"; // 声明为 Client Component

export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}

// components/Form.tsx
// 不需要 'use client'，因为它被 Button 导入
import { Button } from "./Button";

export function Form() {
  return (
    <form>
      <input type="text" />
      <Button onClick={() => console.log("submit")}>Submit</Button>
    </form>
  );
}

// app/page.tsx (Server Component)
import { Form } from "./components/Form";

export default function Page() {
  // Form 和 Button 都会在客户端运行
  return <Form />;
}
```

**3. 影响整个模块**

```tsx
// utils/client-utils.ts
"use client";

// 这个文件中的所有导出都是客户端代码
export function useLocalStorage(key: string) {
  // 使用浏览器 API
  return localStorage.getItem(key);
}

export function useWindowSize() {
  // 使用浏览器 API
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// 这些函数只能在客户端使用
```

---

## 问题 2：什么时候需要声明 Client Component？

当组件需要使用客户端特性时，必须声明为 Client Component。

### 1. 使用 React Hooks

```tsx
// ✅ 需要 'use client'
"use client";

import { useState, useEffect, useContext } from "react";

function InteractiveComponent() {
  // 使用 state
  const [value, setValue] = useState("");

  // 使用 effect
  useEffect(() => {
    console.log("Component mounted");
  }, []);

  // 使用 context
  const theme = useContext(ThemeContext);

  return <div>{value}</div>;
}
```

### 2. 使用事件处理器

```tsx
// ✅ 需要 'use client'
"use client";

function ClickableButton() {
  const handleClick = () => {
    alert("Clicked!");
  };

  return <button onClick={handleClick}>Click Me</button>;
}

// ✅ 任何事件处理器都需要 Client Component
function Form() {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <input onChange={(e) => console.log(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 3. 使用浏览器 API

```tsx
// ✅ 需要 'use client'
"use client";

import { useEffect, useState } from "react";

function WindowSize() {
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // 使用 window 对象
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {size.width} x {size.height}
    </div>
  );
}
```

### 4. 使用第三方客户端库

```tsx
// ✅ 需要 'use client'
"use client";

import { useForm } from "react-hook-form";
import { motion } from "framer-motion";

function AnimatedForm() {
  const { register, handleSubmit } = useForm();

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit((data) => console.log(data))}
    >
      <input {...register("name")} />
      <button type="submit">Submit</button>
    </motion.form>
  );
}
```

### 不需要 Client Component 的情况

```tsx
// ❌ 不需要 'use client'（Server Component）
async function StaticContent() {
  // 只是展示数据，没有交互
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
}

// ❌ 不需要 'use client'
function PureComponent({ title, children }) {
  // 纯展示组件，没有状态和事件
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

---

## 问题 3：'use client' 的作用范围是什么？

`'use client'` 定义了客户端和服务器代码的边界。

### 1. 模块边界

```tsx
// components/ClientButton.tsx
"use client"; // 这个文件是客户端边界

import { useState } from "react";

// 这个组件在客户端运行
export function ClientButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// 这个组件也在客户端运行（同一个文件）
export function AnotherClientComponent() {
  return <div>Also client</div>;
}
```

### 2. 导入链

```tsx
// components/Button.tsx
"use client"; // 客户端边界

export function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// components/Form.tsx
// 没有 'use client'，但导入了 Client Component
import { Button } from "./Button";

// 这个组件也会在客户端运行
export function Form() {
  return (
    <form>
      <input type="text" />
      <Button onClick={() => {}}>Submit</Button>
    </form>
  );
}

// app/page.tsx (Server Component)
import { Form } from "@/components/Form";

export default async function Page() {
  const data = await fetchData();

  return (
    <div>
      {/* Server Component 渲染 */}
      <h1>{data.title}</h1>

      {/* 从这里开始是 Client Component */}
      <Form />
    </div>
  );
}
```

### 3. 边界可视化

```tsx
/**
 * 组件树结构：
 *
 * ServerPage (Server)
 * ├── ServerHeader (Server)
 * ├── ClientForm (Client) ← 'use client' 边界
 * │   ├── ClientInput (Client)
 * │   └── ClientButton (Client)
 * └── ServerFooter (Server)
 *
 * 说明：
 * - ServerPage 可以包含 ClientForm
 * - ClientForm 下的所有组件都在客户端运行
 * - ServerFooter 仍然是 Server Component
 */

// app/page.tsx
async function ServerPage() {
  return (
    <div>
      <ServerHeader />
      <ClientForm /> {/* 客户端边界 */}
      <ServerFooter />
    </div>
  );
}
```

### 4. 数据序列化边界

```tsx
// app/page.tsx (Server Component)
async function Page() {
  const data = await fetchComplexData();

  return (
    <ClientComponent
      // ✅ 可以传递可序列化的数据
      data={{
        id: data.id,
        name: data.name,
        items: data.items,
      }}

      // ❌ 不能传递函数
      // onUpdate={async () => await updateData()}

      // ❌ 不能传递类实例
      // instance={new MyClass()}

      // ❌ 不能传递 Symbol
      // symbol={Symbol('key')}
    />
  );
}

/**
 * 跨越边界的数据必须是可序列化的：
 * ✅ 字符串、数字、布尔值
 * ✅ 数组、对象（普通对象）
 * ✅ Date（会被序列化为字符串）
 * ❌ 函数
 * ❌ 类实例
 * ❌ Symbol
 * ❌ undefined（会被忽略）
 */
```

---

## 问题 4：Client Component 的常见错误和最佳实践

### 常见错误

**1. 忘记添加 'use client'**

```tsx
// ❌ 错误：使用了 Hook 但没有 'use client'
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // 报错！
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ✅ 正确
("use client");

import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**2. 过度使用 Client Component**

```tsx
// ❌ 不好：整个页面都是 Client Component
"use client";

export default function Page() {
  const [filter, setFilter] = useState("");

  return (
    <div>
      <h1>Products</h1>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <ProductList filter={filter} />
    </div>
  );
}

// ✅ 更好：只把需要交互的部分声明为 Client Component
// app/page.tsx (Server Component)
import { FilterInput } from "./FilterInput";
import { ProductList } from "./ProductList";

export default async function Page() {
  const products = await fetchProducts();

  return (
    <div>
      <h1>Products</h1>
      <FilterInput />
      <ProductList products={products} />
    </div>
  );
}

// app/FilterInput.tsx
("use client");

export function FilterInput() {
  const [filter, setFilter] = useState("");
  return <input value={filter} onChange={(e) => setFilter(e.target.value)} />;
}
```

### 最佳实践

**1. 尽可能使用 Server Component**

```tsx
// ✅ 推荐的组件结构
// app/products/page.tsx (Server Component)
async function ProductsPage() {
  // 在服务器端获取数据
  const products = await db.products.findMany();

  return (
    <div>
      {/* Server Component 渲染静态内容 */}
      <h1>Products</h1>
      <ProductGrid products={products} />

      {/* 只在需要交互时使用 Client Component */}
      <AddToCartButton />
    </div>
  );
}
```

**2. 将 Client Component 推到树的叶子节点**

```tsx
// ❌ 不好：在根部使用 Client Component
"use client";

function Page() {
  return (
    <div>
      <Header />
      <Content />
      <Footer />
    </div>
  );
}

// ✅ 更好：只在需要的地方使用 Client Component
// app/page.tsx (Server Component)
function Page() {
  return (
    <div>
      <Header /> {/* Server Component */}
      <Content>
        {" "}
        {/* Server Component */}
        <InteractiveWidget /> {/* Client Component */}
      </Content>
      <Footer /> {/* Server Component */}
    </div>
  );
}
```

**3. 通过 props 传递 Server Component**

```tsx
// ✅ 使用 children 模式
// components/ClientWrapper.tsx
"use client";

export function ClientWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}

// app/page.tsx (Server Component)
import { ClientWrapper } from "./ClientWrapper";
import { ServerContent } from "./ServerContent";

export default function Page() {
  return (
    <ClientWrapper>
      {/* ServerContent 仍然是 Server Component */}
      <ServerContent />
    </ClientWrapper>
  );
}
```

## 延伸阅读

- [Next.js 官方文档 - Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React 官方文档 - 'use client' directive](https://react.dev/reference/react/use-client)
- [Next.js 官方文档 - Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [When to use Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#when-to-use-server-and-client-components)
