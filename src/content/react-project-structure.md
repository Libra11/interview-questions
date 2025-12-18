---
title: 如何设计一个大型 React 项目的目录结构？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  掌握大型 React 项目的目录结构设计原则和最佳实践。
tags:
  - React
  - 项目结构
  - 架构
  - 最佳实践
estimatedTime: 15 分钟
keywords:
  - project structure
  - folder structure
  - React architecture
  - code organization
highlight: 大型项目推荐按功能模块组织，结合分层架构，保持清晰的依赖关系和职责划分。
order: 655
---

## 问题 1：常见的组织方式

### 按类型组织（小型项目）

```
src/
├── components/      # 所有组件
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── Header.tsx
├── hooks/           # 所有 Hooks
├── utils/           # 工具函数
├── services/        # API 调用
├── types/           # 类型定义
└── App.tsx
```

### 按功能模块组织（大型项目）

```
src/
├── features/        # 功能模块
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── dashboard/
│   └── settings/
├── shared/          # 共享代码
│   ├── components/
│   ├── hooks/
│   └── utils/
└── App.tsx
```

---

## 问题 2：推荐的目录结构

### 完整结构

```
src/
├── app/                    # 应用入口和配置
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
│
├── features/               # 功能模块（核心）
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authApi.ts
│   │   ├── store/
│   │   │   └── authSlice.ts
│   │   ├── types.ts
│   │   └── index.ts        # 公开导出
│   │
│   ├── products/
│   └── orders/
│
├── shared/                 # 共享代码
│   ├── components/         # 通用组件
│   │   ├── ui/            # 基础 UI 组件
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   └── Input/
│   │   └── layout/        # 布局组件
│   │       ├── Header/
│   │       └── Sidebar/
│   ├── hooks/             # 通用 Hooks
│   ├── utils/             # 工具函数
│   ├── services/          # 通用服务
│   └── types/             # 通用类型
│
├── assets/                # 静态资源
│   ├── images/
│   └── styles/
│
└── config/                # 配置文件
    ├── constants.ts
    └── env.ts
```

---

## 问题 3：模块内部结构

### 功能模块示例

```
features/products/
├── components/
│   ├── ProductList/
│   │   ├── ProductList.tsx
│   │   ├── ProductList.test.tsx
│   │   ├── ProductList.module.css
│   │   └── index.ts
│   ├── ProductCard/
│   └── ProductFilter/
│
├── hooks/
│   ├── useProducts.ts
│   └── useProductFilter.ts
│
├── services/
│   └── productApi.ts
│
├── store/
│   └── productSlice.ts
│
├── types.ts
└── index.ts               # 只导出公开 API
```

### index.ts 导出

```typescript
// features/products/index.ts
// 只导出对外公开的内容

export { ProductList } from "./components/ProductList";
export { ProductCard } from "./components/ProductCard";
export { useProducts } from "./hooks/useProducts";
export type { Product, ProductFilter } from "./types";
```

---

## 问题 4：设计原则

### 1. 单向依赖

```
features/ → shared/     ✅
shared/ → features/     ❌

features/auth/ → features/products/  ❌（避免模块间直接依赖）
```

### 2. 封装性

```typescript
// ❌ 直接导入内部文件
import { ProductCard } from "@/features/products/components/ProductCard";

// ✅ 通过 index 导入
import { ProductCard } from "@/features/products";
```

### 3. 就近原则

```
// 组件相关的文件放在一起
ProductCard/
├── ProductCard.tsx
├── ProductCard.test.tsx
├── ProductCard.module.css
└── index.ts
```

---

## 问题 5：路径别名配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

### 使用

```typescript
import { Button } from "@shared/components/ui";
import { useAuth } from "@features/auth";
```

## 总结

| 原则       | 说明                       |
| ---------- | -------------------------- |
| 按功能组织 | 相关代码放在一起           |
| 单向依赖   | features → shared          |
| 封装导出   | 通过 index.ts 控制公开 API |
| 就近原则   | 组件相关文件放一起         |

## 延伸阅读

- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Feature-Sliced Design](https://feature-sliced.design/)
