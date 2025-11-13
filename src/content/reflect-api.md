---
title: Reflect API 完全解析
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  系统梳理 Reflect 的 13 个静态方法、与 Object 的差异、Proxy 配合使用的最佳实践，掌握函数式编程与元编程的核心技巧。
tags:
  - ES6+
  - 元编程
  - Proxy
estimatedTime: 35 分钟
keywords:
  - Reflect
  - Proxy
  - 元编程
  - 函数式编程
highlight: 理解 Reflect 与 Proxy 的设计哲学，掌握 Reflect 在拦截器中的正确使用方式
order: 14
---

## 问题 1：Reflect 是什么？为什么需要它？

**核心定义**

`Reflect` 是 ES6 引入的内置对象，提供了一组用于**操作对象**的静态方法。这些方法与 Proxy 的拦截器（handler）方法一一对应，用于执行默认的对象操作。

**设计目标**

1. **将 Object 的内部方法暴露为普通函数**：
   - 把 `[[Get]]`、`[[Set]]` 等内部操作变成可调用的 API

2. **统一对象操作的 API**：
   - 用函数调用替代命令式操作（更函数式）

3. **提供默认行为给 Proxy**：
   - Proxy 拦截器可以调用 `Reflect` 来执行默认操作

4. **返回值更合理**：
   - 返回布尔值表示成功/失败，而不是抛出异常

**为什么需要 Reflect？**

```javascript
// ❌ 旧方式：命令式操作，分散在不同地方
delete obj.property;              // delete 运算符
obj.property = value;             // 赋值运算符
'property' in obj;                // in 运算符
Object.defineProperty(obj, ...);  // Object 方法

// ✅ 新方式：统一的函数式 API
Reflect.deleteProperty(obj, 'property');
Reflect.set(obj, 'property', value);
Reflect.has(obj, 'property');
Reflect.defineProperty(obj, ...);
```

**与 Object 方法的差异**

```javascript
// 1. 返回值更合理
try {
  Object.defineProperty(obj, 'key', descriptor);
} catch (e) {
  // 失败时抛出异常
}

if (Reflect.defineProperty(obj, 'key', descriptor)) {
  // 成功返回 true，失败返回 false（不抛异常）
}

// 2. 更合理的函数行为
Object.getPrototypeOf(1);         // TypeError
Reflect.getPrototypeOf(1);        // TypeError（一致）

Object.keys(1);                   // [] - 自动转换（不合理）
Reflect.ownKeys(1);               // TypeError（更严格）
```

---

## 问题 2：Reflect 有哪 13 个静态方法？各自的作用是什么？

### 1. Reflect.get(target, propertyKey [, receiver])

**读取属性值**

```javascript
const obj = { x: 1, y: 2 };

// 等价于 obj.x
Reflect.get(obj, 'x');            // 1

// 数组索引
Reflect.get([10, 20, 30], 1);     // 20

// 使用 receiver 修改 this
const obj2 = {
  get value() {
    return this.x + 1;
  },
  x: 10
};

const receiver = { x: 100 };
Reflect.get(obj2, 'value', receiver); // 101（this 指向 receiver）
```

### 2. Reflect.set(target, propertyKey, value [, receiver])

**设置属性值**

```javascript
const obj = {};

// 等价于 obj.x = 1
Reflect.set(obj, 'x', 1);         // true
console.log(obj.x);               // 1

// 数组索引
const arr = [1, 2, 3];
Reflect.set(arr, 1, 999);         // true
console.log(arr);                 // [1, 999, 3]

// 返回值表示是否成功
const frozen = Object.freeze({ a: 1 });
Reflect.set(frozen, 'a', 2);      // false（冻结对象无法修改）

// 触发 setter 时修改 this
const obj2 = {
  _value: 0,
  set value(val) {
    this._value = val * 2;
  }
};

const receiver = {};
Reflect.set(obj2, 'value', 10, receiver);
console.log(receiver._value);     // 20
console.log(obj2._value);         // 0（setter 中的 this 是 receiver）
```

### 3. Reflect.has(target, propertyKey)

**检查属性是否存在（包括原型链）**

```javascript
const obj = { x: 1 };

// 等价于 'x' in obj
Reflect.has(obj, 'x');            // true
Reflect.has(obj, 'toString');     // true（继承自 Object.prototype）
Reflect.has(obj, 'y');            // false
```

### 4. Reflect.deleteProperty(target, propertyKey)

**删除属性**

```javascript
const obj = { x: 1, y: 2 };

// 等价于 delete obj.x
Reflect.deleteProperty(obj, 'x'); // true
console.log(obj);                 // { y: 2 }

// 删除不存在的属性也返回 true
Reflect.deleteProperty(obj, 'z'); // true

// 无法删除不可配置的属性
const obj2 = {};
Object.defineProperty(obj2, 'fixed', {
  value: 1,
  configurable: false
});

Reflect.deleteProperty(obj2, 'fixed'); // false
console.log(obj2.fixed);          // 1
```

