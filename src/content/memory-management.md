---
title: JavaScript 如何做内存管理？
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 的内存管理机制，掌握垃圾回收算法、内存泄漏的识别与预防，学会优化内存使用提升应用性能。
tags:
  - 内存管理
  - 垃圾回收
  - 内存泄漏
  - 性能优化
estimatedTime: 40 分钟
keywords:
  - 内存管理
  - 垃圾回收
  - 内存泄漏
  - 标记清除
highlight: 掌握 JavaScript 内存管理原理，能够识别和预防内存泄漏，优化应用的内存使用
order: 39
---

## 问题 1：JavaScript 内存管理的基本概念

**内存生命周期**

JavaScript 中的内存管理遵循三个基本步骤：

1. **分配内存**：为变量、对象、函数等分配内存空间
2. **使用内存**：读取和写入已分配的内存
3. **释放内存**：当内存不再需要时，通过垃圾回收释放

```javascript
// 1. 分配内存
let number = 42; // 为数字分配内存
let string = "Hello"; // 为字符串分配内存
let object = { x: 1 }; // 为对象分配内存
let array = [1, 2, 3]; // 为数组分配内存

// 2. 使用内存
console.log(number); // 读取内存
object.y = 2; // 写入内存

// 3. 释放内存（自动进行）
number = null; // 标记为可回收
object = null; // 标记为可回收
// 垃圾回收器会在适当时机释放这些内存
```

**内存分配方式**：

```javascript
// 栈内存分配（基本类型）
let a = 10; // 直接在栈中存储值
let b = true; // 直接在栈中存储值
let c = "text"; // 字符串（小字符串可能在栈中）

// 堆内存分配（引用类型）
let obj = {}; // 对象在堆中，栈中存储引用
let arr = []; // 数组在堆中，栈中存储引用
let func = function () {}; // 函数在堆中，栈中存储引用

// 内存分配示例
function createObjects() {
  // 每次调用都会分配新的内存
  return {
    data: new Array(1000).fill(0),
    timestamp: Date.now(),
    id: Math.random(),
  };
}

const objects = [];
for (let i = 0; i < 100; i++) {
  objects.push(createObjects()); // 分配大量内存
}
```

---

## 问题 2：垃圾回收机制

### 标记清除算法（Mark and Sweep）

**现代 JavaScript 引擎的主要垃圾回收算法**：

```javascript
// 标记清除算法的工作原理

// 1. 标记阶段：从根对象开始，标记所有可达的对象
function markPhase() {
  // 从全局对象、执行栈等根对象开始
  // 递归标记所有可以访问到的对象
}

// 2. 清除阶段：清除所有未标记的对象
function sweepPhase() {
  // 遍历堆中的所有对象
  // 释放未标记的对象的内存
}

// 示例：可达性分析
let obj1 = { name: "Object 1" };
let obj2 = { name: "Object 2" };
let obj3 = { name: "Object 3" };

obj1.ref = obj2; // obj1 引用 obj2
obj2.ref = obj3; // obj2 引用 obj3

// 此时 obj1, obj2, obj3 都是可达的

obj1 = null; // 断开对 obj1 的引用

// 如果没有其他引用指向原来的 obj1，
// 那么整个引用链 obj1 -> obj2 -> obj3 都变成不可达
// 垃圾回收器会回收这些对象
```

### 引用计数算法（已废弃）

```javascript
// 引用计数算法的问题：循环引用

function createCircularReference() {
  let obj1 = {};
  let obj2 = {};

  obj1.ref = obj2; // obj2 的引用计数 +1
  obj2.ref = obj1; // obj1 的引用计数 +1

  return obj1;
}

let circular = createCircularReference();
circular = null; // 断开外部引用

// 在引用计数算法下，obj1 和 obj2 仍然互相引用
// 引用计数都不为 0，无法被回收，造成内存泄漏

// 现代引擎使用标记清除算法，可以正确处理循环引用
```

### 分代垃圾回收

```javascript
// V8 引擎使用分代垃圾回收

// 新生代（Young Generation）
// - 存储新创建的对象
// - 使用 Scavenge 算法（复制算法）
// - 回收频率高，速度快

function createShortLivedObjects() {
  // 这些对象通常很快就不再使用
  let temp1 = { data: "temporary" };
  let temp2 = [1, 2, 3, 4, 5];
  let temp3 = function () {
    return "temp";
  };

  // 函数结束后，这些对象很可能被回收
  return temp1.data;
}

// 老生代（Old Generation）
// - 存储长期存在的对象
// - 使用标记清除和标记整理算法
// - 回收频率低，但更彻底

let longLivedObject = {
  cache: new Map(),
  config: {
    /* 大量配置 */
  },
  eventListeners: [],
};

// 这个对象可能会被移动到老生代
```

