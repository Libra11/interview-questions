---
title: Vue 动态组件 (Dynamic Components) 详解
category: Vue
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  介绍 Vue 中 <component> 标签的用法，如何实现组件的动态切换，以及配合 KeepAlive 缓存组件状态的技巧。
tags:
  - Vue
  - Components
  - Dynamic Component
  - KeepAlive
estimatedTime: 15 分钟
keywords:
  - vue dynamic component
  - component is attribute
  - keep-alive
  - activated hook
highlight: 使用 <component :is="..."> 可以灵活地在不同组件间切换，配合 <KeepAlive> 可以缓存非活动组件实例。
order: 404
---

## 问题 1：什么是动态组件？如何使用？

在 Vue 中，有时我们需要在同一个挂载点根据条件渲染不同的组件（例如 Tab 切换）。Vue 提供了一个特殊的元素 `<component>` 来实现这一功能。

### 基本用法

通过 `is` 属性（Vue 2 和 Vue 3 通用）来绑定当前需要渲染的组件。`is` 的值可以是：
1.  已注册的组件名（字符串）。
2.  实际的组件对象。

```html
<template>
  <div class="tabs">
    <button @click="currentView = 'Home'">Home</button>
    <button @click="currentView = 'Posts'">Posts</button>
    <button @click="currentView = 'Archive'">Archive</button>

    <!-- 动态组件挂载点 -->
    <component :is="currentView"></component>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Home from './Home.vue'
import Posts from './Posts.vue'
import Archive from './Archive.vue'

// 这里存储的是组件对象，也可以是字符串（如果组件已全局注册）
const currentView = ref(Home)
</script>
```

当 `currentView` 发生变化时，`<component>` 会销毁当前的组件实例并挂载新的组件实例。

---

## 问题 2：如何保持组件状态 (KeepAlive)？

默认情况下，当组件切换时，旧组件会被**销毁**（Unmount），新组件会被**重建**（Mount）。这意味着你在旧组件中输入的内容、滚动位置等状态都会丢失。

如果你希望在切换回来时保留这些状态，可以使用 `<KeepAlive>` 内置组件将动态组件包裹起来。

### 使用 KeepAlive

```html
<KeepAlive>
  <component :is="currentView"></component>
</KeepAlive>
```

### 生命周期钩子

被 `<KeepAlive>` 缓存的组件会有两个特有的生命周期钩子：

-   `onActivated`: 当组件被插入到 DOM 中时调用（首次挂载 + 每次从缓存激活）。
-   `onDeactivated`: 当组件从 DOM 中移除但被缓存时调用。

```javascript
// 在组件内部
onActivated(() => {
  console.log('组件被激活了！')
})

onDeactivated(() => {
  console.log('组件休眠了！')
})
```

### include 和 exclude

你可以通过 props 控制哪些组件需要被缓存。

```html
<!-- 逗号分隔字符串 -->
<KeepAlive include="Home,Posts">
  <component :is="currentView" />
</KeepAlive>

<!-- 正则表达式 (v-bind) -->
<KeepAlive :include="/Home|Posts/">
  <component :is="currentView" />
</KeepAlive>
```

---

## 问题 3：动态组件有哪些常见应用场景？

### 1. 标签页 (Tabs)
这是最经典的使用场景。用户点击不同标签，内容区域显示不同组件。

### 2. 弹窗内容切换
一个通用的 Modal 组件，根据传入的类型（如 "Login", "Register", "ForgotPassword"）动态渲染不同的表单内容。

### 3. 权限控制/角色视图
根据用户的角色（Admin, User, Guest），在同一页面区域渲染不同的管理面板。

### 4. 步骤条 (Wizard/Stepper)
分步表单，每一步是一个独立的组件，通过动态组件进行切换，并使用 `KeepAlive` 保存每一步填写的数据。

## 总结

**核心概念总结**：

### 1. 语法
使用 `<component :is="currentComp" />` 实现组件的动态切换。

### 2. 状态缓存
默认切换会销毁组件。使用 `<KeepAlive>` 包裹可以缓存非活动组件实例，避免重复渲染和状态丢失。

### 3. 生命周期
注意 `onActivated` 和 `onDeactivated` 的使用，替代常规的 `onMounted` 和 `onUnmounted` 来处理缓存组件的逻辑。

## 延伸阅读

-   [Vue 3 官方文档 - 动态组件](https://cn.vuejs.org/guide/essentials/component-basics.html#dynamic-components)
-   [Vue 3 官方文档 - KeepAlive](https://cn.vuejs.org/guide/built-ins/keep-alive.html)
