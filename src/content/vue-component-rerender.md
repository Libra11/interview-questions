---
title: 组件重新渲染的触发条件？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue 组件重新渲染的触发机制，掌握如何优化不必要的渲染。
tags:
  - Vue
  - 渲染
  - 响应式
  - 性能优化
estimatedTime: 15 分钟
keywords:
  - 组件渲染
  - 重新渲染
  - 渲染触发
highlight: 组件重新渲染由响应式数据变化触发，只有模板中使用的数据变化才会导致重新渲染。
order: 515
---

## 问题 1：触发重新渲染的条件

Vue 组件在以下情况会重新渲染：

1. **组件自身的响应式数据变化**
2. **父组件传递的 props 变化**
3. **父组件重新渲染**（默认情况）

```vue
<script setup>
import { ref } from "vue";

const count = ref(0); // 响应式数据
const name = "static"; // 非响应式，变化不触发渲染

function increment() {
  count.value++; // 触发重新渲染
}
</script>

<template>
  <div>{{ count }}</div>
</template>
```

---

## 问题 2：只有"使用的"数据变化才触发渲染

关键点：只有**模板中实际使用**的响应式数据变化才会触发渲染。

```vue
<script setup>
import { ref, reactive } from "vue";

const used = ref(0); // 模板中使用
const unused = ref(0); // 模板中未使用
const state = reactive({
  visible: true, // 模板中使用
  internal: "data", // 模板中未使用
});
</script>

<template>
  <div>{{ used }}</div>
  <div v-if="state.visible">显示</div>
</template>
```

```javascript
// 触发渲染
used.value++;
state.visible = false;

// 不触发渲染（模板未使用）
unused.value++;
state.internal = "new";
```

---

## 问题 3：父组件渲染对子组件的影响

### 默认行为

父组件重新渲染时，子组件**默认也会重新渲染**：

```vue
<!-- Parent.vue -->
<script setup>
import { ref } from "vue";
import Child from "./Child.vue";

const parentCount = ref(0);
</script>

<template>
  <div>{{ parentCount }}</div>
  <!-- parentCount 变化时，Child 也会重新渲染 -->
  <Child />
</template>
```

### 为什么？

Vue 需要重新执行父组件的渲染函数来生成新的虚拟 DOM，这个过程中会重新创建子组件的 VNode。

---

## 问题 4：如何避免不必要的子组件渲染？

### 方法一：v-memo

```vue
<template>
  <!-- 只有 item.id 变化时才重新渲染 -->
  <div v-for="item in list" :key="item.id" v-memo="[item.id]">
    {{ item.name }}
  </div>
</template>
```

### 方法二：使用 computed 缓存 props

```vue
<!-- Child.vue -->
<script setup>
const props = defineProps(["data"]);

// 缓存计算结果，避免重复计算
const processedData = computed(() => {
  return expensiveProcess(props.data);
});
</script>
```

### 方法三：合理拆分组件

```vue
<!-- 将频繁更新的部分拆分出去 -->
<template>
  <div>
    <StaticPart />
    <!-- 不受 count 影响 -->
    <DynamicPart :count="count" />
    <!-- 只有这部分更新 -->
  </div>
</template>
```

---

## 问题 5：强制触发渲染

### $forceUpdate

```javascript
// Options API
this.$forceUpdate();

// Composition API
import { getCurrentInstance } from "vue";

const instance = getCurrentInstance();
instance.proxy.$forceUpdate();
```

### 通过 key 强制重新创建

```vue
<template>
  <!-- 改变 key 会销毁并重新创建组件 -->
  <Child :key="componentKey" />
</template>

<script setup>
const componentKey = ref(0);

function resetComponent() {
  componentKey.value++; // 组件会被销毁并重新创建
}
</script>
```

---

## 问题 6：渲染流程详解

```
响应式数据变化
    ↓
触发 trigger
    ↓
调度器收集需要更新的组件
    ↓
下一个微任务中批量更新
    ↓
执行组件的渲染函数
    ↓
生成新的虚拟 DOM
    ↓
Diff 对比新旧虚拟 DOM
    ↓
更新真实 DOM
```

### 批量更新

```javascript
const count = ref(0);

// 多次修改只触发一次渲染
count.value++;
count.value++;
count.value++;
// Vue 会在微任务中批量处理，只渲染一次
```

### nextTick

```javascript
import { nextTick } from "vue";

count.value++;

// DOM 还未更新
console.log(document.querySelector(".count").textContent); // 旧值

await nextTick();
// DOM 已更新
console.log(document.querySelector(".count").textContent); // 新值
```

---

## 问题 7：调试渲染

### onRenderTracked / onRenderTriggered

```vue
<script setup>
import { onRenderTracked, onRenderTriggered } from "vue";

onRenderTracked((event) => {
  console.log("依赖被追踪:", event);
});

onRenderTriggered((event) => {
  console.log("触发渲染:", event);
  // event.key: 触发更新的属性
  // event.target: 触发更新的对象
});
</script>
```

### Vue DevTools

使用 Vue DevTools 的 Timeline 功能可以查看组件渲染的时间线和原因。

## 延伸阅读

- [Vue 官方文档 - 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 官方文档 - 性能优化](https://cn.vuejs.org/guide/best-practices/performance.html)
