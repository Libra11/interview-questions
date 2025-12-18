---
title: 为什么 Vue3 的 diff 更高效？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 diff 算法的优化点，包括 Block Tree、PatchFlags 和最长递增子序列。
tags:
  - Vue
  - diff
  - 算法
  - 性能优化
estimatedTime: 15 分钟
keywords:
  - Vue3 diff
  - 最长递增子序列
  - Block Tree
highlight: Vue3 通过 Block Tree 跳过静态节点、PatchFlags 精确更新、最长递增子序列减少 DOM 移动。
order: 569
---

## 问题 1：Vue2 vs Vue3 diff 对比

### Vue2 的 diff

```javascript
// 双端比较算法
// 需要遍历整个虚拟 DOM 树
// 对每个节点进行全量属性比较

function patch(oldVNode, newVNode) {
  // 比较节点类型
  // 比较所有属性
  // 递归比较所有子节点
}
```

### Vue3 的 diff

```javascript
// 1. 只遍历动态节点（Block Tree）
// 2. 只比较标记的属性（PatchFlags）
// 3. 使用最长递增子序列优化移动

function patch(oldVNode, newVNode) {
  const patchFlag = newVNode.patchFlag;

  if (patchFlag > 0) {
    // 根据标记精确更新
  }

  // 只 diff dynamicChildren
  patchBlockChildren(oldVNode.dynamicChildren, newVNode.dynamicChildren);
}
```

---

## 问题 2：Block Tree 优化

### 传统 diff

```vue
<template>
  <div>
    <span>静态1</span>
    <span>静态2</span>
    <span>{{ dynamic }}</span>
    <span>静态3</span>
  </div>
</template>
```

```javascript
// Vue2：遍历所有 4 个子节点
diff([静态1, 静态2, dynamic, 静态3]);
```

### Block Tree diff

```javascript
// Vue3：只遍历动态节点
const block = {
  dynamicChildren: [dynamicSpan], // 只有 1 个
};

// 直接 diff dynamicChildren
diff([dynamicSpan]);
```

---

## 问题 3：PatchFlags 精确更新

```vue
<div :class="cls">{{ text }}</div>
```

```javascript
// PatchFlag: TEXT | CLASS = 3

function patchElement(n1, n2) {
  const flag = n2.patchFlag;

  // 只检查标记的部分
  if (flag & TEXT) {
    updateText(n1, n2);
  }
  if (flag & CLASS) {
    updateClass(n1, n2);
  }
  // style、其他属性都不检查
}
```

---

## 问题 4：最长递增子序列（LIS）

用于优化子节点的移动操作。

### 问题场景

```javascript
// 旧顺序
[A, B, C, D, E][
  // 新顺序
  (A, C, D, B, E)
];

// 需要移动哪些节点？
```

### 朴素方法

```javascript
// 移动 B 到 D 后面
// 或者移动 C、D 到 B 前面
// 需要多次 DOM 操作
```

### LIS 优化

```javascript
// 计算新顺序中节点在旧顺序中的索引
// [A, C, D, B, E] → [0, 2, 3, 1, 4]

// 找最长递增子序列
// [0, 2, 3, 4] → 对应 [A, C, D, E]

// 这些节点不需要移动
// 只需要移动 B（不在 LIS 中）
```

### 代码示例

```javascript
function getSequence(arr) {
  // 返回最长递增子序列的索引
  // [0, 2, 3, 1, 4] → [0, 1, 2, 4]
}

function patchKeyedChildren(c1, c2) {
  // 1. 预处理：头部相同节点
  // 2. 预处理：尾部相同节点
  // 3. 处理中间部分

  const seq = getSequence(newIndexToOldIndexMap);

  // 从后往前遍历
  for (let i = toBePatched - 1; i >= 0; i--) {
    if (i !== seq[j]) {
      // 不在 LIS 中，需要移动
      move(node, anchor);
    }
  }
}
```

---

## 问题 5：预处理优化

Vue3 在 diff 前会进行预处理：

```javascript
// 旧: [A, B, C, D, E]
// 新: [A, B, X, D, E]

// 1. 从头比较相同节点
// A, B 相同，直接 patch

// 2. 从尾比较相同节点
// E, D 相同，直接 patch

// 3. 只剩中间部分需要处理
// 旧: [C]
// 新: [X]
```

---

## 问题 6：性能对比

| 优化点     | Vue2       | Vue3               |
| ---------- | ---------- | ------------------ |
| 遍历范围   | 所有节点   | 只遍历动态节点     |
| 属性比较   | 全量比较   | 按 PatchFlags 比较 |
| 子节点移动 | 双端比较   | LIS 最小化移动     |
| 静态节点   | 每次都比较 | 完全跳过           |

### 实际效果

```
更新性能提升 1.3~2 倍
大型列表更新提升更明显
```

---

## 问题 7：总结

Vue3 diff 优化的三个层面：

1. **编译时**：生成 Block Tree 和 PatchFlags
2. **运行时**：只 diff 动态节点，按标记更新
3. **算法**：LIS 最小化 DOM 移动

```
模板 → 编译器 → 优化的渲染函数
                    ↓
              Block Tree + PatchFlags
                    ↓
              高效的 diff
```

## 延伸阅读

- [Vue 3 源码 - renderer.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts)
- [最长递增子序列算法](https://en.wikipedia.org/wiki/Longest_increasing_subsequence)
