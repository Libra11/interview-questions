---
title: 如何检测对象是否循环引用？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解 JavaScript 中的循环引用问题，掌握多种检测循环引用的方法，学习如何处理循环引用带来的问题，如 JSON 序列化失败、内存泄漏等。
tags:
  - 循环引用
  - 对象
  - 内存管理
  - 深拷贝
estimatedTime: 24 分钟
keywords:
  - 循环引用
  - 检测循环引用
  - JSON序列化
  - WeakSet
  - 深拷贝
highlight: 使用 WeakSet 或 Map 记录已访问对象是检测循环引用的最佳方式，可以避免内存泄漏
order: 395
---

## 问题 1：什么是循环引用？

循环引用是指**对象之间相互引用，形成闭环**的情况。

### 基本概念

```javascript
// 简单的循环引用
const obj = {};
obj.self = obj; // 对象引用自己

console.log(obj.self === obj); // true
console.log(obj.self.self === obj); // true
console.log(obj.self.self.self === obj); // true（无限循环）

// 两个对象相互引用
const obj1 = { name: 'obj1' };
const obj2 = { name: 'obj2' };

obj1.ref = obj2;
obj2.ref = obj1;

console.log(obj1.ref.ref === obj1); // true（形成循环）

// 多个对象形成环
const a = { name: 'a' };
const b = { name: 'b' };
const c = { name: 'c' };

a.next = b;
b.next = c;
c.next = a; // 形成环：a -> b -> c -> a

console.log(a.next.next.next === a); // true
```

### 循环引用的问题

```javascript
// 问题 1：JSON.stringify 会报错
const obj = { name: 'test' };
obj.self = obj;

try {
  JSON.stringify(obj);
} catch (error) {
  console.error(error.message); // Converting circular structure to JSON
}

// 问题 2：深拷贝会导致栈溢出
function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const clone = Array.isArray(obj) ? [] : {};
  
  for (let key in obj) {
    clone[key] = deepClone(obj[key]); // 循环引用会导致无限递归
  }
  
  return clone;
}

const obj = { name: 'test' };
obj.self = obj;

// deepClone(obj); // RangeError: Maximum call stack size exceeded

// 问题 3：可能导致内存泄漏（在老版本浏览器中）
// 现代 JavaScript 引擎的垃圾回收器可以处理循环引用
// 但在某些情况下仍需注意
```

---

## 问题 2：如何使用 WeakSet 检测循环引用？

WeakSet 是检测循环引用的**最佳方式**，不会造成内存泄漏。

### 基本实现

```javascript
// 使用 WeakSet 检测循环引用
function hasCircularReference(obj) {
  // 使用 WeakSet 存储已访问的对象
  const seen = new WeakSet();
  
  function detect(obj) {
    // 非对象类型不会有循环引用
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    // 如果已经访问过，说明有循环引用
    if (seen.has(obj)) {
      return true;
    }
    
    // 标记为已访问
    seen.add(obj);
    
    // 递归检查所有属性
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (detect(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return detect(obj);
}

// 测试
// 无循环引用
const obj1 = { a: 1, b: { c: 2 } };
console.log(hasCircularReference(obj1)); // false

// 自引用
const obj2 = { name: 'test' };
obj2.self = obj2;
console.log(hasCircularReference(obj2)); // true

// 相互引用
const obj3 = { name: 'obj3' };
const obj4 = { name: 'obj4' };
obj3.ref = obj4;
obj4.ref = obj3;
console.log(hasCircularReference(obj3)); // true

// 多层嵌套的循环引用
const obj5 = { a: { b: { c: {} } } };
obj5.a.b.c.ref = obj5;
console.log(hasCircularReference(obj5)); // true
```

### 为什么使用 WeakSet

```javascript
// WeakSet 的优势：
// 1. 弱引用：不会阻止垃圾回收
// 2. 自动清理：对象被回收后，WeakSet 中的引用也会被清理
// 3. 不会造成内存泄漏

// 对比使用 Set
function hasCircularReferenceWithSet(obj) {
  const seen = new Set(); // 使用 Set
  
  function detect(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    if (seen.has(obj)) {
      return true;
    }
    
    seen.add(obj);
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (detect(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return detect(obj);
}

// Set 的问题：强引用，可能导致内存泄漏
// 如果 obj 在外部被清理，Set 中仍然持有引用
```

---

## 问题 3：如何使用 Map 检测并记录循环引用路径？

使用 Map 可以**记录循环引用的路径**，便于调试。

### 记录循环引用路径

