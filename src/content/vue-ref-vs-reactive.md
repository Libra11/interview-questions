---
title: Vue ref 和 reactive 有何区别？
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  对比 Vue 的 ref 和 reactive 两个响应式 API，分析它们在使用方式、适用场景和底层实现上的差异。
tags:
  - Vue
  - ref
  - reactive
  - Reactivity
estimatedTime: 15 分钟
keywords:
  - ref vs reactive
  - vue reactivity
  - .value
  - proxy
highlight: ref 适用于所有类型且需要 .value 访问，reactive 只适用于对象类型但访问更简洁。实践中推荐优先使用 ref。
order: 153
---

## 问题 1：核心区别对比

| 特性 | ref | reactive |
|------|-----|----------|
| **支持类型** | 所有类型（原始值 + 对象） | 仅对象类型 |
| **访问方式** | 需要 `.value` | 直接访问属性 |
| **替换整个对象** | ✅ 支持 | ❌ 不支持 |
| **解构** | ✅ 不丢失响应性 | ❌ 丢失响应性 |
| **底层实现** | 对象包装 + Proxy（对象类型） | Proxy |
| **模板中** | 自动解包，不需要 `.value` | 直接使用 |

---

## 问题 2：基本用法对比

### ref

```javascript
import { ref } from 'vue'

// 原始值
const count = ref(0)
console.log(count.value) // 0
count.value++

// 对象
const user = ref({ name: 'Vue' })
console.log(user.value.name) // 'Vue'
user.value = { name: 'React' } // ✅ 可以替换整个对象
```

### reactive

```javascript
import { reactive } from 'vue'

// 只能用于对象
const state = reactive({
  count: 0,
  user: { name: 'Vue' }
})

console.log(state.count) // 0（不需要 .value）
state.count++

// ❌ 不能替换整个对象
// state = reactive({ count: 1 }) // 会破坏响应性
```

---

## 问题 3：模板中的使用

### ref（自动解包）

```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <!-- 模板中自动解包，不需要 .value -->
  <div>{{ count }}</div>
  <button @click="count++">Increment</button>
</template>
```

### reactive

```vue
<script setup>
import { reactive } from 'vue'
const state = reactive({ count: 0 })
</script>

<template>
  <!-- 直接访问属性 -->
  <div>{{ state.count }}</div>
  <button @click="state.count++">Increment</button>
</template>
```

---

## 问题 4：解构的差异

### ref（不丢失响应性）

```javascript
import { ref } from 'vue'

const count = ref(0)
const name = ref('Vue')

// ✅ 解构后仍然是 ref，保持响应性
const { value: countValue } = count
// 但通常我们不这样做，直接使用 count.value
```

### reactive（丢失响应性）

```javascript
import { reactive, toRefs } from 'vue'

const state = reactive({
  count: 0,
  name: 'Vue'
})

// ❌ 解构后丢失响应性
let { count, name } = state
count++ // 不会触发更新

// ✅ 使用 toRefs 保持响应性
const { count, name } = toRefs(state)
count.value++ // 触发更新
```

---

## 问题 5：底层实现差异

### ref 的实现

```javascript
// 简化版
function ref(value) {
  return {
    _isRef: true,
    get value() {
      track(this, 'value')
      return this._value
    },
    set value(newValue) {
      this._value = newValue
      trigger(this, 'value')
    }
  }
}
```

ref 本质上是一个包装对象，通过 getter/setter 拦截 `.value` 的访问。

### reactive 的实现

```javascript
// 简化版
function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      track(target, key)
      return target[key]
    },
    set(target, key, value) {
      target[key] = value
      trigger(target, key)
      return true
    }
  })
}
```

reactive 直接使用 Proxy 代理整个对象。

---

## 问题 6：使用场景建议

### 使用 ref 的场景

1. **原始值类型**
   ```javascript
   const count = ref(0)
   const message = ref('Hello')
   const isActive = ref(true)
   ```

2. **需要替换整个对象**
   ```javascript
   const user = ref({ name: 'Vue' })
   user.value = { name: 'React' } // ✅ 可以
   ```

3. **组合式函数返回值**
   ```javascript
   function useCounter() {
     const count = ref(0)
     return { count } // 解构后仍保持响应性
   }
   ```

### 使用 reactive 的场景

1. **复杂的对象结构**
   ```javascript
   const state = reactive({
     user: { name: 'Vue', age: 3 },
     settings: { theme: 'dark' },
     todos: []
   })
   ```

2. **不需要替换整个对象**
   ```javascript
   const form = reactive({
     username: '',
     password: ''
   })
   // 只修改属性，不替换整个对象
   ```

---

## 问题 7：最佳实践

### 推荐：统一使用 ref

很多开发者（包括 Vue 团队成员）推荐**统一使用 ref**，原因：

1. **一致性**：所有数据都用 `.value` 访问，不需要记忆哪些需要 `.value`。
2. **避免陷阱**：不会遇到 reactive 的解构和替换问题。
3. **TypeScript 友好**：类型推导更准确。

```javascript
// 统一使用 ref
const count = ref(0)
const user = ref({ name: 'Vue' })
const list = ref([1, 2, 3])

// 访问方式一致
count.value++
user.value.name = 'React'
list.value.push(4)
```

### 混合使用

如果你喜欢 reactive 的简洁性，可以这样：

```javascript
const state = reactive({
  count: 0,
  user: { name: 'Vue' }
})

// 需要单独导出时，使用 toRef
const count = toRef(state, 'count')
```

## 总结

**核心概念总结**：

### 1. 主要区别
- **ref**：万能，需要 `.value`
- **reactive**：仅对象，直接访问

### 2. 选择建议
- 原始值：必须用 `ref`
- 对象：两者都可以，推荐 `ref`
- 复杂嵌套对象：`reactive` 更简洁

### 3. 最佳实践
优先使用 `ref`，除非你有明确的理由使用 `reactive`。

## 延伸阅读

- [Vue 官方文档 - ref vs reactive](https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html#ref-vs-reactive)
- [Vue 官方风格指南 - 响应式 API 选择](https://cn.vuejs.org/style-guide/)
