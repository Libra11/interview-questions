---
title: 如何手动实现一个 Promise？
category: JavaScript
difficulty: 高级
updatedAt: 2025-11-16
summary: >-
  深入理解 Promise 的实现原理，掌握如何从零实现一个符合 Promises/A+ 规范的 Promise，包括核心方法和常用静态方法。
tags:
  - Promise
  - 异步编程
  - 手写实现
  - Promises/A+
estimatedTime: 30 分钟
keywords:
  - Promise 实现
  - then 方法
  - Promise.all
  - Promise.race
  - 异步编程
highlight: 实现 Promise 的核心是理解状态机制、then 链式调用和异步执行，掌握这些原理才能真正理解异步编程
order: 357
---

## 问题 1：Promise 的核心原理是什么？

Promise 本质上是一个**状态机**，通过状态转换和回调队列来管理异步操作。

### 三种状态

Promise 有三种互斥的状态，状态一旦改变就不可逆。

```javascript
// Promise 的三种状态
const PENDING = 'pending';     // 等待态（初始状态）
const FULFILLED = 'fulfilled'; // 成功态
const REJECTED = 'rejected';   // 失败态

// 状态转换规则：
// pending -> fulfilled（resolve）
// pending -> rejected（reject）
// 状态一旦改变，就不能再变
```

### 基本结构

```javascript
class MyPromise {
  constructor(executor) {
    this.state = PENDING;        // 当前状态
    this.value = undefined;      // 成功的值
    this.reason = undefined;     // 失败的原因
    this.onFulfilledCallbacks = []; // 成功回调队列
    this.onRejectedCallbacks = [];  // 失败回调队列
    
    // resolve 函数：将状态从 pending 变为 fulfilled
    const resolve = (value) => {
      if (this.state === PENDING) {
        this.state = FULFILLED;
        this.value = value;
        // 执行所有成功回调
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };
    
    // reject 函数：将状态从 pending 变为 rejected
    const reject = (reason) => {
      if (this.state === PENDING) {
        this.state = REJECTED;
        this.reason = reason;
        // 执行所有失败回调
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };
    
    // 立即执行 executor
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
}

// 使用示例
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
});
```

### 核心机制

```javascript
// Promise 的核心机制：
// 1. 状态管理：pending -> fulfilled/rejected
// 2. 值的传递：保存 resolve 的值或 reject 的原因
// 3. 回调队列：存储 then 注册的回调函数
// 4. 异步执行：回调函数需要异步执行

// 为什么需要回调队列？
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('结果');
  }, 1000);
});

// 可以多次调用 then，每次都要执行
promise.then(value => console.log('回调1:', value));
promise.then(value => console.log('回调2:', value));
promise.then(value => console.log('回调3:', value));

// 输出：
// 回调1: 结果
// 回调2: 结果
// 回调3: 结果
```

---

## 问题 2：如何实现 then 方法？

`then` 方法是 Promise 最核心的方法，需要处理多种情况。

### 基础实现

```javascript
class MyPromise {
  // ... constructor 代码
  
  then(onFulfilled, onRejected) {
    // 参数校验：确保是函数
    onFulfilled = typeof onFulfilled === 'function' 
      ? onFulfilled 
      : value => value; // 值穿透
    
    onRejected = typeof onRejected === 'function'
      ? onRejected
      : reason => { throw reason }; // 错误穿透
    
    // 根据当前状态执行不同逻辑
    if (this.state === FULFILLED) {
      // 状态已经是成功，直接执行成功回调
      onFulfilled(this.value);
    }
    
    if (this.state === REJECTED) {
      // 状态已经是失败，直接执行失败回调
      onRejected(this.reason);
    }
    
    if (this.state === PENDING) {
      // 状态还是等待，将回调存入队列
      this.onFulfilledCallbacks.push(() => {
        onFulfilled(this.value);
      });
      
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason);
      });
    }
  }
}

// 使用示例
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
});

promise.then(
  value => console.log('成功:', value),
  reason => console.log('失败:', reason)
);
```

### 支持链式调用

```javascript
class MyPromise {
  // ... constructor 代码
  
  then(onFulfilled, onRejected) {
    // 参数处理
    onFulfilled = typeof onFulfilled === 'function' 
      ? onFulfilled 
      : value => value;
    
    onRejected = typeof onRejected === 'function'
      ? onRejected
      : reason => { throw reason };
    
    // 返回新的 Promise，实现链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      
      if (this.state === FULFILLED) {
        // 使用 setTimeout 模拟异步（微任务）
        setTimeout(() => {
          try {
            // 执行回调，获取返回值
            const x = onFulfilled(this.value);
            // 处理返回值
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      
      if (this.state === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      
      if (this.state === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });
    
    return promise2;
  }
}

// 链式调用示例
new MyPromise((resolve) => {
  resolve(1);
})
  .then(value => {
    console.log(value); // 1
    return value + 1;
  })
  .then(value => {
    console.log(value); // 2
    return value + 1;
  })
  .then(value => {
    console.log(value); // 3
  });
```

