---
title: Vue2 响应式实现的原理
category: Vue
difficulty: 中级
updatedAt: 2025-01-13
summary: >-
  深入理解 Vue2 响应式系统的核心原理，掌握 Object.defineProperty、依赖收集、派发更新的完整流程。
tags:
  - Vue2
  - 响应式
  - Object.defineProperty
  - 依赖收集
  - 观察者模式
estimatedTime: 30 分钟
keywords:
  - Vue2响应式
  - Object.defineProperty
  - 依赖收集
  - Watcher
  - Observer
highlight: 理解 Vue2 响应式系统的核心机制，掌握数据劫持和依赖收集的实现原理
order: 54
---

## 问题：Vue2 响应式实现的原理是什么？

**核心答案：Vue2 通过 `Object.defineProperty` 劫持数据的 getter/setter，结合观察者模式实现响应式**

### 响应式系统的三大核心

1. **数据劫持（Observer）**：使用 `Object.defineProperty` 监听数据变化
2. **依赖收集（Dep）**：收集依赖该数据的观察者
3. **派发更新（Watcher）**：数据变化时通知所有观察者更新

### 基本实现原理

#### 1. 数据劫持 - Observer

```javascript
class Observer {
  constructor(data) {
    this.walk(data);
  }

  walk(data) {
    Object.keys(data).forEach((key) => {
      this.defineReactive(data, key, data[key]);
    });
  }

  defineReactive(obj, key, val) {
    const dep = new Dep(); // 每个属性都有一个依赖收集器

    Object.defineProperty(obj, key, {
      get() {
        // 依赖收集：如果有 Watcher 正在读取，就收集它
        if (Dep.target) {
          dep.depend();
        }
        return val;
      },
      set(newVal) {
        if (newVal === val) return;
        val = newVal;
        // 派发更新：通知所有依赖这个数据的 Watcher
        dep.notify();
      },
    });
  }
}
```

#### 2. 依赖收集 - Dep

```javascript
class Dep {
  constructor() {
    this.subs = []; // 存储所有的 Watcher
  }

  // 收集依赖
  depend() {
    if (Dep.target) {
      this.subs.push(Dep.target);
    }
  }

  // 派发更新
  notify() {
    this.subs.forEach((watcher) => watcher.update());
  }
}

Dep.target = null; // 全局变量，指向当前正在计算的 Watcher
```

#### 3. 观察者 - Watcher

```javascript
class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm;
    this.exp = exp; // 表达式，如 'message'
    this.cb = cb; // 回调函数
    this.value = this.get(); // 初始化时触发依赖收集
  }

  get() {
    Dep.target = this; // 设置当前 Watcher
    const value = this.vm[this.exp]; // 触发 getter，进行依赖收集
    Dep.target = null; // 清空
    return value;
  }

  update() {
    const newValue = this.get();
    if (newValue !== this.value) {
      this.value = newValue;
      this.cb.call(this.vm, newValue); // 执行回调
    }
  }
}
```

### 完整工作流程

#### 1. 初始化阶段

```javascript
// 简化的 Vue 实例
class Vue {
  constructor(options) {
    this.$data = options.data;

    // 1. 数据劫持：为 data 中的每个属性设置 getter/setter
    new Observer(this.$data);

    // 2. 代理：让 vm.message 等价于 vm.$data.message
    this.proxy();

    // 3. 编译模板，创建 Watcher
    this.compile(options.template);
  }

  proxy() {
    Object.keys(this.$data).forEach((key) => {
      Object.defineProperty(this, key, {
        get() {
          return this.$data[key];
        },
        set(val) {
          this.$data[key] = val;
        },
      });
    });
  }
}
```

#### 2. 依赖收集过程

```javascript
// 当模板中使用 {{ message }} 时
// 1. 创建 Watcher
new Watcher(vm, "message", (newVal) => {
  // 更新 DOM
  updateDOM(newVal);
});

// 2. Watcher 初始化时会读取 vm.message
// 3. 触发 message 的 getter
// 4. getter 中调用 dep.depend() 收集当前 Watcher
// 5. message 属性的 dep.subs 中就包含了这个 Watcher
```

#### 3. 派发更新过程

```javascript
// 当执行 vm.message = 'new value' 时
// 1. 触发 message 的 setter
// 2. setter 中调用 dep.notify()
// 3. 遍历 dep.subs 中的所有 Watcher
// 4. 调用每个 Watcher 的 update() 方法
// 5. Watcher 执行回调函数，更新 DOM
```

### 核心特点和限制

#### 优点

- **精确的依赖追踪**：每个属性都有独立的依赖收集器
- **自动化**：无需手动声明依赖关系
- **高效**：只更新真正依赖数据的部分

#### 限制

- **无法监听数组索引变化**：`arr[0] = newVal` 不会触发更新
- **无法监听对象属性的添加/删除**：需要使用 `Vue.set/delete`
- **深度监听性能开销**：需要递归遍历所有属性

### 数组的特殊处理

```javascript
// Vue2 通过重写数组方法来监听数组变化
const arrayMethods = Object.create(Array.prototype);
["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].forEach(
  (method) => {
    arrayMethods[method] = function (...args) {
      const result = Array.prototype[method].apply(this, args);
      // 触发更新
      this.__ob__.dep.notify();
      return result;
    };
  }
);
```

### 总结

Vue2 响应式系统的核心是：

1. 使用 `Object.defineProperty` 劫持数据访问
2. 在 getter 中收集依赖（Watcher）
3. 在 setter 中派发更新
4. 通过观察者模式连接数据变化和视图更新

这套机制让 Vue2 能够精确地知道哪些数据被哪些地方使用，从而实现高效的响应式更新。
