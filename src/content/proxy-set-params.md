---
title: Proxy set 拦截器的参数详解
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 Proxy set 拦截器的四个参数（target、property、value、receiver）的含义与使用场景，掌握响应式系统的核心机制。
tags:
  - Proxy
  - 元编程
  - 响应式原理
estimatedTime: 30 分钟
keywords:
  - Proxy set
  - receiver
  - Reflect
  - 原型链
highlight: 理解 receiver 参数在继承场景中的关键作用，以及为何要配合 Reflect.set 使用。
order: 8
---

## 问题 1：Proxy set 拦截器有哪些参数？

### 完整签名

```ts
set(target: object, property: string | symbol, value: any, receiver: object): boolean
```

### 参数说明

| 参数 | 类型 | 含义 |
|------|------|------|
| `target` | `object` | 被代理的原始目标对象 |
| `property` | `string \| symbol` | 要设置的属性名（可以是字符串或 Symbol） |
| `value` | `any` | 要设置的新值 |
| `receiver` | `object` | 最初被调用的对象（通常是代理对象本身，但在原型链场景中会不同） |

### 返回值

- **必须返回布尔值**：`true` 表示设置成功，`false` 表示失败（严格模式下会抛出 `TypeError`）。

## 问题 2：基本用法示例

```js
const obj = { name: 'Alice' };

const proxy = new Proxy(obj, {
  set(target, property, value, receiver) {
    console.log('target:', target);           // { name: 'Alice' }
    console.log('property:', property);       // 'age'
    console.log('value:', value);             // 25
    console.log('receiver:', receiver);       // proxy 对象本身
    console.log('receiver === proxy:', receiver === proxy); // true

    // 手动设置属性
    target[property] = value;
    return true; // 必须返回 true 表示成功
  }
});

proxy.age = 25;
// 输出：
// target: { name: 'Alice' }
// property: age
// value: 25
// receiver: Proxy {...}
// receiver === proxy: true
```

### 常见错误：忘记返回值

```js
const proxy = new Proxy({}, {
  set(target, property, value) {
    target[property] = value;
    // ❌ 忘记 return true
  }
});

// 非严格模式：静默失败
proxy.name = 'Bob';
console.log(proxy.name); // undefined

// 严格模式：抛出 TypeError
'use strict';
proxy.name = 'Bob'; // TypeError: 'set' on proxy: trap returned falsish
```

## 问题 3：receiver 参数的深层含义

### 场景 1：基础代理（receiver 就是 proxy）

```js
const target = { count: 0 };
const proxy = new Proxy(target, {
  set(target, property, value, receiver) {
    console.log('receiver === proxy:', receiver === proxy); // true
    target[property] = value;
    return true;
  }
});

proxy.count = 1; // receiver === proxy: true
```

### 场景 2：原型链继承（receiver 指向子对象）

```js
const parent = { parentValue: 100 };
const parentProxy = new Proxy(parent, {
  set(target, property, value, receiver) {
    console.log('target:', target);           // { parentValue: 100 }
    console.log('receiver:', receiver);       // child 对象
    console.log('receiver === parentProxy:', receiver === parentProxy); // false

    target[property] = value;
    return true;
  }
});

// child 继承 parentProxy
const child = Object.create(parentProxy);
child.childValue = 200; // 触发 parentProxy 的 set 拦截器

// 输出：
// target: { parentValue: 100 }
// receiver: { childValue: 200 }  ← receiver 是 child，不是 parentProxy
// receiver === parentProxy: false
```

**关键点**：在原型链场景中，`receiver` 指向实际接收赋值操作的对象（即 `child`），而不是代理对象（`parentProxy`）。

### 场景 3：为什么需要 receiver？配合 Reflect.set

```js
const base = {
  _value: 0,
  set value(v) {
    this._value = v;
  }
};

// 错误实现：直接 target[property] = value
const badProxy = new Proxy(base, {
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

// 正确实现：Reflect.set 传递 receiver
const goodProxy = new Proxy(base, {
  set(target, prop, value, receiver) {
    return Reflect.set(target, prop, value, receiver);
  }
});

// 让两个对象都“继承”各自的 proxy
const child1 = { __proto__: badProxy };
const child2 = { __proto__: goodProxy };

child1.value = 10;
child2.value = 20;

console.log(child1._value); // 10
console.log(child2._value); // 20
console.log(base._value);   // 10
```

**核心原理**：`Reflect.set(target, property, value, receiver)` 会在执行 setter 时将 `this` 绑定到 `receiver`，确保 getter/setter 中的 `this` 指向代理对象而非原始对象。

## 问题 4：实战案例：Vue 3 响应式系统

### 简化版响应式实现

