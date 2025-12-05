---
title: v-bind 与 v-model 的关系？
category: Vue
difficulty: 入门
updatedAt: 2025-12-05
summary: >-
  理解 v-bind 和 v-model 的区别与联系，掌握单向绑定与双向绑定的本质。
tags:
  - Vue
  - v-bind
  - v-model
  - 数据绑定
estimatedTime: 10 分钟
keywords:
  - v-bind
  - v-model
  - 单向绑定
  - 双向绑定
highlight: v-bind 是单向绑定（数据→视图），v-model 是双向绑定（数据↔视图），v-model 本质是 v-bind + 事件监听的语法糖。
order: 226
---

## 问题 1：v-bind 是什么？

`v-bind` 用于**单向绑定**，将数据绑定到元素属性上。数据变化会更新视图，但视图变化不会影响数据。

```vue
<script setup>
import { ref } from "vue";
const url = ref("https://vuejs.org");
const isDisabled = ref(true);
</script>

<template>
  <!-- 绑定属性 -->
  <a v-bind:href="url">Vue.js</a>

  <!-- 简写 -->
  <a :href="url">Vue.js</a>

  <!-- 绑定多个属性 -->
  <button :disabled="isDisabled" :class="{ active: isActive }">Click</button>
</template>
```

---

## 问题 2：v-model 是什么？

`v-model` 用于**双向绑定**，数据和视图相互影响。

```vue
<script setup>
import { ref } from "vue";
const message = ref("");
</script>

<template>
  <!-- 输入框内容变化会更新 message -->
  <!-- message 变化也会更新输入框 -->
  <input v-model="message" />
  <p>{{ message }}</p>
</template>
```

---

## 问题 3：v-model 的本质

`v-model` 是**语法糖**，等价于 `v-bind` + 事件监听：

```vue
<!-- v-model 写法 -->
<input v-model="message" />

<!-- 等价于 -->
<input :value="message" @input="message = $event.target.value" />
```

### 不同表单元素的展开形式

```vue
<!-- 文本输入框 -->
<input v-model="text" />
<!-- 等价于 -->
<input :value="text" @input="text = $event.target.value" />

<!-- 复选框 -->
<input type="checkbox" v-model="checked" />
<!-- 等价于 -->
<input
  type="checkbox"
  :checked="checked"
  @change="checked = $event.target.checked"
/>

<!-- 单选框 -->
<input type="radio" v-model="picked" value="a" />
<!-- 等价于 -->
<input type="radio" :checked="picked === 'a'" @change="picked = 'a'" />

<!-- 下拉选择 -->
<select v-model="selected">
  <option value="a">A</option>
</select>
<!-- 等价于 -->
<select :value="selected" @change="selected = $event.target.value">
  <option value="a">A</option>
</select>
```

---

## 问题 4：核心区别

| 特性     | v-bind              | v-model             |
| -------- | ------------------- | ------------------- |
| 数据流向 | 单向（数据 → 视图） | 双向（数据 ↔ 视图） |
| 用途     | 绑定任意属性        | 表单输入绑定        |
| 简写     | `:attr`             | 无                  |
| 本质     | 属性绑定            | v-bind + 事件监听   |

### 代码对比

```vue
<script setup>
import { ref } from "vue";
const value = ref("hello");
</script>

<template>
  <!-- v-bind：只能从数据到视图 -->
  <input :value="value" />
  <!-- 用户输入不会改变 value -->

  <!-- v-model：双向同步 -->
  <input v-model="value" />
  <!-- 用户输入会改变 value -->
</template>
```

---

## 问题 5：v-model 修饰符

```vue
<template>
  <!-- .lazy：change 事件而非 input 事件 -->
  <input v-model.lazy="msg" />

  <!-- .number：自动转换为数字 -->
  <input v-model.number="age" type="number" />

  <!-- .trim：自动去除首尾空格 -->
  <input v-model.trim="msg" />
</template>
```

---

## 问题 6：在组件上使用

### v-bind 传递 props

```vue
<!-- 父组件 -->
<ChildComponent :title="pageTitle" :data="items" />

<!-- 子组件接收 -->
<script setup>
defineProps(["title", "data"]);
</script>
```

### v-model 实现双向绑定

```vue
<!-- 父组件 -->
<CustomInput v-model="searchText" />

<!-- 等价于 -->
<CustomInput
  :modelValue="searchText"
  @update:modelValue="searchText = $event"
/>

<!-- 子组件实现 -->
<script setup>
defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);
</script>

<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
```

## 延伸阅读

- [Vue 官方文档 - 表单输入绑定](https://cn.vuejs.org/guide/essentials/forms.html)
- [Vue 官方文档 - 组件 v-model](https://cn.vuejs.org/guide/components/v-model.html)
