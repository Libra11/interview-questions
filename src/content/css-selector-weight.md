---
title: CSS 中属性选择器及类选择器的权重哪个高
category: CSS
difficulty: 入门
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS 选择器的优先级计算规则,包括不同类型选择器的权重、优先级比较方法,以及如何正确使用选择器避免优先级冲突。
tags:
  - CSS
  - 选择器
  - 优先级
  - 权重
estimatedTime: 18 分钟
keywords:
  - CSS选择器
  - 选择器权重
  - 优先级
  - 特异性
highlight: 理解 CSS 选择器权重的计算规则,避免样式冲突
order: 45
---

## 问题 1：属性选择器和类选择器的权重是否相同

**答案**: 属性选择器和类选择器的权重**相同**,都是 `0,1,0`。

```css
/* 类选择器: 权重 0,1,0 */
.my-class {
  color: red;
}

/* 属性选择器: 权重 0,1,0 */
[class="my-class"] {
  color: blue;
}

/* 后面的规则会覆盖前面的规则(权重相同时) */
```

```html
<div class="my-class">文字颜色是蓝色</div>
```

---

## 问题 2：CSS 选择器的权重如何计算

CSS 选择器的权重(特异性)用四个数字表示: `a,b,c,d`

### 权重计算规则

| 选择器类型   | 权重      | 示例                 |
| ------------ | --------- | -------------------- |
| 内联样式     | `1,0,0,0` | `style="color: red"` |
| ID 选择器    | `0,1,0,0` | `#header`            |
| 类选择器     | `0,0,1,0` | `.nav`               |
| 属性选择器   | `0,0,1,0` | `[type="text"]`      |
| 伪类选择器   | `0,0,1,0` | `:hover`             |
| 标签选择器   | `0,0,0,1` | `div`                |
| 伪元素选择器 | `0,0,0,1` | `::before`           |
| 通配符选择器 | `0,0,0,0` | `*`                  |
| 组合器       | `0,0,0,0` | `>`, `+`, `~`, ` `   |

### 计算示例

```css
/* 1. 单个选择器 */
div {
} /* 0,0,0,1 */
.nav {
} /* 0,0,1,0 */
#header {
} /* 0,1,0,0 */
[type="text"] {
} /* 0,0,1,0 */
:hover {
} /* 0,0,1,0 */

/* 2. 组合选择器 */
div.nav {
} /* 0,0,1,1 = 0,0,0,1 + 0,0,1,0 */
#header .nav {
} /* 0,1,1,0 = 0,1,0,0 + 0,0,1,0 */
ul li a {
} /* 0,0,0,3 = 0,0,0,1 + 0,0,0,1 + 0,0,0,1 */
.nav[type="text"] {
} /* 0,0,2,0 = 0,0,1,0 + 0,0,1,0 */

/* 3. 复杂选择器 */
#header .nav ul li a:hover {
}
/* 0,1,2,3 = 0,1,0,0 + 0,0,1,0 + 0,0,0,1 + 0,0,0,1 + 0,0,0,1 + 0,0,1,0 */

/* 4. 伪元素 */
div::before {
} /* 0,0,0,2 = 0,0,0,1 + 0,0,0,1 */
.nav::after {
} /* 0,0,1,1 = 0,0,1,0 + 0,0,0,1 */
```

---

## 问题 3：如何比较选择器的优先级

### 比较规则

从左到右依次比较,数字大的优先级高。

```css
/* 示例 1: 比较第一位 */
#header {
  color: red;
} /* 0,1,0,0 */
.nav.active {
  color: blue;
} /* 0,0,2,0 */
/* 结果: red (第一位 1 > 0) */

/* 示例 2: 第一位相同,比较第二位 */
.nav .item {
  color: red;
} /* 0,0,2,0 */
.nav {
  color: blue;
} /* 0,0,1,0 */
/* 结果: red (第二位 2 > 1) */

/* 示例 3: 前三位相同,比较第三位 */
div.nav {
  color: red;
} /* 0,0,1,1 */
.nav {
  color: blue;
} /* 0,0,1,0 */
/* 结果: red (第三位 1 > 0) */

/* 示例 4: 权重完全相同 */
.nav {
  color: red;
}
.nav {
  color: blue;
}
/* 结果: blue (后面的规则覆盖前面的) */
```

### 特殊情况

```css
/* 1. !important 优先级最高 */
.nav {
  color: red !important;
} /* 最高优先级 */
#header {
  color: blue;
} /* 0,1,0,0 */
/* 结果: red */

/* 2. 内联样式 */
<div style="color: red;" class="nav" > 文字</div > .nav {
  color: blue;
}
/* 结果: red (内联样式权重 1,0,0,0) */

/* 3. 多个 !important */
.nav {
  color: red !important;
} /* 0,0,1,0 + !important */
#header {
  color: blue !important;
} /* 0,1,0,0 + !important */
/* 结果: blue (在 !important 中,仍然比较选择器权重) */
```

