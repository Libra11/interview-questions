---
title: WeakSet 和 WeakMap 的区别和应用
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 WeakSet 和 WeakMap 的区别，掌握它们的特性和使用场景，学会在合适的情况下选择使用 WeakSet 或 WeakMap。
tags:
  - WeakSet
  - WeakMap
  - 弱引用
  - 内存管理
estimatedTime: 30 分钟
keywords:
  - WeakSet
  - WeakMap
  - 弱引用
  - 垃圾回收
  - 内存泄漏
highlight: 理解 WeakSet 和 WeakMap 的核心差异，掌握它们在不同场景下的应用，避免内存泄漏问题
order: 44
---

## 问题 1：WeakSet 和 WeakMap 的基本概念

### WeakSet 基础

```javascript
// WeakSet 只能存储对象，用于对象集合
const weakSet = new WeakSet();

const obj1 = { name: "Alice" };
const obj2 = { name: "Bob" };

// 添加对象
weakSet.add(obj1);
weakSet.add(obj2);

// 检查对象是否存在
console.log(weakSet.has(obj1)); // true
console.log(weakSet.has(obj2)); // true

// 删除对象
weakSet.delete(obj1);
console.log(weakSet.has(obj1)); // false

// ❌ 不能存储基本类型
// weakSet.add('string'); // TypeError
// weakSet.add(123);      // TypeError
```

### WeakMap 基础

```javascript
// WeakMap 存储键值对，键必须是对象
const weakMap = new WeakMap();

const key1 = { id: 1 };
const key2 = { id: 2 };

// 设置键值对
weakMap.set(key1, "value for key1");
weakMap.set(key2, "value for key2");

// 获取值
console.log(weakMap.get(key1)); // 'value for key1'
console.log(weakMap.get(key2)); // 'value for key2'

// 检查键是否存在
console.log(weakMap.has(key1)); // true

// 删除键值对
weakMap.delete(key1);
console.log(weakMap.has(key1)); // false

// ❌ 键必须是对象
// weakMap.set('string', 'value'); // TypeError
// weakMap.set(123, 'value');      // TypeError
```

---

## 问题 2：WeakSet 和 WeakMap 的核心区别

### 功能对比表

| 特性           | WeakSet            | WeakMap                        |
| -------------- | ------------------ | ------------------------------ |
| **存储内容**   | 对象集合           | 键值对（键必须是对象）         |
| **主要用途**   | 对象标记、状态追踪 | 对象关联数据、私有属性         |
| **API 方法**   | add, has, delete   | set, get, has, delete          |
| **值类型限制** | 只能存储对象       | 键必须是对象，值可以是任意类型 |
| **弱引用特性** | 是                 | 是                             |
| **可枚举性**   | 否                 | 否                             |

### 详细对比示例

```javascript
// 1. 存储内容的区别
const weakSet = new WeakSet();
const weakMap = new WeakMap();

const user = { name: "Alice", id: 1 };

// WeakSet：存储对象本身
weakSet.add(user);
console.log(weakSet.has(user)); // true

// WeakMap：存储键值对，对象作为键
weakMap.set(user, {
  lastLogin: new Date(),
  permissions: ["read", "write"],
});
console.log(weakMap.get(user)); // { lastLogin: ..., permissions: [...] }

// 2. 使用场景的区别
// WeakSet：标记对象状态
const processedObjects = new WeakSet();

function processObject(obj) {
  if (processedObjects.has(obj)) {
    console.log("对象已处理过");
    return;
  }

  // 处理对象...
  console.log("处理对象:", obj.name);
  processedObjects.add(obj);
}

// WeakMap：关联对象数据
const objectMetadata = new WeakMap();

function setMetadata(obj, metadata) {
  objectMetadata.set(obj, metadata);
}

function getMetadata(obj) {
  return objectMetadata.get(obj);
}

// 使用示例
const item = { name: "Item1" };

processObject(item); // 处理对象: Item1
processObject(item); // 对象已处理过

setMetadata(item, { created: new Date(), version: 1 });
console.log(getMetadata(item)); // { created: ..., version: 1 }
```

