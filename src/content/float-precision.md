---
title: 0.1 + 0.2 不等于 0.3 这是什么原因，要怎么解决
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 浮点数精度问题的根本原因，掌握 IEEE 754 标准、二进制表示、精度丢失机制，以及多种解决方案和最佳实践。
tags:
  - 浮点数
  - 精度问题
  - IEEE 754
  - 数值计算
estimatedTime: 35 分钟
keywords:
  - 浮点数精度
  - IEEE 754
  - 0.1 + 0.2
  - Number.EPSILON
  - 精度丢失
highlight: 理解 IEEE 754 浮点数表示的本质，掌握精度丢失的根本原因，能够选择合适的解决方案处理浮点数计算问题。
order: 184
---

## 问题 1：0.1 + 0.2 为什么不等于 0.3？

**现象**

```javascript
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
```

**根本原因：IEEE 754 浮点数标准的精度限制**

JavaScript 使用 IEEE 754 双精度浮点数标准（64 位）来表示数字，某些十进制小数无法精确表示为二进制小数，导致精度丢失。

---

## 问题 2：为什么会出现精度丢失？

**核心原因：十进制小数转二进制时的无限循环**

### 十进制转二进制

```javascript
// 0.1 的二进制表示
// 0.1 × 2 = 0.2 → 0
// 0.2 × 2 = 0.4 → 0
// 0.4 × 2 = 0.8 → 0
// 0.8 × 2 = 1.6 → 1
// 0.6 × 2 = 1.2 → 1
// 0.2 × 2 = 0.4 → 0（开始循环）
// 0.1 (十进制) = 0.0001100110011001100... (二进制，无限循环)

// 0.2 的二进制表示
// 0.2 × 2 = 0.4 → 0
// 0.4 × 2 = 0.8 → 0
// 0.8 × 2 = 1.6 → 1
// 0.6 × 2 = 1.2 → 1
// 0.2 × 2 = 0.4 → 0（开始循环）
// 0.2 (十进制) = 0.0011001100110011001... (二进制，无限循环)
```

### IEEE 754 双精度浮点数格式

```
64 位 = 1 位符号位 + 11 位指数位 + 52 位尾数位

符号位：0（正数）或 1（负数）
指数位：-1022 到 1023
尾数位：52 位精度
```

**问题**：由于尾数位只有 52 位，无限循环的二进制小数会被截断，导致精度丢失。

```javascript
// 0.1 在内存中的实际存储值
console.log(0.1.toPrecision(21)); 
// 0.100000000000000005551

// 0.2 在内存中的实际存储值
console.log(0.2.toPrecision(21)); 
// 0.200000000000000011102

// 0.1 + 0.2 的实际结果
console.log((0.1 + 0.2).toPrecision(21)); 
// 0.300000000000000044409
```

---

## 问题 3：哪些数字会有精度问题？

**所有无法精确表示为二进制的十进制小数都会有精度问题**

### 常见问题数字

```javascript
// 问题 1：简单加法
0.1 + 0.2; // 0.30000000000000004
0.1 + 0.7; // 0.7999999999999999
0.2 + 0.4; // 0.6000000000000001

// 问题 2：小数乘法
0.1 * 3; // 0.30000000000000004
0.3 * 3; // 0.8999999999999999

// 问题 3：小数除法
0.3 / 0.1; // 2.9999999999999996
0.69 / 10; // 0.06899999999999999

// 问题 4：累加
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += 0.1;
}
console.log(sum); // 0.9999999999999999（不是 1.0）

// 问题 5：大数运算
9007199254740992 + 1; // 9007199254740992（没有变化）
9007199254740992 + 2; // 9007199254740994（可以）
```

### 安全整数范围

```javascript
// JavaScript 中的安全整数范围
Number.MAX_SAFE_INTEGER; // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER; // -9007199254740991 (-(2^53 - 1))

// 检查是否为安全整数
Number.isSafeInteger(9007199254740991); // true
Number.isSafeInteger(9007199254740992); // false

// 超出安全范围的问题
9007199254740992 === 9007199254740993; // true（错误！）
```

---

## 问题 4：如何解决浮点数精度问题？

### 方案 1：使用 Number.EPSILON 进行误差比较

