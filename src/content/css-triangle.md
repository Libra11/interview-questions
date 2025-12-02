---
title: CSS 绘制三角形
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解使用 CSS 绘制三角形的原理和方法,包括 border 方法、clip-path 方法,以及各种三角形的实现技巧。
tags:
  - CSS
  - 图形绘制
  - border
  - clip-path
estimatedTime: 18 分钟
keywords:
  - CSS三角形
  - border三角形
  - clip-path
  - 箭头
highlight: 掌握 CSS 绘制三角形的技巧,实现各种箭头和装饰效果
order: 18
---

## 问题 1：使用 border 绘制三角形的原理

### 原理

当元素的宽高为 0 时,border 会形成四个三角形。

```css
.box {
  width: 0;
  height: 0;
  border: 50px solid;
  border-color: red green blue yellow;
}

/* 显示为四个三角形:
 *     红(上)
 * 黄(左) 蓝(右)
 *     绿(下)
 */
```

**关键点**:

- 元素宽高为 0
- 设置 border 宽度
- 通过设置不同边的颜色,隐藏不需要的边

---

## 问题 2：绘制各个方向的三角形

### 向上的三角形

```css
.triangle-up {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 50px solid red;
}
```

### 向下的三角形

```css
.triangle-down {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-top: 50px solid red;
}
```

### 向左的三角形

```css
.triangle-left {
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-right: 50px solid red;
}
```

### 向右的三角形

```css
.triangle-right {
  width: 0;
  height: 0;
  border-top: 50px solid transparent;
  border-bottom: 50px solid transparent;
  border-left: 50px solid red;
}
```

---

## 问题 3：绘制不同形状的三角形

### 等腰三角形

```css
.isosceles {
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 80px solid red;
}
```

### 直角三角形

```css
/* 左上直角 */
.right-angle-top-left {
  width: 0;
  height: 0;
  border-top: 100px solid red;
  border-right: 100px solid transparent;
}

/* 右上直角 */
.right-angle-top-right {
  width: 0;
  height: 0;
  border-top: 100px solid red;
  border-left: 100px solid transparent;
}

/* 左下直角 */
.right-angle-bottom-left {
  width: 0;
  height: 0;
  border-bottom: 100px solid red;
  border-right: 100px solid transparent;
}

/* 右下直角 */
.right-angle-bottom-right {
  width: 0;
  height: 0;
  border-bottom: 100px solid red;
  border-left: 100px solid transparent;
}
```

### 锐角三角形

```css
.acute {
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 100px solid red;
}
```

### 钝角三角形

```css
.obtuse {
  width: 0;
  height: 0;
  border-left: 80px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 50px solid red;
}
```

---

## 问题 4：实际应用场景

### 场景 1: 工具提示箭头

```css
.tooltip {
  position: relative;
  background: black;
  color: white;
  padding: 10px;
  border-radius: 4px;
}

/* 向下的箭头 */
.tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid black;
}
```

### 场景 2: 面包屑导航

```css
.breadcrumb-item {
  position: relative;
  background: #3498db;
  color: white;
  padding: 10px 30px 10px 20px;
  margin-right: 15px;
}

/* 右侧箭头 */
.breadcrumb-item::after {
  content: "";
  position: absolute;
  right: -15px;
  top: 0;
  border-top: 20px solid transparent;
  border-bottom: 20px solid transparent;
  border-left: 15px solid #3498db;
}
```

### 场景 3: 下拉菜单指示器

```css
.dropdown-toggle::after {
  content: "";
  display: inline-block;
  margin-left: 5px;
  vertical-align: middle;
  border-top: 5px solid;
  border-right: 5px solid transparent;
  border-left: 5px solid transparent;
}

/* 展开时旋转 */
.dropdown-toggle.active::after {
  transform: rotate(180deg);
}
```

### 场景 4: 对话气泡

```css
.bubble {
  position: relative;
  background: #f0f0f0;
  padding: 15px;
  border-radius: 8px;
}

/* 左侧尖角 */
.bubble::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 20px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid #f0f0f0;
}
```

### 场景 5: 标签页

```css
.tab {
  position: relative;
  background: white;
  padding: 10px 20px;
  border-top: 2px solid #3498db;
}

/* 底部三角形遮罩 */
.tab::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid white;
}
```

---

## 问题 5：使用 clip-path 绘制三角形

### 基本用法

```css
.triangle {
  width: 100px;
  height: 100px;
  background: red;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}
```

### 各个方向的三角形

```css
/* 向上 */
.triangle-up {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

/* 向下 */
.triangle-down {
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%);
}

/* 向左 */
.triangle-left {
  clip-path: polygon(100% 0%, 100% 100%, 0% 50%);
}

/* 向右 */
.triangle-right {
  clip-path: polygon(0% 0%, 100% 50%, 0% 100%);
}
```

### 优点

```css
/* 1. 可以设置背景图片 */
.triangle {
  background: url("pattern.png");
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

/* 2. 可以添加阴影 */
.triangle {
  background: red;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

/* 3. 可以动画 */
.triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  transition: clip-path 0.3s;
}

.triangle:hover {
  clip-path: polygon(50% 20%, 20% 80%, 80% 80%);
}
```

---

## 问题 6：border 方法 vs clip-path 方法

| 特性         | border 方法 | clip-path 方法 |
| ------------ | ----------- | -------------- |
| 浏览器兼容性 | 所有浏览器  | IE 不支持      |
| 代码复杂度   | 简单        | 简单           |
| 背景支持     | 不支持      | 支持           |
| 阴影支持     | 不支持      | 支持(filter)   |
| 动画支持     | 困难        | 容易           |
| 灵活性       | 有限        | 很高           |

### 选择建议

```css
/* 简单的箭头、提示框 → 使用 border */
.tooltip::after {
  content: "";
  border-top: 10px solid black;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
}

/* 需要背景、阴影、动画 → 使用 clip-path */
.triangle {
  background: linear-gradient(45deg, red, blue);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}
```

## 总结

**核心概念**:

### 1. border 方法原理

- 元素宽高为 0
- 设置 border 宽度
- 隐藏不需要的边(transparent)

### 2. 常见三角形

- 向上: `border-bottom` + 左右 transparent
- 向下: `border-top` + 左右 transparent
- 向左: `border-right` + 上下 transparent
- 向右: `border-left` + 上下 transparent

### 3. clip-path 方法

- 使用 `polygon()` 定义形状
- 支持背景和阴影
- 更灵活,但兼容性稍差

### 4. 应用场景

- 工具提示箭头
- 面包屑导航
- 下拉菜单指示器
- 对话气泡
- 标签页装饰

## 延伸阅读

- [MDN - border](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border)
- [MDN - clip-path](https://developer.mozilla.org/zh-CN/docs/Web/CSS/clip-path)
- [CSS Tricks - The Shapes of CSS](https://css-tricks.com/the-shapes-of-css/)
- [Clippy - CSS clip-path maker](https://bennettfeely.com/clippy/)
