---
title: reactive 深层响应如何实现？
category: Vue
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  理解 Vue reactive 如何实现深层嵌套对象的响应式，掌握懒代理的优化策略。
tags:
  - Vue
  - reactive
  - 深层响应
  - Proxy
estimatedTime: 15 分钟
keywords:
  - reactive 深层
  - 嵌套响应式
  - 懒代理
highlight: reactive 通过懒代理实现深层响应，只有在访问嵌套对象时才创建其 Proxy。
order: 211
---

## 问题 1：reactive 如何处理嵌套对象？

`reactive` 会递归地将嵌套对象也转换为响应式，但采用**懒代理**策略。

```javascript
const state = reactive({
  user: {
    profile: {
      name: "Vue",
    },
  },
});

// 访问嵌套属性时，自动返回响应式对象
state.user.profile.name = "Vue 3"; // 触发更新
```

---

## 问题 2：懒代理是什么？

**懒代理**：不在初始化时递归代理所有嵌套对象，而是在**访问时**才创建代理。

### Vue 2 的做法（非懒代理）

```javascript
// Vue 2：初始化时递归遍历所有属性
function observe(obj) {
  Object.keys(obj).forEach((key) => {
    let value = obj[key];

    // 递归处理嵌套对象
    if (typeof value === "object") {
      observe(value); // 立即递归
    }

    Object.defineProperty(obj, key, {
      get() {
        /* ... */
      },
      set() {
        /* ... */
      },
    });
  });
}
```

### Vue 3 的做法（懒代理）

```javascript
// Vue 3：访问时才代理
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);

      track(target, key);

      // 访问时才递归代理
      if (typeof result === "object" && result !== null) {
        return reactive(result); // 延迟代理
      }

      return result;
    },
    set(target, key, value, receiver) {
      // ...
    },
  });
}
```

---

## 问题 3：懒代理的优势

### 1. 更快的初始化

```javascript
// 大型嵌套对象
const bigData = reactive({
  level1: {
    level2: {
      level3: {
        // ... 很深的嵌套
      },
    },
  },
});

// Vue 2：初始化时遍历所有层级
// Vue 3：只创建最外层的 Proxy，内层按需创建
```

### 2. 更少的内存占用

```javascript
const state = reactive({
  config: {
    /* 很少访问的配置 */
  },
  data: {
    /* 经常访问的数据 */
  },
});

// 如果从不访问 config，就不会为它创建 Proxy
```

---

## 问题 4：代理缓存机制

Vue 会缓存已创建的 Proxy，避免重复创建：

```javascript
const raw = { count: 0 };
const proxy1 = reactive(raw);
const proxy2 = reactive(raw);

console.log(proxy1 === proxy2); // true，同一个 Proxy

// 内部实现
const reactiveMap = new WeakMap();

function reactive(target) {
  // 检查是否已经代理过
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, handlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
```

---

## 问题 5：深层响应的完整示例

```javascript
const state = reactive({
  user: {
    name: "Alice",
    address: {
      city: "Beijing",
    },
  },
});

// 监听深层属性变化
watchEffect(() => {
  console.log(state.user.address.city);
});

// 修改深层属性，触发更新
state.user.address.city = "Shanghai"; // 输出: Shanghai

// 替换整个嵌套对象，新对象也是响应式的
state.user.address = { city: "Shenzhen" }; // 输出: Shenzhen

// 新添加的嵌套对象也是响应式的
state.user.contact = { phone: "123" };
watchEffect(() => {
  console.log(state.user.contact.phone); // 响应式
});
```

---

## 问题 6：与 shallowReactive 的对比

```javascript
import { reactive, shallowReactive } from "vue";

// reactive：深层响应
const deep = reactive({
  nested: { count: 0 },
});
deep.nested.count++; // ✅ 触发更新

// shallowReactive：只有第一层是响应式的
const shallow = shallowReactive({
  nested: { count: 0 },
});
shallow.nested.count++; // ❌ 不触发更新
shallow.nested = { count: 1 }; // ✅ 触发更新（替换整个对象）
```

### 何时使用 shallowReactive？

```javascript
// 当嵌套对象很大且不需要深层响应时
const state = shallowReactive({
  // 这个大对象不需要响应式
  bigData: fetchedData,
  // 只有顶层属性需要响应式
  loading: false,
});
```

## 延伸阅读

- [Vue 官方文档 - reactive](https://cn.vuejs.org/api/reactivity-core.html#reactive)
- [Vue 官方文档 - shallowReactive](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive)
