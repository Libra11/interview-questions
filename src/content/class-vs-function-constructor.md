---
title: new Class 与 new Function 构造函数的区别
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入对比 ES6 class 构造函数与传统函数构造函数的差异，理解语法糖背后的本质，掌握原型链、继承、this 绑定等核心概念的区别。
tags:
  - 构造函数
  - Class
  - 原型链
  - ES6
estimatedTime: 35 分钟
keywords:
  - class
  - constructor
  - 函数构造函数
  - 原型链
  - 继承
highlight: 理解 class 语法糖的本质，掌握两种构造函数在继承、this 绑定、提升等方面的差异。
order: 26
---

## 问题 1：new Class 与 new Function 的核心区别是什么？

**快速总结**

| 特性 | `new Class` | `new Function` |
|------|------------|----------------|
| **语法** | ES6 class 语法 | 传统函数语法 |
| **提升（Hoisting）** | ❌ 不存在提升 | ✅ 函数提升 |
| **严格模式** | ✅ 自动严格模式 | ❌ 需要手动开启 |
| **调用方式** | ❌ 必须用 `new` | ⚠️ 可以不用 `new`（但不推荐） |
| **方法定义** | 在类体中定义 | 在原型上定义 |
| **继承** | `extends` 关键字 | 手动设置原型链 |
| **私有字段** | ✅ 支持 `#field` | ❌ 不支持 |

```javascript
// ============================================
// 1. 基本语法对比
// ============================================

// ES6 Class
class PersonClass {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, I'm ${this.name}`;
  }
}

// 函数构造函数
function PersonFunction(name, age) {
  this.name = name;
  this.age = age;
}

PersonFunction.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

// 使用方式相同
const person1 = new PersonClass('Alice', 25);
const person2 = new PersonFunction('Bob', 30);

console.log(person1.greet());  // "Hello, I'm Alice"
console.log(person2.greet());  // "Hello, I'm Bob"
```

---

## 问题 2：提升（Hoisting）行为有什么不同？

**关键差异：Class 不存在提升，函数构造函数存在提升**

```javascript
// ============================================
// 函数构造函数：存在提升
// ============================================

// ✅ 可以在声明前调用（提升）
const person1 = new PersonFunction('Alice', 25);  // 正常工作

function PersonFunction(name, age) {
  this.name = name;
  this.age = age;
}

// ============================================
// Class：不存在提升
// ============================================

// ❌ 不能在声明前调用
const person2 = new PersonClass('Bob', 30);  // ReferenceError: Cannot access 'PersonClass' before initialization

class PersonClass {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

// ============================================
// 为什么会这样？
// ============================================

// 函数声明会被提升到作用域顶部
console.log(typeof PersonFunction);  // "function"（即使还没执行到声明）

// Class 声明在 Temporal Dead Zone（TDZ）中
console.log(typeof PersonClass);     // ReferenceError（在声明前访问）
```

**原因分析**

```javascript
// 函数构造函数：函数声明提升
// 等价于：
function PersonFunction(name, age) {
  this.name = name;
  this.age = age;
}
const person1 = new PersonFunction('Alice', 25);

// Class：类似 let/const，存在 TDZ
// 等价于：
const PersonClass = class {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
};
const person2 = new PersonClass('Bob', 30);
```

---

## 问题 3：严格模式的处理有什么不同？

**Class 自动启用严格模式，函数构造函数需要手动开启**

```javascript
// ============================================
// Class：自动严格模式
// ============================================

class PersonClass {
  constructor(name) {
    this.name = name;
  }

