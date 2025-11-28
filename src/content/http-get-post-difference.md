---
title: http 请求中 GET 和 POST 有什么区别
category: 网络
difficulty: 入门
updatedAt: 2025-11-28
summary: >-
  深入理解 GET 和 POST 请求的本质区别，掌握它们在语义、安全性、缓存等方面的差异
tags:
  - HTTP
  - GET
  - POST
  - 请求方法
estimatedTime: 20 分钟
keywords:
  - GET
  - POST
  - HTTP方法
  - 请求参数
highlight: GET 和 POST 的本质区别在于语义和使用场景，而不仅仅是参数传递方式
order: 7
---

## 问题 1：GET 和 POST 的基本区别是什么？

GET 和 POST 是 HTTP 协议中最常用的两种请求方法，它们有不同的语义和使用场景。

### 基本定义

```javascript
// GET 请求：获取资源
// 语义：从服务器获取数据，不应该修改服务器状态
GET /api/users?id=123 HTTP/1.1
Host: example.com

// POST 请求：提交数据
// 语义：向服务器提交数据，可能会修改服务器状态
POST /api/users HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "name": "John",
  "age": 30
}
```

### 主要区别对比

```javascript
// 1. 参数位置
// GET: 参数在 URL 中
fetch('https://api.example.com/users?id=123&name=John');

// POST: 参数在请求体中
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 123, name: 'John' })
});

// 2. 参数长度
// GET: 受 URL 长度限制（浏览器通常限制在 2KB-8KB）
// POST: 理论上无限制（实际受服务器配置限制）

// 3. 安全性
// GET: 参数暴露在 URL 中，会被记录在浏览器历史、服务器日志中
// POST: 参数在请求体中，相对更安全

// 4. 缓存
// GET: 可以被缓存
// POST: 默认不会被缓存

// 5. 书签
// GET: 可以添加为书签
// POST: 不能添加为书签

// 6. 幂等性
// GET: 幂等（多次请求结果相同，不改变服务器状态）
// POST: 非幂等（可能每次请求都会创建新资源）
```

---

## 问题 2：GET 和 POST 在使用场景上有什么不同？

### GET 的使用场景

```javascript
// 1. 查询数据
// ✅ 获取用户列表
fetch('/api/users?page=1&limit=10');

// ✅ 搜索
fetch('/api/search?q=javascript&type=article');

// ✅ 获取单个资源
fetch('/api/users/123');

// ✅ 过滤和排序
fetch('/api/products?category=electronics&sort=price&order=asc');
```

```javascript
// 2. 可分享的链接
// ✅ 搜索结果页面
https://example.com/search?q=javascript

// ✅ 文章详情页
https://example.com/article/123

// ✅ 商品筛选页
https://example.com/products?category=books&price=0-50
```

### POST 的使用场景

```javascript
// 1. 提交表单数据
// ✅ 用户注册
fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john',
    password: 'secret123',
    email: 'john@example.com'
  })
});

// ✅ 用户登录
fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'john',
    password: 'secret123'
  })
});
```

```javascript
// 2. 创建资源
// ✅ 创建新文章
fetch('/api/articles', {
  method: 'POST',
  body: JSON.stringify({
    title: 'My Article',
    content: 'Article content...'
  })
});

// ✅ 上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

```javascript
// 3. 敏感数据传输
// ✅ 支付信息
fetch('/api/payment', {
  method: 'POST',
  body: JSON.stringify({
    cardNumber: '1234567890123456',
    cvv: '123',
    amount: 99.99
  })
});

// ❌ 不要用 GET 传输敏感数据
// 错误示例：密码会暴露在 URL 中
fetch('/api/login?username=john&password=secret123'); // 危险！
```

### 错误的使用示例

```javascript
// ❌ 错误：用 GET 修改数据
// 这违反了 GET 的幂等性原则
fetch('/api/users/123/delete'); // 应该使用 DELETE 方法

// ❌ 错误：用 GET 提交敏感信息
fetch('/api/login?password=123456'); // 密码会被记录在日志中

// ❌ 错误：用 POST 获取数据
// 这会导致无法缓存、无法分享链接
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ userId: 123 })
}); // 应该使用 GET /api/users/123
```

---

## 问题 3：GET 和 POST 在安全性上有什么区别？

### GET 的安全隐患

```javascript
// 1. URL 参数暴露
// ❌ 敏感信息会出现在多个地方：

// 浏览器地址栏
https://example.com/login?username=john&password=123456

// 浏览器历史记录
// 用户可以通过历史记录看到之前的 URL

// 服务器访问日志
// 192.168.1.1 - - [28/Nov/2025:14:30:00] "GET /login?password=123456 HTTP/1.1"

// Referer 头
// 如果从这个页面跳转到其他网站，URL 会通过 Referer 泄露
Referer: https://example.com/search?token=secret123
```

```javascript
// 2. 中间人攻击
// 如果使用 HTTP（非 HTTPS），URL 参数会被明文传输
// 攻击者可以在网络中拦截并查看

