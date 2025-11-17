---
title: 关于 CSS 选择器你需要知道什么？
category: CSS
difficulty: 中级
updatedAt: 2025-11-17
summary: >-
  深入理解 CSS 选择器的各种类型和用法，掌握选择器优先级、组合选择器、伪类和伪元素，学习如何编写高效的 CSS 选择器，提升样式开发效率。
tags:
  - CSS选择器
  - 选择器优先级
  - 伪类
  - 伪元素
estimatedTime: 24 分钟
keywords:
  - CSS选择器
  - 选择器优先级
  - 伪类
  - 伪元素
  - 组合选择器
highlight: CSS 选择器有多种类型，理解选择器优先级和组合方式是编写高效 CSS 的关键
order: 134
---

## 问题 1：CSS 选择器有哪些基本类型？

CSS 选择器分为**多种基本类型**。

### 基础选择器

```css
/* 1. 通配符选择器 */
* {
  margin: 0;
  padding: 0;
}

/* 2. 元素选择器（标签选择器） */
div {
  color: blue;
}

p {
  font-size: 16px;
}

/* 3. 类选择器 */
.container {
  width: 1200px;
}

.btn {
  padding: 10px 20px;
}

/* 4. ID 选择器 */
#header {
  background: #333;
}

#main {
  min-height: 500px;
}

/* 5. 属性选择器 */
[type="text"] {
  border: 1px solid #ccc;
}

[disabled] {
  opacity: 0.5;
}

/* 6. 伪类选择器 */
a:hover {
  color: red;
}

input:focus {
  border-color: blue;
}

/* 7. 伪元素选择器 */
p::before {
  content: "→ ";
}

p::after {
  content: " ←";
}
```

### 选择器示例

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 元素选择器 */
    h1 {
      color: #333;
    }
    
    /* 类选择器 */
    .highlight {
      background: yellow;
    }
    
    /* ID 选择器 */
    #logo {
      width: 200px;
    }
    
    /* 属性选择器 */
    input[type="email"] {
      border: 2px solid blue;
    }
  </style>
</head>
<body>
  <h1>标题</h1>
  <p class="highlight">高亮文本</p>
  <div id="logo">Logo</div>
  <input type="email" placeholder="邮箱">
</body>
</html>
```

---

## 问题 2：CSS 组合选择器有哪些？

组合选择器可以**组合多个选择器**。

### 后代选择器

```css
/* 后代选择器（空格）：选择所有后代 */
div p {
  color: blue;
}

.container .item {
  margin: 10px;
}

/* 示例 */
/* <div>
     <p>会被选中</p>
     <section>
       <p>也会被选中</p>
     </section>
   </div> */
```

### 子选择器

```css
/* 子选择器（>）：只选择直接子元素 */
div > p {
  color: red;
}

.menu > li {
  display: inline-block;
}

/* 示例 */
/* <div>
     <p>会被选中</p>
     <section>
       <p>不会被选中</p>
     </section>
   </div> */
```

### 相邻兄弟选择器

```css
/* 相邻兄弟选择器（+）：选择紧邻的下一个兄弟 */
h1 + p {
  font-weight: bold;
}

.title + .content {
  margin-top: 20px;
}

/* 示例 */
/* <h1>标题</h1>
   <p>会被选中</p>
   <p>不会被选中</p> */
```

### 通用兄弟选择器

```css
/* 通用兄弟选择器（~）：选择后面所有兄弟 */
h1 ~ p {
  color: gray;
}

.title ~ .item {
  opacity: 0.8;
}

/* 示例 */
/* <h1>标题</h1>
   <p>会被选中</p>
   <div>其他元素</div>
   <p>也会被选中</p> */
```

### 组合示例

```css
/* 复杂组合 */
.container > .item + .item {
  margin-left: 20px;
}

nav ul > li:first-child {
  margin-left: 0;
}

.sidebar .widget ~ .widget {
  margin-top: 30px;
}
```

---

## 问题 3：属性选择器有哪些用法？

属性选择器可以**根据属性匹配元素**。

### 基本属性选择器

```css
/* 存在属性 */
[disabled] {
  opacity: 0.5;
}

[required] {
  border-color: red;
}

