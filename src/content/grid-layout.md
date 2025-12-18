---
title: 关于 Grid 布局你需要知道什么？
category: CSS
difficulty: 中级
updatedAt: 2025-11-17
summary: >-
  深入理解 CSS Grid 布局模型，掌握网格容器和网格项的各种属性，学习如何使用 Grid 实现复杂的二维布局，包括网格系统、响应式布局等。
tags:
  - Grid布局
  - CSS Grid
  - CSS布局
  - 响应式布局
estimatedTime: 28 分钟
keywords:
  - Grid
  - CSS Grid
  - 网格布局
  - grid-template
  - grid-area
highlight: Grid 布局是二维布局模型，可以同时控制行和列，是实现复杂布局的最佳选择
order: 406
---

## 问题 1：什么是 Grid 布局？

Grid 布局（CSS Grid Layout）是一种**二维布局模型**，可以同时控制行和列。

### 基本概念

```css
/* 启用 Grid 布局 */
.container {
  display: grid; /* 或 inline-grid */
}

/* 基本术语：
 * - 网格容器（Grid Container）：设置了 display: grid 的元素
 * - 网格项（Grid Item）：容器的直接子元素
 * - 网格线（Grid Line）：构成网格结构的分界线
 * - 网格轨道（Grid Track）：两条相邻网格线之间的空间（行或列）
 * - 网格单元格（Grid Cell）：最小的网格单位
 * - 网格区域（Grid Area）：由多个单元格组成的矩形区域
 */

/* 示例 */
.container {
  display: grid;
  grid-template-columns: 200px 200px 200px; /* 3 列 */
  grid-template-rows: 100px 100px; /* 2 行 */
  gap: 10px; /* 间距 */
}
```

### Grid vs Flex

```css
/* Flex：一维布局 */
.flex-container {
  display: flex;
  /* 只能控制一个方向 */
}

/* Grid：二维布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  /* 同时控制行和列 */
}

/* Grid 的优势：
 * 1. 二维布局能力
 * 2. 精确控制行列
 * 3. 更适合复杂布局
 * 4. 支持网格区域命名
 * 5. 自动填充和对齐
 */
```

---

## 问题 2：Grid 容器有哪些属性？

Grid 容器有**多个属性**控制网格的结构和对齐。

### grid-template-columns/rows（定义网格）

```css
/* grid-template-columns: 定义列 */
.container {
  display: grid;
  grid-template-columns: 200px 200px 200px; /* 3 列，每列 200px */
}

/* 使用 fr 单位（fraction，份数） */
.fr-example {
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1 的比例 */
}

/* 使用 repeat() */
.repeat-example {
  grid-template-columns: repeat(3, 200px); /* 3 列，每列 200px */
  grid-template-columns: repeat(3, 1fr); /* 3 列，等分 */
}

/* 混合使用 */
.mixed {
  grid-template-columns: 200px 1fr 200px; /* 固定-自适应-固定 */
}

/* auto-fill 和 auto-fit */
.auto-fill {
  grid-template-columns: repeat(auto-fill, 200px);
  /* 自动填充，尽可能多的列 */
}

.auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /* 自动适应，列会拉伸填充空间 */
}

/* minmax() 函数 */
.minmax-example {
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  /* 最小 200px，最大 1fr */
}

/* grid-template-rows: 定义行 */
.rows {
  grid-template-rows: 100px auto 100px; /* 固定-自适应-固定 */
}
```

### gap（间距）

```css
/* gap: 设置网格间距 */
.container {
  display: grid;
  gap: 20px; /* 行列间距都是 20px */
}

/* 分别设置 */
.separate {
  row-gap: 20px; /* 行间距 */
  column-gap: 30px; /* 列间距 */
  /* 或使用简写 */
  gap: 20px 30px; /* 行间距 列间距 */
}

/* 旧语法（兼容性） */
.old-syntax {
  grid-row-gap: 20px;
  grid-column-gap: 30px;
  grid-gap: 20px 30px;
}
```

### grid-template-areas（区域命名）

