---
title: CSS 选择器有哪些、优先级如何
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  全面了解 CSS 选择器的类型、优先级计算规则、以及如何正确使用选择器避免样式冲突。
tags:
  - CSS
  - 选择器
  - 优先级
  - 特异性
estimatedTime: 22 分钟
keywords:
  - CSS选择器
  - 选择器优先级
  - 特异性
  - 权重计算
highlight: 掌握 CSS 选择器的完整体系和优先级规则
order: 19
---

## 问题 1：CSS 选择器的分类

### 1. 基础选择器

```css
/* 通配符选择器 */
* {
  margin: 0;
}

/* 元素选择器 */
div {
  color: red;
}
p {
  font-size: 16px;
}

/* 类选择器 */
.container {
  width: 100%;
}
.active {
  color: blue;
}

/* ID 选择器 */
#header {
  height: 60px;
}
#main {
  padding: 20px;
}

/* 属性选择器 */
[type="text"] {
  border: 1px solid #ccc;
}
[disabled] {
  opacity: 0.5;
}
```

### 2. 组合选择器

```css
/* 后代选择器(空格) */
div p {
  color: red;
}

/* 子选择器(>) */
ul > li {
  list-style: none;
}

/* 相邻兄弟选择器(+) */
h1 + p {
  margin-top: 0;
}

/* 通用兄弟选择器(~) */
h1 ~ p {
  color: gray;
}
```

### 3. 伪类选择器

```css
/* 状态伪类 */
a:hover {
  color: red;
}
input:focus {
  border-color: blue;
}
button:active {
  transform: scale(0.95);
}

/* 结构伪类 */
li:first-child {
  font-weight: bold;
}
li:last-child {
  border-bottom: none;
}
li:nth-child(2n) {
  background: #f5f5f5;
}

/* 表单伪类 */
input:checked {
  background: green;
}
input:disabled {
  opacity: 0.5;
}
input:valid {
  border-color: green;
}
```

### 4. 伪元素选择器

```css
/* 内容伪元素 */
p::before {
  content: "→ ";
}
p::after {
  content: " ←";
}

/* 文本伪元素 */
p::first-letter {
  font-size: 2em;
}
p::first-line {
  font-weight: bold;
}

/* 其他伪元素 */
::selection {
  background: yellow;
}
input::placeholder {
  color: #999;
}
```

---

## 问题 2：属性选择器的详细用法

```css
/* 1. 存在属性 */
[disabled] {
  opacity: 0.5;
}

/* 2. 精确匹配 */
[type="text"] {
  border: 1px solid #ccc;
}

/* 3. 包含单词(空格分隔) */
[class~="active"] {
  color: red;
}
/* 匹配: class="btn active" */

/* 4. 以...开头 */
[class^="btn"] {
  padding: 10px;
}
/* 匹配: class="btn-primary" */

/* 5. 以...结尾 */
[class$="icon"] {
  font-size: 20px;
}
/* 匹配: class="search-icon" */

/* 6. 包含子串 */
[class*="btn"] {
  cursor: pointer;
}
/* 匹配: class="my-btn-large" */

/* 7. 以...开头(连字符分隔) */
[lang|="en"] {
  font-family: Arial;
}
/* 匹配: lang="en" 或 lang="en-US" */

/* 8. 不区分大小写 */
[type="text" i] {
}
```

---

## 问题 3：选择器优先级计算

### 优先级规则

优先级用四位数表示: `(a, b, c, d)`

| 选择器类型    | 权重      | 示例                       |
| ------------- | --------- | -------------------------- |
| 内联样式      | (1,0,0,0) | `style="color: red"`       |
| ID 选择器     | (0,1,0,0) | `#header`                  |
| 类/属性/伪类  | (0,0,1,0) | `.nav`, `[type]`, `:hover` |
| 元素/伪元素   | (0,0,0,1) | `div`, `::before`          |
| 通配符/组合器 | (0,0,0,0) | `*`, `>`, `+`, `~`         |

### 计算示例

```css
/* 1. 单个选择器 */
div                    /* (0,0,0,1) */
.nav                   /* (0,0,1,0) */
#header                /* (0,1,0,0) */

/* 2. 组合选择器 */
div.nav                /* (0,0,1,1) */
#header .nav           /* (0,1,1,0) */
ul li a                /* (0,0,0,3) */

/* 3. 复杂选择器 */
#header .nav ul li a:hover
/* (0,1,2,3) = ID(1) + 类(1) + 伪类(1) + 元素(3) */

div.container > .item:first-child::before
/* (0,0,3,2) = 类(2) + 伪类(1) + 元素(1) + 伪元素(1) */
```

### 比较规则

```css
/* 从左到右比较,数字大的优先级高 */

/* 示例 1 */
#header {
} /* (0,1,0,0) */
.nav.active {
} /* (0,0,2,0) */
/* 结果: #header 优先(第二位 1 > 0) */

/* 示例 2 */
.nav .item {
} /* (0,0,2,0) */
.nav {
} /* (0,0,1,0) */
/* 结果: .nav .item 优先(第三位 2 > 1) */

/* 示例 3: 权重相同 */
.nav {
  color: red;
}
.nav {
  color: blue;
}
/* 结果: blue(后面的覆盖前面的) */
```

