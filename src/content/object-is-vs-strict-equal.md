---
title: Object.is 与严格相等(===)深度对比
category: JavaScript
difficulty: 入门
updatedAt: 2025-01-09
summary: >-
  深入剖析 Object.is 与 === 的核心差异，掌握 NaN、+0/-0 的特殊处理规则，理解 SameValue 算法的设计哲学。
tags:
  - 相等比较
  - ES6+
  - 类型系统
estimatedTime: 20 分钟
keywords:
  - Object.is
  - 严格相等
  - NaN
  - +0 vs -0
highlight: 理解 Object.is 在 NaN 和 +0/-0 场景下的特殊行为，掌握实际项目中的选择策略
order: 15
---

## 问题 1：Object.is 与 === 的核心差异是什么？

**快速总结**

`Object.is()` 与 `===` 几乎完全相同，但在两种特殊情况下有差异：

1. **NaN 的比较**：`Object.is(NaN, NaN)` 返回 `true`，而 `NaN === NaN` 返回 `false`
2. **+0 和 -0 的比较**：`Object.is(+0, -0)` 返回 `false`，而 `+0 === -0` 返回 `true`

```javascript
// 差异 1：NaN
NaN === NaN;              // false
Object.is(NaN, NaN);      // true

// 差异 2：+0 和 -0
+0 === -0;                // true
Object.is(+0, -0);        // false

// 其他所有情况都相同
Object.is(1, 1);          // true（与 === 相同）
Object.is('a', 'a');      // true
Object.is(null, null);    // true
Object.is(undefined, undefined); // true
Object.is({}, {});        // false（不同引用）
```

**完整对比表**

| 比较场景 | `===` | `Object.is()` |
|---------|-------|--------------|
| 基本类型（相同值） | `true` | `true` |
| 对象（不同引用） | `false` | `false` |
| `null` vs `undefined` | `false` | `false` |
| `NaN` vs `NaN` | `false` ⚠️ | `true` ✅ |
| `+0` vs `-0` | `true` ⚠️ | `false` ✅ |

---

## 问题 2：为什么 NaN === NaN 是 false？Object.is 如何解决这个问题？

### === 对 NaN 的处理

**历史原因**：JavaScript 遵循 IEEE 754 浮点数标准，规定 NaN 不等于任何值，包括它自己。

```javascript
// NaN 的特殊行为
NaN === NaN;              // false
NaN == NaN;               // false
NaN !== NaN;              // true

// 数学运算产生的 NaN
0 / 0;                    // NaN
Math.sqrt(-1);            // NaN
parseInt('hello');        // NaN

// 所有产生的 NaN 都不相等
const nan1 = 0 / 0;
const nan2 = Math.sqrt(-1);
nan1 === nan2;            // false
```

**实际问题**：无法直接判断一个值是否为 NaN

```javascript
// ❌ 错误做法
function isNaNValue(value) {
  return value === NaN; // 总是返回 false
}

isNaNValue(NaN);          // false - ❌ 错误

// ✅ 传统解决方案 1：全局 isNaN()
isNaN(NaN);               // true
isNaN('hello');           // true - ⚠️  会先转换为数字

// ✅ 传统解决方案 2：Number.isNaN()（ES6+，推荐）
Number.isNaN(NaN);        // true
Number.isNaN('hello');    // false - ✅ 不会类型转换

// ✅ 传统解决方案 3：利用 NaN !== NaN
function isNaNValue(value) {
  return value !== value; // 只有 NaN 不等于自己
}

isNaNValue(NaN);          // true
isNaNValue(123);          // false

// ✅ ES6 解决方案：Object.is()
Object.is(value, NaN);    // 语义更清晰
```

### Object.is 的 NaN 处理

`Object.is()` 使用 **SameValue 算法**，认为所有 NaN 都相等：

```javascript
Object.is(NaN, NaN);      // true
Object.is(0 / 0, NaN);    // true
Object.is(Math.sqrt(-1), NaN); // true

// 实际应用：数组去重（包含 NaN）
function uniqueWithNaN(arr) {
  return arr.filter((item, index) => {
    return arr.findIndex(x => Object.is(x, item)) === index;
  });
}

uniqueWithNaN([1, 2, NaN, 3, NaN, 1]);
// [1, 2, NaN, 3] - NaN 被正确去重
```

---

## 问题 3：为什么 +0 === -0？Object.is 如何区分它们？

