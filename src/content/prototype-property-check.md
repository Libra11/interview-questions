---
title: 原型链与属性检测完全解析
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  系统梳理 hasOwnProperty、in、getOwnPropertyNames 等 API 的差异，掌握原型链属性遍历、继承检测与最佳实践。
tags:
  - 原型链
  - 对象属性
  - 继承
estimatedTime: 30 分钟
keywords:
  - hasOwnProperty
  - in 运算符
  - Object.keys
  - 原型链
highlight: 理解自有属性与继承属性的本质差异，掌握 for...in、Object.keys 等遍历方法的行为差异
order: 13
---

## 问题 1：如何判断属性是来自对象自身还是原型链？

**核心方法对比**

```javascript
const parent = { fromParent: 'parent' };
const obj = Object.create(parent);
obj.own = 'own';

// 1. hasOwnProperty() - 判断自有属性
obj.hasOwnProperty('own');          // true
obj.hasOwnProperty('fromParent');   // false
obj.hasOwnProperty('toString');     // false

// 2. in 运算符 - 判断属性是否存在（包括原型链）
'own' in obj;                       // true
'fromParent' in obj;                // true
'toString' in obj;                  // true

// 3. Object.prototype.hasOwnProperty.call() - 最安全的写法
Object.prototype.hasOwnProperty.call(obj, 'own'); // true
```

**原型链示意图**

```javascript
function Person(name) {
  this.name = name;  // 自有属性
}

Person.prototype.greet = function() {  // 原型属性
  return `Hello, ${this.name}`;
};

const alice = new Person('Alice');

// 原型链：alice → Person.prototype → Object.prototype → null

alice.name;                         // 'Alice' (自有属性)
alice.greet;                        // function (原型属性)
alice.toString;                     // function (继承自 Object.prototype)

alice.hasOwnProperty('name');       // true
alice.hasOwnProperty('greet');      // false (来自 Person.prototype)
alice.hasOwnProperty('toString');   // false (来自 Object.prototype)
```

---

## 问题 2：hasOwnProperty 的使用陷阱与最佳实践

### 陷阱 1：对象可能覆盖 hasOwnProperty

```javascript
const obj = {
  hasOwnProperty: function() {
    return false; // 恶意覆盖
  },
  foo: 'bar'
};

obj.hasOwnProperty('foo'); // false - ❌ 被覆盖了！

// ✅ 正确写法：从原型上调用
Object.prototype.hasOwnProperty.call(obj, 'foo'); // true

// ES2022+ 推荐写法
Object.hasOwn(obj, 'foo'); // true
```

### 陷阱 2：null 原型对象没有 hasOwnProperty

```javascript
const obj = Object.create(null); // 纯净对象，无原型
obj.foo = 'bar';

obj.hasOwnProperty('foo'); // ❌ TypeError: obj.hasOwnProperty is not a function

// ✅ 正确写法
Object.prototype.hasOwnProperty.call(obj, 'foo'); // true
Object.hasOwn(obj, 'foo'); // true (ES2022+)
```

### 最佳实践

```javascript
// 方式 1：Object.hasOwn()（ES2022+，推荐）
if (Object.hasOwn(obj, 'property')) {
  // 最简洁、最安全
}

// 方式 2：从原型调用（兼容性最好）
if (Object.prototype.hasOwnProperty.call(obj, 'property')) {
  // 兼容所有环境
}

// 方式 3：缓存方法（高频调用场景）
const hasOwn = Object.prototype.hasOwnProperty;
if (hasOwn.call(obj, 'property')) {
  // 避免重复查找原型链
}

// ❌ 避免直接调用
if (obj.hasOwnProperty('property')) {
  // 可能被覆盖或不存在
}
```

---

## 问题 3：in 运算符与 hasOwnProperty 的区别是什么？

**核心差异**

