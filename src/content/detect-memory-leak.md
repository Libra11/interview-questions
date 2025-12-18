---
title: 前端如何检测内存泄漏？
category: JavaScript
difficulty: 高级
updatedAt: 2025-11-16
summary: >-
  深入理解内存泄漏的原因和表现，掌握使用 Chrome DevTools 检测内存泄漏的方法，学习常见的内存泄漏场景和预防措施。
tags:
  - 内存泄漏
  - 性能优化
  - Chrome DevTools
  - 调试技巧
estimatedTime: 28 分钟
keywords:
  - 内存泄漏
  - Memory Leak
  - Heap Snapshot
  - Performance Monitor
  - 垃圾回收
highlight: 内存泄漏检测的核心是使用 Chrome DevTools 的 Memory 工具，通过堆快照和时间线分析找出未释放的对象
order: 364
---

## 问题 1：什么是内存泄漏？

内存泄漏是指**程序中已分配的内存无法被回收**，导致可用内存逐渐减少，最终可能导致程序崩溃或性能下降。

### 内存泄漏的表现

```javascript
// 内存泄漏的典型表现：
// 1. 页面越用越卡
// 2. 内存占用持续增长
// 3. 最终可能导致页面崩溃

// 示例：未清理的定时器导致内存泄漏
class Component {
  constructor() {
    this.data = new Array(1000000).fill('data'); // 大量数据
    
    // 启动定时器但从不清理
    this.timer = setInterval(() => {
      console.log('定时任务执行');
    }, 1000);
  }
  
  // 组件销毁时忘记清理定时器
  destroy() {
    // 忘记 clearInterval(this.timer)
    // 导致 this 无法被回收，内存泄漏
  }
}
```

### 垃圾回收机制

```javascript
// JavaScript 使用垃圾回收（GC）自动管理内存
// 主要算法：标记清除（Mark-and-Sweep）

// 可以被回收的情况
function example1() {
  let obj = { data: 'value' };
  // 函数执行完，obj 没有外部引用，可以被回收
}

// 不能被回收的情况
let globalObj;

function example2() {
  let obj = { data: 'value' };
  globalObj = obj; // 全局引用，不会被回收
}
```

### 内存泄漏的常见原因

```javascript
// 1. 意外的全局变量
function createLeak() {
  leakedVar = 'I am global'; // 忘记声明，创建了全局变量
}

// 2. 未清理的定时器
const timer = setInterval(() => {}, 1000);
// 忘记 clearInterval(timer)

// 3. 未清理的事件监听器
element.addEventListener('click', handler);
// 忘记 removeEventListener

// 4. 闭包引用大对象
function outer() {
  const largeData = new Array(1000000);
  return function inner() {
    console.log(largeData.length); // 持有引用
  };
}

// 5. DOM 引用未清理
const elements = [];
elements.push(document.getElementById('div'));
// 即使 DOM 被移除，elements 仍持有引用
```

---

## 问题 2：如何使用 Chrome DevTools 检测内存泄漏？

Chrome DevTools 提供了强大的内存分析工具。

### Performance Monitor

```javascript
// 实时监控内存使用情况
// 打开方式：
// 1. DevTools (F12) > Ctrl+Shift+P
// 2. 输入 "Show Performance Monitor"

// 观察指标：
// - JS heap size: JavaScript 堆内存大小
// - DOM Nodes: DOM 节点数量
// - JS event listeners: 事件监听器数量

// 示例：制造内存泄漏
const leaks = [];

function createLeak() {
  const data = new Array(100000).fill('leak');
  leaks.push(data);
  
  const div = document.createElement('div');
  document.body.appendChild(div);
}

// 每秒创建一次泄漏
setInterval(createLeak, 1000);

// 在 Performance Monitor 中观察内存持续增长
```

### Heap Snapshot（堆快照）

