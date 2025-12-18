---
title: 什么是发布订阅模式？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解发布订阅模式的核心概念、实现原理和应用场景，掌握如何实现一个完整的事件系统，理解与观察者模式的区别。
tags:
  - 设计模式
  - 发布订阅
  - 事件系统
  - 解耦
estimatedTime: 25 分钟
keywords:
  - 发布订阅
  - EventEmitter
  - 事件总线
  - 观察者模式
  - 解耦
highlight: 发布订阅模式通过事件中心实现发布者和订阅者的解耦，是前端常用的设计模式
order: 346
---

## 问题 1：什么是发布订阅模式？

发布订阅模式是一种消息传递模式，**发布者发布消息，订阅者接收消息，两者通过事件中心进行通信，彼此不直接接触**。

### 生活中的例子

想象报纸订阅系统：报社（发布者）发布新闻，读者（订阅者）订阅报纸，邮局（事件中心）负责分发。读者不需要知道报社在哪里，报社也不需要知道读者是谁，邮局负责把报纸送到订阅的读者手中。

### 基本概念

发布订阅模式包含三个核心角色：

- **发布者（Publisher）**：发布消息/事件，不关心谁会接收
- **订阅者（Subscriber）**：订阅感兴趣的消息，接收并处理消息
- **事件中心（Event Channel）**：管理订阅关系，分发消息给订阅者

### 简单示例

```javascript
// 创建一个简单的事件中心
const eventBus = {
  events: {}, // 存储事件和对应的订阅者
  
  // 订阅事件
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  },
  
  // 发布事件
  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
};

// 订阅者 A 订阅 'news' 事件
eventBus.on('news', (data) => {
  console.log('订阅者 A 收到新闻:', data);
});

// 订阅者 B 也订阅 'news' 事件
eventBus.on('news', (data) => {
  console.log('订阅者 B 收到新闻:', data);
});

// 发布者发布 'news' 事件
eventBus.emit('news', '今天天气很好');
// 输出：
// 订阅者 A 收到新闻: 今天天气很好
// 订阅者 B 收到新闻: 今天天气很好
```

---

## 问题 2：如何实现一个完整的发布订阅系统？

一个完整的发布订阅系统需要支持订阅、取消订阅、发布、一次性订阅等功能。

### 基础实现

```javascript
class EventEmitter {
  constructor() {
    this.events = {}; // 存储事件：{ eventName: [callback1, callback2] }
  }
  
  // 订阅事件
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // 返回取消订阅的函数
    return () => this.off(eventName, callback);
  }
  
  // 取消订阅
  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (!callbacks) return;
    
    // 如果没有指定回调，移除该事件的所有订阅
    if (!callback) {
      delete this.events[eventName];
      return;
    }
    
    // 移除指定的回调
    this.events[eventName] = callbacks.filter(cb => cb !== callback);
  }
  
  // 发布事件
  emit(eventName, ...args) {
    const callbacks = this.events[eventName];
    if (!callbacks) return;
    
    // 执行所有订阅者的回调
    callbacks.forEach(callback => callback(...args));
  }
  
  // 一次性订阅（触发一次后自动取消）
  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper); // 执行后立即取消订阅
    };
    this.on(eventName, wrapper);
  }
}

// 使用示例
const emitter = new EventEmitter();

// 订阅
const unsubscribe = emitter.on('message', (msg) => {
  console.log('收到消息:', msg);
});

emitter.emit('message', 'Hello'); // 输出：收到消息: Hello

// 取消订阅
unsubscribe();
emitter.emit('message', 'World'); // 不输出
```

### 支持多个参数

```javascript
// 发布订阅可以传递多个参数
emitter.on('userLogin', (userId, userName, timestamp) => {
  console.log(`用户 ${userName}(${userId}) 在 ${timestamp} 登录`);
});

emitter.emit('userLogin', 123, 'Alice', Date.now());
```

### 一次性订阅示例

```javascript
// 只触发一次的订阅
emitter.once('init', () => {
  console.log('初始化完成');
});

emitter.emit('init'); // 输出：初始化完成
emitter.emit('init'); // 不输出（已自动取消订阅）
```

---

## 问题 3：发布订阅模式有什么优势？

发布订阅模式的核心优势是**解耦**，让代码更灵活、更易维护。

### 解耦发布者和订阅者

