---
title: px 如何转为 rem
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 rem 单位的工作原理,掌握 px 转 rem 的计算方法、自动化转换工具,以及在响应式设计中的实际应用。
tags:
  - CSS
  - rem
  - 响应式
  - 单位转换
estimatedTime: 18 分钟
keywords:
  - px转rem
  - rem单位
  - 响应式设计
  - 移动端适配
highlight: 掌握 rem 单位,实现灵活的响应式布局
order: 89
---

## 问题 1：什么是 rem

`rem`(root em)是相对于根元素(`<html>`)字体大小的单位。

```css
html {
  font-size: 16px; /* 根元素字体大小 */
}

.box {
  width: 10rem; /* 10 × 16px = 160px */
  height: 5rem; /* 5 × 16px = 80px */
  font-size: 1rem; /* 1 × 16px = 16px */
}
```

**与 em 的区别**:

```css
/* em: 相对于父元素字体大小 */
.parent {
  font-size: 20px;
}

.child {
  font-size: 2em; /* 2 × 20px = 40px */
}

/* rem: 相对于根元素字体大小 */
html {
  font-size: 16px;
}

.element {
  font-size: 2rem; /* 2 × 16px = 32px (不受父元素影响) */
}
```

---

## 问题 2：px 转 rem 的计算方法

### 基本计算公式

```
rem = px / 根元素字体大小
```

**示例**:

```css
/* 假设根元素字体大小为 16px */
html {
  font-size: 16px;
}

/* 计算 */
32px = 32 / 16 = 2rem
24px = 24 / 16 = 1.5rem
12px = 12 / 16 = 0.75rem
```

### 常用转换表(基于 16px)

| px   | rem      | 计算    |
| ---- | -------- | ------- |
| 8px  | 0.5rem   | 8 / 16  |
| 12px | 0.75rem  | 12 / 16 |
| 14px | 0.875rem | 14 / 16 |
| 16px | 1rem     | 16 / 16 |
| 18px | 1.125rem | 18 / 16 |
| 20px | 1.25rem  | 20 / 16 |
| 24px | 1.5rem   | 24 / 16 |
| 32px | 2rem     | 32 / 16 |

### 简化计算(使用 10px 基准)

```css
/* 设置根元素为 10px,方便计算 */
html {
  font-size: 10px;
}

/* 转换变得简单 */
.box {
  width: 20rem; /* 200px */
  height: 15rem; /* 150px */
  padding: 1rem; /* 10px */
}
```

**注意**: 使用 10px 基准时,需要重置 body 字体大小:

```css
html {
  font-size: 10px;
}

body {
  font-size: 1.6rem; /* 16px */
}
```

---

## 问题 3：响应式设计中的 rem

### 方案 1: 媒体查询调整根字体大小

```css
/* 移动端 */
html {
  font-size: 12px;
}

/* 平板 */
@media (min-width: 768px) {
  html {
    font-size: 14px;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  html {
    font-size: 16px;
  }
}

/* 大屏 */
@media (min-width: 1440px) {
  html {
    font-size: 18px;
  }
}

/* 使用 rem 的元素会自动缩放 */
.container {
  width: 60rem; /* 移动端 720px, 桌面端 960px */
  padding: 2rem; /* 移动端 24px, 桌面端 32px */
}
```

### 方案 2: 使用 vw 动态计算

```css
/* 基于设计稿宽度 750px */
html {
  font-size: calc(100vw / 7.5); /* 1rem = 100px (在 750px 宽度下) */
}

/* 限制最小和最大值 */
html {
  font-size: calc(100vw / 7.5);
  font-size: clamp(12px, calc(100vw / 7.5), 20px);
}

/* 使用 */
.box {
  width: 3.2rem; /* 设计稿 320px */
  height: 2rem; /* 设计稿 200px */
}
```

### 方案 3: JavaScript 动态设置

```javascript
// 基于设计稿宽度 750px
function setRem() {
  const baseSize = 100; // 基准大小
  const designWidth = 750; // 设计稿宽度
  const scale = document.documentElement.clientWidth / designWidth;
  const fontSize = baseSize * scale;

  // 限制最小和最大值
  const minFontSize = 12;
  const maxFontSize = 20;
  const finalFontSize = Math.max(minFontSize, Math.min(fontSize, maxFontSize));

  document.documentElement.style.fontSize = finalFontSize + "px";
}

// 初始化
setRem();

// 窗口大小改变时重新计算
window.addEventListener("resize", setRem);
```

