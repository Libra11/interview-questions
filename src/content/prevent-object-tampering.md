---
title: 防止对象被篡改有哪些方式
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入探讨 JavaScript 中保护对象不被篡改的多种方式，理解 Object.preventExtensions、Object.seal、Object.freeze 的区别与使用场景，掌握 Proxy 代理和私有字段等现代保护机制。
tags:
  - 对象保护
  - 不可变性
  - 数据安全
estimatedTime: 35 分钟
keywords:
  - Object.freeze
  - Object.seal
  - Object.preventExtensions
  - Proxy
  - 私有字段
highlight: 理解三种保护级别的差异，掌握不同场景下的最佳实践
order: 24
---

## 问题 1：JavaScript 中有哪些防止对象被篡改的方式？

**快速总结**

JavaScript 提供了**三种渐进式的保护级别**，从弱到强依次为：

| 方法 | 添加属性 | 删除属性 | 修改属性 | 修改描述符 |
|------|---------|---------|---------|-----------|
| `Object.preventExtensions()` | ❌ | ✅ | ✅ | ✅ |
| `Object.seal()` | ❌ | ❌ | ✅ | ❌ |
| `Object.freeze()` | ❌ | ❌ | ❌ | ❌ |

此外，还可以通过 **Proxy 代理**、**属性描述符**、**私有字段**等方式实现更细粒度的保护。

---

## 问题 2：Object.preventExtensions() 的作用是什么？

**作用：防止对象添加新属性，但允许删除和修改现有属性**

```javascript
const obj = {
  name: 'Alice',
  age: 25
};

// 防止扩展
Object.preventExtensions(obj);

// ✅ 可以修改现有属性
obj.name = 'Bob';           // 成功
obj.age = 30;               // 成功

// ✅ 可以删除属性
delete obj.age;             // 成功

// ❌ 不能添加新属性
obj.email = 'alice@example.com';  // 静默失败（严格模式下报错）
obj['phone'] = '123456';          // 静默失败

// 检查是否可扩展
Object.isExtensible(obj);   // false
```

### 使用场景

```javascript
// 场景 1：配置对象，防止意外添加属性
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

Object.preventExtensions(config);

// 防止拼写错误导致添加新属性
config.apiUrll = 'xxx';  // 静默失败，避免 bug

// 场景 2：与 Proxy 结合，实现更严格的保护
const protectedObj = new Proxy(obj, {
  defineProperty(target, prop, descriptor) {
    throw new Error(`Cannot add property ${prop}`);
  }
});
```

### 注意事项

1. **静默失败 vs 严格模式**

```javascript
'use strict';

const obj = { name: 'Alice' };
Object.preventExtensions(obj);

obj.email = 'test@example.com';
// TypeError: Cannot add property email, object is not extensible
```

2. **不影响原型链**

```javascript
const obj = Object.preventExtensions({ name: 'Alice' });

// 仍然可以通过原型链访问属性
Object.prototype.newProp = 'value';
console.log(obj.newProp);  // 'value'（从原型链继承）
```

---

## 问题 3：Object.seal() 与 Object.preventExtensions() 的区别是什么？

**核心区别：seal() 额外禁止删除属性和修改属性描述符**

```javascript
const obj1 = {
  name: 'Alice',
  age: 25
};

const obj2 = {
  name: 'Alice',
  age: 25
};

Object.preventExtensions(obj1);
Object.seal(obj2);

// ============================================
// 1. 添加属性：两者都禁止
// ============================================
obj1.email = 'test';  // 失败
obj2.email = 'test';  // 失败

// ============================================
// 2. 删除属性：preventExtensions 允许，seal 禁止
// ============================================
delete obj1.age;      // ✅ 成功
delete obj2.age;      // ❌ 失败

// ============================================
// 3. 修改属性值：两者都允许
// ============================================
obj1.name = 'Bob';    // ✅ 成功
obj2.name = 'Bob';    // ✅ 成功

// ============================================
// 4. 修改属性描述符：preventExtensions 允许，seal 禁止
// ============================================
Object.defineProperty(obj1, 'name', {
  writable: false     // ✅ 成功
});

Object.defineProperty(obj2, 'name', {
  writable: false     // ❌ TypeError: Cannot redefine property
});

// 检查状态
Object.isSealed(obj1);        // false
Object.isSealed(obj2);        // true
Object.isExtensible(obj1);    // false
Object.isExtensible(obj2);    // false（seal 会自动调用 preventExtensions）
```

