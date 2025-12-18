---
title: JS 创建对象的方式有哪些？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  全面掌握 JavaScript 中创建对象的各种方式，从字面量到构造函数、原型模式、类等，理解每种方式的特点和适用场景。
tags:
  - 对象创建
  - 构造函数
  - 原型模式
  - ES6类
estimatedTime: 30 分钟
keywords:
  - 对象创建
  - 字面量
  - 构造函数
  - Object.create
  - 工厂模式
highlight: 掌握 JavaScript 对象创建的多种方式，理解各种方式的优缺点，能够选择合适的对象创建模式
order: 239
---

## 问题 1：对象字面量

**最简单直接的对象创建方式**

### 基本对象字面量

```javascript
// 1. 空对象
const emptyObj = {};

// 2. 带属性的对象
const person = {
  name: "Alice",
  age: 25,
  city: "New York",
};

// 3. 带方法的对象
const calculator = {
  result: 0,

  add: function (num) {
    this.result += num;
    return this;
  },

  multiply: function (num) {
    this.result *= num;
    return this;
  },

  getValue: function () {
    return this.result;
  },
};

// 使用
calculator.add(5).multiply(2).add(3);
console.log(calculator.getValue()); // 13
```

### ES6 增强的对象字面量

```javascript
// ES6 对象字面量增强功能
const name = "Alice";
const age = 25;

// 1. 属性简写
const person1 = { name, age }; // 等同于 { name: name, age: age }

// 2. 方法简写
const person2 = {
  name: "Bob",

  // 传统方法定义
  greet: function () {
    return `Hello, I'm ${this.name}`;
  },

  // ES6 方法简写
  introduce() {
    return `My name is ${this.name}`;
  },
};

// 3. 计算属性名
const propName = "dynamicProp";
const obj = {
  [propName]: "dynamic value",
  [`${propName}2`]: "another dynamic value",
  [Symbol("key")]: "symbol key value",
};

console.log(obj.dynamicProp); // 'dynamic value'
console.log(obj.dynamicProp2); // 'another dynamic value'

// 4. 复杂的计算属性
const prefix = "user";
const user = {
  [`${prefix}Name`]: "Alice",
  [`${prefix}Age`]: 25,
  [`get${prefix.charAt(0).toUpperCase() + prefix.slice(1)}Info`]() {
    return `${this.userName}, ${this.userAge}`;
  },
};

console.log(user.getUserInfo()); // 'Alice, 25'
```

### 对象字面量的优缺点

```javascript
// ✅ 优点
// 1. 语法简洁，易于理解
// 2. 适合创建单个对象
// 3. 性能好，直接创建

// ❌ 缺点
// 1. 无法批量创建相似对象
// 2. 代码重复
// 3. 无法实现真正的封装

// 示例：创建多个相似对象的问题
const user1 = {
  name: "Alice",
  age: 25,
  greet() {
    return `Hello, I'm ${this.name}`;
  },
};

const user2 = {
  name: "Bob",
  age: 30,
  greet() {
    return `Hello, I'm ${this.name}`;
  }, // 代码重复
};

const user3 = {
  name: "Charlie",
  age: 35,
  greet() {
    return `Hello, I'm ${this.name}`;
  }, // 代码重复
};
```

---

## 问题 2：构造函数模式

### 基本构造函数

```javascript
// 构造函数定义
function Person(name, age, city) {
  this.name = name;
  this.age = age;
  this.city = city;

  // ❌ 不推荐在构造函数中定义方法
  this.greet = function () {
    return `Hello, I'm ${this.name}`;
  };
}

// 创建实例
const person1 = new Person("Alice", 25, "New York");
const person2 = new Person("Bob", 30, "London");

console.log(person1.name); // 'Alice'
console.log(person2.greet()); // "Hello, I'm Bob"

// 问题：每个实例都有自己的方法副本
console.log(person1.greet === person2.greet); // false（浪费内存）
```

### 构造函数 + 原型模式

```javascript
// ✅ 推荐：构造函数 + 原型
function Person(name, age, city) {
  // 实例属性
  this.name = name;
  this.age = age;
  this.city = city;
}

// 共享方法定义在原型上
Person.prototype.greet = function () {
  return `Hello, I'm ${this.name}`;
};

Person.prototype.getAge = function () {
  return this.age;
};

Person.prototype.setAge = function (age) {
  if (age > 0) {
    this.age = age;
  }
};