/* 属性值完全匹配 */
[type="text"] {
  border: 1px solid #ccc;
}

[class="btn"] {
  padding: 10px;
}

/* 属性值包含某个词（空格分隔） */
[class~="active"] {
  background: blue;
}

/* 匹配 class="btn active" 或 class="active" */

/* 属性值以某个值开头（-分隔） */
[lang|="en"] {
  font-family: Arial;
}

/* 匹配 lang="en" 或 lang="en-US" */
```

### 高级属性选择器

```css
/* 属性值以某个字符串开头 */
[href^="https"] {
  color: green;
}

[class^="btn-"] {
  padding: 8px 16px;
}

/* 属性值以某个字符串结尾 */
[href$=".pdf"] {
  background: url(pdf-icon.png);
}

[src$=".jpg"] {
  border: 2px solid #ccc;
}

/* 属性值包含某个字符串 */
[href*="example"] {
  text-decoration: underline;
}

[class*="col-"] {
  float: left;
}

/* 不区分大小写 */
[type="text" i] {
  border: 1px solid blue;
}
```

### 实际应用

```css
/* 外部链接 */
a[href^="http"]:not([href*="mysite.com"]) {
  color: blue;
}

a[href^="http"]:not([href*="mysite.com"])::after {
  content: " ↗";
}

/* 文件类型图标 */
a[href$=".pdf"]::before {
  content: "📄 ";
}

a[href$=".zip"]::before {
  content: "📦 ";
}

a[href$=".doc"]::before {
  content: "📝 ";
}

/* 表单验证 */
input[type="email"]:invalid {
  border-color: red;
}

input[type="email"]:valid {
  border-color: green;
}

/* 响应式图片 */
img[src*="thumbnail"] {
  width: 100px;
}

img[src*="large"] {
  width: 100%;
}
```

---

## 问题 4：伪类选择器有哪些？

伪类选择器用于**选择特定状态的元素**。

### 动态伪类

```css
/* 链接伪类 */
a:link {
  color: blue; /* 未访问 */
}

a:visited {
  color: purple; /* 已访问 */
}

a:hover {
  color: red; /* 鼠标悬停 */
}

a:active {
  color: orange; /* 激活/点击 */
}

/* 用户行为伪类 */
input:focus {
  border-color: blue;
  outline: none;
}

button:hover {
  background: #333;
}

.item:active {
  transform: scale(0.95);
}
```

### 结构伪类

```css
/* 第一个/最后一个子元素 */
li:first-child {
  margin-top: 0;
}

li:last-child {
  margin-bottom: 0;
}

/* 唯一子元素 */
p:only-child {
  text-align: center;
}

/* 第 n 个子元素 */
li:nth-child(2) {
  color: red; /* 第 2 个 */
}

li:nth-child(odd) {
  background: #f5f5f5; /* 奇数 */
}

li:nth-child(even) {
  background: white; /* 偶数 */
}

li:nth-child(3n) {
  color: blue; /* 3, 6, 9... */
}

li:nth-child(3n+1) {
  color: green; /* 1, 4, 7... */
}

/* 倒数第 n 个 */
li:nth-last-child(2) {
  font-weight: bold;
}

/* 第一个/最后一个某类型元素 */
p:first-of-type {
  font-size: 20px;
}

p:last-of-type {
  margin-bottom: 0;
}

/* 第 n 个某类型元素 */
p:nth-of-type(2) {
  color: red;
}

