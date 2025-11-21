---
title: React useEffect 钩子的工作原理是什么
category: React
difficulty: 中级
updatedAt: 2025-11-21
summary: >-
  深入理解 useEffect 的执行时机、依赖项比较机制、清理函数的作用，以及 useEffect 在 React 渲染流程中的位置和实现原理。
tags:
  - React
  - Hooks
  - useEffect
  - 副作用
estimatedTime: 25 分钟
keywords:
  - useEffect
  - React Hooks
  - 副作用管理
  - 依赖项
highlight: 掌握 useEffect 的核心原理和执行机制，理解副作用在 React 中的处理方式
order: 3
---

## 问题 1：useEffect 的基本执行流程是什么？

### useEffect 的执行时机

`useEffect` 会在组件渲染到屏幕**之后**异步执行，这是它与 `useLayoutEffect` 的主要区别。

```jsx
function Component() {
  console.log('1. 组件函数执行');
  
  useEffect(() => {
    console.log('3. useEffect 执行');
    
    return () => {
      console.log('4. 清理函数执行（下次 effect 前或组件卸载时）');
    };
  });
  
  console.log('2. 组件函数执行完毕');
  
  return <div>Hello</div>;
}

// 输出顺序：
// 1. 组件函数执行
// 2. 组件函数执行完毕
// (DOM 更新到屏幕)
// 3. useEffect 执行
```

### 完整的执行流程

```javascript
// React 内部的简化执行流程
function commitRoot(root) {
  // 1. 执行 DOM 更新
  commitMutationEffects(root);
  
  // 2. 浏览器绘制（用户可以看到更新）
  
  // 3. 异步执行 useEffect
  scheduleCallback(() => {
    commitLayoutEffects(root);
    flushPassiveEffects(); // 执行 useEffect
  });
}

function flushPassiveEffects() {
  // 先执行所有的清理函数
  commitPassiveUnmountEffects();
  
  // 再执行所有的 effect 函数
  commitPassiveMountEffects();
}
```

---

## 问题 2：useEffect 的依赖项是如何工作的？

### 依赖项的比较机制

React 使用 `Object.is` 来比较依赖项的变化，这是一种**浅比较**。

```jsx
function Component({ user }) {
  // ❌ 对象依赖的问题
  useEffect(() => {
    console.log('user 变化了');
  }, [user]); // user 对象的引用变化就会触发
  
  // ✅ 只依赖需要的属性
  useEffect(() => {
    console.log('user.id 变化了');
  }, [user.id]); // 只有 id 变化才触发
}

// React 内部的依赖比较逻辑
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false; // 首次渲染，必须执行
  }
  
  for (let i = 0; i < prevDeps.length; i++) {
    // 使用 Object.is 进行比较
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false; // 有任何一个依赖变化，返回 false
  }
  
  return true; // 所有依赖都没变化
}
```

### 三种依赖项模式

```jsx
function Component() {
  // 1. 无依赖项：每次渲染后都执行
  useEffect(() => {
    console.log('每次渲染都执行');
  });
  
  // 2. 空依赖项：只在挂载时执行一次
  useEffect(() => {
    console.log('只在挂载时执行');
  }, []);
  
  // 3. 有依赖项：依赖项变化时执行
  useEffect(() => {
    console.log('count 变化时执行');
  }, [count]);
}
```

### 依赖项的常见陷阱

```jsx
function Component() {
  const [count, setCount] = useState(0);
  
  // ❌ 缺少依赖项
  useEffect(() => {
    const timer = setInterval(() => {
      // 这里的 count 永远是初始值 0
      console.log(count);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // 缺少 count 依赖
  
  // ✅ 方案 1：添加依赖项
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [count]); // 每次 count 变化都会重新创建定时器
  
  // ✅ 方案 2：使用函数式更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        console.log(c); // 总是获取最新值
        return c;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // 不需要依赖 count
}
```

---

## 问题 3：useEffect 在 React 内部是如何实现的？

### Hook 的数据结构

React 使用链表来存储 Hook 的状态。

```javascript
// Hook 的数据结构
type Hook = {
  memoizedState: any,        // 存储 effect 的状态
  baseState: any,
  baseQueue: Update<any> | null,
  queue: UpdateQueue<any> | null,
  next: Hook | null,         // 指向下一个 Hook
};

// Effect 的数据结构
type Effect = {
  tag: HookFlags,            // effect 的类型标记
  create: () => (() => void) | void,  // effect 函数
  destroy: (() => void) | void,       // 清理函数
  deps: Array<mixed> | null, // 依赖项数组
  next: Effect,              // 指向下一个 effect
};
```

