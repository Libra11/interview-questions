---
title: 常见的 HTTP 4xx 状态码有哪些
category: HTTP
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  全面了解 HTTP 4xx 客户端错误状态码,包括 400、401、403、404、405 等常见状态码的含义、使用场景和处理方法。
tags:
  - HTTP
  - 状态码
  - 错误处理
  - Web开发
estimatedTime: 22 分钟
keywords:
  - HTTP状态码
  - 4xx错误
  - 客户端错误
  - 错误处理
highlight: 4xx 状态码表示客户端错误,理解这些状态码有助于快速定位和解决问题
order: 146
---

## 问题 1:4xx 状态码概述

### 基本概念

4xx 状态码表示**客户端错误**,即请求包含错误的语法或无法完成。

```javascript
// 4xx 分类
// 400-499: 客户端错误

// 常见状态码
400 Bad Request          // 请求语法错误
401 Unauthorized         // 未授权
403 Forbidden           // 禁止访问
404 Not Found           // 资源不存在
405 Method Not Allowed  // 方法不允许
408 Request Timeout     // 请求超时
409 Conflict            // 冲突
410 Gone                // 资源已删除
413 Payload Too Large   // 请求体过大
429 Too Many Requests   // 请求过多
```

---

## 问题 2:400 Bad Request

### 含义

请求语法错误,服务器无法理解。

```javascript
// 常见原因

// 1. JSON 格式错误
fetch('/api/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{ name: "John" }'  // ❌ 缺少引号
});

// 响应
HTTP/1.1 400 Bad Request
{
  "error": "Invalid JSON"
}

// 2. 缺少必需参数
fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify({
    // ❌ 缺少 email 字段
    name: 'John'
  })
});

// 3. 参数类型错误
fetch('/api/user/abc')  // ❌ ID 应该是数字

// 4. 请求头错误
fetch('/api/data', {
  headers: {
    'Content-Type': 'invalid/type'  // ❌ 无效的 Content-Type
  }
});
```

### 服务端处理

```javascript
// Express 示例
app.post('/api/user', (req, res) => {
  // 验证请求体
  if (!req.body.name || !req.body.email) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email']
    });
  }
  
  // 验证数据格式
  if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(req.body.email)) {
    return res.status(400).json({
      error: 'Invalid email format'
    });
  }
  
  // 处理请求
  res.status(200).json({ success: true });
});
```

---

## 问题 3:401 Unauthorized

### 含义

未授权,需要身份验证。

```javascript
// 场景 1: 缺少认证信息
fetch('/api/profile')

// 响应
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"
{
  "error": "Authentication required"
}

// 场景 2: Token 无效
fetch('/api/profile', {
  headers: {
    'Authorization': 'Bearer invalid_token'
  }
})

// 响应
HTTP/1.1 401 Unauthorized
{
  "error": "Invalid token"
}

// 场景 3: Token 过期
fetch('/api/profile', {
  headers: {
    'Authorization': 'Bearer expired_token'
  }
})

// 响应
HTTP/1.1 401 Unauthorized
{
  "error": "Token expired"
}
```

### 客户端处理

```javascript
async function fetchWithAuth(url) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token 无效或过期
    // 尝试刷新 token
    const newToken = await refreshToken();
    
    if (newToken) {
      // 重试请求
      return fetch(url, {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      });
    } else {
      // 刷新失败,跳转登录
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

---

## 问题 4:403 Forbidden

### 含义

禁止访问,服务器理解请求但拒绝执行。

```javascript
// 401 vs 403
// 401: 你是谁? (身份验证)
// 403: 我知道你是谁,但你没权限 (授权)

// 场景 1: 权限不足
fetch('/api/admin/users', {
  headers: {
    'Authorization': 'Bearer user_token'  // 普通用户 token
  }
})

// 响应
HTTP/1.1 403 Forbidden
{
  "error": "Admin access required"
}

// 场景 2: IP 限制
fetch('/api/data')

// 响应
HTTP/1.1 403 Forbidden
{
  "error": "Access denied from your IP"
}

// 场景 3: 资源所有权
fetch('/api/posts/123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer other_user_token'
  }
})

// 响应
HTTP/1.1 403 Forbidden
{
  "error": "You don't own this resource"
}
```

### 服务端实现

```javascript
// 权限检查中间件
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  next();
}

// 使用
app.delete('/api/users/:id', requireAdmin, (req, res) => {
  // 只有管理员可以删除用户
});

// 资源所有权检查
app.delete('/api/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (post.authorId !== req.user.id) {
    return res.status(403).json({
      error: 'You can only delete your own posts'
    });
  }
  
  await post.delete();
  res.status(200).json({ success: true });
});
```

---

## 问题 5:404 Not Found

### 含义

请求的资源不存在。

```javascript
// 场景 1: URL 错误
fetch('/api/userss')  // ❌ 拼写错误

// 响应
HTTP/1.1 404 Not Found
{
  "error": "Endpoint not found"
}

// 场景 2: 资源 ID 不存在
fetch('/api/users/99999')

// 响应
HTTP/1.1 404 Not Found
{
  "error": "User not found"
}

// 场景 3: 文件不存在
fetch('/images/logo.png')

