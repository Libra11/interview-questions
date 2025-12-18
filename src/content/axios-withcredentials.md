---
title: axios 的 withCredentials 配置有什么作用？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 axios withCredentials 配置项的作用，掌握跨域请求中 Cookie 和认证信息的传递机制，了解 CORS 凭证模式的工作原理，以及在实际开发中如何正确配置跨域认证。
tags:
  - axios
  - CORS
  - Cookie
  - 跨域请求
estimatedTime: 22 分钟
keywords:
  - withCredentials
  - CORS凭证
  - 跨域Cookie
  - axios配置
highlight: 掌握 withCredentials 的作用和配置方法，理解跨域请求中的凭证传递机制
order: 474
---

## 问题 1：withCredentials 是什么，有什么作用？

**withCredentials** 是一个布尔值配置项，用于控制跨域请求是否携带**凭证**（Credentials）。

### 基本概念

```javascript
// axios 配置
axios.get('https://api.example.com/data', {
  withCredentials: true  // 携带凭证
});

// 凭证包括：
const credentials = {
  cookies: 'HTTP Cookie',
  authorization: 'Authorization 头',
  tlsCertificates: 'TLS 客户端证书'
};
```

### 默认行为

```javascript
// 同源请求：自动携带凭证
// 浏览器自动发送 Cookie
fetch('https://example.com/api/data');  // 同源
// Cookie: sessionId=abc123  ✅ 自动携带

// 跨域请求：默认不携带凭证
fetch('https://api.other.com/data');  // 跨域
// Cookie: (无)  ❌ 不携带

// 跨域请求 + withCredentials
fetch('https://api.other.com/data', {
  credentials: 'include'  // fetch API 的写法
});
// Cookie: sessionId=abc123  ✅ 携带

// axios 写法
axios.get('https://api.other.com/data', {
  withCredentials: true  // axios 的写法
});
```

### 为什么需要 withCredentials？

```javascript
// 场景：前后端分离，不同域名
const scenario = {
  frontend: 'https://www.example.com',
  backend: 'https://api.example.com',
  
  problem: `
    用户在 www.example.com 登录后
    服务器设置了 Cookie: sessionId=abc123
    
    前端请求 api.example.com 时
    默认不会携带 Cookie
    → 服务器无法识别用户身份
    → 认证失败
  `,
  
  solution: `
    设置 withCredentials: true
    → 跨域请求携带 Cookie
    → 服务器可以识别用户
    → 认证成功
  `
};
```

---

## 问题 2：withCredentials 如何配置和使用？

### axios 中的配置方式

```javascript
// 方式1：单个请求配置
axios.get('/api/user', {
  withCredentials: true
});

axios.post('/api/login', data, {
  withCredentials: true
});

// 方式2：全局配置
axios.defaults.withCredentials = true;

// 所有请求都携带凭证
axios.get('/api/user');
axios.post('/api/data', data);

// 方式3：实例配置
const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true  // 该实例的所有请求都携带凭证
});

apiClient.get('/user');
apiClient.post('/data', data);

// 方式4：拦截器中动态设置
axios.interceptors.request.use(config => {
  // 只对特定域名启用
  if (config.url.includes('api.example.com')) {
    config.withCredentials = true;
  }
  return config;
});
```

### fetch API 中的配置

```javascript
// fetch 使用 credentials 选项
fetch('https://api.example.com/data', {
  credentials: 'include'  // 等同于 withCredentials: true
});

// credentials 的三个值
const credentialsModes = {
  'omit': '从不发送凭证',
  'same-origin': '同源时发送（默认）',
  'include': '总是发送（等同于 withCredentials: true）'
};

// 示例
// 1. 不发送凭证
fetch('/api/data', {
  credentials: 'omit'
});

// 2. 同源时发送（默认）
fetch('/api/data', {
  credentials: 'same-origin'
});

// 3. 总是发送
fetch('https://api.other.com/data', {
  credentials: 'include'
});
```

### 服务器端配置（必需！）

```javascript
// Node.js/Express 示例
const express = require('express');
const cors = require('cors');
const app = express();

// ⚠️ 重要：服务器必须正确配置 CORS
app.use(cors({
  origin: 'https://www.example.com',  // 必须指定具体域名
  credentials: true  // 允许凭证
}));

// 等同于手动设置响应头
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://www.example.com');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// ❌ 错误：使用通配符
app.use(cors({
  origin: '*',  // 不能使用 * 
  credentials: true  // 会导致 CORS 错误
}));
// 错误信息：
// Access to fetch at 'https://api.example.com/data' from origin 
// 'https://www.example.com' has been blocked by CORS policy: 
// The value of the 'Access-Control-Allow-Origin' header in the 
// response must not be the wildcard '*' when the request's 
// credentials mode is 'include'.
```