### 5. Reflect.ownKeys(target)

**获取所有自有属性（包括 Symbol 和不可枚举属性）**

```javascript
const sym = Symbol('key');
const obj = { a: 1, [sym]: 2 };

Object.defineProperty(obj, 'hidden', {
  value: 3,
  enumerable: false
});

// 等价于 Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))
Reflect.ownKeys(obj);
// ['a', 'hidden', Symbol(key)]

// 对比其他方法
Object.keys(obj);                 // ['a'] - 只有可枚举属性
Object.getOwnPropertyNames(obj);  // ['a', 'hidden'] - 不含 Symbol
```

### 6. Reflect.getOwnPropertyDescriptor(target, propertyKey)

**获取属性描述符**

```javascript
const obj = { x: 1 };

// 等价于 Object.getOwnPropertyDescriptor(obj, 'x')
Reflect.getOwnPropertyDescriptor(obj, 'x');
// {
//   value: 1,
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

// 不存在的属性返回 undefined
Reflect.getOwnPropertyDescriptor(obj, 'y'); // undefined
```

### 7. Reflect.defineProperty(target, propertyKey, attributes)

**定义或修改属性**

```javascript
const obj = {};

// 等价于 Object.defineProperty(obj, 'x', { value: 1 })
Reflect.defineProperty(obj, 'x', {
  value: 1,
  writable: false
});

console.log(obj.x);               // 1

// 返回布尔值（Object.defineProperty 抛异常）
const success = Reflect.defineProperty(obj, 'x', {
  value: 2
});

console.log(success);             // false（writable: false）
console.log(obj.x);               // 1（未修改）
```

### 8. Reflect.getPrototypeOf(target)

**获取原型**

```javascript
function Person() {}
const alice = new Person();

// 等价于 Object.getPrototypeOf(alice)
Reflect.getPrototypeOf(alice) === Person.prototype; // true

// 对非对象抛出 TypeError
Reflect.getPrototypeOf(1);        // TypeError
```

### 9. Reflect.setPrototypeOf(target, prototype)

**设置原型**

```javascript
const obj = {};
const proto = { x: 1 };

// 等价于 Object.setPrototypeOf(obj, proto)
Reflect.setPrototypeOf(obj, proto); // true

console.log(obj.x);               // 1（继承自原型）

// 返回布尔值
const frozen = Object.freeze({});
Reflect.setPrototypeOf(frozen, proto); // false（冻结对象无法修改原型）
```

### 10. Reflect.isExtensible(target)

**检查对象是否可扩展**

```javascript
const obj = {};

// 等价于 Object.isExtensible(obj)
Reflect.isExtensible(obj);        // true

Object.preventExtensions(obj);
Reflect.isExtensible(obj);        // false
```

### 11. Reflect.preventExtensions(target)

**阻止对象扩展**

```javascript
const obj = { x: 1 };

// 等价于 Object.preventExtensions(obj)
Reflect.preventExtensions(obj);   // true

obj.y = 2;                        // 严格模式下报错
console.log(obj.y);               // undefined
```

### 12. Reflect.apply(target, thisArgument, argumentsList)

**调用函数**

```javascript
// 等价于 Function.prototype.apply.call(fn, thisArg, args)
function sum(a, b) {
  return a + b;
}

Reflect.apply(sum, null, [1, 2]); // 3

// 更安全的方式调用数组方法
const arr = [1, 2, 3];
Reflect.apply(Array.prototype.push, arr, [4, 5]);
console.log(arr);                 // [1, 2, 3, 4, 5]

// 避免被覆盖的问题
const obj = {
  push: function() {
    console.log('fake push');
  }
};

Array.prototype.push.call(obj, 1); // 调用 obj.push（错误）
Reflect.apply(Array.prototype.push, obj, [1]); // 调用真正的 Array.prototype.push
```

### 13. Reflect.construct(target, argumentsList [, newTarget])

**以构造函数方式调用**

```javascript
// 等价于 new Target(...args)
function Person(name) {
  this.name = name;
}

const alice = Reflect.construct(Person, ['Alice']);
console.log(alice.name);          // 'Alice'
console.log(alice instanceof Person); // true

// 指定 newTarget 修改原型
function Animal() {}
Animal.prototype.type = 'animal';

const dog = Reflect.construct(Person, ['Dog'], Animal);
console.log(dog.name);            // 'Dog'
console.log(dog instanceof Animal); // true（原型是 Animal.prototype）
console.log(dog instanceof Person); // false
```

---

## 问题 3：Reflect 与 Object 的区别是什么？

### 核心差异总结

