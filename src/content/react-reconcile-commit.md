---
title: reconcile 与 commit 阶段分别做什么？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 渲染的两个阶段：reconcile（协调）和 commit（提交），掌握各阶段的职责。
tags:
  - React
  - Fiber
  - Reconcile
  - Commit
estimatedTime: 15 分钟
keywords:
  - reconcile phase
  - commit phase
  - render phase
  - DOM update
highlight: Reconcile 阶段计算变化（可中断），Commit 阶段执行 DOM 更新（不可中断）。
order: 588
---

## 问题 1：两个阶段的概述？

### 整体流程

```
状态更新 → Reconcile 阶段 → Commit 阶段 → 页面更新
              (可中断)        (不可中断)
```

### 职责划分

```jsx
// Reconcile 阶段（也叫 Render 阶段）
// - 构建 Fiber 树
// - Diff 算法比较
// - 标记副作用
// - 可以被中断

// Commit 阶段
// - 执行 DOM 操作
// - 调用生命周期/Hooks
// - 不可中断
```

---

## 问题 2：Reconcile 阶段做什么？

### 1. 构建 workInProgress 树

```jsx
function beginWork(current, workInProgress) {
  // 根据组件类型处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
  }
}
```

### 2. Diff 比较

```jsx
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 首次渲染，直接创建
    workInProgress.child = mountChildFibers(workInProgress, nextChildren);
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

### 3. 标记副作用

```jsx
function completeWork(current, workInProgress) {
  // 比较 props，标记更新
  if (current !== null && workInProgress.stateNode !== null) {
    updateHostComponent(current, workInProgress);

    if (propsChanged) {
      workInProgress.flags |= Update;
    }
  }

  // 收集子树副作用
  workInProgress.subtreeFlags |= child.subtreeFlags;
  workInProgress.subtreeFlags |= child.flags;
}
```

---

## 问题 3：Commit 阶段做什么？

### 三个子阶段

```jsx
function commitRoot(root) {
  // 1. Before Mutation（DOM 操作前）
  commitBeforeMutationEffects(root);

  // 2. Mutation（DOM 操作）
  commitMutationEffects(root);

  // 3. Layout（DOM 操作后）
  commitLayoutEffects(root);
}
```

### Before Mutation 阶段

```jsx
function commitBeforeMutationEffects(fiber) {
  // 调用 getSnapshotBeforeUpdate
  if (fiber.flags & Snapshot) {
    const snapshot = instance.getSnapshotBeforeUpdate(prevProps, prevState);
    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
  }

  // 调度 useEffect（异步）
  if (fiber.flags & Passive) {
    scheduleCallback(flushPassiveEffects);
  }
}
```

### Mutation 阶段

```jsx
function commitMutationEffects(fiber) {
  // 执行 DOM 操作
  switch (fiber.flags) {
    case Placement:
      commitPlacement(fiber); // 插入
      break;
    case Update:
      commitUpdate(fiber); // 更新
      break;
    case Deletion:
      commitDeletion(fiber); // 删除
      break;
  }
}

function commitPlacement(fiber) {
  const parent = getHostParent(fiber);
  parent.appendChild(fiber.stateNode);
}
```

### Layout 阶段

```jsx
function commitLayoutEffects(fiber) {
  // 调用 componentDidMount / componentDidUpdate
  if (fiber.flags & Update) {
    if (fiber.tag === ClassComponent) {
      instance.componentDidMount();
      // 或 instance.componentDidUpdate()
    }
  }

  // 调用 useLayoutEffect
  if (fiber.flags & LayoutEffect) {
    commitHookLayoutEffects(fiber);
  }

  // 更新 ref
  if (fiber.flags & Ref) {
    commitAttachRef(fiber);
  }
}
```

---

## 问题 4：为什么 Commit 不能中断？

### 原因

```jsx
// 假设 Commit 可以中断：

// 1. 插入节点 A
// 2. 中断，让出控制权
// 3. 用户看到不完整的 UI
// 4. 继续插入节点 B

// 问题：
// - UI 不一致
// - 闪烁
// - 可能触发错误的事件
```

### 保证一致性

```jsx
// Commit 阶段必须同步完成
// 确保 DOM 状态和 React 状态一致
// 用户看到的永远是完整的 UI
```

---

## 问题 5：生命周期/Hooks 在哪个阶段调用？

### 调用时机

| 方法/Hook               | 阶段            | 时机               |
| ----------------------- | --------------- | ------------------ |
| render                  | Reconcile       | 构建 Fiber 时      |
| getSnapshotBeforeUpdate | Before Mutation | DOM 更新前         |
| componentDidMount       | Layout          | DOM 更新后         |
| componentDidUpdate      | Layout          | DOM 更新后         |
| useLayoutEffect         | Layout          | DOM 更新后（同步） |
| useEffect               | 异步调度        | DOM 更新后（异步） |

### 代码示例

```jsx
function Component() {
  // Reconcile 阶段执行
  console.log("render");

  useLayoutEffect(() => {
    // Layout 阶段执行（同步）
    console.log("useLayoutEffect");
  });

  useEffect(() => {
    // Commit 后异步执行
    console.log("useEffect");
  });

  return <div>Hello</div>;
}

// 输出顺序：
// 1. render
// 2. useLayoutEffect
// 3. useEffect
```

## 总结

| 阶段            | 职责                         | 可中断 |
| --------------- | ---------------------------- | ------ |
| Reconcile       | 构建 Fiber、Diff、标记副作用 | ✅     |
| Before Mutation | getSnapshotBeforeUpdate      | ❌     |
| Mutation        | DOM 操作                     | ❌     |
| Layout          | 生命周期、useLayoutEffect    | ❌     |

## 延伸阅读

- [React 渲染流程](https://react.dev/learn/render-and-commit)
- [Fiber 协调过程](https://github.com/acdlite/react-fiber-architecture)
