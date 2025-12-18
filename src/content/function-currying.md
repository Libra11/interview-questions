---
title: 函数柯里化了解多少？
category: JavaScript
difficulty: 中级
updatedAt: 2024-11-14
summary: >-
  深入理解函数柯里化的概念、实现原理和应用场景，掌握这一重要的函数式编程技术
tags:
  - 函数式编程
  - 高阶函数
  - 闭包
  - 偏函数
estimatedTime: 25 分钟
keywords:
  - 柯里化
  - currying
  - 偏函数应用
  - 函数式编程
highlight: 柯里化是将多参数函数转换为单参数函数序列的技术，是函数式编程的重要概念
order: 220
---

## 问题 1：什么是函数柯里化？

函数柯里化（Currying）是一种函数式编程技术，它将接受多个参数的函数转换为一系列接受单个参数的函数。

### 基本概念

柯里化的核心思想是：**将一个多参数函数分解成多个嵌套的单参数函数**。

```javascript
// 普通函数
function add(a, b, c) {
  return a + b + c;
}

// 柯里化后的函数
function curriedAdd(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}

// 使用方式
add(1, 2, 3); // 6
curriedAdd(1)(2)(3); // 6
```

### 名称由来

柯里化这个名称来源于数学家 Haskell Curry，他在数学逻辑中提出了这个概念。

---

## 问题 2：如何手动实现一个柯里化函数？

实现柯里化需要利用闭包来保存参数，并判断参数是否收集完毕。

### 基础实现

```javascript
function curry(fn) {
  return function curried(...args) {
    // 如果参数够了，直接执行原函数
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }

    // 参数不够，返回新函数继续收集参数
    return function (...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}

// 使用示例
function multiply(a, b, c) {
  return a * b * c;
}

const curriedMultiply = curry(multiply);
console.log(curriedMultiply(2)(3)(4)); // 24
console.log(curriedMultiply(2, 3)(4)); // 24
console.log(curriedMultiply(2)(3, 4)); // 24
```

### 支持占位符的实现

```javascript
function advancedCurry(fn, placeholder = "_") {
  return function curried(...args) {
    // 替换占位符
    const realArgs = [];
    let placeholderCount = 0;

    args.forEach((arg) => {
      if (arg === placeholder) {
        placeholderCount++;
        realArgs.push(undefined);
      } else {
        realArgs.push(arg);
      }
    });

    if (realArgs.filter((arg) => arg !== undefined).length >= fn.length) {
      return fn.apply(this, realArgs);
    }

    return function (...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}
```

---

## 问题 3：柯里化与偏函数应用有什么区别？

虽然都是函数式编程技术，但柯里化和偏函数应用有本质区别。

### 柯里化特点

- **固定转换**：总是转换为单参数函数序列
- **参数顺序固定**：必须按顺序传递参数
- **完全转换**：转换整个函数结构

```javascript
// 柯里化：必须一个一个传参
const curriedAdd = curry((a, b, c) => a + b + c);
curriedAdd(1)(2)(3); // ✅
curriedAdd(1, 2, 3); // ✅ (实现支持的话)
```

### 偏函数应用特点

- **灵活固定**：可以固定任意数量的参数
- **参数位置灵活**：可以固定任意位置的参数
- **部分应用**：只是预设部分参数

```javascript
// 偏函数应用：可以固定任意参数
function partial(fn, ...presetArgs) {
  return function (...remainingArgs) {
    return fn(...presetArgs, ...remainingArgs);
  };
}

const add = (a, b, c) => a + b + c;
const add5 = partial(add, 5); // 固定第一个参数
add5(2, 3); // 10
```

---

## 问题 4：柯里化在实际开发中有哪些应用？

柯里化在实际开发中有很多实用的应用场景。

### 1. 参数复用

```javascript
// HTTP 请求的柯里化
const request = curry((method, url, data) => {
  return fetch(url, {
    method,
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
});

// 创建专用的请求函数
const get = request("GET");
const post = request("POST");
const putUser = request("PUT")("/api/users");

// 使用
get("/api/users");
post("/api/login", { username, password });
putUser({ id: 1, name: "John" });
```

### 2. 事件处理

```javascript
// 事件处理的柯里化
const handleEvent = curry((eventType, selector, handler) => {
  document.addEventListener(eventType, (e) => {
    if (e.target.matches(selector)) {
      handler(e);
    }
  });
});

// 创建专用处理器
const onClick = handleEvent("click");
const onButtonClick = onClick("button");
const onLinkClick = onClick("a");

// 使用
onButtonClick((e) => console.log("Button clicked"));
onLinkClick((e) => e.preventDefault());
```

### 3. 函数组合

```javascript
// 数据处理管道
const map = curry((fn, array) => array.map(fn));
const filter = curry((predicate, array) => array.filter(predicate));
const reduce = curry((reducer, initial, array) =>
  array.reduce(reducer, initial)
);

// 组合函数
const processNumbers = (numbers) => {
  return (
    numbers
    |> filter((x) => x > 0) // 过滤正数
    |> map((x) => x * 2) // 乘以2
    |> reduce((sum, x) => sum + x, 0)
  ); // 求和
};

// 或者使用函数组合
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

const processNumbers2 = pipe(
  filter((x) => x > 0),
  map((x) => x * 2),
  reduce((sum, x) => sum + x, 0)
);
```

---

## 问题 5：柯里化有什么性能考虑？

柯里化虽然提供了灵活性，但也带来了一些性能开销。

### 性能开销

1. **函数调用开销**：每次调用都创建新函数
2. **闭包内存占用**：保存参数需要额外内存
3. **参数检查成本**：需要判断参数是否足够

```javascript
// 性能测试示例
function normalAdd(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(normalAdd);

// 测试性能差异
console.time("normal");
for (let i = 0; i < 1000000; i++) {
  normalAdd(1, 2, 3);
}
console.timeEnd("normal");

console.time("curried");
for (let i = 0; i < 1000000; i++) {
  curriedAdd(1)(2)(3);
}
console.timeEnd("curried");
```

### 优化策略

```javascript
// 缓存优化的柯里化
function optimizedCurry(fn) {
  const cache = new Map();

  return function curried(...args) {
    const key = args.join(",");

    if (cache.has(key)) {
      return cache.get(key);
    }

    let result;
    if (args.length >= fn.length) {
      result = fn.apply(this, args);
    } else {
      result = function (...nextArgs) {
        return curried.apply(this, args.concat(nextArgs));
      };
    }

    cache.set(key, result);
    return result;
  };
}
```

## 总结

**核心概念总结**：

### 1. 柯里化本质

- 将多参数函数转换为单参数函数序列
- 利用闭包保存参数状态
- 延迟执行直到参数收集完毕

### 2. 实现要点

- 参数长度判断
- 闭包保存状态
- 递归调用处理

### 3. 应用价值

- 提高函数复用性
- 支持函数组合
- 创建专用函数

## 延伸阅读

- [MDN - Function.prototype.bind()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [函数式编程指北](https://llh911001.gitbooks.io/mostly-adequate-guide-chinese/content/)
- [Lodash curry 实现](https://github.com/lodash/lodash/blob/master/curry.js)
- [Ramda.js 函数式编程库](https://ramdajs.com/)
- [JavaScript 函数式编程](https://github.com/getify/Functional-Light-JS)
- [柯里化在 React 中的应用](https://react.dev/learn/passing-props-to-a-component)
