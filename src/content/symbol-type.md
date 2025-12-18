---
title: Symbol 数据类型有哪些特征？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 ES6 引入的 Symbol 数据类型，掌握其唯一性、不可枚举等特征，学习在实际项目中的应用场景，如私有属性、常量定义、迭代器等。
tags:
  - Symbol
  - ES6
  - 数据类型
  - 元编程
estimatedTime: 28 分钟
keywords:
  - Symbol
  - 唯一性
  - 私有属性
  - Well-known Symbol
  - 迭代器
highlight: Symbol 是 ES6 引入的第七种原始数据类型，具有唯一性和不可枚举的特点，常用于创建私有属性和实现元编程
order: 388
---

## 问题 1：什么是 Symbol？

Symbol 是 ES6 引入的**第七种原始数据类型**，表示独一无二的值。

### 基本概念

```javascript
// Symbol 是原始数据类型
// JavaScript 的七种数据类型：
// 1. Number
// 2. String
// 3. Boolean
// 4. Null
// 5. Undefined
// 6. Object
// 7. Symbol (ES6)
// 8. BigInt (ES2020)

// 创建 Symbol
const sym1 = Symbol();
const sym2 = Symbol();

console.log(typeof sym1); // 'symbol'
console.log(sym1 === sym2); // false（每个 Symbol 都是唯一的）

// 可以传入描述字符串
const sym3 = Symbol('description');
const sym4 = Symbol('description');

console.log(sym3 === sym4); // false（即使描述相同，也是不同的 Symbol）
console.log(sym3.toString()); // 'Symbol(description)'
console.log(sym3.description); // 'description'
```

### Symbol 的特点

```javascript
// 1. 唯一性：每个 Symbol 都是独一无二的
const sym1 = Symbol('key');
const sym2 = Symbol('key');
console.log(sym1 === sym2); // false

// 2. 不能使用 new 操作符
const sym = Symbol();        // ✅ 正确
const sym = new Symbol();    // ❌ TypeError: Symbol is not a constructor

// 3. 可以转换为字符串和布尔值，但不能转换为数字
const sym = Symbol('test');

console.log(String(sym));    // 'Symbol(test)'
console.log(sym.toString()); // 'Symbol(test)'
console.log(Boolean(sym));   // true
console.log(Number(sym));    // TypeError: Cannot convert a Symbol value to a number

// 4. 不能与其他类型进行运算
const sym = Symbol('test');
console.log(sym + 'string'); // TypeError
console.log(sym + 1);        // TypeError
```

---

## 问题 2：Symbol 的唯一性有什么用？

Symbol 的唯一性使其成为**对象属性的理想键名**，避免属性名冲突。

### 作为对象属性

```javascript
// 使用 Symbol 作为对象属性键
const name = Symbol('name');
const age = Symbol('age');

const person = {
  [name]: 'Alice',
  [age]: 25
};

console.log(person[name]); // 'Alice'
console.log(person[age]);  // 25

// 不会与字符串属性冲突
person.name = 'Bob';
console.log(person.name);  // 'Bob'
console.log(person[name]); // 'Alice'（Symbol 属性不受影响）
```

### 避免属性名冲突

```javascript
// 场景：扩展第三方对象时避免冲突
const thirdPartyObject = {
  name: 'original',
  value: 100
};

// 使用字符串可能冲突
thirdPartyObject.customMethod = function() {
  console.log('custom');
};

// 使用 Symbol 避免冲突
const customMethod = Symbol('customMethod');
thirdPartyObject[customMethod] = function() {
  console.log('custom');
};

// 不会影响原有属性
console.log(Object.keys(thirdPartyObject)); // ['name', 'value', 'customMethod']
```

### 模拟私有属性

```javascript
// 使用 Symbol 创建"私有"属性
const _name = Symbol('name');
const _age = Symbol('age');

class Person {
  constructor(name, age) {
    this[_name] = name;
    this[_age] = age;
  }
  
  getName() {
    return this[_name];
  }
  
  getAge() {
    return this[_age];
  }
}

const person = new Person('Alice', 25);

console.log(person.getName()); // 'Alice'
console.log(person[_name]);    // undefined（外部无法访问 Symbol）

// 注意：不是真正的私有，可以通过 Object.getOwnPropertySymbols 访问
console.log(Object.getOwnPropertySymbols(person)); // [Symbol(name), Symbol(age)]
```

