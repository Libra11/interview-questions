---
title: Object.keys 与 Object.getOwnPropertyNames 深度对比
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入剖析对象属性遍历的核心差异，掌握可枚举性、Symbol 属性、原型链等关键概念，理解 6 种属性遍历方法的选择策略。
tags:
  - 对象属性
  - 可枚举性
  - 属性遍历
estimatedTime: 30 分钟
keywords:
  - Object.keys
  - Object.getOwnPropertyNames
  - enumerable
  - Symbol
highlight: 理解可枚举性的设计哲学，掌握不同遍历方法在实际场景中的权衡
order: 103
---

## 问题 1：Object.keys 与 Object.getOwnPropertyNames 的核心区别是什么？

**快速总结**

两者的**唯一区别**是：**是否返回不可枚举（non-enumerable）属性**

| 方法 | 返回内容 | 包含不可枚举属性 | 包含 Symbol | 包含原型链 |
|------|---------|----------------|------------|-----------|
| `Object.keys()` | 可枚举的自有属性 | ❌ | ❌ | ❌ |
| `Object.getOwnPropertyNames()` | 所有自有属性（包括不可枚举） | ✅ | ❌ | ❌ |

```javascript
const obj = {
  name: 'Alice',        // 可枚举
  age: 25               // 可枚举
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false     // 不可枚举
});

// 对比结果
Object.keys(obj);
// ['name', 'age'] - 只返回可枚举属性

Object.getOwnPropertyNames(obj);
// ['name', 'age', 'id'] - 返回所有属性（包括不可枚举）
```

**共同点**：

1. 都只返回**自有属性**（own properties），不包含原型链上的属性
2. 都不返回 **Symbol 属性**
3. 返回的都是**字符串数组**

---

## 问题 2：什么是可枚举性（enumerable）？如何设置和检测？

### 属性描述符（Property Descriptor）

每个对象属性都有 4 个特性（attribute）：

```javascript
const obj = { name: 'Alice' };

// 获取属性描述符
Object.getOwnPropertyDescriptor(obj, 'name');
// {
//   value: 'Alice',
//   writable: true,       // 是否可修改
//   enumerable: true,     // 是否可枚举
//   configurable: true    // 是否可配置（删除/修改描述符）
// }
```

### enumerable 的作用

**可枚举属性** 会在以下场景中被遍历：

```javascript
const obj = {
  public: 'visible',        // enumerable: true（默认）
};

Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false         // 不可枚举
});

// 1. for...in 循环（包含原型链）
for (let key in obj) {
  console.log(key);         // 'public'（不包含 'private'）
}

// 2. Object.keys()
Object.keys(obj);           // ['public']

// 3. JSON.stringify()
JSON.stringify(obj);        // '{"public":"visible"}'

// 4. Object.assign()
const copy = Object.assign({}, obj);
copy;                       // { public: 'visible' }（不复制 'private'）

// 5. 扩展运算符 {...}
const spread = { ...obj };
spread;                     // { public: 'visible' }
```

**不可枚举属性** 不会被遍历，但可以直接访问：

```javascript
obj.private;                // 'hidden'（可以直接访问）
obj.hasOwnProperty('private'); // true（属性存在）

// 需要用特殊方法获取
Object.getOwnPropertyNames(obj); // ['public', 'private']
Object.getOwnPropertyDescriptor(obj, 'private');
// { value: 'hidden', writable: false, enumerable: false, configurable: false }
```

### 设置可枚举性的 3 种方法

**1. Object.defineProperty() - 定义单个属性**

```javascript
const obj = {};

Object.defineProperty(obj, 'name', {
  value: 'Alice',
  enumerable: true,     // 可枚举
  writable: true,
  configurable: true
});

Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false,    // 不可枚举
  writable: true,
  configurable: true
});
```

**2. Object.defineProperties() - 定义多个属性**

```javascript
const obj = {};

Object.defineProperties(obj, {
  name: {
    value: 'Alice',
    enumerable: true
  },
  age: {
    value: 25,
    enumerable: true
  },
  id: {
    value: 123,
    enumerable: false
  }
});
```

**3. Object.create() - 创建对象时设置**

```javascript
const obj = Object.create(null, {
  name: {
    value: 'Alice',
    enumerable: true
  },
  id: {
    value: 123,
    enumerable: false
  }
});
```

