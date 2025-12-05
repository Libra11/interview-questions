---
title: useSearchParams 与 SSR 的关系？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  深入理解 Next.js 中 useSearchParams Hook 与服务端渲染（SSR）的关系，学习如何正确使用 useSearchParams 避免水合错误，以及在 Server Components 中处理查询参数的最佳实践。
tags:
  - Next.js
  - useSearchParams
  - SSR
  - Client Component
estimatedTime: 20 分钟
keywords:
  - useSearchParams
  - SSR
  - 查询参数
  - 水合错误
highlight: 掌握 useSearchParams 在 SSR 中的使用方法和注意事项
order: 307
---

## 问题 1：useSearchParams 是什么，它在 SSR 中有什么特殊性？

`useSearchParams` 是 Next.js 提供的 Client Hook，用于在客户端组件中读取 URL 查询参数。

### 基本使用

```typescript
// app/search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  const searchParams = useSearchParams();

  // 读取查询参数
  const query = searchParams.get("q"); // ?q=hello
  const page = searchParams.get("page"); // ?page=1
  const sort = searchParams.get("sort"); // ?sort=date

  return (
    <div>
      <p>Search query: {query}</p>
      <p>Page: {page}</p>
      <p>Sort: {sort}</p>
    </div>
  );
}
```

### SSR 中的特殊性

**useSearchParams 只在客户端可用**：

- 在服务端渲染时，查询参数可能还不可用
- 可能导致服务端和客户端渲染不一致
- 需要特殊处理避免水合错误

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  // ⚠️ 问题：服务端渲染时 query 可能是 null
  // 客户端渲染时 query 可能有值
  // 导致水合不匹配

  return <div>Query: {query}</div>;
}
```

---

## 问题 2：useSearchParams 会导致什么问题，如何解决？

使用 useSearchParams 不当可能导致水合错误和动态渲染问题。

### 问题 1：水合不匹配

**问题描述**：

- 服务端渲染时没有查询参数
- 客户端渲染时有查询参数
- 导致内容不一致

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  // ❌ 问题：可能导致水合错误
  // 服务端：<div>Query: </div>
  // 客户端：<div>Query: hello</div>
  return <div>Query: {query}</div>;
}
```

**解决方案 1：使用 Suspense 边界**

```typescript
// app/search/page.tsx
import { Suspense } from "react";
import SearchResults from "./SearchResults";

export default function SearchPage() {
  return (
    <div>
      <h1>Search</h1>
      {/* 使用 Suspense 包裹使用 useSearchParams 的组件 */}
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

// SearchResults.tsx
("use client");

import { useSearchParams } from "next/navigation";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  // ✅ 在 Suspense 边界内，不会导致水合错误
  return <div>Query: {query}</div>;
}
```

**解决方案 2：使用 useEffect**

```typescript
"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);

  // 只在客户端更新
  useEffect(() => {
    setQuery(searchParams.get("q"));
  }, [searchParams]);

  // ✅ 服务端和客户端初始渲染都是 null，不会水合错误
  return <div>Query: {query || "No query"}</div>;
}
```

### 问题 2：导致整个路由动态渲染

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function Page() {
  // ⚠️ 使用 useSearchParams 会让整个路由变成动态渲染
  const searchParams = useSearchParams();

  return <div>...</div>;
}

// 解决方案：将使用 useSearchParams 的部分提取到单独的组件
// 并用 Suspense 包裹
```

---

## 问题 3：在 Server Components 中如何处理查询参数？

Server Components 不能使用 useSearchParams，需要使用不同的方式获取查询参数。

### 使用 searchParams prop

```typescript
// app/search/page.tsx
// Server Component 自动接收 searchParams prop

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // 在 Server Component 中直接使用 searchParams
  const params = await searchParams;
  const query = params.q as string;
  const page = params.page as string;

  // 可以直接在服务端获取数据
  const results = await searchData(query, page);

  return (
    <div>
      <h1>Search Results for: {query}</h1>
      <p>Page: {page}</p>
      <ResultsList results={results} />
    </div>
  );
}
```

### Server Component vs Client Component

```typescript
// ✅ Server Component - 推荐用于初始数据获取
type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ServerSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";

  // 服务端获取数据
  const results = await fetch(`/api/search?q=${query}`);

  return (
    <div>
      <h1>Results for: {query}</h1>
      <ResultsList results={results} />
    </div>
  );
}

