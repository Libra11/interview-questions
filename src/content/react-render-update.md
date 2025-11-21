---
title: React 是如何处理组件更新和渲染的
category: React
difficulty: 高级
updatedAt: 2025-11-21
summary: >-
  深入探讨 React 的渲染流程，包括触发更新、调度、Reconciliation、Commit 等阶段，理解 Fiber 架构和双缓冲机制的工作原理。
tags:
  - React
  - Fiber
  - 渲染机制
  - Reconciliation
estimatedTime: 30 分钟
keywords:
  - React 渲染
  - Fiber 架构
  - Reconciliation
  - 双缓冲
highlight: 理解 React 完整的渲染流程和 Fiber 架构的核心原理
order: 5
---

## 问题 1：React 渲染的完整流程是什么？

### 渲染的三个主要阶段

React 的渲染过程可以分为三个主要阶段：

```javascript
// React 渲染的完整流程
function performWork() {
  // 1. Trigger（触发）：触发更新
  //    - setState
  //    - useState 的 setter
  //    - forceUpdate
  //    - props 变化
  
  // 2. Render（渲染）：计算变化
  //    - 调用组件函数/render 方法
  //    - 执行 Diff 算法
  //    - 生成新的 Fiber 树
  
  // 3. Commit（提交）：应用变化
  //    - 更新 DOM
  //    - 执行副作用（useEffect 等）
  //    - 更新 ref
}
```

### 详细的渲染流程

```javascript
// 1. 触发更新
function setState(newState) {
  // 创建更新对象
  const update = {
    payload: newState,
    next: null
  };
  
  // 将更新加入队列
  enqueueUpdate(fiber, update);
  
  // 调度更新
  scheduleUpdateOnFiber(fiber);
}

// 2. 调度阶段
function scheduleUpdateOnFiber(fiber) {
  // 标记 fiber 及其父节点需要更新
  markUpdateLaneFromFiberToRoot(fiber);
  
  // 确保根节点被调度
  ensureRootIsScheduled(root);
}

// 3. Render 阶段（可中断）
function performUnitOfWork(fiber) {
  // beginWork：处理当前 fiber
  const next = beginWork(fiber);
  
  if (next !== null) {
    // 有子节点，继续处理子节点
    return next;
  }
  
  // completeWork：完成当前 fiber 的工作
  completeUnitOfWork(fiber);
}

// 4. Commit 阶段（不可中断）
function commitRoot(root) {
  // 4.1 Before Mutation：DOM 变更前
  commitBeforeMutationEffects(root);
  
  // 4.2 Mutation：执行 DOM 变更
  commitMutationEffects(root);
  
  // 4.3 Layout：DOM 变更后
  commitLayoutEffects(root);
}
```

---

## 问题 2：Fiber 架构是如何工作的？

### Fiber 的数据结构

Fiber 是 React 16 引入的新架构，每个组件对应一个 Fiber 节点。

```javascript
// Fiber 节点的核心结构
type Fiber = {
  // 节点类型信息
  tag: WorkTag,              // 组件类型（函数组件、类组件等）
  type: any,                 // 组件函数或类
  stateNode: any,            // 对应的 DOM 节点或组件实例
  
  // Fiber 树结构
  return: Fiber | null,      // 父 Fiber
  child: Fiber | null,       // 第一个子 Fiber
  sibling: Fiber | null,     // 下一个兄弟 Fiber
  
  // 状态和 props
  pendingProps: any,         // 新的 props
  memoizedProps: any,        // 上次渲染的 props
  memoizedState: any,        // 上次渲染的 state
  updateQueue: UpdateQueue,  // 更新队列
  
  // 副作用
  flags: Flags,              // 副作用标记（插入、更新、删除等）
  subtreeFlags: Flags,       // 子树的副作用标记
  
  // 调度相关
  lanes: Lanes,              // 优先级
  childLanes: Lanes,         // 子树的优先级
  
  // 双缓冲
  alternate: Fiber | null,   // 指向另一棵树的对应节点
};
```

### 双缓冲机制

React 维护两棵 Fiber 树：current 树和 workInProgress 树。