---

## 问题 3：Symbol 的不可枚举性是什么？

Symbol 作为属性键时，**不会被常规方法遍历**到。

### 不可枚举的特性

```javascript
const sym1 = Symbol('sym1');
const sym2 = Symbol('sym2');

const obj = {
  name: 'Alice',
  age: 25,
  [sym1]: 'value1',
  [sym2]: 'value2'
};

// 1. for...in 不会遍历 Symbol 属性
for (let key in obj) {
  console.log(key); // 'name', 'age'（不包括 Symbol）
}

// 2. Object.keys 不会返回 Symbol 属性
console.log(Object.keys(obj)); // ['name', 'age']

// 3. Object.getOwnPropertyNames 不会返回 Symbol 属性
console.log(Object.getOwnPropertyNames(obj)); // ['name', 'age']

// 4. JSON.stringify 会忽略 Symbol 属性
console.log(JSON.stringify(obj)); // '{"name":"Alice","age":25}'
```

### 获取 Symbol 属性

```javascript
const sym1 = Symbol('sym1');
const sym2 = Symbol('sym2');

const obj = {
  name: 'Alice',
  [sym1]: 'value1',
  [sym2]: 'value2'
};

// 1. Object.getOwnPropertySymbols：获取所有 Symbol 属性
const symbols = Object.getOwnPropertySymbols(obj);
console.log(symbols); // [Symbol(sym1), Symbol(sym2)]

// 2. Reflect.ownKeys：获取所有属性（包括 Symbol）
const allKeys = Reflect.ownKeys(obj);
console.log(allKeys); // ['name', Symbol(sym1), Symbol(sym2)]

// 遍历所有 Symbol 属性
Object.getOwnPropertySymbols(obj).forEach(sym => {
  console.log(sym, obj[sym]);
});
// Symbol(sym1) value1
// Symbol(sym2) value2
```

---

## 问题 4：Symbol.for 和 Symbol.keyFor 是什么？

`Symbol.for()` 创建**全局共享的 Symbol**，`Symbol.keyFor()` 获取全局 Symbol 的键。

### Symbol.for

```javascript
// Symbol.for：在全局注册表中创建或获取 Symbol
const sym1 = Symbol.for('key');
const sym2 = Symbol.for('key');

console.log(sym1 === sym2); // true（全局共享）

// 与 Symbol() 的区别
const sym3 = Symbol('key');
const sym4 = Symbol('key');

console.log(sym3 === sym4); // false（不共享）

// Symbol.for 会在全局注册表中查找
const sym5 = Symbol.for('key');
console.log(sym1 === sym5); // true（找到已注册的 Symbol）
```

### Symbol.keyFor

```javascript
// Symbol.keyFor：获取全局 Symbol 的键
const globalSym = Symbol.for('globalKey');
const localSym = Symbol('localKey');

console.log(Symbol.keyFor(globalSym)); // 'globalKey'
console.log(Symbol.keyFor(localSym));  // undefined（不是全局 Symbol）

// 实际应用：跨模块共享 Symbol
// module1.js
export const SHARED_KEY = Symbol.for('app.sharedKey');

// module2.js
const SHARED_KEY = Symbol.for('app.sharedKey');
// 两个模块中的 SHARED_KEY 是同一个 Symbol
```

### 使用场景

```javascript
// 场景 1：跨 iframe 或 Web Worker 共享 Symbol
// 主页面
const sharedSym = Symbol.for('shared');
iframe.contentWindow.postMessage({ key: 'shared' }, '*');

// iframe 中
const sharedSym = Symbol.for('shared'); // 同一个 Symbol

// 场景 2：第三方库的标识符
// 库代码
const LIBRARY_ID = Symbol.for('myLibrary.id');

// 用户代码
const LIBRARY_ID = Symbol.for('myLibrary.id'); // 可以访问库的标识符
```

---

## 问题 5：什么是 Well-known Symbol？

Well-known Symbol 是 JavaScript **内置的特殊 Symbol**，用于自定义对象的内部行为。

### Symbol.iterator