---

## 问题 3：内存泄漏的常见原因

### 原因 1：全局变量

```javascript
// ❌ 意外的全局变量
function createGlobalLeak() {
  // 忘记使用 var/let/const，创建了全局变量
  accidentalGlobal = "This is a memory leak";

  // 在严格模式下会报错，但在非严格模式下会创建全局变量
}

createGlobalLeak();
// accidentalGlobal 现在是全局变量，不会被回收

// ✅ 正确做法
function createNoLeak() {
  "use strict";
  let localVariable = "This will be garbage collected";
  return localVariable;
}

// ❌ 过度使用全局变量
window.globalCache = {};
window.globalData = new Array(1000000);
window.globalConfig = {
  /* 大量数据 */
};

// ✅ 使用模块化或命名空间
const MyApp = {
  cache: new Map(),
  data: [],
  config: {},
};
```

### 原因 2：未清理的定时器

```javascript
// ❌ 未清理的定时器
function startTimer() {
  let largeData = new Array(1000000).fill("data");

  setInterval(() => {
    // 即使不使用 largeData，闭包也会保持对它的引用
    console.log("Timer tick");
  }, 1000);

  // largeData 永远不会被回收
}

startTimer();

// ✅ 正确清理定时器
function startTimerCorrect() {
  let largeData = new Array(1000000).fill("data");

  const timerId = setInterval(() => {
    console.log("Timer tick");
  }, 1000);

  // 提供清理方法
  return function cleanup() {
    clearInterval(timerId);
    largeData = null; // 帮助垃圾回收
  };
}

const cleanup = startTimerCorrect();
// 在适当时机调用清理
setTimeout(cleanup, 10000);
```

### 原因 3：DOM 引用

```javascript
// ❌ DOM 引用导致的内存泄漏
let elements = [];

function addElements() {
  for (let i = 0; i < 100; i++) {
    let element = document.createElement("div");
    element.innerHTML = `Element ${i}`;
    document.body.appendChild(element);

    // 保存 DOM 引用
    elements.push(element);
  }
}

function removeElements() {
  // 从 DOM 中移除元素
  elements.forEach((element) => {
    element.parentNode.removeChild(element);
  });

  // 但是 elements 数组仍然保持对这些 DOM 元素的引用
  // 这些元素无法被垃圾回收
}

// ✅ 正确清理 DOM 引用
function removeElementsCorrect() {
  elements.forEach((element) => {
    element.parentNode.removeChild(element);
  });

  // 清空数组，释放引用
  elements.length = 0;
  // 或者 elements = [];
}
```

### 原因 4：闭包引用

```javascript
// ❌ 闭包导致的内存泄漏
function createClosure() {
  let largeData = new Array(1000000).fill("data");
  let smallData = "small";

  return function () {
    // 只使用 smallData，但闭包会保持对整个作用域的引用
    return smallData;
  };
}

let closure = createClosure();
// largeData 无法被回收，因为闭包保持了对它的引用

// ✅ 避免不必要的闭包引用
function createClosureCorrect() {
  let largeData = new Array(1000000).fill("data");
  let smallData = "small";

  // 处理完 largeData 后立即清理
  processLargeData(largeData);
  largeData = null;

  return function () {
    return smallData; // 现在只引用 smallData
  };
}
```

### 原因 5：事件监听器

```javascript
// ❌ 未移除的事件监听器
class Component {
  constructor() {
    this.data = new Array(1000000).fill("data");

    // 添加事件监听器
    document.addEventListener("click", this.handleClick.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleClick() {
    // 处理点击事件
    console.log(this.data.length);
  }

  handleResize() {
    // 处理窗口大小改变
  }

  // 没有提供清理方法
}

// ✅ 正确管理事件监听器
class ComponentCorrect {
  constructor() {
    this.data = new Array(1000000).fill("data");

    // 保存绑定的函数引用，以便后续移除
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleResize = this.handleResize.bind(this);

    document.addEventListener("click", this.boundHandleClick);
    window.addEventListener("resize", this.boundHandleResize);
  }

  handleClick() {
    console.log(this.data.length);
  }

  handleResize() {
    // 处理窗口大小改变
  }

  destroy() {
    // 移除事件监听器
    document.removeEventListener("click", this.boundHandleClick);
    window.removeEventListener("resize", this.boundHandleResize);

    // 清理数据
    this.data = null;
  }
}
```

---

## 问题 4：内存泄漏的检测和调试

### 使用浏览器开发者工具

