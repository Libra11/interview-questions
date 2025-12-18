---
title: 详细介绍 Vue3 的 Diff 算法
category: Vue
difficulty: 高级
updatedAt: 2025-11-21
summary: >-
  深入剖析 Vue 3 的 Diff 算法实现，理解最长递增子序列、双端对比等优化策略，掌握虚拟 DOM 更新的核心原理。
tags:
  - Vue
  - Diff 算法
  - 虚拟 DOM
  - 性能优化
estimatedTime: 30 分钟
keywords:
  - Vue3 Diff
  - 虚拟 DOM
  - 最长递增子序列
  - patchKeyedChildren
highlight: 深入理解 Vue 3 Diff 算法的核心实现和优化策略
order: 119
---

## 问题 1：Vue 3 Diff 算法的整体流程是什么？

### Diff 算法的核心思想

Vue 3 的 Diff 算法用于比较新旧虚拟 DOM，找出最小的变更操作来更新真实 DOM。

```javascript
// Diff 算法的核心流程
function patch(n1, n2, container) {
  // n1: 旧的 VNode
  // n2: 新的 VNode
  
  // 1. 如果类型不同，直接替换
  if (n1 && !isSameVNodeType(n1, n2)) {
    unmount(n1);
    n1 = null;
  }
  
  // 2. 根据类型进行不同的处理
  const { type } = n2;
  
  if (typeof type === 'string') {
    // 处理普通元素
    processElement(n1, n2, container);
  } else if (type === Text) {
    // 处理文本节点
    processText(n1, n2, container);
  } else if (type === Fragment) {
    // 处理 Fragment
    processFragment(n1, n2, container);
  } else {
    // 处理组件
    processComponent(n1, n2, container);
  }
}

// 判断是否是相同类型的 VNode
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
```

---

## 问题 2：如何处理子节点的 Diff？

### patchChildren 的核心逻辑

```javascript
function patchChildren(n1, n2, container) {
  const c1 = n1.children; // 旧子节点
  const c2 = n2.children; // 新子节点
  
  // 根据新子节点的类型进行不同处理
  if (typeof c2 === 'string') {
    // 新子节点是文本
    if (Array.isArray(c1)) {
      // 旧子节点是数组，卸载所有旧子节点
      unmountChildren(c1);
    }
    // 设置文本内容
    setElementText(container, c2);
  } else if (Array.isArray(c2)) {
    // 新子节点是数组
    if (Array.isArray(c1)) {
      // 旧子节点也是数组，进行 Diff
      patchKeyedChildren(c1, c2, container);
    } else {
      // 旧子节点是文本或空，清空后挂载新子节点
      setElementText(container, '');
      mountChildren(c2, container);
    }
  } else {
    // 新子节点为空
    if (Array.isArray(c1)) {
      unmountChildren(c1);
    } else if (typeof c1 === 'string') {
      setElementText(container, '');
    }
  }
}
```

---

## 问题 3：patchKeyedChildren 的详细实现是什么？

### Vue 3 的核心 Diff 算法

Vue 3 使用了一种高效的 Diff 算法，包含以下步骤：

```javascript
function patchKeyedChildren(c1, c2, container) {
  let i = 0;
  const l2 = c2.length;
  let e1 = c1.length - 1; // 旧子节点的结束索引
  let e2 = l2 - 1;        // 新子节点的结束索引
  
  // 1. 从头部开始同步
  // (a b) c
  // (a b) d e
  while (i <= e1 && i <= e2) {
    const n1 = c1[i];
    const n2 = c2[i];
    
    if (isSameVNodeType(n1, n2)) {
      // 相同节点，递归 patch
      patch(n1, n2, container);
    } else {
      // 不同节点，跳出循环
      break;
    }
    i++;
  }
  
  // 2. 从尾部开始同步
  // a (b c)
  // d e (b c)
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1];
    const n2 = c2[e2];
    
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container);
    } else {
      break;
    }
    e1--;
    e2--;
  }
  
  // 3. 处理新增节点
  // (a b)
  // (a b) c
  // i = 2, e1 = 1, e2 = 2
  if (i > e1) {
    if (i <= e2) {
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : null;
      while (i <= e2) {
        patch(null, c2[i], container, anchor);
        i++;
      }
    }
  }
  
  // 4. 处理删除节点
  // (a b) c
  // (a b)
  // i = 2, e1 = 2, e2 = 1
  else if (i > e2) {
    while (i <= e1) {
      unmount(c1[i]);
      i++;
    }
  }
  
  // 5. 处理未知序列（最复杂的情况）
  // a b [c d e] f g
  // a b [e d c h] f g
  // i = 2, e1 = 4, e2 = 5
  else {
    const s1 = i; // 旧子节点的开始索引
    const s2 = i; // 新子节点的开始索引
    
    // 5.1 构建新子节点的 key -> index 映射
    const keyToNewIndexMap = new Map();
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i];
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i);
      }
    }
    
    // 5.2 遍历旧子节点，尝试复用或删除
    let j;
    let patched = 0;
    const toBePatched = e2 - s2 + 1;
    let moved = false;
    let maxNewIndexSoFar = 0;
    
    // 用于存储新子节点在旧子节点中的位置
    const newIndexToOldIndexMap = new Array(toBePatched);
    for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
    
    for (i = s1; i <= e1; i++) {
      const prevChild = c1[i];
      
      if (patched >= toBePatched) {
        // 所有新节点都已经被 patch，剩余的旧节点删除
        unmount(prevChild);
        continue;
      }
      
      let newIndex;
      if (prevChild.key != null) {
        // 通过 key 查找
        newIndex = keyToNewIndexMap.get(prevChild.key);
      } else {
        // 没有 key，遍历查找
        for (j = s2; j <= e2; j++) {
          if (
            newIndexToOldIndexMap[j - s2] === 0 &&
            isSameVNodeType(prevChild, c2[j])
          ) {
            newIndex = j;
            break;
          }
        }
      }
      
      if (newIndex === undefined) {
        // 在新子节点中找不到，删除
        unmount(prevChild);
      } else {
        // 找到了，记录位置
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        
        // 判断是否需要移动
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex;
        } else {
          moved = true;
        }
        
        // 递归 patch
        patch(prevChild, c2[newIndex], container);
        patched++;
      }
    }
    
    // 5.3 移动和挂载新节点
    // 计算最长递增子序列
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : [];
    
    j = increasingNewIndexSequence.length - 1;
    
    // 倒序遍历，以便使用最后一个节点作为锚点
    for (i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = s2 + i;
      const nextChild = c2[nextIndex];
      const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
      
      if (newIndexToOldIndexMap[i] === 0) {
        // 新节点，挂载
        patch(null, nextChild, container, anchor);
      } else if (moved) {
        // 需要移动
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          move(nextChild, container, anchor);
        } else {
          j--;
        }
      }
    }
  }
}
```

