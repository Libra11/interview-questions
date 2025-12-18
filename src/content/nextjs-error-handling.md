---
title: error.tsx 与 global-error.tsx 的区别？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入理解 Next.js App Router 中错误处理机制，掌握 error.tsx 和 global-error.tsx 的使用场景和区别。
tags:
  - Next.js
  - 错误处理
  - Error Boundary
  - 异常处理
estimatedTime: 20 分钟
keywords:
  - error.tsx
  - global-error.tsx
  - Error Boundary
  - 错误处理
highlight: 理解 Next.js 错误边界的工作原理，掌握如何优雅地处理应用错误
order: 719
---

## 问题 1：error.tsx 是什么？

**错误边界（Error Boundary）**

`error.tsx` 是 Next.js App Router 提供的特殊文件，用于捕获和处理路由段中的错误。

```typescript
// app/dashboard/error.tsx
"use client"; // Error 组件必须是 Client Component

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/dashboard/page.tsx
export default async function DashboardPage() {
  // 如果这里抛出错误
  const data = await fetchData(); // 假设失败

  // error.tsx 会捕获并显示错误
  return <div>{data.content}</div>;
}
```

**基于 React Error Boundary**

`error.tsx` 实际上是 React Error Boundary 的语法糖。

```typescript
// error.tsx 等价于：
import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorUI error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Next.js 自动为你创建这个 Error Boundary
```

---

## 问题 2：error.tsx 的作用范围是什么？

**作用于同级和子级路由**

`error.tsx` 会捕获同级 `page.tsx` 和所有子路由中的错误。

```typescript
// 文件结构
app/
├── dashboard/
│   ├── error.tsx         // 错误处理
│   ├── page.tsx          // /dashboard
│   ├── analytics/
│   │   └── page.tsx      // /dashboard/analytics
│   └── settings/
│       └── page.tsx      // /dashboard/settings

// app/dashboard/error.tsx
'use client';

export default function DashboardError({ error, reset }) {
  return (
    <div>
      <h2>Dashboard Error</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// 这个 error.tsx 会捕获：
// 1. /dashboard 页面的错误
// 2. /dashboard/analytics 页面的错误
// 3. /dashboard/settings 页面的错误

// 如果子路由有自己的 error.tsx，会优先使用子路由的
```

**嵌套错误处理**

```typescript
// 文件结构
app/
├── dashboard/
│   ├── error.tsx             // 仪表板错误处理
│   ├── page.tsx
│   └── analytics/
│       ├── error.tsx         // 分析页错误处理
│       └── page.tsx

// app/dashboard/error.tsx
'use client';

export default function DashboardError({ error }) {
  return <div>Dashboard Error: {error.message}</div>;
}

// app/dashboard/analytics/error.tsx
'use client';

export default function AnalyticsError({ error }) {
  return <div>Analytics Error: {error.message}</div>;
}

// /dashboard 的错误 → 显示 DashboardError
// /dashboard/analytics 的错误 → 显示 AnalyticsError
```

**不会捕获 layout.tsx 的错误**

```typescript
// app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  // ❌ 这里的错误不会被同级的 error.tsx 捕获
  const data = await fetchLayoutData(); // 如果失败

  return (
    <div>
      <Sidebar />
      {children}
    </div>
  );
}

// app/dashboard/error.tsx
// ❌ 不会捕获 layout.tsx 的错误

// 原因：error.tsx 被包裹在 layout.tsx 内部
// 需要在父级路由设置 error.tsx 来捕获 layout 的错误
```

---

## 问题 3：global-error.tsx 是什么？

**全局错误处理**

`global-error.tsx` 是根级别的错误处理器，用于捕获根 `layout.tsx` 的错误。

```typescript
// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="global-error">
          <h2>Something went wrong!</h2>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}

// 注意：
// 1. 必须定义 <html> 和 <body> 标签
// 2. 因为它替代了根 layout.tsx
```

**捕获根 layout 的错误**

```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  // ✅ 这里的错误会被 global-error.tsx 捕获
  const config = await fetchGlobalConfig(); // 如果失败

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// app/global-error.tsx
("use client");

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <h1>Application Error</h1>
        <p>{error.message}</p>
        <button onClick={reset}>Reload</button>
      </body>
    </html>
  );
}
```

---

## 问题 4：error.tsx 和 global-error.tsx 有什么区别？

**作用范围不同**

```typescript
// error.tsx - 捕获路由段的错误
app/
├── dashboard/
│   ├── error.tsx         // 捕获 dashboard 路由的错误
│   ├── layout.tsx        // ❌ 不捕获这个 layout 的错误
│   └── page.tsx          // ✅ 捕获这个 page 的错误

// global-error.tsx - 捕获根 layout 的错误
app/
├── global-error.tsx      // 捕获根 layout 的错误
├── layout.tsx            // ✅ 捕获这个 layout 的错误
└── page.tsx              // ✅ 也捕获这个 page 的错误（如果没有其他 error.tsx）
```

**HTML 结构不同**

