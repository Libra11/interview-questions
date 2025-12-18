---
title: JavaScript 事件循环深度解析
category: JavaScript
difficulty: 高级
updatedAt: 2025-01-09
summary: >-
  深入剖析 JavaScript 事件循环机制，掌握宏任务、微任务、调用栈的执行顺序，理解 Promise、async/await、setTimeout 的底层原理。
tags:
  - 事件循环
  - 异步编程
  - 执行机制
estimatedTime: 40 分钟
keywords:
  - Event Loop
  - 宏任务
  - 微任务
  - Promise
  - async/await
highlight: 掌握事件循环的执行顺序，理解宏任务与微任务的优先级，能够准确预测异步代码的执行结果
order: 109
---

## 问题 1：什么是事件循环（Event Loop）？为什么需要它？

**核心定义**

事件循环（Event Loop）是 JavaScript 实现**单线程异步编程**的核心机制。它负责协调**调用栈（Call Stack）**、**任务队列（Task Queue）** 和 **微任务队列（Microtask Queue）** 的执行顺序，确保 JavaScript 在单线程环境下能够处理异步操作而不阻塞主线程。

**为什么需要事件循环？**

JavaScript 是**单线程**语言，同一时间只能执行一个任务。如果没有事件循环：

```javascript
// ❌ 假设没有事件循环（同步阻塞）
console.log("开始");
const data = fetch("/api/data"); // 假设同步等待 3 秒
console.log(data); // 3 秒后才能执行
console.log("结束"); // 3 秒后才能执行

// 结果：页面冻结 3 秒，用户体验极差
```

**有了事件循环后**：

```javascript
// ✅ 实际执行（异步非阻塞）
console.log("开始"); // 1. 立即执行
fetch("/api/data") // 2. 发起异步请求，不阻塞
  .then((data) => console.log(data)); // 4. 请求完成后执行
console.log("结束"); // 3. 立即执行

// 结果：页面不冻结，用户体验流畅
```

**事件循环的基本流程**

```
┌─────────────────────────────────┐
│       调用栈 (Call Stack)        │
│  ┌───────────────────────────┐  │
│  │  console.log('start')     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│      Web APIs / Node APIs       │
│  ┌───────────────────────────┐  │
│  │  setTimeout, fetch,        │  │
│  │  DOM events, fs.readFile   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           ↓ (完成后)
┌─────────────────────────────────┐
│      任务队列 (Task Queue)       │
│  ┌───────────────────────────┐  │
│  │  宏任务队列 (Macrotasks)   │  │
│  │  setTimeout, setInterval  │  │
│  │  I/O 操作, UI 渲染        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│    微任务队列 (Microtasks)      │
│  ┌───────────────────────────┐  │
│  │  Promise.then/catch/finally│  │
│  │  queueMicrotask()          │  │
│  │  MutationObserver          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│        事件循环 (Event Loop)    │
│  1. 执行调用栈中的代码          │
│  2. 调用栈为空时，检查微任务队列 │
│  3. 执行所有微任务              │
│  4. 执行一个宏任务              │
│  5. 重复步骤 2-4                │
└─────────────────────────────────┘
```

---

## 问题 2：宏任务（Macrotask）和微任务（Microtask）有什么区别？

### 宏任务（Macrotask）

**定义**：由宿主环境（浏览器或 Node.js）提供的异步任务，每次事件循环只执行**一个**宏任务。

**常见的宏任务**：

```javascript
// 1. setTimeout / setInterval
setTimeout(() => {
  console.log("setTimeout");
}, 0);

// 2. I/O 操作（Node.js）
fs.readFile("file.txt", () => {
  console.log("I/O");
});

// 3. UI 渲染（浏览器）
// 浏览器会在宏任务之间进行页面渲染

// 4. setImmediate（Node.js）
setImmediate(() => {
  console.log("setImmediate");
});

// 5. MessageChannel（浏览器）
const channel = new MessageChannel();
channel.port1.onmessage = () => {
  console.log("MessageChannel");
};
```

### 微任务（Microtask）

**定义**：由 JavaScript 引擎提供的异步任务，每次事件循环会执行**所有**微任务，直到微任务队列为空。

**常见的微任务**：

```javascript
// 1. Promise.then / catch / finally
Promise.resolve().then(() => {
  console.log("Promise.then");
});

// 2. queueMicrotask()
queueMicrotask(() => {
  console.log("queueMicrotask");
});

// 3. MutationObserver（浏览器）
const observer = new MutationObserver(() => {
  console.log("MutationObserver");
});

// 4. async/await（本质是 Promise）
async function asyncFunc() {
  await Promise.resolve();
  console.log("async/await");
}
```