### 处理返回值

```javascript
// resolvePromise 函数：处理 then 回调的返回值
function resolvePromise(promise2, x, resolve, reject) {
  // 1. 防止循环引用
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }
  
  // 2. 如果 x 是 Promise，采用其状态
  if (x instanceof MyPromise) {
    x.then(resolve, reject);
    return;
  }
  
  // 3. 如果 x 是对象或函数
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false; // 防止多次调用
    
    try {
      const then = x.then;
      
      if (typeof then === 'function') {
        // x 是 thenable 对象
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        // x 是普通对象
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    // 4. x 是普通值
    resolve(x);
  }
}

// 测试各种返回值
new MyPromise(resolve => resolve(1))
  .then(value => {
    return 2; // 返回普通值
  })
  .then(value => {
    console.log(value); // 2
    return new MyPromise(resolve => resolve(3)); // 返回 Promise
  })
  .then(value => {
    console.log(value); // 3
  });
```

---

## 问题 3：如何实现 catch 和 finally 方法？

`catch` 和 `finally` 是基于 `then` 方法的语法糖。

### catch 方法

```javascript
class MyPromise {
  // ... 其他代码
  
  // catch 就是 then 的简化版，只处理失败
  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

// 使用示例
new MyPromise((resolve, reject) => {
  reject('错误');
})
  .catch(error => {
    console.log('捕获错误:', error);
  });

// 等价于
new MyPromise((resolve, reject) => {
  reject('错误');
})
  .then(null, error => {
    console.log('捕获错误:', error);
  });
```

### finally 方法

```javascript
class MyPromise {
  // ... 其他代码
  
  // finally 无论成功失败都会执行
  finally(callback) {
    return this.then(
      // 成功时执行 callback，然后传递原值
      value => {
        return MyPromise.resolve(callback()).then(() => value);
      },
      // 失败时执行 callback，然后传递原因
      reason => {
        return MyPromise.resolve(callback()).then(() => {
          throw reason;
        });
      }
    );
  }
}

// 使用示例
new MyPromise((resolve, reject) => {
  resolve('成功');
})
  .finally(() => {
    console.log('清理工作'); // 无论成功失败都执行
  })
  .then(value => {
    console.log(value); // '成功'（值被传递下去）
  });

new MyPromise((resolve, reject) => {
  reject('失败');
})
  .finally(() => {
    console.log('清理工作'); // 无论成功失败都执行
  })
  .catch(error => {
    console.log(error); // '失败'（错误被传递下去）
  });
```

---

## 问题 4：如何实现 Promise.resolve 和 Promise.reject？

这两个静态方法用于快速创建已确定状态的 Promise。

### Promise.resolve

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：返回一个成功的 Promise
  static resolve(value) {
    // 如果是 Promise，直接返回
    if (value instanceof MyPromise) {
      return value;
    }
    
    // 如果是 thenable 对象，转换为 Promise
    if (value !== null && typeof value === 'object' && typeof value.then === 'function') {
      return new MyPromise((resolve, reject) => {
        value.then(resolve, reject);
      });
    }
    
    // 普通值，包装成 Promise
    return new MyPromise(resolve => {
      resolve(value);
    });
  }
}

// 使用示例
MyPromise.resolve(1).then(value => {
  console.log(value); // 1
});

MyPromise.resolve(new MyPromise(resolve => {
  resolve(2);
})).then(value => {
  console.log(value); // 2
});

MyPromise.resolve({
  then: (resolve) => resolve(3)
}).then(value => {
  console.log(value); // 3
});
```

### Promise.reject

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：返回一个失败的 Promise
  static reject(reason) {
    // 直接返回失败的 Promise，不做任何转换
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }
}

// 使用示例
MyPromise.reject('错误').catch(error => {
  console.log(error); // '错误'
});

// 注意：即使传入 Promise，也会被当作普通值
MyPromise.reject(new MyPromise(resolve => {
  resolve('成功');
})).catch(error => {
  console.log(error); // Promise 对象本身
});
```

---

## 问题 5：如何实现 Promise.all？

`Promise.all` 等待所有 Promise 都成功，或任一失败。

