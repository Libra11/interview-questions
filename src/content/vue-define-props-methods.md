---
title: Vue 子组件定义 Props 的方式有哪些？
category: Vue
difficulty: 入门
updatedAt: 2025-11-19
summary: >-
  全面总结 Vue 中定义 Props 的多种方式，从传统的 Options API 到 Composition API 的 defineProps，再到 TypeScript 的类型声明。
tags:
  - Vue
  - Props
  - defineProps
  - TypeScript
  - Options API
estimatedTime: 15 分钟
keywords:
  - vue props definition
  - defineProps
  - withDefaults
  - prop validation
  - typescript props
highlight: Vue 提供了灵活的 Props 定义方式，推荐在 <script setup> 中使用 defineProps 配合 TypeScript 类型声明，以获得最佳的类型推导和开发体验。
order: 423
---

## 问题 1：Options API (选项式 API) 有哪两种方式？

在 Vue 2 和 Vue 3 的非 `<script setup>` 组件中，我们通过 `props` 选项来定义。

### 1. 数组语法 (简单声明)
只声明 prop 的名称，不做任何校验。

```javascript
export default {
  props: ['title', 'likes']
}
```

### 2. 对象语法 (详细声明 - 推荐)
可以指定类型、默认值、必填项和自定义验证器。

```javascript
export default {
  props: {
    title: String,
    likes: {
      type: Number,
      default: 0,
      required: false,
      validator(value) {
        return value >= 0
      }
    }
  }
}
```

---

## 问题 2：Composition API (组合式 API) 如何定义？

### 1. setup() 函数中
在使用 `setup()` 函数时，`props` 对象作为第一个参数传入。**注意：props 对象是响应式的，不能解构，否则会丢失响应性**（除非使用 `toRefs`）。

```javascript
export default {
  props: {
    title: String
  },
  setup(props) {
    console.log(props.title)
  }
}
```

### 2. `<script setup>` 中的 defineProps (运行时声明)
这是 Vue 3 最常用的方式。`defineProps` 是一个宏，不需要导入。

```javascript
<script setup>
const props = defineProps({
  title: String,
  likes: {
    type: Number,
    default: 0
  }
})
</script>
```

---

## 问题 3：如何使用 TypeScript 进行类型声明 (Type-only)？

在 `<script setup lang="ts">` 中，我们可以直接使用 TS 接口来定义 props，这是**最推荐**的方式，因为它可以提供完美的类型推导。

### 1. 基本用法

```typescript
<script setup lang="ts">
interface Props {
  title: string
  likes?: number
  labels?: string[]
}

// 宏会自动将 TS 类型编译为运行时的 props 选项
const props = defineProps<Props>()
</script>
```

### 2. 设置默认值 (withDefaults)
TS 接口无法直接定义运行时默认值，需要配合 `withDefaults` 宏。

```typescript
<script setup lang="ts">
interface Props {
  msg?: string
  labels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  labels: () => ['one', 'two'] // 复杂类型需要用函数返回
})
</script>
```

**Vue 3.5+ 更新**：
在 Vue 3.5+ 中，你可以直接解构 `defineProps` 的返回值，Vue 编译器会自动处理响应性丢失问题，并支持默认值语法（Reactive Props Destructure）。

```typescript
// Vue 3.5+
const { msg = 'hello', count } = defineProps<{ msg?: string, count: number }>()
```

## 总结

**核心概念总结**：

### 1. 运行时声明 (Runtime)
-   `props: ['foo']` 或 `defineProps({ foo: String })`。
-   优点：简单，支持运行时校验。
-   缺点：TS 类型推导较弱。

### 2. 类型声明 (Type-based)
-   `defineProps<{ foo: string }>()`。
-   优点：**类型安全**，IDE 支持最好，是 TS 项目的首选。

## 延伸阅读

-   [Vue 3 官方文档 - Props](https://cn.vuejs.org/guide/components/props.html)
-   [Vue 3 官方文档 - TypeScript 与组合式 API](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props)
