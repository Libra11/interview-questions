---
title: 如何实现鼠标拖拽功能
category: 浏览器
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  掌握使用原生 JavaScript 实现拖拽功能的方法，包括鼠标事件处理、位置计算、边界限制等核心技术
tags:
  - 拖拽
  - 鼠标事件
  - DOM操作
  - 交互
estimatedTime: 22 分钟
keywords:
  - 拖拽
  - drag
  - mousedown
  - mousemove
  - mouseup
highlight: 通过监听 mousedown、mousemove、mouseup 事件，计算位置偏移量实现元素拖拽
order: 95
---

## 问题 1：如何实现基础的拖拽功能？

### 核心思路

```javascript
// 1. mousedown：记录初始位置
// 2. mousemove：计算偏移量，更新元素位置
// 3. mouseup：结束拖拽
```

### 基础实现

```javascript
const box = document.getElementById('box');
let isDragging = false;
let startX, startY;
let offsetX, offsetY;

// 1. 鼠标按下
box.addEventListener('mousedown', (e) => {
  isDragging = true;
  
  // 记录鼠标位置
  startX = e.clientX;
  startY = e.clientY;
  
  // 记录元素当前位置
  const rect = box.getBoundingClientRect();
  offsetX = rect.left;
  offsetY = rect.top;
  
  box.style.cursor = 'grabbing';
});

// 2. 鼠标移动
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  // 计算移动距离
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  
  // 更新元素位置
  box.style.left = (offsetX + dx) + 'px';
  box.style.top = (offsetY + dy) + 'px';
});

// 3. 鼠标松开
document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    box.style.cursor = 'grab';
  }
});
```

### HTML 和 CSS

```html
<div id="box" class="draggable">拖我</div>

<style>
.draggable {
  position: absolute;
  width: 100px;
  height: 100px;
  background: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none; /* 防止拖拽时选中文字 */
}
</style>
```

---

## 问题 2：如何限制拖拽范围？

### 边界限制

```javascript
function dragWithBoundary(element, container) {
  let isDragging = false;
  let startX, startY, offsetX, offsetY;
  
  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = element.getBoundingClientRect();
    offsetX = rect.left;
    offsetY = rect.top;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newX = offsetX + dx;
    let newY = offsetY + dy;
    
    // 获取容器和元素尺寸
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // 限制在容器内
    const minX = containerRect.left;
    const minY = containerRect.top;
    const maxX = containerRect.right - elementRect.width;
    const maxY = containerRect.bottom - elementRect.height;
    
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));
    
    element.style.left = newX + 'px';
    element.style.top = newY + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// 使用
const box = document.getElementById('box');
const container = document.getElementById('container');
dragWithBoundary(box, container);
```

---

## 问题 3：如何封装一个可复用的拖拽类？

### 拖拽类实现

```javascript
class Draggable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      container: document.body,
      handle: null, // 拖拽手柄
      onDragStart: null,
      onDrag: null,
      onDragEnd: null,
      ...options
    };
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    
    this.init();
  }
  
  init() {
    // 确定拖拽触发元素
    const handle = this.options.handle || this.element;
    
    handle.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // 设置样式
    this.element.style.position = 'absolute';
    handle.style.cursor = 'grab';
  }
  
  onMouseDown(e) {
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    
    const rect = this.element.getBoundingClientRect();
    this.offsetX = rect.left;
    this.offsetY = rect.top;
    
    const handle = this.options.handle || this.element;
    handle.style.cursor = 'grabbing';
    
    // 触发回调
    this.options.onDragStart?.(e, this.element);
  }
  
  onMouseMove(e) {
    if (!this.isDragging) return;
    
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    
    let newX = this.offsetX + dx;
    let newY = this.offsetY + dy;
    
    // 边界限制
    if (this.options.container) {
      const containerRect = this.options.container.getBoundingClientRect();
      const elementRect = this.element.getBoundingClientRect();
      
      newX = Math.max(
        containerRect.left,
        Math.min(newX, containerRect.right - elementRect.width)
      );
      newY = Math.max(
        containerRect.top,
        Math.min(newY, containerRect.bottom - elementRect.height)
      );
    }
    
    this.element.style.left = newX + 'px';
    this.element.style.top = newY + 'px';
    
    // 触发回调
    this.options.onDrag?.(e, this.element, { x: newX, y: newY });
  }
  
  onMouseUp(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    const handle = this.options.handle || this.element;
    handle.style.cursor = 'grab';
    
    // 触发回调
    this.options.onDragEnd?.(e, this.element);
  }
  
  destroy() {
    const handle = this.options.handle || this.element;
    handle.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }
}

// 使用
const box = document.getElementById('box');
const draggable = new Draggable(box, {
  container: document.getElementById('container'),
  onDragStart: (e, el) => {
    console.log('开始拖拽');
  },
  onDrag: (e, el, pos) => {
    console.log('拖拽中', pos);
  },
  onDragEnd: (e, el) => {
    console.log('结束拖拽');
  }
});
```