```javascript
// 内存泄漏检测示例
class MemoryLeakDemo {
  constructor() {
    this.leakyArray = [];
    this.startLeaking();
  }

  startLeaking() {
    // 模拟内存泄漏
    setInterval(() => {
      // 不断向数组添加数据，但从不清理
      this.leakyArray.push(new Array(1000).fill("leak"));
    }, 100);
  }

  // 在浏览器控制台中运行以下代码来监控内存
  static monitorMemory() {
    if (performance.memory) {
      console.log("Used:", performance.memory.usedJSHeapSize);
      console.log("Total:", performance.memory.totalJSHeapSize);
      console.log("Limit:", performance.memory.jsHeapSizeLimit);
    }
  }
}

// 创建内存泄漏实例
const leakDemo = new MemoryLeakDemo();

// 定期监控内存使用
setInterval(() => {
  MemoryLeakDemo.monitorMemory();
}, 1000);
```

### 内存分析工具

```javascript
// 使用 WeakMap 和 WeakSet 避免内存泄漏
class CacheManager {
  constructor() {
    // 使用 WeakMap，当 key 对象被回收时，对应的缓存也会被回收
    this.cache = new WeakMap();
    this.metadata = new WeakSet();
  }

  setCache(obj, data) {
    this.cache.set(obj, data);
    this.metadata.add(obj);
  }

  getCache(obj) {
    return this.cache.get(obj);
  }

  hasCache(obj) {
    return this.cache.has(obj);
  }
}

// 使用示例
const cacheManager = new CacheManager();
let obj = { id: 1 };

cacheManager.setCache(obj, { result: "cached data" });
console.log(cacheManager.getCache(obj)); // { result: 'cached data' }

obj = null; // 当 obj 被回收时，缓存也会自动清理
```

### 内存使用优化

```javascript
// 对象池模式，减少内存分配
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }

  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  size() {
    return this.pool.length;
  }
}

// 使用对象池
const vectorPool = new ObjectPool(
  () => ({ x: 0, y: 0, z: 0 }), // 创建函数
  (obj) => {
    obj.x = 0;
    obj.y = 0;
    obj.z = 0;
  }, // 重置函数
  50 // 初始大小
);

function processVectors() {
  const vectors = [];

  // 从对象池获取对象
  for (let i = 0; i < 100; i++) {
    const vector = vectorPool.acquire();
    vector.x = Math.random();
    vector.y = Math.random();
    vector.z = Math.random();
    vectors.push(vector);
  }

  // 处理向量...

  // 将对象返回到池中
  vectors.forEach((vector) => {
    vectorPool.release(vector);
  });
}
```

---

## 问题 5：内存优化最佳实践

### 实践 1：及时清理引用

```javascript
// ✅ 及时清理不需要的引用
class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.listeners = [];
    this.timers = [];
  }

  process(data) {
    // 处理数据
    const result = this.heavyComputation(data);

    // 缓存结果，但设置过期时间
    this.cache.set(data.id, {
      result,
      timestamp: Date.now(),
    });

    // 定期清理过期缓存
    this.scheduleCleanup();

    return result;
  }

  scheduleCleanup() {
    const timerId = setTimeout(() => {
      this.cleanupExpiredCache();
    }, 60000); // 1分钟后清理

    this.timers.push(timerId);
  }

  cleanupExpiredCache() {
    const now = Date.now();
    const expireTime = 5 * 60 * 1000; // 5分钟过期

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > expireTime) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    // 清理所有资源
    this.cache.clear();

    this.listeners.forEach((listener) => {
      listener.remove();
    });
    this.listeners.length = 0;

    this.timers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.timers.length = 0;
  }

  heavyComputation(data) {
    // 模拟重计算
    return data.value * 2;
  }
}
```

### 实践 2：使用适当的数据结构

```javascript
// 根据使用场景选择合适的数据结构

// ✅ 使用 Set 进行快速查找
class UniqueItemManager {
  constructor() {
    this.items = new Set(); // O(1) 查找
  }

  addItem(item) {
    this.items.add(item);
  }

  hasItem(item) {
    return this.items.has(item); // 比数组的 includes 更快
  }

  removeItem(item) {
    return this.items.delete(item);
  }
}

// ✅ 使用 Map 进行键值对存储
class KeyValueCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    // 实现 LRU 缓存
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // 移到最后（最近使用）
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
}
```

### 实践 3：避免内存碎片