```javascript
// 双缓冲机制
let currentRoot = null;      // 当前显示的 Fiber 树
let workInProgressRoot = null; // 正在构建的 Fiber 树

function render() {
  // 1. 基于 current 树创建 workInProgress 树
  workInProgressRoot = createWorkInProgress(currentRoot);
  
  // 2. 在 workInProgress 树上进行更新
  performWork(workInProgressRoot);
  
  // 3. 完成后，交换两棵树
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}

// 创建 workInProgress 节点
function createWorkInProgress(current) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次渲染，创建新节点
    workInProgress = createFiber(current.tag, current.pendingProps);
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用 alternate 节点
    workInProgress.pendingProps = current.pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  
  // 复制其他属性
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  
  return workInProgress;
}
```

### Fiber 树的遍历

```javascript
// 深度优先遍历 Fiber 树
function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  
  // 1. beginWork：处理当前节点
  let next = beginWork(current, unitOfWork);
  
  if (next !== null) {
    // 有子节点，继续处理子节点
    workInProgress = next;
    return;
  }
  
  // 2. completeWork：没有子节点，完成当前节点
  completeUnitOfWork(unitOfWork);
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  
  do {
    // 完成当前节点的工作
    completeWork(completedWork);
    
    // 检查是否有兄弟节点
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 处理兄弟节点
      workInProgress = siblingFiber;
      return;
    }
    
    // 没有兄弟节点，返回父节点
    completedWork = completedWork.return;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
```

---

## 问题 3：Reconciliation（协调）过程是如何工作的？

### Diff 算法的核心策略

React 的 Diff 算法基于三个假设来优化性能：

```javascript
// 1. 不同类型的元素会产生不同的树
// ❌ 旧树
<div>
  <Counter />
</div>

// 🔄 新树
<span>
  <Counter />
</span>
// React 会销毁整个 div 及其子树，重新创建 span 树

// 2. 通过 key 标识哪些元素是稳定的
// ✅ 使用 key
{items.map(item => <Item key={item.id} {...item} />)}

// 3. 同层级比较，不会跨层级比较
// React 只会比较同一层级的节点
```

### beginWork 阶段

```javascript
function beginWork(current, workInProgress) {
  // 根据 tag 类型处理不同的组件
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case HostComponent: // div、span 等原生元素
      return updateHostComponent(current, workInProgress);
  }
}

function updateFunctionComponent(current, workInProgress) {
  // 1. 调用组件函数
  const Component = workInProgress.type;
  const props = workInProgress.pendingProps;
  const children = Component(props);
  
  // 2. 协调子节点
  reconcileChildren(current, workInProgress, children);
  
  return workInProgress.child;
}

function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 首次渲染，直接创建子 Fiber
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 更新，进行 Diff
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
```

### 子节点的 Diff

```javascript
function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
  // 1. 新节点是单个元素
  if (typeof newChild === 'object' && newChild !== null) {
    if (newChild.$$typeof === REACT_ELEMENT_TYPE) {
      return placeSingleChild(
        reconcileSingleElement(returnFiber, currentFirstChild, newChild)
      );
    }
  }
  
  // 2. 新节点是数组（列表）
  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
  }
  
  // 3. 新节点是文本
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return placeSingleChild(
      reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild)
    );
  }
  
  // 4. 删除剩余的旧节点
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}

// 数组子节点的 Diff
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
  let oldFiber = currentFirstChild;
  let newIdx = 0;
  let lastPlacedIndex = 0;
  
  // 第一轮遍历：处理更新的节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];
    
    if (oldFiber.key === newChild.key) {
      // key 相同，复用节点
      const newFiber = updateSlot(returnFiber, oldFiber, newChild);
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      oldFiber = oldFiber.sibling;
    } else {
      // key 不同，跳出第一轮遍历
      break;
    }
  }
  
  // 第二轮遍历：处理剩余的节点
  if (newIdx === newChildren.length) {
    // 新节点遍历完了，删除剩余的旧节点
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }
  
  if (oldFiber === null) {
    // 旧节点遍历完了，创建剩余的新节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      placeChild(newFiber, lastPlacedIndex, newIdx);
    }
    return resultingFirstChild;
  }
  
  // 第三轮遍历：处理移动的节点
  // 将剩余的旧节点放入 Map
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
  
  for (; newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];
    const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChild);
    
    if (newFiber !== null) {
      if (newFiber.alternate !== null) {
        // 从 Map 中删除已复用的节点
        existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    }
  }
  
  // 删除 Map 中剩余的节点
  existingChildren.forEach(child => deleteChild(returnFiber, child));
  
  return resultingFirstChild;
}
```

