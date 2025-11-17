---
title: JavaScript 中继承方式有哪些？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  全面解析 JavaScript 中的六种继承方式，从原型链继承到 ES6 Class 继承，深入理解每种方式的实现原理、优缺点和适用场景。
tags:
  - 继承
  - 原型链
  - 面向对象
  - ES6
estimatedTime: 30 分钟
keywords:
  - 继承
  - 原型链继承
  - 构造函数继承
  - 组合继承
  - 寄生组合继承
  - Class继承
highlight: 寄生组合继承是 ES5 中最完善的继承方式，ES6 的 Class 继承本质上是寄生组合继承的语法糖
order: 120
---

## 问题 1：什么是原型链继承？

原型链继承是通过**将子类的原型指向父类的实例**来实现继承。

### 基本实现

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue', 'green'];
}

Parent.prototype.getName = function() {
  return this.name;
};

// 子类
function Child(age) {
  this.age = age;
}

// 核心：子类原型指向父类实例
Child.prototype = new Parent('parent');

// 创建实例
const child1 = new Child(10);
const child2 = new Child(20);

console.log(child1.getName()); // 'parent'
console.log(child1.colors);    // ['red', 'blue', 'green']

// 可以访问父类原型上的方法
console.log(child1 instanceof Child);  // true
console.log(child1 instanceof Parent); // true
```

### 原型链继承的问题

```javascript
// 问题 1：引用类型的属性被所有实例共享
function Parent() {
  this.colors = ['red', 'blue'];
}

function Child() {}

Child.prototype = new Parent();

const child1 = new Child();
const child2 = new Child();

child1.colors.push('green');

console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue', 'green'] ❌ 被共享了

// 问题 2：创建子类实例时，无法向父类构造函数传参
function Parent(name) {
  this.name = name;
}

function Child(age) {
  this.age = age;
  // 无法在这里给 Parent 传参
}

Child.prototype = new Parent(); // 只能在这里传固定值

const child = new Child(10);
console.log(child.name); // undefined
```

### 优缺点总结

```javascript
// 优点：
// 1. 实现简单，容易理解
// 2. 可以访问父类原型上的方法和属性

// 缺点：
// 1. 引用类型的属性被所有实例共享
// 2. 创建子类实例时无法向父类构造函数传参
// 3. 无法实现多继承
```

---

## 问题 2：什么是构造函数继承？

构造函数继承通过**在子类构造函数中调用父类构造函数**来实现继承。

### 基本实现

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
  
  this.getName = function() {
    return this.name;
  };
}

Parent.prototype.sayHi = function() {
  console.log('Hi');
};

// 子类
function Child(name, age) {
  // 核心：调用父类构造函数
  Parent.call(this, name);
  this.age = age;
}

// 创建实例
const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 20);

console.log(child1.name); // 'Alice'
console.log(child1.age);  // 10

// 引用类型不会被共享
child1.colors.push('green');
console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue'] ✅ 不共享
```

### 构造函数继承的问题

```javascript
// 问题：无法继承父类原型上的方法
function Parent(name) {
  this.name = name;
}

Parent.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

const child = new Child('Alice', 10);

console.log(child.name); // 'Alice' ✅
child.sayHi(); // TypeError: child.sayHi is not a function ❌

// 原因：只继承了构造函数中的属性，没有继承原型
console.log(child instanceof Parent); // false
```

### 优缺点总结

```javascript
// 优点：
// 1. 避免了引用类型的属性被所有实例共享
// 2. 可以在子类构造函数中向父类传参
// 3. 可以实现多继承（调用多个父类构造函数）

function Parent1(name) {
  this.name = name;
}

function Parent2(age) {
  this.age = age;
}

function Child(name, age) {
  Parent1.call(this, name);
  Parent2.call(this, age);
}

const child = new Child('Alice', 10);
console.log(child.name, child.age); // 'Alice' 10

// 缺点：
// 1. 无法继承父类原型上的方法
// 2. 每次创建实例都会创建一遍方法（浪费内存）
// 3. instanceof 检测不出父类
```

---

## 问题 3：什么是组合继承？

组合继承结合了**原型链继承和构造函数继承**，是 JavaScript 中最常用的继承模式。

### 基本实现