```javascript
const parent = { inherited: 'from parent' };
const obj = Object.create(parent);
obj.own = 'own property';

// hasOwnProperty：只检查自有属性
obj.hasOwnProperty('own');        // true
obj.hasOwnProperty('inherited');  // false

// in：检查自有属性 + 原型链属性
'own' in obj;                     // true
'inherited' in obj;               // true
'toString' in obj;                // true (继承自 Object.prototype)
```

**undefined 值的处理**

```javascript
const obj = {
  foo: undefined,
  bar: null
};

// hasOwnProperty：只要属性存在就返回 true（即使值是 undefined）
obj.hasOwnProperty('foo');        // true
obj.hasOwnProperty('bar');        // true
obj.hasOwnProperty('baz');        // false

// in：同样如此
'foo' in obj;                     // true
'bar' in obj;                     // true
'baz' in obj;                     // false

// 直接访问属性：无法区分 undefined 值和不存在的属性
obj.foo;                          // undefined
obj.baz;                          // undefined
obj.foo !== undefined;            // false - ❌ 误判
```

**实际应用场景**

```javascript
// 场景 1：检查对象是否支持某个方法
if ('addEventListener' in element) {
  element.addEventListener('click', handler);
}

// 场景 2：检查配置对象的属性
function processConfig(config) {
  // ✅ 使用 hasOwnProperty 避免继承的默认值
  if (Object.hasOwn(config, 'timeout')) {
    return config.timeout;
  }
  return DEFAULT_TIMEOUT;
}

// 场景 3：代理对象的 has 陷阱
const proxy = new Proxy(obj, {
  has(target, key) {
    console.log(`检查属性: ${key}`);
    return key in target; // 触发原型链查找
  }
});

'foo' in proxy; // 输出: 检查属性: foo
```

---

## 问题 4：如何遍历对象的自有属性和原型链属性？

### 方式 1：for...in（遍历可枚举属性，包括原型链）

```javascript
const parent = { inherited: 'parent' };
const obj = Object.create(parent);
obj.own = 'own';

// for...in 遍历自有 + 原型链的可枚举属性
for (const key in obj) {
  console.log(key); // 'own', 'inherited'
}

// 只遍历自有属性
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key); // 'own'
  }
}
```

**for...in 的特殊行为**

```javascript
const obj = {
  a: 1,
  b: 2
};

// 定义不可枚举属性
Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false // 不可枚举
});

for (const key in obj) {
  console.log(key); // 'a', 'b' (没有 'hidden')
}

obj.hidden; // 'secret' - 属性存在，但不可枚举
```

### 方式 2：Object.keys()（只返回自有可枚举属性）

```javascript
const parent = { inherited: 'parent' };
const obj = Object.create(parent);
obj.own = 'own';

Object.keys(obj); // ['own'] - ✅ 只有自有属性

// 等价于
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key);
  }
}
```

### 方式 3：Object.getOwnPropertyNames()（包括不可枚举属性）

```javascript
const obj = { visible: 'yes' };

Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

Object.keys(obj);                    // ['visible']
Object.getOwnPropertyNames(obj);     // ['visible', 'hidden']
```

### 方式 4：Object.getOwnPropertySymbols()（Symbol 属性）

```javascript
const sym1 = Symbol('key1');
const sym2 = Symbol('key2');

const obj = {
  normal: 'value',
  [sym1]: 'symbol value'
};

Object.defineProperty(obj, sym2, {
  value: 'hidden symbol',
  enumerable: false
});

Object.keys(obj);                      // ['normal']
Object.getOwnPropertyNames(obj);       // ['normal']
Object.getOwnPropertySymbols(obj);     // [Symbol(key1), Symbol(key2)]
```

### 方式 5：Reflect.ownKeys()（所有自有属性）

```javascript
const sym = Symbol('key');
const obj = { visible: 'yes', [sym]: 'symbol' };

Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

Reflect.ownKeys(obj);
// ['visible', 'hidden', Symbol(key)] - 包含所有自有属性
```

