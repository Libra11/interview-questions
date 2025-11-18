---
title: 常见的登录鉴权方式有哪些
category: 网络
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  全面了解 Web 应用中常见的身份认证和授权方式，包括 Session、JWT、OAuth、SSO 等方案的原理和应用场景
tags:
  - 认证
  - 授权
  - Session
  - JWT
  - OAuth
estimatedTime: 25 分钟
keywords:
  - 登录鉴权
  - Session
  - JWT
  - OAuth
  - SSO
  - 单点登录
highlight: 掌握 Session、JWT、OAuth 等主流鉴权方案，根据场景选择合适的认证方式
order: 102
---

## 问题 1：Session-Cookie 鉴权如何工作？

### 基本流程

```javascript
// 1. 用户登录
POST /api/login
{ username: 'zhangsan', password: '123456' }

// 2. 服务器验证成功，创建 Session
const session = {
  sessionId: 'abc123',
  userId: 1001,
  username: 'zhangsan'
};
// 存储到服务器（内存/Redis）
sessions.set('abc123', session);

// 3. 返回 Session ID（通过 Cookie）
Set-Cookie: sessionId=abc123; HttpOnly; Secure; Path=/

// 4. 后续请求自动携带 Cookie
GET /api/user/profile
Cookie: sessionId=abc123

// 5. 服务器验证 Session
const session = sessions.get('abc123');
if (session) {
  // 已登录
  return userProfile;
}
```

### 服务器端实现

```javascript
// Express + express-session
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (user && user.validatePassword(password)) {
    req.session.userId = user.id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

// 鉴权中间件
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: '未登录' });
  }
}

// 需要登录的接口
app.get('/api/user/profile', requireAuth, (req, res) => {
  const user = User.findById(req.session.userId);
  res.json(user);
});
```

**优缺点**：
- ✅ 服务器完全控制 Session
- ✅ 可以随时撤销
- ❌ 服务器需要存储 Session
- ❌ 分布式系统需要 Session 共享

---

## 问题 2：JWT 鉴权如何工作？

### JWT 结构

```javascript
// JWT 由三部分组成，用 . 分隔
// Header.Payload.Signature

// Header（头部）
{
  "alg": "HS256",  // 算法
  "typ": "JWT"     // 类型
}

// Payload（载荷）
{
  "userId": 1001,
  "username": "zhangsan",
  "exp": 1700000000  // 过期时间
}

// Signature（签名）
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### 基本流程

```javascript
// 1. 用户登录
POST /api/login
{ username: 'zhangsan', password: '123456' }

// 2. 服务器验证成功，生成 JWT
const token = jwt.sign(
  { userId: 1001, username: 'zhangsan' },
  'secret-key',
  { expiresIn: '24h' }
);

// 3. 返回 Token
{ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

// 4. 客户端存储 Token（localStorage）
localStorage.setItem('token', token);

// 5. 后续请求携带 Token
GET /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 6. 服务器验证 Token
const decoded = jwt.verify(token, 'secret-key');
// { userId: 1001, username: 'zhangsan' }
```

### 服务器端实现

```javascript
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key';

// 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (user && user.validatePassword(password)) {
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

// 鉴权中间件
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供 Token' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// 需要登录的接口
app.get('/api/user/profile', requireAuth, (req, res) => {
  const user = User.findById(req.user.userId);
  res.json(user);
});
```

**优缺点**：
- ✅ 无状态，服务器不需要存储
- ✅ 适合分布式系统
- ✅ 支持跨域
- ❌ 无法主动撤销（除非过期）
- ❌ Token 较长

---

## 问题 3：OAuth 2.0 是什么？

### OAuth 2.0 流程

```javascript
// 场景：使用微信登录第三方网站

// 1. 用户点击"微信登录"
// 跳转到微信授权页面
https://open.weixin.qq.com/connect/oauth2/authorize?
  appid=YOUR_APP_ID&
  redirect_uri=https://yoursite.com/callback&
  response_type=code&
  scope=snsapi_userinfo

// 2. 用户同意授权

// 3. 微信重定向回网站，携带授权码
https://yoursite.com/callback?code=AUTHORIZATION_CODE

// 4. 网站用授权码换取 Access Token
POST https://api.weixin.qq.com/sns/oauth2/access_token
{
  appid: YOUR_APP_ID,
  secret: YOUR_APP_SECRET,
  code: AUTHORIZATION_CODE,
  grant_type: authorization_code
}

// 5. 获取 Access Token
{
  access_token: "ACCESS_TOKEN",
  expires_in: 7200,
  refresh_token: "REFRESH_TOKEN",
  openid: "USER_OPENID"
}

// 6. 使用 Access Token 获取用户信息
GET https://api.weixin.qq.com/sns/userinfo?
  access_token=ACCESS_TOKEN&
  openid=USER_OPENID
```

### 服务器端实现

```javascript
// 微信登录回调
app.get('/auth/wechat/callback', async (req, res) => {
  const { code } = req.query;
  
  // 1. 用授权码换取 Access Token
  const tokenResponse = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    params: {
      appid: process.env.WECHAT_APP_ID,
      secret: process.env.WECHAT_APP_SECRET,
      code,
      grant_type: 'authorization_code'
    }
  });
  
  const { access_token, openid } = tokenResponse.data;
  
  // 2. 获取用户信息
  const userResponse = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
    params: { access_token, openid }
  });
  
  const wechatUser = userResponse.data;
  
  // 3. 查找或创建本地用户
  let user = await User.findOne({ wechatOpenId: openid });
  if (!user) {
    user = await User.create({
      wechatOpenId: openid,
      nickname: wechatUser.nickname,
      avatar: wechatUser.headimgurl
    });
  }
  
  // 4. 生成本地 Token
  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '7d' });
  
  // 5. 重定向到前端，携带 Token
  res.redirect(`https://yoursite.com/login-success?token=${token}`);
});
```

---

## 问题 4：SSO 单点登录如何实现？

### SSO 原理

```javascript
// 场景：公司有多个系统（A、B、C），登录一次即可访问所有系统