```javascript
// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.getName = function() {
  return this.name;
};

// 子类
function Child(name, age) {
  // 第一次调用父类构造函数：继承实例属性
  Parent.call(this, name);
  this.age = age;
}

// 第二次调用父类构造函数：继承原型方法
Child.prototype = new Parent();
Child.prototype.constructor = Child;

Child.prototype.getAge = function() {
  return this.age;
};

// 创建实例
const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 20);

// 可以向父类传参
console.log(child1.name); // 'Alice'
console.log(child2.name); // 'Bob'

// 引用类型不会被共享
child1.colors.push('green');
console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue']

// 可以访问父类原型上的方法
console.log(child1.getName()); // 'Alice'
console.log(child1.getAge());  // 10

// instanceof 正常
console.log(child1 instanceof Child);  // true
console.log(child1 instanceof Parent); // true
```

### 组合继承的问题

```javascript
// 问题：调用了两次父类构造函数
function Parent(name) {
  console.log('Parent constructor called');
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.getName = function() {
  return this.name;
};

function Child(name, age) {
  Parent.call(this, name); // 第一次调用
  this.age = age;
}

Child.prototype = new Parent(); // 第二次调用
Child.prototype.constructor = Child;

const child = new Child('Alice', 10);
// 输出：
// Parent constructor called
// Parent constructor called

// 结果：子类原型上有多余的属性
console.log(Child.prototype); 
// { name: undefined, colors: ['red', 'blue'], constructor: Child }
```

### 优缺点总结

```javascript
// 优点：
// 1. 融合了原型链继承和构造函数继承的优点
// 2. 可以向父类传参
// 3. 引用类型不会被共享
// 4. 可以访问父类原型上的方法
// 5. instanceof 和 isPrototypeOf 都能正常使用

// 缺点：
// 1. 调用了两次父类构造函数
// 2. 子类原型上有多余的属性
```

---

## 问题 4：什么是原型式继承？

原型式继承是通过**创建一个临时构造函数**，将传入的对象作为这个构造函数的原型。

### 基本实现

```javascript
// 原型式继承的核心函数
function object(o) {
  function F() {}
  F.prototype = o;
  return new F();
}

// 使用
const parent = {
  name: 'parent',
  colors: ['red', 'blue'],
  getName() {
    return this.name;
  }
};

const child1 = object(parent);
const child2 = object(parent);

console.log(child1.getName()); // 'parent'

// 可以添加自己的属性
child1.age = 10;
console.log(child1.age); // 10

// 引用类型会被共享
child1.colors.push('green');
console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue', 'green'] ❌
```

### Object.create

```javascript
// ES5 提供了 Object.create 方法
// 规范化了原型式继承

const parent = {
  name: 'parent',
  colors: ['red', 'blue'],
  getName() {
    return this.name;
  }
};

// 基本用法
const child1 = Object.create(parent);
console.log(child1.getName()); // 'parent'

// 可以传入第二个参数定义新属性
const child2 = Object.create(parent, {
  age: {
    value: 10,
    writable: true,
    enumerable: true,
    configurable: true
  }
});

console.log(child2.age); // 10
```

### 优缺点总结

```javascript
// 优点：
// 1. 实现简单
// 2. 适合不需要单独创建构造函数的场景

// 缺点：
// 1. 引用类型的属性会被所有实例共享
// 2. 无法传递参数
```

---

## 问题 5：什么是寄生式继承？

寄生式继承是在**原型式继承的基础上增强对象**，返回新对象。

### 基本实现

```javascript
// 寄生式继承
function createAnother(original) {
  // 通过原型式继承创建新对象
  const clone = Object.create(original);
  
  // 增强对象：添加新方法
  clone.sayHi = function() {
    console.log('Hi');
  };
  
  // 返回新对象
  return clone;
}

// 使用
const parent = {
  name: 'parent',
  colors: ['red', 'blue']
};

const child1 = createAnother(parent);
const child2 = createAnother(parent);

child1.sayHi(); // 'Hi'
console.log(child1.name); // 'parent'

// 引用类型仍然会被共享
child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue', 'green']
```

### 实际应用

```javascript
// 创建增强对象的工厂函数
function createPerson(name, age) {
  const person = {
    name: name,
    age: age
  };
  
  // 添加方法
  person.sayHi = function() {
    console.log(`Hi, I'm ${this.name}`);
  };
  
  person.getAge = function() {
    return this.age;
  };
  
  return person;
}

const alice = createPerson('Alice', 25);
const bob = createPerson('Bob', 30);

alice.sayHi(); // Hi, I'm Alice
console.log(bob.getAge()); // 30

