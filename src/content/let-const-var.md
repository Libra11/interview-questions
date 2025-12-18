---
title: let 和 const 与 var 的区别是什么？
category: JavaScript
difficulty: 入门
updatedAt: 2025-11-16
summary: >-
  深入理解 ES6 引入的 let 和 const 与传统 var 的区别，掌握作用域、变量提升、暂时性死区等核心概念，学习在实际开发中如何正确选择和使用。
tags:
  - 变量声明
  - ES6
  - 作用域
  - 变量提升
estimatedTime: 20 分钟
keywords:
  - let
  - const
  - var
  - 作用域
  - 变量提升
  - 暂时性死区
highlight: let 和 const 具有块级作用域，不存在变量提升，const 声明的是常量引用而非常量值
order: 393
---

## 问题 1：作用域有什么区别？

var 是**函数作用域**，let 和 const 是**块级作用域**。

### var 的函数作用域

```javascript
// var 是函数作用域
function testVar() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10（可以访问）
}

testVar();

// var 在函数外声明是全局作用域
var globalVar = 'global';
console.log(window.globalVar); // 'global'（浏览器环境）

// 循环中的 var
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 3, 3, 3（都是同一个 i）
  }, 100);
}
```

### let 和 const 的块级作用域

```javascript
// let 和 const 是块级作用域
function testLet() {
  if (true) {
    let x = 10;
    const y = 20;
  }
  console.log(x); // ReferenceError: x is not defined
  console.log(y); // ReferenceError: y is not defined
}

// 块级作用域的范围
{
  let blockScoped = 'block';
  console.log(blockScoped); // 'block'
}
console.log(blockScoped); // ReferenceError

// 循环中的 let
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i); // 0, 1, 2（每次循环都是新的 i）
  }, 100);
}

// let 和 const 不会成为全局对象的属性
let globalLet = 'global';
const globalConst = 'global';
console.log(window.globalLet); // undefined
console.log(window.globalConst); // undefined
```

### 块级作用域的实际应用

```javascript
// 1. 避免变量污染
// ❌ 使用 var
for (var i = 0; i < 5; i++) {
  // ...
}
console.log(i); // 5（污染了外部作用域）

// ✅ 使用 let
for (let i = 0; i < 5; i++) {
  // ...
}
console.log(i); // ReferenceError（不会污染外部作用域）

// 2. 创建独立的作用域
// ❌ 使用 var
var buttons = [];
for (var i = 0; i < 3; i++) {
  buttons[i] = function() {
    console.log(i); // 都是 3
  };
}
buttons[0](); // 3
buttons[1](); // 3

// ✅ 使用 let
var buttons = [];
for (let i = 0; i < 3; i++) {
  buttons[i] = function() {
    console.log(i); // 分别是 0, 1, 2
  };
}
buttons[0](); // 0
buttons[1](); // 1
```

---

## 问题 2：变量提升有什么区别？

var 存在**变量提升**，let 和 const 不存在变量提升（准确说是存在暂时性死区）。

### var 的变量提升

```javascript
// var 会被提升到函数或全局作用域顶部
console.log(x); // undefined（不报错）
var x = 10;
console.log(x); // 10

// 等价于
var x; // 声明被提升
console.log(x); // undefined
x = 10; // 赋值留在原地
console.log(x); // 10

// 函数中的变量提升
function test() {
  console.log(y); // undefined
  var y = 20;
  console.log(y); // 20
}

test();
```

### let 和 const 的暂时性死区

```javascript
// let 和 const 不存在变量提升
console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 10;

console.log(y); // ReferenceError: Cannot access 'y' before initialization
const y = 20;

// 暂时性死区（Temporal Dead Zone, TDZ）
// 从块的开始到变量声明之前的区域
{
  // TDZ 开始
  console.log(x); // ReferenceError
  
  let x = 10; // TDZ 结束
  console.log(x); // 10
}

// typeof 在 TDZ 中也会报错
typeof x; // ReferenceError
let x = 10;

// 对比 var
typeof y; // undefined（不报错）
var y = 10;
```

