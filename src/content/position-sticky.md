---
title: 介绍一下 position sticky
category: CSS
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 CSS position: sticky 的工作原理,包括粘性定位的触发条件、使用场景、常见问题,以及与其他定位方式的区别。
tags:
  - CSS
  - 定位
  - position
  - sticky
estimatedTime: 20 分钟
keywords:
  - position sticky
  - 粘性定位
  - CSS定位
  - 吸顶效果
highlight: 掌握 CSS 原生的粘性定位,轻松实现吸顶吸底效果
order: 9
---

## 问题 1：什么是 position: sticky

`position: sticky` 是 CSS 的一种定位方式,它结合了 `relative` 和 `fixed` 的特性,元素在滚动到特定位置前表现为相对定位,滚动到特定位置后表现为固定定位。

**核心特点**:

- 在容器内滚动时,元素会"粘"在指定位置
- 不脱离文档流(不像 `fixed` 会脱离)
- 需要指定至少一个阈值(`top`、`bottom`、`left`、`right`)

```css
.sticky-header {
  position: sticky;
  top: 0; /* 距离顶部 0px 时开始粘性定位 */
  background: white;
  z-index: 10;
}
```

```html
<div class="container">
  <div class="sticky-header">我会粘在顶部</div>
  <div class="content">长内容...</div>
</div>
```

---

## 问题 2：sticky 的工作原理

### 触发条件

`sticky` 元素需要满足以下条件才能生效:

**1. 必须指定阈值**

```css
/* ✅ 正确: 指定了 top */
.sticky {
  position: sticky;
  top: 0;
}

/* ❌ 错误: 没有指定阈值 */
.sticky {
  position: sticky; /* 不会生效 */
}
```

**2. 父元素不能有 overflow: hidden/auto/scroll**

```css
/* ❌ 错误: 父元素有 overflow */
.parent {
  overflow: hidden; /* 会导致 sticky 失效 */
}

.sticky {
  position: sticky;
  top: 0;
}

/* ✅ 正确: 父元素没有 overflow */
.parent {
  /* 不设置 overflow,或使用 overflow: visible */
}
```

**3. 父元素必须有足够的高度**

```css
/* ❌ 错误: 父元素高度不够 */
.parent {
  height: 100px; /* 太小,sticky 无法滚动 */
}

/* ✅ 正确: 父元素有足够高度 */
.parent {
  height: 2000px; /* 或者内容自然撑开 */
}
```

**4. sticky 元素不能是唯一的子元素**

```html
<!-- ❌ 错误: sticky 是唯一子元素 -->
<div class="parent">
  <div class="sticky">我不会粘住</div>
</div>

<!-- ✅ 正确: 有其他内容 -->
<div class="parent">
  <div class="sticky">我会粘住</div>
  <div class="content">其他内容...</div>
</div>
```

### 工作流程

```css
.sticky {
  position: sticky;
  top: 20px;
}
```

**阶段 1: 相对定位**

- 元素在正常位置,表现为 `position: relative`
- 随页面滚动

**阶段 2: 固定定位**

- 当元素距离视口顶部 20px 时,开始"粘住"
- 表现为 `position: fixed`
- 但仍然受父元素限制

**阶段 3: 回到相对定位**

- 当父元素滚动到底部,元素跟随父元素离开视口
- 回到相对定位状态

---

## 问题 3：sticky 的常见使用场景

### 场景 1: 吸顶导航栏

```css
.navbar {
  position: sticky;
  top: 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
```

```html
<nav class="navbar">
  <ul>
    <li><a href="#home">首页</a></li>
    <li><a href="#about">关于</a></li>
  </ul>
</nav>

<main>
  <section id="home">内容...</section>
  <section id="about">内容...</section>
</main>
```

### 场景 2: 表格表头固定

```css
table {
  border-collapse: collapse;
}

thead th {
  position: sticky;
  top: 0;
  background: #f5f5f5;
  z-index: 10;
}

tbody {
  /* 表格内容 */
}
```

```html
<table>
  <thead>
    <tr>
      <th>姓名</th>
      <th>年龄</th>
      <th>城市</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>张三</td>
      <td>25</td>
      <td>北京</td>
    </tr>
    <!-- 更多行... -->
  </tbody>
</table>
```

### 场景 3: 侧边栏固定

```css
.sidebar {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.main-content {
  flex: 1;
}
```

```html
<div class="container" style="display: flex; gap: 20px;">
  <aside class="sidebar">
    <nav>
      <a href="#section1">章节 1</a>
      <a href="#section2">章节 2</a>
    </nav>
  </aside>

  <main class="main-content">
    <section id="section1">内容...</section>
    <section id="section2">内容...</section>
  </main>
</div>
```

### 场景 4: 多个 sticky 元素堆叠

```css
.section-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  z-index: 10;
}

/* 第一个 header 粘在 top: 0 */
/* 第二个 header 粘在第一个下面 */
/* 第三个 header 粘在第二个下面 */
```

