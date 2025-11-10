---
title: 对象的遍历方式有哪些？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  全面梳理 JavaScript 中对象遍历的各种方式，理解 for...in、Object.keys、Object.values、Object.entries、Reflect.ownKeys 等方法的区别与使用场景。
tags:
  - 对象遍历
  - 属性遍历
  - for...in
  - Object.keys
  - Reflect.ownKeys
estimatedTime: 35 分钟
keywords:
  - for...in
  - Object.keys
  - Object.values
  - Object.entries
  - Reflect.ownKeys
  - 对象遍历
highlight: 理解不同遍历方式在可枚举性、Symbol 属性、原型链等方面的差异，掌握实际开发中的选择策略。
order: 29
---

## 问题 1：JavaScript 中有哪些对象遍历方式？

**快速总结**

| 方法 | 可枚举 | 不可枚举 | Symbol | 原型链 | 返回内容 |
|------|-------|---------|--------|--------|---------|
| `for...in` | ✅ | ❌ | ❌ | ✅ | 遍历键名 |
| `Object.keys()` | ✅ | ❌ | ❌ | ❌ | 键名数组 |
| `Object.values()` | ✅ | ❌ | ❌ | ❌ | 值数组 |
| `Object.entries()` | ✅ | ❌ | ❌ | ❌ | [键, 值] 数组 |
| `Object.getOwnPropertyNames()` | ✅ | ✅ | ❌ | ❌ | 键名数组 |
| `Object.getOwnPropertySymbols()` | ✅ | ✅ | ✅ | ❌ | Symbol 键数组 |
| `Reflect.ownKeys()` | ✅ | ✅ | ✅ | ❌ | 所有键数组 |
| `for...of` + `Object.keys()` | ✅ | ❌ | ❌ | ❌ | 遍历键名 |

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 添加 Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// 原型链属性
Object.prototype.inherited = 'from prototype';
```

---

## 问题 2：for...in 循环的特点是什么？

**for...in：遍历对象的所有可枚举属性（包括原型链）**

### 基本用法

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 遍历对象属性
for (let key in obj) {
  console.log(key, obj[key]);
}
// 输出：
// name Alice
// age 25
```

### 包含原型链属性

```javascript
// 在原型上添加属性
Object.prototype.inherited = 'from prototype';

const obj = {
  name: 'Alice',
  age: 25
};

// for...in 会遍历原型链上的属性
for (let key in obj) {
  console.log(key, obj[key]);
}
// 输出：
// name Alice
// age 25
// inherited from prototype  ← 包含原型链属性

// 使用 hasOwnProperty 过滤原型链属性
for (let key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(key, obj[key]);
  }
}
// 输出：
// name Alice
// age 25
```

### 不包含不可枚举和 Symbol 属性

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 添加 Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// for...in 不包含不可枚举和 Symbol 属性
for (let key in obj) {
  console.log(key);
}
// 输出：
// name
// age
// （不包含 id 和 Symbol 属性）
```

### 遍历顺序

```javascript
// for...in 的遍历顺序遵循属性创建顺序（ES2015+）
const obj = {};
obj.z = 1;
obj.a = 2;
obj[2] = 3;  // 数字键会被提前

for (let key in obj) {
  console.log(key);
}
// 输出顺序：'2', 'z', 'a'
// 数字键在前，然后按创建顺序
```

### 使用场景

```javascript
// ✅ 场景 1：需要遍历原型链时
function logAllProperties(obj) {
  for (let key in obj) {
    console.log(`${key}: ${obj[key]}`);
  }
}

// ✅ 场景 2：调试时查看对象所有属性
for (let key in obj) {
  console.log(key, obj[key]);
}

// ⚠️ 注意：通常需要配合 hasOwnProperty 使用
for (let key in obj) {
  if (obj.hasOwnProperty(key)) {
    // 只处理自有属性
  }
}
```

---

## 问题 3：Object.keys() 的特点是什么？

**Object.keys()：返回对象自身可枚举属性的键名数组**

### 基本用法

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
};

const keys = Object.keys(obj);
console.log(keys);  // ['name', 'age', 'city']
```