### 为什么会有暂时性死区

```javascript
// 暂时性死区的设计目的：
// 1. 避免在声明前使用变量
// 2. 让代码更容易理解和维护
// 3. 减少潜在的 bug

// 示例：参数默认值与暂时性死区
function test(x = y, y = 2) {
  console.log(x, y);
}

test(); // ReferenceError: Cannot access 'y' before initialization

// 正确的写法
function test(y = 2, x = y) {
  console.log(x, y);
}

test(); // 2 2
```

---

## 问题 3：能否重复声明？

var 可以**重复声明**，let 和 const 不可以。

### var 的重复声明

```javascript
// var 可以重复声明
var x = 10;
var x = 20; // 不报错
console.log(x); // 20

// 函数中也可以
function test() {
  var y = 1;
  var y = 2;
  console.log(y); // 2
}

test();

// 甚至可以先使用后声明
console.log(z); // undefined
var z = 30;
var z = 40;
console.log(z); // 40
```

### let 和 const 不能重复声明

```javascript
// let 不能重复声明
let x = 10;
let x = 20; // SyntaxError: Identifier 'x' has already been declared

// const 也不能重复声明
const y = 10;
const y = 20; // SyntaxError: Identifier 'y' has already been declared

// 在同一作用域内，let/const 与 var 也不能重复
var a = 1;
let a = 2; // SyntaxError

// 但在不同作用域可以
let b = 1;
{
  let b = 2; // 不报错，是不同的变量
  console.log(b); // 2
}
console.log(b); // 1
```

---

## 问题 4：const 声明的常量能修改吗？

const 声明的是**常量引用**，而不是常量值。

### 基本类型不能修改

```javascript
// 基本类型：不能重新赋值
const x = 10;
x = 20; // TypeError: Assignment to constant variable

const name = 'Alice';
name = 'Bob'; // TypeError

const flag = true;
flag = false; // TypeError

// 必须在声明时初始化
const y; // SyntaxError: Missing initializer in const declaration
```

### 引用类型可以修改内容

```javascript
// 对象：可以修改属性
const obj = { name: 'Alice', age: 25 };
obj.name = 'Bob'; // ✅ 可以修改属性
obj.age = 30;
console.log(obj); // { name: 'Bob', age: 30 }

obj = {}; // ❌ TypeError: Assignment to constant variable

// 数组：可以修改元素
const arr = [1, 2, 3];
arr.push(4); // ✅ 可以添加元素
arr[0] = 10; // ✅ 可以修改元素
console.log(arr); // [10, 2, 3, 4]

arr = []; // ❌ TypeError: Assignment to constant variable

// 原因：const 保证的是引用地址不变，而不是值不变
const person = { name: 'Alice' };
// person 变量存储的是对象的引用地址
// 修改对象属性不会改变引用地址
person.name = 'Bob'; // ✅ 引用地址没变

// 重新赋值会改变引用地址
person = { name: 'Charlie' }; // ❌ 引用地址变了
```

### 如何创建真正的常量

```javascript
// 使用 Object.freeze 冻结对象
const obj = Object.freeze({ name: 'Alice', age: 25 });

obj.name = 'Bob'; // 严格模式下报错，非严格模式下静默失败
console.log(obj.name); // 'Alice'（没有改变）

// 但 Object.freeze 是浅冻结
const person = Object.freeze({
  name: 'Alice',
  address: { city: 'Beijing' }
});

person.name = 'Bob'; // 无效
person.address.city = 'Shanghai'; // ✅ 可以修改（嵌套对象没有被冻结）
console.log(person.address.city); // 'Shanghai'

// 深度冻结
function deepFreeze(obj) {
  Object.freeze(obj);
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      deepFreeze(obj[key]);
    }
  });
  
  return obj;
}

const person = deepFreeze({
  name: 'Alice',
  address: { city: 'Beijing' }
});

person.address.city = 'Shanghai'; // 无效
console.log(person.address.city); // 'Beijing'
```