// 创建实例
const person1 = new Person("Alice", 25, "New York");
const person2 = new Person("Bob", 30, "London");

// 方法共享
console.log(person1.greet === person2.greet); // true（节省内存）

// 检查实例
console.log(person1 instanceof Person); // true
console.log(person1.constructor === Person); // true
```

### 构造函数的高级用法

```javascript
// 构造函数的安全调用
function SafePerson(name, age) {
  // 确保使用 new 调用
  if (!(this instanceof SafePerson)) {
    return new SafePerson(name, age);
  }

  this.name = name;
  this.age = age;
}

SafePerson.prototype.greet = function () {
  return `Hello, I'm ${this.name}`;
};

// 两种调用方式都可以
const person1 = new SafePerson("Alice", 25);
const person2 = SafePerson("Bob", 30); // 没有 new 也能正常工作

console.log(person1 instanceof SafePerson); // true
console.log(person2 instanceof SafePerson); // true

// 构造函数的参数验证
function ValidatedPerson(name, age) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Name must be a non-empty string");
  }

  if (typeof age !== "number" || age < 0 || age > 150) {
    throw new Error("Age must be a number between 0 and 150");
  }

  this.name = name.trim();
  this.age = age;
}

ValidatedPerson.prototype.isAdult = function () {
  return this.age >= 18;
};

// 使用
try {
  const person = new ValidatedPerson("Alice", 25);
  console.log(person.isAdult()); // true
} catch (error) {
  console.error(error.message);
}
```

---

## 问题 3：Object.create() 方法

### 基本用法

```javascript
// 1. 创建空对象
const obj1 = Object.create(null); // 没有原型的对象
const obj2 = Object.create(Object.prototype); // 等同于 {}

console.log(Object.getPrototypeOf(obj1)); // null
console.log(Object.getPrototypeOf(obj2) === Object.prototype); // true

// 2. 指定原型创建对象
const personPrototype = {
  greet: function () {
    return `Hello, I'm ${this.name}`;
  },

  setName: function (name) {
    this.name = name;
  },
};

const person = Object.create(personPrototype);
person.name = "Alice";
person.age = 25;

console.log(person.greet()); // "Hello, I'm Alice"
console.log(Object.getPrototypeOf(person) === personPrototype); // true
```

### 带属性描述符的创建

```javascript
// Object.create() 的第二个参数：属性描述符
const person = Object.create(Object.prototype, {
  name: {
    value: "Alice",
    writable: true,
    enumerable: true,
    configurable: true,
  },
  age: {
    value: 25,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  id: {
    value: "P001",
    writable: false, // 只读
    enumerable: false, // 不可枚举
    configurable: false, // 不可配置
  },
});

console.log(person.name); // 'Alice'
console.log(person.id); // 'P001'

// 尝试修改只读属性
person.id = "P002";
console.log(person.id); // 'P001' (没有改变)

// 枚举属性
console.log(Object.keys(person)); // ['name', 'age'] (不包含 id)
```

### 实现继承

```javascript
// 使用 Object.create() 实现继承
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function Dog(name, breed) {
  Animal.call(this, name); // 调用父构造函数
  this.breed = breed;
}

// 设置原型链
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function () {
  return `${this.name} barks`;
};

const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak()); // "Buddy makes a sound"
console.log(dog.bark()); // "Buddy barks"
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
```

---

## 问题 4：工厂模式

### 简单工厂模式

```javascript
// 简单工厂函数
function createPerson(name, age, city) {
  return {
    name: name,
    age: age,
    city: city,
    greet: function () {
      return `Hello, I'm ${this.name}`;
    },
  };
}

// 创建对象
const person1 = createPerson("Alice", 25, "New York");
const person2 = createPerson("Bob", 30, "London");

console.log(person1.greet()); // "Hello, I'm Alice"
console.log(person2.greet()); // "Hello, I'm Bob"

// 问题：每个对象都有自己的方法副本
console.log(person1.greet === person2.greet); // false
```

### 改进的工厂模式

```javascript
// 共享方法的工厂模式
const PersonMethods = {
  greet: function () {
    return `Hello, I'm ${this.name}`;
  },

  getAge: function () {
    return this.age;
  },

  setAge: function (age) {
    if (age > 0) {
      this.age = age;
    }
  },
};

function createPerson(name, age, city) {
  const person = Object.create(PersonMethods);
  person.name = name;
  person.age = age;
  person.city = city;
  return person;
}

