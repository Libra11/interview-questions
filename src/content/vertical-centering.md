---
title: 垂直居中的方案有哪些
category: CSS
difficulty: 入门
updatedAt: 2024-12-02
summary: >-
  全面掌握 CSS 垂直居中的多种实现方法，包括 line-height、Flexbox、Grid、绝对定位等方案，理解不同场景下的最佳实践。
tags:
  - CSS
  - 居中
  - 布局
  - Flexbox
estimatedTime: 20 分钟
keywords:
  - 垂直居中
  - CSS 居中
  - Flexbox
  - align-items
  - vertical-align
highlight: 垂直居中比水平居中更复杂，掌握多种方案能够应对不同的布局需求
order: 348
---

## 问题 1：单行文本如何垂直居中？

### 使用 line-height

最简单的方法是将 `line-height` 设置为容器的高度。

```css
.container {
  height: 100px;
  line-height: 100px; /* 与高度相同 */
}
```

```html
<div class="container">单行文本垂直居中</div>
```

### 原理

行高（line-height）决定了行内元素的垂直空间，当行高等于容器高度时，文本会自然居中。

### 注意事项

**只适用于单行文本**

```css
/* ✅ 单行文本 */
.single-line {
  height: 50px;
  line-height: 50px;
}

/* ❌ 多行文本会出现问题 */
.multi-line {
  height: 100px;
  line-height: 100px; /* 多行文本会重叠 */
}
```

**移除默认 padding**

某些元素可能有默认 padding，需要移除：

```css
.container {
  height: 100px;
  line-height: 100px;
  padding: 0; /* 移除默认 padding */
}
```

---

## 问题 2：使用 Flexbox 实现垂直居中

### 基本用法

Flexbox 是最推荐的垂直居中方案。

```css
.parent {
  display: flex;
  align-items: center; /* 垂直居中 */
}
```

```html
<div class="parent" style="height: 200px;">
  <div class="child">垂直居中的内容</div>
</div>
```

### 同时实现水平垂直居中

```css
.parent {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
```

### 优点

- 适用于任何类型的元素
- 不需要知道元素高度
- 可以同时居中多个元素
- 代码简洁直观

```html
<div style="display: flex; align-items: center; height: 300px;">
  <div>元素 1</div>
  <div>元素 2</div>
  <div>元素 3</div>
  <!-- 所有元素都会垂直居中 -->
</div>
```

### 单个子元素自身居中

```css
.parent {
  display: flex;
  height: 200px;
}

.child {
  margin: auto 0; /* 垂直居中 */
  /* 或 align-self: center; */
}
```

---

## 问题 3：使用绝对定位实现垂直居中

### 方法 1：top + transform

不需要知道元素高度的方案。

```css
.parent {
  position: relative;
  height: 300px;
}

.child {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```

### 原理

1. `top: 50%` 将元素顶部移动到父元素中心
2. `translateY(-50%)` 将元素向上移动自身高度的一半

```html
<div class="parent">
  <div class="child">垂直居中</div>
</div>
```

### 水平垂直都居中

```css
.parent {
  position: relative;
}

.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

### 方法 2：top + bottom + margin

需要知道元素高度。

```css
.parent {
  position: relative;
  height: 300px;
}

.child {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100px;
  margin: auto 0;
}
```

### 方法 3：top + 负 margin

```css
.parent {
  position: relative;
  height: 300px;
}

.child {
  position: absolute;
  top: 50%;
  height: 100px;
  margin-top: -50px; /* 高度的一半 */
}
```

**缺点**：需要知道元素的确切高度。

---

## 问题 4：使用 Grid 实现垂直居中

### 基本用法

```css
.parent {
  display: grid;
  align-items: center; /* 垂直居中 */
  height: 300px;
}
```

```html
<div class="parent">
  <div class="child">垂直居中</div>
</div>
```

### 使用 place-items

同时实现水平垂直居中：

```css
.parent {
  display: grid;
  place-items: center; /* 水平垂直都居中 */
  height: 300px;
}
```

### 单个元素自身居中

```css
.parent {
  display: grid;
  height: 300px;
}

.child {
  align-self: center; /* 自身垂直居中 */
}
```

---

## 问题 5：使用 table-cell 实现垂直居中

### 基本用法

利用 table-cell 的 `vertical-align` 属性。

```css
.parent {
  display: table-cell;
  vertical-align: middle;
  height: 300px;
}
```

```html
<div class="parent">
  <div class="child">垂直居中</div>
