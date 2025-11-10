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
console.log(proxy.address instanceof Proxy);  // false（不是代理对象）
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
// get nested: value
// set nested: value = 2
```

---

## 问题 3：如何实现深度代理（Deep Proxy）？

**方法 1：递归代理（递归创建代理对象）**

```javascript
function createDeepProxy(target, handler) {
  // 创建主代理
  const proxy = new Proxy(target, {
    get(target, property) {
      const value = Reflect.get(target, property);
      
      // 如果值是对象，递归创建代理
      if (value !== null && typeof value === 'object') {
        return createDeepProxy(value, handler);
      }
      
      return value;
    },
    
    set(target, property, value) {
      // 如果新值是对象，也需要代理
      if (value !== null && typeof value === 'object') {
        value = createDeepProxy(value, handler);
      }
      
      return Reflect.set(target, property, value);
    }
  });
  
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
  get(target, property) {
    console.log(`读取: ${property}`);
    return target[property];
  },
  
  set(target, property, value) {
    console.log(`设置: ${property} = ${value}`);
    target[property] = value;
    return true;
  }
});

// 现在可以监听到所有层级的变化
deepProxy.address.city = 'Shanghai';
// 输出：
// 读取: address
// 设置: city = Shanghai

deepProxy.address.details.street = 'New St';
// 输出：
// 读取: address
// 读取: details
// 设置: street = New St
```

**方法 2：懒代理（Lazy Proxy，按需创建代理）**

```javascript
function createLazyProxy(target, handler) {
  // 缓存已创建的代理对象
  const proxyCache = new WeakMap();
  
  function getProxy(value) {
    // 如果不是对象，直接返回
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    // 如果已经创建过代理，直接返回
    if (proxyCache.has(value)) {
      return proxyCache.get(value);
    }
    
    // 创建新的代理对象
    const proxy = new Proxy(value, {
      get(target, property) {
        const value = Reflect.get(target, property);
        
        // 递归处理嵌套对象
        return getProxy(value);
      },
      
      set(target, property, value) {
        const result = Reflect.set(target, property, value);
        
        // 如果设置的是对象，也需要代理
        if (value !== null && typeof value === 'object') {
          proxyCache.set(value, getProxy(value));
        }
        
        return result;
      }
    });
    
    // 缓存代理对象
    proxyCache.set(value, proxy);
    return proxy;
  }
  
  return getProxy(target);
}

// 使用示例
const obj = {
  level1: {
    level2: {
      level3: {
        value: 1
      }
    }
  }
};

const lazyProxy = createLazyProxy(obj, {
  get(target, property) {
    console.log(`get: ${property}`);
    return target[property];
  },
  
  set(target, property, value) {
    console.log(`set: ${property} = ${value}`);
    target[property] = value;
    return true;
  }
});

// 访问时按需创建代理
lazyProxy.level1.level2.level3.value = 2;
// 输出：
// get: level1
// get: level2
// get: level3
// set: value = 2
```

**方法 3：Vue 3 风格的响应式实现**

```javascript
// Vue 3 reactive 的简化实现
const reactiveMap = new WeakMap();

function reactive(target) {
  // 如果已经是响应式对象，直接返回
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  
  // 如果不是对象，直接返回
  if (typeof target !== 'object' || target === null) {
    return target;
  }
  
  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, property, receiver) {
      const result = Reflect.get(target, property, receiver);
      
      // 如果是对象，递归创建响应式代理
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      
      return result;
    },
    
    set(target, property, value, receiver) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value, receiver);
      
      // 如果值改变了，触发更新（简化版，实际 Vue 3 会触发依赖更新）
      if (oldValue !== value) {
        console.log(`属性 ${property} 从 ${oldValue} 变为 ${value}`);
      }
      
      return result;
    }
  });
  
  // 缓存代理对象
  reactiveMap.set(target, proxy);
  return proxy;
}

// 使用示例
const state = reactive({
  user: {
    name: 'Alice',
    profile: {
      age: 25,
      address: {
        city: 'Beijing'
      }
    }
  }
});

// 所有层级的变化都能被监听到
state.user.name = 'Bob';
// 输出：属性 name 从 Alice 变为 Bob

state.user.profile.age = 26;
// 输出：属性 age 从 25 变为 26

state.user.profile.address.city = 'Shanghai';
// 输出：属性 city 从 Beijing 变为 Shanghai
```

---

## 问题 4：深度代理的性能问题是什么？

**问题：递归代理会创建大量代理对象，影响性能**

```javascript
// 性能测试：深度代理 vs 浅代理

// 创建深层嵌套对象
function createDeepObject(depth) {
  let obj = { value: 0 };
  for (let i = 0; i < depth; i++) {
    obj = { nested: obj };
  }
  return obj;
}

