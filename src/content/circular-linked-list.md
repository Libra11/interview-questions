---
title: 如何判断一个单向链表是否是循环链表？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  掌握判断循环链表的经典算法，理解快慢指针（Floyd判圈算法）的原理和实现，学会处理链表相关的算法问题。
tags:
  - 链表
  - 算法
  - 快慢指针
  - 数据结构
estimatedTime: 25 分钟
keywords:
  - 循环链表
  - 快慢指针
  - Floyd判圈算法
  - 链表检测
highlight: 掌握快慢指针算法，理解循环检测的原理，能够实现高效的循环链表判断
order: 49
---

## 问题 1：循环链表的基本概念

**循环链表定义**

循环链表是指链表中存在环，即某个节点的 next 指针指向链表中之前出现过的节点，形成一个环形结构。

### 链表节点定义

```javascript
// 链表节点类
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

// 创建普通链表
function createLinkedList(values) {
  if (values.length === 0) return null;

  const head = new ListNode(values[0]);
  let current = head;

  for (let i = 1; i < values.length; i++) {
    current.next = new ListNode(values[i]);
    current = current.next;
  }

  return head;
}

// 创建循环链表
function createCyclicList(values, cyclePos) {
  if (values.length === 0) return null;

  const head = new ListNode(values[0]);
  let current = head;
  let cycleNode = null;

  // 记录环的起始节点
  if (cyclePos === 0) cycleNode = head;

  for (let i = 1; i < values.length; i++) {
    current.next = new ListNode(values[i]);
    current = current.next;

    if (i === cyclePos) cycleNode = current;
  }

  // 创建环
  if (cycleNode) {
    current.next = cycleNode;
  }

  return head;
}

// 示例
const normalList = createLinkedList([1, 2, 3, 4, 5]);
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2); // 在位置2形成环
```

### 循环链表的特征

```javascript
// 循环链表的特征：
// 1. 存在一个节点，其 next 指针指向链表中之前的节点
// 2. 遍历时会无限循环，永远不会到达 null
// 3. 从环的入口开始，会重复访问相同的节点

// 可视化示例：
// 普通链表：1 -> 2 -> 3 -> 4 -> 5 -> null
// 循环链表：1 -> 2 -> 3 -> 4 -> 5
//                    ↑         ↓
//                    ← ← ← ← ← ←
```

---

## 问题 2：暴力解法 - 使用 Set 记录访问过的节点

### 基本思路

使用 Set 数据结构记录已经访问过的节点，如果遇到重复节点，说明存在环。

```javascript
/**
 * 使用 Set 判断是否存在环
 * 时间复杂度：O(n)
 * 空间复杂度：O(n)
 */
function hasCycleWithSet(head) {
  if (!head || !head.next) return false;

  const visited = new Set();
  let current = head;

  while (current) {
    // 如果当前节点已经访问过，说明存在环
    if (visited.has(current)) {
      return true;
    }

    // 记录当前节点
    visited.add(current);
    current = current.next;
  }

  // 遍历结束，没有发现环
  return false;
}

// 测试
const normalList = createLinkedList([1, 2, 3, 4, 5]);
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);

console.log(hasCycleWithSet(normalList)); // false
console.log(hasCycleWithSet(cyclicList)); // true
```

### 改进版本 - 返回环的起始节点

```javascript
/**
 * 使用 Set 找到环的起始节点
 */
function detectCycleWithSet(head) {
  if (!head || !head.next) return null;

  const visited = new Set();
  let current = head;

  while (current) {
    if (visited.has(current)) {
      return current; // 返回环的起始节点
    }

    visited.add(current);
    current = current.next;
  }

  return null; // 没有环
}

// 获取环的详细信息
function getCycleInfo(head) {
  const cycleStart = detectCycleWithSet(head);

  if (!cycleStart) {
    return { hasCycle: false };
  }

  // 计算环的长度
  let cycleLength = 1;
  let current = cycleStart.next;

  while (current !== cycleStart) {
    cycleLength++;
    current = current.next;
  }

  return {
    hasCycle: true,
    cycleStart: cycleStart,
    cycleLength: cycleLength,
  };
}

// 测试
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);
const info = getCycleInfo(cyclicList);
console.log(info); // { hasCycle: true, cycleStart: Node(3), cycleLength: 3 }
```

---

## 问题 3：快慢指针解法（Floyd 判圈算法）

### 算法原理

