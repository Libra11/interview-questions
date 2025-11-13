---
title: Object 对象有哪些常用 API？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  全面掌握 JavaScript Object 对象的常用 API，包括属性操作、原型链、描述符、遍历等方法，理解每个 API 的使用场景和注意事项。
tags:
  - Object
  - API
  - 属性操作
  - 原型链
estimatedTime: 40 分钟
keywords:
  - Object API
  - 属性描述符
  - 原型链
  - 对象遍历
highlight: 掌握 Object 的核心 API，理解属性描述符和原型链操作，能够灵活运用各种对象操作方法
order: 37
---

## 问题 1：Object 的属性操作 API

### 基本属性操作

```javascript
const obj = { name: "Alice", age: 25 };

// 1. Object.keys() - 获取可枚举属性名
console.log(Object.keys(obj)); // ['name', 'age']

// 2. Object.values() - 获取可枚举属性值
console.log(Object.values(obj)); // ['Alice', 25]

// 3. Object.entries() - 获取可枚举属性键值对
console.log(Object.entries(obj)); // [['name', 'Alice'], ['age', 25]]

// 4. Object.fromEntries() - 从键值对创建对象
const entries = [
  ["name", "Bob"],
  ["age", 30],
];
const newObj = Object.fromEntries(entries);
console.log(newObj); // { name: 'Bob', age: 30 }

// 5. Object.hasOwnProperty() - 检查自有属性（已废弃，推荐使用 Object.hasOwn）
console.log(obj.hasOwnProperty("name")); // true

// 6. Object.hasOwn() - 检查自有属性（ES2022）
console.log(Object.hasOwn(obj, "name")); // true
console.log(Object.hasOwn(obj, "toString")); // false（继承属性）
```

### 属性名获取的区别

```javascript
const obj = {
  name: "Alice",
  age: 25,
};

// 添加不可枚举属性
Object.defineProperty(obj, "id", {
  value: 123,
  enumerable: false,
  writable: true,
  configurable: true,
});

// 添加 Symbol 属性
const symbolKey = Symbol("secret");
obj[symbolKey] = "secret value";

console.log("Object.keys():", Object.keys(obj));
// ['name', 'age'] - 只返回可枚举的字符串属性

console.log("Object.getOwnPropertyNames():", Object.getOwnPropertyNames(obj));
// ['name', 'age', 'id'] - 返回所有字符串属性（包括不可枚举）

console.log(
  "Object.getOwnPropertySymbols():",
  Object.getOwnPropertySymbols(obj)
);
// [Symbol(secret)] - 返回所有 Symbol 属性

console.log("Reflect.ownKeys():", Reflect.ownKeys(obj));
// ['name', 'age', 'id', Symbol(secret)] - 返回所有属性
```

---

## 问题 2：Object 的属性描述符 API

### 属性描述符操作

```javascript
const obj = {};

// 1. Object.defineProperty() - 定义单个属性
Object.defineProperty(obj, "name", {
  value: "Alice",
  writable: true, // 可写
  enumerable: true, // 可枚举
  configurable: true, // 可配置
});

// 2. Object.defineProperties() - 定义多个属性
Object.defineProperties(obj, {
  age: {
    value: 25,
    writable: true,
    enumerable: true,
    configurable: true,
  },
  id: {
    value: 123,
    writable: false, // 不可写
    enumerable: false, // 不可枚举
    configurable: false, // 不可配置
  },
});

// 3. Object.getOwnPropertyDescriptor() - 获取单个属性描述符
const nameDesc = Object.getOwnPropertyDescriptor(obj, "name");
console.log(nameDesc);
// {
//   value: 'Alice',
//   writable: true,
//   enumerable: true,
//   configurable: true
// }

// 4. Object.getOwnPropertyDescriptors() - 获取所有属性描述符
const allDescs = Object.getOwnPropertyDescriptors(obj);
console.log(allDescs);
```

### 访问器属性（getter/setter）

