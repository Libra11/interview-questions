---
title: 实现 table header 吸顶有哪些实现方式
category: CSS
difficulty: 中级
updatedAt: 2024-12-02
summary: >-
  探讨实现表格表头吸顶效果的多种方案，包括 position: sticky、JavaScript 监听滚动、以及第三方库等方法，分析各方案的优缺点和适用场景。
tags:
  - CSS
  - JavaScript
  - 表格
  - sticky
estimatedTime: 22 分钟
keywords:
  - 表头吸顶
  - sticky
  - 表格固定
  - table header
highlight: 表头吸顶是常见的交互需求，掌握多种实现方案可以应对不同的业务场景
order: 325
---

## 问题 1：使用 CSS position: sticky 实现

### 基本实现

这是最简单和推荐的方案，使用 CSS 原生的 `position: sticky` 属性。

```css
thead th {
  position: sticky;
  top: 0;
  background-color: #fff; /* 必须设置背景色 */
  z-index: 10; /* 确保在其他内容之上 */
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

### 关键要点

**1. 必须设置背景色**

如果不设置背景色，滚动时下方的内容会透过表头显示出来。

```css
thead th {
  position: sticky;
  top: 0;
  background-color: #ffffff; /* 遮挡下方内容 */
}
```

**2. 注意 z-index**

如果表格内容有定位元素，需要设置 `z-index` 确保表头在最上层。

```css
thead th {
  position: sticky;
  top: 0;
  z-index: 10;
}
```

**3. 父元素不能有 overflow**

sticky 定位在父元素有 `overflow: hidden/auto/scroll` 时会失效。

```css
/* ❌ 这样会导致 sticky 失效 */
.table-container {
  overflow: auto;
}

/* ✅ 应该在更外层容器设置 overflow */
.outer-container {
  overflow: auto;
}
```

### 完整示例

```html
<div class="table-wrapper">
  <table class="sticky-table">
    <thead>
      <tr>
        <th>列 1</th>
        <th>列 2</th>
        <th>列 3</th>
      </tr>
    </thead>
    <tbody>
      <!-- 表格数据 -->
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    max-height: 500px;
    overflow-y: auto; /* 滚动容器 */
  }

  .sticky-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sticky-table thead th {
    position: sticky;
    top: 0;
    background-color: #f5f5f5;
    padding: 12px;
    border-bottom: 2px solid #ddd;
    z-index: 10;
  }

  .sticky-table tbody td {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
</style>
```

---

## 问题 2：使用 JavaScript 监听滚动实现

### 基本思路

监听滚动事件，当表头滚动到顶部时，动态改变表头的定位方式。

```javascript
const table = document.querySelector("table");
const thead = table.querySelector("thead");
const theadTop = thead.offsetTop; // 表头初始位置

window.addEventListener("scroll", () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop >= theadTop) {
    // 滚动到表头位置，固定表头
    thead.style.position = "fixed";
    thead.style.top = "0";
    thead.style.width = table.offsetWidth + "px"; // 保持宽度
  } else {
    // 还原表头
    thead.style.position = "static";
  }
});
```

### 优化方案：克隆表头

为了避免表头固定后表格布局错乱，可以克隆一个表头。

```javascript
class StickyTableHeader {
  constructor(table) {
    this.table = table;
    this.thead = table.querySelector("thead");
    this.clonedThead = null;
    this.init();
  }

  init() {
    // 创建克隆的表头
    this.createClone();

    // 监听滚动
    window.addEventListener("scroll", () => this.handleScroll());

    // 监听窗口大小变化
    window.addEventListener("resize", () => this.updateClone());
  }

  createClone() {
    // 克隆表头
    this.clonedThead = this.thead.cloneNode(true);

    // 创建固定表头的容器
    const wrapper = document.createElement("div");
    wrapper.className = "fixed-header";
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.visibility = "hidden"; // 初始隐藏
    wrapper.style.zIndex = "1000";

    // 创建表格容器
    const clonedTable = document.createElement("table");
    clonedTable.className = this.table.className;
    clonedTable.appendChild(this.clonedThead);
    wrapper.appendChild(clonedTable);

    document.body.appendChild(wrapper);
    this.wrapper = wrapper;
  }

  handleScroll() {
    const tableRect = this.table.getBoundingClientRect();
    const theadRect = this.thead.getBoundingClientRect();

    // 判断是否需要显示固定表头
    if (tableRect.top < 0 && tableRect.bottom > theadRect.height) {
      this.wrapper.style.visibility = "visible";
      this.updateClone();
    } else {
      this.wrapper.style.visibility = "hidden";
    }
  }

  updateClone() {
    // 同步宽度
    const ths = this.thead.querySelectorAll("th");
    const clonedThs = this.clonedThead.querySelectorAll("th");

    ths.forEach((th, index) => {
      clonedThs[index].style.width = th.offsetWidth + "px";
    });

    // 同步表格位置
    const tableRect = this.table.getBoundingClientRect();
    this.wrapper.style.left = tableRect.left + "px";
    this.wrapper.style.width = tableRect.width + "px";
  }
}

