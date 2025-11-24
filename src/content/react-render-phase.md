---
title: React Render 阶段的执行过程
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Render 阶段的工作流程。Render 阶段是 React 计算需要变更的过程，
  通过 Fiber 架构实现可中断的递归，为 Commit 阶段准备副作用列表。
tags:
  - React
  - Fiber
  - Render 阶段
  - 协调
estimatedTime: 25 分钟
keywords:
  - React Render
  - beginWork
  - completeWork
  - Fiber 遍历
highlight: Render 阶段通过 beginWork 和 completeWork 深度优先遍历 Fiber 树
order: 111
---

## 问题 1：Render 阶段是什么？

**Render 阶段是 React 计算组件变更的过程，生成带有副作用标记的 Fiber 树**。

这个阶段是可中断的，不会产生任何用户可见的变更。

### Render 和 Commit 的关系

```
触发更新
  ↓
Render 阶段（可中断）
  - 计算变更
  - 标记副作用
  ↓
Commit 阶段（同步）
  - 应用变更到 DOM
  ↓
用户看到更新
```

### Render 阶段的两个主要函数

```javascript
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  
  // 1. beginWork：处理当前节点
  let next = beginWork(current, unitOfWork, renderLanes);
  
  if (next === null) {
    // 2. completeWork：完成当前节点
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}
```

---

## 问题 2：beginWork 做了什么？

**beginWork 根据组件类型创建或复用子 Fiber 节点**。

### beginWork 的主要逻辑

```javascript
function beginWork(current, workInProgress, renderLanes) {
  // 尝试复用节点
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
    
    if (oldProps !== newProps || hasLegacyContextChanged()) {
      // props 或 context 变化，需要更新
      didReceiveUpdate = true;
    } else {
      // 可以复用，跳过更新
      const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
        current,
        renderLanes
      );
      
      if (!hasScheduledUpdateOrContext) {
        // 复用当前节点及其子树
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
      }
    }
  }
  
  // 根据 tag 类型处理节点
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, renderLanes);
    case ClassComponent:
      return updateClassComponent(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    // ... 其他类型
  }
}
```

### 处理函数组件

```javascript
function updateFunctionComponent(current, workInProgress, renderLanes) {
  const Component = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  
  // 执行函数组件，获取 children
  let nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    context,
    renderLanes
  );
  
  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  return workInProgress.child;
}
```

### 处理类组件

```javascript
function updateClassComponent(current, workInProgress, renderLanes) {
  const Component = workInProgress.type;
  const instance = workInProgress.stateNode;
  
  if (instance === null) {
    // 首次渲染，创建实例
    constructClassInstance(workInProgress, Component, nextProps);
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
  } else {
    // 更新实例
    updateClassInstance(current, workInProgress, Component, nextProps, renderLanes);
  }
  
  // 调用 render 方法
  const nextChildren = instance.render();
  
  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  return workInProgress.child;
}
```

### 处理原生 DOM 元素

```javascript
function updateHostComponent(current, workInProgress, renderLanes) {
  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;
  
  let nextChildren = nextProps.children;
  
  // 判断是否是文本子节点
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  
  if (isDirectTextChild) {
    // 文本子节点，不需要创建 Fiber
    nextChildren = null;
  }
  
  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  
  return workInProgress.child;
}
```

---

## 问题 3：reconcileChildren 如何工作？

**reconcileChildren 是 Diff 算法的入口，负责生成子 Fiber 节点**。

### reconcileChildren 的逻辑

```javascript
function reconcileChildren(
  current,
  workInProgress,
  nextChildren,
  renderLanes
) {
  if (current === null) {
    // 首次渲染，创建子 Fiber
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    // 更新，进行 Diff
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
}
```

### 单节点 Diff

```javascript
function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  lanes
) {
  const key = element.key;
  let child = currentFirstChild;
  
  // 遍历旧的子节点
  while (child !== null) {
    if (child.key === key) {
      if (child.elementType === element.type) {
        // key 和 type 都相同，复用节点
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        
        // 删除其他兄弟节点
        deleteRemainingChildren(returnFiber, child.sibling);
        
        return existing;
      } else {
        // key 相同但 type 不同，删除所有旧节点
        deleteRemainingChildren(returnFiber, child);
        break;
      }
    } else {
      // key 不同，删除当前节点
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }
  
  // 创建新节点
  const created = createFiberFromElement(element, returnFiber.mode, lanes);
  created.return = returnFiber;
  return created;
}
```

---

## 问题 4：completeWork 做了什么？

**completeWork 在节点的子节点都处理完后执行，创建或更新 DOM 节点**。

### completeWork 的主要逻辑

