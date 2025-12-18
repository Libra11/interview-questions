---
title: 什么是重绘和重排？
category: 浏览器
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解浏览器的重绘和重排机制，掌握触发条件和性能影响，学习优化技巧减少不必要的重绘重排，提升页面性能。
tags:
  - 浏览器渲染
  - 性能优化
  - DOM操作
  - CSS优化
estimatedTime: 24 分钟
keywords:
  - 重绘
  - 重排
  - Repaint
  - Reflow
  - 浏览器渲染
highlight: 重排会引起重绘，但重绘不一定引起重排；减少重排重绘是前端性能优化的重要手段
order: 376
---

## 问题 1：什么是重绘和重排？

重绘（Repaint）和重排（Reflow）是浏览器渲染过程中的两个重要概念，理解它们对性能优化至关重要。

### 基本概念

```javascript
// 重排（Reflow）：也叫回流
// 当元素的几何属性（位置、尺寸）发生变化时
// 浏览器需要重新计算元素的几何属性
// 并重新构建渲染树

// 触发重排的操作
element.style.width = '200px';  // 改变宽度
element.style.height = '100px'; // 改变高度
element.style.margin = '10px';  // 改变外边距

// 重绘（Repaint）：
// 当元素的外观（颜色、背景等）发生变化
// 但不影响布局时，浏览器会重新绘制元素

// 触发重绘的操作
element.style.color = 'red';       // 改变颜色
element.style.background = 'blue'; // 改变背景
element.style.visibility = 'hidden'; // 改变可见性
```

### 浏览器渲染流程

```javascript
// 浏览器渲染的基本流程：
// 1. 解析 HTML 生成 DOM 树
// 2. 解析 CSS 生成 CSSOM 树
// 3. 合并 DOM 和 CSSOM 生成渲染树（Render Tree）
// 4. 布局（Layout/Reflow）：计算元素的位置和大小
// 5. 绘制（Paint/Repaint）：将渲染树绘制到屏幕上
// 6. 合成（Composite）：将多个图层合成最终图像

// 重排影响步骤 4-6
// 重绘影响步骤 5-6

// 示例：理解渲染流程
const div = document.createElement('div');
div.textContent = 'Hello';
document.body.appendChild(div);

// 1. DOM 树更新
// 2. 计算样式（CSSOM）
// 3. 生成渲染树
// 4. 布局（重排）- 计算位置和大小
// 5. 绘制（重绘）- 绘制到屏幕
```

### 重排和重绘的关系

```javascript
// 重排一定会引起重绘
// 因为元素的几何属性变化后，需要重新绘制

element.style.width = '200px';
// 1. 触发重排（重新计算布局）
// 2. 触发重绘（重新绘制）

// 重绘不一定引起重排
// 只改变外观，不影响布局

element.style.color = 'red';
// 1. 只触发重绘
// 2. 不触发重排

// 性能影响：
// 重排 > 重绘 > 合成
// 重排的性能开销最大
```

---

## 问题 2：哪些操作会触发重排？

了解触发重排的操作有助于避免不必要的性能损耗。

### 几何属性变化

```javascript
// 1. 改变元素尺寸
element.style.width = '200px';
element.style.height = '100px';
element.style.padding = '10px';
element.style.margin = '10px';
element.style.border = '1px solid red';

// 2. 改变元素位置
element.style.position = 'absolute';
element.style.top = '100px';
element.style.left = '100px';

// 3. 改变元素显示方式
element.style.display = 'block';
element.style.float = 'left';

// 4. 改变字体大小
element.style.fontSize = '20px';
element.style.lineHeight = '1.5';
```

### DOM 结构变化

```javascript
// 1. 添加或删除元素
const newDiv = document.createElement('div');
document.body.appendChild(newDiv); // 触发重排

const oldDiv = document.getElementById('old');
oldDiv.remove(); // 触发重排

// 2. 修改元素内容
element.textContent = 'New content'; // 可能触发重排
element.innerHTML = '<span>New HTML</span>'; // 触发重排

// 3. 修改 class
element.className = 'new-class'; // 可能触发重排
element.classList.add('active'); // 可能触发重排
```

### 获取布局信息

```javascript
// 读取某些属性会强制浏览器同步计算布局
// 这被称为"强制同步布局"或"布局抖动"

// 触发重排的属性读取：
const width = element.offsetWidth;
const height = element.offsetHeight;
const top = element.offsetTop;
const left = element.offsetLeft;

const clientWidth = element.clientWidth;
const clientHeight = element.clientHeight;

const scrollWidth = element.scrollWidth;
const scrollHeight = element.scrollHeight;
const scrollTop = element.scrollTop;

// 获取计算样式
const styles = window.getComputedStyle(element);
const width = styles.width;

// 获取边界信息
const rect = element.getBoundingClientRect();
```