  // 严格模式下，this 为 undefined 时会报错
  badMethod() {
    function inner() {
      console.log(this);  // undefined（严格模式）
      // 非严格模式下会是全局对象
    }
    inner();
  }
}

// ============================================
// 函数构造函数：需要手动开启严格模式
// ============================================

// 方式 1：整个文件严格模式
'use strict';

function PersonFunction(name) {
  this.name = name;
}

// 方式 2：函数内严格模式
function PersonFunctionStrict(name) {
  'use strict';
  this.name = name;
}

// 非严格模式下，忘记 new 会导致 this 指向全局对象
function PersonLoose(name) {
  // 没有 'use strict'
  this.name = name;
}

// 忘记 new 的后果
const person1 = PersonLoose('Alice');  // this 指向全局对象（浏览器中是 window）
console.log(window.name);  // "Alice"（污染全局作用域）

// 严格模式下会报错
function PersonStrict(name) {
  'use strict';
  this.name = name;
}

const person2 = PersonStrict('Bob');  // TypeError: Cannot set property 'name' of undefined
```

---

## 问题 4：调用方式有什么不同？

**Class 必须用 new 调用，函数构造函数可以不用（但不推荐）**

```javascript
// ============================================
// Class：必须使用 new
// ============================================

class PersonClass {
  constructor(name) {
    this.name = name;
  }
}

// ❌ 不能直接调用
const person1 = PersonClass('Alice');  // TypeError: Class constructor PersonClass cannot be invoked without 'new'

// ✅ 必须使用 new
const person2 = new PersonClass('Bob');  // 正确

// ============================================
// 函数构造函数：可以不用 new（但不推荐）
// ============================================

function PersonFunction(name) {
  this.name = name;
}

// ⚠️ 可以不用 new（但 this 指向会出错）
const person3 = PersonFunction('Charlie');  // 不报错，但 this 指向全局对象
console.log(person3);  // undefined
console.log(window.name);  // "Charlie"（污染全局）

// ✅ 应该使用 new
const person4 = new PersonFunction('David');  // 正确
```

**防止函数构造函数被错误调用的方法**

```javascript
// 方法 1：使用 new.target（ES6）
function PersonFunction(name) {
  if (!new.target) {
    throw new Error('PersonFunction must be called with new');
  }
  this.name = name;
}

// 方法 2：自动返回 new 实例
function PersonAutoNew(name) {
  if (!(this instanceof PersonAutoNew)) {
    return new PersonAutoNew(name);
  }
  this.name = name;
}

// 两种方式都可以不用 new
const person1 = PersonAutoNew('Alice');  // 自动使用 new
const person2 = new PersonAutoNew('Bob');  // 也可以显式使用 new

// 方法 3：使用严格模式
function PersonStrict(name) {
  'use strict';
  this.name = name;  // 忘记 new 时会报错
}
```

---

## 问题 5：方法定义方式有什么不同？

**Class 在类体中定义方法，函数构造函数在原型上定义**

```javascript
// ============================================
// Class：方法定义在类体中
// ============================================

class PersonClass {
  constructor(name) {
    this.name = name;
  }

  // 方法自动添加到原型上
  greet() {
    return `Hello, I'm ${this.name}`;
  }

  // 静态方法
  static create(name) {
    return new PersonClass(name);
  }

  // Getter/Setter
  get fullName() {
    return this.name.toUpperCase();
  }

  set fullName(value) {
    this.name = value.toLowerCase();
  }
}

// ============================================
// 函数构造函数：方法定义在原型上
// ============================================

function PersonFunction(name) {
  this.name = name;
}

// 方法需要手动添加到原型
PersonFunction.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

// 静态方法
PersonFunction.create = function(name) {
  return new PersonFunction(name);
};

// Getter/Setter（需要 Object.defineProperty）
Object.defineProperty(PersonFunction.prototype, 'fullName', {
  get() {
    return this.name.toUpperCase();
  },
  set(value) {
    this.name = value.toLowerCase();
  }
});

// ============================================
// 对比：方法是否可枚举
// ============================================

// Class：方法默认不可枚举
console.log(Object.keys(new PersonClass('Alice')));  // ['name']（不包含 greet）

// 函数构造函数：方法默认可枚举（取决于定义方式）
PersonFunction.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};
console.log(Object.keys(new PersonFunction('Bob')));  // ['name']（如果使用普通赋值）

