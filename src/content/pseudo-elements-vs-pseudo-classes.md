---
title: CSS 中伪元素和伪类的区别和作用
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS 伪元素和伪类的概念、区别、语法,以及各自的常用场景和实际应用。
tags:
  - CSS
  - 伪元素
  - 伪类
  - 选择器
estimatedTime: 22 分钟
keywords:
  - 伪元素
  - 伪类
  - before
  - after
  - hover
highlight: 掌握伪元素和伪类,实现更灵活的样式控制
order: 111
---

## 问题 1：伪类和伪元素的定义

### 伪类(Pseudo-classes)

用于选择元素的**特定状态**,使用单冒号 `:`。

```css
/* 选择鼠标悬停的元素 */
a:hover {
  color: red;
}

/* 选择第一个子元素 */
li:first-child {
  font-weight: bold;
}
```

### 伪元素(Pseudo-elements)

用于创建**不存在于 DOM 中的元素**,使用双冒号 `::`。

```css
/* 在元素前插入内容 */
p::before {
  content: "→ ";
}

/* 在元素后插入内容 */
p::after {
  content: " ←";
}
```

**注意**: CSS2 中伪元素使用单冒号,CSS3 规范改为双冒号以区分伪类。

```css
/* CSS2 语法(仍然有效) */
p:before {
  content: "";
}

/* CSS3 语法(推荐) */
p::before {
  content: "";
}
```

---

## 问题 2：伪类和伪元素的核心区别

| 特性           | 伪类               | 伪元素                               |
| -------------- | ------------------ | ------------------------------------ |
| 语法           | 单冒号 `:`         | 双冒号 `::`                          |
| 作用           | 选择元素的特定状态 | 创建虚拟元素                         |
| 是否创建新元素 | 否                 | 是                                   |
| 数量限制       | 可以多个           | 每个元素最多 2 个(::before, ::after) |
| 是否在 DOM 中  | 否                 | 否                                   |

### 示例对比

```css
/* 伪类: 选择现有元素的状态 */
button:hover {
  background: blue; /* 鼠标悬停时的状态 */
}

li:first-child {
  color: red; /* 第一个 li 元素 */
}

/* 伪元素: 创建新的虚拟元素 */
p::before {
  content: "★"; /* 在 p 元素前插入星号 */
}

p::after {
  content: "★"; /* 在 p 元素后插入星号 */
}
```

---

## 问题 3：常用的伪类

### 1. 状态伪类

```css
/* 链接状态 */
a:link {
  color: blue;
} /* 未访问 */
a:visited {
  color: purple;
} /* 已访问 */
a:hover {
  color: red;
} /* 鼠标悬停 */
a:active {
  color: orange;
} /* 点击时 */

/* 表单状态 */
input:focus {
  border-color: blue;
} /* 获得焦点 */
input:disabled {
  opacity: 0.5;
} /* 禁用 */
input:checked {
  background: green;
} /* 选中(checkbox/radio) */
input:valid {
  border-color: green;
} /* 验证通过 */
input:invalid {
  border-color: red;
} /* 验证失败 */
```

### 2. 结构伪类

```css
/* 子元素选择 */
li:first-child {
} /* 第一个子元素 */
li:last-child {
} /* 最后一个子元素 */
li:nth-child(2) {
} /* 第 2 个子元素 */
li:nth-child(odd) {
} /* 奇数子元素 */
li:nth-child(even) {
} /* 偶数子元素 */
li:nth-child(3n) {
} /* 3 的倍数 */

/* 类型选择 */
p:first-of-type {
} /* 第一个 p 元素 */
p:last-of-type {
} /* 最后一个 p 元素 */
p:nth-of-type(2) {
} /* 第 2 个 p 元素 */

/* 其他 */
p:only-child {
} /* 唯一子元素 */
p:empty {
} /* 空元素 */
:not(.active) {
} /* 非 .active 的元素 */
```

### 3. 实际应用

```css
/* 表格斑马纹 */
tr:nth-child(odd) {
  background: #f5f5f5;
}

/* 列表最后一项不显示边框 */
li:last-child {
  border-bottom: none;
}

/* 表单验证提示 */
input:invalid:focus {
  border-color: red;
  box-shadow: 0 0 5px red;
}

/* 禁用按钮样式 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 问题 4：常用的伪元素

### 1. ::before 和 ::after

```css
/* 基本用法 */
.icon::before {
  content: "★";
  color: gold;
  margin-right: 5px;
}

