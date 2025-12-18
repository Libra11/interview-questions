---
title: React Commit 阶段的执行过程
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Commit 阶段的执行流程。Commit 阶段是 React 将 Render 阶段计算出的变更应用到 DOM 的过程，
  分为 Before Mutation、Mutation 和 Layout 三个子阶段。
tags:
  - React
  - Fiber
  - Commit 阶段
  - 生命周期
estimatedTime: 24 分钟
keywords:
  - React Commit
  - DOM 更新
  - 副作用
  - 生命周期
highlight: Commit 阶段同步执行，分为三个子阶段处理不同类型的副作用
order: 354
---

## 问题 1：Commit 阶段是什么？

**Commit 阶段是 React 将 Render 阶段的计算结果应用到真实 DOM 的过程**。

与 Render 阶段不同，Commit 阶段是同步执行的，不能被打断。

### Render 和 Commit 的关系

```
Render 阶段（可中断）
  ↓ 计算出需要的变更
Commit 阶段（同步，不可中断）
  ↓ 应用变更到 DOM
用户看到更新
```

### Commit 阶段的三个子阶段

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 1. Before Mutation 阶段
  // 执行 DOM 操作前
  commitBeforeMutationEffects(finishedWork);
  
  // 2. Mutation 阶段
  // 执行 DOM 操作
  commitMutationEffects(finishedWork, root);
  
  // 切换 current 指针
  root.current = finishedWork;
  
  // 3. Layout 阶段
  // 执行 DOM 操作后
  commitLayoutEffects(finishedWork, root);
}
```

---

## 问题 2：Before Mutation 阶段做了什么？

**Before Mutation 阶段在 DOM 变更之前执行，主要处理 getSnapshotBeforeUpdate 和异步调度 useEffect**。

### 主要工作

```javascript
function commitBeforeMutationEffects(root, firstChild) {
  let fiber = firstChild;
  
  while (fiber !== null) {
    // 处理子树
    if (fiber.child !== null) {
      commitBeforeMutationEffects(root, fiber.child);
    }
    
    // 处理当前节点的副作用
    if (fiber.flags & Snapshot) {
      commitBeforeMutationEffectOnFiber(fiber);
    }
    
    fiber = fiber.sibling;
  }
}

