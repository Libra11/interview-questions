---
title: 如何减少组件重新渲染？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue3 中减少不必要组件渲染的技巧和最佳实践。
tags:
  - Vue
  - 性能优化
  - 渲染优化
  - 组件
estimatedTime: 12 分钟
keywords:
  - 减少渲染
  - 性能优化
  - v-memo
highlight: 通过合理的组件拆分、v-memo、computed 缓存等方式减少不必要的重新渲染。
order: 571
---

## 问题 1：理解渲染触发条件

组件重新渲染的触发条件：

1. **自身响应式数据变化**
2. **父组件重新渲染**
3. **props 变化**

```vue
<script setup>
const count = ref(0); // 变化会触发渲染
const unused = ref(0); // 模板未使用，变化不触发渲染
</script>

<template>
  <div>{{ count }}</div>
</template>
```

---

## 问题 2：使用 v-memo

`v-memo` 缓存模板子树，只有依赖变化时才重新渲染：

```vue
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
    <!-- 只有 item.selected 变化时才重新渲染 -->
    <ExpensiveComponent :data="item" />
  </div>
</template>
```

### 适用场景

```vue
<!-- 大型列表，只有选中状态变化 -->
<div
  v-for="item in items"
  :key="item.id"
  v-memo="[item.id === selectedId]"
  :class="{ selected: item.id === selectedId }"
>
  {{ item.name }}
</div>
```

---

## 问题 3：合理拆分组件

### 问题：父组件更新导致子组件不必要渲染

```vue
<!-- 不好：整个组件都会重新渲染 -->
<template>
  <div>
    <span>{{ frequentlyChanging }}</span>
    <HeavyComponent />
    <!-- 每次都重新渲染 -->
  </div>
</template>
```

### 解决：拆分组件

```vue
<!-- 好：拆分频繁更新的部分 -->
<template>
  <div>
    <FrequentUpdater />
    <!-- 独立组件 -->
    <HeavyComponent />
    <!-- 不受影响 -->
  </div>
</template>

<!-- FrequentUpdater.vue -->
<template>
  <span>{{ frequentlyChanging }}</span>
</template>
```

---

## 问题 4：使用 computed 缓存

```vue
<script setup>
const items = ref([...])
const filter = ref('')

// ❌ 每次渲染都重新计算
const filtered = items.value.filter(item =>
  item.name.includes(filter.value)
)

// ✅ 使用 computed 缓存
const filtered = computed(() =>
  items.value.filter(item => item.name.includes(filter.value))
)
</script>
```

### 避免在模板中进行复杂计算

```vue
<!-- ❌ 每次渲染都执行 -->
<template>
  <div v-for="item in items.filter((i) => i.active)">
    {{ item.name }}
  </div>
</template>

<!-- ✅ 使用 computed -->
<template>
  <div v-for="item in activeItems">
    {{ item.name }}
  </div>
</template>
```

---

## 问题 5：稳定的 props 引用

```vue
<script setup>
const items = ref([...])

// ❌ 每次渲染创建新对象
<ChildComponent :config="{ theme: 'dark' }" />

// ✅ 使用稳定引用
const config = { theme: 'dark' }
<ChildComponent :config="config" />

// ✅ 或使用 computed
const config = computed(() => ({ theme: theme.value }))
</script>
```

### 事件处理函数

```vue
<!-- ❌ 每次渲染创建新函数 -->
<button @click="() => handleClick(item.id)">Click</button>

<!-- ✅ 使用方法 -->
<button @click="handleClick(item.id)">Click</button>

<!-- ✅ 或缓存函数 -->
<script setup>
const handlers = computed(() =>
  items.value.map((item) => () => handleClick(item.id))
);
</script>
```

---

## 问题 6：使用 shallowRef / shallowReactive

```vue
<script setup>
// 深层响应式（默认）
const state = ref({ nested: { deep: { value: 1 } } });

// 浅层响应式（性能更好）
const state = shallowRef({ nested: { deep: { value: 1 } } });

// 只有替换整个对象才触发更新
state.value = { ...newState };
</script>
```

### 适用场景

```vue
<script setup>
// 大型不可变数据
const largeData = shallowRef(initialData);

// 更新时替换整个对象
function updateData(newData) {
  largeData.value = newData;
}
</script>
```

---

## 问题 7：虚拟列表

对于大型列表，使用虚拟滚动只渲染可见项：

```vue
<script setup>
import { useVirtualList } from "@vueuse/core";

const { list, containerProps, wrapperProps } = useVirtualList(items, {
  itemHeight: 50,
});
</script>

<template>
  <div v-bind="containerProps">
    <div v-bind="wrapperProps">
      <div v-for="item in list" :key="item.data.id">
        {{ item.data.name }}
      </div>
    </div>
  </div>
</template>
```

---

## 问题 8：调试渲染

```vue
<script setup>
import { onRenderTriggered, onRenderTracked } from "vue";

onRenderTriggered((event) => {
  console.log("渲染触发:", event);
});

onRenderTracked((event) => {
  console.log("依赖追踪:", event);
});
</script>
```

## 延伸阅读

- [Vue 官方文档 - 性能优化](https://cn.vuejs.org/guide/best-practices/performance.html)
- [VueUse - useVirtualList](https://vueuse.org/core/useVirtualList/)