```javascript
// 捕获某一时刻的内存状态
// 使用步骤：
// 1. DevTools > Memory > Heap snapshot
// 2. 点击 "Take snapshot"

// 检测内存泄漏的方法：
// 1. 执行操作前拍摄快照 1
// 2. 执行操作（如创建和销毁组件）
// 3. 执行操作后拍摄快照 2
// 4. 对比两个快照，查看内存增长

// 示例：检测组件内存泄漏
class LeakyComponent {
  constructor() {
    this.data = new Array(10000).fill('data');
    this.element = document.createElement('div');
    
    // 事件监听器未清理
    this.element.addEventListener('click', () => {
      console.log('clicked');
    });
    document.body.appendChild(this.element);
  }
  
  destroy() {
    this.element.remove(); // 只移除 DOM，未清理监听器
  }
}

// 测试：创建 100 个组件后销毁
for (let i = 0; i < 100; i++) {
  const comp = new LeakyComponent();
  comp.destroy();
}
// 在快照中搜索 "LeakyComponent"，应该找到 100 个实例
```

### Allocation Timeline

```javascript
// 记录一段时间内的内存分配情况
// 使用步骤：
// 1. DevTools > Memory > Allocation instrumentation on timeline
// 2. 点击 "Start" 开始录制
// 3. 执行操作
// 4. 点击 "Stop" 停止录制

// 示例：检测定时器泄漏
function startLeakingTimer() {
  const data = new Array(100000).fill('leak');
  
  setInterval(() => {
    console.log(data.length); // 定时器持有 data 的引用
  }, 1000);
}

// 蓝色柱状图表示分配的内存
// 灰色表示已释放
// 蓝色持续存在表示泄漏
```

---

## 问题 3：如何分析堆快照找出泄漏？

堆快照提供了多种视图来分析内存使用情况。

### Summary 视图

```javascript
// 按构造函数分组显示对象
// 关键列：
// - Constructor: 构造函数名称
// - Distance: 到 GC root 的距离
// - Objects Count: 对象数量
// - Shallow Size: 对象自身大小
// - Retained Size: 对象及其引用的总大小

// 查找泄漏的方法：
// 1. 按 Retained Size 排序，找出占用内存最大的对象
// 2. 关注 Distance 较大的对象
// 3. 对比快照，查看对象数量的变化

class UserData {
  constructor(id) {
    this.id = id;
    this.data = new Array(10000).fill(`user-${id}`);
  }
}

const users = [];
for (let i = 0; i < 100; i++) {
  users.push(new UserData(i));
}

// 在 Summary 视图中搜索 "UserData"
// 可以看到 100 个实例及其内存占用
```

### Comparison 视图

```javascript
// 对比两个快照的差异
// 显示新增、删除的对象

// 使用步骤：
// 1. 拍摄快照 1（基准）
// 2. 执行操作
// 3. 拍摄快照 2
// 4. 在快照 2 中选择 "Comparison"
// 5. 选择与快照 1 对比

class Component {
  constructor(name) {
    this.name = name;
    this.data = new Array(10000).fill(name);
  }
}

// 创建并销毁组件
const components = [];
for (let i = 0; i < 50; i++) {
  components.push(new Component(`comp-${i}`));
}

components.forEach(comp => comp.destroy && comp.destroy());
components.length = 0;

// 对比快照，如果 Component 数量没有减少，说明有泄漏
```

### Containment 视图

```javascript
// 显示对象的引用关系
// 可以追踪对象为什么没有被回收

function createClosure() {
  const largeData = new Array(100000).fill('data');
  
  window.leakedFunction = function() {
    return largeData.length; // 闭包持有引用
  };
}

createClosure();

// 在 Containment 视图中：
// 1. 展开 Window 对象
// 2. 找到 leakedFunction
// 3. 展开查看其闭包（Closure）
// 4. 可以看到 largeData 被引用
```

---

## 问题 4：常见的内存泄漏场景有哪些？

了解常见场景有助于预防和快速定位问题。

### 定时器未清理

```javascript
// ❌ 问题代码
class Timer {
  start() {
    this.data = new Array(100000).fill('data');
    this.timer = setInterval(() => {
      console.log(this.data.length);
    }, 1000);
  }
  
  stop() {
    // 忘记清理定时器
  }
}

// ✅ 正确做法
class Timer {
  start() {
    this.data = new Array(100000).fill('data');
    this.timer = setInterval(() => {
      console.log(this.data.length);
    }, 1000);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

### 事件监听器未移除

```javascript
// ❌ 问题代码
class EventHandler {
  constructor() {
    this.data = new Array(100000).fill('data');
    this.button = document.getElementById('btn');
    
    // 使用箭头函数，无法正确移除
    this.button.addEventListener('click', () => {
      console.log(this.data.length);
    });
  }
}

