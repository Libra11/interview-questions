---
title: cookie 可以实现不同域共享吗
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 Cookie 的域限制机制，掌握跨域共享 Cookie 的方法和安全注意事项
tags:
  - Cookie
  - 跨域
  - 浏览器
  - 安全
estimatedTime: 20 分钟
keywords:
  - Cookie
  - 跨域
  - Domain
  - SameSite
highlight: Cookie 可以在同一主域的子域之间共享，但完全不同的域之间无法直接共享
order: 2
---

## 问题 1：Cookie 的域限制是什么？

Cookie 默认只能在设置它的域名下访问，这是浏览器的安全机制。

### Cookie 的基本域规则

```javascript
// 在 www.example.com 设置 Cookie
document.cookie = 'user=admin';

// ✅ 在 www.example.com 可以访问
console.log(document.cookie); // "user=admin"

// ❌ 在 other.com 无法访问
console.log(document.cookie); // 看不到 www.example.com 的 Cookie
```

### Cookie 的域属性

设置 Cookie 时可以指定 `domain` 属性来控制哪些域可以访问：

```javascript
// 服务器端设置（Node.js Express 示例）
res.cookie('user', 'admin', {
  domain: '.example.com', // 注意前面的点
  path: '/',
  maxAge: 86400000 // 1天
});
```

```javascript
// 前端设置
document.cookie = 'user=admin; domain=.example.com; path=/';
```

**重要规则**：

1. 如果不指定 `domain`，默认为当前域名（不包含子域）
2. 如果指定 `domain=.example.com`，则所有子域都可以访问
3. 不能设置其他域的 Cookie（浏览器会拒绝）

---

## 问题 2：如何实现同一主域下的子域共享 Cookie？

通过设置 `domain` 属性为主域名，可以让所有子域共享 Cookie。

### 实现方式

```javascript
// 在 www.example.com 设置 Cookie
document.cookie = 'token=abc123; domain=.example.com; path=/';

// ✅ 以下域名都可以访问这个 Cookie：
// - www.example.com
// - api.example.com
// - admin.example.com
// - example.com
```

### 服务器端设置示例

```javascript
// Node.js Express
app.get('/login', (req, res) => {
  res.cookie('sessionId', 'xyz789', {
    domain: '.example.com', // 主域名
    path: '/',
    httpOnly: true, // 防止 JavaScript 访问
    secure: true, // 只在 HTTPS 下传输
    sameSite: 'lax', // CSRF 保护
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
  });
  
  res.json({ success: true });
});
```

### 注意事项

```javascript
// ❌ 错误：不能设置其他主域的 Cookie
// 在 a.com 尝试设置 b.com 的 Cookie
document.cookie = 'user=admin; domain=.b.com'; // 浏览器会忽略

// ❌ 错误：不能设置顶级域的 Cookie
document.cookie = 'user=admin; domain=.com'; // 浏览器会拒绝

// ✅ 正确：只能设置当前域或其父域
// 在 api.example.com 可以设置：
document.cookie = 'user=admin; domain=.example.com'; // ✅
document.cookie = 'user=admin; domain=api.example.com'; // ✅
```

---

## 问题 3：完全不同的域如何共享数据？

完全不同的域（如 `a.com` 和 `b.com`）无法直接共享 Cookie，但可以通过其他方式实现数据共享。

### 1. 通过第三方域中转

利用一个共同的第三方域来存储和传递数据。

```javascript
// 在 a.com 的页面中
// 1. 将数据发送到第三方域 auth.com
fetch('https://auth.com/set-token', {
  method: 'POST',
  credentials: 'include', // 携带 Cookie
  body: JSON.stringify({ token: 'abc123' })
});

// 2. auth.com 设置 Cookie
// 服务器端（auth.com）
app.post('/set-token', (req, res) => {
  const { token } = req.body;
  res.cookie('shared_token', token, {
    domain: '.auth.com',
    httpOnly: true,
    secure: true
  });
  res.json({ success: true });
});

// 3. 在 b.com 的页面中读取
fetch('https://auth.com/get-token', {
  credentials: 'include' // 携带 auth.com 的 Cookie
})
  .then(res => res.json())
  .then(data => {
    console.log('获取到共享的 token:', data.token);
  });
```

### 2. 使用 URL 参数传递

```javascript
// 在 a.com 跳转到 b.com 时携带参数
const token = getCookie('token');
window.location.href = `https://b.com/page?token=${token}`;

// 在 b.com 接收参数并设置 Cookie
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
  document.cookie = `token=${token}; domain=.b.com; path=/`;
}
```

### 3. 使用 iframe + postMessage

```javascript
// 在 a.com 的页面中
const iframe = document.createElement('iframe');
iframe.src = 'https://b.com/receiver.html';
iframe.style.display = 'none';
document.body.appendChild(iframe);

