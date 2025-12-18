---
title: for...of、for...in、for 循环，三者有什么区别？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解三种 for 循环的区别和适用场景，掌握 for...of、for...in、传统 for 循环的特点和最佳实践。
tags:
  - for循环
  - 遍历
  - 迭代器
  - 对象遍历
estimatedTime: 25 分钟
keywords:
  - for...of
  - for...in
  - for循环
  - 遍历方式
highlight: 理解三种 for 循环的核心区别，掌握在不同场景下选择合适的循环方式
order: 225
---

## 问题 1：三种循环的基本语法和用途

### 基本语法对比

```javascript
const array = ["a", "b", "c"];
const object = { x: 1, y: 2, z: 3 };

// 1. 传统 for 循环
for (let i = 0; i < array.length; i++) {
  console.log(i, array[i]); // 索引和值
}

// 2. for...in 循环（遍历可枚举属性）
for (const key in object) {
  console.log(key, object[key]); // 属性名和值
}

// 3. for...of 循环（遍历可迭代对象）
for (const value of array) {
  console.log(value); // 直接获取值
}
```

### 核心区别总结

| 循环类型     | 遍历内容   | 适用对象         | 获取内容                  | ES 版本 |
| ------------ | ---------- | ---------------- | ------------------------- | ------- |
| **for**      | 索引/计数  | 任何有长度的结构 | 索引，需手动获取值        | ES1     |
| **for...in** | 可枚举属性 | 对象、数组       | 属性名/索引，需手动获取值 | ES1     |
| **for...of** | 可迭代元素 | 可迭代对象       | 直接获取值                | ES6     |

---

## 问题 2：传统 for 循环的特点

### 基本特性

```javascript
// 1. 最基础的循环，完全可控
const numbers = [1, 2, 3, 4, 5];

for (let i = 0; i < numbers.length; i++) {
  console.log(`索引 ${i}: 值 ${numbers[i]}`);
}

// 2. 可以控制步长
for (let i = 0; i < numbers.length; i += 2) {
  console.log(`每隔一个: ${numbers[i]}`); // 0, 2, 4
}

// 3. 可以反向遍历
for (let i = numbers.length - 1; i >= 0; i--) {
  console.log(`反向: ${numbers[i]}`); // 5, 4, 3, 2, 1
}

// 4. 可以中途修改循环变量
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] === 3) {
    i++; // 跳过下一个元素
  }
  console.log(numbers[i]);
}

// 5. 嵌套循环
const matrix = [
  [1, 2],
  [3, 4],
  [5, 6],
];
for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    console.log(`matrix[${i}][${j}] = ${matrix[i][j]}`);
  }
}
```

### 性能特点

```javascript
// 传统 for 循环通常性能最好
const largeArray = new Array(1000000).fill(0).map((_, i) => i);

// 性能测试
console.time("传统 for 循环");
let sum1 = 0;
for (let i = 0; i < largeArray.length; i++) {
  sum1 += largeArray[i];
}
console.timeEnd("传统 for 循环");

console.time("for...of 循环");
let sum2 = 0;
for (const value of largeArray) {
  sum2 += value;
}
console.timeEnd("for...of 循环");

// 优化技巧：缓存数组长度
console.time("优化的 for 循环");
let sum3 = 0;
for (let i = 0, len = largeArray.length; i < len; i++) {
  sum3 += largeArray[i];
}
console.timeEnd("优化的 for 循环");
```

### 适用场景

```javascript
// 1. 需要索引的场景
const items = ["apple", "banana", "orange"];
const indexedItems = [];

for (let i = 0; i < items.length; i++) {
  indexedItems.push(`${i + 1}. ${items[i]}`);
}
console.log(indexedItems); // ['1. apple', '2. banana', '3. orange']

// 2. 需要控制循环流程的场景
function findFirstPair(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) {
        return [i, j]; // 找到后立即返回
      }
    }
  }
  return null;
}

// 3. 需要修改数组的场景
function removeNegatives(numbers) {
  for (let i = numbers.length - 1; i >= 0; i--) {
    if (numbers[i] < 0) {
      numbers.splice(i, 1); // 从后往前删除，避免索引问题
    }
  }
  return numbers;
}

// 4. 性能敏感的场景
function fastArrayCopy(source, target) {
  for (let i = 0, len = source.length; i < len; i++) {
    target[i] = source[i];
  }
}
```

