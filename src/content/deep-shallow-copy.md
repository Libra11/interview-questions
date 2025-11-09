---
title: 深浅拷贝完全解析
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  系统梳理深浅拷贝的核心差异、实现方案与常见陷阱，掌握 structuredClone、JSON 序列化、递归拷贝等多种方案的适用场景。
tags:
  - 数据结构
  - 引用类型
  - 性能优化
estimatedTime: 35 分钟
keywords:
  - 深拷贝
  - 浅拷贝
  - structuredClone
  - 循环引用
highlight: 理解深浅拷贝的本质区别，掌握 structuredClone API 与递归拷贝的实现技巧
order: 11
---

## 问题 1：深拷贝与浅拷贝的本质区别是什么？

**核心概念**

- **浅拷贝（Shallow Copy）**：只复制对象的第一层属性，如果属性值是引用类型，只复制引用地址。
- **深拷贝（Deep Copy）**：递归复制对象的所有层级，包括嵌套的引用类型，完全独立于原对象。

**内存模型对比**

```javascript
// 原始对象
const original = {
  name: 'Alice',
  age: 25,
  address: {
    city: 'Beijing',
    district: 'Chaoyang'
  }
};

// 浅拷贝
const shallowCopy = { ...original };
shallowCopy.name = 'Bob';           // ✅ 不影响原对象
shallowCopy.address.city = 'Shanghai'; // ❌ 影响原对象

console.log(original.name);         // 'Alice'
console.log(original.address.city); // 'Shanghai' - 被修改了！

// 深拷贝
const deepCopy = JSON.parse(JSON.stringify(original));
deepCopy.address.city = 'Shenzhen';

console.log(original.address.city); // 'Beijing' - 未被修改
```

**为什么会这样？**

```javascript
// 浅拷贝的内存示意
original.address        → { city: 'Beijing' } (内存地址 0x001)
shallowCopy.address     → { city: 'Beijing' } (内存地址 0x001) - 指向同一个对象！

// 深拷贝的内存示意
original.address        → { city: 'Beijing' } (内存地址 0x001)
deepCopy.address        → { city: 'Beijing' } (内存地址 0x002) - 新对象，独立存储
```

**实际场景举例**

```javascript
// 场景：用户信息表单修改
const userInfo = {
  id: 1,
  profile: {
    name: 'Alice',
    avatar: 'avatar.jpg'
  }
};

// ❌ 浅拷贝导致的问题
const editForm = { ...userInfo };
editForm.profile.name = 'Bob';
console.log(userInfo.profile.name); // 'Bob' - 原数据被污染！

// ✅ 深拷贝避免问题
const editFormDeep = structuredClone(userInfo);
editFormDeep.profile.name = 'Charlie';
console.log(userInfo.profile.name); // 'Alice' - 原数据未被修改
```

---

## 问题 2：浅拷贝有哪些实现方式？各有什么特点？

### 方式 1：扩展运算符 `...`（最常用）

```javascript
const obj = { a: 1, b: { c: 2 } };
const copy = { ...obj };

// 特点：
// ✅ 语法简洁
// ✅ 支持合并多个对象
// ❌ 只拷贝自有可枚举属性
// ❌ 不拷贝原型链、Symbol 键、getter/setter

// 数组的浅拷贝
const arr = [1, 2, [3, 4]];
const arrCopy = [...arr];
arrCopy[2][0] = 999;
console.log(arr[2][0]); // 999 - 嵌套数组共享引用
```

### 方式 2：`Object.assign()`

```javascript
const obj = { a: 1, b: { c: 2 } };
const copy = Object.assign({}, obj);

// 等价于
const copy2 = Object.assign({}, obj1, obj2); // 支持合并多个源对象

// 特点：
// ✅ 支持合并多个对象
// ✅ 返回目标对象（可链式调用）
// ❌ 只拷贝自有可枚举属性
// ❌ 触发 setter（与 ... 不同）
```

**`Object.assign` 与 `...` 的差异**

```javascript
const obj = {
  _value: 0,
  get value() {
    console.log('getter 被调用');
    return this._value;
  },
  set value(val) {
    console.log('setter 被调用');
    this._value = val;
  }
};

// Object.assign 会触发 getter/setter
const copy1 = Object.assign({}, obj);
// 输出: getter 被调用

// ... 不会触发 getter/setter（直接拷贝属性描述符）
const copy2 = { ...obj };
// 不输出
```

### 方式 3：数组的 `slice()` 和 `concat()`