### seal() 的内部机制

```javascript
// seal() 的等价操作
function sealEquivalent(obj) {
  // 1. 防止扩展
  Object.preventExtensions(obj);
  
  // 2. 将所有属性的 configurable 设为 false
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    descriptor.configurable = false;
    Object.defineProperty(obj, prop, descriptor);
  });
  
  return obj;
}
```

### 使用场景

```javascript
// 场景：API 响应对象，防止结构被改变
function fetchUser(id) {
  const user = {
    id: id,
    name: 'Alice',
    age: 25
  };
  
  Object.seal(user);
  
  // 允许更新数据
  user.name = 'Bob';        // ✅ 可以
  
  // 防止意外删除或添加字段
  delete user.id;           // ❌ 失败
  user.email = 'test';      // ❌ 失败
  
  return user;
}
```

---

## 问题 4：Object.freeze() 如何实现完全不可变？

**作用：冻结对象，使其完全不可变（最严格的保护）**

```javascript
const obj = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'Beijing',
    street: 'Main St'
  }
};

Object.freeze(obj);

// ============================================
// 1. 不能添加属性
// ============================================
obj.email = 'test@example.com';  // ❌ 失败

// ============================================
// 2. 不能删除属性
// ============================================
delete obj.name;                 // ❌ 失败

// ============================================
// 3. 不能修改属性值
// ============================================
obj.name = 'Bob';                // ❌ 失败（静默失败）
obj.age = 30;                    // ❌ 失败

// ============================================
// 4. 不能修改属性描述符
// ============================================
Object.defineProperty(obj, 'name', {
  writable: true                 // ❌ TypeError: Cannot redefine property
});

// 检查状态
Object.isFrozen(obj);            // true
Object.isSealed(obj);            // true（freeze 会自动调用 seal）
Object.isExtensible(obj);        // false
```

### freeze() 的内部机制

```javascript
// freeze() 的等价操作
function freezeEquivalent(obj) {
  // 1. 密封对象
  Object.seal(obj);
  
  // 2. 将所有属性的 writable 设为 false
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor.writable !== undefined) {
      descriptor.writable = false;
    }
    Object.defineProperty(obj, prop, descriptor);
  });
  
  return obj;
}
```

### 浅冻结 vs 深冻结

**重要：freeze() 只冻结对象本身，不冻结嵌套对象**

```javascript
const obj = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    street: 'Main St'
  }
};

Object.freeze(obj);

// ❌ 不能修改顶层属性
obj.name = 'Bob';                // 失败

// ✅ 但可以修改嵌套对象（浅冻结）
obj.address.city = 'Shanghai';   // 成功！
obj.address.zip = '100000';      // 成功！

// 深冻结实现
function deepFreeze(obj) {
  // 获取所有自有属性名
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = obj[prop];
    
    // 如果值是对象，递归冻结
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  
  // 冻结当前对象
  return Object.freeze(obj);
}

const deepFrozen = {
  name: 'Alice',
  address: {
    city: 'Beijing'
  }
};

deepFreeze(deepFrozen);

deepFrozen.address.city = 'Shanghai';  // ❌ 失败（深冻结）
```

### 使用场景

```javascript
// 场景 1：常量配置对象
const APP_CONFIG = Object.freeze({
  API_URL: 'https://api.example.com',
  VERSION: '1.0.0',
  FEATURES: Object.freeze({
    darkMode: true,
    analytics: false
  })
});

// 场景 2：不可变状态（Redux 等状态管理）
const initialState = Object.freeze({
  user: null,
  loading: false,
  error: null
});

// 场景 3：枚举值
const STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error'
});
```