---

## 问题 3：WeakSet 的应用场景

### 场景 1：对象状态标记

```javascript
// 追踪已初始化的组件
const initializedComponents = new WeakSet();

class Component {
  constructor(element) {
    this.element = element;
  }

  init() {
    if (initializedComponents.has(this)) {
      console.log("组件已初始化");
      return;
    }

    // 初始化逻辑
    this.setupEventListeners();
    this.render();

    // 标记为已初始化
    initializedComponents.add(this);
    console.log("组件初始化完成");
  }

  setupEventListeners() {
    this.element.addEventListener("click", () => {
      console.log("组件被点击");
    });
  }

  render() {
    this.element.innerHTML = "<p>组件内容</p>";
  }
}

// 使用示例
const element1 = document.createElement("div");
const component1 = new Component(element1);

component1.init(); // 组件初始化完成
component1.init(); // 组件已初始化
```

### 场景 2：访问控制

```javascript
// 使用 WeakSet 实现访问控制
const authorizedUsers = new WeakSet();

class SecureResource {
  constructor() {
    this.data = "敏感数据";
  }

  grantAccess(user) {
    authorizedUsers.add(user);
    console.log(`已授权用户: ${user.name}`);
  }

  revokeAccess(user) {
    authorizedUsers.delete(user);
    console.log(`已撤销用户授权: ${user.name}`);
  }

  accessData(user) {
    if (!authorizedUsers.has(user)) {
      throw new Error("访问被拒绝：用户未授权");
    }

    return this.data;
  }
}

// 使用示例
const resource = new SecureResource();
const user1 = { name: "Alice", id: 1 };
const user2 = { name: "Bob", id: 2 };

resource.grantAccess(user1);

try {
  console.log(resource.accessData(user1)); // 敏感数据
  console.log(resource.accessData(user2)); // 抛出错误
} catch (error) {
  console.error(error.message); // 访问被拒绝：用户未授权
}
```

### 场景 3：DOM 元素管理

```javascript
// 追踪已处理的 DOM 元素
const processedElements = new WeakSet();

function enhanceElement(element) {
  if (processedElements.has(element)) {
    console.log("元素已增强过");
    return;
  }

  // 添加样式
  element.classList.add("enhanced");

  // 添加事件监听器
  element.addEventListener("mouseenter", function () {
    this.style.backgroundColor = "#f0f0f0";
  });

  element.addEventListener("mouseleave", function () {
    this.style.backgroundColor = "";
  });

  // 标记为已处理
  processedElements.add(element);
  console.log("元素增强完成");
}

// 批量处理元素
const elements = document.querySelectorAll(".item");
elements.forEach((element) => {
  enhanceElement(element);
});

// 再次处理相同元素
elements.forEach((element) => {
  enhanceElement(element); // 元素已增强过
});
```

---

## 问题 4：WeakMap 的应用场景

### 场景 1：私有属性模拟

```javascript
// 使用 WeakMap 模拟私有属性
const privateData = new WeakMap();

class BankAccount {
  constructor(accountNumber, initialBalance) {
    // 将私有数据存储在 WeakMap 中
    privateData.set(this, {
      accountNumber: accountNumber,
      balance: initialBalance,
      transactions: [],
    });
  }

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("存款金额必须大于0");
    }

    const data = privateData.get(this);
    data.balance += amount;
    data.transactions.push({
      type: "deposit",
      amount: amount,
      timestamp: new Date(),
      balance: data.balance,
    });

    console.log(`存款 ${amount}，余额：${data.balance}`);
  }

  withdraw(amount) {
    if (amount <= 0) {
      throw new Error("取款金额必须大于0");
    }

    const data = privateData.get(this);
    if (data.balance < amount) {
      throw new Error("余额不足");
    }

    data.balance -= amount;
    data.transactions.push({
      type: "withdraw",
      amount: amount,
      timestamp: new Date(),
      balance: data.balance,
    });

    console.log(`取款 ${amount}，余额：${data.balance}`);
  }

  getBalance() {
    const data = privateData.get(this);
    return data.balance;
  }

  getAccountNumber() {
    const data = privateData.get(this);
    return data.accountNumber;
  }

  getTransactionHistory() {
    const data = privateData.get(this);
    return [...data.transactions]; // 返回副本
  }
}

// 使用示例
const account = new BankAccount("123456789", 1000);

account.deposit(500); // 存款 500，余额：1500
account.withdraw(200); // 取款 200，余额：1300

console.log("余额:", account.getBalance()); // 余额: 1300
console.log("账号:", account.getAccountNumber()); // 账号: 123456789

// 无法直接访问私有数据
console.log(account.balance); // undefined
console.log(account.accountNumber); // undefined
```

