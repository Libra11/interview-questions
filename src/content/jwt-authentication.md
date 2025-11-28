---
title: 什么是 JWT
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 JWT（JSON Web Token）的结构、工作原理和使用场景，掌握无状态身份验证的实现方法
tags:
  - JWT
  - 身份验证
  - Token
  - 安全
estimatedTime: 25 分钟
keywords:
  - JWT
  - JSON Web Token
  - Token认证
  - 无状态认证
highlight: JWT 是一种无状态的身份验证方案，通过签名保证 Token 的完整性和真实性
order: 9
---

## 问题 1：什么是 JWT？

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。它是一个紧凑的、URL 安全的字符串，包含了用户身份信息和其他声明。

### JWT 的基本结构

```javascript
// JWT 由三部分组成，用点（.）分隔
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// 分解后：
Header.Payload.Signature

// 1. Header（头部）
{
  "alg": "HS256",  // 签名算法
  "typ": "JWT"     // Token 类型
}

// 2. Payload（载荷）
{
  "sub": "1234567890",      // Subject（用户 ID）
  "name": "John Doe",       // 自定义声明
  "iat": 1516239022         // Issued At（签发时间）
}

// 3. Signature（签名）
// 使用密钥对 Header 和 Payload 进行签名
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### JWT 的工作流程

```javascript
// 1. 用户登录
用户 -> 发送用户名和密码 -> 服务器

// 2. 服务器验证并生成 JWT
服务器 -> 验证用户名和密码
      -> 生成 JWT
      -> 返回 JWT 给用户

// 3. 用户携带 JWT 访问资源
用户 -> 在请求头中携带 JWT -> 服务器
      Authorization: Bearer <JWT>

// 4. 服务器验证 JWT
服务器 -> 验证 JWT 签名
      -> 解析 Payload 获取用户信息
      -> 返回受保护的资源
```

---

## 问题 2：如何生成和验证 JWT？

### 生成 JWT

```javascript
// 使用 jsonwebtoken 库
const jwt = require('jsonwebtoken');

// 1. 定义 Payload
const payload = {
  sub: '1234567890',      // 用户 ID
  name: 'John Doe',       // 用户名
  email: 'john@example.com',
  role: 'admin',          // 用户角色
  iat: Math.floor(Date.now() / 1000)  // 签发时间
};

// 2. 定义密钥
const secret = 'your-secret-key';

// 3. 生成 JWT
const token = jwt.sign(payload, secret, {
  expiresIn: '1h'  // 1 小时后过期
});

console.log(token);
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
// 完整的登录示例
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 1. 验证用户名和密码
  const user = await User.findOne({ username });
  if (!user || !await user.comparePassword(password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  // 2. 生成 JWT
  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h',  // 24 小时过期
      issuer: 'my-app',  // 签发者
      audience: 'my-app-users'  // 受众
    }
  );
  
  // 3. 返回 Token
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});
```

### 验证 JWT

```javascript
// 验证 JWT
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, secret);
    console.log('Token 有效:', decoded);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token 已过期');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Token 无效');
    }
    return null;
  }
}
```

```javascript
// 中间件：验证请求中的 JWT
function authenticateToken(req, res, next) {
  // 1. 从请求头获取 Token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ error: '缺少 Token' });
  }
  
  // 2. 验证 Token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token 已过期' });
      }
      return res.status(403).json({ error: 'Token 无效' });
    }
    
    // 3. 将用户信息附加到请求对象
    req.user = user;
    next();
  });
}

// 使用中间件保护路由
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: '这是受保护的资源',
    user: req.user
  });
});
```

### 前端使用 JWT

```javascript
// 1. 登录并保存 Token
async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // 保存 Token 到 localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

// 2. 在请求中携带 Token
async function fetchProtectedData() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/protected', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token 过期或无效，跳转到登录页
    window.location.href = '/login';
    return;
  }
  
  const data = await response.json();
  return data;
}

// 3. 退出登录
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

---

## 问题 3：JWT 有哪些优缺点？

### JWT 的优点

```javascript
// 1. 无状态（Stateless）
// 服务器不需要存储 Session
// 所有信息都在 Token 中

// 传统 Session 方式
用户登录 -> 服务器创建 Session -> 存储在内存/数据库
用户请求 -> 携带 Session ID -> 服务器查询 Session

// JWT 方式
用户登录 -> 服务器生成 JWT -> 返回给用户
用户请求 -> 携带 JWT -> 服务器验证签名（不需要查询数据库）

// ✅ 优势：减轻服务器负担，易于扩展
```

```javascript
// 2. 跨域友好
// JWT 可以在不同域名之间传递

// 场景：前后端分离
前端（https://app.example.com）
后端（https://api.example.com）

// 使用 JWT
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// ✅ 不受同源策略限制
```

