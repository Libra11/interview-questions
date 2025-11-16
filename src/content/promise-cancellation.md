---
title: Promise 是否可以取消？
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-16
summary: >-
  深入探讨 Promise 的取消机制，理解为什么原生 Promise 不支持取消，以及如何通过各种方案实现 Promise 的取消功能，包括取消令牌、竞态模式、AbortController 等实践方法。
tags:
  - Promise
  - 异步编程
  - 取消机制
  - AbortController
estimatedTime: 26 分钟
keywords:
  - Promise
  - 取消
  - AbortController
  - 取消令牌
  - 异步控制
highlight: 原生 Promise 不支持取消，但可以通过取消令牌、竞态模式等方案实现取消效果
order: 104
---

## 问题 1：Promise 本身是否支持取消？

**答案是：原生 Promise 不支持取消。**

一旦 Promise 被创建并开始执行，就无法从外部中止它的执行。这是 Promise 设计上的一个特点，也是一个经常被讨论的限制。

### 为什么 Promise 不支持取消？

```javascript
// Promise 一旦创建就会立即执行
const promise = new Promise((resolve, reject) => {
  console.log('Promise 开始执行'); // 立即输出
  
  setTimeout(() => {
    resolve('完成');
  }, 3000);
});

// 无法取消这个 Promise
// promise.cancel(); // ❌ 不存在这样的方法

console.log('Promise 已创建');

// 输出：
// Promise 开始执行
// Promise 已创建
// （3秒后）完成
```

### Promise 的状态不可逆

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
});

// Promise 的三个状态：pending -> fulfilled/rejected
// 一旦状态改变，就不可逆转

promise.then(result => {
  console.log(result); // '成功'
});

// 即使你不想要这个结果，Promise 仍然会执行完成
```

### 设计理念

Promise 不支持取消的原因：

- **状态确定性**：Promise 代表一个最终会完成的操作，状态应该是确定的
- **简单性**：取消机制会增加 Promise 的复杂度
- **组合性**：多个 Promise 组合时，取消语义会变得复杂
- **一致性**：避免出现"半取消"状态导致的不一致

---

## 问题 2：如何实现 Promise 的"取消"效果？

虽然不能真正取消 Promise，但可以**忽略其结果**，实现类似取消的效果。最常见的方法是使用**取消标志**。

### 使用取消标志

```javascript
// 创建一个可取消的 Promise 包装器
function createCancellablePromise(promiseFunc) {
  let cancelled = false; // 取消标志
  
  const promise = new Promise((resolve, reject) => {
    promiseFunc()
      .then(result => {
        // 检查是否已取消
        if (!cancelled) {
          resolve(result);
        }
      })
      .catch(error => {
        if (!cancelled) {
          reject(error);
        }
      });
  });
  
  return {
    promise,
    cancel: () => {
      cancelled = true; // 设置取消标志
    }
  };
}

// 使用示例
const { promise, cancel } = createCancellablePromise(() => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('异步操作完成'); // 仍然会执行
      resolve('结果');
    }, 2000);
  });
});

promise.then(result => {
  console.log('收到结果:', result); // 不会执行
});

// 1秒后取消
setTimeout(() => {
  cancel();
  console.log('已取消');
}, 1000);

// 输出：
// 已取消
// 异步操作完成（仍然执行，但结果被忽略）
```

### 使用竞态模式

```javascript
// 利用 Promise.race 实现取消
function cancellablePromise(promise) {
  let cancelReject;
  
  // 创建一个永远不会 resolve 的 Promise
  const cancelPromise = new Promise((_, reject) => {
    cancelReject = reject;
  });
  
  return {
    promise: Promise.race([promise, cancelPromise]),
    cancel: () => {
      cancelReject(new Error('Promise 已取消'));
    }
  };
}

// 使用示例
const originalPromise = new Promise(resolve => {
  setTimeout(() => {
    console.log('原始操作完成');
    resolve('成功');
  }, 3000);
});

const { promise, cancel } = cancellablePromise(originalPromise);

