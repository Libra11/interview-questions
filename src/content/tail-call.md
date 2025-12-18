---
title: 什么是尾调用？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解尾调用的概念、尾调用优化（TCO）的原理，掌握尾递归的实现方法，了解浏览器支持情况和实际应用场景。
tags:
  - 尾调用
  - 尾递归
  - 函数调用
  - 性能优化
estimatedTime: 20 分钟
keywords:
  - 尾调用
  - Tail Call
  - 尾递归
  - TCO
  - 调用栈
highlight: 尾调用是函数的最后一步操作是调用另一个函数，尾调用优化可以避免栈溢出，但浏览器支持有限
order: 370
---

## 问题 1：什么是尾调用？

尾调用（Tail Call）是指**函数的最后一步操作是调用另一个函数**，并且直接返回该函数的返回值。

### 基本概念

```javascript
// ✅ 这是尾调用
function f(x) {
  return g(x); // 最后一步是调用 g，并直接返回结果
}

// ❌ 这不是尾调用
function f(x) {
  const result = g(x);
  return result; // 调用 g 后还有赋值操作
}

// ❌ 这不是尾调用
function f(x) {
  return g(x) + 1; // 调用 g 后还有加法操作
}

// ❌ 这不是尾调用
function f(x) {
  g(x); // 没有返回 g 的结果
}

// ✅ 这是尾调用
function f(x) {
  if (x > 0) {
    return g(x); // 条件分支中的尾调用
  }
  return h(x); // 另一个分支的尾调用
}
```

### 尾调用的关键特征

```javascript
// 关键：函数调用后不能有任何操作

// ✅ 尾调用
function a() {
  return b();
}

// ❌ 不是尾调用：调用后有操作
function a() {
  return b() + 1;
}

// ❌ 不是尾调用：调用后有操作
function a() {
  const result = b();
  return result;
}

// ❌ 不是尾调用：调用后有操作
function a() {
  return 1 + b();
}

// ✅ 尾调用：三元表达式
function a(x) {
  return x > 0 ? b() : c();
}

// ✅ 尾调用：逻辑运算符
function a(x) {
  return x && b();
}
```

### 为什么尾调用重要

```javascript
// 普通函数调用会创建新的调用栈帧
function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1); // 不是尾调用
}

// 调用栈：
// factorial(5)
//   factorial(4)
//     factorial(3)
//       factorial(2)
//         factorial(1)
// 需要保存 5 个栈帧

// 尾调用优化后，只需要一个栈帧
function factorial(n, acc = 1) {
  if (n === 1) return acc;
  return factorial(n - 1, n * acc); // 尾调用
}

// 调用栈：
// factorial(5, 1) -> factorial(4, 5) -> factorial(3, 20) -> ...
// 每次调用都复用同一个栈帧
```

---

## 问题 2：什么是尾调用优化（TCO）？

尾调用优化（Tail Call Optimization）是指**在尾调用时复用当前栈帧，而不是创建新的栈帧**。

### 调用栈的问题

```javascript
// 普通递归：每次调用都创建新栈帧
function sum(n) {
  if (n === 1) return 1;
  return n + sum(n - 1); // 不是尾调用
}

sum(100000); // 栈溢出！
// RangeError: Maximum call stack size exceeded

// 原因：需要保存 100000 个栈帧
// sum(100000)
//   sum(99999)
//     sum(99998)
//       ...
//         sum(1)
```

### 尾调用优化的原理

```javascript
// 尾调用优化：复用栈帧
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n); // 尾调用
}

// 没有优化的执行过程：
// sum(5, 0)
//   sum(4, 5)
//     sum(3, 9)
//       sum(2, 12)
//         sum(1, 14)
//           sum(0, 15) -> 15

// 有优化的执行过程：
// sum(5, 0) -> sum(4, 5) -> sum(3, 9) -> sum(2, 12) -> sum(1, 14) -> sum(0, 15) -> 15
// 每次调用都复用同一个栈帧，不会栈溢出

sum(100000); // 正常执行（如果浏览器支持 TCO）
```

### 优化的条件