// 但可以通过 Object.defineProperty 控制
Object.defineProperty(PersonFunction.prototype, 'greet', {
  value: function() {
    return `Hello, I'm ${this.name}`;
  },
  enumerable: false,  // 不可枚举
  writable: true,
  configurable: true
});
```

---

## 问题 6：继承实现方式有什么不同？

**Class 使用 extends，函数构造函数需要手动设置原型链**

```javascript
// ============================================
// Class：使用 extends 关键字
// ============================================

class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);  // 调用父类构造函数
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }
}

const dog = new Dog('Buddy', 'Golden Retriever');
console.log(dog.speak());  // "Buddy barks"
console.log(dog instanceof Animal);  // true

// ============================================
// 函数构造函数：手动设置原型链
// ============================================

function AnimalFunction(name) {
  this.name = name;
}

AnimalFunction.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

function DogFunction(name, breed) {
  AnimalFunction.call(this, name);  // 调用父类构造函数
  this.breed = breed;
}

// 设置原型链（方式 1：Object.create）
DogFunction.prototype = Object.create(AnimalFunction.prototype);
DogFunction.prototype.constructor = DogFunction;

// 设置原型链（方式 2：直接赋值 - 不推荐，会修改父类原型）
// DogFunction.prototype = new AnimalFunction();  // 不推荐

DogFunction.prototype.speak = function() {
  return `${this.name} barks`;
};

const dog2 = new DogFunction('Max', 'Labrador');
console.log(dog2.speak());  // "Max barks"
console.log(dog2 instanceof AnimalFunction);  // true
```

**继承的陷阱和注意事项**

```javascript
// ============================================
// Class：super 关键字自动处理
// ============================================

class Parent {
  constructor(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name);  // 必须在 this 之前调用
    this.age = age;
  }

  getName() {
    return super.getName() + ` (${this.age})`;  // super 自动绑定正确的 this
  }
}

// ============================================
// 函数构造函数：需要手动处理 this 绑定
// ============================================

function ParentFunction(name) {
  this.name = name;
}

ParentFunction.prototype.getName = function() {
  return this.name;
};

function ChildFunction(name, age) {
  ParentFunction.call(this, name);
  this.age = age;
}

ChildFunction.prototype = Object.create(ParentFunction.prototype);
ChildFunction.prototype.constructor = ChildFunction;

// 重写父类方法
ChildFunction.prototype.getName = function() {
  // 需要手动使用 call/apply 绑定 this
  return ParentFunction.prototype.getName.call(this) + ` (${this.age})`;
};
```

---

## 问题 7：私有字段和封装有什么不同？

**Class 支持私有字段，函数构造函数需要闭包或约定**

```javascript
// ============================================
// Class：支持私有字段（ES2022）
// ============================================

class BankAccount {
  #balance = 0;  // 私有字段
  #accountNumber;  // 私有字段

  constructor(accountNumber, initialBalance) {
    this.#accountNumber = accountNumber;
    this.#balance = initialBalance;
  }

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }

  // 私有方法（提案阶段，部分环境支持）
  #validateAmount(amount) {
    return amount > 0;
  }
}

const account = new BankAccount('12345', 1000);
// account.#balance  // SyntaxError: Private field '#balance' must be declared in an enclosing class
console.log(account.getBalance());  // 1000

// ============================================
// 函数构造函数：使用闭包实现私有
// ============================================

function BankAccountFunction(accountNumber, initialBalance) {
  // 私有变量（通过闭包）
  let balance = initialBalance;
  let accountNum = accountNumber;

  // 私有方法
  function validateAmount(amount) {
    return amount > 0;
  }

  // 公共方法
  this.deposit = function(amount) {
    if (validateAmount(amount)) {
      balance += amount;
    }
  };

  this.getBalance = function() {
    return balance;
  };
}

