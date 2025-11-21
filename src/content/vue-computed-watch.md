---
title: Vue computed 和 watch 有啥区别
category: Vue
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 Vue 中 computed 和 watch 的区别、使用场景和实现原理，掌握如何选择合适的响应式 API 来处理数据变化。
tags:
  - Vue
  - computed
  - watch
  - 响应式
estimatedTime: 20 分钟
keywords:
  - Vue computed
  - Vue watch
  - 响应式系统
  - 计算属性
highlight: 掌握 computed 和 watch 的核心区别，理解何时使用哪个 API
order: 11
---

## 问题 1：computed 和 watch 的基本区别是什么？

### 核心区别

```vue
<script setup>
import { ref, computed, watch } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// computed：计算属性，基于依赖自动计算
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// watch：侦听器，监听数据变化执行副作用
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(`Name changed to: ${newFirst} ${newLast}`);
});
</script>
```

### 主要差异

| 特性 | computed | watch |
|------|----------|-------|
| **用途** | 计算派生数据 | 执行副作用 |
| **返回值** | 有返回值 | 无返回值 |
| **缓存** | 有缓存 | 无缓存 |
| **执行时机** | 依赖变化时 | 数据变化时 |
| **使用场景** | 模板中使用的派生数据 | 异步操作、DOM 操作等 |

---

## 问题 2：computed 的特点和使用场景是什么？

### computed 的特点

```vue
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);

// 1. 自动依赖收集
const doubleCount = computed(() => {
  // Vue 会自动追踪 count 的依赖
  return count.value * 2;
});

// 2. 缓存机制
const expensiveComputed = computed(() => {
  console.log('计算执行'); // 只在依赖变化时执行
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += count.value;
  }
  return result;
});

// 多次访问不会重新计算
console.log(expensiveComputed.value); // 执行计算
console.log(expensiveComputed.value); // 使用缓存
console.log(expensiveComputed.value); // 使用缓存

// 3. 只读（默认）
// doubleCount.value = 10; // ❌ 错误：不能直接赋值
</script>
```

### 可写的 computed

```vue
<script setup>
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// ✅ 可写的 computed
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`;
  },
  set(newValue) {
    const [first, last] = newValue.split(' ');
    firstName.value = first;
    lastName.value = last;
  }
});

// 使用
fullName.value = 'Jane Smith';
console.log(firstName.value); // 'Jane'
console.log(lastName.value);  // 'Smith'
</script>
```

### computed 的使用场景

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([
  { id: 1, name: 'Apple', price: 10, quantity: 2 },
  { id: 2, name: 'Banana', price: 5, quantity: 3 },
  { id: 3, name: 'Orange', price: 8, quantity: 1 }
]);

// 场景 1：过滤列表
const searchText = ref('');
const filteredItems = computed(() => {
  return items.value.filter(item =>
    item.name.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// 场景 2：排序列表
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => a.price - b.price);
});

// 场景 3：计算总价
const totalPrice = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
});

// 场景 4：格式化数据
const formattedTotal = computed(() => {
  return `$${totalPrice.value.toFixed(2)}`;
});

// 场景 5：组合多个 computed
const displayText = computed(() => {
  return `共 ${filteredItems.value.length} 件商品，总价 ${formattedTotal.value}`;
});
</script>

<template>
  <div>
    <input v-model="searchText" placeholder="搜索商品" />
    <p>{{ displayText }}</p>
    <ul>
      <li v-for="item in filteredItems" :key="item.id">
        {{ item.name }} - ${{ item.price }} x {{ item.quantity }}
      </li>
    </ul>
  </div>
</template>
```

---

## 问题 3：watch 的特点和使用场景是什么？

### watch 的基本用法

```vue
<script setup>
import { ref, watch } from 'vue';

const count = ref(0);

// 1. 监听单个 ref
watch(count, (newValue, oldValue) => {
  console.log(`count changed from ${oldValue} to ${newValue}`);
});

// 2. 监听多个源
const firstName = ref('John');
const lastName = ref('Doe');

watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log(`Name changed from ${oldFirst} ${oldLast} to ${newFirst} ${newLast}`);
});

// 3. 监听 reactive 对象的属性
import { reactive } from 'vue';

const user = reactive({
  name: 'John',
  age: 25
});

// 使用 getter 函数
watch(
  () => user.name,
  (newName, oldName) => {
    console.log(`Name changed from ${oldName} to ${newName}`);
  }
);

// 4. 深度监听
const state = reactive({
  nested: {
    count: 0
  }
});

watch(
  () => state.nested,
  (newValue, oldValue) => {
    console.log('Nested changed');
  },
  { deep: true } // 深度监听
);
</script>
```

### watch 的选项

```vue
<script setup>
import { ref, watch } from 'vue';

const count = ref(0);

watch(
  count,
  (newValue, oldValue) => {
    console.log('Count changed');
  },
  {
    // 立即执行一次
    immediate: true,
    
    // 深度监听
    deep: true,
    
    // 在组件更新前调用
    flush: 'pre', // 'pre' | 'post' | 'sync'
    
    // 调试用
    onTrack(e) {
      console.log('依赖被追踪', e);
    },
    onTrigger(e) {
      console.log('侦听器被触发', e);
    }
  }
);
</script>
```

### watch 的使用场景

