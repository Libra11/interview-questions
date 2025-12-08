---
title: 如何实现页面级过渡动画？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue Router 配合 Transition 实现页面切换动画的方法。
tags:
  - Vue
  - Vue Router
  - Transition
  - 页面动画
estimatedTime: 12 分钟
keywords:
  - 页面过渡
  - 路由动画
  - 页面切换
highlight: 通过 router-view 的 v-slot 配合 Transition 组件实现页面级过渡动画。
order: 260
---

## 问题 1：基础页面过渡

```vue
<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

---

## 问题 2：滑动过渡

```vue
<template>
  <router-view v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const transitionName = ref("slide-left");

// 根据路由深度决定动画方向
watch(
  () => router.currentRoute.value,
  (to, from) => {
    const toDepth = to.path.split("/").length;
    const fromDepth = from?.path.split("/").length || 0;
    transitionName.value = toDepth > fromDepth ? "slide-left" : "slide-right";
  }
);
</script>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
```

---

## 问题 3：基于路由元信息

```javascript
// router/index.js
const routes = [
  {
    path: "/",
    component: Home,
    meta: { transition: "fade" },
  },
  {
    path: "/about",
    component: About,
    meta: { transition: "slide-up" },
  },
  {
    path: "/detail/:id",
    component: Detail,
    meta: { transition: "zoom" },
  },
];
```

```vue
<template>
  <router-view v-slot="{ Component, route }">
    <Transition :name="route.meta.transition || 'fade'" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>
```

---

## 问题 4：配合 KeepAlive

```vue
<template>
  <router-view v-slot="{ Component, route }">
    <Transition name="fade" mode="out-in">
      <KeepAlive :include="cachedViews">
        <component :is="Component" :key="route.fullPath" />
      </KeepAlive>
    </Transition>
  </router-view>
</template>

<script setup>
const cachedViews = ref(["Home", "List"]);
</script>
```

---

## 问题 5：共享元素过渡

```vue
<!-- 列表页 -->
<template>
  <div class="list">
    <div
      v-for="item in items"
      :key="item.id"
      class="card"
      :style="{ viewTransitionName: `card-${item.id}` }"
      @click="goToDetail(item.id)"
    >
      <img :src="item.image" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

function goToDetail(id) {
  // 使用 View Transitions API
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      router.push(`/detail/${id}`);
    });
  } else {
    router.push(`/detail/${id}`);
  }
}
</script>

<!-- 详情页 -->
<template>
  <div class="detail">
    <img :src="item.image" :style="{ viewTransitionName: `card-${item.id}` }" />
  </div>
</template>
```

---

## 问题 6：异步组件加载动画

```vue
<template>
  <router-view v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <Suspense>
        <template #default>
          <component :is="Component" />
        </template>
        <template #fallback>
          <div class="loading">
            <Spinner />
          </div>
        </template>
      </Suspense>
    </Transition>
  </router-view>
</template>
```

---

## 问题 7：复杂动画示例

```vue
<template>
  <router-view v-slot="{ Component }">
    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
      mode="out-in"
    >
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<script setup>
import gsap from "gsap";

function onBeforeEnter(el) {
  gsap.set(el, {
    opacity: 0,
    scale: 0.95,
    y: 20,
  });
}

function onEnter(el, done) {
  gsap.to(el, {
    opacity: 1,
    scale: 1,
    y: 0,
    duration: 0.4,
    ease: "power2.out",
    onComplete: done,
  });
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    scale: 0.95,
    y: -20,
    duration: 0.3,
    ease: "power2.in",
    onComplete: done,
  });
}
</script>
```

---

## 问题 8：性能优化

```css
/* 使用 transform 和 opacity */
.page-enter-active,
.page-leave-active {
  transition: transform 0.3s, opacity 0.3s;
  will-change: transform, opacity;
}

/* 避免布局抖动 */
.page-leave-active {
  position: absolute;
  width: 100%;
}
```

```vue
<!-- 使用 key 控制重新渲染 -->
<component :is="Component" :key="route.fullPath" />
```

## 延伸阅读

- [Vue Router - 过渡动效](https://router.vuejs.org/zh/guide/advanced/transitions.html)
- [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/)