### 执行顺序对比

**核心规则**：

1. **同步代码** → **所有微任务** → **一个宏任务** → **所有微任务** → **一个宏任务** → ...

```javascript
console.log("1. 同步代码");

setTimeout(() => {
  console.log("2. 宏任务");
}, 0);

Promise.resolve().then(() => {
  console.log("3. 微任务");
});

console.log("4. 同步代码");

// 执行顺序：
// 1. 同步代码
// 4. 同步代码
// 3. 微任务（所有微任务先执行）
// 2. 宏任务（然后执行一个宏任务）
```

**复杂示例**：

```javascript
console.log("1. 同步");

setTimeout(() => {
  console.log("2. 宏任务 1");
  Promise.resolve().then(() => {
    console.log("3. 微任务（在宏任务中）");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("4. 微任务 1");
  Promise.resolve().then(() => {
    console.log("5. 微任务 2");
  });
});

setTimeout(() => {
  console.log("6. 宏任务 2");
}, 0);

console.log("7. 同步");

// 执行顺序：
// 1. 同步
// 7. 同步
// 4. 微任务 1（执行所有微任务）
// 5. 微任务 2（微任务中产生的微任务也会执行）
// 2. 宏任务 1（执行一个宏任务）
// 3. 微任务（在宏任务中）（宏任务执行后，再次执行所有微任务）
// 6. 宏任务 2（执行下一个宏任务）
```

### 为什么微任务优先级更高？

**设计原因**：

1. **保证 Promise 的一致性**：Promise 的状态变化应该立即被处理
2. **避免 UI 阻塞**：微任务在渲染前执行，保证 DOM 更新的及时性
3. **性能优化**：微任务队列通常更短，执行更快

```javascript
// 示例：Promise 状态变化应该立即处理
const promise = new Promise((resolve) => {
  console.log("Promise 创建");
  resolve("resolved");
});

promise.then((value) => {
  console.log(value); // 应该立即执行，而不是等待其他宏任务
});

console.log("同步代码");

// 输出：
// Promise 创建
// 同步代码
// resolved（微任务立即执行）
```

---

## 问题 3：Promise、async/await 的执行机制是什么？

### Promise 的执行机制

**Promise 的状态变化是同步的，但 then/catch 回调是异步的（微任务）**：

```javascript
console.log("1. 同步");

const promise = new Promise((resolve) => {
  console.log("2. Promise 构造函数（同步）");
  resolve("resolved");
  console.log("3. resolve 后（同步）");
});

promise.then((value) => {
  console.log("4. then 回调（微任务）", value);
});

console.log("5. 同步");

// 执行顺序：
// 1. 同步
// 2. Promise 构造函数（同步）
// 3. resolve 后（同步）
// 5. 同步
// 4. then 回调（微任务） resolved
```

**Promise 链式调用**：

```javascript
Promise.resolve()
  .then(() => {
    console.log("1. then 1");
    return Promise.resolve("value");
  })
  .then((value) => {
    console.log("2. then 2", value);
  })
  .then(() => {
    console.log("3. then 3");
  });

console.log("4. 同步");

// 执行顺序：
// 4. 同步
// 1. then 1
// 2. then 2 value
// 3. then 3
```

**Promise.all / Promise.race**：

```javascript
console.log("1. 同步");

Promise.all([
  Promise.resolve("A"),
  Promise.resolve("B"),
  Promise.resolve("C"),
]).then((values) => {
  console.log("2. Promise.all", values);
});

console.log("3. 同步");

// 执行顺序：
// 1. 同步
// 3. 同步
// 2. Promise.all ['A', 'B', 'C']
```

### async/await 的执行机制

**async 函数返回 Promise，await 会暂停函数执行，等待 Promise 解决**：

```javascript
async function asyncFunc() {
  console.log("1. async 函数开始");
  const result = await Promise.resolve("resolved");
  console.log("2. await 后", result);
  return "done";
}

console.log("3. 同步");

asyncFunc().then((value) => {
  console.log("4. async 函数返回", value);
});

console.log("5. 同步");

// 执行顺序：
// 3. 同步
// 1. async 函数开始
// 5. 同步
// 2. await 后 resolved
// 4. async 函数返回 done
```

**await 的本质**：

```javascript
// async/await 代码
async function example() {
  const result = await Promise.resolve("value");
  console.log(result);
}

// 等价于：
function example() {
  return Promise.resolve("value").then((result) => {
    console.log(result);
  });
}
```

