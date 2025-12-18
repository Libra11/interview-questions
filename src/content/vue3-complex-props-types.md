---
title: 如何为组件 Props 定义复杂类型？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握在 Vue3 中为 Props 定义复杂 TypeScript 类型的各种方式。
tags:
  - Vue
  - TypeScript
  - Props
  - 类型定义
estimatedTime: 12 分钟
keywords:
  - Props 类型
  - 复杂类型
  - TypeScript
highlight: Vue3 支持使用 TypeScript 接口、泛型、联合类型等为 Props 定义复杂类型。
order: 587
---

## 问题 1：基础类型定义

```vue
<script setup lang="ts">
interface Props {
  // 必填属性
  title: string;
  count: number;

  // 可选属性
  subtitle?: string;

  // 联合类型
  size: "small" | "medium" | "large";

  // 布尔类型
  disabled: boolean;
}

const props = defineProps<Props>();
</script>
```

---

## 问题 2：对象和数组类型

```vue
<script setup lang="ts">
// 定义接口
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface Address {
  city: string;
  street: string;
  zipCode: string;
}

interface Props {
  // 对象类型
  user: User;

  // 嵌套对象
  profile: {
    user: User;
    address: Address;
  };

  // 数组类型
  users: User[];

  // 元组类型
  range: [number, number];

  // Record 类型
  metadata: Record<string, unknown>;
}

const props = defineProps<Props>();
</script>
```

---

## 问题 3：函数类型

```vue
<script setup lang="ts">
interface Props {
  // 简单函数
  onClick: () => void;

  // 带参数的函数
  onSelect: (id: number) => void;

  // 带返回值的函数
  formatter: (value: number) => string;

  // 可选函数
  onError?: (error: Error) => void;

  // 异步函数
  fetchData: (params: { page: number }) => Promise<User[]>;
}

const props = defineProps<Props>();

// 使用
props.onClick();
props.onSelect(1);
const formatted = props.formatter(100);
</script>
```

---

## 问题 4：泛型 Props

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T extends { id: number }">
interface Props {
  items: T[];
  selected?: T;
  keyField?: keyof T;
}

const props = defineProps<Props>();

// T 会根据使用时传入的数据推导
</script>

<!-- 使用 -->
<script setup lang="ts">
interface User {
  id: number
  name: string
}

const users: User[] = [...]
const selected: User = users[0]
</script>

<template>
  <!-- T 被推导为 User -->
  <GenericList :items="users" :selected="selected" />
</template>
```

---

## 问题 5：联合类型和条件类型

```vue
<script setup lang="ts">
// 联合类型
type ButtonVariant = "primary" | "secondary" | "danger";
type Size = "sm" | "md" | "lg";

// 条件类型
type DataType = "text" | "number" | "date";
type ValueType<T extends DataType> = T extends "text"
  ? string
  : T extends "number"
  ? number
  : T extends "date"
  ? Date
  : never;

interface Props {
  variant: ButtonVariant;
  size: Size;

  // 使用条件类型
  type: DataType;
  value: ValueType<DataType>;
}

const props = defineProps<Props>();
</script>
```

---

## 问题 6：带默认值的复杂类型

```vue
<script setup lang="ts">
interface User {
  id: number;
  name: string;
}

interface Props {
  title?: string;
  count?: number;
  user?: User;
  items?: string[];
  config?: {
    theme: "light" | "dark";
    locale: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: "Default Title",
  count: 0,

  // 对象需要工厂函数
  user: () => ({ id: 0, name: "Guest" }),

  // 数组需要工厂函数
  items: () => [],

  // 嵌套对象
  config: () => ({
    theme: "light",
    locale: "en",
  }),
});
</script>
```

---

## 问题 7：从外部导入类型

```typescript
// types/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface TableColumn<T = unknown> {
  key: keyof T;
  title: string;
  width?: number;
  render?: (value: T[keyof T], row: T) => string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

```vue
<script setup lang="ts">
import type { User, TableProps } from "@/types";

// 直接使用导入的类型
const props = defineProps<TableProps<User>>();
</script>
```

---

## 问题 8：运行时验证

```vue
<script setup lang="ts">
import type { PropType } from "vue";

interface User {
  id: number;
  name: string;
}

// 需要运行时验证时，使用运行时声明
const props = defineProps({
  user: {
    type: Object as PropType<User>,
    required: true,
    validator: (value: User) => {
      return value.id > 0 && value.name.length > 0;
    },
  },

  email: {
    type: String,
    required: true,
    validator: (value: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
  },
});
</script>
```

## 延伸阅读

- [Vue 官方文档 - Props 类型标注](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props)
- [TypeScript 官方文档 - 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)
