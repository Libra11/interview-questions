---
title: 如何在渲染进程中进行重计算优化？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 渲染进程中优化重计算的方法，包括 Web Worker、防抖节流和虚拟化。
tags:
  - Electron
  - 性能优化
  - 渲染进程
  - Web Worker
estimatedTime: 12 分钟
keywords:
  - 重计算优化
  - Web Worker
  - 防抖节流
highlight: 将重计算移到 Web Worker，使用防抖节流和虚拟化技术优化渲染性能
order: 49
---

## 问题 1：如何使用 Web Worker？

### 创建 Worker

```javascript
// worker.js
self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {
    case "heavyCalculation":
      const result = performHeavyCalculation(data);
      self.postMessage({ type: "result", data: result });
      break;
  }
};

function performHeavyCalculation(data) {
  // 耗时计算
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    result += Math.sqrt(data[i]);
  }
  return result;
}
```

### 使用 Worker

```javascript
// renderer.js
const worker = new Worker("worker.js");

worker.onmessage = (e) => {
  const { type, data } = e.data;
  if (type === "result") {
    console.log("计算结果:", data);
    updateUI(data);
  }
};

// 发送任务
function calculate(data) {
  worker.postMessage({ type: "heavyCalculation", data });
}
```

---

## 问题 2：如何使用防抖和节流？

### 防抖（Debounce）

```javascript
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 搜索输入
const search = debounce((query) => {
  performSearch(query);
}, 300);

input.addEventListener("input", (e) => {
  search(e.target.value);
});
```

### 节流（Throttle）

```javascript
function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 滚动处理
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener("scroll", handleScroll);
```

---

## 问题 3：如何优化列表渲染？

### 虚拟列表

```javascript
// 简单的虚拟列表实现
class VirtualList {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;

    this.render();
    container.addEventListener("scroll", () => this.render());
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.items.length
    );

    // 只渲染可见项
    const visibleItems = this.items.slice(startIndex, endIndex);

    this.container.innerHTML = `
      <div style="height: ${startIndex * this.itemHeight}px"></div>
      ${visibleItems
        .map(
          (item) => `<div style="height: ${this.itemHeight}px">${item}</div>`
        )
        .join("")}
      <div style="height: ${
        (this.items.length - endIndex) * this.itemHeight
      }px"></div>
    `;
  }
}
```

---

## 问题 4：如何使用 requestAnimationFrame？

```javascript
// 批量 DOM 更新
let pendingUpdates = [];
let rafId = null;

function scheduleUpdate(update) {
  pendingUpdates.push(update);

  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      // 批量执行更新
      pendingUpdates.forEach((fn) => fn());
      pendingUpdates = [];
      rafId = null;
    });
  }
}

// 使用
function updateElement(el, value) {
  scheduleUpdate(() => {
    el.textContent = value;
  });
}
```

---

## 问题 5：使用 requestIdleCallback

```javascript
// 在空闲时执行低优先级任务
const tasks = [];

function addTask(task) {
  tasks.push(task);
  scheduleWork();
}

function scheduleWork() {
  requestIdleCallback((deadline) => {
    while (deadline.timeRemaining() > 0 && tasks.length > 0) {
      const task = tasks.shift();
      task();
    }

    if (tasks.length > 0) {
      scheduleWork();
    }
  });
}

// 使用
addTask(() => processData(chunk1));
addTask(() => processData(chunk2));
```

### 分片处理大数据

```javascript
function processInChunks(data, chunkSize, processor) {
  let index = 0;

  function processChunk() {
    const chunk = data.slice(index, index + chunkSize);
    processor(chunk);
    index += chunkSize;

    if (index < data.length) {
      requestIdleCallback(processChunk);
    }
  }

  requestIdleCallback(processChunk);
}

// 使用
processInChunks(largeArray, 100, (chunk) => {
  chunk.forEach((item) => renderItem(item));
});
```

## 延伸阅读

- [Web Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Workers_API)
- [requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)
- [虚拟列表原理](https://github.com/bvaughn/react-window)