```javascript
// 尾调用优化需要满足的条件：

// 1. 严格模式
'use strict';

// 2. 尾调用位置
function f() {
  return g(); // 必须是最后一步操作
}

// 3. 不能引用当前栈帧的变量
function f() {
  const x = 1;
  return g(); // ✅ 可以优化
}

function f() {
  const x = 1;
  return g(x); // ✅ 可以优化（x 作为参数传递）
}

// 4. 不能是 try/catch/finally 中的尾调用
function f() {
  try {
    return g(); // ❌ 不能优化
  } catch (e) {
    // ...
  }
}
```

---

## 问题 3：什么是尾递归？

尾递归是指**递归调用是函数的最后一步操作**，是尾调用的一种特殊情况。

### 普通递归 vs 尾递归

```javascript
// 普通递归：不是尾调用
function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1); // 递归调用后还有乘法操作
}

// 执行过程：
// factorial(5)
// = 5 * factorial(4)
// = 5 * (4 * factorial(3))
// = 5 * (4 * (3 * factorial(2)))
// = 5 * (4 * (3 * (2 * factorial(1))))
// = 5 * (4 * (3 * (2 * 1)))
// = 120

// 尾递归：是尾调用
function factorial(n, acc = 1) {
  if (n === 1) return acc;
  return factorial(n - 1, n * acc); // 递归调用是最后一步
}

// 执行过程：
// factorial(5, 1)
// = factorial(4, 5)
// = factorial(3, 20)
// = factorial(2, 60)
// = factorial(1, 120)
// = 120
```

### 改写为尾递归

```javascript
// 示例 1：求和
// 普通递归
function sum(n) {
  if (n === 1) return 1;
  return n + sum(n - 1);
}

// 尾递归
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}

// 示例 2：斐波那契数列
// 普通递归
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 尾递归
function fibonacci(n, a = 0, b = 1) {
  if (n === 0) return a;
  return fibonacci(n - 1, b, a + b);
}

// 示例 3：数组求和
// 普通递归
function arraySum(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + arraySum(arr.slice(1));
}

// 尾递归
function arraySum(arr, acc = 0) {
  if (arr.length === 0) return acc;
  return arraySum(arr.slice(1), acc + arr[0]);
}
```

### 尾递归的优势

```javascript
// 优势 1：避免栈溢出
function sum(n) {
  if (n === 0) return 0;
  return n + sum(n - 1);
}

sum(10000); // 栈溢出

function sumTail(n, acc = 0) {
  if (n === 0) return acc;
  return sumTail(n - 1, acc + n);
}

sumTail(10000); // 正常执行（如果支持 TCO）

// 优势 2：节省内存
// 普通递归需要保存所有栈帧
// 尾递归只需要一个栈帧

// 优势 3：性能更好
// 不需要频繁创建和销毁栈帧
```

---

## 问题 4：如何将普通递归改写为尾递归？

改写的关键是**使用累加器参数保存中间结果**。

### 改写步骤

```javascript
// 步骤 1：识别需要保存的中间结果
// 普通递归
function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1); // 需要保存 n
}

// 步骤 2：添加累加器参数
function factorial(n, acc) {
  if (n === 1) return acc;
  return factorial(n - 1, n * acc); // 将 n 累积到 acc
}

// 步骤 3：设置默认值
function factorial(n, acc = 1) {
  if (n === 1) return acc;
  return factorial(n - 1, n * acc);
}
```

### 复杂示例

```javascript
// 示例 1：反转数组
// 普通递归
function reverse(arr) {
  if (arr.length === 0) return [];
  return reverse(arr.slice(1)).concat(arr[0]);
}

// 尾递归
function reverse(arr, result = []) {
  if (arr.length === 0) return result;
  return reverse(arr.slice(1), [arr[0]].concat(result));
}

// 示例 2：数组扁平化
// 普通递归
function flatten(arr) {
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  
  if (Array.isArray(first)) {
    return flatten(first).concat(flatten(rest));
  }
  
  return [first].concat(flatten(rest));
}

// 尾递归
function flatten(arr, result = []) {
  if (arr.length === 0) return result;
  
  const [first, ...rest] = arr;
  
  if (Array.isArray(first)) {
    return flatten(first.concat(rest), result);
  }
  
  return flatten(rest, result.concat(first));
}

// 示例 3：树的深度
// 普通递归
function treeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(
    treeDepth(node.left),
    treeDepth(node.right)
  );
}

// 尾递归（使用辅助函数）
function treeDepth(node) {
  function helper(node, depth) {
    if (!node) return depth;
    
    const leftDepth = helper(node.left, depth + 1);
    const rightDepth = helper(node.right, depth + 1);
    
    return Math.max(leftDepth, rightDepth);
  }
  
  return helper(node, 0);
}
```