/* 插入图片 */
.link::before {
  content: url("icon.png");
}

/* 插入属性值 */
a::after {
  content: " (" attr(href) ")";
}

/* 清除浮动 */
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

### 2. ::first-letter 和 ::first-line

```css
/* 首字母样式 */
p::first-letter {
  font-size: 2em;
  font-weight: bold;
  color: red;
  float: left;
  margin-right: 5px;
}

/* 首行样式 */
p::first-line {
  font-weight: bold;
  color: blue;
}
```

### 3. ::selection

```css
/* 文本选中样式 */
::selection {
  background: yellow;
  color: black;
}

/* 特定元素的选中样式 */
p::selection {
  background: lightblue;
}
```

### 4. ::placeholder

```css
/* 输入框占位符样式 */
input::placeholder {
  color: #999;
  font-style: italic;
}
```

---

## 问题 5：伪元素和伪类的实际应用

### 应用 1: 装饰性图标

```css
.success::before {
  content: "✓";
  color: green;
  font-weight: bold;
  margin-right: 5px;
}

.error::before {
  content: "✗";
  color: red;
  font-weight: bold;
  margin-right: 5px;
}
```

### 应用 2: 三角形箭头

```css
.tooltip::after {
  content: "";
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: black;
}
```

### 应用 3: 引号

```css
blockquote::before {
  content: open-quote;
  font-size: 2em;
  color: #ccc;
}

blockquote::after {
  content: close-quote;
  font-size: 2em;
  color: #ccc;
}
```

### 应用 4: 遮罩层

```css
.modal::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}
```

### 应用 5: 计数器

```css
body {
  counter-reset: section;
}

h2::before {
  counter-increment: section;
  content: "Section " counter(section) ": ";
}
```

### 应用 6: 悬停效果

```css
.button {
  position: relative;
  overflow: hidden;
}

.button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  transition: left 0.3s;
}

.button:hover::before {
  left: 0;
}
```

### 应用 7: 分隔线

```css
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

```html
<div class="divider">或</div>
<!-- 显示为: ─── 或 ─── -->
```

---

## 问题 6：注意事项和限制

### 1. content 属性是必需的

```css
/* ❌ 错误: 没有 content */
.element::before {
  display: block;
  width: 100px;
}

/* ✅ 正确: 必须有 content */
.element::before {
  content: "";
  display: block;
  width: 100px;
}
```

### 2. 伪元素不在 DOM 中

```javascript
// ❌ 无法通过 JavaScript 直接访问伪元素
const before = document.querySelector(".element::before"); // null

// ✅ 只能通过 getComputedStyle 读取样式
const element = document.querySelector(".element");
const beforeStyle = getComputedStyle(element, "::before");
const content = beforeStyle.content;
```

### 3. 某些元素不支持伪元素

```css
/* ❌ 这些元素不支持 ::before 和 ::after */
img::before {
}
input::before {
}
textarea::before {
}
br::before {
}

/* ✅ 可以在父元素上使用 */
.image-wrapper::before {
  content: "";
}
```

### 4. 伪元素的层级

```css
.element {
  position: relative;
}

.element::before {
  content: "";
  position: absolute;
  z-index: -1; /* 在元素后面 */
}

.element::after {
  content: "";
  position: absolute;
  z-index: 1; /* 在元素前面 */
}
```

## 总结

**核心概念**:

### 1. 主要区别

- 伪类: 选择元素状态(`:hover`, `:first-child`)
- 伪元素: 创建虚拟元素(`::before`, `::after`)

### 2. 语法

- 伪类: 单冒号 `:`
- 伪元素: 双冒号 `::`(CSS3)

### 3. 常用伪类

- 状态: `:hover`, `:focus`, `:active`
- 结构: `:first-child`, `:nth-child()`, `:last-child`
- 表单: `:checked`, `:disabled`, `:valid`

### 4. 常用伪元素

- `::before`, `::after`: 插入内容
- `::first-letter`, `::first-line`: 首字母/首行
- `::selection`: 选中样式
- `::placeholder`: 占位符样式

## 延伸阅读

- [MDN - 伪类](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Pseudo-classes)
- [MDN - 伪元素](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Pseudo-elements)
- [CSS Tricks - A Whole Bunch of Amazing Stuff Pseudo Elements Can Do](https://css-tricks.com/pseudo-element-roundup/)
- [W3C - CSS Selectors](https://www.w3.org/TR/selectors-4/)