| 维度 | Object | Reflect |
|------|--------|---------|
| **设计目标** | 通用对象操作 | 元编程、与 Proxy 配合 |
| **返回值** | 抛异常或返回对象 | 返回布尔值或结果 |
| **参数验证** | 部分宽松（自动转换） | 更严格（非对象抛异常） |
| **函数式风格** | 部分方法不是函数 | 全部是静态方法 |

### 详细对比

**1. 返回值差异**

```javascript
// Object.defineProperty 失败时抛异常
try {
  Object.defineProperty(Object.freeze({}), 'key', { value: 1 });
} catch (e) {
  console.log('失败');
}

// Reflect.defineProperty 失败时返回 false
if (!Reflect.defineProperty(Object.freeze({}), 'key', { value: 1 })) {
  console.log('失败');
}
```

**2. 操作符 vs 函数**

```javascript
// 命令式操作
delete obj.property;
'property' in obj;

// 函数式操作（更易组合）
Reflect.deleteProperty(obj, 'property');
Reflect.has(obj, 'property');

// 函数式的好处：可以作为参数传递
const operations = [
  Reflect.get,
  Reflect.set,
  Reflect.has
];
```

**3. 参数验证**

```javascript
// Object.keys 自动转换非对象
Object.keys(1);                   // [] - 不合理
Object.keys(true);                // []

// Reflect.ownKeys 严格检查
Reflect.ownKeys(1);               // TypeError
Reflect.ownKeys(true);            // TypeError
```

**4. Reflect 独有的方法**

```javascript
// Reflect.apply - 更安全的函数调用
Reflect.apply(Math.max, null, [1, 2, 3]); // 3

// Reflect.construct - 灵活的构造函数调用
const instance = Reflect.construct(Date, [2024, 0, 1]);
```

---

## 问题 4：Reflect 如何与 Proxy 配合使用？

**Proxy 拦截器与 Reflect 的对应关系**

Proxy 的 13 个拦截器方法与 Reflect 的 13 个方法**完全对应**：

```javascript
const handler = {
  get(target, key, receiver) {
    console.log(`读取属性: ${key}`);
    return Reflect.get(target, key, receiver); // 执行默认行为
  },

  set(target, key, value, receiver) {
    console.log(`设置属性: ${key} = ${value}`);
    return Reflect.set(target, key, value, receiver);
  },

  has(target, key) {
    console.log(`检查属性: ${key}`);
    return Reflect.has(target, key);
  },

  deleteProperty(target, key) {
    console.log(`删除属性: ${key}`);
    return Reflect.deleteProperty(target, key);
  }

  // ...其他 9 个拦截器
};

const proxy = new Proxy({ x: 1 }, handler);

proxy.x;              // 输出: 读取属性: x → 返回 1
proxy.y = 2;          // 输出: 设置属性: y = 2
'x' in proxy;         // 输出: 检查属性: x → true
delete proxy.x;       // 输出: 删除属性: x
```

**为什么要在 Proxy 中使用 Reflect？**

```javascript
// ❌ 错误做法：不使用 Reflect
const handler = {
  get(target, key, receiver) {
    return target[key]; // 直接访问 target，this 指向错误
  }
};

const obj = {
  _value: 1,
  get value() {
    return this._value;
  }
};

const proxy = new Proxy(obj, handler);

// 问题：getter 中的 this 指向 target，而不是 proxy
const child = Object.create(proxy);
child._value = 2;
console.log(child.value); // 1 - ❌ 错误，应该是 2

// ✅ 正确做法：使用 Reflect
const handlerCorrect = {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver); // receiver 是正确的 this
  }
};

const proxyCorrect = new Proxy(obj, handlerCorrect);
const childCorrect = Object.create(proxyCorrect);
childCorrect._value = 2;
console.log(childCorrect.value); // 2 - ✅ 正确
```

**实战案例：数据验证代理**

```javascript
function createValidatedProxy(target, schema) {
  return new Proxy(target, {
    set(target, key, value, receiver) {
      // 验证类型
      const expectedType = schema[key];
      if (expectedType && typeof value !== expectedType) {
        throw new TypeError(
          `属性 ${key} 必须是 ${expectedType} 类型，实际是 ${typeof value}`
        );
      }

      // 使用 Reflect 执行默认行为
      return Reflect.set(target, key, value, receiver);
    }
  });
}

const schema = {
  name: 'string',
  age: 'number'
};

const user = createValidatedProxy({}, schema);

user.name = 'Alice';  // ✅ 成功
user.age = 25;        // ✅ 成功
user.age = '25';      // ❌ TypeError: 属性 age 必须是 number 类型
```

**实战案例：负索引数组**

