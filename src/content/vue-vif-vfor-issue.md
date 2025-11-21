---
title: Vue 中为何不要把 v-if 和 v-for 同时用在同一个元素上，原理是什么
category: Vue
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 Vue 中 v-if 和 v-for 同时使用的问题，掌握指令优先级、性能影响和正确的替代方案。
tags:
  - Vue
  - v-if
  - v-for
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - v-if v-for
  - Vue 指令
  - 性能优化
  - 最佳实践
highlight: 理解 v-if 和 v-for 的优先级问题，掌握正确的使用方式
order: 16
---

## 问题 1：为什么不推荐 v-if 和 v-for 同时使用？

### Vue 2 和 Vue 3 的区别

```vue
<!-- Vue 2 中：v-for 优先级高于 v-if -->
<template>
  <div>
    <!-- ❌ Vue 2：每次都会遍历整个列表，然后再判断 -->
    <li v-for="user in users" v-if="user.isActive" :key="user.id">
      {{ user.name }}
    </li>
  </div>
</template>

<!-- Vue 3 中：v-if 优先级高于 v-for -->
<template>
  <div>
    <!-- ❌ Vue 3：v-if 无法访问 v-for 的变量 -->
    <li v-for="user in users" v-if="user.isActive" :key="user.id">
      {{ user.name }}
    </li>
    <!-- 错误：user is not defined -->
  </div>
</template>
```

### 问题的本质

```vue
<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'Alice', isActive: true },
  { id: 2, name: 'Bob', isActive: false },
  { id: 3, name: 'Charlie', isActive: true },
  { id: 4, name: 'David', isActive: false }
]);
</script>

<template>
  <!-- ❌ 问题 1：性能浪费（Vue 2） -->
  <!-- 每次渲染都会遍历所有 4 个用户，即使只显示 2 个 -->
  <li v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </li>
  
  <!-- ❌ 问题 2：无法访问变量（Vue 3） -->
  <!-- v-if 先执行，此时 user 还不存在 -->
  <li v-for="user in users" v-if="user.isActive" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

---

## 问题 2：正确的替代方案有哪些？

### 方案 1：使用 computed 过滤数据

```vue
<script setup>
import { ref, computed } from 'vue';

const users = ref([
  { id: 1, name: 'Alice', isActive: true },
  { id: 2, name: 'Bob', isActive: false },
  { id: 3, name: 'Charlie', isActive: true },
  { id: 4, name: 'David', isActive: false }
]);

// ✅ 使用 computed 预先过滤
const activeUsers = computed(() => {
  return users.value.filter(user => user.isActive);
});
</script>

<template>
  <!-- ✅ 只遍历需要显示的数据 -->
  <li v-for="user in activeUsers" :key="user.id">
    {{ user.name }}
  </li>
</template>
```

### 方案 2：使用 template 标签

```vue
<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'Alice', isActive: true },
  { id: 2, name: 'Bob', isActive: false },
  { id: 3, name: 'Charlie', isActive: true }
]);

const showList = ref(true);
</script>

<template>
  <!-- ✅ 将 v-if 移到外层 template -->
  <template v-if="showList">
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </template>
  
  <!-- 或者使用 div 等容器元素 -->
  <div v-if="showList">
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </div>
</template>
```

### 方案 3：在 v-for 内部使用 v-if

```vue
<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'Alice', isActive: true },
  { id: 2, name: 'Bob', isActive: false },
  { id: 3, name: 'Charlie', isActive: true }
]);
</script>

<template>
  <!-- ✅ v-for 在外层，v-if 在内层 -->
  <li v-for="user in users" :key="user.id">
    <div v-if="user.isActive">
      {{ user.name }}
    </div>
  </li>
  
  <!-- 注意：这种方式会渲染空的 li 元素 -->
  <!-- 如果需要完全不渲染，还是推荐方案 1 -->
</template>
```

---

## 问题 3：不同场景的最佳实践是什么？

### 场景 1：根据属性过滤列表

```vue
<script setup>
import { ref, computed } from 'vue';

const todos = ref([
  { id: 1, text: 'Learn Vue', completed: false },
  { id: 2, text: 'Build app', completed: true },
  { id: 3, text: 'Deploy', completed: false }
]);

const filter = ref('all'); // 'all' | 'active' | 'completed'

// ✅ 使用 computed 过滤
const filteredTodos = computed(() => {
  switch (filter.value) {
    case 'active':
      return todos.value.filter(todo => !todo.completed);
    case 'completed':
      return todos.value.filter(todo => todo.completed);
    default:
      return todos.value;
  }
});
</script>

<template>
  <div>
    <button @click="filter = 'all'">All</button>
    <button @click="filter = 'active'">Active</button>
    <button @click="filter = 'completed'">Completed</button>
    
    <ul>
      <li v-for="todo in filteredTodos" :key="todo.id">
        {{ todo.text }}
      </li>
    </ul>
  </div>
</template>
```

### 场景 2：条件渲染整个列表

```vue
<script setup>
import { ref } from 'vue';

const users = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
]);

const showUsers = ref(true);
const hasPermission = ref(true);
</script>

<template>
  <!-- ✅ 条件在外层 -->
  <div v-if="showUsers && hasPermission">
    <h3>User List</h3>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
  
  <!-- 或使用 template -->
  <template v-if="showUsers && hasPermission">
    <h3>User List</h3>
    <li v-for="user in users" :key="user.id">
      {{ user.name }}
    </li>
  </template>
</template>
```

### 场景 3：复杂的过滤逻辑

```vue
<script setup>
import { ref, computed } from 'vue';

const products = ref([
  { id: 1, name: 'Laptop', price: 1000, inStock: true, category: 'electronics' },
  { id: 2, name: 'Phone', price: 500, inStock: false, category: 'electronics' },
  { id: 3, name: 'Book', price: 20, inStock: true, category: 'books' }
]);

