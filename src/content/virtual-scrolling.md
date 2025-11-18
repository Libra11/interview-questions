---
title: 虚拟滚动的原理是什么
category: 性能优化
difficulty: 高级
updatedAt: 2025-11-18
summary: >-
  深入理解虚拟滚动的实现原理，掌握如何通过只渲染可见区域的元素来优化大列表的性能
tags:
  - 虚拟滚动
  - 性能优化
  - 大列表
  - 渲染优化
estimatedTime: 25 分钟
keywords:
  - 虚拟滚动
  - virtual scroll
  - 长列表优化
  - 性能优化
  - 可视区域渲染
highlight: 虚拟滚动只渲染可见区域的元素，通过动态计算和替换 DOM 节点实现大列表的高性能渲染
order: 100
---

## 问题 1：什么是虚拟滚动？

### 问题场景

```javascript
// 渲染 10000 条数据
const list = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

// ❌ 传统方式：一次性渲染所有元素
list.forEach(item => {
  const div = document.createElement('div');
  div.textContent = item;
  container.appendChild(div);
});

// 问题：
// 1. DOM 节点过多（10000 个）
// 2. 初始渲染慢
// 3. 滚动卡顿
// 4. 内存占用高
```

### 虚拟滚动的思路

```javascript
// ✅ 虚拟滚动：只渲染可见区域的元素
// 假设容器高度 600px，每项高度 50px
// 可见区域只能显示 12 个元素（600 / 50）

// 只渲染可见的 12 个 + 缓冲区的几个
// 滚动时动态替换内容，而不是创建新 DOM
```

---

## 问题 2：虚拟滚动的核心原理是什么？

### 核心概念

```javascript
// 1. 总高度：所有数据的总高度
const totalHeight = itemCount * itemHeight;

// 2. 可见区域：视口能看到的区域
const visibleHeight = container.clientHeight;

// 3. 可见数量：可见区域能显示多少个元素
const visibleCount = Math.ceil(visibleHeight / itemHeight);

// 4. 起始索引：根据滚动位置计算
const startIndex = Math.floor(scrollTop / itemHeight);

// 5. 结束索引
const endIndex = startIndex + visibleCount;

// 6. 可见数据：只渲染这部分数据
const visibleData = data.slice(startIndex, endIndex);
```

### 基础实现

```javascript
class VirtualScroll {
  constructor(options) {
    this.container = options.container;
    this.data = options.data;
    this.itemHeight = options.itemHeight;
    this.renderItem = options.renderItem;
    
    this.init();
  }
  
  init() {
    // 创建容器结构
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // 创建占位元素（撑开滚动条）
    this.phantom = document.createElement('div');
    this.phantom.style.height = `${this.data.length * this.itemHeight}px`;
    this.container.appendChild(this.phantom);
    
    // 创建内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.right = '0';
    this.container.appendChild(this.content);
    
    // 监听滚动
    this.container.addEventListener('scroll', () => {
      this.update();
    });
    
    // 初始渲染
    this.update();
  }
  
  update() {
    const scrollTop = this.container.scrollTop;
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);
    
    // 计算可见范围
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = startIndex + visibleCount;
    
    // 获取可见数据
    const visibleData = this.data.slice(startIndex, endIndex + 1);
    
    // 更新内容位置
    this.content.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
    
    // 渲染可见元素
    this.content.innerHTML = '';
    visibleData.forEach((item, index) => {
      const element = this.renderItem(item, startIndex + index);
      this.content.appendChild(element);
    });
  }
}

// 使用
const data = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

new VirtualScroll({
  container: document.getElementById('list'),
  data: data,
  itemHeight: 50,
  renderItem: (item, index) => {
    const div = document.createElement('div');
    div.style.height = '50px';
    div.style.lineHeight = '50px';
    div.textContent = item;
    return div;
  }
});
```

---

## 问题 3：如何处理不定高度的列表？

### 动态高度实现

