---
title: React Fiber 的含义与数据结构
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Fiber 的设计理念和数据结构。Fiber 是 React 16 引入的新架构，
  通过链表结构实现可中断的渲染，为并发特性奠定基础。
tags:
  - React
  - Fiber
  - 架构设计
  - 数据结构
estimatedTime: 24 分钟
keywords:
  - React Fiber
  - Fiber 节点
  - 链表结构
  - 双缓存
highlight: Fiber 既是一种架构，也是一种数据结构，通过链表实现可中断的工作流程
order: 362
---

## 问题 1：Fiber 是什么？

**Fiber 有三层含义：一种架构、一种数据结构、一个工作单元**。

### 作为架构

Fiber 是 React 16 引入的新的协调引擎，替代了之前的 Stack Reconciler。

```
Stack Reconciler（React 15）
- 递归更新
- 不可中断
- 同步执行

Fiber Reconciler（React 16+）
- 可中断更新
- 优先级调度
- 时间切片
```

### 作为数据结构

Fiber 是一个 JavaScript 对象，包含组件的信息和关系。

```javascript
function FiberNode(tag, pendingProps, key, mode) {
  // 实例属性
  this.tag = tag;                    // 节点类型
  this.key = key;                    // key 属性
  this.elementType = null;           // 元素类型
  this.type = null;                  // 函数或类
  this.stateNode = null;             // 真实 DOM 或组件实例

  // Fiber 关系
  this.return = null;                // 父 Fiber
  this.child = null;                 // 第一个子 Fiber
  this.sibling = null;               // 下一个兄弟 Fiber
  this.index = 0;                    // 在父节点中的索引

  // 工作相关
  this.pendingProps = pendingProps;  // 新的 props
  this.memoizedProps = null;         // 上次渲染的 props
  this.updateQueue = null;           // 更新队列
  this.memoizedState = null;         // 上次渲染的 state

  // 副作用
  this.flags = NoFlags;              // 副作用标记
  this.subtreeFlags = NoFlags;       // 子树副作用标记
  this.deletions = null;             // 要删除的子节点

  // 调度
  this.lanes = NoLanes;              // 优先级
  this.childLanes = NoLanes;         // 子树优先级

  // 双缓存
  this.alternate = null;             // 对应的另一棵树的 Fiber
}
```

### 作为工作单元

每个 Fiber 节点代表一个工作单元，可以独立处理。

```javascript
function performUnitOfWork(fiber) {
  // 处理当前 Fiber
  beginWork(fiber);
  
  // 返回下一个要处理的 Fiber
  if (fiber.child) {
    return fiber.child;
  }
  
  // 完成当前 Fiber
  completeWork(fiber);
  
  // 返回兄弟或父节点
  return fiber.sibling || fiber.return;
}
```

---

## 问题 2：Fiber 的链表结构是怎样的？

**Fiber 使用 child、sibling、return 三个指针构建链表**。

### 树形结构转换为链表

```jsx
// React 元素树
<div>
  <h1>Title</h1>
  <p>Content</p>
</div>

// 对应的 Fiber 链表结构
const divFiber = {
  type: 'div',
  child: h1Fiber,      // 指向第一个子节点
  return: null,        // 父节点
  sibling: null        // 兄弟节点
};

const h1Fiber = {
  type: 'h1',
  child: textFiber1,
  return: divFiber,    // 指向父节点
  sibling: pFiber      // 指向下一个兄弟
};

const pFiber = {
  type: 'p',
  child: textFiber2,
  return: divFiber,
  sibling: null        // 最后一个兄弟
};
```

### 链表遍历

```javascript
// 深度优先遍历
function traverseFiber(fiber) {
  let node = fiber;
  
  while (node) {
    console.log('访问:', node.type);
    
    // 1. 先访问子节点
    if (node.child) {
      node = node.child;
      continue;
    }
    
    // 2. 没有子节点，访问兄弟节点
    if (node.sibling) {
      node = node.sibling;
      continue;
    }
    
    // 3. 没有兄弟节点，返回父节点
    node = node.return;
    
    // 继续查找父节点的兄弟
    while (node && !node.sibling) {
      node = node.return;
    }
    
    if (node) {
      node = node.sibling;
    }
  }
}
```

