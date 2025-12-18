---
title: OPTIONS 请求是什么，有什么作用？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP OPTIONS 请求的作用和工作机制，掌握 CORS 预检请求的原理，了解如何正确处理 OPTIONS 请求，以及在实际开发中如何优化预检请求的性能。
tags:
  - HTTP
  - OPTIONS
  - CORS
  - 预检请求
estimatedTime: 22 分钟
keywords:
  - OPTIONS请求
  - CORS预检
  - 预检请求
  - HTTP方法
highlight: 理解 OPTIONS 请求的作用，掌握 CORS 预检机制和优化方法
order: 487
---

## 问题 1：OPTIONS 请求是什么？

**OPTIONS** 是 HTTP 的一个请求方法，用于查询服务器支持的通信选项，最常见的用途是 **CORS 预检请求**。

### 基本概念

```http
OPTIONS /api/users HTTP/1.1
Host: api.example.com
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type

# 服务器响应
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### OPTIONS 的两个主要用途

```javascript
const optionsUseCases = {
  // 1. CORS 预检请求（最常见）
  corsPreflight: {
    purpose: '在跨域请求前检查服务器是否允许',
    trigger: '非简单请求会自动触发',
    example: 'POST with JSON body'
  },
  
  // 2. 查询服务器能力
  serverCapabilities: {
    purpose: '查询服务器支持的 HTTP 方法',
    trigger: '手动发起 OPTIONS 请求',
    example: 'OPTIONS * HTTP/1.1'
  }
};
```

---

## 问题 2：什么时候会触发 OPTIONS 预检请求？

浏览器在发送**非简单请求**之前，会自动发送 OPTIONS 预检请求。

### 简单请求 vs 非简单请求

```javascript
// 简单请求（不触发预检）
const simpleRequests = {
  // 1. 方法限制
  methods: ['GET', 'POST', 'HEAD'],
  
  // 2. 头部限制（只能使用以下头部）
  allowedHeaders: [
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Content-Type'  // 有限制
  ],
  
  // 3. Content-Type 限制
  allowedContentTypes: [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  
  // 示例：简单请求
  example: `
    // ✅ 不触发预检
    fetch('https://api.example.com/data', {
      method: 'GET'
    });
    
    // ✅ 不触发预检
    fetch('https://api.example.com/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'name=John&age=30'
    });
  `
};

// 非简单请求（触发预检）
const nonSimpleRequests = {
  // 1. 使用其他 HTTP 方法
  methods: ['PUT', 'DELETE', 'PATCH', 'CONNECT', 'TRACE'],
  
  // 2. 使用自定义头部
  customHeaders: [
    'Authorization',
    'X-Custom-Header',
    'X-Requested-With'
  ],
  
  // 3. Content-Type 不在简单请求范围内
  contentTypes: [
    'application/json',  // ⚠️ 触发预检
    'application/xml',
    'text/xml'
  ],
  
  // 示例：非简单请求
  example: `
    // ❌ 触发预检（JSON）
    fetch('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'John' })
    });
    
    // ❌ 触发预检（自定义头部）
    fetch('https://api.example.com/data', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer token123'
      }
    });
    
    // ❌ 触发预检（PUT 方法）
    fetch('https://api.example.com/users/123', {
      method: 'PUT',
      body: 'data'
    });
  `
};
```

### 预检请求的完整流程

```javascript
// 1. 浏览器发起实际请求
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John', age: 30 })
});

// 2. 浏览器检测到非简单请求，自动发送 OPTIONS 预检
/*
OPTIONS /users HTTP/1.1
Host: api.example.com
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
*/

// 3. 服务器响应预检请求
/*
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
*/

// 4. 预检通过，浏览器发送实际请求
/*
POST /users HTTP/1.1
Host: api.example.com
Origin: https://example.com
Content-Type: application/json
Authorization: Bearer token123

{"name":"John","age":30}
*/

// 5. 服务器响应实际请求
/*
HTTP/1.1 201 Created
Access-Control-Allow-Origin: https://example.com
Content-Type: application/json

{"id":123,"name":"John","age":30}
*/
```

---

## 问题 3：如何在服务器端正确处理 OPTIONS 请求？

### Node.js/Express 示例

```javascript
const express = require('express');
const app = express();

// 方式1：使用 cors 中间件（推荐）
const cors = require('cors');

app.use(cors({
  origin: 'https://example.com',  // 允许的源
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // 允许凭证
  maxAge: 86400  // 预检结果缓存 24 小时
}));

// 方式2：手动处理 OPTIONS
app.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': 'https://example.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  });
  res.status(204).end();
});

// 方式3：中间件处理
app.use((req, res, next) => {
  // 设置 CORS 头部
  res.header('Access-Control-Allow-Origin', 'https://example.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  
  next();
});

// 实际的 API 路由
app.post('/api/users', (req, res) => {
  // 处理 POST 请求
  res.json({ success: true });
});
```

### 动态设置允许的源

```javascript
// 支持多个源
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  const allowedOrigins = [
    'https://example.com',
    'https://app.example.com',
    'https://mobile.example.com'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  
  next();
});