---

## 问题 5：如何选择使用 var、let 还是 const？

根据实际需求选择合适的声明方式。

### 使用建议

```javascript
// 1. 优先使用 const
// 对于不需要重新赋值的变量，使用 const
const PI = 3.14159;
const MAX_SIZE = 100;
const config = { api: 'https://api.example.com' };

// 2. 需要重新赋值时使用 let
// 循环变量
for (let i = 0; i < 10; i++) {
  console.log(i);
}

// 需要修改的变量
let count = 0;
count++;
count += 5;

// 3. 避免使用 var
// var 的作用域规则容易导致 bug
// 在现代 JavaScript 中应该避免使用

// ❌ 不推荐
var x = 10;

// ✅ 推荐
const x = 10; // 或 let x = 10;
```

### 实际应用场景

```javascript
// 场景 1：函数参数（使用 const）
function greet(name) {
  // 参数 name 相当于 const name
  // name = 'other'; // 如果需要修改，应该创建新变量
  const greeting = `Hello, ${name}`;
  return greeting;
}

// 场景 2：循环（使用 let）
// 计数器
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// 遍历数组
const arr = [1, 2, 3, 4, 5];
for (let item of arr) {
  console.log(item);
}

// 场景 3：配置对象（使用 const）
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

// 可以修改属性
config.timeout = 10000;

// 场景 4：累加器（使用 let）
let sum = 0;
for (let i = 1; i <= 100; i++) {
  sum += i;
}
console.log(sum);

// 场景 5：条件赋值（使用 let）
let status;
if (score >= 60) {
  status = 'pass';
} else {
  status = 'fail';
}

// 更好的写法：使用 const
const status = score >= 60 ? 'pass' : 'fail';
```

### ESLint 规则

```javascript
// ESLint 推荐规则
// "prefer-const": "error" - 优先使用 const
// "no-var": "error" - 禁止使用 var

// 示例：ESLint 会提示的问题
let x = 10; // Warning: 'x' is never reassigned. Use 'const' instead.
console.log(x);

// 修复
const x = 10;
console.log(x);

// 正确使用 let
let count = 0;
count++; // 有重新赋值，使用 let 是正确的
```

---

## 问题 6：在循环中的表现有何不同？

let 在循环中会创建独立的作用域，var 不会。

### for 循环中的区别

```javascript
// var 在循环中的问题
var funcs = [];
for (var i = 0; i < 3; i++) {
  funcs[i] = function() {
    console.log(i);
  };
}

funcs[0](); // 3
funcs[1](); // 3
funcs[2](); // 3
// 所有函数共享同一个 i

// let 在循环中创建独立作用域
var funcs = [];
for (let i = 0; i < 3; i++) {
  funcs[i] = function() {
    console.log(i);
  };
}

funcs[0](); // 0
funcs[1](); // 1
funcs[2](); // 2
// 每次循环都创建新的 i

// 等价于
var funcs = [];
for (let i = 0; i < 3; i++) {
  let _i = i; // 每次循环创建新的变量
  funcs[i] = function() {
    console.log(_i);
  };
}
```

### 异步操作中的区别

```javascript
// var 的问题
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
// 输出：3, 3, 3

// 使用 IIFE 解决（ES5 方案）
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(() => {
      console.log(j);
    }, 100);
  })(i);
}
// 输出：0, 1, 2

// 使用 let（ES6 方案）
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
// 输出：0, 1, 2
```

### 实际应用

```javascript
// 示例：给多个按钮绑定事件
// HTML: <button>Button 0</button> <button>Button 1</button> <button>Button 2</button>

// ❌ 使用 var
const buttons = document.querySelectorAll('button');
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', function() {
    console.log('Button ' + i + ' clicked'); // 都是最后一个索引
  });
}

// ✅ 使用 let
const buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', function() {
    console.log('Button ' + i + ' clicked'); // 正确的索引
  });
}

// ✅ 更好的方式：使用 forEach
const buttons = document.querySelectorAll('button');
buttons.forEach((button, i) => {
  button.addEventListener('click', () => {
    console.log('Button ' + i + ' clicked');
  });
});
```

