---
title: 什么是原型和原型链？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 JavaScript 的原型机制和原型链，掌握 prototype、__proto__、constructor 的关系，了解继承的实现原理和应用场景。
tags:
  - 原型
  - 原型链
  - 继承
  - 面向对象
estimatedTime: 26 分钟
keywords:
  - 原型
  - 原型链
  - prototype
  - __proto__
  - 继承
highlight: 原型链是 JavaScript 实现继承的核心机制，每个对象都有 __proto__ 指向其构造函数的 prototype
order: 382
---

## 问题 1：什么是原型？

原型（prototype）是 JavaScript 中实现**对象属性和方法共享**的机制。

### 基本概念

```javascript
// 每个函数都有一个 prototype 属性
function Person(name) {
  this.name = name;
}

console.log(Person.prototype); // { constructor: Person }

// 在 prototype 上添加方法
Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// 创建实例
const alice = new Person('Alice');
const bob = new Person('Bob');

// 实例可以访问原型上的方法
alice.sayHi(); // Hi, I'm Alice
bob.sayHi();   // Hi, I'm Bob

// 方法是共享的，不是每个实例都有一份
console.log(alice.sayHi === bob.sayHi); // true
```

### 为什么需要原型

```javascript
// 不使用原型：每个实例都有自己的方法副本
function Person(name) {
  this.name = name;
  
  // 每次创建实例都会创建新的函数
  this.sayHi = function() {
    console.log(`Hi, I'm ${this.name}`);
  };
}

const alice = new Person('Alice');
const bob = new Person('Bob');

console.log(alice.sayHi === bob.sayHi); // false（浪费内存）

// 使用原型：所有实例共享同一个方法
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const alice = new Person('Alice');
const bob = new Person('Bob');

console.log(alice.sayHi === bob.sayHi); // true（节省内存）
```

### prototype 的特点

```javascript
// 1. 只有函数有 prototype 属性
function Person() {}
console.log(Person.prototype); // { constructor: Person }

const obj = {};
console.log(obj.prototype); // undefined

// 2. prototype 是一个对象
console.log(typeof Person.prototype); // 'object'

// 3. prototype 默认有 constructor 属性
console.log(Person.prototype.constructor === Person); // true

// 4. 可以动态添加属性和方法
Person.prototype.age = 0;
Person.prototype.sayHi = function() {
  console.log('Hi');
};
```

---

## 问题 2：什么是 __proto__？

`__proto__` 是对象的内部属性，指向**创建该对象的构造函数的 prototype**。

### 基本概念

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const alice = new Person('Alice');

// __proto__ 指向构造函数的 prototype
console.log(alice.__proto__ === Person.prototype); // true

// 通过 __proto__ 可以访问原型上的方法
console.log(alice.__proto__.sayHi); // function

// 实例可以直接访问原型上的方法（通过原型链）
alice.sayHi(); // Hi, I'm Alice
```

### __proto__ vs prototype

```javascript
// prototype：函数的属性，指向原型对象
function Person() {}
console.log(Person.prototype); // 原型对象

// __proto__：对象的属性，指向构造函数的 prototype
const alice = new Person();
console.log(alice.__proto__); // 原型对象

// 两者指向同一个对象
console.log(alice.__proto__ === Person.prototype); // true

// 关系图：
// Person (函数)
//   ↓ prototype
// Person.prototype (对象)
//   ↑ __proto__
// alice (实例)
```

### Object.getPrototypeOf

```javascript
// __proto__ 不是标准属性（虽然被广泛支持）
// 推荐使用 Object.getPrototypeOf

function Person(name) {
  this.name = name;
}

const alice = new Person('Alice');

// 获取原型
console.log(Object.getPrototypeOf(alice) === Person.prototype); // true

// 设置原型
const obj = {};
Object.setPrototypeOf(obj, Person.prototype);
console.log(Object.getPrototypeOf(obj) === Person.prototype); // true

// 注意：Object.setPrototypeOf 性能较差，不推荐使用
```

---