/* 唯一的某类型元素 */
p:only-of-type {
  text-align: center;
}
```

### 表单伪类

```css
/* 启用/禁用 */
input:enabled {
  background: white;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* 选中状态 */
input:checked {
  accent-color: blue;
}

input[type="checkbox"]:checked + label {
  font-weight: bold;
}

/* 必填 */
input:required {
  border-left: 3px solid red;
}

input:optional {
  border-left: 3px solid gray;
}

/* 验证状态 */
input:valid {
  border-color: green;
}

input:invalid {
  border-color: red;
}

/* 范围 */
input:in-range {
  border-color: green;
}

input:out-of-range {
  border-color: red;
}

/* 只读 */
input:read-only {
  background: #f5f5f5;
}

input:read-write {
  background: white;
}
```

### 其他伪类

```css
/* 否定伪类 */
li:not(.active) {
  opacity: 0.5;
}

input:not([type="submit"]) {
  width: 100%;
}

/* 空元素 */
p:empty {
  display: none;
}

/* 目标元素（URL 锚点） */
:target {
  background: yellow;
}

/* 根元素 */
:root {
  --primary-color: blue;
}

/* 语言 */
:lang(zh) {
  font-family: "Microsoft YaHei";
}
```

---

## 问题 5：伪元素选择器有哪些？

伪元素用于**创建虚拟元素**。

### 常用伪元素

```css
/* ::before 和 ::after */
.icon::before {
  content: "→ ";
  color: blue;
}

.icon::after {
  content: " ←";
  color: red;
}

/* 首字母 */
p::first-letter {
  font-size: 2em;
  font-weight: bold;
  float: left;
  margin-right: 5px;
}

/* 首行 */
p::first-line {
  font-weight: bold;
  color: blue;
}

/* 选中文本 */
::selection {
  background: yellow;
  color: black;
}

/* 占位符 */
input::placeholder {
  color: #999;
  font-style: italic;
}
```

### 实际应用

```css
/* 清除浮动 */
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* 图标 */
.btn::before {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  background: url(icon.png);
  margin-right: 5px;
}

/* 引号 */
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

/* 装饰线 */
.title::after {
  content: "";
  display: block;
  width: 50px;
  height: 3px;
  background: blue;
  margin-top: 10px;
}

/* 角标 */
.badge {
  position: relative;
}

.badge::after {
  content: "new";
  position: absolute;
  top: -5px;
  right: -10px;
  background: red;
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
}

/* 三角形 */
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

---

## 问题 6：CSS 选择器优先级是什么？

选择器优先级决定了**样式的应用顺序**。

### 优先级规则

```css
/* 优先级从高到低：
 * 1. !important
 * 2. 内联样式（style 属性）
 * 3. ID 选择器
 * 4. 类选择器、属性选择器、伪类
 * 5. 元素选择器、伪元素
 * 6. 通配符选择器
 */

/* 计算方式（a, b, c, d）：
 * a: 内联样式（1000）
 * b: ID 选择器数量（100）
 * c: 类、属性、伪类数量（10）
 * d: 元素、伪元素数量（1）
 */

/* 示例 */
div {
  color: black; /* (0, 0, 0, 1) = 1 */
}

.container {
  color: blue; /* (0, 0, 1, 0) = 10 */
}

#header {
  color: red; /* (0, 1, 0, 0) = 100 */
}

div.container {
  color: green; /* (0, 0, 1, 1) = 11 */
}

#header .nav {
  color: purple; /* (0, 1, 1, 0) = 110 */
}

/* 内联样式 */
/* <div style="color: orange;"> */ /* (1, 0, 0, 0) = 1000 */

/* !important（最高优先级） */
div {
  color: pink !important;
}
```

### 优先级示例

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 优先级：1 */
    p {
      color: black;
    }
    
    /* 优先级：10 */
    .text {
      color: blue;
    }
    
    /* 优先级：100 */
    #content {
      color: red;
    }
    
    /* 优先级：11 */
    p.text {
      color: green;
    }
    
    /* 优先级：110 */
    #content .text {
      color: purple;
    }
  </style>
</head>
<body>
  <div id="content">
    <p class="text">最终颜色是 purple</p>
  </div>
</body>
</html>
```

### 提高优先级的方法

```css
/* 方法 1：增加选择器权重 */
/* 低优先级 */
.btn {
  background: blue;
}

/* 高优先级 */
.container .btn {
  background: red;
}

/* 方法 2：使用 ID */
#special-btn {
  background: green;
}

/* 方法 3：重复选择器 */
.btn.btn {
  background: yellow; /* 优先级：20 */
}

/* 方法 4：使用 !important（不推荐） */
.btn {
  background: orange !important;
}

/* 最佳实践：避免过高优先级 */
/* ❌ 不好 */
#header .nav ul li a {
  color: blue;
}

