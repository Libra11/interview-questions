---
title: 盒模型
category: CSS
difficulty: 入门
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS 盒模型的概念,包括标准盒模型和 IE 盒模型的区别、box-sizing 属性的作用,以及如何在实际开发中正确使用盒模型。
tags:
  - CSS
  - 盒模型
  - box-sizing
  - 布局
estimatedTime: 20 分钟
keywords:
  - CSS盒模型
  - box-sizing
  - content-box
  - border-box
highlight: 理解盒模型是掌握 CSS 布局的基础
order: 79
---

## 问题 1：什么是 CSS 盒模型

CSS 盒模型描述了元素在页面中占据的空间,每个元素都可以看作一个矩形盒子,由四个部分组成:

```
┌─────────────────────────────────┐
│         margin(外边距)           │
│  ┌───────────────────────────┐  │
│  │    border(边框)           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  padding(内边距)    │  │  │
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │   content     │  │  │  │
│  │  │  │   (内容)      │  │  │  │
│  │  │  └───────────────┘  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**四个组成部分**:

1. **Content(内容区)**: 显示文本、图片等内容
2. **Padding(内边距)**: 内容与边框之间的空间
3. **Border(边框)**: 围绕内边距和内容的边框
4. **Margin(外边距)**: 元素与其他元素之间的空间

---

## 问题 2：标准盒模型 vs IE 盒模型

### 标准盒模型(content-box)

```css
.box {
  box-sizing: content-box; /* 默认值 */
  width: 200px;
  padding: 20px;
  border: 5px solid black;
}
```

**计算方式**:

- `width/height` 只包含内容区
- 实际宽度 = width + padding + border
- 实际宽度 = 200 + 20×2 + 5×2 = 250px

```
实际占据空间:
┌─────────────────────────────┐
│ border: 5px                 │
│ ┌─────────────────────────┐ │
│ │ padding: 20px           │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ width: 200px        │ │ │
│ │ │ (content)           │ │ │
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
总宽度: 250px
```

### IE 盒模型(border-box)

```css
.box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid black;
}
```

**计算方式**:

- `width/height` 包含 content + padding + border
- 实际宽度 = width
- 内容区宽度 = width - padding - border
- 内容区宽度 = 200 - 20×2 - 5×2 = 150px

```
实际占据空间:
┌─────────────────────────────┐
│ width: 200px                │
│ ┌─────────────────────────┐ │
│ │ border: 5px (包含在内)  │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ padding: 20px       │ │ │
│ │ │ ┌─────────────────┐ │ │ │
│ │ │ │ content: 150px  │ │ │ │
│ │ │ └─────────────────┘ │ │ │
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
总宽度: 200px
```

---

## 问题 3：box-sizing 属性

### 语法

```css
.element {
  box-sizing: content-box; /* 标准盒模型(默认) */
  box-sizing: border-box; /* IE 盒模型 */
}
```

### 实际对比

```html
<div class="box content-box">content-box</div>
<div class="box border-box">border-box</div>

<style>
  .box {
    width: 200px;
    padding: 20px;
    border: 5px solid blue;
    margin: 10px;
    background: lightblue;
  }

  .content-box {
    box-sizing: content-box;
    /* 实际宽度: 200 + 40 + 10 = 250px */
  }

  .border-box {
    box-sizing: border-box;
    /* 实际宽度: 200px */
    /* 内容宽度: 200 - 40 - 10 = 150px */
  }
</style>
```

### 全局设置

```css
/* 推荐: 全局使用 border-box */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* 或者 */
html {
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}
```

---

## 问题 4：盒模型的实际应用

### 场景 1: 响应式布局

```css
/* ❌ 使用 content-box 的问题 */
.container {
  width: 100%;
  padding: 20px; /* 会导致宽度超过 100% */
}

/* ✅ 使用 border-box 解决 */
.container {
  box-sizing: border-box;
  width: 100%;
  padding: 20px; /* 宽度仍然是 100% */
}
```

### 场景 2: 等宽布局

```css
/* 三列等宽布局 */
.column {
  box-sizing: border-box;
  width: 33.333%;
  padding: 15px;
  border: 1px solid #ddd;
  float: left;
}

