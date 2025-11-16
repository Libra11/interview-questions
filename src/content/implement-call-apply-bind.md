---
title: 如何手写实现 call、apply、bind？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 call、apply、bind 的作用和区别，掌握手写实现这三个方法的原理和技巧，了解边界情况的处理。
tags:
  - this绑定
  - 函数方法
  - 手写实现
  - 原型方法
estimatedTime: 26 分钟
keywords:
  - call
  - apply
  - bind
  - this
  - 函数绑定
highlight: call、apply、bind 都用于改变函数的 this 指向，区别在于参数传递方式和执行时机
order: 116
---

## 问题 1：call、apply、bind 的作用和区别是什么？

这三个方法都用于**改变函数执行时的 this 指向**，但在参数传递和执行时机上有所不同。

### 基本用法

```javascript
const person = {
  name: 'Alice',
  age: 25
};

function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}, ${this.age} years old${punctuation}`);
}

// call：立即执行，参数逐个传递
greet.call(person, 'Hello', '!');
// 输出：Hello, I'm Alice, 25 years old!

// apply：立即执行，参数以数组传递
greet.apply(person, ['Hi', '.']);
// 输出：Hi, I'm Alice, 25 years old.

// bind：返回新函数，不立即执行
const boundGreet = greet.bind(person, 'Hey');
boundGreet('~');
// 输出：Hey, I'm Alice, 25 years old~
```

### 核心区别

```javascript
// 1. 执行时机
// call 和 apply：立即执行函数
greet.call(person, 'Hello', '!');    // 立即执行
greet.apply(person, ['Hello', '!']); // 立即执行

// bind：返回新函数，需要手动调用
const fn = greet.bind(person, 'Hello', '!');
fn(); // 调用时才执行

// 2. 参数传递方式
// call：参数逐个传递
func.call(thisArg, arg1, arg2, arg3);

// apply：参数以数组传递
func.apply(thisArg, [arg1, arg2, arg3]);

// bind：参数可以分批传递（柯里化）
const fn1 = func.bind(thisArg, arg1);
fn1(arg2, arg3); // 参数合并

// 3. 返回值
// call 和 apply：返回函数执行结果
const result = func.call(thisArg, arg);

// bind：返回绑定后的新函数
const newFunc = func.bind(thisArg, arg);
```

### 使用场景对比

```javascript
// call：参数数量固定且较少
Math.max.call(null, 1, 2, 3, 4, 5); // 5

// apply：参数数量不确定或已经是数组
const numbers = [1, 2, 3, 4, 5];
Math.max.apply(null, numbers); // 5

// bind：需要保存函数供后续调用
const button = document.getElementById('btn');
button.addEventListener('click', handler.handleClick.bind(handler));
```

---

## 问题 2：如何手写实现 call？

call 的核心是**将函数作为对象的方法调用**，从而改变 this 指向。

### 基础实现

```javascript
// 在 Function.prototype 上添加 myCall 方法
Function.prototype.myCall = function(context, ...args) {
  // 1. 处理 context：null 或 undefined 时指向全局对象
  context = context || globalThis;
  
  // 2. 将函数作为 context 的方法
  // 使用 Symbol 避免属性名冲突
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // 3. 调用方法，此时 this 指向 context
  const result = context[fnSymbol](...args);
  
  // 4. 删除临时属性
  delete context[fnSymbol];
  
  // 5. 返回结果
  return result;
};

// 测试
function greet(greeting) {
  console.log(`${greeting}, I'm ${this.name}`);
}

const person = { name: 'Alice' };
greet.myCall(person, 'Hello'); // Hello, I'm Alice
```

### 处理边界情况

```javascript
Function.prototype.myCall = function(context, ...args) {
  // 处理 context 为 null 或 undefined
  if (context == null) {
    context = globalThis;
  }
  
  // 处理 context 为原始值（数字、字符串、布尔值）
  // 需要转换为对象
  context = Object(context);
  
  // 使用 Symbol 确保属性名唯一
  const fnSymbol = Symbol('fn');
  context[fnSymbol] = this;
  
  // 调用函数
  const result = context[fnSymbol](...args);
  
  // 清理临时属性
  delete context[fnSymbol];
  
  return result;
};

// 测试边界情况
function test() {
  console.log(this);
}

