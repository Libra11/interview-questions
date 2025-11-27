---
title: Cookie 的 Max-Age 失效时间是如何工作的？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 Cookie 的 Max-Age 属性，掌握 Cookie 过期时间的设置方式，了解 Max-Age 与 Expires 的区别，以及在实际开发中如何正确使用这些属性来管理会话状态。
tags:
  - HTTP
  - Cookie
  - 会话管理
  - Web安全
estimatedTime: 20 分钟
keywords:
  - Cookie Max-Age
  - Cookie Expires
  - 会话Cookie
  - 持久Cookie
highlight: 掌握 Cookie 过期机制，理解 Max-Age 和 Expires 的区别与优先级
order: 201
---

## 问题 1：什么是 Cookie 的 Max-Age 属性？

**Max-Age** 是 Cookie 的一个属性，用于指定 Cookie 从创建时刻开始的**存活时间**（以秒为单位）。

### 基本概念

当服务器通过 `Set-Cookie` 响应头设置 Cookie 时，可以使用 Max-Age 来控制 Cookie 的生命周期：

```http
Set-Cookie: sessionId=abc123; Max-Age=3600
```

这表示 Cookie 将在创建后的 3600 秒（1 小时）后过期。

### Max-Age 的取值

Max-Age 可以有三种类型的值：

1. **正整数**：Cookie 在指定秒数后过期
   ```http
   Set-Cookie: token=xyz; Max-Age=86400  // 24小时后过期
   ```

2. **0**：立即删除 Cookie
   ```http
   Set-Cookie: token=xyz; Max-Age=0  // 立即删除
   ```

3. **负数**：创建会话 Cookie（浏览器关闭时删除）
   ```http
   Set-Cookie: temp=123; Max-Age=-1  // 会话Cookie
   ```

### 会话 Cookie vs 持久 Cookie

- **会话 Cookie**：没有设置 Max-Age 或 Expires，或 Max-Age 为负数，浏览器关闭时删除
- **持久 Cookie**：设置了 Max-Age 或 Expires，会保存到磁盘，即使浏览器关闭也不会删除

---

## 问题 2：Max-Age 和 Expires 有什么区别？

Max-Age 和 Expires 都用于控制 Cookie 的过期时间，但它们的工作方式不同。

### Expires 属性

Expires 指定一个**绝对时间点**（日期时间格式）：

```http
Set-Cookie: id=123; Expires=Wed, 27 Nov 2025 12:00:00 GMT
```

### 主要区别

| 特性 | Max-Age | Expires |
|------|---------|---------|
| **时间类型** | 相对时间（秒数） | 绝对时间（日期） |
| **计算方式** | 从 Cookie 创建时刻开始计算 | 指定具体的过期时间点 |
| **浏览器支持** | HTTP/1.1 引入 | HTTP/1.0 就存在 |
| **优先级** | 更高（如果同时存在） | 更低 |
| **时区问题** | 无时区问题 | 依赖客户端时间，可能有时区问题 |

### 代码示例

```javascript
// 使用 Max-Age（推荐）
document.cookie = "user=john; Max-Age=3600"; // 1小时后过期

// 使用 Expires
const expires = new Date();
expires.setHours(expires.getHours() + 1);
document.cookie = `user=john; Expires=${expires.toUTCString()}`;

// 同时设置（Max-Age 优先）
document.cookie = "user=john; Max-Age=7200; Expires=Wed, 27 Nov 2025 12:00:00 GMT";
// 实际会在 7200 秒后过期，而不是按 Expires 的时间
```

### 为什么 Max-Age 优先级更高？

1. **更精确**：不受客户端时间设置影响
2. **更简单**：不需要计算具体的日期时间
3. **更可靠**：避免时区转换问题

### 实际应用建议

```javascript
// ✅ 推荐：优先使用 Max-Age
function setCookie(name, value, seconds) {
  document.cookie = `${name}=${value}; Max-Age=${seconds}; Path=/; Secure; SameSite=Strict`;
}

// ⚠️ 兼容性考虑：同时设置两者
function setCookieCompat(name, value, seconds) {
  const expires = new Date(Date.now() + seconds * 1000);
  document.cookie = `${name}=${value}; Max-Age=${seconds}; Expires=${expires.toUTCString()}; Path=/`;
}
```