### 特点

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 添加 Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// 原型链属性
Object.prototype.inherited = 'from prototype';

// Object.keys() 的特点
console.log(Object.keys(obj));
// ['name', 'age']
// ✅ 只包含可枚举的自有属性
// ❌ 不包含不可枚举属性（id）
// ❌ 不包含 Symbol 属性
// ❌ 不包含原型链属性（inherited）
```

### 遍历对象

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 方式 1：使用 forEach
Object.keys(obj).forEach(key => {
  console.log(key, obj[key]);
});

// 方式 2：使用 for...of
for (const key of Object.keys(obj)) {
  console.log(key, obj[key]);
}

// 方式 3：使用 map
const values = Object.keys(obj).map(key => obj[key]);
console.log(values);  // ['Alice', 25]
```

### 使用场景

```javascript
// ✅ 场景 1：遍历对象的"公开"属性（最常见）
Object.keys(user).forEach(key => {
  console.log(key, user[key]);
});

// ✅ 场景 2：检查对象是否为空
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// ✅ 场景 3：获取对象的所有键名
const formFields = Object.keys(formData);
```

---

## 问题 4：Object.values() 和 Object.entries() 的特点是什么？

**Object.values()：返回对象自身可枚举属性的值数组**

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
};

const values = Object.values(obj);
console.log(values);  // ['Alice', 25, 'Beijing']
```

**Object.entries()：返回对象自身可枚举属性的 [键, 值] 数组**

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
};

const entries = Object.entries(obj);
console.log(entries);
// [
//   ['name', 'Alice'],
//   ['age', 25],
//   ['city', 'Beijing']
// ]
```

### 遍历对象

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
};

// 方式 1：使用 Object.values()
for (const value of Object.values(obj)) {
  console.log(value);
}
// Alice
// 25
// Beijing

// 方式 2：使用 Object.entries()
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
// name Alice
// age 25
// city Beijing

// 方式 3：转换为 Map
const map = new Map(Object.entries(obj));
console.log(map.get('name'));  // 'Alice'
```

### 使用场景

```javascript
// ✅ 场景 1：只需要值，不需要键
const scores = { alice: 90, bob: 85, charlie: 92 };
const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
console.log(total);  // 267

// ✅ 场景 2：转换为数组进行处理
const obj = { a: 1, b: 2, c: 3 };
const doubled = Object.fromEntries(
  Object.entries(obj).map(([key, value]) => [key, value * 2])
);
console.log(doubled);  // { a: 2, b: 4, c: 6 }

// ✅ 场景 3：过滤对象属性
const user = { name: 'Alice', age: 25, password: 'secret' };
const publicData = Object.fromEntries(
  Object.entries(user).filter(([key]) => key !== 'password')
);
console.log(publicData);  // { name: 'Alice', age: 25 }
```

---

## 问题 5：Object.getOwnPropertyNames() 的特点是什么？

**Object.getOwnPropertyNames()：返回对象自身所有属性（包括不可枚举）的键名数组**

### 基本用法

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 对比 Object.keys() 和 Object.getOwnPropertyNames()
console.log(Object.keys(obj));
// ['name', 'age'] - 只包含可枚举属性

console.log(Object.getOwnPropertyNames(obj));
// ['name', 'age', 'id'] - 包含所有属性（包括不可枚举）
```

### 特点

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 添加 Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// Object.getOwnPropertyNames() 的特点
console.log(Object.getOwnPropertyNames(obj));
// ['name', 'age', 'id']
// ✅ 包含不可枚举属性（id）
// ❌ 不包含 Symbol 属性
// ❌ 不包含原型链属性
```

### 使用场景

```javascript
// ✅ 场景 1：获取对象的所有属性（包括不可枚举）
function getAllPropertyNames(obj) {
  return Object.getOwnPropertyNames(obj);
}

// ✅ 场景 2：深拷贝时复制所有属性
function deepClone(obj) {
  const clone = Object.create(Object.getPrototypeOf(obj));
  
  // 复制所有属性（包括不可枚举）
  Object.getOwnPropertyNames(obj).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    Object.defineProperty(clone, key, descriptor);
  });
  
  return clone;
}