promise
  .then(result => console.log('结果:', result))
  .catch(error => console.log('错误:', error.message));

// 1秒后取消
setTimeout(() => {
  cancel();
}, 1000);

// 输出：
// 错误: Promise 已取消
// 原始操作完成（仍然执行）
```

### 关键点

- **不是真正的取消**：底层的异步操作仍在执行
- **忽略结果**：只是不处理 Promise 的结果
- **避免副作用**：如果操作有副作用（如修改数据），仍会发生

---

## 问题 3：如何使用 AbortController 取消 Promise？

`AbortController` 是现代浏览器提供的标准 API，专门用于取消异步操作，特别是 `fetch` 请求。

### AbortController 基本用法

```javascript
// 创建 AbortController 实例
const controller = new AbortController();
const signal = controller.signal;

// 使用 signal 发起请求
fetch('https://api.example.com/data', { signal })
  .then(response => response.json())
  .then(data => console.log('数据:', data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      console.log('其他错误:', error);
    }
  });

// 取消请求
setTimeout(() => {
  controller.abort(); // 触发取消
}, 1000);
```

### 封装支持 AbortController 的 Promise

```javascript
// 创建支持取消的延迟函数
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve(`等待了 ${ms}ms`);
    }, ms);
    
    // 监听取消信号
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId); // 清除定时器
        reject(new Error('操作已取消'));
      });
    }
  });
}

// 使用示例
const controller = new AbortController();

delay(3000, controller.signal)
  .then(result => console.log(result))
  .catch(error => console.log('错误:', error.message));

// 1秒后取消
setTimeout(() => {
  controller.abort();
  console.log('已发送取消信号');
}, 1000);

// 输出：
// 已发送取消信号
// 错误: 操作已取消
```

### 处理多个操作的取消

```javascript
// 一个 AbortController 可以控制多个操作
async function fetchMultipleData(signal) {
  try {
    // 所有请求共享同一个 signal
    const [users, posts, comments] = await Promise.all([
      fetch('/api/users', { signal }),
      fetch('/api/posts', { signal }),
      fetch('/api/comments', { signal })
    ]);
    
    return {
      users: await users.json(),
      posts: await posts.json(),
      comments: await comments.json()
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('所有请求已取消');
    }
    throw error;
  }
}

const controller = new AbortController();

fetchMultipleData(controller.signal)
  .then(data => console.log('数据:', data))
  .catch(error => console.log('错误:', error.message));

// 取消所有请求
controller.abort();
```

---

## 问题 4：如何实现一个取消令牌（Cancel Token）模式？

取消令牌是一种常见的取消模式，被 Axios 等库采用。它提供了更灵活的取消控制。

### 基本的取消令牌实现

```javascript
// 取消令牌类
class CancelToken {
  constructor() {
    this.cancelled = false;
    this.reason = null;
    this.listeners = []; // 取消监听器列表
  }
  
  // 取消操作
  cancel(reason = '操作已取消') {
    if (this.cancelled) return; // 避免重复取消
    
    this.cancelled = true;
    this.reason = reason;
    
    // 通知所有监听器
    this.listeners.forEach(listener => listener(reason));
  }
  
  // 注册取消监听器
  onCancel(callback) {
    if (this.cancelled) {
      // 如果已经取消，立即执行回调
      callback(this.reason);
    } else {
      this.listeners.push(callback);
    }
  }
  
  // 检查是否已取消
  throwIfCancelled() {
    if (this.cancelled) {
      throw new Error(this.reason);
    }
  }
}

// 使用示例
function fetchData(url, cancelToken) {
  return new Promise((resolve, reject) => {
    // 注册取消监听
    cancelToken.onCancel(reason => {
      reject(new Error(reason));
    });
    
    // 模拟异步操作
    setTimeout(() => {
      // 执行前检查是否已取消
      cancelToken.throwIfCancelled();
      resolve(`数据来自 ${url}`);
    }, 2000);
  });
}

// 创建取消令牌
const token = new CancelToken();

fetchData('https://api.example.com', token)
  .then(data => console.log(data))
  .catch(error => console.log('错误:', error.message));

