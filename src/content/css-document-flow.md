---
title: CSS 文档流是什么概念
category: CSS
difficulty: 入门
updatedAt: 2024-12-02
summary: >-
  理解 CSS 文档流（Normal Flow）的概念和工作原理，掌握块级元素和行内元素在文档流中的排列规则，以及哪些情况会脱离文档流。
tags:
  - CSS
  - 文档流
  - 布局
  - 块级元素
estimatedTime: 16 分钟
keywords:
  - CSS 文档流
  - Normal Flow
  - 块级元素
  - 行内元素
  - 脱离文档流
highlight: 文档流是浏览器默认的元素排列方式，理解文档流是掌握 CSS 布局的基础
order: 102
---

## 问题 1：什么是 CSS 文档流？

### 基本概念

文档流（Normal Flow），也叫普通流或正常流，是浏览器默认的 HTML 元素排版布局方式。在文档流中，元素按照其在 HTML 中出现的顺序从上到下、从左到右依次排列。

可以把文档流想象成水流，元素就像水中的物体，按照一定的规则自然地排列和流动。

### 文档流的基本规则

**块级元素**：

- 独占一行，从上到下排列
- 宽度默认是父元素的 100%
- 高度由内容决定

```html
<div>块级元素 1</div>
<div>块级元素 2</div>
<!-- 两个 div 会垂直排列，每个占一行 -->
```

**行内元素**：

- 在一行内从左到右排列
- 宽度和高度由内容决定
- 多个行内元素可以在同一行

```html
<span>行内元素 1</span>
<span>行内元素 2</span>
<!-- 两个 span 会在同一行水平排列 -->
```

### 文档流的特点

1. **元素位置可预测**：按照 HTML 顺序排列
2. **自动换行**：块级元素自动换行，行内元素在行末自动换行
3. **空间占据**：元素在文档流中占据空间，影响其他元素的位置

```css
/* 在文档流中的元素 */
.box {
  /* 默认 position: static */
  width: 200px;
  height: 100px;
  /* 占据空间，下方元素会在它下面 */
}
```

---

## 问题 2：哪些情况会脱离文档流？

### 1. 浮动（float）

使用 `float` 属性会使元素脱离文档流，向左或向右浮动。

```css
.float-box {
  float: left; /* 脱离文档流，向左浮动 */
  width: 200px;
}
```

**脱离文档流的表现**：

- 元素不再占据原来的空间
- 后续元素会上移填补空间
- 但文字会环绕浮动元素

```html
<div class="float-box">浮动元素</div>
<div class="normal">这段文字会环绕浮动元素排列</div>
```

### 2. 绝对定位（position: absolute）

绝对定位的元素完全脱离文档流。

```css
.absolute-box {
  position: absolute;
  top: 0;
  left: 0;
  /* 完全脱离文档流，不占据空间 */
}
```

**特点**：

- 不占据任何空间
- 不影响其他元素布局
- 相对于定位祖先元素定位

### 3. 固定定位（position: fixed）

固定定位也会脱离文档流。

```css
.fixed-box {
  position: fixed;
  top: 0;
  right: 0;
  /* 脱离文档流，相对于 viewport 定位 */
}
```

**特点**：

- 不占据空间
- 相对于浏览器窗口定位
- 滚动时位置不变

### 不脱离文档流的定位

以下定位方式不会脱离文档流：

```css
/* relative 不脱离文档流 */
.relative-box {
  position: relative;
  top: 10px;
  /* 仍然占据原来的空间 */
}

/* sticky 不脱离文档流 */
.sticky-box {
  position: sticky;
  top: 0;
  /* 在 relative 状态时占据空间 */
}
```

---

## 问题 3：脱离文档流有什么影响？

### 对自身的影响

**1. 不占据空间**

脱离文档流的元素不再占据原来的空间，就像从页面中"浮起来"了。

```html
<div class="container">
  <div class="absolute">绝对定位</div>
  <div class="normal">普通元素</div>
</div>

<style>
  .absolute {
    position: absolute;
    /* 不占据空间，.normal 会上移到 .container 的顶部 */
  }
</style>
```

**2. 宽度收缩**

脱离文档流的块级元素宽度会收缩为内容宽度（除非显式设置）。

```css
/* 在文档流中 */
div {
  /* 宽度默认 100% */
}

/* 脱离文档流后 */
div {
  position: absolute;
  /* 宽度收缩为内容宽度 */
}
```

