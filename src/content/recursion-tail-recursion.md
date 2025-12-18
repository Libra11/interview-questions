---
title: 递归和尾递归是什么概念？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解递归和尾递归的概念，掌握尾递归优化原理，学会将普通递归转换为尾递归，避免栈溢出问题。
tags:
  - 递归
  - 尾递归
  - 算法优化
  - 函数式编程
estimatedTime: 35 分钟
keywords:
  - 递归
  - 尾递归
  - 栈溢出
  - 函数优化
highlight: 理解递归和尾递归的区别，掌握尾递归优化技巧，能够编写高效的递归函数
order: 194
---

## 问题 1：什么是递归？

**递归定义**

递归是一种编程技巧，指函数直接或间接地调用自身来解决问题。递归通常用于解决可以分解为相似子问题的复杂问题。

**递归的基本结构**：

```javascript
function recursiveFunction(parameters) {
  // 1. 基础情况（递归终止条件）
  if (baseCase) {
    return baseValue;
  }

  // 2. 递归情况（函数调用自身）
  return recursiveFunction(modifiedParameters);
}
```

**经典递归示例**：

```javascript
// 1. 阶乘函数
function factorial(n) {
  // 基础情况
  if (n <= 1) {
    return 1;
  }

  // 递归情况
  return n * factorial(n - 1);
}

console.log(factorial(5)); // 120
// 执行过程：
// factorial(5) = 5 * factorial(4)
// factorial(4) = 4 * factorial(3)
// factorial(3) = 3 * factorial(2)
// factorial(2) = 2 * factorial(1)
// factorial(1) = 1
// 结果：5 * 4 * 3 * 2 * 1 = 120

// 2. 斐波那契数列
function fibonacci(n) {
  // 基础情况
  if (n <= 1) {
    return n;
  }

  // 递归情况
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(6)); // 8
// 执行过程：
// fibonacci(6) = fibonacci(5) + fibonacci(4)
// fibonacci(5) = fibonacci(4) + fibonacci(3)
// ... 以此类推

// 3. 数组求和
function arraySum(arr, index = 0) {
  // 基础情况
  if (index >= arr.length) {
    return 0;
  }

  // 递归情况
  return arr[index] + arraySum(arr, index + 1);
}

console.log(arraySum([1, 2, 3, 4, 5])); // 15
```

**递归的调用栈**：

```javascript
// 递归调用栈示例
function countdown(n) {
  console.log(`进入 countdown(${n})`);

  if (n <= 0) {
    console.log("到达基础情况");
    return;
  }

  countdown(n - 1); // 递归调用
  console.log(`退出 countdown(${n})`);
}

countdown(3);

// 输出：
// 进入 countdown(3)
// 进入 countdown(2)
// 进入 countdown(1)
// 进入 countdown(0)
// 到达基础情况
// 退出 countdown(1)
// 退出 countdown(2)
// 退出 countdown(3)

// 调用栈变化：
// [countdown(3)]
// [countdown(3), countdown(2)]
// [countdown(3), countdown(2), countdown(1)]
// [countdown(3), countdown(2), countdown(1), countdown(0)]
// [countdown(3), countdown(2), countdown(1)] // countdown(0) 返回
// [countdown(3), countdown(2)] // countdown(1) 返回
// [countdown(3)] // countdown(2) 返回
// [] // countdown(3) 返回
```

---

## 问题 2：什么是尾递归？

**尾递归定义**

尾递归是递归的一种特殊形式，指递归调用是函数的最后一个操作，没有其他计算需要在递归调用返回后执行。

**普通递归 vs 尾递归**：

```javascript
// ❌ 普通递归（非尾递归）
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 递归调用后还要执行乘法运算
}

// ✅ 尾递归
function factorialTail(n, accumulator = 1) {
  if (n <= 1) return accumulator;
  return factorialTail(n - 1, n * accumulator); // 递归调用是最后一个操作
}

console.log(factorial(5)); // 120
console.log(factorialTail(5)); // 120
```

**尾递归的特点**：

1. **递归调用是函数的最后一个操作**
2. **不需要保留当前函数的状态**
3. **可以被优化为循环**（理论上）
4. **避免栈溢出**

**尾递归优化原理**：