```javascript
// ✅ 预分配内存，避免频繁的内存分配和释放
class BufferManager {
  constructor(bufferSize = 1024 * 1024) {
    // 1MB
    this.buffer = new ArrayBuffer(bufferSize);
    this.view = new DataView(this.buffer);
    this.offset = 0;
  }

  allocate(size) {
    if (this.offset + size > this.buffer.byteLength) {
      throw new Error("Buffer overflow");
    }

    const start = this.offset;
    this.offset += size;

    return {
      buffer: this.buffer,
      start: start,
      size: size,
      view: new DataView(this.buffer, start, size),
    };
  }

  reset() {
    this.offset = 0; // 重置缓冲区
  }

  getUsage() {
    return {
      used: this.offset,
      total: this.buffer.byteLength,
      percentage: (this.offset / this.buffer.byteLength) * 100,
    };
  }
}

// 使用示例
const bufferManager = new BufferManager();

function processLargeData(dataArray) {
  // 重置缓冲区
  bufferManager.reset();

  dataArray.forEach((data, index) => {
    try {
      const allocation = bufferManager.allocate(data.length);
      // 使用分配的内存处理数据
      // ...
    } catch (error) {
      console.warn("Buffer full, processing in chunks");
      // 处理缓冲区满的情况
    }
  });
}
```

### 实践 4：监控内存使用

```javascript
// 内存监控工具
class MemoryMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 5000; // 5秒
    this.threshold = options.threshold || 50 * 1024 * 1024; // 50MB
    this.callbacks = {
      warning: options.onWarning || (() => {}),
      critical: options.onCritical || (() => {}),
    };

    this.isMonitoring = false;
    this.history = [];
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorLoop();
  }

  stop() {
    this.isMonitoring = false;
  }

  monitorLoop() {
    if (!this.isMonitoring) return;

    const memInfo = this.getMemoryInfo();
    this.history.push({
      ...memInfo,
      timestamp: Date.now(),
    });

    // 保持历史记录在合理范围内
    if (this.history.length > 100) {
      this.history.shift();
    }

    // 检查内存使用情况
    this.checkMemoryUsage(memInfo);

    setTimeout(() => this.monitorLoop(), this.interval);
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  checkMemoryUsage(memInfo) {
    if (!memInfo) return;

    const usagePercentage = (memInfo.used / memInfo.limit) * 100;

    if (usagePercentage > 80) {
      this.callbacks.critical(memInfo, usagePercentage);
    } else if (usagePercentage > 60) {
      this.callbacks.warning(memInfo, usagePercentage);
    }
  }

  getReport() {
    if (this.history.length === 0) return null;

    const latest = this.history[this.history.length - 1];
    const oldest = this.history[0];

    return {
      current: latest,
      trend: {
        used: latest.used - oldest.used,
        total: latest.total - oldest.total,
        timespan: latest.timestamp - oldest.timestamp,
      },
      average: {
        used:
          this.history.reduce((sum, item) => sum + item.used, 0) /
          this.history.length,
        total:
          this.history.reduce((sum, item) => sum + item.total, 0) /
          this.history.length,
      },
    };
  }
}

// 使用内存监控
const monitor = new MemoryMonitor({
  interval: 3000,
  onWarning: (memInfo, percentage) => {
    console.warn(`Memory usage warning: ${percentage.toFixed(2)}%`);
  },
  onCritical: (memInfo, percentage) => {
    console.error(`Critical memory usage: ${percentage.toFixed(2)}%`);
    // 触发内存清理
    triggerMemoryCleanup();
  },
});

function triggerMemoryCleanup() {
  // 强制垃圾回收（仅在开发环境）
  if (window.gc) {
    window.gc();
  }

  // 清理应用缓存
  clearApplicationCaches();
}

function clearApplicationCaches() {
  // 清理各种缓存
  // ...
}

monitor.start();
```

---

## 总结

**JavaScript 内存管理的关键点**：

### 1. 内存生命周期

- **分配**：自动为变量和对象分配内存
- **使用**：读写内存中的数据
- **释放**：通过垃圾回收自动释放不再使用的内存

### 2. 垃圾回收机制

- **标记清除**：现代引擎的主要算法，能处理循环引用
- **分代回收**：新生代和老生代分别优化
- **增量回收**：避免长时间阻塞主线程

### 3. 内存泄漏的主要原因

- **全局变量**：意外创建或过度使用
- **定时器**：未清理的 setInterval/setTimeout
- **DOM 引用**：移除 DOM 后仍保持引用
- **闭包**：不必要的作用域引用
- **事件监听器**：未移除的事件监听器

### 4. 优化策略

- **及时清理**：主动设置为 null，清理引用
- **使用 WeakMap/WeakSet**：避免强引用
- **对象池**：重用对象，减少分配
- **合适的数据结构**：根据场景选择 Map、Set 等
- **内存监控**：定期检查内存使用情况

### 5. 最佳实践

- 避免全局变量污染
- 及时清理定时器和事件监听器
- 使用模块化管理作用域
- 实现资源清理方法
- 定期进行内存分析和优化

理解 JavaScript 内存管理有助于编写更高效、更稳定的应用程序，特别是在长时间运行的单页应用中。
