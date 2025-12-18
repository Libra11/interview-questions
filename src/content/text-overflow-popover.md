---
title: 文本溢出时通过 Popover 展示完整内容
category: CSS
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  探讨如何检测文本溢出并用 Popover API 或自定义 Tooltip 展示完整内容，涵盖纯 CSS、JavaScript 检测与现代浏览器 API 的最佳实践。
tags:
  - CSS
  - Popover API
  - 文本溢出
  - 交互设计
estimatedTime: 35 分钟
keywords:
  - text-overflow
  - ellipsis
  - Popover API
  - Tooltip
highlight: 掌握溢出检测算法与 Popover API 的正确使用方式，提升用户体验。
order: 57
---

## 问题 1：基础方案 - CSS 文本溢出处理

### 单行文本省略

```css
.text-ellipsis {
  white-space: nowrap; /* 不换行 */
  overflow: hidden; /* 隐藏溢出 */
  text-overflow: ellipsis; /* 显示省略号 */
  max-width: 200px; /* 限制宽度 */
}
```

```html
<div class="text-ellipsis" title="完整内容会显示在浏览器默认 tooltip">
  这是一段很长的文本内容，超出部分会被省略显示为...
</div>
```

**缺点**：浏览器原生 `title` 属性体验差（延迟显示、样式无法定制、移动端支持不佳）。

### 多行文本省略（WebKit）

```css
.text-ellipsis-multiline {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 最多显示 3 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**兼容性**：现代浏览器均支持，IE 不支持（需 polyfill 或 JS 方案）。

## 问题 2：如何检测文本是否溢出？

### 方法 1：比较 scrollWidth 与 clientWidth

```js
function isTextOverflow(element) {
  // 水平溢出检测
  return element.scrollWidth > element.clientWidth;
}

// 多行溢出检测
function isMultilineOverflow(element) {
  return element.scrollHeight > element.clientHeight;
}
```

### 方法 2：使用 Range API（更精确）

```js
function isTextOverflowPrecise(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rangeWidth = range.getBoundingClientRect().width;
  const elementWidth = element.getBoundingClientRect().width;

  // 考虑 padding
  const style = getComputedStyle(element);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);
  const contentWidth = elementWidth - paddingLeft - paddingRight;

  return rangeWidth > contentWidth;
}
```

### 方法 3：比较原始内容与渲染内容

```js
function detectOverflow(element) {
  const clone = element.cloneNode(true);
  clone.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: auto;
    max-width: none;
    white-space: nowrap;
  `;

  document.body.appendChild(clone);
  const isOverflow = clone.offsetWidth > element.offsetWidth;
  document.body.removeChild(clone);

  return isOverflow;
}
```

## 问题 3：现代方案 - Popover API（浏览器原生）

### 基础用法（Chrome 114+, Safari 17+）

```html
<button popovertarget="my-popover">
  <span class="text-ellipsis">这是一段很长的文本内容...</span>
</button>

<div id="my-popover" popover>
  这是一段很长的文本内容，这里会显示完整内容，不会被截断。
</div>
```

```css
/* Popover 默认样式（可自定义） */
[popover] {
  margin: auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 显示时的动画 */
[popover]:popover-open {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 延伸阅读

- MDN：[Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- Floating UI 官方文档：https://floating-ui.com/
- W3C：[CSS Overflow Module Level 3](https://www.w3.org/TR/css-overflow-3/)
- 【练习】实现一个支持多行文本溢出检测的通用 Tooltip 组件，兼容 SSR。