```javascript
const person = {
  firstName: "John",
  lastName: "Doe",
};

// 定义访问器属性
Object.defineProperty(person, "fullName", {
  get: function () {
    return `${this.firstName} ${this.lastName}`;
  },
  set: function (value) {
    const parts = value.split(" ");
    this.firstName = parts[0];
    this.lastName = parts[1];
  },
  enumerable: true,
  configurable: true,
});

console.log(person.fullName); // 'John Doe'
person.fullName = "Jane Smith";
console.log(person.firstName); // 'Jane'
console.log(person.lastName); // 'Smith'

// 获取访问器属性描述符
const fullNameDesc = Object.getOwnPropertyDescriptor(person, "fullName");
console.log(fullNameDesc);
// {
//   get: [Function: get],
//   set: [Function: set],
//   enumerable: true,
//   configurable: true
// }
```

### 属性特性的实际应用

```javascript
// 创建常量对象
function createConstants(obj) {
  const constants = {};

  Object.keys(obj).forEach((key) => {
    Object.defineProperty(constants, key, {
      value: obj[key],
      writable: false, // 不可修改
      enumerable: true,
      configurable: false, // 不可删除
    });
  });

  return constants;
}

const COLORS = createConstants({
  RED: "#FF0000",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
});

console.log(COLORS.RED); // '#FF0000'
COLORS.RED = "#FFFFFF"; // 静默失败（严格模式下会报错）
console.log(COLORS.RED); // '#FF0000' (未改变)

// 创建私有属性模拟
function createPrivateProperty(obj, key, value) {
  Object.defineProperty(obj, key, {
    value: value,
    writable: true,
    enumerable: false, // 不在 for...in 和 Object.keys 中出现
    configurable: false,
  });
}

const user = { name: "Alice" };
createPrivateProperty(user, "_id", 12345);

console.log(Object.keys(user)); // ['name'] - 不包含 _id
console.log(user._id); // 12345 - 但仍可访问
```

---

## 问题 3：Object 的原型链操作 API

### 原型操作

```javascript
// 1. Object.getPrototypeOf() - 获取对象的原型
const arr = [1, 2, 3];
console.log(Object.getPrototypeOf(arr) === Array.prototype); // true

const obj = {};
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true

// 2. Object.setPrototypeOf() - 设置对象的原型（不推荐使用）
const parent = { parentProp: "parent" };
const child = { childProp: "child" };

Object.setPrototypeOf(child, parent);
console.log(child.parentProp); // 'parent'

// 3. Object.create() - 创建具有指定原型的对象
const proto = {
  greet: function () {
    return `Hello, I'm ${this.name}`;
  },
};

const person = Object.create(proto);
person.name = "Alice";
console.log(person.greet()); // 'Hello, I'm Alice'

// 创建没有原型的对象
const nullProtoObj = Object.create(null);
console.log(Object.getPrototypeOf(nullProtoObj)); // null
console.log(nullProtoObj.toString); // undefined

// 4. Object.isPrototypeOf() - 检查是否在原型链中
console.log(Array.prototype.isPrototypeOf(arr)); // true
console.log(Object.prototype.isPrototypeOf(arr)); // true
console.log(proto.isPrototypeOf(person)); // true
```

### 原型链的实际应用

```javascript
// 实现继承
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
console.log(dog.speak()); // 'Buddy makes a sound'
console.log(dog.bark()); // 'Buddy barks'

// 检查原型链
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
console.log(Object.getPrototypeOf(dog) === Dog.prototype); // true
console.log(Object.getPrototypeOf(Dog.prototype) === Animal.prototype); // true
```

---

## 问题 4：Object 的对象状态控制 API

### 对象密封和冻结

```javascript
const obj = { name: "Alice", age: 25 };

// 1. Object.preventExtensions() - 阻止添加新属性
Object.preventExtensions(obj);
obj.city = "New York"; // 静默失败
console.log(obj.city); // undefined

// 检查是否可扩展
console.log(Object.isExtensible(obj)); // false

// 2. Object.seal() - 密封对象（不能添加/删除属性，但可以修改现有属性）
const sealedObj = { x: 1, y: 2 };
Object.seal(sealedObj);

sealedObj.x = 10; // 可以修改
sealedObj.z = 3; // 不能添加
delete sealedObj.y; // 不能删除

console.log(sealedObj); // { x: 10, y: 2 }
console.log(Object.isSealed(sealedObj)); // true

// 3. Object.freeze() - 冻结对象（完全不可变）
const frozenObj = { a: 1, b: 2 };
Object.freeze(frozenObj);

