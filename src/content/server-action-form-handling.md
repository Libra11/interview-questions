---
title: Server Action 如何处理表单？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解如何使用 Server Action 处理表单提交，包括数据验证、错误处理和用户反馈等完整流程。
tags:
  - Next.js
  - Server Action
  - 表单处理
  - 数据验证
estimatedTime: 25 分钟
keywords:
  - Server Action
  - 表单处理
  - FormData
  - 数据验证
highlight: Server Action 提供了最简洁的表单处理方式，无需 API 路由和复杂的客户端代码
order: 34
---

## 问题 1：Server Action 如何接收表单数据？

Server Action 通过 FormData 对象接收表单数据，这是浏览器原生的表单数据格式。

### 基本用法

```tsx
// app/actions.ts
"use server";

export async function submitForm(formData: FormData) {
  // 获取表单字段
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  console.log({ name, email, message });

  return { success: true };
}

// app/contact/page.tsx
import { submitForm } from "@/app/actions";

export default function ContactPage() {
  return (
    <form action={submitForm}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### FormData 的常用方法

```tsx
"use server";

export async function handleForm(formData: FormData) {
  // 1. get() - 获取单个值
  const name = formData.get("name"); // string | File | null

  // 2. getAll() - 获取多个值（如复选框）
  const hobbies = formData.getAll("hobby"); // (string | File)[]

  // 3. has() - 检查字段是否存在
  const hasEmail = formData.has("email"); // boolean

  // 4. entries() - 遍历所有字段
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  // 5. 转换为普通对象
  const data = Object.fromEntries(formData);
  console.log(data); // { name: '...', email: '...', ... }

  return { success: true };
}
```

---

## 问题 2：如何进行数据验证？

Server Action 中可以使用各种验证库进行数据验证。

### 使用 Zod 进行验证

```tsx
// app/actions.ts
"use server";

import { z } from "zod";

// 定义验证模式
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function submitContact(formData: FormData) {
  // 解析表单数据
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  };

  // 验证数据
  const result = contactSchema.safeParse(rawData);

  if (!result.success) {
    // 返回验证错误
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 验证通过，处理数据
  const { name, email, message } = result.data;

  await db.contacts.create({
    data: { name, email, message },
  });

  return { success: true };
}
```

### 在客户端显示验证错误

```tsx
// app/components/ContactForm.tsx
"use client";

import { useFormState } from "react-dom";
import { submitContact } from "@/app/actions";