```javascript
function createNegativeIndexArray(arr = []) {
  return new Proxy(arr, {
    get(target, key, receiver) {
      const index = Number(key);

      // 处理负索引
      if (index < 0) {
        key = String(target.length + index);
      }

      return Reflect.get(target, key, receiver);
    }
  });
}

const arr = createNegativeIndexArray([10, 20, 30, 40]);

console.log(arr[0]);    // 10
console.log(arr[-1]);   // 40（最后一个元素）
console.log(arr[-2]);   // 30
```

---

## 问题 5：Reflect 的实际应用场景有哪些？

### 场景 1：安全的属性访问

```javascript
// 避免访问不存在的嵌套属性导致的错误
function safeGet(obj, path, defaultValue) {
  try {
    return path.split('.').reduce((current, key) => {
      return Reflect.get(current, key);
    }, obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

const data = {
  user: {
    profile: {
      name: 'Alice'
    }
  }
};

safeGet(data, 'user.profile.name');     // 'Alice'
safeGet(data, 'user.settings.theme');   // undefined
safeGet(data, 'user.settings.theme', 'light'); // 'light'
```

### 场景 2：函数式编程工具

```javascript
// 柯里化 Reflect 方法
const get = (key) => (obj) => Reflect.get(obj, key);
const set = (key) => (value) => (obj) => {
  Reflect.set(obj, key, value);
  return obj;
};

const getName = get('name');
const setAge = set('age');

const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 }
];

users.map(getName);           // ['Alice', 'Bob']
setAge(26)(users[0]);         // { name: 'Alice', age: 26 }
```

### 场景 3：不可变数据结构

```javascript
function createImmutable(obj) {
  return new Proxy(obj, {
    set(target, key, value) {
      throw new Error('对象不可修改');
    },

    deleteProperty(target, key) {
      throw new Error('对象不可修改');
    },

    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);

      // 递归代理嵌套对象
      if (value !== null && typeof value === 'object') {
        return createImmutable(value);
      }

      return value;
    }
  });
}

const config = createImmutable({
  api: {
    url: 'https://api.example.com',
    timeout: 3000
  }
});

config.api.url = 'https://evil.com'; // ❌ Error: 对象不可修改
```

---

## 问题 6：Reflect 的性能与最佳实践

### 性能对比

```javascript
const obj = { x: 1, y: 2, z: 3 };

// 基准测试
console.time('直接访问');
for (let i = 0; i < 1000000; i++) {
  obj.x;
}
console.timeEnd('直接访问'); // ~2ms

console.time('Reflect.get');
for (let i = 0; i < 1000000; i++) {
  Reflect.get(obj, 'x');
}
console.timeEnd('Reflect.get'); // ~8ms

console.time('Proxy + Reflect');
const proxy = new Proxy(obj, {
  get: Reflect.get
});
for (let i = 0; i < 1000000; i++) {
  proxy.x;
}
console.timeEnd('Proxy + Reflect'); // ~25ms
```

**性能结论**：
- **直接访问 > Reflect > Proxy + Reflect**
- Proxy 有一定性能开销（约 3-10 倍）
- 对于高频操作（如循环内部），优先直接访问
- 对于元编程场景，Reflect 和 Proxy 的便利性远大于性能损失


---

## 总结

**面试回答框架**

1. **核心概念**：
   - Reflect 是 ES6 的内置对象，提供 13 个操作对象的静态方法
   - 设计目标：统一 API、函数式风格、与 Proxy 配合

2. **13 个方法分类**：
   - 属性操作：`get`、`set`、`has`、`deleteProperty`
   - 属性描述符：`defineProperty`、`getOwnPropertyDescriptor`、`ownKeys`
   - 原型操作：`getPrototypeOf`、`setPrototypeOf`
   - 扩展性：`isExtensible`、`preventExtensions`
   - 函数调用：`apply`、`construct`

3. **与 Object 的差异**：
   - 返回值更合理（布尔值 vs 异常）
   - 参数验证更严格
   - 全部是静态方法（函数式）
   - 与 Proxy 拦截器一一对应

4. **与 Proxy 配合**：
   - 在拦截器中调用 Reflect 执行默认行为
   - receiver 参数保证 this 指向正确
   - 13 个拦截器与 Reflect 方法完全对应

5. **实际应用**：
   - 数据验证、观察者模式、不可变对象
   - 私有属性模拟、性能监控、自动持久化
   - 函数式编程工具

6. **性能与最佳实践**：
   - Proxy 有 3-10 倍性能开销
   - 优先使用 Reflect 的函数式 API
   - 错误处理使用返回值而非异常
   - 高频操作避免不必要的 Proxy

---

## 延伸阅读

- MDN：[Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- ECMA-262：[Reflect 规范](https://tc39.es/ecma262/#sec-reflect-object)
- 【练习】使用 Proxy + Reflect 实现一个支持链式调用的深度观察对象（监听嵌套属性变化）。
