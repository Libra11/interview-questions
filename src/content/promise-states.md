---
title: Promise 的三种状态分别是什么，是怎么转换的，转换时机呢？
category: JavaScript
difficulty: 中级
updatedAt: 2025-01-09
summary: >-
  深入理解 Promise 的三种状态（pending、fulfilled、rejected）及其转换机制，掌握状态转换的时机和条件，理解 Promise 状态不可逆的特性。
tags:
  - Promise
  - 异步编程
  - 状态机
  - ES6
estimatedTime: 35 分钟
keywords:
  - Promise
  - pending
  - fulfilled
  - rejected
  - 状态转换
highlight: 理解 Promise 状态的一次性和不可逆性，掌握状态转换的时机和条件，避免常见的状态管理错误。
order: 30
---

## 问题 1：Promise 有哪三种状态？

**快速总结**

Promise 有三种状态：

1. **pending（等待中）**：初始状态，既不是成功也不是失败
2. **fulfilled（已成功）**：操作成功完成，也称为 resolved
3. **rejected（已失败）**：操作失败

```javascript
// 状态查看方式
const promise = new Promise((resolve, reject) => {
  // 此时状态是 pending
});

// 注意：无法直接访问 Promise 的状态
// 但可以通过 then/catch 来观察状态变化
```

**状态特点**：

- **单向转换**：状态只能从 pending → fulfilled 或 pending → rejected
- **不可逆**：一旦状态改变，就不能再变回 pending
- **不可取消**：状态改变后无法取消

---

## 问题 2：Promise 状态是如何转换的？

**状态转换图**

```
        pending（初始状态）
         /              \
        /                \
       /                  \
fulfilled（成功）    rejected（失败）
```

### 转换规则

```javascript
// 1. pending → fulfilled：调用 resolve()
const promise1 = new Promise((resolve, reject) => {
  resolve("success"); // 状态变为 fulfilled
});

// 2. pending → rejected：调用 reject()
const promise2 = new Promise((resolve, reject) => {
  reject("error"); // 状态变为 rejected
});

// 3. 状态一旦改变，无法再次改变
const promise3 = new Promise((resolve, reject) => {
  resolve("first"); // 状态变为 fulfilled
  resolve("second"); // ❌ 无效，状态已经是 fulfilled
  reject("error"); // ❌ 无效，状态已经是 fulfilled
});
```

### 状态转换的代码示例

```javascript
// 示例 1：同步 resolve
const promise1 = new Promise((resolve, reject) => {
  console.log("Promise 创建，状态：pending");
  resolve("立即成功");
  console.log("resolve 调用后，状态：fulfilled");
});

promise1.then((value) => {
  console.log("fulfilled 状态，值：", value);
});

// 输出：
// Promise 创建，状态：pending
// resolve 调用后，状态：fulfilled
// fulfilled 状态，值：立即成功

// 示例 2：异步 resolve
const promise2 = new Promise((resolve, reject) => {
  console.log("Promise 创建，状态：pending");
  setTimeout(() => {
    resolve("延迟成功");
    console.log("resolve 调用后，状态：fulfilled");
  }, 1000);
});

promise2.then((value) => {
  console.log("fulfilled 状态，值：", value);
});

// 输出：
// Promise 创建，状态：pending
// （1秒后）
// resolve 调用后，状态：fulfilled
// fulfilled 状态，值：延迟成功

// 示例 3：reject
const promise3 = new Promise((resolve, reject) => {
  console.log("Promise 创建，状态：pending");
  reject("失败");
  console.log("reject 调用后，状态：rejected");
});

promise3.catch((error) => {
  console.log("rejected 状态，错误：", error);
});

// 输出：
// Promise 创建，状态：pending
// reject 调用后，状态：rejected
// rejected 状态，错误：失败
```

---

## 问题 3：状态转换的时机是什么？

**转换时机：resolve 或 reject 被调用时**

### 同步转换

```javascript
// 同步 resolve：立即转换状态
const promise = new Promise((resolve, reject) => {
  resolve("立即成功"); // 状态立即变为 fulfilled
});

// 同步 reject：立即转换状态
const promise2 = new Promise((resolve, reject) => {
  reject("立即失败"); // 状态立即变为 rejected
});
```

### 异步转换

