---
title: Vue3 diff 算法与 React diff 的核心差异？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入对比 Vue3 和 React 的 diff 算法差异，理解各自的优化策略。
tags:
  - Vue
  - React
  - diff
  - 算法
estimatedTime: 15 分钟
keywords:
  - Vue diff
  - React diff
  - 算法对比
highlight: Vue3 使用编译时优化 + 双端比较 + LIS，React 使用 Fiber 架构 + 单向遍历。
order: 262
---

## 问题 1：核心理念差异

### Vue3：编译时优化

```javascript
// Vue3 在编译时分析模板
// 生成带有 PatchFlag 的 VNode
createVNode("div", { class: ctx.cls }, ctx.text, 3 /* TEXT, CLASS */);

// 运行时只 diff 动态部分
```

### React：运行时 diff

```jsx
// React 在运行时进行完整 diff
// 没有编译时优化
<div className={cls}>{text}</div>
```

---

## 问题 2：遍历策略

### Vue3：双端比较

```javascript
// 从两端向中间比较
function patchKeyedChildren(c1, c2) {
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = c2.length - 1;

  // 1. 从头部开始比较
  while (i <= e1 && i <= e2) {
    if (isSameVNode(c1[i], c2[i])) {
      patch(c1[i], c2[i]);
      i++;
    } else break;
  }

  // 2. 从尾部开始比较
  while (i <= e1 && i <= e2) {
    if (isSameVNode(c1[e1], c2[e2])) {
      patch(c1[e1], c2[e2]);
      e1--;
      e2--;
    } else break;
  }

  // 3. 处理中间部分（使用 LIS）
}
```

### React：单向遍历

```javascript
// 从左到右单向遍历
function reconcileChildrenArray(current, workInProgress, newChildren) {
  let oldFiber = current.child;
  let newIdx = 0;
  let lastPlacedIndex = 0;

  // 第一轮：处理更新的节点
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // 比较并更新
  }

  // 第二轮：处理新增/删除
}
```

---

## 问题 3：静态节点处理

### Vue3：Block Tree

```vue
<template>
  <div>
    <span>静态</span>
    <span>{{ dynamic }}</span>
    <span>静态</span>
  </div>
</template>
```

```javascript
// Vue3：只 diff dynamicChildren
const block = {
  dynamicChildren: [dynamicSpan], // 只有 1 个
};
```

### React：全量 diff

```jsx
// React：遍历所有子节点
<div>
  <span>静态</span>
  <span>{dynamic}</span>
  <span>静态</span>
</div>
// 需要比较 3 个子节点
```

---

## 问题 4：移动优化

### Vue3：最长递增子序列

```javascript
// 旧: [A, B, C, D, E]
// 新: [A, C, D, B, E]

// 计算 LIS: [A, C, D, E]
// 只需要移动 B
```

### React：lastPlacedIndex

```javascript
// 使用 lastPlacedIndex 判断是否需要移动
// 可能产生更多移动操作

// 旧: [A, B, C, D]
// 新: [D, A, B, C]
// React 会移动 A, B, C（3次）
// Vue3 只移动 D（1次）
```

---

## 问题 5：更新粒度

### Vue3：组件级更新

```javascript
// Vue3 精确追踪依赖
// 只有使用了变化数据的组件才更新

const count = ref(0);
// 只有使用 count 的组件会重新渲染
```

### React：子树更新

```jsx
// React 默认更新整个子树
// 需要手动优化

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Child /> {/* 默认也会重新渲染 */}
    </div>
  );
}

// 需要 memo 优化
const Child = React.memo(() => <div>Child</div>);
```

---

## 问题 6：调度机制

### Vue3：同步更新 + nextTick

```javascript
// Vue3 批量同步更新
count.value++;
count.value++;
count.value++;
// 只触发一次更新

// 使用 nextTick 等待更新完成
await nextTick();
```

### React：Fiber 时间切片

```javascript
// React 18 并发模式
// 可中断的渲染

startTransition(() => {
  setCount(count + 1); // 低优先级更新
});

// 高优先级更新可以打断低优先级
```

---

## 问题 7：对比总结

| 特性     | Vue3            | React           |
| -------- | --------------- | --------------- |
| 优化时机 | 编译时 + 运行时 | 运行时          |
| 遍历方式 | 双端比较        | 单向遍历        |
| 静态节点 | Block Tree 跳过 | 全量比较        |
| 移动算法 | LIS 最小化移动  | lastPlacedIndex |
| 更新粒度 | 组件级精确更新  | 子树更新        |
| 调度     | 同步批量        | Fiber 时间切片  |

---

## 问题 8：各自优势

### Vue3 优势

- 编译时优化，运行时开销小
- 精确的依赖追踪
- 更少的 DOM 操作

### React 优势

- Fiber 架构支持并发
- 可中断渲染，更好的响应性
- 更灵活的调度策略

## 延伸阅读

- [Vue 3 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [React Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