// ✅ 场景 3：检查类的所有方法（包括不可枚举的 constructor）
class MyClass {
  constructor() {}
  method() {}
}

console.log(Object.keys(MyClass.prototype));
// ['method'] - 不包含 constructor

console.log(Object.getOwnPropertyNames(MyClass.prototype));
// ['constructor', 'method'] - 包含 constructor
```

---

## 问题 6：Object.getOwnPropertySymbols() 和 Reflect.ownKeys() 的特点是什么？

**Object.getOwnPropertySymbols()：返回对象自身所有 Symbol 属性的数组**

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加 Symbol 属性
const sym1 = Symbol('secret1');
const sym2 = Symbol('secret2');
obj[sym1] = 'value1';
obj[sym2] = 'value2';

// 获取所有 Symbol 属性
const symbols = Object.getOwnPropertySymbols(obj);
console.log(symbols);  // [Symbol(secret1), Symbol(secret2)]

// 遍历 Symbol 属性
symbols.forEach(sym => {
  console.log(sym, obj[sym]);
});
```

**Reflect.ownKeys()：返回对象自身所有键（包括不可枚举和 Symbol）的数组**

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// 添加 Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// Reflect.ownKeys() 返回所有键
console.log(Reflect.ownKeys(obj));
// ['name', 'age', 'id', Symbol(secret)]
// ✅ 包含可枚举属性
// ✅ 包含不可枚举属性
// ✅ 包含 Symbol 属性
// ❌ 不包含原型链属性
```

### 完整对比

```javascript
const obj = {
  public: 'visible'  // 可枚举
};

// 不可枚举属性
Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false
});

// Symbol 属性
const sym = Symbol('secret');
obj[sym] = 'symbol value';

// 原型链属性
Object.prototype.inherited = 'from prototype';

// 对比所有方法
console.log('for...in:', Object.keys((() => {
  const keys = [];
  for (let key in obj) keys.push(key);
  return keys;
})()));
// ['public', 'inherited'] - 包含原型链

console.log('Object.keys():', Object.keys(obj));
// ['public'] - 只包含可枚举自有属性

console.log('Object.getOwnPropertyNames():', Object.getOwnPropertyNames(obj));
// ['public', 'private'] - 包含不可枚举，但不包含 Symbol

console.log('Object.getOwnPropertySymbols():', Object.getOwnPropertySymbols(obj));
// [Symbol(secret)] - 只包含 Symbol

console.log('Reflect.ownKeys():', Reflect.ownKeys(obj));
// ['public', 'private', Symbol(secret)] - 最完整
```

---

## 问题 7：for...of 可以遍历对象吗？

**for...of 不能直接遍历对象，但可以配合 Object.keys/values/entries 使用**

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing'
};

// ❌ 错误：对象不是可迭代对象
// for (const item of obj) {  // TypeError: obj is not iterable
//   console.log(item);
// }

// ✅ 正确：配合 Object.keys()
for (const key of Object.keys(obj)) {
  console.log(key, obj[key]);
}

// ✅ 正确：配合 Object.values()
for (const value of Object.values(obj)) {
  console.log(value);
}

// ✅ 正确：配合 Object.entries()
for (const [key, value] of Object.entries(obj)) {
  console.log(key, value);
}
```

### 使对象可迭代

```javascript
// 方式 1：实现 Symbol.iterator
const obj = {
  name: 'Alice',
  age: 25,
  city: 'Beijing',
  
  [Symbol.iterator]() {
    const entries = Object.entries(this);
    let index = 0;
    
    return {
      next() {
        if (index < entries.length) {
          return {
            value: entries[index++],
            done: false
          };
        }
        return { done: true };
      }
    };
  }
};

// 现在可以用 for...of 遍历
for (const [key, value] of obj) {
  console.log(key, value);
}

// 方式 2：使用生成器函数
const obj2 = {
  name: 'Alice',
  age: 25,
  city: 'Beijing',
  
  *[Symbol.iterator]() {
    for (const [key, value] of Object.entries(this)) {
      yield [key, value];
    }
  }
};

for (const [key, value] of obj2) {
  console.log(key, value);
}
```

