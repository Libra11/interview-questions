---

title: 在 JS 中，如何解决递归导致栈溢出问题？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解递归导致栈溢出的原因，掌握尾递归优化、蹦床函数、迭代转换等解决方案，避免递归深度过大导致的性能问题。
tags:
- 递归
- 栈溢出
- 尾递归
- 性能优化
estimatedTime: 30 分钟
keywords:
- 递归
- 栈溢出
- 尾递归优化
- 蹦床函数
highlight: 掌握递归栈溢出的解决方案，理解尾递归优化原理，能够将递归转换为迭代实现
order: 31

---

## 问题 1：什么是递归栈溢出？为什么会发生？

**核心原因**

递归栈溢出（Stack Overflow）是指递归调用层数过多，超出了 JavaScript 引擎的调用栈限制，导致程序崩溃。

**栈溢出的原因**：

```javascript
// ❌ 导致栈溢出的递归
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 每次调用都会在栈中保存状态
}

console.log(factorial(10000)); // RangeError: Maximum call stack size exceeded
```

**调用栈的工作原理**：

```javascript
// 调用栈示例
function a() {
  console.log("a 开始");
  b(); // 调用 b，a 的执行上下文保留在栈中
  console.log("a 结束");
}

function b() {
  console.log("b 开始");
  c(); // 调用 c，b 的执行上下文保留在栈中
  console.log("b 结束");
}

function c() {
  console.log("c 执行");
  // c 执行完毕，从栈中弹出
}

a();

// 调用栈变化：
// 1. [a] - a 入栈
// 2. [a, b] - b 入栈
// 3. [a, b, c] - c 入栈
// 4. [a, b] - c 出栈
// 5. [a] - b 出栈
// 6. [] - a 出栈
```

**不同浏览器的栈限制**：

```javascript
// 测试栈深度限制
function testStackDepth() {
  let depth = 0;

  function recurse() {
    depth++;
    try {
      recurse();
    } catch (e) {
      console.log(`最大栈深度: ${depth}`);
      // Chrome: ~10000-15000
      // Firefox: ~50000-100000
      // Safari: ~50000-100000
    }
  }

  recurse();
}

testStackDepth();
```

---

## 问题 2：尾递归优化是什么？如何实现？

**尾递归定义**

尾递归是指递归调用是函数的最后一个操作，没有其他计算需要在递归调用返回后执行。

**普通递归 vs 尾递归**：

```javascript
// ❌ 普通递归（非尾递归）
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 递归调用后还要执行乘法
}

// ✅ 尾递归优化
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTail(n - 1, n * acc); // 递归调用是最后一个操作
}

console.log(factorial(5)); // 120
console.log(factorialTail(5)); // 120
```

**尾递归的优势**：

```javascript
// 尾递归可以被优化为循环（理论上）
function factorialTail(n, acc = 1) {
  while (n > 1) {
    acc = n * acc;
    n = n - 1;
  }
  return acc;
}
```

**更多尾递归示例**：

```javascript
// 斐波那契数列 - 普通递归
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2); // 非尾递归
}

// 斐波那契数列 - 尾递归
function fibonacciTail(n, a = 0, b = 1) {
  if (n === 0) return a;
  if (n === 1) return b;
  return fibonacciTail(n - 1, b, a + b); // 尾递归
}

// 数组求和 - 尾递归
function sumTail(arr, index = 0, acc = 0) {
  if (index >= arr.length) return acc;
  return sumTail(arr, index + 1, acc + arr[index]);
}

console.log(sumTail([1, 2, 3, 4, 5])); // 15
```

**注意：JavaScript 引擎的尾递归优化支持有限**：

```javascript
// ES6 规范支持尾递归优化，但大多数引擎未实现
// 只有 Safari 的 JavaScriptCore 引擎支持

// 检测是否支持尾递归优化
function isTailCallOptimized() {
  "use strict";
  return (
    (function f(n) {
      if (n <= 0) return "optimized";
      return f(n - 1);
    })(100000) === "optimized"
  );
}

console.log(isTailCallOptimized()); // 大多数浏览器返回 false
```

---

## 问题 3：蹦床函数（Trampoline）是什么？如何使用？

**蹦床函数定义**

蹦床函数是一种将递归转换为迭代的技术，通过返回函数而不是直接调用来避免栈溢出。

**基本蹦床函数实现**：

```javascript
// 蹦床函数
function trampoline(fn) {
  while (typeof fn === "function") {
    fn = fn();
  }
  return fn;
}

// 使用蹦床函数的递归
function factorialTrampoline(n, acc = 1) {
  if (n <= 1) return acc;
  return () => factorialTrampoline(n - 1, n * acc); // 返回函数而不是调用
}

// 使用
console.log(trampoline(factorialTrampoline(10000))); // 不会栈溢出
```

**蹦床函数的工作原理**：

