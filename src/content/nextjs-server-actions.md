---
title: Next.js Server Actions 与 API Routes 的区别
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  深入对比 Next.js Server Actions 和传统 API Routes 的差异，理解 Server Actions 在表单提交和渐进增强方面的本质优势。
tags:
  - Next.js
  - Server Actions
  - API Routes
  - 表单处理
estimatedTime: 25 分钟
keywords:
  - Server Actions
  - API Routes
  - 表单提交
  - 渐进增强
highlight: 掌握 Server Actions 的核心优势，理解其在表单处理和渐进增强方面的创新
order: 316
---

## 问题 1：什么是 Server Actions？

**Server Actions 的定义**

Server Actions 是 Next.js 13.4+ 引入的新特性，允许在服务器端直接定义和执行函数，无需创建 API 路由。使用 `"use server"` 指令标记。

```typescript
// app/actions.ts
"use server";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // 直接在服务器端执行数据库操作
  await db.user.create({
    data: { name, email },
  });

  return { success: true };
}
```

**传统 API Routes**

```typescript
// pages/api/users.ts（Pages Router）
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { name, email } = req.body;

    await db.user.create({
      data: { name, email },
    });

    res.status(200).json({ success: true });
  }
}

// app/api/users/route.ts（App Router）
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, email } = await request.json();

  await db.user.create({
    data: { name, email },
  });

  return NextResponse.json({ success: true });
}
```

---

## 问题 2：Server Actions 在表单提交方面有什么优势？

**优势 1：原生表单集成**

Server Actions 可以直接绑定到 HTML 表单的 `action` 属性，无需手动处理表单提交：

```typescript
// app/actions.ts
"use server";

export async function submitForm(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await db.user.create({ data: { name, email } });
  revalidatePath("/users");
}

// app/page.tsx
import { submitForm } from "./actions";

export default function Page() {
  return (
    <form action={submitForm}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**传统 API Routes 需要手动处理**

```typescript
// app/page.tsx（使用 API Routes）
"use client";

import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // 阻止默认提交
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

**优势 2：自动处理 FormData**

```typescript
// Server Actions 自动接收 FormData
"use server";

export async function createPost(formData: FormData) {
  // 直接从 FormData 获取数据
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const image = formData.get("image") as File;

  // 处理文件上传
  if (image) {
    const buffer = Buffer.from(await image.arrayBuffer());
    await uploadToS3(buffer, image.name);
  }

  await db.post.create({
    data: { title, content },
  });
}
```

**优势 3：内置加载状态**

```typescript
// app/page.tsx
import { useFormStatus } from "react-dom";
import { submitForm } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus(); // 自动获取表单状态

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

export default function Page() {
  return (
    <form action={submitForm}>
      <input name="name" />
      <SubmitButton />
    </form>
  );
}
```

---

## 问题 3：Server Actions 在渐进增强方面有什么优势？

**什么是渐进增强？**

渐进增强（Progressive Enhancement）是一种 Web 设计策略：即使在 JavaScript 未加载或失败的情况下，基本功能仍然可用。

**Server Actions 的渐进增强特性**

```typescript
// app/actions.ts
"use server";

export async function submitForm(formData: FormData) {
  const name = formData.get("name") as string;

  await db.user.create({ data: { name } });

  // 重定向到成功页面
  redirect("/success");
}

// app/page.tsx
import { submitForm } from "./actions";

export default function Page() {
  return (
    <form action={submitForm}>
      {/* 即使 JavaScript 未加载，表单仍然可以提交 */}
      <input name="name" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**工作原理**

1. **JavaScript 加载前**：表单使用原生 HTML 提交
2. **JavaScript 加载后**：自动升级为 AJAX 提交，无需刷新页面

```typescript
// 渐进增强的完整示例
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTodo(formData: FormData) {
  const title = formData.get("title") as string;

  await db.todo.create({ data: { title } });

  // 重新验证缓存
  revalidatePath("/todos");

  // 如果是原生表单提交，会执行重定向
  // 如果是 JavaScript 增强，会在客户端处理
  redirect("/todos");
}
```

**API Routes 无法实现渐进增强**

```typescript
// API Routes 必须依赖 JavaScript
"use client";

export default function Page() {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // 必须阻止默认行为

    // 必须使用 fetch（需要 JavaScript）
    await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}

// ❌ 如果 JavaScript 未加载，表单无法工作
```

---

## 问题 4：Server Actions 与 API Routes 的其他区别是什么？

**代码组织**

```typescript
// Server Actions：与组件代码在一起
// app/users/actions.ts
"use server";

export async function createUser(formData: FormData) {
  // ...
}

export async function updateUser(id: string, formData: FormData) {
  // ...
}

// app/users/page.tsx
import { createUser } from "./actions";

