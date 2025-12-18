---
title: track 和 trigger 分别做什么？
category: Vue
difficulty: 高级
updatedAt: 2025-12-05
summary: >-
  深入理解 Vue 响应式系统的核心机制，掌握 track（依赖收集）和 trigger（派发更新）的工作原理。
tags:
  - Vue
  - 响应式
  - track
  - trigger
estimatedTime: 15 分钟
keywords:
  - track trigger
  - 依赖收集
  - 派发更新
highlight: track 在读取数据时收集依赖，trigger 在修改数据时触发更新，两者构成响应式的核心。
order: 484
---

## 问题 1：track 和 trigger 的作用

- **track**：在**读取**响应式数据时，收集当前正在执行的 effect（副作用函数）
- **trigger**：在**修改**响应式数据时，触发所有依赖该数据的 effect 重新执行

```javascript
const state = reactive({ count: 0 });

effect(() => {
  // 读取 count，触发 track，收集这个 effect
  console.log(state.count);
});

// 修改 count，触发 trigger，重新执行 effect
state.count = 1;
```

---

## 问题 2：track 的工作原理

### 数据结构

```javascript
// 全局依赖存储
// WeakMap { target -> Map { key -> Set<effect> } }
const targetMap = new WeakMap();

// 当前正在执行的 effect
let activeEffect = null;
```

### track 实现

```javascript
function track(target, key) {
  // 没有正在执行的 effect，不需要收集
  if (!activeEffect) return;

  // 获取 target 对应的依赖 Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 获取 key 对应的 effect 集合
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 将当前 effect 添加到依赖集合
  dep.add(activeEffect);
}
```

### 调用时机

```javascript
// 在 Proxy 的 get 拦截器中调用
new Proxy(target, {
  get(target, key, receiver) {
    track(target, key); // 收集依赖
    return Reflect.get(target, key, receiver);
  },
});
```

---

## 问题 3：trigger 的工作原理

### trigger 实现

```javascript
function trigger(target, key) {
  // 获取 target 对应的依赖 Map
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 获取 key 对应的 effect 集合
  const dep = depsMap.get(key);
  if (!dep) return;

  // 执行所有依赖该 key 的 effect
  dep.forEach((effect) => {
    // 避免无限循环：正在执行的 effect 不重复触发
    if (effect !== activeEffect) {
      effect();
    }
  });
}
```

### 调用时机

```javascript
// 在 Proxy 的 set 拦截器中调用
new Proxy(target, {
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);

    // 值真正改变时才触发更新
    if (oldValue !== value) {
      trigger(target, key);
    }

    return result;
  },
});
```

---

## 问题 4：完整的响应式流程

```javascript
// 1. 创建响应式对象
const state = reactive({ count: 0 });

// 2. 创建 effect
effect(() => {
  console.log(state.count);
});

// 执行流程：
// a. effect 执行，设置 activeEffect
// b. 访问 state.count，触发 get 拦截器
// c. track(state, 'count') 收集依赖
// d. effect 执行完毕，清除 activeEffect

// 3. 修改数据
state.count = 1;

// 执行流程：
// a. 触发 set 拦截器
// b. trigger(state, 'count') 派发更新
// c. 找到依赖 count 的 effect 并执行
// d. effect 重新执行，输出新值
```

### 依赖关系图

```
targetMap (WeakMap)
    └── state (对象) -> depsMap (Map)
                            └── 'count' (属性) -> dep (Set)
                                                    └── effect (函数)
```

---

## 问题 5：为什么使用 WeakMap？

```javascript
const targetMap = new WeakMap();

// WeakMap 的特点：
// 1. key 必须是对象
// 2. key 是弱引用，不阻止垃圾回收

let obj = { count: 0 };
const state = reactive(obj);

// 当 obj 不再被引用时
obj = null;
// targetMap 中对应的依赖关系会被自动清理
// 避免内存泄漏
```

---

## 问题 6：Vue 3 中的实际实现

Vue 3 的实际实现更复杂，包含更多优化：

```javascript
// 实际的 track 包含更多逻辑
export function track(target, type, key) {
  if (shouldTrack && activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep()));
    }
    trackEffects(dep);
  }
}

// 实际的 trigger 支持不同类型的操作
export function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  let deps = [];

  // 根据操作类型收集需要触发的 effects
  if (type === TriggerOpTypes.CLEAR) {
    deps = [...depsMap.values()];
  } else if (key === "length" && isArray(target)) {
    // 数组 length 变化的特殊处理
  } else {
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }
  }

  // 触发所有收集到的 effects
  triggerEffects(createDep(deps.flat()));
}
```

## 延伸阅读

- [Vue 官方文档 - 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [Vue 源码 - effect.ts](https://github.com/vuejs/core/blob/main/packages/reactivity/src/effect.ts)