**Number.EPSILON：表示 1 和大于 1 的最小浮点数之间的差**

```javascript
// 判断两个浮点数是否相等
function isEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}

console.log(isEqual(0.1 + 0.2, 0.3)); // true

// 更通用的比较函数
function isEqual(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}

// 使用自定义误差范围
function isEqual(a, b, precision = 10) {
  return Math.abs(a - b) < Math.pow(10, -precision);
}

console.log(isEqual(0.1 + 0.2, 0.3, 10)); // true
```

### 方案 2：转换为整数进行计算

**核心思想：将小数转换为整数，计算后再转回小数**

```javascript
// 获取小数位数
function getDecimalPlaces(num) {
  const str = num.toString();
  if (str.indexOf(".") === -1) return 0;
  return str.split(".")[1].length;
}

// 加法
function add(a, b) {
  const precision = Math.max(getDecimalPlaces(a), getDecimalPlaces(b));
  const multiplier = Math.pow(10, precision);
  return (a * multiplier + b * multiplier) / multiplier;
}

console.log(add(0.1, 0.2)); // 0.3

// 减法
function subtract(a, b) {
  const precision = Math.max(getDecimalPlaces(a), getDecimalPlaces(b));
  const multiplier = Math.pow(10, precision);
  return (a * multiplier - b * multiplier) / multiplier;
}

// 乘法
function multiply(a, b) {
  const precisionA = getDecimalPlaces(a);
  const precisionB = getDecimalPlaces(b);
  const multiplier = Math.pow(10, precisionA + precisionB);
  return (a * Math.pow(10, precisionA) * b * Math.pow(10, precisionB)) / multiplier;
}

// 除法
function divide(a, b) {
  const precisionA = getDecimalPlaces(a);
  const precisionB = getDecimalPlaces(b);
  const multiplier = Math.pow(10, precisionA - precisionB);
  return (a * Math.pow(10, precisionA)) / (b * Math.pow(10, precisionB)) / multiplier;
}
```

### 方案 3：使用 toFixed() 和 parseFloat()

**注意：toFixed() 返回字符串，需要转换回数字**

```javascript
// 加法
function add(a, b) {
  const precision = Math.max(
    (a.toString().split(".")[1] || "").length,
    (b.toString().split(".")[1] || "").length
  );
  return parseFloat((a + b).toFixed(precision));
}

console.log(add(0.1, 0.2)); // 0.3

// 更通用的方法
function preciseAdd(...args) {
  const precision = Math.max(
    ...args.map((num) => (num.toString().split(".")[1] || "").length)
  );
  const sum = args.reduce((acc, num) => acc + num, 0);
  return parseFloat(sum.toFixed(precision));
}
```

### 方案 4：使用第三方库

**decimal.js（推荐）**

```javascript
// 安装：npm install decimal.js
const Decimal = require("decimal.js");

const a = new Decimal(0.1);
const b = new Decimal(0.2);
const result = a.plus(b);

console.log(result.toString()); // "0.3"
console.log(result.toNumber()); // 0.3

// 更多操作
new Decimal(0.1)
  .plus(0.2)
  .times(3)
  .dividedBy(2)
  .toString(); // "0.45"
```

**big.js（轻量级）**

```javascript
// 安装：npm install big.js
const Big = require("big.js");

const result = new Big(0.1).plus(0.2);
console.log(result.toString()); // "0.3"

// 链式调用
new Big(0.1).plus(0.2).times(3).toString(); // "0.9"
```

**number-precision（简单易用）**

```javascript
// 安装：npm install number-precision
const NP = require("number-precision");

NP.plus(0.1, 0.2); // 0.3
NP.minus(0.3, 0.1); // 0.2
NP.times(0.1, 0.2); // 0.02
NP.divide(0.3, 0.1); // 3
```

---

## 问题 5：实际开发中如何处理精度问题？

### 场景 1：金额计算