```javascript
// Symbol.iterator：定义对象的默认迭代器
const iterableObj = {
  data: [1, 2, 3, 4, 5],
  
  [Symbol.iterator]() {
    let index = 0;
    const data = this.data;
    
    return {
      next() {
        if (index < data.length) {
          return { value: data[index++], done: false };
        } else {
          return { done: true };
        }
      }
    };
  }
};

// 可以使用 for...of 遍历
for (let value of iterableObj) {
  console.log(value); // 1, 2, 3, 4, 5
}

// 可以使用扩展运算符
console.log([...iterableObj]); // [1, 2, 3, 4, 5]
```

### Symbol.toStringTag

```javascript
// Symbol.toStringTag：自定义对象的类型字符串
class MyClass {
  get [Symbol.toStringTag]() {
    return 'MyClass';
  }
}

const obj = new MyClass();
console.log(Object.prototype.toString.call(obj)); // '[object MyClass]'

// 默认情况
class DefaultClass {}
const defaultObj = new DefaultClass();
console.log(Object.prototype.toString.call(defaultObj)); // '[object Object]'
```

### Symbol.hasInstance

```javascript
// Symbol.hasInstance：自定义 instanceof 行为
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyArray);  // true
console.log({} instanceof MyArray);  // false

// 实际应用：类型检查
class Collection {
  static [Symbol.hasInstance](instance) {
    return instance && typeof instance.length === 'number';
  }
}

console.log([] instanceof Collection);     // true
console.log('string' instanceof Collection); // true
console.log({} instanceof Collection);     // false
```

### Symbol.toPrimitive

```javascript
// Symbol.toPrimitive：自定义类型转换
const obj = {
  [Symbol.toPrimitive](hint) {
    if (hint === 'number') {
      return 42;
    }
    if (hint === 'string') {
      return 'hello';
    }
    return true;
  }
};

console.log(+obj);      // 42（转换为数字）
console.log(`${obj}`);  // 'hello'（转换为字符串）
console.log(obj + '');  // 'true'（默认转换）
```

### 其他 Well-known Symbol

```javascript
// Symbol.species：指定创建派生对象的构造函数
class MyArray extends Array {
  static get [Symbol.species]() {
    return Array; // 返回 Array 而不是 MyArray
  }
}

const myArray = new MyArray(1, 2, 3);
const mapped = myArray.map(x => x * 2);

console.log(mapped instanceof MyArray); // false
console.log(mapped instanceof Array);   // true

// Symbol.match：自定义字符串匹配
const matcher = {
  [Symbol.match](string) {
    return string.includes('hello') ? ['hello'] : null;
  }
};

console.log('hello world'.match(matcher)); // ['hello']

// Symbol.split：自定义字符串分割
const splitter = {
  [Symbol.split](string) {
    return string.split('').reverse();
  }
};

console.log('hello'.split(splitter)); // ['o', 'l', 'l', 'e', 'h']
```

---

## 问题 6：Symbol 在实际项目中的应用场景有哪些？

Symbol 在实际开发中有多种实用场景。

### 场景 1：定义常量

```javascript
// 使用 Symbol 定义常量，避免值重复
const STATUS = {
  PENDING: Symbol('pending'),
  FULFILLED: Symbol('fulfilled'),
  REJECTED: Symbol('rejected')
};

function handleStatus(status) {
  switch (status) {
    case STATUS.PENDING:
      console.log('处理中');
      break;
    case STATUS.FULFILLED:
      console.log('成功');
      break;
    case STATUS.REJECTED:
      console.log('失败');
      break;
  }
}

handleStatus(STATUS.PENDING); // '处理中'

// 优势：不会因为值相同而冲突
const STATUS1 = { PENDING: 0, FULFILLED: 1, REJECTED: 2 };
const STATUS2 = { PENDING: 0, FULFILLED: 1, REJECTED: 2 };
console.log(STATUS1.PENDING === STATUS2.PENDING); // true（可能冲突）

const STATUS3 = { PENDING: Symbol(), FULFILLED: Symbol() };
const STATUS4 = { PENDING: Symbol(), FULFILLED: Symbol() };
console.log(STATUS3.PENDING === STATUS4.PENDING); // false（不会冲突）
```

### 场景 2：私有属性和方法

