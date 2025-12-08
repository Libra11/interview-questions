---
title: React diff 为什么是 O(n) 而不是 O(n³)？
category: React
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  理解 React diff 算法如何通过启发式策略将时间复杂度从 O(n³) 降到 O(n)。
tags:
  - React
  - Diff算法
  - 复杂度
  - 算法
estimatedTime: 12 分钟
keywords:
  - diff complexity
  - O(n) algorithm
  - heuristic
  - tree comparison
highlight: React 通过"同层比较、类型判断、key 标识"三个假设，放弃最优解换取 O(n) 复杂度。
order: 221
---

## 问题 1：传统树 Diff 为什么是 O(n³)？

### 理论复杂度

比较两棵树的最小编辑距离，需要：

1. **遍历旧树所有节点**：O(n)
2. **对每个节点，遍历新树找匹配**：O(n)
3. **计算最优转换操作**：O(n)

总复杂度：O(n) × O(n) × O(n) = **O(n³)**

```
1000 个节点 → 10⁹ 次操作 → 无法接受
```

---

## 问题 2：React 如何降到 O(n)？

### 核心思路：放弃最优解

React 不追求"最小 DOM 操作"，而是追求"足够好且快速"。

### 三个启发式假设

**假设 1：跨层移动很少**

```jsx
// 只比较同层，不跨层
//   A          A
//  / \   →    / \
// B   C      B   D

// 只比较 A-A, B-B, C-D
// 复杂度：O(n)
```

**假设 2：不同类型 = 不同子树**

```jsx
// 类型不同，直接替换，不深入比较
<div>...</div>  →  <span>...</span>

// 不比较子节点，直接删除旧树，创建新树
// 复杂度：O(1) 决策
```

**假设 3：Key 唯一标识元素**

```jsx
// 通过 key 直接定位，不需要遍历查找
<li key="a">A</li>  // 直接通过 key 找到对应节点
<li key="b">B</li>

// 复杂度：O(1) 查找
```

---

## 问题 3：具体如何实现 O(n)？

### 单次遍历

```jsx
function diff(oldTree, newTree) {
  // 只遍历一次新树
  for (let i = 0; i < newTree.children.length; i++) {
    const newChild = newTree.children[i];
    const oldChild = findByKey(oldTree, newChild.key); // O(1)

    if (!oldChild) {
      // 新增
      markPlacement(newChild);
    } else if (oldChild.type !== newChild.type) {
      // 类型不同，替换
      markDeletion(oldChild);
      markPlacement(newChild);
    } else {
      // 类型相同，递归比较
      diff(oldChild, newChild);
    }
  }
}
```

### 列表 Diff 优化

```jsx
// 使用 Map 存储旧节点，O(1) 查找
const oldChildrenMap = new Map();
oldChildren.forEach((child) => {
  oldChildrenMap.set(child.key, child);
});

// 遍历新列表
newChildren.forEach((newChild) => {
  const oldChild = oldChildrenMap.get(newChild.key); // O(1)
  // ...
});

// 总复杂度：O(n)
```

---

## 问题 4：这些假设的代价是什么？

### 跨层移动的代价

```jsx
// 组件从一个位置移动到另一个位置
// 旧：<A><B><C/></B></A>
// 新：<A><C/><B/></A>

// React 不会移动 C，而是：
// 1. 删除旧的 C
// 2. 创建新的 C
// 状态丢失！
```

### 没有 Key 的代价

```jsx
// 没有 key，按索引比较
[A, B, C] → [C, A, B]

// React 认为：
// 索引0: A → C（更新）
// 索引1: B → A（更新）
// 索引2: C → B（更新）
// 三个都要更新，而不是移动
```

## 总结

| 方面   | 传统算法 | React Diff     |
| ------ | -------- | -------------- |
| 复杂度 | O(n³)    | O(n)           |
| 结果   | 最优解   | 足够好的解     |
| 策略   | 完整比较 | 启发式假设     |
| 代价   | 太慢     | 某些情况非最优 |

**核心权衡**：用"可能多几次 DOM 操作"换取"快 1000000 倍的 Diff"。

## 延伸阅读

- [React 协调算法](https://legacy.reactjs.org/docs/reconciliation.html)
- [Tree Edit Distance 算法](https://en.wikipedia.org/wiki/Edit_distance)