```javascript
const arr = [1, 2, { a: 3 }];

// slice()
const copy1 = arr.slice();

// concat()
const copy2 = arr.concat();

// 特点：
// ✅ 数组专用，语义明确
// ❌ 只适用于数组，不支持对象
// ❌ 仍然是浅拷贝
```

### 方式 4：`Array.from()`

```javascript
const arr = [1, 2, [3, 4]];
const copy = Array.from(arr);

// 特点：
// ✅ 可以同时进行映射转换
const doubled = Array.from(arr, x => Array.isArray(x) ? [...x] : x * 2);
// [2, 4, [3, 4]]
```

### 浅拷贝方法对比

| 方法 | 对象 | 数组 | 合并多个源 | 触发 setter | Symbol 键 |
|------|------|------|-----------|------------|----------|
| `...` | ✅ | ✅ | ✅ | ❌ | ✅ |
| `Object.assign()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `slice()` | ❌ | ✅ | ❌ | - | - |
| `concat()` | ❌ | ✅ | ✅ | - | - |
| `Array.from()` | ❌ | ✅ | ❌ | - | - |

---

## 问题 3：深拷贝有哪些实现方式？各有什么局限性？

### 方式 1：`structuredClone()`（现代浏览器推荐）

```javascript
const obj = {
  date: new Date(),
  regex: /test/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  nested: { deep: { value: 42 } }
};

const cloned = structuredClone(obj);

// 特点：
// ✅ 原生 API，性能最优
// ✅ 支持 Date、RegExp、Map、Set、ArrayBuffer 等
// ✅ 自动处理循环引用
// ❌ 不支持函数、Symbol、DOM 节点
// ❌ 不拷贝原型链
// ❌ Node.js 17+ / 主流浏览器
```

**支持的类型**

```javascript
// ✅ 支持的类型
structuredClone({
  date: new Date(),
  regexp: /abc/gi,
  map: new Map([['a', 1]]),
  set: new Set([1, 2]),
  typedArray: new Uint8Array([1, 2, 3]),
  arrayBuffer: new ArrayBuffer(8),
  error: new Error('test')
});

// ❌ 不支持的类型
structuredClone({
  fn: function() {},        // 函数会被忽略
  symbol: Symbol('test'),   // Symbol 会报错
  dom: document.body        // DOM 节点会报错
});
```

### 方式 2：`JSON.parse(JSON.stringify())`（最常用，但有严重限制）

```javascript
const obj = { a: 1, b: { c: 2 } };
const cloned = JSON.parse(JSON.stringify(obj));

// 特点：
// ✅ 兼容性极好（IE8+）
// ✅ 代码简洁
// ❌ 无法拷贝函数、Symbol、undefined
// ❌ 无法处理循环引用（会报错）
// ❌ 日期对象变成字符串
// ❌ RegExp 变成空对象
// ❌ NaN/Infinity 变成 null
```

**常见陷阱**

```javascript
const obj = {
  fn: function() { console.log('hello'); },
  undef: undefined,
  sym: Symbol('test'),
  date: new Date('2024-01-01'),
  regex: /test/gi,
  nan: NaN,
  infinity: Infinity
};

const cloned = JSON.parse(JSON.stringify(obj));

console.log(cloned);
// {
//   date: "2024-01-01T00:00:00.000Z",  // 变成字符串
//   regex: {},                          // 变成空对象
//   nan: null,                          // NaN 变成 null
//   infinity: null                      // Infinity 变成 null
// }
// fn、undef、sym 直接丢失！
```

**循环引用问题**

```javascript
const obj = { a: 1 };
obj.self = obj; // 循环引用

JSON.parse(JSON.stringify(obj));
// ❌ Uncaught TypeError: Converting circular structure to JSON
```

### 方式 3：递归手动实现（最灵活）

**基础版（不处理循环引用）**

```javascript
function deepClone(obj) {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // 对象
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// 测试
const obj = { a: 1, b: { c: [2, 3] } };
const cloned = deepClone(obj);
cloned.b.c[0] = 999;
console.log(obj.b.c[0]); // 2 - 未被修改
```

**完整版（处理循环引用、特殊类型）**

```javascript
function deepClone(obj, cache = new WeakMap()) {
  // 基本类型和 null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理循环引用
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  // Date
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }
  
  // Map
  if (obj instanceof Map) {
    const cloned = new Map();
    cache.set(obj, cloned);
    obj.forEach((value, key) => {
      cloned.set(deepClone(key, cache), deepClone(value, cache));
    });
    return cloned;
  }
  
  // Set
  if (obj instanceof Set) {
    const cloned = new Set();
    cache.set(obj, cloned);
    obj.forEach(value => {
      cloned.add(deepClone(value, cache));
    });
    return cloned;
  }
  
  // 数组
  if (Array.isArray(obj)) {
    const cloned = [];
    cache.set(obj, cloned);
    obj.forEach((item, index) => {
      cloned[index] = deepClone(item, cache);
    });
    return cloned;
  }
  
  // 普通对象
  const cloned = Object.create(Object.getPrototypeOf(obj));
  cache.set(obj, cloned);
  
  // 拷贝 Symbol 键
  Reflect.ownKeys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key], cache);
  });
  
  return cloned;
}

