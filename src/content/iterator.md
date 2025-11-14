---
title: JavaScript 迭代器（Iterator）深度解析
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入剖析 JavaScript 迭代器协议、可迭代对象、生成器函数，掌握自定义迭代器实现，理解迭代器在异步编程、数据流处理中的核心应用。
tags:
  - 迭代器
  - 生成器
  - 可迭代对象
estimatedTime: 40 分钟
keywords:
  - Iterator
  - Iterable
  - Generator
  - Symbol.iterator
highlight: 理解迭代器协议的设计哲学，掌握生成器函数和自定义迭代器的实现，能够处理复杂的数据遍历场景
order: 21
---

## 问题 1：什么是迭代器（Iterator）？迭代器协议是什么？

**核心定义**

迭代器（Iterator）是一个对象，它实现了**迭代器协议**，提供了一种标准的方式来遍历数据结构。迭代器协议要求对象实现一个 `next()` 方法，该方法返回一个包含 `value` 和 `done` 属性的对象。

**迭代器协议**：

```javascript
// 迭代器对象必须实现 next() 方法
const iterator = {
  next() {
    // 返回 { value: any, done: boolean }
    return {
      value: "值",
      done: false, // false 表示还有更多值，true 表示迭代完成
    };
  },
};

// 使用迭代器
let result = iterator.next();
while (!result.done) {
  console.log(result.value);
  result = iterator.next();
}
```

**简单迭代器示例**：

```javascript
function createIterator(array) {
  let index = 0;

  return {
    next() {
      if (index < array.length) {
        return {
          value: array[index++],
          done: false,
        };
      } else {
        return {
          done: true,
        };
      }
    },
  };
}

// 使用
const iterator = createIterator([1, 2, 3]);

console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { done: true }
```

**迭代器协议要求**：

1. **next() 方法**：必须返回一个对象，包含：
   - `value`：当前迭代的值（可选，迭代完成时可能不存在）
   - `done`：布尔值，表示迭代是否完成
2. **可选方法**：
   - `return(value)`：提前终止迭代器
   - `throw(error)`：向迭代器抛出错误

---

## 问题 2：什么是可迭代对象（Iterable）？可迭代协议是什么？

**核心定义**

可迭代对象（Iterable）是实现了**可迭代协议**的对象。可迭代协议要求对象实现一个 `Symbol.iterator` 方法，该方法返回一个迭代器对象。

**可迭代协议**：

```javascript
const iterable = {
  [Symbol.iterator]() {
    // 返回一个迭代器对象
    return {
      next() {
        return { value: "值", done: false };
      },
    };
  },
};

// 可迭代对象可以使用 for...of 循环
for (const value of iterable) {
  console.log(value);
}
```

**内置可迭代对象**：

```javascript
// 1. 数组
const arr = [1, 2, 3];
for (const item of arr) {
  console.log(item); // 1, 2, 3
}

// 2. 字符串
const str = "hello";
for (const char of str) {
  console.log(char); // h, e, l, l, o
}

// 3. Map
const map = new Map([
  ["a", 1],
  ["b", 2],
]);
for (const [key, value] of map) {
  console.log(key, value); // a 1, b 2
}

// 4. Set
const set = new Set([1, 2, 3]);
for (const item of set) {
  console.log(item); // 1, 2, 3
}

// 5. arguments 对象
function test() {
  for (const arg of arguments) {
    console.log(arg);
  }
}
test(1, 2, 3); // 1, 2, 3
```

**检查对象是否可迭代**：

```javascript
function isIterable(obj) {
  return (
    obj != null &&
    typeof obj[Symbol.iterator] === "function"
  );
}

console.log(isIterable([1, 2, 3])); // true
console.log(isIterable("hello")); // true
console.log(isIterable({})); // false
console.log(isIterable(123)); // false
```

**手动调用迭代器**：

```javascript
const arr = [1, 2, 3];

// 获取迭代器
const iterator = arr[Symbol.iterator]();

// 手动调用 next()
console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { done: true }
```

