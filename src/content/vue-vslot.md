---
title: v-slot 与 #slot 的区别？
category: Vue
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 Vue 插槽的语法形式，掌握 v-slot 指令和 # 简写的使用方式。
tags:
  - Vue
  - v-slot
  - 插槽
  - 语法糖
estimatedTime: 8 分钟
keywords:
  - v-slot
  - 插槽语法
  - 具名插槽
highlight: v-slot 和 # 是同一个指令的完整写法和简写，# 是 v-slot 的语法糖。
order: 533
---

## 问题 1：v-slot 与 # 的关系

`#` 是 `v-slot` 的**简写形式**，就像 `:` 是 `v-bind` 的简写，`@` 是 `v-on` 的简写。

```vue
<!-- 完整写法 -->
<template v-slot:header>
  <h1>标题</h1>
</template>

<!-- 简写 -->
<template #header>
  <h1>标题</h1>
</template>
```

两者**完全等价**，没有功能区别。

---

## 问题 2：基本用法

### 默认插槽

```vue
<!-- 子组件 BaseLayout.vue -->
<template>
  <div class="container">
    <slot></slot>
    <!-- 默认插槽 -->
  </div>
</template>

<!-- 父组件使用 -->
<BaseLayout>
  <p>这是默认插槽的内容</p>
</BaseLayout>

<!-- 显式使用 v-slot -->
<BaseLayout v-slot>
  <p>这是默认插槽的内容</p>
</BaseLayout>

<!-- 简写 -->
<BaseLayout #default>
  <p>这是默认插槽的内容</p>
</BaseLayout>
```

### 具名插槽

```vue
<!-- 子组件 -->
<template>
  <header>
    <slot name="header"></slot>
  </header>
  <main>
    <slot></slot>
  </main>
  <footer>
    <slot name="footer"></slot>
  </footer>
</template>

<!-- 父组件 - 完整写法 -->
<BaseLayout>
  <template v-slot:header>
    <h1>页面标题</h1>
  </template>
  
  <template v-slot:default>
    <p>主要内容</p>
  </template>
  
  <template v-slot:footer>
    <p>页脚信息</p>
  </template>
</BaseLayout>

<!-- 父组件 - 简写 -->
<BaseLayout>
  <template #header>
    <h1>页面标题</h1>
  </template>
  
  <template #default>
    <p>主要内容</p>
  </template>
  
  <template #footer>
    <p>页脚信息</p>
  </template>
</BaseLayout>
```

---

## 问题 3：作用域插槽

```vue
<!-- 子组件 -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="index"></slot>
    </li>
  </ul>
</template>

<!-- 父组件 - 完整写法 -->
<ItemList v-slot="{ item, index }">
  <span>{{ index }}: {{ item.name }}</span>
</ItemList>

<!-- 简写 -->
<ItemList #default="{ item, index }">
  <span>{{ index }}: {{ item.name }}</span>
</ItemList>

<!-- 具名作用域插槽 -->
<ItemList>
  <template v-slot:item="{ item }">
    {{ item.name }}
  </template>
</ItemList>

<!-- 简写 -->
<ItemList>
  <template #item="{ item }">
    {{ item.name }}
  </template>
</ItemList>
```

---

## 问题 4：动态插槽名

```vue
<script setup>
import { ref } from "vue";
const slotName = ref("header");
</script>

<template>
  <BaseLayout>
    <!-- 动态插槽名 - 完整写法 -->
    <template v-slot:[slotName]> 动态内容 </template>

    <!-- 简写 -->
    <template #[slotName]> 动态内容 </template>
  </BaseLayout>
</template>
```

---

## 问题 5：使用建议

### 推荐使用 # 简写

```vue
<!-- ✅ 推荐：简洁清晰 -->
<template #header>
  <h1>标题</h1>
</template>

<template #footer>
  <p>页脚</p>
</template>

<!-- 也可以：完整写法 -->
<template v-slot:header>
  <h1>标题</h1>
</template>
```

### 注意事项

```vue
<!-- ❌ 错误：# 后面必须有插槽名 -->
<template #>内容</template>

<!-- ✅ 正确：默认插槽用 #default -->
<template #default>内容</template>

<!-- ✅ 或者直接写在组件上（仅限默认插槽） -->
<MyComponent #default="{ data }">
  {{ data }}
</MyComponent>
```

## 延伸阅读

- [Vue 官方文档 - 插槽](https://cn.vuejs.org/guide/components/slots.html)