---

## 问题 4：常见的权重陷阱

### 陷阱 1: 类选择器无法覆盖 ID 选择器

```css
/* ❌ 错误认知: 多个类选择器可以覆盖 ID */
.nav.nav.nav.nav.nav.nav.nav.nav.nav.nav {
  color: red;
}
/* 权重: 0,0,10,0 */

#header {
  color: blue;
}
/* 权重: 0,1,0,0 */

/* 结果: blue (0,1,0,0 > 0,0,10,0) */
/* 因为第一位 1 > 0,后面的数字不再比较 */
```

### 陷阱 2: 属性选择器和类选择器权重相同

```css
/* 权重相同,后面的覆盖前面的 */
.button {
  color: red;
}
/* 权重: 0,0,1,0 */

[class="button"] {
  color: blue;
}
/* 权重: 0,0,1,0 */

/* 结果: blue */
```

### 陷阱 3: :not() 伪类的权重

```css
/* :not() 本身权重为 0,但括号内的选择器计入权重 */
:not(.nav) {
}
/* 权重: 0,0,1,0 (只计算 .nav 的权重) */

:not(#header) {
}
/* 权重: 0,1,0,0 (只计算 #header 的权重) */

div:not(.nav) {
}
/* 权重: 0,0,1,1 = 0,0,0,1 + 0,0,1,0 */
```

### 陷阱 4: :is() 和 :where() 的区别

```css
/* :is() 使用参数中权重最高的选择器 */
:is(#header, .nav, div) {
}
/* 权重: 0,1,0,0 (取最高的 #header) */

/* :where() 权重始终为 0 */
:where(#header, .nav, div) {
}
/* 权重: 0,0,0,0 */

/* 实际应用 */
:is(.nav, #header) a {
} /* 0,1,0,1 */
:where(.nav, #header) a {
} /* 0,0,0,1 */
```

---

## 问题 5：如何避免权重冲突

### 1. 使用合理的选择器层级

```css
/* ❌ 避免过深的嵌套 */
#header .nav ul li a span {
}
/* 权重: 0,1,1,4 - 难以覆盖 */

/* ✅ 使用扁平化的类名 */
.nav-link-text {
}
/* 权重: 0,0,1,0 - 易于维护 */
```

### 2. 避免使用 ID 选择器

```css
/* ❌ ID 选择器权重太高 */
#header {
}
/* 权重: 0,1,0,0 */

/* ✅ 使用类选择器 */
.header {
}
/* 权重: 0,0,1,0 */
```

### 3. 使用 :where() 降低权重

```css
/* 使用 :where() 包裹,权重为 0 */
:where(.nav) a {
}
/* 权重: 0,0,0,1 (只计算 a 的权重) */

/* 等价于 */
.nav a {
}
/* 权重: 0,0,1,1 */

/* :where() 的优势: 易于覆盖 */
```

### 4. 使用 CSS 变量

```css
/* 使用 CSS 变量避免重复声明 */
:root {
  --primary-color: blue;
}

.button {
  color: var(--primary-color);
}

/* 修改变量值,无需关心选择器权重 */
.dark-theme {
  --primary-color: lightblue;
}
```

### 5. 合理使用 !important

```css
/* ❌ 避免滥用 !important */
.button {
  color: red !important; /* 难以覆盖 */
}

/* ✅ 只在必要时使用 */
.utility-text-red {
  color: red !important; /* 工具类可以使用 */
}
```

## 总结

**核心概念总结**:

### 1. 权重相同的选择器

- 类选择器 `.class`
- 属性选择器 `[attr]`
- 伪类选择器 `:hover`
- 权重都是 `0,0,1,0`

### 2. 权重计算规则

- 内联样式: `1,0,0,0`
- ID 选择器: `0,1,0,0`
- 类/属性/伪类: `0,0,1,0`
- 标签/伪元素: `0,0,0,1`

### 3. 优先级比较

- 从左到右依次比较
- 数字大的优先级高
- 权重相同时,后面的覆盖前面的
- `!important` 优先级最高

### 4. 最佳实践

- 避免使用 ID 选择器
- 避免过深的嵌套
- 使用 `:where()` 降低权重
- 合理使用 `!important`

## 延伸阅读

- [MDN - CSS 优先级](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Specificity)
- [CSS Tricks - Specifics on CSS Specificity](https://css-tricks.com/specifics-on-css-specificity/)
- [Specificity Calculator](https://specificity.keegan.st/)
- [W3C - CSS Cascading and Inheritance](https://www.w3.org/TR/css-cascade-4/)