// 使用
const table = document.querySelector("table");
new StickyTableHeader(table);
```

### 性能优化

使用节流（throttle）优化滚动事件：

```javascript
function throttle(func, wait) {
  let timeout;
  return function (...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, args);
        timeout = null;
      }, wait);
    }
  };
}

// 使用节流
window.addEventListener(
  "scroll",
  throttle(() => {
    handleScroll();
  }, 16)
); // 约 60fps
```

---

## 问题 3：使用 Intersection Observer API 实现

### 基本原理

使用 Intersection Observer API 监听表头的可见性，性能比滚动事件监听更好。

```javascript
class StickyHeaderObserver {
  constructor(table) {
    this.table = table;
    this.thead = table.querySelector('thead');
    this.init();
  }

  init() {
    // 创建一个哨兵元素
    const sentinel = document.createElement('div');
    sentinel.className = 'sticky-sentinel';
    this.table.parentNode.insertBefore(sentinel, this.table);

    // 创建观察器
    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: [0, 1], // 完全可见和完全不可见时触发
        rootMargin: '-1px 0px 0px 0px' // 稍微向上偏移
      }
    );

    observer.observe(sentinel);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.intersectionRatio < 1) {
        // 哨兵元素不完全可见，表头应该固定
        this.thead.classList.add('is-sticky');
      } else {
        // 哨兵元素完全可见，表头不需要固定
        this.thead.classList.remove('is-sticky');
      }
    });
  }
}

// CSS
.sticky-sentinel {
  height: 1px;
  visibility: hidden;
}

thead.is-sticky th {
  position: fixed;
  top: 0;
  background-color: #fff;
  z-index: 10;
}
```

### 优势

- **性能更好**：不需要频繁监听滚动事件
- **更精确**：可以精确判断元素的可见性
- **更灵活**：可以设置不同的触发阈值

---

## 问题 4：不同方案的对比和选择

### 方案对比

| 方案                      | 优点                   | 缺点                             | 适用场景             |
| ------------------------- | ---------------------- | -------------------------------- | -------------------- |
| **position: sticky**      | 简单、性能好、原生支持 | IE 不支持、父元素不能有 overflow | 现代浏览器项目       |
| **滚动监听**              | 兼容性好、可控性强     | 性能较差、代码复杂               | 需要兼容老浏览器     |
| **Intersection Observer** | 性能好、代码优雅       | IE 不支持                        | 现代浏览器、复杂交互 |
| **第三方库**              | 功能完善、开箱即用     | 增加依赖、包体积                 | 快速开发、功能需求多 |

### 推荐方案

**1. 优先使用 position: sticky**

```css
/* 最简单的方案 */
thead th {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}
```

**适用于**：

- 现代浏览器项目（不需要兼容 IE）
- 简单的表头吸顶需求
- 追求性能和代码简洁

**2. 需要兼容性时使用 JavaScript**

```javascript
// 使用 Intersection Observer（现代浏览器）
// 或滚动监听（老浏览器）
```

**适用于**：

- 需要兼容 IE 浏览器
- 需要更复杂的交互逻辑
- 需要动态控制吸顶行为

**3. 复杂场景使用第三方库**

```javascript
// 例如：react-sticky、vue-sticky 等
import { Sticky } from "react-sticky";
```

**适用于**：

- 功能需求复杂（如多级表头、横向滚动等）
- 快速开发，不想自己实现
- 已有技术栈的配套库

### 注意事项

**1. 表格布局问题**

使用 fixed 定位时，需要手动同步列宽：

```javascript
// 同步列宽
const ths = thead.querySelectorAll("th");
ths.forEach((th) => {
  th.style.width = th.offsetWidth + "px";
});
```

**2. 滚动容器**

如果表格在滚动容器内，需要监听容器的滚动事件，而不是 window：

```javascript
const container = document.querySelector(".scroll-container");
container.addEventListener("scroll", handleScroll);
```

**3. 响应式处理**

窗口大小变化时，需要重新计算位置和宽度：

```javascript
window.addEventListener(
  "resize",
  debounce(() => {
    updateHeaderPosition();
  }, 200)
);
```

---

## 总结

**核心概念总结**：

### 1. 四种主要方案

- **position: sticky**：最简单，性能最好
- **滚动监听**：兼容性最好，代码最复杂
- **Intersection Observer**：性能好，代码优雅
- **第三方库**：功能完善，快速开发

### 2. 选择建议

- 现代浏览器项目：优先 sticky
- 需要 IE 兼容：使用滚动监听
- 复杂交互：考虑 Intersection Observer
- 快速开发：使用成熟的第三方库

### 3. 实现要点

- sticky 方案需要注意父元素的 overflow
- JavaScript 方案需要同步列宽
- 都需要设置背景色和 z-index
- 注意性能优化（节流、防抖）

## 延伸阅读

- [MDN - position: sticky](https://developer.mozilla.org/zh-CN/docs/Web/CSS/position)
- [MDN - Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)
- [CSS Tricks - Position Sticky](https://css-tricks.com/position-sticky-2/)
- [表格吸顶的多种实现方案](https://www.zhangxinxu.com/wordpress/2018/12/css-position-sticky/)