---

## 问题 3：如何实现自定义迭代器？

### 方式 1：对象字面量实现

```javascript
const myIterable = {
  data: [1, 2, 3],

  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;

    return {
      next() {
        if (index < data.length) {
          return {
            value: data[index++],
            done: false,
          };
        } else {
          return {
            done: true,
          };
        }
      },
    };
  },
};

// 使用
for (const value of myIterable) {
  console.log(value); // 1, 2, 3
}
```

### 方式 2：类实现

```javascript
class NumberRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;

    return {
      next() {
        if (current <= end) {
          return {
            value: current++,
            done: false,
          };
        } else {
          return {
            done: true,
          };
        }
      },
    };
  }
}

// 使用
const range = new NumberRange(1, 5);
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}

// 转换为数组
console.log([...range]); // [1, 2, 3, 4, 5]
```

### 方式 3：实现 return() 和 throw() 方法

```javascript
class CustomIterator {
  constructor(data) {
    this.data = data;
    this.index = 0;
  }

  next() {
    if (this.index < this.data.length) {
      return {
        value: this.data[this.index++],
        done: false,
      };
    } else {
      return {
        done: true,
      };
    }
  }

  // 提前终止迭代器
  return(value) {
    console.log("迭代器被提前终止");
    return {
      value,
      done: true,
    };
  }

  // 向迭代器抛出错误
  throw(error) {
    console.log("迭代器收到错误:", error);
    return {
      done: true,
    };
  }
}

const iterable = {
  data: [1, 2, 3, 4, 5],

  [Symbol.iterator]() {
    return new CustomIterator(this.data);
  },
};

// 使用 return() 提前终止
for (const value of iterable) {
  console.log(value);
  if (value === 3) {
    break; // 触发 return()
  }
}
```

---

## 问题 4：生成器函数（Generator）是什么？如何使用？

**核心定义**

生成器函数（Generator Function）是一种特殊的函数，使用 `function*` 语法定义。调用生成器函数不会立即执行，而是返回一个**生成器对象**（实现了迭代器协议）。

**基础语法**：

```javascript
function* generatorFunction() {
  yield 1;
  yield 2;
  yield 3;
}

const generator = generatorFunction();

console.log(generator.next()); // { value: 1, done: false }
console.log(generator.next()); // { value: 2, done: false }
console.log(generator.next()); // { value: 3, done: false }
console.log(generator.next()); // { done: true }
```

**yield 关键字**：

- `yield` 暂停函数执行，返回一个值
- 下次调用 `next()` 时，从 `yield` 处继续执行

```javascript
function* example() {
  console.log("开始");
  yield 1;
  console.log("中间");
  yield 2;
  console.log("结束");
}

const gen = example();
console.log(gen.next()); // "开始" + { value: 1, done: false }
console.log(gen.next()); // "中间" + { value: 2, done: false }
console.log(gen.next()); // "结束" + { done: true }
```

**生成器函数实现可迭代对象**：

```javascript
class NumberRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i++) {
      yield i;
    }
  }
}

const range = new NumberRange(1, 5);
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

**yield* 委托**：

```javascript
function* generator1() {
  yield 1;
  yield 2;
}

function* generator2() {
  yield* generator1(); // 委托给另一个生成器
  yield 3;
}

for (const value of generator2()) {
  console.log(value); // 1, 2, 3
}
```

**向生成器传递值**：

```javascript
function* generator() {
  const x = yield 1;
  const y = yield x + 2;
  return y + 3;
}

const gen = generator();

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next(10)); // { value: 12, done: false } (x = 10)
console.log(gen.next(20)); // { value: 23, done: true } (y = 20)
```

**生成器的 return() 和 throw()**：

```javascript
function* generator() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } catch (error) {
    console.log("捕获错误:", error);
  } finally {
    console.log("清理工作");
  }
}

const gen = generator();

console.log(gen.next()); // { value: 1, done: false }

