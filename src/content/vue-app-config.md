---
title: Vue app.config 有哪些应用配置？
category: Vue
difficulty: 中级
updatedAt: 2025-11-20
summary: >-
  全面介绍 Vue 3 应用实例的配置选项，包括全局属性、错误处理、性能追踪和编译器选项等。
tags:
  - Vue
  - Configuration
  - app.config
  - Global API
estimatedTime: 15 分钟
keywords:
  - app.config
  - globalProperties
  - errorHandler
  - performance
  - compilerOptions
highlight: app.config 提供了丰富的应用级配置选项，可以自定义错误处理、性能追踪、全局属性等行为。
order: 155
---

## 问题 1：app.config 有哪些常用配置？

Vue 3 的应用实例通过 `app.config` 暴露了多个配置选项：

1. **globalProperties** - 全局属性
2. **errorHandler** - 全局错误处理
3. **warnHandler** - 警告处理
4. **performance** - 性能追踪
5. **compilerOptions** - 编译器选项
6. **optionMergeStrategies** - 自定义选项合并策略

---

## 问题 2：globalProperties（全局属性）

用于添加可在任何组件实例中访问的全局属性。

```javascript
import { createApp } from 'vue'
import axios from 'axios'

const app = createApp(App)

// 添加全局属性
app.config.globalProperties.$http = axios
app.config.globalProperties.$filters = {
  formatDate(date) {
    return new Date(date).toLocaleDateString()
  }
}

app.mount('#app')
```

### 在组件中使用

```vue
<!-- Options API -->
<script>
export default {
  mounted() {
    this.$http.get('/api/data')
    console.log(this.$filters.formatDate(Date.now()))
  }
}
</script>

<!-- Composition API (不推荐) -->
<script setup>
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
const $http = instance.appContext.config.globalProperties.$http
</script>
```

**注意**：在 Composition API 中，推荐使用 ES 模块导入或 Provide/Inject，而不是 globalProperties。

---

## 问题 3：errorHandler（全局错误处理）

捕获所有组件中未处理的错误。

```javascript
app.config.errorHandler = (err, instance, info) => {
  // err: 错误对象
  // instance: 发生错误的组件实例
  // info: Vue 特定的错误信息（如生命周期钩子名称）
  
  console.error('Global error:', err)
  console.log('Component:', instance)
  console.log('Error info:', info)
  
  // 发送到错误追踪服务
  reportError({
    message: err.message,
    stack: err.stack,
    component: instance?.$options.name,
    info
  })
}
```

### 错误信息类型

`info` 参数可能的值：
- `'render'` - 渲染函数
- `'setup'` - setup 函数
- `'mounted'` - 生命周期钩子
- `'watch'` - 侦听器
- 等等

---

## 问题 4：warnHandler（警告处理）

捕获 Vue 的运行时警告。

```javascript
app.config.warnHandler = (msg, instance, trace) => {
  // msg: 警告消息
  // instance: 组件实例
  // trace: 组件追踪栈
  
  console.warn('Vue warning:', msg)
  console.log('Trace:', trace)
}
```

**注意**：仅在开发模式下生效，生产环境会被忽略。

---

## 问题 5：performance（性能追踪）

启用浏览器开发工具的性能追踪。

```javascript
// 仅在开发模式下启用
if (process.env.NODE_ENV === 'development') {
  app.config.performance = true
}
```

启用后，可以在浏览器的 Performance 面板中看到：
- 组件初始化
- 编译
- 渲染
- 更新

的性能数据。

---

## 问题 6：compilerOptions（编译器选项）

配置运行时编译器的行为。

### isCustomElement

告诉 Vue 哪些标签是自定义元素，避免警告。

```javascript
app.config.compilerOptions.isCustomElement = (tag) => {
  return tag.startsWith('ion-') // Ionic 组件
}

// 或者使用正则
app.config.compilerOptions.isCustomElement = (tag) => {
  return /^ion-/.test(tag)
}
```

### whitespace

控制模板中空白字符的处理。

```javascript
// 'condense' (默认): 压缩空白
// 'preserve': 保留空白
app.config.compilerOptions.whitespace = 'preserve'
```

### delimiters

自定义插值分隔符（默认是 `{{ }}`）。

```javascript
app.config.compilerOptions.delimiters = ['${', '}']
```

```vue
<!-- 现在可以使用 -->
<div>${ message }</div>
```

### comments

是否保留模板中的 HTML 注释。

```javascript
app.config.compilerOptions.comments = true
```

---

## 问题 7：optionMergeStrategies（自定义合并策略）

自定义选项的合并策略（高级用法）。

```javascript
const app = createApp({
  // 自定义选项
  customOption: 'hello'
})

// 定义合并策略
app.config.optionMergeStrategies.customOption = (toVal, fromVal) => {
  return fromVal !== undefined ? fromVal : toVal
}
```

---

## 问题 8：完整配置示例

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

const app = createApp(App)

// 全局属性
app.config.globalProperties.$http = axios

// 错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Error:', err)
  // 发送到 Sentry 等错误追踪服务
}

// 警告处理（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('Warning:', msg)
  }
  
  // 性能追踪
  app.config.performance = true
}

// 编译器选项
app.config.compilerOptions.isCustomElement = (tag) => {
  return tag.startsWith('my-')
}

app.mount('#app')
```

## 总结

**核心概念总结**：

### 1. 全局配置
- `globalProperties`: 添加全局属性
- `errorHandler`: 全局错误处理
- `performance`: 性能追踪

### 2. 编译器配置
- `isCustomElement`: 识别自定义元素
- `delimiters`: 自定义插值语法
- `whitespace`: 空白处理

### 3. 最佳实践
- 错误处理：集成错误追踪服务
- 性能追踪：仅在开发环境启用
- 全局属性：优先使用 Provide/Inject

## 延伸阅读

- [Vue 官方文档 - 应用配置](https://cn.vuejs.org/api/application.html#app-config)