// ✅ 正确做法
class EventHandler {
  constructor() {
    this.data = new Array(100000).fill('data');
    this.button = document.getElementById('btn');
    
    // 保存回调函数引用
    this.handleClick = this.handleClick.bind(this);
    this.button.addEventListener('click', this.handleClick);
  }
  
  handleClick() {
    console.log(this.data.length);
  }
  
  destroy() {
    if (this.button) {
      this.button.removeEventListener('click', this.handleClick);
      this.button = null;
    }
  }
}
```

### DOM 引用未清理

```javascript
// ❌ 问题代码
class DOMManager {
  constructor() {
    this.elements = [];
    
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      document.body.appendChild(div);
      this.elements.push(div); // 保存引用
    }
  }
  
  clear() {
    document.body.innerHTML = ''; // 只清空 DOM
    // 忘记清空 this.elements
  }
}

// ✅ 正确做法
class DOMManager {
  constructor() {
    this.elements = [];
    
    for (let i = 0; i < 100; i++) {
      const div = document.createElement('div');
      document.body.appendChild(div);
      this.elements.push(div);
    }
  }
  
  clear() {
    this.elements.forEach(el => el.remove());
    this.elements = []; // 清空引用数组
  }
}
```

---

## 问题 5：如何预防内存泄漏？

预防胜于治疗，养成良好的编码习惯可以避免大部分内存泄漏。

### 使用 WeakMap 和 WeakSet

```javascript
// WeakMap 的引用是弱引用，不会阻止垃圾回收

// ❌ 使用 Map 可能导致泄漏
const cache = new Map();
const div = document.createElement('div');
cache.set(div, { data: 'some data' });
div.remove(); // cache 仍持有引用

// ✅ 使用 WeakMap
const cache = new WeakMap();
const div = document.createElement('div');
cache.set(div, { data: 'some data' });
div.remove(); // div 可以被垃圾回收
```

### 及时清理资源

```javascript
// 创建统一的清理模式
class Resource {
  constructor() {
    this.timer = null;
    this.listeners = [];
    this.data = new Array(100000).fill('data');
  }
  
  init() {
    // 启动定时器
    this.timer = setInterval(() => {
      console.log('tick');
    }, 1000);
    
    // 添加事件监听
    const handler = () => console.log('click');
    document.addEventListener('click', handler);
    this.listeners.push({ type: 'click', handler });
  }
  
  // 统一的清理方法
  cleanup() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // 清理事件监听器
    this.listeners.forEach(({ type, handler }) => {
      document.removeEventListener(type, handler);
    });
    this.listeners = [];
    
    // 清理数据
    this.data = null;
  }
}
```

### 使用生命周期钩子

```javascript
// React 示例
import { useEffect } from 'react';

function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick');
    }, 1000);
    
    // 返回清理函数
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  return <div>Component</div>;
}

