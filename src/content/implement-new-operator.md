---
title: 如何实现一个类似关键字 new 功能的函数？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 new 关键字的工作原理，掌握如何手动实现 new 的功能，包括对象创建、原型链接、构造函数执行、返回值处理等核心步骤。
tags:
  - new 关键字
  - 构造函数
  - 原型链
  - 对象创建
estimatedTime: 24 分钟
keywords:
  - new
  - 构造函数
  - 原型
  - 对象创建
  - 手写实现
highlight: 理解 new 的本质是创建对象、设置原型、执行构造函数、处理返回值四个步骤
order: 105
---

## 问题 1：new 关键字做了什么？

在实现 new 之前，需要先理解 new 关键字的工作原理。当使用 `new` 调用构造函数时，JavaScript 引擎会执行一系列操作。

### new 的基本使用

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

// 使用 new 创建实例
const person = new Person('Alice', 25);

console.log(person.name); // 'Alice'
console.log(person.age);  // 25
person.sayHello();        // 'Hello, I'm Alice'

// 实例继承了原型上的方法
console.log(person.__proto__ === Person.prototype); // true
```

### new 执行的步骤

```javascript
// 当执行 new Person('Alice', 25) 时，发生了以下步骤：

// 1. 创建一个新的空对象
const obj = {};

// 2. 将新对象的 __proto__ 指向构造函数的 prototype
obj.__proto__ = Person.prototype;

// 3. 将构造函数的 this 绑定到新对象，并执行构造函数
const result = Person.call(obj, 'Alice', 25);

// 4. 如果构造函数返回了对象，则返回该对象；否则返回新创建的对象
const finalResult = (typeof result === 'object' && result !== null) ? result : obj;
```

### new 的核心特点

- **创建新对象**：每次调用都创建一个全新的对象
- **原型链接**：新对象继承构造函数的原型
- **this 绑定**：构造函数内的 this 指向新对象
- **返回值处理**：根据构造函数的返回值决定最终返回什么

---

## 问题 2：如何实现一个基础版的 new？

理解了 new 的工作原理后，我们可以实现一个基础版的 `myNew` 函数。

### 基础实现

```javascript
function myNew(constructor, ...args) {
  // 1. 创建一个新对象，并将其原型指向构造函数的 prototype
  const obj = Object.create(constructor.prototype);
  
  // 2. 执行构造函数，将 this 绑定到新对象
  const result = constructor.apply(obj, args);
  
  // 3. 如果构造函数返回了对象，则返回该对象；否则返回新对象
  return (typeof result === 'object' && result !== null) ? result : obj;
}

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const person = myNew(Person, 'Bob', 30);

console.log(person.name);     // 'Bob'
console.log(person.age);      // 30
person.sayHello();            // 'Hello, I'm Bob'
console.log(person instanceof Person); // true
```

### 不使用 Object.create 的实现

```javascript
function myNew(constructor, ...args) {
  // 1. 手动创建对象并设置原型
  const obj = {};
  obj.__proto__ = constructor.prototype;
  
  // 或者使用 Object.setPrototypeOf
  // Object.setPrototypeOf(obj, constructor.prototype);
  
  // 2. 执行构造函数
  const result = constructor.apply(obj, args);
  
  // 3. 返回结果
  return (typeof result === 'object' && result !== null) ? result : obj;
}

// 测试
const person = myNew(Person, 'Charlie', 28);
console.log(person.name); // 'Charlie'
```

### 关键点说明

- **Object.create()**：创建一个新对象，并将其原型设置为指定对象
- **apply()**：调用函数并绑定 this，传入参数数组
- **返回值判断**：必须判断是否为对象类型，null 也是 object 类型需要排除

---

## 问题 3：如何处理构造函数的返回值？

构造函数的返回值处理是 new 实现中的关键点，不同类型的返回值会有不同的处理逻辑。

### 返回对象的情况

```javascript
function PersonWithReturn(name) {
  this.name = name;
  
  // 返回一个新对象
  return {
    name: 'Override',
    type: 'custom'
  };
}

// 使用原生 new
const p1 = new PersonWithReturn('Alice');
console.log(p1.name); // 'Override'
console.log(p1.type); // 'custom'
console.log(p1 instanceof PersonWithReturn); // false - 返回的是新对象

