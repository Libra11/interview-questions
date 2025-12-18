---
title: CSS 中 position 常见属性有哪些
category: CSS
difficulty: 入门
updatedAt: 2024-12-02
summary: >-
  深入理解 CSS position 属性的各个取值及其定位行为，掌握 static、relative、absolute、fixed 和 sticky 的使用场景和特点，这是前端布局的基础知识。
tags:
  - CSS
  - 布局
  - position
  - 定位
estimatedTime: 18 分钟
keywords:
  - CSS position
  - 定位属性
  - absolute
  - relative
  - fixed
  - sticky
highlight: position 属性控制元素的定位方式，理解不同取值的定位参照物和文档流表现是掌握 CSS 布局的关键
order: 312
---

## 问题 1：position 有哪些常见的属性值？

CSS 的 `position` 属性主要有以下几个常见值：

### 1. static（默认值）

这是元素的默认定位方式，元素按照正常的文档流进行排列。设置 `top`、`right`、`bottom`、`left` 和 `z-index` 属性对 static 元素无效。

```css
.element {
  position: static; /* 默认值，可以不写 */
}
```

### 2. relative（相对定位）

元素相对于它在正常文档流中的位置进行定位。元素仍然占据原来的空间，不会影响其他元素的布局。

```css
.element {
  position: relative;
  top: 10px; /* 相对于原位置向下移动 10px */
  left: 20px; /* 相对于原位置向右移动 20px */
}
```

**关键特点**：

- 元素仍在文档流中，占据原来的空间
- 偏移是相对于自身原来的位置
- 常用作绝对定位子元素的参照物

### 3. absolute（绝对定位）

元素脱离正常文档流，相对于最近的非 static 定位祖先元素进行定位。如果没有这样的祖先元素，则相对于初始包含块（通常是 viewport）定位。

```css
.parent {
  position: relative; /* 作为参照物 */
}

.child {
  position: absolute;
  top: 0;
  right: 0; /* 相对于 .parent 定位到右上角 */
}
```

**关键特点**：

- 脱离文档流，不占据空间
- 相对于最近的已定位祖先元素
- 宽度会收缩为内容宽度（除非显式设置）

### 4. fixed（固定定位）

元素脱离文档流，相对于浏览器窗口（viewport）进行定位，滚动页面时元素位置不变。

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; /* 固定在页面顶部 */
}
```

**关键特点**：

- 相对于 viewport 定位
- 滚动时位置固定不变
- 脱离文档流

### 5. sticky（粘性定位）

这是 relative 和 fixed 的混合体。元素在跨越特定阈值前为相对定位，之后为固定定位。

```css
.nav {
  position: sticky;
  top: 0; /* 滚动到距离顶部 0px 时变为固定定位 */
}
```

**关键特点**：

- 在阈值前表现为 relative
- 超过阈值后表现为 fixed
- 不脱离文档流（在 relative 状态时）

---

## 问题 2：absolute 定位的参照物是什么？

absolute 定位的参照物遵循以下规则：

### 查找规则

元素会向上查找祖先元素，找到第一个 `position` 不为 `static` 的元素作为参照物。

```html
<div class="grandparent">
  <div class="parent" style="position: relative;">
    <div class="child" style="position: absolute; top: 0; left: 0;">
      <!-- 相对于 .parent 定位 -->
    </div>
  </div>
</div>
```

### 如果没有定位祖先

如果所有祖先元素都是 `static`，则相对于初始包含块（Initial Containing Block）定位，通常是整个文档的根元素。

```css
/* 所有祖先都是 static */
.child {
  position: absolute;
  top: 0;
  left: 0; /* 相对于整个页面的左上角 */
}
```

### 常见实践

通常我们会给父元素设置 `position: relative`，这样既不影响父元素的布局（因为 relative 不脱离文档流），又能作为子元素的定位参照物。

```css
/* 常见的父子定位模式 */
.container {
  position: relative; /* 仅作为定位参照，不设置偏移 */
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
}
```

---

## 问题 3：relative 和 absolute 的区别是什么？

### 文档流表现

**relative**：

- 仍在文档流中，占据原来的空间
- 其他元素的布局不受影响
- 偏移只是视觉上的移动

```css
.box1 {
  position: relative;
  top: 20px;
}
.box2 {
  /* 仍然在 box1 原来位置的下方 */
}
```

**absolute**：

- 脱离文档流，不占据空间
- 其他元素会填补它原来的位置
- 真正从布局中移除

```css
.box1 {
  position: absolute;
  top: 20px;
}
.box2 {
  /* 会上移填补 box1 的空间 */
}
```

### 定位参照物

**relative**：

- 相对于元素自身在文档流中的原始位置

**absolute**：

- 相对于最近的非 static 定位祖先元素
- 如果没有，则相对于初始包含块

### 宽度表现

**relative**：

- 保持原来的宽度（如块级元素默认 100%）

**absolute**：

- 宽度收缩为内容宽度
- 除非显式设置宽度或使用 left + right

```css
/* absolute 元素的宽度 */
.abs1 {
  position: absolute;
  /* 宽度 = 内容宽度 */
}

