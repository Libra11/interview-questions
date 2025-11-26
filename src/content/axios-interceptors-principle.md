---
title: Axios 的拦截器原理及应用
category: JavaScript
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Axios 拦截器的实现原理和应用场景。拦截器是 Axios 的核心功能之一，
  通过责任链模式实现请求和响应的统一处理。
tags:
  - Axios
  - HTTP
  - 拦截器
  - 设计模式
estimatedTime: 24 分钟
keywords:
  - Axios 拦截器
  - 请求拦截
  - 响应拦截
  - 责任链模式
highlight: Axios 拦截器通过责任链模式实现请求和响应的统一处理
order: 202
---

## 问题 1：什么是 Axios 拦截器？

**拦截器允许在请求发送前或响应返回后进行统一处理**。

### 拦截器类型

```javascript
import axios from 'axios';

// 请求拦截器
axios.interceptors.request.use(
  config => {
    // 请求发送前执行
    console.log('发送请求:', config);
    return config;
  },
  error => {
    // 请求错误时执行
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  response => {
    // 响应成功时执行
    console.log('收到响应:', response);
    return response;
  },
  error => {
    // 响应错误时执行
    return Promise.reject(error);
  }
);
```

---

## 问题 2：拦截器的实现原理是什么？

**拦截器使用责任链模式，将所有拦截器串联成链**。

### 拦截器管理器

```javascript
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  
  // 添加拦截器
  use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled,
      rejected
    });
    
    // 返回索引，用于移除
    return this.handlers.length - 1;
  }
  
  // 移除拦截器
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  
  // 遍历拦截器
  forEach(fn) {
    this.handlers.forEach(handler => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }
}
```

### 拦截器链的执行

```javascript
class Axios {
  constructor() {
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  
  request(config) {
    // 构建拦截器链
    const chain = [this.dispatchRequest, undefined];
    
    // 请求拦截器（后添加的先执行）
    this.interceptors.request.forEach(interceptor => {
      chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    
    // 响应拦截器（先添加的先执行）
    this.interceptors.response.forEach(interceptor => {
      chain.push(interceptor.fulfilled, interceptor.rejected);
    });
    
    // 执行链
    let promise = Promise.resolve(config);
    
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    
    return promise;
  }
  
  dispatchRequest(config) {
    // 发送实际请求
    return new Promise((resolve, reject) => {
      // XMLHttpRequest 或 fetch
    });
  }
}
```

### 执行流程

```javascript
// 假设添加了以下拦截器
axios.interceptors.request.use(req1Success, req1Error);
axios.interceptors.request.use(req2Success, req2Error);
axios.interceptors.response.use(res1Success, res1Error);
axios.interceptors.response.use(res2Success, res2Error);

// 执行链
const chain = [
  req2Success, req2Error,  // 后添加的请求拦截器先执行
  req1Success, req1Error,
  dispatchRequest, undefined,  // 实际请求
  res1Success, res1Error,  // 先添加的响应拦截器先执行
  res2Success, res2Error
];

// 执行顺序
req2Success -> req1Success -> dispatchRequest -> res1Success -> res2Success
```

---

## 问题 3：请求拦截器有哪些应用场景？

**添加 token、设置请求头、参数转换等**。

### 添加认证 Token

```javascript
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);
```

### 统一设置请求头

```javascript
axios.interceptors.request.use(
  config => {
    config.headers['Content-Type'] = 'application/json';
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  }
);
```

### 请求参数转换

```javascript
axios.interceptors.request.use(
  config => {
    // 将驼峰命名转为下划线
    if (config.data) {
      config.data = convertKeysToSnakeCase(config.data);
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  }
);
```

### Loading 状态

```javascript
let loadingCount = 0;

axios.interceptors.request.use(
  config => {
    if (loadingCount === 0) {
      showLoading();
    }
    loadingCount++;
    return config;
  }
);

axios.interceptors.response.use(
  response => {
    loadingCount--;
    if (loadingCount === 0) {
      hideLoading();
    }
    return response;
  },
  error => {
    loadingCount--;
    if (loadingCount === 0) {
      hideLoading();
    }
    return Promise.reject(error);
  }
);
```

---

## 问题 4：响应拦截器有哪些应用场景？

**统一错误处理、数据转换、token 刷新等**。

### 统一错误处理

```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，跳转登录
          router.push('/login');
          break;
        case 403:
          // 无权限
          message.error('无权限访问');
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
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);
```

### 数据格式转换