// 使用 myNew
const p2 = myNew(PersonWithReturn, 'Bob');
console.log(p2.name); // 'Override'
console.log(p2.type); // 'custom'
```

### 返回基本类型的情况

```javascript
function PersonWithPrimitive(name) {
  this.name = name;
  
  // 返回基本类型会被忽略
  return 'string';
  // return 123;
  // return true;
  // return undefined;
  // return null; // 注意：null 是特殊情况
}

const p1 = new PersonWithPrimitive('Alice');
console.log(p1.name); // 'Alice' - 基本类型返回值被忽略
console.log(p1 instanceof PersonWithPrimitive); // true

const p2 = myNew(PersonWithPrimitive, 'Bob');
console.log(p2.name); // 'Bob'
```

### 返回 null 的特殊情况

```javascript
function PersonWithNull(name) {
  this.name = name;
  return null; // null 虽然 typeof 是 'object'，但应该被忽略
}

// 完善的返回值判断
function myNew(constructor, ...args) {
  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  
  // 判断返回值是否为对象（排除 null）
  return (result !== null && typeof result === 'object') ? result : obj;
}

const p = myNew(PersonWithNull, 'Alice');
console.log(p.name); // 'Alice' - null 被正确忽略
console.log(p instanceof PersonWithNull); // true
```

### 返回函数的情况

```javascript
function PersonWithFunction(name) {
  this.name = name;
  
  // 返回函数（函数也是对象）
  return function() {
    return 'I am a function';
  };
}

const p = new PersonWithFunction('Alice');
console.log(typeof p); // 'function'
console.log(p());      // 'I am a function'
console.log(p instanceof PersonWithFunction); // false
```

---

## 问题 4：如何处理边界情况和错误？

一个健壮的 new 实现需要处理各种边界情况，如非函数参数、箭头函数等。

### 检查构造函数类型

```javascript
function myNew(constructor, ...args) {
  // 1. 检查第一个参数是否为函数
  if (typeof constructor !== 'function') {
    throw new TypeError('Constructor must be a function');
  }
  
  // 2. 创建新对象
  const obj = Object.create(constructor.prototype);
  
  // 3. 执行构造函数
  const result = constructor.apply(obj, args);
  
  // 4. 返回结果
  return (result !== null && typeof result === 'object') ? result : obj;
}

// 测试错误处理
try {
  myNew('not a function', 'arg');
} catch (error) {
  console.log(error.message); // 'Constructor must be a function'
}

try {
  myNew(123, 'arg');
} catch (error) {
  console.log(error.message); // 'Constructor must be a function'
}
```

### 处理箭头函数

```javascript
// 箭头函数不能作为构造函数
const ArrowFunc = (name) => {
  this.name = name;
};

// 原生 new 会报错
try {
  new ArrowFunc('Alice');
} catch (error) {
  console.log(error.message); // 'ArrowFunc is not a constructor'
}

// 改进的 myNew：检查是否有 prototype
function myNew(constructor, ...args) {
  if (typeof constructor !== 'function') {
    throw new TypeError('Constructor must be a function');
  }
  
  // 箭头函数没有 prototype 属性
  if (!constructor.prototype) {
    throw new TypeError(`${constructor.name} is not a constructor`);
  }
  
  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  
  return (result !== null && typeof result === 'object') ? result : obj;
}

// 测试
try {
  myNew(ArrowFunc, 'Alice');
} catch (error) {
  console.log(error.message); // 'ArrowFunc is not a constructor'
}
```

### 处理内置构造函数

```javascript
// 某些内置构造函数需要特殊处理
function myNew(constructor, ...args) {
  if (typeof constructor !== 'function') {
    throw new TypeError('Constructor must be a function');
  }
  
  if (!constructor.prototype) {
    throw new TypeError(`${constructor.name} is not a constructor`);
  }
  
  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  
  return (result !== null && typeof result === 'object') ? result : obj;
}

// 测试普通构造函数
const arr = myNew(Array, 1, 2, 3);
console.log(arr); // [1, 2, 3]
console.log(arr instanceof Array); // true