frozenObj.a = 10; // 不能修改
frozenObj.c = 3; // 不能添加
delete frozenObj.b; // 不能删除

console.log(frozenObj); // { a: 1, b: 2 }
console.log(Object.isFrozen(frozenObj)); // true

// 检查对象状态
console.log("isExtensible:", Object.isExtensible(frozenObj)); // false
console.log("isSealed:", Object.isSealed(frozenObj)); // true
console.log("isFrozen:", Object.isFrozen(frozenObj)); // true
```

### 深度冻结

```javascript
// 浅冻结的问题
const shallowFrozen = Object.freeze({
  name: "Alice",
  address: {
    city: "New York",
    country: "USA",
  },
});

// 嵌套对象仍然可以修改
shallowFrozen.address.city = "Boston";
console.log(shallowFrozen.address.city); // 'Boston'

// 实现深度冻结
function deepFreeze(obj) {
  // 获取所有属性名
  const propNames = Object.getOwnPropertyNames(obj);

  // 递归冻结属性
  propNames.forEach((name) => {
    const value = obj[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  });

  return Object.freeze(obj);
}

const deepFrozenObj = deepFreeze({
  name: "Alice",
  address: {
    city: "New York",
    country: "USA",
  },
  hobbies: ["reading", "coding"],
});

// 现在嵌套对象也不能修改
deepFrozenObj.address.city = "Boston"; // 静默失败
deepFrozenObj.hobbies.push("swimming"); // 抛出错误（严格模式）
console.log(deepFrozenObj.address.city); // 'New York'
```

---

## 问题 5：Object 的比较和复制 API

### 对象比较

```javascript
// 1. Object.is() - 严格相等比较（类似 === 但处理特殊值）
console.log(Object.is(1, 1)); // true
console.log(Object.is(NaN, NaN)); // true (=== 返回 false)
console.log(Object.is(+0, -0)); // false (=== 返回 true)
console.log(Object.is(null, null)); // true
console.log(Object.is(undefined, undefined)); // true

// 与 === 的区别
console.log(NaN === NaN); // false
console.log(Object.is(NaN, NaN)); // true

console.log(+0 === -0); // true
console.log(Object.is(+0, -0)); // false

// 对象比较（引用比较）
const obj1 = { name: "Alice" };
const obj2 = { name: "Alice" };
const obj3 = obj1;

console.log(Object.is(obj1, obj2)); // false (不同对象)
console.log(Object.is(obj1, obj3)); // true (相同引用)
```

### 对象复制

```javascript
// 1. Object.assign() - 浅拷贝
const source1 = { a: 1, b: 2 };
const source2 = { b: 3, c: 4 };
const target = { d: 5 };

const result = Object.assign(target, source1, source2);
console.log(result); // { d: 5, a: 1, b: 3, c: 4 }
console.log(target === result); // true (修改了原对象)

// 创建新对象的拷贝
const copy = Object.assign({}, source1, source2);
console.log(copy); // { a: 1, b: 3, c: 4 }

// 浅拷贝的限制
const original = {
  name: "Alice",
  address: {
    city: "New York",
  },
};

const shallowCopy = Object.assign({}, original);
shallowCopy.address.city = "Boston";
console.log(original.address.city); // 'Boston' (原对象也被修改)

// 2. 使用扩展运算符进行浅拷贝
const spreadCopy = { ...original };
console.log(spreadCopy); // 与 Object.assign 效果相同

// 3. 深拷贝实现
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  if (typeof obj === "object") {
    const cloned = {};
    Object.keys(obj).forEach((key) => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
}

const deepCopy = deepClone(original);
deepCopy.address.city = "Chicago";
console.log(original.address.city); // 'Boston' (原对象未被修改)
console.log(deepCopy.address.city); // 'Chicago'
```

---

## 问题 6：Object 的遍历和转换 API

### 对象遍历

```javascript
const obj = {
  name: "Alice",
  age: 25,
  city: "New York",
};

// 添加不可枚举属性
Object.defineProperty(obj, "id", {
  value: 123,
  enumerable: false,
});

// 1. for...in 循环（包括继承的可枚举属性）
console.log("for...in:");
for (const key in obj) {
  if (obj.hasOwnProperty(key)) {
    console.log(`${key}: ${obj[key]}`);
  }
}

// 2. Object.keys() + forEach
console.log("Object.keys():");
Object.keys(obj).forEach((key) => {
  console.log(`${key}: ${obj[key]}`);
});

// 3. Object.entries() 遍历
console.log("Object.entries():");
Object.entries(obj).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 4. Object.values() 遍历
console.log("Object.values():");
Object.values(obj).forEach((value) => {
  console.log(value);
});

// 5. 遍历所有属性（包括不可枚举）
console.log("All properties:");
Object.getOwnPropertyNames(obj).forEach((key) => {
  console.log(`${key}: ${obj[key]}`);
});
```

### 对象转换

```javascript
// 1. 对象转数组
const user = { name: "Alice", age: 25, city: "New York" };

const keysArray = Object.keys(user);
console.log(keysArray); // ['name', 'age', 'city']

const valuesArray = Object.values(user);
console.log(valuesArray); // ['Alice', 25, 'New York']

const entriesArray = Object.entries(user);
console.log(entriesArray); // [['name', 'Alice'], ['age', 25], ['city', 'New York']]

// 2. 数组转对象
const pairs = [
  ["x", 1],
  ["y", 2],
  ["z", 3],
];
const objFromEntries = Object.fromEntries(pairs);
console.log(objFromEntries); // { x: 1, y: 2, z: 3 }

// 3. 对象过滤
function filterObject(obj, predicate) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => predicate(key, value))
  );
}

