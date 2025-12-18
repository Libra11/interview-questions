---
title: transition 组件原理？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue Transition 组件的工作原理，掌握其如何实现进入/离开动画。
tags:
  - Vue
  - Transition
  - 动画
  - CSS
estimatedTime: 15 分钟
keywords:
  - Transition 原理
  - 过渡动画
  - CSS 动画
highlight: Transition 通过在元素插入/移除时添加 CSS 类名，配合 CSS 过渡或动画实现效果。
order: 593
---

## 问题 1：Transition 的基本原理

`<Transition>` 组件在元素**插入**和**移除**时，自动添加/移除 CSS 类名：

```vue
<template>
  <Transition name="fade">
    <div v-if="show">Content</div>
  </Transition>
</template>

<style>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
</style>
```

---

## 问题 2：类名添加时机

### 进入过渡

```
v-enter-from    → v-enter-active → v-enter-to
(插入前添加)      (整个过渡期间)    (插入后下一帧)
                                   (过渡结束后移除所有)
```

### 离开过渡

```
v-leave-from    → v-leave-active → v-leave-to
(离开前添加)      (整个过渡期间)    (离开后下一帧)
                                   (过渡结束后移除元素)
```

---

## 问题 3：内部实现流程

```javascript
// 简化的 Transition 实现
const Transition = {
  setup(props, { slots }) {
    return () => {
      const child = slots.default()[0];

      // 包装 vnode，添加过渡钩子
      child.transition = {
        beforeEnter(el) {
          el.classList.add(`${name}-enter-from`);
          el.classList.add(`${name}-enter-active`);
        },

        enter(el) {
          // 下一帧
          requestAnimationFrame(() => {
            el.classList.remove(`${name}-enter-from`);
            el.classList.add(`${name}-enter-to`);
          });

          // 监听过渡结束
          el.addEventListener("transitionend", () => {
            el.classList.remove(`${name}-enter-active`);
            el.classList.remove(`${name}-enter-to`);
          });
        },

        leave(el, done) {
          el.classList.add(`${name}-leave-from`);
          el.classList.add(`${name}-leave-active`);

          requestAnimationFrame(() => {
            el.classList.remove(`${name}-leave-from`);
            el.classList.add(`${name}-leave-to`);
          });

          el.addEventListener("transitionend", done);
        },
      };

      return child;
    };
  },
};
```

---

## 问题 4：过渡模式

```vue
<template>
  <!-- out-in: 先离开，再进入 -->
  <Transition name="fade" mode="out-in">
    <component :is="currentComponent" />
  </Transition>

  <!-- in-out: 先进入，再离开 -->
  <Transition name="fade" mode="in-out">
    <component :is="currentComponent" />
  </Transition>
</template>
```

### 实现原理

```javascript
// out-in 模式
if (mode === "out-in") {
  // 等待离开动画完成
  await leaveTransition(oldChild);
  // 再执行进入动画
  enterTransition(newChild);
}

// in-out 模式
if (mode === "in-out") {
  // 先执行进入动画
  enterTransition(newChild);
  // 再执行离开动画
  await leaveTransition(oldChild);
}
```

---

## 问题 5：JavaScript 钩子

```vue
<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    :css="false"
  >
    <div v-if="show">Content</div>
  </Transition>
</template>

<script setup>
function onEnter(el, done) {
  // 使用 GSAP 等库
  gsap.to(el, {
    opacity: 1,
    duration: 0.3,
    onComplete: done,
  });
}

function onLeave(el, done) {
  gsap.to(el, {
    opacity: 0,
    duration: 0.3,
    onComplete: done,
  });
}
</script>
```

---

## 问题 6：TransitionGroup 原理

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </TransitionGroup>
</template>
```

### 移动动画（FLIP）

```javascript
// TransitionGroup 使用 FLIP 技术处理移动
function applyMoveTransition(children) {
  // 1. 记录旧位置
  children.forEach((child) => {
    child._oldPos = child.el.getBoundingClientRect();
  });

  // 2. DOM 更新后，记录新位置
  nextTick(() => {
    children.forEach((child) => {
      const newPos = child.el.getBoundingClientRect();
      const dx = child._oldPos.left - newPos.left;
      const dy = child._oldPos.top - newPos.top;

      if (dx || dy) {
        // 3. 用 transform 移回旧位置
        child.el.style.transform = `translate(${dx}px, ${dy}px)`;

        // 4. 下一帧移除 transform，触发过渡
        requestAnimationFrame(() => {
          child.el.classList.add("list-move");
          child.el.style.transform = "";
        });
      }
    });
  });
}
```

---

## 问题 7：性能优化

### 使用 will-change

```css
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
  will-change: opacity;
}
```

### 使用 transform 代替位置属性

```css
/* ❌ 触发重排 */
.slide-enter-from {
  left: -100px;
}

/* ✅ 只触发合成 */
.slide-enter-from {
  transform: translateX(-100px);
}
```

## 延伸阅读

- [Vue 官方文档 - Transition](https://cn.vuejs.org/guide/built-ins/transition.html)
- [FLIP 动画技术](https://aerotwist.com/blog/flip-your-animations/)
