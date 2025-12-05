---
title: emit 如何定义类型？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Vue 组件中 emit 事件的类型定义方式，理解运行时声明和 TypeScript 类型声明的区别。
tags:
  - Vue
  - emit
  - TypeScript
  - 事件
estimatedTime: 10 分钟
keywords:
  - defineEmits
  - emit 类型
  - 事件类型
highlight: Vue3 通过 defineEmits 定义事件类型，支持运行时声明和 TypeScript 类型声明两种方式。
order: 217
---

## 问题 1：基本的 emit 声明

### Options API

```javascript
export default {
  emits: ["change", "update"],

  methods: {
    handleClick() {
      this.$emit("change", newValue);
    },
  },
};
```

### Composition API

```javascript
export default {
  emits: ["change", "update"],

  setup(props, { emit }) {
    function handleClick() {
      emit("change", newValue);
    }
    return { handleClick };
  },
};
```

### `<script setup>`

```vue
<script setup>
const emit = defineEmits(["change", "update"]);

function handleClick() {
  emit("change", newValue);
}
</script>
```

---

## 问题 2：带校验的 emit 声明

可以为每个事件定义校验函数：

```javascript
export default {
  emits: {
    // 无校验
    click: null,

    // 带校验函数
    change: (value) => {
      // 返回 true 表示校验通过
      return typeof value === "string";
    },

    // 带多个参数的校验
    submit: (email, password) => {
      return email && password;
    },
  },
};
```

```vue
<script setup>
const emit = defineEmits({
  change: (value) => typeof value === "string",
  submit: (email, password) => email && password,
});

// 校验失败会在控制台警告
emit("change", 123); // 警告：校验失败
</script>
```

---

## 问题 3：TypeScript 类型声明

### 基于类型的声明

```vue
<script setup lang="ts">
const emit = defineEmits<{
  (e: "change", value: string): void;
  (e: "update", id: number, data: object): void;
}>();

// 类型安全
emit("change", "hello"); // ✅
emit("change", 123); // ❌ 类型错误
emit("update", 1, { name: "test" }); // ✅
</script>
```

### Vue 3.3+ 简化语法

```vue
<script setup lang="ts">
const emit = defineEmits<{
  change: [value: string];
  update: [id: number, data: object];
}>();

emit("change", "hello");
emit("update", 1, { name: "test" });
</script>
```

---

## 问题 4：运行时 vs 类型声明

| 特性       | 运行时声明 | TypeScript 声明 |
| ---------- | ---------- | --------------- |
| 校验时机   | 运行时     | 编译时          |
| 自定义校验 | ✅ 支持    | ❌ 不支持       |
| 类型推断   | 有限       | 完整            |
| IDE 支持   | 基础       | 完整            |

### 不能混用

```vue
<script setup lang="ts">
// ❌ 不能同时使用两种方式
const emit = defineEmits<{
  change: [value: string];
}>({
  change: (v) => typeof v === "string",
});
</script>
```

如果需要运行时校验，使用对象语法：

```vue
<script setup lang="ts">
const emit = defineEmits({
  change: (value: string) => typeof value === "string",
});
</script>
```

---

## 问题 5：在组件外部使用类型

### 导出事件类型

```typescript
// types.ts
export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void
  (e: 'focus'): void
}

// Button.vue
<script setup lang="ts">
import type { ButtonEmits } from './types'

const emit = defineEmits<ButtonEmits>()
</script>
```

### 父组件中的类型提示

```vue
<script setup lang="ts">
import Button from "./Button.vue";

// 事件处理函数会获得正确的类型提示
function handleClick(event: MouseEvent) {
  console.log(event.target);
}
</script>

<template>
  <!-- IDE 会提示可用的事件 -->
  <Button @click="handleClick" />
</template>
```

---

## 问题 6：v-model 相关的 emit

使用 `v-model` 时，需要声明 `update:xxx` 事件：

```vue
<script setup lang="ts">
// 单个 v-model
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// 多个 v-model
const emit = defineEmits<{
  "update:firstName": [value: string];
  "update:lastName": [value: string];
}>();
</script>
```

### 配合 defineModel（Vue 3.4+）

```vue
<script setup lang="ts">
// defineModel 自动处理 emit
const modelValue = defineModel<string>();
const firstName = defineModel<string>("firstName");

// 直接赋值，无需手动 emit
modelValue.value = "new value";
</script>
```

## 延伸阅读

- [Vue 官方文档 - 组件事件](https://cn.vuejs.org/guide/components/events.html)
- [Vue 官方文档 - TypeScript 与组合式 API](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-emits)