### 检测可枚举性

```javascript
const obj = {
  public: 'visible'
};

Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false
});

// 方法 1：propertyIsEnumerable()（最直接）
obj.propertyIsEnumerable('public');   // true
obj.propertyIsEnumerable('private');  // false

// 方法 2：getOwnPropertyDescriptor()
Object.getOwnPropertyDescriptor(obj, 'public').enumerable;  // true
Object.getOwnPropertyDescriptor(obj, 'private').enumerable; // false

// 方法 3：检查是否在 Object.keys() 中
Object.keys(obj).includes('public');  // true
Object.keys(obj).includes('private'); // false
```

---

## 问题 3：实际场景中如何选择遍历方法？

### 6 种主要的属性遍历方法对比

```javascript
const obj = {
  public: 'visible'         // 可枚举
};

// 不可枚举属性
Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false
});

// Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// 继承属性
Object.prototype.inherited = 'from prototype';

// ============================================
// 1. Object.keys() - 可枚举的自有属性
// ============================================
Object.keys(obj);
// ['public']
// ✅ 常用：遍历对象的"公开"属性
// ❌ 不包含：不可枚举、Symbol、原型链

// ============================================
// 2. Object.getOwnPropertyNames() - 所有自有属性（不含 Symbol）
// ============================================
Object.getOwnPropertyNames(obj);
// ['public', 'private']
// ✅ 常用：获取对象的所有字符串属性（包括私有）
// ❌ 不包含：Symbol、原型链

// ============================================
// 3. Object.getOwnPropertySymbols() - 所有 Symbol 属性
// ============================================
Object.getOwnPropertySymbols(obj);
// [Symbol(secret)]
// ✅ 常用：获取 Symbol 属性
// ❌ 不包含：字符串属性、原型链

// ============================================
// 4. Reflect.ownKeys() - 所有自有属性（含 Symbol）
// ============================================
Reflect.ownKeys(obj);
// ['public', 'private', Symbol(secret)]
// ✅ 常用：获取对象的所有自有属性（最完整）
// ❌ 不包含：原型链

// ============================================
// 5. for...in - 可枚举属性（包含原型链）
// ============================================
const keys = [];
for (let key in obj) {
  keys.push(key);
}
keys;
// ['public', 'inherited']
// ✅ 常用：需要遍历原型链时
// ❌ 不包含：不可枚举、Symbol
// ⚠️ 注意：通常需要 hasOwnProperty() 过滤

// ============================================
// 6. Object.entries() / Object.values()
// ============================================
Object.entries(obj);
// [['public', 'visible']]
// 等同于 Object.keys()，但返回 [key, value] 数组

Object.values(obj);
// ['visible']
// 等同于 Object.keys()，但只返回值

// 清理原型链污染
delete Object.prototype.inherited;
```

### 完整对比表

| 方法 | 可枚举 | 不可枚举 | Symbol | 原型链 | 返回类型 |
|------|-------|---------|--------|--------|---------|
| `Object.keys()` | ✅ | ❌ | ❌ | ❌ | `string[]` |
| `Object.getOwnPropertyNames()` | ✅ | ✅ | ❌ | ❌ | `string[]` |
| `Object.getOwnPropertySymbols()` | ✅ | ✅ | ✅ | ❌ | `symbol[]` |
| `Reflect.ownKeys()` | ✅ | ✅ | ✅ | ❌ | `(string\|symbol)[]` |
| `for...in` | ✅ | ❌ | ❌ | ✅ | 遍历 |
| `Object.entries()` | ✅ | ❌ | ❌ | ❌ | `[string, any][]` |
| `Object.values()` | ✅ | ❌ | ❌ | ❌ | `any[]` |


---

## 问题 4：内置对象的不可枚举属性有哪些？

### 常见的不可枚举属性

**1. 数组的 length**

```javascript
const arr = [1, 2, 3];

Object.keys(arr);                    // ['0', '1', '2']
Object.getOwnPropertyNames(arr);     // ['0', '1', '2', 'length']

arr.propertyIsEnumerable('length');  // false
```

**2. 函数的 name、length、prototype**

