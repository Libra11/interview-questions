---
title: ES6 中的 Map 和 Set 对象该如何遍历？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  掌握 ES6 Map 和 Set 对象的各种遍历方法，理解 for...of、forEach、迭代器等遍历方式的特点和使用场景。
tags:
  - ES6
  - Map
  - Set
  - 遍历
  - 迭代器
estimatedTime: 25 分钟
keywords:
  - Map遍历
  - Set遍历
  - for...of
  - forEach
  - 迭代器
highlight: 掌握 Map 和 Set 的多种遍历方式，理解迭代器协议，能够选择最适合的遍历方法
order: 191
---

## 问题 1：Map 对象有哪些遍历方法？

**Map 的遍历方法总览**

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
  ["city", "New York"],
]);

// 1. for...of 遍历
// 2. forEach 方法
// 3. 迭代器方法（keys(), values(), entries()）
// 4. 解构赋值遍历
```

### 方法 1：for...of 遍历

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
  ["city", "New York"],
]);

// 遍历键值对（默认行为）
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}
// 输出：
// name: Alice
// age: 25
// city: New York

// 只遍历键
for (const key of map.keys()) {
  console.log("Key:", key);
}
// 输出：
// Key: name
// Key: age
// Key: city

// 只遍历值
for (const value of map.values()) {
  console.log("Value:", value);
}
// 输出：
// Value: Alice
// Value: 25
// Value: New York

// 显式遍历键值对
for (const [key, value] of map.entries()) {
  console.log(`${key} => ${value}`);
}
```

### 方法 2：forEach 方法

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
  ["city", "New York"],
]);

// forEach 遍历
map.forEach((value, key, mapObj) => {
  console.log(`${key}: ${value}`);
  // 第三个参数是 Map 对象本身
});

// 使用箭头函数简化
map.forEach((value, key) => {
  console.log(`${key} => ${value}`);
});

// 指定 this 上下文
const context = { prefix: "Data:" };
map.forEach(function (value, key) {
  console.log(`${this.prefix} ${key} = ${value}`);
}, context);
```

### 方法 3：迭代器方法

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
  ["city", "New York"],
]);

// 获取键的迭代器
const keysIterator = map.keys();
console.log(keysIterator.next()); // { value: 'name', done: false }
console.log(keysIterator.next()); // { value: 'age', done: false }

// 获取值的迭代器
const valuesIterator = map.values();
for (const value of valuesIterator) {
  console.log("Value:", value);
}

// 获取键值对的迭代器
const entriesIterator = map.entries();
let result = entriesIterator.next();
while (!result.done) {
  const [key, value] = result.value;
  console.log(`${key}: ${value}`);
  result = entriesIterator.next();
}

// Map 对象本身就是可迭代的
const mapIterator = map[Symbol.iterator]();
console.log(mapIterator === map.entries()); // true
```

### 方法 4：解构赋值遍历

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
  ["city", "New York"],
]);

// 转换为数组后遍历
const entries = [...map];
console.log(entries); // [['name', 'Alice'], ['age', 25], ['city', 'New York']]

const keys = [...map.keys()];
console.log(keys); // ['name', 'age', 'city']

const values = [...map.values()];
console.log(values); // ['Alice', 25, 'New York']

// 使用数组方法
entries.forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 使用 filter、map 等数组方法
const filteredEntries = entries.filter(
  ([key, value]) => typeof value === "string"
);
console.log(filteredEntries); // [['name', 'Alice'], ['city', 'New York']]
```

---

## 问题 2：Set 对象有哪些遍历方法？

**Set 的遍历方法总览**

```javascript
const set = new Set(["apple", "banana", "orange", "apple"]); // 重复的 'apple' 会被去除

// 1. for...of 遍历
// 2. forEach 方法
// 3. 迭代器方法（keys(), values(), entries()）
// 4. 解构赋值遍历
```

### 方法 1：for...of 遍历

```javascript
const set = new Set(["apple", "banana", "orange"]);

// 直接遍历值（默认行为）
for (const value of set) {
  console.log("Value:", value);
}
// 输出：
// Value: apple
// Value: banana
// Value: orange

// 使用 values() 方法（效果相同）
for (const value of set.values()) {
  console.log("Value:", value);
}

