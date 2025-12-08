---
title: diff 算法如何工作？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React diff 算法的工作原理，掌握三个核心策略和具体实现。
tags:
  - React
  - Diff算法
  - 协调
  - 虚拟DOM
estimatedTime: 18 分钟
keywords:
  - diff algorithm
  - reconciliation
  - tree diff
  - component diff
highlight: React diff 通过三个策略将复杂度从 O(n³) 降到 O(n)：同层比较、类型判断、key 标识。
order: 220
---

## 问题 1：Diff 算法解决什么问题？

### 问题背景

比较两棵树的差异，传统算法复杂度是 O(n³)。

```
1000 个节点 → 1000³ = 10亿次比较
```

React 通过启发式策略将复杂度降到 O(n)。

```
1000 个节点 → 1000 次比较
```

---

## 问题 2：三个核心策略是什么？

### 策略 1：同层比较

只比较同一层级的节点，不跨层比较。

```jsx
// 旧树          新树
//   A             A
//  / \           / \
// B   C         B   D

// 只比较：A-A, B-B, C-D
// 不会比较：B-D（跨层）
```

如果节点跨层移动，React 会删除旧节点，创建新节点。

### 策略 2：类型判断

不同类型的元素产生不同的树。

```jsx
// 类型不同：直接替换整个子树
<div><Counter /></div>
// 变为
<span><Counter /></span>

// Counter 会被卸载并重新挂载
```

```jsx
// 类型相同：只更新属性
<div className="old" />
// 变为
<div className="new" />

// 只更新 className，保留 DOM 节点
```

### 策略 3：Key 标识

通过 key 识别列表中的元素。

```jsx
// 没有 key：按顺序比较
[A, B, C] → [B, C, A]
// React 认为：A→B, B→C, C→A，三个都要更新

// 有 key：按 key 匹配
[A:1, B:2, C:3] → [B:2, C:3, A:1]
// React 认为：只是顺序变了，移动即可
```

---

## 问题 3：具体 Diff 过程是怎样的？

### 单节点 Diff

```jsx
// 1. 类型相同，key 相同 → 复用
<div key="a">old</div>
<div key="a">new</div>
// 复用 div，更新 children

// 2. 类型不同 → 替换
<div>content</div>
<span>content</span>
// 删除 div，创建 span

// 3. key 不同 → 替换
<div key="a">content</div>
<div key="b">content</div>
// 删除旧 div，创建新 div
```

### 多节点 Diff（列表）

```jsx
// 旧列表：[A, B, C, D]
// 新列表：[A, C, D, B]

// 第一轮：从头遍历，找到可复用的
// A-A ✓ 复用

// 第二轮：处理剩余节点
// 旧：[B, C, D] → 放入 Map { B: fiber, C: fiber, D: fiber }
// 新：[C, D, B]
// C → 从 Map 找到，复用并移动
// D → 从 Map 找到，复用并移动
// B → 从 Map 找到，复用并移动
```

---

## 问题 4：Diff 结果如何应用？

### 标记副作用

```jsx
// Diff 过程中标记每个节点的操作
fiber.flags = Placement; // 新增/移动
fiber.flags = Update; // 更新
fiber.flags = Deletion; // 删除
```

### Commit 阶段执行

```jsx
// 遍历有副作用的节点，执行 DOM 操作
function commitWork(fiber) {
  switch (fiber.flags) {
    case Placement:
      parent.appendChild(fiber.stateNode);
      break;
    case Update:
      updateDOMProperties(fiber.stateNode, fiber.props);
      break;
    case Deletion:
      parent.removeChild(fiber.stateNode);
      break;
  }
}
```

## 总结

**Diff 算法核心**：

| 策略     | 说明             | 效果         |
| -------- | ---------------- | ------------ |
| 同层比较 | 不跨层比较       | 减少比较范围 |
| 类型判断 | 类型不同直接替换 | 快速决策     |
| Key 标识 | 识别列表元素     | 精确复用     |

## 延伸阅读

- [React 协调算法](https://legacy.reactjs.org/docs/reconciliation.html)
- [React Fiber 架构](https://github.com/acdlite/react-fiber-architecture)