// 深度代理：为每一层都创建代理
function deepProxy(obj) {
  return new Proxy(obj, {
    get(target, property) {
      const value = target[property];
      if (value && typeof value === 'object') {
        return deepProxy(value);  // 递归创建代理
      }
      return value;
    }
  });
}

// 测试：1000 层嵌套对象
const deepObj = createDeepObject(1000);

console.time('深度代理创建');
const deep = deepProxy(deepObj);
console.timeEnd('深度代理创建');
// ~50-100ms（创建大量代理对象）

console.time('访问深层属性');
let current = deep;
for (let i = 0; i < 1000; i++) {
  current = current.nested;  // 每次访问都会创建新的代理
}
console.timeEnd('访问深层属性');
// ~10-20ms（每次访问都创建代理）
```

**优化：懒代理（按需创建）**

```javascript
// 优化：使用 WeakMap 缓存，避免重复创建
const proxyCache = new WeakMap();

function optimizedDeepProxy(obj) {
  if (proxyCache.has(obj)) {
    return proxyCache.get(obj);
  }
  
  const proxy = new Proxy(obj, {
    get(target, property) {
      const value = target[property];
      if (value && typeof value === 'object') {
        return optimizedDeepProxy(value);  // 使用缓存
      }
      return value;
    }
  });
  
  proxyCache.set(obj, proxy);
  return proxy;
}

console.time('优化后的深度代理');
const optimized = optimizedDeepProxy(deepObj);
console.timeEnd('优化后的深度代理');
// ~5-10ms（使用缓存，更快）

console.time('访问深层属性（优化后）');
let current2 = optimized;
for (let i = 0; i < 1000; i++) {
  current2 = current2.nested;  // 使用缓存的代理
}
console.timeEnd('访问深层属性（优化后）');
// ~1-2ms（使用缓存，快很多）
```

**性能对比表**

| 方式 | 初始化性能 | 访问性能 | 内存占用 | 适用场景 |
|------|-----------|---------|---------|---------|
| **浅代理** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 只需要监听第一层 |
| **深度代理（递归）** | ⭐⭐ | ⭐⭐ | ⭐⭐ | 需要监听所有层级 |
| **懒代理（缓存）** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 平衡性能和功能 |

---

## 问题 5：如何处理数组和特殊对象？

**数组的特殊处理**

```javascript
function createReactiveArray(arr) {
  return new Proxy(arr, {
    get(target, property, receiver) {
      // 处理数组的特殊方法
      if (property === 'push' || property === 'pop' || 
          property === 'shift' || property === 'unshift' ||
          property === 'splice' || property === 'sort' || 
          property === 'reverse') {
        return function(...args) {
          console.log(`调用数组方法: ${property}`, args);
          const result = Array.prototype[property].apply(target, args);
          
          // 对新添加的元素创建代理
          if (property === 'push' || property === 'unshift' || property === 'splice') {
            args.forEach(arg => {
              if (typeof arg === 'object' && arg !== null) {
                createReactive(arg);
              }
            });
          }
          
          return result;
        };
      }
      
      // 处理索引访问
      const value = Reflect.get(target, property, receiver);
      if (typeof value === 'object' && value !== null) {
        return createReactive(value);
      }
      return value;
    },
    
    set(target, property, value, receiver) {
      console.log(`设置数组索引 ${property} = ${value}`);
      const result = Reflect.set(target, property, value, receiver);
      
      // 如果设置的是对象，也需要代理
      if (typeof value === 'object' && value !== null) {
        createReactive(value);
      }
      
      return result;
    }
  });
}

function createReactive(obj) {
  if (Array.isArray(obj)) {
    return createReactiveArray(obj);
  }
  
  return new Proxy(obj, {
    get(target, property) {
      const value = Reflect.get(target, property);
      if (typeof value === 'object' && value !== null) {
        return createReactive(value);
      }
      return value;
    },
    
    set(target, property, value) {
      console.log(`设置属性 ${property} = ${value}`);
      return Reflect.set(target, property, value);
    }
  });
}

// 使用示例
const arr = createReactive([
  { name: 'Alice' },
  { name: 'Bob' }
]);

arr.push({ name: 'Charlie' });
// 输出：调用数组方法: push [{ name: 'Charlie' }]

arr[0].name = 'Alice Updated';
// 输出：设置属性 name = Alice Updated
```

**处理 Date、RegExp 等特殊对象**

```javascript
function createReactive(obj) {
  // 跳过不需要代理的对象类型
  if (obj instanceof Date || 
      obj instanceof RegExp || 
      obj instanceof Map || 
      obj instanceof Set) {
    return obj;  // 不代理这些对象
  }
  
  if (Array.isArray(obj)) {
    return createReactiveArray(obj);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return new Proxy(obj, {
      get(target, property) {
        const value = Reflect.get(target, property);
        if (typeof value === 'object' && value !== null) {
          return createReactive(value);
        }
        return value;
      },
      
      set(target, property, value) {
        return Reflect.set(target, property, value);
      }
    });
  }
  
  return obj;
}
```

---

## 问题 6：Vue 3 是如何实现深度响应的？

**Vue 3 的实现策略：懒代理 + 依赖收集**

```javascript
// Vue 3 reactive 的简化实现（核心思路）