function commitBeforeMutationEffectOnFiber(finishedWork) {
  const current = finishedWork.alternate;
  
  switch (finishedWork.tag) {
    case ClassComponent: {
      if (finishedWork.flags & Snapshot) {
        if (current !== null) {
          // 调用 getSnapshotBeforeUpdate
          const snapshot = instance.getSnapshotBeforeUpdate(
            prevProps,
            prevState
          );
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      break;
    }
  }
}
```

### getSnapshotBeforeUpdate 示例

```jsx
class ScrollingList extends React.Component {
  listRef = React.createRef();

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 在 DOM 更新前获取滚动位置
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 在 DOM 更新后使用 snapshot
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.listRef}>
        {this.props.list.map(item => (
          <div key={item.id}>{item.text}</div>
        ))}
      </div>
    );
  }
}
```

### 调度 useEffect

```javascript
// Before Mutation 阶段会调度 useEffect
function schedulePassiveEffects(finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    
    do {
      const { tag, create, destroy } = effect;
      
      if ((tag & HookPassive) !== NoHookEffect) {
        // 将 effect 加入调度队列
        enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

---

## 问题 3：Mutation 阶段做了什么？

**Mutation 阶段执行真实的 DOM 操作，包括插入、更新和删除节点**。

### 主要工作

```javascript
function commitMutationEffects(root, finishedWork) {
  let fiber = finishedWork;
  
  while (fiber !== null) {
    // 处理子树
    if (fiber.child !== null) {
      commitMutationEffects(root, fiber.child);
    }
    
    // 处理当前节点
    const flags = fiber.flags;
    
    // 处理 ContentReset（重置文本内容）
    if (flags & ContentReset) {
      commitResetTextContent(fiber);
    }
    
    // 处理 Ref（分离旧 ref）
    if (flags & Ref) {
      const current = fiber.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }
    
    // 处理 Placement、Update、Deletion
    const primaryFlags = flags & (Placement | Update | Deletion);
    
    switch (primaryFlags) {
      case Placement: {
        // 插入节点
        commitPlacement(fiber);
        fiber.flags &= ~Placement;
        break;
      }
      case Update: {
        // 更新节点
        const current = fiber.alternate;
        commitWork(current, fiber);
        break;
      }
      case Deletion: {
        // 删除节点
        commitDeletion(root, fiber);
        break;
      }
    }
    
    fiber = fiber.sibling;
  }
}
```

### 插入节点

```javascript
function commitPlacement(finishedWork) {
  // 获取父 DOM 节点
  const parentFiber = getHostParentFiber(finishedWork);
  const parentDOM = parentFiber.stateNode;
  
  // 获取兄弟 DOM 节点（用于 insertBefore）
  const before = getHostSibling(finishedWork);
  
  // 插入 DOM
  if (before) {
    insertBefore(parentDOM, finishedWork.stateNode, before);
  } else {
    appendChild(parentDOM, finishedWork.stateNode);
  }
}
```

### 更新节点

```javascript
function commitWork(current, finishedWork) {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // 执行 useLayoutEffect 的销毁函数
      commitHookEffectListUnmount(HookLayout, finishedWork);
      return;
    }
    case HostComponent: {
      const instance = finishedWork.stateNode;
      if (instance != null) {
        const newProps = finishedWork.memoizedProps;
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        
        // 更新 DOM 属性
        const updatePayload = finishedWork.updateQueue;
        finishedWork.updateQueue = null;
        
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork
          );
        }
      }
      return;
    }
  }
}
```

### 删除节点

```javascript
function commitDeletion(root, current) {
  // 递归删除子树
  unmountHostComponents(root, current);
  
  // 分离 Fiber 节点
  detachFiberMutation(current);
}

function unmountHostComponents(root, current) {
  let node = current;
  
  while (true) {
    // 调用组件的卸载方法
    if (node.tag === ClassComponent) {
      safelyCallComponentWillUnmount(current, instance);
    } else if (node.tag === HostComponent) {
      // 分离 ref
      safelyDetachRef(node);
    } else if (node.tag === FunctionComponent) {
      // 执行 useEffect 的清理函数
      commitHookEffectListUnmount(HookPassive, node);
    }
    
    // 遍历子树
    if (node.child !== null) {
      node = node.child;
      continue;
    }
    
    if (node === current) {
      return;
    }
    
    while (node.sibling === null) {
      if (node.return === null || node.return === current) {
        return;
      }
      node = node.return;
    }
    
    node = node.sibling;
  }
}
```

---

## 问题 4：Layout 阶段做了什么？

**Layout 阶段在 DOM 变更完成后执行，主要处理 componentDidMount/Update 和 useLayoutEffect**。

### 主要工作

```javascript
function commitLayoutEffects(root, finishedWork) {
  let fiber = finishedWork;
  
  while (fiber !== null) {
    const flags = fiber.flags;
    
    // 处理 Update 或 Callback
    if (flags & (Update | Callback)) {
      const current = fiber.alternate;
      commitLayoutEffectOnFiber(root, current, fiber);
    }
    
    // 重新绑定 ref
    if (flags & Ref) {
      commitAttachRef(fiber);
    }
    
    // 处理子节点
    if (fiber.child !== null) {
      commitLayoutEffects(root, fiber.child);
    }
    
    fiber = fiber.sibling;
  }
}
```

### 执行生命周期

```javascript
function commitLayoutEffectOnFiber(
  finishedRoot,
  current,
  finishedWork
) {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      // 执行 useLayoutEffect
      commitHookEffectListMount(HookLayout, finishedWork);
      break;
    }
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      
      if (finishedWork.flags & Update) {
        if (current === null) {
          // 首次渲染，调用 componentDidMount
          instance.componentDidMount();
        } else {
          // 更新，调用 componentDidUpdate
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const snapshot = instance.__reactInternalSnapshotBeforeUpdate;
          
          instance.componentDidUpdate(
            prevProps,
            prevState,
            snapshot
          );
        }
      }
      
      // 执行 setState 的回调
      const updateQueue = finishedWork.updateQueue;
      if (updateQueue !== null) {
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      break;
    }
  }
}
```

### 绑定 ref

```javascript
function commitAttachRef(finishedWork) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    
    // 根据 ref 类型设置值
    if (typeof ref === 'function') {
      // ref 回调
      ref(instance);
    } else {
      // ref 对象
      ref.current = instance;
    }
  }
}
```

---

## 问题 5：useEffect 何时执行？

**useEffect 在 Layout 阶段之后异步执行**。

### 执行时机

```javascript
// Commit 阶段完成后
function commitRootImpl(root) {
  // Before Mutation
  commitBeforeMutationEffects(root, finishedWork);
  
  // Mutation
  commitMutationEffects(root, finishedWork);
  
  // 切换 current
  root.current = finishedWork;
  
  // Layout
  commitLayoutEffects(root, finishedWork);
  
  // 调度 useEffect（异步）
  if (rootDoesHavePassiveEffects) {
    scheduleCallback(NormalPriority, () => {
      flushPassiveEffects();
      return null;
    });
  }
}
```

### useEffect vs useLayoutEffect

```jsx
function Component() {
  useLayoutEffect(() => {
    console.log('1. useLayoutEffect');
    return () => console.log('cleanup useLayoutEffect');
  });

  useEffect(() => {
    console.log('2. useEffect');
    return () => console.log('cleanup useEffect');
  });

  return <div>Component</div>;
}

// 首次渲染输出顺序：
// 1. useLayoutEffect
// 2. useEffect

// 卸载时输出顺序：
// cleanup useLayoutEffect
// cleanup useEffect
```

---

## 问题 6：Commit 阶段的完整流程是什么？

**从 Render 完成到用户看到更新的完整流程**。

### 完整流程图

```
Render 阶段完成
  ↓
Before Mutation 阶段
  ├─ 调用 getSnapshotBeforeUpdate
  └─ 调度 useEffect
  ↓
Mutation 阶段
  ├─ 执行 DOM 操作（插入、更新、删除）
  ├─ 执行 useLayoutEffect 的清理函数
  └─ 分离 ref
  ↓
切换 current 指针
  ↓
Layout 阶段
  ├─ 调用 componentDidMount/Update
  ├─ 执行 useLayoutEffect
  ├─ 绑定 ref
  └─ 执行 setState 回调
  ↓
异步执行 useEffect
  ↓
用户看到更新
```

---

## 总结

**核心流程**：

### 1. Commit 阶段特点
- 同步执行，不可中断
- 分为三个子阶段
- 应用 Render 阶段的计算结果

### 2. Before Mutation 阶段
- DOM 变更前执行
- 调用 getSnapshotBeforeUpdate
- 调度 useEffect

### 3. Mutation 阶段
- 执行真实 DOM 操作
- 插入、更新、删除节点
- 执行 useLayoutEffect 清理

### 4. Layout 阶段
- DOM 变更后执行
- 调用 componentDidMount/Update
- 执行 useLayoutEffect
- 绑定 ref

### 5. useEffect 执行时机
- Layout 阶段之后异步执行
- 不阻塞浏览器绘制
- 适合非关键的副作用

## 延伸阅读

- [React Commit 阶段源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js)
- [深入理解 Commit 阶段](https://react.iamkasong.com/renderer/prepare.html)
- [useEffect vs useLayoutEffect](https://kentcdodds.com/blog/useeffect-vs-uselayouteffect)
- [React 生命周期详解](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)
