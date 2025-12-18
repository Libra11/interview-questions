---
title: 为什么 React 事件是合成事件（SyntheticEvent）？
category: React
difficulty: 中级
updatedAt: 2025-12-08
summary: >-
  理解 React 合成事件的设计目的，掌握它与原生事件的区别。
tags:
  - React
  - 合成事件
  - SyntheticEvent
  - 跨浏览器
estimatedTime: 12 分钟
keywords:
  - SyntheticEvent
  - cross-browser
  - event normalization
  - event pooling
highlight: 合成事件是 React 对原生事件的跨浏览器包装，提供一致的 API 和更好的性能。
order: 556
---

## 问题 1：什么是合成事件？

### 定义

合成事件是 React 对原生 DOM 事件的**跨浏览器包装**。

```jsx
function handleClick(event) {
  // event 是 SyntheticEvent，不是原生 Event
  console.log(event); // SyntheticBaseEvent
  console.log(event.nativeEvent); // 原生 MouseEvent
  console.log(event.target); // 事件目标
  console.log(event.currentTarget); // 当前元素
}

<button onClick={handleClick}>Click</button>;
```

### 与原生事件的关系

```jsx
// 合成事件包装了原生事件
syntheticEvent = {
  nativeEvent: MouseEvent, // 原生事件
  target: HTMLButtonElement, // 事件目标
  currentTarget: HTMLButtonElement,
  type: "click",
  // ... 其他标准化属性
};
```

---

## 问题 2：为什么需要合成事件？

### 1. 跨浏览器兼容

```jsx
// 不同浏览器的事件属性可能不同
// 原生：
event.target; // 标准
event.srcElement; // IE

// 合成事件统一为：
syntheticEvent.target; // 所有浏览器一致
```

### 2. 统一的事件接口

```jsx
// 所有事件都有一致的方法
event.preventDefault();
event.stopPropagation();
event.persist(); // React 16

// 所有事件都有一致的属性
event.target;
event.currentTarget;
event.type;
```

### 3. 性能优化

```jsx
// React 可以：
// - 事件委托（减少监听器数量）
// - 批量更新（事件处理中的多次 setState）
// - 事件池复用（React 16，已废弃）
```

---

## 问题 3：合成事件的特点？

### 事件池（React 16，已废弃）

```jsx
// React 16：事件对象会被复用
function handleClick(event) {
  console.log(event.type); // 'click'

  setTimeout(() => {
    console.log(event.type); // null（已被回收）
  }, 0);
}

// 需要 persist() 保留
function handleClick(event) {
  event.persist();
  setTimeout(() => {
    console.log(event.type); // 'click'
  }, 0);
}

// React 17+：不再使用事件池，无需 persist()
```

### 访问原生事件

```jsx
function handleClick(event) {
  // 获取原生事件
  const nativeEvent = event.nativeEvent;

  // 原生事件的特有属性
  console.log(nativeEvent.offsetX);
  console.log(nativeEvent.offsetY);
}
```

---

## 问题 4：合成事件 vs 原生事件？

### 对比

| 特性     | 合成事件 | 原生事件  |
| -------- | -------- | --------- |
| 跨浏览器 | ✅ 统一  | ❌ 有差异 |
| 事件委托 | ✅ 自动  | ❌ 手动   |
| 批量更新 | ✅ 自动  | ❌ 不自动 |
| 性能     | ✅ 优化  | 一般      |

### 混用注意事项

```jsx
function Component() {
  const ref = useRef();

  useEffect(() => {
    // 原生事件
    ref.current.addEventListener("click", (e) => {
      e.stopPropagation(); // 只阻止原生冒泡
    });
  }, []);

  // React 事件
  const handleClick = (e) => {
    e.stopPropagation(); // 只阻止合成事件冒泡
  };

  return (
    <div onClick={handleClick}>
      <button ref={ref}>Click</button>
    </div>
  );
}

// 注意：原生事件的 stopPropagation 不会阻止 React 事件
// React 事件的 stopPropagation 不会阻止原生事件
```

## 总结

**合成事件的价值**：

| 目的     | 实现              |
| -------- | ----------------- |
| 跨浏览器 | 统一事件接口      |
| 性能     | 事件委托          |
| 批量更新 | 自动合并 setState |
| 一致性   | 标准化属性和方法  |

## 延伸阅读

- [SyntheticEvent 文档](https://legacy.reactjs.org/docs/events.html)
- [React 17 事件系统变更](https://legacy.reactjs.org/blog/2020/10/20/react-v17.html)