// 1秒后取消
setTimeout(() => {
  token.cancel('用户取消了请求');
}, 1000);

// 输出：
// 错误: 用户取消了请求
```

### 支持取消源的实现

```javascript
// 取消令牌源 - 类似 Axios 的 CancelToken.source()
class CancelTokenSource {
  constructor() {
    this.token = new CancelToken();
  }
  
  cancel(reason) {
    this.token.cancel(reason);
  }
}

// 工厂方法
CancelToken.source = function() {
  return new CancelTokenSource();
};

// 使用示例
const source = CancelToken.source();

fetchData('https://api.example.com', source.token)
  .then(data => console.log(data))
  .catch(error => console.log('错误:', error.message));

// 取消请求
source.cancel('不再需要这个数据');
```

### 在异步流程中使用取消令牌

```javascript
// 支持取消的异步流程
async function processData(cancelToken) {
  try {
    // 步骤 1：获取用户信息
    cancelToken.throwIfCancelled();
    const user = await fetchUser(cancelToken);
    console.log('获取用户:', user);
    
    // 步骤 2：获取用户的文章
    cancelToken.throwIfCancelled();
    const posts = await fetchPosts(user.id, cancelToken);
    console.log('获取文章:', posts.length, '篇');
    
    // 步骤 3：获取评论
    cancelToken.throwIfCancelled();
    const comments = await fetchComments(posts[0].id, cancelToken);
    console.log('获取评论:', comments.length, '条');
    
    return { user, posts, comments };
  } catch (error) {
    console.log('流程中断:', error.message);
    throw error;
  }
}

const source = CancelToken.source();

processData(source.token)
  .then(result => console.log('完成:', result))
  .catch(() => console.log('已取消'));

// 在某个步骤执行时取消
setTimeout(() => {
  source.cancel('用户离开了页面');
}, 1500);
```

---

## 问题 5：如何处理取消后的清理工作？

取消 Promise 后，通常需要进行资源清理，如取消定时器、关闭连接、清除缓存等。

### 使用 finally 进行清理

```javascript
function createCancellableTask(cancelToken) {
  let timerId = null;
  let resource = null;
  
  const promise = new Promise((resolve, reject) => {
    // 分配资源
    resource = { name: '重要资源' };
    console.log('资源已分配:', resource.name);
    
    // 注册取消监听
    cancelToken.onCancel(reason => {
      if (timerId) {
        clearTimeout(timerId);
      }
      reject(new Error(reason));
    });
    
    // 异步操作
    timerId = setTimeout(() => {
      resolve('任务完成');
    }, 3000);
  });
  
  // 使用 finally 确保清理
  return promise.finally(() => {
    console.log('清理资源:', resource?.name);
    resource = null;
    timerId = null;
  });
}

const token = new CancelToken();

createCancellableTask(token)
  .then(result => console.log(result))
  .catch(error => console.log('错误:', error.message));

setTimeout(() => {
  token.cancel('任务被取消');
}, 1000);

// 输出：
// 资源已分配: 重要资源
// 错误: 任务被取消
// 清理资源: 重要资源
```

### 实现清理回调机制

```javascript
class CancellablePromise {
  constructor(executor, cancelToken) {
    this.cleanupCallbacks = []; // 清理回调列表
    
    this.promise = new Promise((resolve, reject) => {
      // 注册取消监听
      cancelToken.onCancel(reason => {
        this.cleanup(); // 执行清理
        reject(new Error(reason));
      });
      
      // 执行器，提供清理注册方法
      executor(resolve, reject, (cleanupFn) => {
        this.cleanupCallbacks.push(cleanupFn);
      });
    });
  }
  
  cleanup() {
    console.log('执行清理，共', this.cleanupCallbacks.length, '个回调');
    this.cleanupCallbacks.forEach(fn => fn());
    this.cleanupCallbacks = [];
  }
  
  then(...args) {
    return this.promise.then(...args);
  }
  
  catch(...args) {
    return this.promise.catch(...args);
  }
}

// 使用示例
const token = new CancelToken();