### 窗口变化

```javascript
// 1. 改变窗口大小
window.addEventListener('resize', () => {
  // 触发重排
  console.log('窗口大小改变');
});

// 2. 滚动
window.addEventListener('scroll', () => {
  // 可能触发重排
  console.log('页面滚动');
});

// 3. 改变字体
document.body.style.fontFamily = 'Arial';
```

---

## 问题 3：哪些操作会触发重绘？

重绘的触发条件相对简单，主要是外观属性的变化。

### 颜色相关

```javascript
// 改变颜色
element.style.color = 'red';
element.style.backgroundColor = 'blue';
element.style.borderColor = 'green';

// 改变透明度
element.style.opacity = '0.5';
```

### 可见性相关

```javascript
// 改变可见性（不改变布局）
element.style.visibility = 'hidden'; // 触发重绘，不触发重排
element.style.visibility = 'visible';

// 注意：display 会触发重排
element.style.display = 'none'; // 触发重排
```

### 外观属性

```javascript
// 改变背景
element.style.background = 'url(image.jpg)';
element.style.backgroundImage = 'linear-gradient(...)';

// 改变边框样式（不改变宽度）
element.style.borderStyle = 'dashed';

// 改变轮廓
element.style.outline = '2px solid red';

// 改变阴影
element.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
element.style.textShadow = '2px 2px 4px black';
```

### 只触发重绘的属性

```javascript
// 这些属性只触发重绘，不触发重排：
const repaintOnlyProps = [
  'color',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-repeat',
  'background-size',
  'border-color',
  'border-style',
  'box-shadow',
  'outline',
  'outline-color',
  'outline-style',
  'outline-width',
  'text-decoration',
  'visibility'
];
```

---

## 问题 4：如何优化重排和重绘？

掌握优化技巧可以显著提升页面性能。

### 批量修改样式

```javascript
// ❌ 不好的做法：多次修改样式
const element = document.getElementById('box');
element.style.width = '200px';   // 重排
element.style.height = '200px';  // 重排
element.style.margin = '10px';   // 重排

// ✅ 好的做法 1：使用 cssText
element.style.cssText = 'width: 200px; height: 200px; margin: 10px;';
// 只触发一次重排

// ✅ 好的做法 2：使用 class
// CSS
// .box-style {
//   width: 200px;
//   height: 200px;
//   margin: 10px;
// }

element.className = 'box-style';
// 只触发一次重排

// ✅ 好的做法 3：使用 classList
element.classList.add('box-style');
```

### 离线操作 DOM

```javascript
// ❌ 不好的做法：频繁操作可见 DOM
const list = document.getElementById('list');
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  list.appendChild(li); // 每次都触发重排
}

// ✅ 好的做法 1：使用 DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  fragment.appendChild(li); // 不触发重排
}
list.appendChild(fragment); // 只触发一次重排

// ✅ 好的做法 2：先隐藏元素
list.style.display = 'none'; // 重排
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  list.appendChild(li); // 不触发重排（元素隐藏）
}
list.style.display = 'block'; // 重排

// ✅ 好的做法 3：克隆节点
const clone = list.cloneNode(true);
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  clone.appendChild(li);
}
list.parentNode.replaceChild(clone, list); // 只触发一次重排
```

### 避免布局抖动

```javascript
// ❌ 不好的做法：读写交替导致布局抖动
const elements = document.querySelectorAll('.box');

elements.forEach(element => {
  // 读取布局信息
  const width = element.offsetWidth;
  // 修改样式
  element.style.width = width + 10 + 'px'; // 强制重排
  // 每次循环都会触发重排
});

// ✅ 好的做法：分离读写操作
const elements = document.querySelectorAll('.box');

// 先读取所有布局信息
const widths = Array.from(elements).map(el => el.offsetWidth);

// 再批量修改
elements.forEach((element, index) => {
  element.style.width = widths[index] + 10 + 'px';
});
// 只触发一次重排
```

### 使用绝对定位

```javascript
// 绝对定位的元素脱离文档流
// 修改它们不会影响其他元素的布局

// ❌ 不好的做法：频繁修改普通元素
const box = document.getElementById('box');
setInterval(() => {
  box.style.left = Math.random() * 100 + 'px';
  // 触发整个页面的重排
}, 16);

// ✅ 好的做法：使用绝对定位
const box = document.getElementById('box');
box.style.position = 'absolute';

setInterval(() => {
  box.style.left = Math.random() * 100 + 'px';
  // 只影响该元素，不影响其他元素
}, 16);
```