// Vue 示例
export default {
  mounted() {
    this.timer = setInterval(() => {
      console.log('tick');
    }, 1000);
  },
  
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
```

---

## 问题 6：如何编写内存监控工具？

可以编写简单的工具来辅助检测内存泄漏。

### 内存监控类

```javascript
class MemoryMonitor {
  constructor() {
    this.samples = [];
    this.timer = null;
  }
  
  start(interval = 1000) {
    this.timer = setInterval(() => {
      if (performance.memory) {
        const sample = {
          timestamp: Date.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
        
        this.samples.push(sample);
        
        // 只保留最近 100 个样本
        if (this.samples.length > 100) {
          this.samples.shift();
        }
      }
    }, interval);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  // 检测是否有内存泄漏趋势
  detectLeak() {
    if (this.samples.length < 10) {
      return { leak: false, message: '样本不足' };
    }
    
    const first = this.samples[0].usedJSHeapSize;
    const last = this.samples[this.samples.length - 1].usedJSHeapSize;
    const growth = last - first;
    const growthRate = growth / first;
    
    // 如果增长超过 50%，可能有泄漏
    if (growthRate > 0.5) {
      return {
        leak: true,
        message: `内存增长 ${(growthRate * 100).toFixed(2)}%`
      };
    }
    
    return { leak: false, message: '正常' };
  }
}

// 使用
const monitor = new MemoryMonitor();
monitor.start(1000);

setTimeout(() => {
  console.log('检测结果:', monitor.detectLeak());
  monitor.stop();
}, 10000);
```

---

## 问题 7：实际项目中的排查流程是什么？

系统的排查流程可以提高效率。

### 排查步骤

```javascript
// 1. 确认问题
// - 用户反馈页面卡顿
// - 内存占用持续增长

// 2. 复现问题
function reproduceIssue() {
  // 找到触发内存泄漏的操作
  for (let i = 0; i < 10; i++) {
    openModal();
    closeModal();
  }
}

// 3. 使用 Performance Monitor 观察
// - 打开 Performance Monitor
// - 执行复现步骤
// - 观察内存是否持续增长

// 4. 拍摄堆快照对比
// a. 拍摄基准快照
// b. 执行操作
// c. 强制垃圾回收（DevTools > Memory > 垃圾桶图标）
// d. 拍摄第二个快照
// e. 对比快照，找出增长的对象

// 5. 分析引用链
// 在快照中找到泄漏的对象
// 查看其引用链，找出为什么没有被回收

// 6. 修复问题
// 根据引用链找到代码位置，添加清理逻辑

// 7. 验证修复
// 重新执行步骤 2-4，确认内存不再增长
```

### 实际案例

```javascript
// 案例：Modal 组件内存泄漏

// ❌ 有问题的代码
class Modal {
  constructor() {
    this.overlay = document.createElement('div');
    
    // 问题：事件监听器未清理
    this.overlay.addEventListener('click', () => {
      this.close();
    });
    
    // 问题：定时器未清理
    this.timer = setInterval(() => {
      console.log('update');
    }, 1000);
    
    document.body.appendChild(this.overlay);
  }
  
  close() {
    this.overlay.remove(); // 只移除 DOM
  }
}

// ✅ 修复后的代码
class Modal {
  constructor() {
    this.overlay = document.createElement('div');
    
    this.handleClick = this.handleClick.bind(this);
    this.overlay.addEventListener('click', this.handleClick);
    
    this.timer = setInterval(() => {
      console.log('update');
    }, 1000);
    
    document.body.appendChild(this.overlay);
  }
  
  handleClick() {
    this.close();
  }
  
  close() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // 清理事件监听器
    this.overlay.removeEventListener('click', this.handleClick);
    
    // 移除 DOM
    this.overlay.remove();
    this.overlay = null;
  }
}
```

---

## 总结

**内存泄漏检测的核心要点**：

### 1. 基本概念
- 内存泄漏是已分配的内存无法被回收
- 表现为内存持续增长、页面卡顿
- JavaScript 使用垃圾回收自动管理内存

### 2. 检测工具
- **Performance Monitor**：实时监控内存使用
- **Heap Snapshot**：捕获内存快照，对比分析
- **Allocation Timeline**：记录内存分配情况

### 3. 分析方法
- Summary 视图：按构造函数分组查看对象
- Comparison 视图：对比快照差异
- Containment 视图：追踪引用链

### 4. 常见场景
- 定时器未清理
- 事件监听器未移除
- DOM 引用未清理
- 闭包引用大对象
- 全局变量累积

### 5. 预防措施
- 使用 WeakMap/WeakSet
- 及时清理资源
- 使用生命周期钩子
- 避免意外的全局变量

### 6. 排查流程
- 确认问题 > 复现问题 > 使用工具观察
- 拍摄快照对比 > 分析引用链
- 修复问题 > 验证修复

## 延伸阅读

- [Chrome DevTools - Memory](https://developer.chrome.com/docs/devtools/memory-problems/)
- [JavaScript 内存管理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)
- [4 Types of Memory Leaks](https://auth0.com/blog/four-types-of-leaks-in-your-javascript-code-and-how-to-get-rid-of-them/)
- [内存泄漏排查实战](https://juejin.cn/post/6947841638118998029)