```javascript
// 异步 resolve：延迟转换状态
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("延迟成功"); // 1秒后状态变为 fulfilled
  }, 1000);
});

// 异步 reject：延迟转换状态
const promise2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject("延迟失败"); // 1秒后状态变为 rejected
  }, 1000);
});
```

### 条件转换

```javascript
// 根据条件决定状态转换
function fetchData(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("URL 不能为空")); // 立即转换为 rejected
      return;
    }

    fetch(url)
      .then((response) => {
        if (response.ok) {
          resolve(response.json()); // 成功时转换为 fulfilled
        } else {
          reject(new Error("请求失败")); // 失败时转换为 rejected
        }
      })
      .catch((error) => {
        reject(error); // 错误时转换为 rejected
      });
  });
}
```

### 状态转换时机总结

| 场景             | 转换时机       | 示例                                       |
| ---------------- | -------------- | ------------------------------------------ |
| **同步 resolve** | 立即转换       | `resolve('value')`                         |
| **同步 reject**  | 立即转换       | `reject('error')`                          |
| **异步 resolve** | 回调执行时转换 | `setTimeout(() => resolve('value'), 1000)` |
| **异步 reject**  | 回调执行时转换 | `setTimeout(() => reject('error'), 1000)`  |
| **条件转换**     | 条件满足时转换 | `if (condition) resolve() else reject()`   |

---

## 问题 4：状态转换后还能改变吗？

**答案：不能，Promise 状态具有不可逆性**

```javascript
// ❌ 错误示例：尝试多次改变状态
const promise = new Promise((resolve, reject) => {
  resolve("first"); // 状态变为 fulfilled
  resolve("second"); // ❌ 无效，状态已经是 fulfilled
  reject("error"); // ❌ 无效，状态已经是 fulfilled
});

promise.then((value) => {
  console.log(value); // 'first'（只有第一次有效）
});

// ✅ 正确理解：状态只能改变一次
const promise2 = new Promise((resolve, reject) => {
  // 状态：pending
  resolve("success");
  // 状态：fulfilled（已固定，无法再改变）
});
```

### 实际应用中的陷阱

```javascript
// 陷阱 1：在异步操作中多次调用 resolve/reject
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    // 第一次请求
    fetch(`/api/user/${id}`).then((response) => resolve(response.json()));

    // 第二次请求（错误：可能也会调用 resolve）
    fetch(`/api/user/${id}`).then((response) => resolve(response.json()));
    // ❌ 如果两个请求都成功，只有第一个 resolve 有效
  });
}

// ✅ 正确做法：确保只调用一次
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/user/${id}`)
      .then((response) => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(new Error("请求失败"));
        }
      })
      .catch((error) => reject(error));
  });
}

// 陷阱 2：在条件判断中可能多次调用
function processData(data) {
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error("数据为空"));
      // ⚠️ 注意：如果没有 return，会继续执行
    }

    // ❌ 如果没有 return，这里可能也会执行
    resolve(data);
  });
}

// ✅ 正确做法：使用 return 或 else
function processData(data) {
  return new Promise((resolve, reject) => {
    if (!data) {
      return reject(new Error("数据为空")); // 使用 return
    }

    resolve(data);
  });
}
```

---

## 问题 5：如何查看 Promise 的当前状态？

**注意：JavaScript 没有提供直接访问 Promise 状态的 API**

### 间接观察状态

```javascript
// 方法 1：通过 then/catch 观察状态
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("success"), 1000);
});

// 通过 then 观察 fulfilled 状态
promise.then((value) => {
  console.log("状态：fulfilled，值：", value);
});

// 通过 catch 观察 rejected 状态
promise.catch((error) => {
  console.log("状态：rejected，错误：", error);
});

// 方法 2：使用 Promise.race 检测状态
function checkPromiseState(promise) {
  return Promise.race([
    promise.then(() => "fulfilled"),
    promise.catch(() => "rejected"),
    Promise.resolve("pending"),
  ]);
}

const promise2 = new Promise((resolve) => {
  setTimeout(() => resolve("success"), 1000);
});

checkPromiseState(promise2).then((state) => {
  console.log("当前状态：", state);
  // 1秒前：'pending'
  // 1秒后：'fulfilled'
});
```

### 调试技巧

```javascript
// 创建一个可观察状态的 Promise 包装器
function createObservablePromise(executor) {
  let state = "pending";
  let value = undefined;
  let error = undefined;

  const promise = new Promise((resolve, reject) => {
    executor(
      (result) => {
        state = "fulfilled";
        value = result;
        resolve(result);
      },
      (err) => {
        state = "rejected";
        error = err;
        reject(err);
      }
    );
  });

  // 添加状态查询方法
  promise.getState = () => state;
  promise.getValue = () => value;
  promise.getError = () => error;

  return promise;
}

