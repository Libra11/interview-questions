---
title: 如何保持用户的登录状态
category: 网络
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  深入理解 Web 应用中保持用户登录状态的各种方案，包括 Cookie、Session、Token 等机制的原理和应用场景
tags:
  - 认证
  - Cookie
  - Session
  - Token
estimatedTime: 25 分钟
keywords:
  - 登录状态
  - Cookie
  - Session
  - JWT
  - Token
highlight: 通过 Cookie、Session 或 Token 机制，在无状态的 HTTP 协议上实现有状态的用户认证
order: 289
---

## 问题 1：为什么需要保持登录状态？

### HTTP 的无状态特性

HTTP 协议是无状态的，每个请求都是独立的：

```javascript
// 第一次请求：登录
POST /api/login
{ username: 'zhangsan', password: '123456' }

// 第二次请求：获取用户信息
GET /api/user/profile

// ⚠️ 服务器不知道这两个请求来自同一个用户
// 需要一种机制来"记住"用户的登录状态
```

### 保持登录状态的目的

- 用户不需要每次请求都输入账号密码
- 服务器能识别请求来自哪个用户
- 实现权限控制和个性化功能

---

## 问题 2：Cookie + Session 方案如何工作？

### 基本流程

```javascript
// 1. 用户登录
POST /api/login
{ username: 'zhangsan', password: '123456' }

// 2. 服务器验证成功，创建 Session
// Session 存储在服务器内存或数据库中
const session = {
  sessionId: 'abc123',
  userId: 1001,
  username: 'zhangsan',
  loginTime: '2024-11-18 10:00:00'
};

// 3. 服务器返回 Session ID（通过 Cookie）
HTTP/1.1 200 OK
Set-Cookie: sessionId=abc123; HttpOnly; Secure; Path=/

// 4. 浏览器自动保存 Cookie，后续请求自动携带
GET /api/user/profile
Cookie: sessionId=abc123

// 5. 服务器根据 Session ID 查找用户信息
const session = sessions.get('abc123');
const user = users.find(session.userId);
```

### 服务器端实现

```javascript
// Express + express-session
const session = require('express-session');

app.use(session({
  secret: 'your-secret-key',  // 用于签名 Session ID
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // 防止 XSS 攻击
    secure: true,     // 只在 HTTPS 下传输
    maxAge: 24 * 60 * 60 * 1000  // 24 小时过期
  }
}));

// 登录接口
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 验证用户名密码
  const user = await User.findOne({ username });
  if (!user || !user.validatePassword(password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  // 保存用户信息到 Session
  req.session.userId = user.id;
  req.session.username = user.username;
  
  res.json({ message: '登录成功' });
});

// 需要登录的接口
app.get('/api/user/profile', (req, res) => {
  // 检查 Session
  if (!req.session.userId) {
    return res.status(401).json({ error: '未登录' });
  }
  
  // 根据 Session 中的用户 ID 查询用户信息
  const user = User.findById(req.session.userId);
  res.json(user);
});

// 登出接口
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: '登出成功' });
});
```

### Cookie + Session 的特点

**优点**：
- 实现简单，框架支持完善
- Session 数据存储在服务器，相对安全
- 可以存储大量用户数据

**缺点**：
- 服务器需要存储 Session，占用内存
- 分布式系统需要 Session 共享（Redis）
- CSRF 攻击风险

---

## 问题 3：Token 方案如何工作？

### JWT (JSON Web Token) 方案

```javascript
// 1. 用户登录
POST /api/login
{ username: 'zhangsan', password: '123456' }

// 2. 服务器验证成功，生成 Token
const token = jwt.sign(
  { userId: 1001, username: 'zhangsan' },  // payload
  'secret-key',                             // 密钥
  { expiresIn: '24h' }                      // 过期时间
);

// 3. 返回 Token 给客户端
HTTP/1.1 200 OK
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// 4. 客户端保存 Token（localStorage 或 sessionStorage）
localStorage.setItem('token', token);

// 5. 后续请求携带 Token（通过 Authorization 头）
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 6. 服务器验证 Token
const decoded = jwt.verify(token, 'secret-key');
const userId = decoded.userId;
```

### 服务器端实现

```javascript
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your-secret-key';

// 登录接口
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 验证用户名密码
  const user = await User.findOne({ username });
  if (!user || !user.validatePassword(password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  // 生成 Token
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});

// Token 验证中间件
const authMiddleware = (req, res, next) => {
  // 从 Authorization 头获取 Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供 Token' });
  }
  
  const token = authHeader.substring(7);  // 移除 "Bearer "
  
  try {
    // 验证 Token
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;  // 将用户信息挂载到 req 上
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
};

// 需要登录的接口
app.get('/api/user/profile', authMiddleware, (req, res) => {
  // req.user 包含 Token 中的用户信息
  const user = User.findById(req.user.userId);
  res.json(user);
});
```

### 前端实现

```javascript
// 登录
async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // 保存 Token
  localStorage.setItem('token', data.token);
}

// 发起需要认证的请求
async function fetchUserProfile() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/user/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}

// 登出
function logout() {
  localStorage.removeItem('token');
}

// 使用 axios 拦截器自动添加 Token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Token 方案的特点

**优点**：
- 服务器无状态，不需要存储 Session
- 适合分布式系统和微服务架构
- 支持跨域请求
- 移动端友好

**缺点**：
- Token 一旦签发，无法主动失效（除非过期）
- Token 较长，每次请求都要携带
- 需要客户端自己管理 Token

---

## 问题 4：Cookie 和 Token 方案如何选择？

### Cookie + Session 方案

**适用场景**：
- 传统的 Web 应用（SSR）
- 同域名下的应用
- 需要服务器主动控制会话

```javascript
// 优势：服务器可以主动销毁 Session
app.post('/api/admin/kick-user', (req, res) => {
  const { userId } = req.body;
  // 删除指定用户的 Session
  sessions.delete(userId);
});
```

### Token 方案

**适用场景**：
- 前后端分离的 SPA 应用
- 移动端 APP
- 微服务架构
- 需要跨域的场景

```javascript
// 优势：无状态，易于扩展
// 多个服务器都可以验证 Token，不需要共享 Session
```

### Refresh Token 方案

结合两者优势，使用双 Token：

```javascript
// 登录时返回两个 Token
{
  "accessToken": "短期 Token（15分钟）",
  "refreshToken": "长期 Token（7天）"
}

// accessToken 用于日常请求
// refreshToken 用于刷新 accessToken

// 刷新 Token 接口
app.post('/api/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  // 验证 refreshToken
  const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
  
  // 生成新的 accessToken
  const newAccessToken = jwt.sign(
    { userId: decoded.userId },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  res.json({ accessToken: newAccessToken });
});
```

---

## 总结

**三种主流方案**：

### 1. Cookie + Session
- Session 存储在服务器
- Cookie 自动携带 Session ID
- 适合传统 Web 应用

### 2. Token (JWT)
- Token 包含用户信息
- 客户端存储，请求时携带
- 适合前后端分离和移动端

### 3. Refresh Token
- 短期 Access Token + 长期 Refresh Token
- 平衡安全性和用户体验
- 适合对安全要求高的场景

**安全建议**：
- Cookie 设置 `HttpOnly` 和 `Secure`
- Token 不要存储敏感信息
- 使用 HTTPS 传输
- 设置合理的过期时间
- 实现登出功能

---

## 延伸阅读

- [MDN - HTTP Cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [OWASP - Session Management](https://owasp.org/www-community/attacks/Session_hijacking_attack)
- [Express Session](https://github.com/expressjs/session)