test.myCall(null);    // globalThis
test.myCall(123);     // Number {123}
test.myCall('hello'); // String {'hello'}
```

### 完整实现

```javascript
Function.prototype.myCall = function(context, ...args) {
  // 1. 检查调用者是否为函数
  if (typeof this !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  // 2. 处理 context
  if (context == null) {
    context = globalThis;
  } else {
    context = Object(context);
  }
  
  // 3. 创建唯一的属性名
  const fnSymbol = Symbol('fn');
  
  // 4. 将函数设置为 context 的方法
  context[fnSymbol] = this;
  
  // 5. 执行函数
  const result = context[fnSymbol](...args);
  
  // 6. 删除临时属性
  delete context[fnSymbol];
  
  // 7. 返回结果
  return result;
};
```

---

## 问题 3：如何手写实现 apply？

apply 与 call 的实现几乎相同，只是**参数接收方式不同**。

### 基础实现

```javascript
Function.prototype.myApply = function(context, argsArray) {
  // 1. 检查调用者是否为函数
  if (typeof this !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  // 2. 处理 context
  if (context == null) {
    context = globalThis;
  } else {
    context = Object(context);
  }
  
  // 3. 处理参数：apply 接收数组或类数组
  if (argsArray == null) {
    argsArray = [];
  }
  
  // 4. 创建唯一的属性名
  const fnSymbol = Symbol('fn');
  
  // 5. 将函数设置为 context 的方法
  context[fnSymbol] = this;
  
  // 6. 执行函数，使用扩展运算符展开数组
  const result = context[fnSymbol](...argsArray);
  
  // 7. 删除临时属性
  delete context[fnSymbol];
  
  // 8. 返回结果
  return result;
};

// 测试
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person = { name: 'Alice' };
greet.myApply(person, ['Hello', '!']); // Hello, I'm Alice!
```

### call 和 apply 的对比

```javascript
// 两者的实现几乎相同，只是参数处理不同

// call：接收参数列表
Function.prototype.myCall = function(context, ...args) {
  // ...
  const result = context[fnSymbol](...args);
  // ...
};

// apply：接收参数数组
Function.prototype.myApply = function(context, argsArray) {
  // ...
  const result = context[fnSymbol](...argsArray);
  // ...
};

// 实际上可以互相实现
Function.prototype.myCall = function(context, ...args) {
  return this.myApply(context, args);
};

Function.prototype.myApply = function(context, argsArray) {
  return this.myCall(context, ...argsArray);
};
```

---

## 问题 4：如何手写实现 bind？

bind 的实现比 call 和 apply 复杂，需要**返回新函数并支持柯里化**。

### 基础实现

```javascript
Function.prototype.myBind = function(context, ...args) {
  // 1. 保存原函数
  const fn = this;
  
  // 2. 检查调用者是否为函数
  if (typeof fn !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  // 3. 返回新函数
  return function(...newArgs) {
    // 4. 合并参数：bind 时的参数 + 调用时的参数
    const allArgs = [...args, ...newArgs];
    
    // 5. 使用 apply 改变 this 并执行
    return fn.apply(context, allArgs);
  };
};

// 测试
function greet(greeting, punctuation) {
  console.log(`${greeting}, I'm ${this.name}${punctuation}`);
}

const person = { name: 'Alice' };
const boundGreet = greet.myBind(person, 'Hello');
boundGreet('!'); // Hello, I'm Alice!
```

### 支持 new 调用

```javascript
// bind 返回的函数可以作为构造函数使用
// 此时 this 指向新创建的实例，而不是 bind 时指定的对象

Function.prototype.myBind = function(context, ...args) {
  const fn = this;
  
  if (typeof fn !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  // 返回的新函数
  const boundFn = function(...newArgs) {
    const allArgs = [...args, ...newArgs];
    
    // 判断是否通过 new 调用
    // 如果是 new 调用，this 指向新创建的实例
    // 否则使用 bind 时指定的 context
    return fn.apply(
      this instanceof boundFn ? this : context,
      allArgs
    );
  };
  
  return boundFn;
};

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.myBind(null, 'Alice');
const person = new BoundPerson(25);

console.log(person.name); // Alice
console.log(person.age);  // 25
```

### 完整实现

```javascript
Function.prototype.myBind = function(context, ...args) {
  // 1. 保存原函数
  const fn = this;
  
  // 2. 检查调用者是否为函数
  if (typeof fn !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  // 3. 创建绑定函数
  const boundFn = function(...newArgs) {
    // 合并参数
    const allArgs = [...args, ...newArgs];
    
    // 判断是否通过 new 调用
    // new 调用时，this 指向新实例
    // 普通调用时，this 指向 context
    const thisArg = this instanceof boundFn ? this : context;
    
    // 执行原函数
    return fn.apply(thisArg, allArgs);
  };
  
  // 4. 继承原函数的原型
  if (fn.prototype) {
    // 使用 Object.create 创建原型链
    boundFn.prototype = Object.create(fn.prototype);
  }
  
  // 5. 返回绑定函数
  return boundFn;
};

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// new 调用
const BoundPerson = Person.myBind(null, 'Alice');
const person = new BoundPerson(25);
person.sayHi(); // Hi, I'm Alice
console.log(person instanceof Person); // true
```

---

## 问题 5：三个方法的实际应用场景有哪些？

了解实际应用场景有助于选择合适的方法。

### call 的应用场景

```javascript
// 1. 类型判断
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType([]));    // Array
console.log(getType({}));    // Object
console.log(getType(null));  // Null

// 2. 类数组对象借用数组方法
function toArray() {
  return Array.prototype.slice.call(arguments);
}

const arr = toArray(1, 2, 3);
console.log(arr); // [1, 2, 3]

// 3. 继承
function Parent(name) {
  this.name = name;
}

function Child(name, age) {
  Parent.call(this, name); // 调用父类构造函数
  this.age = age;
}

const child = new Child('Alice', 10);
console.log(child.name); // Alice
```

### apply 的应用场景

```javascript
// 1. 求数组的最大值/最小值
const numbers = [1, 5, 3, 9, 2];
const max = Math.max.apply(null, numbers);
console.log(max); // 9

// 现代写法：使用扩展运算符
const max2 = Math.max(...numbers);

// 2. 数组合并
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];

Array.prototype.push.apply(arr1, arr2);
console.log(arr1); // [1, 2, 3, 4, 5, 6]

// 3. 将参数数组传递给函数
function sum(a, b, c) {
  return a + b + c;
}

const args = [1, 2, 3];
const result = sum.apply(null, args);
console.log(result); // 6
```

### bind 的应用场景

```javascript
// 1. 事件处理器
class Counter {
  constructor() {
    this.count = 0;
    this.button = document.getElementById('btn');
    
    // 使用 bind 绑定 this
    this.button.addEventListener('click', this.increment.bind(this));
  }
  
  increment() {
    this.count++;
    console.log(this.count);
  }
}

// 2. 定时器
class Timer {
  constructor() {
    this.seconds = 0;
  }
  
  start() {
    setInterval(this.tick.bind(this), 1000);
  }
  
  tick() {
    this.seconds++;
    console.log(this.seconds);
  }
}

// 3. 函数柯里化
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// 4. 偏函数应用
function log(level, message) {
  console.log(`[${level}] ${message}`);
}

const info = log.bind(null, 'INFO');
const error = log.bind(null, 'ERROR');

info('应用启动');   // [INFO] 应用启动
error('发生错误');  // [ERROR] 发生错误
```

---

## 问题 6：实现中的常见问题和优化是什么？

了解常见问题和优化技巧可以写出更健壮的代码。

### 常见问题

```javascript
// 问题 1：Symbol 的兼容性
// 如果环境不支持 Symbol，可以使用随机字符串
Function.prototype.myCall = function(context, ...args) {
  context = context || globalThis;
  
  // 生成唯一的属性名
  const fnKey = '__fn__' + Math.random().toString(36).slice(2);
  
  context[fnKey] = this;
  const result = context[fnKey](...args);
  delete context[fnKey];
  
  return result;
};

// 问题 2：原始值的处理
Function.prototype.myCall = function(context, ...args) {
  if (context == null) {
    context = globalThis;
  } else {
    // 转换为对象：Number(123), String('hello')
    context = Object(context);
  }
  // ...
};

// 问题 3：bind 的 new 调用判断
Function.prototype.myBind = function(context, ...args) {
  const fn = this;
  
  const boundFn = function(...newArgs) {
    // 通过 instanceof 判断是否为 new 调用
    return fn.apply(
      this instanceof boundFn ? this : context,
      [...args, ...newArgs]
    );
  };
  
  // 继承原型
  if (fn.prototype) {
    boundFn.prototype = Object.create(fn.prototype);
  }
  
  return boundFn;
};
```

### 使用 try-finally 确保清理

```javascript
Function.prototype.myCall = function(context, ...args) {
  if (typeof this !== 'function') {
    throw new TypeError('调用者必须是函数');
  }
  
  context = context == null ? globalThis : Object(context);
  const fnSymbol = Symbol();
  
  context[fnSymbol] = this;
  
  try {
    return context[fnSymbol](...args);
  } finally {
    // 确保无论如何都会删除临时属性
    delete context[fnSymbol];
  }
};
```

---

## 问题 7：如何测试实现的正确性？

编写完整的测试用例验证实现。

### 测试用例

```javascript
// 测试 call
function testCall() {
  console.log('=== 测试 myCall ===');
  
  // 测试 1：基本功能
  function greet(greeting) {
    return `${greeting}, ${this.name}`;
  }
  
  const person = { name: 'Alice' };
  console.assert(
    greet.myCall(person, 'Hello') === 'Hello, Alice',
    '基本功能测试失败'
  );
  
  // 测试 2：多个参数
  function sum(a, b, c) {
    return a + b + c + this.base;
  }
  
  const obj = { base: 10 };
  console.assert(
    sum.myCall(obj, 1, 2, 3) === 16,
    '多参数测试失败'
  );
  
  // 测试 3：原始值 context
  function getThis() {
    return this;
  }
  
  console.assert(
    getThis.myCall(123) instanceof Number,
    '原始值 context 测试失败'
  );
  
  console.log('myCall 测试通过！');
}

// 测试 bind
function testBind() {
  console.log('=== 测试 myBind ===');
  
  // 测试 1：基本功能
  function greet(greeting) {
    return `${greeting}, ${this.name}`;
  }
  
  const person = { name: 'Alice' };
  const boundGreet = greet.myBind(person);
  
  console.assert(
    boundGreet('Hello') === 'Hello, Alice',
    'bind 基本功能测试失败'
  );
  
  // 测试 2：柯里化
  function sum(a, b, c) {
    return a + b + c;
  }
  
  const add5 = sum.myBind(null, 5);
  console.assert(
    add5(3, 2) === 10,
    'bind 柯里化测试失败'
  );
  
  // 测试 3：new 调用
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }
  
  const BoundPerson = Person.myBind(null, 'Alice');
  const p = new BoundPerson(25);
  
  console.assert(
    p.name === 'Alice' && p.age === 25,
    'bind new 调用测试失败'
  );
  
  console.log('myBind 测试通过！');
}

testCall();
testBind();
```

---

## 总结

**call、apply、bind 的核心要点**：

### 1. 基本概念
- 三者都用于改变函数的 this 指向
- call 和 apply 立即执行，bind 返回新函数
- call 参数逐个传递，apply 参数以数组传递

### 2. 实现原理
- **核心思想**：将函数作为对象的方法调用
- 使用 Symbol 避免属性名冲突
- 使用 try-finally 确保清理临时属性

### 3. call 和 apply 实现
- 处理 context 为 null/undefined 的情况
- 处理 context 为原始值的情况
- 执行后删除临时属性

### 4. bind 实现
- 返回新函数，支持柯里化
- 支持 new 调用（instanceof 判断）
- 继承原函数的原型

### 5. 应用场景
- **call**：类型判断、数组方法借用、继承
- **apply**：数组最大值、数组合并、参数数组传递
- **bind**：事件处理器、定时器、函数柯里化

### 6. 注意事项
- Symbol 的兼容性处理
- 原始值需要转换为对象
- bind 需要正确处理 new 调用
- 使用 try-finally 确保清理

## 延伸阅读

- [MDN - Function.prototype.call()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call)
- [MDN - Function.prototype.apply()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- [MDN - Function.prototype.bind()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- [深入理解 JavaScript 中的 this](https://github.com/mqyqingfeng/Blog/issues/7)
