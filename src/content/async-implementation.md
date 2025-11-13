---
title: 异步编程的实现方式？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  全面掌握 JavaScript 异步编程的各种实现方式，从回调函数到 Promise、async/await，理解每种方式的优缺点和适用场景。
tags:
  - 异步编程
  - Promise
  - async/await
  - 回调函数
estimatedTime: 35 分钟
keywords:
  - 异步编程
  - 回调函数
  - Promise
  - async/await
  - 生成器
highlight: 掌握 JavaScript 异步编程的演进历程，理解各种实现方式的特点，能够选择合适的异步解决方案
order: 52
---

## 问题 1：异步编程的发展历程

**JavaScript 异步编程的演进**

JavaScript 异步编程经历了从回调函数到现代 async/await 的演进过程，每种方式都解决了前一种方式的一些问题。

### 发展时间线

```javascript
// 1. 回调函数 (Callbacks) - JavaScript 诞生之初
// 2. Promise - ES6 (2015)
// 3. Generator + co - ES6 (2015)
// 4. async/await - ES2017 (2017)
// 5. 现代异步模式 - 持续发展

// 同一个异步操作的不同实现方式对比
const url = "https://api.example.com/data";

// 方式1：回调函数
function fetchDataCallback(callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback(null, JSON.parse(xhr.responseText));
    } else {
      callback(new Error("Request failed"));
    }
  };
  xhr.onerror = () => callback(new Error("Network error"));
  xhr.send();
}

// 方式2：Promise
function fetchDataPromise() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Request failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
}

// 方式3：async/await
async function fetchDataAsync() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Request failed");
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}
```

---

## 问题 2：回调函数（Callbacks）

### 基本概念和使用

```javascript
// 回调函数的基本形式
function processData(data, callback) {
  // 模拟异步操作
  setTimeout(() => {
    const result = data.toUpperCase();
    callback(null, result); // 错误优先的回调模式
  }, 1000);
}

// 使用回调函数
processData("hello world", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Result:", result); // "HELLO WORLD"
  }
});

// 错误优先回调模式（Error-first callback）
function readFile(filename, callback) {
  // 模拟文件读取
  setTimeout(() => {
    if (filename === "nonexistent.txt") {
      callback(new Error("File not found"), null);
    } else {
      callback(null, "File content");
    }
  }, 500);
}

readFile("data.txt", (err, data) => {
  if (err) {
    console.error("读取失败:", err.message);
  } else {
    console.log("文件内容:", data);
  }
});
```

### 回调地狱问题

```javascript
// ❌ 回调地狱示例
function getUserData(userId, callback) {
  // 获取用户基本信息
  fetchUser(userId, (err, user) => {
    if (err) return callback(err);

    // 获取用户的订单
    fetchOrders(user.id, (err, orders) => {
      if (err) return callback(err);

      // 获取每个订单的详情
      fetchOrderDetails(orders[0].id, (err, details) => {
        if (err) return callback(err);

        // 获取订单的支付信息
        fetchPaymentInfo(details.paymentId, (err, payment) => {
          if (err) return callback(err);

          // 最终结果
          callback(null, {
            user,
            orders,
            details,
            payment,
          });
        });
      });
    });
  });
}

// ✅ 改进：拆分回调函数
function getUserData(userId, callback) {
  fetchUser(userId, (err, user) => {
    if (err) return callback(err);
    getUserOrders(user, callback);
  });
}

function getUserOrders(user, callback) {
  fetchOrders(user.id, (err, orders) => {
    if (err) return callback(err);
    getOrderDetails(user, orders, callback);
  });
}

function getOrderDetails(user, orders, callback) {
  fetchOrderDetails(orders[0].id, (err, details) => {
    if (err) return callback(err);
    getPaymentInfo(user, orders, details, callback);
  });
}

function getPaymentInfo(user, orders, details, callback) {
  fetchPaymentInfo(details.paymentId, (err, payment) => {
    if (err) return callback(err);
    callback(null, { user, orders, details, payment });
  });
}
```

### 回调函数的优缺点

```javascript
// ✅ 优点
// 1. 简单直观，容易理解
// 2. 性能开销小
// 3. 兼容性好，所有 JavaScript 环境都支持

// ❌ 缺点
// 1. 回调地狱，代码难以维护
// 2. 错误处理复杂
// 3. 无法使用 try/catch 捕获异步错误
// 4. 难以进行流程控制

// 错误处理的复杂性
function complexOperation(callback) {
  step1((err, result1) => {
    if (err) return callback(err);

    step2(result1, (err, result2) => {
      if (err) return callback(err);

      step3(result2, (err, result3) => {
        if (err) return callback(err);
        callback(null, result3);
      });
    });
  });
}

// 每一层都需要错误检查，代码冗余
```

