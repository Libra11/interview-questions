---
title: how to enable experimental server actions？
category: Next.js
difficulty: 入门
updatedAt: 2025-12-04
summary: >-
  讲解如何在 Next.js 项目中启用和配置 Server Actions，包括配置方法和版本要求。
tags:
  - Next.js
  - Server Action
  - 配置
  - 实验性特性
estimatedTime: 10 分钟
keywords:
  - Server Actions
  - Next.js 配置
  - experimental
highlight: Server Actions 在 Next.js 13.4+ 已经稳定，无需额外配置即可使用
order: 33
---

## 问题 1：Server Actions 需要特殊配置吗？

在 Next.js 13.4 及以后的版本中，Server Actions 已经是稳定特性，无需额外配置。

### Next.js 14+ (当前版本)

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions 默认启用，无需配置
};

module.exports = nextConfig;
```

### Next.js 13.4 - 13.5 (早期版本)

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 在早期版本需要启用实验性特性
    serverActions: true,
  },
};

module.exports = nextConfig;
```

---

## 问题 2：如何验证 Server Actions 是否可用？

可以通过创建一个简单的 Server Action 来验证。

### 创建测试 Server Action

```tsx
// app/actions.ts
"use server";

export async function testAction() {
  console.log("Server Action is working!");
  return { message: "Success", timestamp: new Date().toISOString() };
}
```

### 在页面中使用

```tsx
// app/test/page.tsx
import { testAction } from "@/app/actions";

export default function TestPage() {
  return (
    <form action={testAction}>
      <button type="submit">Test Server Action</button>
    </form>
  );
}
```

### 检查控制台输出

```bash
# 提交表单后，在服务器端控制台应该看到：
Server Action is working!

# 如果看到错误：
# Error: Server Actions are not enabled
# 说明需要检查配置或升级 Next.js 版本
```

---

## 问题 3：不同版本的配置差异

### Next.js 版本对照

```javascript
/**
 * Next.js 13.0 - 13.3
 * - 不支持 Server Actions
 * - 需要升级到 13.4+
 */

/**
 * Next.js 13.4 - 13.5
 * - Server Actions 作为实验性特性
 * - 需要在 next.config.js 中启用
 */
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
  },
};

/**
 * Next.js 14.0+
 * - Server Actions 已稳定
 * - 默认启用，无需配置
 */
// next.config.js
module.exports = {
  // 无需任何配置
};
```

### 检查当前版本

```bash
# 查看 Next.js 版本
npm list next

# 或查看 package.json
cat package.json | grep next

# 如果版本低于 13.4，需要升级
npm install next@latest react@latest react-dom@latest
```

---

## 问题 4：Server Actions 的其他配置选项

虽然 Server Actions 默认启用，但有一些相关配置可以调整。

### 配置 Server Actions 的大小限制

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 配置 Server Action 请求体的最大大小（默认 1MB）
    serverActionsBodySizeLimit: "2mb",
  },
};

module.exports = nextConfig;
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Server Actions 相关规则
    "no-async-promise-executor": "off",
  },
};
```

### 项目结构建议

```
my-app/
├── app/
│   ├── actions/          # 推荐：集中管理 Server Actions
│   │   ├── posts.ts
│   │   ├── users.ts
│   │   └── index.ts
│   ├── api/              # 传统 API 路由（如需要）
│   └── page.tsx
├── next.config.js
├── package.json
└── tsconfig.json
```

### 完整的项目设置示例

```bash
# 1. 创建新项目（推荐使用最新版本）
npx create-next-app@latest my-app --typescript --app

# 2. 进入项目目录
cd my-app

# 3. 验证版本
npm list next
# 应该显示 14.x.x 或更高版本

# 4. 创建 Server Action
mkdir -p app/actions
cat > app/actions/test.ts << 'EOF'
'use server'

export async function testAction() {
  return { message: 'Server Actions are working!' }
}
EOF

# 5. 创建测试页面
cat > app/test/page.tsx << 'EOF'
import { testAction } from '@/app/actions/test'

export default function TestPage() {
  return (
    <form action={testAction}>
      <button type="submit">Test</button>
    </form>
  )
}
EOF

# 6. 启动开发服务器
npm run dev

# 7. 访问 http://localhost:3000/test 测试
```

### 常见问题排查

```typescript
/**
 * 问题 1: "Server Actions are not enabled"
 * 解决：升级到 Next.js 13.4+ 或在 next.config.js 中启用
 */

/**
 * 问题 2: "'use server' directive not recognized"
 * 解决：确保文件在 app 目录中，不是 pages 目录
 */

/**
 * 问题 3: "Cannot use Server Action in Client Component"
 * 解决：
 * - 将 Server Action 定义在单独的文件中
 * - 文件顶部添加 'use server'
 * - 在 Client Component 中导入使用
 */

// ❌ 错误：在 Client Component 中定义
"use client";

async function myAction() {
  "use server"; // 不会工作
}

// ✅ 正确：在单独文件中定义
// actions.ts
("use server");

export async function myAction() {
  // ...
}

// Component.tsx
("use client");
import { myAction } from "./actions";
```

### 环境变量配置

```bash
# .env.local
# Server Actions 可以访问所有环境变量
DATABASE_URL="postgresql://..."
SECRET_KEY="your-secret-key"

# 注意：不要在 Server Actions 中返回敏感信息给客户端
```

```typescript
// app/actions/secure.ts
"use server";

export async function secureAction() {
  // ✅ 可以访问服务器端环境变量
  const dbUrl = process.env.DATABASE_URL;
  const secretKey = process.env.SECRET_KEY;

  // ❌ 不要返回敏感信息
  // return { secretKey } // 危险！

  // ✅ 只返回必要的数据
  return { success: true };
}
```

## 延伸阅读

- [Next.js 官方文档 - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js 14 Release Notes](https://nextjs.org/blog/next-14)
- [Next.js 配置文档](https://nextjs.org/docs/app/api-reference/next-config-js)
- [Upgrading to Next.js 14](https://nextjs.org/docs/app/building-your-application/upgrading)
