---
title: Vue3 如何更好地支持 TypeScript？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  了解 Vue3 对 TypeScript 的原生支持，掌握类型安全的 Vue 开发方式。
tags:
  - Vue
  - TypeScript
  - 类型推导
  - 类型安全
estimatedTime: 12 分钟
keywords:
  - Vue3 TypeScript
  - 类型支持
  - 类型推导
highlight: Vue3 使用 TypeScript 重写，提供完整的类型定义和自动类型推导。
order: 250
---

## 问题 1：Vue3 的 TypeScript 改进

### Vue2 的问题

```typescript
// Vue2 + TypeScript 需要使用 class 组件
@Component
export default class MyComponent extends Vue {
  // 类型推导有限
  // 需要额外的装饰器
}

// 或使用 Vue.extend，但类型支持不完整
export default Vue.extend({
  data() {
    return { count: 0 }; // this 的类型推导困难
  },
});
```

### Vue3 的改进

```typescript
// Vue3 原生支持 TypeScript
// 无需装饰器，自动类型推导
<script setup lang="ts">
const count = ref(0)  // Ref<number>
const double = computed(() => count.value * 2)  // ComputedRef<number>
</script>
```

---

## 问题 2：Composition API 的类型推导

```typescript
import { ref, reactive, computed } from "vue";

// ref 自动推导
const count = ref(0); // Ref<number>
const name = ref("Vue"); // Ref<string>

// 显式指定类型
const user = ref<User | null>(null);

// reactive 自动推导
const state = reactive({
  count: 0,
  name: "Vue",
});
// { count: number, name: string }

// computed 自动推导
const double = computed(() => count.value * 2); // ComputedRef<number>
```

---

## 问题 3：Props 类型定义

### 运行时声明

```vue
<script setup lang="ts">
const props = defineProps({
  title: String,
  count: {
    type: Number,
    required: true,
  },
});
// props.title: string | undefined
// props.count: number
</script>
```

### 类型声明（推荐）

```vue
<script setup lang="ts">
interface Props {
  title?: string;
  count: number;
  items: string[];
  user: {
    name: string;
    age: number;
  };
}

const props = defineProps<Props>();
// 完整的类型推导
</script>
```

### 带默认值

```vue
<script setup lang="ts">
interface Props {
  title?: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Default Title",
  count: 0,
});
</script>
```

---

## 问题 4：Emits 类型定义

```vue
<script setup lang="ts">
// 类型声明
const emit = defineEmits<{
  (e: "change", value: string): void;
  (e: "update", id: number, data: object): void;
}>();

// Vue 3.3+ 简化语法
const emit = defineEmits<{
  change: [value: string];
  update: [id: number, data: object];
}>();

// 类型安全的调用
emit("change", "hello"); // ✅
emit("change", 123); // ❌ 类型错误
</script>
```

---

## 问题 5：模板中的类型检查

### Volar 插件

Vue 官方的 VS Code 插件 Volar 提供模板类型检查：

```vue
<script setup lang="ts">
const user = ref<{ name: string } | null>(null);
</script>

<template>
  <!-- Volar 会提示 user 可能为 null -->
  <div>{{ user.name }}</div>
  <!-- 警告 -->

  <!-- 正确写法 -->
  <div v-if="user">{{ user.name }}</div>
</template>
```

### 类型收窄

```vue
<template>
  <!-- v-if 会收窄类型 -->
  <div v-if="typeof value === 'string'">
    {{ value.toUpperCase() }}
    <!-- value 被推导为 string -->
  </div>
</template>
```

---

## 问题 6：组件类型

### 获取组件实例类型

```vue
<script setup lang="ts">
import { ref } from "vue";
import MyComponent from "./MyComponent.vue";

// 获取组件实例类型
const compRef = ref<InstanceType<typeof MyComponent> | null>(null);

// 调用组件方法
compRef.value?.someMethod();
</script>

<template>
  <MyComponent ref="compRef" />
</template>
```

### 泛型组件

```vue
<!-- GenericList.vue -->
<script setup lang="ts" generic="T">
defineProps<{
  items: T[];
  selected: T;
}>();
</script>

<!-- 使用 -->
<GenericList :items="users" :selected="currentUser" />
<!-- T 被推导为 User 类型 -->
```

---

## 问题 7：全局类型扩展

```typescript
// types/vue.d.ts
declare module "vue" {
  interface ComponentCustomProperties {
    $api: typeof api;
    $format: (date: Date) => string;
  }
}

// 使用
this.$api; // 有类型提示
this.$format(new Date());
```

### 扩展全局组件

```typescript
// types/components.d.ts
declare module "vue" {
  interface GlobalComponents {
    RouterLink: typeof import("vue-router")["RouterLink"];
    RouterView: typeof import("vue-router")["RouterView"];
  }
}
```

---

## 问题 8：最佳实践

### 1. 使用 `<script setup lang="ts">`

```vue
<script setup lang="ts">
// 最佳的类型推导体验
</script>
```

### 2. 优先使用类型声明

```typescript
// 优先使用 interface/type 定义 props
interface Props {
  // ...
}
const props = defineProps<Props>();
```

### 3. 启用严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

## 延伸阅读

- [Vue 官方文档 - TypeScript](https://cn.vuejs.org/guide/typescript/overview.html)
- [Volar](https://github.com/vuejs/language-tools)
