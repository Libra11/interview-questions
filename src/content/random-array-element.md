---
title: 从数组中随机取一个元素
category: JavaScript
difficulty: 入门
updatedAt: 2025-01-09
summary: >-
  深入探讨从数组中随机取元素的多种实现方式，掌握 Math.random()、边界情况处理、性能优化，理解不同场景下的最佳实践。
tags:
  - 数组操作
  - 随机算法
  - 工具函数
estimatedTime: 20 分钟
keywords:
  - Math.random
  - 数组随机
  - 工具函数
highlight: 掌握多种实现方式，理解边界情况处理，能够根据实际场景选择最优方案
order: 125
---

## 问题 1：如何实现一个从数组中随机取一个元素的函数？

**基础实现**

最简单的实现方式：

```javascript
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 使用
const fruits = ["苹果", "香蕉", "橙子", "葡萄"];
console.log(getRandomElement(fruits)); // 随机返回一个水果
```

**实现原理**：

1. `Math.random()` 返回 `[0, 1)` 区间的随机浮点数
2. `Math.random() * array.length` 得到 `[0, array.length)` 区间的随机数
3. `Math.floor()` 向下取整，得到 `[0, array.length - 1]` 的整数索引

**步骤分解**：

```javascript
const array = ["a", "b", "c"];

// 步骤 1: Math.random() → 例如 0.7
// 步骤 2: 0.7 * 3 → 2.1
// 步骤 3: Math.floor(2.1) → 2
// 步骤 4: array[2] → "c"
```

---

## 问题 2：有哪些不同的实现方式？各有什么优缺点？

### 方式 1：Math.floor() + Math.random()

```javascript
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
```

**优点**：
- 简单直观
- 性能好
- 兼容性好

**缺点**：
- 需要处理边界情况

### 方式 2：Math.round() + Math.random()

```javascript
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = Math.round(Math.random() * (array.length - 1));
  return array[randomIndex];
}
```

**注意**：`Math.round()` 会导致首尾元素的概率略低（因为 `Math.random()` 返回 `[0, 1)`，四舍五入时 0 和 1 的概率不同）

```javascript
// Math.floor() 的概率分布（均匀）
// [0, 1) → 0, [1, 2) → 1, [2, 3) → 2
// 每个索引概率相等

// Math.round() 的概率分布（不均匀）
// [0, 0.5) → 0, [0.5, 1.5) → 1, [1.5, 2.5) → 2, [2.5, 3) → 2
// 首尾元素概率略低
```

**不推荐使用** `Math.round()`，因为概率分布不均匀。

### 方式 3：使用 ~~ (双按位取反)

```javascript
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = ~~(Math.random() * array.length);
  return array[randomIndex];
}
```

**原理**：`~~` 是双按位取反，相当于 `Math.floor()` 对于正数

**优点**：
- 性能略好（位运算比函数调用快）

**缺点**：
- 可读性差
- 只适用于正数
- 对于负数行为不同

```javascript
~~2.7; // 2
~~-2.7; // -2（不是 -3）
Math.floor(-2.7); // -3
```

---

## 问题 3：如何实现从数组中随机取多个不重复的元素？

### 需求：随机取 N 个不重复元素

**方法 1：Fisher-Yates 洗牌算法（推荐）**

```javascript
function getRandomElements(array, count) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  if (count >= array.length) {
    return [...array]; // 返回数组副本
  }

  // Fisher-Yates 洗牌算法
  const shuffled = [...array];
  const result = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * (shuffled.length - i)) + i;
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    result.push(shuffled[i]);
  }

  return result;
}

// 使用
const fruits = ["苹果", "香蕉", "橙子", "葡萄", "西瓜"];
console.log(getRandomElements(fruits, 3)); // 随机返回 3 个不重复的水果
```

**方法 2：使用 Set 去重**

```javascript
function getRandomElements(array, count) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  if (count >= array.length) {
    return [...array];
  }

  const result = new Set();

  while (result.size < count) {
    const randomIndex = Math.floor(Math.random() * array.length);
    result.add(array[randomIndex]);
  }

  return Array.from(result);
}
```

**方法 3：先洗牌再取前 N 个**

```javascript
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomElements(array, count) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  if (count >= array.length) {
    return [...array];
  }

  return shuffle(array).slice(0, count);
}
```

---

## 问题 4：如何实现带权重的随机选择？

### 需求：根据权重随机选择元素

```javascript
// 元素和对应的权重
const items = [
  { value: "苹果", weight: 10 },
  { value: "香蕉", weight: 5 },
  { value: "橙子", weight: 3 },
  { value: "葡萄", weight: 2 },
];

// 权重越高，被选中的概率越大
```

**实现方式**：

```javascript
function getRandomElementByWeight(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  // 计算总权重
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight === 0) {
    return null;
  }

  // 生成 [0, totalWeight) 的随机数
  let random = Math.random() * totalWeight;

  // 遍历数组，找到对应的元素
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }

  // 边界情况（理论上不会执行到这里）
  return items[items.length - 1].value;
}

// 使用
const items = [
  { value: "苹果", weight: 10 },
  { value: "香蕉", weight: 5 },
  { value: "橙子", weight: 3 },
  { value: "葡萄", weight: 2 },
];

console.log(getRandomElementByWeight(items)); // 苹果被选中的概率最高
```

**原理说明**：

```javascript
// 权重分布：
// 苹果: [0, 10)      → 50%
// 香蕉: [10, 15)     → 25%
// 橙子: [15, 18)     → 15%
// 葡萄: [18, 20)     → 10%

// 随机数 7.5：
// 7.5 - 10 = -2.5 ≤ 0 → 选中苹果 ✅

// 随机数 12.5：
// 12.5 - 10 = 2.5 > 0，继续
// 2.5 - 5 = -2.5 ≤ 0 → 选中香蕉 ✅
```

**优化版本（使用累积权重）**：

```javascript
function getRandomElementByWeight(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  // 计算累积权重
  const cumulativeWeights = [];
  let sum = 0;

  for (const item of items) {
    sum += item.weight;
    cumulativeWeights.push(sum);
  }

  if (sum === 0) {
    return null;
  }

  // 生成随机数
  const random = Math.random() * sum;

  // 二分查找（对于大数组更高效）
  let left = 0;
  let right = cumulativeWeights.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (cumulativeWeights[mid] < random) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return items[left].value;
}
```

---

## 总结

**面试回答框架**

1. **基础实现**：
   ```javascript
   function getRandomElement(array) {
     const randomIndex = Math.floor(Math.random() * array.length);
     return array[randomIndex];
   }
   ```

2. **原理说明**：
   - `Math.random()` 返回 `[0, 1)` 的随机数
   - `Math.random() * array.length` 得到 `[0, array.length)` 的随机数
   - `Math.floor()` 向下取整，得到 `[0, array.length - 1]` 的整数索引

3. **边界情况处理**：
   - 空数组：返回 `null` 或抛出错误
   - 非数组类型：类型检查
   - 稀疏数组：过滤空值

4. **实现方式对比**：
   - `Math.floor()`：推荐，概率均匀
   - `Math.round()`：不推荐，概率不均匀
   - `~~`：性能好但可读性差
   - 数组方法：不推荐，性能差

5. **扩展功能**：
   - 随机取多个不重复元素：Fisher-Yates 算法
   - 带权重的随机选择：累积权重 + 二分查找


---

## 延伸阅读

- MDN：[Math.random()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
- 【练习】实现一个随机打乱数组的函数（Fisher-Yates 洗牌算法）
- 【练习】实现一个带权重的随机选择函数，支持 O(log n) 时间复杂度的查找