## 问题 3：什么是原型链？

原型链是 JavaScript 实现**继承的核心机制**，通过 `__proto__` 连接形成的链式结构。

### 原型链的形成

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const alice = new Person('Alice');

// 原型链：
// alice
//   ↓ __proto__
// Person.prototype
//   ↓ __proto__
// Object.prototype
//   ↓ __proto__
// null

console.log(alice.__proto__ === Person.prototype); // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__ === null); // true
```

### 属性查找机制

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.age = 25;
Person.prototype.sayHi = function() {
  console.log('Hi');
};

const alice = new Person('Alice');

// 1. 访问实例自身的属性
console.log(alice.name); // 'Alice'（在实例上找到）

// 2. 访问原型上的属性
console.log(alice.age); // 25（在 Person.prototype 上找到）

// 3. 访问 Object.prototype 上的方法
console.log(alice.toString()); // [object Object]（在 Object.prototype 上找到）

// 4. 访问不存在的属性
console.log(alice.notExist); // undefined（原型链上都没找到）

// 属性查找顺序：
// alice -> Person.prototype -> Object.prototype -> null
```

### 原型链的终点

```javascript
// 原型链的终点是 null
function Person() {}
const alice = new Person();

console.log(alice.__proto__); // Person.prototype
console.log(alice.__proto__.__proto__); // Object.prototype
console.log(alice.__proto__.__proto__.__proto__); // null

// Object.prototype 是所有对象的原型
const obj = {};
console.log(obj.__proto__ === Object.prototype); // true

const arr = [];
console.log(arr.__proto__.__proto__ === Object.prototype); // true

function fn() {}
console.log(fn.__proto__.__proto__ === Object.prototype); // true
```

---

## 问题 4：constructor 属性是什么？

constructor 是原型对象的属性，指向**构造函数本身**。

### 基本概念

```javascript
function Person(name) {
  this.name = name;
}

// prototype 默认有 constructor 属性
console.log(Person.prototype.constructor === Person); // true

const alice = new Person('Alice');

// 实例可以通过原型链访问 constructor
console.log(alice.constructor === Person); // true

// 可以通过 constructor 创建新实例
const bob = new alice.constructor('Bob');
console.log(bob.name); // 'Bob'
console.log(bob instanceof Person); // true
```

### constructor 的作用

```javascript
// 1. 判断对象的类型
function Person() {}
function Animal() {}

const alice = new Person();
const cat = new Animal();

console.log(alice.constructor === Person); // true
console.log(cat.constructor === Animal); // true

// 2. 创建同类型的新实例
const bob = new alice.constructor();
console.log(bob instanceof Person); // true

// 3. 获取构造函数名称
console.log(alice.constructor.name); // 'Person'
```

### 注意事项

```javascript
// 重写 prototype 会丢失 constructor
function Person() {}

Person.prototype = {
  sayHi() {
    console.log('Hi');
  }
};

const alice = new Person();
console.log(alice.constructor === Person); // false
console.log(alice.constructor === Object); // true（指向 Object）

// 解决方法：手动设置 constructor
Person.prototype = {
  constructor: Person, // 手动设置
  sayHi() {
    console.log('Hi');
  }
};

const bob = new Person();
console.log(bob.constructor === Person); // true
```

---

## 问题 5：如何判断属性是在实例上还是原型上？

使用 `hasOwnProperty` 和 `in` 操作符可以判断属性的位置。

### hasOwnProperty

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.age = 25;

const alice = new Person('Alice');

// hasOwnProperty：判断属性是否在实例自身上
console.log(alice.hasOwnProperty('name')); // true
console.log(alice.hasOwnProperty('age'));  // false

// 可以访问，但不是自身属性
console.log(alice.age); // 25
```

### in 操作符

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.age = 25;

const alice = new Person('Alice');

// in 操作符：判断属性是否可访问（包括原型链）
console.log('name' in alice); // true
console.log('age' in alice);  // true
console.log('notExist' in alice); // false

// 判断属性是否只在原型上
function hasPrototypeProperty(obj, prop) {
  return !obj.hasOwnProperty(prop) && (prop in obj);
}

console.log(hasPrototypeProperty(alice, 'name')); // false
console.log(hasPrototypeProperty(alice, 'age'));  // true
```