### 使用 transform 和 opacity

```javascript
// transform 和 opacity 不会触发重排和重绘
// 它们在合成层处理，性能最好

// ❌ 不好的做法：使用 left/top 做动画
element.style.left = '100px'; // 触发重排

// ✅ 好的做法：使用 transform
element.style.transform = 'translateX(100px)'; // 只触发合成

// ❌ 不好的做法：使用 width/height 做动画
element.style.width = '200px'; // 触发重排

// ✅ 好的做法：使用 transform scale
element.style.transform = 'scale(2)'; // 只触发合成

// CSS 动画优化
// ❌ 不好
@keyframes slide {
  from { left: 0; }
  to { left: 100px; }
}

// ✅ 好
@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

---

## 问题 5：如何检测和分析重排重绘？

使用浏览器开发者工具可以直观地看到重排重绘的情况。

### Chrome DevTools

```javascript
// 1. Performance 面板
// 打开 DevTools > Performance
// 点击录制按钮，执行操作，停止录制
// 查看 Main 线程的活动：
// - Layout（重排）显示为紫色
// - Paint（重绘）显示为绿色
// - Composite（合成）显示为浅绿色

// 2. Rendering 面板
// 打开 DevTools > More tools > Rendering
// 勾选 "Paint flashing"：重绘区域会高亮显示
// 勾选 "Layout Shift Regions"：布局偏移区域会高亮

// 3. Layers 面板
// 打开 DevTools > More tools > Layers
// 查看页面的图层结构
// 了解哪些元素创建了独立的合成层

// 示例：测试重排重绘
function testReflow() {
  console.time('reflow');
  
  const element = document.getElementById('box');
  
  // 触发重排
  for (let i = 0; i < 1000; i++) {
    element.style.width = i + 'px';
  }
  
  console.timeEnd('reflow');
}

function testRepaint() {
  console.time('repaint');
  
  const element = document.getElementById('box');
  
  // 只触发重绘
  for (let i = 0; i < 1000; i++) {
    element.style.backgroundColor = `rgb(${i % 255}, 0, 0)`;
  }
  
  console.timeEnd('repaint');
}
```

### 性能监控代码

```javascript
// 使用 Performance API 监控
class PerformanceMonitor {
  constructor() {
    this.observer = null;
  }
  
  start() {
    // 监控长任务
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('长任务检测:', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      }
    });
    
    this.observer.observe({ entryTypes: ['longtask', 'measure'] });
  }
  
  stop() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
  
  // 测量特定操作的性能
  measure(name, fn) {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name} 耗时: ${measure.duration.toFixed(2)}ms`);
  }
}

// 使用
const monitor = new PerformanceMonitor();
monitor.start();

monitor.measure('批量DOM操作', () => {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    fragment.appendChild(div);
  }
  document.body.appendChild(fragment);
});
```

---

## 问题 6：现代浏览器的优化机制是什么？

现代浏览器有多种优化机制来减少重排重绘的性能影响。

### 渲染队列

```javascript
// 浏览器会维护一个渲染队列
// 将多次修改合并为一次重排

// 浏览器的优化
element.style.width = '100px';
element.style.height = '100px';
element.style.margin = '10px';
// 浏览器会将这些修改放入队列
// 在合适的时机一次性执行重排

// 但是，读取布局信息会强制刷新队列
element.style.width = '100px';
const width = element.offsetWidth; // 强制刷新队列，触发重排
element.style.height = '100px';
const height = element.offsetHeight; // 再次触发重排
```

### 合成层

```javascript
// 某些 CSS 属性会创建独立的合成层
// 合成层的变化不会影响其他层

// 创建合成层的属性：
// 1. transform: translateZ(0) 或 translate3d(0,0,0)
// 2. will-change
// 3. video、canvas、iframe 元素
// 4. opacity 动画
// 5. transform 动画

// 示例：创建合成层优化动画
.animated-box {
  /* 提示浏览器创建合成层 */
  will-change: transform;
  /* 或者 */
  transform: translateZ(0);
}

// JavaScript 中
element.style.willChange = 'transform';

// 动画结束后移除
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});

// 注意：不要过度使用合成层
// 每个合成层都需要额外的内存
```

### requestAnimationFrame

