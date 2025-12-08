---
title: React17 事件系统与 React16 有哪些变化？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  了解 React 17 事件系统的重大变化，理解事件委托位置变更的原因和影响。
tags:
  - React
  - React17
  - 事件系统
  - 事件委托
estimatedTime: 12 分钟
keywords:
  - React 17 events
  - event delegation
  - document vs root
  - event changes
highlight: React 17 将事件委托从 document 移到根容器，废弃事件池，改善多版本共存。
order: 240
---

## 问题 1：事件委托位置变化？

### React 16

```jsx
// 事件绑定在 document 上
document.addEventListener('click', dispatchEvent);

// 结构
<html>
  <body>
    <div id="root">
      <App />  <!-- React 应用 -->
    </div>
  </body>
</html>
// 事件监听在 document
```

### React 17

```jsx
// 事件绑定在根容器上
const root = document.getElementById('root');
root.addEventListener('click', dispatchEvent);

// 结构
<html>
  <body>
    <div id="root">  <!-- 事件监听在这里 -->
      <App />
    </div>
  </body>
</html>
```

---

## 问题 2：为什么要改变？

### 1. 多版本 React 共存

```jsx
// React 16：两个 React 应用都绑定到 document
// 事件会互相干扰

// React 17：各自绑定到自己的根容器
<div id="app1">  <!-- React 17 应用 -->
  <OldApp />
</div>
<div id="app2">  <!-- React 18 应用 -->
  <NewApp />
</div>
// 事件互不干扰
```

### 2. 与原生事件更好配合

```jsx
// React 16：stopPropagation 可能不生效
document.body.addEventListener("click", () => {
  console.log("body"); // 总是执行
});

function App() {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // 无法阻止 body 的监听
      }}
    >
      Click
    </button>
  );
}

// React 17：可以正常阻止
// 因为 React 事件在 root，body 在外层
```

---

## 问题 3：事件池废弃？

### React 16：事件池

```jsx
function handleClick(event) {
  // 事件对象会被复用
  setTimeout(() => {
    console.log(event.type); // null（已被回收）
  }, 0);

  // 需要 persist() 保留
  event.persist();
}
```

### React 17：无事件池

```jsx
function handleClick(event) {
  // 事件对象不再被复用
  setTimeout(() => {
    console.log(event.type); // 'click'（正常访问）
  }, 0);

  // 不需要 persist()
}
```

### 为什么废弃？

```jsx
// 1. 现代浏览器性能足够好
// 2. 事件池带来的困惑大于收益
// 3. 简化心智模型
```

---

## 问题 4：其他变化？

### onScroll 不再冒泡

```jsx
// React 16：onScroll 会冒泡
// React 17：onScroll 不冒泡（与原生一致）

<div onScroll={handleParentScroll}>
  <div onScroll={handleChildScroll}>{/* 滚动子元素 */}</div>
</div>

// React 17：只触发 handleChildScroll
```

### onFocus/onBlur 使用原生事件

```jsx
// React 16：使用 focusin/focusout
// React 17：使用原生 focus/blur + 捕获阶段

// 更符合预期的行为
```

### 事件时机对齐

```jsx
// React 17：合成事件和原生事件的执行顺序更一致
useEffect(() => {
  document.addEventListener("click", nativeHandler);
}, []);

// 点击时：
// React 16：React handler → native handler
// React 17：native handler → React handler（同一冒泡阶段）
```

---

## 问题 5：迁移注意事项？

### 检查 stopPropagation

```jsx
// 如果依赖 document 级别的事件监听
document.addEventListener("click", (e) => {
  // React 16：React 事件先执行
  // React 17：原生事件可能先执行
});

// 解决：使用捕获阶段
document.addEventListener("click", handler, true);
```

### 检查事件池用法

```jsx
// 移除不必要的 persist()
function handleClick(event) {
  // event.persist();  // React 17 不需要
  setTimeout(() => {
    console.log(event.type);
  }, 0);
}
```

## 总结

| 变化          | React 16 | React 17 |
| ------------- | -------- | -------- |
| 事件委托位置  | document | 根容器   |
| 事件池        | 有       | 无       |
| onScroll 冒泡 | 是       | 否       |
| 多版本共存    | 困难     | 支持     |

## 延伸阅读

- [React 17 发布博客](https://legacy.reactjs.org/blog/2020/10/20/react-v17.html)
- [事件委托变更详解](https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation)