### Object.keys 和 Object.getOwnPropertyNames

```javascript
function Person(name) {
  this.name = name;
  this.age = 25;
}

Person.prototype.sayHi = function() {
  console.log('Hi');
};

const alice = new Person('Alice');

// Object.keys：获取实例自身的可枚举属性
console.log(Object.keys(alice)); // ['name', 'age']

// Object.getOwnPropertyNames：获取实例自身的所有属性（包括不可枚举）
console.log(Object.getOwnPropertyNames(alice)); // ['name', 'age']

// for...in：遍历实例自身和原型上的可枚举属性
for (let key in alice) {
  console.log(key); // name, age, sayHi
}

// 只遍历实例自身的属性
for (let key in alice) {
  if (alice.hasOwnProperty(key)) {
    console.log(key); // name, age
  }
}
```

---

## 问题 6：如何实现继承？

JavaScript 通过原型链实现继承，有多种实现方式。

### 原型链继承

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// 子类
function Child(name, age) {
  this.age = age;
}

// 继承：子类的原型指向父类的实例
Child.prototype = new Parent();

const child1 = new Child('Alice', 10);
child1.sayHi(); // Hi, I'm undefined

// 问题 1：无法向父类构造函数传参
// 问题 2：引用类型属性被所有实例共享
const child2 = new Child('Bob', 12);
child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue', 'green']
```

### 构造函数继承

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// 子类
function Child(name, age) {
  // 调用父类构造函数
  Parent.call(this, name);
  this.age = age;
}

const child1 = new Child('Alice', 10);
console.log(child1.name); // 'Alice'

const child2 = new Child('Bob', 12);
child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue']（不共享）

// 问题：无法继承父类原型上的方法
child1.sayHi(); // TypeError: child1.sayHi is not a function
```

### 组合继承

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// 子类
function Child(name, age) {
  // 继承属性
  Parent.call(this, name);
  this.age = age;
}

// 继承方法
Child.prototype = new Parent();
Child.prototype.constructor = Child;

const child1 = new Child('Alice', 10);
child1.sayHi(); // Hi, I'm Alice

const child2 = new Child('Bob', 12);
child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue']

// 问题：调用了两次父类构造函数
// 1. Parent.call(this, name)
// 2. new Parent()
```

### 寄生组合继承（最佳方式）

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

// 子类
function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

// 继承方法：使用 Object.create
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

// 子类自己的方法
Child.prototype.sayAge = function() {
  console.log(`I'm ${this.age} years old`);
};

const child = new Child('Alice', 10);
child.sayHi();  // Hi, I'm Alice
child.sayAge(); // I'm 10 years old

console.log(child instanceof Child);  // true
console.log(child instanceof Parent); // true
```

### ES6 Class 继承

```javascript
// 父类
class Parent {
  constructor(name) {
    this.name = name;
    this.colors = ['red', 'blue'];
  }
  
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

// 子类
class Child extends Parent {
  constructor(name, age) {
    super(name); // 调用父类构造函数
    this.age = age;
  }
  
