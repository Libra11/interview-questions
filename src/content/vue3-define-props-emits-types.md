---
title: defineProps 与 defineEmits 如何自动推导类型？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 中 defineProps 和 defineEmits 的类型推导机制。
tags:
  - Vue
  - TypeScript
  - defineProps
  - defineEmits
estimatedTime: 10 分钟
keywords:
  - defineProps 类型
  - defineEmits 类型
  - 类型推导
highlight: defineProps 和 defineEmits 支持泛型类型参数，编译器会自动推导并生成运行时代码。
order: 251
---

## 问题 1：defineProps 类型推导

### 运行时声明

```vue
<script setup lang="ts">
// 从运行时声明推导类型
const props = defineProps({
  title: String,
  count: {
    type: Number,
    required: true,
  },
  items: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

// 推导结果
// props.title: string | undefined
// props.count: number
// props.items: string[]
</script>
```

### 类型声明（纯类型）

```vue
<script setup lang="ts">
// 使用泛型参数定义类型
const props = defineProps<{
  title?: string;
  count: number;
  items: string[];
}>();

// 编译器自动推导
// props.title: string | undefined
// props.count: number
// props.items: string[]
</script>
```

---

## 问题 2：编译时转换

```vue
<!-- 源码 -->
<script setup lang="ts">
const props = defineProps<{
  msg: string;
  count?: number;
}>();
</script>

<!-- 编译后 -->
<script>
export default {
  props: {
    msg: { type: String, required: true },
    count: { type: Number, required: false },
  },
  setup(props) {
    // props 已有完整类型
  },
};
</script>
```

Vue 编译器会：

1. 解析 TypeScript 类型
2. 生成对应的运行时 props 定义
3. 保留类型信息供 IDE 使用

---

## 问题 3：withDefaults 默认值

```vue
<script setup lang="ts">
interface Props {
  msg?: string;
  count?: number;
  items?: string[];
}

// 使用 withDefaults 设置默认值
const props = withDefaults(defineProps<Props>(), {
  msg: "Hello",
  count: 0,
  items: () => [], // 对象/数组需要工厂函数
});

// 类型推导
// props.msg: string（不再是 undefined）
// props.count: number
// props.items: string[]
</script>
```

---

## 问题 4：defineEmits 类型推导

### 调用签名方式

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: "change", value: string): void;
  (e: "update", id: number, data: { name: string }): void;
  (e: "delete"): void;
}>();

// 类型安全的调用
emit("change", "hello"); // ✅
emit("change", 123); // ❌ 类型错误
emit("update", 1, { name: "test" }); // ✅
emit("delete"); // ✅
</script>
```

### Vue 3.3+ 简化语法

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string];
  update: [id: number, data: { name: string }];
  delete: [];
}>();

// 使用方式相同
emit("change", "hello");
</script>
```

---

## 问题 5：复杂类型示例

```vue
<script setup lang="ts">
// 复杂的 Props 类型
interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  // 基础类型
  title: string;

  // 可选类型
  subtitle?: string;

  // 联合类型
  size: "small" | "medium" | "large";

  // 对象类型
  user: User;

  // 数组类型
  items: User[];

  // 函数类型
  formatter?: (value: number) => string;

  // 泛型
  data: Record<string, unknown>;
}

const props = defineProps<Props>();

// 所有属性都有正确的类型
props.title; // string
props.size; // 'small' | 'medium' | 'large'
props.user.name; // string
props.items[0].email; // string
props.formatter?.(100); // string | undefined
</script>
```

---

## 问题 6：类型导入

```typescript
// types/index.ts
export interface User {
  id: number;
  name: string;
}

export interface TableProps {
  data: User[];
  loading: boolean;
}

export interface TableEmits {
  select: [user: User];
  delete: [id: number];
}
```

```vue
<script setup lang="ts">
import type { TableProps, TableEmits } from "@/types";

const props = defineProps<TableProps>();
const emit = defineEmits<TableEmits>();
</script>
```

---

## 问题 7：运行时 vs 类型声明

| 特性     | 运行时声明    | 类型声明          |
| -------- | ------------- | ----------------- |
| 语法     | 对象配置      | 泛型参数          |
| 默认值   | 直接设置      | 需要 withDefaults |
| 验证器   | 支持          | 不支持            |
| 类型推导 | 有限          | 完整              |
| 复杂类型 | 需要 PropType | 原生支持          |

### 选择建议

```vue
<!-- 简单场景：运行时声明 -->
<script setup>
const props = defineProps({
  msg: String,
});
</script>

<!-- TypeScript 项目：类型声明 -->
<script setup lang="ts">
const props = defineProps<{
  msg: string;
}>();
</script>

<!-- 需要运行时验证：运行时声明 -->
<script setup lang="ts">
const props = defineProps({
  email: {
    type: String,
    validator: (v: string) => v.includes("@"),
  },
});
</script>
```

## 延伸阅读

- [Vue 官方文档 - Props 类型](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props)
- [Vue 官方文档 - Emits 类型](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-emits)
