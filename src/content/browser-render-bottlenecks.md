---
title: 浏览器渲染性能瓶颈通常在哪里？
category: 浏览器
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  了解浏览器渲染的性能瓶颈，掌握优化方向。
tags:
  - 浏览器
  - 渲染
  - 性能
  - 优化
estimatedTime: 12 分钟
keywords:
  - browser rendering
  - performance bottleneck
  - reflow
  - repaint
highlight: 主要瓶颈在于 JavaScript 执行、样式计算、布局（reflow）、绑制（repaint）和合成。
order: 268
---

## 问题 1：渲染流水线

### 关键渲染路径

```
JavaScript → Style → Layout → Paint → Composite
   执行      样式计算   布局     绑制     合成
```

每个阶段都可能成为瓶颈。

---

## 问题 2：JavaScript 执行

### 瓶颈表现

```javascript
// 长时间运行的 JS 阻塞主线程
function heavyComputation() {
  for (let i = 0; i < 10000000; i++) {
    // 复杂计算
  }
}
// 执行期间页面无响应
```

### 优化方向

```javascript
// 1. 分片执行
function processInChunks(items, chunkSize = 100) {
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunkSize, items.length);
    while (index < end) {
      processItem(items[index++]);
    }
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }

  processChunk();
}

// 2. Web Worker
const worker = new Worker("worker.js");
worker.postMessage(data);
```

---

## 问题 3：样式计算

### 瓶颈表现

```css
/* 复杂选择器 */
.container > div:nth-child(2n + 1) .item:not(.disabled) span {
}

/* 大量元素 */
* {
  box-sizing: border-box;
} /* 影响所有元素 */
```

### 优化方向

```css
/* 简化选择器 */
.item-span {
}

/* 减少选择器深度 */
.item {
} /* 而不是 .a .b .c .d .item */

/* 使用 BEM 命名 */
.block__element--modifier {
}
```

---

## 问题 4：布局（Reflow）

### 瓶颈表现

```javascript
// 强制同步布局
const height = element.offsetHeight; // 触发布局
element.style.height = height + 10 + "px"; // 修改样式
const newHeight = element.offsetHeight; // 再次触发布局

// 布局抖动
for (let i = 0; i < items.length; i++) {
  items[i].style.width = container.offsetWidth + "px"; // 每次循环都触发
}
```

### 优化方向

```javascript
// 批量读取，批量写入
const heights = items.map((item) => item.offsetHeight); // 批量读
items.forEach((item, i) => {
  item.style.height = heights[i] + 10 + "px"; // 批量写
});

// 使用 transform 代替位置属性
element.style.transform = "translateX(100px)"; // 不触发布局
// 而不是
element.style.left = "100px"; // 触发布局
```

---

## 问题 5：绑制（Repaint）

### 瓶颈表现

```javascript
// 频繁改变颜色、阴影等
element.style.backgroundColor = "red";
element.style.boxShadow = "0 0 10px black";
```

### 优化方向

```javascript
// 使用 CSS 类切换
element.classList.add("highlighted");

// 使用 opacity 和 transform（只触发合成）
element.style.opacity = 0.5;
element.style.transform = "scale(1.1)";
```

---

## 问题 6：合成（Composite）

### 创建合成层

```css
/* 提升为合成层 */
.animated {
  will-change: transform;
  /* 或 */
  transform: translateZ(0);
}
```

### 注意事项

```css
/* 过多合成层会消耗内存 */
/* 只对需要动画的元素使用 */

/* 动画结束后移除 */
.animated {
  will-change: auto;
}
```

---

## 问题 7：常见触发条件

| 操作         | Layout | Paint | Composite |
| ------------ | ------ | ----- | --------- |
| width/height | ✅     | ✅    | ✅        |
| top/left     | ✅     | ✅    | ✅        |
| transform    | ❌     | ❌    | ✅        |
| opacity      | ❌     | ❌    | ✅        |
| color        | ❌     | ✅    | ✅        |
| visibility   | ❌     | ✅    | ✅        |

## 总结

| 瓶颈     | 优化方向               |
| -------- | ---------------------- |
| JS 执行  | 分片、Web Worker       |
| 样式计算 | 简化选择器             |
| 布局     | 避免强制同步布局       |
| 绘制     | 使用 transform/opacity |
| 合成     | 合理使用 will-change   |

## 延伸阅读

- [渲染性能](https://web.dev/rendering-performance/)
- [CSS Triggers](https://csstriggers.com/)