### 场景 2：对象元数据存储

```javascript
// 存储对象的元数据
const objectMetadata = new WeakMap();

class MetadataManager {
  static setMetadata(obj, metadata) {
    const existing = objectMetadata.get(obj) || {};
    objectMetadata.set(obj, { ...existing, ...metadata });
  }

  static getMetadata(obj, key) {
    const metadata = objectMetadata.get(obj);
    return key ? metadata?.[key] : metadata;
  }

  static hasMetadata(obj, key) {
    const metadata = objectMetadata.get(obj);
    return key ? metadata && key in metadata : !!metadata;
  }

  static removeMetadata(obj, key) {
    const metadata = objectMetadata.get(obj);
    if (metadata && key) {
      delete metadata[key];
      if (Object.keys(metadata).length === 0) {
        objectMetadata.delete(obj);
      }
    } else {
      objectMetadata.delete(obj);
    }
  }
}

// 使用示例
const user = { name: "Alice", email: "alice@example.com" };
const product = { name: "Laptop", price: 1000 };

// 设置元数据
MetadataManager.setMetadata(user, {
  lastLogin: new Date(),
  loginCount: 1,
  preferences: { theme: "dark" },
});

MetadataManager.setMetadata(product, {
  createdAt: new Date(),
  category: "Electronics",
  tags: ["computer", "portable"],
});

// 获取元数据
console.log(MetadataManager.getMetadata(user, "lastLogin"));
console.log(MetadataManager.getMetadata(product, "category")); // Electronics

// 更新元数据
MetadataManager.setMetadata(user, { loginCount: 2 });
console.log(MetadataManager.getMetadata(user, "loginCount")); // 2
```

### 场景 3：缓存和记忆化

```javascript
// 使用 WeakMap 实现对象方法的记忆化
const memoCache = new WeakMap();

function memoize(obj, methodName) {
  const originalMethod = obj[methodName];

  if (!memoCache.has(obj)) {
    memoCache.set(obj, new Map());
  }

  const cache = memoCache.get(obj);

  obj[methodName] = function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("从缓存返回结果");
      return cache.get(key);
    }

    console.log("计算新结果");
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 示例类
class Calculator {
  expensiveOperation(n) {
    // 模拟耗时操作
    let result = 0;
    for (let i = 0; i < n * 1000000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }
}

// 使用记忆化
const calc = new Calculator();
memoize(calc, "expensiveOperation");

console.time("第一次调用");
calc.expensiveOperation(100); // 计算新结果
console.timeEnd("第一次调用");

console.time("第二次调用");
calc.expensiveOperation(100); // 从缓存返回结果
console.timeEnd("第二次调用");
```

---

## 问题 5：WeakSet 和 WeakMap 的组合使用

### 复杂的对象管理系统