### 遍历方法对比表

| 方法 | 自有属性 | 原型链属性 | 不可枚举属性 | Symbol 属性 |
|------|---------|-----------|-------------|------------|
| `for...in` | ✅ | ✅ | ❌ | ❌ |
| `Object.keys()` | ✅ | ❌ | ❌ | ❌ |
| `Object.values()` | ✅ | ❌ | ❌ | ❌ |
| `Object.entries()` | ✅ | ❌ | ❌ | ❌ |
| `Object.getOwnPropertyNames()` | ✅ | ❌ | ✅ | ❌ |
| `Object.getOwnPropertySymbols()` | ✅ | ❌ | ✅ | ✅ |
| `Reflect.ownKeys()` | ✅ | ❌ | ✅ | ✅ |

---

## 问题 5：如何检测对象的继承关系？

### 方式 1：instanceof（检查原型链）

```javascript
function Person() {}
const alice = new Person();

alice instanceof Person;        // true
alice instanceof Object;        // true
alice instanceof Array;         // false

// 原理：检查 Person.prototype 是否在 alice 的原型链上
Person.prototype.isPrototypeOf(alice); // true
```

**instanceof 的局限性**

```javascript
// 跨 iframe 问题
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const iframeArray = iframe.contentWindow.Array;

const arr = new iframeArray();
arr instanceof Array;           // false - ❌ 不同的 Array 构造函数
Array.isArray(arr);             // true - ✅ 可靠的数组检测
```

### 方式 2：isPrototypeOf()（直接检查原型）

```javascript
const parent = { type: 'parent' };
const child = Object.create(parent);

parent.isPrototypeOf(child);    // true
Object.prototype.isPrototypeOf(child); // true

// 等价于
Object.getPrototypeOf(child) === parent; // true
```

### 方式 3：Object.getPrototypeOf()（获取原型）

```javascript
function Person() {}
const alice = new Person();

Object.getPrototypeOf(alice) === Person.prototype; // true

// 遍历整个原型链
let proto = alice;
while (proto !== null) {
  console.log(proto);
  proto = Object.getPrototypeOf(proto);
}
// alice → Person.prototype → Object.prototype → null
```

### 方式 4：constructor 属性（不可靠）

```javascript
function Person() {}
const alice = new Person();

alice.constructor === Person;   // true

// ❌ 陷阱：constructor 可以被修改
Person.prototype = {
  greet() { return 'hello'; }
  // 忘记设置 constructor
};

const bob = new Person();
bob.constructor === Person;     // false - ❌
bob.constructor === Object;     // true - ❌ 错误的结果

// ✅ 正确做法：重写原型时手动设置 constructor
Person.prototype = {
  constructor: Person,
  greet() { return 'hello'; }
};
```

---

## 问题 6：实际项目中的应用场景与性能优化

### 场景 1：深拷贝时区分自有属性

```javascript
function deepClone(obj, cache = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  // 保持原型链
  const cloned = Object.create(Object.getPrototypeOf(obj));
  cache.set(obj, cloned);
  
  // ✅ 只拷贝自有属性（包括 Symbol 和不可枚举属性）
  Reflect.ownKeys(obj).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor) {
      Object.defineProperty(cloned, key, {
        ...descriptor,
        value: deepClone(descriptor.value, cache)
      });
    }
  });
  
  return cloned;
}

// 测试
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  return `Hello, ${this.name}`;
};

const alice = new Person('Alice');
const cloned = deepClone(alice);

cloned.hasOwnProperty('name');        // true
cloned.hasOwnProperty('greet');       // false (保持在原型上)
cloned instanceof Person;             // true (保持原型链)
```

### 场景 2：对象合并时过滤原型属性

```javascript
function merge(target, ...sources) {
  sources.forEach(source => {
    // ✅ 只合并自有可枚举属性
    Object.keys(source).forEach(key => {
      target[key] = source[key];
    });
  });
  return target;
}

// 或使用 Object.assign（行为相同）
const merged = Object.assign({}, obj1, obj2);
```

