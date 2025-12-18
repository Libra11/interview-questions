---
title: Vue 有哪些内置组件？
category: Vue
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  盘点 Vue 提供的开箱即用的内置组件，包括 Transition、KeepAlive、Teleport、Suspense 等，解析它们的核心用途。
tags:
  - Vue
  - Built-in Components
  - Transition
  - KeepAlive
  - Teleport
  - Suspense
estimatedTime: 10 分钟
keywords:
  - vue built-in components
  - transition
  - transition-group
  - keep-alive
  - teleport
  - suspense
highlight: Vue 内置组件无需注册即可直接在模板中使用，涵盖了动画、缓存、传送门和异步依赖处理等核心场景。
order: 409
---

## 问题 1：Vue 提供了哪些内置组件？

Vue 3 提供了以下几个核心的内置组件，它们不需要注册，可以直接在任何组件的模板中使用（Tree-shaking 友好）。

1.  **`<Transition>`**：用于处理单个元素或组件的进入/离开动画。
2.  **`<TransitionGroup>`**：用于处理列表（v-for）元素的排序、添加和移除动画。
3.  **`<KeepAlive>`**：用于缓存动态切换的组件实例，保留其状态。
4.  **`<Teleport>`**：用于将组件内容渲染到 DOM 树的其他位置（如 body）。
5.  **`<Suspense>`** (实验性)：用于协调对组件树中嵌套的异步依赖的处理。

---

## 问题 2：Transition 和 TransitionGroup 有什么区别？

### `<Transition>`
-   **对象**：仅支持**单个**元素或组件（或者通过 `v-if`/`v-else` 切换的互斥元素）。
-   **行为**：当元素插入或移除 DOM 时，自动应用 CSS 过渡类名（如 `v-enter-active`, `v-leave-to`）。
-   **DOM**：不会渲染额外的 DOM 元素。

### `<TransitionGroup>`
-   **对象**：支持**多个**元素（通常配合 `v-for`）。
-   **行为**：除了进入/离开动画，还支持 **FLIP 动画**（通过 `v-move` 类），即当列表项顺序改变时，其他元素会平滑地移动到新位置。
-   **DOM**：默认不渲染包裹元素，但可以通过 `tag` 属性指定渲染一个元素（如 `tag="ul"`）。
-   **Key**：列表中的每个元素**必须**有唯一的 `key`。

---

## 问题 3：Suspense 是做什么的？

`<Suspense>` 是 Vue 3 引入的一个处理异步组件（Async Components）和异步依赖的内置组件。

**场景**：
当你的组件树中有一个或多个组件需要执行异步操作（如 `await fetch()` 或 `async setup()`）才能渲染时，`<Suspense>` 允许你展示一个加载状态（Fallback），直到所有嵌套的异步依赖都解析完成。

```html
<Suspense>
  <!-- 主要内容：当所有异步依赖都就绪时显示 -->
  <template #default>
    <AsyncUserProfile />
  </template>

  <!-- 后备内容：加载过程中显示 -->
  <template #fallback>
    <div>Loading user data...</div>
  </template>
</Suspense>
```

## 总结

**核心概念总结**：

### 1. 动画类
-   `Transition`: 单元素动画。
-   `TransitionGroup`: 列表动画 & 排序动画。

### 2. 功能类
-   `KeepAlive`: 组件缓存。
-   `Teleport`: DOM 传送门。
-   `Suspense`: 异步加载状态管理。

## 延伸阅读

-   [Vue 3 官方文档 - 内置组件](https://cn.vuejs.org/guide/built-ins/transition.html)