---

## 问题 5：如何通过属性描述符保护单个属性？

**使用 Object.defineProperty() 设置 writable 和 configurable**

```javascript
const obj = {
  name: 'Alice'
};

// 保护单个属性：不可写、不可配置
Object.defineProperty(obj, 'id', {
  value: 12345,
  writable: false,        // 不可修改
  configurable: false,    // 不可删除、不可重新配置
  enumerable: true
});

// ❌ 不能修改
obj.id = 999;             // 静默失败（严格模式下报错）

// ❌ 不能删除
delete obj.id;            // 失败

// ❌ 不能重新配置
Object.defineProperty(obj, 'id', {
  writable: true          // TypeError: Cannot redefine property
});

// ✅ 但可以修改其他属性
obj.name = 'Bob';         // 成功
```

### 不同保护级别的组合

```javascript
const obj = {};

// 级别 1：只读（可删除、可重新配置）
Object.defineProperty(obj, 'readonly', {
  value: 'value',
  writable: false,
  configurable: true,     // 可以删除或重新配置
  enumerable: true
});

// 级别 2：不可删除（可修改、可重新配置）
Object.defineProperty(obj, 'undeletable', {
  value: 'value',
  writable: true,
  configurable: false,    // 不能删除，但可以修改
  enumerable: true
});

// 级别 3：完全保护（不可修改、不可删除）
Object.defineProperty(obj, 'protected', {
  value: 'value',
  writable: false,
  configurable: false,    // 完全锁定
  enumerable: true
});
```

### 使用场景

```javascript
// 场景：类的私有属性模拟（ES5）
function User(name) {
  this.name = name;
  
  // 保护内部 ID，防止外部修改
  let _id = Math.random().toString(36).substr(2, 9);
  
  Object.defineProperty(this, 'id', {
    get() {
      return _id;
    },
    set() {
      throw new Error('ID cannot be changed');
    },
    configurable: false,
    enumerable: true
  });
}

const user = new User('Alice');
user.id = 'hacked';  // Error: ID cannot be changed
```

---

## 问题 6：如何使用 Proxy 实现更灵活的对象保护？

**Proxy 可以实现细粒度的访问控制和保护策略**

### 1. 防止属性添加

```javascript
const protectedObj = new Proxy({ name: 'Alice' }, {
  set(target, prop, value) {
    // 检查属性是否已存在
    if (!(prop in target)) {
      throw new Error(`Cannot add property ${prop}`);
    }
    
    // 允许修改现有属性
    target[prop] = value;
    return true;
  },
  
  defineProperty(target, prop, descriptor) {
    if (!(prop in target)) {
      throw new Error(`Cannot add property ${prop}`);
    }
    return Reflect.defineProperty(target, prop, descriptor);
  }
});

protectedObj.name = 'Bob';        // ✅ 成功
protectedObj.email = 'test';      // ❌ Error: Cannot add property email
```

### 2. 防止属性删除

```javascript
const undeletableObj = new Proxy({ name: 'Alice', age: 25 }, {
  deleteProperty(target, prop) {
    // 禁止删除某些关键属性
    if (prop === 'name') {
      throw new Error(`Cannot delete property ${prop}`);
    }
    return Reflect.deleteProperty(target, prop);
  }
});

delete undeletableObj.age;        // ✅ 成功
delete undeletableObj.name;      // ❌ Error: Cannot delete property name
```

### 3. 防止属性修改（只读代理）

```javascript
const readonlyObj = new Proxy({ name: 'Alice', age: 25 }, {
  set(target, prop, value) {
    throw new Error(`Cannot modify property ${prop}`);
  },
  
  deleteProperty(target, prop) {
    throw new Error(`Cannot delete property ${prop}`);
  }
});

readonlyObj.name = 'Bob';         // ❌ Error: Cannot modify property name
delete readonlyObj.age;           // ❌ Error: Cannot delete property age
```