---

## 问题 4：最长递增子序列算法是如何工作的？

### 最长递增子序列（LIS）

Vue 3 使用最长递增子序列来最小化 DOM 移动操作。

```javascript
// 计算最长递增子序列
function getSequence(arr) {
  const p = arr.slice(); // 用于存储前驱索引
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    
    if (arrI !== 0) {
      j = result[result.length - 1];
      
      if (arr[j] < arrI) {
        // 当前值大于序列最后一个值
        p[i] = j;
        result.push(i);
        continue;
      }
      
      // 二分查找，找到第一个大于 arrI 的位置
      u = 0;
      v = result.length - 1;
      
      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  
  // 回溯构建最长递增子序列
  u = result.length;
  v = result[u - 1];
  
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  
  return result;
}

// 示例
const arr = [2, 3, 1, 5, 6, 4, 8];
const lis = getSequence(arr);
console.log(lis); // [2, 3, 5, 6] 对应的索引
```

### LIS 在 Diff 中的应用

```javascript
// 示例：节点移动场景
// 旧: a b c d e
// 新: a c b e d

// newIndexToOldIndexMap: [1, 3, 2, 5, 4]
// (新节点在旧节点中的位置 + 1)

// 最长递增子序列: [1, 3, 5] 对应索引 [0, 1, 3]
// 意味着 a, c, e 不需要移动
// 只需要移动 b 和 d

// 移动操作：
// 1. 移动 d 到 e 之前
// 2. 移动 b 到 c 之前
```

---

## 问题 5：Vue 3 相比 Vue 2 的 Diff 优化在哪里？

### Vue 2 vs Vue 3 Diff 对比

```javascript
// Vue 2 的 Diff 算法（双端对比）
function updateChildren(oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let newEndIdx = newCh.length - 1;
  
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 1. 旧头 vs 新头
    if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    }
    // 2. 旧尾 vs 新尾
    else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    }
    // 3. 旧头 vs 新尾
    else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode);
      // 移动节点
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    }
    // 4. 旧尾 vs 新头
    else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode);
      // 移动节点
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    }
    // 5. 都不匹配，使用 key 查找
    else {
      // 查找和移动逻辑
    }
  }
}

// Vue 3 的优化
// 1. 预处理：头尾同步
// 2. 只处理中间乱序部分
// 3. 使用最长递增子序列减少移动
// 4. 更好的性能和更少的 DOM 操作
```

### 性能对比示例

```javascript
// 场景：在列表中间插入元素
// 旧: a b c d e
// 新: a b x c d e

// Vue 2 双端对比：
// 1. a vs a ✓
// 2. e vs e ✓
// 3. b vs b ✓
// 4. d vs d ✓
// 5. c vs x ✗ -> 查找 key
// 需要多次比较

// Vue 3 优化：
// 1. 头部同步：a b
// 2. 尾部同步：c d e
// 3. 中间只有 x 是新增
// 直接插入，更高效
```

---

## 总结

**核心要点**：

### 1. Diff 算法流程

- 类型判断
- 子节点 Diff
- 属性更新
- 最小化 DOM 操作

### 2. patchKeyedChildren 步骤

- 头部同步
- 尾部同步
- 处理新增/删除
- 处理乱序（最长递增子序列）

### 3. 最长递增子序列

- 找出不需要移动的节点
- 最小化 DOM 移动操作
- 时间复杂度 O(n log n)

### 4. Vue 3 优化

- 预处理减少比较
- 静态标记（PatchFlag）
- 块级优化（Block）
- 更少的 DOM 操作

### 5. 性能优化建议

- 使用唯一的 key
- 避免使用 index 作为 key
- 合理使用 v-if 和 v-show
- 利用 keep-alive 缓存

## 延伸阅读

- [Vue 3 源码 - runtime-core/renderer.ts](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts)
- [Vue 3 Diff 算法详解](https://vue-next-template-explorer.netlify.app/)
- [最长递增子序列算法](https://en.wikipedia.org/wiki/Longest_increasing_subsequence)
- [Virtual DOM 和 Diff 算法](https://github.com/snabbdom/snabbdom)
