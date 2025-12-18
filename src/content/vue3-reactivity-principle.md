---
title: Vue3 响应式实现的原理
category: Vue
difficulty: 中级
updatedAt: 2025-01-13
summary: >-
  深入理解 Vue3 响应式系统的核心原理，掌握 Proxy、effect、track、trigger 的完整工作机制。
tags:
  - Vue3
  - 响应式
  - Proxy
  - effect
  - track/trigger
  - WeakMap
estimatedTime: 35 分钟
keywords:
  - Vue3响应式
  - Proxy
  - effect
  - track
  - trigger
  - WeakMap
highlight: 理解 Vue3 响应式系统的革新设计，掌握基于 Proxy 的数据劫持和 effect 系统
order: 243
---

## 问题：Vue3 响应式实现的原理是什么？

**核心答案：Vue3 使用 `Proxy` 进行数据劫持，通过 `effect` 函数和 `track/trigger` 机制实现响应式**

### Vue3 vs Vue2 的核心变化

| 对比项   | Vue2                  | Vue3                    |
| -------- | --------------------- | ----------------------- |
| 数据劫持 | Object.defineProperty | Proxy                   |
| 依赖收集 | Dep 类                | WeakMap + Set           |
| 观察者   | Watcher 类            | effect 函数             |
| 支持范围 | 对象属性              | 对象、数组、Map、Set 等 |

### 响应式系统的核心组件

#### 1. 数据劫持 - Proxy

```javascript
// 创建响应式对象
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);

      // 依赖收集
      track(target, key);

      // 如果值是对象，递归创建响应式
      return typeof result === "object" ? reactive(result) : result;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);

      // 只有值真正改变时才触发更新
      if (oldValue !== value) {
        trigger(target, key);
      }

      return result;
    },
  });
}
```

#### 2. 依赖收集系统

```javascript
// 全局依赖收集存储
const targetMap = new WeakMap(); // WeakMap<target, Map<key, Set<effect>>>
let activeEffect = null; // 当前正在执行的 effect

// 依赖收集
function track(target, key) {
  if (!activeEffect) return;

  // 获取 target 对应的 depsMap
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 获取 key 对应的 deps
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  // 收集当前 effect
  deps.add(activeEffect);
}

// 派发更新
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (deps) {
    // 执行所有相关的 effect
    deps.forEach((effect) => effect());
  }
}
```

#### 3. Effect 系统

```javascript
// 创建响应式副作用函数
function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      return fn(); // 执行用户函数，触发依赖收集
    } finally {
      activeEffect = null;
    }
  };

  // 立即执行一次，建立依赖关系
  effectFn();

  return effectFn;
}
```

### 完整工作流程

#### 1. 创建响应式数据

```javascript
const state = reactive({
  count: 0,
  user: { name: "Alice" },
});
```

#### 2. 建立响应式关系

```javascript
// 创建 effect，自动收集依赖
effect(() => {
  console.log("count changed:", state.count);
  // 读取 state.count 时触发 track(state, 'count')
});

// targetMap 结构：
// WeakMap {
//   state => Map {
//     'count' => Set { effectFn }
//   }
// }
```

#### 3. 触发更新

```javascript
state.count = 1;
// 1. 触发 Proxy 的 set trap
// 2. 调用 trigger(state, 'count')
// 3. 找到对应的 effects 并执行
// 4. 输出: "count changed: 1"
```

### 核心 API 实现

#### ref 的实现

```javascript
function ref(value) {
  return {
    get value() {
      track(this, "value");
      return value;
    },
    set value(newValue) {
      if (newValue !== value) {
        value = newValue;
        trigger(this, "value");
      }
    },
  };
}

// 使用示例
const count = ref(0);
effect(() => console.log(count.value)); // 依赖收集
count.value = 1; // 触发更新
```

#### computed 的实现

```javascript
function computed(getter) {
  let value;
  let dirty = true; // 缓存标记

  const effectFn = effect(() => {
    if (dirty) {
      value = getter();
      dirty = false;
    }
    return value;
  });

  return {
    get value() {
      track(this, "value");
      // 依赖变化时重新计算
      if (dirty) {
        value = effectFn();
      }
      return value;
    },
  };
}
```

### 数据结构设计的巧思

#### WeakMap 的使用

```javascript
// 为什么使用 WeakMap？
const targetMap = new WeakMap();

// 1. 自动垃圾回收：当 target 对象被销毁时，对应的依赖关系也会被清理
// 2. 避免内存泄漏：不会阻止 target 对象被垃圾回收
// 3. 性能优化：WeakMap 的查找性能更好
```

#### 三层嵌套结构

```javascript
// WeakMap<target, Map<key, Set<effect>>>
//
// target (响应式对象)
//   └── key (对象属性)
//       └── effects (依赖该属性的副作用函数集合)

// 这种设计的优势：
// 1. 精确追踪：每个属性都有独立的依赖集合
// 2. 高效更新：只触发相关属性的 effects
// 3. 内存友好：使用 WeakMap 和 Set 优化内存使用
```

### Vue3 响应式的优势

#### 1. 更强大的拦截能力

```javascript
const state = reactive({
  items: [1, 2, 3],
  map: new Map(),
});

// 支持数组索引操作
state.items[0] = 10; // ✅ 可以监听

// 支持数组方法
state.items.push(4); // ✅ 可以监听

// 支持动态属性
state.newProp = "value"; // ✅ 可以监听

// 支持 Map/Set 操作
state.map.set("key", "value"); // ✅ 可以监听
```

#### 2. 更好的性能

```javascript
// Vue2：初始化时递归遍历所有属性
// Vue3：懒代理，只有访问时才创建响应式

const state = reactive({
  level1: {
    level2: {
      level3: { data: "deep" },
    },
  },
});

// 只有访问 state.level1.level2.level3 时
// 才会为 level2 和 level3 创建 Proxy
```

#### 3. 更灵活的组合

```javascript
// 可以独立使用响应式系统
import { reactive, effect } from "@vue/reactivity";

const state = reactive({ count: 0 });
effect(() => {
  document.title = `Count: ${state.count}`;
});
```

### 核心特点总结

#### 优势

- **完整的拦截**：支持所有对象操作（属性添加/删除、数组索引等）
- **更好的性能**：懒代理 + WeakMap 优化
- **类型友好**：天然支持 TypeScript
- **独立使用**：响应式系统可以脱离 Vue 使用

#### 注意事项

- **浏览器兼容性**：需要 Proxy 支持（IE11 不支持）
- **解构丢失响应性**：`const { count } = reactive({ count: 0 })` 会丢失响应性
- **ref 的心智负担**：需要通过 `.value` 访问

### 总结

Vue3 响应式系统通过 Proxy 实现了更强大、更灵活的数据劫持，配合 effect 系统和精心设计的依赖收集机制，不仅解决了 Vue2 的限制，还带来了更好的性能和开发体验。核心思想是：**用 Proxy 监听数据变化，用 effect 建立响应关系，用 WeakMap 管理依赖关系**。