---

## 问题 3：withCredentials 的工作原理是什么？

### 完整的跨域凭证请求流程

```javascript
// 1. 客户端发起请求
// 前端代码
axios.post('https://api.example.com/login', {
  username: 'john',
  password: 'secret'
}, {
  withCredentials: true
});

// 2. 浏览器发送预检请求（OPTIONS）
// 如果是简单请求则跳过此步骤
OPTIONS https://api.example.com/login
Origin: https://www.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type

// 3. 服务器响应预检请求
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://www.example.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true  // ⭐ 关键
Access-Control-Max-Age: 86400

// 4. 浏览器发送实际请求
POST https://api.example.com/login
Origin: https://www.example.com
Cookie: sessionId=abc123  // ⭐ 携带 Cookie
Content-Type: application/json

{ "username": "john", "password": "secret" }

// 5. 服务器响应
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://www.example.com
Access-Control-Allow-Credentials: true
Set-Cookie: sessionId=xyz789; SameSite=None; Secure

{ "success": true, "user": { "name": "John" } }

// 6. 浏览器保存新的 Cookie
// 下次请求会自动携带 sessionId=xyz789
```

### Cookie 的 SameSite 属性

```javascript
// 跨域携带 Cookie 需要正确设置 SameSite
const cookieSettings = {
  // ❌ 默认：SameSite=Lax（不允许跨域发送）
  default: 'sessionId=abc123; SameSite=Lax',
  
  // ✅ 跨域：必须设置 SameSite=None 和 Secure
  crossOrigin: 'sessionId=abc123; SameSite=None; Secure',
  
  // 说明
  explanation: `
    SameSite=None: 允许跨域发送
    Secure: 只在 HTTPS 下发送（SameSite=None 的必需配置）
  `
};

// 服务器端设置
app.post('/login', (req, res) => {
  // 验证用户...
  
  res.cookie('sessionId', 'xyz789', {
    httpOnly: true,      // 防止 XSS
    secure: true,        // 只在 HTTPS 下发送
    sameSite: 'none',    // 允许跨域
    maxAge: 86400000     // 1天
  });
  
  res.json({ success: true });
});
```

### 安全限制

```javascript
// withCredentials: true 时的限制
const restrictions = {
  // 1. Access-Control-Allow-Origin 不能是 *
  origin: {
    wrong: 'Access-Control-Allow-Origin: *',
    correct: 'Access-Control-Allow-Origin: https://www.example.com'
  },
  
  // 2. Access-Control-Allow-Headers 不能是 *
  headers: {
    wrong: 'Access-Control-Allow-Headers: *',
    correct: 'Access-Control-Allow-Headers: Content-Type, Authorization'
  },
  
  // 3. Access-Control-Allow-Methods 不能是 *
  methods: {
    wrong: 'Access-Control-Allow-Methods: *',
    correct: 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE'
  },
  
  // 4. 必须设置 Access-Control-Allow-Credentials: true
  credentials: {
    required: 'Access-Control-Allow-Credentials: true'
  }
};

// 服务器端正确配置
app.use(cors({
  origin: function(origin, callback) {
    // 白名单
    const allowedOrigins = [
      'https://www.example.com',
      'https://app.example.com'
    ];
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

---

## 问题 4：使用 withCredentials 有哪些注意事项？

### 1. 安全性考虑

```javascript
// ⚠️ CSRF 攻击风险
const csrfRisk = {
  problem: `
    withCredentials: true 会自动携带 Cookie
    恶意网站可能利用这一点发起 CSRF 攻击
  `,
  
  example: `
    // 恶意网站 evil.com 的代码
    axios.post('https://api.example.com/transfer', {
      to: 'attacker',
      amount: 1000
    }, {
      withCredentials: true  // 会携带用户的 Cookie
    });
    
    // 如果用户已登录 example.com
    // 这个请求会成功执行！
  `,
  
  solution: 'CSRF Token'
};

// ✅ 防护措施：CSRF Token
// 服务器端
app.use(csrf());

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/api/transfer', (req, res) => {
  // 验证 CSRF Token
  // express-csrf 中间件会自动验证
  res.json({ success: true });
});

// 客户端
// 1. 获取 CSRF Token
const { csrfToken } = await axios.get('/api/csrf-token', {
  withCredentials: true
}).then(res => res.data);

