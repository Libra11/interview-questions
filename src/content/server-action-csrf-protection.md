---
title: Server Action 如何防止 CSRF？
category: Next.js
difficulty: 中级
updatedAt: 2025-12-04
summary: >-
  详细讲解 Next.js Server Action 的 CSRF 防护机制，理解其安全性设计和最佳实践。
tags:
  - Next.js
  - Server Action
  - 安全
  - CSRF
estimatedTime: 20 分钟
keywords:
  - Server Action
  - CSRF 防护
  - 安全
  - Next.js 安全
highlight: Server Action 内置 CSRF 防护，无需手动实现 token 验证
order: 36
---

## 问题 1：什么是 CSRF 攻击？

CSRF（跨站请求伪造）是一种常见的 Web 安全漏洞，攻击者诱导用户在已登录的网站上执行非预期的操作。

### CSRF 攻击示例

```html
<!-- 恶意网站 evil.com -->
<html>
  <body>
    <!-- 用户访问这个页面时，会自动提交表单 -->
    <form action="https://bank.com/transfer" method="POST" id="hack">
      <input name="to" value="attacker-account" />
      <input name="amount" value="10000" />
    </form>

    <script>
      // 自动提交表单
      document.getElementById("hack").submit();
    </script>
  </body>
</html>

/** * 攻击流程： * 1. 用户登录 bank.com * 2. 用户访问 evil.com（未退出
bank.com） * 3. evil.com 的脚本自动提交表单到 bank.com * 4. 浏览器自动带上
bank.com 的 cookies * 5. bank.com 认为这是用户的合法请求 * 6. 转账成功，用户被盗
*/
```

### 传统的 CSRF 防护

```tsx
// 传统方式：需要手动实现 CSRF token
// app/api/transfer/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const csrfToken = request.headers.get("X-CSRF-Token");

  // 验证 CSRF token
  const sessionToken = await getSessionToken();
  if (csrfToken !== sessionToken) {
    return Response.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // 处理请求
  await processTransfer(body);
  return Response.json({ success: true });
}

// 客户端需要获取并发送 token
const csrfToken = await fetch("/api/csrf-token").then((r) => r.json());

await fetch("/api/transfer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## 问题 2：Server Action 如何自动防护 CSRF？

Next.js 为 Server Action 内置了多层 CSRF 防护机制。

### 1. Origin 验证

```tsx
/**
 * Next.js 自动验证请求来源：
 *
 * 1. 检查 Origin 或 Referer 头
 * 2. 确保请求来自同一域名
 * 3. 拒绝跨域请求
 */

// app/actions.ts
"use server";

export async function transferMoney(amount: number) {
  // Next.js 自动验证：
  // - 请求的 Origin 必须是 https://yourapp.com
  // - 如果来自 https://evil.com，会被拒绝

  await db.transfer({ amount });
  return { success: true };
}

// 恶意网站无法调用
// evil.com 上的代码：
fetch("https://yourapp.com/_next/data/actions/abc123", {
  method: "POST",
  body: JSON.stringify({ amount: 10000 }),
});
// ❌ 被 Next.js 拒绝：Origin 不匹配
```

### 2. 加密的 Action ID

```tsx
/**
 * Server Action 使用加密的 ID：
 *
 * 1. 每个 Action 有唯一的加密 ID
 * 2. ID 在构建时生成，无法预测
 * 3. 攻击者无法构造有效的请求
 */

"use server";

export async function sensitiveAction() {
  // Next.js 生成类似这样的 ID：
  // "a8f3d9e2b1c4567890abcdef12345678"

  // 攻击者需要知道这个 ID 才能调用
  // 但 ID 是加密的，无法猜测

  await performSensitiveOperation();
}

/**
 * 请求格式：
 * POST /_next/data/actions/a8f3d9e2b1c4567890abcdef12345678
 *
 * 攻击者无法知道正确的 ID
 */
```

### 3. 闭包验证

```tsx
/**
 * Server Action 使用闭包捕获上下文：
 *
 * 1. Action 可以访问定义时的作用域
 * 2. 包含用户会话信息
 * 3. 验证请求者身份
 */

// app/dashboard/page.tsx
async function DashboardPage() {
  // 在服务器端获取当前用户
  const user = await getCurrentUser();

  // Server Action 捕获 user
  async function updateProfile(formData: FormData) {
    "use server";

    // 这里的 user 是定义时的用户
    // 不是请求时传入的
    await db.user.update({
      where: { id: user.id }, // 使用闭包中的 user.id
      data: {
        name: formData.get("name"),
      },
    });
  }

  return (
    <form action={updateProfile}>
      <input name="name" defaultValue={user.name} />
      <button type="submit">Update</button>
    </form>
  );
}

/**
 * 安全性：
 * - 攻击者无法修改 user.id
 * - 即使构造了请求，也只能更新自己的数据
 * - 闭包在服务器端，客户端无法访问
 */
```

---

## 问题 3：Server Action 的安全最佳实践

虽然有内置防护，但仍需要遵循安全最佳实践。

### 1. 始终验证用户权限

```tsx
"use server";

import { auth } from "@/lib/auth";