---

## 问题 3：如何在服务端和客户端正确设置 Cookie 的过期时间？

### 服务端设置（Node.js 示例）

```javascript
// Express.js 中设置 Cookie
app.get('/login', (req, res) => {
  // 方式1：使用 maxAge（毫秒）
  res.cookie('sessionId', 'abc123', {
    maxAge: 3600000, // 1小时（注意：这里是毫秒）
    httpOnly: true,  // 防止 XSS 攻击
    secure: true,    // 仅 HTTPS 传输
    sameSite: 'strict' // 防止 CSRF 攻击
  });
  
  // 方式2：使用 expires（Date 对象）
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  res.cookie('token', 'xyz789', {
    expires: expires,
    httpOnly: true
  });
  
  res.send('Cookie set successfully');
});

// 删除 Cookie
app.get('/logout', (req, res) => {
  // 方式1：设置 maxAge 为 0
  res.cookie('sessionId', '', { maxAge: 0 });
  
  // 方式2：设置过去的时间
  res.cookie('token', '', { expires: new Date(0) });
  
  res.send('Logged out');
});
```

### 客户端设置（JavaScript）

```javascript
// Cookie 工具类
class CookieManager {
  // 设置 Cookie
  static set(name, value, options = {}) {
    const {
      maxAge = 86400,        // 默认1天
      path = '/',
      domain = '',
      secure = true,
      sameSite = 'Strict'
    } = options;
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    // 添加 Max-Age
    if (maxAge !== undefined) {
      cookieString += `; Max-Age=${maxAge}`;
    }
    
    // 添加其他属性
    cookieString += `; Path=${path}`;
    if (domain) cookieString += `; Domain=${domain}`;
    if (secure) cookieString += `; Secure`;
    if (sameSite) cookieString += `; SameSite=${sameSite}`;
    
    document.cookie = cookieString;
  }
  
  // 获取 Cookie
  static get(name) {
    const cookies = document.cookie.split('; ');
    for (let cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (decodeURIComponent(key) === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  
  // 删除 Cookie
  static delete(name, path = '/') {
    // 设置 Max-Age 为 0
    document.cookie = `${name}=; Max-Age=0; Path=${path}`;
  }
}

// 使用示例
CookieManager.set('user', 'john', { maxAge: 3600 }); // 1小时
CookieManager.set('session', 'temp', { maxAge: -1 }); // 会话Cookie
const user = CookieManager.get('user');
CookieManager.delete('user');
```

### 常见的过期时间设置

```javascript
// 常用时间常量
const TIME = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,  // 30天
  YEAR: 31536000   // 365天
};

// 不同场景的设置
// 1. 短期会话（30分钟）
CookieManager.set('shortSession', 'value', { maxAge: TIME.MINUTE * 30 });

// 2. 记住我功能（7天）
CookieManager.set('rememberMe', 'true', { maxAge: TIME.WEEK });

// 3. 长期令牌（30天）
CookieManager.set('refreshToken', 'token', { maxAge: TIME.MONTH });

// 4. 临时数据（会话）
CookieManager.set('tempData', 'data', { maxAge: -1 });
```

---

## 问题 4：Cookie 过期时间在实际应用中有哪些注意事项？

### 1. 安全性考虑

```javascript
// ✅ 敏感 Cookie 应该设置较短的过期时间
app.post('/login', (req, res) => {
  // 访问令牌：短期有效（15分钟）
  res.cookie('accessToken', generateToken(), {
    maxAge: 900000, // 15分钟
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  
  // 刷新令牌：长期有效（7天）
  res.cookie('refreshToken', generateRefreshToken(), {
    maxAge: 604800000, // 7天
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/refresh' // 限制路径
  });
});

// ❌ 避免：敏感信息设置过长时间
res.cookie('password', 'secret', { maxAge: 31536000000 }); // 危险！
```

