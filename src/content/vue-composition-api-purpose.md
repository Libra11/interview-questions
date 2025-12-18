---
title: Composition API 的设计目的是什么？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Composition API 诞生的背景和设计目标，掌握它如何解决 Options API 的痛点问题。
tags:
  - Vue
  - Composition API
  - 代码组织
  - 逻辑复用
estimatedTime: 15 分钟
keywords:
  - composition api
  - vue3 api
  - 逻辑复用
highlight: Composition API 的核心目的是解决逻辑复用困难和代码组织混乱两大问题。
order: 453
---

## 问题 1：Options API 有什么问题？

### 1. 逻辑分散

在 Options API 中，同一个功能的代码被分散到不同选项中：

```javascript
export default {
  data() {
    return {
      // 功能 A 的数据
      searchQuery: "",
      searchResults: [],
      // 功能 B 的数据
      sortOrder: "asc",
      sortField: "name",
    };
  },
  computed: {
    // 功能 A 的计算属性
    filteredResults() {
      /* ... */
    },
    // 功能 B 的计算属性
    sortedResults() {
      /* ... */
    },
  },
  methods: {
    // 功能 A 的方法
    search() {
      /* ... */
    },
    // 功能 B 的方法
    sort() {
      /* ... */
    },
  },
  watch: {
    // 功能 A 的监听
    searchQuery() {
      /* ... */
    },
  },
};
```

当组件变大时，理解和维护某个功能需要在不同选项间跳转。

### 2. 逻辑复用困难

Options API 的复用方案都有明显缺陷：

```javascript
// Mixins：命名冲突、来源不清
const searchMixin = {
  data() {
    return { query: "" };
  }, // 可能与组件冲突
  methods: { search() {} }, // 不知道方法来自哪里
};

// 高阶组件：props 来源不明、组件嵌套过深
```

---

## 问题 2：Composition API 如何解决这些问题？

### 1. 按功能组织代码

```javascript
// 使用 Composition API
import { ref, computed, watch } from 'vue'

export default {
  setup() {
    // 功能 A：搜索 - 所有相关代码放在一起
    const searchQuery = ref('')
    const searchResults = ref([])
    const filteredResults = computed(() => /* ... */)
    watch(searchQuery, () => /* ... */)
    function search() { /* ... */ }

    // 功能 B：排序 - 所有相关代码放在一起
    const sortOrder = ref('asc')
    const sortField = ref('name')
    const sortedResults = computed(() => /* ... */)
    function sort() { /* ... */ }

    return { /* ... */ }
  }
}
```

### 2. 轻松提取和复用逻辑

```javascript
// useSearch.js - 搜索功能封装
export function useSearch() {
  const query = ref('')
  const results = ref([])

  async function search() {
    results.value = await fetchResults(query.value)
  }

  return { query, results, search }
}

// useSort.js - 排序功能封装
export function useSort(items) {
  const sortOrder = ref('asc')

  const sorted = computed(() =>
    [...items.value].sort((a, b) => /* ... */)
  )

  return { sortOrder, sorted }
}

// 在组件中组合使用
export default {
  setup() {
    const { query, results, search } = useSearch()
    const { sortOrder, sorted } = useSort(results)

    return { query, sorted, search }
  }
}
```

---

## 问题 3：Composition API 的核心优势

### 1. 更好的类型推断

```typescript
// Options API 中 this 的类型推断困难
export default {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++; // this 类型复杂
    },
  },
};

// Composition API 天然支持 TypeScript
const count = ref(0); // Ref<number>
function increment() {
  count.value++; // 类型清晰
}
```

### 2. 更小的打包体积

```javascript
// Composition API 的函数可以被 tree-shaking
import { ref, computed } from "vue"; // 只打包用到的

// Options API 的选项无法被 tree-shaking
export default {
  data() {},
  computed: {}, // 即使不用也会被打包
  methods: {},
};
```

### 3. 更灵活的代码组织

```javascript
// 可以根据需要自由组织代码结构
setup() {
  // 可以使用条件逻辑
  const feature = useFeature()

  // 可以组合多个 composable
  const { data, loading } = useAsync(() => fetchData())

  // 可以在任意位置定义响应式数据
  const localState = ref(null)

  return { feature, data, loading, localState }
}
```

---

## 问题 4：什么时候使用 Composition API？

### 推荐使用的场景

1. **大型组件**：逻辑复杂，需要更好的代码组织
2. **需要复用逻辑**：多个组件共享相同功能
3. **TypeScript 项目**：需要更好的类型支持
4. **新项目**：Vue 3 的推荐方式

### Options API 仍然适用

1. **简单组件**：逻辑简单，Options API 更直观
2. **团队熟悉度**：团队更熟悉 Options API
3. **渐进式迁移**：可以在同一组件中混用两种 API

## 延伸阅读

- [Vue 官方文档 - Composition API FAQ](https://cn.vuejs.org/guide/extras/composition-api-faq.html)
- [Vue 官方文档 - 组合式函数](https://cn.vuejs.org/guide/reusability/composables.html)