---

## 问题 3：Fiber 的双缓存机制是什么？

**React 维护两棵 Fiber 树：current 树和 workInProgress 树**。

### 双缓存树

```javascript
// current 树：当前显示在屏幕上的
const currentFiber = {
  type: 'div',
  stateNode: domElement,
  alternate: workInProgressFiber  // 指向另一棵树
};

// workInProgress 树：正在构建的
const workInProgressFiber = {
  type: 'div',
  stateNode: domElement,
  alternate: currentFiber         // 指向另一棵树
};

// FiberRoot 根节点
const fiberRoot = {
  current: currentFiber,           // 指向当前树
  finishedWork: null               // 指向完成的工作树
};
```

### 切换过程

```javascript
// 1. 开始更新时，基于 current 树创建 workInProgress 树
function prepareFreshStack(root) {
  root.finishedWork = null;
  
  // 创建 workInProgress 树的根节点
  workInProgress = createWorkInProgress(root.current, null);
}

// 2. 在 workInProgress 树上进行更新
function performUnitOfWork(workInProgress) {
  const current = workInProgress.alternate;
  
  // 基于 current 更新 workInProgress
  beginWork(current, workInProgress);
}

// 3. 更新完成后，切换 current 指针
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 应用更新到 DOM
  commitMutationEffects(finishedWork);
  
  // 切换 current 指针
  root.current = finishedWork;
  
  // 现在 finishedWork 变成了 current 树
  // 原来的 current 树变成了下次更新的 workInProgress 树
}
```

### 双缓存的优势

```javascript
// 优势 1：可以复用 Fiber 节点
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次渲染，创建新节点
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
  } else {
    // 更新时，复用节点
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }
  
  // 复制属性
  workInProgress.type = current.type;
  workInProgress.stateNode = current.stateNode;
  workInProgress.alternate = current;
  current.alternate = workInProgress;
  
  return workInProgress;
}

// 优势 2：可以中断后恢复
// 如果更新被中断，current 树仍然完整
// 可以丢弃 workInProgress 树，重新开始
```

---

## 问题 4：Fiber 节点的 tag 类型有哪些？

**tag 标识 Fiber 节点的类型，决定如何处理该节点**。

### 常见的 tag 类型

```javascript
// 函数组件
export const FunctionComponent = 0;

// 类组件
export const ClassComponent = 1;

// 根节点
export const HostRoot = 3;

// 原生 DOM 元素
export const HostComponent = 5;

// 文本节点
export const HostText = 6;

// Fragment
export const Fragment = 7;

// Context Provider
export const ContextProvider = 10;

// Context Consumer
export const ContextConsumer = 9;

// memo 组件
export const MemoComponent = 14;

// lazy 组件
export const LazyComponent = 16;
```

### 根据 tag 处理节点

```javascript
function beginWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
    case FunctionComponent:
      // 执行函数组件
      return updateFunctionComponent(current, workInProgress, renderLanes);
      
    case ClassComponent:
      // 处理类组件
      return updateClassComponent(current, workInProgress, renderLanes);
      
    case HostComponent:
      // 处理原生 DOM 元素
      return updateHostComponent(current, workInProgress, renderLanes);
      
    case HostText:
      // 文本节点没有子节点
      return null;
      
    case Fragment:
      // Fragment 直接处理子节点
      return updateFragment(current, workInProgress, renderLanes);
      
    // ... 其他类型
  }
}
```

---

## 问题 5：Fiber 的副作用标记是什么？

**flags 用于标记 Fiber 节点需要执行的副作用**。

### 副作用类型