**await 后的代码是微任务**：

```javascript
console.log("1. 同步");

async function asyncFunc() {
  console.log("2. async 函数");
  await Promise.resolve();
  console.log("3. await 后（微任务）");
}

asyncFunc();

Promise.resolve().then(() => {
  console.log("4. Promise.then（微任务）");
});

console.log("5. 同步");

// 执行顺序：
// 1. 同步
// 2. async 函数
// 5. 同步
// 3. await 后（微任务）
// 4. Promise.then（微任务）
// 注意：await 后的代码和 Promise.then 都是微任务，按顺序执行
```

**复杂的 async/await 示例**：

```javascript
async function async1() {
  console.log("1. async1 开始");
  await async2();
  console.log("2. async1 await 后");
}

async function async2() {
  console.log("3. async2");
}

console.log("4. 同步");

async1();

Promise.resolve().then(() => {
  console.log("5. Promise.then");
});

console.log("6. 同步");

// 执行顺序：
// 4. 同步
// 1. async1 开始
// 3. async2
// 6. 同步
// 2. async1 await 后（微任务）
// 5. Promise.then（微任务）
```

---

## 问题 4：setTimeout、setInterval 的执行时机是什么？

### setTimeout 的执行时机

**setTimeout 的最小延迟时间**：

```javascript
// 浏览器环境
setTimeout(() => {
  console.log("setTimeout");
}, 0);

// 实际延迟时间：
// - Chrome/Edge: 最少 4ms（HTML5 规范）
// - Firefox: 最少 4ms
// - Safari: 最少 4ms
// - Node.js: 最少 1ms（但实际可能更长）

// 注意：即使设置为 0，也不会立即执行，而是放入宏任务队列
```

**setTimeout 的执行流程**：

```javascript
console.log("1. 同步");

setTimeout(() => {
  console.log("2. setTimeout");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Promise.then");
});

console.log("4. 同步");

// 执行顺序：
// 1. 同步
// 4. 同步
// 3. Promise.then（微任务先执行）
// 2. setTimeout（宏任务后执行）
```

**嵌套的 setTimeout**：

```javascript
setTimeout(() => {
  console.log("1. setTimeout 1");
  setTimeout(() => {
    console.log("2. setTimeout 2");
  }, 0);
}, 0);

Promise.resolve().then(() => {
  console.log("3. Promise.then");
});

// 执行顺序：
// 3. Promise.then
// 1. setTimeout 1
// 2. setTimeout 2
```

### setInterval 的执行时机

**setInterval 的执行特点**：

```javascript
let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log("interval", count);
  if (count >= 3) {
    clearInterval(intervalId);
  }
}, 100);

// 注意：setInterval 的执行时间可能不准确
// 如果回调执行时间超过间隔时间，会连续执行
```

**setInterval 的问题**：

```javascript
// ❌ 问题：如果回调执行时间 > 间隔时间
setInterval(() => {
  // 假设这个函数执行需要 150ms
  console.log("执行中...");
}, 100);

// 结果：回调会连续执行，没有间隔

// ✅ 解决方案：使用递归的 setTimeout
function repeat() {
  console.log("执行中...");
  setTimeout(repeat, 100);
}
repeat();
```

### 实际应用场景

**防抖（Debounce）**：

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 使用
const debouncedSearch = debounce((query) => {
  console.log("搜索:", query);
}, 300);
```

**节流（Throttle）**：

```javascript
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// 使用
const throttledScroll = throttle(() => {
  console.log("滚动事件");
}, 100);
```

---

## 问题 5：浏览器和 Node.js 的事件循环有什么区别？


**浏览器特有的任务**：

```javascript
// 1. DOM 事件（宏任务）
button.addEventListener("click", () => {
  console.log("click");
});

// 2. UI 渲染（在宏任务之间）
requestAnimationFrame(() => {
  console.log("raf");
});

// 3. MutationObserver（微任务）
const observer = new MutationObserver(() => {
  console.log("mutation");
});
```

**浏览器执行顺序示例**：

```javascript
console.log("1. 同步");

setTimeout(() => {
  console.log("2. setTimeout");
}, 0);

Promise.resolve().then(() => {
  console.log("3. Promise.then");
});

requestAnimationFrame(() => {
  console.log("4. requestAnimationFrame");
});

console.log("5. 同步");