```javascript
// 普通递归的调用栈
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// 调用 factorial(4) 的栈变化：
// [factorial(4)] - 需要保留 n=4，等待 factorial(3) 返回
// [factorial(4), factorial(3)] - 需要保留 n=3，等待 factorial(2) 返回
// [factorial(4), factorial(3), factorial(2)] - 需要保留 n=2，等待 factorial(1) 返回
// [factorial(4), factorial(3), factorial(2), factorial(1)] - 返回 1
// [factorial(4), factorial(3), factorial(2)] - 计算 2 * 1 = 2
// [factorial(4), factorial(3)] - 计算 3 * 2 = 6
// [factorial(4)] - 计算 4 * 6 = 24
// [] - 返回 24

// 尾递归的调用栈（理想情况下的优化）
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTail(n - 1, n * acc);
}

// 调用 factorialTail(4) 的栈变化（优化后）：
// [factorialTail(4, 1)] - 可以直接替换为 factorialTail(3, 4)
// [factorialTail(3, 4)] - 可以直接替换为 factorialTail(2, 12)
// [factorialTail(2, 12)] - 可以直接替换为 factorialTail(1, 24)
// [factorialTail(1, 24)] - 返回 24
// 栈深度始终为 1
```

---

## 问题 3：如何将普通递归转换为尾递归？

**转换策略：使用累加器（Accumulator）**

### 示例 1：阶乘函数

```javascript
// 普通递归
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// 转换为尾递归
function factorialTail(n, accumulator = 1) {
  if (n <= 1) return accumulator;
  return factorialTail(n - 1, n * accumulator);
}

// 包装函数（隐藏累加器参数）
function factorialOptimized(n) {
  return factorialTail(n, 1);
}

console.log(factorial(5)); // 120
console.log(factorialOptimized(5)); // 120
```

### 示例 2：斐波那契数列

```javascript
// 普通递归（效率极低）
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 转换为尾递归
function fibonacciTail(n, a = 0, b = 1) {
  if (n === 0) return a;
  if (n === 1) return b;
  return fibonacciTail(n - 1, b, a + b);
}

// 包装函数
function fibonacciOptimized(n) {
  return fibonacciTail(n, 0, 1);
}

console.log(fibonacci(10)); // 55（慢）
console.log(fibonacciOptimized(10)); // 55（快）
```

### 示例 3：数组求和

```javascript
// 普通递归
function arraySum(arr, index = 0) {
  if (index >= arr.length) return 0;
  return arr[index] + arraySum(arr, index + 1);
}

// 转换为尾递归
function arraySumTail(arr, index = 0, accumulator = 0) {
  if (index >= arr.length) return accumulator;
  return arraySumTail(arr, index + 1, accumulator + arr[index]);
}

// 包装函数
function arraySumOptimized(arr) {
  return arraySumTail(arr, 0, 0);
}

const numbers = [1, 2, 3, 4, 5];
console.log(arraySum(numbers)); // 15
console.log(arraySumOptimized(numbers)); // 15
```

### 示例 4：数组反转

```javascript
// 普通递归
function reverseArray(arr) {
  if (arr.length <= 1) return arr;
  return [arr[arr.length - 1]].concat(reverseArray(arr.slice(0, -1)));
}

// 转换为尾递归
function reverseArrayTail(arr, index = 0, result = []) {
  if (index >= arr.length) return result;
  return reverseArrayTail(arr, index + 1, [arr[index]].concat(result));
}

// 包装函数
function reverseArrayOptimized(arr) {
  return reverseArrayTail(arr, 0, []);
}

const original = [1, 2, 3, 4, 5];
console.log(reverseArray(original)); // [5, 4, 3, 2, 1]
console.log(reverseArrayOptimized(original)); // [5, 4, 3, 2, 1]
```

---

## 问题 4：JavaScript 中的尾递归优化支持

**ES6 尾递归优化规范**

ES6 规范中定义了尾递归优化（Tail Call Optimization, TCO），但实际支持情况有限。

**检测尾递归优化支持**：

```javascript
// 检测当前环境是否支持尾递归优化
function isTailCallOptimized() {
  "use strict"; // 尾递归优化需要严格模式

  return (
    (function f(n) {
      if (n <= 0) return "optimized";
      return f(n - 1);
    })(100000) === "optimized"
  );
}

console.log("支持尾递归优化:", isTailCallOptimized());
// 大多数浏览器返回 false
// 只有 Safari 的 JavaScriptCore 引擎支持
```

**尾递归优化的条件**：

```javascript
"use strict"; // 1. 必须在严格模式下

// 2. 尾调用必须是函数的最后一个操作
function goodTailCall(n) {
  if (n <= 0) return 0;
  return goodTailCall(n - 1); // ✅ 最后一个操作
}

function badTailCall1(n) {
  if (n <= 0) return 0;
  return 1 + badTailCall1(n - 1); // ❌ 还有加法操作
}

function badTailCall2(n) {
  if (n <= 0) return 0;
  const result = badTailCall2(n - 1); // ❌ 还有赋值操作
  return result;
}

// 3. 尾调用不能是闭包
function badTailCall3(n) {
  const x = 1;
  return (function inner(m) {
    if (m <= 0) return x; // ❌ 访问外部变量，形成闭包
    return inner(m - 1);
  })(n);
}
```