### 使用蹦床函数

```javascript
// 如果浏览器不支持 TCO，可以使用蹦床函数模拟
function trampoline(fn) {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
}

// 改写递归函数
function sum(n, acc = 0) {
  if (n === 0) return acc;
  // 返回函数而不是直接递归调用
  return () => sum(n - 1, acc + n);
}

// 使用蹦床函数
const result = trampoline(sum(100000));
console.log(result); // 正常执行，不会栈溢出
```

---

## 问题 5：尾调用的浏览器支持情况如何？

尾调用优化在浏览器中的支持非常有限。

### 支持情况

```javascript
// ES6 规范中定义了尾调用优化
// 但实际支持情况：

// ✅ Safari/WebKit：支持（需要严格模式）
'use strict';
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}

// ❌ Chrome/V8：不支持（已移除）
// ❌ Firefox：不支持
// ❌ Edge：不支持
// ❌ Node.js：不支持（V8 引擎）

// 检测是否支持 TCO
function supportsTCO() {
  'use strict';
  
  return (function f(n) {
    if (n <= 0) return true;
    return f(n - 1);
  })(10000);
}

try {
  const supported = supportsTCO();
  console.log('支持 TCO:', supported);
} catch (e) {
  console.log('不支持 TCO');
}
```

### 为什么浏览器不支持

```javascript
// 原因 1：调试困难
// 尾调用优化会丢失调用栈信息，难以调试

function a() {
  return b();
}

function b() {
  return c();
}

function c() {
  throw new Error('错误');
}

// 没有优化的错误栈：
// Error: 错误
//   at c
//   at b
//   at a

// 有优化的错误栈：
// Error: 错误
//   at c
// 丢失了 a 和 b 的信息

// 原因 2：性能提升有限
// 对于大多数实际应用，尾调用优化的性能提升不明显

// 原因 3：实现复杂
// 需要在引擎层面做大量工作
```

### 替代方案

```javascript
// 方案 1：使用循环代替递归
// 递归版本
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}

// 循环版本
function sum(n) {
  let acc = 0;
  for (let i = n; i > 0; i--) {
    acc += i;
  }
  return acc;
}

// 方案 2：使用蹦床函数
function trampoline(fn) {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
}

function sum(n, acc = 0) {
  if (n === 0) return acc;
  return () => sum(n - 1, acc + n);
}

const result = trampoline(sum(100000));

// 方案 3：使用生成器
function* sumGenerator(n) {
  let acc = 0;
  for (let i = n; i > 0; i--) {
    acc += i;
    yield acc;
  }
  return acc;
}

const gen = sumGenerator(100);
let result;
for (result of gen) {
  // 逐步计算
}
console.log(result);
```

---

## 问题 6：尾调用的实际应用场景有哪些？

虽然浏览器支持有限，但理解尾调用仍然有实际价值。

### 场景 1：递归算法优化

```javascript
// 快速排序
// 普通递归
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}

// 尾递归优化
function quickSort(arr, result = []) {
  if (arr.length === 0) return result;
  
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  
  // 使用蹦床函数或循环实现
  return quickSort(left, result).concat([pivot], quickSort(right, []));
}
```

### 场景 2：状态机

```javascript
// 使用尾调用实现状态机
function stateMachine(state, input) {
  switch (state) {
    case 'START':
      if (input === 'a') {
        return stateMachine('STATE_A', input);
      }
      return stateMachine('ERROR', input);
      
    case 'STATE_A':
      if (input === 'b') {
        return stateMachine('STATE_B', input);
      }
      return stateMachine('ERROR', input);
      
    case 'STATE_B':
      return 'SUCCESS';
      
    case 'ERROR':
      return 'ERROR';
      
    default:
      return 'UNKNOWN';
  }
}

// 使用
const result = stateMachine('START', 'a');
```

### 场景 3：树的遍历