```css
/* grid-template-areas: 定义网格区域 */
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 80px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

/* 使用命名区域 */
.header {
  grid-area: header;
}

.sidebar {
  grid-area: sidebar;
}

.main {
  grid-area: main;
}

.aside {
  grid-area: aside;
}

.footer {
  grid-area: footer;
}

/* 使用 . 表示空单元格 */
.with-empty {
  grid-template-areas:
    "header header header"
    "sidebar main ."
    "footer footer footer";
}
```

### justify-items/align-items（项目对齐）

```css
/* justify-items: 水平对齐 */
.container {
  display: grid;
  justify-items: start; /* 起点对齐 */
}

/* 可选值 */
.start {
  justify-items: start; /* 起点 */
}

.end {
  justify-items: end; /* 终点 */
}

.center {
  justify-items: center; /* 居中 */
}

.stretch {
  justify-items: stretch; /* 拉伸（默认） */
}

/* align-items: 垂直对齐 */
.container {
  align-items: center; /* 垂直居中 */
}

/* place-items: 简写 */
.container {
  place-items: center center; /* 水平垂直居中 */
  /* 等同于 */
  /* align-items: center; */
  /* justify-items: center; */
}
```

### justify-content/align-content（内容对齐）

```css
/* justify-content: 整个网格在容器中的水平对齐 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 200px);
  width: 800px; /* 容器宽度大于网格宽度 */
  justify-content: center; /* 网格居中 */
}

/* 可选值 */
.start {
  justify-content: start;
}

.end {
  justify-content: end;
}

.center {
  justify-content: center;
}

.space-between {
  justify-content: space-between;
}

.space-around {
  justify-content: space-around;
}

.space-evenly {
  justify-content: space-evenly;
}

/* align-content: 垂直对齐 */
.container {
  height: 600px;
  align-content: center;
}

/* place-content: 简写 */
.container {
  place-content: center center;
}
```

---

## 问题 3：Grid 项目有哪些属性？

Grid 项目有**多个属性**控制自身的位置和大小。

### grid-column/grid-row（位置）

```css
/* grid-column: 指定列的起止位置 */
.item {
  grid-column: 1 / 3; /* 从第 1 条线到第 3 条线（占 2 列） */
}

/* 使用 span */
.item {
  grid-column: 1 / span 2; /* 从第 1 列开始，跨越 2 列 */
  /* 或 */
  grid-column: span 2; /* 跨越 2 列（自动定位） */
}

/* 分别设置 */
.item {
  grid-column-start: 1;
  grid-column-end: 3;
}

/* grid-row: 指定行的起止位置 */
.item {
  grid-row: 1 / 3; /* 从第 1 行到第 3 行（占 2 行） */
}

/* 实际应用：跨行跨列 */
.large-item {
  grid-column: 1 / 3; /* 跨 2 列 */
  grid-row: 1 / 3; /* 跨 2 行 */
}
```

### grid-area（区域）

```css
/* grid-area: 指定项目所在的区域 */
.item {
  grid-area: header; /* 使用命名区域 */
}

/* 或使用行列编号 */
.item {
  grid-area: 1 / 1 / 3 / 3;
  /* 等同于 */
  /* grid-row-start: 1; */
  /* grid-column-start: 1; */
  /* grid-row-end: 3; */
  /* grid-column-end: 3; */
}
```

### justify-self/align-self（单独对齐）

```css
/* justify-self: 单个项目的水平对齐 */
.item {
  justify-self: center; /* 水平居中 */
}

/* align-self: 单个项目的垂直对齐 */
.item {
  align-self: end; /* 底部对齐 */
}

/* place-self: 简写 */
.item {
  place-self: center center; /* 水平垂直居中 */
}
```

---

## 问题 4：如何实现常见的 Grid 布局？

使用 Grid 实现各种**常见布局场景**。

### 基础网格布局

```css
/* 等分网格 */
.grid-equal {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 列等分 */
  gap: 20px;
}

/* 固定列宽网格 */
.grid-fixed {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 20px;
}

/* 响应式网格 */
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  /* 自动适应容器宽度，每列最小 250px */
}
```

### 圣杯布局