---

## 问题 4：特殊情况和注意事项

### 1. !important

```css
/* !important 优先级最高 */
.nav {
  color: red !important;
}

#header .nav {
  color: blue; /* 不生效 */
}

/* 多个 !important 时,比较选择器权重 */
.nav {
  color: red !important; /* (0,0,1,0) */
}

#header .nav {
  color: blue !important; /* (0,1,1,0) - 优先 */
}
```

### 2. 内联样式

```html
<div style="color: red;" class="nav">
  <!-- 内联样式优先级 (1,0,0,0) -->
</div>

<style>
  #nav {
    color: blue;
  } /* (0,1,0,0) - 不生效 */
</style>
```

### 3. :not() 伪类

```css
/* :not() 本身权重为 0,只计算括号内的选择器 */
:not(.nav) {
}
/* (0,0,1,0) - 只计算 .nav */

div:not(#header) {
}
/* (0,1,0,1) - ID(1) + 元素(1) */
```

### 4. :is() 和 :where()

```css
/* :is() 取参数中权重最高的 */
:is(#header, .nav, div) {
}
/* (0,1,0,0) - 取 #header 的权重 */

/* :where() 权重始终为 0 */
:where(#header, .nav, div) {
}
/* (0,0,0,0) */
```

---

## 问题 5：实际应用和最佳实践

### 1. 避免过高的优先级

```css
/* ❌ 避免: 优先级过高 */
#header #nav .item a {
}
/* (0,2,1,1) - 难以覆盖 */

/* ✅ 推荐: 使用类选择器 */
.nav-link {
}
/* (0,0,1,0) - 易于维护 */
```

### 2. 避免使用 !important

```css
/* ❌ 避免 */
.button {
  color: red !important;
}

/* ✅ 推荐: 提高选择器优先级 */
.theme-dark .button {
  color: red;
}
```

### 3. 使用 BEM 命名规范

```css
/* Block Element Modifier */
.card {
}
.card__header {
}
.card__body {
}
.card--featured {
}

/* 优点: 优先级统一,易于维护 */
```

### 4. 使用 :where() 降低优先级

```css
/* 组件库样式 */
:where(.button) {
  padding: 10px;
  /* (0,0,0,0) - 易于被用户覆盖 */
}

/* 用户样式 */
.my-button {
  padding: 20px;
  /* (0,0,1,0) - 可以覆盖 */
}
```

### 5. 合理使用选择器层级

```css
/* ❌ 避免: 层级过深 */
.header .nav .menu .item .link {
}

/* ✅ 推荐: 扁平化 */
.nav-link {
}

/* ✅ 或使用子选择器 */
.nav > .item > .link {
}
```

---

## 问题 6：调试优先级问题

### 1. 使用浏览器开发者工具

```javascript
// 查看元素的所有样式
const element = document.querySelector(".nav");
const styles = getComputedStyle(element);
console.log(styles.color);

// 查看样式来源
// Chrome DevTools → Elements → Styles
// 可以看到每条规则的来源和是否被覆盖
```

### 2. 计算选择器权重

```javascript
// 简单的权重计算函数
function calculateSpecificity(selector) {
  const ids = (selector.match(/#/g) || []).length;
  const classes = (selector.match(/\./g) || []).length;
  const elements = (selector.match(/\b[a-z]+\b/g) || []).length;

  return `(0,${ids},${classes},${elements})`;
}

console.log(calculateSpecificity("#header .nav ul li"));
// (0,1,1,2)
```

### 3. 临时提高优先级

```css
/* 开发时临时使用,不要提交到代码库 */
.nav {
  color: red !important;
}
```

## 总结

**核心概念**:

### 1. 选择器类型

- 基础: `*`, 元素, `.class`, `#id`, `[attr]`
- 组合: 后代, 子, 相邻兄弟, 通用兄弟
- 伪类: `:hover`, `:first-child`, `:nth-child()`
- 伪元素: `::before`, `::after`, `::first-letter`

### 2. 优先级计算

- 内联样式: (1,0,0,0)
- ID: (0,1,0,0)
- 类/属性/伪类: (0,0,1,0)
- 元素/伪元素: (0,0,0,1)

### 3. 比较规则

- 从左到右比较
- 数字大的优先级高
- 权重相同时,后面的覆盖前面的
- `!important` 优先级最高

### 4. 最佳实践

- 避免使用 ID 选择器
- 避免过深的嵌套
- 避免使用 `!important`
- 使用 BEM 等命名规范
- 使用 `:where()` 降低优先级

## 延伸阅读

- [MDN - CSS 选择器](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Selectors)
- [MDN - 优先级](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Specificity)
- [Specificity Calculator](https://specificity.keegan.st/)
- [CSS Tricks - Specifics on CSS Specificity](https://css-tricks.com/specifics-on-css-specificity/)