  sayAge() {
    console.log(`I'm ${this.age} years old`);
  }
}

const child = new Child('Alice', 10);
child.sayHi();  // Hi, I'm Alice
child.sayAge(); // I'm 10 years old

console.log(child instanceof Child);  // true
console.log(child instanceof Parent); // true
```

---

## 问题 7：原型链的实际应用有哪些？

理解原型链有助于更好地使用 JavaScript 的特性。

### 扩展内置对象

```javascript
// 给 Array 添加方法
Array.prototype.last = function() {
  return this[this.length - 1];
};

const arr = [1, 2, 3];
console.log(arr.last()); // 3

// 注意：不推荐修改内置对象的原型
// 可能导致命名冲突和兼容性问题

// 更好的做法：使用工具函数
function last(arr) {
  return arr[arr.length - 1];
}

console.log(last([1, 2, 3])); // 3
```

### 实现私有属性

```javascript
// 使用闭包和原型实现私有属性
function Person(name, age) {
  // 私有变量
  let _age = age;
  
  // 公共属性
  this.name = name;
  
  // 公共方法（通过闭包访问私有变量）
  this.getAge = function() {
    return _age;
  };
  
  this.setAge = function(age) {
    if (age > 0 && age < 150) {
      _age = age;
    }
  };
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}, ${this.getAge()} years old`);
};

const alice = new Person('Alice', 25);
console.log(alice.name);    // 'Alice'
console.log(alice._age);    // undefined（私有）
console.log(alice.getAge()); // 25
alice.sayHi(); // Hi, I'm Alice, 25 years old
```

### 实现多态

```javascript
// 父类
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    console.log(`${this.name} makes a sound`);
  }
}

// 子类 1
class Dog extends Animal {
  speak() {
    console.log(`${this.name} barks`);
  }
}

// 子类 2
class Cat extends Animal {
  speak() {
    console.log(`${this.name} meows`);
  }
}

// 多态：同一个方法，不同的实现
const animals = [
  new Dog('Buddy'),
  new Cat('Whiskers'),
  new Animal('Generic')
];

animals.forEach(animal => {
  animal.speak();
});
// Buddy barks
// Whiskers meows
// Generic makes a sound
```

### 实现混入（Mixin）

```javascript
// 混入模式：将多个对象的方法混合到一个对象中
const canEat = {
  eat() {
    console.log(`${this.name} is eating`);
  }
};

const canWalk = {
  walk() {
    console.log(`${this.name} is walking`);
  }
};

const canSwim = {
  swim() {
    console.log(`${this.name} is swimming`);
  }
};

// 混入函数
function mixin(target, ...sources) {
  Object.assign(target, ...sources);
}

// 使用
class Person {
  constructor(name) {
    this.name = name;
  }
}

mixin(Person.prototype, canEat, canWalk);

const alice = new Person('Alice');
alice.eat();  // Alice is eating
alice.walk(); // Alice is walking

// 鸭子类型的混入
class Duck {
  constructor(name) {
    this.name = name;
  }
}

mixin(Duck.prototype, canEat, canWalk, canSwim);

const duck = new Duck('Donald');
duck.eat();  // Donald is eating
duck.walk(); // Donald is walking
duck.swim(); // Donald is swimming
```

---

## 总结

**原型和原型链的核心要点**：

### 1. 原型（prototype）
- 函数的属性，指向原型对象
- 用于实现属性和方法的共享
- 默认有 constructor 属性

### 2. __proto__
- 对象的属性，指向构造函数的 prototype
- 形成原型链的关键
- 推荐使用 Object.getPrototypeOf

### 3. 原型链
- 通过 __proto__ 连接形成的链式结构
- 实现继承的核心机制
- 终点是 Object.prototype（其 __proto__ 为 null）

### 4. 属性查找
- 先在实例自身查找
- 再沿着原型链向上查找
- 直到找到或到达原型链终点

### 5. 继承方式
- 原型链继承（有缺陷）
- 构造函数继承（无法继承原型方法）
- 组合继承（调用两次父类构造函数）
- **寄生组合继承**（最佳方式）
- ES6 Class 继承（语法糖）

### 6. 实际应用
- 扩展内置对象（不推荐）
- 实现私有属性
- 实现多态
- 实现混入模式

### 7. 关键关系
```
实例.__proto__ === 构造函数.prototype
构造函数.prototype.constructor === 构造函数
实例.constructor === 构造函数
```

## 延伸阅读

- [MDN - 继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [MDN - Object.prototype](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype)
- [深入理解 JavaScript 原型](https://github.com/mqyqingfeng/Blog/issues/2)
- [JavaScript 原型链详解](https://javascript.info/prototype-inheritance)
