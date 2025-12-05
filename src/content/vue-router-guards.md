---
title: 路由守卫有哪些生命周期？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Vue Router 中各种路由守卫的类型、执行顺序和使用场景。
tags:
  - Vue
  - Vue Router
  - 路由守卫
  - 导航守卫
estimatedTime: 15 分钟
keywords:
  - 路由守卫
  - beforeEach
  - 导航守卫
highlight: 路由守卫分为全局守卫、路由独享守卫和组件内守卫三类，按特定顺序执行。
order: 231
---

## 问题 1：路由守卫的分类

### 1. 全局守卫

```javascript
const router = createRouter({ ... })

// 全局前置守卫
router.beforeEach((to, from) => {
  // 返回 false 取消导航
  // 返回路由地址进行重定向
  // 不返回或返回 true 继续导航
})

// 全局解析守卫
router.beforeResolve((to, from) => {
  // 在所有组件内守卫和异步路由组件被解析之后调用
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 导航完成后调用，不能改变导航
})
```

### 2. 路由独享守卫

```javascript
const routes = [
  {
    path: "/admin",
    component: Admin,
    beforeEnter: (to, from) => {
      // 只在进入该路由时调用
      if (!isAdmin) return "/403";
    },
  },
];
```

### 3. 组件内守卫

```vue
<script>
export default {
  beforeRouteEnter(to, from, next) {
    // 在渲染该组件的对应路由被确认前调用
    // 不能访问 this
    next((vm) => {
      // 通过 vm 访问组件实例
    });
  },

  beforeRouteUpdate(to, from) {
    // 路由改变但组件被复用时调用
    // 可以访问 this
  },

  beforeRouteLeave(to, from) {
    // 离开该组件的路由时调用
    // 可以访问 this
  },
};
</script>
```

---

## 问题 2：组合式 API 中的守卫

```vue
<script setup>
import { onBeforeRouteUpdate, onBeforeRouteLeave } from "vue-router";

// 路由更新时（组件复用）
onBeforeRouteUpdate((to, from) => {
  // 可以访问组件状态
});

// 离开路由时
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm("确定要离开吗？");
  if (!answer) return false;
});
</script>
```

**注意**：`beforeRouteEnter` 没有组合式 API 版本，因为 setup 执行时组件还未创建。

---

## 问题 3：完整的导航解析流程

```
1. 导航被触发
2. 在失活的组件里调用 beforeRouteLeave
3. 调用全局 beforeEach
4. 在重用的组件里调用 beforeRouteUpdate
5. 在路由配置里调用 beforeEnter
6. 解析异步路由组件
7. 在被激活的组件里调用 beforeRouteEnter
8. 调用全局 beforeResolve
9. 导航被确认
10. 调用全局 afterEach
11. 触发 DOM 更新
12. 调用 beforeRouteEnter 中 next 的回调函数
```

---

## 问题 4：常见使用场景

### 登录验证

```javascript
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return {
      path: "/login",
      query: { redirect: to.fullPath },
    };
  }
});
```

### 权限控制

```javascript
router.beforeEach((to) => {
  const requiredRole = to.meta.role;
  if (requiredRole && !hasRole(requiredRole)) {
    return "/403";
  }
});
```

### 页面标题

```javascript
router.afterEach((to) => {
  document.title = to.meta.title || "默认标题";
});
```

### 离开确认

```vue
<script setup>
import { onBeforeRouteLeave } from "vue-router";

const hasUnsavedChanges = ref(false);

onBeforeRouteLeave(() => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm("有未保存的更改，确定离开？");
    if (!answer) return false;
  }
});
</script>
```

### 加载进度条

```javascript
import NProgress from "nprogress";

router.beforeEach(() => {
  NProgress.start();
});

router.afterEach(() => {
  NProgress.done();
});
```

---

## 问题 5：守卫的返回值

```javascript
router.beforeEach((to, from) => {
  // 1. 返回 false：取消导航
  return false;

  // 2. 返回路由地址：重定向
  return "/login";
  return { name: "Login" };
  return { path: "/login", query: { redirect: to.fullPath } };

  // 3. 不返回 / 返回 true / 返回 undefined：继续导航
  return true;

  // 4. 抛出错误：取消导航并调用 router.onError()
  throw new Error("Navigation failed");
});
```

---

## 问题 6：错误处理

```javascript
router.onError((error) => {
  console.error("路由错误:", error);
  // 可以进行错误上报
});

// 在守卫中处理错误
router.beforeEach(async (to) => {
  try {
    await checkPermission(to);
  } catch (error) {
    return "/error";
  }
});
```

## 延伸阅读

- [Vue Router - 导航守卫](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html)