```html
<div class="container">
  <div class="section">
    <h2 class="section-header">分类 A</h2>
    <div class="items">内容...</div>
  </div>

  <div class="section">
    <h2 class="section-header">分类 B</h2>
    <div class="items">内容...</div>
  </div>

  <div class="section">
    <h2 class="section-header">分类 C</h2>
    <div class="items">内容...</div>
  </div>
</div>
```

### 场景 5: 吸底效果

```css
.footer-actions {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}
```

```html
<div class="modal">
  <div class="modal-content">
    <p>很长的内容...</p>
  </div>

  <div class="footer-actions">
    <button>取消</button>
    <button>确定</button>
  </div>
</div>
```

---

## 问题 4：sticky 的常见问题和解决方案

### 问题 1: sticky 不生效

```css
/* 检查清单: */

/* 1. 是否指定了阈值? */
.sticky {
  position: sticky;
  top: 0; /* ✅ 必须指定 */
}

/* 2. 父元素是否有 overflow? */
.parent {
  /* ❌ overflow: hidden; */
  overflow: visible; /* ✅ 或不设置 */
}

/* 3. 父元素高度是否足够? */
.parent {
  min-height: 100vh; /* ✅ 确保有足够高度 */
}

/* 4. 是否有其他内容? */
/* ✅ sticky 元素不能是父元素的唯一子元素 */
```

### 问题 2: sticky 在 Safari 中不生效

```css
/* Safari 需要 -webkit- 前缀(旧版本) */
.sticky {
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
}
```

### 问题 3: sticky 元素被遮挡

```css
/* 使用 z-index 确保层级 */
.sticky {
  position: sticky;
  top: 0;
  z-index: 100; /* ✅ 提高层级 */
  background: white; /* ✅ 添加背景色 */
}
```

### 问题 4: sticky 在 flex 容器中不生效

```css
/* ❌ 问题代码 */
.flex-container {
  display: flex;
  flex-direction: column;
}

.sticky {
  position: sticky;
  top: 0;
  /* 可能不生效 */
}

/* ✅ 解决方案: 添加 align-self */
.sticky {
  position: sticky;
  top: 0;
  align-self: flex-start; /* 关键 */
}
```

### 问题 5: sticky 元素闪烁

```css
/* 添加 will-change 优化性能 */
.sticky {
  position: sticky;
  top: 0;
  will-change: transform; /* ✅ 启用 GPU 加速 */
}

/* 或使用 transform */
.sticky {
  position: sticky;
  top: 0;
  transform: translateZ(0); /* ✅ 强制硬件加速 */
}
```

---

## 问题 5：sticky 与其他定位方式的对比

| 特性           | static | relative | absolute     | fixed | sticky   |
| -------------- | ------ | -------- | ------------ | ----- | -------- |
| 是否脱离文档流 | 否     | 否       | 是           | 是    | 否       |
| 参照物         | -      | 自身     | 最近定位祖先 | 视口  | 滚动容器 |
| 是否随滚动     | 是     | 是       | 取决于参照物 | 否    | 条件性   |
| 是否占据空间   | 是     | 是       | 否           | 否    | 是       |

**代码对比**:

```css
/* 1. relative: 始终相对自身定位 */
.relative {
  position: relative;
  top: 10px; /* 相对原位置偏移 */
}

/* 2. fixed: 始终相对视口定位 */
.fixed {
  position: fixed;
  top: 0; /* 固定在视口顶部 */
}

/* 3. sticky: 条件性固定 */
.sticky {
  position: sticky;
  top: 0; /* 滚动到顶部时固定 */
}
```

**使用场景对比**:

```css
/* 导航栏: 使用 sticky */
.navbar {
  position: sticky;
  top: 0;
}

/* 模态框: 使用 fixed */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 工具提示: 使用 absolute */
.tooltip {
  position: absolute;
  top: 100%;
  left: 0;
}

/* 微调位置: 使用 relative */
.icon {
  position: relative;
  top: 2px; /* 微调对齐 */
}
```

## 总结

**核心概念总结**:

### 1. sticky 特点

- 结合 relative 和 fixed 的特性
- 不脱离文档流
- 需要指定阈值(`top`/`bottom`/`left`/`right`)
- 受父元素限制

### 2. 生效条件

- 必须指定阈值
- 父元素不能有 `overflow: hidden/auto/scroll`
- 父元素要有足够高度
- 不能是父元素的唯一子元素

### 3. 常见场景

- 吸顶导航栏
- 表格表头固定
- 侧边栏固定
- 分类标题堆叠
- 吸底操作栏

### 4. 注意事项

- Safari 需要 `-webkit-` 前缀
- 使用 `z-index` 控制层级
- 在 flex 容器中需要 `align-self: flex-start`
- 使用 `will-change` 优化性能

## 延伸阅读

- [MDN - position: sticky](https://developer.mozilla.org/zh-CN/docs/Web/CSS/position#sticky)
- [CSS Tricks - Position Sticky](https://css-tricks.com/position-sticky-2/)
- [Can I use - position: sticky](https://caniuse.com/css-sticky)
- [Google Developers - Sticky positioning](https://developers.google.com/web/updates/2012/08/Stick-your-landings-position-sticky-lands-in-WebKit)
