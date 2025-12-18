---
title: 动态路由和嵌套路由怎么实现？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Vue Router 中动态路由参数和嵌套路由的配置方式。
tags:
  - Vue
  - Vue Router
  - 动态路由
  - 嵌套路由
estimatedTime: 12 分钟
keywords:
  - 动态路由
  - 嵌套路由
  - 路由参数
highlight: 动态路由使用 :param 定义参数，嵌套路由使用 children 配置子路由。
order: 539
---

## 问题 1：动态路由

动态路由使用 `:` 定义路径参数：

```javascript
const routes = [
  // 动态参数 :id
  { path: "/user/:id", component: User },

  // 多个参数
  { path: "/user/:userId/post/:postId", component: Post },
];
```

### 获取参数

```vue
<script setup>
import { useRoute } from "vue-router";

const route = useRoute();

// 访问 /user/123
console.log(route.params.id); // '123'
</script>

<template>
  <div>User ID: {{ $route.params.id }}</div>
</template>
```

### 响应参数变化

```vue
<script setup>
import { watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// 监听参数变化
watch(
  () => route.params.id,
  (newId) => {
    fetchUser(newId);
  }
);
</script>
```

---

## 问题 2：可选参数和正则约束

```javascript
const routes = [
  // 可选参数（?）
  { path: "/user/:id?" }, // 匹配 /user 和 /user/123

  // 正则约束
  { path: "/user/:id(\\d+)" }, // 只匹配数字

  // 可重复参数（+）
  { path: "/files/:path+" }, // 匹配 /files/a/b/c

  // 可选且可重复（*）
  { path: "/files/:path*" }, // 匹配 /files 和 /files/a/b/c
];
```

---

## 问题 3：嵌套路由

使用 `children` 配置子路由：

```javascript
const routes = [
  {
    path: "/user/:id",
    component: User,
    children: [
      // 默认子路由
      { path: "", component: UserHome },

      // /user/:id/profile
      { path: "profile", component: UserProfile },

      // /user/:id/posts
      { path: "posts", component: UserPosts },
    ],
  },
];
```

### 父组件需要 router-view

```vue
<!-- User.vue -->
<template>
  <div class="user">
    <h2>User {{ $route.params.id }}</h2>

    <nav>
      <router-link :to="`/user/${$route.params.id}/profile`"
        >Profile</router-link
      >
      <router-link :to="`/user/${$route.params.id}/posts`">Posts</router-link>
    </nav>

    <!-- 子路由渲染位置 -->
    <router-view />
  </div>
</template>
```

---

## 问题 4：命名路由

```javascript
const routes = [
  {
    path: "/user/:id",
    name: "user",
    component: User,
    children: [
      { path: "profile", name: "user-profile", component: UserProfile },
    ],
  },
];
```

```vue
<template>
  <!-- 使用命名路由 -->
  <router-link :to="{ name: 'user', params: { id: 123 } }">
    User 123
  </router-link>

  <router-link :to="{ name: 'user-profile', params: { id: 123 } }">
    Profile
  </router-link>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// 编程式导航
router.push({ name: "user", params: { id: 123 } });
</script>
```

---

## 问题 5：命名视图

同一层级显示多个视图：

```javascript
const routes = [
  {
    path: "/dashboard",
    components: {
      default: Dashboard,
      sidebar: Sidebar,
      header: Header,
    },
  },
];
```

```vue
<template>
  <router-view name="header" />
  <router-view name="sidebar" />
  <router-view />
  <!-- default -->
</template>
```

### 嵌套命名视图

```javascript
const routes = [
  {
    path: "/settings",
    component: Settings,
    children: [
      {
        path: "profile",
        components: {
          default: ProfileSettings,
          helper: ProfileHelper,
        },
      },
    ],
  },
];
```

---

## 问题 6：路由元信息

```javascript
const routes = [
  {
    path: "/admin",
    component: Admin,
    meta: { requiresAuth: true, role: "admin" },
    children: [{ path: "users", component: AdminUsers }],
  },
];
```

```javascript
// 在导航守卫中使用
router.beforeEach((to) => {
  // 检查路由及其所有父路由的 meta
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      return "/login";
    }
  }
});
```

## 延伸阅读

- [Vue Router - 动态路由匹配](https://router.vuejs.org/zh/guide/essentials/dynamic-matching.html)
- [Vue Router - 嵌套路由](https://router.vuejs.org/zh/guide/essentials/nested-routes.html)