// 测试循环引用
const obj = { a: 1 };
obj.self = obj;
const cloned = deepClone(obj);
console.log(cloned.self === cloned); // true
console.log(cloned === obj);         // false
```

### 方式 4：使用第三方库

**Lodash `_.cloneDeep()`**

```javascript
import _ from 'lodash';

const obj = {
  date: new Date(),
  regex: /test/gi,
  fn: function() {},
  nested: { deep: { value: 42 } }
};

const cloned = _.cloneDeep(obj);

// 特点：
// ✅ 功能最完善，支持几乎所有类型
// ✅ 处理循环引用
// ✅ 性能优化好
// ❌ 需要引入整个库（打包体积大）
```

### 深拷贝方法对比

| 方法 | 循环引用 | 特殊类型 | 函数 | 性能 | 兼容性 |
|------|---------|---------|-----|------|--------|
| `structuredClone()` | ✅ | ✅ 大部分 | ❌ | 最快 | 现代浏览器 |
| `JSON` 序列化 | ❌ | ❌ | ❌ | 快 | 最好 |
| 手动递归 | ✅ 可实现 | ✅ 可实现 | ✅ 可实现 | 中等 | 最好 |
| `_.cloneDeep()` | ✅ | ✅ | ✅ | 快 | 最好 |

---

## 问题 4：如何处理循环引用？WeakMap 的作用是什么？

**什么是循环引用？**

```javascript
const obj = { name: 'Alice' };
obj.self = obj; // 对象引用自己

const a = { name: 'A' };
const b = { name: 'B' };
a.friend = b;
b.friend = a; // 相互引用
```

**使用 WeakMap 检测循环引用**

```javascript
function deepClone(obj, cache = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 如果已经拷贝过，直接返回缓存的引用
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  // 创建新对象并存入缓存
  const cloned = Array.isArray(obj) ? [] : {};
  cache.set(obj, cloned);
  
  // 递归拷贝属性
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key], cache);
    }
  }
  
  return cloned;
}

// 测试
const obj = { a: 1 };
obj.self = obj;
obj.nested = { parent: obj };

const cloned = deepClone(obj);
console.log(cloned.self === cloned);         // true
console.log(cloned.nested.parent === cloned); // true
console.log(cloned === obj);                 // false
```

**为什么用 WeakMap 而不是 Map？**

```javascript
// ❌ 使用 Map 会导致内存泄漏
function deepCloneWithMap(obj, cache = new Map()) {
  // ...拷贝逻辑
  cache.set(obj, cloned); // obj 无法被 GC 回收！
}

// ✅ WeakMap 的键是弱引用，不阻止 GC
function deepCloneWithWeakMap(obj, cache = new WeakMap()) {
  // ...拷贝逻辑
  cache.set(obj, cloned); // obj 可以被 GC 回收
}

// WeakMap 的特点：
// 1. 键必须是对象
// 2. 键是弱引用（不增加引用计数）
// 3. 不可遍历（没有 keys()、values()、forEach()）
```

**实际场景：组件树的深拷贝**

```javascript
// React 组件树可能存在循环引用
const componentTree = {
  type: 'div',
  props: { className: 'container' },
  children: []
};

const child = {
  type: 'span',
  parent: componentTree, // 引用父节点
  children: []
};

componentTree.children.push(child);

// 使用 WeakMap 正确处理
const clonedTree = deepClone(componentTree);
console.log(clonedTree.children[0].parent === clonedTree); // true
```

---

## 问题 5：实际项目中如何选择拷贝方案？性能考虑有哪些？

### 选择决策树

```javascript
// 1. 只需要浅拷贝？
const shallow = { ...obj };