---

## 问题 3：for...in 循环的特点

### 基本特性

```javascript
// 1. 遍历对象的可枚举属性
const person = {
  name: "Alice",
  age: 25,
  city: "New York",
};

for (const key in person) {
  console.log(`${key}: ${person[key]}`);
}
// 输出：
// name: Alice
// age: 25
// city: New York

// 2. 也可以遍历数组（但不推荐）
const fruits = ["apple", "banana", "orange"];

for (const index in fruits) {
  console.log(`${index}: ${fruits[index]}`);
}
// 输出：
// 0: apple
// 1: banana
// 2: orange
```

### 遍历原型链

```javascript
// for...in 会遍历原型链上的可枚举属性
function Parent() {
  this.parentProp = "parent";
}

Parent.prototype.prototypeMethod = function () {
  return "from prototype";
};

function Child() {
  Parent.call(this);
  this.childProp = "child";
}

Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

const child = new Child();

console.log("=== for...in 遍历（包含原型链）===");
for (const key in child) {
  console.log(`${key}: ${child[key]}`);
}
// 输出：
// parentProp: parent
// childProp: child
// prototypeMethod: function() { return 'from prototype'; }

console.log("=== 只遍历自有属性 ===");
for (const key in child) {
  if (child.hasOwnProperty(key)) {
    console.log(`${key}: ${child[key]}`);
  }
}
// 输出：
// parentProp: parent
// childProp: child

// 现代写法：使用 Object.hasOwn()
for (const key in child) {
  if (Object.hasOwn(child, key)) {
    console.log(`${key}: ${child[key]}`);
  }
}
```

### 数组遍历的问题

```javascript
const array = ["a", "b", "c"];

// 给数组添加自定义属性
array.customProperty = "custom";
array.customMethod = function () {
  return "method";
};

console.log("=== for...in 遍历数组（有问题）===");
for (const key in array) {
  console.log(`${key}: ${array[key]}`);
}
// 输出：
// 0: a
// 1: b
// 2: c
// customProperty: custom
// customMethod: function() { return 'method'; }

console.log("=== 传统 for 循环（正确）===");
for (let i = 0; i < array.length; i++) {
  console.log(`${i}: ${array[i]}`);
}
// 输出：
// 0: a
// 1: b
// 2: c

// 稀疏数组的问题
const sparseArray = [1, , , 4]; // 索引 1 和 2 是空的

console.log("=== for...in 遍历稀疏数组 ===");
for (const index in sparseArray) {
  console.log(`${index}: ${sparseArray[index]}`);
}
// 输出：
// 0: 1
// 3: 4

console.log("=== 传统 for 循环遍历稀疏数组 ===");
for (let i = 0; i < sparseArray.length; i++) {
  console.log(`${i}: ${sparseArray[i]}`);
}
// 输出：
// 0: 1
// 1: undefined
// 2: undefined
// 3: 4
```

### 适用场景

```javascript
// 1. 遍历对象属性
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
  debug: true,
};

function printConfig(config) {
  console.log("Configuration:");
  for (const key in config) {
    if (Object.hasOwn(config, key)) {
      console.log(`  ${key}: ${config[key]}`);
    }
  }
}

// 2. 动态属性处理
function validateObject(obj, rules) {
  const errors = [];

  for (const key in rules) {
    if (Object.hasOwn(rules, key)) {
      const rule = rules[key];
      const value = obj[key];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
      }

      if (rule.type && typeof value !== rule.type) {
        errors.push(`${key} must be of type ${rule.type}`);
      }
    }
  }

  return errors;
}

const userRules = {
  name: { required: true, type: "string" },
  age: { required: true, type: "number" },
  email: { required: false, type: "string" },
};

const user = { name: "Alice", age: "25" }; // age 类型错误
const validationErrors = validateObject(user, userRules);
console.log(validationErrors); // ['age must be of type number']

// 3. 对象转换
function objectToQueryString(obj) {
  const params = [];

  for (const key in obj) {
    if (Object.hasOwn(obj, key) && obj[key] !== undefined) {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`);
    }
  }

  return params.join("&");
}