// 1. 用户访问系统 A
https://system-a.com

// 2. 系统 A 检查本地是否有登录凭证
// 没有，重定向到 SSO 认证中心
https://sso.company.com/login?redirect=https://system-a.com

// 3. 用户在 SSO 中心登录
POST https://sso.company.com/login
{ username: 'zhangsan', password: '123456' }

// 4. SSO 中心验证成功，生成全局 Token
// 重定向回系统 A，携带 Token
https://system-a.com?token=GLOBAL_TOKEN

// 5. 系统 A 验证 Token，创建本地 Session
// 用户可以访问系统 A

// 6. 用户访问系统 B
https://system-b.com

// 7. 系统 B 检查本地无登录凭证
// 重定向到 SSO 中心
https://sso.company.com/login?redirect=https://system-b.com

// 8. SSO 中心检查全局 Session，发现已登录
// 直接重定向回系统 B，携带 Token
https://system-b.com?token=GLOBAL_TOKEN

// 9. 系统 B 验证 Token，创建本地 Session
// 用户可以访问系统 B（无需再次登录）
```

### CAS 协议实现

```javascript
// SSO 认证中心
app.get('/sso/login', (req, res) => {
  const { redirect } = req.query;
  
  // 检查全局 Session
  if (req.session.userId) {
    // 已登录，生成 Token 并重定向
    const token = generateToken(req.session.userId);
    res.redirect(`${redirect}?token=${token}`);
  } else {
    // 未登录，显示登录页面
    res.render('login', { redirect });
  }
});

// 子系统验证 Token
app.get('/auth/callback', async (req, res) => {
  const { token } = req.query;
  
  // 向 SSO 中心验证 Token
  const response = await axios.get('https://sso.company.com/verify', {
    params: { token }
  });
  
  if (response.data.valid) {
    // Token 有效，创建本地 Session
    req.session.userId = response.data.userId;
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});
```

---

## 总结

**核心要点**：

### 1. Session-Cookie
- 服务器存储 Session
- Cookie 自动携带
- 适合传统 Web 应用

### 2. JWT
- 无状态，服务器不存储
- 客户端存储 Token
- 适合前后端分离、微服务

### 3. OAuth 2.0
- 第三方登录
- 授权码模式
- 适合社交登录

### 4. SSO
- 单点登录
- 多系统共享认证
- 适合企业内部系统

### 5. 选择建议
- **传统 Web**：Session-Cookie
- **SPA/移动端**：JWT
- **第三方登录**：OAuth 2.0
- **多系统**：SSO

---

## 延伸阅读

- [MDN - HTTP Cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
- [JWT.io](https://jwt.io/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [CAS Protocol](https://apereo.github.io/cas/6.6.x/protocol/CAS-Protocol.html)
