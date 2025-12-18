---
title: 如何优雅地管理 API 调用？
category: React
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握 React 项目中 API 调用的组织和管理方法。
tags:
  - React
  - API
  - 架构
  - 最佳实践
estimatedTime: 12 分钟
keywords:
  - API management
  - API layer
  - React Query
  - axios
highlight: 优雅管理 API：分层封装、统一错误处理、类型安全、请求/响应拦截、使用 React Query。
order: 659
---

## 问题 1：API 层封装

### 基础 HTTP 客户端

```typescript
// lib/http.ts
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 跳转登录
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default http;
```

---

## 问题 2：按模块组织 API

### 目录结构

```
src/
└── services/
    ├── index.ts        # 统一导出
    ├── http.ts         # HTTP 客户端
    ├── user.ts         # 用户相关 API
    ├── product.ts      # 产品相关 API
    └── order.ts        # 订单相关 API
```

### 模块示例

```typescript
// services/user.ts
import http from "./http";
import type { User, LoginParams, RegisterParams } from "@/types";

export const userApi = {
  login(params: LoginParams) {
    return http.post<{ token: string }>("/auth/login", params);
  },

  register(params: RegisterParams) {
    return http.post<User>("/auth/register", params);
  },

  getProfile() {
    return http.get<User>("/user/profile");
  },

  updateProfile(data: Partial<User>) {
    return http.put<User>("/user/profile", data);
  },
};
```

### 统一导出

```typescript
// services/index.ts
export { userApi } from "./user";
export { productApi } from "./product";
export { orderApi } from "./order";
```

---

## 问题 3：配合 React Query

### 封装 Query Hooks

```typescript
// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services";

export function useProfile() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    },
  });
}

// 使用
function Profile() {
  const { data: user, isLoading } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  if (isLoading) return <Loading />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateProfile({ name: "New Name" });
      }}
    >
      <p>{user.name}</p>
      <button type="submit">更新</button>
    </form>
  );
}
```

---

## 问题 4：错误处理

### 统一错误处理

```typescript
// lib/http.ts
import { toast } from "react-hot-toast";

const errorMessages: Record<number, string> = {
  400: "请求参数错误",
  401: "请先登录",
  403: "没有权限",
  404: "资源不存在",
  500: "服务器错误",
};

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || errorMessages[status] || "请求失败";

    toast.error(message);

    return Promise.reject(error);
  }
);
```

### 组件级错误处理

```typescript
function Component() {
  const { data, error, isError } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
    retry: 3, // 重试3次
    onError: (error) => {
      // 特殊错误处理
    },
  });

  if (isError) {
    return <ErrorMessage error={error} />;
  }
}
```

---

## 问题 5：类型安全

### 定义 API 响应类型

```typescript
// types/api.ts
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// services/product.ts
export const productApi = {
  getList(params: { page: number; pageSize: number }) {
    return http.get<PaginatedResponse<Product>>("/products", { params });
  },

  getById(id: string) {
    return http.get<Product>(`/products/${id}`);
  },
};
```

### 自动生成类型

```bash
# 使用 OpenAPI 生成类型
npx openapi-typescript https://api.example.com/openapi.json -o src/types/api.ts
```

---

## 问题 6：请求取消

### 支持取消

```typescript
export const productApi = {
  search(query: string, signal?: AbortSignal) {
    return http.get<Product[]>("/products/search", {
      params: { q: query },
      signal,
    });
  },
};

// 使用
function SearchProducts() {
  const { data } = useQuery({
    queryKey: ["products", "search", query],
    queryFn: ({ signal }) => productApi.search(query, signal),
  });
}
```

## 总结

| 实践        | 说明                   |
| ----------- | ---------------------- |
| 分层封装    | HTTP 客户端 + API 模块 |
| 统一拦截    | 认证、错误处理         |
| 类型安全    | TypeScript 类型定义    |
| React Query | 缓存、状态管理         |

## 延伸阅读

- [React Query](https://tanstack.com/query/latest)
- [Axios](https://axios-http.com/)