// 使用 keys() 方法（在 Set 中，keys() 和 values() 返回相同的值）
for (const key of set.keys()) {
  console.log("Key:", key); // 实际上是值
}

// 使用 entries() 方法（返回 [value, value] 的形式）
for (const [key, value] of set.entries()) {
  console.log(`${key} === ${value}`); // key 和 value 相同
}
```

### 方法 2：forEach 方法

```javascript
const set = new Set(["apple", "banana", "orange"]);

// forEach 遍历
set.forEach((value, key, setObj) => {
  console.log(`Value: ${value}, Key: ${key}`);
  // 在 Set 中，value 和 key 是相同的
  // 第三个参数是 Set 对象本身
});

// 简化版本
set.forEach((value) => {
  console.log("Item:", value);
});

// 指定 this 上下文
const context = { count: 0 };
set.forEach(function (value) {
  this.count++;
  console.log(`${this.count}: ${value}`);
}, context);
```

### 方法 3：迭代器方法

```javascript
const set = new Set(["apple", "banana", "orange"]);

// 获取值的迭代器
const valuesIterator = set.values();
console.log(valuesIterator.next()); // { value: 'apple', done: false }
console.log(valuesIterator.next()); // { value: 'banana', done: false }

// 获取键的迭代器（与 values() 相同）
const keysIterator = set.keys();
for (const key of keysIterator) {
  console.log("Key:", key);
}

// 获取键值对的迭代器
const entriesIterator = set.entries();
let result = entriesIterator.next();
while (!result.done) {
  const [key, value] = result.value;
  console.log(`${key} === ${value}`); // 总是相等
  result = entriesIterator.next();
}

// Set 对象本身就是可迭代的
const setIterator = set[Symbol.iterator]();
console.log(setIterator === set.values()); // true
```

### 方法 4：解构赋值遍历

```javascript
const set = new Set(["apple", "banana", "orange"]);

// 转换为数组后遍历
const array = [...set];
console.log(array); // ['apple', 'banana', 'orange']

// 使用数组方法
array.forEach((item, index) => {
  console.log(`${index}: ${item}`);
});

// 使用 filter、map 等数组方法
const filteredArray = array.filter((item) => item.length > 5);
console.log(filteredArray); // ['banana', 'orange']

const upperCaseArray = array.map((item) => item.toUpperCase());
console.log(upperCaseArray); // ['APPLE', 'BANANA', 'ORANGE']
```

---

## 问题 3：Map 和 Set 遍历的性能对比

### 性能测试示例

```javascript
// 创建测试数据
const map = new Map();
const set = new Set();
const obj = {};
const arr = [];

// 填充数据
for (let i = 0; i < 100000; i++) {
  map.set(i, `value${i}`);
  set.add(i);
  obj[i] = `value${i}`;
  arr.push(i);
}

// 性能测试函数
function performanceTest(name, fn) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
}

// Map 遍历性能测试
performanceTest("Map for...of", () => {
  for (const [key, value] of map) {
    // 处理逻辑
  }
});

performanceTest("Map forEach", () => {
  map.forEach((value, key) => {
    // 处理逻辑
  });
});

// Set 遍历性能测试
performanceTest("Set for...of", () => {
  for (const value of set) {
    // 处理逻辑
  }
});

performanceTest("Set forEach", () => {
  set.forEach((value) => {
    // 处理逻辑
  });
});

// 对比 Object 和 Array
performanceTest("Object for...in", () => {
  for (const key in obj) {
    const value = obj[key];
    // 处理逻辑
  }
});

performanceTest("Array for...of", () => {
  for (const value of arr) {
    // 处理逻辑
  }
});
```

**性能特点**：

1. **for...of** 通常比 **forEach** 稍快
2. **Map** 和 **Set** 的遍历性能通常优于 **Object** 和 **Array**
3. **迭代器方法** 提供了更多的控制，但性能略低

---

## 问题 4：实际应用场景和最佳实践

### 场景 1：数据处理和转换

```javascript
// 使用 Map 处理用户数据
const users = new Map([
  [1, { name: "Alice", age: 25, department: "Engineering" }],
  [2, { name: "Bob", age: 30, department: "Marketing" }],
  [3, { name: "Charlie", age: 35, department: "Engineering" }],
]);