```javascript
// ❌ 没有发布订阅：紧耦合
class User {
  login() {
    console.log('用户登录');
    
    // 直接调用其他模块
    Analytics.track('login');
    Logger.log('user logged in');
    Notification.show('欢迎回来');
    // User 类需要知道所有依赖模块
  }
}

// ✅ 使用发布订阅：解耦
class User {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }
  
  login() {
    console.log('用户登录');
    // 只需要发布事件，不关心谁会处理
    this.eventBus.emit('user:login', { userId: 123 });
  }
}

// 各个模块独立订阅
eventBus.on('user:login', (data) => Analytics.track('login', data));
eventBus.on('user:login', (data) => Logger.log('user logged in', data));
eventBus.on('user:login', (data) => Notification.show('欢迎回来'));
```

### 动态添加和移除功能

```javascript
class FeatureToggle {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.features = {};
  }
  
  enable(featureName) {
    if (featureName === 'analytics') {
      // 动态启用分析功能
      this.features.analytics = this.eventBus.on('user:login', (data) => {
        console.log('发送分析数据:', data);
      });
    }
  }
  
  disable(featureName) {
    if (this.features[featureName]) {
      this.features[featureName](); // 调用取消订阅函数
      delete this.features[featureName];
    }
  }
}
```

### 一对多通信

```javascript
// 一个发布者可以通知多个订阅者
class DataStore {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.data = {};
  }
  
  update(key, value) {
    this.data[key] = value;
    this.eventBus.emit('data:update', { key, value });
  }
}

// 多个组件订阅同一个事件
class ComponentA {
  constructor(eventBus) {
    eventBus.on('data:update', (data) => {
      console.log('组件 A 收到更新:', data);
      this.render();
    });
  }
  render() { console.log('组件 A 重新渲染'); }
}

class ComponentB {
  constructor(eventBus) {
    eventBus.on('data:update', (data) => {
      console.log('组件 B 收到更新:', data);
      this.render();
    });
  }
  render() { console.log('组件 B 重新渲染'); }
}
```

---

## 问题 4：发布订阅模式的实际应用场景有哪些？

发布订阅模式在前端开发中有广泛的应用。

### 跨组件通信

```javascript
// 创建全局事件总线
const eventBus = new EventEmitter();

// 组件 A：发布消息
class ComponentA {
  sendMessage() {
    eventBus.emit('message', {
      from: 'ComponentA',
      text: 'Hello from A'
    });
  }
}

// 组件 B：接收消息（可能在完全不同的位置）
class ComponentB {
  constructor() {
    eventBus.on('message', (data) => {
      console.log(`收到来自 ${data.from} 的消息: ${data.text}`);
    });
  }
}
```

### 状态变化通知

```javascript
// 简单的状态管理
class Store {
  constructor() {
    this.state = {};
    this.eventBus = new EventEmitter();
  }
  
  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    
    // 通知所有订阅者状态已更新
    this.eventBus.emit('stateChange', {
      oldState,
      newState: this.state
    });
  }
  
  subscribe(callback) {
    return this.eventBus.on('stateChange', callback);
  }
}

// 使用
const store = new Store();
store.subscribe(({ oldState, newState }) => {
  console.log('状态更新:', oldState, '->', newState);
});

store.setState({ count: 1 });
```

### 插件系统

```javascript
// 可扩展的插件系统
class Application {
  constructor() {
    this.eventBus = new EventEmitter();
    this.plugins = [];
  }
  
  use(plugin) {
    plugin.install(this.eventBus);
    this.plugins.push(plugin);
  }
  
  start() {
    this.eventBus.emit('app:start');
  }
}

// 日志插件
const LoggerPlugin = {
  install(eventBus) {
    eventBus.on('app:start', () => {
      console.log('[Logger] 应用启动');
    });
  }
};

// 使用插件
const app = new Application();
app.use(LoggerPlugin);
app.start(); // 输出：[Logger] 应用启动
```

---

## 问题 5：发布订阅模式与观察者模式有什么区别？

虽然两者都是用于对象间通信的设计模式，但它们有重要的区别。

### 结构上的区别

```javascript
// 观察者模式：发布者直接维护订阅者列表
class Subject {
  constructor() {
    this.observers = []; // 直接维护观察者
  }
  
  attach(observer) {
    this.observers.push(observer);
  }
  
  notify(data) {
    this.observers.forEach(observer => {
      observer.update(data); // 直接调用观察者的方法
    });
  }
}

// 发布订阅模式：通过事件中心解耦
class EventBus {
  constructor() {
    this.events = {}; // 事件中心维护订阅关系
  }
  
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}
```

### 核心区别

**耦合程度**：
- 观察者模式：发布者和订阅者相互知道对方
- 发布订阅模式：发布者和订阅者完全解耦，通过事件中心通信

