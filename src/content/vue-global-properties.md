---
title: Vue 如何配置全局使用的定义或常量？
category: Vue
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  介绍在 Vue 3 中配置全局变量的几种方式：globalProperties、Provide/Inject 以及 ES 模块导入，并分析各自的优缺点。
tags:
  - Vue
  - Global Properties
  - Provide/Inject
  - Configuration
estimatedTime: 10 分钟
keywords:
  - globalProperties
  - global constants
  - vue provide inject
  - es modules
highlight: 虽然 globalProperties 是 Vue 2 原型挂载的替代品，但在 Vue 3 中，使用 ES 模块导入或 Provide/Inject 通常是更推荐的现代化实践。
order: 413
---

## 问题 1：Vue 3 如何替代 Vue 2 的 Vue.prototype？

在 Vue 2 中，我们习惯将全局变量挂载到原型上：`Vue.prototype.$http = axios`。
在 Vue 3 中，由于没有全局 `Vue` 构造函数，我们使用 `app.config.globalProperties`。

### 使用 globalProperties

```javascript
// main.js
const app = createApp(App)

app.config.globalProperties.$http = axios
app.config.globalProperties.$filters = {
  formatDate(value) { /* ... */ }
}
```

### 在组件中使用

-   **选项式 API (Options API)**: 通过 `this` 访问。
    ```javascript
    this.$http.get('/api')
    ```
-   **组合式 API (Composition API)**: 需要通过 `getCurrentInstance`（**不推荐**，因为它是内部 API）或者直接导入。

---

## 问题 2：在 setup() 中如何优雅地使用全局变量？

由于 `setup` 中没有 `this`，访问 `globalProperties` 比较麻烦。Vue 3 推荐以下两种替代方案：

### 1. Provide / Inject (推荐用于应用级配置)

在应用根部提供数据，在任意子组件中注入。

```javascript
// main.js
app.provide('globalConfig', {
  apiUrl: 'https://api.example.com',
  theme: 'dark'
})

// 组件中
import { inject } from 'vue'
const config = inject('globalConfig')
console.log(config.apiUrl)
```

### 2. ES 模块导出 (推荐用于工具函数/常量)

这是最标准、最利于 Tree-shaking 和类型推导的方式。**不要为了“全局”而强行挂载到 Vue 上**。

```javascript
// src/utils/constants.js
export const API_URL = 'https://api.example.com'
export const MAX_COUNT = 100

// 组件中直接导入
import { API_URL } from '@/utils/constants'
```

---

## 问题 3：三种方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
| :--- | :--- | :--- | :--- |
| **globalProperties** | 迁移 Vue 2 老项目，简单的全局工具 | 模板中可直接使用 (`{{ $filters.foo() }}`) | `setup` 中难以访问，类型推导差 |
| **Provide / Inject** | 全局状态、主题配置、插件提供的能力 | 符合 Vue 数据流，解耦 | 需要手动 inject |
| **ES Modules** | 常量、工具函数 (utils)、API 服务 | **最佳实践**，Tree-shaking，类型提示完美 | 模板中使用需要先 return 或挂载 |

## 总结

**核心概念总结**：

### 1. 传统方式
使用 `app.config.globalProperties`，适合需要模版直接访问的场景。

### 2. 现代方式
-   **常量/工具**：直接使用 ES Module `import`。
-   **应用配置**：使用 `App-level Provide`。

## 延伸阅读

-   [Vue 3 官方文档 - 全局属性](https://cn.vuejs.org/api/application.html#app-config-globalproperties)
-   [Vue 3 官方文档 - 依赖注入](https://cn.vuejs.org/guide/components/provide-inject.html)