```javascript
// 3. 适合移动应用
// 移动应用不支持 Cookie
// JWT 可以存储在本地，在请求头中发送

// iOS/Android 应用
const token = await AsyncStorage.getItem('token');
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

```javascript
// 4. 支持分布式系统
// 多个服务器可以使用相同的密钥验证 JWT
// 不需要共享 Session 存储

服务器 1 -> 验证 JWT（使用相同密钥）
服务器 2 -> 验证 JWT（使用相同密钥）
服务器 3 -> 验证 JWT（使用相同密钥）

// ✅ 易于水平扩展
```

### JWT 的缺点

```javascript
// 1. 无法主动失效
// Token 一旦签发，在过期前一直有效
// 即使用户退出登录，Token 仍然可用

// 问题场景：
用户登录 -> 获得 Token（有效期 24 小时）
用户退出登录 -> Token 仍然有效
攻击者获得 Token -> 可以继续使用

// 解决方案：
// - 设置较短的过期时间
// - 使用刷新 Token 机制
// - 维护 Token 黑名单（但这违背了无状态的初衷）
```

```javascript
// 2. Payload 不加密
// Payload 只是 Base64 编码，不是加密
// 任何人都可以解码查看内容

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0...';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// { sub: "1234567890", name: "John Doe" }

// ⚠️ 不要在 Payload 中存储敏感信息
// ❌ 密码、信用卡号等
// ✅ 用户 ID、用户名、角色等
```

```javascript
// 3. Token 体积较大
// JWT 包含完整的用户信息，体积比 Session ID 大

// Session ID: 32 字节
sessionId: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

// JWT: 200+ 字节
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

// ⚠️ 每次请求都要传输，增加带宽消耗
```

```javascript
// 4. 无法更新用户信息
// Token 中的用户信息是静态的
// 如果用户信息变更，需要重新登录

// 场景：
用户登录 -> Token 包含 { role: 'user' }
管理员将用户升级为管理员 -> role 变为 'admin'
用户继续使用旧 Token -> 仍然是 { role: 'user' }

// 解决方案：
// - 设置较短的过期时间，强制刷新
// - 在关键操作时重新验证用户信息
```

---

## 问题 4：如何实现 Token 刷新机制？

### 双 Token 机制

```javascript
// 使用 Access Token 和 Refresh Token

// Access Token: 短期有效（15 分钟）
// Refresh Token: 长期有效（7 天）

// 登录时返回两个 Token
app.post('/api/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  
  // 生成 Access Token（短期）
  const accessToken = jwt.sign(
    { sub: user.id, username: user.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
  
  // 生成 Refresh Token（长期）
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  // 将 Refresh Token 存储到数据库
  await saveRefreshToken(user.id, refreshToken);
  
  res.json({
    accessToken,
    refreshToken
  });
});
```

```javascript
// 刷新 Access Token
app.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: '缺少 Refresh Token' });
  }
  
  try {
    // 1. 验证 Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // 2. 检查 Refresh Token 是否在数据库中
    const isValid = await checkRefreshToken(decoded.sub, refreshToken);
    if (!isValid) {
      return res.status(403).json({ error: 'Refresh Token 无效' });
    }
    
    // 3. 生成新的 Access Token
    const newAccessToken = jwt.sign(
      { sub: decoded.sub, username: decoded.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ error: 'Refresh Token 无效或已过期' });
  }
});
```

```javascript
// 前端自动刷新 Token
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// 请求拦截器：自动添加 Token
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// 响应拦截器：自动刷新 Token
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 如果是 401 错误且未重试过
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 使用 Refresh Token 获取新的 Access Token
        const response = await axios.post('/api/refresh', {
          refreshToken
        });
        
        accessToken = response.data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        
        // 重试原始请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh Token 也失效，跳转到登录页
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 总结

**核心概念总结**：

### 1. JWT 的结构

- **Header**：算法和类型
- **Payload**：用户信息和声明
- **Signature**：签名，保证完整性

### 2. JWT 的优势

- 无状态，不需要服务器存储
- 跨域友好，适合前后端分离
- 支持分布式系统
- 适合移动应用

### 3. JWT 的劣势

- 无法主动失效
- Payload 不加密，不能存储敏感信息
- Token 体积较大
- 无法实时更新用户信息

### 4. 最佳实践

- 使用 HTTPS 传输 Token
- 设置合理的过期时间
- 使用双 Token 机制（Access + Refresh）
- 不在 Payload 中存储敏感信息
- 在关键操作时重新验证用户身份

## 延伸阅读

- [JWT 官方网站](https://jwt.io/)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [MDN - JSON Web Token](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Auth0 - JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [OWASP - JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
