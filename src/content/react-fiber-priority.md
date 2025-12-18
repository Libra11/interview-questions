---
title: Fiber 的优先级调度算法？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 Fiber 的优先级调度机制，掌握 Lane 模型和调度算法。
tags:
  - React
  - Fiber
  - 优先级
  - Lane
estimatedTime: 15 分钟
keywords:
  - priority scheduling
  - Lane model
  - Scheduler
  - task priority
highlight: React 使用 Lane 模型管理优先级，通过位运算高效处理多优先级任务的调度。
order: 586
---

## 问题 1：优先级有哪些级别？

### Lane 优先级

```jsx
// React 使用 Lane（车道）模型
// 每个 Lane 是一个二进制位

const NoLane = 0b0000000000000000000000000000000;
const SyncLane = 0b0000000000000000000000000000001; // 同步
const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入
const DefaultLane = 0b0000000000000000000000000010000; // 默认
const TransitionLane1 = 0b0000000000000000000000001000000; // 过渡
const IdleLane = 0b0100000000000000000000000000000; // 空闲
```

### 优先级从高到低

```jsx
1. SyncLane          - 同步，最高优先级（flushSync）
2. InputContinuousLane - 连续输入（拖拽、滚动）
3. DefaultLane       - 默认更新（普通 setState）
4. TransitionLanes   - 过渡更新（startTransition）
5. IdleLane          - 空闲更新（最低优先级）
```

---

## 问题 2：Lane 模型如何工作？

### 位运算操作

```jsx
// 合并多个 Lane
const lanes = SyncLane | DefaultLane;

// 检查是否包含某个 Lane
if (lanes & SyncLane) {
  // 包含同步优先级
}

// 移除某个 Lane
lanes = lanes & ~SyncLane;

// 获取最高优先级 Lane
function getHighestPriorityLane(lanes) {
  return lanes & -lanes; // 获取最低位的 1
}
```

### 为什么用位运算？

```jsx
// 1. 高效：位运算是 CPU 原生操作
// 2. 可组合：一个变量存储多个优先级
// 3. 批量处理：同优先级任务一起处理

// 示例：批量处理同优先级更新
const pendingLanes = lane1 | lane2 | lane3;
const samePriorityLanes = pendingLanes & TransitionLanes;
```

---

## 问题 3：调度器如何工作？

### Scheduler 包

```jsx
import {
  scheduleCallback,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from "scheduler";

// 调度任务
scheduleCallback(NormalPriority, () => {
  // 执行任务
});
```

### 任务队列

```jsx
// 两个队列
const taskQueue = []; // 已到期任务
const timerQueue = []; // 未到期任务

// 任务结构
const task = {
  id: taskId,
  callback: fn,
  priorityLevel: priority,
  startTime: currentTime,
  expirationTime: startTime + timeout,
};

// 不同优先级的超时时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1; // 立即
const USER_BLOCKING_PRIORITY_TIMEOUT = 250; // 250ms
const NORMAL_PRIORITY_TIMEOUT = 5000; // 5s
const LOW_PRIORITY_TIMEOUT = 10000; // 10s
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt; // 永不过期
```

---

## 问题 4：高优先级如何打断低优先级？

### 打断机制

```jsx
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root);
  const existingCallbackPriority = root.callbackPriority;
  const newCallbackPriority = getHighestPriorityLane(nextLanes);

  // 新任务优先级更高
  if (newCallbackPriority > existingCallbackPriority) {
    // 取消现有任务
    cancelCallback(root.callbackNode);

    // 调度新任务
    root.callbackNode = scheduleCallback(
      newCallbackPriority,
      performConcurrentWorkOnRoot
    );
  }
}
```

### 实际场景

```jsx
function App() {
  const [count, setCount] = useState(0);
  const [list, setList] = useState([]);

  const handleClick = () => {
    // 高优先级：用户点击
    setCount((c) => c + 1);

    // 低优先级：大列表更新
    startTransition(() => {
      setList(generateLargeList());
    });
  };

  // 执行顺序：
  // 1. setCount 触发高优先级更新
  // 2. 开始渲染 list 更新
  // 3. 用户再次点击
  // 4. 中断 list 渲染
  // 5. 处理新的 count 更新
  // 6. 继续 list 渲染
}
```

---

## 问题 5：饥饿问题如何解决？

### 问题

```jsx
// 低优先级任务一直被打断，永远无法完成
// 这就是"饥饿"问题
```

### 解决方案

```jsx
// 任务有过期时间
// 过期后，优先级提升

function markStarvedLanesAsExpired(root, currentTime) {
  const pendingLanes = root.pendingLanes;

  let lanes = pendingLanes;
  while (lanes > 0) {
    const lane = getHighestPriorityLane(lanes);
    const expirationTime = root.expirationTimes[lane];

    if (expirationTime <= currentTime) {
      // 已过期，标记为需要立即处理
      root.expiredLanes |= lane;
    }

    lanes &= ~lane;
  }
}

// 过期任务会被提升为同步优先级
// 确保最终会被执行
```

## 总结

| 概念      | 说明                 |
| --------- | -------------------- |
| Lane      | 用位表示优先级       |
| Scheduler | 任务调度器           |
| 过期时间  | 防止饥饿             |
| 打断机制  | 高优先级打断低优先级 |

## 延伸阅读

- [React Lane 模型](https://github.com/facebook/react/pull/18796)
- [Scheduler 源码](https://github.com/facebook/react/tree/main/packages/scheduler)