```javascript
// 使用 Symbol 实现私有属性
const _private = Symbol('private');

class User {
  constructor(name, password) {
    this.name = name;
    this[_private] = {
      password: password
    };
  }
  
  checkPassword(password) {
    return this[_private].password === password;
  }
}

const user = new User('Alice', '123456');

console.log(user.name);           // 'Alice'
console.log(user.password);       // undefined
console.log(user[_private]);      // undefined（外部无法访问）
console.log(user.checkPassword('123456')); // true

// 模块级私有
// user.js
const _id = Symbol('id');
const _email = Symbol('email');

export class User {
  constructor(id, email) {
    this[_id] = id;
    this[_email] = email;
  }
  
  getId() {
    return this[_id];
  }
}

// 外部无法直接访问 _id 和 _email
```

### 场景 3：防止属性污染

```javascript
// 扩展第三方对象时避免污染
const myData = Symbol('myData');

// 扩展 Array
Array.prototype[myData] = function() {
  return this.filter(x => x > 0);
};

const arr = [1, -2, 3, -4, 5];
console.log(arr[myData]()); // [1, 3, 5]

// 不会影响正常遍历
console.log(Object.keys(Array.prototype)); // 不包含 myData
```

### 场景 4：实现单例模式

```javascript
// 使用 Symbol 实现单例
const INSTANCE = Symbol('instance');

class Singleton {
  static getInstance() {
    if (!this[INSTANCE]) {
      this[INSTANCE] = new Singleton();
    }
    return this[INSTANCE];
  }
  
  constructor() {
    if (Singleton[INSTANCE]) {
      return Singleton[INSTANCE];
    }
    Singleton[INSTANCE] = this;
  }
}

const instance1 = Singleton.getInstance();
const instance2 = Singleton.getInstance();

console.log(instance1 === instance2); // true
```

### 场景 5：实现观察者模式

```javascript
// 使用 Symbol 作为事件类型
const EVENT_TYPES = {
  USER_LOGIN: Symbol('userLogin'),
  USER_LOGOUT: Symbol('userLogout'),
  DATA_UPDATE: Symbol('dataUpdate')
};

class EventEmitter {
  constructor() {
    this.events = new Map();
  }
  
  on(type, handler) {
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }
    this.events.get(type).push(handler);
  }
  
  emit(type, data) {
    if (this.events.has(type)) {
      this.events.get(type).forEach(handler => handler(data));
    }
  }
}

const emitter = new EventEmitter();

emitter.on(EVENT_TYPES.USER_LOGIN, (user) => {
  console.log('用户登录', user);
});

emitter.emit(EVENT_TYPES.USER_LOGIN, { name: 'Alice' });
// 用户登录 { name: 'Alice' }
```

### 场景 6：元数据存储

```javascript
// 使用 Symbol 存储对象的元数据
const metadata = Symbol('metadata');

class Model {
  constructor(data) {
    Object.assign(this, data);
    
    // 存储元数据
    this[metadata] = {
      createdAt: new Date(),
      version: 1
    };
  }
  
  getMetadata() {
    return this[metadata];
  }
  
  toJSON() {
    // JSON 序列化时自动忽略元数据
    const obj = { ...this };
    return obj;
  }
}

const model = new Model({ name: 'Alice', age: 25 });

console.log(model.name); // 'Alice'
console.log(model.getMetadata()); // { createdAt: ..., version: 1 }
console.log(JSON.stringify(model)); // '{"name":"Alice","age":25}'
```

---

## 问题 7：Symbol 的注意事项和最佳实践有哪些？

使用 Symbol 时需要注意一些细节和最佳实践。

### 注意事项

```javascript
// 1. Symbol 不能被自动转换为字符串
const sym = Symbol('test');

console.log('Symbol: ' + sym); // TypeError
console.log(`Symbol: ${sym}`); // TypeError

// 需要显式转换
console.log('Symbol: ' + String(sym));     // 'Symbol: Symbol(test)'
console.log(`Symbol: ${sym.toString()}`);  // 'Symbol: Symbol(test)'
console.log(`Symbol: ${sym.description}`); // 'Symbol: test'

// 2. Symbol 作为属性名时必须使用方括号
const sym = Symbol('key');

const obj = {
  [sym]: 'value'  // ✅ 正确
};

obj[sym] = 'value'; // ✅ 正确
obj.sym = 'value';  // ❌ 错误（创建的是字符串属性 'sym'）

// 3. Symbol 不会被 JSON.stringify 序列化
const obj = {
  name: 'Alice',
  [Symbol('age')]: 25
};

console.log(JSON.stringify(obj)); // '{"name":"Alice"}'

// 4. Symbol 不是真正的私有
const sym = Symbol('private');
const obj = { [sym]: 'value' };

// 可以通过 Object.getOwnPropertySymbols 访问
const symbols = Object.getOwnPropertySymbols(obj);
console.log(obj[symbols[0]]); // 'value'
```