```javascript
function myFunc(a, b) {}

Object.keys(myFunc);                 // []
Object.getOwnPropertyNames(myFunc);
// ['length', 'name', 'prototype', 'arguments', 'caller']

myFunc.propertyIsEnumerable('name'); // false
myFunc.propertyIsEnumerable('length'); // false
```

**3. 类实例的 constructor（在原型上）**

```javascript
class MyClass {
  constructor() {
    this.prop = 'value';
  }
}

const instance = new MyClass();

Object.keys(instance);               // ['prop']
Object.keys(MyClass.prototype);      // []
Object.getOwnPropertyNames(MyClass.prototype);
// ['constructor']

MyClass.prototype.propertyIsEnumerable('constructor'); // false
```

**4. Error 对象的 stack**

```javascript
const err = new Error('oops');

Object.keys(err);                    // []
Object.getOwnPropertyNames(err);
// ['stack', 'message']（具体实现可能不同）

err.propertyIsEnumerable('stack');   // false（多数浏览器）
```

**5. 全局对象的内置属性**

```javascript
// 浏览器环境
Object.keys(window);                 // 很少（多数是可枚举的全局变量）
Object.getOwnPropertyNames(window);
// 几千个（包括所有内置 API）

window.propertyIsEnumerable('Array'); // false
window.propertyIsEnumerable('console'); // false
```

### 为什么这些属性不可枚举？

**设计哲学**：

1. **避免污染遍历结果**：`for...in` 和 `Object.keys()` 应该只返回"用户数据"
2. **区分元数据和数据**：`length`、`constructor` 是元数据，不是数据
3. **保持向后兼容**：早期版本的行为

```javascript
// 如果 length 可枚举，会导致问题
const arr = [1, 2, 3];

// ❌ 错误：如果 length 可枚举
for (let key in arr) {
  console.log(key);  // '0', '1', '2', 'length' - 混入了元数据
}

// ✅ 正确：length 不可枚举
for (let key in arr) {
  console.log(key);  // '0', '1', '2' - 只有数据
}
```

---

## 问题 5：如何正确遍历对象避免原型链污染？

### 原型链污染的问题

```javascript
// ⚠️ 危险：污染 Object.prototype
Object.prototype.polluted = 'bad';

const obj = { name: 'Alice' };

// ❌ 问题：for...in 会遍历到原型链上的属性
for (let key in obj) {
  console.log(key);  // 'name', 'polluted' - ❌ 包含污染属性
}

// ❌ 问题：某些库可能依赖 for...in
function clone(obj) {
  const copy = {};
  for (let key in obj) {
    copy[key] = obj[key];  // ❌ 复制了 polluted
  }
  return copy;
}

clone(obj);  // { name: 'Alice', polluted: 'bad' }
```

### 6 种防御策略

**1. 使用 Object.keys()（推荐）**

```javascript
// ✅ 最佳实践：不遍历原型链
Object.keys(obj).forEach(key => {
  console.log(key);  // 只有 'name'
});
```

**2. for...in + hasOwnProperty()（传统方法）**

```javascript
// ✅ 传统做法：手动过滤
for (let key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key);  // 只有 'name'
  }
}

// ⚠️ 注意：如果对象没有原型，hasOwnProperty 可能不存在
const nullProtoObj = Object.create(null);
nullProtoObj.name = 'Alice';

// ❌ 错误
for (let key in nullProtoObj) {
  if (nullProtoObj.hasOwnProperty(key)) {  // TypeError: hasOwnProperty is not a function
    console.log(key);
  }
}

// ✅ 安全做法：使用 Object.prototype.hasOwnProperty.call
for (let key in nullProtoObj) {
  if (Object.prototype.hasOwnProperty.call(nullProtoObj, key)) {
    console.log(key);
  }
}

// ✅ 更简洁：使用 Object.hasOwn()（ES2022+）
for (let key in nullProtoObj) {
  if (Object.hasOwn(nullProtoObj, key)) {
    console.log(key);
  }
}
```

**3. Object.create(null) 创建纯净对象**

```javascript
// ✅ 防御：创建没有原型的对象
const pureObj = Object.create(null);
pureObj.name = 'Alice';

for (let key in pureObj) {
  console.log(key);  // 只有 'name'（没有原型链）
}

// 用途：作为 Map 的替代
const map = Object.create(null);
map['user_123'] = { name: 'Alice' };
map['toString'] = { name: 'Bob' };  // 不会覆盖 Object.prototype.toString
```