---

## 问题 4：自动化转换工具

### 方案 1: PostCSS 插件

```bash
npm install postcss-pxtorem --save-dev
```

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    "postcss-pxtorem": {
      rootValue: 16, // 根元素字体大小
      propList: ["*"], // 需要转换的属性
      selectorBlackList: [".no-rem"], // 不转换的选择器
      minPixelValue: 2, // 小于 2px 不转换
    },
  },
};
```

```css
/* 输入 */
.box {
  width: 320px;
  height: 200px;
  font-size: 16px;
  border: 1px solid black; /* 不转换,小于 2px */
}

/* 输出 */
.box {
  width: 20rem;
  height: 12.5rem;
  font-size: 1rem;
  border: 1px solid black;
}
```

### 方案 2: Sass/Less 函数

```scss
// Sass
$base-font-size: 16px;

@function px2rem($px) {
  @return ($px / $base-font-size) * 1rem;
}

// 使用
.box {
  width: px2rem(320px); // 20rem
  height: px2rem(200px); // 12.5rem
}
```

```less
// Less
@base-font-size: 16;

.px2rem(@px) {
  @rem: (@px / @base-font-size) * 1rem;
}

// 使用
.box {
  .px2rem(320)[@rem]; // width: 20rem
}
```

### 方案 3: VS Code 插件

- **px to rem**: 自动转换 px 到 rem
- **cssrem**: 输入 px 自动提示 rem 值

---

## 问题 5：rem 的优缺点和注意事项

### 优点

```css
/* 1. 统一缩放 */
html {
  font-size: 14px; /* 修改这一处,所有 rem 单位都会缩放 */
}

/* 2. 响应式友好 */
@media (min-width: 1024px) {
  html {
    font-size: 16px; /* 所有元素自动放大 */
  }
}

/* 3. 避免 em 的嵌套问题 */
.parent {
  font-size: 2em;
}

.child {
  font-size: 2em; /* 会继承父元素,变成 4em */
}

/* 使用 rem 不会有这个问题 */
.child {
  font-size: 2rem; /* 始终相对于根元素 */
}
```

### 缺点和注意事项

```css
/* 1. 浏览器最小字体限制 */
html {
  font-size: 8px; /* Chrome 最小 12px,会被限制 */
}

/* 解决: 使用 transform 缩放 */
.small-text {
  font-size: 1.2rem; /* 12px */
  transform: scale(0.67); /* 缩放到 8px */
}

/* 2. 第三方组件可能不兼容 */
/* 某些组件使用 px 单位,修改根字体大小会导致错位 */

/* 3. 计算复杂 */
/* 16px 基准下,12px = 0.75rem,不够直观 */

/* 解决: 使用 10px 基准 */
html {
  font-size: 62.5%; /* 16px × 62.5% = 10px */
}

body {
  font-size: 1.6rem; /* 16px */
}
```

### 最佳实践

```css
/* 1. 使用 62.5% 技巧 */
html {
  font-size: 62.5%; /* 10px */
}

body {
  font-size: 1.6rem; /* 16px */
}

/* 2. 混合使用 px 和 rem */
.box {
  width: 20rem; /* 使用 rem 实现响应式 */
  border: 1px solid black; /* 边框使用 px */
}

/* 3. 使用 CSS 变量 */
:root {
  --base-font-size: 16px;
  --spacing-unit: 0.5rem;
}

.box {
  padding: calc(var(--spacing-unit) * 2); /* 1rem */
}
```

## 总结

**核心概念**:

### 1. rem 定义

- 相对于根元素(`<html>`)字体大小
- 不受父元素影响
- 适合响应式设计

### 2. 转换方法

- 手动计算: `rem = px / 根字体大小`
- 使用 62.5% 技巧简化计算
- 使用 PostCSS 自动转换

### 3. 响应式方案

- 媒体查询调整根字体大小
- 使用 vw 动态计算
- JavaScript 动态设置

### 4. 最佳实践

- 混合使用 px 和 rem
- 边框等细节使用 px
- 布局和字体使用 rem

## 延伸阅读

- [MDN - rem](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/Building_blocks/Values_and_units)
- [CSS Tricks - Font Size Idea: px at the Root, rem for Components](https://css-tricks.com/rems-ems/)
- [PostCSS pxtorem](https://github.com/cuth/postcss-pxtorem)
- [移动端适配方案](https://github.com/amfe/article/issues/17)