快慢指针算法（也称为 Floyd 判圈算法或龟兔赛跑算法）使用两个指针：

- 慢指针：每次移动一步
- 快指针：每次移动两步

如果存在环，快指针最终会追上慢指针。

```javascript
/**
 * 快慢指针判断是否存在环
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function hasCycle(head) {
  if (!head || !head.next) return false;

  let slow = head; // 慢指针
  let fast = head.next; // 快指针

  while (fast && fast.next) {
    // 如果快慢指针相遇，说明存在环
    if (slow === fast) {
      return true;
    }

    slow = slow.next; // 慢指针移动一步
    fast = fast.next.next; // 快指针移动两步
  }

  return false; // 快指针到达末尾，没有环
}

// 另一种写法（更常见）
function hasCycleV2(head) {
  if (!head || !head.next) return false;

  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}

// 测试
const normalList = createLinkedList([1, 2, 3, 4, 5]);
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);

console.log(hasCycle(normalList)); // false
console.log(hasCycle(cyclicList)); // true
```

### 算法正确性证明

```javascript
/**
 * Floyd 算法正确性分析：
 *
 * 1. 如果没有环：
 *    - 快指针会先到达链表末尾（null）
 *    - 算法返回 false
 *
 * 2. 如果有环：
 *    - 设环的长度为 C
 *    - 当慢指针进入环时，快指针已经在环中
 *    - 快指针每次比慢指针多走一步，相对速度为 1
 *    - 在最多 C 步内，快指针一定会追上慢指针
 *
 * 3. 时间复杂度分析：
 *    - 最坏情况：慢指针走完整个链表 + 环的一圈
 *    - 时间复杂度：O(n)
 */

// 可视化演示
function demonstrateFloydAlgorithm(head) {
  if (!head || !head.next) return;

  let slow = head;
  let fast = head;
  let step = 0;

  console.log("Floyd 算法演示：");
  console.log(`步骤 ${step}: slow=${slow.val}, fast=${fast.val}`);

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    step++;

    console.log(
      `步骤 ${step}: slow=${slow.val}, fast=${fast ? fast.val : "null"}`
    );

    if (slow === fast) {
      console.log("快慢指针相遇，存在环！");
      return true;
    }

    // 防止无限循环（仅用于演示）
    if (step > 20) {
      console.log("演示结束");
      break;
    }
  }

  console.log("快指针到达末尾，不存在环");
  return false;
}
```

---

## 问题 4：找到环的起始节点

### 算法原理

在检测到环存在后，可以进一步找到环的起始节点：

1. 第一阶段：使用快慢指针检测环
2. 第二阶段：将一个指针重置到头节点，两个指针同时以相同速度移动，相遇点就是环的起始节点

```javascript
/**
 * 找到环的起始节点
 * 时间复杂度：O(n)
 * 空间复杂度：O(1)
 */
function detectCycle(head) {
  if (!head || !head.next) return null;

  // 第一阶段：检测是否存在环
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // 找到环，进入第二阶段
      break;
    }
  }

  // 如果没有环
  if (!fast || !fast.next) {
    return null;
  }

  // 第二阶段：找到环的起始节点
  slow = head; // 重置慢指针到头节点

  while (slow !== fast) {
    slow = slow.next;
    fast = fast.next; // 注意：这里快指针也是每次移动一步
  }

  return slow; // 相遇点就是环的起始节点
}

// 测试
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);
const cycleStart = detectCycle(cyclicList);
console.log(cycleStart ? cycleStart.val : "No cycle"); // 3
```

### 算法数学证明

