---
title: 动画钩子 before-enter、enter、after-enter？
category: Vue
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  掌握 Vue Transition 组件的 JavaScript 动画钩子及其使用场景。
tags:
  - Vue
  - Transition
  - 动画钩子
  - JavaScript 动画
estimatedTime: 10 分钟
keywords:
  - 动画钩子
  - before-enter
  - enter
  - after-enter
highlight: 动画钩子允许使用 JavaScript 控制动画，适合复杂动画或与动画库集成。
order: 258
---

## 问题 1：完整的钩子列表

```vue
<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @enter-cancelled="onEnterCancelled"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @leave-cancelled="onLeaveCancelled"
  >
    <div v-if="show">Content</div>
  </Transition>
</template>
```

---

## 问题 2：进入动画钩子

### before-enter

```javascript
// 元素插入 DOM 前调用
function onBeforeEnter(el) {
  // 设置初始状态
  el.style.opacity = 0;
  el.style.transform = "translateY(-20px)";
}
```

### enter

```javascript
// 元素插入 DOM 后下一帧调用
function onEnter(el, done) {
  // 执行动画
  // done 回调必须调用，表示动画结束

  // 使用 Web Animations API
  el.animate(
    [
      { opacity: 0, transform: "translateY(-20px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    {
      duration: 300,
      easing: "ease-out",
    }
  ).onfinish = done;
}
```

### after-enter

```javascript
// 进入动画完成后调用
function onAfterEnter(el) {
  // 清理工作
  el.style.transform = "";
  console.log("进入动画完成");
}
```

---

## 问题 3：离开动画钩子

### before-leave

```javascript
// 离开动画开始前调用
function onBeforeLeave(el) {
  // 记录当前状态
  el.style.opacity = 1;
}
```

### leave

```javascript
// 离开动画开始时调用
function onLeave(el, done) {
  // 执行离开动画
  el.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.9)" },
    ],
    {
      duration: 200,
      easing: "ease-in",
    }
  ).onfinish = done;
}
```

### after-leave

```javascript
// 离开动画完成后调用
// 此时元素已从 DOM 移除
function onAfterLeave(el) {
  console.log("离开动画完成");
}
```

---

## 问题 4：取消钩子

```javascript
// 进入动画被中断时调用
function onEnterCancelled(el) {
  // 清理未完成的动画
  el.getAnimations().forEach((a) => a.cancel());
}

// 离开动画被中断时调用（仅 v-show）
function onLeaveCancelled(el) {
  el.getAnimations().forEach((a) => a.cancel());
}
```

---

## 问题 5：配合动画库使用

### GSAP

```vue
<script setup>
import gsap from "gsap";

function onBeforeEnter(el) {
  gsap.set(el, { opacity: 0, y: -20 });
}

function onEnter(el, done) {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: "power2.out",
    onComplete: done,
  });
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    y: 20,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done,
  });
}
</script>

<template>
  <Transition
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div v-if="show">Content</div>
  </Transition>
</template>
```

### Anime.js

```javascript
import anime from "animejs";

function onEnter(el, done) {
  anime({
    targets: el,
    opacity: [0, 1],
    translateY: [-20, 0],
    duration: 300,
    easing: "easeOutQuad",
    complete: done,
  });
}
```

---

## 问题 6：禁用 CSS 过渡

```vue
<template>
  <!-- :css="false" 告诉 Vue 跳过 CSS 检测 -->
  <Transition :css="false" @enter="onEnter" @leave="onLeave">
    <div v-if="show">Content</div>
  </Transition>
</template>
```

使用 `:css="false"` 的好处：

- 避免 CSS 规则干扰
- 提高性能（跳过 CSS 检测）
- 完全由 JavaScript 控制

---

## 问题 7：实际应用示例

### 弹窗动画

```vue
<script setup>
function onBeforeEnter(el) {
  el.style.opacity = 0;
  el.style.transform = "scale(0.9)";
}

function onEnter(el, done) {
  el.offsetHeight; // 强制重排
  el.style.transition = "all 0.3s ease-out";
  el.style.opacity = 1;
  el.style.transform = "scale(1)";
  el.addEventListener("transitionend", done, { once: true });
}

function onLeave(el, done) {
  el.style.transition = "all 0.2s ease-in";
  el.style.opacity = 0;
  el.style.transform = "scale(0.9)";
  el.addEventListener("transitionend", done, { once: true });
}

function onAfterEnter(el) {
  el.style.transition = "";
  el.style.transform = "";
}
</script>

<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
    @after-enter="onAfterEnter"
  >
    <div v-if="visible" class="modal">Modal Content</div>
  </Transition>
</template>
```

## 延伸阅读

- [Vue 官方文档 - JavaScript 钩子](https://cn.vuejs.org/guide/built-ins/transition.html#javascript-hooks)
- [GSAP 官方文档](https://greensock.com/docs/)