// 提前终止
console.log(gen.return(100)); // { value: 100, done: true } + "清理工作"

// 抛出错误
const gen2 = generator();
gen2.next();
gen2.throw(new Error("测试错误")); // "捕获错误: Error: 测试错误" + "清理工作"
```

---

## 问题 5：内置迭代器方法有哪些？

### Array 的迭代器方法

```javascript
const arr = [1, 2, 3];

// 1. entries() - 返回 [index, value] 迭代器
for (const [index, value] of arr.entries()) {
  console.log(index, value); // 0 1, 1 2, 2 3
}

// 2. keys() - 返回索引迭代器
for (const key of arr.keys()) {
  console.log(key); // 0, 1, 2
}

// 3. values() - 返回值迭代器（默认）
for (const value of arr.values()) {
  console.log(value); // 1, 2, 3
}
```

### Map 和 Set 的迭代器

```javascript
// Map
const map = new Map([
  ["a", 1],
  ["b", 2],
]);

for (const [key, value] of map) {
  console.log(key, value); // a 1, b 2
}

// Set
const set = new Set([1, 2, 3]);
for (const value of set) {
  console.log(value); // 1, 2, 3
}
```

### 使用迭代器的数组方法

```javascript
const arr = [1, 2, 3];

// Array.from() - 从可迭代对象创建数组
const arr2 = Array.from("hello"); // ['h', 'e', 'l', 'l', 'o']

// 展开运算符
const arr3 = [...arr]; // [1, 2, 3]

// 解构赋值
const [first, ...rest] = arr; // first = 1, rest = [2, 3]

// for...of 循环
for (const item of arr) {
  console.log(item);
}
```

---

## 问题 6：异步迭代器（Async Iterator）是什么？

**核心定义**

异步迭代器（Async Iterator）是迭代器的异步版本，`next()` 方法返回一个 Promise，resolve 后返回 `{ value, done }`。

**异步迭代器协议**：

```javascript
const asyncIterable = {
  async *[Symbol.asyncIterator]() {
    yield 1;
    yield 2;
    yield 3;
  },
};

// 使用 for await...of
(async () => {
  for await (const value of asyncIterable) {
    console.log(value); // 1, 2, 3
  }
})();
```

**异步生成器示例**：

```javascript
async function* fetchUrls(urls) {
  for (const url of urls) {
    const response = await fetch(url);
    const data = await response.json();
    yield data;
  }
}

// 使用
const urls = ["/api/user", "/api/posts", "/api/comments"];

for await (const data of fetchUrls(urls)) {
  console.log(data);
}
```

**手动使用异步迭代器**：

```javascript
const asyncIterable = {
  async *[Symbol.asyncIterator]() {
    yield Promise.resolve(1);
    yield Promise.resolve(2);
    yield Promise.resolve(3);
  },
};

(async () => {
  const iterator = asyncIterable[Symbol.asyncIterator]();

  let result = await iterator.next();
  while (!result.done) {
    console.log(result.value);
    result = await iterator.next();
  }
})();
```

---

## 总结

**面试回答框架**

1. **迭代器的定义**：
   - 实现了迭代器协议的对象
   - 必须实现 `next()` 方法，返回 `{ value, done }`
   - 可选实现 `return()` 和 `throw()` 方法

2. **可迭代对象**：
   - 实现了可迭代协议的对象
   - 必须实现 `Symbol.iterator` 方法，返回迭代器
   - 可以使用 `for...of`、展开运算符等

3. **生成器函数**：
   - 使用 `function*` 定义
   - 使用 `yield` 暂停执行
   - 自动实现迭代器协议

4. **自定义迭代器**：
   - 对象字面量实现
   - 类实现
   - 生成器函数实现（推荐）

---

## 延伸阅读

- MDN：[迭代器和生成器](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_Generators)
- MDN：[Symbol.iterator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator)
- 【练习】实现一个支持深度遍历的对象迭代器
- 【练习】使用生成器实现一个简单的状态机
- 【练习】实现一个异步数据流处理工具