```javascript
axios.interceptors.response.use(
  response => {
    // 统一处理后端返回格式
    const { code, data, message } = response.data;
    
    if (code === 200) {
      return data;  // 只返回数据部分
    } else {
      Message.error(message);
      return Promise.reject(new Error(message));
    }
  }
);
```

### Token 自动刷新

```javascript
let isRefreshing = false;
let requests = [];

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新，将请求加入队列
        return new Promise(resolve => {
          requests.push(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // 刷新 token
        const { data } = await axios.post('/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken')
        });
        
        const newToken = data.token;
        localStorage.setItem('token', newToken);
        
        // 更新请求头
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // 重试队列中的请求
        requests.forEach(cb => cb(newToken));
        requests = [];
        
        return axios(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转登录
        router.push('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 问题 5：如何移除拦截器？

**使用 eject 方法移除拦截器**。

### 移除拦截器

```javascript
// 添加拦截器，保存 ID
const requestInterceptor = axios.interceptors.request.use(
  config => {
    console.log('请求拦截');
    return config;
  }
);

const responseInterceptor = axios.interceptors.response.use(
  response => {
    console.log('响应拦截');
    return response;
  }
);

// 移除拦截器
axios.interceptors.request.eject(requestInterceptor);
axios.interceptors.response.eject(responseInterceptor);
```

### 临时禁用拦截器

```javascript
// 创建不使用拦截器的实例
const axiosWithoutInterceptors = axios.create();

// 或在请求配置中标记
axios.interceptors.request.use(
  config => {
    if (config.skipInterceptor) {
      return config;
    }
    
    // 拦截器逻辑
    return config;
  }
);

// 使用时跳过拦截器
axios.get('/api/data', {
  skipInterceptor: true
});
```

---

## 问题 6：如何创建多个 Axios 实例？

**使用 axios.create 创建独立的实例**。

### 创建实例

```javascript
// API 实例
const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加拦截器
apiClient.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config;
  }
);

// 上传实例
const uploadClient = axios.create({
  baseURL: 'https://upload.example.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

uploadClient.interceptors.request.use(
  config => {
    // 上传进度
    config.onUploadProgress = progressEvent => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`上传进度: ${percent}%`);
    };
    return config;
  }
);
```

### 封装请求方法

```javascript
class HttpClient {
  constructor(baseURL) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    this.instance.interceptors.request.use(
      config => {
        // 请求拦截
        return config;
      },
      error => Promise.reject(error)
    );
    
    this.instance.interceptors.response.use(
      response => response.data,
      error => {
        // 错误处理
        return Promise.reject(error);
      }
    );
  }
  
  get(url, params) {
    return this.instance.get(url, { params });
  }
  
  post(url, data) {
    return this.instance.post(url, data);
  }
  
  put(url, data) {
    return this.instance.put(url, data);
  }
  
  delete(url) {
    return this.instance.delete(url);
  }
}

// 使用
const apiClient = new HttpClient('https://api.example.com');
apiClient.get('/users').then(data => console.log(data));
```

---

## 问题 7：如何实现请求重试？

**在响应拦截器中实现自动重试逻辑**。

### 请求重试实现

```javascript
axios.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // 设置重试次数
    if (!config.retryCount) {
      config.retryCount = 0;
    }
    
    const maxRetries = config.maxRetries || 3;
    
    if (config.retryCount < maxRetries) {
      config.retryCount++;
      
      console.log(`重试第 ${config.retryCount} 次`);
      
      // 延迟重试
      await new Promise(resolve => {
        setTimeout(resolve, 1000 * config.retryCount);
      });
      
      return axios(config);
    }
    
    return Promise.reject(error);
  }
);

// 使用
axios.get('/api/data', {
  maxRetries: 3
});
```

---

## 总结

**核心原理**：

### 1. 拦截器机制
- 使用责任链模式
- 请求拦截器：后添加先执行
- 响应拦截器：先添加先执行

### 2. 请求拦截器应用
- 添加认证 Token
- 设置请求头
- 参数转换
- Loading 状态

### 3. 响应拦截器应用
- 统一错误处理
- 数据格式转换
- Token 自动刷新
- 请求重试

### 4. 实例管理
- 创建多个实例
- 独立的拦截器
- 不同的配置

### 5. 最佳实践
- 合理使用拦截器
- 避免过度拦截
- 错误处理完善
- 代码可维护性

## 延伸阅读

- [Axios 官方文档](https://axios-http.com/)
- [Axios 拦截器文档](https://axios-http.com/docs/interceptors)
- [Axios 源码解析](https://github.com/axios/axios)
- [责任链模式](https://refactoring.guru/design-patterns/chain-of-responsibility)