```javascript
class DynamicVirtualScroll {
  constructor(options) {
    this.container = options.container;
    this.data = options.data;
    this.estimatedItemHeight = options.estimatedItemHeight || 50;
    this.renderItem = options.renderItem;
    
    // 缓存每个元素的高度和位置
    this.positions = this.data.map((_, index) => ({
      index,
      height: this.estimatedItemHeight,
      top: index * this.estimatedItemHeight,
      bottom: (index + 1) * this.estimatedItemHeight
    }));
    
    this.init();
  }
  
  init() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // 占位元素
    this.phantom = document.createElement('div');
    this.updatePhantomHeight();
    this.container.appendChild(this.phantom);
    
    // 内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '0';
    this.content.style.left = '0';
    this.content.style.right = '0';
    this.container.appendChild(this.content);
    
    this.container.addEventListener('scroll', () => {
      this.update();
    });
    
    this.update();
  }
  
  update() {
    const scrollTop = this.container.scrollTop;
    const visibleCount = Math.ceil(this.container.clientHeight / this.estimatedItemHeight);
    
    // 二分查找起始索引
    const startIndex = this.binarySearch(this.positions, scrollTop);
    const endIndex = startIndex + visibleCount;
    
    const visibleData = this.data.slice(startIndex, endIndex + 1);
    
    // 设置偏移
    const offsetY = this.positions[startIndex]?.top || 0;
    this.content.style.transform = `translateY(${offsetY}px)`;
    
    // 渲染
    this.content.innerHTML = '';
    visibleData.forEach((item, index) => {
      const element = this.renderItem(item, startIndex + index);
      this.content.appendChild(element);
    });
    
    // 更新高度缓存
    this.$nextTick(() => {
      this.updatePositions(startIndex);
    });
  }
  
  updatePositions(startIndex) {
    const nodes = this.content.children;
    
    Array.from(nodes).forEach((node, index) => {
      const actualIndex = startIndex + index;
      const rect = node.getBoundingClientRect();
      const height = rect.height;
      
      const oldHeight = this.positions[actualIndex].height;
      const dValue = oldHeight - height;
      
      // 更新当前元素高度
      if (dValue) {
        this.positions[actualIndex].height = height;
        this.positions[actualIndex].bottom = this.positions[actualIndex].bottom - dValue;
        
        // 更新后续元素位置
        for (let i = actualIndex + 1; i < this.positions.length; i++) {
          this.positions[i].top = this.positions[i - 1].bottom;
          this.positions[i].bottom = this.positions[i].bottom - dValue;
        }
      }
    });
    
    this.updatePhantomHeight();
  }
  
  updatePhantomHeight() {
    const lastPosition = this.positions[this.positions.length - 1];
    this.phantom.style.height = `${lastPosition.bottom}px`;
  }
  
  binarySearch(list, value) {
    let start = 0;
    let end = list.length - 1;
    let tempIndex = null;
    
    while (start <= end) {
      const midIndex = Math.floor((start + end) / 2);
      const midValue = list[midIndex].bottom;
      
      if (midValue === value) {
        return midIndex + 1;
      } else if (midValue < value) {
        start = midIndex + 1;
      } else {
        if (tempIndex === null || tempIndex > midIndex) {
          tempIndex = midIndex;
        }
        end = midIndex - 1;
      }
    }
    
    return tempIndex;
  }
  
  $nextTick(callback) {
    Promise.resolve().then(callback);
  }
}
```

---

## 问题 4：如何优化虚拟滚动的性能？

### 1. 添加缓冲区

```javascript
class OptimizedVirtualScroll {
  constructor(options) {
    this.bufferSize = options.bufferSize || 3; // 缓冲区大小
    // ...
  }
  
  update() {
    const scrollTop = this.container.scrollTop;
    const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight);
    
    // 添加缓冲区
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.data.length - 1,
      startIndex + visibleCount + this.bufferSize * 2
    );
    
    // 渲染可见数据 + 缓冲区数据
    this.render(startIndex, endIndex);
  }
}
```

### 2. 节流滚动事件

```javascript
function throttle(func, wait) {
  let timeout;
  return function(...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.apply(this, args);
        timeout = null;
      }, wait);
    }
  };
}

// 使用
this.container.addEventListener('scroll', throttle(() => {
  this.update();
}, 16)); // 约 60fps
```

### 3. 使用 requestAnimationFrame

```javascript
update() {
  if (this.rafId) {
    cancelAnimationFrame(this.rafId);
  }
  
  this.rafId = requestAnimationFrame(() => {
    this.doUpdate();
  });
}
```

### 4. DOM 复用

```javascript
class RecycleVirtualScroll {
  constructor(options) {
    this.pool = []; // DOM 节点池
    // ...
  }
  
  render(startIndex, endIndex) {
    const visibleData = this.data.slice(startIndex, endIndex + 1);
    
    // 回收多余的 DOM
    while (this.content.children.length > visibleData.length) {
      const node = this.content.lastChild;
      this.pool.push(node);
      this.content.removeChild(node);
    }
    
    // 渲染数据
    visibleData.forEach((item, index) => {
      let element;
      
      if (this.content.children[index]) {
        // 复用现有 DOM
        element = this.content.children[index];
      } else if (this.pool.length > 0) {
        // 从池中取出 DOM
        element = this.pool.pop();
        this.content.appendChild(element);
      } else {
        // 创建新 DOM
        element = this.createItem();
        this.content.appendChild(element);
      }
      
      // 更新内容
      this.updateItem(element, item, startIndex + index);
    });
  }
}
```

---

## 总结

**核心要点**：

### 1. 基本原理
- 只渲染可见区域的元素
- 使用占位元素撑开滚动条
- 动态计算可见范围
- 滚动时替换内容

### 2. 关键计算
```javascript
startIndex = Math.floor(scrollTop / itemHeight);
visibleCount = Math.ceil(containerHeight / itemHeight);
endIndex = startIndex + visibleCount;
```

### 3. 性能优化
- 添加缓冲区
- 节流滚动事件
- 使用 RAF
- DOM 节点复用

### 4. 适用场景
- 大数据列表（1000+ 条）
- 表格虚拟滚动
- 聊天消息列表
- 无限滚动加载

---

## 延伸阅读

- [react-window](https://github.com/bvaughn/react-window)
- [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)
- [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)
- [高性能滚动优化](https://web.dev/articles/optimize-long-tasks)