iframe.onload = () => {
  const token = getCookie('token');
  // 向 b.com 的 iframe 发送消息
  iframe.contentWindow.postMessage(
    { type: 'SET_TOKEN', token },
    'https://b.com'
  );
};
```

```javascript
// 在 b.com/receiver.html 中
window.addEventListener('message', (event) => {
  // 验证消息来源
  if (event.origin !== 'https://a.com') return;
  
  if (event.data.type === 'SET_TOKEN') {
    // 设置 Cookie
    document.cookie = `token=${event.data.token}; domain=.b.com; path=/`;
    // 通知父页面设置成功
    event.source.postMessage({ type: 'SUCCESS' }, event.origin);
  }
});
```

### 4. 使用 LocalStorage + iframe

```javascript
// 在 a.com 的页面中
const iframe = document.createElement('iframe');
iframe.src = 'https://b.com/storage.html';
document.body.appendChild(iframe);

iframe.onload = () => {
  iframe.contentWindow.postMessage(
    { type: 'SET_DATA', key: 'token', value: 'abc123' },
    'https://b.com'
  );
};
```

```javascript
// 在 b.com/storage.html 中
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://a.com') return;
  
  if (event.data.type === 'SET_DATA') {
    // 存储到 b.com 的 LocalStorage
    localStorage.setItem(event.data.key, event.data.value);
  }
});
```

---

## 问题 4：跨域携带 Cookie 需要注意什么？

在跨域请求中携带 Cookie 需要满足特定条件，并注意安全设置。

### 1. CORS 配置

```javascript
// 服务器端必须设置
app.use((req, res, next) => {
  // ❌ 不能使用通配符
  // res.header('Access-Control-Allow-Origin', '*');
  
  // ✅ 必须指定具体的源
  res.header('Access-Control-Allow-Origin', 'https://a.com');
  
  // ✅ 必须设置为 true
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});
```

### 2. 前端请求配置

```javascript
// Fetch API
fetch('https://b.com/api/data', {
  credentials: 'include' // 必须设置
})
  .then(res => res.json());

// XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.withCredentials = true; // 必须设置
xhr.open('GET', 'https://b.com/api/data');
xhr.send();

// Axios
axios.get('https://b.com/api/data', {
  withCredentials: true // 必须设置
});
```

### 3. Cookie 的 SameSite 属性

```javascript
// 服务器设置 Cookie
res.cookie('token', 'abc123', {
  sameSite: 'none', // 允许跨站发送
  secure: true, // SameSite=None 必须配合 Secure
  httpOnly: true,
  domain: '.example.com'
});
```

**SameSite 属性说明**：

- `Strict`：完全禁止跨站发送
- `Lax`（默认）：部分跨站场景可以发送（如链接跳转）
- `None`：允许跨站发送（必须配合 `Secure` 使用）

```javascript
// 不同 SameSite 值的行为
document.cookie = 'token1=abc; sameSite=strict'; // 最严格
document.cookie = 'token2=def; sameSite=lax';    // 中等
document.cookie = 'token3=ghi; sameSite=none; secure'; // 最宽松
```

### 4. 安全注意事项

```javascript
// ✅ 推荐的安全配置
res.cookie('sessionId', value, {
  httpOnly: true,     // 防止 XSS 攻击
  secure: true,       // 只在 HTTPS 下传输
  sameSite: 'lax',    // 防止 CSRF 攻击
  maxAge: 3600000,    // 设置过期时间
  domain: '.example.com', // 限制域范围
  path: '/'           // 限制路径范围
});
```

---

## 总结

**核心概念总结**：

### 1. Cookie 的域限制

- Cookie 默认只能在设置它的域名下访问
- 可以通过 `domain` 属性设置为主域，实现子域共享
- 不能设置其他主域或顶级域的 Cookie

### 2. 同主域子域共享

- 设置 `domain=.example.com` 可以让所有子域访问
- 包括 www.example.com、api.example.com 等
- 需要注意安全性，避免敏感信息泄露

### 3. 不同主域的数据共享

- 无法直接共享 Cookie
- 可以通过第三方域中转、URL 参数、postMessage 等方式
- 需要权衡安全性和实现复杂度

### 4. 跨域携带 Cookie 的要求

- 服务器必须设置正确的 CORS 头
- 前端必须设置 `credentials: 'include'`
- Cookie 需要设置 `sameSite=none; secure`
- 注意安全配置：httpOnly、secure、sameSite

## 延伸阅读

- [MDN - HTTP Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies)
- [MDN - Document.cookie](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie)
- [MDN - SameSite Cookie](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Chrome - SameSite Cookie 说明](https://www.chromium.org/updates/same-site)
- [OWASP - Cookie 安全](https://owasp.org/www-community/controls/SecureCookieAttribute)