```javascript
// 执行过程示例
function example(n) {
  if (n <= 0) return "done";
  return () => example(n - 1);
}

// trampoline(example(3)) 的执行过程：
// 1. fn = example(3) -> 返回 () => example(2)
// 2. fn = () => example(2) -> 执行后返回 () => example(1)
// 3. fn = () => example(1) -> 执行后返回 () => example(0)
// 4. fn = () => example(0) -> 执行后返回 "done"
// 5. 返回 "done"
```

**更复杂的蹦床函数示例**：

```javascript
// 斐波那契数列 - 蹦床函数版本
function fibonacciTrampoline(n, a = 0, b = 1) {
  if (n === 0) return a;
  if (n === 1) return b;
  return () => fibonacciTrampoline(n - 1, b, a + b);
}

console.log(trampoline(fibonacciTrampoline(10000))); // 不会栈溢出

// 数组遍历 - 蹦床函数版本
function forEachTrampoline(arr, fn, index = 0) {
  if (index >= arr.length) return;
  fn(arr[index], index);
  return () => forEachTrampoline(arr, fn, index + 1);
}

const largeArray = new Array(100000).fill(0).map((_, i) => i);
trampoline(
  forEachTrampoline(largeArray, (item) => {
    // 处理每个元素
  })
);
```

**改进的蹦床函数**：

```javascript
// 支持参数传递的蹦床函数
function trampolineWithArgs(fn, ...args) {
  let result = fn(...args);
  while (typeof result === "function") {
    result = result();
  }
  return result;
}

// 支持异步的蹦床函数
async function asyncTrampoline(fn) {
  while (typeof fn === "function") {
    fn = await fn();
  }
  return fn;
}
```

---

## 问题 4：如何将递归转换为迭代？

**转换策略**

将递归转换为迭代的核心是使用显式的栈或队列来模拟递归调用栈。

**示例 1：阶乘函数**：

```javascript
// 递归版本
function factorialRecursive(n) {
  if (n <= 1) return 1;
  return n * factorialRecursive(n - 1);
}

// 迭代版本
function factorialIterative(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

console.log(factorialRecursive(5)); // 120
console.log(factorialIterative(5)); // 120
```

**示例 2：斐波那契数列**：

```javascript
// 递归版本（效率低）
function fibonacciRecursive(n) {
  if (n <= 1) return n;
  return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

// 迭代版本（效率高）
function fibonacciIterative(n) {
  if (n <= 1) return n;

  let a = 0,
    b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(fibonacciRecursive(10)); // 55（慢）
console.log(fibonacciIterative(10)); // 55（快）
```

**示例 3：树的遍历**：

```javascript
// 树节点定义
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// 递归版本 - 深度优先遍历
function dfsRecursive(root, result = []) {
  if (!root) return result;
  result.push(root.val);
  dfsRecursive(root.left, result);
  dfsRecursive(root.right, result);
  return result;
}

// 迭代版本 - 使用栈
function dfsIterative(root) {
  if (!root) return [];

  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);

    // 先压入右子树，再压入左子树（因为栈是后进先出）
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}

// 测试
const tree = new TreeNode(
  1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);

console.log(dfsRecursive(tree)); // [1, 2, 4, 5, 3]
console.log(dfsIterative(tree)); // [1, 2, 4, 5, 3]
```

**示例 4：数组扁平化**：

```javascript
// 递归版本
function flattenRecursive(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenRecursive(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

// 迭代版本 - 使用栈
function flattenIterative(arr) {
  const result = [];
  const stack = [...arr];

  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item);
    } else {
      result.unshift(item); // 因为是从后往前处理，所以用 unshift
    }
  }

  return result;
}

// 更高效的迭代版本
function flattenIterativeOptimized(arr) {
  const result = [];
  const stack = [...arr.map((item, index) => ({ item, index }))];

  while (stack.length > 0) {
    const { item } = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item.map((subItem) => ({ item: subItem })));
    } else {
      result.unshift(item);
    }
  }

  return result;
}

const nested = [1, [2, [3, 4], 5], 6];
console.log(flattenRecursive(nested)); // [1, 2, 3, 4, 5, 6]
console.log(flattenIterative(nested)); // [1, 2, 3, 4, 5, 6]
```

---

## 问题 5：记忆化（Memoization）如何优化递归？

**记忆化定义**

记忆化是一种优化技术，通过缓存函数的计算结果来避免重复计算，特别适用于有重叠子问题的递归。

**基本记忆化实现**：

```javascript
// 通用记忆化函数
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

// 使用记忆化优化斐波那契数列
const fibonacciMemo = memoize(function (n) {
  if (n <= 1) return n;
  return fibonacciMemo(n - 1) + fibonacciMemo(n - 2);
});

console.log(fibonacciMemo(40)); // 快速计算，不会栈溢出
```

**手动实现记忆化**：

