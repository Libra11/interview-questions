---
title: 什么是观察者模式？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入理解观察者模式的核心概念、实现原理和应用场景，掌握主题对象和观察者之间的依赖关系，理解与发布订阅模式的本质区别。
tags:
  - 设计模式
  - 观察者模式
  - 响应式编程
  - 依赖管理
estimatedTime: 23 分钟
keywords:
  - 观察者模式
  - Observer
  - Subject
  - 依赖收集
  - 响应式
highlight: 观察者模式定义对象间的一对多依赖关系，当主题状态改变时自动通知所有观察者
order: 109
---

## 问题 1：什么是观察者模式？

观察者模式定义了对象之间的**一对多依赖关系**，当一个对象（主题）的状态发生改变时，所有依赖它的对象（观察者）都会收到通知并自动更新。

### 生活中的例子

想象你订阅了一个 YouTube 频道。当 UP 主（主题）发布新视频时，所有订阅者（观察者）都会收到通知。UP 主知道有哪些订阅者，可以直接通知他们。

### 基本概念

观察者模式包含两个核心角色：

- **主题（Subject）**：维护观察者列表，提供添加、删除观察者的方法，状态改变时通知所有观察者
- **观察者（Observer）**：定义更新接口，当收到主题通知时更新自己

### 简单示例

```javascript
// 主题（被观察者）
class Subject {
  constructor() {
    this.observers = []; // 维护观察者列表
  }
  
  // 添加观察者
  attach(observer) {
    this.observers.push(observer);
  }
  
  // 移除观察者
  detach(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  // 通知所有观察者
  notify(data) {
    this.observers.forEach(observer => {
      observer.update(data); // 调用观察者的更新方法
    });
  }
}

// 观察者
class Observer {
  constructor(name) {
    this.name = name;
  }
  
  // 更新方法（必须实现）
  update(data) {
    console.log(`${this.name} 收到通知:`, data);
  }
}

// 使用
const subject = new Subject();
const observer1 = new Observer('观察者1');
const observer2 = new Observer('观察者2');

subject.attach(observer1);
subject.attach(observer2);

subject.notify('状态已更新');
// 输出：
// 观察者1 收到通知: 状态已更新
// 观察者2 收到通知: 状态已更新
```

---

## 问题 2：如何实现一个完整的观察者模式？

一个完整的观察者模式需要明确主题和观察者的职责，并提供灵活的管理机制。

### 完整实现

```javascript
// 主题类
class Subject {
  constructor() {
    this.observers = []; // 观察者列表
    this.state = null;   // 主题状态
  }
  
  // 获取状态
  getState() {
    return this.state;
  }
  
  // 设置状态（状态改变时通知观察者）
  setState(state) {
    this.state = state;
    this.notify(); // 自动通知
  }
  
  // 添加观察者
  attach(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }
  
  // 移除观察者
  detach(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  
  // 通知所有观察者
  notify() {
    this.observers.forEach(observer => {
      observer.update(this); // 传递主题对象
    });
  }
}

// 观察者类
class Observer {
  constructor(name) {
    this.name = name;
  }
  
  // 更新方法（接收主题对象）
  update(subject) {
    const state = subject.getState();
    console.log(`${this.name} 收到更新，新状态: ${state}`);
  }
}

// 使用示例
const subject = new Subject();
const observer1 = new Observer('观察者A');
const observer2 = new Observer('观察者B');

subject.attach(observer1);
subject.attach(observer2);

subject.setState('状态1');
// 输出：
// 观察者A 收到更新，新状态: 状态1
// 观察者B 收到更新，新状态: 状态1
```

### 具体观察者实现

