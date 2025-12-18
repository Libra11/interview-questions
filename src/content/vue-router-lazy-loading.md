---
title: 如何实现路由懒加载？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Vue Router 路由懒加载的实现方式，理解代码分割对性能的优化作用。
tags:
  - Vue
  - Vue Router
  - 懒加载
  - 代码分割
estimatedTime: 10 分钟
keywords:
  - 路由懒加载
  - 动态导入
  - 代码分割
highlight: 路由懒加载通过动态 import() 实现，将每个路由组件打包成独立的 chunk，按需加载。
order: 543
---

## 问题 1：什么是路由懒加载？

路由懒加载是指**只有在访问某个路由时，才加载对应的组件代码**，而不是在应用启动时加载所有组件。

```javascript
// ❌ 静态导入：所有组件打包在一起
import Home from "./views/Home.vue";
import About from "./views/About.vue";
import User from "./views/User.vue";

// ✅ 动态导入：每个组件单独打包
const Home = () => import("./views/Home.vue");
const About = () => import("./views/About.vue");
const User = () => import("./views/User.vue");
```

---

## 问题 2：基本实现

```javascript
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: () => import("./views/Home.vue"),
    },
    {
      path: "/about",
      name: "About",
      component: () => import("./views/About.vue"),
    },
    {
      path: "/user/:id",
      name: "User",
      component: () => import("./views/User.vue"),
    },
  ],
});
```

---

## 问题 3：命名 chunk

使用魔法注释为打包的 chunk 命名：

```javascript
const routes = [
  {
    path: "/about",
    component: () =>
      import(/* webpackChunkName: "about" */ "./views/About.vue"),
  },
  {
    path: "/user",
    component: () => import(/* webpackChunkName: "user" */ "./views/User.vue"),
  },
];

// Vite 中使用
const routes = [
  {
    path: "/about",
    component: () => import("./views/About.vue"), // Vite 自动处理
  },
];
```

---

## 问题 4：分组打包

将相关路由打包到同一个 chunk：

```javascript
const routes = [
  // 用户相关页面打包在一起
  {
    path: "/user",
    component: () => import(/* webpackChunkName: "user" */ "./views/User.vue"),
  },
  {
    path: "/user/profile",
    component: () =>
      import(/* webpackChunkName: "user" */ "./views/UserProfile.vue"),
  },
  {
    path: "/user/settings",
    component: () =>
      import(/* webpackChunkName: "user" */ "./views/UserSettings.vue"),
  },

  // 管理页面打包在一起
  {
    path: "/admin",
    component: () =>
      import(/* webpackChunkName: "admin" */ "./views/Admin.vue"),
  },
  {
    path: "/admin/users",
    component: () =>
      import(/* webpackChunkName: "admin" */ "./views/AdminUsers.vue"),
  },
];
```

---

## 问题 5：配合加载状态

### 使用 Suspense

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <LoadingSpinner />
      </template>
    </Suspense>
  </RouterView>
</template>
```

### 使用 defineAsyncComponent

```javascript
import { defineAsyncComponent } from "vue";

const routes = [
  {
    path: "/about",
    component: defineAsyncComponent({
      loader: () => import("./views/About.vue"),
      loadingComponent: LoadingSpinner,
      delay: 200, // 延迟显示 loading
      errorComponent: ErrorComponent,
      timeout: 3000,
    }),
  },
];
```

---

## 问题 6：预加载策略

### 路由级别预加载

```javascript
// 鼠标悬停时预加载
<router-link
  to="/about"
  @mouseenter="preloadAbout"
>
  About
</router-link>

<script setup>
const preloadAbout = () => {
  import('./views/About.vue')
}
</script>
```

### 使用 prefetch

```javascript
// Webpack 魔法注释
const About = () =>
  import(
    /* webpackChunkName: "about" */
    /* webpackPrefetch: true */
    "./views/About.vue"
  );

// 会在页面空闲时预加载
// <link rel="prefetch" href="about.chunk.js">
```

### 手动预加载

```javascript
// 在合适的时机预加载
router.beforeEach((to) => {
  // 预加载可能访问的页面
  if (to.path === "/dashboard") {
    import("./views/Settings.vue");
    import("./views/Profile.vue");
  }
});
```

---

## 问题 7：性能对比

```
不使用懒加载：
├── app.js (500KB) ← 包含所有组件
└── 首次加载：500KB

使用懒加载：
├── app.js (100KB) ← 核心代码
├── home.js (50KB) ← 按需加载
├── about.js (30KB)
├── user.js (80KB)
└── 首次加载：100KB + 50KB = 150KB
```

## 延伸阅读

- [Vue Router - 路由懒加载](https://router.vuejs.org/zh/guide/advanced/lazy-loading.html)
- [Webpack - 代码分割](https://webpack.js.org/guides/code-splitting/)