new CancellablePromise((resolve, reject, onCleanup) => {
  // 注册清理回调
  const timerId = setTimeout(() => {
    resolve('完成');
  }, 3000);
  
  onCleanup(() => {
    console.log('清除定时器');
    clearTimeout(timerId);
  });
  
  const interval = setInterval(() => {
    console.log('轮询中...');
  }, 500);
  
  onCleanup(() => {
    console.log('清除轮询');
    clearInterval(interval);
  });
  
}, token)
  .then(result => console.log(result))
  .catch(error => console.log('错误:', error.message));

setTimeout(() => {
  token.cancel('停止任务');
}, 2000);

// 输出：
// 轮询中...
// 轮询中...
// 轮询中...
// 执行清理，共 2 个回调
// 清除定时器
// 清除轮询
// 错误: 停止任务
```

---

## 问题 6：实际应用中如何优雅地处理 Promise 取消？

在实际开发中，需要考虑组件卸载、路由切换、用户操作等场景下的 Promise 取消。

### React 组件中的取消处理

```javascript
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // 创建 AbortController
    const controller = new AbortController();
    
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal
        });
        const data = await response.json();
        setUser(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('获取用户失败:', error);
        }
        // AbortError 不需要处理，组件已卸载
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
    
    // 清理函数：组件卸载时取消请求
    return () => {
      controller.abort();
    };
  }, [userId]); // userId 变化时，会取消旧请求
  
  if (loading) return <div>加载中...</div>;
  return <div>{user?.name}</div>;
}
```

### 防止过期的异步结果更新状态

```javascript
// 使用版本号或时间戳标记请求
function SearchComponent() {
  const [results, setResults] = useState([]);
  const [searchId, setSearchId] = useState(0);
  
  async function handleSearch(query) {
    const currentSearchId = searchId + 1;
    setSearchId(currentSearchId);
    
    try {
      const data = await searchAPI(query);
      
      // 只有最新的搜索结果才更新状态
      if (currentSearchId === searchId) {
        setResults(data);
      } else {
        console.log('忽略过期的搜索结果');
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }
  
  return (
    <input 
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### 使用自定义 Hook 管理取消

```javascript
// 自定义 Hook：自动管理 AbortController
function useCancellablePromise() {
  const controllerRef = useRef(null);
  
  useEffect(() => {
    // 创建 controller
    controllerRef.current = new AbortController();
    
    // 组件卸载时取消
    return () => {
      controllerRef.current?.abort();
    };
  }, []);
  
  const cancellableFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: controllerRef.current?.signal
    });
  }, []);
  
  return cancellableFetch;
}

// 使用
function DataComponent() {
  const cancellableFetch = useCancellablePromise();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    cancellableFetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });
  }, [cancellableFetch]);
  
  return <div>{JSON.stringify(data)}</div>;
}
```

---

## 问题 7：Promise 取消的最佳实践有哪些？

在使用 Promise 取消时，需要遵循一些最佳实践，避免常见的陷阱。

### 最佳实践 1：明确区分取消和错误

```javascript
// 定义专门的取消错误类
class CancellationError extends Error {
  constructor(message = '操作已取消') {
    super(message);
    this.name = 'CancellationError';
    this.isCancellation = true;
  }
}

// 在错误处理中区分取消和真正的错误
async function fetchData(url, signal) {
  try {
    const response = await fetch(url, { signal });
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new CancellationError();
    }
    throw error; // 其他错误继续抛出
  }
}

// 使用时区分处理
fetchData('/api/data', controller.signal)
  .then(data => console.log('数据:', data))
  .catch(error => {
    if (error.isCancellation) {
      console.log('请求被取消，这是正常的');
      // 不需要显示错误提示
    } else {
      console.error('发生错误:', error);
      // 显示错误提示给用户
    }
  });
```

### 最佳实践 2：避免内存泄漏

```javascript
// ❌ 错误：没有清理监听器
class BadCancelToken {
  constructor() {
    this.listeners = [];
  }
  
  onCancel(callback) {
    this.listeners.push(callback);
    // 没有提供移除监听器的方法
  }
}

// ✅ 正确：提供清理机制
class GoodCancelToken {
  constructor() {
    this.listeners = new Set();
  }
  
  onCancel(callback) {
    this.listeners.add(callback);
    
    // 返回清理函数
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  cancel(reason) {
    this.listeners.forEach(listener => listener(reason));
    this.listeners.clear(); // 清理所有监听器
  }
}

// 使用
const token = new GoodCancelToken();
const unsubscribe = token.onCancel(() => {
  console.log('取消了');
});

// 不再需要时移除监听
unsubscribe();
```

### 最佳实践 3：合理的取消粒度

```javascript
// ❌ 粒度过粗：一个 controller 控制整个应用
const globalController = new AbortController();

// ✅ 粒度适中：每个独立功能使用独立的 controller
function UserDashboard() {
  // 用户信息请求
  const userController = new AbortController();
  
  // 文章列表请求
  const postsController = new AbortController();
  
  // 可以独立取消
  function cancelUserFetch() {
    userController.abort();
  }
  
  function cancelPostsFetch() {
    postsController.abort();
  }
}
```

### 最佳实践 4：提供取消反馈

```javascript
// 给用户明确的取消反馈
async function uploadFile(file, onProgress, cancelToken) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: cancelToken.signal
    });
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      // 明确告知用户上传已取消
      onProgress({ status: 'cancelled', message: '上传已取消' });
      throw new CancellationError('上传已取消');
    }
    throw error;
  }
}

// 使用
const controller = new AbortController();

uploadFile(
  myFile,
  (progress) => {
    console.log('进度:', progress);
  },
  controller
)
  .then(result => console.log('上传成功:', result))
  .catch(error => {
    if (error.isCancellation) {
      showToast('上传已取消'); // 用户友好的提示
    } else {
      showToast('上传失败: ' + error.message);
    }
  });

// 用户点击取消按钮
cancelButton.onclick = () => {
  controller.abort();
};
```

### 最佳实践 5：文档化取消行为

```javascript
/**
 * 获取用户数据
 * @param {string} userId - 用户 ID
 * @param {AbortSignal} [signal] - 可选的取消信号
 * @returns {Promise<User>} 用户数据
 * @throws {AbortError} 当请求被取消时
 * 
 * @example
 * const controller = new AbortController();
 * const user = await fetchUser('123', controller.signal);
 * 
 * // 取消请求
 * controller.abort();
 */
async function fetchUser(userId, signal) {
  const response = await fetch(`/api/users/${userId}`, { signal });
  return response.json();
}
```

---

## 总结

**Promise 取消的核心要点**：

### 1. 原生限制

- Promise 本身不支持取消
- 一旦创建就会执行
- 状态改变不可逆

### 2. 取消方案

- **取消标志**：通过标志位忽略结果
- **竞态模式**：使用 Promise.race 实现取消效果
- **AbortController**：标准 API，推荐用于 fetch
- **取消令牌**：灵活的取消模式，类似 Axios

### 3. 实现要点

- 不是真正中止执行，而是忽略结果
- 需要手动清理资源（定时器、监听器等）
- 区分取消错误和其他错误
- 避免内存泄漏

### 4. 实际应用

- React 组件卸载时取消请求
- 路由切换时取消加载
- 用户操作触发的取消
- 防止过期结果更新状态

### 5. 最佳实践

- 明确区分取消和错误
- 提供清理机制避免内存泄漏
- 合理的取消粒度
- 给用户明确的反馈
- 文档化取消行为

### 6. 选择建议

- **fetch 请求**：使用 AbortController
- **通用异步操作**：使用取消令牌
- **简单场景**：使用取消标志
- **复杂流程**：结合多种方案

## 延伸阅读

- [MDN - AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [MDN - AbortSignal](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)
- [MDN - Fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
- [Axios - Cancellation](https://axios-http.com/docs/cancellation)
- [Promise 取消提案讨论](https://github.com/tc39/proposal-cancelable-promises)
- [React - 清理副作用](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
