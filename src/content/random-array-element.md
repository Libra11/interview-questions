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
order: 19
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

## 问题 2：如何处理边界情况和异常？

### 空数组处理

```javascript
// ❌ 问题：空数组会返回 undefined
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex]; // 空数组时 array.length = 0，返回 undefined
}

getRandomElement([]); // undefined

// ✅ 解决方案 1：返回 null 或抛出错误
function getRandomElement(array) {
  if (array.length === 0) {
    return null; // 或 throw new Error("数组不能为空")
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// ✅ 解决方案 2：返回默认值
function getRandomElement(array, defaultValue = null) {
  if (array.length === 0) {
    return defaultValue;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

getRandomElement([], "默认值"); // "默认值"
```

### 非数组类型处理

```javascript
// ❌ 问题：传入非数组类型会报错
getRandomElement("string"); // TypeError: array.length is undefined
getRandomElement(null); // TypeError: Cannot read property 'length' of null

// ✅ 解决方案：类型检查
function getRandomElement(array) {
  if (!Array.isArray(array)) {
    throw new TypeError("参数必须是数组");
  }
  if (array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 或者更宽松的处理
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
```

### 稀疏数组处理

```javascript
// 稀疏数组：包含 undefined 或空位的数组
const sparseArray = [1, , , 4]; // 索引 1 和 2 是空位

// ❌ 问题：可能返回 undefined
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex]; // 可能返回 undefined（空位）
}

// ✅ 解决方案：过滤空值
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  
  // 过滤掉 undefined 和空位
  const validElements = array.filter((item) => item !== undefined);
  
  if (validElements.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * validElements.length);
  return validElements[randomIndex];
}

// 或者使用 flat() 处理嵌套数组
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  
  const flattened = array.flat().filter((item) => item !== undefined);
  
  if (flattened.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * flattened.length);
  return flattened[randomIndex];
}
```

---

## 问题 3：有哪些不同的实现方式？各有什么优缺点？

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

### 方式 4：使用数组方法（不推荐）

```javascript
// ❌ 不推荐：性能差，每次都排序
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  return array.sort(() => Math.random() - 0.5)[0];
}

// ❌ 不推荐：创建新数组，性能差
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled[0];
}
```

**为什么不推荐**：
- 性能差：`O(n log n)` 时间复杂度
- 每次调用都要排序整个数组
- 对于大数组效率极低

### 方式 5：使用解构赋值（ES6+）

```javascript
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 或者使用解构（但没必要）
function getRandomElement([...array]) {
  if (array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
```

---

## 问题 4：如何实现从数组中随机取多个不重复的元素？

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

### 性能对比

```javascript
const largeArray = Array.from({ length: 10000 }, (_, i) => i);

// 方法 1：Fisher-Yates（最快）
console.time("Fisher-Yates");
getRandomElements(largeArray, 100);
console.timeEnd("Fisher-Yates"); // ~0.1ms

// 方法 2：Set 去重（中等）
console.time("Set");
getRandomElements(largeArray, 100);
console.timeEnd("Set"); // ~0.5ms

// 方法 3：先洗牌（最慢，但代码简洁）
console.time("Shuffle");
getRandomElements(largeArray, 100);
console.timeEnd("Shuffle"); // ~2ms
```

---

## 问题 5：如何实现带权重的随机选择？

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

## 问题 6：如何测试随机函数的正确性？

### 测试随机性

```javascript
function getRandomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 测试：统计每个元素被选中的次数
function testRandomness(array, iterations = 10000) {
  const counts = {};
  
  // 初始化计数
  array.forEach((item) => {
    counts[item] = 0;
  });
  
  // 执行多次随机选择
  for (let i = 0; i < iterations; i++) {
    const selected = getRandomElement(array);
    counts[selected]++;
  }
  
  // 计算概率
  const probabilities = {};
  const expectedProbability = 1 / array.length;
  
  Object.keys(counts).forEach((item) => {
    const actualProbability = counts[item] / iterations;
    probabilities[item] = {
      count: counts[item],
      actual: actualProbability,
      expected: expectedProbability,
      deviation: Math.abs(actualProbability - expectedProbability),
    };
  });
  
  return probabilities;
}

// 使用
const fruits = ["苹果", "香蕉", "橙子"];
const result = testRandomness(fruits, 10000);
console.log(result);
// {
//   苹果: { count: 3334, actual: 0.3334, expected: 0.3333, deviation: 0.0001 },
//   香蕉: { count: 3321, actual: 0.3321, expected: 0.3333, deviation: 0.0012 },
//   橙子: { count: 3345, actual: 0.3345, expected: 0.3333, deviation: 0.0012 }
// }
```

