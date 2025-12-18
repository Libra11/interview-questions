---
title: 关于 axios 的常见问题和使用技巧
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  全面了解 axios 的核心特性、拦截器机制、请求取消、并发控制等高级用法，掌握在实际项目中的最佳实践
tags:
  - axios
  - HTTP请求
  - 拦截器
  - 异步请求
estimatedTime: 25 分钟
keywords:
  - axios
  - 拦截器
  - 请求取消
  - 并发请求
  - 错误处理
highlight: axios 是基于 Promise 的 HTTP 客户端，提供拦截器、请求取消、自动转换等强大功能
order: 296
---

## 问题 1：axios 有哪些核心特性？

### 基本使用

```javascript
import axios from 'axios';

// GET 请求
const response = await axios.get('/api/users');
console.log(response.data);

// POST 请求
const user = await axios.post('/api/users', {
  name: '张三',
  email: 'zhangsan@example.com'
});

// 完整配置
const response = await axios({
  method: 'post',
  url: '/api/users',
  data: { name: '张三' },
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});
```

### 核心特性

```javascript
// 1. 自动转换 JSON
// 请求时自动序列化对象
axios.post('/api/users', { name: '张三' });
// 等同于
fetch('/api/users', {
  body: JSON.stringify({ name: '张三' })
});

// 响应时自动解析 JSON
const response = await axios.get('/api/users');
console.log(response.data); // 已经是对象，不需要 .json()

// 2. 请求和响应拦截器
axios.interceptors.request.use(config => {
  // 在发送请求前做些什么
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 3. 自动转换请求和响应数据
// 4. 客户端支持防御 XSRF
// 5. 支持取消请求
// 6. 超时处理
// 7. 支持 Promise API
```

---

## 问题 2：如何使用拦截器？

### 请求拦截器

```javascript
// 添加请求拦截器
axios.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    
    // 1. 添加 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. 显示 loading
    showLoading();
    
    // 3. 添加时间戳（防止缓存）
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  error => {
    // 请求错误时做些什么
    return Promise.reject(error);
  }
);
```

### 响应拦截器

```javascript
// 添加响应拦截器
axios.interceptors.response.use(
  response => {
    // 2xx 范围内的状态码都会触发该函数
    
    // 隐藏 loading
    hideLoading();
    
    // 统一处理响应数据
    return response.data;
  },
  error => {
    // 超出 2xx 范围的状态码都会触发该函数
    
    hideLoading();
    
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转登录
          router.push('/login');
          break;
        case 403:
          message.error('没有权限');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(error.response.data.message || '请求失败');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 发送请求时出了点问题
      message.error('请求失败：' + error.message);
    }
    
    return Promise.reject(error);
  }
);
```

### 移除拦截器

```javascript
// 添加拦截器时保存引用
const myInterceptor = axios.interceptors.request.use(config => {
  // ...
  return config;
});

// 移除拦截器
axios.interceptors.request.eject(myInterceptor);
```

---

## 问题 3：如何取消请求？

### 使用 AbortController（推荐）

```javascript
// 创建 AbortController
const controller = new AbortController();

// 发起请求
axios.get('/api/users', {
  signal: controller.signal
}).then(response => {
  console.log(response.data);
}).catch(error => {
  if (axios.isCancel(error)) {
    console.log('请求被取消:', error.message);
  }
});

// 取消请求
controller.abort();
```

### 实际应用：搜索防抖

```javascript
let controller = null;

async function search(keyword) {
  // 取消上一次请求
  if (controller) {
    controller.abort();
  }
  
  // 创建新的 controller
  controller = new AbortController();
  
  try {
    const response = await axios.get('/api/search', {
      params: { keyword },
      signal: controller.signal
    });
    
    displayResults(response.data);
  } catch (error) {
    if (!axios.isCancel(error)) {
      console.error('搜索失败:', error);
    }
  }
}

// 使用
searchInput.addEventListener('input', (e) => {
  search(e.target.value);
});
```

### 批量取消请求