```javascript
function completeWork(current, workInProgress, renderLanes) {
  const newProps = workInProgress.pendingProps;
  
  switch (workInProgress.tag) {
    case FunctionComponent:
    case SimpleMemoComponent:
      // 函数组件没有实例，直接返回
      return null;
      
    case ClassComponent:
      // 类组件的实例在 beginWork 中创建
      return null;
      
    case HostComponent: {
      const type = workInProgress.type;
      
      if (current !== null && workInProgress.stateNode != null) {
        // 更新节点
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 创建节点
        const instance = createInstance(type, newProps, workInProgress);
        
        // 将子节点插入到 DOM 节点
        appendAllChildren(instance, workInProgress);
        
        // 保存 DOM 节点
        workInProgress.stateNode = instance;
        
        // 初始化 DOM 属性
        finalizeInitialChildren(instance, type, newProps);
      }
      
      return null;
    }
  }
}
```

### 创建 DOM 节点

```javascript
function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  
  // 保存 Fiber 引用
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  
  return domElement;
}
```

### 插入子节点

```javascript
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // 原生节点，直接插入
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 组件节点，继续向下查找
      node.child.return = node;
      node = node.child;
      continue;
    }
    
    if (node === workInProgress) {
      return;
    }
    
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

### 标记副作用

```javascript
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps;
  
  if (oldProps === newProps) {
    return;
  }
  
  const instance = workInProgress.stateNode;
  
  // 计算需要更新的属性
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  
  // 保存更新内容
  workInProgress.updateQueue = updatePayload;
  
  if (updatePayload) {
    // 标记 Update 副作用
    markUpdate(workInProgress);
  }
}
```

---

## 问题 5：Fiber 树的遍历顺序是什么？

**深度优先遍历，先处理子节点，再处理兄弟节点**。

### 遍历流程

```
组件树：
    App
   /   \
  A     B
 / \     \
C   D     E

遍历顺序：
1. beginWork(App)
2. beginWork(A)
3. beginWork(C)
4. completeWork(C)
5. beginWork(D)
6. completeWork(D)
7. completeWork(A)
8. beginWork(B)
9. beginWork(E)
10. completeWork(E)
11. completeWork(B)
12. completeWork(App)
```

### 遍历代码

```javascript
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  
  // beginWork：处理当前节点
  let next = beginWork(current, unitOfWork, renderLanes);
  
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  
  if (next === null) {
    // 没有子节点，完成当前节点
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点，继续处理子节点
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    
    // completeWork：完成当前节点
    const next = completeWork(current, completedWork, renderLanes);
    
    if (next !== null) {
      // 有新的工作，返回
      workInProgress = next;
      return;
    }
    
    // 收集副作用
    if (returnFiber !== null) {
      if (returnFiber.firstEffect === null) {
        returnFiber.firstEffect = completedWork.firstEffect;
      }
      if (completedWork.lastEffect !== null) {
        if (returnFiber.lastEffect !== null) {
          returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
        }
        returnFiber.lastEffect = completedWork.lastEffect;
      }
      
      const flags = completedWork.flags;
      if (flags > PerformedWork) {
        if (returnFiber.lastEffect !== null) {
          returnFiber.lastEffect.nextEffect = completedWork;
        } else {
          returnFiber.firstEffect = completedWork;
        }
        returnFiber.lastEffect = completedWork;
      }
    }
    
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 有兄弟节点，处理兄弟节点
      workInProgress = siblingFiber;
      return;
    }
    
    // 没有兄弟节点，返回父节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
```

---

## 问题 6：Render 阶段如何实现可中断？

**通过工作循环和 shouldYield 检查实现中断和恢复**。

### 可中断的工作循环

```javascript
function workLoopConcurrent() {
  // 循环处理工作单元，直到没有工作或需要让出控制权
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

function shouldYield() {
  const currentTime = getCurrentTime();
  return currentTime >= deadline;
}
```

### 中断和恢复

```javascript
// 开始渲染
function renderRootConcurrent(root, lanes) {
  // 准备新的工作栈
  prepareFreshStack(root, lanes);
  
  do {
    try {
      // 执行工作循环
      workLoopConcurrent();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);
  
  if (workInProgress !== null) {
    // 还有工作未完成，返回 InProgress
    return RootInProgress;
  } else {
    // 工作完成
    return workInProgressRootExitStatus;
  }
}
```

---

## 总结

**核心流程**：

### 1. Render 阶段特点
- 可中断的递归过程
- 不产生副作用
- 为 Commit 准备副作用列表

### 2. beginWork
- 根据组件类型处理节点
- 执行组件的 render
- 调用 reconcileChildren 进行 Diff
- 返回子 Fiber 节点

### 3. completeWork
- 创建或更新 DOM 节点
- 收集副作用
- 向上冒泡副作用链

### 4. 遍历顺序
- 深度优先遍历
- 先 beginWork 后 completeWork
- 子节点 -> 兄弟节点 -> 父节点

### 5. 可中断机制
- 工作循环检查 shouldYield
- 保存当前进度
- 下次从断点继续

## 延伸阅读

- [React Render 阶段源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js)
- [深入理解 Render 阶段](https://react.iamkasong.com/process/reconciler.html)
- [Fiber 架构详解](https://github.com/acdlite/react-fiber-architecture)
- [React 协调算法](https://react.dev/learn/preserving-and-resetting-state)
