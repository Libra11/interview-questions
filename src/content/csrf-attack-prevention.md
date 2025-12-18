---
title: 跨站请求伪造（Cross-Site Request Forgery, CSRF）具体实现步骤是啥， 如何防止？
category: 安全
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 CSRF 攻击的原理和实现步骤，掌握多种防御方法保护 Web 应用安全
tags:
  - CSRF
  - 安全
  - Web安全
  - 防御
estimatedTime: 25 分钟
keywords:
  - CSRF
  - 跨站请求伪造
  - CSRF Token
  - SameSite Cookie
highlight: CSRF 利用用户的登录状态发起恶意请求，通过 Token 验证和 SameSite Cookie 可有效防御
order: 120
---

## 问题 1：什么是 CSRF 攻击？

CSRF（Cross-Site Request Forgery，跨站请求伪造）是一种攻击方式，攻击者诱导用户在已登录的网站上执行非本意的操作。

### CSRF 攻击的原理

```javascript
// CSRF 攻击利用了浏览器的自动携带 Cookie 机制

// 正常流程：
// 1. 用户登录 bank.com
用户 -> bank.com: 登录
bank.com -> 用户: 设置 Cookie (sessionId=abc123)

// 2. 用户访问 bank.com 转账页面
用户 -> bank.com: GET /transfer?to=alice&amount=100
请求头: Cookie: sessionId=abc123
bank.com: 验证 Cookie -> 执行转账

// CSRF 攻击流程：
// 1. 用户已登录 bank.com（Cookie 仍然有效）
// 2. 用户访问恶意网站 evil.com
// 3. evil.com 包含恶意代码，向 bank.com 发起请求

// evil.com 的恶意代码：
<img src="https://bank.com/transfer?to=attacker&amount=10000">

// 或者：
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>
  document.forms[0].submit();
</script>

// 4. 浏览器自动携带 bank.com 的 Cookie
请求: POST https://bank.com/transfer
请求头: Cookie: sessionId=abc123  // 自动携带
请求体: to=attacker&amount=10000

// 5. bank.com 验证 Cookie 通过，执行转账
// ❌ 用户在不知情的情况下向攻击者转账
```

---

## 问题 2：CSRF 攻击的具体实现步骤

### 攻击场景 1：GET 请求攻击

```javascript
// 目标网站：bank.com
// 假设转账接口（不安全的设计）：
app.get('/transfer', (req, res) => {
  const { to, amount } = req.query;
  const sessionId = req.cookies.sessionId;
  
  // 验证 session
  if (isValidSession(sessionId)) {
    // 执行转账
    transfer(sessionId, to, amount);
    res.send('转账成功');
  } else {
    res.status(401).send('未登录');
  }
});

// 攻击者创建恶意页面 evil.com/attack.html
<!DOCTYPE html>
<html>
<head>
  <title>免费领取奖品</title>
</head>
<body>
  <h1>恭喜你中奖了！</h1>
  <p>正在为您领取奖品...</p>
  
  <!-- 隐藏的恶意请求 -->
  <img src="https://bank.com/transfer?to=attacker&amount=10000" style="display:none">
  
  <!-- 或者使用 iframe -->
  <iframe src="https://bank.com/transfer?to=attacker&amount=10000" style="display:none"></iframe>
</body>
</html>

// 攻击步骤：
// 1. 用户登录 bank.com
// 2. 用户点击攻击者发送的链接，访问 evil.com/attack.html
// 3. 页面加载时，img 标签自动发起 GET 请求
// 4. 浏览器自动携带 bank.com 的 Cookie
// 5. 转账成功，用户毫不知情
```

### 攻击场景 2：POST 请求攻击

```javascript
// 目标网站：bank.com
app.post('/transfer', (req, res) => {
  const { to, amount } = req.body;
  const sessionId = req.cookies.sessionId;
  
  if (isValidSession(sessionId)) {
    transfer(sessionId, to, amount);
    res.send('转账成功');
  } else {
    res.status(401).send('未登录');
  }
});

// 攻击者创建恶意页面
<!DOCTYPE html>
<html>
<body>
  <h1>加载中...</h1>
  
  <!-- 自动提交的表单 -->
  <form id="attackForm" action="https://bank.com/transfer" method="POST">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="10000">
  </form>
  
  <script>
    // 页面加载后自动提交表单
    document.getElementById('attackForm').submit();
  </script>
</body>
</html>

// 攻击步骤：
// 1. 用户登录 bank.com
// 2. 用户访问 evil.com
// 3. 页面加载后自动提交表单
// 4. 浏览器自动携带 Cookie
// 5. 转账成功
```

### 攻击场景 3：AJAX 请求攻击

