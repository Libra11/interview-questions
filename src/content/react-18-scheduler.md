---
title: React18 Scheduler 如何调度优先级？
category: React
difficulty: 高级
updatedAt: 2025-12-09
summary: >-
  深入理解 React 18 Scheduler 的优先级调度机制。
tags:
  - React
  - Scheduler
  - 优先级
  - 并发
estimatedTime: 15 分钟
keywords:
  - React Scheduler
  - priority scheduling
  - task queue
  - concurrent rendering
highlight: Scheduler 使用优先级队列和时间切片，通过 Lane 模型管理任务优先级，实现可中断渲染。
order: 680
---

## 问题 1：Scheduler 的作用

### 核心功能

```javascript
// Scheduler 负责：
// 1. 任务调度：决定何时执行什么任务
// 2. 优先级管理：高优先级任务先执行
// 3. 时间切片：避免长时间阻塞主线程
// 4. 任务中断：高优先级可打断低优先级

import { scheduleCallback, shouldYield } from "scheduler";

scheduleCallback(priority, callback);
```

---

## 问题 2：优先级级别

### 五种优先级

```javascript
// scheduler/src/SchedulerPriorities.js
export const ImmediatePriority = 1; // 立即执行
export const UserBlockingPriority = 2; // 用户交互
export const NormalPriority = 3; // 普通更新
export const LowPriority = 4; // 低优先级
export const IdlePriority = 5; // 空闲时执行

// 对应的超时时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1; // 立即过期
const USER_BLOCKING_PRIORITY_TIMEOUT = 250; // 250ms
const NORMAL_PRIORITY_TIMEOUT = 5000; // 5s
const LOW_PRIORITY_TIMEOUT = 10000; // 10s
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt; // 永不过期
```

### React 中的映射

```javascript
// 用户交互 → UserBlockingPriority
onClick, onInput, onFocus;

// 普通更新 → NormalPriority
setState, useReducer;

// 过渡更新 → LowPriority
startTransition;

// 空闲更新 → IdlePriority
requestIdleCallback;
```

---

## 问题 3：任务队列

### 两个队列

```javascript
// 已到期任务队列（小顶堆）
const taskQueue = [];

// 未到期任务队列（小顶堆）
const timerQueue = [];

// 任务结构
const task = {
  id: taskId,
  callback: fn,
  priorityLevel: priority,
  startTime: currentTime,
  expirationTime: startTime + timeout,
  sortIndex: expirationTime, // 排序依据
};
```

### 调度流程

```javascript
function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;

  // 计算过期时间
  const timeout = getTimeoutByPriority(priorityLevel);
  const expirationTime = startTime + timeout;

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: expirationTime,
  };

  // 加入任务队列
  push(taskQueue, newTask);

  // 请求调度
  requestHostCallback(flushWork);

  return newTask;
}
```

---

## 问题 4：时间切片

### 工作循环

```javascript
function workLoop(hasTimeRemaining, initialTime) {
  let currentTime = initialTime;

  // 检查 timerQueue，将到期任务移到 taskQueue
  advanceTimers(currentTime);

  currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // 任务未过期且需要让出
    if (currentTask.expirationTime > currentTime && shouldYield()) {
      break;
    }

    const callback = currentTask.callback;

    if (typeof callback === "function") {
      currentTask.callback = null;

      const continuationCallback = callback();

      if (typeof continuationCallback === "function") {
        // 任务未完成，保留继续执行
        currentTask.callback = continuationCallback;
      } else {
        // 任务完成，移除
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }

    currentTask = peek(taskQueue);
  }

  // 返回是否还有任务
  return currentTask !== null;
}
```

### shouldYield

```javascript
function shouldYield() {
  const currentTime = getCurrentTime();

  // 检查是否超过时间片（约 5ms）
  if (currentTime >= deadline) {
    // 检查是否有更高优先级的任务
    if (needsPaint || scheduling.isInputPending()) {
      return true;
    }
  }

  return false;
}
```

---

## 问题 5：Lane 模型

### Lane 优先级

```javascript
// React 内部使用 Lane 模型
const NoLane = 0b0000000000000000000000000000000;
const SyncLane = 0b0000000000000000000000000000001;
const InputContinuousLane = 0b0000000000000000000000000000100;
const DefaultLane = 0b0000000000000000000000000010000;
const TransitionLane1 = 0b0000000000000000000000001000000;
const IdleLane = 0b0100000000000000000000000000000;

// 位运算操作
function mergeLanes(a, b) {
  return a | b;
}

function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}
```

### Lane 与 Scheduler 的关系

```javascript
// Lane → Scheduler Priority
function lanesToSchedulerPriority(lanes) {
  const lane = getHighestPriorityLane(lanes);

  if (lane === SyncLane) {
    return ImmediatePriority;
  }
  if (lane === InputContinuousLane) {
    return UserBlockingPriority;
  }
  if (lane === DefaultLane) {
    return NormalPriority;
  }
  if (lane === TransitionLane1) {
    return NormalPriority;
  }
  if (lane === IdleLane) {
    return IdlePriority;
  }

  return NormalPriority;
}
```

---

## 问题 6：高优先级打断

### 打断机制

```javascript
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root);
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  const existingCallbackPriority = root.callbackPriority;

  // 新任务优先级更高
  if (newCallbackPriority > existingCallbackPriority) {
    // 取消现有任务
    cancelCallback(root.callbackNode);
  }

  // 调度新任务
  const newCallbackNode = scheduleCallback(
    schedulerPriority,
    performConcurrentWorkOnRoot.bind(null, root)
  );

  root.callbackNode = newCallbackNode;
  root.callbackPriority = newCallbackPriority;
}
```

## 总结

| 概念      | 说明                   |
| --------- | ---------------------- |
| 优先级    | 5 级：Immediate → Idle |
| 任务队列  | 小顶堆，按过期时间排序 |
| 时间切片  | 约 5ms，可中断         |
| Lane 模型 | 位运算管理优先级       |

## 延伸阅读

- [Scheduler 源码](https://github.com/facebook/react/tree/main/packages/scheduler)
- [React Lane 模型](https://github.com/facebook/react/pull/18796)