**4. 使用 Map 代替普通对象**

```javascript
// ✅ 现代做法：使用 Map（没有原型链污染问题）
const map = new Map();
map.set('name', 'Alice');
map.set('polluted', 'safe');  // 不会影响原型链

for (let [key, value] of map) {
  console.log(key, value);  // 只遍历自己设置的键值对
}
```

**5. 使用 Object.entries()（ES2017+）**

```javascript
// ✅ 简洁：直接遍历键值对，不包含原型链
Object.entries(obj).forEach(([key, value]) => {
  console.log(key, value);  // 只有 'name', 'Alice'
});
```

**6. 冻结原型链（防御编程）**

```javascript
// ✅ 防御：在应用启动时冻结原型链
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);

// 阻止原型链污染
try {
  Object.prototype.polluted = 'bad';  // 静默失败（严格模式下会报错）
} catch (e) {
  console.error('原型链已冻结');
}

Object.prototype.polluted;  // undefined
```

### 实际项目推荐做法

```javascript
// 1. 默认使用 Object.keys()（最简单）
const data = { name: 'Alice', age: 25 };
Object.keys(data).forEach(key => {
  console.log(key, data[key]);
});

// 2. 需要键值对时使用 Object.entries()
Object.entries(data).forEach(([key, value]) => {
  console.log(key, value);
});

// 3. 需要存储任意键时使用 Map
const cache = new Map();
cache.set(userInput, value);  // userInput 可能是 '__proto__' 等危险键

// 4. 必须使用 for...in 时，使用 Object.hasOwn()（ES2022+）
for (let key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key);
  }
}

// 5. 创建配置对象时使用 Object.create(null)
const config = Object.create(null);
config.apiUrl = 'https://api.example.com';
```

### 清理污染

```javascript
// 清理之前的污染
delete Object.prototype.polluted;
```

---

## 问题 6：如何获取对象的所有属性（包括 Symbol 和不可枚举）？

### 完整的属性获取方案

```javascript
const obj = {
  public: 'visible'         // 可枚举
};

// 不可枚举属性
Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false
});

// Symbol 属性（可枚举）
const sym1 = Symbol('enumerable');
obj[sym1] = 'symbol value 1';

// Symbol 属性（不可枚举）
const sym2 = Symbol('non-enumerable');
Object.defineProperty(obj, sym2, {
  value: 'symbol value 2',
  enumerable: false
});

// ============================================
// 方案 1：Reflect.ownKeys()（最简单，但不区分可枚举性）
// ============================================
Reflect.ownKeys(obj);
// ['public', 'private', Symbol(enumerable), Symbol(non-enumerable)]

// ============================================
// 方案 2：分别获取（可以区分可枚举性）
// ============================================
const stringKeys = Object.getOwnPropertyNames(obj);
const symbolKeys = Object.getOwnPropertySymbols(obj);
const allKeys = [...stringKeys, ...symbolKeys];
// ['public', 'private', Symbol(enumerable), Symbol(non-enumerable)]

// ============================================
// 方案 3：完整属性描述符（包含元数据）
// ============================================
function getAllProperties(obj) {
  const keys = Reflect.ownKeys(obj);
  const props = {};

  keys.forEach(key => {
    props[key] = Object.getOwnPropertyDescriptor(obj, key);
  });

  return props;
}

getAllProperties(obj);
// {
//   public: { value: 'visible', writable: true, enumerable: true, configurable: true },
//   private: { value: 'hidden', writable: false, enumerable: false, configurable: false },
//   [Symbol(enumerable)]: { value: 'symbol value 1', writable: true, enumerable: true, configurable: true },
//   [Symbol(non-enumerable)]: { value: 'symbol value 2', writable: false, enumerable: false, configurable: false }
// }

// ============================================
// 方案 4：包含原型链的完整遍历
// ============================================
function getAllPropertiesWithPrototype(obj) {
  const props = new Set();
  let current = obj;

  while (current !== null) {
    // 获取当前层级的所有属性
    Reflect.ownKeys(current).forEach(key => props.add(key));

    // 向上遍历原型链
    current = Object.getPrototypeOf(current);
  }

  return Array.from(props);
}

class Parent {
  parentMethod() {}
}

class Child extends Parent {
  constructor() {
    super();
    this.childProp = 'value';
  }
  childMethod() {}
}

const instance = new Child();
getAllPropertiesWithPrototype(instance);
// ['childProp', 'constructor', 'childMethod', 'parentMethod', ...]
// 包含原型链上的所有属性
```