.abs2 {
  position: absolute;
  left: 0;
  right: 0;
  /* 宽度 = 父元素宽度 */
}
```

### 使用场景

**relative**：

- 微调元素位置
- 作为 absolute 子元素的定位参照
- 配合 z-index 调整层级

**absolute**：

- 创建浮层、弹窗、tooltip
- 实现元素覆盖效果
- 精确控制元素位置

---

## 问题 4：sticky 定位的工作原理是什么？

### 基本原理

`sticky` 是相对定位和固定定位的混合：

1. **滚动前**：元素表现为 `relative`，在正常文档流中
2. **滚动到阈值**：元素表现为 `fixed`，固定在指定位置
3. **滚动过容器**：元素随容器滚动消失

```css
.sticky-header {
  position: sticky;
  top: 0; /* 距离顶部 0px 时开始固定 */
}
```

### 生效条件

sticky 定位需要满足以下条件才能生效：

1. **必须指定阈值**：至少指定 `top`、`right`、`bottom`、`left` 之一

```css
/* ❌ 不会生效 */
.element {
  position: sticky;
}

/* ✅ 正确 */
.element {
  position: sticky;
  top: 20px;
}
```

2. **父元素不能有 overflow: hidden/auto/scroll**

```css
/* ❌ sticky 不会生效 */
.parent {
  overflow: hidden;
}
.child {
  position: sticky;
  top: 0;
}
```

3. **元素高度不能超过父元素**

sticky 元素的粘性范围受限于父元素的高度。

### 常见应用场景

**表格表头吸顶**：

```css
thead th {
  position: sticky;
  top: 0;
  background: white; /* 需要背景色遮挡下方内容 */
  z-index: 1;
}
```

**侧边导航**：

```css
.sidebar {
  position: sticky;
  top: 20px; /* 距离顶部 20px 时固定 */
  height: calc(100vh - 40px);
}
```

### 注意事项

- sticky 元素的定位范围是其父元素
- 需要设置背景色，否则滚动时会透出下方内容
- 兼容性：现代浏览器都支持，IE 不支持

---

## 总结

**核心概念总结**：

### 1. 五种定位方式

- **static**：默认值，正常文档流
- **relative**：相对自身定位，占据空间
- **absolute**：相对定位祖先，脱离文档流
- **fixed**：相对 viewport，脱离文档流
- **sticky**：相对+固定混合，不脱离文档流

### 2. 关键区别

- **是否脱离文档流**：static、relative、sticky 不脱离；absolute、fixed 脱离
- **定位参照物**：relative 相对自身；absolute 相对定位祖先；fixed 相对 viewport；sticky 相对父元素和 viewport
- **空间占据**：脱离文档流的不占据空间

### 3. 实践要点

- relative 常用作 absolute 的定位参照
- absolute 需要注意宽度收缩问题
- sticky 需要满足特定条件才能生效
- 合理使用 z-index 控制层级关系

## 延伸阅读

- [MDN - position](https://developer.mozilla.org/zh-CN/docs/Web/CSS/position)
- [CSS Positioning Explained](https://www.freecodecamp.org/news/css-positioning-position-absolute-and-relative/)
- [深入理解 CSS 定位](https://www.zhangxinxu.com/wordpress/2020/08/css-position-sticky/)
- [Sticky positioning - CSS Tricks](https://css-tricks.com/position-sticky-2/)