```javascript
// 恶意页面使用 AJAX 发起请求
<!DOCTYPE html>
<html>
<body>
  <h1>正在加载...</h1>
  
  <script>
    // 使用 fetch 发起请求
    fetch('https://bank.com/transfer', {
      method: 'POST',
      credentials: 'include',  // 携带 Cookie
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'attacker',
        amount: 10000
      })
    })
    .then(res => res.json())
    .then(data => console.log('攻击成功:', data))
    .catch(err => console.log('攻击失败:', err));
  </script>
</body>
</html>

// ⚠️ 注意：
// 这种攻击通常会被 CORS 策略阻止
// 除非目标网站配置了 Access-Control-Allow-Origin: *
// 或者允许了攻击者的域名
```

---

## 问题 3：如何防御 CSRF 攻击？

### 防御方法 1：CSRF Token

```javascript
// 最常用的防御方法：使用 CSRF Token

// 服务器端实现
const crypto = require('crypto');

// 1. 生成 CSRF Token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 2. 在用户登录时生成 Token
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (authenticate(username, password)) {
    const sessionId = generateSessionId();
    const csrfToken = generateCSRFToken();
    
    // 保存到 session
    sessions[sessionId] = {
      username,
      csrfToken
    };
    
    // 设置 Cookie
    res.cookie('sessionId', sessionId, { httpOnly: true });
    
    // 返回 CSRF Token（不要放在 Cookie 中）
    res.json({
      success: true,
      csrfToken: csrfToken
    });
  }
});

// 3. 验证 CSRF Token
function verifyCSRFToken(req, res, next) {
  const sessionId = req.cookies.sessionId;
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  
  const session = sessions[sessionId];
  
  if (!session || session.csrfToken !== csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

// 4. 在需要保护的路由上使用
app.post('/transfer', verifyCSRFToken, (req, res) => {
  const { to, amount } = req.body;
  const sessionId = req.cookies.sessionId;
  
  transfer(sessionId, to, amount);
  res.json({ success: true });
});
```

```javascript
// 前端使用 CSRF Token

// 1. 登录后保存 Token
async function login(username, password) {
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // 保存 CSRF Token 到内存或 localStorage
  window.csrfToken = data.csrfToken;
  localStorage.setItem('csrfToken', data.csrfToken);
}

// 2. 在请求中携带 Token
async function transfer(to, amount) {
  const csrfToken = localStorage.getItem('csrfToken');
  
  const response = await fetch('/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken  // 在请求头中携带
    },
    body: JSON.stringify({ to, amount })
  });
  
  return response.json();
}

// 3. 或者在表单中携带 Token
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <input type="text" name="to">
  <input type="number" name="amount">
  <button type="submit">转账</button>
</form>
```

### 防御方法 2：SameSite Cookie

```javascript
// SameSite Cookie 属性可以防止跨站请求携带 Cookie

// 服务器设置 SameSite Cookie
app.post('/login', (req, res) => {
  const sessionId = generateSessionId();
  
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,  // 只在 HTTPS 下传输
    sameSite: 'strict'  // 或 'lax'
  });
  
  res.json({ success: true });
});

// SameSite 属性的值：
// - Strict: 完全禁止跨站发送 Cookie
// - Lax: 部分跨站场景可以发送（如链接跳转）
// - None: 允许跨站发送（必须配合 Secure 使用）

// Strict 模式
res.cookie('sessionId', sessionId, {
  sameSite: 'strict'
});

// 行为：
// - 从 evil.com 发起的请求不会携带 Cookie
// - 从 bank.com 的链接跳转会携带 Cookie
// - 从 bank.com 的表单提交会携带 Cookie

// Lax 模式（默认）
res.cookie('sessionId', sessionId, {
  sameSite: 'lax'
});

// 行为：
// - GET 请求的链接跳转会携带 Cookie
// - POST 请求不会携带 Cookie（除非是同站）
// - img、iframe 等标签不会携带 Cookie

// ✅ 推荐使用 Lax 或 Strict
```

### 防御方法 3：验证 Referer 和 Origin

```javascript
// 检查请求来源

function verifyOrigin(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  const allowedOrigins = ['https://bank.com', 'https://www.bank.com'];
  
  // 检查 Origin
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid origin' });
  }
  
  // 检查 Referer
  if (referer && !referer.startsWith('https://bank.com')) {
    return res.status(403).json({ error: 'Invalid referer' });
  }
  
  next();
}

app.post('/transfer', verifyOrigin, (req, res) => {
  // 处理转账
});

// ⚠️ 注意：
// - Referer 可以被用户禁用
// - 某些浏览器扩展会修改 Referer
// - 不应作为唯一的防御手段
```

### 防御方法 4：双重 Cookie 验证

```javascript
// 双重 Cookie 验证：在 Cookie 和请求参数中都携带 Token

// 服务器端
app.post('/login', (req, res) => {
  const sessionId = generateSessionId();
  const csrfToken = generateCSRFToken();
  
  // 1. 在 Cookie 中设置 Token
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,  // 允许 JavaScript 读取
    sameSite: 'strict'
  });
  
  // 2. 在 session 中也设置
  res.cookie('sessionId', sessionId, {
    httpOnly: true
  });
  
  res.json({ success: true });
});

// 验证
function verifyDoubleSubmitCookie(req, res, next) {
  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.headers['x-csrf-token'];
  
  if (!cookieToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

app.post('/transfer', verifyDoubleSubmitCookie, (req, res) => {
  // 处理转账
});
```

