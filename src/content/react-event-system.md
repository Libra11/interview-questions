---
title: React 事件系统的原理是什么？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React 事件系统的工作原理，掌握事件委托和合成事件机制。
tags:
  - React
  - 事件系统
  - 事件委托
  - SyntheticEvent
estimatedTime: 15 分钟
keywords:
  - React event system
  - event delegation
  - SyntheticEvent
  - event pooling
highlight: React 使用事件委托将所有事件统一绑定到根节点，通过合成事件抹平浏览器差异。
order: 554
---

## 问题 1：React 事件系统如何工作？

### 事件委托

React 不会把事件绑定到具体 DOM 元素上，而是**统一绑定到根节点**。

```jsx
// 你写的代码
<button onClick={handleClick}>Click</button>

// React 实际做的（简化）
// 不是：button.addEventListener('click', handleClick)
// 而是：rootNode.addEventListener('click', dispatchEvent)
```

### 工作流程

```
用户点击 button
    ↓
事件冒泡到根节点
    ↓
React 捕获原生事件
    ↓
根据事件目标找到对应的 Fiber 节点
    ↓
收集该节点及祖先节点的事件处理函数
    ↓
创建合成事件对象
    ↓
按顺序执行事件处理函数
```

---

## 问题 2：事件委托的好处？

### 1. 减少内存占用

```jsx
// 1000 个列表项
<ul>
  {items.map((item) => (
    <li key={item.id} onClick={() => handleClick(item)}>
      {item.name}
    </li>
  ))}
</ul>

// 原生方式：1000 个事件监听器
// React 方式：1 个事件监听器（在根节点）
```

### 2. 动态绑定

```jsx
// 新增/删除元素不需要重新绑定事件
function List({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li onClick={handleClick}>{item.name}</li>
      ))}
    </ul>
  );
}
// items 变化时，不需要处理事件绑定
```

### 3. 统一管理

```jsx
// React 可以统一处理：
// - 事件优先级
// - 批量更新
// - 跨浏览器兼容
```

---

## 问题 3：事件处理流程详解？

### 注册阶段

```jsx
// React 启动时，在根节点注册所有支持的事件
const root = createRoot(container);

// 内部会执行类似：
allNativeEvents.forEach((eventName) => {
  container.addEventListener(eventName, dispatchEvent);
});
```

### 触发阶段

```jsx
function dispatchEvent(nativeEvent) {
  // 1. 获取事件目标
  const target = nativeEvent.target;

  // 2. 找到对应的 Fiber 节点
  const fiber = getClosestFiber(target);

  // 3. 收集事件处理函数（从目标到根）
  const listeners = collectListeners(fiber, eventName);

  // 4. 创建合成事件
  const syntheticEvent = new SyntheticEvent(nativeEvent);

  // 5. 执行处理函数
  listeners.forEach((listener) => {
    listener(syntheticEvent);
  });
}
```

---

## 问题 4：事件执行顺序？

### 捕获和冒泡

```jsx
function App() {
  return (
    <div
      onClickCapture={() => console.log("div capture")}
      onClick={() => console.log("div bubble")}
    >
      <button
        onClickCapture={() => console.log("button capture")}
        onClick={() => console.log("button bubble")}
      >
        Click
      </button>
    </div>
  );
}

// 点击 button，输出顺序：
// 1. div capture
// 2. button capture
// 3. button bubble
// 4. div bubble
```

### 与原生事件的顺序

```jsx
function App() {
  const buttonRef = useRef();

  useEffect(() => {
    buttonRef.current.addEventListener("click", () => {
      console.log("native");
    });
  }, []);

  return (
    <button ref={buttonRef} onClick={() => console.log("react")}>
      Click
    </button>
  );
}

// React 17+：native → react（同一阶段）
// React 16：react → native（React 绑定在 document）
```

## 总结

**React 事件系统核心**：

| 特性     | 说明               |
| -------- | ------------------ |
| 事件委托 | 统一绑定到根节点   |
| 合成事件 | 跨浏览器兼容       |
| 批量更新 | 事件处理中自动批量 |
| 优先级   | 不同事件不同优先级 |

## 延伸阅读

- [React 事件系统](https://legacy.reactjs.org/docs/events.html)
- [React 17 事件委托变更](https://legacy.reactjs.org/blog/2020/10/20/react-v17.html)