### 最佳实践

```javascript
// 1. 给 Symbol 添加描述
const goodSym = Symbol('meaningful description');
const badSym = Symbol(); // 不推荐

console.log(goodSym.description); // 'meaningful description'
console.log(badSym.description);  // undefined

// 2. 使用常量存储 Symbol
// ✅ 好的做法
const SYMBOLS = {
  PRIVATE_METHOD: Symbol('privateMethod'),
  INTERNAL_STATE: Symbol('internalState')
};

class MyClass {
  [SYMBOLS.PRIVATE_METHOD]() {
    // 私有方法
  }
}

// ❌ 不好的做法
class MyClass {
  [Symbol('privateMethod')]() {
    // 无法在外部引用这个 Symbol
  }
}

// 3. 跨模块共享使用 Symbol.for
// module1.js
export const SHARED_KEY = Symbol.for('app.sharedKey');

// module2.js
import { SHARED_KEY } from './module1.js';
// 或者
const SHARED_KEY = Symbol.for('app.sharedKey');

// 4. 文档化 Symbol 的用途
/**
 * 用于存储用户的私有数据
 * @type {Symbol}
 */
const PRIVATE_DATA = Symbol('privateData');

// 5. 避免过度使用
// Symbol 主要用于需要唯一标识符的场景
// 不要为了使用而使用

// ✅ 合适的使用
const UNIQUE_ID = Symbol('id');

// ❌ 不必要的使用
const name = Symbol('name'); // 普通属性用字符串就够了
```

### 性能考虑

```javascript
// Symbol 的创建和查找都很快
// 但要注意以下几点：

// 1. 避免在循环中创建 Symbol
// ❌ 不好
for (let i = 0; i < 1000; i++) {
  const sym = Symbol('temp');
  obj[sym] = i;
}

// ✅ 好
const sym = Symbol('temp');
for (let i = 0; i < 1000; i++) {
  obj[`${sym.description}_${i}`] = i;
}

// 2. 使用 Symbol.for 时注意全局注册表的大小
// 全局注册表不会被垃圾回收
const symbols = [];
for (let i = 0; i < 10000; i++) {
  symbols.push(Symbol.for(`key_${i}`)); // 会一直保存在内存中
}

// 3. 获取 Symbol 属性时的性能
const sym = Symbol('key');
const obj = { [sym]: 'value' };

// 直接访问很快
console.log(obj[sym]); // 快

// 遍历 Symbol 属性较慢
Object.getOwnPropertySymbols(obj); // 相对较慢
```

---

## 总结

**Symbol 数据类型的核心要点**：

### 1. 基本特征
- 原始数据类型（第七种）
- 每个 Symbol 都是唯一的
- 不能使用 new 操作符
- 可以有描述字符串

### 2. 唯一性
- 避免属性名冲突
- 模拟私有属性
- 作为对象属性键

### 3. 不可枚举性
- for...in 不会遍历
- Object.keys 不会返回
- JSON.stringify 会忽略
- 使用 Object.getOwnPropertySymbols 获取

### 4. 全局 Symbol
- Symbol.for() 创建全局共享
- Symbol.keyFor() 获取键名
- 跨模块、跨 iframe 共享

### 5. Well-known Symbol
- Symbol.iterator：迭代器
- Symbol.toStringTag：类型标签
- Symbol.hasInstance：instanceof 行为
- Symbol.toPrimitive：类型转换

### 6. 实际应用
- 定义常量（避免值冲突）
- 私有属性和方法
- 防止属性污染
- 单例模式
- 观察者模式
- 元数据存储

### 7. 注意事项
- 不能自动转换为字符串
- 使用方括号访问
- 不会被 JSON 序列化
- 不是真正的私有
- 添加有意义的描述

## 延伸阅读

- [MDN - Symbol](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [ES6 Symbol 详解](https://es6.ruanyifeng.com/#docs/symbol)
- [Well-known Symbols](https://tc39.es/ecma262/#sec-well-known-symbols)
- [Symbol 的实际应用](https://javascript.info/symbol)