// ✅ Client Component - 用于交互式搜索
("use client");

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <input name="q" defaultValue={query} />
      <button type="submit">Search</button>
    </form>
  );
}

export default function ClientSearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchForm />
    </Suspense>
  );
}
```

---

## 问题 4：useSearchParams 的最佳实践有哪些？

遵循最佳实践可以避免常见问题，提升应用性能。

### 最佳实践 1：始终使用 Suspense 包裹

```typescript
// app/products/page.tsx
import { Suspense } from "react";
import ProductFilters from "./ProductFilters";
import ProductList from "./ProductList";

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      {/* ✅ 使用 Suspense 包裹使用 useSearchParams 的组件 */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <ProductFilters />
      </Suspense>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}
```

### 最佳实践 2：提取查询参数逻辑到自定义 Hook

```typescript
// hooks/useQueryParams.ts
"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useQueryParams() {
  const searchParams = useSearchParams();

  return useMemo(
    () => ({
      query: searchParams.get("q") || "",
      page: parseInt(searchParams.get("page") || "1"),
      sort: searchParams.get("sort") || "date",
      category: searchParams.get("category") || "all",
    }),
    [searchParams]
  );
}

// 使用
("use client");

import { useQueryParams } from "@/hooks/useQueryParams";

export default function ProductList() {
  const { query, page, sort, category } = useQueryParams();

  return (
    <div>
      <p>Query: {query}</p>
      <p>Page: {page}</p>
      <p>Sort: {sort}</p>
      <p>Category: {category}</p>
    </div>
  );
}
```

### 最佳实践 3：结合 useRouter 更新查询参数

```typescript
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 创建更新查询参数的函数
  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div>
      <select
        value={searchParams.get("sort") || "date"}
        onChange={(e) => updateSearchParams("sort", e.target.value)}
      >
        <option value="date">Date</option>
        <option value="price">Price</option>
        <option value="name">Name</option>
      </select>

      <select
        value={searchParams.get("category") || "all"}
        onChange={(e) => updateSearchParams("category", e.target.value)}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>
    </div>
  );
}
```

### 最佳实践 4：优先使用 Server Component

```typescript
// ✅ 推荐：在 Server Component 中处理查询参数
type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const page = parseInt(params.page || "1");
  const sort = params.sort || "date";

  // 服务端获取数据
  const products = await getProducts({ query, page, sort });

  return (
    <div>
      <h1>Products</h1>
      {/* 只在需要交互的部分使用 Client Component */}
      <Suspense fallback={<div>Loading...</div>}>
        <ClientFilters />
      </Suspense>
      <ProductGrid products={products} />
    </div>
  );
}
```

### 最佳实践 5：处理数组参数

```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function MultiSelectFilter() {
  const searchParams = useSearchParams();

  // 处理多个相同名称的参数：?tags=react&tags=nextjs&tags=typescript
  const tags = searchParams.getAll("tags");

  // 或者使用逗号分隔：?tags=react,nextjs,typescript
  const tagsString = searchParams.get("tags");
  const tagsList = tagsString ? tagsString.split(",") : [];

  return (
    <div>
      <h3>Selected Tags:</h3>
      <ul>
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 总结

**核心概念总结**：

### 1. useSearchParams 的特点

- 只能在 Client Components 中使用
- 需要用 Suspense 包裹避免水合错误
- 会导致路由动态渲染

### 2. Server Components 的替代方案

- 使用 `searchParams` prop 直接获取查询参数
- 适合初始数据获取和 SEO
- 避免客户端 JavaScript 开销

### 3. 最佳实践

- 始终使用 Suspense 包裹
- 提取查询参数逻辑到自定义 Hook
- 优先使用 Server Component
- 只在需要交互的部分使用 Client Component

## 延伸阅读

- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional)
- [React Suspense](https://react.dev/reference/react/Suspense)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