**灵活性**：
- 观察者模式：订阅者需要实现特定接口（如 update 方法）
- 发布订阅模式：订阅者只需要提供回调函数

**通信方式**：
- 观察者模式：同步通信，立即调用所有观察者
- 发布订阅模式：可以实现异步通信

---

## 问题 6：如何实现一个支持命名空间的事件系统？

在复杂应用中，支持命名空间可以更好地组织事件。

### 命名空间实现

```javascript
class NamespacedEventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }
  
  emit(eventName, data) {
    // 精确匹配
    if (this.events[eventName]) {
      this.events[eventName].forEach(cb => cb(data));
    }
    
    // 通配符匹配
    const [namespace] = eventName.split(':');
    const wildcardKey = `${namespace}:*`;
    if (this.events[wildcardKey]) {
      this.events[wildcardKey].forEach(cb => cb(data));
    }
  }
  
  offNamespace(namespace) {
    Object.keys(this.events).forEach(key => {
      if (key.startsWith(namespace + ':')) {
        delete this.events[key];
      }
    });
  }
}

// 使用示例
const emitter = new NamespacedEventEmitter();

emitter.on('user:login', (data) => {
  console.log('用户登录:', data);
});

// 订阅命名空间下的所有事件
emitter.on('user:*', (data) => {
  console.log('用户事件:', data);
});

emitter.emit('user:login', { userId: 123 });
```

---

## 问题 7：使用发布订阅模式需要注意什么？

虽然发布订阅模式很强大，但使用不当也会带来问题。

### 内存泄漏问题

```javascript
// ❌ 常见错误：忘记取消订阅
class Component {
  constructor(eventBus) {
    eventBus.on('data:update', (data) => {
      this.render(data);
    });
  }
  
  destroy() {
    // 忘记取消订阅，导致内存泄漏
  }
}

// ✅ 正确做法：记得取消订阅
class Component {
  constructor(eventBus) {
    this.unsubscribe = eventBus.on('data:update', (data) => {
      this.render(data);
    });
  }
  
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

### 事件命名规范

```javascript
// ❌ 不好的命名：容易冲突
eventBus.on('update', handler);
eventBus.on('change', handler);

// ✅ 好的命名：使用命名空间
eventBus.on('user:update', handler);
eventBus.on('data:change', handler);

// 或使用常量
const Events = {
  USER_UPDATE: 'user:update',
  DATA_CHANGE: 'data:change'
};

eventBus.on(Events.USER_UPDATE, handler);
```

### 避免循环依赖

```javascript
// ❌ 危险：可能导致无限循环
eventBus.on('eventA', () => {
  eventBus.emit('eventB');
});

eventBus.on('eventB', () => {
  eventBus.emit('eventA'); // 形成循环
});

// ✅ 解决方案：检测循环
class SafeEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.emitting = new Set();
  }
  
  emit(eventName, data) {
    if (this.emitting.has(eventName)) {
      console.warn(`检测到循环发布: ${eventName}`);
      return;
    }
    
    this.emitting.add(eventName);
    super.emit(eventName, data);
    this.emitting.delete(eventName);
  }
}
```

---

## 总结

**发布订阅模式的核心要点**：

### 1. 基本概念
- 发布者发布消息
- 订阅者接收消息
- 事件中心负责分发
- 发布者和订阅者解耦

### 2. 核心实现
- 维护事件和回调的映射关系
- 提供订阅、取消订阅、发布方法
- 支持一次性订阅
- 返回取消订阅函数方便清理

### 3. 主要优势
- 解耦发布者和订阅者
- 支持一对多通信
- 动态添加和移除功能
- 提高代码灵活性和可维护性

### 4. 应用场景
- 跨组件通信
- 状态变化通知
- 用户行为追踪
- 插件系统
- 事件驱动架构

### 5. 与观察者模式的区别
- **观察者模式**：发布者直接维护订阅者，耦合度高
- **发布订阅模式**：通过事件中心解耦，更灵活

### 6. 注意事项
- 及时取消订阅避免内存泄漏
- 使用命名空间规范事件名
- 避免循环依赖
- 添加调试功能便于排查问题

## 延伸阅读

- [MDN - EventTarget](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget)
- [Node.js - EventEmitter](https://nodejs.org/api/events.html)
- [设计模式 - 观察者模式](https://refactoringguru.cn/design-patterns/observer)
- [Vue - 事件总线](https://v2.cn.vuejs.org/v2/guide/components-edge-cases.html#%E4%BA%8B%E4%BB%B6%E6%80%BB%E7%BA%BF)
- [JavaScript 设计模式与开发实践](https://github.com/mqyqingfeng/Blog/issues/26)
