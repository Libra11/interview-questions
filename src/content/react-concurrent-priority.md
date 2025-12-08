---
title: Concurrent Mode 如何处理优先级？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 并发模式的优先级机制，掌握不同更新如何被调度执行。
tags:
  - React
  - 并发模式
  - 优先级
  - 调度
estimatedTime: 15 分钟
keywords:
  - concurrent mode
  - priority
  - scheduler
  - lanes
highlight: React 使用 Lane 模型管理优先级，高优先级更新可以中断低优先级渲染。
order: 226
---

## 问题 1：React 有哪些优先级？

### 优先级分类

```jsx
// 从高到低
1. 同步优先级（Sync）     - 最高，如 flushSync
2. 输入优先级（Input）    - 用户输入、点击
3. 默认优先级（Default）  - 普通 setState
4. 过渡优先级（Transition）- startTransition
5. 空闲优先级（Idle）     - 最低，如 offscreen
```

### 对应的更新类型

```jsx
// 同步优先级
flushSync(() => {
  setState(value);
});

// 输入优先级（自动）
<input onChange={(e) => setState(e.target.value)} />;

// 过渡优先级
startTransition(() => {
  setState(value);
});
```

---

## 问题 2：优先级如何影响渲染？

### 高优先级打断低优先级

```jsx
function App() {
  const [input, setInput] = useState("");
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 高优先级：立即执行
    setInput(e.target.value);

    // 低优先级：可被打断
    startTransition(() => {
      setList(generateList(e.target.value));
    });
  };
}

// 执行流程：
// 1. 用户输入 "a"
// 2. setInput("a") 高优先级，立即渲染
// 3. generateList("a") 开始执行
// 4. 用户输入 "ab"
// 5. 打断 generateList("a")
// 6. setInput("ab") 立即渲染
// 7. generateList("ab") 重新开始
```

---

## 问题 3：Lane 模型是什么？

### Lane 的概念

React 使用**位掩码**表示优先级，每个 Lane 是一个二进制位。

```jsx
// 简化的 Lane 定义
const SyncLane = 0b0001;
const InputLane = 0b0010;
const DefaultLane = 0b0100;
const TransitionLane = 0b1000;

// 可以组合多个 Lane
const lanes = SyncLane | InputLane; // 0b0011
```

### Lane 的优势

```jsx
// 1. 高效的优先级比较
if (updateLane & renderLanes) {
  // 这个更新需要在本次渲染中处理
}

// 2. 批量处理同优先级更新
const batch = pendingLanes & TransitionLanes;

// 3. 灵活的优先级组合
const highPriorityLanes = SyncLane | InputLane;
```

---

## 问题 4：调度器如何工作？

### Scheduler 包

```jsx
// React 使用独立的 Scheduler 包
import { scheduleCallback, ImmediatePriority } from "scheduler";

// 调度任务
scheduleCallback(ImmediatePriority, () => {
  // 高优先级任务
});
```

### 时间切片

```jsx
// 每个时间片约 5ms
function workLoop(hasTimeRemaining, initialTime) {
  let currentTask = peek(taskQueue);

  while (currentTask !== null) {
    if (shouldYield()) {
      // 时间用完，让出控制权
      break;
    }

    // 执行任务
    const callback = currentTask.callback;
    callback();

    currentTask = peek(taskQueue);
  }

  // 返回是否还有任务
  return currentTask !== null;
}
```

### 任务队列

```jsx
// 两个队列
taskQueue; // 已到期的任务，按过期时间排序
timerQueue; // 未到期的任务，按开始时间排序

// 高优先级任务过期时间短，会先执行
```

## 总结

**优先级机制核心**：

| 概念      | 说明                   |
| --------- | ---------------------- |
| Lane      | 用位掩码表示优先级     |
| Scheduler | 调度任务执行           |
| 时间切片  | 每 5ms 检查是否让出    |
| 打断机制  | 高优先级可打断低优先级 |

## 延伸阅读

- [React Scheduler 源码](https://github.com/facebook/react/tree/main/packages/scheduler)
- [Lane 模型详解](https://github.com/facebook/react/pull/18796)