```javascript
// 没有副作用
export const NoFlags = 0b000000000000000000;

// 插入节点
export const Placement = 0b000000000000000010;

// 更新节点
export const Update = 0b000000000000000100;

// 删除节点
export const Deletion = 0b000000000000001000;

// ref 相关
export const Ref = 0b000000000100000000;

// Snapshot（getSnapshotBeforeUpdate）
export const Snapshot = 0b000000100000000000;

// Passive（useEffect）
export const Passive = 0b000001000000000000;

// Layout（useLayoutEffect）
export const LayoutMask = 0b001000000000000000;
```

### 标记副作用

```javascript
// 标记插入
function markPlacement(fiber) {
  fiber.flags |= Placement;
}

// 标记更新
function markUpdate(fiber) {
  fiber.flags |= Update;
}

// 检查副作用
function hasEffect(fiber, effect) {
  return (fiber.flags & effect) !== NoFlags;
}

// 使用示例
if (hasEffect(fiber, Placement)) {
  // 需要插入节点
  commitPlacement(fiber);
}

if (hasEffect(fiber, Update)) {
  // 需要更新节点
  commitUpdate(fiber);
}
```

---

## 问题 6：Fiber 的优先级如何表示？

**使用 lanes 模型表示优先级，支持多个优先级并存**。

### Lanes 模型

```javascript
// 使用二进制位表示优先级
export const NoLanes = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousLane = 0b0000000000000000000000000000100;
export const DefaultLane = 0b0000000000000000000000000010000;
export const IdleLane = 0b0100000000000000000000000000000;

// 可以同时表示多个优先级
const lanes = SyncLane | DefaultLane;
// 0b0000000000000000000000000010001
```

### 优先级操作

```javascript
// 包含某个优先级
function includesLane(set, lane) {
  return (set & lane) !== NoLanes;
}

// 合并优先级
function mergeLanes(a, b) {
  return a | b;
}

// 移除优先级
function removeLanes(set, subset) {
  return set & ~subset;
}

// 获取最高优先级
function getHighestPriorityLane(lanes) {
  return lanes & -lanes;  // 获取最右边的 1
}
```

---

## 问题 7：Fiber 架构的优势是什么？

**可中断、可恢复、优先级调度、并发渲染**。

### 优势对比

```javascript
// Stack Reconciler（React 15）
function reconcile(element) {
  // 递归处理，不可中断
  const children = element.props.children;
  children.forEach(child => {
    reconcile(child);  // 必须处理完所有子节点
  });
}

// Fiber Reconciler（React 16+）
function workLoop() {
  while (workInProgress && !shouldYield()) {
    // 可以中断
    performUnitOfWork(workInProgress);
  }
  
  if (workInProgress) {
    // 还有工作，下次继续
    return;
  }
}
```

### 实现的新特性

```jsx
// 1. 并发渲染
function App() {
  const [isPending, startTransition] = useTransition();
  
  const handleClick = () => {
    startTransition(() => {
      // 低优先级更新，可以被打断
      setCount(count + 1);
    });
  };
  
  return <button onClick={handleClick}>+1</button>;
}

// 2. Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}

// 3. 优先级调度
// 用户输入 > 动画 > 数据获取 > 空闲任务
```

---

## 总结

**核心概念**：

### 1. Fiber 的三层含义
- 架构：可中断的协调引擎
- 数据结构：包含节点信息的对象
- 工作单元：可独立处理的最小单位

### 2. 链表结构
- child：第一个子节点
- sibling：下一个兄弟节点
- return：父节点
- 支持深度优先遍历

### 3. 双缓存机制
- current 树：当前显示的
- workInProgress 树：正在构建的
- 通过 alternate 相互引用
- 更新完成后切换指针

### 4. 节点属性
- tag：节点类型
- flags：副作用标记
- lanes：优先级
- stateNode：DOM 或实例

### 5. 架构优势
- 可中断和恢复
- 优先级调度
- 时间切片
- 支持并发特性

## 延伸阅读

- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
- [Fiber 源码解析](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactInternalTypes.js)
- [深入理解 Fiber](https://react.iamkasong.com/process/fiber.html)
- [Lanes 模型详解](https://github.com/facebook/react/pull/18796)
