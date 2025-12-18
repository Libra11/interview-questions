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
order: 177
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

## 问题 5：状态转换与事件循环的关系是什么？

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

### 推荐阅读

- [MDN: Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Promise A+ 规范](https://promisesaplus.com/)
- [ECMAScript Promise 规范](https://tc39.es/ecma262/#sec-promise-objects)