```javascript
// 检测并返回循环引用的路径
function findCircularPath(obj) {
  const seen = new Map(); // 使用 Map 记录对象和路径
  
  function detect(obj, path = 'root') {
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }
    
    // 如果已访问过，返回循环路径
    if (seen.has(obj)) {
      return {
        circular: true,
        from: seen.get(obj),
        to: path
      };
    }
    
    // 记录当前对象和路径
    seen.set(obj, path);
    
    // 递归检查所有属性
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = detect(obj[key], `${path}.${key}`);
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }
  
  return detect(obj);
}

// 测试
const obj1 = { name: 'test' };
obj1.self = obj1;

const result1 = findCircularPath(obj1);
console.log(result1);
// { circular: true, from: 'root', to: 'root.self' }

const obj2 = { a: { b: { c: {} } } };
obj2.a.b.c.ref = obj2.a;

const result2 = findCircularPath(obj2);
console.log(result2);
// { circular: true, from: 'root.a', to: 'root.a.b.c.ref' }
```

### 获取所有循环引用

```javascript
// 找出所有的循环引用
function findAllCircularReferences(obj) {
  const seen = new Map();
  const circularRefs = [];
  
  function detect(obj, path = 'root') {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    if (seen.has(obj)) {
      circularRefs.push({
        from: seen.get(obj),
        to: path
      });
      return;
    }
    
    seen.set(obj, path);
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        detect(obj[key], `${path}.${key}`);
      }
    }
  }
  
  detect(obj);
  return circularRefs;
}

// 测试
const obj = {
  a: {},
  b: {}
};
obj.a.ref = obj;
obj.b.ref = obj;
obj.self = obj;

const refs = findAllCircularReferences(obj);
console.log(refs);
// [
//   { from: 'root', to: 'root.a.ref' },
//   { from: 'root', to: 'root.b.ref' },
//   { from: 'root', to: 'root.self' }
// ]
```

---

## 问题 4：如何在深拷贝中处理循环引用？

深拷贝时需要**记录已拷贝的对象**，避免无限递归。

### 支持循环引用的深拷贝

```javascript
// 支持循环引用的深拷贝
function deepClone(obj, hash = new WeakMap()) {
  // 处理 null 和非对象类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 如果已经拷贝过，直接返回
  if (hash.has(obj)) {
    return hash.get(obj);
  }
  
  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // 处理正则
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }
  
  // 创建新对象或数组
  const clone = Array.isArray(obj) ? [] : {};
  
  // 记录已拷贝的对象
  hash.set(obj, clone);
  
  // 递归拷贝所有属性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], hash);
    }
  }
  
  return clone;
}

// 测试
const obj = { name: 'test', data: { value: 1 } };
obj.self = obj;
obj.data.parent = obj;

const cloned = deepClone(obj);

console.log(cloned.name); // 'test'
console.log(cloned.self === cloned); // true（保持循环引用）
console.log(cloned.data.parent === cloned); // true
console.log(cloned !== obj); // true（是新对象）
```

### 完整的深拷贝实现

```javascript
// 更完整的深拷贝实现
function deepCloneComplete(obj, hash = new WeakMap()) {
  // null 或非对象
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 已拷贝过
  if (hash.has(obj)) {
    return hash.get(obj);
  }
  
  // 处理特殊对象类型
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) {
    const mapClone = new Map();
    hash.set(obj, mapClone);
    obj.forEach((value, key) => {
      mapClone.set(key, deepCloneComplete(value, hash));
    });
    return mapClone;
  }
  if (obj instanceof Set) {
    const setClone = new Set();
    hash.set(obj, setClone);
    obj.forEach(value => {
      setClone.add(deepCloneComplete(value, hash));
    });
    return setClone;
  }
  
  // 处理数组和普通对象
  const clone = Array.isArray(obj) ? [] : {};
  hash.set(obj, clone);
  
  // 拷贝所有可枚举属性
  Object.keys(obj).forEach(key => {
    clone[key] = deepCloneComplete(obj[key], hash);
  });
  
  // 拷贝 Symbol 属性
  Object.getOwnPropertySymbols(obj).forEach(symbol => {
    clone[symbol] = deepCloneComplete(obj[symbol], hash);
  });
  
  return clone;
}

// 测试
const sym = Symbol('test');
const obj = {
  name: 'test',
  [sym]: 'symbol value',
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3])
};
obj.self = obj;

const cloned = deepCloneComplete(obj);
console.log(cloned.name); // 'test'
console.log(cloned[sym]); // 'symbol value'
console.log(cloned.map.get('key')); // 'value'
console.log(cloned.set.has(1)); // true
console.log(cloned.self === cloned); // true
```

---

## 问题 5：如何处理 JSON 序列化中的循环引用？

JSON.stringify 不支持循环引用，需要**自定义处理**。

### 使用 replacer 参数

