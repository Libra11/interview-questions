---
title: CORS 是如何实现跨域的
category: 网络
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 CORS 跨域资源共享机制,包括简单请求和预检请求的区别、常用的 CORS 响应头、如何在服务器端配置 CORS,以及 CORS 的安全性考虑。
tags:
  - CORS
  - 跨域
  - HTTP
  - Web安全
estimatedTime: 25 分钟
keywords:
  - CORS
  - 跨域资源共享
  - 预检请求
  - Access-Control-Allow-Origin
highlight: 掌握现代 Web 开发中最常用的跨域解决方案 CORS
order: 4
---

## 问题 1：什么是 CORS

CORS(Cross-Origin Resource Sharing,跨域资源共享)是一种基于 HTTP 头部的机制,允许服务器标识哪些源可以访问其资源。

**核心思想**:

- 浏览器在发送跨域请求时,会自动添加 `Origin` 头部
- 服务器通过响应头告诉浏览器是否允许该跨域请求
- 浏览器根据服务器的响应头决定是否允许 JavaScript 读取响应数据

```javascript
// 客户端代码(https://a.com)
fetch("https://b.com/api/data")
  .then((res) => res.json())
  .then((data) => console.log(data));

// 浏览器自动添加请求头:
// Origin: https://a.com

// 服务器响应头:
// Access-Control-Allow-Origin: https://a.com

// ✅ 浏览器允许 JavaScript 读取响应数据
```

---

## 问题 2：CORS 的两种请求类型

CORS 将请求分为两类:简单请求和预检请求。

### 1. 简单请求

满足以下**所有条件**的请求是简单请求:

**请求方法**:

- `GET`
- `HEAD`
- `POST`

**请求头仅包含**:

- `Accept`
- `Accept-Language`
- `Content-Language`
- `Content-Type`(仅限以下值)
  - `text/plain`
  - `multipart/form-data`
  - `application/x-www-form-urlencoded`

**简单请求的流程**:

```javascript
// 1. 浏览器直接发送请求
fetch("https://api.example.com/data", {
  method: "GET",
});

// 2. 请求头
// GET /data HTTP/1.1
// Origin: https://example.com

// 3. 服务器响应
// HTTP/1.1 200 OK
// Access-Control-Allow-Origin: https://example.com
// Content-Type: application/json

// 4. 浏览器检查响应头,允许 JavaScript 读取数据
```

### 2. 预检请求

不满足简单请求条件的请求会触发预检请求(Preflight Request)。

**常见触发场景**:

```javascript
// ❌ 使用了 PUT 方法
fetch("https://api.example.com/data", {
  method: "PUT",
  body: JSON.stringify({ name: "John" }),
});

// ❌ 使用了自定义请求头
fetch("https://api.example.com/data", {
  headers: {
    "X-Custom-Header": "value",
  },
});

// ❌ Content-Type 是 application/json
fetch("https://api.example.com/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "John" }),
});
```

**预检请求的流程**:

```javascript
// 1. 浏览器先发送 OPTIONS 请求(预检)
// OPTIONS /data HTTP/1.1
// Origin: https://example.com
// Access-Control-Request-Method: PUT
// Access-Control-Request-Headers: Content-Type

// 2. 服务器响应预检请求
// HTTP/1.1 200 OK
// Access-Control-Allow-Origin: https://example.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type
// Access-Control-Max-Age: 86400  // 预检结果缓存 24 小时

// 3. 预检通过后,浏览器发送实际请求
// PUT /data HTTP/1.1
// Origin: https://example.com
// Content-Type: application/json

// 4. 服务器响应实际请求
// HTTP/1.1 200 OK
// Access-Control-Allow-Origin: https://example.com
```

---

## 问题 3：常用的 CORS 响应头有哪些

### 1. Access-Control-Allow-Origin

指定允许访问资源的源。

```javascript
// 允许单个源
Access-Control-Allow-Origin: https://example.com

// 允许所有源(不安全,不推荐)
Access-Control-Allow-Origin: *

// ❌ 错误:不能指定多个源
Access-Control-Allow-Origin: https://a.com, https://b.com

// ✅ 正确:动态设置
app.use((req, res, next) => {
  const allowedOrigins = ['https://a.com', 'https://b.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  next();
});
```

### 2. Access-Control-Allow-Methods

指定允许的 HTTP 方法。

```javascript
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 3. Access-Control-Allow-Headers

指定允许的请求头。

```javascript
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### 4. Access-Control-Allow-Credentials

是否允许发送 Cookie。

```javascript
// 服务器端
Access-Control-Allow-Credentials: true

// 客户端必须设置
fetch('https://api.example.com/data', {
  credentials: 'include' // 发送 Cookie
});

// ⚠️ 注意:使用 credentials 时,Access-Control-Allow-Origin 不能是 *
```

