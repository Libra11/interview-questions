---
title: Array API 有哪些常用方法？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  全面掌握 JavaScript Array 的常用 API，包括遍历、查找、修改、转换等方法，理解每个方法的特点和使用场景。
tags:
  - Array
  - API
  - 数组方法
  - 函数式编程
estimatedTime: 35 分钟
keywords:
  - Array API
  - 数组方法
  - map
  - filter
  - reduce
highlight: 掌握 Array 的核心 API，理解函数式编程方法，能够选择合适的数组方法解决问题
order: 42
---

## 问题 1：Array 的基本操作方法

### 添加和删除元素

```javascript
const arr = [1, 2, 3];

// 1. push() - 末尾添加元素，返回新长度
const newLength = arr.push(4, 5);
console.log(arr); // [1, 2, 3, 4, 5]
console.log(newLength); // 5

// 2. pop() - 删除末尾元素，返回被删除的元素
const removed = arr.pop();
console.log(arr); // [1, 2, 3, 4]
console.log(removed); // 5

// 3. unshift() - 开头添加元素，返回新长度
const length = arr.unshift(0);
console.log(arr); // [0, 1, 2, 3, 4]
console.log(length); // 5

// 4. shift() - 删除开头元素，返回被删除的元素
const first = arr.shift();
console.log(arr); // [1, 2, 3, 4]
console.log(first); // 0

// 5. splice() - 删除/插入/替换元素
const numbers = [1, 2, 3, 4, 5];

// 删除元素：splice(start, deleteCount)
const deleted = numbers.splice(2, 2); // 从索引2开始删除2个元素
console.log(numbers); // [1, 2, 5]
console.log(deleted); // [3, 4]

// 插入元素：splice(start, 0, ...items)
numbers.splice(2, 0, "a", "b");
console.log(numbers); // [1, 2, 'a', 'b', 5]

// 替换元素：splice(start, deleteCount, ...items)
numbers.splice(2, 2, 3, 4);
console.log(numbers); // [1, 2, 3, 4, 5]
```

### 数组连接和切片

```javascript
// 1. concat() - 连接数组，返回新数组
const arr1 = [1, 2];
const arr2 = [3, 4];
const arr3 = [5, 6];

const combined = arr1.concat(arr2, arr3);
console.log(combined); // [1, 2, 3, 4, 5, 6]
console.log(arr1); // [1, 2] (原数组不变)

// 使用扩展运算符（现代方法）
const modernCombined = [...arr1, ...arr2, ...arr3];
console.log(modernCombined); // [1, 2, 3, 4, 5, 6]

// 2. slice() - 提取数组片段，返回新数组
const original = [1, 2, 3, 4, 5];

const slice1 = original.slice(1, 4); // 从索引1到4（不包括4）
console.log(slice1); // [2, 3, 4]

const slice2 = original.slice(2); // 从索引2到末尾
console.log(slice2); // [3, 4, 5]

const slice3 = original.slice(-2); // 最后两个元素
console.log(slice3); // [4, 5]

const slice4 = original.slice(); // 浅拷贝整个数组
console.log(slice4); // [1, 2, 3, 4, 5]

console.log(original); // [1, 2, 3, 4, 5] (原数组不变)
```

---

## 问题 2：Array 的查找和检测方法

### 查找元素

```javascript
const fruits = ["apple", "banana", "orange", "apple"];

// 1. indexOf() - 查找元素第一次出现的索引
console.log(fruits.indexOf("apple")); // 0
console.log(fruits.indexOf("grape")); // -1 (不存在)
console.log(fruits.indexOf("apple", 1)); // 3 (从索引1开始查找)

// 2. lastIndexOf() - 查找元素最后一次出现的索引
console.log(fruits.lastIndexOf("apple")); // 3
console.log(fruits.lastIndexOf("apple", 2)); // 0 (从索引2向前查找)

// 3. includes() - 检查是否包含某个元素 (ES2016)
console.log(fruits.includes("banana")); // true
console.log(fruits.includes("grape")); // false
console.log(fruits.includes("apple", 2)); // true (从索引2开始查找)

// 4. find() - 查找第一个满足条件的元素 (ES6)
const numbers = [1, 3, 5, 8, 10, 12];
const firstEven = numbers.find((num) => num % 2 === 0);
console.log(firstEven); // 8

const notFound = numbers.find((num) => num > 20);
console.log(notFound); // undefined

// 5. findIndex() - 查找第一个满足条件的元素索引 (ES6)
const firstEvenIndex = numbers.findIndex((num) => num % 2 === 0);
console.log(firstEvenIndex); // 3

const notFoundIndex = numbers.findIndex((num) => num > 20);
console.log(notFoundIndex); // -1

// 6. findLast() - 查找最后一个满足条件的元素 (ES2022)
const lastEven = numbers.findLast((num) => num % 2 === 0);
console.log(lastEven); // 12

// 7. findLastIndex() - 查找最后一个满足条件的元素索引 (ES2022)
const lastEvenIndex = numbers.findLastIndex((num) => num % 2 === 0);
console.log(lastEvenIndex); // 5
```