```vue
<script setup>
import { ref, watch } from 'vue';

const searchText = ref('');
const results = ref([]);
const loading = ref(false);

// 场景 1：异步操作
watch(searchText, async (newValue) => {
  if (!newValue) {
    results.value = [];
    return;
  }
  
  loading.value = true;
  try {
    const response = await fetch(`/api/search?q=${newValue}`);
    results.value = await response.json();
  } finally {
    loading.value = false;
  }
});

// 场景 2：防抖
import { watchDebounced } from '@vueuse/core';

watchDebounced(
  searchText,
  async (newValue) => {
    // 延迟 500ms 执行
    await fetchResults(newValue);
  },
  { debounce: 500 }
);

// 场景 3：同步到 localStorage
const settings = ref({
  theme: 'dark',
  language: 'zh-CN'
});

watch(
  settings,
  (newSettings) => {
    localStorage.setItem('settings', JSON.stringify(newSettings));
  },
  { deep: true }
);

// 场景 4：路由变化
import { useRoute } from 'vue-router';

const route = useRoute();

watch(
  () => route.params.id,
  async (newId) => {
    // 加载新数据
    await loadData(newId);
  }
);

// 场景 5：停止监听
const stop = watch(count, () => {
  console.log('Count changed');
});

// 在某个条件下停止监听
if (someCondition) {
  stop();
}
</script>
```

---

## 问题 4：watchEffect 是什么？

### watchEffect 的特点

`watchEffect` 会自动追踪依赖，立即执行一次。

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const count = ref(0);
const doubled = ref(0);

// ✅ watchEffect：自动追踪依赖
watchEffect(() => {
  // 自动追踪 count 的依赖
  doubled.value = count.value * 2;
  console.log(`Count is ${count.value}`);
});

// 等价于：
watch(
  count,
  () => {
    doubled.value = count.value * 2;
    console.log(`Count is ${count.value}`);
  },
  { immediate: true }
);
</script>
```

### watchEffect vs watch

```vue
<script setup>
import { ref, watch, watchEffect } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// watch：需要明确指定监听源
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(`${newFirst} ${newLast}`);
});

// watchEffect：自动追踪依赖
watchEffect(() => {
  // 自动追踪 firstName 和 lastName
  console.log(`${firstName.value} ${lastName.value}`);
});

// watchEffect 的优势：
// 1. 不需要明确指定监听源
// 2. 代码更简洁
// 3. 自动追踪所有依赖

// watch 的优势：
// 1. 可以访问旧值
// 2. 更明确的依赖关系
// 3. 可以懒执行（不设置 immediate）
</script>
```

### watchEffect 的清理

```vue
<script setup>
import { ref, watchEffect } from 'vue';

const id = ref(1);

watchEffect((onCleanup) => {
  // 执行异步操作
  const controller = new AbortController();
  
  fetch(`/api/data/${id.value}`, {
    signal: controller.signal
  }).then(response => {
    // 处理响应
  });
  
  // 注册清理函数
  onCleanup(() => {
    // 在下次执行前或组件卸载时调用
    controller.abort();
  });
});
</script>
```

---

## 问题 5：如何选择使用 computed 还是 watch？

### 选择指南

```vue
<script setup>
import { ref, computed, watch } from 'vue';

const price = ref(100);
const quantity = ref(2);

// ✅ 使用 computed：计算派生数据
const total = computed(() => {
  return price.value * quantity.value;
});

// ❌ 不要用 watch 做这个
const total2 = ref(0);
watch([price, quantity], () => {
  total2.value = price.value * quantity.value;
});

// ✅ 使用 watch：执行副作用
watch(total, (newTotal) => {
  // 发送分析数据
  analytics.track('total_changed', { total: newTotal });
  
  // 保存到 localStorage
  localStorage.setItem('cart_total', newTotal);
});

// ❌ 不要用 computed 做这个
const totalWithSideEffect = computed(() => {
  const result = price.value * quantity.value;
  // ❌ 不要在 computed 中执行副作用
  analytics.track('total_changed', { total: result });
  return result;
});
</script>
```

### 决策流程

```javascript
// 选择 computed 的情况：
// 1. 需要在模板中使用的派生数据
// 2. 基于其他数据计算得出
// 3. 需要缓存计算结果
// 4. 纯函数，无副作用

// 选择 watch 的情况：
// 1. 需要执行异步操作
// 2. 需要访问旧值和新值
// 3. 需要执行副作用（API 调用、DOM 操作等）
// 4. 需要在数据变化时执行某些操作

// 选择 watchEffect 的情况：
// 1. 自动追踪依赖更方便
// 2. 不需要访问旧值
// 3. 需要立即执行
```

---

## 总结

**核心区别**：

### 1. computed

- **用途**：计算派生数据
- **特点**：有缓存、自动依赖追踪、默认只读
- **场景**：过滤、排序、格式化、计算总和等

### 2. watch

- **用途**：执行副作用
- **特点**：无缓存、可访问新旧值、可配置选项
- **场景**：异步操作、localStorage、路由监听等

### 3. watchEffect

- **用途**：自动追踪依赖的副作用
- **特点**：自动依赖追踪、立即执行、无旧值
- **场景**：简单的副作用、不需要旧值的场景

### 4. 选择建议

- 模板中的派生数据 → computed
- 异步操作 → watch
- 简单的副作用 → watchEffect
- 需要旧值 → watch
- 需要缓存 → computed

## 延伸阅读

- [Vue 官方文档 - computed](https://cn.vuejs.org/guide/essentials/computed.html)
- [Vue 官方文档 - watch](https://cn.vuejs.org/guide/essentials/watchers.html)
- [Vue 官方文档 - watchEffect](https://cn.vuejs.org/api/reactivity-core.html#watcheffect)
- [VueUse - 实用的组合式函数集合](https://vueuse.org/)
