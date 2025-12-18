---
title: Vue 子组件能否使用未定义的 Props？(Fallthrough Attributes)
category: Vue
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  解析 Vue 的透传 Attributes (Fallthrough Attributes) 机制，解释未在 props 中声明的属性如何自动应用到根元素，以及如何禁用和手动控制这一行为。
tags:
  - Vue
  - Props
  - Attributes
  - Fallthrough
estimatedTime: 15 分钟
keywords:
  - fallthrough attributes
  - $attrs
  - inheritAttrs
  - undefined props
highlight: 未定义的 Props 不会丢失，它们会作为透传 Attributes 自动添加到子组件的根元素上，或者通过 $attrs 手动访问。
order: 422
---

## 问题 1：子组件能接收未定义的 Props 吗？

**可以**。

在 Vue 中，如果父组件向子组件传递了某个属性（如 `class`, `style`, `id`, `data-xxx` 或自定义属性），但子组件**没有**在 `defineProps` 或 `props` 选项中声明它，那么这个属性被称为 **透传 Attribute (Fallthrough Attribute)**。

---

## 问题 2：透传 Attributes 的默认行为是什么？

默认情况下，Vue 会自动将这些属性**添加到子组件的根元素**上。

**示例**：

```javascript
// Parent.vue
<MyButton class="large" id="btn-1" custom-attr="123" />

// MyButton.vue (template)
<button class="btn">Click Me</button>
```

**渲染结果**：
```html
<!-- class 自动合并，id 和其他属性自动添加 -->
<button class="btn large" id="btn-1" custom-attr="123">Click Me</button>
```

这也包括 `v-on` 事件监听器。如果父组件传递了 `@click`，它也会自动绑定到根元素上。

---

## 问题 3：如何禁用或手动控制透传？

有时我们不希望属性自动应用到根元素（例如：根元素是外层容器，但我们想把 `class` 或 `onClick` 应用到内部的 `<input>` 元素上）。

### 1. 禁用属性继承

在组件选项中设置 `inheritAttrs: false`。

```javascript
<script setup>
defineOptions({
  inheritAttrs: false
})
</script>
```

### 2. 手动访问 ($attrs)

禁用继承后，你可以通过 `$attrs` 对象访问这些属性，并将它们绑定到任意元素。

```html
<template>
  <div class="wrapper">
    <label>Label</label>
    <!-- 将所有透传属性绑定到 input 上 -->
    <input v-bind="$attrs" />
  </div>
</template>
```

在 JS 中访问：
```javascript
import { useAttrs } from 'vue'
const attrs = useAttrs()
console.log(attrs.class)
```

## 总结

**核心概念总结**：

### 1. 机制
未声明的 Props 变成 `$attrs`。

### 2. 默认行为
自动“透传”并绑定到组件的**根节点**。

### 3. 控制
使用 `inheritAttrs: false` 禁用自动绑定，使用 `v-bind="$attrs"` 手动绑定。

## 延伸阅读

-   [Vue 3 官方文档 - 透传 Attributes](https://cn.vuejs.org/guide/components/attrs.html)