### === 对 +0 和 -0 的处理

JavaScript 有两个零值：`+0`（正零）和 `-0`（负零），严格相等认为它们相同：

```javascript
+0 === -0;                // true
0 === -0;                 // true（0 默认是 +0）

// 数学运算产生 -0
-1 * 0;                   // -0
Math.round(-0.1);         // -0
-0 / 1;                   // -0

// 字符串转换无法区分
String(+0);               // '0'
String(-0);               // '0'
(+0).toString();          // '0'
(-0).toString();          // '0'
```

**为什么需要区分 +0 和 -0？**

在某些数学和物理场景中，方向很重要：

```javascript
// 场景 1：除法保留符号信息
1 / +0;                   // Infinity
1 / -0;                   // -Infinity

// 场景 2：动画方向
function animate(velocity) {
  if (velocity === 0) {
    // 无法区分是从左边停止还是从右边停止
  }
}

// 场景 3：数学函数的边界行为
Math.atan2(0, 0);         // 0
Math.atan2(-0, 0);        // -0
Math.atan2(0, -0);        // 3.141592653589793
```

### Object.is 的 +0/-0 处理

`Object.is()` 认为 +0 和 -0 是不同的值：

```javascript
Object.is(+0, -0);        // false
Object.is(0, -0);         // false
Object.is(-0, -0);        // true

// 判断是否为 -0
function isNegativeZero(value) {
  return Object.is(value, -0);
}

isNegativeZero(0);        // false
isNegativeZero(-0);       // true
isNegativeZero(-1 * 0);   // true

// 传统方法：利用 1/x 的符号
function isNegativeZeroOld(value) {
  return value === 0 && 1 / value === -Infinity;
}

isNegativeZeroOld(-0);    // true
```

**实际应用：保持数值的符号信息**

```javascript
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  
  // 保持 -0 和 +0 的差异
  if (Object.is(value, -0)) return -0;
  if (Object.is(value, +0)) return +0;
  
  return value;
}

clamp(-0, -10, 10);       // -0（保留符号）
clamp(+0, -10, 10);       // +0
```

---

## 问题 4：Object.is 的实现原理是什么？如何 Polyfill？

### SameValue 算法

`Object.is()` 使用 **SameValue 抽象操作**（ECMA-262 规范定义）：

**算法步骤**：

1. 如果 `x` 和 `y` 类型不同，返回 `false`
2. 如果都是 Number 类型：
   - 如果都是 NaN，返回 `true`
   - 如果 `x` 是 +0，`y` 是 -0，返回 `false`
   - 如果 `x` 是 -0，`y` 是 +0，返回 `false`
   - 如果 `x` 和 `y` 数值相等，返回 `true`
   - 否则返回 `false`
3. 其他类型按 `===` 的规则比较

### Polyfill 实现

```javascript
if (!Object.is) {
  Object.is = function(x, y) {
    // 1. 相同引用（处理大部分情况）
    if (x === y) {
      // 特殊情况：区分 +0 和 -0
      // 1 / +0 === Infinity
      // 1 / -0 === -Infinity
      return x !== 0 || 1 / x === 1 / y;
    }
    
    // 2. 不同引用
    // 特殊情况：NaN !== NaN，但 Object.is(NaN, NaN) 为 true
    return x !== x && y !== y;
  };
}

// 测试 Polyfill
Object.is(NaN, NaN);      // true
Object.is(+0, -0);        // false
Object.is(1, 1);          // true
Object.is(null, null);    // true
```

**Polyfill 解析**：

```javascript
// 情况 1：x === y 为 true
if (x === y) {
  // 如果 x 是 0，需要区分 +0 和 -0
  // 1 / +0 = Infinity
  // 1 / -0 = -Infinity
  return x !== 0 || 1 / x === 1 / y;
  
  // 示例：
  // Object.is(+0, -0)
  // → x === y → true（+0 === -0）
  // → x !== 0 → false
  // → 1 / x === 1 / y → Infinity === -Infinity → false
  // 返回 false ✅
}

// 情况 2：x === y 为 false
// 只有 NaN !== NaN，利用这个特性判断
return x !== x && y !== y;

// 示例：
// Object.is(NaN, NaN)
// → x === y → false（NaN !== NaN）
// → x !== x → true（NaN !== NaN）
// → y !== y → true（NaN !== NaN）
// 返回 true ✅
```

