---
title: token过期后，页面如何实现无感刷新
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 Token 无感刷新的实现原理，掌握使用 Refresh Token、请求拦截器等技术实现用户无感知的 Token 更新
tags:
  - Token
  - 身份验证
  - Refresh Token
  - 请求拦截
estimatedTime: 25 分钟
keywords:
  - Token刷新
  - Refresh Token
  - 无感刷新
  - 请求拦截器
highlight: 通过 Refresh Token 和请求拦截器实现 Token 无感刷新，提升用户体验
order: 84
---

## 问题 1：什么是 Token 无感刷新？

Token 无感刷新是指在 Access Token 过期后，自动使用 Refresh Token 获取新的 Access Token，整个过程对用户透明，不需要用户重新登录。

### 为什么需要无感刷新？

```javascript
// ❌ 没有无感刷新的体验
用户正在浏览页面
  -> Access Token 过期（15分钟后）
  -> 发送请求失败（401 Unauthorized）
  -> 跳转到登录页
  -> 用户需要重新登录
  -> 丢失当前页面状态

// ✅ 有无感刷新的体验
用户正在浏览页面
  -> Access Token 过期
  -> 自动使用 Refresh Token 获取新 Token
  -> 重试原始请求
  -> 请求成功
  -> 用户无感知，继续使用
```

### 双 Token 机制

```javascript
// Access Token: 短期有效（15分钟 - 1小时）
// - 用于日常 API 请求
// - 过期时间短，安全性高
// - 存储在内存或 sessionStorage

// Refresh Token: 长期有效（7天 - 30天）
// - 仅用于刷新 Access Token
// - 过期时间长，使用频率低
// - 存储在 httpOnly Cookie 或 localStorage

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // 15分钟有效
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",      // 7天有效
  "expiresIn": 900  // 900秒 = 15分钟
}
```

---

## 问题 2：如何实现 Token 无感刷新？

### 方案一：请求拦截器 + 重试机制

```javascript
// 使用 Axios 实现
import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: 'https://api.example.com'
});

// 存储 Token
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');
let isRefreshing = false;  // 是否正在刷新
let failedQueue = [];  // 失败请求队列

// 处理队列中的请求
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// 请求拦截器：添加 Token
api.interceptors.request.use(
  config => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：处理 Token 过期
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // 刷新 Token
        const response = await axios.post('https://api.example.com/auth/refresh', {
          refreshToken
        });
        
        const { accessToken: newAccessToken } = response.data;
        
        // 更新 Token
        accessToken = newAccessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        // 更新请求头
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // 处理队列中的请求
        processQueue(null, newAccessToken);
        
        // 重试原始请求
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除 Token 并跳转登录
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 使用示例

```javascript
// 在组件中使用
import api from './api';

async function fetchUserData() {
  try {
    const response = await api.get('/user/profile');
    console.log('用户数据:', response.data);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 即使 Token 过期，也会自动刷新并重试
fetchUserData();
```

---

## 问题 3：如何优化 Token 刷新策略？

### 方案二：定时刷新

```javascript
// 在 Token 即将过期前主动刷新

class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.expiresAt = localStorage.getItem('expiresAt');
    this.refreshTimer = null;
  }
  
  // 设置 Token
  setTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = Date.now() + expiresIn * 1000;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expiresAt', this.expiresAt);
    
    // 设置定时刷新
    this.scheduleRefresh(expiresIn);
  }
  
  // 安排刷新任务
  scheduleRefresh(expiresIn) {
    // 清除之前的定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // 在过期前 1 分钟刷新
    const refreshTime = (expiresIn - 60) * 1000;
    
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, refreshTime);
  }
  
  // 刷新 Access Token
  async refreshAccessToken() {
    try {
      const response = await fetch('https://api.example.com/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('刷新失败');
      }
      
      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      
      console.log('Token 刷新成功');
    } catch (error) {
      console.error('Token 刷新失败:', error);
      this.handleRefreshError();
    }
  }
  
  // 处理刷新失败
  handleRefreshError() {
    this.clearTokens();
    window.location.href = '/login';
  }
  
  // 清除 Token
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
  
  // 检查 Token 是否即将过期
  isTokenExpiringSoon() {
    const timeLeft = this.expiresAt - Date.now();
    return timeLeft < 5 * 60 * 1000;  // 少于 5 分钟
  }
  
  // 获取 Access Token
  getAccessToken() {
    // 如果即将过期，立即刷新
    if (this.isTokenExpiringSoon()) {
      this.refreshAccessToken();
    }
    return this.accessToken;
  }
}

// 使用示例
const tokenManager = new TokenManager();

// 登录后设置 Token
function handleLogin(loginResponse) {
  const { accessToken, refreshToken, expiresIn } = loginResponse;
  tokenManager.setTokens(accessToken, refreshToken, expiresIn);
}