// 创建对象
const person1 = createPerson("Alice", 25, "New York");
const person2 = createPerson("Bob", 30, "London");

// 方法共享
console.log(person1.greet === person2.greet); // true
console.log(person1.greet()); // "Hello, I'm Alice"
```

### 高级工厂模式

```javascript
// 支持不同类型的工厂
function createUser(type, data) {
  const userTypes = {
    admin: function (data) {
      return {
        ...data,
        type: "admin",
        permissions: ["read", "write", "delete"],
        canDelete: function () {
          return true;
        },
      };
    },

    editor: function (data) {
      return {
        ...data,
        type: "editor",
        permissions: ["read", "write"],
        canDelete: function () {
          return false;
        },
      };
    },

    viewer: function (data) {
      return {
        ...data,
        type: "viewer",
        permissions: ["read"],
        canDelete: function () {
          return false;
        },
      };
    },
  };

  const createUserType = userTypes[type];
  if (!createUserType) {
    throw new Error(`Unknown user type: ${type}`);
  }

  return createUserType(data);
}

// 使用
const admin = createUser("admin", {
  name: "Alice",
  email: "alice@example.com",
});
const editor = createUser("editor", { name: "Bob", email: "bob@example.com" });

console.log(admin.permissions); // ['read', 'write', 'delete']
console.log(editor.canDelete()); // false
```

---

## 问题 5：ES6 类

### 基本类语法

```javascript
// ES6 类定义
class Person {
  constructor(name, age, city) {
    this.name = name;
    this.age = age;
    this.city = city;
  }

  // 实例方法
  greet() {
    return `Hello, I'm ${this.name}`;
  }

  getAge() {
    return this.age;
  }

  setAge(age) {
    if (age > 0) {
      this.age = age;
    }
  }

  // 静态方法
  static createFromString(str) {
    const [name, age, city] = str.split(",");
    return new Person(name.trim(), parseInt(age.trim()), city.trim());
  }
}

// 创建实例
const person1 = new Person("Alice", 25, "New York");
const person2 = Person.createFromString("Bob, 30, London");

console.log(person1.greet()); // "Hello, I'm Alice"
console.log(person2.greet()); // "Hello, I'm Bob"

// 方法共享
console.log(person1.greet === person2.greet); // true
```

### 类的继承

```javascript
// 基类
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a sound`;
  }

  static getSpecies() {
    return "Unknown";
  }
}

// 派生类
class Dog extends Animal {
  constructor(name, breed) {
    super(name); // 调用父类构造函数
    this.breed = breed;
  }

  speak() {
    return `${this.name} barks`;
  }

  wagTail() {
    return `${this.name} wags tail`;
  }

  static getSpecies() {
    return "Canis lupus";
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak()); // "Buddy barks"
console.log(dog.wagTail()); // "Buddy wags tail"
console.log(Dog.getSpecies()); // "Canis lupus"

// 检查继承关系
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
```

### 私有字段和方法

```javascript
// ES2022 私有字段
class BankAccount {
  #balance = 0; // 私有字段
  #accountNumber; // 私有字段

  constructor(accountNumber, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    this.#balance = initialBalance;
  }

  // 私有方法
  #validateAmount(amount) {
    return typeof amount === "number" && amount > 0;
  }

  // 公共方法
  deposit(amount) {
    if (this.#validateAmount(amount)) {
      this.#balance += amount;
      return this.#balance;
    }
    throw new Error("Invalid amount");
  }

  withdraw(amount) {
    if (this.#validateAmount(amount) && amount <= this.#balance) {
      this.#balance -= amount;
      return this.#balance;
    }
    throw new Error("Invalid amount or insufficient funds");
  }

  getBalance() {
    return this.#balance;
  }

  getAccountInfo() {
    return {
      accountNumber: this.#accountNumber,
      balance: this.#balance,
    };
  }
}

const account = new BankAccount("ACC001", 1000);
console.log(account.deposit(500)); // 1500
console.log(account.withdraw(200)); // 1300

// 无法直接访问私有字段
// console.log(account.#balance); // SyntaxError
// console.log(account.#validateAmount(100)); // SyntaxError
```

---

## 问题 6：混合模式和最佳实践

### 组合模式

