---
title: 普通数据类型存储在哪里？堆还是栈？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 JavaScript 中基本数据类型和引用数据类型的存储机制，掌握栈内存和堆内存的区别，理解内存分配和垃圾回收原理。
tags:
  - 内存管理
  - 数据类型
  - 栈内存
  - 堆内存
estimatedTime: 30 分钟
keywords:
  - 基本数据类型
  - 引用数据类型
  - 栈内存
  - 堆内存
  - 内存分配
highlight: 理解 JavaScript 内存分配机制，掌握基本类型和引用类型的存储差异，避免内存泄漏问题
order: 33
---

## 问题 1：JavaScript 中的数据类型分类

**数据类型分类**

JavaScript 中的数据类型分为两大类：

1. **基本数据类型（Primitive Types）**：

   - `number`、`string`、`boolean`、`undefined`、`null`、`symbol`、`bigint`

2. **引用数据类型（Reference Types）**：
   - `object`（包括 Array、Function、Date、RegExp 等）

```javascript
// 基本数据类型
let num = 42; // number
let str = "hello"; // string
let bool = true; // boolean
let undef = undefined; // undefined
let n = null; // null
let sym = Symbol("id"); // symbol
let big = 123n; // bigint

// 引用数据类型
let obj = { name: "Alice" }; // object
let arr = [1, 2, 3]; // array (object)
let func = function () {}; // function (object)
let date = new Date(); // date (object)
```

**存储位置总结**：

| 数据类型     | 存储位置 | 特点                     |
| ------------ | -------- | ------------------------ |
| **基本类型** | 栈内存   | 直接存储值，按值传递     |
| **引用类型** | 堆内存   | 存储引用地址，按引用传递 |

---

## 问题 2：栈内存和堆内存的区别是什么？

### 栈内存（Stack Memory）

**特点**：

- **速度快**：直接访问，LIFO（后进先出）结构
- **空间小**：通常几 MB，有大小限制
- **自动管理**：函数执行完毕自动释放
- **存储内容**：基本数据类型的值、函数调用信息、局部变量

```javascript
function example() {
  let a = 10; // 存储在栈中
  let b = "hello"; // 存储在栈中
  let c = true; // 存储在栈中

  // 函数执行完毕，a、b、c 自动从栈中清除
}

example();
```

**栈内存示意图**：

```
栈内存 (Stack)
┌─────────────────┐
│ c = true        │ ← 栈顶
├─────────────────┤
│ b = "hello"     │
├─────────────────┤
│ a = 10          │
├─────────────────┤
│ 函数调用信息     │
└─────────────────┘ ← 栈底
```

### 堆内存（Heap Memory）

**特点**：

- **空间大**：可以存储大量数据
- **速度相对慢**：需要通过引用访问
- **手动管理**：需要垃圾回收机制清理
- **存储内容**：对象、数组、函数等引用类型

```javascript
function example() {
  let obj = { name: "Alice", age: 25 }; // 对象存储在堆中
  let arr = [1, 2, 3, 4, 5]; // 数组存储在堆中

  // obj 和 arr 变量存储在栈中，但存储的是堆内存的地址
}
```

**堆内存示意图**：

```
栈内存 (Stack)          堆内存 (Heap)
┌─────────────────┐    ┌─────────────────────┐
│ arr → 0x002     │───→│ 0x002: [1,2,3,4,5]  │
├─────────────────┤    ├─────────────────────┤
│ obj → 0x001     │───→│ 0x001: {name:"Alice",│
└─────────────────┘    │        age: 25}     │
                       └─────────────────────┘
```

---

## 问题 3：基本数据类型的存储机制

**基本类型直接存储值**

```javascript
// 基本类型的赋值是值拷贝
let a = 10;
let b = a; // b 得到 a 的值的副本

a = 20; // 修改 a 不影响 b
console.log(a); // 20
console.log(b); // 10（不变）

// 内存示意图：
// 栈内存
// ┌─────────────┐
// │ a = 20      │
// ├─────────────┤
// │ b = 10      │
// └─────────────┘
```

**基本类型的比较**：

```javascript
let x = 5;
let y = 5;
console.log(x === y); // true，比较的是值

let str1 = "hello";
let str2 = "hello";
console.log(str1 === str2); // true，比较的是值

// 即使是不同的变量，只要值相同就相等
```

**基本类型的函数传参**：

```javascript
function changeValue(num) {
  num = 100; // 只修改参数的副本
  console.log("函数内:", num); // 100
}

let original = 50;
changeValue(original);
console.log("函数外:", original); // 50（不变）

// 传递的是值的副本，不是原变量
```

**特殊情况：字符串的不可变性**：

```javascript
let str = "hello";
str[0] = "H"; // 尝试修改字符串
console.log(str); // "hello"（不变，字符串是不可变的）

// 字符串操作会创建新字符串
let newStr = str.toUpperCase();
console.log(str); // "hello"（原字符串不变）
console.log(newStr); // "HELLO"（新字符串）
```