// 发送请求时获取 Token
async function fetchData() {
  const token = tokenManager.getAccessToken();
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### 方案三：Refresh Token 轮换

```javascript
// 每次刷新时，同时更新 Refresh Token
// 提高安全性，防止 Refresh Token 被盗用

// 服务器端实现
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    // 1. 验证 Refresh Token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // 2. 检查 Refresh Token 是否在数据库中
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      userId: decoded.userId
    });
    
    if (!storedToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // 3. 生成新的 Access Token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    
    // 4. 生成新的 Refresh Token
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    // 5. 删除旧的 Refresh Token
    await RefreshToken.deleteOne({ token: refreshToken });
    
    // 6. 保存新的 Refresh Token
    await RefreshToken.create({
      token: newRefreshToken,
      userId: decoded.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // 7. 返回新的 Token
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900  // 15分钟
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});
```

---

## 问题 4：如何处理并发请求的 Token 刷新？

### 问题场景

```javascript
// 问题：多个请求同时发现 Token 过期
// 可能导致多次刷新 Token

请求 A -> 发现 Token 过期 -> 开始刷新
请求 B -> 发现 Token 过期 -> 开始刷新  // ❌ 重复刷新
请求 C -> 发现 Token 过期 -> 开始刷新  // ❌ 重复刷新
```

### 解决方案：请求队列

```javascript
class TokenRefreshManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.subscribers = [];
  }
  
  // 刷新 Token
  async refreshToken(refreshToken) {
    // 如果正在刷新，返回同一个 Promise
    if (this.isRefreshing) {
      return this.refreshPromise;
    }
    
    this.isRefreshing = true;
    
    this.refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
      .then(res => res.json())
      .then(data => {
        // 更新 Token
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // 通知所有等待的请求
        this.onRefreshed(data.accessToken);
        
        return data.accessToken;
      })
      .catch(error => {
        // 刷新失败，通知所有请求
        this.onRefreshError(error);
        throw error;
      })
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });
    
    return this.refreshPromise;
  }
  
  // 添加等待刷新的请求
  subscribeTokenRefresh(callback) {
    this.subscribers.push(callback);
  }
  
  // Token 刷新成功，通知所有等待的请求
  onRefreshed(token) {
    this.subscribers.forEach(callback => callback(token));
    this.subscribers = [];
  }
  
  // Token 刷新失败，通知所有等待的请求
  onRefreshError(error) {
    this.subscribers.forEach(callback => callback(null, error));
    this.subscribers = [];
  }
}

const refreshManager = new TokenRefreshManager();

// 在 Axios 拦截器中使用
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (refreshManager.isRefreshing) {
        // 如果正在刷新，等待刷新完成
        return new Promise((resolve, reject) => {
          refreshManager.subscribeTokenRefresh((token, error) => {
            if (error) {
              reject(error);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const newToken = await refreshManager.refreshToken(refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 跳转登录
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 问题 5：安全性考虑

### 1. Refresh Token 存储

```javascript
// ❌ 不安全：存储在 localStorage
localStorage.setItem('refreshToken', refreshToken);
// 容易被 XSS 攻击窃取

// ✅ 更安全：存储在 httpOnly Cookie
// 服务器端设置
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,  // 防止 JavaScript 访问
  secure: true,    // 只在 HTTPS 下传输
  sameSite: 'strict',  // 防止 CSRF 攻击
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7天
});

// 前端刷新时自动携带 Cookie
fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'  // 携带 Cookie
});
```

### 2. Refresh Token 单次使用

```javascript
// 每次刷新后，Refresh Token 失效
// 防止 Token 被重放攻击

// 服务器端
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  // 验证并删除旧 Token
  const isValid = await validateAndDeleteRefreshToken(refreshToken);
  
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  // 生成新的 Token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  
  // 保存新的 Refresh Token
  await saveRefreshToken(newRefreshToken);
  
  // 返回新 Token
  res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
  res.json({ accessToken: newAccessToken });
});
```

### 3. 检测异常刷新

```javascript
// 检测频繁刷新，可能是攻击行为

class RefreshRateLimiter {
  constructor() {
    this.refreshCount = 0;
    this.resetTime = Date.now() + 60000;  // 1分钟后重置
  }
  
  canRefresh() {
    if (Date.now() > this.resetTime) {
      this.refreshCount = 0;
      this.resetTime = Date.now() + 60000;
    }
    
    this.refreshCount++;
    
    // 1分钟内最多刷新 5 次
    if (this.refreshCount > 5) {
      console.warn('刷新过于频繁，可能存在安全问题');
      return false;
    }
    
    return true;
  }
}

const rateLimiter = new RefreshRateLimiter();

async function refreshToken() {
  if (!rateLimiter.canRefresh()) {
    throw new Error('刷新过于频繁');
  }
  
  // 执行刷新
  // ...
}
```

---

## 总结

**核心概念总结**：

### 1. 双 Token 机制

- **Access Token**：短期有效，用于日常请求
- **Refresh Token**：长期有效，仅用于刷新

### 2. 刷新策略

- **被动刷新**：请求失败时刷新（拦截器）
- **主动刷新**：定时刷新（过期前刷新）
- **Token 轮换**：每次刷新更新 Refresh Token

### 3. 并发处理

- 使用刷新标志避免重复刷新
- 维护请求队列等待刷新完成
- 刷新成功后重试所有失败请求

### 4. 安全措施

- Refresh Token 存储在 httpOnly Cookie
- Refresh Token 单次使用
- 检测异常刷新行为
- 设置合理的过期时间

## 延伸阅读

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [Auth0 - Refresh Tokens](https://auth0.com/docs/secure/tokens/refresh-tokens)
- [OWASP - Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