**由于支持有限，实际开发中的解决方案**：

```javascript
// 1. 手动转换为循环
function factorialLoop(n) {
  let result = 1;
  while (n > 1) {
    result *= n;
    n--;
  }
  return result;
}

// 2. 使用蹦床函数（Trampoline）
function trampoline(fn) {
  while (typeof fn === "function") {
    fn = fn();
  }
  return fn;
}

function factorialTrampoline(n, acc = 1) {
  if (n <= 1) return acc;
  return () => factorialTrampoline(n - 1, n * acc);
}

console.log(trampoline(factorialTrampoline(10000))); // 不会栈溢出
```

---

## 问题 5：递归的优缺点和使用场景

### 递归的优点

```javascript
// 1. 代码简洁，逻辑清晰
// 树的遍历
function traverseTree(node) {
  if (!node) return;

  console.log(node.value); // 处理当前节点

  // 递归处理子节点
  if (node.children) {
    node.children.forEach((child) => traverseTree(child));
  }
}

// 2. 自然地表达递归问题
// 计算目录大小
function calculateDirectorySize(directory) {
  let size = directory.fileSize || 0;

  if (directory.subdirectories) {
    directory.subdirectories.forEach((subdir) => {
      size += calculateDirectorySize(subdir); // 递归计算子目录
    });
  }

  return size;
}

// 3. 分治算法的自然实现
// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);
  const middle = arr.filter((x) => x === pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}
```

### 递归的缺点

```javascript
// 1. 栈溢出风险
function deepRecursion(n) {
  if (n <= 0) return 0;
  return deepRecursion(n - 1);
}

// deepRecursion(100000); // RangeError: Maximum call stack size exceeded

// 2. 重复计算（如斐波那契）
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// fibonacci(40) 会进行大量重复计算

// 3. 性能开销
// 每次函数调用都有开销：创建执行上下文、参数传递、返回值处理

// 解决方案：记忆化
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fibonacciMemo = memoize(function (n) {
  if (n <= 1) return n;
  return fibonacciMemo(n - 1) + fibonacciMemo(n - 2);
});

console.log(fibonacciMemo(40)); // 快速计算
```

### 适用场景

```javascript
// 1. 树和图的遍历
class TreeNode {
  constructor(value) {
    this.value = value;
    this.children = [];
  }
}

function findInTree(node, target) {
  if (node.value === target) return node;

  for (const child of node.children) {
    const result = findInTree(child, target);
    if (result) return result;
  }

  return null;
}

// 2. 分治算法
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

// 3. 动态规划问题
function coinChange(coins, amount, memo = {}) {
  if (amount in memo) return memo[amount];
  if (amount === 0) return 0;
  if (amount < 0) return -1;

  let minCoins = Infinity;

  for (const coin of coins) {
    const result = coinChange(coins, amount - coin, memo);
    if (result !== -1) {
      minCoins = Math.min(minCoins, result + 1);
    }
  }

  memo[amount] = minCoins === Infinity ? -1 : minCoins;
  return memo[amount];
}

console.log(coinChange([1, 3, 4], 6)); // 2 (3 + 3)
```

---

## 问题 6：实际开发中的递归应用

### 应用 1：JSON 深拷贝

```javascript
// 递归实现深拷贝
function deepClone(obj, visited = new WeakMap()) {
  // 处理基本类型
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 处理循环引用
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const clonedArray = [];
    visited.set(obj, clonedArray);

    for (let i = 0; i < obj.length; i++) {
      clonedArray[i] = deepClone(obj[i], visited);
    }

    return clonedArray;
  }

  // 处理对象
  const clonedObj = {};
  visited.set(obj, clonedObj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key], visited);
    }
  }

  return clonedObj;
}

// 测试
const original = {
  name: "Alice",
  hobbies: ["reading", "coding"],
  address: {
    city: "New York",
    country: "USA",
  },
};

const cloned = deepClone(original);
cloned.address.city = "Boston";
console.log(original.address.city); // 'New York' (不受影响)
console.log(cloned.address.city); // 'Boston'
```

### 应用 2：文件系统遍历