```javascript
// ❌ 错误：直接计算
const price = 19.9;
const quantity = 3;
const total = price * quantity; // 59.699999999999996

// ✅ 正确：使用整数计算
function calculatePrice(price, quantity) {
  // 转换为分（整数）
  const priceInCents = Math.round(price * 100);
  const totalInCents = priceInCents * quantity;
  // 转换回元
  return totalInCents / 100;
}

const total = calculatePrice(19.9, 3); // 59.7

// ✅ 或使用库
const Decimal = require("decimal.js");
const total = new Decimal(19.9).times(3).toNumber(); // 59.7
```

### 场景 2：百分比计算

```javascript
// ❌ 错误：直接计算
const percentage = 0.1 + 0.2; // 0.30000000000000004
if (percentage === 0.3) {
  // 永远不会执行
}

// ✅ 正确：使用误差比较
function isPercentageEqual(a, b) {
  return Math.abs(a - b) < 0.0001; // 使用自定义误差范围
}

if (isPercentageEqual(0.1 + 0.2, 0.3)) {
  // 会执行
}
```

### 场景 3：累加计算

```javascript
// ❌ 错误：直接累加
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += 0.1;
}
console.log(sum === 1.0); // false

// ✅ 正确：使用整数累加
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum = PreciseCalculator.add(sum, 0.1);
}
console.log(sum === 1.0); // true

// ✅ 或使用库
const Decimal = require("decimal.js");
let sum = new Decimal(0);
for (let i = 0; i < 10; i++) {
  sum = sum.plus(0.1);
}
console.log(sum.toNumber() === 1.0); // true
```

### 场景 4：数组求和

```javascript
// ❌ 错误：直接使用 reduce
const numbers = [0.1, 0.2, 0.3, 0.4];
const sum = numbers.reduce((a, b) => a + b, 0);
// 0.9999999999999999

// ✅ 正确：使用精确计算
const sum = numbers.reduce(
  (a, b) => PreciseCalculator.add(a, b),
  0
);
// 1.0

// ✅ 或使用库
const Decimal = require("decimal.js");
const sum = numbers
  .reduce((acc, num) => acc.plus(num), new Decimal(0))
  .toNumber();
// 1.0
```

---

## 问题 6：Number.EPSILON 是什么？

**Number.EPSILON：表示 1 和大于 1 的最小浮点数之间的差**

```javascript
console.log(Number.EPSILON); // 2.220446049250313e-16

// 用途：判断两个浮点数是否"相等"
function isEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}

console.log(isEqual(0.1 + 0.2, 0.3)); // true
console.log(isEqual(0.1 + 0.2, 0.30000000000000004)); // true
```

**注意**：Number.EPSILON 可能对于某些场景来说太小或太大

```javascript
// 对于较大的数字，Number.EPSILON 可能不够
function isEqual(a, b, relativeEpsilon = Number.EPSILON) {
  // 相对误差比较
  if (a === b) return true;
  const diff = Math.abs(a - b);
  const max = Math.max(Math.abs(a), Math.abs(b));
  return diff / max < relativeEpsilon;
}

console.log(isEqual(1000.1, 1000.2)); // false（相对误差较大）
console.log(isEqual(0.1, 0.2)); // false（相对误差较大）
```

---

## 总结

### 核心要点

1. **根本原因**：IEEE 754 双精度浮点数标准，某些十进制小数无法精确表示为二进制
2. **精度丢失**：无限循环的二进制小数被 52 位尾数截断
3. **常见问题**：0.1 + 0.2、小数乘法、累加等
4. **解决方案**：使用 Number.EPSILON、转换为整数、使用第三方库

### 解决方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Number.EPSILON** | 简单 | 误差范围固定 | 简单比较 |
| **整数转换** | 精确 | 实现复杂 | 金额计算 |
| **第三方库** | 功能强大 | 增加依赖 | 复杂计算 |

### 最佳实践

1. **金额计算**：使用整数（分为单位）
2. **科学计算**：使用专业库（decimal.js）
3. **比较操作**：使用误差范围，不要直接比较
4. **显示格式化**：使用 toFixed()，但不要用于计算
5. **避免累加误差**：使用整数累加或库函数

### 推荐阅读

- [IEEE 754 标准](https://en.wikipedia.org/wiki/IEEE_754)
- [MDN: Number.EPSILON](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)
- [decimal.js 文档](https://mikemcl.github.io/decimal.js/)
- [0.30000000000000004.com](https://0.30000000000000004.com/)