### 4. 条件保护（基于值的保护）

```javascript
const conditionalProtected = new Proxy({ balance: 100 }, {
  set(target, prop, value) {
    // 保护 balance，不允许设置为负数
    if (prop === 'balance' && value < 0) {
      throw new Error('Balance cannot be negative');
    }
    
    target[prop] = value;
    return true;
  }
});

conditionalProtected.balance = 200;   // ✅ 成功
conditionalProtected.balance = -50;   // ❌ Error: Balance cannot be negative
```

### 5. 深保护（递归保护嵌套对象）

```javascript
function createProtectedProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      
      // 如果值是对象，递归创建保护代理
      if (value !== null && typeof value === 'object') {
        return createProtectedProxy(value);
      }
      
      return value;
    },
    
    set(target, prop, value) {
      throw new Error(`Cannot modify property ${prop}`);
    },
    
    deleteProperty(target, prop) {
      throw new Error(`Cannot delete property ${prop}`);
    }
  });
}

const deepProtected = createProtectedProxy({
  user: {
    name: 'Alice',
    address: {
      city: 'Beijing'
    }
  }
});

deepProtected.user.name = 'Bob';              // ❌ Error
deepProtected.user.address.city = 'Shanghai'; // ❌ Error
```

### Proxy vs Object.freeze() 对比

| 特性 | Object.freeze() | Proxy |
|------|----------------|-------|
| 性能 | 更快（原生实现） | 稍慢（拦截器开销） |
| 灵活性 | 固定规则 | 完全自定义 |
| 可撤销 | ❌ | ✅（Proxy.revocable） |
| 条件保护 | ❌ | ✅ |
| 访问日志 | ❌ | ✅ |
| 深保护 | 需要手动实现 | 可以递归实现 |

---

## 问题 7：ES2022 私有字段如何保护对象属性？

**使用 # 前缀定义私有字段，外部无法访问**

```javascript
class User {
  // 公共属性
  name;
  
  // 私有字段（只能在类内部访问）
  #id;
  #password;
  #balance = 0;
  
  constructor(name, id, password) {
    this.name = name;
    this.#id = id;
    this.#password = password;
  }
  
  // 公共方法可以访问私有字段
  getId() {
    return this.#id;
  }
  
  withdraw(amount) {
    if (amount > this.#balance) {
      throw new Error('Insufficient balance');
    }
    this.#balance -= amount;
    return this.#balance;
  }
  
  getBalance() {
    return this.#balance;
  }
}

const user = new User('Alice', '12345', 'secret');

// ✅ 可以访问公共属性
console.log(user.name);           // 'Alice'

// ❌ 无法访问私有字段
console.log(user.#id);            // SyntaxError: Private field '#id' must be declared in an enclosing class
console.log(user.#password);      // SyntaxError
user.#balance = 1000;             // SyntaxError

// ✅ 通过公共方法访问
console.log(user.getId());        // '12345'
console.log(user.getBalance());  // 0
```

### 私有字段的特性

```javascript
class BankAccount {
  #balance = 0;
  #transactions = [];
  
  deposit(amount) {
    this.#balance += amount;
    this.#transactions.push({ type: 'deposit', amount });
  }
  
  // 即使通过反射也无法访问
  getPrivateFields() {
    // 这些方法都无法访问私有字段
    console.log(Object.keys(this));              // ['deposit', 'getPrivateFields']
    console.log(Object.getOwnPropertyNames(this)); // ['deposit', 'getPrivateFields']
    console.log(Reflect.ownKeys(this));         // ['deposit', 'getPrivateFields']
    
    // 私有字段完全隐藏
    return {
      balance: this.#balance,                   // 只能在类内部访问
      transactions: this.#transactions
    };
  }
}

const account = new BankAccount();
account.deposit(100);

// 外部完全无法访问私有字段
Object.keys(account);                            // []
Reflect.ownKeys(account);                       // []
```

### 私有字段 vs 其他保护方式