```javascript
class RequestManager {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  request(config) {
    const controller = new AbortController();
    const requestId = this.generateId();
    
    this.pendingRequests.set(requestId, controller);
    
    return axios({
      ...config,
      signal: controller.signal
    }).finally(() => {
      this.pendingRequests.delete(requestId);
    });
  }
  
  cancelAll() {
    this.pendingRequests.forEach(controller => {
      controller.abort();
    });
    this.pendingRequests.clear();
  }
  
  generateId() {
    return Date.now() + Math.random();
  }
}

// 使用
const manager = new RequestManager();

// 发起多个请求
manager.request({ url: '/api/users' });
manager.request({ url: '/api/posts' });

// 取消所有请求
manager.cancelAll();
```

---

## 问题 4：如何处理并发请求？

### Promise.all（全部成功）

```javascript
// 同时发起多个请求
const [users, posts, comments] = await Promise.all([
  axios.get('/api/users'),
  axios.get('/api/posts'),
  axios.get('/api/comments')
]);

console.log(users.data, posts.data, comments.data);
```

### Promise.allSettled（不管成败）

```javascript
// 等待所有请求完成，不管成功还是失败
const results = await Promise.allSettled([
  axios.get('/api/users'),
  axios.get('/api/posts'),
  axios.get('/api/comments')
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求 ${index} 成功:`, result.value.data);
  } else {
    console.log(`请求 ${index} 失败:`, result.reason);
  }
});
```

### 并发控制

```javascript
// 限制并发数量
class ConcurrencyController {
  constructor(limit = 3) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }
  
  async request(config) {
    // 如果达到并发限制，加入队列
    if (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    
    try {
      const response = await axios(config);
      return response;
    } finally {
      this.running--;
      
      // 从队列中取出下一个请求
      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve();
      }
    }
  }
}

// 使用
const controller = new ConcurrencyController(3); // 最多3个并发

const urls = Array.from({ length: 10 }, (_, i) => `/api/data/${i}`);

const promises = urls.map(url => 
  controller.request({ url })
);

const results = await Promise.all(promises);
```

---

## 问题 5：如何创建 axios 实例和最佳实践？

### 创建实例

```javascript
// 创建自定义实例
const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 为实例添加拦截器
apiClient.interceptors.request.use(config => {
  // 实例级别的请求拦截
  return config;
});
```

### 封装 API 服务

```javascript
// api/request.js
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 清除 token，跳转登录
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
```

```javascript
// api/user.js
import request from './request';

export const userAPI = {
  // 获取用户列表
  getUsers(params) {
    return request.get('/users', { params });
  },
  
  // 获取用户详情
  getUserById(id) {
    return request.get(`/users/${id}`);
  },
  
  // 创建用户
  createUser(data) {
    return request.post('/users', data);
  },
  
  // 更新用户
  updateUser(id, data) {
    return request.put(`/users/${id}`, data);
  },
  
  // 删除用户
  deleteUser(id) {
    return request.delete(`/users/${id}`);
  }
};
```

```javascript
// 使用
import { userAPI } from '@/api/user';

// 获取用户列表
const users = await userAPI.getUsers({ page: 1, size: 10 });

// 创建用户
await userAPI.createUser({ name: '张三', email: 'zhangsan@example.com' });
```

### 错误重试

```javascript
// 添加重试功能
request.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // 如果没有配置重试或已达到最大重试次数
    if (!config || !config.retry || config.__retryCount >= config.retry) {
      return Promise.reject(error);
    }
    
    // 增加重试计数
    config.__retryCount = config.__retryCount || 0;
    config.__retryCount++;
    
    // 等待一段时间后重试
    await new Promise(resolve => 
      setTimeout(resolve, config.retryDelay || 1000)
    );
    
    // 重新发起请求
    return request(config);
  }
);

// 使用
axios.get('/api/data', {
  retry: 3,        // 重试3次
  retryDelay: 1000 // 每次重试间隔1秒
});
```

---

## 总结

**核心要点**：

### 1. axios 优势
- 基于 Promise，支持 async/await
- 自动转换 JSON
- 拦截器机制
- 请求取消
- 超时处理

### 2. 拦截器应用
- 请求拦截：添加 token、loading
- 响应拦截：统一错误处理、数据转换

### 3. 请求取消
- 使用 AbortController
- 应用于搜索防抖、路由切换

### 4. 最佳实践
- 创建 axios 实例
- 封装 API 服务
- 统一错误处理
- 请求重试机制

---

## 延伸阅读

- [axios 官方文档](https://axios-http.com/zh/docs/intro)
- [axios GitHub](https://github.com/axios/axios)
- [MDN - AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)
- [Promise 并发控制](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
