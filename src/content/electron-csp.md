---
title: 如何使用 CSP（Content Security Policy）？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍在 Electron 中配置 CSP 的方法，通过限制资源加载来防止 XSS 和代码注入攻击。
tags:
  - Electron
  - 安全
  - CSP
  - 内容安全策略
estimatedTime: 12 分钟
keywords:
  - CSP
  - 内容安全策略
  - 安全头
highlight: CSP 通过限制脚本、样式等资源的来源，有效防止 XSS 攻击
order: 217
---

## 问题 1：什么是 CSP？

### CSP 的作用

```
Content Security Policy（内容安全策略）告诉浏览器：
- 哪些来源的脚本可以执行
- 哪些来源的样式可以加载
- 哪些来源的图片可以显示
- 是否允许 eval() 和内联脚本
```

### CSP 指令

```
default-src  - 默认策略
script-src   - JavaScript 来源
style-src    - CSS 来源
img-src      - 图片来源
font-src     - 字体来源
connect-src  - XHR/Fetch 请求目标
frame-src    - iframe 来源
object-src   - 插件来源
```

---

## 问题 2：如何在 Electron 中设置 CSP？

### 方法 1：HTML meta 标签

```html
<!DOCTYPE html>
<html>
  <head>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'"
    />
  </head>
  <body>
    <!-- 内容 -->
  </body>
</html>
```

### 方法 2：HTTP 响应头

```javascript
// main.js
const { session } = require("electron");

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
        ].join("; "),
      },
    });
  });
});
```

---

## 问题 3：常见的 CSP 配置

### 严格配置（推荐）

```javascript
const strictCSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
].join("; ");
```

### 允许内联样式

```javascript
// 如果使用 CSS-in-JS 或内联样式
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // 允许内联样式
  "img-src 'self' data: blob:",
].join("; ");
```

### 允许特定外部资源

```javascript
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https://cdn.example.com",
  "connect-src 'self' https://api.example.com",
].join("; ");
```

---

## 问题 4：如何处理 CSP 违规？

### 监听违规报告

```javascript
// renderer.js
document.addEventListener("securitypolicyviolation", (e) => {
  console.error("CSP 违规:", {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
  });

  // 发送到主进程记录
  window.api.reportCSPViolation({
    blockedURI: e.blockedURI,
    directive: e.violatedDirective,
  });
});
```

### 使用 report-uri

```javascript
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "report-uri /csp-report", // 违规报告端点
].join("; ");
```

---

## 问题 5：CSP 与常见框架的兼容

### React

```javascript
// React 通常兼容严格 CSP
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // styled-components 需要
].join("; ");
```

### Vue

```javascript
// Vue 开发模式可能需要 eval
const devCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'", // 开发模式
  "style-src 'self' 'unsafe-inline'",
].join("; ");

const prodCSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
].join("; ");

const csp = process.env.NODE_ENV === "development" ? devCSP : prodCSP;
```

### 使用 nonce

```javascript
// 生成随机 nonce
const crypto = require("crypto");
const nonce = crypto.randomBytes(16).toString("base64");

// CSP 中使用 nonce
const csp = `script-src 'self' 'nonce-${nonce}'`;

// HTML 中使用
// <script nonce="${nonce}">...</script>
```

## 延伸阅读

- [MDN CSP 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [CSP 评估工具](https://csp-evaluator.withgoogle.com/)
- [Electron CSP 指南](https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy)