const numbers = { a: 1, b: 2, c: 3, d: 4 };
const evenValues = filterObject(numbers, (key, value) => value % 2 === 0);
console.log(evenValues); // { b: 2, d: 4 }

// 4. 对象映射
function mapObject(obj, mapper) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, mapper(value, key)])
  );
}

const doubled = mapObject(numbers, (value) => value * 2);
console.log(doubled); // { a: 2, b: 4, c: 6, d: 8 }

// 5. 对象合并
function mergeObjects(...objects) {
  return Object.assign({}, ...objects);
}

const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const obj3 = { c: 5, d: 6 };

const merged = mergeObjects(obj1, obj2, obj3);
console.log(merged); // { a: 1, b: 3, c: 5, d: 6 }
```

---

## 问题 7：实际应用场景和最佳实践

### 场景 1：配置对象管理

```javascript
class ConfigManager {
  constructor(defaultConfig = {}) {
    this.config = Object.create(null); // 创建无原型对象
    this.setDefaults(defaultConfig);
  }

  setDefaults(defaults) {
    Object.assign(this.config, defaults);
    Object.freeze(this.config); // 冻结默认配置
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    // 创建新的配置对象而不是修改原对象
    this.config = Object.assign({}, this.config, { [key]: value });
  }

  merge(newConfig) {
    this.config = Object.assign({}, this.config, newConfig);
  }

  getAll() {
    return Object.assign({}, this.config); // 返回副本
  }

  has(key) {
    return Object.hasOwn(this.config, key);
  }

  keys() {
    return Object.keys(this.config);
  }
}

const config = new ConfigManager({
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
});

console.log(config.get("apiUrl")); // 'https://api.example.com'
config.set("timeout", 10000);
console.log(config.getAll()); // { apiUrl: '...', timeout: 10000, retries: 3 }
```

### 场景 2：对象验证器

```javascript
class ObjectValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(obj) {
    const errors = [];

    // 检查必需字段
    Object.keys(this.schema).forEach((key) => {
      const rule = this.schema[key];

      if (rule.required && !Object.hasOwn(obj, key)) {
        errors.push(`Missing required field: ${key}`);
        return;
      }

      if (Object.hasOwn(obj, key)) {
        const value = obj[key];

        // 类型检查
        if (rule.type && typeof value !== rule.type) {
          errors.push(
            `Invalid type for ${key}: expected ${
              rule.type
            }, got ${typeof value}`
          );
        }

        // 自定义验证
        if (rule.validator && !rule.validator(value)) {
          errors.push(`Validation failed for ${key}`);
        }
      }
    });

