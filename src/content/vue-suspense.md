---
title: 什么是 Suspense？使用场景是什么？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  理解 Vue3 Suspense 组件的工作原理，掌握异步组件和异步依赖的优雅处理方式。
tags:
  - Vue
  - Suspense
  - 异步组件
  - 加载状态
estimatedTime: 12 分钟
keywords:
  - Suspense
  - 异步组件
  - loading 状态
highlight: Suspense 用于协调异步依赖的加载状态，在等待时显示 fallback 内容。
order: 521
---

## 问题 1：什么是 Suspense？

`<Suspense>` 是 Vue3 的内置组件，用于处理组件树中的**异步依赖**。它可以在等待异步组件或异步 setup 时，显示加载状态。

```vue
<template>
  <Suspense>
    <!-- 主要内容（可能包含异步组件） -->
    <AsyncComponent />

    <!-- 加载中显示的内容 -->
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

---

## 问题 2：Suspense 能处理哪些异步依赖？

### 1. 异步组件

```javascript
import { defineAsyncComponent } from "vue";

const AsyncComponent = defineAsyncComponent(() =>
  import("./HeavyComponent.vue")
);
```

### 2. 带有 async setup() 的组件

```vue
<!-- AsyncSetup.vue -->
<script setup>
// 顶层 await 会让组件成为异步依赖
const data = await fetchData();
</script>

<template>
  <div>{{ data }}</div>
</template>
```

### 3. 组合使用

```vue
<template>
  <Suspense>
    <div>
      <!-- 多个异步依赖 -->
      <AsyncComponent1 />
      <AsyncComponent2 />
      <ComponentWithAsyncSetup />
    </div>

    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

Suspense 会等待**所有**异步依赖都解决后才显示主内容。

---

## 问题 3：Suspense 的事件

```vue
<template>
  <Suspense @pending="onPending" @resolve="onResolve" @fallback="onFallback">
    <AsyncComponent />
    <template #fallback>Loading...</template>
  </Suspense>
</template>

<script setup>
// 进入挂起状态时触发
function onPending() {
  console.log("开始加载");
}

// 所有异步依赖解决后触发
function onResolve() {
  console.log("加载完成");
}

// fallback 内容显示时触发
function onFallback() {
  console.log("显示 fallback");
}
</script>
```

---

## 问题 4：常见使用场景

### 场景一：页面级加载

```vue
<!-- App.vue -->
<template>
  <Suspense>
    <router-view />
    <template #fallback>
      <PageLoader />
    </template>
  </Suspense>
</template>
```

### 场景二：数据获取

```vue
<!-- UserProfile.vue -->
<script setup>
const props = defineProps(["userId"]);

// 顶层 await
const user = await fetch(`/api/users/${props.userId}`).then((r) => r.json());
</script>

<template>
  <div class="profile">
    <h1>{{ user.name }}</h1>
    <p>{{ user.bio }}</p>
  </div>
</template>

<!-- 父组件 -->
<template>
  <Suspense>
    <UserProfile :userId="1" />
    <template #fallback>
      <ProfileSkeleton />
    </template>
  </Suspense>
</template>
```

### 场景三：配合错误边界

```vue
<template>
  <ErrorBoundary>
    <Suspense>
      <AsyncComponent />
      <template #fallback>Loading...</template>
    </Suspense>

    <template #error="{ error }">
      <div>Error: {{ error.message }}</div>
    </template>
  </ErrorBoundary>
</template>
```

---

## 问题 5：注意事项

### 实验性功能

Suspense 目前仍是**实验性功能**，API 可能会变化。

### 嵌套 Suspense

```vue
<Suspense>
  <div>
    <AsyncHeader />

    <!-- 嵌套的 Suspense 独立处理 -->
    <Suspense>
      <AsyncContent />
      <template #fallback>Content loading...</template>
    </Suspense>
  </div>

  <template #fallback>Page loading...</template>
</Suspense>
```

### 与 Transition 配合

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <template #default>
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </template>
      <template #fallback>Loading...</template>
    </Suspense>
  </RouterView>
</template>
```

## 延伸阅读

- [Vue 官方文档 - Suspense](https://cn.vuejs.org/guide/built-ins/suspense.html)
- [Vue 官方文档 - 异步组件](https://cn.vuejs.org/guide/components/async.html)