### 检测方法

```javascript
const numbers = [2, 4, 6, 8];
const mixed = [1, 2, 3, 4, 5];

// 1. every() - 检查所有元素是否都满足条件
const allEven = numbers.every((num) => num % 2 === 0);
console.log(allEven); // true

const allPositive = mixed.every((num) => num > 0);
console.log(allPositive); // true

// 2. some() - 检查是否有元素满足条件
const hasEven = mixed.some((num) => num % 2 === 0);
console.log(hasEven); // true

const hasNegative = mixed.some((num) => num < 0);
console.log(hasNegative); // false

// 实际应用示例
const users = [
  { name: "Alice", age: 25, active: true },
  { name: "Bob", age: 30, active: false },
  { name: "Charlie", age: 35, active: true },
];

// 检查是否所有用户都是成年人
const allAdults = users.every((user) => user.age >= 18);
console.log(allAdults); // true

// 检查是否有活跃用户
const hasActiveUser = users.some((user) => user.active);
console.log(hasActiveUser); // true

// 查找特定用户
const alice = users.find((user) => user.name === "Alice");
console.log(alice); // { name: 'Alice', age: 25, active: true }
```

---

## 问题 3：Array 的遍历方法

### 基本遍历

```javascript
const numbers = [1, 2, 3, 4, 5];

// 1. forEach() - 遍历数组，无返回值
numbers.forEach((num, index, array) => {
  console.log(`Index ${index}: ${num}`);
});

// 2. for...of - 遍历值
for (const num of numbers) {
  console.log(num);
}

// 3. for...in - 遍历索引（不推荐用于数组）
for (const index in numbers) {
  console.log(`${index}: ${numbers[index]}`);
}

// 4. 传统 for 循环
for (let i = 0; i < numbers.length; i++) {
  console.log(`${i}: ${numbers[i]}`);
}

// forEach 的实际应用
const tasks = [
  { id: 1, title: "Task 1", completed: false },
  { id: 2, title: "Task 2", completed: true },
  { id: 3, title: "Task 3", completed: false },
];

// 打印未完成的任务
tasks.forEach((task) => {
  if (!task.completed) {
    console.log(`TODO: ${task.title}`);
  }
});

// 注意：forEach 不能使用 break 或 continue
// 如需中断循环，使用 for...of 或传统 for 循环
```

### 高级遍历和转换

```javascript
const products = [
  { name: "Laptop", price: 1000, category: "Electronics" },
  { name: "Phone", price: 500, category: "Electronics" },
  { name: "Book", price: 20, category: "Education" },
  { name: "Pen", price: 2, category: "Stationery" },
];

// 1. map() - 转换数组，返回新数组
const productNames = products.map((product) => product.name);
console.log(productNames); // ['Laptop', 'Phone', 'Book', 'Pen']

const discountedPrices = products.map((product) => ({
  ...product,
  price: product.price * 0.9, // 9折
}));

// 2. filter() - 过滤数组，返回新数组
const electronics = products.filter(
  (product) => product.category === "Electronics"
);
console.log(electronics); // 电子产品

const affordableItems = products.filter((product) => product.price < 100);
console.log(affordableItems); // 价格低于100的商品

// 3. 链式调用
const expensiveElectronicsNames = products
  .filter((product) => product.category === "Electronics")
  .filter((product) => product.price > 300)
  .map((product) => product.name);

console.log(expensiveElectronicsNames); // ['Laptop', 'Phone']
```

