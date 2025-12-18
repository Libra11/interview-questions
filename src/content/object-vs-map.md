---
title: Object vs Map：性能与使用场景对比
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入对比 Object 与 Map 在读写性能、内存占用、API 设计上的差异，帮助你在不同场景下做出正确的数据结构选择。
tags:
  - 数据结构
  - 性能优化
  - ES6+
estimatedTime: 30 分钟
keywords:
  - Object
  - Map
  - WeakMap
  - 性能对比
highlight: 理解频繁增删场景下 Map 的优势，以及 Object 在序列化与静态结构中的便利性。
order: 35
---

## 问题 1：Object 与 Map 的核心区别是什么？

**关键差异**

1. **键的类型**  
   - Object：键只能是字符串或 Symbol；数字会被自动转为字符串。  
   - Map：键可以是任意类型（包括对象、函数、NaN）。

2. **属性继承**  
   - Object：继承原型链上的属性（如 `toString`），可能导致意外碰撞。  
   - Map：不继承任何属性，键空间完全独立。

3. **大小获取**  
   - Object：需要 `Object.keys(obj).length`，时间复杂度 O(n)。  
   - Map：直接访问 `map.size` 属性，时间复杂度 O(1)。

4. **迭代顺序**  
   - Object：插入顺序不保证（数字键会被提前排序）。  
   - Map：严格按插入顺序迭代。

```js
const obj = { 2: 'b', 1: 'a', foo: 'bar' };
console.log(Object.keys(obj)); // ['1', '2', 'foo'] - 数字被提前

const map = new Map([[2, 'b'], [1, 'a'], ['foo', 'bar']]);
console.log([...map.keys()]); // [2, 1, 'foo'] - 严格按插入顺序
```

## 问题 2：性能对比：频繁读写场景下如何选择？

**读写性能实测（Chrome V8）**

| 操作 | Object | Map | 结论 |
|------|--------|-----|------|
| 初始化小数据（< 100条） | 更快 | 稍慢 | Object 更适合静态配置 |
| 频繁增删（> 1000 次） | 慢 | **快 2-3 倍** | Map 优化了动态场景 |
| 读取已有键 | 略快 | 相近 | 差异可忽略 |
| 判断键存在 | `in` 操作快 | `has()` 方法快 | Map 更语义化 |

**示例：频繁增删场景**

```js
// Object：每次删除后需触发属性重排
const obj = {};
for (let i = 0; i < 10000; i++) {
  obj[`key${i}`] = i;
  delete obj[`key${i - 100}`]; // 触发内部哈希表调整
}

// Map：内部优化了动态键管理
const map = new Map();
for (let i = 0; i < 10000; i++) {
  map.set(`key${i}`, i);
  map.delete(`key${i - 100}`); // 更高效
}
```

**内存占用**

- Object 在小规模（< 50 条）时内存占用更小；  
- Map 在大规模（> 1000 条）时内存效率更高，因为避免了原型链开销。

## 问题 3：什么时候应该用 Object？什么时候用 Map？

**优先使用 Object**

- 配置对象、JSON 序列化/反序列化（`Map` 不支持 `JSON.stringify`）；  
- 固定结构的数据模型（TS 类型推断更友好）；  
- 需要展开运算符 `{ ...obj }` 或解构赋值。

**优先使用 Map**

- 键的类型不固定（如对象作为键）；  
- 频繁增删操作（如缓存、LRU）；  
- 需要保证插入顺序或获取大小；  
- 避免原型链污染（如用户输入的键）。

**实战案例：LRU 缓存**

```ts
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Map 删除+重插保证 LRU 顺序
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Map 迭代器的第一个元素就是最久未用
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## 问题 4：WeakMap 的使用场景是什么？

**核心特性**

- 键必须是对象，且是弱引用（不阻止垃圾回收）；  
- 无法遍历、无 `size` 属性；  
- 适合存储与对象生命周期绑定的元数据。

**典型场景**

```ts
// 场景 1：DOM 节点元数据（避免内存泄漏）
const domMetadata = new WeakMap<HTMLElement, { clicks: number }>();

function trackClicks(element: HTMLElement) {
  const meta = domMetadata.get(element) ?? { clicks: 0 };
  meta.clicks++;
  domMetadata.set(element, meta);
}
// 当 DOM 节点被移除，WeakMap 的记录会自动清理

// 场景 2：私有属性（在类外部存储）
const privateData = new WeakMap<object, { secret: string }>();

class User {
  constructor(secret: string) {
    privateData.set(this, { secret });
  }

  getSecret() {
    return privateData.get(this)?.secret;
  }
}
```

## 延伸阅读

- V8 团队博客：[Fast properties in V8](https://v8.dev/blog/fast-properties)  
- MDN：[Map vs Object 性能对比](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_vs._maps)  
- 【练习】实现一个支持过期时间的 Map，结合 `setTimeout` 与 `WeakMap` 优化内存。

