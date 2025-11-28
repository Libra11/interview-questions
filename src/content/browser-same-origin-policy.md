---
title: 浏览器有同源策略
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解浏览器同源策略的概念、限制范围和跨域解决方案，掌握前端安全的基础知识
tags:
  - 浏览器
  - 安全
  - 跨域
  - 同源策略
estimatedTime: 25 分钟
keywords:
  - 同源策略
  - 跨域
  - CORS
  - 浏览器安全
highlight: 同源策略是浏览器最核心的安全机制，理解它是掌握跨域问题的关键
order: 1
---

## 问题 1：什么是同源策略？

同源策略（Same-Origin Policy）是浏览器最核心的安全机制，它限制了一个源（origin）的文档或脚本如何与另一个源的资源进行交互。

### 什么是"同源"？

两个 URL 如果满足以下三个条件，就被认为是同源的：

1. **协议相同**（protocol）：如 http 和 https
2. **域名相同**（host）：如 example.com 和 www.example.com
3. **端口相同**（port）：如 80 和 8080

```javascript
// 假设当前页面的 URL 是：http://www.example.com:80/page.html

// ✅ 同源
http://www.example.com:80/other.html  // 协议、域名、端口都相同

// ❌ 不同源
https://www.example.com:80/page.html  // 协议不同（https vs http）
http://api.example.com:80/page.html   // 域名不同（api.example.com vs www.example.com）
http://www.example.com:8080/page.html // 端口不同（8080 vs 80）
```

### 为什么需要同源策略？

同源策略的主要目的是**保护用户数据安全**，防止恶意网站窃取其他网站的数据。

举个例子：假设你登录了银行网站 `bank.com`，浏览器会保存你的登录凭证（cookie）。如果没有同源策略，你访问的恶意网站 `evil.com` 就可以通过 JavaScript 向 `bank.com` 发送请求，获取你的账户信息，因为请求会自动携带 cookie。

```javascript
// 如果没有同源策略，恶意网站可以这样做：
// 在 evil.com 的页面中
fetch('https://bank.com/api/account')
  .then(res => res.json())
  .then(data => {
    // 窃取用户的银行账户信息
    sendToEvilServer(data);
  });
```

---

## 问题 2：同源策略限制了哪些行为？

同源策略主要限制以下三个方面：

### 1. DOM 访问限制

不同源的页面无法访问彼此的 DOM。

```javascript
// 在 a.com 的页面中打开了 b.com 的 iframe
const iframe = document.getElementById('myIframe');

// ❌ 无法访问不同源 iframe 的 DOM
try {
  const iframeDoc = iframe.contentDocument;
  console.log(iframeDoc.body); // 报错：Blocked a frame with origin...
} catch (e) {
  console.error('跨域访问被阻止');
}
```

### 2. Cookie、LocalStorage 和 IndexedDB 访问限制

不同源的页面无法读取彼此的存储数据。

```javascript
// 在 a.com 设置的 cookie
document.cookie = 'user=admin';

// 在 b.com 无法读取 a.com 的 cookie
console.log(document.cookie); // 只能看到 b.com 自己的 cookie
```

### 3. AJAX 请求限制

不同源的页面无法直接发送 AJAX 请求获取响应数据。

```javascript
// 在 a.com 的页面中
fetch('https://b.com/api/data')
  .then(res => res.json())
  .catch(err => {
    // ❌ 报错：CORS policy: No 'Access-Control-Allow-Origin' header
    console.error(err);
  });
```

**注意**：请求实际上已经发送到服务器，服务器也返回了响应，但浏览器会拦截响应数据，不让 JavaScript 读取。

### 不受限制的跨域资源

以下资源的加载不受同源策略限制：

```html
<!-- ✅ 可以跨域加载 -->
<script src="https://cdn.example.com/lib.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/style.css">
<img src="https://cdn.example.com/image.jpg">
<video src="https://cdn.example.com/video.mp4"></video>
<iframe src="https://other.com/page.html"></iframe>
```

---

## 问题 3：如何解决跨域问题？

### 1. CORS（跨域资源共享）

CORS 是最标准的跨域解决方案，通过服务器设置响应头来允许跨域请求。

```javascript
// 服务器端设置（Node.js Express 示例）
app.use((req, res, next) => {
  // 允许指定源访问
  res.header('Access-Control-Allow-Origin', 'https://a.com');
  // 允许携带凭证（cookie）
  res.header('Access-Control-Allow-Credentials', 'true');
  // 允许的请求方法
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // 允许的请求头
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
```

```javascript
// 前端发送请求
fetch('https://b.com/api/data', {
  credentials: 'include' // 携带 cookie
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### 2. JSONP

JSONP 利用 `<script>` 标签不受同源策略限制的特性，只支持 GET 请求。

```javascript
// 前端代码
function handleResponse(data) {
  console.log('接收到数据：', data);
}