/* ✅ 好 */
.nav-link {
  color: blue;
}
```

---

## 问题 7：如何编写高效的 CSS 选择器？

编写**高效的选择器**可以提升性能。

### 性能优化

```css
/* 1. 避免通配符选择器 */
/* ❌ 慢 */
* {
  margin: 0;
}

.container * {
  box-sizing: border-box;
}

/* ✅ 快 */
body, h1, h2, p {
  margin: 0;
}

/* 2. 避免过深的选择器 */
/* ❌ 慢 */
.header .nav ul li a span {
  color: blue;
}

/* ✅ 快 */
.nav-link-text {
  color: blue;
}

/* 3. 使用类选择器而非标签选择器 */
/* ❌ 慢 */
div.container div.item div.content {
  padding: 10px;
}

/* ✅ 快 */
.item-content {
  padding: 10px;
}

/* 4. 避免使用标签限定类选择器 */
/* ❌ 慢 */
div.container {
  width: 1200px;
}

/* ✅ 快 */
.container {
  width: 1200px;
}
```

### 可维护性

```css
/* 1. 使用语义化的类名 */
/* ❌ 不好 */
.box1 {
  background: blue;
}

.text2 {
  color: red;
}

/* ✅ 好 */
.primary-button {
  background: blue;
}

.error-message {
  color: red;
}

/* 2. 使用 BEM 命名规范 */
/* Block__Element--Modifier */
.card {
  /* 块 */
}

.card__title {
  /* 元素 */
}

.card__title--large {
  /* 修饰符 */
}

.card--featured {
  /* 修饰符 */
}

/* 3. 避免过度嵌套 */
/* ❌ 不好 */
.header {
  .nav {
    .menu {
      .item {
        .link {
          color: blue;
        }
      }
    }
  }
}

/* ✅ 好 */
.header {
}

.header-nav {
}

.nav-item {
}

.nav-link {
  color: blue;
}
```

### 最佳实践

```css
/* 1. 组合选择器要有意义 */
/* ✅ 好：表示导航中的激活链接 */
.nav .link.active {
  color: blue;
}

/* 2. 使用子选择器限制范围 */
/* ✅ 好：只选择直接子元素 */
.menu > .item {
  display: inline-block;
}

/* 3. 合理使用伪类 */
/* ✅ 好：第一个和最后一个特殊处理 */
.item:first-child {
  margin-left: 0;
}

.item:last-child {
  margin-right: 0;
}

/* 4. 使用属性选择器增强语义 */
/* ✅ 好：根据状态设置样式 */
button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type="email"]:invalid {
  border-color: red;
}

/* 5. 避免 !important */
/* ❌ 不好 */
.btn {
  background: blue !important;
}

/* ✅ 好：提高选择器权重 */
.container .btn {
  background: blue;
}
```

---

## 总结

**CSS 选择器的核心要点**：

### 1. 基本类型
- 通配符选择器（*）
- 元素选择器（div）
- 类选择器（.class）
- ID 选择器（#id）
- 属性选择器（[attr]）

### 2. 组合选择器
- 后代选择器（空格）
- 子选择器（>）
- 相邻兄弟（+）
- 通用兄弟（~）

### 3. 属性选择器
- 存在属性：[attr]
- 值匹配：[attr="value"]
- 开头匹配：[attr^="value"]
- 结尾匹配：[attr$="value"]
- 包含匹配：[attr*="value"]

### 4. 伪类
- 动态伪类：:hover、:focus、:active
- 结构伪类：:first-child、:nth-child()
- 表单伪类：:checked、:disabled、:valid
- 其他伪类：:not()、:empty、:target

### 5. 伪元素
- ::before、::after
- ::first-letter、::first-line
- ::selection、::placeholder

### 6. 优先级
- !important > 内联 > ID > 类 > 元素
- 计算方式：(a, b, c, d)
- 避免过高优先级

### 7. 最佳实践
- 避免通配符和过深嵌套
- 使用语义化类名
- 合理使用组合选择器
- 注意性能和可维护性

## 延伸阅读

- [MDN - CSS 选择器](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Selectors)
- [CSS 选择器参考手册](https://www.w3school.com.cn/cssref/css_selectors.asp)
- [选择器优先级计算](https://specificity.keegan.st/)
- [BEM 命名规范](http://getbem.com/)
