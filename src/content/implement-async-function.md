---
title: 如何手写实现 async 函数？
category: JavaScript
difficulty: 高级
updatedAt: 2025-11-16
summary: >-
  深入理解 async/await 的实现原理，掌握 Generator 函数和自动执行器的使用，学习如何手写实现 async 函数，理解异步编程的本质。
tags:
  - async/await
  - Generator
  - Promise
  - 异步编程
estimatedTime: 28 分钟
keywords:
  - async
  - await
  - Generator
  - 自动执行器
  - 异步编程
highlight: async/await 本质上是 Generator 函数和自动执行器的语法糖，理解其原理有助于深入掌握异步编程
order: 126
---

## 问题 1：async/await 的本质是什么？

async/await 是 **Generator 函数和自动执行器的语法糖**。

### 基本概念

```javascript
// async 函数
async function fetchData() {
  const result = await fetch('https://api.example.com/data');
  const data = await result.json();
  return data;
}

// 等价的 Generator 函数
function* fetchDataGenerator() {
  const result = yield fetch('https://api.example.com/data');
  const data = yield result.json();
  return data;
}

// async 函数的特点：
// 1. 返回 Promise
// 2. await 后面通常是 Promise
// 3. await 会暂停函数执行，等待 Promise resolve
// 4. 自动处理错误（try/catch）

// 示例
async function example() {
  return 'hello'; // 自动包装成 Promise.resolve('hello')
}

example().then(value => {
  console.log(value); // 'hello'
});

// 等价于
function example() {
  return Promise.resolve('hello');
}
```

### async/await 与 Promise 的关系

```javascript
// 使用 Promise
function fetchUser() {
  return fetch('/api/user')
    .then(response => response.json())
    .then(user => {
      console.log(user);
      return user;
    })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

// 使用 async/await
async function fetchUser() {
  try {
    const response = await fetch('/api/user');
    const user = await response.json();
    console.log(user);
    return user;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// 两者完全等价，但 async/await 更易读
```

---

## 问题 2：如何用 Generator 实现 async 的基本功能？

Generator 函数可以**暂停和恢复执行**，是实现 async 的基础。

### Generator 基础

```javascript
// Generator 函数
function* gen() {
  console.log('开始');
  const a = yield 1;
  console.log('a:', a);
  const b = yield 2;
  console.log('b:', b);
  return 3;
}

// 手动执行
const g = gen();

console.log(g.next());     // { value: 1, done: false }
console.log(g.next('A'));  // { value: 2, done: false }
console.log(g.next('B'));  // { value: 3, done: true }

// 输出：
// 开始
// a: A
// b: B
```

### 使用 Generator 处理异步

```javascript
// 使用 Generator 处理 Promise
function* fetchData() {
  const response = yield fetch('https://api.example.com/user');
  const data = yield response.json();
  return data;
}

// 手动执行
const gen = fetchData();

gen.next().value
  .then(response => {
    return gen.next(response).value;
  })
  .then(data => {
    const result = gen.next(data);
    console.log(result.value);
  });

// 这样太繁琐，需要自动执行器
```

---

## 问题 3：如何实现 Generator 的自动执行器？

自动执行器可以**自动执行 Generator 函数**，处理 yield 后的 Promise。

### 基础自动执行器

```javascript
// 简单的自动执行器
function run(gen) {
  const g = gen();
  
  function next(data) {
    const result = g.next(data);
    
    // 如果执行完毕，返回
    if (result.done) {
      return result.value;
    }
    
    // 继续执行下一步
    result.value.then(data => {
      next(data);
    });
  }
  
  next();
}

// 使用
function* fetchData() {
  const response = yield fetch('https://api.example.com/user');
  const data = yield response.json();
  console.log(data);
  return data;
}

run(fetchData);
```

### 返回 Promise 的自动执行器

