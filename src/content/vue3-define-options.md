---
title: defineOptions 的用途？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  了解 defineOptions 宏的作用，掌握在 script setup 中定义组件选项的方式。
tags:
  - Vue
  - defineOptions
  - script setup
  - 组件选项
estimatedTime: 8 分钟
keywords:
  - defineOptions
  - 组件名称
  - inheritAttrs
highlight: defineOptions 用于在 script setup 中定义组件选项，如 name、inheritAttrs 等。
order: 253
---

## 问题 1：为什么需要 defineOptions？

在 `<script setup>` 之前，组件选项直接在 export default 中定义：

```vue
<script>
export default {
  name: "MyComponent",
  inheritAttrs: false,
  customOptions: {},
};
</script>
```

但 `<script setup>` 没有 export default，无法直接定义这些选项。

---

## 问题 2：defineOptions 的使用

Vue 3.3+ 引入了 `defineOptions` 宏：

```vue
<script setup>
defineOptions({
  name: "MyComponent",
  inheritAttrs: false,
});

// 其他 setup 代码
const count = ref(0);
</script>
```

---

## 问题 3：常用选项

### name - 组件名称

```vue
<script setup>
defineOptions({
  name: "UserProfile",
});
</script>

<!-- 用于：
  - DevTools 中显示
  - keep-alive 的 include/exclude
  - 递归组件
-->
```

### inheritAttrs - 属性继承

```vue
<script setup>
defineOptions({
  inheritAttrs: false,
});

// 手动绑定 attrs
const attrs = useAttrs();
</script>

<template>
  <div>
    <input v-bind="attrs" />
  </div>
</template>
```

---

## 问题 4：Vue 3.3 之前的方案

在 Vue 3.3 之前，需要使用两个 script 块：

```vue
<script>
export default {
  name: "MyComponent",
  inheritAttrs: false,
};
</script>

<script setup>
// setup 代码
const count = ref(0);
</script>
```

或使用 `unplugin-vue-define-options` 插件。

---

## 问题 5：不支持的选项

`defineOptions` 不支持需要 setup 上下文的选项：

```vue
<script setup>
// ❌ 这些不能在 defineOptions 中定义
defineOptions({
  props: {}, // 使用 defineProps
  emits: [], // 使用 defineEmits
  expose: [], // 使用 defineExpose
  slots: {}, // 使用 defineSlots
});

// ✅ 使用专门的宏
const props = defineProps(["title"]);
const emit = defineEmits(["change"]);
defineExpose({ method });
</script>
```

---

## 问题 6：自定义选项

```vue
<script setup>
defineOptions({
  name: "MyComponent",

  // 自定义选项（需要配合插件使用）
  customOption: "value",

  // 路由元信息（某些路由库支持）
  meta: {
    requiresAuth: true,
  },
});
</script>
```

### 访问自定义选项

```javascript
// 在插件或 mixin 中访问
app.mixin({
  created() {
    const customOption = this.$options.customOption;
    if (customOption) {
      // 处理自定义选项
    }
  },
});
```

---

## 问题 7：TypeScript 支持

```vue
<script setup lang="ts">
defineOptions({
  name: "MyComponent",
  inheritAttrs: false,
});
// TypeScript 会检查选项的类型
</script>
```

### 扩展选项类型

```typescript
// types/vue.d.ts
declare module "vue" {
  interface ComponentCustomOptions {
    customOption?: string;
    meta?: {
      requiresAuth?: boolean;
    };
  }
}
```

---

## 问题 8：使用建议

```vue
<script setup>
// 1. 放在 script setup 的最顶部
defineOptions({
  name: "UserList",
  inheritAttrs: false,
});

// 2. 只定义必要的选项
// 大多数情况下只需要 name

// 3. 组件名使用 PascalCase
defineOptions({
  name: "UserProfileCard", // ✅
});
</script>
```

## 延伸阅读

- [Vue 官方文档 - defineOptions](https://cn.vuejs.org/api/sfc-script-setup.html#defineoptions)
- [Vue 3.3 发布说明](https://blog.vuejs.org/posts/vue-3-3)