---

## 问题 4：Array 的归约方法

### reduce 方法详解

```javascript
const numbers = [1, 2, 3, 4, 5];

// 1. reduce() - 基本用法
const sum = numbers.reduce((accumulator, current) => {
  return accumulator + current;
}, 0);
console.log(sum); // 15

// 简化写法
const sum2 = numbers.reduce((acc, curr) => acc + curr, 0);

// 2. 不提供初始值（使用第一个元素作为初始值）
const sum3 = numbers.reduce((acc, curr) => acc + curr);
console.log(sum3); // 15

// 3. reduce 的复杂应用
const transactions = [
  { type: "income", amount: 1000 },
  { type: "expense", amount: 200 },
  { type: "income", amount: 500 },
  { type: "expense", amount: 100 },
];

// 计算净收入
const netIncome = transactions.reduce((total, transaction) => {
  return transaction.type === "income"
    ? total + transaction.amount
    : total - transaction.amount;
}, 0);
console.log(netIncome); // 1200

// 按类型分组
const groupedTransactions = transactions.reduce((groups, transaction) => {
  const type = transaction.type;
  if (!groups[type]) {
    groups[type] = [];
  }
  groups[type].push(transaction);
  return groups;
}, {});

console.log(groupedTransactions);
// {
//   income: [{ type: 'income', amount: 1000 }, { type: 'income', amount: 500 }],
//   expense: [{ type: 'expense', amount: 200 }, { type: 'expense', amount: 100 }]
// }

// 4. reduceRight() - 从右到左归约
const letters = ["a", "b", "c", "d"];
const rightToLeft = letters.reduceRight((acc, curr) => acc + curr);
console.log(rightToLeft); // 'dcba'

const leftToRight = letters.reduce((acc, curr) => acc + curr);
console.log(leftToRight); // 'abcd'
```

### reduce 的实际应用

```javascript
// 1. 数组去重
const duplicates = [1, 2, 2, 3, 3, 3, 4];
const unique = duplicates.reduce((acc, curr) => {
  if (!acc.includes(curr)) {
    acc.push(curr);
  }
  return acc;
}, []);
console.log(unique); // [1, 2, 3, 4]

// 2. 扁平化数组
const nested = [
  [1, 2],
  [3, 4],
  [5, 6],
];
const flattened = nested.reduce((acc, curr) => acc.concat(curr), []);
console.log(flattened); // [1, 2, 3, 4, 5, 6]

// 3. 计数
const fruits = ["apple", "banana", "apple", "orange", "banana", "apple"];
const fruitCount = fruits.reduce((count, fruit) => {
  count[fruit] = (count[fruit] || 0) + 1;
  return count;
}, {});
console.log(fruitCount); // { apple: 3, banana: 2, orange: 1 }

// 4. 查找最大值/最小值
const scores = [85, 92, 78, 96, 88];
const maxScore = scores.reduce((max, current) => Math.max(max, current));
const minScore = scores.reduce((min, current) => Math.min(min, current));
console.log(maxScore); // 96
console.log(minScore); // 78

// 5. 构建复杂对象
const users = [
  { id: 1, name: "Alice", department: "Engineering" },
  { id: 2, name: "Bob", department: "Marketing" },
  { id: 3, name: "Charlie", department: "Engineering" },
];

const usersByDepartment = users.reduce((departments, user) => {
  const dept = user.department;
  if (!departments[dept]) {
    departments[dept] = {
      name: dept,
      users: [],
      count: 0,
    };
  }
  departments[dept].users.push(user);
  departments[dept].count++;
  return departments;
}, {});

console.log(usersByDepartment);
```

---

## 问题 5：Array 的排序和反转方法

### 排序方法

