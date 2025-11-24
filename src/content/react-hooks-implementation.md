---
title: React Hooks 实现原理是什么
category: React
difficulty: 高级
updatedAt: 2025-11-24
summary: >-
  深入理解 React Hooks 的底层实现原理。Hooks 通过链表结构存储状态，
  利用闭包和调用顺序保证状态的正确性。
tags:
  - React
  - Hooks
  - 实现原理
  - 源码解析
estimatedTime: 26 分钟
keywords:
  - Hooks 原理
  - memoizedState
  - Hooks 链表
  - 闭包
highlight: Hooks 通过 Fiber 节点的 memoizedState 链表存储状态
order: 118
---

## 问题 1：Hooks 的存储结构是什么？

**Hooks 通过链表结构存储在 Fiber 节点的 memoizedState 属性上**。

### Hook 对象结构

```javascript
const hook = {
  memoizedState: null,  // 当前状态值
  baseState: null,      // 基础状态
  baseQueue: null,      // 基础更新队列
  queue: null,          // 更新队列
  next: null            // 指向下一个 Hook
};
```

### Hooks 链表

```jsx
function Component() {
  const [count, setCount] = useState(0);      // Hook 1
  const [name, setName] = useState('React');  // Hook 2
  useEffect(() => {}, []);                    // Hook 3
  
  // Fiber.memoizedState -> Hook1 -> Hook2 -> Hook3 -> null
}
```

---

## 问题 2：useState 是如何实现的？

**useState 在首次渲染和更新时有不同的实现**。

### 首次渲染（mount）

```javascript
function mountState(initialState) {
  // 创建 Hook 对象
  const hook = mountWorkInProgressHook();
  
  // 初始化状态
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  
  // 创建更新队列
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  hook.queue = queue;
  
  // 创建 dispatch 函数
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  
  return [hook.memoizedState, dispatch];
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  
  if (workInProgressHook === null) {
    // 第一个 Hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 后续 Hook，追加到链表
    workInProgressHook = workInProgressHook.next = hook;
  }
  
  return workInProgressHook;
}
```

### 更新时（update）

```javascript
function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function updateReducer(reducer, initialArg) {
  // 获取当前 Hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  
  // 获取待处理的更新
  const pending = queue.pending;
  
  if (pending !== null) {
    // 处理更新队列
    const first = pending.next;
    let newState = hook.baseState;
    let update = first;
    
    do {
      // 计算新状态
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== first);
    
    // 保存新状态
    hook.memoizedState = newState;
    hook.baseState = newState;
    queue.pending = null;
  }
  
  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook() {
  // 从 current 树获取对应的 Hook
  let nextCurrentHook;
  
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    nextCurrentHook = current.memoizedState;
  } else {
    nextCurrentHook = currentHook.next;
  }
  
  // 复制到 workInProgress 树
  const newHook = {
    memoizedState: nextCurrentHook.memoizedState,
    baseState: nextCurrentHook.baseState,
    baseQueue: nextCurrentHook.baseQueue,
    queue: nextCurrentHook.queue,
    next: null
  };
  
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  
  currentHook = nextCurrentHook;
  return workInProgressHook;
}
```

---

## 问题 3：useEffect 是如何实现的？

**useEffect 创建 effect 对象，存储在 Hook 的 memoizedState 中**。

### mountEffect 实现

```javascript
function mountEffect(create, deps) {
  return mountEffectImpl(
    PassiveEffect,  // effect 标记
    HookPassive,    // Hook 标记
    create,
    deps
  );
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  // 创建 Hook
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 标记 Fiber 有副作用
  currentlyRenderingFiber.flags |= fiberFlags;
  
  // 创建 effect 对象
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,          // effect 类型
    create,       // effect 函数
    destroy,      // 清理函数
    deps,         // 依赖数组
    next: null    // 下一个 effect
  };
  
  // 获取组件的 effect 链表
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  
  if (componentUpdateQueue === null) {
    // 创建环形链表
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 追加到链表
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  
  return effect;
}
```

### updateEffect 实现

```javascript
function updateEffect(create, deps) {
  return updateEffectImpl(
    PassiveEffect,
    HookPassive,
    create,
    deps
  );
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;
  
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      
      // 比较依赖是否变化
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖未变化，不执行 effect
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }
  
  // 依赖变化，标记需要执行 effect
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }
  
  // 逐个比较依赖项
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  
  return true;
}
```

---

## 问题 4：为什么 Hooks 必须按顺序调用？

**因为 Hooks 依赖调用顺序来匹配状态**。

### 顺序调用的重要性