const account2 = new BankAccountFunction('67890', 2000);
// account2.balance  // undefined（无法访问）
console.log(account2.getBalance());  // 2000
```

**私有字段对比**

| 方式 | Class 私有字段 | 闭包私有 | 约定私有 |
|------|--------------|---------|---------|
| **真正私有** | ✅ 编译时检查 | ✅ 运行时私有 | ❌ 仅约定 |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐（每次创建方法） | ⭐⭐⭐⭐⭐ |
| **内存** | 高效 | 每个实例都有方法副本 | 高效 |
| **可访问性** | 完全不可访问 | 完全不可访问 | 可以访问（不推荐） |

---

## 问题 8：Class 是语法糖吗？底层实现是什么？

**Class 本质上是语法糖，但提供了额外的保障**

```javascript
// ============================================
// Class 语法
// ============================================

class MyClass {
  constructor(value) {
    this.value = value;
  }

  method() {
    return this.value;
  }

  static staticMethod() {
    return 'static';
  }
}

// ============================================
// 等价的函数构造函数写法
// ============================================

function MyFunction(value) {
  this.value = value;
}

MyFunction.prototype.method = function() {
  return this.value;
};

MyFunction.staticMethod = function() {
  return 'static';
};

// ============================================
// 但 Class 提供了额外的保障
// ============================================

// 1. 必须使用 new
// MyClass()      // TypeError: Class constructor MyClass cannot be invoked without 'new'
// MyFunction()   // 可以执行，但 this 可能指向全局对象（非严格模式），不安全

// 2. 自动严格模式
class StrictClass {
  constructor() {
    // class body 内部自动严格模式
  }
}

// 3. class 原型方法不可枚举
class MyClass {
  constructor(value) {
    this.value = value;
  }
  method() {}
}

function MyFunction(value) {
  this.value = value;
}
MyFunction.prototype.method = function() {};

const instance = new MyClass('test');
console.log(Object.keys(instance));  // ['value']，看不到 method（因为在原型上）
console.log(Object.getOwnPropertyDescriptor(MyClass.prototype, 'method').enumerable); // false

const instance2 = new MyFunction('test');
console.log(Object.keys(instance2)); // ['value']，同样看不到 method（也在原型上）
console.log(Object.getOwnPropertyDescriptor(MyFunction.prototype, 'method').enumerable); // true
```

---

## 总结

### 核心对比表

| 特性 | `new Class` | `new Function` |
|------|------------|----------------|
| **语法** | ES6 class 语法 | 传统函数语法 |
| **提升** | ❌ 不存在提升 | ✅ 函数提升 |
| **严格模式** | ✅ 自动启用 | ❌ 需要手动开启 |
| **调用限制** | ✅ 必须用 `new` | ⚠️ 可以不用 `new` |
| **方法定义** | 类体中定义 | 原型上定义 |
| **继承** | `extends` + `super` | 手动设置原型链 |
| **私有字段** | ✅ `#field` | ❌ 需要闭包 |
| **方法可枚举** | ❌ 默认不可枚举 | ⚠️ 取决于定义方式 |
| **代码可读性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 关键要点

1. **Class 是语法糖**：底层仍然是基于原型的继承
2. **Class 更安全**：自动严格模式、必须使用 new、方法不可枚举
3. **Class 更现代**：支持私有字段、extends 继承更简洁
4. **函数构造函数更灵活**：可以动态操作原型、存在函数提升
5. **推荐使用 Class**：除非有特殊需求，否则优先使用 Class

### 选择建议

- **现代项目** → 使用 Class
- **需要私有字段** → 使用 Class
- **需要继承** → 使用 Class（extends 更简洁）
- **需要动态原型操作** → 考虑函数构造函数
- **兼容旧代码** → 保持原有风格

### 推荐阅读

- [MDN: Classes](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes)
- [MDN: constructor](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/constructor)
- [MDN: Private class fields](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