### 测试边界情况

```javascript
function testGetRandomElement() {
  // 测试空数组
  console.assert(getRandomElement([]) === null, "空数组应返回 null");
  
  // 测试单个元素
  console.assert(getRandomElement([1]) === 1, "单元素数组应返回该元素");
  
  // 测试非数组
  try {
    getRandomElement("string");
    console.assert(false, "非数组应抛出错误");
  } catch (e) {
    console.assert(e instanceof TypeError, "应抛出 TypeError");
  }
  
  // 测试 null/undefined
  console.assert(getRandomElement(null) === null, "null 应返回 null");
  console.assert(getRandomElement(undefined) === null, "undefined 应返回 null");
  
  console.log("所有测试通过！");
}

testGetRandomElement();
```

---

## 问题 7：实际项目中的最佳实践

### 完整的工具函数实现

```javascript
/**
 * 从数组中随机取一个元素
 * @param {Array} array - 源数组
 * @param {*} defaultValue - 空数组时的默认值
 * @returns {*} 随机元素或默认值
 */
function getRandomElement(array, defaultValue = null) {
  // 类型检查
  if (!Array.isArray(array)) {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new TypeError("第一个参数必须是数组");
  }
  
  // 空数组处理
  if (array.length === 0) {
    return defaultValue;
  }
  
  // 随机选择
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 导出（Node.js / ES6 模块）
export default getRandomElement;
// 或
module.exports = getRandomElement;
```

### 类方法实现

```javascript
class ArrayUtils {
  /**
   * 从数组中随机取一个元素
   */
  static randomElement(array, defaultValue = null) {
    if (!Array.isArray(array)) {
      if (defaultValue !== null) {
        return defaultValue;
      }
      throw new TypeError("第一个参数必须是数组");
    }
    
    if (array.length === 0) {
      return defaultValue;
    }
    
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }
  
  /**
   * 从数组中随机取多个不重复元素
   */
  static randomElements(array, count) {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    
    if (count >= array.length) {
      return [...array];
    }
    
    const shuffled = [...array];
    const result = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * (shuffled.length - i)) + i;
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
      result.push(shuffled[i]);
    }
    
    return result;
  }
}

// 使用
const fruits = ["苹果", "香蕉", "橙子"];
console.log(ArrayUtils.randomElement(fruits));
console.log(ArrayUtils.randomElements(fruits, 2));
```

### 扩展数组原型（不推荐）

```javascript
// ⚠️ 不推荐：污染全局原型
Array.prototype.randomElement = function (defaultValue = null) {
  if (this.length === 0) {
    return defaultValue;
  }
  const randomIndex = Math.floor(Math.random() * this.length);
  return this[randomIndex];
};

// 使用
const fruits = ["苹果", "香蕉", "橙子"];
console.log(fruits.randomElement());
```

**为什么不推荐**：
- 可能与其他库冲突
- 违反"不修改原生对象"的原则
- 难以维护和调试

### TypeScript 版本

```typescript
/**
 * 从数组中随机取一个元素
 */
function getRandomElement<T>(array: T[], defaultValue: T | null = null): T | null {
  if (!Array.isArray(array)) {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new TypeError("第一个参数必须是数组");
  }
  
  if (array.length === 0) {
    return defaultValue;
  }
  
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 使用
const fruits: string[] = ["苹果", "香蕉", "橙子"];
const random = getRandomElement(fruits); // string | null
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

6. **最佳实践**：
   - 完整的错误处理
   - 类型检查
   - 不修改原生对象
   - 提供 TypeScript 类型定义

7. **测试**：
   - 测试随机性（统计分布）
   - 测试边界情况
   - 性能测试

---

## 延伸阅读

- MDN：[Math.random()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
- 【练习】实现一个随机打乱数组的函数（Fisher-Yates 洗牌算法）
- 【练习】实现一个带权重的随机选择函数，支持 O(log n) 时间复杂度的查找