// 注意：某些内置构造函数（如 Date）可能无法完全模拟
const date = myNew(Date, '2024-01-01');
console.log(date instanceof Date); // true
// 但 date 可能不会像真正的 Date 对象那样工作
```

---

## 问题 5：如何支持 new.target？

ES6 引入了 `new.target`，用于检测函数是否通过 new 调用。虽然无法完全模拟，但可以了解其原理。

### new.target 的作用

```javascript
function Person(name) {
  // new.target 指向被 new 调用的构造函数
  console.log('new.target:', new.target);
  
  if (!new.target) {
    throw new Error('Person must be called with new');
  }
  
  this.name = name;
}

// 使用 new 调用
const p1 = new Person('Alice');
// 输出：new.target: [Function: Person]

// 直接调用
try {
  Person('Bob');
} catch (error) {
  console.log(error.message); // 'Person must be called with new'
}
```

### 模拟 new.target 的思路

```javascript
// 无法完全模拟 new.target，但可以通过其他方式检测
function Person(name) {
  // 检查 this 是否为 Person 的实例
  if (!(this instanceof Person)) {
    throw new Error('Person must be called with new');
  }
  
  this.name = name;
}

// 使用 new 调用
const p1 = new Person('Alice'); // 正常

// 直接调用
try {
  Person('Bob'); // this 指向全局对象，不是 Person 实例
} catch (error) {
  console.log(error.message); // 'Person must be called with new'
}

// 使用 myNew
const p2 = myNew(Person, 'Charlie'); // 正常
```

### 继承场景下的 new.target

```javascript
class Parent {
  constructor() {
    console.log('Parent new.target:', new.target.name);
  }
}

class Child extends Parent {
  constructor() {
    super();
    console.log('Child new.target:', new.target.name);
  }
}

const child = new Child();
// 输出：
// Parent new.target: Child
// Child new.target: Child

// new.target 在继承链中指向最初被 new 调用的构造函数
```

---

## 问题 6：完整的 myNew 实现

综合以上所有要点，实现一个完整、健壮的 myNew 函数。

### 完整实现

```javascript
/**
 * 模拟 new 关键字的功能
 * @param {Function} constructor - 构造函数
 * @param {...any} args - 传递给构造函数的参数
 * @returns {Object} 新创建的实例对象
 */
function myNew(constructor, ...args) {
  // 1. 参数验证：检查是否为函数
  if (typeof constructor !== 'function') {
    throw new TypeError(
      `${constructor} is not a constructor`
    );
  }
  
  // 2. 检查是否为箭头函数或其他不可构造的函数
  if (!constructor.prototype) {
    throw new TypeError(
      `${constructor.name || 'anonymous'} is not a constructor`
    );
  }
  
  // 3. 创建新对象，原型指向构造函数的 prototype
  const instance = Object.create(constructor.prototype);
  
  // 4. 执行构造函数，绑定 this 到新对象
  const result = constructor.apply(instance, args);
  
  // 5. 判断构造函数的返回值
  // 如果返回值是对象（且不为 null），则返回该对象
  // 否则返回新创建的实例
  const isObject = result !== null && typeof result === 'object';
  const isFunction = typeof result === 'function';
  
  return (isObject || isFunction) ? result : instance;
}

// 导出函数（如果在模块中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = myNew;
}
```

### 测试用例

```javascript
// 测试 1：基本功能
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function() {
  return `Hello, I'm ${this.name}`;
};

const p1 = myNew(Person, 'Alice', 25);
console.log(p1.name);           // 'Alice'
console.log(p1.age);            // 25
console.log(p1.sayHello());     // 'Hello, I'm Alice'
console.log(p1 instanceof Person); // true

// 测试 2：构造函数返回对象
function PersonWithReturn(name) {
  this.name = name;
  return { customName: 'Custom' };
}

const p2 = myNew(PersonWithReturn, 'Bob');
console.log(p2.customName);     // 'Custom'
console.log(p2.name);           // undefined
console.log(p2 instanceof PersonWithReturn); // false

// 测试 3：构造函数返回基本类型
function PersonWithPrimitive(name) {
  this.name = name;
  return 'ignored';
}

const p3 = myNew(PersonWithPrimitive, 'Charlie');
console.log(p3.name);           // 'Charlie'
console.log(p3 instanceof PersonWithPrimitive); // true

// 测试 4：错误处理 - 非函数
try {
  myNew('not a function');
} catch (error) {
  console.log('Error:', error.message);
}

// 测试 5：错误处理 - 箭头函数
const ArrowFunc = () => {};
try {
  myNew(ArrowFunc);
} catch (error) {
  console.log('Error:', error.message);
}