```typescript
// error.tsx - 不需要 html 和 body 标签
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Error</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// global-error.tsx - 必须包含 html 和 body 标签
("use client");

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div>
          <h2>Global Error</h2>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}

// 原因：global-error.tsx 替代了整个根 layout
```

**使用频率不同**

```typescript
// error.tsx - 经常使用
// 每个需要错误处理的路由段都可以有 error.tsx
app/
├── blog/
│   └── error.tsx
├── dashboard/
│   └── error.tsx
└── products/
    └── error.tsx

// global-error.tsx - 很少使用
// 通常只在根目录有一个
app/
└── global-error.tsx

// 大多数情况下，error.tsx 就足够了
// global-error.tsx 主要用于捕获根 layout 的错误
```

---

## 问题 5：如何设计好的错误处理？

**提供有用的错误信息**

```typescript
// ✅ 好：提供详细的错误信息和操作
"use client";

export default function Error({ error, reset }) {
  return (
    <div className="error-page">
      <div className="error-icon">⚠️</div>

      <h1>Oops! Something went wrong</h1>

      <div className="error-details">
        <p className="error-message">{error.message}</p>

        {error.digest && <p className="error-id">Error ID: {error.digest}</p>}
      </div>

      <div className="error-actions">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>

        <a href="/" className="btn-secondary">
          Go to homepage
        </a>

        <a href="/support" className="btn-link">
          Contact support
        </a>
      </div>
    </div>
  );
}

// ❌ 不好：没有任何有用信息
("use client");

export default function Error() {
  return <div>Error</div>;
}
```

**记录错误日志**

```typescript
// app/dashboard/error.tsx
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error, reset }) {
  useEffect(() => {
    // 发送错误到监控服务
    Sentry.captureException(error);

    // 或使用自定义日志服务
    fetch("/api/log-error", {
      method: "POST",
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong</h2>
      <p>We've been notified and are working on a fix.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**区分不同类型的错误**

```typescript
// app/products/error.tsx
"use client";

export default function ProductsError({ error, reset }) {
  // 根据错误类型显示不同的 UI
  if (error.message.includes("not found")) {
    return (
      <div className="error-404">
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <a href="/products">Browse all products</a>
      </div>
    );
  }

  if (error.message.includes("unauthorized")) {
    return (
      <div className="error-401">
        <h2>Access denied</h2>
        <p>You don't have permission to view this product.</p>
        <a href="/login">Sign in</a>
      </div>
    );
  }

  if (error.message.includes("network")) {
    return (
      <div className="error-network">
        <h2>Connection error</h2>
        <p>Please check your internet connection.</p>
        <button onClick={reset}>Retry</button>
      </div>
    );
  }

  // 默认错误
  return (
    <div className="error-default">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**优雅降级**

```typescript
// app/dashboard/error.tsx
"use client";

import { useState, useEffect } from "react";

export default function DashboardError({ error, reset }) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // 等待一段时间后重试
    await new Promise((resolve) => setTimeout(resolve, 1000));

    reset();
    setIsRetrying(false);
  };

  // 如果重试次数过多，显示不同的 UI
  if (retryCount >= 3) {
    return (
      <div className="error-persistent">
        <h2>We're having trouble loading your dashboard</h2>
        <p>This issue persists. Please try again later or contact support.</p>

        <div className="error-actions">
          <a href="/">Go to homepage</a>
          <a href="/support">Contact support</a>
        </div>
      </div>
    );
  }

  return (
    <div className="error-retry">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>

      <button onClick={handleRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying..." : "Try again"}
      </button>

      {retryCount > 0 && (
        <p className="text-sm text-gray-500">Retry attempt: {retryCount}/3</p>
      )}
    </div>
  );
}
```

---

## 总结

**核心概念**：

### 1. error.tsx

- **作用**：捕获路由段的错误
- **范围**：同级 page.tsx 和子路由
- **限制**：不捕获同级 layout.tsx 的错误
- **必需**：必须是 Client Component

### 2. global-error.tsx

- **作用**：捕获根 layout.tsx 的错误
- **范围**：整个应用
- **特殊**：必须包含 `<html>` 和 `<body>` 标签
- **使用**：很少使用，主要用于根 layout 错误

### 3. 主要区别

| 特性        | error.tsx | global-error.tsx |
| ----------- | --------- | ---------------- |
| 作用范围    | 路由段    | 根 layout        |
| HTML 标签   | 不需要    | 必需             |
| 使用频率    | 常用      | 少用             |
| 捕获 layout | ❌        | ✅               |

### 4. 错误处理层次

```
<GlobalError>              ← global-error.tsx
  <RootLayout>             ← 被 global-error.tsx 保护
    <Error>                ← error.tsx
      <Layout>             ← 不被同级 error.tsx 保护
        <Page>             ← 被 error.tsx 保护
      </Layout>
    </Error>
  </RootLayout>
</GlobalError>
```

### 5. 最佳实践

- 提供清晰的错误信息
- 记录错误日志
- 提供重试选项
- 区分不同错误类型
- 优雅降级
- 考虑用户体验

## 延伸阅读

- [Next.js 官方文档 - Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React 官方文档 - Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Next.js 官方文档 - global-error](https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs)