---

## 问题 5：实际项目中如何选择 Object.is 和 ===？

### 选择决策树

```javascript
// 1. 是否需要处理 NaN？
if (needCompareNaN) {
  // 使用 Object.is 或 Number.isNaN
  Object.is(value, NaN);
  Number.isNaN(value);    // 更语义化
}

// 2. 是否需要区分 +0 和 -0？
if (needDistinguishZeros) {
  // 使用 Object.is
  Object.is(value1, value2);
}

// 3. 其他所有情况
// 使用 ===（性能稍好，语义更通用）
value1 === value2;
```

### 实际场景对比

**场景 1：数组的 includes 方法**

```javascript
// Array.prototype.includes 内部使用 SameValueZero 算法
// 类似 Object.is，但认为 +0 === -0
[1, 2, NaN].includes(NaN); // true（✅ 可以找到 NaN）
[1, 2, NaN].indexOf(NaN);  // -1（❌ indexOf 使用 ===）

// includes 不区分 +0 和 -0
[+0].includes(-0);         // true
[+0].includes(+0);         // true
```

**场景 2：Map/Set 的键比较**

```javascript
// Map 和 Set 使用 SameValueZero 算法
const map = new Map();
map.set(NaN, 'value');
map.get(NaN);              // 'value'（✅ 可以用 NaN 作为键）

const set = new Set([NaN, NaN]);
set.size;                  // 1（NaN 被去重）

// 但 +0 和 -0 被视为相同的键
const map2 = new Map();
map2.set(+0, 'positive');
map2.set(-0, 'negative');
map2.size;                 // 1（-0 覆盖了 +0）
map2.get(+0);              // 'negative'
```

**场景 3：React 的浅比较（shallowEqual）**

```javascript
// React.memo 和 shouldComponentUpdate 使用浅比较
// 通常使用 ===，不处理 NaN 和 +0/-0
function shallowEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  return keys1.every(key => obj1[key] === obj2[key]);
}

// 问题：NaN 会导致不必要的重新渲染
shallowEqual({ x: NaN }, { x: NaN }); // false - ❌

// 优化版本：使用 Object.is
function shallowEqualWithNaN(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  return keys1.every(key => Object.is(obj1[key], obj2[key]));
}

shallowEqualWithNaN({ x: NaN }, { x: NaN }); // true - ✅
```

**场景 4：测试框架的断言**

```javascript
// Jest 的 toBe 使用 Object.is
expect(NaN).toBe(NaN);     // ✅ 通过
expect(+0).toBe(-0);       // ❌ 失败

// Jest 的 toEqual 用于深度比较（也使用 Object.is）
expect({ x: NaN }).toEqual({ x: NaN }); // ✅ 通过
```

### 性能对比

```javascript
const obj1 = { x: 1, y: 2 };
const obj2 = { x: 1, y: 2 };

// 基准测试
console.time('===');
for (let i = 0; i < 10000000; i++) {
  1 === 1;
}
console.timeEnd('==='); // ~5ms

console.time('Object.is');
for (let i = 0; i < 10000000; i++) {
  Object.is(1, 1);
}
console.timeEnd('Object.is'); // ~15ms

// 结论：=== 快约 3 倍，但差异在实际应用中可忽略
```

### 推荐做法

```javascript
// ✅ 推荐：大部分情况使用 ===
if (value === expected) {
  // 性能最优，语义清晰
}

// ✅ 推荐：明确需要处理 NaN 时使用 Number.isNaN
if (Number.isNaN(value)) {
  // 语义明确
}

// ✅ 推荐：需要同时处理 NaN 和 +0/-0 时使用 Object.is
if (Object.is(value1, value2)) {
  // 最严格的相等判断
}

// ❌ 避免：混用导致混淆
if (value === NaN) {            // 总是 false
  // 永远不会执行
}

// ❌ 避免：不必要的 Object.is
if (Object.is(str1, str2)) {    // 对字符串没有必要
  // 使用 === 即可
}
```

---

## 问题 6：相关的比较算法有哪些？如何选择？

### JavaScript 的 4 种相等比较算法

**1. 严格相等 (===) - Strict Equality**

```javascript
// 不进行类型转换，类型不同直接返回 false
1 === 1;                  // true
1 === '1';                // false
NaN === NaN;              // false
+0 === -0;                // true
```