```javascript
/**
 * 数学证明：
 *
 * 设：
 * - a = 头节点到环起始节点的距离
 * - b = 环起始节点到相遇点的距离
 * - c = 相遇点到环起始节点的距离
 * - 环的长度 = b + c
 *
 * 当快慢指针相遇时：
 * - 慢指针走过的距离：a + b
 * - 快指针走过的距离：a + b + k(b + c)，其中 k >= 1
 *
 * 因为快指针速度是慢指针的2倍：
 * 2(a + b) = a + b + k(b + c)
 *
 * 化简得：a + b = k(b + c)
 * 即：a = k(b + c) - b = (k-1)(b + c) + c
 *
 * 这意味着：从头节点走 a 步 = 从相遇点走 c 步 + 若干圈环
 *
 * 因此，当一个指针从头开始，另一个从相遇点开始，
 * 以相同速度移动时，它们会在环的起始节点相遇。
 */

// 完整的环检测信息
function getCompleteInfo(head) {
  const cycleStart = detectCycle(head);

  if (!cycleStart) {
    return {
      hasCycle: false,
      cycleStart: null,
      cycleLength: 0,
      listLength: getListLength(head),
    };
  }

  // 计算环的长度
  let cycleLength = 1;
  let current = cycleStart.next;

  while (current !== cycleStart) {
    cycleLength++;
    current = current.next;
  }

  // 计算环前的长度
  let beforeCycleLength = 0;
  current = head;

  while (current !== cycleStart) {
    beforeCycleLength++;
    current = current.next;
  }

  return {
    hasCycle: true,
    cycleStart: cycleStart,
    cycleLength: cycleLength,
    beforeCycleLength: beforeCycleLength,
    totalUniqueNodes: beforeCycleLength + cycleLength,
  };
}

function getListLength(head) {
  let length = 0;
  let current = head;

  while (current) {
    length++;
    current = current.next;
  }

  return length;
}
```

---

## 问题 5：其他相关算法

### 计算环的长度

```javascript
/**
 * 计算环的长度
 */
function getCycleLength(head) {
  const cycleStart = detectCycle(head);

  if (!cycleStart) return 0;

  let length = 1;
  let current = cycleStart.next;

  while (current !== cycleStart) {
    length++;
    current = current.next;
  }

  return length;
}

// 使用快慢指针直接计算环长度
function getCycleLengthDirect(head) {
  if (!head || !head.next) return 0;

  let slow = head;
  let fast = head;

  // 第一阶段：检测环
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      // 第二阶段：计算环长度
      let length = 1;
      fast = fast.next;

      while (slow !== fast) {
        length++;
        fast = fast.next;
      }

      return length;
    }
  }

  return 0; // 没有环
}
```

### 找到环中的所有节点

```javascript
/**
 * 获取环中的所有节点
 */
function getCycleNodes(head) {
  const cycleStart = detectCycle(head);

  if (!cycleStart) return [];

  const cycleNodes = [cycleStart];
  let current = cycleStart.next;

  while (current !== cycleStart) {
    cycleNodes.push(current);
    current = current.next;
  }

  return cycleNodes;
}

// 判断指定节点是否在环中
function isNodeInCycle(head, targetNode) {
  const cycleNodes = getCycleNodes(head);
  return cycleNodes.includes(targetNode);
}
```

### 移除环（修复循环链表）

```javascript
/**
 * 移除环，将循环链表转换为普通链表
 */
function removeCycle(head) {
  const cycleStart = detectCycle(head);

  if (!cycleStart) return head; // 没有环，直接返回

  // 找到环中指向起始节点的节点
  let current = cycleStart;

  while (current.next !== cycleStart) {
    current = current.next;
  }

  // 断开环
  current.next = null;

  return head;
}

// 测试移除环
function testRemoveCycle() {
  const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);

  console.log("移除环前:", hasCycle(cyclicList)); // true

  removeCycle(cyclicList);

  console.log("移除环后:", hasCycle(cyclicList)); // false

  // 打印链表
  let current = cyclicList;
  const values = [];

  while (current) {
    values.push(current.val);
    current = current.next;
  }

  console.log("链表值:", values); // [1, 2, 3, 4, 5]
}
```

---

## 问题 6：实际应用和扩展

### 检测对象引用环

```javascript
/**
 * 检测 JavaScript 对象中的循环引用
 */
function hasCircularReference(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== "object") {
    return false;
  }

  if (visited.has(obj)) {
    return true; // 发现循环引用
  }

  visited.add(obj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (hasCircularReference(obj[key], visited)) {
        return true;
      }
    }
  }

  return false;
}

// 测试对象循环引用
const obj1 = { name: "obj1" };
const obj2 = { name: "obj2" };
obj1.ref = obj2;
obj2.ref = obj1; // 创建循环引用

console.log(hasCircularReference(obj1)); // true

const normalObj = { a: 1, b: { c: 2 } };
console.log(hasCircularReference(normalObj)); // false
```

### 通用的环检测工具