    // 检查额外字段
    Object.keys(obj).forEach((key) => {
      if (!Object.hasOwn(this.schema, key)) {
        errors.push(`Unknown field: ${key}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

const userSchema = {
  name: { type: "string", required: true },
  age: {
    type: "number",
    required: true,
    validator: (value) => value >= 0 && value <= 150,
  },
  email: {
    type: "string",
    required: true,
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  },
};

const validator = new ObjectValidator(userSchema);

const user1 = { name: "Alice", age: 25, email: "alice@example.com" };
const user2 = { name: "Bob", age: -5, email: "invalid-email" };

console.log(validator.validate(user1)); // { valid: true, errors: [] }
console.log(validator.validate(user2)); // { valid: false, errors: [...] }
```

### 场景 3：对象缓存系统

```javascript
class ObjectCache {
  constructor(maxSize = 100) {
    this.cache = Object.create(null);
    this.accessOrder = [];
    this.maxSize = maxSize;
  }

  get(key) {
    if (Object.hasOwn(this.cache, key)) {
      // 更新访问顺序
      this.updateAccessOrder(key);
      return this.cache[key];
    }
    return null;
  }

  set(key, value) {
    if (Object.hasOwn(this.cache, key)) {
      this.cache[key] = value;
      this.updateAccessOrder(key);
    } else {
      // 检查缓存大小
      if (this.size() >= this.maxSize) {
        this.evictLeastRecentlyUsed();
      }

      this.cache[key] = value;
      this.accessOrder.push(key);
    }
  }

  has(key) {
    return Object.hasOwn(this.cache, key);
  }

  delete(key) {
    if (Object.hasOwn(this.cache, key)) {
      delete this.cache[key];
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return true;
    }
    return false;
  }

  clear() {
    this.cache = Object.create(null);
    this.accessOrder = [];
  }

  size() {
    return Object.keys(this.cache).length;
  }

  keys() {
    return Object.keys(this.cache);
  }

  values() {
    return Object.values(this.cache);
  }

  entries() {
    return Object.entries(this.cache);
  }

  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  evictLeastRecentlyUsed() {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      delete this.cache[lruKey];
    }
  }
}

const cache = new ObjectCache(3);
cache.set("a", 1);
cache.set("b", 2);
cache.set("c", 3);
cache.set("d", 4); // 会移除 'a'

console.log(cache.keys()); // ['b', 'c', 'd']
console.log(cache.get("b")); // 2
cache.set("e", 5); // 会移除 'c'（因为 'b' 刚被访问）
console.log(cache.keys()); // ['b', 'd', 'e']
```

---

## 总结

**Object API 分类总结**：

### 1. 属性操作

- `Object.keys()` - 获取可枚举属性名
- `Object.values()` - 获取可枚举属性值
- `Object.entries()` - 获取可枚举属性键值对
- `Object.fromEntries()` - 从键值对创建对象
- `Object.hasOwn()` - 检查自有属性

### 2. 属性描述符

- `Object.defineProperty()` - 定义单个属性
- `Object.defineProperties()` - 定义多个属性
- `Object.getOwnPropertyDescriptor()` - 获取属性描述符
- `Object.getOwnPropertyDescriptors()` - 获取所有属性描述符

### 3. 原型链操作

- `Object.create()` - 创建具有指定原型的对象
- `Object.getPrototypeOf()` - 获取对象原型
- `Object.setPrototypeOf()` - 设置对象原型
- `Object.isPrototypeOf()` - 检查原型链关系

### 4. 对象状态控制

- `Object.preventExtensions()` / `Object.isExtensible()` - 扩展控制
- `Object.seal()` / `Object.isSealed()` - 密封控制
- `Object.freeze()` / `Object.isFrozen()` - 冻结控制

### 5. 比较和复制

- `Object.is()` - 严格相等比较
- `Object.assign()` - 浅拷贝合并

### 6. 属性枚举

- `Object.getOwnPropertyNames()` - 获取所有字符串属性
- `Object.getOwnPropertySymbols()` - 获取所有 Symbol 属性
- `Reflect.ownKeys()` - 获取所有属性

**使用建议**：

1. **属性检查**：使用 `Object.hasOwn()` 而不是 `hasOwnProperty()`
2. **对象遍历**：根据需求选择合适的遍历方法
3. **对象复制**：注意浅拷贝和深拷贝的区别
4. **原型操作**：优先使用 `Object.create()` 而不是 `Object.setPrototypeOf()`
5. **对象保护**：根据需求选择合适的保护级别
6. **性能考虑**：频繁操作时考虑 API 的性能特点