// 使用
const promise = createObservablePromise((resolve, reject) => {
  setTimeout(() => resolve("success"), 1000);
});

console.log(promise.getState()); // 'pending'

promise.then(() => {
  console.log(promise.getState()); // 'fulfilled'
  console.log(promise.getValue()); // 'success'
});
```

---

## 问题 6：Promise.resolve() 和 Promise.reject() 的状态是什么？

**Promise.resolve()：创建一个 fulfilled 状态的 Promise**

```javascript
// Promise.resolve() 立即创建 fulfilled 状态的 Promise
const promise1 = Promise.resolve("success");
// 状态：fulfilled（立即）

promise1.then((value) => {
  console.log(value); // 'success'
});

// 等价于
const promise2 = new Promise((resolve) => {
  resolve("success");
});
```

**Promise.reject()：创建一个 rejected 状态的 Promise**

```javascript
// Promise.reject() 立即创建 rejected 状态的 Promise
const promise1 = Promise.reject("error");
// 状态：rejected（立即）

promise1.catch((error) => {
  console.log(error); // 'error'
});

// 等价于
const promise2 = new Promise((resolve, reject) => {
  reject("error");
});
```

### 特殊情况

```javascript
// 如果传入的是 Promise，则返回该 Promise（不改变状态）
const existingPromise = new Promise((resolve) => {
  setTimeout(() => resolve("delayed"), 1000);
});

const wrapped = Promise.resolve(existingPromise);
// wrapped 和 existingPromise 是同一个 Promise
// 状态仍然是 pending（等待 1 秒后变为 fulfilled）

// 如果传入的是 thenable 对象，会调用其 then 方法
const thenable = {
  then: function (resolve, reject) {
    resolve("thenable result");
  },
};

Promise.resolve(thenable).then((value) => {
  console.log(value); // 'thenable result'
});
```

---

## 问题 7：状态转换与事件循环的关系是什么？

**Promise 状态转换是异步的，会进入微任务队列**

```javascript
console.log("1. 同步代码开始");

const promise = new Promise((resolve, reject) => {
  console.log("2. Promise 执行器执行");
  resolve("success");
  console.log("3. resolve 调用后");
});

console.log("4. Promise 创建完成");

promise.then((value) => {
  console.log("5. then 回调执行，值：", value);
});

console.log("6. 同步代码结束");

// 输出顺序：
// 1. 同步代码开始
// 2. Promise 执行器执行
// 3. resolve 调用后
// 4. Promise 创建完成
// 6. 同步代码结束
// 5. then 回调执行，值：success（微任务）
```

### 异步状态转换

```javascript
console.log("1. 开始");

const promise = new Promise((resolve, reject) => {
  console.log("2. Promise 执行器");
  setTimeout(() => {
    console.log("3. setTimeout 回调");
    resolve("success");
    console.log("4. resolve 调用");
  }, 0);
});

promise.then((value) => {
  console.log("5. then 回调，值：", value);
});

console.log("6. 结束");

// 输出顺序：
// 1. 开始
// 2. Promise 执行器
// 6. 结束
// 3. setTimeout 回调
// 4. resolve 调用
// 5. then 回调，值：success
```

### 状态转换时机总结

```javascript
// 情况 1：同步 resolve
const p1 = new Promise((resolve) => {
  resolve("sync"); // 立即转换状态
});
// 状态：fulfilled（立即）
// then 回调：进入微任务队列

// 情况 2：异步 resolve
const p2 = new Promise((resolve) => {
  setTimeout(() => {
    resolve("async"); // 延迟转换状态
  }, 1000);
});
// 状态：pending → fulfilled（1秒后）
// then 回调：状态转换后进入微任务队列

// 情况 3：Promise.resolve()
const p3 = Promise.resolve("immediate");
// 状态：fulfilled（立即）
// then 回调：进入微任务队列
```

---

## 问题 8：实际开发中的状态管理最佳实践

### 1. 确保只调用一次 resolve/reject

```javascript
// ✅ 正确：使用标志位
function fetchData(url) {
  let resolved = false;

  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!resolved) {
          resolved = true;
          resolve(response.json());
        }
      })
      .catch((error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });
  });
}

