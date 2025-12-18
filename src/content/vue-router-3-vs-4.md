---
title: Vue Router 3 与 4 的区别？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  了解 Vue Router 4 相比 Vue Router 3 的主要变化，掌握迁移要点。
tags:
  - Vue
  - Vue Router
  - 路由
  - 版本对比
estimatedTime: 12 分钟
keywords:
  - Vue Router 4
  - 路由变化
  - 版本迁移
highlight: Vue Router 4 配合 Vue 3，采用 createRouter 创建实例，移除了 * 通配符，改用正则匹配。
order: 535
---

## 问题 1：创建方式变化

### Vue Router 3（Vue 2）

```javascript
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [...]
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

### Vue Router 4（Vue 3）

```javascript
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
```

---

## 问题 2：history 模式配置

### Vue Router 3

```javascript
const router = new VueRouter({
  mode: 'history',  // 或 'hash'
  routes: [...]
})
```

### Vue Router 4

```javascript
import {
  createRouter,
  createWebHistory,    // history 模式
  createWebHashHistory // hash 模式
} from 'vue-router'

const router = createRouter({
  history: createWebHistory(),  // 或 createWebHashHistory()
  routes: [...]
})
```

---

## 问题 3：通配符路由变化

### Vue Router 3

```javascript
// 使用 * 通配符
{
  path: '*',
  component: NotFound
}
```

### Vue Router 4

```javascript
// 使用正则参数
{
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: NotFound
}

// 访问匹配的路径
// this.$route.params.pathMatch
```

---

## 问题 4：组合式 API 支持

### Vue Router 3

```javascript
// 只能通过 this 访问
export default {
  methods: {
    goHome() {
      this.$router.push("/");
    },
  },
  computed: {
    currentRoute() {
      return this.$route.path;
    },
  },
};
```

### Vue Router 4

```javascript
import { useRouter, useRoute } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();

    function goHome() {
      router.push("/");
    }

    // route 是响应式的
    watchEffect(() => {
      console.log(route.path);
    });

    return { goHome };
  },
};
```

---

## 问题 5：导航守卫变化

### next 参数变为可选

```javascript
// Vue Router 3：必须调用 next()
router.beforeEach((to, from, next) => {
  if (isAuthenticated) {
    next();
  } else {
    next("/login");
  }
});

// Vue Router 4：可以直接返回
router.beforeEach((to, from) => {
  if (!isAuthenticated) {
    return "/login"; // 重定向
    // 或 return false  // 取消导航
  }
  // 不返回或返回 true/undefined 表示通过
});

// 也支持 next（向后兼容）
router.beforeEach((to, from, next) => {
  next();
});
```

---

## 问题 6：其他重要变化

### router-link 变化

```vue
<!-- Vue Router 3 -->
<router-link to="/about" tag="button">About</router-link>
<router-link to="/about" event="dblclick">About</router-link>

<!-- Vue Router 4：移除 tag 和 event，使用插槽 -->
<router-link to="/about" custom v-slot="{ navigate }">
  <button @click="navigate">About</button>
</router-link>
```

### 移除 router.match

```javascript
// Vue Router 3
router.match(location);

// Vue Router 4
router.resolve(location);
```

### 所有导航现在都是异步的

```javascript
// Vue Router 4
router.push("/").then(() => {
  // 导航完成
});

// 或使用 await
await router.push("/");
```

### scrollBehavior 返回值变化

```javascript
// Vue Router 3
scrollBehavior(to, from, savedPosition) {
  return { x: 0, y: 0 }
}

// Vue Router 4
scrollBehavior(to, from, savedPosition) {
  return { left: 0, top: 0 }  // x/y 改为 left/top
}
```

---

## 问题 7：迁移清单

| Vue Router 3      | Vue Router 4                  |
| ----------------- | ----------------------------- |
| `new VueRouter()` | `createRouter()`              |
| `mode: 'history'` | `history: createWebHistory()` |
| `path: '*'`       | `path: '/:pathMatch(.*)*'`    |
| `tag="button"`    | 使用 `custom` + 插槽          |
| `{ x, y }`        | `{ left, top }`               |

## 延伸阅读

- [Vue Router 4 官方文档](https://router.vuejs.org/zh/)
- [Vue Router 迁移指南](https://router.vuejs.org/zh/guide/migration/)