```css
/* 经典圣杯布局 */
.page {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 80px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
  gap: 10px;
}

.header {
  grid-area: header;
}

.sidebar {
  grid-area: sidebar;
}

.main {
  grid-area: main;
}

.aside {
  grid-area: aside;
}

.footer {
  grid-area: footer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "aside"
      "footer";
  }
}
```

### 卡片网格

```css
/* 自适应卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 不规则卡片布局 */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 20px; /* 设置小的行高 */
  gap: 20px;
}

.card-small {
  grid-row: span 10; /* 跨 10 行 */
}

.card-medium {
  grid-row: span 15; /* 跨 15 行 */
}

.card-large {
  grid-row: span 20; /* 跨 20 行 */
}
```

### 仪表盘布局

```css
/* 仪表盘布局 */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 20px;
}

.widget-large {
  grid-column: span 2;
  grid-row: span 2;
}

.widget-wide {
  grid-column: span 2;
}

.widget-tall {
  grid-row: span 2;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .dashboard {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .widget-large,
  .widget-wide,
  .widget-tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}
```

### 图片墙

```css
/* 图片墙布局 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-auto-rows: 200px;
  gap: 10px;
}

.photo-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 特殊尺寸 */
.photo-large {
  grid-column: span 2;
  grid-row: span 2;
}

.photo-wide {
  grid-column: span 2;
}

.photo-tall {
  grid-row: span 2;
}
```

### 表单布局

```css
/* 表单网格布局 */
.form-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 15px 20px;
  align-items: center;
}

.form-label {
  text-align: right;
}

.form-input {
  /* 自动占据第二列 */
}

.form-full {
  grid-column: 1 / -1; /* 占满整行 */
}

/* 复杂表单 */
.complex-form {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

.field-full {
  grid-column: span 6;
}

.field-half {
  grid-column: span 3;
}

.field-third {
  grid-column: span 2;
}
```

---

## 问题 5：Grid 的高级特性有哪些？

了解 Grid 的**高级功能**。

### 隐式网格

```css
/* 显式网格：明确定义的网格 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 100px 100px;
}

/* 隐式网格：自动创建的网格 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 没有定义 rows，会自动创建 */
  grid-auto-rows: 150px; /* 隐式行的高度 */
}

/* grid-auto-flow: 控制自动放置 */
.row-flow {
  grid-auto-flow: row; /* 按行填充（默认） */
}

.column-flow {
  grid-auto-flow: column; /* 按列填充 */
}

.dense {
  grid-auto-flow: dense; /* 紧密填充，填补空隙 */
}
```

### 网格线命名

```css
/* 命名网格线 */
.container {
  display: grid;
  grid-template-columns: [start] 200px [content-start] 1fr [content-end] 200px [end];
  grid-template-rows: [header-start] 60px [header-end main-start] 1fr [main-end footer-start] 80px [footer-end];
}

/* 使用命名线 */
.header {
  grid-column: start / end;
  grid-row: header-start / header-end;
}

.main {
  grid-column: content-start / content-end;
  grid-row: main-start / main-end;
}
```

### 子网格（Subgrid）

```css
/* 子网格：继承父网格的轨道 */
.parent {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.child {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid; /* 继承父网格的列 */
  gap: 10px;
}

/* 注意：subgrid 浏览器支持有限 */
```

### 网格对齐

```css
/* 整体对齐 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 200px);
  width: 800px;
  height: 600px;
  
  /* 水平对齐 */
  justify-content: center;
  
  /* 垂直对齐 */
  align-content: center;
  
  /* 简写 */
  place-content: center center;
}

/* 项目对齐 */
.container {
  /* 所有项目的对齐方式 */
  justify-items: stretch;
  align-items: stretch;
  place-items: stretch stretch;
}

.item {
  /* 单个项目的对齐方式 */
  justify-self: center;
  align-self: center;
  place-self: center center;
}
```

---

## 问题 6：Grid 布局的注意事项有哪些？

了解 Grid 布局的**常见问题和最佳实践**。

### 常见问题