// 直接使用，无需 API 路由

// API Routes：需要单独的文件
// app/api/users/route.ts
export async function POST(request: Request) {
  // ...
}

// app/api/users/[id]/route.ts
export async function PUT(request: Request) {
  // ...
}
```

**类型安全**

```typescript
// Server Actions：端到端类型安全
"use server";

interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function createUser(
  formData: FormData
): Promise<CreateUserResult> {
  // 实现
  return { success: true, userId: "123" };
}

// 客户端使用
("use client");

import { createUser } from "./actions";

export default function Page() {
  async function handleSubmit(formData: FormData) {
    const result = await createUser(formData);
    // result 的类型是 CreateUserResult，完全类型安全
    if (result.success) {
      console.log(result.userId);
    }
  }

  return <form action={handleSubmit}>{/* ... */}</form>;
}
```

**错误处理**

```typescript
// Server Actions：可以直接抛出错误
"use server";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;

  // 验证
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }

  // 数据库错误会自动传递到客户端
  await db.user.create({ data: { email } });
}

// 客户端处理
("use client");

import { useFormState } from "react-dom";
import { createUser } from "./actions";

export default function Page() {
  const [state, formAction] = useFormState(createUser, null);

  return (
    <form action={formAction}>
      <input name="email" />
      {state?.error && <p>{state.error}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

**缓存和重新验证**

```typescript
// Server Actions：内置缓存控制
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get("title") } });

  // 重新验证特定路径
  revalidatePath("/posts");

  // 或重新验证特定标签
  revalidateTag("posts");
}

// API Routes：需要手动处理
export async function POST(request: Request) {
  await db.post.create({ data });

  // 需要手动触发重新验证
  // 或返回响应让客户端处理
  return NextResponse.json({ success: true });
}
```

---

## 问题 5：Server Actions 的限制和注意事项是什么？

**限制 1：只能在 Server Components 中直接使用**

```typescript
// ✅ Server Component 中直接使用
// app/page.tsx（默认是 Server Component）
import { createUser } from "./actions";

export default function Page() {
  return <form action={createUser}>{/* ... */}</form>;
}

// ❌ Client Component 中需要特殊处理
("use client");

import { createUser } from "./actions";

export default function Page() {
  // 需要包装在事件处理器中
  async function handleSubmit(formData: FormData) {
    await createUser(formData);
  }

  return <form action={handleSubmit}>{/* ... */}</form>;
}
```

**限制 2：参数序列化**

```typescript
// ✅ 可以传递可序列化的数据
"use server";

export async function updateUser(userId: string, data: { name: string }) {
  // ...
}

// ❌ 不能传递函数、类实例等不可序列化的数据
export async function processData(callback: () => void) {
  // 错误：函数不能序列化
}
```

**限制 3：文件大小限制**

```typescript
// Server Actions 有请求体大小限制（默认 1MB）
"use server";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;

  // 大文件上传可能需要使用 API Routes
  if (file.size > 1024 * 1024) {
    throw new Error("File too large");
  }
}
```

**最佳实践**

```typescript
// 1. 使用 Server Actions 处理表单和数据变更
"use server";

export async function createPost(formData: FormData) {
  // 表单提交
}

// 2. 使用 API Routes 处理复杂的 API 逻辑
// app/api/webhook/route.ts
export async function POST(request: Request) {
  // Webhook 处理
  // 第三方集成
  // 复杂的业务逻辑
}

// 3. 结合使用
("use server");

export async function processPayment(formData: FormData) {
  // 调用内部 API
  const response = await fetch("http://localhost:3000/api/payment", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response.json();
}
```

---

## 总结

**Server Actions 的核心优势**：

### 1. 表单提交优势

- 原生表单集成，无需手动处理
- 自动处理 FormData
- 内置加载状态（useFormStatus）
- 简化的错误处理

### 2. 渐进增强优势

- JavaScript 未加载时仍可工作
- 自动升级为 AJAX 提交
- 更好的用户体验
- 更强的可访问性

### 3. 开发体验优势

- 代码组织更清晰
- 端到端类型安全
- 内置缓存控制
- 减少样板代码

### 4. 与 API Routes 的对比

**使用 Server Actions**：

- 表单提交和数据变更
- 需要渐进增强的场景
- 简单的服务器端逻辑

**使用 API Routes**：

- Webhook 处理
- 第三方 API 集成
- 需要自定义响应头
- 复杂的 REST API

### 5. 注意事项

- 只能在 Server Components 中直接使用
- 参数必须可序列化
- 有请求体大小限制
- 需要 Next.js 13.4+

## 延伸阅读

- [Next.js 官方文档 - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React 官方文档 - Server Actions](https://react.dev/reference/react/use-server)
- [Next.js 官方文档 - API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