// 或使用正则匹配
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 允许所有 example.com 的子域名
  if (/^https:\/\/([a-z0-9-]+\.)?example\.com$/.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  // ... 其他 CORS 头部
  next();
});
```

### 不同路由的不同配置

```javascript
// 公开 API：允许所有源
app.options('/api/public/*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400'
  });
  res.status(204).end();
});

// 私有 API：限制源和方法
app.options('/api/private/*', (req, res) => {
  const origin = req.headers.origin;
  
  if (origin === 'https://app.example.com') {
    res.set({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    });
    res.status(204).end();
  } else {
    res.status(403).end();
  }
});
```

---

## 问题 4：如何优化 OPTIONS 预检请求的性能？

### 1. 使用 Access-Control-Max-Age

```javascript
// 设置预检结果的缓存时间
app.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': 'https://example.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'  // 缓存 24 小时
    // 浏览器在 24 小时内不会再发送预检请求
  });
  res.status(204).end();
});

// 不同浏览器的最大值
const maxAgeLimit = {
  Chrome: '7200 (2小时)',
  Firefox: '86400 (24小时)',
  Safari: '600 (10分钟)'
};

// 推荐设置
const recommendedMaxAge = {
  development: '0',        // 开发环境：不缓存
  production: '86400',     // 生产环境：24小时
  static: '604800'         // 静态资源：7天
};
```

### 2. 避免不必要的预检

```javascript
// ✅ 使用简单请求（不触发预检）
// 方式1：使用 FormData
const formData = new FormData();
formData.append('name', 'John');
formData.append('age', '30');

fetch('https://api.example.com/users', {
  method: 'POST',
  body: formData  // Content-Type: multipart/form-data（简单请求）
});

// 方式2：使用 URL 编码
const params = new URLSearchParams();
params.append('name', 'John');
params.append('age', '30');

fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params  // 简单请求
});

// ❌ 触发预检
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // 非简单请求
  },
  body: JSON.stringify({ name: 'John', age: 30 })
});
```

### 3. 服务器端优化

```javascript
// 快速响应 OPTIONS 请求
app.options('*', (req, res) => {
  // 不需要任何业务逻辑
  // 直接返回 CORS 头部
  res.set({
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': req.headers['access-control-request-headers'],
    'Access-Control-Max-Age': '86400'
  });
  
  // 204 No Content（无响应体，更快）
  res.status(204).end();
});

// 使用中间件提前处理
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'],
      'Access-Control-Max-Age': '86400'
    });
    return res.status(204).end();  // 提前返回，不执行后续中间件
  }
  next();
});
```

### 4. 使用代理避免跨域

```javascript
// 开发环境：使用代理
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
};

// 前端请求同源路径（不触发 CORS）
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'John' })
});
// 代理会转发到 https://api.example.com/users
// 不会触发 OPTIONS 预检
```

### 5. 监控和调试

```javascript
// 记录 OPTIONS 请求
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request:', {
      url: req.url,
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
  }
  next();
});

// Chrome DevTools
// 1. Network 标签
// 2. 筛选 OPTIONS 请求
// 3. 查看 Timing：
//    - 如果 OPTIONS 很慢，检查服务器处理
//    - 如果频繁出现，检查 Max-Age 设置
// 4. 查看响应头：
//    - Access-Control-Max-Age
//    - Access-Control-Allow-*

// 性能分析
const optionsStats = {
  count: 0,
  totalTime: 0,
  
  record(duration) {
    this.count++;
    this.totalTime += duration;
  },
  
  getAverage() {
    return this.count > 0 ? this.totalTime / this.count : 0;
  }
};

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      optionsStats.record(duration);
      
      if (duration > 100) {
        console.warn(`Slow OPTIONS request: ${duration}ms`);
      }
    });
  }
  next();
});
```

## 总结

**OPTIONS 请求核心要点**：

### 1. 基本概念

- OPTIONS 是 HTTP 方法之一
- 主要用于 CORS 预检请求
- 查询服务器支持的通信选项

### 2. 触发条件

- **非简单请求**会触发预检
- 使用 PUT/DELETE/PATCH 等方法
- 使用 application/json 等 Content-Type
- 使用自定义头部（如 Authorization）

### 3. 服务器处理

- 返回 Access-Control-Allow-* 头部
- 使用 204 No Content 状态码
- 设置 Access-Control-Max-Age 缓存
- 支持多个源的动态配置

### 4. 性能优化

- 设置合理的 Max-Age（24小时）
- 尽量使用简单请求避免预检
- 快速响应 OPTIONS 请求
- 开发环境使用代理

## 延伸阅读

- [MDN - OPTIONS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/OPTIONS)
- [MDN - CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [MDN - Preflight Request](https://developer.mozilla.org/zh-CN/docs/Glossary/Preflight_request)
- [CORS Specification](https://fetch.spec.whatwg.org/#http-cors-protocol)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
