---
title: reactive 如何收集依赖？
category: Vue
difficulty: 高级
updatedAt: 2025-12-08
summary: >-
  深入理解 Vue3 reactive 的依赖收集机制和实现原理。
tags:
  - Vue
  - reactive
  - 依赖收集
  - Proxy
estimatedTime: 15 分钟
keywords:
  - 依赖收集
  - track
  - trigger
  - effect
highlight: reactive 通过 Proxy 的 get 拦截收集依赖，set 拦截触发更新。
order: 611
---

## 问题 1：核心数据结构

```javascript
// 全局依赖映射
// WeakMap<target, Map<key, Set<effect>>>
const targetMap = new WeakMap();

// 当前正在执行的 effect
let activeEffect = null;

// effect 栈，处理嵌套
const effectStack = [];
```

### 结构示意

```
targetMap (WeakMap)
    │
    └── target (原始对象)
            │
            └── depsMap (Map)
                    │
                    ├── 'name' → Set([effect1, effect2])
                    │
                    └── 'age' → Set([effect3])
```

---

## 问题 2：track - 依赖收集

```javascript
function track(target, key) {
  // 没有活跃的 effect，不需要收集
  if (!activeEffect) return;

  // 获取 target 的依赖映射
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 获取 key 的依赖集合
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 添加当前 effect 到依赖集合
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    // 双向记录：effect 也记录它依赖的 dep
    activeEffect.deps.push(dep);
  }
}
```

---

## 问题 3：trigger - 触发更新

```javascript
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (!dep) return;

  // 创建新 Set 避免无限循环
  const effectsToRun = new Set();

  dep.forEach((effect) => {
    // 避免自身触发自身
    if (effect !== activeEffect) {
      effectsToRun.add(effect);
    }
  });

  effectsToRun.forEach((effect) => {
    if (effect.scheduler) {
      // 有调度器，交给调度器处理
      effect.scheduler(effect);
    } else {
      // 直接执行
      effect.run();
    }
  });
}
```

---

## 问题 4：Proxy 拦截

```javascript
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key);

      const result = Reflect.get(target, key, receiver);

      // 深层响应式
      if (typeof result === "object" && result !== null) {
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
    },
  });
}
```

---

## 问题 5：effect 实现

```javascript
class ReactiveEffect {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.deps = []; // 记录依赖的 dep 集合
    this.active = true;
  }

  run() {
    if (!this.active) {
      return this.fn();
    }

    // 清理旧依赖
    cleanupEffect(this);

    // 设置当前 effect
    activeEffect = this;
    effectStack.push(this);

    // 执行函数，触发 get，收集依赖
    const result = this.fn();

    // 恢复
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];

    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  // 从所有 dep 中移除此 effect
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
```

---

## 问题 6：完整流程示例

```javascript
const state = reactive({ count: 0 });

// 创建 effect
effect(() => {
  console.log(state.count);
});

// 流程：
// 1. effect.run() 执行
// 2. activeEffect = effect
// 3. 执行 fn，访问 state.count
// 4. Proxy get 拦截，调用 track(state, 'count')
// 5. 将 effect 添加到 state.count 的依赖集合
// 6. 输出 0

state.count++;

// 流程：
// 1. Proxy set 拦截
// 2. 调用 trigger(state, 'count')
// 3. 找到 count 的依赖集合
// 4. 执行所有 effect
// 5. 输出 1
```

---

## 问题 7：嵌套 effect

```javascript
const state = reactive({ foo: 1, bar: 2 });

effect(() => {
  console.log("outer", state.foo);

  effect(() => {
    console.log("inner", state.bar);
  });
});

// 使用 effectStack 处理嵌套
// 内层 effect 执行完后，恢复外层 activeEffect
```

---

## 问题 8：避免无限循环

```javascript
const state = reactive({ count: 0 });

effect(() => {
  state.count++; // 读取又写入，可能无限循环
});

// 解决：trigger 时排除当前 activeEffect
function trigger(target, key) {
  dep.forEach((effect) => {
    if (effect !== activeEffect) {
      effectsToRun.add(effect);
    }
  });
}
```

## 延伸阅读

- [Vue 3 源码 - reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)
- [Vue 3 设计与实现](https://www.ituring.com.cn/book/2953)
