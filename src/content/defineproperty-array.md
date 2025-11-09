---
title: Object.defineProperty 能否监听数组变化？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入探讨 Object.defineProperty 对数组的监听能力与局限性，理解 Vue 2 响应式原理中的数组变异方法重写策略。
tags:
  - 响应式原理
  - 数据劫持
  - Vue 原理
estimatedTime: 25 分钟
keywords:
  - Object.defineProperty
  - 数组监听
  - Vue 响应式
  - Proxy
highlight: 理解为何 Vue 2 需要重写数组方法，以及 Proxy 如何彻底解决这个问题。
order: 7
---

## 问题 1：Object.defineProperty 能监听数组的索引变化吗？

**答案：可以，但有严重的性能与边界问题**

### 理论上可行

```js
const arr = [1, 2, 3];

// 为每个索引定义 getter/setter
arr.forEach((value, index) => {
  Object.defineProperty(arr, index, {
    get() {
      console.log(`读取 arr[${index}]`);
      return value;
    },
    set(newValue) {
      console.log(`设置 arr[${index}] = ${newValue}`);
      value = newValue;
    }
  });
});

arr[1] = 99; // 输出：设置 arr[1] = 99
console.log(arr[1]); // 输出：读取 arr[1]，返回 99
```

### 实践中的问题

1. **无法监听新增索引**

```js
const arr = [1, 2, 3];
// 假设已为索引 0-2 定义了 getter/setter

arr[3] = 4; // ❌ 无法触发监听（索引 3 未定义）
arr.push(5); // ❌ 无法触发监听（索引 4 未定义）
```

2. **无法监听 length 变化**

```js
arr.length = 0; // ❌ 清空数组不会触发已有索引的 setter
```

3. **性能开销巨大**

```js
const largeArray = new Array(10000).fill(0);
// 需要为 10000 个索引分别定义 getter/setter
// 遍历开销 + 内存占用极高
```

## 问题 2：Vue 2 如何解决数组响应式问题？

**核心策略：重写（劫持）数组的变异方法**

### 实现原理

```js
// Vue 2 源码简化版
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

// 需要重写的 7 个变异方法
['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(method => {
  const original = arrayProto[method];
  
  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      // 1. 调用原生方法
      const result = original.apply(this, args);
      
      // 2. 获取数组的观察者实例
      const ob = this.__ob__;
      
      // 3. 处理新增元素（需要递归观测）
      let inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;
        case 'splice':
          inserted = args.slice(2); // splice(start, deleteCount, ...items)
          break;
      }
      
      if (inserted) {
        ob.observeArray(inserted); // 递归观测新增元素
      }
      
      // 4. 通知依赖更新
      ob.dep.notify();
      
      return result;
    },
    enumerable: false,
    writable: true,
    configurable: true
  });
});

// 使用时替换数组原型
function observe(data) {
  if (Array.isArray(data)) {
    // 将数组实例的 __proto__ 指向重写后的原型
    Object.setPrototypeOf(data, arrayMethods);
    // 或：data.__proto__ = arrayMethods;
  }
  // ... 其他响应式处理
}
```

### 为什么不劫持所有数组方法？

- **变异方法**（会修改原数组）：`push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`  
  → 需要重写以触发更新。

- **非变异方法**（返回新数组）：`filter`, `map`, `concat`, `slice`  
  → 不修改原数组，用户需手动赋值触发响应式。

```js
// Vue 2 中的正确用法
this.items = this.items.filter(item => item.active); // ✅ 赋值触发响应式
this.items.filter(item => item.active); // ❌ 不会触发更新
```

## 问题 3：Vue 2 响应式的其他局限

### 1. 索引直接赋值无法检测

```js
// Vue 2 中
this.items[1] = newValue; // ❌ 不会触发更新

// 解决方案
this.$set(this.items, 1, newValue); // ✅
// 或
this.items.splice(1, 1, newValue); // ✅
```

### 2. length 修改无法检测

```js
this.items.length = 0; // ❌ 不会触发更新

// 解决方案
this.items.splice(0); // ✅ 等价于清空
```

### 3. 对象属性动态添加无法检测