```javascript
// 组合使用 WeakSet 和 WeakMap 构建复杂的对象管理系统
class ObjectManager {
  constructor() {
    // WeakSet 用于标记对象状态
    this.activeObjects = new WeakSet();
    this.processedObjects = new WeakSet();
    this.lockedObjects = new WeakSet();

    // WeakMap 用于存储对象数据
    this.objectData = new WeakMap();
    this.objectConfig = new WeakMap();
    this.objectHistory = new WeakMap();
  }

  register(obj, config = {}) {
    if (this.activeObjects.has(obj)) {
      throw new Error("对象已注册");
    }

    // 标记为活跃对象
    this.activeObjects.add(obj);

    // 存储配置
    this.objectConfig.set(obj, {
      createdAt: new Date(),
      ...config,
    });

    // 初始化数据
    this.objectData.set(obj, {
      id: Math.random().toString(36).substr(2, 9),
      status: "registered",
      metadata: {},
    });

    // 初始化历史记录
    this.objectHistory.set(obj, [
      {
        action: "register",
        timestamp: new Date(),
        details: config,
      },
    ]);

    console.log("对象注册成功");
  }

  process(obj) {
    if (!this.activeObjects.has(obj)) {
      throw new Error("对象未注册");
    }

    if (this.processedObjects.has(obj)) {
      console.log("对象已处理过");
      return;
    }

    if (this.lockedObjects.has(obj)) {
      throw new Error("对象已锁定，无法处理");
    }

    // 执行处理逻辑
    const data = this.objectData.get(obj);
    data.status = "processed";
    data.processedAt = new Date();

    // 标记为已处理
    this.processedObjects.add(obj);

    // 记录历史
    const history = this.objectHistory.get(obj);
    history.push({
      action: "process",
      timestamp: new Date(),
      details: { previousStatus: "registered" },
    });

    console.log("对象处理完成");
  }

  lock(obj) {
    if (!this.activeObjects.has(obj)) {
      throw new Error("对象未注册");
    }

    this.lockedObjects.add(obj);

    const data = this.objectData.get(obj);
    data.lockedAt = new Date();

    const history = this.objectHistory.get(obj);
    history.push({
      action: "lock",
      timestamp: new Date(),
    });

    console.log("对象已锁定");
  }

  unlock(obj) {
    if (!this.lockedObjects.has(obj)) {
      console.log("对象未锁定");
      return;
    }

    this.lockedObjects.delete(obj);

    const data = this.objectData.get(obj);
    delete data.lockedAt;
    data.unlockedAt = new Date();

    const history = this.objectHistory.get(obj);
    history.push({
      action: "unlock",
      timestamp: new Date(),
    });

    console.log("对象已解锁");
  }

  getStatus(obj) {
    if (!this.activeObjects.has(obj)) {
      return "unregistered";
    }

    const status = {
      active: this.activeObjects.has(obj),
      processed: this.processedObjects.has(obj),
      locked: this.lockedObjects.has(obj),
      data: this.objectData.get(obj),
      config: this.objectConfig.get(obj),
      history: this.objectHistory.get(obj),
    };

    return status;
  }

  unregister(obj) {
    if (!this.activeObjects.has(obj)) {
      throw new Error("对象未注册");
    }

    // 清理所有状态
    this.activeObjects.delete(obj);
    this.processedObjects.delete(obj);
    this.lockedObjects.delete(obj);

    // WeakMap 中的数据会在对象被垃圾回收时自动清理
    // 但我们也可以主动删除
    this.objectData.delete(obj);
    this.objectConfig.delete(obj);
    this.objectHistory.delete(obj);

    console.log("对象已注销");
  }
}

// 使用示例
const manager = new ObjectManager();
const obj1 = { name: "TestObject1" };
const obj2 = { name: "TestObject2" };

// 注册对象
manager.register(obj1, { priority: "high" });
manager.register(obj2, { priority: "low" });

// 处理对象
manager.process(obj1);
manager.process(obj1); // 对象已处理过

// 锁定和解锁
manager.lock(obj2);
try {
  manager.process(obj2); // 抛出错误：对象已锁定
} catch (error) {
  console.error(error.message);
}

manager.unlock(obj2);
manager.process(obj2); // 现在可以处理了

// 查看状态
console.log("obj1 状态:", manager.getStatus(obj1));
console.log("obj2 状态:", manager.getStatus(obj2));
```

---

## 问题 6：性能和内存考虑

### 内存泄漏对比