---

## 问题 7：性能对比和最佳实践

### 性能测试

```javascript
const obj = {};
for (let i = 0; i < 1000; i++) {
  obj[`key${i}`] = i;
}

// 添加一些不可枚举属性
for (let i = 0; i < 100; i++) {
  Object.defineProperty(obj, `hidden${i}`, {
    value: i,
    enumerable: false
  });
}

// 基准测试
console.time('Object.keys');
for (let i = 0; i < 10000; i++) {
  Object.keys(obj);
}
console.timeEnd('Object.keys');  // ~20ms

console.time('Object.getOwnPropertyNames');
for (let i = 0; i < 10000; i++) {
  Object.getOwnPropertyNames(obj);
}
console.timeEnd('Object.getOwnPropertyNames');  // ~25ms

console.time('Reflect.ownKeys');
for (let i = 0; i < 10000; i++) {
  Reflect.ownKeys(obj);
}
console.timeEnd('Reflect.ownKeys');  // ~30ms

console.time('for...in');
for (let i = 0; i < 10000; i++) {
  const keys = [];
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
}
console.timeEnd('for...in');  // ~80ms

// 结论：
// 1. Object.keys() 最快（只遍历可枚举属性）
// 2. Object.getOwnPropertyNames() 稍慢（需要检查 enumerable）
// 3. Reflect.ownKeys() 更慢（还要获取 Symbol）
// 4. for...in 最慢（需要遍历原型链并过滤）
```

---

## 总结

**面试回答框架**

1. **核心区别**：
   - `Object.keys()`：返回可枚举的自有属性（字符串键）
   - `Object.getOwnPropertyNames()`：返回所有自有属性（包括不可枚举，但不含 Symbol）

2. **可枚举性（enumerable）**：
   - 控制属性是否在 `for...in`、`Object.keys()`、`JSON.stringify()` 中可见
   - 内置属性（如 `length`、`constructor`）通常不可枚举
   - 使用 `Object.defineProperty()` 设置

3. **6 种遍历方法对比**：
   - `Object.keys()`：可枚举 + 自有 + 字符串
   - `Object.getOwnPropertyNames()`：所有 + 自有 + 字符串
   - `Object.getOwnPropertySymbols()`：所有 + 自有 + Symbol
   - `Reflect.ownKeys()`：所有 + 自有 + 字符串 + Symbol（最完整）
   - `for...in`：可枚举 + 原型链（需要 `hasOwnProperty()` 过滤）
   - `Object.entries()`/`values()`：等同于 `keys()`，返回值不同

4. **实际场景选择**：
   - 遍历对象属性：`Object.keys()` 或 `Object.entries()`
   - 深拷贝：`Reflect.ownKeys()` 或分别获取
   - 检查空对象：`Object.keys(obj).length === 0`
   - 防御原型链污染：使用 `Object.keys()` 代替 `for...in`

5. **防御原型链污染**：
   - 优先使用 `Object.keys()` 代替 `for...in`
   - `for...in` 必须配合 `Object.hasOwn()` 或 `hasOwnProperty.call()`
   - 创建纯净对象：`Object.create(null)`
   - 动态键使用 `Map` 代替普通对象

6. **性能考虑**：
   - `Object.keys()` 最快（只遍历可枚举属性）
   - `Reflect.ownKeys()` 最慢（需要获取 Symbol）
   - 实际项目中差异可忽略，优先考虑语义和安全性

---

## 延伸阅读

- MDN：[Object.keys()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)
- MDN：[Object.getOwnPropertyNames()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames)
- MDN：[Reflect.ownKeys()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)
- MDN：[Property Attributes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#properties)
- 【练习】实现一个深度比较函数 `deepEqual(a, b)`，需要正确处理不可枚举属性和 Symbol 属性。