```jsx
// ✅ 正确：顺序固定
function Component({ condition }) {
  const [count, setCount] = useState(0);      // Hook 1
  const [name, setName] = useState('React');  // Hook 2
  useEffect(() => {}, []);                    // Hook 3
  
  // 每次渲染，Hook 的顺序都是：1 -> 2 -> 3
}

// ❌ 错误：顺序可能变化
function Component({ condition }) {
  const [count, setCount] = useState(0);      // 总是 Hook 1
  
  if (condition) {
    const [name, setName] = useState('React'); // 有时是 Hook 2
  }
  
  useEffect(() => {}, []);                    // 有时是 Hook 2，有时是 Hook 3
  
  // Hook 顺序不一致，导致状态错乱
}
```

### 状态匹配机制

```javascript
// 首次渲染
function Component() {
  const [count] = useState(0);     // 创建 Hook1，保存 count
  const [name] = useState('React'); // 创建 Hook2，保存 name
  
  // Fiber.memoizedState -> Hook1(count) -> Hook2(name) -> null
}

// 更新时
function Component() {
  const [count] = useState(0);     // 读取 Hook1，获取 count
  const [name] = useState('React'); // 读取 Hook2，获取 name
  
  // 按顺序读取链表，Hook1 对应 count，Hook2 对应 name
}

// 如果顺序变化
function Component() {
  const [count] = useState(0);     // 读取 Hook1，获取 count ✓
  // 跳过了第二个 useState
  useEffect(() => {}, []);         // 读取 Hook2，期望 effect，实际是 name ✗
  
  // 状态错乱！
}
```

---

## 问题 5：useMemo 和 useCallback 如何实现？

**useMemo 缓存计算结果，useCallback 缓存函数**。

### useMemo 实现

```javascript
function mountMemo(nextCreate, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 执行计算函数
  const nextValue = nextCreate();
  
  // 保存 [值, 依赖]
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      
      // 比较依赖
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖未变化，返回缓存的值
        return prevState[0];
      }
    }
  }
  
  // 依赖变化，重新计算
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

### useCallback 实现

```javascript
function mountCallback(callback, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  // 保存 [函数, 依赖]
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateCallback(callback, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      
      // 比较依赖
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖未变化，返回缓存的函数
        return prevState[0];
      }
    }
  }
  
  // 依赖变化，保存新函数
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

---

## 问题 6：Hooks 如何实现闭包？

**Hooks 利用闭包保存状态和函数**。

### 闭包示例

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    // 这里的 count 是闭包捕获的值
    console.log('当前 count:', count);
    
    setTimeout(() => {
      // 1 秒后，count 仍然是点击时的值
      console.log('1 秒前的 count:', count);
    }, 1000);
  };
  
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={handleClick}>点击</button>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  );
}

// 点击流程：
// 1. 点击"点击"按钮，count = 0
// 2. 立即输出：当前 count: 0
// 3. 点击"+1"按钮，count = 1
// 4. 1 秒后输出：1 秒前的 count: 0（闭包捕获的旧值）
```

### 避免闭包陷阱

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  const handleClick = () => {
    setTimeout(() => {
      // 使用 ref 获取最新值
      console.log('最新 count:', countRef.current);
    }, 1000);
  };
  
  return (
    <>
      <p>Count: {count}</p>
      <button onClick={handleClick}>点击</button>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </>
  );
}
```

---

## 问题 7：Hooks 的调度机制是什么？

**Hooks 的更新通过调度器进行优先级调度**。

### dispatchSetState 实现

```javascript
function dispatchSetState(fiber, queue, action) {
  // 创建更新对象
  const update = {
    action,
    next: null
  };
  
  // 将更新加入队列
  const pending = queue.pending;
  if (pending === null) {
    // 创建环形链表
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
  
  // 调度更新
  scheduleUpdateOnFiber(fiber);
}

function scheduleUpdateOnFiber(fiber) {
  // 标记 Fiber 需要更新
  const root = markUpdateLaneFromFiberToRoot(fiber);
  
  // 调度渲染
  ensureRootIsScheduled(root);
}
```

---

## 总结

**核心原理**：

### 1. 存储结构
- Hooks 存储在 Fiber.memoizedState
- 使用链表结构
- 每个 Hook 是链表的一个节点

### 2. 调用顺序
- 依赖调用顺序匹配状态
- 不能在条件语句中调用
- 必须在组件顶层调用

### 3. 不同 Hook 的实现
- useState：存储状态值
- useEffect：存储 effect 对象
- useMemo：存储 [值, 依赖]
- useCallback：存储 [函数, 依赖]

### 4. 闭包机制
- Hooks 利用闭包保存状态
- 可能产生闭包陷阱
- 使用 ref 获取最新值

### 5. 更新机制
- 创建更新对象
- 加入更新队列
- 通过调度器调度

## 延伸阅读

- [React Hooks 源码](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js)
- [Hooks 实现原理](https://react.iamkasong.com/hooks/prepare.html)
- [深入理解 Hooks](https://overreacted.io/how-does-setstate-know-what-to-do/)
- [Hooks FAQ](https://react.dev/reference/react/hooks)
