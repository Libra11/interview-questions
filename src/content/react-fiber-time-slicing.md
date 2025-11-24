---
title: React Fiber 是如何实现时间切片的
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Fiber 架构中时间切片的实现原理。时间切片是 React 实现并发渲染的核心机制，
  通过将渲染工作分割成小块，使得 React 能够在保持响应性的同时完成复杂的更新。
tags:
  - React
  - Fiber
  - 时间切片
  - 并发渲染
estimatedTime: 28 分钟
keywords:
  - React Fiber
  - 时间切片
  - requestIdleCallback
  - Scheduler
highlight: Fiber 通过可中断的工作循环和优先级调度实现时间切片
order: 108
---

## 问题 1：什么是时间切片？

**时间切片是将长任务分割成多个小任务，在浏览器空闲时执行的技术**。

React 使用时间切片来避免长时间阻塞主线程，保持应用的响应性。

### 传统渲染的问题

```jsx
// 假设有一个大列表
function BigList() {
  const items = new Array(10000).fill(0);
  
  return (
    <ul>
      {items.map((_, i) => (
        <li key={i}>Item {i}</li>
      ))}
    </ul>
  );
}

// 问题：一次性渲染 10000 个元素会阻塞主线程
// 用户点击、输入等操作会卡顿
```

### 时间切片的解决方案

```
传统渲染：
[========== 长任务 ==========] 阻塞主线程
                              ↑ 用户操作被阻塞

时间切片：
[任务1] [空闲] [任务2] [空闲] [任务3] [空闲]
        ↑ 可以响应用户操作
```

---

## 问题 2：Fiber 如何实现可中断的渲染？

**Fiber 将渲染工作组织成链表结构，可以随时暂停和恢复**。

### Fiber 节点结构

```javascript
function FiberNode(tag, pendingProps, key) {
  // 节点类型
  this.tag = tag;
  this.key = key;
  
  // 节点关系
  this.return = null;     // 父节点
  this.child = null;      // 第一个子节点
  this.sibling = null;    // 下一个兄弟节点
  
  // 工作相关
  this.alternate = null;  // 对应的旧 Fiber
  this.effectTag = null;  // 副作用标记
  
  // 调度相关
  this.expirationTime = 0;  // 过期时间
}
```

### 工作循环

```javascript
// 简化的工作循环
function workLoop(deadline) {
  // shouldYield 检查是否需要让出控制权
  let shouldYield = false;
  
  while (nextUnitOfWork && !shouldYield) {
    // 执行一个工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    
    // 检查是否还有剩余时间
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  if (nextUnitOfWork) {
    // 还有工作，继续调度
    requestIdleCallback(workLoop);
  } else {
    // 工作完成，提交更新
    commitRoot();
  }
}

// 开始调度
requestIdleCallback(workLoop);
```

---

## 问题 3：performUnitOfWork 做了什么？

**performUnitOfWork 处理单个 Fiber 节点，并返回下一个要处理的节点**。

### 工作单元的执行

```javascript
function performUnitOfWork(fiber) {
  // 1. 开始处理当前节点
  beginWork(fiber);
  
  // 2. 如果有子节点，返回子节点
  if (fiber.child) {
    return fiber.child;
  }
  
  // 3. 没有子节点，完成当前节点
  let nextFiber = fiber;
  while (nextFiber) {
    completeWork(nextFiber);
    
    // 4. 如果有兄弟节点，返回兄弟节点
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    
    // 5. 没有兄弟节点，返回父节点
    nextFiber = nextFiber.return;
  }
  
  // 6. 所有节点处理完成
  return null;
}
```

### 遍历顺序示例

```
组件树：
    App
   /   \
  A     B
 / \     \
C   D     E

遍历顺序（深度优先）：
App -> A -> C -> D -> B -> E

每个节点都是一个工作单元，可以在任意节点暂停
```

---

## 问题 4：React 如何判断是否需要中断？

**React 使用 Scheduler 来管理任务优先级和时间分配**。

### Scheduler 的工作原理

```javascript
// React 的 Scheduler（简化版）
const Scheduler = {
  // 当前帧的截止时间
  frameDeadline: 0,
  
  // 每帧的时间（约 16.6ms）
  frameInterval: 1000 / 60,
  
  // 检查是否应该让出控制权
  shouldYield() {
    return getCurrentTime() >= this.frameDeadline;
  },
  
  // 调度回调
  scheduleCallback(callback) {
    // 使用 MessageChannel 实现
    const channel = new MessageChannel();
    const port = channel.port2;
    
    channel.port1.onmessage = () => {
      // 设置当前帧的截止时间
      this.frameDeadline = getCurrentTime() + this.frameInterval;
      
      // 执行回调
      callback();
    };
    
    // 发送消息，异步执行
    port.postMessage(null);
  }
};
```