| 方式 | 保护级别 | 可访问性 | 适用场景 |
|------|---------|---------|---------|
| 私有字段 `#field` | 编译时保护 | 完全不可访问 | 类设计、封装 |
| `Object.freeze()` | 运行时保护 | 可读取，不可修改 | 常量、配置 |
| `Object.defineProperty()` | 属性级保护 | 可读取，不可修改 | 单个属性保护 |
| `Proxy` | 运行时拦截 | 可自定义规则 | 复杂保护逻辑 |

---

## 问题 8：实际开发中如何选择合适的保护方式？

### 决策树

```
需要保护对象？
├─ 需要完全不可变？
│  ├─ 是 → Object.freeze()（浅冻结）或 deepFreeze()（深冻结）
│  └─ 否 → 继续
├─ 需要防止结构变化（添加/删除）？
│  ├─ 是 → Object.seal()
│  └─ 否 → 继续
├─ 只需要防止添加属性？
│  ├─ 是 → Object.preventExtensions()
│  └─ 否 → 继续
├─ 需要条件保护或自定义规则？
│  ├─ 是 → Proxy
│  └─ 否 → 继续
├─ 类设计中的私有数据？
│  ├─ 是 → 私有字段 #field
│  └─ 否 → 继续
└─ 只需要保护单个属性？
   └─ Object.defineProperty() 设置 writable/configurable
```

### 最佳实践

```javascript
// 1. 常量配置 → Object.freeze()
const CONFIG = Object.freeze({
  API_URL: 'https://api.example.com',
  VERSION: '1.0.0'
});

// 2. API 响应对象 → Object.seal()
function parseApiResponse(data) {
  const result = { ...data };
  Object.seal(result);  // 防止添加/删除字段，但允许更新值
  return result;
}

// 3. 类私有数据 → 私有字段
class SecureUser {
  #password;
  #token;
  
  constructor(password) {
    this.#password = password;
  }
}

// 4. 复杂保护逻辑 → Proxy
const protectedState = new Proxy({ count: 0 }, {
  set(target, prop, value) {
    if (prop === 'count' && value < 0) {
      throw new Error('Count cannot be negative');
    }
    target[prop] = value;
    return true;
  }
});

// 5. 单个属性保护 → Object.defineProperty()
const obj = {};
Object.defineProperty(obj, 'readonlyId', {
  value: generateId(),
  writable: false,
  configurable: false
});
```

### 性能考虑

```javascript
// Object.freeze() 性能最好（原生实现）
const frozen = Object.freeze({ ...largeObject });  // 快

// Proxy 有拦截器开销，但灵活性高
const proxied = new Proxy({ ...largeObject }, handlers);  // 稍慢

// 私有字段编译时优化，性能最好
class Fast {
  #private = 'value';  // 最快
}
```

---

## 总结

### 保护方式对比表

| 方式 | 添加 | 删除 | 修改 | 配置 | 性能 | 灵活性 |
|------|------|------|------|------|------|--------|
| `Object.preventExtensions()` | ❌ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| `Object.seal()` | ❌ | ❌ | ✅ | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| `Object.freeze()` | ❌ | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ | ⭐ |
| `Object.defineProperty()` | - | 可控制 | 可控制 | 可控制 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| `Proxy` | 可控制 | 可控制 | 可控制 | 可控制 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 私有字段 `#field` | - | - | - | - | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 核心要点

1. **三种保护级别**：preventExtensions < seal < freeze
2. **浅冻结问题**：freeze() 不递归冻结嵌套对象
3. **Proxy 灵活性**：可以实现条件保护、访问日志等复杂逻辑
4. **私有字段**：编译时保护，外部完全无法访问
5. **性能权衡**：原生方法性能最好，Proxy 灵活性最高

### 推荐阅读

- [MDN: Object.preventExtensions()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions)
- [MDN: Object.seal()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/seal)
- [MDN: Object.freeze()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [MDN: Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN: Private class fields](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/Private_class_fields)

