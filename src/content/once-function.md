---
title: 实现 once 函数：记忆返回结果只执行一次
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入探讨 once 函数的多种实现方式，掌握闭包、记忆化、函数式编程技巧，理解单例模式、防重复执行等实际应用场景。
tags:
  - 函数式编程
  - 闭包
  - 记忆化
estimatedTime: 25 分钟
keywords:
  - once
  - 单次执行
  - 记忆化
  - 闭包
highlight: 掌握 once 函数的多种实现方式，理解闭包在函数式编程中的应用，能够处理异步函数和错误场景
order: 20
---

## 问题 1：什么是 once 函数？如何实现基础版本？

**核心定义**

`once` 函数是一个高阶函数，它接受一个函数作为参数，返回一个新函数。新函数在第一次调用时会执行原函数并返回结果，之后的所有调用都会直接返回第一次的结果，而不会再次执行原函数。

**基础实现**：

```javascript
function once(fn) {
  let result;
  let called = false;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

// 使用
function expensiveOperation() {
  console.log("执行昂贵的操作");
  return Math.random();
}

const onceExpensive = once(expensiveOperation);

console.log(onceExpensive()); // "执行昂贵的操作" + 随机数
console.log(onceExpensive()); // 直接返回第一次的结果（不执行函数）
console.log(onceExpensive()); // 直接返回第一次的结果
```

**实现原理**：

1. **闭包**：使用闭包保存 `result` 和 `called` 状态
2. **标志位**：`called` 标记函数是否已被调用
3. **结果缓存**：`result` 保存第一次执行的结果

**步骤分解**：

```javascript
function once(fn) {
  let result;      // 1. 存储结果
  let called = false; // 2. 标记是否已调用

  return function (...args) {
    if (!called) {           // 3. 检查是否已调用
      called = true;          // 4. 标记为已调用
      result = fn.apply(this, args); // 5. 执行原函数并保存结果
    }
    return result;           // 6. 返回缓存的结果
  };
}
```

---

## 问题 2：如何处理不同的函数类型和场景？

### 同步函数

```javascript
function once(fn) {
  let result;
  let called = false;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

// 使用
const add = (a, b) => a + b;
const onceAdd = once(add);

console.log(onceAdd(1, 2)); // 3
console.log(onceAdd(3, 4)); // 3（返回第一次的结果）
```

### 异步函数（Promise）

```javascript
function once(fn) {
  let promise;
  let called = false;

  return function (...args) {
    if (!called) {
      called = true;
      promise = Promise.resolve(fn.apply(this, args));
    }
    return promise;
  };
}

// 使用
async function fetchData() {
  console.log("发起请求");
  return await fetch("/api/data").then((res) => res.json());
}

const onceFetch = once(fetchData);

onceFetch().then((data) => console.log(data)); // 发起请求
onceFetch().then((data) => console.log(data)); // 不发起请求，返回缓存的 Promise
```

---


## 问题 3：有哪些不同的实现方式？

### 方式 1：使用标志位（基础版本）

```javascript
function once(fn) {
  let result;
  let called = false;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
```

**优点**：简单直观
**缺点**：如果函数返回 `false`，无法区分是缓存值还是新值


### 方式 2：使用 Symbol 标记

```javascript
function once(fn) {
  const CACHE_KEY = Symbol("once_cache");
  let cache = null;

  return function (...args) {
    if (cache === null) {
      cache = {
        [CACHE_KEY]: fn.apply(this, args),
      };
    }
    return cache[CACHE_KEY];
  };
}
```

**优点**：可以区分任何返回值，包括 `undefined` 和 `null`
**缺点**：代码稍复杂

### 方式 3：使用 WeakMap（支持多个函数）

```javascript
const onceCache = new WeakMap();

function once(fn) {
  return function (...args) {
    if (!onceCache.has(fn)) {
      onceCache.set(fn, fn.apply(this, args));
    }
    return onceCache.get(fn);
  };
}

// 使用
const fn1 = () => "result1";
const fn2 = () => "result2";

const onceFn1 = once(fn1);
const onceFn2 = once(fn2);

console.log(onceFn1()); // "result1"
console.log(onceFn2()); // "result2"
```

**优点**：支持多个函数，自动垃圾回收
**缺点**：需要 WeakMap 支持

---

## 问题 3：once 与 memoize 有什么区别？

### memoize：基于参数的缓存

```javascript
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

// 使用
const add = (a, b) => {
  console.log("计算中...");
  return a + b;
};

const memoizedAdd = memoize(add);

console.log(memoizedAdd(1, 2)); // "计算中..." + 3
console.log(memoizedAdd(1, 2)); // 3（从缓存读取）
console.log(memoizedAdd(2, 3)); // "计算中..." + 5（不同参数，重新计算）
```

### once vs memoize 对比

| 特性 | once | memoize |
|------|------|---------|
| 执行次数 | 只执行一次 | 每个参数组合执行一次 |
| 缓存策略 | 忽略参数 | 基于参数缓存 |
| 适用场景 | 初始化、单例 | 纯函数、计算密集型 |
| 内存占用 | 固定（一个值） | 动态（多个值） |

**示例对比**：

```javascript
function expensiveOperation(x) {
  console.log(`计算 ${x}`);
  return x * 2;
}

const onceOp = once(expensiveOperation);
const memoizedOp = memoize(expensiveOperation);

console.log(onceOp(1)); // "计算 1" + 2
console.log(onceOp(2)); // 2（返回第一次的结果，忽略参数）
console.log(onceOp(3)); // 2（返回第一次的结果）

console.log(memoizedOp(1)); // "计算 1" + 2
console.log(memoizedOp(2)); // "计算 2" + 4（不同参数，重新计算）
console.log(memoizedOp(1)); // 2（相同参数，从缓存读取）
```

---

## 总结

**面试回答框架**

1. **once 函数的定义**：
   - 高阶函数，接受函数返回新函数
   - 新函数只执行一次，后续调用返回缓存结果
   - 使用闭包保存状态

2. **基础实现**：
   ```javascript
   function once(fn) {
     let result;
     let called = false;
     return function (...args) {
       if (!called) {
         called = true;
         result = fn.apply(this, args);
       }
       return result;
     };
   }
   ```

3. **关键点**：
   - **闭包**：保存 `result` 和 `called`
   - **this 绑定**：使用 `apply` 保持 `this`
   - **参数传递**：使用 `...args` 和 `apply`

4. **不同场景处理**：
   - **同步函数**：直接缓存结果
   - **异步函数**：缓存 Promise
   - **错误处理**：可以选择缓存错误或允许重试

5. **与 memoize 的区别**：
   - `once`：只执行一次，忽略参数
   - `memoize`：基于参数缓存，每个参数组合执行一次

---

## 延伸阅读

- 【练习】实现一个支持重置的 `once` 函数
- 【练习】实现一个 `once` 函数，支持异步函数和错误处理
- 【练习】对比 `once`、`memoize`、`debounce`、`throttle` 的区别和应用场景