```css
/* 1. 网格溢出 */
/* 问题：内容超出网格 */
.container {
  grid-template-columns: repeat(3, 200px);
  /* 容器宽度小于 600px 时会溢出 */
}

/* 解决：使用 minmax */
.container {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  /* 或使用 auto-fit */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* 2. 网格项重叠 */
/* 问题：手动定位导致重叠 */
.item-1 {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
}

.item-2 {
  grid-column: 2 / 4;
  grid-row: 1 / 2;
  /* 与 item-1 重叠 */
}

/* 解决：使用 z-index */
.item-2 {
  z-index: 1;
}

/* 3. 间距计算 */
/* 问题：使用百分比时间距计算复杂 */
.container {
  grid-template-columns: repeat(3, 33.333%);
  gap: 20px;
  /* 总宽度会超过 100% */
}

/* 解决：使用 fr 单位 */
.container {
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* 4. 最小内容尺寸 */
/* 问题：网格项不会缩小到内容以下 */
.item {
  min-width: auto; /* 默认值 */
  /* 可能导致溢出 */
}

/* 解决：设置 min-width */
.item {
  min-width: 0;
  overflow: hidden;
}
```

### 浏览器兼容性

```css
/* IE 11 支持旧版 Grid 语法 */
.container {
  display: -ms-grid; /* IE 10-11 */
  -ms-grid-columns: 1fr 1fr 1fr;
  -ms-grid-rows: auto;
}

/* 使用 @supports 检测 */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

/* 使用 autoprefixer 自动处理 */
```

### 最佳实践

```css
/* 1. 使用 fr 单位而非百分比 */
/* ❌ 不推荐 */
.container {
  grid-template-columns: 25% 50% 25%;
}

/* ✅ 推荐 */
.container {
  grid-template-columns: 1fr 2fr 1fr;
}

/* 2. 使用 gap 而非 margin */
/* ❌ 不推荐 */
.item {
  margin: 10px;
}

/* ✅ 推荐 */
.container {
  gap: 20px;
}

/* 3. 使用命名区域提高可读性 */
/* ✅ 推荐 */
.container {
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

/* 4. 使用 minmax 实现响应式 */
.container {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* 5. 合理使用隐式网格 */
.container {
  grid-auto-rows: minmax(100px, auto);
  grid-auto-flow: dense;
}
```

---

## 问题 7：Grid 与 Flex 如何选择？

了解 **Grid 和 Flex 的使用场景**。

### 使用场景对比

```css
/* Flex：一维布局 */
/* 适用场景：
 * 1. 导航栏
 * 2. 按钮组
 * 3. 表单项（标签+输入框）
 * 4. 卡片内部布局
 * 5. 工具栏
 */

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Grid：二维布局 */
/* 适用场景：
 * 1. 页面整体布局
 * 2. 复杂网格系统
 * 3. 图片墙/相册
 * 4. 仪表盘
 * 5. 表格布局
 */

.page-layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
```

### 结合使用

```css
/* Grid 用于整体布局 */
.page {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr 80px;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}

/* Flex 用于组件内部 */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

---

## 总结

**Grid 布局的核心要点**：

### 1. 基本概念
- 二维布局模型
- 网格容器和网格项
- 网格线、轨道、单元格、区域

### 2. 容器属性
- **grid-template-columns/rows**：定义网格
- **gap**：设置间距
- **grid-template-areas**：命名区域
- **justify/align-content**：内容对齐
- **justify/align-items**：项目对齐

### 3. 项目属性
- **grid-column/row**：指定位置
- **grid-area**：指定区域
- **justify/align-self**：单独对齐

### 4. 常见布局
- 基础网格
- 圣杯布局
- 卡片网格
- 仪表盘
- 图片墙

### 5. 高级特性
- 隐式网格
- 网格线命名
- 子网格
- auto-fill/auto-fit
- minmax()

### 6. 最佳实践
- 使用 fr 单位
- 使用 gap 设置间距
- 使用命名区域
- 使用 minmax 实现响应式
- 合理使用隐式网格

### 7. 与 Flex 对比
- Grid：二维布局
- Flex：一维布局
- 可以结合使用

## 延伸阅读

- [MDN - CSS Grid Layout](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Grid_Layout)
- [Grid 布局教程](https://www.ruanyifeng.com/blog/2019/03/grid-layout-tutorial.html)
- [Grid Garden](https://cssgridgarden.com/) - 交互式学习游戏
- [A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