```javascript
// 斐波那契数列 - 手动记忆化
function fibonacciWithCache() {
  const cache = {};

  function fib(n) {
    if (n in cache) return cache[n];

    if (n <= 1) {
      cache[n] = n;
      return n;
    }

    cache[n] = fib(n - 1) + fib(n - 2);
    return cache[n];
  }

  return fib;
}

const fib = fibonacciWithCache();
console.log(fib(100)); // 快速计算大数
```

**动态规划 vs 记忆化**：

```javascript
// 动态规划（自底向上）
function fibonacciDP(n) {
  if (n <= 1) return n;

  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// 记忆化（自顶向下）
const fibonacciMemoized = memoize(function (n) {
  if (n <= 1) return n;
  return fibonacciMemoized(n - 1) + fibonacciMemoized(n - 2);
});

// 空间优化的动态规划
function fibonacciDPOptimized(n) {
  if (n <= 1) return n;

  let prev = 0,
    curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}
```

---

## 问题 6：实际应用场景和解决方案

**场景 1：深度嵌套的 JSON 处理**：

```javascript
// 问题：深度嵌套的对象可能导致栈溢出
function deepCloneRecursive(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    clone[key] = deepCloneRecursive(obj[key]); // 可能栈溢出
  }
  return clone;
}

// 解决方案：迭代版本
function deepCloneIterative(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  const stack = [{ original: obj, clone: Array.isArray(obj) ? [] : {} }];
  const result = stack[0].clone;

  while (stack.length > 0) {
    const { original, clone } = stack.pop();

    for (const key in original) {
      const value = original[key];

      if (value === null || typeof value !== "object") {
        clone[key] = value;
      } else {
        const newClone = Array.isArray(value) ? [] : {};
        clone[key] = newClone;
        stack.push({ original: value, clone: newClone });
      }
    }
  }

  return result;
}
```

**场景 2：文件系统遍历**：

```javascript
// 模拟文件系统结构
const fileSystem = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "folder1",
      type: "folder",
      children: [
        { name: "file1.txt", type: "file" },
        { name: "file2.txt", type: "file" },
      ],
    },
    { name: "file3.txt", type: "file" },
  ],
};

// 递归版本（可能栈溢出）
function findFilesRecursive(node, files = []) {
  if (node.type === "file") {
    files.push(node.name);
  } else if (node.children) {
    node.children.forEach((child) => findFilesRecursive(child, files));
  }
  return files;
}

// 迭代版本（安全）
function findFilesIterative(root) {
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();

    if (node.type === "file") {
      files.push(node.name);
    } else if (node.children) {
      stack.push(...node.children);
    }
  }

  return files;
}

console.log(findFilesRecursive(fileSystem));
console.log(findFilesIterative(fileSystem));
```

**场景 3：表达式求值**：

```javascript
// 递归版本
function evaluateRecursive(expr) {
  if (typeof expr === "number") return expr;

  const [operator, ...operands] = expr;
  const values = operands.map(evaluateRecursive);

  switch (operator) {
    case "+":
      return values.reduce((a, b) => a + b);
    case "*":
      return values.reduce((a, b) => a * b);
    default:
      throw new Error("Unknown operator");
  }
}

// 迭代版本
function evaluateIterative(expr) {
  const stack = [{ expr, parent: null, index: 0 }];
  const results = new Map();

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    if (typeof current.expr === "number") {
      results.set(current, current.expr);
      stack.pop();
      continue;
    }

    const [operator, ...operands] = current.expr;

    if (current.index < operands.length) {
      stack.push({
        expr: operands[current.index],
        parent: current,
        index: 0,
      });
      current.index++;
    } else {
      const values = operands.map((operand) =>
        typeof operand === "number" ? operand : results.get(operand)
      );

      let result;
      switch (operator) {
        case "+":
          result = values.reduce((a, b) => a + b);
          break;
        case "*":
          result = values.reduce((a, b) => a * b);
          break;
        default:
          throw new Error("Unknown operator");
      }

      results.set(current, result);
      stack.pop();
    }
  }

  return results.get({ expr });
}

const expression = ["+", 1, ["*", 2, 3], 4];
console.log(evaluateRecursive(expression)); // 10
```

---

## 总结

**解决递归栈溢出的方法**：

1. **尾递归优化**：将递归调用作为函数的最后一个操作
2. **蹦床函数**：返回函数而不是直接调用，避免栈积累
3. **迭代转换**：使用显式栈或队列模拟递归过程
4. **记忆化**：缓存计算结果，避免重复计算
5. **分治策略**：将大问题分解为小问题，分批处理

**选择策略**：

- **简单递归**：使用迭代转换
- **有重叠子问题**：使用记忆化
- **尾递归**：使用蹦床函数或手动优化
- **深度嵌套数据**：使用迭代 + 栈

**最佳实践**：

1. 优先考虑迭代解决方案
2. 对于必须使用递归的场景，考虑记忆化
3. 测试极端情况下的性能表现
4. 根据数据规模选择合适的优化策略