```javascript
// 返回 Promise 的自动执行器
function run(gen) {
  return new Promise((resolve, reject) => {
    const g = gen();
    
    function step(nextFn) {
      let next;
      
      try {
        next = nextFn();
      } catch (error) {
        return reject(error);
      }
      
      // 执行完毕
      if (next.done) {
        return resolve(next.value);
      }
      
      // 将 yield 的值转换为 Promise
      Promise.resolve(next.value)
        .then(
          value => step(() => g.next(value)),
          error => step(() => g.throw(error))
        );
    }
    
    step(() => g.next());
  });
}

// 使用
function* fetchData() {
  const response = yield fetch('https://api.example.com/user');
  const data = yield response.json();
  return data;
}

run(fetchData)
  .then(data => console.log('成功', data))
  .catch(error => console.error('失败', error));
```

### 支持错误处理的自动执行器

```javascript
// 完整的自动执行器
function asyncToGenerator(generatorFn) {
  return function(...args) {
    const gen = generatorFn.apply(this, args);
    
    return new Promise((resolve, reject) => {
      function step(key, arg) {
        let result;
        
        try {
          result = gen[key](arg);
        } catch (error) {
          return reject(error);
        }
        
        const { value, done } = result;
        
        if (done) {
          return resolve(value);
        }
        
        return Promise.resolve(value).then(
          val => step('next', val),
          err => step('throw', err)
        );
      }
      
      step('next');
    });
  };
}

// 使用
const fetchData = asyncToGenerator(function* () {
  try {
    const response = yield fetch('https://api.example.com/user');
    const data = yield response.json();
    return data;
  } catch (error) {
    console.error('错误', error);
    throw error;
  }
});

fetchData()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

---

## 问题 4：如何实现完整的 async 函数？

将 Generator 和自动执行器结合，实现**完整的 async 功能**。

### 基本实现

```javascript
// 实现 async 函数
function asyncFunction(generatorFn) {
  return function(...args) {
    const generator = generatorFn.apply(this, args);
    
    return new Promise((resolve, reject) => {
      function step(key, arg) {
        let result;
        
        try {
          result = generator[key](arg);
        } catch (error) {
          return reject(error);
        }
        
        const { value, done } = result;
        
        if (done) {
          return resolve(value);
        } else {
          return Promise.resolve(value).then(
            val => step('next', val),
            err => step('throw', err)
          );
        }
      }
      
      step('next');
    });
  };
}

// 测试
const myAsync = asyncFunction(function* (name) {
  const greeting = yield Promise.resolve('Hello');
  const message = yield Promise.resolve(`${greeting}, ${name}`);
  return message;
});

myAsync('Alice').then(result => {
  console.log(result); // 'Hello, Alice'
});
```

### 支持同步值的实现

```javascript
// 支持 yield 同步值
function asyncFunction(generatorFn) {
  return function(...args) {
    const generator = generatorFn.apply(this, args);
    
    return new Promise((resolve, reject) => {
      function step(key, arg) {
        let result;
        
        try {
          result = generator[key](arg);
        } catch (error) {
          return reject(error);
        }
        
        const { value, done } = result;
        
        if (done) {
          return resolve(value);
        }
        
        // 将值转换为 Promise，支持同步值
        Promise.resolve(value).then(
          val => step('next', val),
          err => step('throw', err)
        );
      }
      
      step('next');
    });
  };
}

// 测试：混合同步和异步
const myAsync = asyncFunction(function* () {
  const a = yield 1; // 同步值
  const b = yield Promise.resolve(2); // Promise
  const c = yield 3; // 同步值
  return a + b + c;
});

myAsync().then(result => {
  console.log(result); // 6
});
```

### Babel 转换后的代码

```javascript
// Babel 转换 async/await 的实现
function _asyncToGenerator(fn) {
  return function() {
    var self = this;
    var args = arguments;
    
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value);
      }
      
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err);
      }
      
      _next(undefined);
    });
  };
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

// 使用
var fetchData = _asyncToGenerator(function* () {
  var response = yield fetch('https://api.example.com/user');
  var data = yield response.json();
  return data;
});

fetchData().then(console.log);
```

---

## 问题 5：如何处理 async 函数中的错误？

async 函数的错误处理需要**正确传递和捕获**。

### 错误处理机制

```javascript
// 实现支持错误处理的 async
function asyncFunction(generatorFn) {
  return function(...args) {
    const generator = generatorFn.apply(this, args);
    
    return new Promise((resolve, reject) => {
      function step(key, arg) {
        let result;
        
        try {
          // 执行 generator 的 next 或 throw
          result = generator[key](arg);
        } catch (error) {
          // 同步错误直接 reject
          return reject(error);
        }
        
        const { value, done } = result;
        
        if (done) {
          return resolve(value);
        }
        
        // 异步错误通过 Promise.reject 传递
        Promise.resolve(value).then(
          val => step('next', val),
          err => step('throw', err) // 调用 generator.throw()
        );
      }
      
      step('next');
    });
  };
}

