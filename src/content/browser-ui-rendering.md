---
title: 浏览器是如何渲染 UI 的
category: 浏览器
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  全面了解浏览器渲染 UI 的完整流程，包括 DOM 树构建、CSSOM 构建、渲染树生成、布局计算和绘制等关键步骤。
tags:
  - 浏览器
  - 渲染原理
  - 性能优化
  - 重排重绘
estimatedTime: 24 分钟
keywords:
  - 浏览器渲染
  - 渲染流程
  - 重排
  - 重绘
highlight: 理解浏览器渲染流程是前端性能优化的核心知识
order: 363
---

## 问题 1：浏览器渲染的完整流程

### 渲染流水线

```
HTML → DOM Tree
CSS → CSSOM Tree
DOM + CSSOM → Render Tree → Layout → Paint → Composite
```

### 关键步骤

1. **构建 DOM 树**：解析 HTML
2. **构建 CSSOM 树**：解析 CSS
3. **生成渲染树**：合并 DOM 和 CSSOM
4. **布局（Layout）**：计算元素位置和大小
5. **绘制（Paint）**：绘制像素
6. **合成（Composite）**：合成图层

---

## 问题 2：DOM 树和 CSSOM 树

### DOM 树

表示 HTML 文档结构。

```html
<div class="container">
  <p>Hello</p>
</div>
```

### CSSOM 树

表示 CSS 样式规则。

```css
.container {
  width: 100px;
}
p {
  color: red;
}
```

### 合并生成渲染树

只包含可见元素，`display: none` 的元素不在渲染树中。

---

## 问题 3：布局（Layout）和绘制（Paint）

### 布局（重排 Reflow）

计算元素的几何信息（位置、大小）。

**触发条件**：

- 添加/删除元素
- 改变尺寸
- 改变字体
- 窗口大小变化

### 绘制（重绘 Repaint）

将元素绘制成像素。

**触发条件**：

- 改变颜色
- 改变背景
- 改变阴影

**性能**：重排成本 > 重绘成本

---

## 问题 4：优化渲染性能

### 减少重排

```javascript
// ❌ 多次重排
element.style.width = "100px";
element.style.height = "100px";
element.style.margin = "10px";

// ✅ 一次重排
element.style.cssText = "width:100px;height:100px;margin:10px";
```

### 使用 transform

```css
/* ❌ 触发重排 */
.box {
  left: 100px;
}

/* ✅ 只触发合成 */
.box {
  transform: translateX(100px);
}
```

### 批量 DOM 操作

```javascript
// 使用 DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const div = document.createElement("div");
  fragment.appendChild(div);
}
document.body.appendChild(fragment);
```

---

## 总结

**核心要点**：

1. 渲染流程：DOM → CSSOM → Render Tree → Layout → Paint
2. 重排比重绘成本高
3. 使用 transform 和 opacity 优化动画
4. 批量操作 DOM

## 延伸阅读

- [浏览器渲染原理](https://developers.google.com/web/fundamentals/performance/critical-rendering-path)
- [重排和重绘](https://developer.mozilla.org/zh-CN/docs/Web/Performance)
