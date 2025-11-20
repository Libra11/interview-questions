---
title: Vue 侦听器在什么情况下需要清理副作用？
category: Vue
difficulty: 中级
updatedAt: 2025-11-20
summary: >-
  解析 Vue 侦听器中副作用清理的必要性，介绍 onCleanup 回调的使用场景，如防止竞态条件、清理定时器和取消网络请求。
tags:
  - Vue
  - Watch
  - Side Effects
  - Cleanup
estimatedTime: 15 分钟
keywords:
  - watch cleanup
  - onCleanup
  - race condition
  - side effects
  - watchEffect
highlight: 当侦听器执行异步操作时，如果数据快速变化导致多次触发，需要清理上一次的副作用以避免竞态条件和资源泄漏。
order: 144
---

## 问题 1：什么是侦听器的副作用清理？

在 Vue 的 `watch` 和 `watchEffect` 中，当侦听的数据发生变化时，会执行回调函数。如果回调中包含**异步操作**或**需要清理的资源**（如定时器、事件监听器、网络请求），我们需要在下一次回调执行前或组件卸载时清理这些副作用。

Vue 提供了 `onCleanup` (Vue 3.2+) 或 `onInvalidate` (旧版本) 回调来处理清理逻辑。

---

## 问题 2：哪些场景需要清理副作用？

### 1. 防止竞态条件 (Race Condition)

当用户快速输入搜索关键词时，可能会触发多次 API 请求。如果先发出的请求后返回，就会覆盖最新的结果。

```javascript
import { watch } from 'vue'

watch(searchQuery, async (newQuery, oldQuery, onCleanup) => {
  let canceled = false
  
  // 注册清理函数
  onCleanup(() => {
    canceled = true
  })

  const result = await fetchSearchResults(newQuery)
  
  // 如果在请求返回前，searchQuery 又变化了，canceled 会被设为 true
  if (!canceled) {
    searchResults.value = result
  }
})
```

### 2. 清理定时器

```javascript
watch(count, (newVal, oldVal, onCleanup) => {
  const timer = setTimeout(() => {
    console.log('Delayed action')
  }, 1000)

  // 如果 count 在 1 秒内再次变化，清除上一个定时器
  onCleanup(() => {
    clearTimeout(timer)
  })
})
```

### 3. 取消事件监听

```javascript
watchEffect((onCleanup) => {
  const handleResize = () => {
    console.log('Window resized')
  }
  
  window.addEventListener('resize', handleResize)
  
  onCleanup(() => {
    window.removeEventListener('resize', handleResize)
  })
})
```

### 4. 取消网络请求 (AbortController)

```javascript
watch(userId, async (id, oldId, onCleanup) => {
  const controller = new AbortController()
  
  onCleanup(() => {
    controller.abort()
  })

  try {
    const data = await fetch(`/api/user/${id}`, {
      signal: controller.signal
    })
    userData.value = await data.json()
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('Request canceled')
    }
  }
})
```

---

## 问题 3：onCleanup 的执行时机

`onCleanup` 注册的清理函数会在以下时机执行：

1. **侦听器重新执行前**：当依赖变化导致回调再次执行时，会先执行上一次的清理函数。
2. **组件卸载时**：组件销毁时会执行所有侦听器的清理函数。

```javascript
watchEffect((onCleanup) => {
  console.log('Effect running')
  
  onCleanup(() => {
    console.log('Cleanup')
  })
})

// 输出顺序：
// Effect running
// (数据变化)
// Cleanup          ← 先清理
// Effect running   ← 再执行新的
```

## 总结

**核心概念总结**：

### 1. 使用场景
- 异步操作（防止竞态条件）
- 定时器清理
- 事件监听器移除
- 网络请求取消

### 2. API
- `watch(source, (newVal, oldVal, onCleanup) => {})`
- `watchEffect((onCleanup) => {})`

### 3. 执行时机
侦听器重新执行前 + 组件卸载时。

## 延伸阅读

- [Vue 官方文档 - 侦听器](https://cn.vuejs.org/guide/essentials/watchers.html)
- [Vue 官方文档 - 副作用清理](https://cn.vuejs.org/guide/essentials/watchers.html#callback-flush-timing)