export async function deletePost(postId: string) {
  // ✅ 验证用户身份
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // ✅ 验证用户权限
  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (post.authorId !== session.user.id) {
    throw new Error("Forbidden");
  }

  // 权限验证通过，执行删除
  await db.post.delete({
    where: { id: postId },
  });

  revalidatePath("/posts");
}
```

### 2. 验证输入数据

```tsx
"use server";

import { z } from "zod";

const transferSchema = z.object({
  to: z.string().email(),
  amount: z.number().positive().max(10000),
});

export async function transferMoney(data: unknown) {
  // ✅ 验证数据格式
  const result = transferSchema.safeParse(data);

  if (!result.success) {
    return { error: "Invalid input" };
  }

  // ✅ 验证用户余额
  const user = await getCurrentUser();
  if (user.balance < result.data.amount) {
    return { error: "Insufficient balance" };
  }

  // 执行转账
  await db.transfer(result.data);

  return { success: true };
}
```

### 3. 使用速率限制

```tsx
"use server";

import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 分钟
  uniqueTokenPerInterval: 500,
});

export async function sendEmail(email: string) {
  // ✅ 限制请求频率
  try {
    await limiter.check(10, email); // 每分钟最多 10 次
  } catch {
    return { error: "Too many requests" };
  }

  await sendEmailService(email);
  return { success: true };
}
```

### 4. 敏感操作需要二次确认

```tsx
"use server";

export async function deleteAccount(confirmToken: string) {
  const session = await auth();

  // ✅ 验证确认 token
  const isValid = await verifyConfirmToken(session.user.id, confirmToken);

  if (!isValid) {
    return { error: "Invalid confirmation token" };
  }

  // 删除账户
  await db.user.delete({
    where: { id: session.user.id },
  });

  return { success: true };
}

// 客户端需要先获取 token
("use client");

async function handleDelete() {
  // 1. 请求确认 token（发送邮件）
  await requestDeleteConfirmation();

  // 2. 用户从邮件获取 token
  const token = prompt("Enter confirmation token from email");

  // 3. 执行删除
  await deleteAccount(token);
}
```

---

## 问题 4：Server Action 与传统 CSRF 防护的对比

### 传统 CSRF Token 方式

```tsx
// ❌ 传统方式：需要手动管理 token
// 1. 生成 token
export async function GET() {
  const token = generateCSRFToken();
  cookies().set("csrf-token", token);
  return Response.json({ token });
}

// 2. 验证 token
export async function POST(request: Request) {
  const bodyToken = request.headers.get("X-CSRF-Token");
  const cookieToken = cookies().get("csrf-token");

  if (bodyToken !== cookieToken) {
    return Response.json({ error: "Invalid token" }, { status: 403 });
  }

  // 处理请求
}

// 3. 客户端管理 token
const token = await fetch("/api/csrf-token").then((r) => r.json());

await fetch("/api/action", {
  method: "POST",
  headers: { "X-CSRF-Token": token },
  body: JSON.stringify(data),
});

/**
 * 问题：
 * - 需要额外的 API 端点
 * - 需要手动验证 token
 * - 客户端需要管理 token
 * - 容易出错
 */
```

### Server Action 方式

```tsx
// ✅ Server Action：自动防护
"use server";

export async function performAction(data) {
  // Next.js 自动处理所有 CSRF 防护
  // 无需手动验证 token

  await db.action(data);
  return { success: true };
}

// 客户端直接调用
await performAction(data);

/**
 * 优势：
 * - 无需额外代码
 * - 自动验证来源
 * - 加密的 Action ID
 * - 闭包保护上下文
 * - 开发者无需关心 CSRF
 */
```

### 安全性对比

```tsx
/**
 * 传统 CSRF Token：
 * ✅ 成熟的解决方案
 * ✅ 广泛支持
 * ❌ 需要手动实现
 * ❌ 容易遗漏
 * ❌ 增加开发复杂度
 *
 * Server Action：
 * ✅ 自动防护
 * ✅ 多层保护
 * ✅ 无需额外代码
 * ✅ 不易出错
 * ⚠️ 仅适用于 Next.js
 */
```

### 完整的安全示例

```tsx
// app/actions/payment.ts
"use server";

import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive().max(10000),
  recipient: z.string().email(),
});

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 100,
});

export async function processPayment(data: unknown) {
  // 1. 验证用户身份
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  // 2. 速率限制
  try {
    await limiter.check(5, session.user.id);
  } catch {
    return { error: "Too many requests" };
  }

  // 3. 验证输入
  const result = paymentSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid input" };
  }

  // 4. 业务逻辑验证
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (user.balance < result.data.amount) {
    return { error: "Insufficient balance" };
  }

  // 5. 执行支付（使用事务）
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: result.data.amount } },
    });

    await tx.payment.create({
      data: {
        userId: session.user.id,
        amount: result.data.amount,
        recipient: result.data.recipient,
      },
    });
  });

  // 6. 记录日志
  await logPayment(session.user.id, result.data);

  revalidatePath("/payments");
  return { success: true };
}
```

## 延伸阅读

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#security)
- [Understanding CSRF Attacks](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [Next.js Server Actions Security](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