/* 如果使用 content-box,需要复杂计算:
 * width: calc(33.333% - 30px - 2px)
 */
```

### 场景 3: 表单元素

```css
/* 统一表单元素的盒模型 */
input,
textarea,
select,
button {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
}
```

### 场景 4: 固定宽高的容器

```css
.card {
  box-sizing: border-box;
  width: 300px;
  height: 200px;
  padding: 20px;
  border: 2px solid #ddd;
  /* 内容区会自动调整,不会超出 300x200 */
}
```

---

## 问题 5：margin 的特殊行为

### 1. margin 合并(Margin Collapsing)

```html
<div class="box1">Box 1</div>
<div class="box2">Box 2</div>

<style>
  .box1 {
    margin-bottom: 30px;
  }

  .box2 {
    margin-top: 20px;
  }

  /* 两个盒子之间的距离是 30px,而不是 50px */
  /* margin 会合并,取较大值 */
</style>
```

**发生 margin 合并的情况**:

- 相邻的兄弟元素
- 父元素与第一个/最后一个子元素
- 空的块级元素

**防止 margin 合并**:

```css
/* 方法 1: 使用 padding 代替 margin */
.parent {
  padding-top: 20px;
}

/* 方法 2: 添加 border 或 padding */
.parent {
  border-top: 1px solid transparent;
}

/* 方法 3: 使用 BFC */
.parent {
  overflow: hidden;
}

/* 方法 4: 使用 flexbox */
.parent {
  display: flex;
  flex-direction: column;
}
```

### 2. margin 负值

```css
/* 负 margin 可以让元素重叠 */
.overlap {
  margin-top: -20px; /* 向上移动 20px */
  margin-left: -10px; /* 向左移动 10px */
}
```

### 3. margin auto 居中

```css
/* 水平居中 */
.center {
  width: 300px;
  margin: 0 auto;
}

/* ❌ 垂直居中不生效 */
.vertical-center {
  height: 100px;
  margin: auto 0; /* 不会垂直居中 */
}

/* ✅ 使用 flexbox 垂直居中 */
.parent {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 问题 6：常见问题和解决方案

### 问题 1: 宽度计算复杂

```css
/* ❌ 复杂的计算 */
.box {
  width: calc(100% - 40px - 10px);
  padding: 20px;
  border: 5px solid black;
}

/* ✅ 使用 border-box */
.box {
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  border: 5px solid black;
}
```

### 问题 2: 百分比宽度 + padding

```css
/* ❌ 宽度会超过 50% */
.half {
  width: 50%;
  padding: 20px;
}

/* ✅ 使用 border-box */
.half {
  box-sizing: border-box;
  width: 50%;
  padding: 20px;
}
```

### 问题 3: 高度塌陷

```css
/* 父元素高度塌陷(子元素浮动) */
.parent {
  /* height: 0 */
}

.child {
  float: left;
}

/* 解决方案 1: 清除浮动 */
.parent::after {
  content: "";
  display: block;
  clear: both;
}

/* 解决方案 2: 使用 overflow */
.parent {
  overflow: hidden;
}

/* 解决方案 3: 使用 flexbox */
.parent {
  display: flex;
}
```

## 总结

**核心概念**:

### 1. 盒模型组成

- Content: 内容区
- Padding: 内边距
- Border: 边框
- Margin: 外边距

### 2. 两种盒模型

- `content-box`: width 只包含内容
- `border-box`: width 包含 content + padding + border

### 3. 推荐做法

- 全局使用 `box-sizing: border-box`
- 简化宽度计算
- 更符合直觉

### 4. 注意事项

- margin 会合并
- margin 不包含在 width/height 中
- 使用 `border-box` 简化布局

## 延伸阅读

- [MDN - CSS 盒模型](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Box_Model)
- [MDN - box-sizing](https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-sizing)
- [CSS Tricks - Box Sizing](https://css-tricks.com/box-sizing/)
- [W3C - CSS Box Model](https://www.w3.org/TR/css-box-3/)
