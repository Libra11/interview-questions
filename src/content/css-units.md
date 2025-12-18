---
title: CSS 尺寸单位有哪些
category: CSS
difficulty: 入门
updatedAt: 2024-12-02
summary: >-
  全面了解 CSS 中的各种尺寸单位，包括绝对单位（px）、相对单位（em、rem、%）、视口单位（vw、vh）等，掌握它们的特点和使用场景。
tags:
  - CSS
  - 单位
  - 响应式
  - 布局
estimatedTime: 20 分钟
keywords:
  - CSS 单位
  - px
  - em
  - rem
  - vw
  - vh
highlight: 理解不同 CSS 单位的特性和适用场景，是实现响应式布局和精确控制样式的基础
order: 327
---

## 问题 1：CSS 有哪些常见的尺寸单位？

### 绝对单位

**px（像素）**

最常用的绝对单位，1px 代表屏幕上的一个像素点。

```css
.box {
  width: 200px;
  height: 100px;
  font-size: 16px;
}
```

**其他绝对单位**（较少使用）：

- `pt`（点）：1pt = 1/72 英寸，主要用于打印
- `cm`（厘米）、`mm`（毫米）、`in`（英寸）：物理单位

### 相对单位

**em**

相对于当前元素的 `font-size`。

```css
.parent {
  font-size: 16px;
}

.child {
  font-size: 2em; /* 32px (16px * 2) */
  padding: 1em; /* 32px (相对于自身的 font-size) */
}
```

**rem**

相对于根元素（`<html>`）的 `font-size`。

```css
html {
  font-size: 16px;
}

.box {
  width: 10rem; /* 160px (16px * 10) */
  padding: 2rem; /* 32px (16px * 2) */
}
```

**%（百分比）**

相对于父元素的对应属性。

```css
.parent {
  width: 500px;
  height: 300px;
}

.child {
  width: 50%; /* 250px (500px * 50%) */
  height: 100%; /* 300px */
}
```

### 视口单位

**vw（Viewport Width）**

相对于视口宽度的百分比，1vw = 视口宽度的 1%。

```css
.full-width {
  width: 100vw; /* 视口宽度 */
}

.half-width {
  width: 50vw; /* 视口宽度的一半 */
}
```

**vh（Viewport Height）**

相对于视口高度的百分比，1vh = 视口高度的 1%。

```css
.full-height {
  height: 100vh; /* 视口高度 */
}

.hero {
  height: 80vh; /* 视口高度的 80% */
}
```

**vmin 和 vmax**

- `vmin`：vw 和 vh 中较小的那个
- `vmax`：vw 和 vh 中较大的那个

```css
.square {
  width: 50vmin; /* 视口宽高中较小值的 50% */
  height: 50vmin; /* 保持正方形 */
}
```

---

## 问题 2：em 和 rem 有什么区别？

### em 的特点

**相对于当前元素的 font-size**

```css
.parent {
  font-size: 16px;
}

.child {
  font-size: 2em; /* 32px (16px * 2) */
  padding: 1em; /* 32px (相对于自身的 32px) */
}
```

**会产生复合效应**

em 单位会层层继承，可能导致难以预测的结果。

```css
.level1 {
  font-size: 1.2em; /* 相对于父元素 */
}

.level2 {
  font-size: 1.2em; /* 相对于 .level1，会继续放大 */
}

.level3 {
  font-size: 1.2em; /* 继续放大，可能变得很大 */
}
```

**适用场景**

适合需要相对于当前字体大小缩放的场景：

```css
.button {
  font-size: 16px;
  padding: 0.5em 1em; /* padding 会随着 font-size 变化 */
  border-radius: 0.25em;
}

.button-large {
  font-size: 20px;
  /* padding 和 border-radius 会自动放大 */
}
```

### rem 的特点

**相对于根元素的 font-size**

```css
html {
  font-size: 16px; /* 根元素字体大小 */
}

.box1 {
  font-size: 2rem; /* 32px */
  padding: 1rem; /* 16px */
}

.box2 {
  font-size: 1.5rem; /* 24px */
  padding: 1rem; /* 16px（仍然是 16px） */
}
```

**不会产生复合效应**

rem 始终相对于根元素，不会层层叠加。

```css
html {
  font-size: 16px;
}

.level1 {
  font-size: 1.2rem; /* 19.2px */
}

.level2 {
  font-size: 1.2rem; /* 19.2px（不会继续放大） */
}
```

**适用场景**

适合整体布局和统一的尺寸控制：

```css
html {
  font-size: 16px;
}

/* 所有尺寸都基于根元素 */
.container {
  max-width: 75rem; /* 1200px */
  padding: 2rem; /* 32px */
}

.title {
  font-size: 2rem; /* 32px */
  margin-bottom: 1rem; /* 16px */
}
```

### 对比总结

| 特性     | em                   | rem                |
| -------- | -------------------- | ------------------ |
| 参照物   | 当前元素的 font-size | 根元素的 font-size |
| 复合效应 | 会层层叠加           | 不会叠加           |
| 可预测性 | 较难预测             | 容易预测           |
| 适用场景 | 组件内部相对尺寸     | 全局统一尺寸       |

---

## 问题 3：视口单位（vw、vh）的使用场景有哪些？

### 全屏布局