```javascript
// 使用 replacer 跳过循环引用
function stringifyWithoutCircular(obj) {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // 非对象直接返回
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    // 检测到循环引用，返回标记
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    // 记录已访问的对象
    seen.add(value);
    return value;
  });
}

// 测试
const obj = { name: 'test', data: { value: 1 } };
obj.self = obj;
obj.data.parent = obj;

console.log(stringifyWithoutCircular(obj));
// {"name":"test","data":{"value":1,"parent":"[Circular]"},"self":"[Circular]"}
```

### 保留循环引用信息

```javascript
// 保留循环引用的路径信息
function stringifyWithCircularInfo(obj) {
  const seen = new Map();
  let index = 0;
  
  // 第一遍：标记所有对象
  function mark(obj, path = 'root') {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    if (seen.has(obj)) {
      return;
    }
    
    seen.set(obj, { id: index++, path });
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        mark(obj[key], `${path}.${key}`);
      }
    }
  }
  
  mark(obj);
  
  // 第二遍：序列化，遇到循环引用时记录 id
  return JSON.stringify(obj, (key, value) => {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    const info = seen.get(value);
    if (info && this !== value) {
      // 检查是否是循环引用
      let current = this;
      while (current) {
        if (current === value) {
          return { $ref: info.path };
        }
        current = Object.getPrototypeOf(current);
      }
    }
    
    return value;
  }, 2);
}

// 测试
const obj = { name: 'test', data: { value: 1 } };
obj.self = obj;

console.log(stringifyWithCircularInfo(obj));
```

### 使用第三方库

```javascript
// 使用 flatted 库处理循环引用
// npm install flatted

// import { stringify, parse } from 'flatted';

// const obj = { name: 'test' };
// obj.self = obj;

// const str = stringify(obj);
// console.log(str); // '[{"name":"test","self":"0"}]'

// const parsed = parse(str);
// console.log(parsed.self === parsed); // true

// 手动实现类似 flatted 的功能
function flatStringify(obj) {
  const objects = [];
  const ids = new Map();
  
  function getId(obj) {
    if (!ids.has(obj)) {
      const id = objects.length;
      ids.set(obj, id);
      objects.push(obj);
    }
    return ids.get(obj);
  }
  
  function replacer(key, value) {
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    const id = getId(value);
    
    // 如果是第一次遇到这个对象，返回对象本身
    // 否则返回引用 id
    return this === value ? value : id;
  }
  
  const result = JSON.stringify(obj, replacer);
  return JSON.stringify({ objects, root: 0 });
}

// 测试
const obj = { name: 'test' };
obj.self = obj;
console.log(flatStringify(obj));
```

---

## 问题 6：如何检测 DOM 元素的循环引用？

DOM 元素也可能存在循环引用，需要**特殊处理**。

### 检测 DOM 循环引用

```javascript
// 检测 DOM 元素的循环引用
function hasDOMCircularReference(element) {
  const seen = new WeakSet();
  
  function detect(el) {
    if (!el || !(el instanceof Node)) {
      return false;
    }
    
    if (seen.has(el)) {
      return true;
    }
    
    seen.add(el);
    
    // 检查属性中的引用
    for (let key in el) {
      try {
        const value = el[key];
        if (value instanceof Node) {
          if (detect(value)) {
            return true;
          }
        }
      } catch (e) {
        // 某些属性可能无法访问
        continue;
      }
    }
    
    // 检查子节点
    if (el.childNodes) {
      for (let child of el.childNodes) {
        if (detect(child)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  return detect(element);
}

// 测试
const div = document.createElement('div');
const span = document.createElement('span');

div.appendChild(span);
// 创建循环引用
div.customRef = span;
span.parentRef = div;

console.log(hasDOMCircularReference(div)); // true
```

### 清理 DOM 循环引用

```javascript
// 清理 DOM 元素的循环引用
function cleanDOMCircularReferences(element) {
  const seen = new WeakSet();
  
  function clean(el) {
    if (!el || !(el instanceof Node)) {
      return;
    }
    
    if (seen.has(el)) {
      return;
    }
    
    seen.add(el);
    
    // 清理自定义属性中的循环引用
    for (let key in el) {
      try {
        if (el.hasOwnProperty(key)) {
          const value = el[key];
          if (value instanceof Node && seen.has(value)) {
            delete el[key]; // 删除循环引用
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // 递归清理子节点
    if (el.childNodes) {
      for (let child of el.childNodes) {
        clean(child);
      }
    }
  }
  
  clean(element);
}

// 使用
const div = document.createElement('div');
const span = document.createElement('span');

div.appendChild(span);
div.customRef = span;
span.parentRef = div;

console.log(hasDOMCircularReference(div)); // true
cleanDOMCircularReferences(div);
console.log(hasDOMCircularReference(div)); // false
```

---

## 问题 7：循环引用的实际应用场景有哪些？