// 按部门分组
const departmentGroups = new Map();
for (const [id, user] of users) {
  const dept = user.department;
  if (!departmentGroups.has(dept)) {
    departmentGroups.set(dept, []);
  }
  departmentGroups.get(dept).push({ id, ...user });
}

console.log(departmentGroups);
// Map {
//   'Engineering' => [
//     { id: 1, name: 'Alice', age: 25, department: 'Engineering' },
//     { id: 3, name: 'Charlie', age: 35, department: 'Engineering' }
//   ],
//   'Marketing' => [
//     { id: 2, name: 'Bob', age: 30, department: 'Marketing' }
//   ]
// }

// 计算平均年龄
departmentGroups.forEach((users, department) => {
  const avgAge = users.reduce((sum, user) => sum + user.age, 0) / users.length;
  console.log(`${department} 平均年龄: ${avgAge}`);
});
```

### 场景 2：去重和集合操作

```javascript
// 使用 Set 进行数组去重
const numbers = [1, 2, 3, 2, 4, 3, 5, 1];
const uniqueNumbers = new Set(numbers);

console.log([...uniqueNumbers]); // [1, 2, 3, 4, 5]

// 集合操作
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// 并集
const union = new Set([...setA, ...setB]);
console.log([...union]); // [1, 2, 3, 4, 5, 6]

// 交集
const intersection = new Set([...setA].filter((x) => setB.has(x)));
console.log([...intersection]); // [3, 4]

// 差集
const difference = new Set([...setA].filter((x) => !setB.has(x)));
console.log([...difference]); // [1, 2]

// 使用 for...of 实现集合操作
function setUnion(setA, setB) {
  const result = new Set(setA);
  for (const item of setB) {
    result.add(item);
  }
  return result;
}

function setIntersection(setA, setB) {
  const result = new Set();
  for (const item of setA) {
    if (setB.has(item)) {
      result.add(item);
    }
  }
  return result;
}
```

### 场景 3：缓存和记忆化

```javascript
// 使用 Map 实现函数记忆化
function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("从缓存获取:", key);
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    console.log("计算并缓存:", key);
    return result;
  };
}

// 斐波那契数列的记忆化版本
const fibonacci = memoize(function (n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(10)); // 55

// 查看缓存内容
const cache = fibonacci.cache || new Map();
for (const [key, value] of cache) {
  console.log(`缓存: ${key} => ${value}`);
}
```

### 场景 4：事件处理和观察者模式

```javascript
// 使用 Map 和 Set 实现事件系统
class EventEmitter {
  constructor() {
    this.events = new Map(); // 事件名 -> Set<回调函数>
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.events.has(event)) {
      // 遍历所有回调函数
      for (const callback of this.events.get(event)) {
        callback(...args);
      }
    }
  }

  // 获取所有事件
  getAllEvents() {
    const result = {};
    for (const [event, callbacks] of this.events) {
      result[event] = [...callbacks];
    }
    return result;
  }

  // 清理所有事件
  clear() {
    this.events.clear();
  }
}

// 使用示例
const emitter = new EventEmitter();

const handler1 = (data) => console.log("Handler 1:", data);
const handler2 = (data) => console.log("Handler 2:", data);

emitter.on("test", handler1);
emitter.on("test", handler2);
emitter.on("other", (data) => console.log("Other:", data));

emitter.emit("test", "Hello World");
// 输出:
// Handler 1: Hello World
// Handler 2: Hello World

// 查看所有事件
console.log(emitter.getAllEvents());
```

---

## 问题 5：遍历时的注意事项和陷阱

### 陷阱 1：遍历时修改集合

```javascript
// ❌ 危险：遍历时删除元素
const map = new Map([
  ["a", 1],
  ["b", 2],
  ["c", 3],
]);

// 这可能导致不可预期的行为
for (const [key, value] of map) {
  if (value % 2 === 0) {
    map.delete(key); // 在遍历时删除元素
  }
}

// ✅ 安全：先收集要删除的键，再删除
const map2 = new Map([
  ["a", 1],
  ["b", 2],
  ["c", 3],
]);

const keysToDelete = [];
for (const [key, value] of map2) {
  if (value % 2 === 0) {
    keysToDelete.push(key);
  }
}

keysToDelete.forEach((key) => map2.delete(key));

// ✅ 或者使用 filter 创建新的 Map
const map3 = new Map([
  ["a", 1],
  ["b", 2],
  ["c", 3],
]);