const queryParams = { name: "Alice", age: 25, city: "New York" };
console.log(objectToQueryString(queryParams));
// 'name=Alice&age=25&city=New%20York'
```

---

## 问题 4：for...of 循环的特点

### 基本特性

```javascript
// 1. 遍历可迭代对象的值
const array = ["apple", "banana", "orange"];

for (const fruit of array) {
  console.log(fruit); // 直接获取值
}

// 2. 支持多种可迭代对象
const string = "hello";
for (const char of string) {
  console.log(char); // h, e, l, l, o
}

const set = new Set([1, 2, 3]);
for (const value of set) {
  console.log(value); // 1, 2, 3
}

const map = new Map([
  ["a", 1],
  ["b", 2],
]);
for (const [key, value] of map) {
  console.log(`${key}: ${value}`); // a: 1, b: 2
}

// 3. 不遍历自定义属性
const arrayWithProps = ["a", "b", "c"];
arrayWithProps.customProp = "custom";

for (const value of arrayWithProps) {
  console.log(value); // 只输出 a, b, c，不包含 customProp
}
```

### 迭代器协议

```javascript
// for...of 基于迭代器协议工作
const array = [1, 2, 3];

// 手动使用迭代器
const iterator = array[Symbol.iterator]();
console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
console.log(iterator.next()); // { value: undefined, done: true }

// 自定义可迭代对象
const customIterable = {
  data: [1, 2, 3, 4, 5],

  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;

    return {
      next() {
        if (index < data.length) {
          return { value: data[index++], done: false };
        } else {
          return { done: true };
        }
      },
    };
  },
};

for (const value of customIterable) {
  console.log(value); // 1, 2, 3, 4, 5
}

