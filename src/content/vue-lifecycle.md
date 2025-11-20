---
title: Vue 生命周期钩子详解
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  全面介绍 Vue 组件的生命周期钩子，包括 Options API 和 Composition API 的对应关系，以及各个阶段的执行时机和常见用途。
tags:
  - Vue
  - Lifecycle
  - Hooks
  - Component
estimatedTime: 20 分钟
keywords:
  - vue lifecycle
  - onMounted
  - onUnmounted
  - beforeCreate
  - created
highlight: Vue 生命周期钩子让我们能在组件的不同阶段执行代码。Vue 3 在 Composition API 中提供了以 on 开头的组合式钩子函数。
order: 146
---

## 问题 1：Vue 3 有哪些生命周期钩子？

### Options API vs Composition API 对照表

| Options API | Composition API | 执行时机 |
|-------------|-----------------|---------|
| `beforeCreate` | - | 实例初始化之后，数据观测之前 |
| `created` | - | 实例创建完成，数据观测完成 |
| `beforeMount` | `onBeforeMount` | 挂载开始之前 |
| `mounted` | `onMounted` | 挂载完成后 |
| `beforeUpdate` | `onBeforeUpdate` | 数据更新时，DOM 更新前 |
| `updated` | `onUpdated` | DOM 更新完成后 |
| `beforeUnmount` | `onBeforeUnmount` | 卸载之前 |
| `unmounted` | `onUnmounted` | 卸载完成后 |
| `errorCaptured` | `onErrorCaptured` | 捕获子组件错误 |
| `activated` | `onActivated` | KeepAlive 组件激活时 |
| `deactivated` | `onDeactivated` | KeepAlive 组件停用时 |

**注意**：在 `<script setup>` 中，`beforeCreate` 和 `created` 被 `setup()` 本身替代，因为 `setup()` 在这两个钩子之间执行。

---

## 问题 2：各生命周期的常见用途

### 1. setup() / created
- 初始化响应式数据
- 调用 API 获取初始数据
- 设置事件监听（非 DOM）

```javascript
<script setup>
import { ref, onMounted } from 'vue'

// setup 中的代码相当于 created
const data = ref(null)
fetchData().then(res => data.value = res)
</script>
```

### 2. onMounted
- 访问 DOM 元素
- 初始化第三方库（需要 DOM）
- 启动定时器

```javascript
onMounted(() => {
  // DOM 已经渲染完成
  document.getElementById('chart').init()
})
```

### 3. onBeforeUpdate / onUpdated
- 在 DOM 更新前后执行操作
- **注意**：频繁触发，避免在此修改状态（可能导致无限循环）

```javascript
onUpdated(() => {
  // DOM 已经根据最新数据更新
  console.log('Component updated')
})
```

### 4. onBeforeUnmount / onUnmounted
- 清理定时器
- 移除事件监听器
- 取消网络请求
- 清理第三方库实例

```javascript
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('resize', handleResize)
})
```

### 5. onActivated / onDeactivated
- 仅在 `<KeepAlive>` 包裹的组件中触发
- 用于恢复/暂停组件状态

```javascript
onActivated(() => {
  // 组件被激活，重新获取数据
  refreshData()
})

onDeactivated(() => {
  // 组件被缓存，暂停轮询
  stopPolling()
})
```

---

## 问题 3：生命周期执行顺序（父子组件）

### 挂载阶段
```
Parent beforeCreate
Parent created
Parent beforeMount
  Child beforeCreate
  Child created
  Child beforeMount
  Child mounted
Parent mounted
```

**规律**：父组件先开始，子组件先完成。

### 更新阶段
```
Parent beforeUpdate
  Child beforeUpdate
  Child updated
Parent updated
```

### 卸载阶段
```
Parent beforeUnmount
  Child beforeUnmount
  Child unmounted
Parent unmounted
```

---

## 问题 4：注意事项

### 1. 避免在 onUpdated 中修改状态
```javascript
// ❌ 可能导致无限循环
onUpdated(() => {
  count.value++
})
```

### 2. 异步操作的清理
```javascript
onMounted(async () => {
  const data = await fetchData()
  // ⚠️ 组件可能已卸载
  if (isMounted.value) {
    state.value = data
  }
})
```

### 3. 多次调用同一钩子
```javascript
// ✅ 可以多次调用，都会执行
onMounted(() => { console.log('First') })
onMounted(() => { console.log('Second') })
```

## 总结

**核心概念总结**：

### 1. 三大阶段
- **挂载**：组件创建并插入 DOM
- **更新**：响应式数据变化，DOM 重新渲染
- **卸载**：组件从 DOM 中移除

### 2. Composition API 优势
- 更灵活的代码组织
- 可以多次调用同一钩子
- 更好的 TypeScript 支持

### 3. 最常用的钩子
`onMounted` 和 `onUnmounted`（用于资源的初始化和清理）

## 延伸阅读

- [Vue 官方文档 - 生命周期钩子](https://cn.vuejs.org/guide/essentials/lifecycle.html)
- [Vue 生命周期图示](https://cn.vuejs.org/guide/essentials/lifecycle.html#lifecycle-diagram)