---

## 问题 3：Promise

### Promise 基础

```javascript
// Promise 的基本结构
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = Math.random() > 0.5;
    if (success) {
      resolve("操作成功");
    } else {
      reject(new Error("操作失败"));
    }
  }, 1000);
});

// 使用 Promise
promise
  .then((result) => {
    console.log("成功:", result);
  })
  .catch((error) => {
    console.error("失败:", error.message);
  })
  .finally(() => {
    console.log("操作完成");
  });

// Promise 的三种状态
// pending（等待中）-> fulfilled（已成功）或 rejected（已失败）
```

### Promise 链式调用

```javascript
// 解决回调地狱：Promise 链
function getUserDataPromise(userId) {
  return fetchUser(userId)
    .then((user) => {
      return fetchOrders(user.id).then((orders) => ({ user, orders }));
    })
    .then(({ user, orders }) => {
      return fetchOrderDetails(orders[0].id).then((details) => ({
        user,
        orders,
        details,
      }));
    })
    .then(({ user, orders, details }) => {
      return fetchPaymentInfo(details.paymentId).then((payment) => ({
        user,
        orders,
        details,
        payment,
      }));
    });
}

// 更优雅的写法
function getUserDataPromiseClean(userId) {
  let userData = {};

  return fetchUser(userId)
    .then((user) => {
      userData.user = user;
      return fetchOrders(user.id);
    })
    .then((orders) => {
      userData.orders = orders;
      return fetchOrderDetails(orders[0].id);
    })
    .then((details) => {
      userData.details = details;
      return fetchPaymentInfo(details.paymentId);
    })
    .then((payment) => {
      userData.payment = payment;
      return userData;
    });
}

// 使用
getUserDataPromiseClean(123)
  .then((data) => console.log("用户数据:", data))
  .catch((error) => console.error("获取失败:", error));
```

### Promise 的静态方法

```javascript
// Promise.all - 并行执行，全部成功才成功
const promises = [
  fetch("/api/user/1"),
  fetch("/api/user/2"),
  fetch("/api/user/3"),
];

Promise.all(promises)
  .then((responses) => {
    console.log("所有请求完成:", responses);
  })
  .catch((error) => {
    console.error("有请求失败:", error);
  });

// Promise.allSettled - 并行执行，等待所有完成
Promise.allSettled(promises).then((results) => {
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`请求 ${index} 成功:`, result.value);
    } else {
      console.log(`请求 ${index} 失败:`, result.reason);
    }
  });
});

// Promise.race - 竞速，第一个完成的决定结果
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("超时")), 5000);
});

const dataPromise = fetch("/api/data");

Promise.race([dataPromise, timeoutPromise])
  .then((result) => console.log("获取到数据:", result))
  .catch((error) => console.error("请求失败或超时:", error));

// Promise.any - 第一个成功的决定结果
Promise.any([
  fetch("/api/server1/data"),
  fetch("/api/server2/data"),
  fetch("/api/server3/data"),
])
  .then((result) => console.log("从某个服务器获取到数据:", result))
  .catch((error) => console.error("所有服务器都失败了:", error));
```

### 手动实现简单的 Promise

```javascript
// 简化版 Promise 实现
class SimplePromise {
  constructor(executor) {
    this.state = "pending";
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === "pending") {
        this.state = "fulfilled";
        this.value = value;
        this.onFulfilledCallbacks.forEach((callback) => callback(value));
      }
    };

    const reject = (reason) => {
      if (this.state === "pending") {
        this.state = "rejected";
        this.reason = reason;
        this.onRejectedCallbacks.forEach((callback) => callback(reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new SimplePromise((resolve, reject) => {
      if (this.state === "fulfilled") {
        try {
          const result = onFulfilled ? onFulfilled(this.value) : this.value;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else if (this.state === "rejected") {
        try {
          const result = onRejected ? onRejected(this.reason) : this.reason;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        this.onFulfilledCallbacks.push((value) => {
          try {
            const result = onFulfilled ? onFulfilled(value) : value;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });

        this.onRejectedCallbacks.push((reason) => {
          try {
            const result = onRejected ? onRejected(reason) : reason;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

// 测试简化版 Promise
const simplePromise = new SimplePromise((resolve, reject) => {
  setTimeout(() => resolve("成功"), 1000);
});

simplePromise
  .then((result) => {
    console.log("结果:", result);
    return result + " 处理";
  })
  .then((result) => {
    console.log("最终结果:", result);
  })
  .catch((error) => {
    console.error("错误:", error);
  });
```

---

## 问题 4：Generator + co

### Generator 基础

