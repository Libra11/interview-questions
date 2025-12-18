---
title: useSyncExternalStore 是做什么的？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 useSyncExternalStore 的用途，掌握如何安全地订阅外部数据源。
tags:
  - React
  - Hooks
  - useSyncExternalStore
  - 外部状态
estimatedTime: 15 分钟
keywords:
  - useSyncExternalStore
  - external store
  - subscription
  - concurrent mode
highlight: useSyncExternalStore 用于安全地订阅外部数据源，解决并发渲染中的撕裂问题。
order: 508
---

## 问题 1：为什么需要 useSyncExternalStore？

### 并发渲染的问题

React 18 的并发渲染可能导致"撕裂"（tearing）问题。

```jsx
// 外部 store
let externalStore = { value: 1 };

function Component() {
  // 问题：并发渲染时，可能读到不一致的值
  const value = externalStore.value;

  // 渲染过程中，externalStore.value 可能被修改
  // 导致同一次渲染中读到不同的值
}
```

### useSyncExternalStore 解决方案

```jsx
import { useSyncExternalStore } from "react";

function Component() {
  const value = useSyncExternalStore(
    subscribe, // 订阅函数
    getSnapshot // 获取当前值
  );
  // 保证渲染期间值的一致性
}
```

---

## 问题 2：基本用法是什么？

### API 签名

```jsx
const snapshot = useSyncExternalStore(
  subscribe,      // (callback) => unsubscribe
  getSnapshot,    // () => snapshot
  getServerSnapshot?  // SSR 用
);
```

### 基本示例

```jsx
// 外部 store
const store = {
  state: { count: 0 },
  listeners: new Set(),

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  getSnapshot() {
    return this.state;
  },

  increment() {
    this.state = { count: this.state.count + 1 };
    this.listeners.forEach((l) => l());
  },
};

// 使用
function Counter() {
  const state = useSyncExternalStore(
    (callback) => store.subscribe(callback),
    () => store.getSnapshot()
  );

  return <button onClick={() => store.increment()}>{state.count}</button>;
}
```

---

## 问题 3：常见使用场景？

### 1. 订阅浏览器 API

```jsx
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine
  );
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? "在线" : "离线"}</div>;
}
```

### 2. 订阅第三方状态库

```jsx
// 订阅 Redux store
function useSelector(selector) {
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getState())
  );
}

function Counter() {
  const count = useSelector((state) => state.count);
  return <div>{count}</div>;
}
```

### 3. 订阅 URL 变化

```jsx
function useHash() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("hashchange", callback);
      return () => window.removeEventListener("hashchange", callback);
    },
    () => window.location.hash
  );
}
```

---

## 问题 4：与 useEffect 订阅有什么区别？

### useEffect 方式（有问题）

```jsx
// ❌ 并发模式下可能有问题
function useStore(store) {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, [store]);

  return state;
}
```

### useSyncExternalStore 方式（推荐）

```jsx
// ✅ 并发安全
function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.getState);
}
```

### 区别

| 特性     | useEffect    | useSyncExternalStore |
| -------- | ------------ | -------------------- |
| 并发安全 | ❌ 可能撕裂  | ✅ 安全              |
| 首次渲染 | 先渲染再订阅 | 同步订阅             |
| SSR 支持 | 需要额外处理 | 内置支持             |

---

## 问题 5：注意事项？

### getSnapshot 必须返回不可变值

```jsx
// ❌ 错误：每次返回新对象
useSyncExternalStore(
  subscribe,
  () => ({ ...store.state }) // 每次都是新引用，会无限循环
);

// ✅ 正确：返回相同引用
useSyncExternalStore(
  subscribe,
  () => store.state // 只有真正变化时才返回新引用
);
```

### 使用选择器时要缓存

```jsx
// ❌ 每次渲染都创建新函数
function useCount() {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().count // OK，返回原始值
  );
}

// 如果返回对象，需要缓存
function useUser() {
  const getSnapshot = useCallback(() => store.getState().user, []);
  return useSyncExternalStore(store.subscribe, getSnapshot);
}
```

## 总结

**useSyncExternalStore 要点**：

1. **用途**：安全订阅外部数据源
2. **解决问题**：并发渲染的撕裂问题
3. **适用场景**：浏览器 API、第三方状态库
4. **注意**：getSnapshot 返回值要稳定

## 延伸阅读

- [useSyncExternalStore 文档](https://react.dev/reference/react/useSyncExternalStore)
- [React 18 并发特性](https://react.dev/blog/2022/03/29/react-v18)
- [撕裂问题解释](https://github.com/reactwg/react-18/discussions/69)