### 基础实现

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：所有 Promise 都成功才成功
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }
      
      const results = [];      // 存储结果
      let completedCount = 0;  // 已完成的数量
      const total = promises.length;
      
      // 空数组直接返回
      if (total === 0) {
        return resolve(results);
      }
      
      // 处理每个 Promise
      promises.forEach((promise, index) => {
        // 转换为 Promise（处理非 Promise 值）
        MyPromise.resolve(promise).then(
          value => {
            results[index] = value;  // 保持顺序
            completedCount++;
            
            // 所有都完成时 resolve
            if (completedCount === total) {
              resolve(results);
            }
          },
          reason => {
            // 任一失败就 reject
            reject(reason);
          }
        );
      });
    });
  }
}

// 使用示例
const p1 = MyPromise.resolve(1);
const p2 = new MyPromise(resolve => setTimeout(() => resolve(2), 100));
const p3 = MyPromise.resolve(3);

MyPromise.all([p1, p2, p3]).then(results => {
  console.log(results); // [1, 2, 3]（保持顺序）
});

// 任一失败就失败
const p4 = MyPromise.resolve(1);
const p5 = MyPromise.reject('错误');
const p6 = MyPromise.resolve(3);

MyPromise.all([p4, p5, p6]).catch(error => {
  console.log(error); // '错误'
});
```

### 处理边界情况

```javascript
// 测试各种情况
// 1. 空数组
MyPromise.all([]).then(results => {
  console.log(results); // []
});

// 2. 包含非 Promise 值
MyPromise.all([1, 2, 3]).then(results => {
  console.log(results); // [1, 2, 3]
});

// 3. 混合 Promise 和普通值
MyPromise.all([
  MyPromise.resolve(1),
  2,
  new MyPromise(resolve => setTimeout(() => resolve(3), 100))
]).then(results => {
  console.log(results); // [1, 2, 3]
});

// 4. 多个失败，只返回第一个失败
MyPromise.all([
  MyPromise.reject('错误1'),
  MyPromise.reject('错误2')
]).catch(error => {
  console.log(error); // '错误1'（第一个失败的）
});
```

---

## 问题 6：如何实现 Promise.race 和 Promise.allSettled？

这两个方法提供了不同的并发控制策略。

### Promise.race

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：返回最先完成的 Promise 的结果
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }
      
      // 空数组永远不会 resolve
      if (promises.length === 0) {
        return;
      }
      
      // 遍历所有 Promise
      promises.forEach(promise => {
        // 转换为 Promise
        MyPromise.resolve(promise).then(
          value => {
            resolve(value); // 第一个成功的
          },
          reason => {
            reject(reason); // 第一个失败的
          }
        );
      });
    });
  }
}

// 使用示例
const p1 = new MyPromise(resolve => setTimeout(() => resolve(1), 100));
const p2 = new MyPromise(resolve => setTimeout(() => resolve(2), 50));
const p3 = new MyPromise(resolve => setTimeout(() => resolve(3), 200));

MyPromise.race([p1, p2, p3]).then(value => {
  console.log(value); // 2（最快完成的）
});

// 应用场景：请求超时
function requestWithTimeout(promise, timeout) {
  const timeoutPromise = new MyPromise((resolve, reject) => {
    setTimeout(() => reject('超时'), timeout);
  });
  
  return MyPromise.race([promise, timeoutPromise]);
}

requestWithTimeout(
  fetch('/api/data'),
  5000
).catch(error => {
  console.log(error); // 如果 5 秒内没完成，输出 '超时'
});
```

### Promise.allSettled

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：等待所有 Promise 完成（无论成功失败）
  static allSettled(promises) {
    return new MyPromise((resolve) => {
      // 参数校验
      if (!Array.isArray(promises)) {
        return resolve([]);
      }
      
      const results = [];
      let completedCount = 0;
      const total = promises.length;
      
      // 空数组直接返回
      if (total === 0) {
        return resolve(results);
      }
      
      // 处理每个 Promise
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            // 成功：记录状态和值
            results[index] = {
              status: 'fulfilled',
              value: value
            };
            completedCount++;
            
            if (completedCount === total) {
              resolve(results);
            }
          },
          reason => {
            // 失败：记录状态和原因
            results[index] = {
              status: 'rejected',
              reason: reason
            };
            completedCount++;
            
            if (completedCount === total) {
              resolve(results);
            }
          }
        );
      });
    });
  }
}

// 使用示例
const p1 = MyPromise.resolve(1);
const p2 = MyPromise.reject('错误');
const p3 = MyPromise.resolve(3);

MyPromise.allSettled([p1, p2, p3]).then(results => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 1 },
  //   { status: 'rejected', reason: '错误' },
  //   { status: 'fulfilled', value: 3 }
  // ]
});

// 应用场景：批量操作，需要知道每个操作的结果
const tasks = [
  saveUser(user1),
  saveUser(user2),
  saveUser(user3)
];