// 测试 6：继承
function Animal(type) {
  this.type = type;
}

Animal.prototype.getType = function() {
  return this.type;
};

function Dog(name) {
  Animal.call(this, 'dog');
  this.name = name;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = myNew(Dog, 'Buddy');
console.log(dog.name);          // 'Buddy'
console.log(dog.type);          // 'dog'
console.log(dog.getType());     // 'dog'
console.log(dog instanceof Dog);    // true
console.log(dog instanceof Animal); // true
```

---

## 问题 7：myNew 与原生 new 的差异

虽然 myNew 可以模拟 new 的大部分功能，但仍有一些差异和限制。

### 无法完全模拟的特性

```javascript
// 1. new.target 无法模拟
function Constructor() {
  console.log(new.target); // 使用 new 时有值，使用 myNew 时为 undefined
}

new Constructor();    // [Function: Constructor]
myNew(Constructor);   // undefined

// 2. 某些内置构造函数的特殊行为
const date1 = new Date();
const date2 = myNew(Date);

console.log(date1.getTime()); // 正常工作
// date2.getTime() 可能无法正常工作，因为内置对象有内部槽位
```

### 使用场景对比

```javascript
// ✅ 适合使用 myNew 的场景
// - 理解 new 的工作原理
// - 面试题和学习
// - 自定义构造函数

// ❌ 不适合使用 myNew 的场景
// - 生产环境代码（应使用原生 new）
// - 内置构造函数（Date、RegExp 等）
// - 需要 new.target 的场景
```

### 原型链对比

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function() {
  return `Hello, ${this.name}`;
};

const p1 = new Person('Alice');
const p2 = myNew(Person, 'Bob');

// 原型链完全一致
console.log(p1.__proto__ === Person.prototype); // true
console.log(p2.__proto__ === Person.prototype); // true

console.log(p1.__proto__ === p2.__proto__); // true

// instanceof 检查一致
console.log(p1 instanceof Person); // true
console.log(p2 instanceof Person); // true

// 构造函数引用一致
console.log(p1.constructor === Person); // true
console.log(p2.constructor === Person); // true
```

### 实际应用建议

```javascript
// 在实际开发中，始终使用原生 new
class User {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return `Hi, I'm ${this.name}`;
  }
}

// ✅ 推荐
const user1 = new User('Alice');

// ❌ 不推荐（除非是学习目的）
const user2 = myNew(User, 'Bob');

// 理解 myNew 的实现有助于：
// 1. 深入理解 JavaScript 对象创建机制
// 2. 理解原型链的工作原理
// 3. 理解构造函数的执行过程
// 4. 应对面试中的手写题
```

---

## 总结

**实现 new 关键字的核心要点**：

### 1. new 的四个步骤

- 创建一个新的空对象
- 设置对象的原型为构造函数的 prototype
- 执行构造函数，this 绑定到新对象
- 根据返回值决定最终返回什么

### 2. 关键实现技术

- `Object.create()` 创建对象并设置原型
- `apply()` 或 `call()` 绑定 this 并执行函数
- 返回值类型判断（对象、函数 vs 基本类型）

### 3. 边界情况处理

- 检查构造函数是否为函数类型
- 检查是否为箭头函数（无 prototype）
- 正确处理 null 返回值
- 处理返回对象和基本类型的不同情况

### 4. 返回值规则

- 返回对象或函数：使用该返回值
- 返回基本类型或 null：使用新创建的对象
- 无返回值（undefined）：使用新创建的对象

### 5. 原型链设置

- 新对象的 `__proto__` 指向构造函数的 `prototype`
- 保证 `instanceof` 检查正确
- 继承原型上的方法和属性

### 6. 与原生 new 的差异

- 无法模拟 `new.target`
- 某些内置构造函数可能无法完全模拟
- 仅用于学习和理解，生产环境使用原生 new

**学习价值**：

- 深入理解 JavaScript 对象创建机制
- 掌握原型和原型链的工作原理
- 理解 this 绑定的不同方式
- 提升对构造函数的理解

## 延伸阅读

- [MDN - new 运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new)
- [MDN - Object.create()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [MDN - Function.prototype.apply()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- [MDN - new.target](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new.target)
- [MDN - 继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [JavaScript 深入之 new 的模拟实现](https://github.com/mqyqingfeng/Blog/issues/13)