// 生成器函数创建可迭代对象
function* numberGenerator(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

for (const num of numberGenerator(1, 5)) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

### 获取索引的方法

```javascript
const fruits = ["apple", "banana", "orange"];

// 1. 使用 entries() 方法
for (const [index, fruit] of fruits.entries()) {
  console.log(`${index}: ${fruit}`);
}

// 2. 使用 Array.from() 和 keys()
for (const index of fruits.keys()) {
  console.log(`${index}: ${fruits[index]}`);
}

// 3. 手动维护索引
let index = 0;
for (const fruit of fruits) {
  console.log(`${index++}: ${fruit}`);
}

// 4. 使用 forEach（不是 for...of，但相关）
fruits.forEach((fruit, index) => {
  console.log(`${index}: ${fruit}`);
});
```

### 适用场景

```javascript
// 1. 简单的值遍历
const numbers = [1, 2, 3, 4, 5];
let sum = 0;

for (const num of numbers) {
  sum += num;
}
console.log(sum); // 15

// 2. 字符串处理
function countVowels(str) {
  const vowels = "aeiouAEIOU";
  let count = 0;

  for (const char of str) {
    if (vowels.includes(char)) {
      count++;
    }
  }

  return count;
}

console.log(countVowels("Hello World")); // 3

// 3. Set 和 Map 遍历
const uniqueWords = new Set(["apple", "banana", "apple", "orange"]);

for (const word of uniqueWords) {
  console.log(word.toUpperCase());
}

const wordCount = new Map([
  ["apple", 3],
  ["banana", 2],
  ["orange", 1],
]);

for (const [word, count] of wordCount) {
  console.log(`${word}: ${count} times`);
}

// 4. 异步迭代（for await...of）
async function* asyncGenerator() {
  for (let i = 1; i <= 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield i;
  }
}

async function processAsyncData() {
  for await (const value of asyncGenerator()) {
    console.log(`Async value: ${value}`);
  }
}

// processAsyncData(); // 每秒输出一个值

// 5. DOM 元素遍历
const elements = document.querySelectorAll(".item");

for (const element of elements) {
  element.addEventListener("click", () => {
    console.log("Element clicked:", element.textContent);
  });
}
```

---

## 问题 5：三种循环的性能对比

### 性能测试

```javascript
// 性能测试函数
function performanceTest(name, testFunction, iterations = 1000000) {
  const start = performance.now();
  testFunction(iterations);
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

// 测试数据
const testArray = new Array(1000).fill(0).map((_, i) => i);

// 测试函数
function testTraditionalFor(iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    let sum = 0;
    for (let i = 0; i < testArray.length; i++) {
      sum += testArray[i];
    }
  }
}

function testForIn(iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    let sum = 0;
    for (const i in testArray) {
      sum += testArray[i];
    }
  }
}

function testForOf(iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    let sum = 0;
    for (const value of testArray) {
      sum += value;
    }
  }
}

function testForEach(iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    let sum = 0;
    testArray.forEach((value) => {
      sum += value;
    });
  }
}

// 运行性能测试
console.log("=== 性能测试结果 ===");
performanceTest("传统 for 循环", testTraditionalFor);
performanceTest("for...in 循环", testForIn);
performanceTest("for...of 循环", testForOf);
performanceTest("forEach 方法", testForEach);

// 典型结果（仅供参考，实际结果因环境而异）：
// 传统 for 循环: 最快
// for...of 循环: 较快
// forEach 方法: 中等
// for...in 循环: 最慢
```

### 内存使用对比

```javascript
// 内存使用测试
function memoryTest() {
  const largeArray = new Array(1000000).fill(0).map((_, i) => i);

  // 传统 for 循环 - 最少的内存开销
  function traditionalForMemory() {
    let sum = 0;
    for (let i = 0; i < largeArray.length; i++) {
      sum += largeArray[i];
    }
    return sum;
  }

  // for...of 循环 - 创建迭代器对象
  function forOfMemory() {
    let sum = 0;
    for (const value of largeArray) {
      sum += value;
    }
    return sum;
  }

  // for...in 循环 - 需要属性查找
  function forInMemory() {
    let sum = 0;
    for (const index in largeArray) {
      sum += largeArray[index];
    }
    return sum;
  }

  console.log("内存使用测试完成");
}
```

---

## 问题 6：选择合适循环的指导原则

### 决策流程图

```javascript
// 选择循环类型的决策函数
function chooseLoopType(requirements) {
  const {
    needIndex, // 是否需要索引
    isObject, // 是否遍历对象
    isIterable, // 是否是可迭代对象
    needPerformance, // 是否需要最佳性能
    needControl, // 是否需要控制循环流程
    hasCustomProps, // 数组是否有自定义属性
  } = requirements;

  if (isObject && !isIterable) {
    return "for...in (记得检查 hasOwnProperty)";
  }

  if (needPerformance || needControl || needIndex) {
    return "传统 for 循环";
  }

  if (isIterable && !hasCustomProps) {
    return "for...of 循环";
  }

  return "传统 for 循环（安全选择）";
}

// 使用示例
console.log(
  chooseLoopType({
    needIndex: false,
    isObject: false,
    isIterable: true,
    needPerformance: false,
    needControl: false,
    hasCustomProps: false,
  })
); // for...of 循环

console.log(
  chooseLoopType({
    needIndex: true,
    isObject: false,
    isIterable: true,
    needPerformance: true,
    needControl: true,
    hasCustomProps: false,
  })
); // 传统 for 循环
```

### 最佳实践总结

```javascript
// 1. 数组遍历的最佳实践
const numbers = [1, 2, 3, 4, 5];

// ✅ 简单值遍历 - 使用 for...of
for (const num of numbers) {
  console.log(num);
}

// ✅ 需要索引 - 使用传统 for 或 entries()
for (let i = 0; i < numbers.length; i++) {
  console.log(`${i}: ${numbers[i]}`);
}

// 或者
for (const [index, num] of numbers.entries()) {
  console.log(`${index}: ${num}`);
}

// ✅ 性能敏感 - 使用传统 for
let sum = 0;
for (let i = 0, len = numbers.length; i < len; i++) {
  sum += numbers[i];
}

// 2. 对象遍历的最佳实践
const person = { name: "Alice", age: 25, city: "New York" };

// ✅ 遍历对象属性 - 使用 for...in + hasOwnProperty
for (const key in person) {
  if (Object.hasOwn(person, key)) {
    console.log(`${key}: ${person[key]}`);
  }
}

// ✅ 现代替代方案
Object.keys(person).forEach((key) => {
  console.log(`${key}: ${person[key]}`);
});

// 或者
Object.entries(person).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 3. 特殊数据结构的最佳实践
const set = new Set([1, 2, 3]);
const map = new Map([
  ["a", 1],
  ["b", 2],
]);

// ✅ Set 遍历
for (const value of set) {
  console.log(value);
}

// ✅ Map 遍历
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// 4. 字符串遍历的最佳实践
const text = "Hello";

// ✅ 字符遍历 - 使用 for...of
for (const char of text) {
  console.log(char);
}

// ✅ 需要索引 - 使用传统 for
for (let i = 0; i < text.length; i++) {
  console.log(`${i}: ${text[i]}`);
}

// 5. 避免的反模式
const array = [1, 2, 3];

// ❌ 不要对数组使用 for...in
for (const index in array) {
  console.log(array[index]); // 可能包含非数字索引
}

// ❌ 不要对对象使用 for...of
const obj = { a: 1, b: 2 };
// for (const value of obj) {} // TypeError: obj is not iterable

// ❌ 不要在性能敏感的场景使用 for...in
for (const index in largeArray) {
  // 性能较差
}
```

### 实际项目中的应用

```javascript
// 实际项目中的循环选择示例
class DataProcessor {
  // 处理数组数据 - 使用 for...of
  processItems(items) {
    const results = [];

    for (const item of items) {
      if (this.isValid(item)) {
        results.push(this.transform(item));
      }
    }

    return results;
  }

  // 处理配置对象 - 使用 for...in
  validateConfig(config, schema) {
    const errors = [];

    for (const key in schema) {
      if (Object.hasOwn(schema, key)) {
        const rule = schema[key];
        const value = config[key];

        if (!this.validateField(value, rule)) {
          errors.push(`Invalid ${key}`);
        }
      }
    }

    return errors;
  }

  // 性能敏感的计算 - 使用传统 for
  calculateSum(numbers) {
    let sum = 0;

    for (let i = 0, len = numbers.length; i < len; i++) {
      sum += numbers[i];
    }

    return sum;
  }

  // 需要索引的操作 - 使用传统 for
  findDuplicates(array) {
    const duplicates = [];

    for (let i = 0; i < array.length; i++) {
      for (let j = i + 1; j < array.length; j++) {
        if (array[i] === array[j]) {
          duplicates.push({ value: array[i], indices: [i, j] });
        }
      }
    }

    return duplicates;
  }

  // 处理 Map 数据 - 使用 for...of
  processMap(dataMap) {
    const processed = new Map();

    for (const [key, value] of dataMap) {
      processed.set(key, this.transform(value));
    }

    return processed;
  }
}
```

---

## 总结

**三种 for 循环的核心区别**：

### 1. 传统 for 循环

- **用途**：基于计数器的循环，最灵活
- **优势**：性能最佳，完全可控，支持复杂逻辑
- **适用**：需要索引、性能敏感、复杂控制流程
- **语法**：`for (初始化; 条件; 更新) { }`

### 2. for...in 循环

- **用途**：遍历对象的可枚举属性
- **优势**：简单的对象属性遍历
- **注意**：会遍历原型链，数组使用需谨慎
- **适用**：对象属性遍历，动态属性处理
- **语法**：`for (const key in object) { }`

### 3. for...of 循环

- **用途**：遍历可迭代对象的值
- **优势**：语法简洁，直接获取值，不遍历自定义属性
- **适用**：数组、字符串、Set、Map 等可迭代对象
- **语法**：`for (const value of iterable) { }`

### 4. 选择建议

- **数组遍历**：优先 for...of，需要索引时用传统 for
- **对象遍历**：使用 for...in + hasOwnProperty 检查
- **性能敏感**：使用传统 for 循环
- **简单值遍历**：使用 for...of
- **复杂控制**：使用传统 for 循环

### 5. 现代替代方案

- **数组方法**：forEach、map、filter、reduce
- **对象方法**：Object.keys()、Object.values()、Object.entries()
- **迭代器方法**：Array.from()、扩展运算符

理解这三种循环的特点和适用场景，能够帮助你在不同情况下选择最合适的遍历方式，写出更高效、更可读的代码。