// 动态创建 script 标签
const script = document.createElement('script');
script.src = 'https://b.com/api/data?callback=handleResponse';
document.body.appendChild(script);
```

```javascript
// 服务器返回（Node.js 示例）
app.get('/api/data', (req, res) => {
  const callback = req.query.callback;
  const data = { name: 'John', age: 30 };
  // 返回函数调用形式的 JavaScript 代码
  res.send(`${callback}(${JSON.stringify(data)})`);
});
```

### 3. 代理服务器

通过同源的服务器代理请求，绕过浏览器的同源策略限制。

```javascript
// 开发环境配置（Vite 示例）
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://b.com', // 目标服务器
        changeOrigin: true, // 修改请求头中的 origin
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
};
```

```javascript
// 前端请求同源路径
fetch('/api/data') // 实际请求 https://b.com/data
  .then(res => res.json())
  .then(data => console.log(data));
```

### 4. postMessage

用于不同源的窗口（如 iframe、弹窗）之间通信。

```javascript
// 在 a.com 的页面中
const iframe = document.getElementById('myIframe');
// 向 iframe 发送消息
iframe.contentWindow.postMessage('Hello from a.com', 'https://b.com');

// 接收来自 iframe 的消息
window.addEventListener('message', (event) => {
  // 验证消息来源
  if (event.origin !== 'https://b.com') return;
  console.log('收到消息：', event.data);
});
```

```javascript
// 在 b.com 的 iframe 页面中
// 接收来自父页面的消息
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://a.com') return;
  console.log('收到消息：', event.data);
  
  // 回复消息
  event.source.postMessage('Hello from b.com', event.origin);
});
```

### 5. WebSocket

WebSocket 协议不受同源策略限制。

```javascript
// 建立 WebSocket 连接
const ws = new WebSocket('wss://b.com/socket');

ws.onopen = () => {
  console.log('连接已建立');
  ws.send('Hello Server');
};

ws.onmessage = (event) => {
  console.log('收到消息：', event.data);
};
```

---

## 问题 4：CORS 预检请求是什么？

对于某些跨域请求，浏览器会先发送一个 OPTIONS 请求（预检请求）来确认服务器是否允许实际请求。

### 什么情况会触发预检请求？

**简单请求**不会触发预检，需要同时满足：

1. 请求方法是 GET、HEAD 或 POST
2. 请求头只包含简单头部（如 Accept、Content-Type 等）
3. Content-Type 只能是 `text/plain`、`multipart/form-data` 或 `application/x-www-form-urlencoded`

**非简单请求**会触发预检：

```javascript
// 这个请求会触发预检（使用了自定义头部）
fetch('https://b.com/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value' // 自定义头部
  },
  body: JSON.stringify({ name: 'John' })
});
```

### 预检请求的流程

```javascript
// 1. 浏览器先发送 OPTIONS 预检请求
OPTIONS /api/data HTTP/1.1
Host: b.com
Origin: https://a.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, X-Custom-Header

// 2. 服务器响应预检请求
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Custom-Header
Access-Control-Max-Age: 86400  // 预检结果缓存时间（秒）

// 3. 预检通过后，浏览器发送实际请求
POST /api/data HTTP/1.1
Host: b.com
Origin: https://a.com
Content-Type: application/json
X-Custom-Header: value
```

---

## 总结

**核心概念总结**：

### 1. 同源策略的本质

- 浏览器的安全机制，限制不同源之间的资源访问
- 同源需要满足：协议、域名、端口完全相同
- 主要保护用户数据不被恶意网站窃取

### 2. 同源策略的限制范围

- DOM 访问：无法访问不同源页面的 DOM
- 存储访问：无法读取不同源的 Cookie、LocalStorage
- AJAX 请求：无法直接获取不同源的响应数据
- 资源加载：script、img、link 等标签不受限制

### 3. 跨域解决方案

- **CORS**：最标准的方案，服务器设置响应头
- **JSONP**：利用 script 标签，只支持 GET
- **代理**：通过同源服务器转发请求
- **postMessage**：用于窗口间通信
- **WebSocket**：不受同源策略限制

### 4. CORS 预检机制

- 非简单请求会触发 OPTIONS 预检
- 预检通过后才发送实际请求
- 可通过 Max-Age 缓存预检结果

## 延伸阅读

- [MDN - 浏览器的同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [MDN - 跨源资源共享（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [阮一峰 - 浏览器同源政策及其规避方法](https://www.ruanyifeng.com/blog/2016/04/same-origin-policy.html)
- [阮一峰 - 跨域资源共享 CORS 详解](https://www.ruanyifeng.com/blog/2016/04/cors.html)
- [W3C - CORS 规范](https://www.w3.org/TR/cors/)
