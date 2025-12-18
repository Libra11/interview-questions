---
title: Vue scoped 是怎么做样式隔离的？
category: Vue
difficulty: 中级
updatedAt: 2025-11-20
summary: >-
  深入解析 Vue 单文件组件中 scoped CSS 的实现原理，包括属性选择器、PostCSS 转换和深度选择器的使用。
tags:
  - Vue
  - CSS
  - Scoped Styles
  - SFC
estimatedTime: 15 分钟
keywords:
  - scoped css
  - style isolation
  - data-v-hash
  - deep selector
  - vue sfc
highlight: scoped 通过为组件的 DOM 元素和 CSS 选择器添加唯一的 data 属性（如 data-v-f3f3eg9），实现样式隔离。
order: 438
---

## 问题 1：scoped 的作用是什么？

在 Vue 单文件组件（SFC）中，`<style scoped>` 可以让样式只作用于当前组件，不会影响其他组件。

```vue
<template>
  <div class="example">Hello</div>
</template>

<style scoped>
.example {
  color: red;
}
</style>
```

这个 `.example` 样式只会应用到当前组件的元素上，不会影响其他组件中的 `.example`。

---

## 问题 2：实现原理

### 1. 添加唯一属性

Vue 会为组件的每个 DOM 元素添加一个唯一的 `data-v-[hash]` 属性。

**编译前**：
```vue
<template>
  <div class="example">Hello</div>
</template>
```

**编译后**：
```html
<div class="example" data-v-f3f3eg9>Hello</div>
```

### 2. 转换 CSS 选择器

同时，CSS 选择器也会被转换，添加属性选择器。

**编译前**：
```css
.example {
  color: red;
}
```

**编译后**：
```css
.example[data-v-f3f3eg9] {
  color: red;
}
```

这样，样式就只会匹配带有 `data-v-f3f3eg9` 属性的元素。

---

## 问题 3：子组件的根元素

**重要**：scoped 样式会应用到子组件的**根元素**上。

```vue
<!-- Parent.vue -->
<template>
  <ChildComponent class="child" />
</template>

<style scoped>
.child {
  color: red; /* 会应用到子组件的根元素 */
}
</style>
```

```vue
<!-- ChildComponent.vue -->
<template>
  <div>I am child</div>
</template>
```

**渲染结果**：
```html
<div class="child" data-v-parent data-v-child>
  I am child
</div>
```

子组件的根元素会同时拥有父组件和子组件的 `data-v-*` 属性。

---

## 问题 4：深度选择器（Deep Selector）

如果你想让 scoped 样式影响子组件的**内部元素**（非根元素），需要使用深度选择器。

### Vue 3 语法

```vue
<style scoped>
/* 使用 :deep() 伪类 */
.parent :deep(.child) {
  color: red;
}
</style>
```

**编译后**：
```css
.parent[data-v-f3f3eg9] .child {
  color: red;
}
```

注意 `data-v-*` 只添加到 `.parent` 上，`.child` 没有属性选择器，所以可以匹配子组件内部的元素。

### 旧语法（仍然支持）

```vue
<style scoped>
/* Vue 2 / Vue 3 都支持 */
.parent >>> .child { }
.parent /deep/ .child { }
.parent ::v-deep .child { }
</style>
```

---

## 问题 5：插槽内容的样式

插槽内容的样式由**父组件**控制，因为插槽内容是在父组件中定义的。

```vue
<!-- Parent.vue -->
<template>
  <ChildComponent>
    <div class="slot-content">Slot</div>
  </ChildComponent>
</template>

<style scoped>
.slot-content {
  color: red; /* ✅ 会生效 */
}
</style>
```

```vue
<!-- ChildComponent.vue -->
<template>
  <div>
    <slot></slot>
  </div>
</template>

<style scoped>
.slot-content {
  color: blue; /* ❌ 不会生效 */
}
</style>
```

---

## 问题 6：全局选择器（:global）

如果需要在 scoped 样式中定义全局样式，使用 `:global()`。

```vue
<style scoped>
/* 局部样式 */
.local {
  color: red;
}

/* 全局样式 */
:global(.global) {
  color: blue;
}
</style>
```

**编译后**：
```css
.local[data-v-f3f3eg9] {
  color: red;
}

.global {
  color: blue; /* 没有属性选择器 */
}
```

---

## 问题 7：注意事项

### 1. 性能影响

属性选择器的性能略低于类选择器，但在现代浏览器中影响微乎其微。

### 2. 动态生成的内容

通过 `v-html` 创建的 DOM 不会应用 scoped 样式（因为没有 `data-v-*` 属性）。

```vue
<template>
  <div v-html="html"></div>
</template>

<style scoped>
/* 不会应用到 v-html 生成的内容 */
p {
  color: red;
}
</style>
```

**解决方案**：使用深度选择器或全局样式。

### 3. 第三方组件库

scoped 样式无法直接修改第三方组件的内部样式，需要使用深度选择器。

```vue
<style scoped>
/* 修改 Element Plus 组件的样式 */
:deep(.el-button) {
  background: red;
}
</style>
```

---

## 问题 8：CSS Modules 替代方案

除了 scoped，Vue 还支持 CSS Modules。

```vue
<template>
  <div :class="$style.example">Hello</div>
</template>

<style module>
.example {
  color: red;
}
</style>
```

**优势**：
- 更强的样式隔离（类名哈希化）
- 更好的 TypeScript 支持
- 可以在 JS 中使用样式类名

## 总结

**核心概念总结**：

### 1. 实现原理
通过添加唯一的 `data-v-[hash]` 属性和转换 CSS 选择器实现样式隔离。

### 2. 深度选择器
- Vue 3: `:deep()`
- 旧语法: `>>>`, `/deep/`, `::v-deep`

### 3. 注意事项
- 子组件根元素会受影响
- 插槽内容由父组件控制
- v-html 生成的内容不受影响

## 延伸阅读

- [Vue 官方文档 - Scoped CSS](https://cn.vuejs.org/api/sfc-css-features.html#scoped-css)
- [Vue 官方文档 - CSS Modules](https://cn.vuejs.org/api/sfc-css-features.html#css-modules)
