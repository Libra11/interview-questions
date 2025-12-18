---
title: 如何为全局组件提供类型声明？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握为 Vue3 全局注册的组件提供 TypeScript 类型声明的方法。
tags:
  - Vue
  - TypeScript
  - 全局组件
  - 类型声明
estimatedTime: 10 分钟
keywords:
  - 全局组件类型
  - GlobalComponents
  - 类型声明
highlight: 通过扩展 Vue 的 GlobalComponents 接口，为全局组件提供完整的类型支持。
order: 589
---

## 问题 1：问题背景

全局注册的组件在模板中使用时，默认没有类型提示：

```typescript
// main.ts
import MyButton from "./components/MyButton.vue";

app.component("MyButton", MyButton);
```

```vue
<template>
  <!-- 没有类型提示，props 不会检查 -->
  <MyButton title="Hello" />
</template>
```

---

## 问题 2：声明全局组件类型

创建类型声明文件：

```typescript
// types/components.d.ts
import MyButton from "@/components/MyButton.vue";
import MyInput from "@/components/MyInput.vue";
import MyModal from "@/components/MyModal.vue";

declare module "vue" {
  export interface GlobalComponents {
    MyButton: typeof MyButton;
    MyInput: typeof MyInput;
    MyModal: typeof MyModal;
  }
}
```

现在模板中使用这些组件时会有完整的类型提示。

---

## 问题 3：自动生成类型声明

### 使用 unplugin-vue-components

```typescript
// vite.config.ts
import Components from "unplugin-vue-components/vite";

export default {
  plugins: [
    Components({
      // 自动生成 components.d.ts
      dts: true,
    }),
  ],
};
```

生成的文件：

```typescript
// components.d.ts (自动生成)
declare module "vue" {
  export interface GlobalComponents {
    MyButton: typeof import("./components/MyButton.vue")["default"];
    MyInput: typeof import("./components/MyInput.vue")["default"];
  }
}
```

---

## 问题 4：第三方组件库

### Element Plus

```typescript
// types/components.d.ts
declare module "vue" {
  export interface GlobalComponents {
    ElButton: typeof import("element-plus")["ElButton"];
    ElInput: typeof import("element-plus")["ElInput"];
    ElTable: typeof import("element-plus")["ElTable"];
    // ...
  }
}
```

### 使用官方类型

```typescript
// Element Plus 提供了类型声明
// tsconfig.json
{
  "compilerOptions": {
    "types": ["element-plus/global"]
  }
}
```

### Ant Design Vue

```typescript
// types/components.d.ts
declare module "vue" {
  export interface GlobalComponents {
    AButton: typeof import("ant-design-vue")["Button"];
    AInput: typeof import("ant-design-vue")["Input"];
  }
}
```

---

## 问题 5：Vue Router 组件

```typescript
// types/components.d.ts
declare module "vue" {
  export interface GlobalComponents {
    RouterLink: typeof import("vue-router")["RouterLink"];
    RouterView: typeof import("vue-router")["RouterView"];
  }
}
```

---

## 问题 6：完整示例

```typescript
// types/components.d.ts
import type { DefineComponent } from "vue";

// 自定义组件
import MyButton from "@/components/MyButton.vue";
import MyInput from "@/components/MyInput.vue";

// 第三方组件
import { ElButton, ElInput, ElTable } from "element-plus";

declare module "vue" {
  export interface GlobalComponents {
    // 自定义组件
    MyButton: typeof MyButton;
    MyInput: typeof MyInput;

    // Element Plus
    ElButton: typeof ElButton;
    ElInput: typeof ElInput;
    ElTable: typeof ElTable;

    // Vue Router
    RouterLink: typeof import("vue-router")["RouterLink"];
    RouterView: typeof import("vue-router")["RouterView"];

    // 内置组件
    Transition: typeof import("vue")["Transition"];
    TransitionGroup: typeof import("vue")["TransitionGroup"];
    KeepAlive: typeof import("vue")["KeepAlive"];
    Teleport: typeof import("vue")["Teleport"];
    Suspense: typeof import("vue")["Suspense"];
  }
}

export {};
```

---

## 问题 7：tsconfig 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vite/client"]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.vue",
    "types/**/*.d.ts" // 包含类型声明目录
  ]
}
```

---

## 问题 8：Volar 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    // ...
  },
  "vueCompilerOptions": {
    // 启用模板类型检查
    "strictTemplates": true
  }
}
```

### 验证类型生效

```vue
<template>
  <!-- 现在有类型检查 -->
  <MyButton title="Hello" />
  <!-- ✅ -->
  <MyButton :title="123" />
  <!-- ❌ 类型错误 -->
  <MyButton unknown="prop" />
  <!-- ❌ 未知属性 -->
</template>
```

## 延伸阅读

- [Vue 官方文档 - 全局组件类型](https://cn.vuejs.org/guide/typescript/options-api.html#augmenting-global-properties)
- [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components)