// ✅ 更简单：使用 Promise.race 或确保逻辑清晰
function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(new Error("请求失败"));
        }
      })
      .catch(reject); // 直接传递 reject
  });
}
```

### 2. 处理竞态条件

```javascript
// 场景：多个请求可能同时完成
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url).then((response) => response.json()),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("请求超时")), timeout);
    }),
  ]);
}

// 使用
fetchWithTimeout("/api/data")
  .then((data) => console.log("成功：", data))
  .catch((error) => console.log("失败：", error));
```

### 3. 状态转换的链式调用

```javascript
// Promise 链式调用中的状态转换
Promise.resolve("start")
  .then((value) => {
    console.log("1. fulfilled:", value); // 'start'
    return "step1";
  })
  .then((value) => {
    console.log("2. fulfilled:", value); // 'step1'
    throw new Error("error");
  })
  .catch((error) => {
    console.log("3. rejected:", error); // Error: error
    return "recovered";
  })
  .then((value) => {
    console.log("4. fulfilled:", value); // 'recovered'
  });

// 每个 then/catch 返回的 Promise 状态取决于：
// 1. 返回值：fulfilled
// 2. 抛出错误：rejected
// 3. 返回 Promise：跟随该 Promise 的状态
```

---

## 问题 9：常见错误和陷阱

### 错误 1：忘记调用 resolve/reject

```javascript
// ❌ 错误：Promise 永远处于 pending 状态
function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then((response) => {
      // 忘记调用 resolve
      console.log(response.json());
    });
  });
}

// ✅ 正确：确保调用 resolve/reject
function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        resolve(response.json()); // 调用 resolve
      })
      .catch(reject); // 调用 reject
  });
}
```

### 错误 2：在异步回调外调用 resolve/reject

```javascript
// ❌ 错误：resolve 在异步操作完成前调用
function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url);
    resolve("success"); // ❌ 在 fetch 完成前就 resolve
  });
}

// ✅ 正确：在异步回调内调用
function fetchData(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        resolve(response.json()); // ✅ 在回调内调用
      })
      .catch(reject);
  });
}
```

### 错误 3：多次调用 resolve/reject

```javascript
// ❌ 错误：可能多次调用 resolve
function processData(data) {
  return new Promise((resolve, reject) => {
    if (data.valid) {
      resolve("valid");
    }

    // 可能也会执行
    if (data.processed) {
      resolve("processed"); // ❌ 第二次调用无效
    }
  });
}

// ✅ 正确：使用 return 或 else
function processData(data) {
  return new Promise((resolve, reject) => {
    if (data.valid) {
      return resolve("valid"); // 使用 return
    }

    if (data.processed) {
      return resolve("processed");
    }

    reject(new Error("无效数据"));
  });
}
```

---

## 总结

### 核心要点

1. **三种状态**：pending（等待）、fulfilled（成功）、rejected（失败）
2. **状态转换**：只能从 pending → fulfilled 或 pending → rejected
3. **不可逆性**：状态一旦改变，无法再次改变
4. **转换时机**：调用 resolve() 或 reject() 时
5. **异步特性**：状态转换是异步的，then/catch 回调进入微任务队列

### 状态转换规则

| 操作                | 当前状态 | 转换后状态 | 时机                 |
| ------------------- | -------- | ---------- | -------------------- |
| `resolve(value)`    | pending  | fulfilled  | 立即或异步回调执行时 |
| `reject(error)`     | pending  | rejected   | 立即或异步回调执行时 |
| `Promise.resolve()` | -        | fulfilled  | 立即                 |
| `Promise.reject()`  | -        | rejected   | 立即                 |

### 最佳实践

1. **确保调用**：始终确保 resolve 或 reject 被调用
2. **只调用一次**：使用 return 或标志位避免多次调用
3. **错误处理**：使用 catch 处理 rejected 状态
4. **状态观察**：通过 then/catch 观察状态变化
5. **避免陷阱**：注意异步操作中的状态转换时机

### 推荐阅读

- [MDN: Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Promise A+ 规范](https://promisesaplus.com/)
- [ECMAScript Promise 规范](https://tc39.es/ecma262/#sec-promise-objects)
