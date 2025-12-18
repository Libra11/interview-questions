---
title: Vue watch 和 watchEffect 场景上有何区别？
category: Vue
difficulty: 中级
updatedAt: 2025-11-20
summary: >-
  对比 Vue 的 watch 和 watchEffect 两个侦听器 API，分析它们在依赖追踪、执行时机和使用场景上的差异。
tags:
  - Vue
  - Watch
  - WatchEffect
  - Reactivity
estimatedTime: 15 分钟
keywords:
  - watch vs watchEffect
  - vue watchers
  - reactive dependencies
  - lazy evaluation
highlight: watch 需要显式指定依赖且默认惰性执行，适合需要访问旧值或精确控制依赖的场景；watchEffect 自动追踪依赖且立即执行，适合简单的副作用逻辑。
order: 427
---

## 问题 1：watch 和 watchEffect 的核心区别是什么？

| 特性 | watch | watchEffect |
|------|-------|-------------|
| **依赖声明** | 显式指定 | 自动追踪 |
| **执行时机** | 惰性（默认） | 立即执行 |
| **访问旧值** | 可以 | 不可以 |
| **精确控制** | 高 | 低 |

---

## 问题 2：watch 的特点和使用场景

### 特点

1. **显式依赖**：必须明确指定要侦听的数据源。
2. **惰性执行**：默认只在依赖变化时执行（可通过 `immediate: true` 改变）。
3. **访问新旧值**：回调函数可以接收新值和旧值。

### 基本用法

```javascript
import { ref, watch } from 'vue'

const count = ref(0)

// 侦听单个 ref
watch(count, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// 侦听多个数据源
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  // ...
})

// 侦听响应式对象的属性（需要用 getter 函数）
watch(
  () => state.count,
  (newVal, oldVal) => {
    // ...
  }
)
```

### 适用场景

1. **需要访问旧值**：例如比对前后变化。
2. **需要精确控制依赖**：只关心特定数据的变化。
3. **需要惰性执行**：只在数据变化时才执行，初始化时不执行。
4. **深度侦听对象**：使用 `deep: true` 选项。

```javascript
watch(
  () => state.user,
  (newUser, oldUser) => {
    console.log('User changed')
  },
  { deep: true }
)
```

---

## 问题 3：watchEffect 的特点和使用场景

### 特点

1. **自动依赖追踪**：在回调中访问的所有响应式数据都会被自动追踪。
2. **立即执行**：组件初始化时会立即执行一次。
3. **无法访问旧值**：只关注当前状态。

### 基本用法

```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const name = ref('Vue')

watchEffect(() => {
  // 自动追踪 count 和 name
  console.log(`${name.value}: ${count.value}`)
})
```

### 适用场景

1. **简单的副作用**：不需要旧值，只需要根据当前状态执行操作。
2. **依赖关系复杂**：依赖多个数据源，手动列举麻烦。
3. **需要立即执行**：初始化时就需要执行逻辑。

```javascript
// 示例：自动同步到 localStorage
watchEffect(() => {
  localStorage.setItem('user', JSON.stringify(user.value))
})
```

---

## 问题 4：实际对比示例

### 场景：搜索功能

**使用 watch（更精确）**：
```javascript
const searchQuery = ref('')
const searchResults = ref([])

watch(searchQuery, async (newQuery, oldQuery) => {
  // 只在 searchQuery 变化时触发
  // 可以对比新旧值，避免重复请求
  if (newQuery !== oldQuery && newQuery.length > 2) {
    searchResults.value = await fetchResults(newQuery)
  }
})
```

**使用 watchEffect（更简洁）**：
```javascript
watchEffect(async () => {
  // 自动追踪 searchQuery
  if (searchQuery.value.length > 2) {
    searchResults.value = await fetchResults(searchQuery.value)
  }
})
```

## 总结

**核心概念总结**：

### 1. 选择 watch 的场景
- 需要访问旧值进行对比。
- 需要精确控制侦听的数据源。
- 需要惰性执行（不立即执行）。

### 2. 选择 watchEffect 的场景
- 简单的副作用逻辑。
- 依赖多个响应式数据，自动追踪更方便。
- 需要立即执行。

### 3. 经验法则
如果不确定用哪个，优先考虑 `watchEffect`，它更简洁。只有在需要旧值或精确控制时才用 `watch`。

## 延伸阅读

- [Vue 官方文档 - watch vs watchEffect](https://cn.vuejs.org/guide/essentials/watchers.html#watch-vs-watcheffect)