---

## 问题 4：如何使用 HTML5 Drag and Drop API？

### 基本使用

```html
<div id="draggable" draggable="true">拖我</div>
<div id="dropzone" class="drop-zone">放这里</div>

<script>
const draggable = document.getElementById('draggable');
const dropzone = document.getElementById('dropzone');

// 1. 开始拖拽
draggable.addEventListener('dragstart', (e) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.innerHTML);
  e.target.style.opacity = '0.5';
});

// 2. 拖拽结束
draggable.addEventListener('dragend', (e) => {
  e.target.style.opacity = '1';
});

// 3. 拖拽进入目标区域
dropzone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});

// 4. 在目标区域上方
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必须阻止默认行为才能触发 drop
  e.dataTransfer.dropEffect = 'move';
});

// 5. 离开目标区域
dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('drag-over');
});

// 6. 放下
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  
  const data = e.dataTransfer.getData('text/html');
  dropzone.innerHTML = data;
});
</script>

<style>
.drop-zone {
  width: 200px;
  height: 200px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone.drag-over {
  border-color: #4CAF50;
  background: #f0f0f0;
}
</style>
```

---

## 问题 5：如何实现拖拽排序？

### 列表拖拽排序

```javascript
class SortableList {
  constructor(container) {
    this.container = container;
    this.items = Array.from(container.children);
    this.draggedItem = null;
    
    this.init();
  }
  
  init() {
    this.items.forEach(item => {
      item.draggable = true;
      
      item.addEventListener('dragstart', this.onDragStart.bind(this));
      item.addEventListener('dragover', this.onDragOver.bind(this));
      item.addEventListener('drop', this.onDrop.bind(this));
      item.addEventListener('dragend', this.onDragEnd.bind(this));
    });
  }
  
  onDragStart(e) {
    this.draggedItem = e.target;
    e.target.style.opacity = '0.5';
  }
  
  onDragOver(e) {
    e.preventDefault();
    
    const afterElement = this.getDragAfterElement(e.clientY);
    
    if (afterElement == null) {
      this.container.appendChild(this.draggedItem);
    } else {
      this.container.insertBefore(this.draggedItem, afterElement);
    }
  }
  
  onDrop(e) {
    e.preventDefault();
  }
  
  onDragEnd(e) {
    e.target.style.opacity = '1';
    this.draggedItem = null;
  }
  
  getDragAfterElement(y) {
    const draggableElements = [
      ...this.container.querySelectorAll('[draggable="true"]:not(.dragging)')
    ];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

// 使用
const list = document.getElementById('sortable-list');
new SortableList(list);
```

---

## 总结

**核心要点**：

### 1. 原生拖拽实现
- mousedown 记录初始位置
- mousemove 计算偏移量
- mouseup 结束拖拽

### 2. 关键技术
- 位置计算（clientX/Y）
- 边界限制
- 事件委托

### 3. HTML5 Drag API
- draggable 属性
- dragstart、dragover、drop 事件
- dataTransfer 传递数据

### 4. 最佳实践
- 封装可复用的类
- 提供回调钩子
- 处理边界情况

---

## 延伸阅读

- [MDN - Drag and Drop API](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API)
- [MDN - MouseEvent](https://developer.mozilla.org/zh-CN/docs/Web/API/MouseEvent)
- [SortableJS - 拖拽排序库](https://sortablejs.github.io/Sortable/)
- [Interact.js - 拖拽交互库](https://interactjs.io/)