```javascript
// 使用 Set/Map 可能导致内存泄漏
function demonstrateMemoryLeak() {
  const regularSet = new Set();
  const regularMap = new Map();

  // 创建大量对象
  for (let i = 0; i < 10000; i++) {
    const obj = { id: i, data: new Array(1000).fill(i) };

    regularSet.add(obj);
    regularMap.set(obj, `data for ${i}`);
  }

  // 即使我们不再需要这些对象，它们仍然被 Set/Map 强引用
  // 无法被垃圾回收，导致内存泄漏

  console.log("Regular Set size:", regularSet.size);
  console.log("Regular Map size:", regularMap.size);
}

// 使用 WeakSet/WeakMap 避免内存泄漏
function demonstrateMemoryFriendly() {
  const weakSet = new WeakSet();
  const weakMap = new WeakMap();
  const objects = []; // 临时保存引用

  // 创建大量对象
  for (let i = 0; i < 10000; i++) {
    const obj = { id: i, data: new Array(1000).fill(i) };

    weakSet.add(obj);
    weakMap.set(obj, `data for ${i}`);
    objects.push(obj); // 临时保存
  }

  console.log("Objects created");

  // 清除强引用
  objects.length = 0;

  // 现在对象可以被垃圾回收
  // WeakSet 和 WeakMap 不会阻止垃圾回收

  // 强制垃圾回收（仅在某些环境中可用）
  if (global.gc) {
    global.gc();
    console.log("Garbage collection triggered");
  }
}

// 性能测试
function performanceComparison() {
  const iterations = 100000;

  // Set vs WeakSet 性能测试
  console.time("Set operations");
  const regularSet = new Set();
  for (let i = 0; i < iterations; i++) {
    const obj = { id: i };
    regularSet.add(obj);
    regularSet.has(obj);
  }
  console.timeEnd("Set operations");

  console.time("WeakSet operations");
  const weakSet = new WeakSet();
  const objects = [];
  for (let i = 0; i < iterations; i++) {
    const obj = { id: i };
    objects.push(obj); // 保持引用
    weakSet.add(obj);
    weakSet.has(obj);
  }
  console.timeEnd("WeakSet operations");

  // Map vs WeakMap 性能测试
  console.time("Map operations");
  const regularMap = new Map();
  for (let i = 0; i < iterations; i++) {
    const obj = { id: i };
    regularMap.set(obj, i);
    regularMap.get(obj);
  }
  console.timeEnd("Map operations");

  console.time("WeakMap operations");
  const weakMap = new WeakMap();
  const keys = [];
  for (let i = 0; i < iterations; i++) {
    const obj = { id: i };
    keys.push(obj); // 保持引用
    weakMap.set(obj, i);
    weakMap.get(obj);
  }
  console.timeEnd("WeakMap operations");
}

performanceComparison();
```

---

## 问题 7：选择使用的指导原则

### 决策流程图

```javascript
// 选择合适数据结构的决策函数
function chooseDataStructure(requirements) {
  const {
    needsIteration, // 是否需要遍历
    needsSize, // 是否需要获取大小
    preventMemoryLeaks, // 是否需要防止内存泄漏
    storeKeyValue, // 是否存储键值对
    keysMustBeObjects, // 键是否必须是对象
  } = requirements;

  if (needsIteration || needsSize) {
    return storeKeyValue ? "Map" : "Set";
  }

  if (preventMemoryLeaks && keysMustBeObjects) {
    return storeKeyValue ? "WeakMap" : "WeakSet";
  }

  return storeKeyValue ? "Map" : "Set";
}

// 使用示例
console.log(
  chooseDataStructure({
    needsIteration: false,
    needsSize: false,
    preventMemoryLeaks: true,
    storeKeyValue: false,
    keysMustBeObjects: true,
  })
); // WeakSet

console.log(
  chooseDataStructure({
    needsIteration: false,
    needsSize: false,
    preventMemoryLeaks: true,
    storeKeyValue: true,
    keysMustBeObjects: true,
  })
); // WeakMap

console.log(
  chooseDataStructure({
    needsIteration: true,
    needsSize: true,
    preventMemoryLeaks: false,
    storeKeyValue: true,
    keysMustBeObjects: false,
  })
); // Map
```

