---
title: Set vs 数组：适用场景与选择策略
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入对比 Set 与数组在去重、查找、性能等方面的差异，理解各自的使用场景，掌握在实际开发中如何根据需求选择合适的数据结构。
tags:
  - 数据结构
  - Set
  - 数组
  - 性能优化
estimatedTime: 30 分钟
keywords:
  - Set
  - Array
  - 去重
  - 性能对比
  - 数据结构选择
highlight: 理解 Set 在去重和查找场景下的优势，以及数组在有序性和 API 丰富性上的不可替代性。
order: 157
---

## 问题 1：Set 与数组的核心区别是什么？

**关键差异**

| 特性 | Set | 数组 |
|------|-----|------|
| **唯一性** | ✅ 自动去重，值唯一 | ❌ 允许重复值 |
| **有序性** | ✅ 按插入顺序 | ✅ 按索引顺序 |
| **查找性能** | O(1) `has()` | O(n) `includes()` / `indexOf()` |
| **索引访问** | ❌ 无索引，不能 `set[0]` | ✅ 支持 `arr[0]` |
| **API 丰富度** | 基础操作（add/delete/has） | 丰富的数组方法（map/filter/reduce等） |
| **序列化** | ❌ 不能直接 JSON.stringify | ✅ 支持 JSON.stringify |
| **大小获取** | `size` 属性 O(1) | `length` 属性 O(1) |

```javascript
// 唯一性对比
const arr = [1, 2, 2, 3, 3, 3];
const set = new Set([1, 2, 2, 3, 3, 3]);

console.log(arr);        // [1, 2, 2, 3, 3, 3] - 保留重复
console.log([...set]);   // [1, 2, 3] - 自动去重

// 查找性能对比
const largeArr = Array.from({ length: 1000000 }, (_, i) => i);
const largeSet = new Set(largeArr);

// 数组查找：O(n)
console.time('array includes');
largeArr.includes(999999);  // 需要遍历
console.timeEnd('array includes');

// Set 查找：O(1)
console.time('set has');
largeSet.has(999999);       // 哈希查找
console.timeEnd('set has');
```

---

## 问题 2：Set 在哪些场景下比数组更有优势？

### 1. 去重操作

**数组去重需要额外处理，Set 天然支持**

```javascript
// 数组去重：需要额外代码
const arr = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];

// 方法 1：使用 Set（推荐）
const unique1 = [...new Set(arr)];  // [1, 2, 3, 4]

// 方法 2：filter + indexOf（性能较差）
const unique2 = arr.filter((item, index) => arr.indexOf(item) === index);

// 方法 3：reduce（代码复杂）
const unique3 = arr.reduce((acc, curr) => {
  if (!acc.includes(curr)) acc.push(curr);
  return acc;
}, []);

// Set 去重：简洁高效
const set = new Set(arr);
const unique = [...set];  // [1, 2, 3, 4]
```

**对象数组去重**

```javascript
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 1, name: 'Alice' },  // 重复
  { id: 3, name: 'Charlie' }
];

// 使用 Map 去重
const uniqueUsers = Array.from(
  new Map(users.map(user => [user.id, user])).values()
);
// [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }]

// 或者使用 Set 存储唯一标识
const seenIds = new Set();
const uniqueUsers2 = users.filter(user => {
  if (seenIds.has(user.id)) return false;
  seenIds.add(user.id);
  return true;
});
```

### 2. 快速查找/存在性检查

**Set 的 `has()` 方法性能远优于数组的 `includes()`**

```javascript
// 场景：检查用户权限
const adminIds = [1001, 1002, 1003, 1004, 1005];
const adminSet = new Set(adminIds);

function isAdminArray(userId) {
  return adminIds.includes(userId);  // O(n) - 需要遍历
}

function isAdminSet(userId) {
  return adminSet.has(userId);      // O(1) - 哈希查找
}

// 性能对比（数据量大时差异明显）
const largeAdminIds = Array.from({ length: 100000 }, (_, i) => i);
const largeAdminSet = new Set(largeAdminIds);

console.time('array includes');
largeAdminIds.includes(99999);
console.timeEnd('array includes');  // ~0.5ms

console.time('set has');
largeAdminSet.has(99999);
console.timeEnd('set has');         // ~0.001ms（快 500 倍）
```