**实现全屏高度**

```css
.hero {
  height: 100vh; /* 占满整个视口高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**移动端全屏适配**

```css
.mobile-page {
  min-height: 100vh; /* 至少占满一屏 */
}
```

### 响应式字体

使用 vw 实现字体大小随视口宽度变化：

```css
.responsive-title {
  font-size: 5vw; /* 视口宽度的 5% */
}

/* 结合 clamp 限制范围 */
.title {
  font-size: clamp(16px, 4vw, 48px);
  /* 最小 16px，理想值 4vw，最大 48px */
}
```

### 等比例缩放

**保持宽高比**

```css
.aspect-box {
  width: 80vw;
  height: 45vw; /* 16:9 比例 */
}

/* 或使用 vmin 保持正方形 */
.square {
  width: 50vmin;
  height: 50vmin;
}
```

### 移动端适配

**替代媒体查询**

```css
/* 传统方式 */
.box {
  width: 300px;
}

@media (max-width: 768px) {
  .box {
    width: 90%;
  }
}

/* 使用 vw */
.box {
  width: 80vw; /* 自动适配不同屏幕 */
  max-width: 600px; /* 限制最大宽度 */
}
```

### 注意事项

**1. 避免横向滚动条**

使用 100vw 时可能出现横向滚动条（因为包含了滚动条宽度）：

```css
/* ❌ 可能出现横向滚动条 */
.full-width {
  width: 100vw;
}

/* ✅ 使用 100% 更安全 */
.full-width {
  width: 100%;
}
```

**2. 移动端地址栏问题**

移动端浏览器的地址栏会影响 vh 的计算：

```css
/* 使用 dvh（动态视口高度）更准确 */
.mobile-hero {
  height: 100dvh; /* 动态视口高度 */
}

/* 或使用 svh（小视口高度）和 lvh（大视口高度） */
```

---

## 问题 4：百分比单位的参照对象是什么？

### 不同属性的参照对象

**width 和 height**

参照父元素的对应属性：

```css
.parent {
  width: 500px;
  height: 300px;
}

.child {
  width: 50%; /* 250px（父元素 width 的 50%） */
  height: 100%; /* 300px（父元素 height 的 100%） */
}
```

**padding 和 margin**

参照父元素的 **width**（注意：上下 padding/margin 也是参照 width）：

```css
.parent {
  width: 400px;
}

.child {
  padding: 10%; /* 40px（父元素 width 的 10%） */
  margin-top: 5%; /* 20px（也是参照父元素 width） */
}
```

**利用这个特性实现固定宽高比**：

```css
.aspect-ratio-box {
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 比例（9/16 = 0.5625） */
  position: relative;
}

.aspect-ratio-box > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

**font-size**

参照父元素的 `font-size`：

```css
.parent {
  font-size: 20px;
}

.child {
  font-size: 150%; /* 30px（父元素 font-size 的 150%） */
}
```

**line-height**

参照当前元素的 `font-size`：

```css
.text {
  font-size: 16px;
  line-height: 150%; /* 24px（自身 font-size 的 150%） */
}
```

**transform: translate**

参照元素自身的宽高：

```css
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* -50% 是相对于自身的宽高 */
}
```

### 百分比的特殊情况

**height: 100% 失效**

子元素的 `height: 100%` 需要父元素有明确的高度：

```css
/* ❌ 不会生效 */
.parent {
  /* 没有设置高度 */
}

.child {
  height: 100%; /* 无效 */
}

/* ✅ 需要父元素有高度 */
.parent {
  height: 500px; /* 或 100vh */
}

.child {
  height: 100%; /* 生效 */
}
```

**position: absolute 的百分比**

绝对定位元素的百分比参照的是定位祖先元素：

```css
.parent {
  position: relative;
  width: 400px;
  height: 300px;
}

.child {
  position: absolute;
  width: 50%; /* 200px（定位祖先的 width） */
  top: 50%; /* 150px（定位祖先的 height） */
}
```

---

## 总结

**核心概念总结**：

### 1. 单位分类

- **绝对单位**：px（最常用）
- **相对单位**：em、rem、%
- **视口单位**：vw、vh、vmin、vmax

### 2. 选择建议

- **px**：精确控制、固定尺寸
- **rem**：全局统一、响应式布局
- **em**：组件内部相对尺寸
- **%**：相对父元素的弹性布局
- **vw/vh**：全屏布局、响应式设计

### 3. 关键要点

- em 会层层叠加，rem 不会
- 百分比的参照对象因属性而异
- padding/margin 的百分比参照父元素 width
- 视口单位适合响应式，但要注意边界情况

### 4. 实践建议

- 根元素设置基准字体大小（如 16px）
- 使用 rem 做全局布局
- 使用 em 做组件内部尺寸
- 结合 clamp() 实现响应式字体
- 注意百分比 height 的生效条件

## 延伸阅读

- [MDN - CSS 值和单位](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/Building_blocks/Values_and_units)
- [CSS 单位完全指南](https://www.zhangxinxu.com/wordpress/2021/03/css-unit-guide/)
- [Viewport units: vw, vh, vmin, vmax](https://css-tricks.com/fun-viewport-units/)
- [理解 CSS 中的 em 和 rem](https://www.sitepoint.com/understanding-and-using-rem-units-in-css/)