```javascript
// 1. sort() - 排序（会修改原数组）
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// 默认按字符串排序
const defaultSort = [...numbers].sort();
console.log(defaultSort); // [1, 1, 2, 3, 4, 5, 6, 9]

// 数字排序
const numericSort = [...numbers].sort((a, b) => a - b);
console.log(numericSort); // [1, 1, 2, 3, 4, 5, 6, 9]

// 降序排序
const descendingSort = [...numbers].sort((a, b) => b - a);
console.log(descendingSort); // [9, 6, 5, 4, 3, 2, 1, 1]

// 字符串排序
const fruits = ["banana", "apple", "orange", "grape"];
const sortedFruits = [...fruits].sort();
console.log(sortedFruits); // ['apple', 'banana', 'grape', 'orange']

// 按长度排序
const sortedByLength = [...fruits].sort((a, b) => a.length - b.length);
console.log(sortedByLength); // ['apple', 'grape', 'banana', 'orange']

// 2. 复杂对象排序
const students = [
  { name: "Alice", age: 23, grade: 85 },
  { name: "Bob", age: 21, grade: 92 },
  { name: "Charlie", age: 22, grade: 78 },
];

// 按年龄排序
const sortedByAge = [...students].sort((a, b) => a.age - b.age);

// 按成绩排序（降序）
const sortedByGrade = [...students].sort((a, b) => b.grade - a.grade);

// 按姓名排序
const sortedByName = [...students].sort((a, b) => a.name.localeCompare(b.name));

// 多条件排序
const multiSort = [...students].sort((a, b) => {
  // 首先按年龄排序
  if (a.age !== b.age) {
    return a.age - b.age;
  }
  // 年龄相同时按成绩排序
  return b.grade - a.grade;
});

console.log(multiSort);
```

### 反转方法

```javascript
// 1. reverse() - 反转数组（会修改原数组）
const original = [1, 2, 3, 4, 5];
const reversed = [...original].reverse();
console.log(reversed); // [5, 4, 3, 2, 1]
console.log(original); // [1, 2, 3, 4, 5] (使用扩展运算符保护原数组)

// 2. 不修改原数组的反转方法
const nonMutatingReverse = original.slice().reverse();
// 或者
const nonMutatingReverse2 = [...original].reverse();
// 或者使用 toReversed() (ES2023)
// const nonMutatingReverse3 = original.toReversed();

// 3. 实际应用：反转字符串
function reverseString(str) {
  return str.split("").reverse().join("");
}

console.log(reverseString("hello")); // 'olleh'

// 4. 反转二维数组
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// 反转行的顺序
const reversedRows = [...matrix].reverse();
console.log(reversedRows);
// [[7, 8, 9], [4, 5, 6], [1, 2, 3]]

// 反转每行的列
const reversedCols = matrix.map((row) => [...row].reverse());
console.log(reversedCols);
// [[3, 2, 1], [6, 5, 4], [9, 8, 7]]
```

---

## 问题 6：Array 的转换方法

### 字符串转换

```javascript
// 1. join() - 将数组元素连接成字符串
const fruits = ["apple", "banana", "orange"];

const joined1 = fruits.join(); // 默认用逗号分隔
console.log(joined1); // 'apple,banana,orange'

const joined2 = fruits.join(" - "); // 自定义分隔符
console.log(joined2); // 'apple - banana - orange'

const joined3 = fruits.join(""); // 无分隔符
console.log(joined3); // 'applebananaorange'

// 2. toString() - 转换为字符串（等同于 join()）
const toString = fruits.toString();
console.log(toString); // 'apple,banana,orange'

// 3. 实际应用
const breadcrumb = ["Home", "Products", "Electronics", "Laptops"];
const breadcrumbString = breadcrumb.join(" > ");
console.log(breadcrumbString); // 'Home > Products > Electronics > Laptops'

// CSV 格式
const csvData = [
  ["Name", "Age", "City"],
  ["Alice", "25", "New York"],
  ["Bob", "30", "London"],
];

const csvString = csvData.map((row) => row.join(",")).join("\n");
console.log(csvString);
// Name,Age,City
// Alice,25,New York
// Bob,30,London
```

### 类型转换