```javascript
// 使用 requestAnimationFrame 优化动画
// 它会在浏览器重绘之前执行

// ❌ 不好的做法：使用 setTimeout
function animate() {
  element.style.left = parseInt(element.style.left) + 1 + 'px';
  setTimeout(animate, 16); // 可能与浏览器刷新不同步
}

// ✅ 好的做法：使用 requestAnimationFrame
function animate() {
  element.style.left = parseInt(element.style.left) + 1 + 'px';
  requestAnimationFrame(animate); // 与浏览器刷新同步
}

requestAnimationFrame(animate);

// 批量读写操作
function batchUpdate() {
  // 使用 requestAnimationFrame 批量更新
  requestAnimationFrame(() => {
    // 读取操作
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    
    // 写入操作
    element.style.width = width + 10 + 'px';
    element.style.height = height + 10 + 'px';
  });
}
```

---

## 问题 7：实际项目中的优化实践有哪些？

结合实际场景的优化技巧。

### 虚拟滚动

```javascript
// 对于长列表，使用虚拟滚动只渲染可见区域

class VirtualList {
  constructor(container, itemHeight, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight);
    
    this.init();
  }
  
  init() {
    // 设置容器高度
    this.container.style.height = this.totalItems * this.itemHeight + 'px';
    this.container.style.position = 'relative';
    
    // 监听滚动
    this.container.addEventListener('scroll', () => {
      this.render();
    });
    
    this.render();
  }
  
  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = startIndex + this.visibleItems;
    
    // 只渲染可见区域的元素
    this.container.innerHTML = '';
    
    for (let i = startIndex; i < endIndex && i < this.totalItems; i++) {
      const item = document.createElement('div');
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';
      item.textContent = `Item ${i}`;
      
      this.container.appendChild(item);
    }
  }
}

// 使用
const container = document.getElementById('list');
new VirtualList(container, 50, 10000);
```

### 防抖和节流

```javascript
// 对于频繁触发的事件，使用防抖和节流

// 防抖：延迟执行
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流：限制执行频率
function throttle(fn, delay) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

// 使用
window.addEventListener('resize', debounce(() => {
  // 窗口大小改变时的处理
  console.log('resize');
}, 200));

window.addEventListener('scroll', throttle(() => {
  // 滚动时的处理
  console.log('scroll');
}, 100));
```

### CSS 优化

```css
/* 1. 使用 contain 属性限制影响范围 */
.card {
  contain: layout; /* 限制布局影响 */
  /* 或 */
  contain: paint;  /* 限制绘制影响 */
  /* 或 */
  contain: strict; /* 最严格的限制 */
}

/* 2. 使用 content-visibility 优化渲染 */
.section {
  content-visibility: auto; /* 自动管理渲染 */
}

/* 3. 避免复杂的选择器 */
/* ❌ 不好 */
div > ul > li > a > span { }

/* ✅ 好 */
.link-text { }

/* 4. 使用 transform 和 opacity 做动画 */
.animated {
  transition: transform 0.3s, opacity 0.3s;
}

.animated:hover {
  transform: scale(1.1);
  opacity: 0.8;
}
```

### 图片懒加载

```javascript
// 使用 Intersection Observer 实现懒加载
class LazyLoad {
  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
  }
  
  observe(images) {
    images.forEach(img => {
      this.observer.observe(img);
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
  }
}

// 使用
const lazyLoad = new LazyLoad();
const images = document.querySelectorAll('img[data-src]');
lazyLoad.observe(images);
```

---

## 总结

**重绘和重排的核心要点**：

### 1. 基本概念
- **重排（Reflow）**：元素几何属性变化，重新计算布局
- **重绘（Repaint）**：元素外观变化，重新绘制
- 重排一定引起重绘，重绘不一定引起重排

### 2. 触发条件
- **重排**：尺寸、位置、DOM 结构变化、读取布局信息
- **重绘**：颜色、背景、可见性等外观属性变化

### 3. 优化技巧
- 批量修改样式（cssText、class）
- 离线操作 DOM（DocumentFragment）
- 避免布局抖动（分离读写）
- 使用绝对定位减少影响范围
- 使用 transform 和 opacity 做动画

### 4. 浏览器优化
- 渲染队列批量处理
- 合成层独立渲染
- requestAnimationFrame 同步刷新

### 5. 检测工具
- Chrome DevTools Performance 面板
- Paint flashing 可视化重绘
- Performance API 性能监控

### 6. 实践技巧
- 虚拟滚动优化长列表
- 防抖节流优化频繁事件
- CSS contain 限制影响范围
- 图片懒加载减少初始渲染

## 延伸阅读

- [浏览器渲染原理](https://developers.google.com/web/fundamentals/performance/rendering)
- [CSS Triggers](https://csstriggers.com/) - 查看 CSS 属性触发的渲染操作
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [深入理解重排和重绘](https://juejin.cn/post/6844904083212468238)