// 2. 在请求中携带 Token
axios.post('/api/transfer', {
  to: 'recipient',
  amount: 100
}, {
  withCredentials: true,
  headers: {
    'X-CSRF-Token': csrfToken  // 携带 CSRF Token
  }
});
```

### 2. 开发环境配置

```javascript
// 开发环境的代理配置
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        credentials: true,  // 转发凭证
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
};

// webpack.config.js (Create React App)
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        credentials: true
      }
    }
  }
};

// 使用代理后，前端请求同源路径
axios.get('/api/user', {
  withCredentials: true  // 实际会转发到 api.example.com
});
```

### 3. 多域名支持

```javascript
// 服务器端：动态设置 Access-Control-Allow-Origin
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // 白名单
  const allowedOrigins = [
    'https://www.example.com',
    'https://app.example.com',
    'https://mobile.example.com'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// 客户端：根据环境动态设置
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true
});

// .env.development
// REACT_APP_API_URL=http://localhost:3000

// .env.production
// REACT_APP_API_URL=https://api.example.com
```

### 4. 第三方 Cookie 限制

```javascript
// ⚠️ 浏览器的第三方 Cookie 限制
const thirdPartyCookieIssue = {
  problem: `
    Safari、Firefox 等浏览器默认阻止第三方 Cookie
    即使设置 withCredentials: true 也可能无效
  `,
  
  browsers: {
    Safari: '默认阻止所有第三方 Cookie',
    Firefox: '默认阻止已知跟踪器的第三方 Cookie',
    Chrome: '计划在未来版本中阻止第三方 Cookie'
  },
  
  solutions: [
    '使用同一主域名（example.com 的子域名）',
    '使用代理服务器',
    '使用 Token 认证代替 Cookie',
    '引导用户手动允许第三方 Cookie'
  ]
};

// ✅ 解决方案1：使用 Token 认证
// 服务器端
app.post('/login', (req, res) => {
  // 验证用户...
  const token = generateJWT(user);
  
  // 返回 Token 而不是设置 Cookie
  res.json({ token });
});

// 客户端
const login = async (username, password) => {
  const { token } = await axios.post('/api/login', {
    username,
    password
  }).then(res => res.data);
  
  // 保存到 localStorage
  localStorage.setItem('token', token);
};

// 后续请求携带 Token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 解决方案2：使用子域名
const domainStrategy = {
  frontend: 'app.example.com',
  backend: 'api.example.com',
  
  // Cookie 设置在主域名
  cookie: 'sessionId=abc123; Domain=.example.com; SameSite=None; Secure',
  
  // 子域名之间可以共享 Cookie
  note: 'app.example.com 和 api.example.com 都能访问这个 Cookie'
};
```

### 5. 调试技巧

```javascript
// 检查请求是否携带凭证
axios.interceptors.request.use(config => {
  console.log('withCredentials:', config.withCredentials);
  console.log('URL:', config.url);
  return config;
});

// 检查响应头
axios.interceptors.response.use(response => {
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
    'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
  });
  return response;
});

// Chrome DevTools
// 1. Network 标签 → 查看请求头
//    - Cookie: 是否携带
//    - Origin: 请求来源
// 2. 查看响应头
//    - Access-Control-Allow-Origin
//    - Access-Control-Allow-Credentials
//    - Set-Cookie
// 3. Application 标签 → Cookies
//    - 查看 Cookie 的 SameSite 和 Secure 属性
```

## 总结

**withCredentials 核心要点**：

### 1. 基本作用

- 控制跨域请求是否携带凭证（Cookie、Authorization 等）
- 默认跨域请求不携带凭证
- 设置为 true 后携带凭证

### 2. 配置要求

- **客户端**：设置 `withCredentials: true`
- **服务器**：设置 `Access-Control-Allow-Credentials: true`
- **服务器**：`Access-Control-Allow-Origin` 不能是 `*`
- **Cookie**：必须设置 `SameSite=None; Secure`

### 3. 安全注意

- 防范 CSRF 攻击（使用 CSRF Token）
- 严格限制允许的域名（白名单）
- 考虑使用 Token 认证代替 Cookie
- 注意浏览器的第三方 Cookie 限制

### 4. 最佳实践

- 生产环境使用 HTTPS
- 合理设置 Cookie 的 SameSite 属性
- 开发环境使用代理避免跨域
- 使用拦截器统一处理认证

## 延伸阅读

- [MDN - XMLHttpRequest.withCredentials](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/withCredentials)
- [MDN - CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [MDN - SameSite cookies](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [axios Documentation](https://axios-http.com/docs/req_config)
- [OWASP - CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
