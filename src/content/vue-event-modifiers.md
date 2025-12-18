---
title: Vue 提供了哪些默认事件修饰符？
category: Vue
difficulty: 入门
updatedAt: 2025-11-20
summary: >-
  全面盘点 Vue 提供的事件修饰符，包括事件行为修饰符（stop、prevent）、按键修饰符（enter、tab）和系统修饰键（ctrl、alt）等。
tags:
  - Vue
  - Event Modifiers
  - Event Handling
estimatedTime: 15 分钟
keywords:
  - event modifiers
  - stop prevent
  - key modifiers
  - mouse modifiers
  - passive once capture
highlight: Vue 的事件修饰符让我们能够以声明式的方式处理 DOM 事件的细节，无需在方法中编写事件处理逻辑。
order: 431
---

## 问题 1：Vue 有哪些事件修饰符？

Vue 提供了丰富的事件修饰符，可以分为以下几类：

1. **事件行为修饰符**
2. **按键修饰符**
3. **系统修饰键**
4. **鼠标按钮修饰符**

---

## 问题 2：事件行为修饰符

### 1. .stop
阻止事件冒泡（相当于 `event.stopPropagation()`）。

```vue
<template>
  <div @click="handleParent">
    Parent
    <!-- 点击按钮不会触发父元素的 handleParent -->
    <button @click.stop="handleChild">Child</button>
  </div>
</template>
```

### 2. .prevent
阻止默认行为（相当于 `event.preventDefault()`）。

```vue
<template>
  <!-- 阻止表单提交的默认行为 -->
  <form @submit.prevent="handleSubmit">
    <button type="submit">Submit</button>
  </form>

  <!-- 阻止链接跳转 -->
  <a href="https://example.com" @click.prevent="handleClick">Link</a>
</template>
```

### 3. .capture
使用事件捕获模式（从外向内触发）。

```vue
<template>
  <!-- 捕获阶段触发，先于子元素 -->
  <div @click.capture="handleParent">
    <button @click="handleChild">Click</button>
  </div>
</template>
```

### 4. .self
只有当事件是从侦听器绑定的元素本身触发时才触发回调（不包括子元素）。

```vue
<template>
  <!-- 只有点击 div 本身才触发，点击 button 不触发 -->
  <div @click.self="handleDiv">
    <button>Click Me</button>
  </div>
</template>
```

### 5. .once
事件只触发一次。

```vue
<template>
  <!-- 只会触发一次 -->
  <button @click.once="handleClick">Click Once</button>
</template>
```

### 6. .passive
告诉浏览器你不会调用 `preventDefault()`，提升移动端滚动性能。

```vue
<template>
  <!-- 提升滚动性能 -->
  <div @scroll.passive="handleScroll">
    Scrollable content
  </div>
</template>
```

**注意**：不要把 `.passive` 和 `.prevent` 一起使用，`.prevent` 会被忽略。

---

## 问题 3：按键修饰符

### 常用按键别名

```vue
<template>
  <!-- Enter 键 -->
  <input @keyup.enter="submit" />

  <!-- Tab 键 -->
  <input @keyup.tab="nextField" />

  <!-- Delete 或 Backspace -->
  <input @keyup.delete="handleDelete" />

  <!-- Esc -->
  <input @keyup.esc="cancel" />

  <!-- 空格 -->
  <input @keyup.space="handleSpace" />

  <!-- 上下左右箭头 -->
  <input @keyup.up="moveUp" />
  <input @keyup.down="moveDown" />
  <input @keyup.left="moveLeft" />
  <input @keyup.right="moveRight" />
</template>
```

### 自定义按键修饰符（KeyCode）

```vue
<template>
  <!-- 按下 F1 键（keyCode 112） -->
  <input @keyup.112="showHelp" />
</template>
```

---

## 问题 4：系统修饰键

```vue
<template>
  <!-- Ctrl + Click -->
  <button @click.ctrl="handleCtrlClick">Ctrl Click</button>

  <!-- Alt + Click -->
  <button @click.alt="handleAltClick">Alt Click</button>

  <!-- Shift + Click -->
  <button @click.shift="handleShiftClick">Shift Click</button>

  <!-- Meta (Mac Command / Windows 键) -->
  <button @click.meta="handleMetaClick">Meta Click</button>

  <!-- 精确匹配：只有 Ctrl，没有其他修饰键 -->
  <button @click.ctrl.exact="handleExactCtrl">Exact Ctrl</button>
</template>
```

---

## 问题 5：鼠标按钮修饰符

```vue
<template>
  <!-- 左键点击 -->
  <button @click.left="handleLeftClick">Left Click</button>

  <!-- 右键点击 -->
  <button @click.right="handleRightClick">Right Click</button>

  <!-- 中键点击 -->
  <button @click.middle="handleMiddleClick">Middle Click</button>
</template>
```

---

## 问题 6：修饰符链式调用

修饰符可以串联使用，**顺序很重要**。

```vue
<template>
  <!-- 先阻止默认行为，再阻止冒泡 -->
  <a @click.prevent.stop="handleClick">Link</a>

  <!-- Ctrl + Enter 提交 -->
  <input @keyup.ctrl.enter="submit" />

  <!-- 只触发一次，且阻止默认行为 -->
  <form @submit.prevent.once="handleSubmit">
    <button type="submit">Submit</button>
  </form>
</template>
```

## 总结

**核心概念总结**：

### 1. 事件行为
`.stop`, `.prevent`, `.capture`, `.self`, `.once`, `.passive`

### 2. 按键
`.enter`, `.tab`, `.delete`, `.esc`, `.space`, `.up`, `.down`, `.left`, `.right`

### 3. 系统修饰键
`.ctrl`, `.alt`, `.shift`, `.meta`, `.exact`

### 4. 鼠标按钮
`.left`, `.right`, `.middle`

## 延伸阅读

- [Vue 官方文档 - 事件处理](https://cn.vuejs.org/guide/essentials/event-handling.html)