```javascript
// Generator 函数基础
function* simpleGenerator() {
  console.log("开始执行");
  yield 1;
  console.log("继续执行");
  yield 2;
  console.log("即将结束");
  return 3;
}

const gen = simpleGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: true }

// 使用 Generator 处理异步操作
function* asyncGenerator() {
  try {
    const user = yield fetchUser(123);
    console.log("用户信息:", user);

    const orders = yield fetchOrders(user.id);
    console.log("订单信息:", orders);

    const details = yield fetchOrderDetails(orders[0].id);
    console.log("订单详情:", details);

    return { user, orders, details };
  } catch (error) {
    console.error("操作失败:", error);
  }
}
```

### co 库的实现原理

```javascript
// 简化版 co 实现
function co(generator) {
  return new Promise((resolve, reject) => {
    const gen = generator();

    function step(nextValue) {
      let result;

      try {
        result = gen.next(nextValue);
      } catch (error) {
        return reject(error);
      }

      if (result.done) {
        return resolve(result.value);
      }

      // 将 yield 的值转换为 Promise
      Promise.resolve(result.value)
        .then((value) => step(value))
        .catch((error) => {
          try {
            result = gen.throw(error);
            step(result.value);
          } catch (err) {
            reject(err);
          }
        });
    }

    step();
  });
}

// 使用 co
co(function* () {
  try {
    const user = yield fetchUser(123);
    const orders = yield fetchOrders(user.id);
    const details = yield fetchOrderDetails(orders[0].id);

    return { user, orders, details };
  } catch (error) {
    console.error("操作失败:", error);
  }
})
  .then((result) => console.log("最终结果:", result))
  .catch((error) => console.error("执行失败:", error));

// Generator 的并行处理
function* parallelGenerator() {
  // 并行执行多个异步操作
  const [user1, user2, user3] = yield [
    fetchUser(1),
    fetchUser(2),
    fetchUser(3),
  ];

  console.log("所有用户:", { user1, user2, user3 });
  return { user1, user2, user3 };
}

co(parallelGenerator).then((result) => console.log("并行结果:", result));
```

---

## 问题 5：async/await

### 基本使用

```javascript
// async/await 基础语法
async function fetchUserData(userId) {
  try {
    const user = await fetchUser(userId);
    const orders = await fetchOrders(user.id);
    const details = await fetchOrderDetails(orders[0].id);
    const payment = await fetchPaymentInfo(details.paymentId);

    return { user, orders, details, payment };
  } catch (error) {
    console.error("获取用户数据失败:", error);
    throw error;
  }
}

// 使用 async/await
async function main() {
  try {
    const userData = await fetchUserData(123);
    console.log("用户数据:", userData);
  } catch (error) {
    console.error("主函数错误:", error);
  }
}

main();

// async 函数总是返回 Promise
async function asyncFunction() {
  return "Hello World";
}

asyncFunction().then((result) => {
  console.log(result); // "Hello World"
});

// 等价于
function promiseFunction() {
  return Promise.resolve("Hello World");
}
```

### 并行处理

```javascript
// ❌ 串行执行（效率低）
async function serialExecution() {
  const user1 = await fetchUser(1); // 等待 1 秒
  const user2 = await fetchUser(2); // 再等待 1 秒
  const user3 = await fetchUser(3); // 再等待 1 秒

  return [user1, user2, user3]; // 总共 3 秒
}

// ✅ 并行执行（效率高）
async function parallelExecution() {
  const [user1, user2, user3] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
    fetchUser(3),
  ]);

  return [user1, user2, user3]; // 总共 1 秒
}

// ✅ 并行执行的另一种写法
async function parallelExecution2() {
  const promise1 = fetchUser(1);
  const promise2 = fetchUser(2);
  const promise3 = fetchUser(3);

  const user1 = await promise1;
  const user2 = await promise2;
  const user3 = await promise3;

  return [user1, user2, user3];
}

// 条件并行执行
async function conditionalParallel(userIds) {
  const promises = userIds.map((id) => fetchUser(id));
  const users = await Promise.all(promises);

  // 根据用户信息决定是否获取订单
  const orderPromises = users
    .filter((user) => user.hasOrders)
    .map((user) => fetchOrders(user.id));

  const orders = await Promise.all(orderPromises);

  return { users, orders };
}
```

### 错误处理

```javascript
// 多种错误处理方式
async function errorHandling() {
  // 方式1：try/catch
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error("操作失败:", error);
    return null;
  }
}

// 方式2：Promise 的 catch 方法
async function errorHandling2() {
  const result = await riskyOperation().catch((error) => {
    console.error("操作失败:", error);
    return null;
  });

  return result;
}

// 方式3：混合使用
async function errorHandling3() {
  try {
    const user = await fetchUser(123);

    // 对特定操作使用 catch
    const orders = await fetchOrders(user.id).catch((error) => {
      console.warn("获取订单失败，使用默认值:", error);
      return [];
    });

    return { user, orders };
  } catch (error) {
    console.error("获取用户失败:", error);
    throw error;
  }
}

// 批量错误处理
async function batchErrorHandling(userIds) {
  const results = await Promise.allSettled(userIds.map((id) => fetchUser(id)));

  const users = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      users.push(result.value);
    } else {
      errors.push({
        userId: userIds[index],
        error: result.reason,
      });
    }
  });

  return { users, errors };
}
```