// 问题：每个实例都有自己的方法副本
console.log(alice.sayHi === bob.sayHi); // false
```

### 优缺点总结

```javascript
// 优点：
// 1. 可以在不创建构造函数的情况下实现继承
// 2. 适合主要关注对象而不是类型和构造函数的场景

// 缺点：
// 1. 引用类型的属性会被共享
// 2. 每次创建对象都会创建一遍方法（无法复用）
```

---

## 问题 6：什么是寄生组合式继承？

寄生组合式继承是**最理想的继承方式**，解决了组合继承调用两次父类构造函数的问题。

### 基本实现

```javascript
// 核心函数：继承原型
function inheritPrototype(child, parent) {
  // 创建父类原型的副本
  const prototype = Object.create(parent.prototype);
  
  // 修正 constructor
  prototype.constructor = child;
  
  // 将副本赋值给子类原型
  child.prototype = prototype;
}

// 父类
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}

Parent.prototype.getName = function() {
  return this.name;
};

// 子类
function Child(name, age) {
  // 继承实例属性
  Parent.call(this, name);
  this.age = age;
}

// 继承原型方法
inheritPrototype(Child, Parent);

Child.prototype.getAge = function() {
  return this.age;
};

// 创建实例
const child1 = new Child('Alice', 10);
const child2 = new Child('Bob', 20);

console.log(child1.getName()); // 'Alice'
console.log(child1.getAge());  // 10

// 引用类型不会被共享
child1.colors.push('green');
console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue']

// instanceof 正常
console.log(child1 instanceof Child);  // true
console.log(child1 instanceof Parent); // true
```

### 与组合继承的对比

```javascript
// 组合继承：调用两次父类构造函数
function Parent(name) {
  console.log('Parent constructor');
  this.name = name;
}

function Child(name, age) {
  Parent.call(this, name); // 第一次
  this.age = age;
}

Child.prototype = new Parent(); // 第二次
Child.prototype.constructor = Child;

// ---

// 寄生组合继承：只调用一次父类构造函数
function Parent(name) {
  console.log('Parent constructor');
  this.name = name;
}

function Child(name, age) {
  Parent.call(this, name); // 只调用一次
  this.age = age;
}

// 不调用 Parent 构造函数
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
```

### 完整示例

```javascript
// 封装继承函数
function extend(Child, Parent) {
  // 继承原型
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  
  // 保存父类引用（可选）
  Child.super = Parent;
}

// 父类
function Animal(name) {
  this.name = name;
  this.sleep = function() {
    console.log(`${this.name} is sleeping`);
  };
}

Animal.prototype.eat = function(food) {
  console.log(`${this.name} is eating ${food}`);
};

// 子类
function Dog(name, breed) {
  // 调用父类构造函数
  Animal.call(this, name);
  this.breed = breed;
}

// 继承
extend(Dog, Animal);

// 添加子类方法
Dog.prototype.bark = function() {
  console.log(`${this.name} is barking`);
};

// 使用
const dog = new Dog('Buddy', 'Golden Retriever');
dog.eat('bone');   // Buddy is eating bone
dog.sleep();       // Buddy is sleeping
dog.bark();        // Buddy is barking

console.log(dog instanceof Dog);    // true
console.log(dog instanceof Animal); // true
```

### 优缺点总结

```javascript
// 优点：
// 1. 只调用一次父类构造函数
// 2. 避免了在子类原型上创建多余的属性
// 3. 原型链保持不变
// 4. 能够正常使用 instanceof 和 isPrototypeOf
// 5. 是目前最成熟的继承方式

// 缺点：
// 1. 实现相对复杂（需要理解原型链）
```

---

## 问题 7：ES6 Class 继承是怎样的？

ES6 引入了 Class 语法，提供了更清晰、更接近传统面向对象语言的继承方式。

### 基本实现

```javascript
// 父类
class Parent {
  constructor(name) {
    this.name = name;
    this.colors = ['red', 'blue'];
  }
  
  getName() {
    return this.name;
  }
  
  static staticMethod() {
    console.log('Static method');
  }
}

// 子类
class Child extends Parent {
  constructor(name, age) {
    // 必须先调用 super
    super(name);
    this.age = age;
  }
  
  getAge() {
    return this.age;
  }
  
  // 重写父类方法
  getName() {
    return `Child: ${super.getName()}`;
  }
}

// 创建实例
const child = new Child('Alice', 10);

console.log(child.getName()); // 'Child: Alice'
console.log(child.getAge());  // 10

// 引用类型不会被共享
const child2 = new Child('Bob', 20);
child.colors.push('green');
console.log(child2.colors); // ['red', 'blue']