---

## 问题 4：引用数据类型的存储机制

**引用类型存储地址**

```javascript
// 引用类型的赋值是引用拷贝
let obj1 = { name: "Alice" };
let obj2 = obj1; // obj2 得到 obj1 的引用

obj1.name = "Bob"; // 通过 obj1 修改对象
console.log(obj1.name); // "Bob"
console.log(obj2.name); // "Bob"（obj2 也受影响）

// 内存示意图：
// 栈内存              堆内存
// ┌─────────────┐    ┌─────────────────┐
// │ obj1 → 0x001│───→│ 0x001: {name:   │
// ├─────────────┤    │        "Bob"}   │
// │ obj2 → 0x001│───→│                 │
// └─────────────┘    └─────────────────┘
```

**引用类型的比较**：

```javascript
let arr1 = [1, 2, 3];
let arr2 = [1, 2, 3];
let arr3 = arr1;

console.log(arr1 === arr2); // false，不同的对象（不同的引用）
console.log(arr1 === arr3); // true，相同的引用

// 即使内容相同，不同的对象也不相等
console.log({} === {}); // false
console.log([] === []); // false
```

**引用类型的函数传参**：

```javascript
function changeObject(obj) {
  obj.name = "Changed"; // 修改对象的属性
  console.log("函数内:", obj.name); // "Changed"
}

let person = { name: "Original" };
changeObject(person);
console.log("函数外:", person.name); // "Changed"（被修改了）

// 传递的是引用，指向同一个对象
```

**重新赋值 vs 修改属性**：

```javascript
function test1(obj) {
  obj = { name: "New Object" }; // 重新赋值，不影响原对象
}

function test2(obj) {
  obj.name = "Modified"; // 修改属性，影响原对象
}

let original = { name: "Original" };

test1(original);
console.log(original.name); // "Original"（不变）

test2(original);
console.log(original.name); // "Modified"（被修改）
```

---

## 问题 5：内存分配的实际例子

### 例子 1：混合数据类型

```javascript
function createUser(name, age) {
  // 栈内存：存储基本类型和引用
  let id = Math.floor(Math.random() * 1000); // number，存储在栈中
  let isActive = true; // boolean，存储在栈中

  // 堆内存：存储对象
  let user = {
    // 对象存储在堆中
    id: id, // 属性值是基本类型，存储在对象内部
    name: name, // 字符串存储在对象内部
    age: age, // 数字存储在对象内部
    isActive: isActive, // 布尔值存储在对象内部
    hobbies: [], // 数组（对象）存储在堆中
  };

  return user; // 返回对象的引用
}

let alice = createUser("Alice", 25);

// 内存分布：
// 栈内存：alice 变量存储堆内存地址
// 堆内存：用户对象及其属性
```

### 例子 2：嵌套对象

```javascript
let company = {
  name: "Tech Corp", // 字符串存储在对象内部
  employees: [
    // 数组存储在堆中
    {
      // 每个员工对象也存储在堆中
      name: "Alice",
      department: {
        // 嵌套对象也存储在堆中
        name: "Engineering",
        floor: 3,
      },
    },
    {
      name: "Bob",
      department: {
        name: "Marketing",
        floor: 2,
      },
    },
  ],
};

// 内存结构：
// 栈内存：company 变量 → 堆内存地址
// 堆内存：
//   - company 对象
//   - employees 数组
//   - 每个员工对象
//   - 每个部门对象
```

### 例子 3：闭包中的内存

```javascript
function createCounter() {
  let count = 0; // 基本类型，但因为闭包会保留在内存中

  return {
    increment: function () {
      count++; // 访问外部变量
      return count;
    },
    getCount: function () {
      return count;
    },
  };
}

let counter = createCounter();

// 内存情况：
// - count 变量因为闭包不会被垃圾回收
// - 返回的对象存储在堆中
// - 函数也存储在堆中
```

---

## 问题 6：内存管理和垃圾回收

### 垃圾回收机制

**标记清除（Mark and Sweep）**：

```javascript
function example() {
  let obj1 = { name: "Object 1" };
  let obj2 = { name: "Object 2" };

  obj1.ref = obj2; // obj1 引用 obj2
  obj2.ref = obj1; // obj2 引用 obj1（循环引用）

  // 函数结束后，obj1 和 obj2 都不再被外部引用
  // 垃圾回收器会标记并清除它们
}

example();
// obj1 和 obj2 会被垃圾回收，即使有循环引用
```

**引用计数（Reference Counting）**：