// ❌ HTTP GET 请求（不安全）
http://example.com/api/data?apiKey=secret123

// ✅ HTTPS GET 请求（相对安全）
https://example.com/api/data?apiKey=secret123
```

### POST 的相对安全性

```javascript
// 1. 参数不在 URL 中
// ✅ 请求体中的数据不会出现在：
// - 浏览器地址栏
// - 浏览器历史记录
// - 服务器访问日志（通常不记录请求体）

POST /api/login HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "username": "john",
  "password": "secret123"
}

// 服务器日志只会记录：
// 192.168.1.1 - - [28/Nov/2025:14:30:00] "POST /api/login HTTP/1.1"
// 不会记录密码
```

```javascript
// 2. 但 POST 也不是绝对安全
// ❌ HTTP POST 请求仍然不安全
// 请求体在网络中仍然是明文传输

// ✅ 必须使用 HTTPS
// HTTPS 会加密整个请求（包括 URL 和请求体）
fetch('https://example.com/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john',
    password: 'secret123'
  })
});
```

### 安全最佳实践

```javascript
// 1. 敏感数据必须使用 POST + HTTPS
// ✅ 正确做法
fetch('https://example.com/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john',
    password: 'secret123'
  })
});

// 2. 添加额外的安全措施
// ✅ CSRF Token
fetch('https://example.com/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken() // 防止 CSRF 攻击
  },
  body: JSON.stringify({
    username: 'john',
    password: 'secret123'
  })
});

// 3. 对敏感数据进行额外加密
// ✅ 在客户端对密码进行哈希
const hashedPassword = await hashPassword('secret123');
fetch('https://example.com/api/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'john',
    password: hashedPassword
  })
});
```

---

## 问题 4：GET 和 POST 在缓存方面有什么区别？

### GET 请求的缓存

```javascript
// GET 请求默认可以被缓存
// 浏览器会根据响应头决定是否缓存

// 服务器设置缓存响应头
app.get('/api/users', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
    'ETag': '"abc123"' // 用于验证缓存是否过期
  });
  res.json({ users: [...] });
});
```

```javascript
// 浏览器缓存行为
// 第一次请求
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data));
// 发送网络请求，服务器返回数据和缓存头

// 第二次请求（在缓存有效期内）
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data));
// ✅ 直接使用缓存，不发送网络请求

// 强制不使用缓存
fetch('/api/users', {
  cache: 'no-cache' // 或 'reload'
});
```

### POST 请求的缓存

```javascript
// POST 请求默认不会被缓存
// 因为 POST 通常用于修改服务器状态

// 即使服务器返回缓存头，浏览器也不会缓存
app.post('/api/users', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=3600' // 通常会被忽略
  });
  res.json({ success: true });
});

// 每次 POST 请求都会发送到服务器
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
});
// 总是发送网络请求，不使用缓存
```

### 利用缓存优化性能

```javascript
// 1. 对于频繁访问的数据，使用 GET + 缓存
// ✅ 用户信息（不常变化）
fetch('/api/user/profile', {
  cache: 'force-cache' // 优先使用缓存
});

// 2. 对于实时数据，禁用缓存
// ✅ 股票价格（实时变化）
fetch('/api/stock/price', {
  cache: 'no-store' // 不使用缓存
});

// 3. 使用条件请求减少数据传输
// ✅ 带 ETag 的条件请求
const etag = localStorage.getItem('users-etag');
fetch('/api/users', {
  headers: {
    'If-None-Match': etag // 如果数据未变化，服务器返回 304
  }
})
  .then(res => {
    if (res.status === 304) {
      // 使用本地缓存的数据
      return JSON.parse(localStorage.getItem('users-data'));
    }
    // 数据已更新，保存新的 ETag 和数据
    localStorage.setItem('users-etag', res.headers.get('ETag'));
    return res.json();
  });
```

---

## 总结

**核心概念总结**：

### 1. 本质区别

- **GET**：获取资源，幂等，不应修改服务器状态
- **POST**：提交数据，非幂等，可能修改服务器状态

### 2. 参数传递

- **GET**：参数在 URL 中，有长度限制
- **POST**：参数在请求体中，无长度限制

### 3. 安全性

- **GET**：参数暴露在 URL 中，会被记录
- **POST**：参数在请求体中，相对更安全
- **两者都需要 HTTPS** 才能真正安全

### 4. 缓存

- **GET**：可以被缓存，适合查询操作
- **POST**：默认不缓存，适合修改操作

### 5. 使用场景

- **GET**：查询、搜索、获取资源、可分享的链接
- **POST**：提交表单、创建资源、敏感数据传输

## 延伸阅读

- [MDN - HTTP 请求方法](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods)
- [MDN - GET](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/GET)
- [MDN - POST](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods/POST)
- [RFC 7231 - HTTP/1.1 语义和内容](https://tools.ietf.org/html/rfc7231)
- [RESTful API 设计指南](https://restfulapi.net/)