const filteredMap = new Map(
  [...map3].filter(([key, value]) => value % 2 !== 0)
);
```

### 陷阱 2：迭代器的一次性使用

```javascript
const set = new Set(["a", "b", "c"]);

// 迭代器只能使用一次
const iterator = set.values();

// 第一次遍历
for (const value of iterator) {
  console.log("第一次:", value);
}

// 第二次遍历（不会输出任何内容）
for (const value of iterator) {
  console.log("第二次:", value); // 不会执行
}

// ✅ 正确做法：每次都获取新的迭代器
for (const value of set.values()) {
  console.log("新迭代器:", value);
}
```

### 陷阱 3：forEach 中的 this 绑定

```javascript
class DataProcessor {
  constructor() {
    this.prefix = "Processed:";
  }

  // ❌ 箭头函数中无法绑定 this
  processWithArrow(map) {
    map.forEach((value, key) => {
      console.log(this.prefix, key, value); // this 指向 DataProcessor 实例
    });
  }

  // ✅ 普通函数需要绑定 this
  processWithFunction(map) {
    map.forEach(function (value, key) {
      console.log(this.prefix, key, value);
    }, this); // 传入 this 作为第二个参数
  }

  // ✅ 或者使用 bind
  processWithBind(map) {
    map.forEach(
      function (value, key) {
        console.log(this.prefix, key, value);
      }.bind(this)
    );
  }
}
```

---

## 问题 6：与其他遍历方式的对比

### Map vs Object 遍历

```javascript
const map = new Map([
  ["name", "Alice"],
  ["age", 25],
]);

const obj = {
  name: "Alice",
  age: 25,
};

// Map 遍历
console.log("=== Map 遍历 ===");
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// Object 遍历
console.log("=== Object 遍历 ===");

// for...in（会遍历原型链上的属性）
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(`${key}: ${obj[key]}`);
  }
}

// Object.keys()
Object.keys(obj).forEach((key) => {
  console.log(`${key}: ${obj[key]}`);
});

// Object.entries()
for (const [key, value] of Object.entries(obj)) {
  console.log(`${key}: ${value}`);
}

// 性能和特性对比
console.log("=== 特性对比 ===");
console.log("Map 大小:", map.size);
console.log("Object 大小:", Object.keys(obj).length);

console.log("Map 有序:", true); // Map 保持插入顺序
console.log("Object 有序:", false); // Object 在 ES2015+ 中部分有序
```

### Set vs Array 遍历

```javascript
const set = new Set(["apple", "banana", "orange"]);
const array = ["apple", "banana", "orange"];

// Set 遍历
console.log("=== Set 遍历 ===");
for (const value of set) {
  console.log("Set value:", value);
}

set.forEach((value, index) => {
  console.log(`Set ${index}: ${value}`); // index 实际上是 value
});

// Array 遍历
console.log("=== Array 遍历 ===");
for (const value of array) {
  console.log("Array value:", value);
}

array.forEach((value, index) => {
  console.log(`Array ${index}: ${value}`);
});

// 特性对比
console.log("=== 特性对比 ===");
console.log("Set 去重:", new Set([1, 1, 2, 2, 3]).size); // 3
console.log("Array 去重:", [...new Set([1, 1, 2, 2, 3])]); // [1, 2, 3]

console.log("Set 查找:", set.has("apple")); // O(1)
console.log("Array 查找:", array.includes("apple")); // O(n)
```

---

## 总结

**Map 遍历方法**：

1. **for...of**：最常用，支持解构
2. **forEach**：函数式风格，支持 this 绑定
3. **迭代器**：keys()、values()、entries()
4. **解构转数组**：使用扩展运算符

**Set 遍历方法**：

1. **for...of**：直接遍历值
2. **forEach**：函数式风格
3. **迭代器**：values()、keys()（相同）、entries()
4. **解构转数组**：使用扩展运算符

**选择建议**：

- **简单遍历**：使用 for...of
- **需要索引或复杂逻辑**：使用 forEach
- **需要控制遍历过程**：使用迭代器
- **需要数组方法**：转换为数组

**最佳实践**：

1. 优先使用 for...of，代码更简洁
2. 避免在遍历时修改集合
3. 注意迭代器的一次性特性
4. 根据场景选择合适的遍历方式
5. 考虑性能要求选择最优方法
