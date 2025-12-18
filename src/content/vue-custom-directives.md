---
title: Vue 如何自定义指令 (Custom Directives)？
category: Vue
difficulty: 中级
updatedAt: 2025-11-19
summary: >-
  详解 Vue 自定义指令的创建方法、生命周期钩子以及参数和修饰符的使用，适用于处理底层 DOM 操作。
tags:
  - Vue
  - Directives
  - DOM Manipulation
estimatedTime: 15 分钟
keywords:
  - custom directives
  - v-focus
  - directive hooks
  - binding object
highlight: 自定义指令主要用于复用底层的 DOM 访问逻辑。在 Vue 3 中，指令的钩子函数被重命名以更好地与组件生命周期保持一致。
order: 415
---

## 问题 1：什么是自定义指令？什么时候使用？

Vue 的核心是数据驱动视图，通常我们不需要直接操作 DOM。但在某些情况下，你仍然需要对普通 DOM 元素进行底层的操作，这时就应该使用**自定义指令**。

**常见场景**：
-   自动聚焦输入框 (`v-focus`)。
-   点击元素外部触发事件 (`v-click-outside`)。
-   图片懒加载 (`v-lazy`)。
-   权限控制（移除无权限的按钮）(`v-permission`)。

---

## 问题 2：如何注册和使用指令？

### 1. 局部注册
在组件的 `directives` 选项中注册，或者在 `<script setup>` 中以 `v` 开头的变量直接定义。

```javascript
<script setup>
// 在模板中启用 v-focus
const vFocus = {
  mounted: (el) => el.focus()
}
</script>

<template>
  <input v-focus />
</template>
```

### 2. 全局注册
通过应用实例注册，可以在任何组件中使用。

```javascript
const app = createApp({})

app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})
```

---

## 问题 3：指令的钩子函数有哪些？

Vue 3 对指令的生命周期钩子进行了重命名，使其与组件生命周期更加一致：

-   `created(el, binding, vnode)`: 在绑定元素的属性或事件监听器被应用之前调用。
-   `beforeMount`: 当指令第一次绑定到元素并且在挂载父组件之前调用。
-   **`mounted`**: 在绑定元素的父组件被挂载后调用（**最常用**）。
-   `beforeUpdate`: 在更新包含组件的 VNode 之前调用。
-   **`updated`**: 在包含组件的 VNode **及其子组件的 VNode** 更新后调用。
-   `beforeUnmount`: 在卸载绑定元素的父组件之前调用。
-   `unmounted`: 当指令与元素解除绑定且父组件已卸载时调用。

### 钩子参数详解
-   `el`: 指令绑定的元素，可以直接操作 DOM。
-   `binding`: 一个对象，包含以下属性：
    -   `value`: 传递给指令的值 (例如 `v-my-directive="1 + 1"` 中，值为 `2`)。
    -   `oldValue`: 之前的值，仅在 `beforeUpdate` 和 `updated` 中可用。
    -   `arg`: 传递给指令的参数 (例如 `v-my-directive:foo` 中，参数为 `"foo"`)。
    -   `modifiers`: 一个包含修饰符的对象 (例如 `v-my-directive.foo.bar` 中，修饰符对象为 `{ foo: true, bar: true }`)。

---

## 问题 4：实战示例 - v-permission

```javascript
// 模拟用户权限
const userPermissions = ['read', 'write'];

app.directive('permission', {
  mounted(el, binding) {
    const { value } = binding;
    if (value && !userPermissions.includes(value)) {
      // 如果没有权限，移除元素
      el.parentNode && el.parentNode.removeChild(el);
    }
  }
});

// 使用
// <button v-permission="'admin'">Delete</button> <!-- 会被移除 -->
// <button v-permission="'read'">View</button>   <!-- 会保留 -->
```

## 总结

**核心概念总结**：

### 1. 用途
封装复用底层 DOM 操作逻辑。

### 2. 钩子
`mounted` 和 `updated` 是最常用的钩子。

### 3. 参数
通过 `binding.value` 获取传递的数据，通过 `binding.arg` 和 `binding.modifiers` 获取参数和修饰符。

## 延伸阅读

-   [Vue 3 官方文档 - 自定义指令](https://cn.vuejs.org/guide/reusability/custom-directives.html)