---

## 问题 8：实际开发中如何选择遍历方式？

### 决策树

```
需要遍历对象？
├─ 需要包含原型链属性？
│  ├─ 是 → for...in（配合 hasOwnProperty 过滤）
│  └─ 否 → 继续
├─ 需要包含不可枚举属性？
│  ├─ 是 → Object.getOwnPropertyNames() 或 Reflect.ownKeys()
│  └─ 否 → 继续
├─ 需要包含 Symbol 属性？
│  ├─ 是 → Reflect.ownKeys() 或 Object.getOwnPropertySymbols()
│  └─ 否 → 继续
├─ 只需要值？
│  ├─ 是 → Object.values()
│  └─ 否 → 继续
├─ 需要键值对？
│  ├─ 是 → Object.entries()
│  └─ 否 → Object.keys()
└─ 需要最完整的键列表？
   └─ Reflect.ownKeys()
```

### 常见场景推荐

**1. 遍历对象的"公开"属性（最常见）**

```javascript
// ✅ 推荐：Object.keys()
const user = { name: 'Alice', age: 25 };
Object.keys(user).forEach(key => {
  console.log(key, user[key]);
});

// 或者使用 Object.entries()
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}
```

**2. 只需要值**

```javascript
// ✅ 推荐：Object.values()
const scores = { alice: 90, bob: 85 };
const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
```

**3. 需要键值对**

```javascript
// ✅ 推荐：Object.entries()
const user = { name: 'Alice', age: 25 };
const entries = Object.entries(user);
// [['name', 'Alice'], ['age', 25]]

// 转换为 Map
const map = new Map(Object.entries(user));
```

**4. 需要所有属性（包括不可枚举和 Symbol）**

```javascript
// ✅ 推荐：Reflect.ownKeys()
const obj = {
  public: 'visible'
};
Object.defineProperty(obj, 'private', {
  value: 'hidden',
  enumerable: false
});
const sym = Symbol('secret');
obj[sym] = 'symbol value';

const allKeys = Reflect.ownKeys(obj);
// ['public', 'private', Symbol(secret)]
```

**5. 需要包含原型链属性**

```javascript
// ✅ 使用 for...in（配合 hasOwnProperty）
const obj = { name: 'Alice' };
Object.prototype.inherited = 'from prototype';

for (let key in obj) {
  if (obj.hasOwnProperty(key)) {
    // 只处理自有属性
    console.log(key, obj[key]);
  } else {
    // 处理原型链属性
    console.log('inherited:', key, obj[key]);
  }
}
```

### 性能对比

```javascript
const obj = {};
// 创建大量属性
for (let i = 0; i < 1000000; i++) {
  obj[`key${i}`] = i;
}

// 测试不同方法的性能
console.time('Object.keys()');
Object.keys(obj);
console.timeEnd('Object.keys()');
// ~50-100ms

console.time('Object.values()');
Object.values(obj);
console.timeEnd('Object.values()');
// ~50-100ms

console.time('Object.entries()');
Object.entries(obj);
console.timeEnd('Object.entries()');
// ~100-150ms（需要创建键值对数组）

console.time('for...in');
for (let key in obj) {
  // 遍历
}
console.timeEnd('for...in');
// ~50-100ms

console.time('Reflect.ownKeys()');
Reflect.ownKeys(obj);
console.timeEnd('Reflect.ownKeys()');
// ~50-100ms
```

**性能总结**：
- `Object.keys()`、`Object.values()`、`for...in` 性能相近
- `Object.entries()` 稍慢（需要创建键值对数组）
- `Reflect.ownKeys()` 性能与 `Object.keys()` 相近

---

## 问题 9：遍历时的注意事项

### 1. 遍历顺序

```javascript
// ES2015+ 规范：遍历顺序
// 1. 数字键（按数值大小排序）
// 2. 字符串键（按创建顺序）
// 3. Symbol 键（按创建顺序）

const obj = {};
obj[3] = 'three';
obj[1] = 'one';
obj.z = 'z';
obj.a = 'a';
obj[Symbol('sym1')] = 'symbol1';
obj[Symbol('sym2')] = 'symbol2';

console.log(Object.keys(obj));
// ['1', '3', 'z', 'a'] - 数字键在前

console.log(Reflect.ownKeys(obj));
// ['1', '3', 'z', 'a', Symbol(sym1), Symbol(sym2)]
```

