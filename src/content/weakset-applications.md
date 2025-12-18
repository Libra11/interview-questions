---
title: WeakSet 是什么数据结构，有什么应用场景？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 WeakSet 的特性和工作原理，掌握 WeakSet 与 Set 的区别，学会在合适的场景中使用 WeakSet 避免内存泄漏。
tags:
  - WeakSet
  - 数据结构
  - 内存管理
  - ES6
estimatedTime: 25 分钟
keywords:
  - WeakSet
  - 弱引用
  - 垃圾回收
  - 内存泄漏
highlight: 理解 WeakSet 的弱引用特性，掌握其在内存管理和对象追踪中的应用场景
order: 212
---

## 问题 1：WeakSet 是什么？

**WeakSet 定义**

WeakSet 是 ES6 引入的一种集合数据结构，类似于 Set，但有以下关键特性：

1. **只能存储对象**：不能存储基本数据类型
2. **弱引用**：对存储的对象是弱引用，不会阻止垃圾回收
3. **不可枚举**：无法遍历，没有 size 属性
4. **自动清理**：当对象被垃圾回收时，会自动从 WeakSet 中移除

```javascript
// 基本使用
const weakSet = new WeakSet();

// 只能添加对象
const obj1 = { name: "Alice" };
const obj2 = { name: "Bob" };

weakSet.add(obj1);
weakSet.add(obj2);

console.log(weakSet.has(obj1)); // true
console.log(weakSet.has(obj2)); // true

// ❌ 不能添加基本类型
// weakSet.add('string'); // TypeError
// weakSet.add(123);      // TypeError
// weakSet.add(true);     // TypeError

// 删除对象
weakSet.delete(obj1);
console.log(weakSet.has(obj1)); // false
```

**WeakSet 的 API**：

```javascript
const weakSet = new WeakSet();
const obj = { id: 1 };

// 1. add(value) - 添加对象
weakSet.add(obj);

// 2. has(value) - 检查对象是否存在
console.log(weakSet.has(obj)); // true

// 3. delete(value) - 删除对象
weakSet.delete(obj);
console.log(weakSet.has(obj)); // false

// 注意：没有 clear()、size、forEach() 等方法
// console.log(weakSet.size);     // undefined
// weakSet.forEach(item => {});   // TypeError
// for (let item of weakSet) {}   // TypeError
```

---

## 问题 2：WeakSet 与 Set 的区别

### 对比表格

| 特性          | Set      | WeakSet |
| ------------- | -------- | ------- |
| **存储类型**  | 任何类型 | 仅对象  |
| **引用类型**  | 强引用   | 弱引用  |
| **可枚举**    | 是       | 否      |
| **size 属性** | 有       | 无      |
| **遍历方法**  | 有       | 无      |
| **垃圾回收**  | 阻止     | 不阻止  |

### 详细对比示例

```javascript
// Set 示例
const set = new Set();
let obj1 = { name: "Alice" };
let obj2 = { name: "Bob" };

set.add(obj1);
set.add(obj2);
set.add("string"); // ✅ 可以添加基本类型
set.add(123); // ✅ 可以添加数字

console.log(set.size); // 4
console.log([...set]); // 可以转换为数组

// 遍历 Set
set.forEach((item) => console.log(item));
for (const item of set) {
  console.log(item);
}

// WeakSet 示例
const weakSet = new WeakSet();
let obj3 = { name: "Charlie" };
let obj4 = { name: "David" };

weakSet.add(obj3);
weakSet.add(obj4);
// weakSet.add('string'); // ❌ TypeError

// console.log(weakSet.size);     // undefined
// console.log([...weakSet]);     // TypeError
// weakSet.forEach(item => {});   // TypeError

// 垃圾回收测试
obj1 = null; // Set 中的对象仍然存在，不会被回收
obj3 = null; // WeakSet 中的对象可能被回收（取决于垃圾回收器）

// 强制垃圾回收（仅在某些环境中可用）
if (global.gc) {
  global.gc();
}
```

### 内存管理差异

```javascript
// Set 的内存泄漏风险
function createSetLeak() {
  const set = new Set();

  for (let i = 0; i < 1000; i++) {
    const obj = { id: i, data: new Array(1000).fill(i) };
    set.add(obj);
  }

  return set;
}

const leakySet = createSetLeak();
// 即使不再使用这些对象，它们仍然被 Set 强引用，无法被回收

// WeakSet 的内存友好特性
function createWeakSetNoLeak() {
  const weakSet = new WeakSet();
  const objects = [];

  for (let i = 0; i < 1000; i++) {
    const obj = { id: i, data: new Array(1000).fill(i) };
    weakSet.add(obj);
    objects.push(obj); // 临时保存引用
  }

  return { weakSet, objects };
}

const { weakSet, objects } = createWeakSetNoLeak();

// 清除强引用
objects.length = 0;

// 现在 WeakSet 中的对象可以被垃圾回收
// WeakSet 不会阻止垃圾回收
```