```javascript
// 深度优先遍历
function dfs(node, result = []) {
  if (!node) return result;
  
  result.push(node.value);
  
  if (node.children) {
    return node.children.reduce(
      (acc, child) => dfs(child, acc),
      result
    );
  }
  
  return result;
}

// 使用
const tree = {
  value: 1,
  children: [
    { value: 2, children: [{ value: 4 }, { value: 5 }] },
    { value: 3 }
  ]
};

const result = dfs(tree);
console.log(result); // [1, 2, 4, 5, 3]
```

---

## 问题 7：尾调用的最佳实践是什么？

在实际开发中如何正确使用尾调用。

### 最佳实践

```javascript
// 1. 优先使用循环
// ❌ 不推荐：递归
function sum(n, acc = 0) {
  if (n === 0) return acc;
  return sum(n - 1, acc + n);
}

// ✅ 推荐：循环
function sum(n) {
  let result = 0;
  for (let i = 1; i <= n; i++) {
    result += i;
  }
  return result;
}

// 2. 递归深度可控时可以使用递归
// ✅ 适合：树的深度通常不会太深
function treeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(
    treeDepth(node.left),
    treeDepth(node.right)
  );
}

// 3. 使用蹦床函数处理深度递归
function trampoline(fn) {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
}

// 4. 添加深度限制
function recursiveFunc(n, depth = 0, maxDepth = 1000) {
  if (depth > maxDepth) {
    throw new Error('超过最大递归深度');
  }
  
  if (n === 0) return 0;
  return n + recursiveFunc(n - 1, depth + 1, maxDepth);
}

// 5. 使用尾递归思想优化算法
// 即使不能真正优化，也能让代码更清晰
function factorial(n) {
  function helper(n, acc) {
    if (n === 1) return acc;
    return helper(n - 1, n * acc);
  }
  
  return helper(n, 1);
}
```

### 性能对比

```javascript
// 测试不同实现的性能
function benchmark(fn, name, ...args) {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// 普通递归
function sumRecursive(n) {
  if (n === 0) return 0;
  return n + sumRecursive(n - 1);
}

// 尾递归
function sumTail(n, acc = 0) {
  if (n === 0) return acc;
  return sumTail(n - 1, acc + n);
}

// 循环
function sumLoop(n) {
  let result = 0;
  for (let i = 1; i <= n; i++) {
    result += i;
  }
  return result;
}

// 测试（小数据量）
benchmark(sumRecursive, '普通递归', 1000);
benchmark(sumTail, '尾递归', 1000);
benchmark(sumLoop, '循环', 1000);

// 结果：循环 > 尾递归 ≈ 普通递归
```

---

## 总结

**尾调用的核心要点**：

### 1. 基本概念
- 尾调用是函数的最后一步操作是调用另一个函数
- 关键特征：调用后不能有任何其他操作
- 尾递归是尾调用的特殊情况

### 2. 尾调用优化（TCO）
- 原理：复用当前栈帧，不创建新栈帧
- 优势：避免栈溢出，节省内存
- 条件：严格模式、尾调用位置、不引用当前栈帧变量

### 3. 尾递归改写
- 使用累加器参数保存中间结果
- 将递归调用作为最后一步操作
- 可以避免栈溢出（如果支持 TCO）

### 4. 浏览器支持
- 仅 Safari/WebKit 支持
- Chrome、Firefox、Node.js 不支持
- 原因：调试困难、性能提升有限、实现复杂

### 5. 替代方案
- 优先使用循环
- 使用蹦床函数模拟
- 使用生成器
- 添加递归深度限制

### 6. 实际应用
- 递归算法优化
- 状态机实现
- 树的遍历
- 函数式编程

### 7. 最佳实践
- 优先使用循环而不是递归
- 递归深度可控时可以使用递归
- 使用尾递归思想优化算法结构
- 添加深度限制防止栈溢出

## 延伸阅读

- [ES6 尾调用优化](https://www.ecma-international.org/ecma-262/6.0/#sec-tail-position-calls)
- [尾调用优化的争议](https://github.com/tc39/proposal-ptc-syntax)
- [函数式编程中的尾递归](https://en.wikipedia.org/wiki/Tail_call)
- [蹦床函数详解](https://raganwald.com/2013/03/28/trampolines-in-javascript.html)
