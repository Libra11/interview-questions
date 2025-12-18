---
title: Vue 的 keep-alive 的原理是什么
category: Vue
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Vue keep-alive 组件的实现原理。keep-alive 通过缓存组件实例来避免重复渲染，
  是优化 Vue 应用性能的重要手段。
tags:
  - Vue
  - keep-alive
  - 组件缓存
  - 性能优化
estimatedTime: 22 分钟
keywords:
  - keep-alive
  - 组件缓存
  - LRU 算法
  - 生命周期
highlight: keep-alive 通过 LRU 缓存策略缓存组件实例，避免重复渲染
order: 456
---

## 问题 1：keep-alive 是什么？

**keep-alive 是 Vue 的内置组件，用于缓存不活动的组件实例**。

### 基本使用

```vue
<template>
  <keep-alive>
    <component :is="currentComponent" />
  </keep-alive>
</template>

<script setup>
import { ref } from 'vue';
import ComponentA from './ComponentA.vue';
import ComponentB from './ComponentB.vue';

const currentComponent = ref(ComponentA);
</script>
```

### 配合路由使用

```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

---

## 问题 2：keep-alive 的实现原理是什么？

**keep-alive 通过缓存 VNode 来保持组件状态**。

### 核心实现（简化版）

```javascript
const KeepAliveImpl = {
  name: 'KeepAlive',
  
  setup(props, { slots }) {
    // 缓存对象
    const cache = new Map();
    // 缓存的 key 集合
    const keys = new Set();
    
    // 当前缓存的组件实例
    let current = null;
    
    return () => {
      // 获取默认插槽
      const children = slots.default();
      const vnode = children[0];
      
      if (!vnode || !vnode.type) {
        return vnode;
      }
      
      // 获取组件的 key
      const key = vnode.key == null ? vnode.type : vnode.key;
      
      // 从缓存中获取
      const cachedVNode = cache.get(key);
      
      if (cachedVNode) {
        // 命中缓存，复用组件实例
        vnode.component = cachedVNode.component;
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE;
        
        // LRU：将 key 移到最后
        keys.delete(key);
        keys.add(key);
      } else {
        // 未命中，添加到缓存
        cache.set(key, vnode);
        keys.add(key);
        
        // 检查缓存数量
        if (props.max && keys.size > parseInt(props.max)) {
          // 删除最久未使用的
          const oldest = keys.values().next().value;
          cache.delete(oldest);
          keys.delete(oldest);
        }
      }
      
      // 标记为 keep-alive 组件
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
      current = vnode;
      
      return vnode;
    };
  }
};
```

---

## 问题 3：LRU 缓存策略是如何实现的？

**使用 Map 和 Set 实现 LRU（Least Recently Used）算法**。

### LRU 实现

```javascript
class LRUCache {
  constructor(max) {
    this.max = max;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // 获取值
    const value = this.cache.get(key);
    
    // 删除后重新添加，移到最后
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  set(key, value) {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // 添加到最后
    this.cache.set(key, value);
    
    // 超过最大值，删除最久未使用的（第一个）
    if (this.cache.size > this.max) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
}

// 使用
const cache = new LRUCache(3);
cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
cache.get('a');     // 访问 a，a 移到最后
cache.set('d', 4);  // 添加 d，删除 b（最久未使用）
```

---

## 问题 4：keep-alive 的生命周期是什么？

**keep-alive 组件有特殊的 activated 和 deactivated 生命周期**。

### 生命周期钩子

```vue
<script setup>
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

// 组件首次挂载
onMounted(() => {
  console.log('组件挂载');
});

// 组件被激活（从缓存中恢复）
onActivated(() => {
  console.log('组件激活');
  // 刷新数据
  fetchData();
});

// 组件被缓存
onDeactivated(() => {
  console.log('组件停用');
  // 清理定时器等
  clearInterval(timer);
});

// 组件卸载（从缓存中移除）
onUnmounted(() => {
  console.log('组件卸载');
});
</script>
```

### 生命周期执行顺序

```
首次进入组件：
created -> mounted -> activated

离开组件（被缓存）：
deactivated

再次进入组件（从缓存恢复）：
activated

组件被销毁（从缓存移除）：
deactivated -> unmounted
```

---

## 问题 5：include 和 exclude 如何使用？

**通过 include 和 exclude 控制哪些组件需要缓存**。

### 基本使用

```vue
<template>
  <!-- 只缓存 ComponentA 和 ComponentB -->
  <keep-alive include="ComponentA,ComponentB">
    <component :is="current" />
  </keep-alive>
  
  <!-- 缓存除了 ComponentC 之外的所有组件 -->
  <keep-alive exclude="ComponentC">
    <component :is="current" />
  </keep-alive>
  
  <!-- 使用正则 -->
  <keep-alive :include="/Component[AB]/">
    <component :is="current" />
  </keep-alive>
  
  <!-- 使用数组 -->
  <keep-alive :include="['ComponentA', 'ComponentB']">
    <component :is="current" />
  </keep-alive>
</template>
```

### 匹配规则

```javascript
function matches(pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.includes(name);
  } else if (typeof pattern === 'string') {
    return pattern.split(',').includes(name);
  } else if (pattern instanceof RegExp) {
    return pattern.test(name);
  }
  return false;
}

// 检查是否应该缓存
function shouldCache(vnode, include, exclude) {
  const name = vnode.type.name;
  
  if (include && !matches(include, name)) {
    return false;
  }
  
  if (exclude && matches(exclude, name)) {
    return false;
  }
  
  return true;
}
```

---

## 问题 6：max 属性如何工作？

**max 限制缓存组件的最大数量，超过时删除最久未使用的**。

### max 实现

```javascript
const KeepAlive = {
  props: {
    max: [String, Number]
  },
  
  setup(props, { slots }) {
    const cache = new Map();
    const keys = new Set();
    
    return () => {
      const vnode = slots.default()[0];
      const key = vnode.key || vnode.type;
      
      if (cache.has(key)) {
        // 命中缓存
        vnode.component = cache.get(key).component;
        
        // 更新访问顺序
        keys.delete(key);
        keys.add(key);
      } else {
        // 添加到缓存
        cache.set(key, vnode);
        keys.add(key);
        
        // 检查是否超过最大值
        if (props.max) {
          const max = parseInt(props.max);
          if (keys.size > max) {
            // 删除最久未使用的
            const oldest = keys.values().next().value;
            const cachedVNode = cache.get(oldest);
            
            // 卸载组件
            if (cachedVNode.component) {
              unmount(cachedVNode);
            }
            
            cache.delete(oldest);
            keys.delete(oldest);
          }
        }
      }
      
      return vnode;
    };
  }
};
```

---

## 问题 7：如何手动清除缓存？

**通过组件实例的方法或动态改变 key 来清除缓存**。

### 使用组件引用

```vue
<template>
  <keep-alive ref="keepAliveRef">
    <component :is="current" />
  </keep-alive>
  <button @click="clearCache">清除缓存</button>
</template>

<script setup>
import { ref } from 'vue';

const keepAliveRef = ref(null);

const clearCache = () => {
  // Vue 3 中 keep-alive 没有直接的清除方法
  // 需要通过其他方式实现
  
  // 方法 1：改变 key 强制重新创建
  key.value = Date.now();
};
</script>
```

### 动态 key

```vue
<template>
  <keep-alive>
    <component :is="current" :key="componentKey" />
  </keep-alive>
  <button @click="refresh">刷新组件</button>
</template>

<script setup>
import { ref } from 'vue';

const componentKey = ref(0);

const refresh = () => {
  // 改变 key，组件会重新创建
  componentKey.value++;
};
</script>
```

### 条件缓存

```vue
<template>
  <keep-alive v-if="shouldCache">
    <component :is="current" />
  </keep-alive>
  <component v-else :is="current" />
</template>

<script setup>
import { ref } from 'vue';

const shouldCache = ref(true);

const toggleCache = () => {
  shouldCache.value = !shouldCache.value;
};
</script>
```

---

## 总结

**核心原理**：

### 1. 缓存机制
- 使用 Map 存储组件实例
- 缓存 VNode 而非 DOM
- 保持组件状态

### 2. LRU 策略
- 最近使用的排在后面
- 超过 max 删除最久未使用的
- 使用 Map 和 Set 实现

### 3. 生命周期
- activated：组件激活
- deactivated：组件停用
- 配合 mounted/unmounted 使用

### 4. 配置选项
- include：指定缓存的组件
- exclude：指定不缓存的组件
- max：最大缓存数量

### 5. 使用场景
- 标签页切换
- 列表详情页
- 表单数据保持
- 路由缓存

## 延伸阅读

- [keep-alive 官方文档](https://vuejs.org/guide/built-ins/keep-alive.html)
- [Vue 3 keep-alive 源码](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/components/KeepAlive.ts)
- [LRU 缓存算法](https://leetcode.cn/problems/lru-cache/)
- [Vue 组件缓存最佳实践](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components)