```javascript
// 1. Array.from() - 从类数组或可迭代对象创建数组
const str = "hello";
const charArray = Array.from(str);
console.log(charArray); // ['h', 'e', 'l', 'l', 'o']

// 从 NodeList 创建数组
const divs = document.querySelectorAll("div");
const divArray = Array.from(divs);

// 使用映射函数
const numbers = Array.from({ length: 5 }, (_, i) => i + 1);
console.log(numbers); // [1, 2, 3, 4, 5]

const squares = Array.from({ length: 5 }, (_, i) => (i + 1) ** 2);
console.log(squares); // [1, 4, 9, 16, 25]

// 2. Array.of() - 创建数组
const arr1 = Array.of(1, 2, 3);
console.log(arr1); // [1, 2, 3]

const arr2 = Array.of(5); // 与 Array(5) 不同
console.log(arr2); // [5]

const arr3 = Array(5); // 创建长度为5的空数组
console.log(arr3); // [empty × 5]

// 3. 扩展运算符转换
const set = new Set([1, 2, 3, 2, 1]);
const uniqueArray = [...set];
console.log(uniqueArray); // [1, 2, 3]

const map = new Map([
  ["a", 1],
  ["b", 2],
]);
const mapArray = [...map];
console.log(mapArray); // [['a', 1], ['b', 2]]
```

---

## 问题 7：Array 的现代方法（ES2022+）

### 新增的非变异方法

```javascript
const numbers = [1, 2, 3, 4, 5];

// 1. at() - 支持负索引访问 (ES2022)
console.log(numbers.at(0)); // 1 (等同于 numbers[0])
console.log(numbers.at(-1)); // 5 (最后一个元素)
console.log(numbers.at(-2)); // 4 (倒数第二个元素)

// 对比传统方法
console.log(numbers[numbers.length - 1]); // 5 (获取最后一个元素)

// 2. toReversed() - 非变异反转 (ES2023)
const original = [1, 2, 3, 4, 5];
const reversed = original.toReversed();
console.log(original); // [1, 2, 3, 4, 5] (不变)
console.log(reversed); // [5, 4, 3, 2, 1]

// 3. toSorted() - 非变异排序 (ES2023)
const unsorted = [3, 1, 4, 1, 5];
const sorted = unsorted.toSorted((a, b) => a - b);
console.log(unsorted); // [3, 1, 4, 1, 5] (不变)
console.log(sorted); // [1, 1, 3, 4, 5]

// 4. toSpliced() - 非变异拼接 (ES2023)
const arr = [1, 2, 3, 4, 5];
const spliced = arr.toSpliced(2, 1, "a", "b"); // 从索引2删除1个，插入'a','b'
console.log(arr); // [1, 2, 3, 4, 5] (不变)
console.log(spliced); // [1, 2, 'a', 'b', 4, 5]

// 5. with() - 非变异替换 (ES2023)
const original2 = [1, 2, 3, 4, 5];
const modified = original2.with(2, "X"); // 将索引2的元素替换为'X'
console.log(original2); // [1, 2, 3, 4, 5] (不变)
console.log(modified); // [1, 2, 'X', 4, 5]
```

### 实际应用示例

```javascript
// 使用现代方法的函数式编程风格
const products = [
  { id: 1, name: "Laptop", price: 1000, category: "Electronics" },
  { id: 2, name: "Phone", price: 500, category: "Electronics" },
  { id: 3, name: "Book", price: 20, category: "Education" },
];

// 传统方式（会修改原数组）
function updateProductPrice(products, id, newPrice) {
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], price: newPrice };
  }
  return products;
}

// 现代方式（不修改原数组）
function updateProductPriceImmutable(products, id, newPrice) {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return products;

  return products.with(index, {
    ...products[index],
    price: newPrice,
  });
}

// 使用示例
const originalProducts = [...products];
const updatedProducts = updateProductPriceImmutable(originalProducts, 1, 900);

console.log(originalProducts[0].price); // 1000 (不变)
console.log(updatedProducts[0].price); // 900

// 链式操作示例
const processedData = [5, 2, 8, 1, 9]
  .toSorted((a, b) => a - b) // 排序
  .with(0, 0) // 替换第一个元素
  .toReversed(); // 反转

console.log(processedData); // [9, 8, 5, 2, 0]
```

---

## 问题 8：Array 方法的性能考虑

### 性能对比