---

## 问题 4：Commit 阶段做了什么？

### Commit 的三个子阶段

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 1. Before Mutation 阶段
  // - 执行 getSnapshotBeforeUpdate
  // - 调度 useEffect
  commitBeforeMutationEffects(finishedWork);
  
  // 2. Mutation 阶段
  // - 执行 DOM 操作（插入、更新、删除）
  // - 执行 ref 的卸载
  commitMutationEffects(finishedWork);
  
  // 切换 current 树
  root.current = finishedWork;
  
  // 3. Layout 阶段
  // - 执行 componentDidMount/Update
  // - 执行 useLayoutEffect
  // - 执行 ref 的赋值
  commitLayoutEffects(finishedWork);
  
  // 异步执行 useEffect
  scheduleCallback(flushPassiveEffects);
}
```

### Mutation 阶段的 DOM 操作

```javascript
function commitMutationEffects(root, finishedWork) {
  // 遍历 Fiber 树，执行副作用
  while (nextEffect !== null) {
    const flags = nextEffect.flags;
    
    // 1. 处理 Placement（插入）
    if (flags & Placement) {
      commitPlacement(nextEffect);
      nextEffect.flags &= ~Placement;
    }
    
    // 2. 处理 Update（更新）
    if (flags & Update) {
      const current = nextEffect.alternate;
      commitWork(current, nextEffect);
    }
    
    // 3. 处理 Deletion（删除）
    if (flags & Deletion) {
      commitDeletion(root, nextEffect);
    }
    
    nextEffect = nextEffect.nextEffect;
  }
}

// 插入 DOM 节点
function commitPlacement(finishedWork) {
  // 找到父 DOM 节点
  const parentFiber = getHostParentFiber(finishedWork);
  const parentDOM = parentFiber.stateNode;
  
  // 找到插入位置
  const before = getHostSibling(finishedWork);
  
  // 执行插入
  if (before) {
    parentDOM.insertBefore(finishedWork.stateNode, before);
  } else {
    parentDOM.appendChild(finishedWork.stateNode);
  }
}

// 更新 DOM 属性
function commitWork(current, finishedWork) {
  const instance = finishedWork.stateNode;
  const newProps = finishedWork.memoizedProps;
  const oldProps = current !== null ? current.memoizedProps : newProps;
  
  // 更新 DOM 属性
  updateDOMProperties(instance, oldProps, newProps);
}
```

---

## 总结

**核心流程**：

### 1. 渲染三阶段

- **Trigger**：触发更新（setState、props 变化等）
- **Render**：计算变化（Diff 算法、生成 Fiber 树）
- **Commit**：应用变化（更新 DOM、执行副作用）

### 2. Fiber 架构

- 每个组件对应一个 Fiber 节点
- 使用链表结构（child、sibling、return）
- 双缓冲机制（current 和 workInProgress）
- 支持可中断的渲染

### 3. Reconciliation

- 同层级比较，不跨层级
- 不同类型元素会重新创建
- 使用 key 标识稳定的元素
- 三轮遍历优化列表 Diff

### 4. Commit 阶段

- Before Mutation：DOM 变更前
- Mutation：执行 DOM 操作
- Layout：DOM 变更后
- 异步执行 useEffect

## 延伸阅读

- [React 官方文档 - Render and Commit](https://react.dev/learn/render-and-commit)
- [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
- [React 源码解析 - Fiber](https://react.iamkasong.com/process/fiber.html)
- [深入理解 React Diff 算法](https://zhuanlan.zhihu.com/p/20346379)