---

## 问题 3：WeakSet 的应用场景

### 场景 1：对象标记和追踪

```javascript
// 追踪已处理的对象
const processedObjects = new WeakSet();

function processObject(obj) {
  if (processedObjects.has(obj)) {
    console.log("Object already processed");
    return;
  }

  // 执行处理逻辑
  console.log("Processing object:", obj.id);

  // 标记为已处理
  processedObjects.add(obj);
}

// 使用示例
const obj1 = { id: 1, data: "some data" };
const obj2 = { id: 2, data: "other data" };

processObject(obj1); // Processing object: 1
processObject(obj2); // Processing object: 2
processObject(obj1); // Object already processed

// 当对象不再被其他地方引用时，会自动从 WeakSet 中清除
```

### 场景 2：DOM 元素状态管理

```javascript
// 追踪已初始化的 DOM 元素
const initializedElements = new WeakSet();

function initializeElement(element) {
  if (initializedElements.has(element)) {
    console.log("Element already initialized");
    return;
  }

  // 初始化逻辑
  element.classList.add("initialized");
  element.addEventListener("click", handleClick);

  // 标记为已初始化
  initializedElements.add(element);
  console.log("Element initialized");
}

function handleClick(event) {
  console.log("Element clicked:", event.target);
}

// 使用示例
const button1 = document.createElement("button");
const button2 = document.createElement("button");

initializeElement(button1); // Element initialized
initializeElement(button2); // Element initialized
initializeElement(button1); // Element already initialized

// 当 DOM 元素被移除时，会自动从 WeakSet 中清除
document.body.appendChild(button1);
document.body.appendChild(button2);

// 稍后移除元素
setTimeout(() => {
  document.body.removeChild(button1);
  // button1 现在可能被垃圾回收，并自动从 WeakSet 中移除
}, 5000);
```

### 场景 3：私有属性模拟

```javascript
// 使用 WeakSet 模拟私有属性访问控制
const privateAccess = new WeakSet();

class BankAccount {
  constructor(initialBalance) {
    // 将实例添加到私有访问集合
    privateAccess.add(this);

    // 私有属性（通过闭包）
    let balance = initialBalance;

    // 私有方法
    this._getBalance = function () {
      if (!privateAccess.has(this)) {
        throw new Error("Access denied");
      }
      return balance;
    };

    this._setBalance = function (newBalance) {
      if (!privateAccess.has(this)) {
        throw new Error("Access denied");
      }
      balance = newBalance;
    };
  }

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const currentBalance = this._getBalance();
    this._setBalance(currentBalance + amount);
  }

  withdraw(amount) {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const currentBalance = this._getBalance();
    if (currentBalance < amount) {
      throw new Error("Insufficient funds");
    }

    this._setBalance(currentBalance - amount);
  }

  getBalance() {
    return this._getBalance();
  }

  // 销毁账户时从私有访问集合中移除
  destroy() {
    privateAccess.delete(this);
  }
}

// 使用示例
const account = new BankAccount(1000);
console.log(account.getBalance()); // 1000

account.deposit(500);
console.log(account.getBalance()); // 1500

// 尝试直接访问私有方法（在实际应用中这不会暴露）
// const fakeAccount = { _getBalance: account._getBalance };
// fakeAccount._getBalance(); // Error: Access denied
```

### 场景 4：对象关系管理

```javascript
// 管理对象之间的关系
class RelationshipManager {
  constructor() {
    this.friends = new WeakSet();
    this.blocked = new WeakSet();
    this.followers = new WeakSet();
  }

  addFriend(user) {
    if (this.blocked.has(user)) {
      throw new Error("Cannot add blocked user as friend");
    }

    this.friends.add(user);
    console.log(`Added ${user.name} as friend`);
  }

  blockUser(user) {
    this.blocked.add(user);
    this.friends.delete(user); // 移除好友关系
    console.log(`Blocked ${user.name}`);
  }

  addFollower(user) {
    this.followers.add(user);
    console.log(`${user.name} is now following`);
  }

  isFriend(user) {
    return this.friends.has(user);
  }

  isBlocked(user) {
    return this.blocked.has(user);
  }

  isFollower(user) {
    return this.followers.has(user);
  }

  canInteract(user) {
    return !this.blocked.has(user);
  }
}

// 使用示例
const alice = { name: "Alice", id: 1 };
const bob = { name: "Bob", id: 2 };
const charlie = { name: "Charlie", id: 3 };

const aliceRelations = new RelationshipManager();

aliceRelations.addFriend(bob); // Added Bob as friend
aliceRelations.addFollower(charlie); // Charlie is now following

console.log(aliceRelations.isFriend(bob)); // true
console.log(aliceRelations.isFollower(charlie)); // true

aliceRelations.blockUser(bob); // Blocked Bob
console.log(aliceRelations.isFriend(bob)); // false
console.log(aliceRelations.canInteract(bob)); // false

// 当用户对象被垃圾回收时，关系也会自动清理
```