```javascript
// 性能测试函数
function performanceTest(name, fn, iterations = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
}

const largeArray = Array.from({ length: 10000 }, (_, i) => i);

// 1. 查找性能对比
performanceTest("indexOf", () => {
  largeArray.indexOf(5000);
});

performanceTest("includes", () => {
  largeArray.includes(5000);
});

performanceTest("find", () => {
  largeArray.find((x) => x === 5000);
});

// 2. 遍历性能对比
performanceTest("for loop", () => {
  let sum = 0;
  for (let i = 0; i < largeArray.length; i++) {
    sum += largeArray[i];
  }
});

performanceTest("forEach", () => {
  let sum = 0;
  largeArray.forEach((x) => (sum += x));
});

performanceTest("reduce", () => {
  largeArray.reduce((sum, x) => sum + x, 0);
});

// 3. 数组创建性能对比
performanceTest("Array constructor", () => {
  new Array(1000).fill(0);
});

performanceTest("Array.from", () => {
  Array.from({ length: 1000 }, () => 0);
});

performanceTest("Spread operator", () => {
  [...Array(1000)].map(() => 0);
});
```

### 最佳实践建议

```javascript
// 1. 选择合适的方法
const numbers = [1, 2, 3, 4, 5];

// ✅ 查找单个元素：使用 indexOf 或 includes
const hasThree = numbers.includes(3); // 比 find 更快

// ✅ 查找复杂条件：使用 find
const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}];
const user = users.find(u => u.id === 2);

// ✅ 检查所有元素：使用 every
const allPositive = numbers.every(n => n > 0);

// ✅ 检查部分元素：使用 some
const hasEven = numbers.some(n => n % 2 === 0);

// 2. 避免不必要的数组创建
// ❌ 创建临时数组
function processItems(items) {
  return items
    .map(item => ({ ...item, processed: true }))
    .filter(item => item.active)
    .map(item => item.name);
}

// ✅ 减少中间数组
function processItemsOptimized(items) {
  const result = [];
  for (const item of items) {
    if (item.active) {
      result.push(item.name);
    }
  }
  return result;
}

// 3. 合理使用链式调用
// ✅ 适度链式调用
const result = data
  .filter(item => item.active)
  .map(item => item.value)
  .reduce((sum, value) => sum + value, 0);

// ❌ 过度链式调用（可读性差）
const overChained = data
  .filter(a => a.x)
  .map(b => b.y)
  .filter(c => c > 0)
  .map(d => d * 2)
  .filter(e => e < 100)
  .reduce((f, g) => f + g, 0);

// 4. 大数据量处理
function processLargeArray(largeArray) {
  // ✅ 分批处理
  const batchSize = 1000;
  const results = [];

  for (let i = 0; i < largeArray.length; i += batchSize) {
    const batch = largeArray.slice(i, i + batchSize);
    const batchResult = batch.map(item => processItem(item));
    results.push(...batchResult);

    // 让出控制权，避免阻塞
    if (i % (batchSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}
```

---

## 总结

**Array API 分类总结**：

### 1. 修改原数组的方法

- `push()`, `pop()`, `shift()`, `unshift()` - 添加/删除元素
- `splice()` - 删除/插入/替换元素
- `sort()`, `reverse()` - 排序和反转
- `fill()`, `copyWithin()` - 填充和复制

### 2. 不修改原数组的方法

- `concat()`, `slice()` - 连接和切片
- `map()`, `filter()`, `reduce()` - 转换和归约
- `find()`, `findIndex()`, `indexOf()` - 查找
- `every()`, `some()`, `includes()` - 检测
- `join()`, `toString()` - 转换为字符串

### 3. 现代非变异方法 (ES2023)

- `toSorted()`, `toReversed()` - 非变异排序和反转
- `toSpliced()`, `with()` - 非变异拼接和替换
- `at()` - 支持负索引访问

### 4. 遍历方法

- `forEach()` - 基本遍历
- `map()` - 转换遍历
- `filter()` - 过滤遍历
- `reduce()`, `reduceRight()` - 归约遍历

### 5. 使用建议

- **性能优先**：选择最适合的方法，避免不必要的数组创建
- **可读性优先**：适度使用链式调用，保持代码清晰
- **不变性**：优先使用不修改原数组的方法
- **现代语法**：使用新的非变异方法提高代码质量

掌握这些 Array API 能够让你更高效地处理数组数据，写出更简洁、更易维护的代码。
