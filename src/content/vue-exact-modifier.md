---
title: Vue 事件修饰符 .exact 的作用
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  解析 Vue 事件修饰符 .exact 的作用，它如何确保只有精确的按键组合才能触发事件，避免额外的修饰键干扰。
tags:
  - Vue
  - Event Modifiers
  - Keyboard Events
estimatedTime: 8 分钟
keywords:
  - exact modifier
  - event modifiers
  - keyboard modifiers
  - ctrl alt shift
highlight: .exact 修饰符用于精确控制触发事件所需的系统修饰键组合，确保没有其他修饰键被按下。
order: 430
---

## 问题 1：.exact 修饰符的作用是什么？

`.exact` 修饰符用于控制触发事件所需的**精确的系统修饰键组合**。

在没有 `.exact` 的情况下，即使按下了额外的修饰键，事件仍然会触发。使用 `.exact` 后，只有在**恰好**按下指定的修饰键（不多不少）时，事件才会触发。

---

## 问题 2：使用示例

### 不使用 .exact（宽松匹配）

```vue
<template>
  <!-- 按下 Ctrl + Click 会触发 -->
  <!-- 按下 Ctrl + Shift + Click 也会触发 ❗ -->
  <button @click.ctrl="handleCtrlClick">Ctrl + Click</button>
</template>
```

### 使用 .exact（精确匹配）

```vue
<template>
  <!-- 只有按下 Ctrl + Click（没有其他修饰键）才会触发 -->
  <!-- 按下 Ctrl + Shift + Click 不会触发 ✅ -->
  <button @click.ctrl.exact="handleCtrlClick">
    Exact Ctrl + Click
  </button>
</template>
```

---

## 问题 3：常见应用场景

### 1. 精确的快捷键

```vue
<template>
  <!-- 只有 Ctrl + S（不能有其他修饰键）才保存 -->
  <div @keyup.ctrl.s.exact="save">
    Content
  </div>
</template>
```

### 2. 区分不同的组合键

```vue
<template>
  <!-- Ctrl + Click: 在新标签页打开 -->
  <a @click.ctrl.exact="openInNewTab">Link</a>

  <!-- Ctrl + Shift + Click: 在新窗口打开 -->
  <a @click.ctrl.shift.exact="openInNewWindow">Link</a>

  <!-- 普通 Click: 当前页打开 -->
  <a @click.exact="openInCurrentTab">Link</a>
</template>
```

### 3. 防止误触发

```vue
<template>
  <!-- 只有单独按下 Enter（没有 Ctrl/Shift/Alt）才提交 -->
  <input @keyup.enter.exact="submit" />
</template>
```

---

## 问题 4：系统修饰键

Vue 支持的系统修饰键包括：

- `.ctrl`
- `.alt`
- `.shift`
- `.meta`（Mac 的 Command 键，Windows 的 Windows 键）

### 组合使用

```vue
<!-- 必须同时按下 Ctrl + Alt，且没有其他修饰键 -->
<button @click.ctrl.alt.exact="handler">
  Ctrl + Alt + Click
</button>
```

---

## 问题 5：.exact 的特殊用法

### 没有任何修饰键

```vue
<template>
  <!-- 只有在没有按下任何系统修饰键时才触发 -->
  <button @click.exact="handleClick">
    Normal Click Only
  </button>
</template>
```

这在需要区分"普通点击"和"带修饰键的点击"时非常有用。

## 总结

**核心概念总结**：

### 1. 作用
确保事件触发时，系统修饰键的组合是**精确**的，不多不少。

### 2. 语法
`@event.modifier.exact` 或 `@event.exact`（无修饰键）

### 3. 适用场景
- 实现精确的快捷键
- 区分不同的按键组合
- 防止额外修饰键的干扰

## 延伸阅读

- [Vue 官方文档 - 事件修饰符](https://cn.vuejs.org/guide/essentials/event-handling.html#event-modifiers)
- [Vue 官方文档 - 按键修饰符](https://cn.vuejs.org/guide/essentials/event-handling.html#key-modifiers)