const filters = ref({
  minPrice: 0,
  maxPrice: Infinity,
  inStockOnly: false,
  category: null
});

// ✅ 使用 computed 处理复杂过滤
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    // 价格过滤
    if (product.price < filters.value.minPrice) return false;
    if (product.price > filters.value.maxPrice) return false;
    
    // 库存过滤
    if (filters.value.inStockOnly && !product.inStock) return false;
    
    // 分类过滤
    if (filters.value.category && product.category !== filters.value.category) {
      return false;
    }
    
    return true;
  });
});
</script>

<template>
  <div>
    <!-- 过滤器控件 -->
    <div class="filters">
      <input v-model.number="filters.minPrice" placeholder="Min Price" />
      <input v-model.number="filters.maxPrice" placeholder="Max Price" />
      <label>
        <input type="checkbox" v-model="filters.inStockOnly" />
        In Stock Only
      </label>
      <select v-model="filters.category">
        <option :value="null">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>
    </div>
    
    <!-- 产品列表 -->
    <ul>
      <li v-for="product in filteredProducts" :key="product.id">
        {{ product.name }} - ${{ product.price }}
        <span v-if="!product.inStock">(Out of Stock)</span>
      </li>
    </ul>
  </div>
</template>
```

---

## 问题 4：性能对比如何？

### 性能分析

```vue
<script setup>
import { ref, computed } from 'vue';

// 假设有 1000 条数据
const items = ref(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    isActive: i % 2 === 0 // 50% 的数据是 active
  }))
);

// ❌ 方案 1：v-for + v-if（Vue 2 行为）
// 每次渲染都遍历 1000 次，然后过滤掉 500 个
// 性能：O(n) = 1000 次遍历

// ✅ 方案 2：computed 过滤
const activeItems = computed(() => {
  return items.value.filter(item => item.isActive);
});
// 性能：O(n) = 1000 次过滤（只在数据变化时）
//       然后只渲染 500 个元素
</script>

<template>
  <!-- ❌ 差的性能 -->
  <div v-for="item in items" v-if="item.isActive" :key="item.id">
    {{ item.name }}
  </div>
  
  <!-- ✅ 好的性能 -->
  <div v-for="item in activeItems" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### 实际性能测试

```vue
<script setup>
import { ref, computed } from 'vue';

const largeList = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    value: Math.random(),
    show: Math.random() > 0.5
  }))
);

// 方案 1：computed 过滤（推荐）
const filteredList = computed(() => {
  console.time('computed filter');
  const result = largeList.value.filter(item => item.show);
  console.timeEnd('computed filter');
  return result;
});

// 方案 2：在模板中过滤（不推荐）
// 每次重新渲染都会执行过滤逻辑
</script>

<template>
  <!-- ✅ 推荐：只遍历过滤后的数据 -->
  <div v-for="item in filteredList" :key="item.id">
    {{ item.value }}
  </div>
  
  <!-- ❌ 不推荐：每次都遍历全部数据 -->
  <template v-for="item in largeList" :key="item.id">
    <div v-if="item.show">
      {{ item.value }}
    </div>
  </template>
</template>
```

---

## 问题 5：ESLint 规则和最佳实践

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:vue/vue3-recommended'
  ],
  rules: {
    // Vue 3
    'vue/no-use-v-if-with-v-for': 'error',
    
    // Vue 2
    'vue/no-confusing-v-for-v-if': 'error'
  }
};
```

### 最佳实践总结

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([...]);

// ✅ 最佳实践 1：使用 computed 过滤
const filteredItems = computed(() => {
  return items.value.filter(item => item.condition);
});

// ✅ 最佳实践 2：使用方法过滤（如果需要参数）
const filterItems = (condition) => {
  return items.value.filter(item => item.type === condition);
};
</script>

<template>
  <!-- ✅ 推荐做法 -->
  
  <!-- 1. 使用 computed -->
  <div v-for="item in filteredItems" :key="item.id">
    {{ item.name }}
  </div>
  
  <!-- 2. 外层使用 v-if -->
  <template v-if="showList">
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </template>
  
  <!-- 3. 内层使用 v-if（如果必须） -->
  <div v-for="item in items" :key="item.id">
    <span v-if="item.condition">{{ item.name }}</span>
  </div>
  
  <!-- ❌ 避免的做法 -->
  
  <!-- 不要在同一元素上使用 -->
  <div v-for="item in items" v-if="item.condition" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

---

## 总结

**核心要点**：

### 1. 问题原因

- **Vue 2**：v-for 优先级高，导致性能浪费
- **Vue 3**：v-if 优先级高，导致无法访问变量
- 两者同时使用会产生歧义和问题

### 2. 解决方案

- **首选**：使用 computed 过滤数据
- **次选**：将 v-if 移到外层容器
- **备选**：在 v-for 内部使用 v-if

### 3. 性能影响

- computed 过滤：只在数据变化时执行
- 模板过滤：每次渲染都执行
- 推荐使用 computed 提升性能

### 4. 最佳实践

- 使用 ESLint 规则检查
- 优先使用 computed
- 保持模板简洁
- 避免复杂的模板逻辑

## 延伸阅读

- [Vue 官方文档 - 列表渲染](https://cn.vuejs.org/guide/essentials/list.html)
- [Vue 官方文档 - 条件渲染](https://cn.vuejs.org/guide/essentials/conditional.html)
- [Vue 风格指南 - 避免 v-if 和 v-for 同时使用](https://cn.vuejs.org/style-guide/rules-essential.html#avoid-v-if-with-v-for)
- [ESLint Plugin Vue](https://eslint.vuejs.org/)
