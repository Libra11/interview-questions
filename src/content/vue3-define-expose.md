---
title: defineExpose 的作用？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 defineExpose 的作用，掌握如何在 script setup 中暴露组件方法和属性。
tags:
  - Vue
  - defineExpose
  - 组件通信
  - script setup
estimatedTime: 8 分钟
keywords:
  - defineExpose
  - 暴露方法
  - 组件实例
highlight: defineExpose 用于在 script setup 中显式声明要暴露给父组件的属性和方法。
order: 583
---

## 问题 1：为什么需要 defineExpose？

在 `<script setup>` 中，组件默认是**封闭的**，内部的绑定不会暴露给父组件：

```vue
<!-- Child.vue -->
<script setup>
const count = ref(0);

function increment() {
  count.value++;
}
</script>

<!-- Parent.vue -->
<script setup>
const childRef = ref(null);

// ❌ 无法访问
childRef.value.count; // undefined
childRef.value.increment; // undefined
</script>

<template>
  <Child ref="childRef" />
</template>
```

---

## 问题 2：使用 defineExpose

```vue
<!-- Child.vue -->
<script setup>
const count = ref(0);
const internalData = ref("private");

function increment() {
  count.value++;
}

function reset() {
  count.value = 0;
}

// 显式暴露
defineExpose({
  count,
  increment,
  reset,
  // internalData 不暴露
});
</script>

<!-- Parent.vue -->
<script setup>
const childRef = ref(null);

function handleClick() {
  // ✅ 可以访问
  console.log(childRef.value.count);
  childRef.value.increment();
  childRef.value.reset();

  // ❌ 无法访问未暴露的
  childRef.value.internalData; // undefined
}
</script>
```

---

## 问题 3：TypeScript 类型支持

```vue
<!-- Child.vue -->
<script setup lang="ts">
const count = ref(0);

function increment() {
  count.value++;
}

function getData(): string {
  return "data";
}

defineExpose({
  count,
  increment,
  getData,
});
</script>

<!-- Parent.vue -->
<script setup lang="ts">
import Child from "./Child.vue";

// 获取组件实例类型
const childRef = ref<InstanceType<typeof Child> | null>(null);

function handleClick() {
  // 有完整的类型提示
  childRef.value?.increment();
  const data = childRef.value?.getData(); // string | undefined
}
</script>
```

---

## 问题 4：与 Options API 的对比

### Options API

```vue
<script>
export default {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    },
  },
};
// 默认所有属性和方法都可以通过 ref 访问
</script>
```

### Script Setup

```vue
<script setup>
const count = ref(0);

function increment() {
  count.value++;
}

// 必须显式暴露
defineExpose({ count, increment });
</script>
```

---

## 问题 5：常见使用场景

### 表单组件

```vue
<!-- FormInput.vue -->
<script setup>
const inputRef = ref(null);

function focus() {
  inputRef.value?.focus();
}

function validate() {
  // 验证逻辑
  return isValid;
}

function reset() {
  // 重置逻辑
}

defineExpose({
  focus,
  validate,
  reset,
});
</script>

<!-- 父组件 -->
<script setup>
const formInputRef = ref(null);

function handleSubmit() {
  if (formInputRef.value.validate()) {
    // 提交
  }
}
</script>
```

### 弹窗组件

```vue
<!-- Modal.vue -->
<script setup>
const visible = ref(false);

function open() {
  visible.value = true;
}

function close() {
  visible.value = false;
}

defineExpose({ open, close });
</script>

<!-- 父组件 -->
<script setup>
const modalRef = ref(null);

function showModal() {
  modalRef.value.open();
}
</script>
```

---

## 问题 6：暴露响应式数据

```vue
<script setup>
const state = reactive({
  count: 0,
  name: "Vue",
});

// 暴露整个响应式对象
defineExpose({ state });

// 或暴露只读版本
defineExpose({
  state: readonly(state),
});
</script>
```

---

## 问题 7：注意事项

### 最小化暴露

```vue
<script setup>
// ❌ 不要暴露所有内容
defineExpose({
  ...everything,
});

// ✅ 只暴露必要的 API
defineExpose({
  publicMethod,
  publicProperty,
});
</script>
```

### 避免过度使用

```vue
<!-- 优先使用 props/emit 通信 -->
<!-- defineExpose 适用于命令式调用场景 -->

<!-- ✅ 适合：表单验证、焦点控制、弹窗开关 -->
<!-- ❌ 不适合：数据传递、状态同步 -->
```

## 延伸阅读

- [Vue 官方文档 - defineExpose](https://cn.vuejs.org/api/sfc-script-setup.html#defineexpose)