```javascript
// 不同类型的观察者可以有不同的更新逻辑
class ChartObserver extends Observer {
  update(subject) {
    const state = subject.getState();
    console.log(`${this.name} 更新图表，数据: ${state}`);
    this.renderChart(state);
  }
  
  renderChart(data) {
    console.log('重新绘制图表...');
  }
}

class TableObserver extends Observer {
  update(subject) {
    const state = subject.getState();
    console.log(`${this.name} 更新表格，数据: ${state}`);
    this.renderTable(state);
  }
  
  renderTable(data) {
    console.log('重新渲染表格...');
  }
}

// 使用
const dataSubject = new Subject();
const chart = new ChartObserver('图表组件');
const table = new TableObserver('表格组件');

dataSubject.attach(chart);
dataSubject.attach(table);

dataSubject.setState([1, 2, 3, 4, 5]);
```

---

## 问题 3：观察者模式的核心特点是什么？

观察者模式的核心是**主题和观察者之间的直接依赖关系**。

### 主题知道观察者

```javascript
// 主题维护观察者列表，知道有哪些观察者
class WeatherStation {
  constructor() {
    this.observers = []; // 明确知道观察者
    this.temperature = 0;
  }
  
  attach(observer) {
    this.observers.push(observer);
    console.log(`添加了观察者: ${observer.constructor.name}`);
  }
  
  setTemperature(temp) {
    this.temperature = temp;
    // 主题直接调用观察者的方法
    this.observers.forEach(observer => {
      observer.update(this.temperature);
    });
  }
}

// 观察者必须实现 update 方法
class TemperatureDisplay {
  update(temperature) {
    console.log(`温度显示器: 当前温度 ${temperature}°C`);
  }
}

class TemperatureAlert {
  update(temperature) {
    if (temperature > 30) {
      console.log('警报: 温度过高！');
    }
  }
}

const station = new WeatherStation();
station.attach(new TemperatureDisplay());
station.attach(new TemperatureAlert());

station.setTemperature(35);
// 输出：
// 温度显示器: 当前温度 35°C
// 警报: 温度过高！
```

### 同步通知

```javascript
// 观察者模式是同步的，立即通知所有观察者
class SyncSubject {
  constructor() {
    this.observers = [];
  }
  
  attach(observer) {
    this.observers.push(observer);
  }
  
  notify(data) {
    console.log('开始通知...');
    
    // 同步执行，按顺序通知
    this.observers.forEach((observer, index) => {
      console.log(`通知第 ${index + 1} 个观察者`);
      observer.update(data);
    });
    
    console.log('通知完成');
  }
}
```

---

## 问题 4：观察者模式的实际应用场景有哪些？

观察者模式在前端开发中有很多实际应用。

### DOM 事件监听

```javascript
// DOM 事件就是观察者模式的典型应用
const button = document.querySelector('#myButton');

// 添加观察者（事件监听器）
button.addEventListener('click', function observer1() {
  console.log('观察者1: 按钮被点击');
});

button.addEventListener('click', function observer2() {
  console.log('观察者2: 按钮被点击');
});

// 当按钮被点击（主题状态改变），所有监听器（观察者）都会被通知
```

### 数据绑定

```javascript
// 简单的数据绑定实现
class DataModel {
  constructor() {
    this.observers = [];
    this.data = {};
  }
  
  addObserver(observer) {
    this.observers.push(observer);
  }
  
  set(key, value) {
    this.data[key] = value;
    // 通知所有观察者更新
    this.notifyObservers(key, value);
  }
  
  notifyObservers(key, value) {
    this.observers.forEach(observer => {
      observer.update(key, value);
    });
  }
}

// 视图观察者
class TextView {
  constructor(element) {
    this.element = element;
  }
  
  update(key, value) {
    this.element.textContent = `${key}: ${value}`;
  }
}
```

### 状态管理

```javascript
// 简单的状态管理器
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.observers = [];
  }
  
  subscribe(observer) {
    this.observers.push(observer);
    
    // 返回取消订阅函数
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    // 通知所有观察者
    this.observers.forEach(observer => {
      observer.update(this.state);
    });
  }
}
```

---

## 问题 5：观察者模式与发布订阅模式有什么区别？

这是一个常见的面试问题，两者虽然相似但有本质区别。

### 结构差异