```ts
// 依赖收集与触发
const targetMap = new WeakMap<object, Map<PropertyKey, Set<Function>>>();

function track(target: object, key: PropertyKey) {
  // 收集当前活跃的副作用函数
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  if (activeEffect) {
    dep.add(activeEffect);
  }
}

function trigger(target: object, key: PropertyKey) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect());
  }
}

// 响应式代理
function reactive<T extends object>(target: T): T {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 依赖收集
      track(target, key);

      // 使用 Reflect.get 正确传递 receiver
      const result = Reflect.get(target, key, receiver);

      // 递归代理嵌套对象
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }

      return result;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];

      // 使用 Reflect.set 确保 this 绑定正确
      const result = Reflect.set(target, key, value, receiver);

      // 值变化时触发更新（避免重复触发）
      if (oldValue !== value || (typeof value === 'object' && value !== null)) {
        trigger(target, key);
      }

      return result;
    }
  });
}

// 使用示例
let activeEffect: Function | null = null;

function watchEffect(fn: Function) {
  activeEffect = fn;
  fn(); // 立即执行，收集依赖
  activeEffect = null;
}

// 测试
const state = reactive({
  count: 0,
  nested: { value: 100 }
});

watchEffect(() => {
  console.log('count changed:', state.count);
});

state.count++; // 输出：count changed: 1
state.nested.value = 200; // 嵌套对象也能触发更新
```

## 问题 5：高级场景与陷阱

### 陷阱 1：数组的 length 赋值

```js
const arr = reactive([1, 2, 3]);

// 直接设置 length 会触发多次 set
arr.length = 0;
// 会依次触发：
// set(arr, '0', undefined, receiver)
// set(arr, '1', undefined, receiver)
// set(arr, '2', undefined, receiver)
// set(arr, 'length', 0, receiver)

// 需要去重处理，避免重复触发更新
```

### 陷阱 2：Symbol.toStringTag 等内建 Symbol

```js
const proxy = new Proxy({}, {
  set(target, property, value, receiver) {
    console.log('property:', property);
    return Reflect.set(target, property, value, receiver);
  }
});

// 某些操作会触发内建 Symbol 的设置
Object.prototype.toString.call(proxy); // 可能触发 Symbol.toStringTag
```

### 陷阱 3：冻结对象的处理

```js
const frozen = Object.freeze({ name: 'Alice' });
const proxy = new Proxy(frozen, {
  set(target, property, value, receiver) {
    // 尝试设置冻结对象会失败
    return Reflect.set(target, property, value, receiver); // 返回 false
  }
});

proxy.name = 'Bob'; // 非严格模式：静默失败
// 严格模式：TypeError: Cannot assign to read only property
```

## 问题 6：与 Object.defineProperty 的对比

| 特性 | Object.defineProperty | Proxy set 拦截器 |
|------|----------------------|------------------|
| 拦截范围 | 单个属性 | 整个对象的所有属性 |
| 新增属性 | 无法拦截 | 自动拦截 |
| 数组索引 | 需手动遍历 | 自动拦截 |
| receiver 支持 | 无此概念 | 支持，处理原型链场景 |
| 返回值 | 无 | 必须返回布尔值 |
| 性能 | 初始化时遍历开销大 | 按需拦截，性能更优 |

## 问题 7：面试追问题

### 追问 1：为什么必须用 Reflect.set 而不是直接 `target[property] = value`？

**答案**：

1. **正确的 this 绑定**：Reflect.set 会将 receiver 传递给 setter，确保 `this` 指向代理对象。
2. **标准化返回值**：Reflect.set 总是返回布尔值，符合 Proxy 规范。
3. **处理访问器属性**：直接赋值无法正确触发 setter 的 this 绑定。

```js
const obj = {
  _value: 0,
  set value(v) {
    this._value = v; // this 应该指向 proxy，而非 target
  }
};

// ❌ 错误
target[property] = value; // this 指向 target

// ✅ 正确
Reflect.set(target, property, value, receiver); // this 指向 receiver（proxy）
```

### 追问 2：如何实现一个只读代理？

```js
function readonly(target) {
  return new Proxy(target, {
    set(target, property, value, receiver) {
      console.warn(`Cannot set property '${String(property)}' on readonly object`);
      return false; // 返回 false 表示设置失败
    },
    deleteProperty(target, property) {
      console.warn(`Cannot delete property '${String(property)}' on readonly object`);
      return false;
    }
  });
}

const state = readonly({ count: 0 });
state.count = 1; // 警告：Cannot set property 'count' on readonly object
```

### 追问 3：如何实现一个验证代理（类型校验）？

```js
function createValidator(schema) {
  return new Proxy({}, {
    set(target, property, value, receiver) {
      const validator = schema[property];

      if (!validator) {
        throw new Error(`Property '${String(property)}' is not defined in schema`);
      }

      if (!validator(value)) {
        throw new TypeError(`Invalid value for '${String(property)}'`);
      }

      return Reflect.set(target, property, value, receiver);
    }
  });
}

// 使用
const user = createValidator({
  name: (v) => typeof v === 'string' && v.length > 0,
  age: (v) => typeof v === 'number' && v >= 0 && v <= 150
});

user.name = 'Alice'; // ✅
user.age = 25;       // ✅
user.age = -5;       // ❌ TypeError: Invalid value for 'age'
user.email = 'a@b.com'; // ❌ Error: Property 'email' is not defined in schema
```

## 延伸阅读

- MDN：[Proxy handler.set()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set)
- MDN：[Reflect.set()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/set)
- Vue 3 源码：[@vue/reactivity baseHandlers.ts](https://github.com/vuejs/core/blob/main/packages/reactivity/src/baseHandlers.ts)
- 【练习】实现一个支持嵌套路径校验的数据校验代理（如 `user.profile.email` 的类型检查）。
