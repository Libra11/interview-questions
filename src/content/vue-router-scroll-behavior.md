---
title: scrollBehavior 如何实现页面回到顶部？
category: Vue
difficulty: 中级
updatedAt: 2025-12-05
summary: >-
  掌握 Vue Router scrollBehavior 的配置方式，实现路由切换时的滚动控制。
tags:
  - Vue
  - Vue Router
  - scrollBehavior
  - 滚动控制
estimatedTime: 10 分钟
keywords:
  - scrollBehavior
  - 滚动行为
  - 回到顶部
highlight: scrollBehavior 函数可以控制路由切换时的滚动位置，支持回到顶部、保存位置、滚动到锚点等。
order: 233
---

## 问题 1：基本用法

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [...],

  scrollBehavior(to, from, savedPosition) {
    // 返回滚动位置
    return { top: 0 }  // 回到顶部
  }
})
```

---

## 问题 2：常见配置

### 始终回到顶部

```javascript
scrollBehavior() {
  return { top: 0 }
}
```

### 保存/恢复滚动位置

```javascript
scrollBehavior(to, from, savedPosition) {
  // 使用浏览器前进/后退时，恢复之前的位置
  if (savedPosition) {
    return savedPosition
  }
  // 否则回到顶部
  return { top: 0 }
}
```

### 滚动到锚点

```javascript
scrollBehavior(to) {
  // 如果有 hash（锚点）
  if (to.hash) {
    return {
      el: to.hash,  // 滚动到该元素
      behavior: 'smooth'  // 平滑滚动
    }
  }
  return { top: 0 }
}
```

---

## 问题 3：完整配置示例

```javascript
const router = createRouter({
  history: createWebHistory(),
  routes: [...],

  scrollBehavior(to, from, savedPosition) {
    // 1. 浏览器前进/后退，恢复位置
    if (savedPosition) {
      return savedPosition
    }

    // 2. 有锚点，滚动到锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80  // 偏移量（如固定导航栏高度）
      }
    }

    // 3. 同一页面内的路由变化，不滚动
    if (to.path === from.path) {
      return false
    }

    // 4. 默认回到顶部
    return { top: 0, behavior: 'smooth' }
  }
})
```

---

## 问题 4：延迟滚动

等待过渡动画完成后再滚动：

```javascript
scrollBehavior(to, from, savedPosition) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ top: 0 })
    }, 300)  // 等待 300ms（过渡动画时长）
  })
}
```

### 配合路由过渡

```vue
<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
</style>
```

---

## 问题 5：根据路由元信息控制

```javascript
const routes = [
  {
    path: "/list",
    component: List,
    meta: { saveScrollPosition: true },
  },
  {
    path: "/detail",
    component: Detail,
    meta: { scrollToTop: true },
  },
];

const router = createRouter({
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.scrollToTop) {
      return { top: 0 };
    }

    if (to.meta.saveScrollPosition && savedPosition) {
      return savedPosition;
    }

    return { top: 0 };
  },
});
```

---

## 问题 6：滚动到特定元素

```javascript
scrollBehavior(to) {
  // 滚动到页面主内容区域
  if (to.path.startsWith('/article')) {
    return {
      el: '#main-content',
      top: 100,  // 距离元素顶部的偏移
      behavior: 'smooth'
    }
  }

  return { top: 0 }
}
```

### 等待 DOM 更新

```javascript
scrollBehavior(to) {
  return new Promise((resolve) => {
    // 等待 DOM 更新
    nextTick(() => {
      const el = document.querySelector(to.hash)
      if (el) {
        resolve({ el: to.hash, behavior: 'smooth' })
      } else {
        resolve({ top: 0 })
      }
    })
  })
}
```

---

## 问题 7：注意事项

### 只在支持 history 模式时生效

```javascript
// ✅ history 模式支持 scrollBehavior
createWebHistory();

// ❌ hash 模式不完全支持
createWebHashHistory();
```

### 返回值格式

```javascript
// Vue Router 4 使用 top/left
return { top: 0, left: 0 };

// Vue Router 3 使用 x/y
return { x: 0, y: 0 };
```

## 延伸阅读

- [Vue Router - 滚动行为](https://router.vuejs.org/zh/guide/advanced/scroll-behavior.html)