### 场景 3：序列化对象时忽略继承属性

```javascript
function serialize(obj) {
  const result = {};
  
  // ✅ 只序列化自有可枚举属性
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value !== 'function') {
      result[key] = value;
    }
  });
  
  return JSON.stringify(result);
}

// 或直接使用 JSON.stringify（自动过滤原型属性）
JSON.stringify(obj); // 只序列化自有可枚举属性
```

### 场景 4：Polyfill 检测

```javascript
// 检测浏览器是否原生支持某个方法
function hasNativeSupport(obj, method) {
  return (
    Object.hasOwn(obj, method) &&
    typeof obj[method] === 'function' &&
    /\[native code\]/.test(obj[method].toString())
  );
}

hasNativeSupport(Array.prototype, 'map'); // true (原生)
hasNativeSupport(Array.prototype, 'myCustomMethod'); // false (polyfill)
```

### 性能优化建议

```javascript
// ❌ 慢：每次都查找原型
for (let i = 0; i < 10000; i++) {
  if (Object.prototype.hasOwnProperty.call(obj, 'key')) {
    // ...
  }
}

// ✅ 快：缓存方法
const hasOwn = Object.prototype.hasOwnProperty;
for (let i = 0; i < 10000; i++) {
  if (hasOwn.call(obj, 'key')) {
    // ...
  }
}

// ✅ 更快：使用 Object.hasOwn（ES2022+）
for (let i = 0; i < 10000; i++) {
  if (Object.hasOwn(obj, 'key')) {
    // 原生实现，性能最优
  }
}
```

**属性查找性能对比**

```javascript
const obj = { a: 1, b: 2, c: 3 };

// 基准测试
console.time('hasOwnProperty');
for (let i = 0; i < 1000000; i++) {
  obj.hasOwnProperty('a');
}
console.timeEnd('hasOwnProperty'); // ~10ms

console.time('Object.hasOwn');
for (let i = 0; i < 1000000; i++) {
  Object.hasOwn(obj, 'a');
}
console.timeEnd('Object.hasOwn'); // ~8ms

console.time('in 运算符');
for (let i = 0; i < 1000000; i++) {
  'a' in obj;
}
console.timeEnd('in 运算符'); // ~5ms（最快，但包括原型链）
```

---

## 总结

**面试回答框架**

1. **核心方法**：
   - `hasOwnProperty()`：检查自有属性
   - `in` 运算符：检查自有 + 原型链属性
   - `Object.hasOwn()`（ES2022+）：最安全的自有属性检测

2. **hasOwnProperty 陷阱**：
   - 可能被对象覆盖
   - null 原型对象没有该方法
   - 推荐使用 `Object.hasOwn()` 或 `Object.prototype.hasOwnProperty.call()`

3. **遍历属性的方法**：
   - `for...in`：自有 + 原型链可枚举属性
   - `Object.keys()`：自有可枚举属性
   - `Object.getOwnPropertyNames()`：自有属性（含不可枚举）
   - `Reflect.ownKeys()`：所有自有属性（含 Symbol）

4. **继承检测**：
   - `instanceof`：检查构造函数的原型
   - `isPrototypeOf()`：检查对象是否在原型链上
   - `Object.getPrototypeOf()`：获取原型对象

5. **实际应用**：
   - 深拷贝：只拷贝自有属性，保持原型链
   - 对象合并：过滤原型属性
   - 序列化：自动忽略原型和不可枚举属性
   - 性能优化：缓存方法、使用原生 API

---

## 延伸阅读

- MDN：[Object.hasOwn()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
- ECMA-262：[原型链规范](https://tc39.es/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)
- 【练习】实现一个函数 `getAllProperties(obj)`，返回对象所有属性（包括原型链、不可枚举、Symbol）。

