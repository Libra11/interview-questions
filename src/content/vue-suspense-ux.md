---
title: Suspense 如何提升首屏体验？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握使用 Suspense 优化首屏加载体验的方法和最佳实践。
tags:
  - Vue
  - Suspense
  - 首屏优化
  - 用户体验
estimatedTime: 12 分钟
keywords:
  - Suspense
  - 首屏体验
  - 加载状态
highlight: Suspense 统一管理异步依赖的加载状态，提供优雅的 loading 体验，避免页面闪烁。
order: 575
---

## 问题 1：首屏加载的痛点

### 传统方式

```vue
<script setup>
const loading = ref(true);
const data = ref(null);

onMounted(async () => {
  data.value = await fetchData();
  loading.value = false;
});
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else>{{ data }}</div>
</template>
```

**问题**：

- 每个组件都要管理自己的 loading 状态
- 多个异步组件时，loading 状态难以协调
- 页面可能出现多个 loading 指示器

---

## 问题 2：Suspense 的解决方案

```vue
<template>
  <Suspense>
    <!-- 主内容 -->
    <Dashboard />

    <!-- 统一的 loading 状态 -->
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>

<!-- Dashboard.vue -->
<script setup>
// 使用顶层 await
const stats = await fetchStats();
const charts = await fetchCharts();
</script>

<template>
  <div>
    <Stats :data="stats" />
    <Charts :data="charts" />
  </div>
</template>
```

---

## 问题 3：避免页面闪烁

### 问题：快速加载时的闪烁

```vue
<!-- 如果数据加载很快，loading 会一闪而过 -->
<Suspense>
  <AsyncComponent />
  <template #fallback>
    <Loading />  <!-- 可能只显示几十毫秒 -->
  </template>
</Suspense>
```

### 解决：延迟显示 loading

```vue
<script setup>
const showFallback = ref(false);
let timer = null;

// 延迟显示 fallback
function onPending() {
  timer = setTimeout(() => {
    showFallback.value = true;
  }, 200); // 200ms 后才显示 loading
}

function onResolve() {
  clearTimeout(timer);
  showFallback.value = false;
}
</script>

<template>
  <Suspense @pending="onPending" @resolve="onResolve">
    <AsyncComponent />
    <template #fallback>
      <Loading v-if="showFallback" />
    </template>
  </Suspense>
</template>
```

---

## 问题 4：骨架屏优化

```vue
<template>
  <Suspense>
    <UserProfile />

    <template #fallback>
      <!-- 使用骨架屏而非简单的 loading -->
      <div class="skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </template>
  </Suspense>
</template>

<style>
.skeleton {
  animation: pulse 1.5s infinite;
}
.skeleton-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e0e0e0;
}
.skeleton-text {
  height: 16px;
  background: #e0e0e0;
  margin: 8px 0;
}
</style>
```

---

## 问题 5：渐进式加载

```vue
<template>
  <div>
    <!-- 关键内容优先 -->
    <Suspense>
      <Header />
      <template #fallback><HeaderSkeleton /></template>
    </Suspense>

    <!-- 次要内容可以稍后加载 -->
    <Suspense>
      <MainContent />
      <template #fallback><ContentSkeleton /></template>
    </Suspense>

    <!-- 非关键内容最后加载 -->
    <Suspense>
      <Sidebar />
      <template #fallback><SidebarSkeleton /></template>
    </Suspense>
  </div>
</template>
```

---

## 问题 6：配合路由过渡

```vue
<template>
  <router-view v-slot="{ Component }">
    <Suspense>
      <template #default>
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </template>

      <template #fallback>
        <PageLoader />
      </template>
    </Suspense>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

---

## 问题 7：错误处理

```vue
<template>
  <ErrorBoundary v-slot="{ error, retry }">
    <div v-if="error" class="error">
      <p>加载失败: {{ error.message }}</p>
      <button @click="retry">重试</button>
    </div>

    <Suspense v-else>
      <AsyncComponent />
      <template #fallback>
        <Loading />
      </template>
    </Suspense>
  </ErrorBoundary>
</template>

<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from "vue";

const error = ref(null);

onErrorCaptured((err) => {
  error.value = err;
  return false; // 阻止错误继续传播
});

function retry() {
  error.value = null;
}
</script>

<template>
  <slot :error="error" :retry="retry" />
</template>
```

---

## 问题 8：最佳实践

### 1. 合理使用嵌套

```vue
<!-- 独立的加载区域 -->
<Suspense>
  <CriticalContent />  <!-- 关键内容 -->
  <template #fallback>...</template>
</Suspense>

<Suspense>
  <NonCriticalContent />  <!-- 非关键内容 -->
  <template #fallback>...</template>
</Suspense>
```

### 2. 预加载数据

```vue
<script setup>
// 在路由守卫中预加载
router.beforeEach(async (to) => {
  if (to.meta.preload) {
    await preloadData(to.params);
  }
});
</script>
```

### 3. 缓存已加载的数据

```vue
<script setup>
// 使用缓存避免重复加载
const cache = new Map();

async function fetchWithCache(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetch(key);
  cache.set(key, data);
  return data;
}
</script>
```

## 延伸阅读

- [Vue 官方文档 - Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)
- [Web.dev - 骨架屏](https://web.dev/articles/skeleton-screens)