```js
this.obj.newKey = 'value'; // ❌ 不会触发更新

// 解决方案
this.$set(this.obj, 'newKey', 'value'); // ✅
// 或
this.obj = { ...this.obj, newKey: 'value' }; // ✅
```

## 问题 4：Proxy 如何彻底解决这些问题？

**Vue 3 使用 Proxy 实现完美的响应式**

```js
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      
      // 依赖收集
      track(target, key);
      
      // 递归代理嵌套对象/数组
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      
      return result;
    },
    
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      
      // 值变化时触发更新
      if (oldValue !== value) {
        trigger(target, key);
      }
      
      return result;
    },
    
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const result = Reflect.deleteProperty(target, key);
      
      if (hadKey && result) {
        trigger(target, key);
      }
      
      return result;
    }
  });
}

// 使用示例
const state = reactive({
  items: [1, 2, 3],
  obj: { a: 1 }
});

state.items[1] = 99; // ✅ 自动触发更新
state.items.push(4); // ✅ 自动触发更新
state.items.length = 0; // ✅ 自动触发更新
state.obj.newKey = 'value'; // ✅ 自动触发更新
delete state.obj.a; // ✅ 自动触发更新
```

### Proxy 的优势

| 特性 | Object.defineProperty | Proxy |
|------|----------------------|-------|
| 监听数组索引 | 需手动遍历定义 | 自动拦截所有操作 |
| 监听数组方法 | 需重写原型方法 | 自动拦截 `set` |
| 监听属性新增 | 无法监听 | 自动拦截 `set` |
| 监听属性删除 | 无法监听 | 支持 `deleteProperty` |
| 性能 | 初始化时遍历开销大 | 懒代理，按需触发 |
| 兼容性 | IE9+ | 不支持 IE11 |

## 问题 5：面试中的深度追问

### 追问 1：为什么 Vue 2 不直接用 Proxy？

**答案**：发布时（2016 年）需要兼容 IE9+，Proxy 无法 polyfill（底层能力缺失）。Vue 3 放弃 IE11 后全面拥抱 Proxy。

### 追问 2：如何实现 Vue 2 的 `$set` 方法？

```js
function $set(target, key, value) {
  // 数组场景：使用 splice 触发响应式
  if (Array.isArray(target) && typeof key === 'number') {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, value);
    return value;
  }
  
  // 对象已有属性：直接赋值（已有 getter/setter）
  if (key in target && !(key in Object.prototype)) {
    target[key] = value;
    return value;
  }
  
  // 新增属性：手动定义 getter/setter 并通知更新
  const ob = target.__ob__;
  defineReactive(target, key, value);
  ob.dep.notify();
  return value;
}
```

### 追问 3：能否用 Proxy 监听整个对象树的变化？

```js
function deepReactive(target, handler = {}) {
  const observedObjects = new WeakMap(); // 防止循环引用
  
  function createProxy(obj) {
    if (observedObjects.has(obj)) {
      return observedObjects.get(obj);
    }
    
    const proxy = new Proxy(obj, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        handler.get?.(target, key, value);
        
        // 递归代理嵌套对象
        if (typeof value === 'object' && value !== null) {
          return createProxy(value);
        }
        return value;
      },
      set(target, key, value, receiver) {
        const oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        handler.set?.(target, key, value, oldValue);
        return result;
      }
    });
    
    observedObjects.set(obj, proxy);
    return proxy;
  }
  
  return createProxy(target);
}

// 使用
const state = deepReactive(
  { user: { profile: { name: 'Alice' } } },
  {
    set(target, key, value, oldValue) {
      console.log(`${key}: ${oldValue} -> ${value}`);
    }
  }
);

state.user.profile.name = 'Bob'; // 输出：name: Alice -> Bob
```

## 延伸阅读

- Vue 2 响应式源码：[observer/array.js](https://github.com/vuejs/vue/blob/dev/src/core/observer/array.js)  
- Vue 3 响应式源码：[@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)  
- MDN：[Proxy vs Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)  
- 【练习】实现一个支持嵌套对象、数组、Set/Map 的深度响应式系统。

