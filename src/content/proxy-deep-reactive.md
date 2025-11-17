---
title: Proxy 能否监听到对象中的对象的引用？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入探讨 Proxy 的监听机制，理解为什么默认只能监听第一层属性，如何实现深度代理，以及在实际响应式系统中的最佳实践。
tags:
  - Proxy
  - 响应式原理
  - 深度监听
  - Vue 原理
estimatedTime: 35 分钟
keywords:
  - Proxy
  - 深度代理
  - 响应式
  - reactive
  - 嵌套对象
highlight: 理解 Proxy 浅代理的局限性，掌握递归代理和懒代理两种深度监听实现方式，以及性能权衡。
order: 27
---

## 问题 1：Proxy 默认能监听到嵌套对象的变化吗？

**答案：不能，Proxy 默认只能监听第一层属性的变化**

```javascript
// ============================================
// 示例：Proxy 只能监听第一层
// ============================================

const obj = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    street: 'Main St'
  }
};

const proxy = new Proxy(obj, {
  get(target, property) {
    console.log(`读取属性: ${property}`);
    return target[property];
  },
  
  set(target, property, value) {
    console.log(`设置属性: ${property} = ${value}`);
    target[property] = value;
    return true;
  }
});

// ✅ 可以监听到第一层属性的变化
proxy.name = 'Bob';
// 输出：设置属性: name = Bob

// ❌ 无法监听到嵌套对象的变化
proxy.address.city = 'Shanghai';
// 输出：读取属性: address（只触发了 get，没有触发 set）
// 没有输出：设置属性: city = Shanghai

console.log(proxy.address.city);  // 'Shanghai'（值已改变，但未触发监听）
```

**原因分析**

```javascript
// 当执行 proxy.address.city = 'Shanghai' 时：

// 步骤 1：读取 proxy.address
// → 触发 get(target, 'address')
// → 返回 target.address（原始对象，不是代理对象）

// 步骤 2：设置 address.city
// → 直接操作原始对象 address.city = 'Shanghai'
// → 不经过 proxy，所以不会触发 set 拦截器

// 验证：address 是原始对象，不是代理对象
console.log(proxy.address === obj.address);  // true（同一个对象引用）
```

---

## 问题 2：为什么 Proxy 无法监听嵌套对象？

**核心原因：返回的是原始对象引用，而不是代理对象**

```javascript
const obj = {
  nested: {
    value: 1
  }
};

const proxy = new Proxy(obj, {
  get(target, property) {
    console.log(`get: ${property}`);
    // 返回的是原始对象，不是代理对象
    return target[property];  // ← 返回原始对象 nested
  }
});

// 当访问 proxy.nested 时
const nested = proxy.nested;
// 输出：get: nested
// nested 是原始对象 { value: 1 }，不是代理对象

// 直接操作 nested，不会经过 proxy
nested.value = 2;  // 不会触发任何拦截器
```

**图解说明**

```
proxy (代理对象)
  ↓ get('nested')
obj.nested (原始对象) ← 返回的是这个原始对象
  ↓ 直接操作
nested.value = 2  ← 不经过 proxy，无法监听
```

**对比：如果返回代理对象**

```javascript
const obj = {
  nested: {
    value: 1
  }
};

const proxy = new Proxy(obj, {
  get(target, property) {
    const value = target[property];
    
    // 如果返回的是代理对象
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(target, prop) {
          console.log(`get nested: ${prop}`);
          return target[prop];
        },
        set(target, prop, val) {
          console.log(`set nested: ${prop} = ${val}`);
          target[prop] = val;
          return true;
        }
      });
    }
    
    return value;
  }
});

// 现在可以监听到嵌套对象的变化
proxy.nested.value = 2;
// 输出：
// set nested: value = 2
```

---

## 问题 3：如何实现深度代理（Deep Proxy）？

**递归代理**

```javascript
function createDeepProxy(target, handler, proxyCache = new WeakMap()) {
  // 非对象直接返回
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 已经有缓存的代理，直接复用
  if (proxyCache.has(target)) {
    return proxyCache.get(target);
  }

  const proxy = new Proxy(target, {
    get(t, prop, receiver) {
      // 先通过 Reflect 拿原始值
      let value = Reflect.get(t, prop, receiver);

      // 交给用户自定义的 get
      if (typeof handler.get === 'function') {
        // 这里多传一个 value，方便 handler 使用
        value = handler.get(t, prop, value, receiver);
      }

      // 如果结果还是对象，继续深度代理
      if (value !== null && typeof value === 'object') {
        return createDeepProxy(value, handler, proxyCache);
      }

      return value;
    },

    set(t, prop, value, receiver) {
      // 新值如果是对象，先深度代理
      if (value !== null && typeof value === 'object') {
        value = createDeepProxy(value, handler, proxyCache);
      }

      // 先让用户的 set 决定要不要继续
      if (typeof handler.set === 'function') {
        const ok = handler.set(t, prop, value, receiver);
        if (!ok) return false; // 用户拦截
      }

      return Reflect.set(t, prop, value, receiver);
    }
  });

  proxyCache.set(target, proxy);
  return proxy;
}

// 使用示例
const obj = {
  name: 'Alice',
  address: {
    city: 'Beijing',
    details: {
      street: 'Main St',
      zip: '100000'
    }
  }
};

const deepProxy = createDeepProxy(obj, {
  get(target, property, value) {
    console.log(`读取: ${String(property)}`);
    return value; // 必须返回最终要暴露出去的值
  },

  set(target, property, value) {
    console.log(`设置: ${String(property)} = ${value}`);
    return true; // 返回 true 表示允许写入
  }
});

// 测试
deepProxy.address.city = 'Shanghai';
// 控制台：
// 读取: address
// 设置: city = Shanghai

deepProxy.address.details.street = 'New St';
// 控制台：
// 读取: address
// 读取: details
// 设置: street = New St
```
---

## 总结

### 核心要点

1. **Proxy 默认只能监听第一层**：返回的是原始对象引用，不是代理对象
2. **深度代理需要递归**：为嵌套对象创建代理对象
3. **性能考虑**：深度代理会创建大量对象，需要缓存优化

### 推荐阅读

- [MDN: Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Vue 3 响应式原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Proxy 与 Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)