### 3. 集合运算（交集、并集、差集）

**Set 原生支持集合运算，数组需要手动实现**

```javascript
const setA = new Set([1, 2, 3, 4]);
const setB = new Set([3, 4, 5, 6]);

// 并集（Union）
const union = new Set([...setA, ...setB]);
console.log([...union]);  // [1, 2, 3, 4, 5, 6]

// 交集（Intersection）
const intersection = new Set([...setA].filter(x => setB.has(x)));
console.log([...intersection]);  // [3, 4]

// 差集（Difference）
const difference = new Set([...setA].filter(x => !setB.has(x)));
console.log([...difference]);  // [1, 2]

// 数组实现交集（性能较差）
const arrA = [1, 2, 3, 4];
const arrB = [3, 4, 5, 6];
const arrIntersection = arrA.filter(x => arrB.includes(x));  // O(n²)
```

### 4. 动态添加/删除元素

**Set 的 add/delete 操作性能优于数组的 push/splice**

```javascript
// 场景：实时在线用户列表
class OnlineUserManager {
  constructor() {
    this.onlineUsers = new Set();  // 使用 Set 存储在线用户 ID
  }

  userLogin(userId) {
    this.onlineUsers.add(userId);  // O(1) 添加
  }

  userLogout(userId) {
    this.onlineUsers.delete(userId);  // O(1) 删除
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);  // O(1) 查找
  }

  getOnlineCount() {
    return this.onlineUsers.size;  // O(1) 获取大小
  }

  getAllOnlineUsers() {
    return [...this.onlineUsers];  // 转为数组用于展示
  }
}

// 如果使用数组（性能较差）
class OnlineUserManagerArray {
  constructor() {
    this.onlineUsers = [];  // 使用数组
  }

  userLogin(userId) {
    if (!this.onlineUsers.includes(userId)) {  // O(n) 查找
      this.onlineUsers.push(userId);  // O(1) 添加
    }
  }

  userLogout(userId) {
    const index = this.onlineUsers.indexOf(userId);  // O(n) 查找
    if (index > -1) {
      this.onlineUsers.splice(index, 1);  // O(n) 删除（需要移动元素）
    }
  }

  isUserOnline(userId) {
    return this.onlineUsers.includes(userId);  // O(n) 查找
  }
}
```

---

## 问题 3：数组在哪些场景下比 Set 更有优势？

### 1. 需要保持顺序和索引访问

**数组支持索引访问，Set 不支持**

```javascript
// 场景：排行榜列表
const rankings = ['Alice', 'Bob', 'Charlie', 'David'];

// 数组：可以直接通过索引访问
console.log(rankings[0]);   // 'Alice' - 第一名
console.log(rankings[1]);   // 'Bob' - 第二名

// Set：无法通过索引访问
const rankingSet = new Set(rankings);
// rankingSet[0]  // undefined - Set 不支持索引访问
// 需要转为数组才能访问
const rankingArray = [...rankingSet];
console.log(rankingArray[0]);  // 'Alice'
```

### 2. 需要丰富的数组方法

**数组提供了 map、filter、reduce、find 等丰富的方法**

```javascript
// 场景：数据处理和转换
const numbers = [1, 2, 3, 4, 5];

// 数组：丰富的链式操作
const result = numbers
  .filter(n => n % 2 === 0)    // [2, 4]
  .map(n => n * 2)              // [4, 8]
  .reduce((sum, n) => sum + n, 0);  // 12

// Set：需要先转为数组
const numberSet = new Set(numbers);
const result2 = [...numberSet]
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .reduce((sum, n) => sum + n, 0);
```

### 3. 需要重复元素

**某些场景下需要保留重复值**