</div>
```

### 优点

- 兼容性好（支持 IE8+）
- 不需要知道元素高度

### 缺点

- 需要改变 display 属性
- 不够灵活
- 现代布局不推荐使用

---

## 问题 6：不同方案的对比和选择

### 方案对比表

| 方案                     | 适用场景 | 是否需要高度 | 兼容性      | 推荐度     |
| ------------------------ | -------- | ------------ | ----------- | ---------- |
| **line-height**          | 单行文本 | 是           | 极好        | ⭐⭐⭐⭐   |
| **Flexbox**              | 任何元素 | 否           | 好（IE10+） | ⭐⭐⭐⭐⭐ |
| **Grid**                 | 任何元素 | 否           | 好（IE11+） | ⭐⭐⭐⭐   |
| **绝对定位 + transform** | 任何元素 | 否           | 好（IE9+）  | ⭐⭐⭐⭐   |
| **绝对定位 + margin**    | 任何元素 | 是           | 极好        | ⭐⭐⭐     |
| **table-cell**           | 任何元素 | 否           | 极好        | ⭐⭐       |

### 推荐方案

**1. 单行文本**

```css
.container {
  height: 100px;
  line-height: 100px;
}
```

**2. 现代布局（推荐）**

```css
/* Flexbox */
.parent {
  display: flex;
  align-items: center;
}

/* 或 Grid */
.parent {
  display: grid;
  place-items: center;
}
```

**3. 高度不固定的元素**

```css
/* 方案 A：Flexbox */
.parent {
  display: flex;
  align-items: center;
}

/* 方案 B：绝对定位 + transform */
.parent {
  position: relative;
}
.child {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
```

**4. 需要兼容老浏览器**

```css
/* table-cell 方案 */
.parent {
  display: table-cell;
  vertical-align: middle;
}
```

### 实际应用示例

**场景 1：按钮文字居中**

```html
<button class="btn">点击我</button>

<style>
  .btn {
    height: 40px;
    line-height: 40px; /* 单行文本 */
    padding: 0 20px;
  }
</style>
```

**场景 2：卡片内容居中**

```html
<div class="card">
  <div class="card-content">
    <h3>标题</h3>
    <p>描述文字</p>
  </div>
</div>

<style>
  .card {
    display: flex;
    align-items: center; /* Flexbox 居中 */
    height: 200px;
    padding: 20px;
  }
</style>
```

**场景 3：全屏居中**

```html
<div class="hero">
  <div class="hero-content">
    <h1>欢迎</h1>
    <p>这是一个全屏居中的内容</p>
  </div>
</div>

<style>
  .hero {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
</style>
```

**场景 4：模态框居中**

```html
<div class="modal-overlay">
  <div class="modal">
    <h2>标题</h2>
    <p>内容</p>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center; /* 水平垂直都居中 */
    background: rgba(0, 0, 0, 0.5);
  }

  .modal {
    width: 500px;
    max-width: 90%;
    background: white;
    padding: 20px;
  }
</style>
```

**场景 5：图标和文字垂直对齐**

```html
<div class="item">
  <img src="icon.svg" class="icon" />
  <span>文字内容</span>
</div>

<style>
  .item {
    display: flex;
    align-items: center; /* 图标和文字垂直居中 */
    gap: 8px;
  }

  .icon {
    width: 20px;
    height: 20px;
  }
</style>
```

### 常见问题和解决方案

**问题 1：Flexbox 居中后元素被裁剪**

```css
/* ❌ 可能被裁剪 */
.parent {
  display: flex;
  align-items: center;
  height: 200px;
}

.child {
  height: 300px; /* 超出父元素 */
}

/* ✅ 解决方案 */
.parent {
  display: flex;
  align-items: center;
  min-height: 200px; /* 使用 min-height */
}
```

**问题 2：transform 导致模糊**

```css
/* 可能导致文字模糊 */
.child {
  transform: translateY(-50%);
}

/* 解决方案：添加 will-change */
.child {
  transform: translateY(-50%);
  will-change: transform;
}
```

**问题 3：多行文本居中**

```css
/* ❌ line-height 不适用 */
.multi-line {
  height: 100px;
  line-height: 100px; /* 多行会重叠 */
}

/* ✅ 使用 Flexbox */
.multi-line {
  display: flex;
  align-items: center;
  height: 100px;
}
```

---

## 总结

**核心概念总结**：

### 1. 根据场景选择

- **单行文本**：`line-height`
- **任何元素**：Flexbox 或 Grid
- **绝对定位场景**：`top: 50%` + `transform`

### 2. 现代推荐方案

- **首选**：Flexbox（`align-items: center`）
- **备选**：Grid（`place-items: center`）
- **简单**：`line-height`（单行文本）

### 3. 关键要点

- Flexbox 最灵活，适用于大多数场景
- line-height 只适用于单行文本
- transform 方案不需要知道元素高度
- 避免使用 table-cell（过时）

### 4. 实践建议

- 优先使用 Flexbox，代码简洁且强大
- 单行文本用 line-height 最简单
- 需要精确控制时使用绝对定位
- 考虑响应式和不同内容高度的情况

## 延伸阅读

- [MDN - Flexbox](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [MDN - align-items](https://developer.mozilla.org/zh-CN/docs/Web/CSS/align-items)
- [CSS 垂直居中完全指南](https://css-tricks.com/centering-css-complete-guide/)
- [Flexbox 布局教程](https://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)
