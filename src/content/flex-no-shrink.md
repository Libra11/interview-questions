---
title: flex 布局中子元素不压缩该如何设置属性
category: CSS
difficulty: 入门
updatedAt: 2025-12-01
summary: >-
  理解 flex 布局中子元素的收缩行为,掌握 flex-shrink 属性的使用,以及如何防止子元素被压缩。
tags:
  - CSS
  - Flex
  - 布局
  - flex-shrink
estimatedTime: 15 分钟
keywords:
  - flex-shrink
  - flex布局
  - 不压缩
  - 弹性布局
highlight: 掌握 flex-shrink 属性,控制子元素的收缩行为
order: 61
---

## 问题 1：如何让 flex 子元素不压缩

**答案**: 设置 `flex-shrink: 0`

```css
.flex-item {
  flex-shrink: 0; /* 不允许压缩 */
}
```

```html
<div class="container" style="display: flex; width: 300px;">
  <div class="item" style="flex-shrink: 0; width: 200px;">
    不会被压缩,保持 200px
  </div>
  <div class="item" style="width: 200px;">会被压缩</div>
</div>
```

---

## 问题 2：flex-shrink 的工作原理

`flex-shrink` 定义了 flex 子元素的收缩比例,默认值为 `1`。

### 基本用法

```css
.item {
  flex-shrink: 0; /* 不收缩 */
  flex-shrink: 1; /* 默认值,可以收缩 */
  flex-shrink: 2; /* 收缩比例是 1 的两倍 */
}
```

### 计算示例

```html
<div class="container" style="display: flex; width: 400px;">
  <div class="item-1" style="width: 200px; flex-shrink: 1;">A</div>
  <div class="item-2" style="width: 200px; flex-shrink: 2;">B</div>
  <div class="item-3" style="width: 200px; flex-shrink: 0;">C</div>
</div>
```

**计算过程**:

- 总宽度: 200 + 200 + 200 = 600px
- 容器宽度: 400px
- 溢出: 600 - 400 = 200px

**收缩分配**:

- item-3: 不收缩 (`flex-shrink: 0`)
- item-1 和 item-2 按比例收缩
- item-1 收缩: 200 × (1 / (1+2)) = 66.67px
- item-2 收缩: 200 × (2 / (1+2)) = 133.33px

**最终宽度**:

- item-1: 200 - 66.67 = 133.33px
- item-2: 200 - 133.33 = 66.67px
- item-3: 200px (不变)

---

## 问题 3：flex 简写属性

`flex` 是 `flex-grow`、`flex-shrink` 和 `flex-basis` 的简写。

```css
.item {
  /* flex: <flex-grow> <flex-shrink> <flex-basis> */
  flex: 0 0 auto; /* 不放大,不缩小,基于内容 */
  flex: 1 1 auto; /* 默认值 */
  flex: 1; /* 等价于 flex: 1 1 0% */
  flex: none; /* 等价于 flex: 0 0 auto */
}
```

### 常用简写

```css
/* 1. 固定宽度,不压缩 */
.item {
  flex: 0 0 200px;
  /* flex-grow: 0 (不放大) */
  /* flex-shrink: 0 (不缩小) */
  /* flex-basis: 200px (基础宽度) */
}

/* 2. 自适应,可压缩 */
.item {
  flex: 1;
  /* flex-grow: 1 (可放大) */
  /* flex-shrink: 1 (可缩小) */
  /* flex-basis: 0% (基于分配空间) */
}

/* 3. 基于内容,不压缩 */
.item {
  flex: none;
  /* flex-grow: 0 */
  /* flex-shrink: 0 */
  /* flex-basis: auto */
}
```

---

## 问题 4：常见使用场景

### 场景 1: 固定侧边栏

```css
.container {
  display: flex;
}

.sidebar {
  flex: 0 0 250px; /* 固定 250px,不压缩 */
  background: #f5f5f5;
}

.main {
  flex: 1; /* 占据剩余空间 */
}
```

### 场景 2: 按钮组

```css
.button-group {
  display: flex;
  gap: 10px;
}

.button {
  flex: 0 0 auto; /* 基于内容,不压缩 */
  padding: 8px 16px;
  white-space: nowrap; /* 文字不换行 */
}
```

### 场景 3: 图片不压缩

```css
.card {
  display: flex;
  gap: 15px;
}

.card-image {
  flex: 0 0 100px; /* 固定 100px,不压缩 */
  height: 100px;
}

.card-content {
  flex: 1; /* 占据剩余空间 */
}
```

---

## 问题 5：防止压缩的其他方法

### 方法 1: 使用 min-width

```css
.item {
  min-width: 200px; /* 最小宽度 200px */
}
```

### 方法 2: 使用 width + flex-shrink

```css
.item {
  width: 200px;
  flex-shrink: 0; /* 推荐 */
}
```

### 方法 3: 使用 flex-basis

```css
.item {
  flex-basis: 200px;
  flex-shrink: 0;
}
```

### 对比

```css
/* ✅ 推荐: 明确不压缩 */
.item {
  flex: 0 0 200px;
}

/* ✅ 也可以: 分开设置 */
.item {
  width: 200px;
  flex-shrink: 0;
}

/* ⚠️ 不够明确 */
.item {
  min-width: 200px; /* 可能还是会压缩 */
}
```

## 总结

**核心概念**:

### 1. 防止压缩的方法

- `flex-shrink: 0`
- `flex: 0 0 <width>`
- `flex: none`

### 2. flex-shrink 值

- `0`: 不收缩
- `1`: 默认值,可收缩
- `>1`: 收缩比例更大

### 3. 常用简写

- `flex: 0 0 200px`: 固定宽度
- `flex: 1`: 自适应
- `flex: none`: 基于内容

## 延伸阅读

- [MDN - flex-shrink](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex-shrink)
- [MDN - flex](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex)
- [CSS Tricks - A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