// 2. 需要深拷贝，且数据简单（纯 JSON）？
const simple = JSON.parse(JSON.stringify(obj));

// 3. 需要深拷贝，且包含 Date/RegExp/Map/Set？
const modern = structuredClone(obj); // 现代浏览器

// 4. 需要深拷贝，且包含函数/循环引用/复杂类型？
const complex = _.cloneDeep(obj);    // 或手动实现
```

### 实际场景示例

**场景 1：状态管理（Redux/Vuex）**

```javascript
// 通常只需浅拷贝（状态更新不应该深度嵌套）
const newState = {
  ...state,
  user: {
    ...state.user,
    name: 'New Name'
  }
};

// 避免深拷贝整个 store（性能开销大）
```

**场景 2：表单数据备份**

```javascript
// 使用 structuredClone 或 JSON 序列化
const formData = {
  name: 'Alice',
  birthday: new Date('1990-01-01'),
  hobbies: ['reading', 'coding']
};

// 方案 A：structuredClone（推荐）
const backup = structuredClone(formData);

// 方案 B：JSON 序列化（日期会变成字符串）
const backup2 = JSON.parse(JSON.stringify(formData));
backup2.birthday = new Date(backup2.birthday); // 需要手动转换
```

**场景 3：配置对象合并**

```javascript
// 使用递归深合并（不是拷贝）
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const defaultConfig = { a: 1, b: { c: 2 } };
const userConfig = { b: { d: 3 } };
const merged = deepMerge({ ...defaultConfig }, userConfig);
// { a: 1, b: { c: 2, d: 3 } }
```

**场景 4：大数据列表拷贝**

```javascript
// 避免不必要的深拷贝
const largeList = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  data: { /* 复杂数据 */ }
}));

// ❌ 慢：深拷贝整个列表
const copy1 = structuredClone(largeList); // 耗时可能 > 100ms

// ✅ 快：只拷贝需要修改的项
const copy2 = largeList.map(item => 
  item.id === targetId ? { ...item, updated: true } : item
);
```

### 性能基准测试

```javascript
const testData = {
  string: 'test',
  number: 123,
  nested: { deep: { value: [1, 2, 3] } },
  date: new Date(),
  array: Array.from({ length: 1000 }, (_, i) => ({ id: i }))
};

console.time('structuredClone');
structuredClone(testData);
console.timeEnd('structuredClone'); // ~2ms

console.time('JSON');
JSON.parse(JSON.stringify(testData));
console.timeEnd('JSON'); // ~3ms

console.time('手动递归');
deepClone(testData);
console.timeEnd('手动递归'); // ~5ms

console.time('lodash');
_.cloneDeep(testData);
console.timeEnd('lodash'); // ~4ms
```

**性能优化建议**

1. **优先浅拷贝**：大部分场景不需要深拷贝
2. **避免拷贝大对象**：考虑使用 Immutable.js 或 Immer.js
3. **按需拷贝**：只拷贝需要修改的部分
4. **缓存拷贝结果**：避免重复拷贝相同数据

```javascript
// 使用 Immer.js（推荐）
import produce from 'immer';

const nextState = produce(state, draft => {
  draft.user.name = 'New Name'; // 直接修改，Immer 自动处理不可变性
});
// 性能优于深拷贝，且代码更简洁
```

---

## 总结

**面试回答框架**

1. **定义**：
   - 浅拷贝：只复制第一层，引用类型共享地址
   - 深拷贝：递归复制所有层级，完全独立

2. **浅拷贝实现**：
   - `...` / `Object.assign()`（对象）
   - `slice()` / `concat()` / `Array.from()`（数组）

3. **深拷贝实现**：
   - `structuredClone()`：现代浏览器首选
   - `JSON.parse(JSON.stringify())`：兼容性好但有限制
   - 递归手动实现：最灵活，需处理循环引用
   - `_.cloneDeep()`：功能最完善

4. **关键技术点**：
   - 使用 WeakMap 处理循环引用
   - 特殊类型的拷贝（Date、RegExp、Map、Set）
   - 性能优化：按需拷贝、避免大对象深拷贝

5. **实际应用**：
   - 状态管理：浅拷贝 + Immutable
   - 表单备份：`structuredClone` 或 JSON
   - 配置合并：递归深合并
   - 大数据：避免深拷贝，考虑 Immer.js

---

## 延伸阅读

- MDN：[structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- 【练习】实现一个支持所有 JavaScript 类型的深拷贝函数，包括 Symbol、函数、原型链。

