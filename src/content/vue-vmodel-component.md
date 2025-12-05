---
title: v-model 在组件中的实现原理？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 v-model 在自定义组件中的工作原理，掌握单个和多个 v-model 的实现方式。
tags:
  - Vue
  - v-model
  - 双向绑定
  - 组件通信
estimatedTime: 15 分钟
keywords:
  - v-model 原理
  - 双向绑定
  - modelValue
highlight: v-model 是 props + emit 的语法糖，本质是 :modelValue + @update:modelValue 的简写。
order: 218
---

## 问题 1：v-model 的本质

`v-model` 在组件上是一个**语法糖**，展开后是 prop 和事件的组合：

```vue
<!-- 使用 v-model -->
<CustomInput v-model="searchText" />

<!-- 等价于 -->
<CustomInput
  :modelValue="searchText"
  @update:modelValue="searchText = $event"
/>
```

---

## 问题 2：实现支持 v-model 的组件

### 基本实现

```vue
<!-- CustomInput.vue -->
<script setup>
defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
```

### 使用 computed 简化

```vue
<script setup>
const props = defineProps(["modelValue"]);
const emit = defineEmits(["update:modelValue"]);

// 使用 computed 创建双向绑定
const value = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <!-- 直接使用 v-model -->
  <input v-model="value" />
</template>
```

---

## 问题 3：defineModel 宏（Vue 3.4+）

Vue 3.4 引入了 `defineModel`，大大简化了 v-model 的实现：

```vue
<script setup>
// 自动处理 props 和 emit
const model = defineModel();
</script>

<template>
  <input v-model="model" />
</template>
```

### 带类型和默认值

```vue
<script setup lang="ts">
const model = defineModel<string>({ default: "" });
const count = defineModel<number>("count", { required: true });
</script>
```

---

## 问题 4：多个 v-model

一个组件可以支持多个 v-model：

```vue
<!-- 父组件 -->
<UserForm v-model:firstName="first" v-model:lastName="last" />

<!-- 等价于 -->
<UserForm
  :firstName="first"
  @update:firstName="first = $event"
  :lastName="last"
  @update:lastName="last = $event"
/>
```

### 子组件实现

```vue
<!-- UserForm.vue -->
<script setup>
defineProps(["firstName", "lastName"]);
defineEmits(["update:firstName", "update:lastName"]);
</script>

<template>
  <input
    :value="firstName"
    @input="$emit('update:firstName', $event.target.value)"
  />
  <input
    :value="lastName"
    @input="$emit('update:lastName', $event.target.value)"
  />
</template>
```

### 使用 defineModel

```vue
<script setup>
const firstName = defineModel("firstName");
const lastName = defineModel("lastName");
</script>

<template>
  <input v-model="firstName" />
  <input v-model="lastName" />
</template>
```

---

## 问题 5：v-model 修饰符

### 内置修饰符

```vue
<!-- 父组件 -->
<CustomInput v-model.trim="text" />
<CustomInput v-model.number="count" />
<CustomInput v-model.lazy="text" />
```

### 自定义修饰符

```vue
<!-- 父组件 -->
<CustomInput v-model.capitalize="text" />
```

```vue
<!-- CustomInput.vue -->
<script setup>
const props = defineProps({
  modelValue: String,
  modelModifiers: { default: () => ({}) },
});
const emit = defineEmits(["update:modelValue"]);

function handleInput(e) {
  let value = e.target.value;

  // 检查修饰符
  if (props.modelModifiers.capitalize) {
    value = value.charAt(0).toUpperCase() + value.slice(1);
  }

  emit("update:modelValue", value);
}
</script>

<template>
  <input :value="modelValue" @input="handleInput" />
</template>
```

### defineModel 处理修饰符

```vue
<script setup>
const [model, modifiers] = defineModel({
  set(value) {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  },
});
</script>
```

---

## 问题 6：Vue 2 vs Vue 3 的区别

### Vue 2

```vue
<!-- 默认使用 value 和 input -->
<CustomInput v-model="text" />
<!-- 等价于 -->
<CustomInput :value="text" @input="text = $event" />

<!-- 可以通过 model 选项自定义 -->
export default { model: { prop: 'checked', event: 'change' } }
```

### Vue 3

```vue
<!-- 默认使用 modelValue 和 update:modelValue -->
<CustomInput v-model="text" />
<!-- 等价于 -->
<CustomInput :modelValue="text" @update:modelValue="text = $event" />

<!-- 支持多个 v-model，无需 model 选项 -->
<Form v-model:name="name" v-model:age="age" />
```

## 延伸阅读

- [Vue 官方文档 - 组件 v-model](https://cn.vuejs.org/guide/components/v-model.html)
- [Vue 官方文档 - defineModel](https://cn.vuejs.org/api/sfc-script-setup.html#definemodel)