```javascript
// 场景：购物车
class ShoppingCart {
  constructor() {
    this.items = [];  // 使用数组，允许重复商品
  }

  addItem(productId, quantity = 1) {
    for (let i = 0; i < quantity; i++) {
      this.items.push(productId);  // 允许重复
    }
  }

  getItemCount(productId) {
    return this.items.filter(id => id === productId).length;
  }

  getTotalItems() {
    return this.items.length;
  }
}

const cart = new ShoppingCart();
cart.addItem('product-1', 3);  // 添加 3 个相同商品
cart.addItem('product-2', 2);  // 添加 2 个相同商品
console.log(cart.getTotalItems());  // 5（保留重复）

// 如果使用 Set，会丢失数量信息
const cartSet = new Set();
cartSet.add('product-1');
cartSet.add('product-1');  // 重复添加无效
cartSet.add('product-1');
console.log(cartSet.size);  // 1（只保留一个）
```

### 4. JSON 序列化

**数组可以直接序列化，Set 需要转换**

```javascript
// 场景：API 数据交互
const data = {
  userIds: [1, 2, 3, 4, 5],
  tags: ['JavaScript', 'React', 'Vue']
};

// 数组：直接序列化
const json1 = JSON.stringify(data);
console.log(json1);
// {"userIds":[1,2,3,4,5],"tags":["JavaScript","React","Vue"]}

// Set：需要先转为数组
const dataWithSet = {
  userIds: new Set([1, 2, 3, 4, 5]),
  tags: new Set(['JavaScript', 'React', 'Vue'])
};

// 直接序列化会丢失数据
const json2 = JSON.stringify(dataWithSet);
console.log(json2);  // {"userIds":{},"tags":{}} - Set 被转为空对象

// 需要手动转换
const json3 = JSON.stringify({
  userIds: [...dataWithSet.userIds],
  tags: [...dataWithSet.tags]
});
```

### 5. 需要二维或多维结构

**数组支持多维结构，Set 只能存储一维值**

```javascript
// 场景：矩阵/表格数据
const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

// 数组：直接支持多维访问
console.log(matrix[1][2]);  // 6

// Set：无法直接存储多维结构
// const matrixSet = new Set([[1, 2, 3], [4, 5, 6]]);  // 可以，但意义不大
// matrixSet[0][1]  // 无法索引访问
```

---

## 问题 4：WeakSet 的使用场景是什么？

**WeakSet 的特性**

- 只能存储对象引用（不能存储原始值）
- 弱引用（不阻止垃圾回收）
- 无法遍历、无 `size` 属性
- 适合存储与对象生命周期绑定的标记

**典型场景：对象标记**

```javascript
// 场景：防止循环引用
const processed = new WeakSet();

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 检查是否已处理过（防止循环引用）
  if (processed.has(obj)) {
    throw new Error('Circular reference detected');
  }

  processed.add(obj);

  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }

  processed.delete(obj);  // 清理标记
  return clone;
}

// 场景：DOM 节点标记
const clickedElements = new WeakSet();

document.addEventListener('click', (e) => {
  if (clickedElements.has(e.target)) {
    console.log('Element already clicked');
    return;
  }

  clickedElements.add(e.target);
  console.log('First click on element');

  // 当 DOM 节点被移除时，WeakSet 中的引用会自动清理
});
```

---

## 总结

### 核心对比表

| 特性 | Set | 数组 |
|------|-----|------|
| **唯一性** | ✅ 自动去重 | ❌ 允许重复 |
| **查找性能** | O(1) | O(n) |
| **索引访问** | ❌ | ✅ |
| **API 丰富度** | 基础操作 | 丰富方法 |
| **序列化** | 需转换 | ✅ 直接支持 |
| **适用场景** | 去重、查找、集合运算 | 有序列表、数据处理、多维结构 |

### 选择建议

1. **需要去重或频繁查找** → 使用 Set
2. **需要索引访问或丰富数组方法** → 使用数组
3. **需要保留重复值** → 使用数组
4. **需要 JSON 序列化** → 使用数组（或 Set 转数组）
5. **需要集合运算** → 使用 Set
6. **可以组合使用** → Set 用于查找/去重，数组用于存储和操作

### 性能要点

- **查找操作**：Set 的 `has()` 比数组的 `includes()` 快 100-1000 倍（数据量大时）
- **删除操作**：Set 的 `delete()` 比数组的 `splice()` 快 100-200 倍
- **去重操作**：Set 自动去重比手动数组去重快 1000-2000 倍
- **添加操作**：两者性能相近（O(1) 平均情况）

### 推荐阅读

- [MDN: Set](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [MDN: Array](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN: WeakSet](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