// 执行顺序（浏览器）：
// 1. 同步
// 5. 同步
// 3. Promise.then（微任务）
// 4. requestAnimationFrame（在渲染前）
// 2. setTimeout（宏任务）
// 2 / 4 → 二者之间的先后顺序 不要依赖，不同环境/时机可能反过来。
```

### Node.js 的事件循环

**Node.js 的事件循环阶段（6 个阶段）**：

```
┌─────────────────────────────────┐
│  1. timers（定时器阶段）          │
│     - setTimeout, setInterval   │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  2. pending callbacks           │
│     - 执行延迟的 I/O 回调        │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  3. idle, prepare               │
│     - 内部使用                  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  4. poll（轮询阶段）             │
│     - 获取新的 I/O 事件          │
│     - 执行 I/O 相关回调          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  5. check（检查阶段）            │
│     - setImmediate 回调          │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  6. close callbacks             │
│     - 关闭回调（如 socket.on）  │
└─────────────────────────────────┘
           ↓
    执行所有微任务
           ↓
        重复循环
```

**Node.js 特有的 API**：

```javascript
// 1. setImmediate（在 check 阶段执行）
setImmediate(() => {
  console.log("setImmediate");
});

// 2. process.nextTick（优先级最高，在事件循环之前执行）
process.nextTick(() => {
  console.log("nextTick");
});

// 3. I/O 操作（在 poll 阶段执行）
fs.readFile("file.txt", () => {
  console.log("I/O");
});
```

**Node.js 执行顺序示例**：

```javascript
console.log("1. 同步");

setTimeout(() => {
  console.log("2. setTimeout");
}, 0);

setImmediate(() => {
  console.log("3. setImmediate");
});

process.nextTick(() => {
  console.log("4. nextTick");
});

Promise.resolve().then(() => {
  console.log("5. Promise.then");
});

console.log("6. 同步");

// 执行顺序（Node.js）：
// 1. 同步
// 6. 同步
// 5. Promise.then（微任务）
// 4. nextTick（优先级最高）
// 2. setTimeout（timers 阶段）
// 3. setImmediate（check 阶段）

// 在 ES Module 中，Promise.then / queueMicrotask 会先于 process.nextTick 执行
// setTimeout(..., 0) 和 setImmediate(...) 的顺序，不是严格保证的。
// Node 官方文档原话大意是：
// 如果两者在主模块里一起调用，它们谁先执行是非确定性的，取决于当时进程性能等因素。

```

**process.nextTick vs setImmediate**：

```javascript
// process.nextTick：在当前阶段结束后、事件循环继续之前执行
process.nextTick(() => {
  console.log("nextTick");
});

// setImmediate：在 check 阶段执行
setImmediate(() => {
  console.log("setImmediate");
});

// 执行顺序：
// nextTick（先执行）
// setImmediate（后执行）
```

---

## 总结

**面试回答框架**

1. **事件循环的定义**：

   - JavaScript 单线程异步编程的核心机制
   - 协调调用栈、任务队列、微任务队列的执行顺序
   - 确保异步操作不阻塞主线程

2. **宏任务 vs 微任务**：

   - **宏任务**：setTimeout、setInterval、I/O 操作、UI 渲染
   - **微任务**：Promise.then、queueMicrotask、MutationObserver、async/await
   - **执行顺序**：同步 → 所有微任务 → 一个宏任务 → 所有微任务 → ...

3. **Promise 和 async/await**：

   - Promise 构造函数是同步的，then/catch 是异步的（微任务）
   - async 函数返回 Promise，await 会暂停函数执行
   - await 后的代码是微任务

4. **setTimeout 的执行时机**：

   - 即使延迟为 0，也不会立即执行
   - 放入宏任务队列，等待事件循环调度
   - 浏览器最小延迟 4ms，Node.js 最小 1ms

5. **浏览器 vs Node.js**：

   - **浏览器**：6 个阶段，UI 渲染在宏任务之间
   - **Node.js**：6 个阶段（timers、pending、idle、poll、check、close）
   - **process.nextTick**：Node.js 特有，优先级最高

6. **执行顺序预测**：

   - 同步代码 → process.nextTick（Node.js）→ 所有微任务 → 一个宏任务 → 所有微任务 → ...
   - 微任务队列必须清空后，才执行下一个宏任务
   - 微任务中产生的微任务也会立即执行

7. **实际应用**：
   - 优化大量 DOM 操作（分批处理）
   - 确保 DOM 更新后执行（Promise、MutationObserver）
   - 批量处理异步操作（Promise.all）
   - 实现任务调度器（控制执行顺序）

---

## 延伸阅读

- MDN：[并发模型与事件循环](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/EventLoop)
- Node.js 官方文档：[事件循环](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)
- 【练习】预测以下代码的执行顺序：

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
console.log("5");
```
