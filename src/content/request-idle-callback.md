---
title: requestIdleCallback API 的作用和使用场景
category: 浏览器
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  了解 requestIdleCallback API 的工作原理，掌握如何利用浏览器空闲时间执行低优先级任务，优化页面性能
tags:
  - 浏览器API
  - 性能优化
  - 任务调度
  - requestIdleCallback
estimatedTime: 20 分钟
keywords:
  - requestIdleCallback
  - 空闲时间
  - 任务调度
  - 性能优化
  - React Fiber
highlight: requestIdleCallback 让开发者能在浏览器空闲时执行低优先级任务，避免阻塞主线程
order: 96
---

## 问题 1：requestIdleCallback 是什么？

### 基本概念

`requestIdleCallback` 允许在浏览器空闲时执行回调函数，不会影响关键的渲染和交互任务。

```javascript
// 基本用法
requestIdleCallback((deadline) => {
  console.log('浏览器空闲了');
  console.log('剩余时间:', deadline.timeRemaining()); // 毫秒
  console.log('是否超时:', deadline.didTimeout);
});
```

### 浏览器的一帧

```javascript
// 浏览器一帧（16.6ms @ 60fps）的工作流程：
// 1. 处理用户输入事件
// 2. 执行 JavaScript
// 3. requestAnimationFrame 回调
// 4. 布局（Layout）
// 5. 绘制（Paint）
// 6. 空闲时间 ← requestIdleCallback 在这里执行
```

### 与 setTimeout 的区别

```javascript
// setTimeout：指定时间后执行，可能阻塞渲染
setTimeout(() => {
  // 可能在渲染过程中执行，导致卡顿
  heavyTask();
}, 100);

// requestIdleCallback：在空闲时执行，不阻塞渲染
requestIdleCallback((deadline) => {
  // 只在浏览器空闲时执行
  if (deadline.timeRemaining() > 0) {
    heavyTask();
  }
});
```

---

## 问题 2：如何使用 requestIdleCallback？

### 基本使用

```javascript
function doWork(deadline) {
  // 检查剩余时间
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    task();
  }
  
  // 如果还有任务，继续调度
  if (tasks.length > 0) {
    requestIdleCallback(doWork);
  }
}

requestIdleCallback(doWork);
```

### 设置超时时间

```javascript
// 最多等待 2 秒，超时后强制执行
requestIdleCallback((deadline) => {
  if (deadline.didTimeout) {
    console.log('超时了，强制执行');
  }
  
  doWork();
}, { timeout: 2000 });
```

### 取消调度

```javascript
const handle = requestIdleCallback((deadline) => {
  console.log('执行任务');
});

// 取消调度
cancelIdleCallback(handle);
```

---

## 问题 3：有哪些实际应用场景？

### 1. 分片处理大数据

```javascript
// 处理大量数据，避免阻塞主线程
function processLargeData(data) {
  const chunks = [];
  const chunkSize = 100;
  
  // 分片
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  // 空闲时处理
  function processChunk(deadline) {
    while (deadline.timeRemaining() > 0 && chunks.length > 0) {
      const chunk = chunks.shift();
      
      // 处理这一批数据
      chunk.forEach(item => {
        // 处理逻辑
        processItem(item);
      });
    }
    
    // 继续处理剩余数据
    if (chunks.length > 0) {
      requestIdleCallback(processChunk);
    } else {
      console.log('所有数据处理完成');
    }
  }
  
  requestIdleCallback(processChunk);
}

// 使用
const largeData = Array.from({ length: 10000 }, (_, i) => i);
processLargeData(largeData);
```

### 2. 预加载资源

```javascript
// 在空闲时预加载图片
function preloadImages(urls) {
  const images = [];
  
  function loadNext(deadline) {
    while (deadline.timeRemaining() > 0 && urls.length > 0) {
      const url = urls.shift();
      const img = new Image();
      img.src = url;
      images.push(img);
      
      console.log('预加载:', url);
    }
    
    if (urls.length > 0) {
      requestIdleCallback(loadNext);
    }
  }
  
  requestIdleCallback(loadNext);
}

// 使用
preloadImages([
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg'
]);
```

### 3. 日志上报