// 测试错误处理
const myAsync = asyncFunction(function* () {
  try {
    const data = yield Promise.reject(new Error('网络错误'));
    return data;
  } catch (error) {
    console.log('捕获到错误:', error.message);
    return 'fallback';
  }
});

myAsync().then(result => {
  console.log(result); // 'fallback'
});
```

### 多种错误场景

```javascript
// 测试各种错误场景
const asyncFn = asyncFunction(function* () {
  // 场景 1：Promise reject
  try {
    yield Promise.reject(new Error('Promise 错误'));
  } catch (error) {
    console.log('捕获 Promise 错误:', error.message);
  }
  
  // 场景 2：同步抛出错误
  try {
    yield (() => {
      throw new Error('同步错误');
    })();
  } catch (error) {
    console.log('捕获同步错误:', error.message);
  }
  
  // 场景 3：未捕获的错误
  yield Promise.reject(new Error('未捕获的错误'));
});

asyncFn().catch(error => {
  console.log('外部捕获:', error.message); // '未捕获的错误'
});
```

---

## 问题 6：async 函数的实际应用场景有哪些？

了解 async 函数的常见使用场景。

### 场景 1：串行异步操作

```javascript
// 使用 Generator 实现串行请求
const fetchUserData = asyncFunction(function* (userId) {
  // 1. 获取用户信息
  const user = yield fetch(`/api/users/${userId}`).then(r => r.json());
  
  // 2. 获取用户的文章
  const posts = yield fetch(`/api/users/${userId}/posts`).then(r => r.json());
  
  // 3. 获取用户的评论
  const comments = yield fetch(`/api/users/${userId}/comments`).then(r => r.json());
  
  return { user, posts, comments };
});

// 使用
fetchUserData(123).then(data => {
  console.log(data);
});

// 等价的 async/await
async function fetchUserData(userId) {
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  const posts = await fetch(`/api/users/${userId}/posts`).then(r => r.json());
  const comments = await fetch(`/api/users/${userId}/comments`).then(r => r.json());
  return { user, posts, comments };
}
```

### 场景 2：并行异步操作

```javascript
// 并行请求
const fetchAllData = asyncFunction(function* () {
  // 同时发起多个请求
  const [users, posts, comments] = yield Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  
  return { users, posts, comments };
});

fetchAllData().then(data => {
  console.log(data);
});
```

### 场景 3：条件异步操作

```javascript
// 根据条件执行不同的异步操作
const fetchData = asyncFunction(function* (type) {
  let data;
  
  if (type === 'user') {
    data = yield fetch('/api/users').then(r => r.json());
  } else if (type === 'post') {
    data = yield fetch('/api/posts').then(r => r.json());
  } else {
    data = yield Promise.resolve({ default: true });
  }
  
  return data;
});

fetchData('user').then(console.log);
```

### 场景 4：循环中的异步操作

```javascript
// 循环中的异步操作
const processItems = asyncFunction(function* (items) {
  const results = [];
  
  for (let item of items) {
    const result = yield fetch(`/api/process/${item}`).then(r => r.json());
    results.push(result);
  }
  
  return results;
});

processItems([1, 2, 3]).then(results => {
  console.log(results);
});

// 并行处理
const processItemsParallel = asyncFunction(function* (items) {
  const promises = items.map(item => 
    fetch(`/api/process/${item}`).then(r => r.json())
  );
  
  const results = yield Promise.all(promises);
  return results;
});
```

---

## 问题 7：async 函数的注意事项和最佳实践

使用 async 函数时需要注意的问题。

### 注意事项

```javascript
// 1. async 函数总是返回 Promise
const fn1 = asyncFunction(function* () {
  return 'hello';
});

fn1().then(value => {
  console.log(value); // 'hello'
});