```javascript
// 旧的垃圾回收方式，现代浏览器已不使用
let obj = { name: "Test" }; // 引用计数 = 1
let another = obj; // 引用计数 = 2
another = null; // 引用计数 = 1
obj = null; // 引用计数 = 0，可以回收

// 问题：循环引用无法回收
let a = {};
let b = {};
a.ref = b; // a 引用 b
b.ref = a; // b 引用 a
a = null; // 但 a 和 b 仍然互相引用，无法回收
b = null;
```

### 内存泄漏的常见原因

```javascript
// 1. 全局变量
window.globalData = new Array(1000000); // 不会被回收

// 2. 未清理的定时器
let timer = setInterval(() => {
  // 如果不清理，回调函数和其引用的变量不会被回收
}, 1000);
// clearInterval(timer);  // 应该清理

// 3. 闭包引用
function createLeak() {
  let largeData = new Array(1000000);

  return function () {
    // 即使不使用 largeData，闭包也会保持对它的引用
    console.log("Hello");
  };
}

let leak = createLeak(); // largeData 不会被回收

// 4. DOM 引用
let element = document.getElementById("myElement");
let data = {
  element: element,
  handler: function () {
    // 处理逻辑
  },
};
element.addEventListener("click", data.handler);
// 即使 DOM 元素被移除，data 对象仍然引用它
```

### 内存优化建议

```javascript
// 1. 及时清理引用
function optimizedFunction() {
  let largeArray = new Array(1000000);

  // 使用完后清理
  processArray(largeArray);
  largeArray = null; // 帮助垃圾回收
}

// 2. 使用 WeakMap 和 WeakSet
let weakMap = new WeakMap();
let obj = {};
weakMap.set(obj, "some data");
obj = null; // WeakMap 中的条目也会被回收

// 3. 避免创建不必要的闭包
// ❌ 不好的做法
function createHandlers(items) {
  return items.map((item) => {
    return function () {
      console.log(item); // 每个函数都保持对 item 的引用
    };
  });
}

// ✅ 更好的做法
function createHandlers(items) {
  function handler(item) {
    return function () {
      console.log(item);
    };
  }

  return items.map(handler);
}

// 4. 使用对象池
class ObjectPool {
  constructor(createFn, resetFn) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
  }

  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFn();
  }

  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// 使用对象池减少内存分配
const arrayPool = new ObjectPool(
  () => [],
  (arr) => (arr.length = 0)
);
```

---

## 问题 7：实际开发中的内存考虑

### 大数据处理

```javascript
// ❌ 内存密集的做法
function processLargeData(data) {
  let results = [];
  let intermediate = [];

  for (let item of data) {
    let processed = expensiveOperation(item);
    intermediate.push(processed);
    results.push(transform(processed));
  }

  return results; // intermediate 数组占用额外内存
}

// ✅ 内存友好的做法
function processLargeDataOptimized(data) {
  let results = [];

  for (let item of data) {
    let processed = expensiveOperation(item);
    results.push(transform(processed));
    // processed 会在下次循环前被回收
  }

  return results;
}

// ✅ 使用生成器进一步优化
function* processLargeDataGenerator(data) {
  for (let item of data) {
    let processed = expensiveOperation(item);
    yield transform(processed);
    // 每次只处理一个项目，内存使用最小
  }
}
```

### 缓存策略

```javascript
// 使用 Map 实现 LRU 缓存
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // 移到最后（最近使用）
      let value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的项目
      let firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

// 使用 WeakMap 实现自动清理的缓存
const cache = new WeakMap();

function expensiveComputation(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  let result = /* 复杂计算 */ obj.value * 2;
  cache.set(obj, result);
  return result;
}

// 当 obj 被回收时，缓存条目也会自动清理
```

---

## 总结

**存储位置总结**：

| 数据类型     | 存储位置 | 访问方式     | 传递方式   | 比较方式   |
| ------------ | -------- | ------------ | ---------- | ---------- |
| **基本类型** | 栈内存   | 直接访问值   | 按值传递   | 按值比较   |
| **引用类型** | 堆内存   | 通过引用访问 | 按引用传递 | 按引用比较 |

**关键要点**：

1. **基本类型**：

   - 存储在栈内存中
   - 直接存储值
   - 赋值时复制值
   - 函数传参时传递值的副本

2. **引用类型**：

   - 存储在堆内存中
   - 栈中存储引用地址
   - 赋值时复制引用
   - 函数传参时传递引用的副本

3. **内存管理**：

   - 栈内存自动管理
   - 堆内存需要垃圾回收
   - 注意避免内存泄漏
   - 合理使用缓存和对象池

4. **性能考虑**：
   - 基本类型操作更快
   - 引用类型需要额外的内存分配
   - 大对象操作需要考虑内存使用
   - 使用合适的数据结构和算法

**最佳实践**：

1. 优先使用基本类型
2. 及时清理不需要的引用
3. 使用 WeakMap/WeakSet 避免内存泄漏
4. 合理使用缓存策略
5. 监控内存使用情况