### 2. 时钟同步问题

```javascript
// 使用 Max-Age 避免客户端时钟不准确的问题
// ✅ 推荐
res.cookie('session', 'id', { maxAge: 3600000 });

// ⚠️ Expires 依赖客户端时钟
const expires = new Date(Date.now() + 3600000);
res.cookie('session', 'id', { expires }); // 如果客户端时间不准，可能立即过期
```

### 3. Cookie 续期策略

```javascript
// 滑动过期时间：每次请求都刷新过期时间
app.use((req, res, next) => {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    // 验证 session 有效性
    if (isValidSession(sessionId)) {
      // 刷新 Cookie 过期时间
      res.cookie('sessionId', sessionId, {
        maxAge: 1800000, // 重置为30分钟
        httpOnly: true,
        secure: true
      });
    }
  }
  
  next();
});

// 绝对过期时间：无论如何都会在固定时间过期
app.post('/login', (req, res) => {
  const absoluteExpiry = new Date();
  absoluteExpiry.setHours(23, 59, 59, 999); // 当天结束
  
  res.cookie('dailySession', 'id', {
    expires: absoluteExpiry,
    httpOnly: true
  });
});
```

### 4. 跨域和子域共享

```javascript
// 主域名设置，子域名共享
res.cookie('sharedData', 'value', {
  maxAge: 86400000,
  domain: '.example.com', // 所有子域名都能访问
  path: '/'
});

// 特定子域名
res.cookie('subData', 'value', {
  maxAge: 86400000,
  domain: 'api.example.com', // 仅此子域名
  path: '/'
});
```

### 5. 浏览器限制

```javascript
// 注意浏览器对 Cookie 的限制
// - 单个域名最多 50-180 个 Cookie（不同浏览器不同）
// - 单个 Cookie 最大 4KB
// - 总大小限制约 4KB-10KB

// ✅ 合理使用 Cookie
function setEssentialCookies() {
  // 只存储必要信息
  CookieManager.set('userId', '123', { maxAge: 86400 });
  CookieManager.set('sessionId', 'abc', { maxAge: 3600 });
}

// ❌ 避免：存储大量数据
// 应该使用 localStorage 或 sessionStorage
CookieManager.set('largeData', JSON.stringify(bigObject)); // 不推荐
```

### 6. 删除 Cookie 的正确方式

```javascript
// 删除 Cookie 时，Path 和 Domain 必须匹配
// ✅ 正确
res.cookie('data', 'value', { 
  maxAge: 3600000, 
  path: '/admin',
  domain: '.example.com'
});

// 删除时必须匹配相同的 path 和 domain
res.cookie('data', '', { 
  maxAge: 0,
  path: '/admin',        // 必须相同
  domain: '.example.com' // 必须相同
});

// ❌ 错误：path 不匹配，无法删除
res.cookie('data', '', { maxAge: 0 }); // 默认 path 是当前路径
```

## 总结

**Cookie Max-Age 核心要点**：

### 1. Max-Age 基础

- Max-Age 指定 Cookie 从创建开始的存活秒数
- 正数表示持久 Cookie，0 表示立即删除，负数表示会话 Cookie
- 优先级高于 Expires 属性

### 2. 实际应用

- 敏感 Cookie 使用短过期时间（15-30分钟）
- 刷新令牌使用较长时间（7-30天）
- 优先使用 Max-Age 而非 Expires
- 删除 Cookie 时注意 Path 和 Domain 匹配

### 3. 安全建议

- 始终配合 HttpOnly、Secure、SameSite 使用
- 实现合理的续期策略
- 避免在 Cookie 中存储敏感信息
- 注意浏览器的 Cookie 数量和大小限制

## 延伸阅读

- [MDN - Set-Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie)
- [MDN - Document.cookie](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie)
- [RFC 6265 - HTTP State Management Mechanism](https://datatracker.ietf.org/doc/html/rfc6265)
- [OWASP - Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Cookie 的 SameSite 属性](https://web.dev/samesite-cookies-explained/)