**3. 可以重叠**

脱离文档流的元素可以与其他元素重叠，通过 `z-index` 控制层级。

```css
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10; /* 控制层级 */
}
```

### 对其他元素的影响

**1. 后续元素上移**

脱离文档流的元素不占据空间，后续元素会上移填补。

```html
<div class="box1">元素 1</div>
<div class="box2" style="position: absolute;">元素 2（脱离文档流）</div>
<div class="box3">元素 3（会上移到元素 1 下方）</div>
```

**2. 父元素高度塌陷**

如果父元素的所有子元素都脱离文档流，父元素高度会变为 0。

```html
<div class="parent">
  <div class="child" style="float: left;">浮动子元素</div>
  <!-- 父元素高度塌陷为 0 -->
</div>

<style>
  /* 解决方案：清除浮动 */
  .parent::after {
    content: "";
    display: block;
    clear: both;
  }
</style>
```

### 实际应用场景

**1. 创建浮层**

```css
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  /* 脱离文档流，不影响页面布局 */
}
```

**2. 实现布局效果**

```css
.sidebar {
  float: left;
  width: 200px;
  /* 脱离文档流，实现侧边栏布局 */
}

.content {
  margin-left: 220px;
  /* 为浮动元素留出空间 */
}
```

---

## 问题 4：块级元素和行内元素在文档流中有什么区别？

### 块级元素（Block-level Elements）

**特点**：

- 独占一行
- 宽度默认 100%（填满父元素）
- 可以设置宽高
- 可以包含块级元素和行内元素

```css
/* 常见的块级元素 */
div,
p,
h1-h6,
ul,
ol,
li,
section,
article,
header,
footer {
  display: block;
}
```

**排列方式**：

```html
<div>块级元素 1</div>
<div>块级元素 2</div>
<div>块级元素 3</div>
<!-- 垂直排列，每个占一行 -->
```

### 行内元素（Inline Elements）

**特点**：

- 不独占一行，多个行内元素可以在同一行
- 宽度和高度由内容决定
- 不能设置宽高（width 和 height 无效）
- 只能包含行内元素和文本

```css
/* 常见的行内元素 */
span,
a,
strong,
em,
img,
input,
label {
  display: inline;
}
```

**排列方式**：

```html
<span>行内元素 1</span>
<span>行内元素 2</span>
<span>行内元素 3</span>
<!-- 水平排列，在同一行 -->
```

### 行内块元素（Inline-block）

结合了块级元素和行内元素的特点：

```css
.inline-block {
  display: inline-block;
  /* 可以设置宽高，但不独占一行 */
  width: 100px;
  height: 100px;
}
```

**特点**：

- 不独占一行（像行内元素）
- 可以设置宽高（像块级元素）
- 常用于按钮、导航项等

```html
<button style="display: inline-block;">按钮 1</button>
<button style="display: inline-block;">按钮 2</button>
<!-- 两个按钮在同一行，但可以设置宽高 -->
```

### 转换 display 属性

可以通过 `display` 属性转换元素类型：

```css
/* 行内元素转块级 */
span {
  display: block;
}

/* 块级元素转行内 */
div {
  display: inline;
}

/* 转为行内块 */
div {
  display: inline-block;
}
```

---

## 总结

**核心概念总结**：

### 1. 文档流的本质

- 浏览器默认的元素排列方式
- 块级元素垂直排列，行内元素水平排列
- 元素按 HTML 顺序从上到下、从左到右排列

### 2. 脱离文档流的方式

- **float**：浮动，半脱离（文字环绕）
- **position: absolute**：绝对定位，完全脱离
- **position: fixed**：固定定位，完全脱离

### 3. 脱离文档流的影响

- 元素不占据空间
- 宽度收缩为内容宽度
- 可能导致父元素高度塌陷
- 后续元素会上移填补空间

### 4. 元素类型区别

- **块级元素**：独占一行，可设置宽高
- **行内元素**：不独占一行，不可设置宽高
- **行内块元素**：不独占一行，可设置宽高

## 延伸阅读

- [MDN - Normal Flow](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Normal_Flow)
- [MDN - 块级元素和行内元素](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Block-level_elements)
- [CSS 文档流详解](https://www.zhangxinxu.com/wordpress/2015/11/css-position-static-relative-absolute-fixed/)
- [理解 CSS 布局和文档流](https://css-tricks.com/almanac/properties/d/display/)