// 2. await 只能在 async 函数内使用
// ❌ 错误
function normalFunction() {
  const data = await fetch('/api/data'); // SyntaxError
}

// ✅ 正确
const asyncFn = asyncFunction(function* () {
  const data = yield fetch('/api/data');
  return data;
});

// 3. 错误处理
// ❌ 不好：未捕获错误
const badAsync = asyncFunction(function* () {
  const data = yield fetch('/api/data');
  return data;
});

// ✅ 好：捕获错误
const goodAsync = asyncFunction(function* () {
  try {
    const data = yield fetch('/api/data');
    return data;
  } catch (error) {
    console.error('错误', error);
    return null;
  }
});

// 4. 避免不必要的 await
// ❌ 不好：不必要的 await
const bad = asyncFunction(function* () {
  return yield Promise.resolve('hello');
});

// ✅ 好：直接返回 Promise
const good = asyncFunction(function* () {
  return Promise.resolve('hello');
});
```

### 最佳实践

```javascript
// 1. 合理使用并行
// ❌ 串行（慢）
const serial = asyncFunction(function* () {
  const user = yield fetchUser();
  const posts = yield fetchPosts();
  return { user, posts };
});

// ✅ 并行（快）
const parallel = asyncFunction(function* () {
  const [user, posts] = yield Promise.all([
    fetchUser(),
    fetchPosts()
  ]);
  return { user, posts };
});

// 2. 错误处理
// ✅ 统一错误处理
const withErrorHandling = asyncFunction(function* () {
  try {
    const data = yield fetchData();
    return data;
  } catch (error) {
    console.error('错误', error);
    // 可以返回默认值或重新抛出
    throw error;
  }
});

// 3. 超时处理
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('超时')), ms);
  });
}

const withTimeout = asyncFunction(function* () {
  try {
    const data = yield Promise.race([
      fetchData(),
      timeout(5000)
    ]);
    return data;
  } catch (error) {
    console.error('请求超时或失败', error);
    throw error;
  }
});

// 4. 重试机制
function retry(fn, times = 3) {
  return asyncFunction(function* () {
    for (let i = 0; i < times; i++) {
      try {
        const result = yield fn();
        return result;
      } catch (error) {
        if (i === times - 1) {
          throw error;
        }
        console.log(`重试 ${i + 1}/${times}`);
      }
    }
  });
}

// 使用
const fetchWithRetry = retry(() => fetch('/api/data'));
fetchWithRetry().then(console.log);
```

### 对比原生 async/await

```javascript
// Generator + 自动执行器
const myAsync = asyncFunction(function* () {
  const data = yield fetch('/api/data');
  return data;
});

// 原生 async/await
async function nativeAsync() {
  const data = await fetch('/api/data');
  return data;
}

// 两者完全等价
// 原生 async/await 是语法糖，更简洁易读
// Generator + 自动执行器是底层实现原理
```

---

## 总结

**手写 async 函数的核心要点**：

### 1. 本质理解
- async/await 是 Generator + 自动执行器的语法糖
- Generator 提供暂停和恢复能力
- 自动执行器处理 Promise 和错误

### 2. 实现步骤
- 创建 Generator 函数
- 实现自动执行器
- 返回 Promise
- 处理 yield 的值

### 3. 核心功能
- 自动执行 Generator
- 将 yield 值转换为 Promise
- 处理 Promise 的 resolve 和 reject
- 支持错误传递（generator.throw）

### 4. 错误处理
- 同步错误：try/catch 捕获
- 异步错误：Promise.reject 传递
- 使用 generator.throw 传递错误

### 5. 实际应用
- 串行异步操作
- 并行异步操作
- 条件异步操作
- 循环中的异步操作

### 6. 最佳实践
- 合理使用并行提升性能
- 统一错误处理
- 添加超时机制
- 实现重试逻辑

### 7. 与原生对比
- 原生 async/await 更简洁
- Generator 实现是底层原理
- 理解原理有助于深入掌握

## 延伸阅读

- [MDN - async function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN - Generator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator)
- [ES6 Generator 函数](https://es6.ruanyifeng.com/#docs/generator)
- [async 函数实现原理](https://es6.ruanyifeng.com/#docs/async)