### 2. 修改对象时的陷阱

```javascript
const obj = {
  a: 1,
  b: 2,
  c: 3
};

// ⚠️ 在遍历时删除属性可能导致跳过某些属性
for (let key in obj) {
  if (key === 'b') {
    delete obj[key];  // 删除属性
  }
  console.log(key);  // 可能跳过某些属性
}

// ✅ 安全的方式：先收集键，再遍历
const keys = Object.keys(obj);
keys.forEach(key => {
  if (key === 'b') {
    delete obj[key];
  }
  console.log(key);
});
```

### 3. 原型链污染

```javascript
// ⚠️ 原型链污染问题
Object.prototype.polluted = 'polluted';

const obj = { name: 'Alice' };

// for...in 会包含原型链属性
for (let key in obj) {
  console.log(key);  // 'name', 'polluted'
}

// ✅ 使用 Object.keys() 避免
Object.keys(obj).forEach(key => {
  console.log(key);  // 'name'（不包含原型链属性）
});
```

### 4. 不可枚举属性的处理

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 添加不可枚举属性
Object.defineProperty(obj, 'id', {
  value: 123,
  enumerable: false
});

// Object.keys() 不包含不可枚举属性
console.log(Object.keys(obj));  // ['name', 'age']

// 如果需要包含，使用 Object.getOwnPropertyNames()
console.log(Object.getOwnPropertyNames(obj));  // ['name', 'age', 'id']
```

---

## 总结

### 核心对比表

| 方法 | 可枚举 | 不可枚举 | Symbol | 原型链 | 返回类型 | 性能 |
|------|-------|---------|--------|--------|---------|------|
| `for...in` | ✅ | ❌ | ❌ | ✅ | 遍历 | ⭐⭐⭐⭐ |
| `Object.keys()` | ✅ | ❌ | ❌ | ❌ | `string[]` | ⭐⭐⭐⭐⭐ |
| `Object.values()` | ✅ | ❌ | ❌ | ❌ | `any[]` | ⭐⭐⭐⭐⭐ |
| `Object.entries()` | ✅ | ❌ | ❌ | ❌ | `[string, any][]` | ⭐⭐⭐⭐ |
| `Object.getOwnPropertyNames()` | ✅ | ✅ | ❌ | ❌ | `string[]` | ⭐⭐⭐⭐⭐ |
| `Object.getOwnPropertySymbols()` | ✅ | ✅ | ✅ | ❌ | `symbol[]` | ⭐⭐⭐⭐⭐ |
| `Reflect.ownKeys()` | ✅ | ✅ | ✅ | ❌ | `(string\|symbol)[]` | ⭐⭐⭐⭐⭐ |

### 关键要点

1. **for...in**：遍历可枚举属性（包括原型链），需要配合 `hasOwnProperty` 使用
2. **Object.keys()**：最常用，返回可枚举自有属性的键名数组
3. **Object.values()**：只需要值时使用
4. **Object.entries()**：需要键值对时使用，可转换为 Map
5. **Object.getOwnPropertyNames()**：包含不可枚举属性
6. **Reflect.ownKeys()**：最完整，包含所有自有属性（包括 Symbol）
7. **遍历顺序**：数字键在前，然后按创建顺序

### 最佳实践

1. **日常开发**：优先使用 `Object.keys()` 或 `Object.entries()`
2. **需要值**：使用 `Object.values()`
3. **需要完整属性**：使用 `Reflect.ownKeys()`
4. **需要原型链**：使用 `for...in` + `hasOwnProperty`
5. **避免原型链污染**：使用 `Object.keys()` 而不是 `for...in`

### 推荐阅读

- [MDN: for...in](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/for...in)
- [MDN: Object.keys()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)
- [MDN: Object.entries()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
- [MDN: Reflect.ownKeys()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)