---

## 问题 6：现代异步模式

### 异步迭代器

```javascript
// 异步迭代器
async function* asyncGenerator() {
  for (let i = 1; i <= 3; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    yield `数据 ${i}`;
  }
}

// 使用 for await...of
async function consumeAsyncGenerator() {
  for await (const data of asyncGenerator()) {
    console.log("接收到:", data);
  }
}

consumeAsyncGenerator();

// 实际应用：分页数据获取
async function* fetchAllPages(baseUrl) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}`);
    const data = await response.json();

    yield data.items;

    hasMore = data.hasMore;
    page++;
  }
}

// 使用
async function processAllData() {
  for await (const pageData of fetchAllPages("/api/users")) {
    console.log(`处理第 ${pageData.length} 条数据`);
    // 处理每页数据
  }
}
```

### 流式处理

```javascript
// 使用 ReadableStream 进行流式处理
async function streamProcessing() {
  const response = await fetch("/api/large-data");
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // 处理数据块
      console.log("接收到数据块:", value);
    }
  } finally {
    reader.releaseLock();
  }
}

// 自定义异步流
class AsyncDataStream {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  async *[Symbol.asyncIterator]() {
    for (const item of this.dataSource) {
      // 模拟异步处理
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield await this.processItem(item);
    }
  }

  async processItem(item) {
    // 异步处理单个项目
    return `处理后的 ${item}`;
  }
}

// 使用自定义异步流
async function useAsyncStream() {
  const stream = new AsyncDataStream([1, 2, 3, 4, 5]);

  for await (const processedItem of stream) {
    console.log(processedItem);
  }
}
```

### 异步队列和限流

```javascript
// 异步队列实现
class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
      });

      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// 使用异步队列
const queue = new AsyncQueue(3); // 最多并发 3 个任务

async function batchProcess(items) {
  const promises = items.map((item) => queue.add(() => processItem(item)));

  const results = await Promise.all(promises);
  return results;
}

// 限流装饰器
function rateLimit(fn, limit, interval) {
  const calls = [];

  return async function (...args) {
    const now = Date.now();

    // 清除过期的调用记录
    while (calls.length && calls[0] <= now - interval) {
      calls.shift();
    }

    if (calls.length >= limit) {
      const waitTime = calls[0] + interval - now;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.apply(this, args);
    }

    calls.push(now);
    return fn.apply(this, args);
  };
}

// 使用限流
const limitedFetch = rateLimit(fetch, 5, 1000); // 每秒最多 5 次请求
```

---

## 总结

**JavaScript 异步编程实现方式总结**：

### 1. 回调函数（Callbacks）

- **优点**：简单直观，兼容性好，性能开销小
- **缺点**：回调地狱，错误处理复杂，难以流程控制
- **适用场景**：简单的异步操作，需要兼容旧环境

### 2. Promise

- **优点**：解决回调地狱，链式调用，统一错误处理
- **缺点**：仍有一定的嵌套，学习成本相对较高
- **适用场景**：复杂的异步流程，需要并行处理多个异步操作

### 3. Generator + co

- **优点**：同步风格的异步代码，强大的流程控制
- **缺点**：需要额外的库支持，语法相对复杂
- **适用场景**：复杂的异步流程控制，需要暂停和恢复执行

### 4. async/await

- **优点**：最接近同步代码的写法，错误处理简单，可读性最好
- **缺点**：需要 ES2017+ 支持，容易忘记并行处理
- **适用场景**：现代项目的首选，复杂异步逻辑的处理

### 5. 现代异步模式

- **异步迭代器**：处理异步数据流
- **流式处理**：处理大量数据
- **异步队列**：控制并发和限流

### 6. 选择建议

- **新项目**：优先使用 async/await
- **兼容性要求**：使用 Promise 或回调函数
- **复杂流程控制**：考虑 Generator 或异步迭代器
- **性能敏感**：根据具体场景选择合适的并行处理方式

### 7. 最佳实践

- 合理使用并行处理提高性能
- 统一错误处理策略
- 避免过度嵌套
- 考虑异步操作的取消和超时
- 使用工具库简化复杂的异步逻辑

理解这些异步编程方式的特点和适用场景，能够帮助开发者在不同情况下选择最合适的解决方案，写出更高效、更可维护的异步代码。