### 工作循环中的中断检查

```javascript
function workLoopConcurrent() {
  // 循环处理工作单元
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  // 检查是否超过时间片
  const currentTime = getCurrentTime();
  return currentTime >= deadline;
}
```

---

## 问题 5：优先级如何影响时间切片？

**不同优先级的任务有不同的过期时间，高优先级任务会打断低优先级任务**。

### 优先级级别

```javascript
// React 的优先级级别（简化）
const ImmediatePriority = 1;      // 立即执行（同步）
const UserBlockingPriority = 2;   // 用户交互（250ms）
const NormalPriority = 3;         // 普通更新（5s）
const LowPriority = 4;            // 低优先级（10s）
const IdlePriority = 5;           // 空闲时执行

// 优先级对应的超时时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
```

### 优先级调度示例

```javascript
// 任务队列
const taskQueue = [];

function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  
  // 计算过期时间
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
  }
  
  const expirationTime = currentTime + timeout;
  
  // 创建任务
  const newTask = {
    callback,
    priorityLevel,
    expirationTime,
    sortIndex: expirationTime
  };
  
  // 插入任务队列（按过期时间排序）
  push(taskQueue, newTask);
  
  // 开始调度
  requestHostCallback(flushWork);
}
```

---

## 问题 6：为什么不使用 requestIdleCallback？

**requestIdleCallback 存在兼容性和执行频率问题，React 实现了自己的调度器**。

### requestIdleCallback 的问题

```javascript
// requestIdleCallback 的问题：
// 1. 兼容性差（Safari 不支持）
// 2. 执行频率不稳定
// 3. 在后台标签页可能不执行

requestIdleCallback((deadline) => {
  // deadline.timeRemaining() 可能很长时间才调用一次
  while (deadline.timeRemaining() > 0) {
    // 执行工作
  }
});
```

### React 的解决方案

```javascript
// React 使用 MessageChannel 模拟
const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = () => {
  // 在宏任务中执行，确保及时响应
  performWorkUntilDeadline();
};

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

function performWorkUntilDeadline() {
  const currentTime = getCurrentTime();
  deadline = currentTime + yieldInterval; // 5ms
  
  const hasMoreWork = scheduledHostCallback();
  
  if (hasMoreWork) {
    // 还有工作，继续调度
    schedulePerformWorkUntilDeadline();
  }
}
```

---

## 问题 7：时间切片的完整流程是什么？

**从触发更新到完成渲染的完整流程**。

### 完整流程图

```
1. 触发更新
   ↓
2. 创建更新对象，计算优先级
   ↓
3. 调度更新（Scheduler.scheduleCallback）
   ↓
4. 开始工作循环（workLoopConcurrent）
   ↓
5. 执行工作单元（performUnitOfWork）
   ├─ beginWork：处理当前节点
   └─ completeWork：完成当前节点
   ↓
6. 检查是否需要中断（shouldYield）
   ├─ 是：暂停，等待下次调度
   └─ 否：继续下一个工作单元
   ↓
7. 所有工作完成，提交更新（commitRoot）
```

### 代码示例

```javascript
// 1. 触发更新
function updateContainer(element, container) {
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);
  
  // 2. 创建更新
  const update = createUpdate(eventTime, lane);
  update.payload = { element };
  
  // 3. 调度更新
  scheduleUpdateOnFiber(current, lane, eventTime);
}

// 4. 开始工作循环
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    // 5. 执行工作单元
    performUnitOfWork(workInProgress);
  }
}

// 6. 检查是否中断
function shouldYield() {
  return getCurrentTime() >= deadline;
}

// 7. 提交更新
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 提交前
  commitBeforeMutationEffects(finishedWork);
  
  // 提交 DOM 变更
  commitMutationEffects(finishedWork);
  
  // 提交后
  commitLayoutEffects(finishedWork);
}
```

---

## 总结

**核心机制**：

### 1. Fiber 架构
- 链表结构，支持中断和恢复
- 每个节点是一个工作单元
- 深度优先遍历

### 2. 工作循环
- `performUnitOfWork` 处理单个节点
- `shouldYield` 检查是否需要中断
- 可以在任意节点暂停

### 3. Scheduler 调度器
- 管理任务优先级
- 使用 MessageChannel 实现
- 每帧约 5ms 的时间片

### 4. 优先级系统
- 不同优先级有不同过期时间
- 高优先级可以打断低优先级
- 过期任务会同步执行

### 5. 时间切片的好处
- 保持应用响应性
- 避免长时间阻塞
- 支持并发渲染

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [React Scheduler 源码](https://github.com/facebook/react/tree/main/packages/scheduler)
- [时间切片原理](https://react.iamkasong.com/concurrent/scheduler.html)
- [深入理解 Fiber](https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react)