了解循环引用的常见场景和处理方法。

### 场景 1：树形结构

```javascript
// 树形结构中的父子引用
class TreeNode {
  constructor(value) {
    this.value = value;
    this.children = [];
    this.parent = null;
  }
  
  addChild(child) {
    child.parent = this; // 创建循环引用
    this.children.push(child);
  }
}

// 安全地序列化树结构
function serializeTree(node) {
  const seen = new WeakSet();
  
  function serialize(node) {
    if (!node || seen.has(node)) {
      return null;
    }
    
    seen.add(node);
    
    return {
      value: node.value,
      children: node.children.map(child => serialize(child))
      // 不包含 parent，避免循环引用
    };
  }
  
  return JSON.stringify(serialize(node), null, 2);
}

// 使用
const root = new TreeNode('root');
const child1 = new TreeNode('child1');
const child2 = new TreeNode('child2');

root.addChild(child1);
root.addChild(child2);

console.log(serializeTree(root));
```

### 场景 2：双向链表

```javascript
// 双向链表
class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }
  
  append(value) {
    const node = new ListNode(value);
    
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail; // 循环引用
      this.tail.next = node;
      this.tail = node;
    }
  }
  
  // 安全地转换为数组
  toArray() {
    const result = [];
    const seen = new WeakSet();
    let current = this.head;
    
    while (current && !seen.has(current)) {
      seen.add(current);
      result.push(current.value);
      current = current.next;
    }
    
    return result;
  }
}

// 使用
const list = new DoublyLinkedList();
list.append(1);
list.append(2);
list.append(3);

console.log(list.toArray()); // [1, 2, 3]
```

### 场景 3：图结构

```javascript
// 图结构
class Graph {
  constructor() {
    this.nodes = new Map();
  }
  
  addNode(id, data) {
    this.nodes.set(id, {
      id,
      data,
      edges: []
    });
  }
  
  addEdge(fromId, toId) {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    
    if (from && to) {
      from.edges.push(to); // 可能形成环
    }
  }
  
  // 检测是否有环
  hasCycle() {
    const visited = new Set();
    const recStack = new Set();
    
    const dfs = (node) => {
      visited.add(node);
      recStack.add(node);
      
      for (let neighbor of node.edges) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          return true; // 发现环
        }
      }
      
      recStack.delete(node);
      return false;
    };
    
    for (let node of this.nodes.values()) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          return true;
        }
      }
    }
    
    return false;
  }
}

// 使用
const graph = new Graph();
graph.addNode(1, 'A');
graph.addNode(2, 'B');
graph.addNode(3, 'C');

graph.addEdge(1, 2);
graph.addEdge(2, 3);
console.log(graph.hasCycle()); // false

graph.addEdge(3, 1); // 形成环
console.log(graph.hasCycle()); // true
```

### 场景 4：React 组件

```javascript
// React 组件中的循环引用
// 父组件引用子组件，子组件通过 props 引用父组件

// 安全地序列化 React 组件状态
function serializeComponentState(component) {
  const seen = new WeakSet();
  
  function serialize(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (seen.has(obj)) {
      return '[Circular]';
    }
    
    // 跳过 React 内部属性
    if (obj._reactInternalFiber || obj._reactInternals) {
      return '[React Internal]';
    }
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => serialize(item));
    }
    
    const result = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serialize(obj[key]);
      }
    }
    
    return result;
  }
  
  return JSON.stringify(serialize(component.state), null, 2);
}
```

---

## 总结

**检测和处理循环引用的核心要点**：

### 1. 检测方法
- **WeakSet**：最佳方式，不会内存泄漏
- **Map**：可以记录路径信息
- **Set**：简单但可能内存泄漏

### 2. 常见问题
- JSON.stringify 报错
- 深拷贝栈溢出
- 内存泄漏（老版本浏览器）

### 3. 处理方案
- 深拷贝：使用 WeakMap 记录已拷贝对象
- JSON 序列化：使用 replacer 跳过或标记
- 清理引用：手动断开循环

### 4. 应用场景
- 树形结构（父子引用）
- 双向链表（前后引用）
- 图结构（节点互相引用）
- DOM 元素（自定义属性引用）

### 5. 最佳实践
- 优先使用 WeakSet/WeakMap
- 序列化时跳过循环引用
- 深拷贝时记录已访问对象
- 及时清理不需要的引用

### 6. 注意事项
- WeakSet 只能存储对象
- 现代引擎可以处理循环引用的垃圾回收
- DOM 操作要特别注意循环引用

## 延伸阅读

- [MDN - WeakSet](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [MDN - WeakMap](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [JavaScript 内存管理](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)
- [循环引用与垃圾回收](https://javascript.info/garbage-collection)