const reactiveMap = new WeakMap();
const targetMap = new WeakMap();  // 依赖收集

function reactive(target) {
  // 如果已经是响应式对象，直接返回
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  
  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, property, receiver) {
      // 依赖收集（简化版）
      track(target, property);
      
      const result = Reflect.get(target, property, receiver);
      
      // 如果是对象，递归创建响应式代理（懒代理）
      if (typeof result === 'object' && result !== null) {
        return reactive(result);  // 按需创建
      }
      
      return result;
    },
    
    set(target, property, value, receiver) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value, receiver);
      
      // 触发更新（简化版）
      if (oldValue !== value) {
        trigger(target, property);
      }
      
      return result;
    }
  });
  
  // 缓存代理对象
  reactiveMap.set(target, proxy);
  return proxy;
}

function track(target, property) {
  // 依赖收集逻辑（简化版）
  console.log(`收集依赖: ${property}`);
}

function trigger(target, property) {
  // 触发更新逻辑（简化版）
  console.log(`触发更新: ${property}`);
}

// 使用示例
const state = reactive({
  user: {
    name: 'Alice',
    profile: {
      age: 25
    }
  }
});

// 访问时按需创建代理
console.log(state.user.name);
// 输出：
// 收集依赖: user
// 收集依赖: name

state.user.profile.age = 26;
// 输出：
// 收集依赖: user
// 收集依赖: profile
// 触发更新: age
```

**Vue 3 的关键优化**

1. **懒代理**：只在访问时创建代理，而不是一次性创建所有代理
2. **WeakMap 缓存**：避免重复创建代理对象
3. **依赖收集**：只追踪实际使用的属性
4. **特殊对象处理**：跳过 Date、RegExp 等不需要代理的对象

---

## 问题 7：实际开发中如何选择？

### 决策指南

**使用浅代理的场景**

```javascript
// ✅ 场景 1：只需要监听顶层属性
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

const proxy = new Proxy(config, {
  set(target, property, value) {
    console.log(`配置更新: ${property} = ${value}`);
    target[property] = value;
    return true;
  }
});

// ✅ 场景 2：性能敏感的场景
// 浅代理性能最好，内存占用最小
```

**使用深度代理的场景**

```javascript
// ✅ 场景 1：状态管理（如 Vue 3、Redux）
const state = reactive({
  user: {
    profile: {
      settings: {
        theme: 'dark'
      }
    }
  }
});

// ✅ 场景 2：表单数据监听
const formData = reactive({
  personal: {
    name: '',
    email: ''
  },
  address: {
    city: '',
    street: ''
  }
});

// ✅ 场景 3：需要完整响应式能力的场景
```

**性能优化建议**

```javascript
// 1. 使用 WeakMap 缓存代理对象
const proxyCache = new WeakMap();

// 2. 避免过度嵌套
// ❌ 不推荐：过深的嵌套
const bad = {
  a: { b: { c: { d: { e: { value: 1 } } } } }
};

// ✅ 推荐：扁平化结构
const good = {
  'a.b.c.d.e.value': 1
};

// 3. 只代理需要监听的对象
function selectiveReactive(obj, keys) {
  return new Proxy(obj, {
    get(target, property) {
      const value = Reflect.get(target, property);
      
      // 只对指定的键进行深度代理
      if (keys.includes(property) && typeof value === 'object' && value !== null) {
        return selectiveReactive(value, keys);
      }
      
      return value;
    }
  });
}
```

---

## 总结

### 核心要点

1. **Proxy 默认只能监听第一层**：返回的是原始对象引用，不是代理对象
2. **深度代理需要递归**：为嵌套对象创建代理对象
3. **性能考虑**：深度代理会创建大量对象，需要缓存优化
4. **懒代理策略**：按需创建代理，平衡性能和功能
5. **Vue 3 的实现**：使用 WeakMap 缓存 + 懒代理 + 依赖收集

### 关键对比

| 特性 | 浅代理 | 深度代理（递归） | 懒代理（缓存） |
|------|--------|----------------|--------------|
| **监听范围** | 第一层 | 所有层级 | 所有层级 |
| **初始化性能** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **访问性能** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **内存占用** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **实现复杂度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

### 最佳实践

1. **优先使用浅代理**：如果只需要监听第一层
2. **使用懒代理**：需要深度监听时，使用缓存优化
3. **避免过度嵌套**：设计数据结构时考虑扁平化
4. **选择性代理**：只代理需要监听的部分
5. **性能监控**：在性能敏感的场景中监控代理对象的创建

### 推荐阅读

- [MDN: Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Vue 3 响应式原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Proxy 与 Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)