export function ContactForm() {
  const [state, formAction] = useFormState(submitContact, null);

  return (
    <form action={formAction}>
      <div>
        <input name="name" placeholder="Name" />
        {state?.errors?.name && <p className="error">{state.errors.name[0]}</p>}
      </div>

      <div>
        <input name="email" type="email" placeholder="Email" />
        {state?.errors?.email && (
          <p className="error">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <textarea name="message" placeholder="Message" />
        {state?.errors?.message && (
          <p className="error">{state.errors.message[0]}</p>
        )}
      </div>

      {state?.success && <p className="success">Message sent successfully!</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 自定义验证逻辑

```tsx
"use server";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 自定义验证
  const errors: Record<string, string> = {};

  if (!email || !email.includes("@")) {
    errors.email = "Invalid email address";
  }

  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  // 检查邮箱是否已存在
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    errors.email = "Email already exists";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // 创建用户
  await db.user.create({
    data: { email, password: await hashPassword(password) },
  });

  return { success: true };
}
```

---

## 问题 3：如何处理文件上传？

Server Action 可以直接处理文件上传，FormData 会包含文件对象。

### 基本文件上传

```tsx
// app/actions.ts
"use server";

import { writeFile } from "fs/promises";
import { join } from "path";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // 验证文件类型
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type" };
  }

  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { success: false, error: "File too large" };
  }

  // 读取文件内容
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 生成唯一文件名
  const filename = `${Date.now()}-${file.name}`;
  const filepath = join(process.cwd(), "public", "uploads", filename);

  // 保存文件
  await writeFile(filepath, buffer);

  return {
    success: true,
    url: `/uploads/${filename}`,
  };
}

// app/components/FileUploadForm.tsx
("use client");

import { useState } from "react";
import { uploadFile } from "@/app/actions";

export function FileUploadForm() {
  const [preview, setPreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await uploadFile(formData);

    if (result.success) {
      setPreview(result.url);
      alert("File uploaded successfully!");
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" accept="image/*" required />

      {preview && <img src={preview} alt="Preview" width={200} />}

      <button type="submit">Upload</button>
    </form>
  );
}
```

### 多文件上传

```tsx
"use server";

export async function uploadMultipleFiles(formData: FormData) {
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return { success: false, error: "No files provided" };
  }

  const uploadedFiles = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(process.cwd(), "public", "uploads", filename);

    await writeFile(filepath, buffer);

    uploadedFiles.push({
      name: file.name,
      url: `/uploads/${filename}`,
      size: file.size,
    });
  }

  return {
    success: true,
    files: uploadedFiles,
  };
}

// 表单
<form action={uploadMultipleFiles}>
  <input type="file" name="files" multiple accept="image/*" />
  <button type="submit">Upload Files</button>
</form>;
```

---

## 问题 4：如何提供用户反馈？

Server Action 可以配合 React Hooks 提供丰富的用户反馈。

### 使用 useFormStatus 显示加载状态

```tsx
// app/components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

// app/components/ContactForm.tsx
import { submitContact } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function ContactForm() {
  return (
    <form action={submitContact}>
      <input name="name" placeholder="Name" />
      <input name="email" placeholder="Email" />
      <SubmitButton />
    </form>
  );
}
```

### 使用 useFormState 处理结果

```tsx
"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { createPost } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? "Creating..." : "Create Post"}
    </button>
  );
}

export function PostForm() {
  const [state, formAction] = useFormState(createPost, {
    success: false,
    message: "",
  });

  return (
    <form action={formAction}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />

      {state.message && (
        <div className={state.success ? "success" : "error"}>
          {state.message}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
```

### 乐观更新

```tsx
"use client";

import { useOptimistic } from "react";
import { addComment } from "@/app/actions";

export function CommentList({ comments }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [...state, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const text = formData.get("text") as string;

    // 立即显示评论（乐观更新）
    addOptimisticComment({
      id: Date.now(),
      text,
      pending: true,
    });

    // 发送到服务器
    await addComment(formData);
  };

  return (
    <div>
      {optimisticComments.map((comment) => (
        <div key={comment.id} className={comment.pending ? "pending" : ""}>
          {comment.text}
        </div>
      ))}

      <form action={handleSubmit}>
        <input name="text" placeholder="Add comment" />
        <button type="submit">Post</button>
      </form>
    </div>
  );
}
```

### 完整的表单处理示例

```tsx
// app/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.enum(["tech", "design", "business"]),
});

export async function createPost(prevState: any, formData: FormData) {
  // 验证数据
  const result = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category"),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  try {
    // 创建文章
    const post = await db.posts.create({
      data: result.data,
    });

    // 重新验证页面
    revalidatePath("/posts");

    // 重定向到新文章
    redirect(`/posts/${post.id}`);
  } catch (error) {
    return {
      success: false,
      message: "Failed to create post",
    };
  }
}

// app/components/PostForm.tsx
("use client");

import { useFormState, useFormStatus } from "react-dom";
import { createPost } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Post"}
    </button>
  );
}

export function PostForm() {
  const [state, formAction] = useFormState(createPost, null);

  return (
    <form action={formAction}>
      <div>
        <input name="title" placeholder="Title" required />
        {state?.errors?.title && (
          <p className="error">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <textarea name="content" placeholder="Content" required />
        {state?.errors?.content && (
          <p className="error">{state.errors.content[0]}</p>
        )}
      </div>

      <div>
        <select name="category" required>
          <option value="">Select category</option>
          <option value="tech">Tech</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>
        {state?.errors?.category && (
          <p className="error">{state.errors.category[0]}</p>
        )}
      </div>

      {state?.message && !state.success && (
        <p className="error">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
```

## 延伸阅读

- [Next.js 官方文档 - Forms and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)
- [React 官方文档 - useFormState](https://react.dev/reference/react-dom/hooks/useFormState)
- [React 官方文档 - useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [Zod 文档](https://zod.dev/)
- [FormData MDN 文档](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