### useEffect 的挂载阶段

```javascript
// 简化的 mountEffect 实现
function mountEffect(create, deps) {
  const hook = mountWorkInProgressHook(); // 创建新的 Hook
  const nextDeps = deps === undefined ? null : deps;
  
  // 标记当前 fiber 有副作用
  currentlyRenderingFiber.flags |= PassiveEffect;
  
  // 创建 effect 对象并存储
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive, // 标记需要执行
    create,                       // effect 函数
    undefined,                    // 清理函数（首次为空）
    nextDeps                      // 依赖项
  );
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };
  
  // 将 effect 添加到 fiber 的 effect 链表中
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }
  
  return effect;
}
```

### useEffect 的更新阶段

```javascript
// 简化的 updateEffect 实现
function updateEffect(create, deps) {
  const hook = updateWorkInProgressHook(); // 获取对应的 Hook
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;
  
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy; // 获取上次的清理函数
    
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      // 比较依赖项
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖项没变，不需要执行，但仍要添加到链表中
        pushEffect(HookPassive, create, destroy, nextDeps);
        return;
      }
    }
  }
  
  // 依赖项变化了，标记需要执行
  currentlyRenderingFiber.flags |= PassiveEffect;
  hook.memoizedState = pushEffect(
    HookHasEffect | HookPassive,
    create,
    destroy,
    nextDeps
  );
}
```

### Effect 的执行阶段

```javascript
// 执行所有的 effect
function commitPassiveMountEffects(finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    
    do {
      const { tag, create, destroy } = effect;
      
      // 检查是否需要执行
      if ((tag & HookHasEffect) !== NoHookEffect) {
        // 先执行清理函数
        if (destroy !== undefined) {
          destroy();
        }
        
        // 再执行 effect 函数，并保存返回的清理函数
        const newDestroy = create();
        effect.destroy = newDestroy !== undefined ? newDestroy : undefined;
      }
      
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

---

## 问题 4：清理函数的作用和执行时机是什么？

### 清理函数的作用

清理函数用于清理副作用，防止内存泄漏和意外行为。

```jsx
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 订阅
    const subscription = subscribe(count);
    
    // 返回清理函数
    return () => {
      // 取消订阅，防止内存泄漏
      subscription.unsubscribe();
    };
  }, [count]);
}
```

### 清理函数的执行时机

```jsx
function Component({ id }) {
  useEffect(() => {
    console.log(`订阅 ${id}`);
    
    return () => {
      console.log(`取消订阅 ${id}`);
    };
  }, [id]);
  
  return <div>{id}</div>;
}

// 执行顺序：
// 1. 首次渲染 (id=1)
//    -> "订阅 1"

// 2. id 变为 2
//    -> "取消订阅 1"  (先执行清理)
//    -> "订阅 2"      (再执行新的 effect)

// 3. 组件卸载
//    -> "取消订阅 2"
```

### 常见的清理场景

```jsx
function Component() {
  // 1. 清理定时器
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('延迟执行');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 2. 清理事件监听
  useEffect(() => {
    const handleResize = () => {
      console.log('窗口大小变化');
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 3. 清理订阅
  useEffect(() => {
    const subscription = dataSource.subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // 4. 取消网络请求
  useEffect(() => {
    const controller = new AbortController();
    
    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('请求被取消');
        }
      });
    
    return () => {
      controller.abort();
    };
  }, []);
}
```

---

## 总结

**核心原理**：

### 1. 执行时机

- 在组件渲染到屏幕**之后**异步执行
- 不会阻塞浏览器绘制
- 执行顺序：组件渲染 → DOM 更新 → 浏览器绘制 → useEffect 执行

### 2. 依赖项机制

- 使用 `Object.is` 进行浅比较
- 无依赖项：每次都执行
- 空数组：只执行一次
- 有依赖项：依赖变化时执行

### 3. 内部实现

- 使用链表存储 Hook 和 Effect
- 通过 flags 标记是否需要执行
- 在 commit 阶段异步执行所有 effect

### 4. 清理函数

- 在下一次 effect 执行前调用
- 在组件卸载时调用
- 用于清理订阅、定时器、事件监听等

## 延伸阅读

- [React 官方文档 - useEffect](https://react.dev/reference/react/useEffect)
- [React 官方文档 - Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [useEffect 完整指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [React Hooks 源码解析](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js)