```javascript
// 批量上报日志
class Logger {
  constructor() {
    this.logs = [];
    this.maxBatchSize = 10;
    this.scheduleFlush();
  }
  
  log(message) {
    this.logs.push({
      message,
      timestamp: Date.now()
    });
    
    // 达到批量大小，立即上报
    if (this.logs.length >= this.maxBatchSize) {
      this.flush();
    }
  }
  
  scheduleFlush() {
    requestIdleCallback((deadline) => {
      if (this.logs.length > 0) {
        this.flush();
      }
      
      // 继续调度
      this.scheduleFlush();
    }, { timeout: 5000 }); // 最多等待 5 秒
  }
  
  flush() {
    if (this.logs.length === 0) return;
    
    const batch = this.logs.splice(0, this.maxBatchSize);
    
    // 上报到服务器
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(batch)
    });
  }
}

const logger = new Logger();
logger.log('用户点击了按钮');
```

### 4. 非关键 DOM 操作

```javascript
// 延迟渲染非关键内容
function renderLowPriorityContent() {
  const container = document.getElementById('low-priority');
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
  
  function render(deadline) {
    while (deadline.timeRemaining() > 0 && items.length > 0) {
      const item = items.shift();
      const div = document.createElement('div');
      div.textContent = item;
      container.appendChild(div);
    }
    
    if (items.length > 0) {
      requestIdleCallback(render);
    }
  }
  
  requestIdleCallback(render);
}

// 页面加载后执行
window.addEventListener('load', () => {
  renderLowPriorityContent();
});
```

---

## 问题 4：如何实现兼容性降级？

### Polyfill 实现

```javascript
// 简单的 polyfill
window.requestIdleCallback = window.requestIdleCallback || function(callback) {
  const start = Date.now();
  
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => {
        return Math.max(0, 50 - (Date.now() - start));
      }
    });
  }, 1);
};

window.cancelIdleCallback = window.cancelIdleCallback || function(id) {
  clearTimeout(id);
};
```

### 封装工具函数

```javascript
// 封装一个更健壮的版本
function scheduleIdleTask(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  } else {
    // 降级到 setTimeout
    const timeout = options.timeout || 0;
    return setTimeout(() => {
      const start = Date.now();
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, timeout);
  }
}

function cancelIdleTask(handle) {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

// 使用
const handle = scheduleIdleTask((deadline) => {
  console.log('执行任务');
});
```

---

## 问题 5：使用时需要注意什么？

### 1. 不要执行 DOM 修改

```javascript
// ❌ 错误：在 requestIdleCallback 中修改 DOM
requestIdleCallback(() => {
  // 可能导致布局抖动
  document.body.style.backgroundColor = 'red';
});

// ✅ 正确：使用 requestAnimationFrame
requestAnimationFrame(() => {
  document.body.style.backgroundColor = 'red';
});
```

### 2. 控制任务粒度

```javascript
// ❌ 错误：单个任务耗时太长
requestIdleCallback((deadline) => {
  // 执行 100ms 的任务，超过了空闲时间
  heavyTask(); // 100ms
});

// ✅ 正确：检查剩余时间，分批执行
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    task(); // 每个任务很短
  }
  
  if (tasks.length > 0) {
    requestIdleCallback(arguments.callee);
  }
});
```

### 3. 设置合理的超时时间

```javascript
// 对于重要但不紧急的任务，设置超时时间
requestIdleCallback((deadline) => {
  if (deadline.didTimeout) {
    // 超时了，必须执行
    console.log('超时强制执行');
  }
  
  importantButNotUrgentTask();
}, { timeout: 2000 }); // 最多等待 2 秒
```

### 4. React Fiber 的应用

```javascript
// React Fiber 使用类似的思想
// 将渲染工作分成小块，在空闲时执行
function workLoop(deadline) {
  let shouldYield = false;
  
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  }
}

requestIdleCallback(workLoop);
```

---

## 总结

**核心要点**：

### 1. 作用
- 在浏览器空闲时执行任务
- 不阻塞关键渲染和交互
- 提高页面响应性

### 2. 适用场景
- 大数据分片处理
- 资源预加载
- 日志上报
- 非关键 DOM 操作

### 3. 注意事项
- 不要执行 DOM 修改
- 控制任务粒度
- 设置合理超时
- 做好兼容性处理

### 4. 与其他 API 的关系
- requestAnimationFrame：下一帧渲染前执行
- setTimeout：指定时间后执行
- requestIdleCallback：空闲时执行

---

## 延伸阅读

- [MDN - requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)
- [Using requestIdleCallback](https://developers.google.com/web/updates/2015/08/using-requestidlecallback)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
- [Idle Until Urgent](https://philipwalton.com/articles/idle-until-urgent/)