### 场景 5：缓存和临时标记

```javascript
// 临时标记系统
class TemporaryMarker {
  constructor() {
    this.marked = new WeakSet();
    this.processing = new WeakSet();
    this.completed = new WeakSet();
  }

  mark(obj) {
    this.marked.add(obj);
  }

  startProcessing(obj) {
    if (!this.marked.has(obj)) {
      throw new Error("Object not marked for processing");
    }

    this.processing.add(obj);
    console.log("Started processing:", obj.id);
  }

  completeProcessing(obj) {
    if (!this.processing.has(obj)) {
      throw new Error("Object not being processed");
    }

    this.processing.delete(obj);
    this.completed.add(obj);
    console.log("Completed processing:", obj.id);
  }

  isMarked(obj) {
    return this.marked.has(obj);
  }

  isProcessing(obj) {
    return this.processing.has(obj);
  }

  isCompleted(obj) {
    return this.completed.has(obj);
  }

  getStatus(obj) {
    if (this.completed.has(obj)) return "completed";
    if (this.processing.has(obj)) return "processing";
    if (this.marked.has(obj)) return "marked";
    return "unmarked";
  }
}

// 批处理示例
async function batchProcess(items) {
  const marker = new TemporaryMarker();

  // 标记所有项目
  items.forEach((item) => marker.mark(item));

  // 并发处理
  const promises = items.map(async (item) => {
    marker.startProcessing(item);

    // 模拟异步处理
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    marker.completeProcessing(item);
    return item;
  });

  const results = await Promise.all(promises);

  // 检查状态
  items.forEach((item) => {
    console.log(`Item ${item.id}: ${marker.getStatus(item)}`);
  });

  return results;
}

// 使用示例
const items = [
  { id: 1, data: "item1" },
  { id: 2, data: "item2" },
  { id: 3, data: "item3" },
];

batchProcess(items);
```

---

## 问题 4：WeakSet 的限制和注意事项

### 限制 1：不可枚举

```javascript
const weakSet = new WeakSet();
const obj1 = { name: "Alice" };
const obj2 = { name: "Bob" };

weakSet.add(obj1);
weakSet.add(obj2);

// ❌ 无法遍历
// for (const item of weakSet) {} // TypeError

// ❌ 无法获取大小
// console.log(weakSet.size); // undefined

// ❌ 无法转换为数组
// console.log([...weakSet]); // TypeError

// ❌ 无法使用 forEach
// weakSet.forEach(item => {}); // TypeError

// ✅ 只能通过 has() 检查特定对象
console.log(weakSet.has(obj1)); // true
```

### 限制 2：只能存储对象

```javascript
const weakSet = new WeakSet();

// ✅ 可以存储的类型
weakSet.add({}); // 普通对象
weakSet.add([]); // 数组
weakSet.add(function () {}); // 函数
weakSet.add(new Date()); // Date 对象
weakSet.add(new RegExp("test")); // RegExp 对象

// ❌ 不能存储的类型
// weakSet.add('string');    // TypeError
// weakSet.add(123);         // TypeError
// weakSet.add(true);        // TypeError
// weakSet.add(null);        // TypeError
// weakSet.add(undefined);   // TypeError
// weakSet.add(Symbol('s')); // TypeError
```

### 限制 3：垃圾回收的不确定性

```javascript
// 垃圾回收时机不确定
function demonstrateGC() {
  const weakSet = new WeakSet();
  let obj = { data: "test" };

  weakSet.add(obj);
  console.log("Added to WeakSet:", weakSet.has(obj)); // true

  // 移除强引用
  obj = null;

  // 此时对象可能还在 WeakSet 中，因为垃圾回收还没有运行
  // 无法直接检查，因为我们已经失去了对象的引用

  // 强制垃圾回收（仅在某些环境中可用）
  if (global.gc) {
    global.gc();
    console.log("Garbage collection triggered");
  }

  // 即使触发了垃圾回收，也无法保证对象立即被清理
}

demonstrateGC();
```

### 注意事项：内存泄漏预防

