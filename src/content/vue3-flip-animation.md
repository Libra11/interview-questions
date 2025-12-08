---
title: Vue3 中如何使用 FLIP 动画？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  掌握 FLIP 动画技术在 Vue3 中的应用，实现流畅的列表重排动画。
tags:
  - Vue
  - FLIP
  - 动画
  - TransitionGroup
estimatedTime: 15 分钟
keywords:
  - FLIP 动画
  - TransitionGroup
  - 列表动画
highlight: FLIP 通过记录位置变化，使用 transform 反向补偿，实现 60fps 的流畅动画。
order: 259
---

## 问题 1：什么是 FLIP？

FLIP 是一种高性能动画技术：

- **F**irst：记录元素的初始位置
- **L**ast：记录元素的最终位置
- **I**nvert：计算差值，用 transform 移回初始位置
- **P**lay：移除 transform，让元素动画到最终位置

```javascript
// FLIP 核心原理
function flip(element) {
  // First: 记录初始位置
  const first = element.getBoundingClientRect();

  // 执行 DOM 变更...

  // Last: 记录最终位置
  const last = element.getBoundingClientRect();

  // Invert: 计算差值
  const dx = first.left - last.left;
  const dy = first.top - last.top;

  // 用 transform 移回初始位置
  element.style.transform = `translate(${dx}px, ${dy}px)`;

  // Play: 下一帧移除 transform
  requestAnimationFrame(() => {
    element.style.transition = "transform 0.3s";
    element.style.transform = "";
  });
}
```

---

## 问题 2：TransitionGroup 内置 FLIP

Vue 的 `<TransitionGroup>` 内置了 FLIP 支持：

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style>
/* 移动动画 */
.list-move {
  transition: transform 0.3s ease;
}

/* 进入/离开动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 离开时脱离文档流，让其他元素可以移动 */
.list-leave-active {
  position: absolute;
}
</style>
```

---

## 问题 3：手动实现 FLIP

```vue
<script setup>
import { ref, nextTick } from 'vue'

const items = ref([...])
const itemRefs = ref({})

async function shuffle() {
  // First: 记录所有元素位置
  const positions = {}
  for (const [id, el] of Object.entries(itemRefs.value)) {
    positions[id] = el.getBoundingClientRect()
  }

  // 执行数据变更
  items.value = shuffleArray([...items.value])

  // 等待 DOM 更新
  await nextTick()

  // Last + Invert + Play
  for (const [id, el] of Object.entries(itemRefs.value)) {
    const first = positions[id]
    const last = el.getBoundingClientRect()

    const dx = first.left - last.left
    const dy = first.top - last.top

    if (dx === 0 && dy === 0) continue

    // Invert
    el.style.transform = `translate(${dx}px, ${dy}px)`
    el.style.transition = 'none'

    // Play
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.3s ease'
      el.style.transform = ''
    })
  }
}
</script>

<template>
  <div class="grid">
    <div
      v-for="item in items"
      :key="item.id"
      :ref="(el) => (itemRefs[item.id] = el)"
    >
      {{ item.name }}
    </div>
  </div>
  <button @click="shuffle">Shuffle</button>
</template>
```

---

## 问题 4：使用 VueUse

```javascript
import { useTransition } from "@vueuse/core";

const source = ref(0);
const output = useTransition(source, {
  duration: 1000,
  transition: [0.4, 0, 0.2, 1], // cubic-bezier
});

// 改变 source，output 会平滑过渡
source.value = 100;
```

---

## 问题 5：复杂布局 FLIP

### 网格布局

```vue
<script setup>
import { ref, nextTick } from 'vue'

const items = ref([...])

async function reorder() {
  // 记录位置
  const rects = new Map()
  document.querySelectorAll('.grid-item').forEach(el => {
    rects.set(el.dataset.id, el.getBoundingClientRect())
  })

  // 更新数据
  items.value = newOrder

  await nextTick()

  // FLIP 动画
  document.querySelectorAll('.grid-item').forEach(el => {
    const id = el.dataset.id
    const first = rects.get(id)
    const last = el.getBoundingClientRect()

    const dx = first.left - last.left
    const dy = first.top - last.top

    el.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: 'translate(0, 0)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    })
  })
}
</script>
```

---

## 问题 6：配合拖拽排序

```vue
<script setup>
import { useSortable } from '@vueuse/integrations/useSortable'

const el = ref(null)
const items = ref([...])

useSortable(el, items, {
  animation: 150,  // 内置 FLIP 动画
  onEnd: (evt) => {
    // 拖拽结束
  }
})
</script>

<template>
  <ul ref="el">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

---

## 问题 7：性能优化

### 使用 will-change

```css
.list-move {
  transition: transform 0.3s;
  will-change: transform;
}
```

### 批量处理

```javascript
// 使用 requestAnimationFrame 批量处理
function batchFlip(elements) {
  const animations = [];

  elements.forEach((el) => {
    const first = el._firstRect;
    const last = el.getBoundingClientRect();

    animations.push({
      el,
      dx: first.left - last.left,
      dy: first.top - last.top,
    });
  });

  requestAnimationFrame(() => {
    animations.forEach(({ el, dx, dy }) => {
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    requestAnimationFrame(() => {
      animations.forEach(({ el }) => {
        el.style.transition = "transform 0.3s";
        el.style.transform = "";
      });
    });
  });
}
```

## 延伸阅读

- [FLIP Your Animations](https://aerotwist.com/blog/flip-your-animations/)
- [Vue 官方文档 - TransitionGroup](https://cn.vuejs.org/guide/built-ins/transition-group.html)