MyPromise.allSettled(tasks).then(results => {
  const succeeded = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);
});
```

---

## 问题 7：如何实现 Promise.any 和其他实用方法？

这些方法提供了更多的并发控制选项。

### Promise.any

```javascript
class MyPromise {
  // ... 其他代码
  
  // 静态方法：任一成功就成功，全部失败才失败
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }
      
      const errors = [];
      let rejectedCount = 0;
      const total = promises.length;
      
      // 空数组直接 reject
      if (total === 0) {
        return reject(new AggregateError([], '所有 Promise 都失败'));
      }
      
      // 处理每个 Promise
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            // 任一成功就 resolve
            resolve(value);
          },
          reason => {
            errors[index] = reason;
            rejectedCount++;
            
            // 全部失败才 reject
            if (rejectedCount === total) {
              reject(new AggregateError(errors, '所有 Promise 都失败'));
            }
          }
        );
      });
    });
  }
}

// 使用示例
const p1 = MyPromise.reject('错误1');
const p2 = MyPromise.reject('错误2');
const p3 = MyPromise.resolve('成功');

MyPromise.any([p1, p2, p3]).then(value => {
  console.log(value); // '成功'（第一个成功的）
});

// 全部失败
MyPromise.any([
  MyPromise.reject('错误1'),
  MyPromise.reject('错误2')
]).catch(error => {
  console.log(error.errors); // ['错误1', '错误2']
});
```

### 实用的扩展方法

```javascript
class MyPromise {
  // ... 其他代码
  
  // 延迟执行
  static delay(ms, value) {
    return new MyPromise(resolve => {
      setTimeout(() => resolve(value), ms);
    });
  }
  
  // 重试机制
  static retry(fn, times = 3, delay = 1000) {
    return new MyPromise((resolve, reject) => {
      const attempt = (n) => {
        fn().then(resolve).catch(error => {
          if (n === 1) {
            reject(error);
          } else {
            console.log(`重试剩余次数: ${n - 1}`);
            setTimeout(() => attempt(n - 1), delay);
          }
        });
      };
      
      attempt(times);
    });
  }
  
  // 超时控制
  static timeout(promise, ms) {
    const timeoutPromise = new MyPromise((resolve, reject) => {
      setTimeout(() => reject(new Error('超时')), ms);
    });
    
    return MyPromise.race([promise, timeoutPromise]);
  }
}

// 使用示例
// 1. 延迟执行
MyPromise.delay(1000, '延迟结果').then(value => {
  console.log(value); // 1 秒后输出 '延迟结果'
});

// 2. 重试机制
let attemptCount = 0;
MyPromise.retry(() => {
  attemptCount++;
  console.log(`尝试第 ${attemptCount} 次`);
  
  if (attemptCount < 3) {
    return MyPromise.reject('失败');
  }
  return MyPromise.resolve('成功');
}, 3, 500).then(result => {
  console.log(result); // '成功'
});

// 3. 超时控制
const slowRequest = new MyPromise(resolve => {
  setTimeout(() => resolve('数据'), 3000);
});

MyPromise.timeout(slowRequest, 2000).catch(error => {
  console.log(error.message); // '超时'
});
```

---

## 总结

**手动实现 Promise 的核心要点**：

### 1. 核心原理
- **状态机**：pending、fulfilled、rejected 三种状态
- **状态转换**：只能从 pending 转换，且不可逆
- **回调队列**：存储 then 注册的回调函数
- **异步执行**：回调需要异步执行（微任务）

### 2. then 方法实现
- 返回新 Promise 实现链式调用
- 处理三种状态：fulfilled、rejected、pending
- 值穿透和错误穿透
- resolvePromise 处理各种返回值

### 3. 基础方法
- **catch**：then(null, onRejected) 的语法糖
- **finally**：无论成功失败都执行，且传递原值

### 4. 静态方法
- **resolve**：快速创建成功的 Promise
- **reject**：快速创建失败的 Promise
- **all**：所有成功才成功，保持顺序
- **race**：返回最先完成的结果
- **allSettled**：等待所有完成，返回所有状态
- **any**：任一成功就成功，全部失败才失败

### 5. 实现要点
- 状态只能改变一次
- 回调需要异步执行
- 支持值穿透
- 处理循环引用
- 兼容 thenable 对象

### 6. 实际应用
- 理解异步编程本质
- 掌握错误处理机制
- 实现并发控制
- 扩展实用方法（重试、超时等）

## 延伸阅读

- [Promises/A+ 规范](https://promisesaplus.com/)
- [MDN - Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Promise 实现原理](https://github.com/xieranmaya/blog/issues/3)
- [手写 Promise 完整版](https://juejin.cn/post/6945319439772434469)
- [深入理解 Promise](https://github.com/mqyqingfeng/Blog/issues/98)