```javascript
// ❌ 错误使用：仍然可能导致内存泄漏
class BadExample {
  constructor() {
    this.weakSet = new WeakSet();
    this.strongReferences = []; // 问题：保持强引用
  }

  addObject(obj) {
    this.weakSet.add(obj);
    this.strongReferences.push(obj); // 这会阻止垃圾回收
  }
}

// ✅ 正确使用：避免额外的强引用
class GoodExample {
  constructor() {
    this.weakSet = new WeakSet();
  }

  addObject(obj) {
    this.weakSet.add(obj);
    // 不保存额外的强引用
  }

  hasObject(obj) {
    return this.weakSet.has(obj);
  }

  // 如果需要临时操作，使用完后立即清理
  processObjects(objects) {
    objects.forEach((obj) => {
      this.weakSet.add(obj);
      // 处理对象...
    });

    // 不保存 objects 数组的引用
  }
}
```

---

## 问题 5：WeakSet 与 WeakMap 的对比

### 相似点

```javascript
// 都是弱引用集合
const weakSet = new WeakSet();
const weakMap = new WeakMap();

const obj = { name: "test" };

// 都只能存储对象作为键/值
weakSet.add(obj);
weakMap.set(obj, "some value");

// 都不阻止垃圾回收
// 都不可枚举
// 都没有 size 属性
```

### 不同点

```javascript
// WeakSet：存储对象集合
const weakSet = new WeakSet();
const obj1 = { id: 1 };
const obj2 = { id: 2 };

weakSet.add(obj1);
weakSet.add(obj2);

console.log(weakSet.has(obj1)); // true
weakSet.delete(obj1);

// WeakMap：存储键值对
const weakMap = new WeakMap();
const key1 = { name: "key1" };
const key2 = { name: "key2" };

weakMap.set(key1, "value1");
weakMap.set(key2, "value2");

console.log(weakMap.get(key1)); // 'value1'
console.log(weakMap.has(key1)); // true
weakMap.delete(key1);

// 使用场景对比
// WeakSet：对象标记、状态追踪
// WeakMap：对象关联数据、私有属性
```

### 实际应用对比

```javascript
// WeakSet 应用：对象状态管理
class ComponentManager {
  constructor() {
    this.mountedComponents = new WeakSet();
    this.destroyedComponents = new WeakSet();
  }

  mount(component) {
    this.mountedComponents.add(component);
  }

  destroy(component) {
    this.mountedComponents.delete(component);
    this.destroyedComponents.add(component);
  }

  isMounted(component) {
    return this.mountedComponents.has(component);
  }
}

// WeakMap 应用：对象关联数据
class ComponentData {
  constructor() {
    this.componentData = new WeakMap();
  }

  setData(component, data) {
    this.componentData.set(component, data);
  }

  getData(component) {
    return this.componentData.get(component);
  }

  hasData(component) {
    return this.componentData.has(component);
  }
}

// 组合使用
class AdvancedComponentManager {
  constructor() {
    this.mounted = new WeakSet(); // 状态追踪
    this.data = new WeakMap(); // 数据关联
    this.listeners = new WeakMap(); // 事件监听器
  }

  mount(component, initialData = {}) {
    this.mounted.add(component);
    this.data.set(component, initialData);

    const listeners = new Set();
    this.listeners.set(component, listeners);
  }

  addEventListener(component, event, handler) {
    if (!this.mounted.has(component)) {
      throw new Error("Component not mounted");
    }

    const listeners = this.listeners.get(component);
    listeners.add({ event, handler });
  }

  updateData(component, newData) {
    if (!this.mounted.has(component)) {
      throw new Error("Component not mounted");
    }

    const currentData = this.data.get(component) || {};
    this.data.set(component, { ...currentData, ...newData });
  }

  unmount(component) {
    this.mounted.delete(component);
    // WeakMap 中的数据会在组件被垃圾回收时自动清理
  }
}
```

---

## 总结

**WeakSet 的核心特性**：

1. **弱引用**：不阻止对象被垃圾回收
2. **对象专用**：只能存储对象，不能存储基本类型
3. **不可枚举**：无法遍历，没有 size 属性
4. **自动清理**：对象被回收时自动从 WeakSet 中移除

**主要应用场景**：

1. **对象标记**：标记已处理、已初始化的对象
2. **状态追踪**：追踪对象的临时状态
3. **DOM 管理**：管理 DOM 元素的状态
4. **访问控制**：模拟私有属性访问
5. **关系管理**：管理对象间的临时关系

**使用建议**：

1. **内存敏感场景**：当需要避免内存泄漏时使用
2. **临时标记**：对象的临时状态管理
3. **不需要遍历**：只需要检查特定对象是否存在
4. **自动清理**：希望对象被回收时自动清理关联数据

**注意事项**：

1. 不能遍历或获取大小
2. 垃圾回收时机不确定
3. 只能存储对象引用
4. 需要保持对象的强引用才能继续使用

WeakSet 是一个专门用于内存管理和对象状态追踪的工具，在需要避免内存泄漏的场景中非常有用。