---

## 问题 7：有哪些常见的陷阱和注意事项？

使用 let 和 const 时需要注意的问题。

### 暂时性死区陷阱

```javascript
// 陷阱 1：typeof 在 TDZ 中会报错
typeof x; // ReferenceError
let x = 10;

// 对比 var
typeof y; // undefined
var y = 10;

// 陷阱 2：函数参数默认值
function test(x = y, y = 2) {
  return [x, y];
}
test(); // ReferenceError: Cannot access 'y' before initialization

// 正确写法
function test(y = 2, x = y) {
  return [x, y];
}
test(); // [2, 2]

// 陷阱 3：隐藏的全局变量
function test() {
  x = 10; // 没有声明，创建全局变量
  let y = 20;
}
test();
console.log(x); // 10（全局变量）
console.log(y); // ReferenceError
```

### const 的陷阱

```javascript
// 陷阱 1：const 对象可以修改
const obj = { name: 'Alice' };
obj.name = 'Bob'; // ✅ 可以修改
obj.age = 25;     // ✅ 可以添加属性

// 陷阱 2：const 数组可以修改
const arr = [1, 2, 3];
arr.push(4);    // ✅ 可以添加元素
arr[0] = 10;    // ✅ 可以修改元素
arr.length = 0; // ✅ 可以清空数组

// 陷阱 3：循环中的 const
// ❌ 错误：const 不能重新赋值
for (const i = 0; i < 3; i++) { // TypeError
  console.log(i);
}

// ✅ 正确：for...of 中可以使用 const
const arr = [1, 2, 3];
for (const item of arr) {
  console.log(item); // 每次循环都是新的 const
}
```

### 最佳实践

```javascript
// 1. 默认使用 const，需要重新赋值时使用 let
const name = 'Alice';
let count = 0;

// 2. 不要使用 var
// ❌ 避免
var x = 10;

// ✅ 推荐
const x = 10;

// 3. 在块的开始声明变量
{
  // ✅ 好的做法
  const x = 10;
  let y = 20;
  
  // 使用 x 和 y
  console.log(x, y);
}

// 4. 一次只声明一个变量
// ❌ 不推荐
let a = 1, b = 2, c = 3;

// ✅ 推荐
let a = 1;
let b = 2;
let c = 3;

// 或者
const a = 1;
const b = 2;
const c = 3;

// 5. 避免在声明前使用变量
// ❌ 不好
console.log(x);
let x = 10;

// ✅ 好
let x = 10;
console.log(x);
```

---

## 总结

**var、let、const 的核心区别**：

### 1. 作用域
- **var**：函数作用域
- **let/const**：块级作用域

### 2. 变量提升
- **var**：存在变量提升，声明提升到顶部
- **let/const**：存在暂时性死区（TDZ）

### 3. 重复声明
- **var**：可以重复声明
- **let/const**：不能重复声明

### 4. 重新赋值
- **var/let**：可以重新赋值
- **const**：不能重新赋值（但对象/数组内容可修改）

### 5. 全局对象属性
- **var**：会成为全局对象的属性
- **let/const**：不会成为全局对象的属性

### 6. 循环中的表现
- **var**：共享同一个变量
- **let**：每次循环创建新变量
- **const**：for...of 中可用，普通 for 不可用

### 7. 使用建议
- 优先使用 **const**
- 需要重新赋值时使用 **let**
- 避免使用 **var**

## 延伸阅读

- [MDN - let](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let)
- [MDN - const](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/const)
- [ES6 变量声明](https://es6.ruanyifeng.com/#docs/let)
- [暂时性死区详解](https://javascript.info/var)
