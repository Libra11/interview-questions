---
title: Vue 你做过哪些性能优化
category: Vue
difficulty: 中级
updatedAt: 2025-11-24
summary: >-
  总结 Vue 项目开发中常见的性能优化手段，包括组件层面、渲染层面、打包层面等多个维度的优化策略。
  掌握这些优化技巧能够显著提升应用的运行效率和用户体验。
tags:
  - Vue
  - 性能优化
  - 最佳实践
  - 工程化
estimatedTime: 28 分钟
keywords:
  - Vue 性能优化
  - 组件优化
  - 渲染优化
  - 打包优化
highlight: 从组件设计、响应式数据、渲染策略、资源加载等多个维度进行性能优化
order: 102
---

## 问题 1：组件层面有哪些优化手段？

**合理的组件拆分和懒加载是组件层面最重要的优化**。

### 组件懒加载

```javascript
// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    // 使用动态 import 实现懒加载
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/user',
    component: () => import('@/views/User.vue')
  }
];

// 组件懒加载
export default {
  components: {
    // 只有在需要时才加载组件
    HeavyComponent: () => import('@/components/HeavyComponent.vue')
  }
};
```

### 使用异步组件

```javascript
import { defineAsyncComponent } from 'vue';

// 带加载状态的异步组件
const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/Heavy.vue'),
  loadingComponent: LoadingSpinner,  // 加载时显示
  errorComponent: ErrorComponent,    // 加载失败时显示
  delay: 200,                        // 延迟显示 loading
  timeout: 3000                      // 超时时间
});
```

### 合理拆分组件

```javascript
// ❌ 不好：一个大组件包含所有逻辑
<template>
  <div class="dashboard">
    <!-- 用户信息 -->
    <div class="user-info">...</div>
    <!-- 数据统计 -->
    <div class="statistics">...</div>
    <!-- 图表展示 -->
    <div class="charts">...</div>
    <!-- 列表数据 -->
    <div class="data-list">...</div>
  </div>
</template>

// ✅ 好：拆分成多个小组件
<template>
  <div class="dashboard">
    <UserInfo />
    <Statistics />
    <Charts />
    <DataList />
  </div>
</template>
```

---

## 问题 2：响应式数据方面如何优化？

**避免不必要的响应式转换，合理使用 shallowRef 和 shallowReactive**。

### 使用 shallowRef 优化大对象

```javascript
import { ref, shallowRef } from 'vue';

// ❌ 深层响应式，性能开销大
const deepData = ref({
  level1: {
    level2: {
      level3: {
        // 深层嵌套的对象
        items: new Array(1000).fill({})
      }
    }
  }
});

// ✅ 浅层响应式，只监听第一层
const shallowData = shallowRef({
  level1: {
    level2: {
      level3: {
        items: new Array(1000).fill({})
      }
    }
  }
});

// 更新时需要替换整个对象
shallowData.value = { ...newData };
```

### 使用 markRaw 标记非响应式数据

```javascript
import { markRaw, reactive } from 'vue';

const state = reactive({
  // 第三方库实例不需要响应式
  chart: markRaw(new Chart()),
  map: markRaw(new Map()),
  
  // 大型配置对象不需要响应式
  config: markRaw({
    // 大量配置项
  })
});
```

### 冻结不变的数据

```javascript
// 使用 Object.freeze 冻结静态数据
const staticData = Object.freeze({
  options: [...],
  config: {...}
});

// 冻结后的数据不会被转换为响应式
const state = reactive({
  data: staticData  // 不会被代理
});
```

---

## 问题 3：列表渲染如何优化？

**使用虚拟滚动和正确的 key 值是列表优化的关键**。

### 虚拟滚动

```vue
<template>
  <!-- 使用虚拟滚动组件 -->
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="item">{{ item.name }}</div>
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller';

// 即使有 10000 条数据，也只渲染可见区域的项
const items = ref(new Array(10000).fill(null).map((_, i) => ({
  id: i,
  name: `Item ${i}`
})));
</script>
```

### 使用正确的 key

```vue
<template>
  <!-- ✅ 使用唯一 ID 作为 key -->
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>

  <!-- ❌ 避免使用 index 作为 key（列表会变化时） -->
  <div v-for="(item, index) in items" :key="index">
    {{ item.name }}
  </div>
</template>
```

### 分页加载

```vue
<script setup>
import { ref, computed } from 'vue';

const allItems = ref([...]);  // 所有数据
const currentPage = ref(1);
const pageSize = 20;

// 只渲染当前页的数据
const displayItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return allItems.value.slice(start, start + pageSize);
});
</script>
```

---

## 问题 4：计算属性和侦听器如何优化？

**合理使用计算属性缓存，避免不必要的侦听器**。

### 使用计算属性替代方法

```vue
<script setup>
import { ref, computed } from 'vue';

const items = ref([...]);

// ✅ 使用计算属性，有缓存
const filteredItems = computed(() => {
  return items.value.filter(item => item.active);
});

// ❌ 使用方法，每次都重新计算
const getFilteredItems = () => {
  return items.value.filter(item => item.active);
};
</script>

<template>
  <!-- 多次使用只计算一次 -->
  <div>{{ filteredItems }}</div>
  <div>{{ filteredItems }}</div>
  
  <!-- 每次都重新计算 -->
  <div>{{ getFilteredItems() }}</div>
  <div>{{ getFilteredItems() }}</div>
</template>
```

### 避免过度侦听

```javascript
import { watch, watchEffect } from 'vue';

// ❌ 侦听整个对象，任何属性变化都触发
watch(state, () => {
  // 只需要 state.count，但所有属性变化都会触发
  console.log(state.count);
}, { deep: true });

// ✅ 只侦听需要的属性
watch(() => state.count, (newCount) => {
  console.log(newCount);
});
```