### 实际应用指南

```javascript
// 使用场景总结和建议
const useCaseGuide = {
  // WeakSet 适用场景
  weakSetUseCases: [
    "对象状态标记（已处理、已初始化等）",
    "访问控制（授权用户列表）",
    "DOM 元素管理（已增强的元素）",
    "临时对象集合（避免内存泄漏）",
  ],

  // WeakMap 适用场景
  weakMapUseCases: [
    "私有属性模拟",
    "对象元数据存储",
    "缓存和记忆化",
    "对象关联数据（避免内存泄漏）",
  ],

  // 选择建议
  recommendations: {
    useWeakSet: [
      "只需要标记对象，不需要关联额外数据",
      "需要防止内存泄漏",
      "不需要遍历集合",
      "对象可能被频繁创建和销毁",
    ],

    useWeakMap: [
      "需要为对象关联数据",
      "实现私有属性",
      "需要防止内存泄漏",
      "不需要遍历键值对",
      "对象可能被频繁创建和销毁",
    ],

    useSet: [
      "需要遍历集合",
      "需要获取集合大小",
      "存储基本类型值",
      "不担心内存泄漏",
    ],

    useMap: [
      "需要遍历键值对",
      "需要获取映射大小",
      "键可能是基本类型",
      "不担心内存泄漏",
    ],
  },
};

// 实际项目中的选择示例
class ProjectExample {
  constructor() {
    // 使用 WeakSet 标记已初始化的组件
    this.initializedComponents = new WeakSet();

    // 使用 WeakMap 存储组件的私有数据
    this.componentData = new WeakMap();

    // 使用 Set 存储需要遍历的配置项
    this.activeFeatures = new Set(["feature1", "feature2"]);

    // 使用 Map 存储需要遍历的用户设置
    this.userSettings = new Map([
      ["theme", "dark"],
      ["language", "zh-CN"],
    ]);
  }

  initComponent(component) {
    if (this.initializedComponents.has(component)) {
      return; // 已初始化
    }

    // 初始化组件
    this.initializedComponents.add(component);

    // 存储私有数据
    this.componentData.set(component, {
      createdAt: new Date(),
      id: Math.random().toString(36).substr(2, 9),
    });
  }

  getComponentData(component) {
    return this.componentData.get(component);
  }

  // 可以遍历的数据使用 Set/Map
  getAllFeatures() {
    return [...this.activeFeatures];
  }

  getAllSettings() {
    return Object.fromEntries(this.userSettings);
  }
}
```

---

## 总结

**WeakSet 和 WeakMap 的核心区别**：

### 1. 功能差异

- **WeakSet**：存储对象集合，用于对象标记和状态追踪
- **WeakMap**：存储键值对，用于对象关联数据和私有属性

### 2. API 差异

- **WeakSet**：`add()`, `has()`, `delete()`
- **WeakMap**：`set()`, `get()`, `has()`, `delete()`

### 3. 使用场景

**WeakSet 适用于**：

- 对象状态标记（已处理、已初始化）
- 访问控制（授权对象列表）
- DOM 元素管理
- 临时对象集合

**WeakMap 适用于**：

- 私有属性模拟
- 对象元数据存储
- 缓存和记忆化
- 对象关联数据

### 4. 共同特性

- 弱引用，不阻止垃圾回收
- 不可枚举，无法遍历
- 键/值必须是对象
- 自动清理

### 5. 选择建议

- **需要标记对象状态** → WeakSet
- **需要关联对象数据** → WeakMap
- **需要遍历或获取大小** → Set/Map
- **防止内存泄漏** → WeakSet/WeakMap
- **存储基本类型** → Set/Map

理解 WeakSet 和 WeakMap 的区别和应用场景，能够帮助你在合适的情况下选择正确的数据结构，避免内存泄漏，提高应用性能。