```javascript
// 模拟文件系统结构
const fileSystem = {
  name: "root",
  type: "directory",
  children: [
    {
      name: "documents",
      type: "directory",
      children: [
        { name: "resume.pdf", type: "file", size: 1024 },
        { name: "cover-letter.doc", type: "file", size: 512 },
      ],
    },
    {
      name: "photos",
      type: "directory",
      children: [
        { name: "vacation.jpg", type: "file", size: 2048 },
        { name: "family.png", type: "file", size: 1536 },
      ],
    },
    { name: "readme.txt", type: "file", size: 256 },
  ],
};

// 递归计算目录总大小
function calculateSize(node) {
  if (node.type === "file") {
    return node.size;
  }

  if (node.type === "directory" && node.children) {
    return node.children.reduce((total, child) => {
      return total + calculateSize(child);
    }, 0);
  }

  return 0;
}

// 递归查找文件
function findFiles(node, extension, results = []) {
  if (node.type === "file" && node.name.endsWith(extension)) {
    results.push(node.name);
  }

  if (node.type === "directory" && node.children) {
    node.children.forEach((child) => {
      findFiles(child, extension, results);
    });
  }

  return results;
}

console.log("总大小:", calculateSize(fileSystem)); // 5376
console.log("PDF 文件:", findFiles(fileSystem, ".pdf")); // ['resume.pdf']
```

### 应用 3：表达式求值

```javascript
// 递归实现表达式求值器
function evaluate(expression) {
  // 处理数字
  if (typeof expression === "number") {
    return expression;
  }

  // 处理数组表达式 [operator, operand1, operand2, ...]
  if (Array.isArray(expression)) {
    const [operator, ...operands] = expression;
    const values = operands.map(evaluate); // 递归求值

    switch (operator) {
      case "+":
        return values.reduce((sum, val) => sum + val, 0);
      case "*":
        return values.reduce((product, val) => product * val, 1);
      case "-":
        return values.length === 1 ? -values[0] : values[0] - values[1];
      case "/":
        return values[0] / values[1];
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  throw new Error(`Invalid expression: ${expression}`);
}

// 测试表达式
const expr1 = ["+", 1, 2, 3]; // 1 + 2 + 3 = 6
const expr2 = ["*", 2, ["+", 3, 4]]; // 2 * (3 + 4) = 14
const expr3 = ["+", ["*", 2, 3], ["/", 8, 2]]; // (2 * 3) + (8 / 2) = 10

console.log(evaluate(expr1)); // 6
console.log(evaluate(expr2)); // 14
console.log(evaluate(expr3)); // 10
```

---

## 问题 7：递归优化技巧

### 技巧 1：记忆化优化

```javascript
// 通用记忆化装饰器
function memoize(fn, keyGenerator = JSON.stringify) {
  const cache = new Map();

  return function memoized(...args) {
    const key = keyGenerator(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 应用到递归函数
const fibonacciMemo = memoize(function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.time("fibonacci(40)");
console.log(fibonacciMemo(40)); // 102334155
console.timeEnd("fibonacci(40)"); // 很快
```

### 技巧 2：迭代转换

```javascript
// 将递归转换为迭代
function factorialIterative(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function fibonacciIterative(n) {
  if (n <= 1) return n;

  let a = 0,
    b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// 使用栈模拟递归
function treeTraversalIterative(root) {
  if (!root) return [];

  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.value);

    // 先压入右子树，再压入左子树（因为栈是后进先出）
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}
```

### 技巧 3：分批处理

```javascript
// 分批处理大量数据，避免栈溢出
function processLargeArray(arr, processor, batchSize = 1000) {
  function processBatch(startIndex) {
    const endIndex = Math.min(startIndex + batchSize, arr.length);

    for (let i = startIndex; i < endIndex; i++) {
      processor(arr[i], i);
    }

    if (endIndex < arr.length) {
      // 使用 setTimeout 让出控制权，避免阻塞
      setTimeout(() => processBatch(endIndex), 0);
    }
  }

  processBatch(0);
}

// 使用示例
const largeArray = new Array(100000).fill(0).map((_, i) => i);
processLargeArray(largeArray, (item, index) => {
  // 处理每个元素
  if (index % 10000 === 0) {
    console.log(`处理到第 ${index} 个元素`);
  }
});
```

---

## 总结

**递归的核心概念**：

1. **基础情况**：递归终止条件
2. **递归情况**：函数调用自身
3. **状态变化**：每次调用参数都要向基础情况靠近

**尾递归的特点**：

1. **递归调用是最后一个操作**
2. **可以被优化为循环**
3. **避免栈溢出**
4. **需要使用累加器传递状态**

**转换技巧**：

1. **普通递归 → 尾递归**：使用累加器参数
2. **递归 → 迭代**：使用循环或栈模拟
3. **优化性能**：记忆化、分批处理

**使用建议**：

1. **简单问题**：优先考虑迭代
2. **树形结构**：递归更自然
3. **大数据量**：注意栈溢出风险
4. **性能要求高**：考虑记忆化或迭代转换

**最佳实践**：

1. 始终定义清晰的基础情况
2. 确保递归参数向基础情况收敛
3. 考虑使用尾递归优化
4. 对于重复计算使用记忆化
5. 测试边界情况和大数据量场景