// instanceof 正常
console.log(child instanceof Child);  // true
console.log(child instanceof Parent); // true

// 静态方法也会被继承
Child.staticMethod(); // 'Static method'
```

### Class 的特性

```javascript
// 1. constructor 方法
class Person {
  constructor(name) {
    this.name = name;
  }
}

// 2. 实例方法
class Person {
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

// 3. 静态方法
class Person {
  static create(name) {
    return new Person(name);
  }
}

const person = Person.create('Alice');

// 4. getter 和 setter
class Person {
  constructor(name) {
    this._name = name;
  }
  
  get name() {
    return this._name;
  }
  
  set name(value) {
    if (value.length > 0) {
      this._name = value;
    }
  }
}

const person = new Person('Alice');
console.log(person.name); // 'Alice'
person.name = 'Bob';
console.log(person.name); // 'Bob'

// 5. 私有属性（ES2022）
class Person {
  #age; // 私有属性
  
  constructor(name, age) {
    this.name = name;
    this.#age = age;
  }
  
  getAge() {
    return this.#age;
  }
}

const person = new Person('Alice', 25);
console.log(person.name);    // 'Alice'
console.log(person.#age);    // SyntaxError
console.log(person.getAge()); // 25
```

### super 关键字

```javascript
class Parent {
  constructor(name) {
    this.name = name;
  }
  
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
  
  static staticMethod() {
    console.log('Parent static');
  }
}

class Child extends Parent {
  constructor(name, age) {
    // 1. 调用父类构造函数
    super(name);
    this.age = age;
  }
  
  sayHi() {
    // 2. 调用父类方法
    super.sayHi();
    console.log(`I'm ${this.age} years old`);
  }
  
  static staticMethod() {
    // 3. 调用父类静态方法
    super.staticMethod();
    console.log('Child static');
  }
}

const child = new Child('Alice', 10);
child.sayHi();
// Hi, I'm Alice
// I'm 10 years old

Child.staticMethod();
// Parent static
// Child static
```

### Class 继承的本质

```javascript
// Class 本质上是构造函数的语法糖
class Person {
  constructor(name) {
    this.name = name;
  }
  
  sayHi() {
    console.log('Hi');
  }
}

// 等价于
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log('Hi');
};

// Class 继承本质上是寄生组合继承
class Child extends Parent {
  constructor(name, age) {
    super(name);
    this.age = age;
  }
}

// 等价于
function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
```

### 优缺点总结

```javascript
// 优点：
// 1. 语法简洁清晰，更接近传统面向对象语言
// 2. 继承更加直观（extends 关键字）
// 3. 支持静态方法继承
// 4. 支持 super 关键字
// 5. 内置了最佳实践（寄生组合继承）

// 缺点：
// 1. 不支持多继承
// 2. 必须使用 new 调用
// 3. 本质上还是基于原型的继承（只是语法糖）
```

---

## 总结

**JavaScript 继承方式对比**：

### 1. 原型链继承
- **实现**：`Child.prototype = new Parent()`
- **优点**：简单易懂
- **缺点**：引用类型共享、无法传参

### 2. 构造函数继承
- **实现**：`Parent.call(this)`
- **优点**：避免引用类型共享、可传参
- **缺点**：无法继承原型方法

### 3. 组合继承
- **实现**：构造函数 + 原型链
- **优点**：结合两者优点
- **缺点**：调用两次父类构造函数

### 4. 原型式继承
- **实现**：`Object.create(parent)`
- **优点**：简单
- **缺点**：引用类型共享

### 5. 寄生式继承
- **实现**：原型式 + 增强对象
- **优点**：灵活
- **缺点**：方法无法复用

### 6. 寄生组合继承（最佳）
- **实现**：构造函数 + `Object.create`
- **优点**：完美解决所有问题
- **缺点**：实现稍复杂

### 7. ES6 Class 继承（推荐）
- **实现**：`class Child extends Parent`
- **优点**：语法清晰、内置最佳实践
- **缺点**：本质是语法糖

### 选择建议
- **现代项目**：使用 ES6 Class
- **需要兼容老浏览器**：使用寄生组合继承
- **简单场景**：使用原型式继承或 Object.create

## 延伸阅读

- [MDN - 继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [MDN - Class](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes)
- [JavaScript 继承方式详解](https://github.com/mqyqingfeng/Blog/issues/16)
- [深入理解 ES6 Class](https://es6.ruanyifeng.com/#docs/class)
