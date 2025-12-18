---
title: 如何构建 Vue3 + Node 全栈项目？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 + Node.js 全栈项目的架构设计和开发实践。
tags:
  - Vue
  - Node.js
  - 全栈
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 全栈开发
  - Vue3 Node
  - Monorepo
highlight: 通过 Monorepo 架构、类型共享、统一开发体验构建全栈应用。
order: 633
---

## 问题 1：项目结构

```
project/
├── packages/
│   ├── client/          # Vue3 前端
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── server/          # Node.js 后端
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/          # 共享代码
│       ├── types/
│       ├── utils/
│       └── package.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 问题 2：Monorepo 配置

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```json
// package.json
{
  "name": "fullstack-app",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "dev:client": "pnpm --filter client dev",
    "dev:server": "pnpm --filter server dev"
  },
  "devDependencies": {
    "turbo": "^1.10.0"
  }
}
```

```json
// turbo.json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

---

## 问题 3：类型共享

```typescript
// packages/shared/types/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
```

```typescript
// 前端使用
import type { User, LoginDto } from "@shared/types";

// 后端使用
import type { User, CreateUserDto } from "@shared/types";
```

---

## 问题 4：后端 API（Express/Fastify）

```typescript
// packages/server/src/index.ts
import express from "express";
import cors from "cors";
import { userRouter } from "./routes/user";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

```typescript
// packages/server/src/routes/user.ts
import { Router } from "express";
import type { User, CreateUserDto } from "@shared/types";

const router = Router();

router.get("/", async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
});

router.post("/", async (req, res) => {
  const dto: CreateUserDto = req.body;
  const user = await userService.create(dto);
  res.json(user);
});

export { router as userRouter };
```

---

## 问题 5：前端 API 调用

```typescript
// packages/client/src/api/user.ts
import type { User, CreateUserDto, AuthResponse } from "@shared/types";

const BASE_URL = "/api";

export const userApi = {
  async getAll(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    return res.json();
  },

  async create(dto: CreateUserDto): Promise<User> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    return res.json();
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    return res.json();
  },
};
```

---

## 问题 6：开发代理配置

```typescript
// packages/client/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

---

## 问题 7：统一验证

```typescript
// packages/shared/validators/user.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

```typescript
// 后端使用
import { createUserSchema } from "@shared/validators";

router.post("/", async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error);
  }
  // ...
});

// 前端使用
import { createUserSchema } from "@shared/validators";

const { errors } = createUserSchema.safeParse(formData);
```

---

## 问题 8：部署配置

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/packages/server/dist ./server
COPY --from=builder /app/packages/client/dist ./client

# 静态文件服务
COPY --from=builder /app/packages/server/package.json ./

RUN npm install --production

EXPOSE 3000
CMD ["node", "server/index.js"]
```

```typescript
// 后端服务静态文件
import express from "express";
import path from "path";

const app = express();

// API 路由
app.use("/api", apiRouter);

// 静态文件
app.use(express.static(path.join(__dirname, "../client")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
```

## 延伸阅读

- [Turborepo](https://turbo.build/repo)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [tRPC](https://trpc.io/) - 类型安全的 API