---

## 问题 5：事件处理如何优化？

**使用事件委托和防抖节流来优化事件处理**。

### 事件委托

```vue
<template>
  <!-- ❌ 每个项都绑定事件 -->
  <div>
    <button
      v-for="item in items"
      :key="item.id"
      @click="handleClick(item)"
    >
      {{ item.name }}
    </button>
  </div>

  <!-- ✅ 使用事件委托 -->
  <div @click="handleDelegatedClick">
    <button
      v-for="item in items"
      :key="item.id"
      :data-id="item.id"
    >
      {{ item.name }}
    </button>
  </div>
</template>

<script setup>
const handleDelegatedClick = (e) => {
  if (e.target.tagName === 'BUTTON') {
    const id = e.target.dataset.id;
    // 处理点击
  }
};
</script>
```

### 防抖和节流

```vue
<script setup>
import { ref } from 'vue';
import { useDebounceFn, useThrottleFn } from '@vueuse/core';

const searchText = ref('');

// 防抖：输入停止后才执行
const debouncedSearch = useDebounceFn((value) => {
  // 执行搜索
  console.log('Searching:', value);
}, 500);

// 节流：固定时间间隔执行
const throttledScroll = useThrottleFn(() => {
  // 处理滚动
  console.log('Scrolling');
}, 200);
</script>

<template>
  <input v-model="searchText" @input="debouncedSearch(searchText)" />
  <div @scroll="throttledScroll">...</div>
</template>
```

---

## 问题 6：编译和打包层面如何优化？

**使用生产环境构建和代码分割来优化打包体积**。

### 生产环境构建

```javascript
// vite.config.js
export default {
  build: {
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true  // 移除 debugger
      }
    },
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库单独打包
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['element-plus']
        }
      }
    }
  }
};
```

### 按需引入组件库

```javascript
// ❌ 全量引入
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
app.use(ElementPlus);

// ✅ 按需引入
import { ElButton, ElInput } from 'element-plus';
app.component('ElButton', ElButton);
app.component('ElInput', ElInput);
```

### 使用 CDN

```html
<!-- index.html -->
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>

<!-- vite.config.js -->
export default {
  build: {
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
};
```

---

## 问题 7：图片和资源如何优化？

**使用懒加载、压缩和合适的格式来优化资源加载**。

### 图片懒加载

```vue
<template>
  <!-- 使用 v-lazy 指令 -->
  <img v-lazy="imageUrl" alt="lazy image" />
  
  <!-- 或使用原生 loading 属性 -->
  <img :src="imageUrl" loading="lazy" alt="native lazy" />
</template>
```

### 响应式图片

```vue
<template>
  <picture>
    <!-- WebP 格式（现代浏览器） -->
    <source :srcset="imageWebp" type="image/webp" />
    <!-- JPEG 格式（降级方案） -->
    <img :src="imageJpg" alt="responsive image" />
  </picture>
</template>
```

### 小图标使用 SVG 或字体图标

```vue
<template>
  <!-- ✅ SVG 图标 -->
  <svg class="icon">
    <use xlink:href="#icon-user"></use>
  </svg>
  
  <!-- ✅ 字体图标 -->
  <i class="iconfont icon-user"></i>
  
  <!-- ❌ 避免使用小尺寸 PNG -->
  <img src="small-icon.png" />
</template>
```

---

## 问题 8：Keep-alive 如何使用？

**使用 keep-alive 缓存组件状态，避免重复渲染**。

### 基本使用

```vue
<template>
  <router-view v-slot="{ Component }">
    <!-- 缓存所有路由组件 -->
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

### 条件缓存

```vue
<template>
  <!-- 只缓存特定组件 -->
  <keep-alive :include="['Dashboard', 'UserList']">
    <component :is="currentComponent" />
  </keep-alive>
  
  <!-- 排除特定组件 -->
  <keep-alive :exclude="['Editor']">
    <component :is="currentComponent" />
  </keep-alive>
  
  <!-- 限制缓存数量 -->
  <keep-alive :max="10">
    <component :is="currentComponent" />
  </keep-alive>
</template>
```

### 配合生命周期

```vue
<script setup>
import { onActivated, onDeactivated } from 'vue';

// 组件被激活时
onActivated(() => {
  // 刷新数据
  fetchData();
});

// 组件被缓存时
onDeactivated(() => {
  // 清理定时器等
  clearInterval(timer);
});
</script>
```

---

## 总结

**核心优化策略**：

### 1. 组件层面
- 组件懒加载和异步组件
- 合理拆分组件粒度
- 使用 keep-alive 缓存

### 2. 响应式数据
- 使用 shallowRef/shallowReactive
- markRaw 标记非响应式数据
- Object.freeze 冻结静态数据

### 3. 渲染优化
- 虚拟滚动处理长列表
- 正确使用 key 值
- 计算属性缓存

### 4. 事件优化
- 事件委托减少监听器
- 防抖节流优化高频事件

### 5. 打包优化
- 代码分割和按需引入
- 生产环境压缩
- 使用 CDN

### 6. 资源优化
- 图片懒加载
- 使用合适的图片格式
- SVG 替代小图标

## 延伸阅读

- [Vue 官方性能优化指南](https://vuejs.org/guide/best-practices/performance.html)
- [Vue 3 性能提升详解](https://blog.vuejs.org/posts/vue-3-performance.html)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [vue-virtual-scroller 虚拟滚动](https://github.com/Akryum/vue-virtual-scroller)
- [VueUse 工具库](https://vueuse.org/)