```javascript
// 观察者模式：主题直接管理观察者
class Subject {
  constructor() {
    this.observers = []; // 主题直接持有观察者引用
  }
  
  attach(observer) {
    this.observers.push(observer);
  }
  
  notify() {
    // 主题直接调用观察者方法
    this.observers.forEach(obs => obs.update());
  }
}

// 发布订阅模式：通过事件中心解耦
class EventBus {
  constructor() {
    this.events = {}; // 事件中心管理订阅关系
  }
  
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}
```

### 核心区别

**依赖关系**：
- 观察者模式：主题和观察者相互知道
- 发布订阅模式：发布者和订阅者互不知道

**调用方式**：
- 观察者模式：主题直接调用观察者的方法
- 发布订阅模式：通过事件名间接调用

**灵活性**：
- 观察者模式：观察者需要实现特定接口
- 发布订阅模式：订阅者只需提供回调

---

## 问题 6：如何实现支持优先级的观察者模式？

在某些场景下，需要控制观察者的通知顺序。

### 优先级实现

```javascript
class PrioritySubject {
  constructor() {
    this.observers = [];
  }
  
  // 添加观察者（带优先级）
  attach(observer, priority = 0) {
    this.observers.push({ observer, priority });
    
    // 按优先级排序（数字越大优先级越高）
    this.observers.sort((a, b) => b.priority - a.priority);
  }
  
  notify(data) {
    // 按优先级顺序通知
    this.observers.forEach(({ observer }) => {
      observer.update(data);
    });
  }
}

// 使用
const subject = new PrioritySubject();

subject.attach({ update: (d) => console.log('低优先级:', d) }, 1);
subject.attach({ update: (d) => console.log('高优先级:', d) }, 10);
subject.attach({ update: (d) => console.log('中优先级:', d) }, 5);

subject.notify('测试');
// 输出：
// 高优先级: 测试
// 中优先级: 测试
// 低优先级: 测试
```

---

## 问题 7：使用观察者模式需要注意什么？

观察者模式虽然强大，但也有一些需要注意的地方。

### 避免内存泄漏

```javascript
// ❌ 问题：忘记移除观察者
class Component {
  constructor(subject) {
    subject.attach(this);
  }
  
  destroy() {
    // 忘记移除观察者，导致内存泄漏
  }
}

// ✅ 正确做法：及时移除观察者
class Component {
  constructor(subject) {
    this.subject = subject;
    subject.attach(this);
  }
  
  destroy() {
    this.subject.detach(this);
  }
}
```

### 避免循环通知

```javascript
// ✅ 解决方案：添加标志位防止循环
class SafeSubject {
  constructor() {
    this.observers = [];
    this.notifying = false;
  }
  
  setState(state) {
    this.state = state;
    if (!this.notifying) {
      this.notify();
    }
  }
  
  notify() {
    this.notifying = true;
    this.observers.forEach(obs => obs.update(this.state));
    this.notifying = false;
  }
}
```

---

## 总结

**观察者模式的核心要点**：

### 1. 基本概念
- 定义对象间的一对多依赖关系
- 主题维护观察者列表
- 状态改变时自动通知所有观察者

### 2. 核心特点
- 主题和观察者直接依赖
- 主题知道观察者的存在
- 同步通知机制
- 观察者需要实现特定接口

### 3. 实际应用
- DOM 事件监听
- 数据绑定
- 状态管理
- Vue 响应式系统

### 4. 与发布订阅模式的区别
- **观察者模式**：主题直接管理观察者，耦合度较高
- **发布订阅模式**：通过事件中心解耦，更灵活

### 5. 注意事项
- 及时移除观察者避免内存泄漏
- 防止循环通知
- 考虑通知顺序和优先级

## 延伸阅读

- [设计模式 - 观察者模式](https://refactoringguru.cn/design-patterns/observer)
- [Vue 响应式原理](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [MDN - EventTarget](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget)
- [JavaScript 设计模式](https://github.com/sohamkamani/javascript-design-patterns-for-humans)