```javascript
// 组合多种创建方式的优点
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(...args));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }
}

// 工厂函数创建带事件功能的对象
function createEventfulObject(data) {
  const obj = Object.create(EventEmitter.prototype);
  EventEmitter.call(obj);

  // 添加数据
  Object.assign(obj, data);

  // 添加数据变更事件
  const originalData = { ...data };

  Object.keys(data).forEach((key) => {
    let value = data[key];

    Object.defineProperty(obj, key, {
      get() {
        return value;
      },
      set(newValue) {
        const oldValue = value;
        value = newValue;
        this.emit("change", { key, oldValue, newValue });
      },
      enumerable: true,
      configurable: true,
    });
  });

  return obj;
}

// 使用
const user = createEventfulObject({ name: "Alice", age: 25 });

user.on("change", ({ key, oldValue, newValue }) => {
  console.log(`${key} changed from ${oldValue} to ${newValue}`);
});

user.name = "Bob"; // "name changed from Alice to Bob"
user.age = 30; // "age changed from 25 to 30"
```

### 性能对比

```javascript
// 性能测试：不同创建方式的性能对比
function performanceTest() {
  const iterations = 100000;

  // 1. 对象字面量
  console.time("Object Literal");
  for (let i = 0; i < iterations; i++) {
    const obj = {
      name: `User${i}`,
      age: 25,
      greet() {
        return `Hello, I'm ${this.name}`;
      },
    };
  }
  console.timeEnd("Object Literal");

  // 2. 构造函数
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }
  Person.prototype.greet = function () {
    return `Hello, I'm ${this.name}`;
  };

  console.time("Constructor Function");
  for (let i = 0; i < iterations; i++) {
    const obj = new Person(`User${i}`, 25);
  }
  console.timeEnd("Constructor Function");

  // 3. Object.create
  const proto = {
    greet() {
      return `Hello, I'm ${this.name}`;
    },
  };

  console.time("Object.create");
  for (let i = 0; i < iterations; i++) {
    const obj = Object.create(proto);
    obj.name = `User${i}`;
    obj.age = 25;
  }
  console.timeEnd("Object.create");

  // 4. ES6 类
  class PersonClass {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }

    greet() {
      return `Hello, I'm ${this.name}`;
    }
  }

  console.time("ES6 Class");
  for (let i = 0; i < iterations; i++) {
    const obj = new PersonClass(`User${i}`, 25);
  }
  console.timeEnd("ES6 Class");
}

// 运行性能测试
// performanceTest();
```

---

## 总结

### 各种创建方式的特点对比

| 方式              | 优点                 | 缺点                   | 适用场景                     |
| ----------------- | -------------------- | ---------------------- | ---------------------------- |
| **对象字面量**    | 简洁直观、性能好     | 无法批量创建、代码重复 | 单个对象、配置对象           |
| **构造函数**      | 可批量创建、支持继承 | 语法相对复杂           | 需要创建多个相似对象         |
| **Object.create** | 精确控制原型链       | 语法较复杂             | 需要精确控制继承关系         |
| **工厂模式**      | 灵活、易于扩展       | 无法使用 instanceof    | 需要根据参数创建不同类型对象 |
| **ES6 类**        | 语法清晰、支持继承   | 需要现代环境支持       | 现代项目、面向对象编程       |

### 选择建议

```javascript
// 1. 单个对象或配置对象 → 对象字面量
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
};

// 2. 需要创建多个相似对象 → ES6 类（推荐）或构造函数
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  greet() {
    return `Hello, ${this.name}`;
  }
}

// 3. 需要精确控制原型链 → Object.create
const childObj = Object.create(parentObj);

// 4. 需要根据条件创建不同类型对象 → 工厂模式
function createShape(type, ...args) {
  const shapes = {
    circle: (radius) => new Circle(radius),
    rectangle: (width, height) => new Rectangle(width, height),
  };
  return shapes[type](...args);
}

// 5. 需要私有属性和方法 → ES6 类 + 私有字段
class SecureClass {
  #privateField = "secret";

  #privateMethod() {
    return this.#privateField;
  }

  publicMethod() {
    return this.#privateMethod();
  }
}
```

### 最佳实践

1. **优先使用 ES6 类**：语法清晰，功能完整
2. **避免在构造函数中定义方法**：浪费内存
3. **合理使用 Object.create**：需要精确控制原型链时
4. **工厂模式适合复杂创建逻辑**：根据参数创建不同类型对象
5. **注意性能影响**：对象字面量性能最好，复杂继承性能较差
6. **使用私有字段保护数据**：ES2022+ 环境中使用 # 语法

理解这些对象创建方式的特点和适用场景，能够帮助你在不同情况下选择最合适的方案，写出更高效、更易维护的代码。