### 5. Access-Control-Max-Age

预检请求的缓存时间(秒)。

```javascript
Access-Control-Max-Age: 86400 // 缓存 24 小时
```

### 6. Access-Control-Expose-Headers

指定哪些响应头可以被 JavaScript 访问。

```javascript
// 默认情况下,JavaScript 只能访问以下响应头:
// Cache-Control, Content-Language, Content-Type,
// Expires, Last-Modified, Pragma

// 如果需要访问其他响应头:
Access-Control-Expose-Headers: X-Custom-Header, X-Total-Count

// 客户端可以访问
fetch('https://api.example.com/data')
  .then(res => {
    console.log(res.headers.get('X-Total-Count')); // ✅ 可以访问
  });
```

---

## 问题 4：如何在服务器端配置 CORS

### Node.js + Express

```javascript
const express = require("express");
const app = express();

// 方法 1: 手动设置响应头
app.use((req, res, next) => {
  // 允许的源
  res.header("Access-Control-Allow-Origin", "https://example.com");

  // 允许的方法
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  // 允许的请求头
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 允许发送 Cookie
  res.header("Access-Control-Allow-Credentials", "true");

  // 预检请求缓存时间
  res.header("Access-Control-Max-Age", "86400");

  // 处理 OPTIONS 请求
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// 方法 2: 使用 cors 中间件
const cors = require("cors");

app.use(
  cors({
    origin: "https://example.com", // 允许的源
    methods: ["GET", "POST", "PUT", "DELETE"], // 允许的方法
    allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
    credentials: true, // 允许 Cookie
    maxAge: 86400, // 预检缓存时间
  })
);

// 动态设置允许的源
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ["https://a.com", "https://b.com"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
```

### Nginx

```nginx
server {
  listen 80;
  server_name api.example.com;

  location /api {
    # 允许的源
    add_header Access-Control-Allow-Origin https://example.com;

    # 允许的方法
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";

    # 允许的请求头
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    # 允许 Cookie
    add_header Access-Control-Allow-Credentials true;

    # 处理 OPTIONS 请求
    if ($request_method = OPTIONS) {
      return 204;
    }

    proxy_pass http://backend;
  }
}
```

---

## 问题 5：CORS 的安全性考虑

### 1. 不要使用 Access-Control-Allow-Origin: \*

```javascript
// ❌ 危险:允许所有源访问
res.header("Access-Control-Allow-Origin", "*");

// ✅ 安全:只允许特定源
res.header("Access-Control-Allow-Origin", "https://trusted.com");

// ✅ 安全:动态验证源
const allowedOrigins = ["https://a.com", "https://b.com"];
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
  res.header("Access-Control-Allow-Origin", origin);
}
```

### 2. 使用 credentials 时必须指定具体的源

```javascript
// ❌ 错误:不能同时使用
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Credentials", "true");

// ✅ 正确
res.header("Access-Control-Allow-Origin", "https://example.com");
res.header("Access-Control-Allow-Credentials", "true");
```

### 3. 验证 Origin 头部

```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ["https://a.com", "https://b.com"];

  // 验证 Origin
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    // 拒绝请求
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
});
```

### 4. 限制允许的方法和头部

```javascript
// ❌ 过于宽松
res.header("Access-Control-Allow-Methods", "*");
res.header("Access-Control-Allow-Headers", "*");

// ✅ 只允许必要的方法和头部
res.header("Access-Control-Allow-Methods", "GET, POST");
res.header("Access-Control-Allow-Headers", "Content-Type");
```

## 总结

**核心概念总结**:

### 1. CORS 工作原理

- 浏览器自动添加 `Origin` 头部
- 服务器通过响应头控制跨域访问
- 浏览器根据响应头决定是否允许访问

### 2. 请求类型

- 简单请求:直接发送,无需预检
- 预检请求:先发送 OPTIONS 请求,通过后再发送实际请求

### 3. 关键响应头

- `Access-Control-Allow-Origin`: 允许的源
- `Access-Control-Allow-Methods`: 允许的方法
- `Access-Control-Allow-Headers`: 允许的请求头
- `Access-Control-Allow-Credentials`: 是否允许 Cookie

### 4. 安全建议

- 不要使用 `*` 允许所有源
- 使用白名单验证 Origin
- 只允许必要的方法和头部
- 使用 credentials 时必须指定具体源

## 延伸阅读

- [MDN - CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [MDN - Access-Control-Allow-Origin](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
- [W3C - CORS 规范](https://www.w3.org/TR/cors/)
- [Enable CORS](https://enable-cors.org/)