```javascript
// 前端
async function transfer(to, amount) {
  // 从 Cookie 中读取 Token
  const csrfToken = getCookie('csrfToken');
  
  const response = await fetch('/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken  // 在请求头中也携带
    },
    credentials: 'include',
    body: JSON.stringify({ to, amount })
  });
  
  return response.json();
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```

### 防御方法 5：用户交互确认

```javascript
// 对于敏感操作，要求用户额外确认

// 前端
async function transfer(to, amount) {
  // 1. 显示确认对话框
  const confirmed = confirm(`确认向 ${to} 转账 ${amount} 元吗？`);
  
  if (!confirmed) {
    return;
  }
  
  // 2. 要求输入密码
  const password = prompt('请输入支付密码：');
  
  // 3. 发送请求
  const response = await fetch('/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ to, amount, password })
  });
  
  return response.json();
}

// 服务器端验证密码
app.post('/transfer', verifyCSRFToken, (req, res) => {
  const { to, amount, password } = req.body;
  const sessionId = req.cookies.sessionId;
  
  // 验证支付密码
  if (!verifyPaymentPassword(sessionId, password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  transfer(sessionId, to, amount);
  res.json({ success: true });
});
```

---

## 问题 4：CSRF 防御的最佳实践

### 综合防御策略

```javascript
// 推荐的综合防御方案

// 1. 使用 CSRF Token（主要防御）
// 2. 设置 SameSite Cookie（辅助防御）
// 3. 验证 Origin/Referer（额外保护）
// 4. 敏感操作要求二次确认

// 服务器端完整实现
const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

const app = express();

app.use(express.json());
app.use(cookieParser());

// 1. 配置 CSRF 保护
const csrfProtection = csrf({
  cookie: {
    httpOnly: false,  // 允许前端读取
    sameSite: 'strict',
    secure: true
  }
});

// 2. 设置安全的 Cookie
app.post('/login', (req, res) => {
  const sessionId = generateSessionId();
  
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  });
  
  res.json({ success: true });
});

// 3. 验证 Origin
function verifyOrigin(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// 4. 保护敏感操作
app.post('/transfer', 
  verifyOrigin,
  csrfProtection,
  (req, res) => {
    const { to, amount, password } = req.body;
    const sessionId = req.cookies.sessionId;
    
    // 验证 session
    if (!isValidSession(sessionId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 验证支付密码
    if (!verifyPaymentPassword(sessionId, password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // 执行转账
    transfer(sessionId, to, amount);
    
    res.json({ success: true });
  }
);

// 5. 提供 CSRF Token 接口
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.listen(3000);
```

```javascript
// 前端完整实现
class APIClient {
  constructor() {
    this.csrfToken = null;
    this.init();
  }
  
  async init() {
    // 获取 CSRF Token
    const response = await fetch('/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    this.csrfToken = data.csrfToken;
  }
  
  async request(url, options = {}) {
    // 确保有 CSRF Token
    if (!this.csrfToken) {
      await this.init();
    }
    
    // 添加 CSRF Token
    const headers = {
      ...options.headers,
      'X-CSRF-Token': this.csrfToken
    };
    
    // 发送请求
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    // 如果 Token 失效，重新获取
    if (response.status === 403) {
      await this.init();
      return this.request(url, options);
    }
    
    return response;
  }
  
  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }
}

// 使用
const api = new APIClient();

async function transfer(to, amount) {
  const password = prompt('请输入支付密码：');
  
  const response = await api.post('/transfer', {
    to,
    amount,
    password
  });
  
  const data = await response.json();
  return data;
}
```

---

## 总结

**核心概念总结**：

### 1. CSRF 攻击原理

- 利用浏览器自动携带 Cookie 的机制
- 诱导用户在已登录网站执行非本意操作
- 攻击者无法获取响应内容，只能执行操作

### 2. 攻击实现方式

- GET 请求：img、iframe 标签
- POST 请求：自动提交的表单
- AJAX 请求：需要 CORS 配合

### 3. 防御方法

- **CSRF Token**：最有效的防御（推荐）
- **SameSite Cookie**：简单有效（推荐）
- **验证 Origin/Referer**：辅助防御
- **双重 Cookie**：无需服务器状态
- **用户确认**：敏感操作的额外保护

### 4. 最佳实践

- 使用 CSRF Token + SameSite Cookie
- 验证请求来源
- 敏感操作要求二次确认
- 使用 HTTPS
- 定期更新 Token

## 延伸阅读

- [OWASP - CSRF](https://owasp.org/www-community/attacks/csrf)
- [MDN - SameSite Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [csurf - CSRF middleware](https://github.com/expressjs/csurf)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
