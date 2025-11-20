---
title: Vue reactive() 为何返回原始对象的 Proxy？
category: Vue
difficulty: 高级
updatedAt: 2025-11-20
summary: >-
  深入解析 Vue 3 响应式系统的核心实现原理，解释为什么 reactive() 返回 Proxy 对象，以及 Proxy 如何实现依赖追踪和触发更新。
tags:
  - Vue
  - Reactive
  - Proxy
  - Reactivity System
estimatedTime: 18 分钟
keywords:
  - vue proxy
  - reactive implementation
  - dependency tracking
  - effect system
highlight: Proxy 允许 Vue 拦截对象的所有操作（读取、设置、删除），从而实现自动的依赖收集和触发更新，这是 Vue 3 响应式系统的基石。
order: 152
---

## 问题 1：为什么使用 Proxy？

Vue 3 使用 **Proxy** 替代 Vue 2 的 `Object.defineProperty`，主要原因：

### Vue 2 的局限性（Object.defineProperty）

1. **无法检测属性的添加和删除**
   ```javascript
   // Vue 2
   this.obj.newProp = 'value' // 不是响应式的
   delete this.obj.prop // 不会触发更新
   ```

2. **无法监听数组索引和 length 的变化**
   ```javascript
   this.arr[0] = 'new' // 不是响应式的
   this.arr.length = 0 // 不会触发更新
   ```

3. **需要递归遍历所有属性**，性能开销大。

### Proxy 的优势

1. **可以拦截所有操作**：get、set、delete、has、ownKeys 等。
2. **天然支持数组**。
3. **懒代理**：只在访问嵌套对象时才代理，性能更好。

---

## 问题 2：Proxy 如何工作？

### 基本示例

```javascript
const target = { count: 0 }

const proxy = new Proxy(target, {
  get(target, key) {
    console.log(`读取 ${key}`)
    return target[key]
  },
  set(target, key, value) {
    console.log(`设置 ${key} = ${value}`)
    target[key] = value
    return true
  }
})

proxy.count // 输出: 读取 count
proxy.count = 1 // 输出: 设置 count = 1
```

### Vue 的 reactive() 简化实现

```javascript
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 1. 依赖收集
      track(target, key)
      
      const result = Reflect.get(target, key, receiver)
      
      // 2. 如果是对象，递归代理（懒代理）
      if (typeof result === 'object' && result !== null) {
        return reactive(result)
      }
      
      return result
    },
    
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      
      // 3. 触发更新
      if (oldValue !== value) {
        trigger(target, key)
      }
      
      return result
    },
    
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      // 触发更新
      trigger(target, key)
      return result
    }
  })
}
```

---

## 问题 3：依赖收集和触发更新的原理

### 核心概念

1. **Effect**：副作用函数（如组件的 render 函数、watchEffect 的回调）。
2. **Track**：依赖收集，记录哪些 effect 依赖了哪些属性。
3. **Trigger**：触发更新，当属性变化时，重新执行依赖它的 effect。

### 数据结构

```javascript
// 全局依赖映射
// WeakMap { target -> Map { key -> Set<Effect> } }
const targetMap = new WeakMap()

// 当前正在执行的 effect
let activeEffect = null
```

### Track（依赖收集）

```javascript
function track(target, key) {
  if (!activeEffect) return
  
  // 获取 target 对应的依赖 Map
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  
  // 获取 key 对应的依赖 Set
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  
  // 将当前 effect 添加到依赖集合
  dep.add(activeEffect)
}
```

### Trigger（触发更新）

```javascript
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (!dep) return
  
  // 执行所有依赖该属性的 effect
  dep.forEach(effect => effect())
}
```

### Effect（副作用函数）

```javascript
function effect(fn) {
  const effectFn = () => {
    activeEffect = effectFn
    fn() // 执行函数，触发 get，进行依赖收集
    activeEffect = null
  }
  
  effectFn()
  return effectFn
}
```

---

## 问题 4：完整示例

```javascript
const state = reactive({ count: 0 })

// 创建一个 effect
effect(() => {
  console.log('count is:', state.count)
})
// 输出: count is: 0

// 修改 count，自动触发 effect 重新执行
state.count++
// 输出: count is: 1
```

**执行流程**：
1. `effect()` 执行，设置 `activeEffect`。
2. 访问 `state.count`，触发 `get` 拦截器。
3. `track(state, 'count')` 收集依赖。
4. `state.count++` 触发 `set` 拦截器。
5. `trigger(state, 'count')` 触发更新。
6. 重新执行 effect 函数。

---

## 问题 5：为什么返回 Proxy 而不是原始对象？

1. **保持引用一致性**：多次调用 `reactive(obj)` 返回同一个 Proxy。
2. **拦截所有操作**：只有 Proxy 才能拦截 get/set/delete 等操作。
3. **自动依赖追踪**：通过 Proxy 的 get 拦截器自动收集依赖。

```javascript
const obj = { count: 0 }
const state1 = reactive(obj)
const state2 = reactive(obj)

console.log(state1 === state2) // true（同一个 Proxy）
console.log(state1 === obj) // false（Proxy 不等于原始对象）
```

## 总结

**核心概念总结**：

### 1. Proxy 的作用
拦截对象操作，实现依赖收集和触发更新。

### 2. 响应式原理
- **Track**：get 时收集依赖
- **Trigger**：set 时触发更新
- **Effect**：副作用函数（组件渲染、watch 等）

### 3. 优势
相比 Vue 2，Proxy 支持动态属性、数组索引、性能更好。

## 延伸阅读

- [Vue 3 官方文档 - 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