**2. 抽象相等 (==) - Abstract Equality**

```javascript
// 允许类型转换
1 == 1;                   // true
1 == '1';                 // true（'1' 转换为 1）
null == undefined;        // true（特殊规则）
NaN == NaN;               // false
+0 == -0;                 // true
```

**3. SameValue (Object.is) - 同值相等**

```javascript
// 最严格的相等判断
Object.is(1, 1);          // true
Object.is(1, '1');        // false
Object.is(NaN, NaN);      // true（与 === 不同）
Object.is(+0, -0);        // false（与 === 不同）
```

**4. SameValueZero - 同值零相等**

```javascript
// Map、Set、Array.prototype.includes 内部使用
// 与 SameValue 的唯一区别：认为 +0 === -0

// 无法直接调用，通过这些 API 使用
[NaN].includes(NaN);      // true（像 Object.is）
[+0].includes(-0);        // true（与 Object.is 不同）

const set = new Set([NaN, NaN, +0, -0]);
set.size;                 // 2（NaN 和 0 各一个）
```

### 算法对比表

| 场景 | `==` | `===` | `Object.is` | SameValueZero |
|------|------|-------|-------------|---------------|
| 类型不同 | 转换后比较 | `false` | `false` | `false` |
| `null` vs `undefined` | `true` | `false` | `false` | `false` |
| `NaN` vs `NaN` | `false` | `false` | `true` ✅ | `true` ✅ |
| `+0` vs `-0` | `true` | `true` | `false` ✅ | `true` |
| 对象引用 | 比较引用 | 比较引用 | 比较引用 | 比较引用 |

### 选择指南

```javascript
// 1. 默认选择：===（99% 的情况）
if (value === expected) {}

// 2. 需要类型转换：==（但尽量避免）
if (value == null) {      // 同时检查 null 和 undefined
  // 唯一推荐的 == 使用场景
}

// 3. 需要处理 NaN：Number.isNaN 或 Object.is
if (Number.isNaN(value)) {}    // 推荐
if (Object.is(value, NaN)) {}  // 可选

// 4. 需要区分 +0 和 -0：Object.is
if (Object.is(value, -0)) {}

// 5. 数组查找包含 NaN：includes
arr.includes(NaN);        // ✅ 可以找到
arr.indexOf(NaN);         // ❌ 返回 -1

// 6. Map/Set 的键：自动使用 SameValueZero
const map = new Map();
map.set(NaN, 'value');    // ✅ 可以用 NaN 作为键
```

---

## 总结

**面试回答框架**

1. **核心差异**：
   - `Object.is()` 与 `===` 在两种情况下不同：
     - `Object.is(NaN, NaN)` 为 `true`（`===` 为 `false`）
     - `Object.is(+0, -0)` 为 `false`（`===` 为 `true`）

2. **设计原因**：
   - **NaN 问题**：IEEE 754 标准规定 NaN ≠ NaN，但不便于判断
   - **+0/-0 问题**：数学上需要区分方向信息（如 `1/+0` 和 `1/-0`）

3. **实现原理**：
   - 使用 **SameValue 算法**
   - Polyfill 核心：利用 `x !== x` 判断 NaN，利用 `1/x` 区分 +0/-0

4. **实际应用**：
   - **数组去重**：`Object.is` 可以正确处理 NaN
   - **React 浅比较**：使用 `Object.is` 避免 NaN 导致的不必要重渲染
   - **Map/Set 键**：内部使用 SameValueZero（类似但不区分 +0/-0）

5. **选择建议**：
   - 默认使用 `===`（性能更好，语义通用）
   - 处理 NaN 时使用 `Number.isNaN()` 或 `Object.is()`
   - 需要区分 +0/-0 时使用 `Object.is()`
   - 避免不必要的 `Object.is`（如字符串比较）

6. **相关算法**：
   - **严格相等 (===)**：不转换类型
   - **抽象相等 (==)**：允许类型转换（尽量避免）
   - **SameValue (Object.is)**：最严格
   - **SameValueZero**：Map/Set/includes 使用，不区分 +0/-0

---

## 延伸阅读

- MDN：[Object.is()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
- ECMA-262：[SameValue 算法](https://tc39.es/ecma262/#sec-samevalue)
- 【练习】实现一个深度相等函数 `deepEqual(a, b)`，使用 `Object.is` 正确处理 NaN 和 +0/-0。