// 响应
HTTP/1.1 404 Not Found
```

### 自定义 404 页面

```javascript
// Express
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /api/users',
      'POST /api/users',
      'GET /api/posts'
    ]
  });
});

// 前端处理
async function fetchData(url) {
  const response = await fetch(url);
  
  if (response.status === 404) {
    console.error('Resource not found');
    // 显示 404 页面
    showNotFoundPage();
    return null;
  }
  
  return response.json();
}
```

---

## 问题 6:405 Method Not Allowed

### 含义

请求方法不被允许。

```javascript
// 场景: 使用了不支持的 HTTP 方法
fetch('/api/users/123', {
  method: 'PUT'  // ❌ 服务器只支持 GET 和 DELETE
})

// 响应
HTTP/1.1 405 Method Not Allowed
Allow: GET, DELETE
{
  "error": "Method PUT not allowed",
  "allowed": ["GET", "DELETE"]
}
```

### 服务端实现

```javascript
// Express
app.all('/api/users/:id', (req, res) => {
  const allowedMethods = ['GET', 'DELETE'];
  
  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowed: allowedMethods
    });
  }
  
  // 处理允许的方法
  if (req.method === 'GET') {
    // ...
  } else if (req.method === 'DELETE') {
    // ...
  }
});
```

---

## 问题 7:其他常见 4xx 状态码

### 408 Request Timeout

```javascript
// 请求超时
// 客户端在服务器等待时间内未完成请求

// Nginx 配置
client_body_timeout 60s;
client_header_timeout 60s;

// 响应
HTTP/1.1 408 Request Timeout
{
  "error": "Request timeout"
}
```

### 409 Conflict

```javascript
// 请求冲突
// 通常用于并发控制

// 场景: 资源已存在
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    email: 'existing@example.com'
  })
})

// 响应
HTTP/1.1 409 Conflict
{
  "error": "User with this email already exists"
}

// 场景: 版本冲突
fetch('/api/posts/123', {
  method: 'PUT',
  headers: {
    'If-Match': '"old-etag"'
  },
  body: JSON.stringify({ title: 'New Title' })
})

// 响应
HTTP/1.1 409 Conflict
{
  "error": "Resource has been modified"
}
```

### 410 Gone

```javascript
// 资源已永久删除
// 与 404 的区别: 410 表示资源曾经存在但已删除

fetch('/api/posts/old-post')

// 响应
HTTP/1.1 410 Gone
{
  "error": "This post has been permanently deleted"
}
```

### 413 Payload Too Large

```javascript
// 请求体过大

// 上传大文件
const formData = new FormData();
formData.append('file', largeFile);  // 100MB

fetch('/api/upload', {
  method: 'POST',
  body: formData
})

// 响应
HTTP/1.1 413 Payload Too Large
{
  "error": "File size exceeds 10MB limit"
}

// Nginx 配置
client_max_body_size 10M;
```

### 429 Too Many Requests

```javascript
// 请求过多,触发限流

// 短时间内多次请求
for (let i = 0; i < 100; i++) {
  fetch('/api/data');
}

// 响应
HTTP/1.1 429 Too Many Requests
Retry-After: 60
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}

// 客户端处理
async function fetchWithRetry(url) {
  const response = await fetch(url);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // 等待后重试
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return fetchWithRetry(url);
  }
  
  return response;
}
```

---

## 问题 8:统一错误处理

### 前端错误处理

```javascript
// 统一的 fetch 封装
async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    // 处理不同的状态码
    switch (response.status) {
      case 200:
      case 201:
        return response.json();
        
      case 400:
        const error = await response.json();
        throw new Error(error.message || 'Bad Request');
        
      case 401:
        // 跳转登录
        window.location.href = '/login';
        break;
        
      case 403:
        throw new Error('Access Denied');
        
      case 404:
        throw new Error('Resource Not Found');
        
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Too many requests. Retry after ${retryAfter}s`);
        
      default:
        throw new Error(`HTTP Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// 使用
try {
  const data = await request('/api/users');
} catch (error) {
  showErrorMessage(error.message);
}
```

### 后端错误处理

```javascript
// Express 错误处理中间件
app.use((err, req, res, next) => {
  // 根据错误类型返回不同状态码
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message
    });
  }
  
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message
    });
  }
  
  // 默认 500
  res.status(500).json({
    error: 'Internal Server Error'
  });
});
```

---

## 总结

**核心概念总结**:

### 1. 常见 4xx 状态码

- **400**: 请求语法错误
- **401**: 未授权,需要认证
- **403**: 禁止访问,权限不足
- **404**: 资源不存在
- **405**: 方法不允许

### 2. 其他 4xx 状态码

- **408**: 请求超时
- **409**: 冲突
- **410**: 资源已删除
- **413**: 请求体过大
- **429**: 请求过多

### 3. 处理建议

- 明确错误原因
- 提供详细错误信息
- 统一错误处理
- 友好的用户提示

## 延伸阅读

- [HTTP 状态码 MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)
- [RFC 7231 - HTTP/1.1](https://tools.ietf.org/html/rfc7231)
- [REST API 错误处理最佳实践](https://www.rfc-editor.org/rfc/rfc7807)