```javascript
/**
 * 通用的环检测工具类
 */
class CycleDetector {
  /**
   * 检测链表是否有环
   */
  static detectLinkedListCycle(head) {
    return {
      hasCycle: hasCycle(head),
      cycleStart: detectCycle(head),
      cycleLength: getCycleLength(head),
      info: getCompleteInfo(head),
    };
  }

  /**
   * 检测数组中的重复访问模式
   */
  static detectArrayCycle(arr, getNext) {
    if (arr.length === 0) return false;

    let slow = 0;
    let fast = 0;

    do {
      slow = getNext(slow);
      fast = getNext(getNext(fast));
    } while (slow !== fast);

    // 检查是否真的有环（而不是到达了无效索引）
    slow = 0;
    while (slow !== fast) {
      slow = getNext(slow);
      fast = getNext(fast);
    }

    return true;
  }

  /**
   * 检测函数调用中的无限递归
   */
  static detectRecursionCycle(func, maxDepth = 1000) {
    let depth = 0;

    const wrapper = function (...args) {
      depth++;

      if (depth > maxDepth) {
        throw new Error("检测到可能的无限递归");
      }

      try {
        const result = func.apply(this, args);
        depth--;
        return result;
      } catch (error) {
        depth--;
        throw error;
      }
    };

    return wrapper;
  }
}

// 使用示例
const cyclicList = createCyclicList([1, 2, 3, 4, 5], 2);
const result = CycleDetector.detectLinkedListCycle(cyclicList);
console.log(result);
```

### 性能测试和比较

```javascript
/**
 * 性能测试：比较不同算法的效率
 */
function performanceTest() {
  // 创建大型链表
  const largeList = createLinkedList(
    Array.from({ length: 10000 }, (_, i) => i)
  );
  const largeCyclicList = createCyclicList(
    Array.from({ length: 10000 }, (_, i) => i),
    5000
  );

  // 测试 Set 方法
  console.time("Set 方法 - 无环");
  hasCycleWithSet(largeList);
  console.timeEnd("Set 方法 - 无环");

  console.time("Set 方法 - 有环");
  hasCycleWithSet(largeCyclicList);
  console.timeEnd("Set 方法 - 有环");

  // 测试快慢指针方法
  console.time("快慢指针 - 无环");
  hasCycle(largeList);
  console.timeEnd("快慢指针 - 无环");

  console.time("快慢指针 - 有环");
  hasCycle(largeCyclicList);
  console.timeEnd("快慢指针 - 有环");
}

// 内存使用测试
function memoryTest() {
  const testSizes = [1000, 5000, 10000, 50000];

  testSizes.forEach((size) => {
    const list = createCyclicList(
      Array.from({ length: size }, (_, i) => i),
      size / 2
    );

    // 测量内存使用（简化版）
    const memBefore = process.memoryUsage().heapUsed;

    // Set 方法
    hasCycleWithSet(list);
    const memAfterSet = process.memoryUsage().heapUsed;

    // 快慢指针方法
    hasCycle(list);
    const memAfterFloyd = process.memoryUsage().heapUsed;

    console.log(`大小 ${size}:`);
    console.log(`  Set 方法额外内存: ${memAfterSet - memBefore} bytes`);
    console.log(`  Floyd 方法额外内存: ${memAfterFloyd - memAfterSet} bytes`);
  });
}
```

---

## 总结

**循环链表检测的核心方法**：

### 1. Set 记录法

- **原理**：使用 Set 记录访问过的节点
- **时间复杂度**：O(n)
- **空间复杂度**：O(n)
- **优点**：简单易懂，可以直接找到环的起始节点
- **缺点**：需要额外的存储空间

### 2. 快慢指针法（Floyd 算法）

- **原理**：使用两个不同速度的指针检测环
- **时间复杂度**：O(n)
- **空间复杂度**：O(1)
- **优点**：空间效率高，是最优解
- **缺点**：理解稍复杂，需要两个阶段找到环起始节点

### 3. 算法选择建议

- **内存受限**：使用快慢指针法
- **简单实现**：使用 Set 记录法
- **生产环境**：推荐快慢指针法

### 4. 扩展应用

- 检测对象循环引用
- 数组中的重复模式检测
- 无限递归检测
- 图中的环检测

### 5. 关键要点

- 理解 Floyd 算法的数学原理
- 掌握两阶段检测：环存在性 + 环起始节点
- 注意边界条件：空链表、单节点链表
- 考虑实际应用中的性能和内存权衡

快慢指针算法是解决循环检测问题的经典算法，掌握其原理和实现对于理解算法设计思想非常重要。
