---
title: HTTP 向 HTTPS 做重定向应该如何实现
category: 网络
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  了解如何正确实现 HTTP 到 HTTPS 的重定向，包括状态码选择、HSTS 策略以及常见的服务器配置方法
tags:
  - HTTP
  - HTTPS
  - 重定向
  - 安全
estimatedTime: 18 分钟
keywords:
  - HTTP重定向
  - HTTPS
  - '301'
  - '302'
  - HSTS
highlight: 使用 301 永久重定向配合 HSTS 头，确保所有 HTTP 请求安全地转向 HTTPS
order: 87
---

## 问题 1：应该使用哪个 HTTP 状态码进行重定向？

### 常用的重定向状态码

```http
// 301 Moved Permanently - 永久重定向
HTTP/1.1 301 Moved Permanently
Location: https://example.com/page
```

```http
// 302 Found - 临时重定向
HTTP/1.1 302 Found
Location: https://example.com/page
```

```http
// 307 Temporary Redirect - 临时重定向（保持请求方法）
HTTP/1.1 307 Temporary Redirect
Location: https://example.com/page
```

```http
// 308 Permanent Redirect - 永久重定向（保持请求方法）
HTTP/1.1 308 Permanent Redirect
Location: https://example.com/page
```

### 推荐使用 301

对于 HTTP 到 HTTPS 的重定向，**推荐使用 301**：

```http
GET http://example.com/page HTTP/1.1

HTTP/1.1 301 Moved Permanently
Location: https://example.com/page
```

**原因**：
- 告诉浏览器和搜索引擎这是永久性的变更
- 浏览器会缓存重定向规则，下次直接访问 HTTPS
- SEO 友好，搜索引擎会更新索引
- 减少后续的重定向请求

---

## 问题 2：如何在不同服务器上配置 HTTPS 重定向？

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    
    # 方式 1：简单重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 其他配置...
}
```

更精确的配置：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    
    # 方式 2：保持主机名和路径
    return 301 https://$host$request_uri;
}

# 或者使用 rewrite
server {
    listen 80;
    server_name example.com;
    
    # 方式 3：使用 rewrite
    rewrite ^(.*)$ https://$host$1 permanent;
}
```

### Apache 配置

使用 `.htaccess` 文件：

```apache
# 启用 rewrite 引擎
RewriteEngine On

# 检查是否是 HTTPS
RewriteCond %{HTTPS} off

# 重定向到 HTTPS
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
```

或者在虚拟主机配置中：

```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com
    
    # 重定向所有请求到 HTTPS
    Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    ServerAlias www.example.com
    
    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # 其他配置...
</VirtualHost>
```

### Node.js (Express) 配置

```javascript
const express = require('express');
const app = express();

// 中间件：强制 HTTPS
app.use((req, res, next) => {
  // 检查是否是 HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  
  // 重定向到 HTTPS
  res.redirect(301, `https://${req.headers.host}${req.url}`);
});

// 或者使用专门的中间件
const enforceHTTPS = (req, res, next) => {
  if (!req.secure) {
    return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }
  next();
};

app.use(enforceHTTPS);
```

---

## 问题 3：什么是 HSTS，为什么需要它？

### HSTS 简介

**HSTS (HTTP Strict Transport Security)** 是一个安全策略机制，强制浏览器只能通过 HTTPS 访问网站。

```http
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### HSTS 解决的问题

#### 问题：首次访问仍然不安全

```javascript
// 用户首次访问
// 1. 浏览器发起 HTTP 请求
http://example.com

// 2. 服务器返回 301 重定向
HTTP/1.1 301 Moved Permanently
Location: https://example.com

// 3. 浏览器再发起 HTTPS 请求
https://example.com

// ⚠️ 第一次 HTTP 请求仍然可能被中间人攻击
```

#### 解决方案：HSTS

```http
// 服务器在 HTTPS 响应中添加 HSTS 头
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000
Content-Type: text/html

// 浏览器记住这个策略，在有效期内：
// - 自动将所有 HTTP 请求转换为 HTTPS
// - 不再发送 HTTP 请求
// - 如果证书无效，拒绝访问（不显示警告页面）
```

### HSTS 配置参数

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// max-age=31536000
// - 策略有效期（秒），这里是 1 年
// - 浏览器在此期间强制使用 HTTPS

// includeSubDomains
// - 策略也适用于所有子域名
// - 例如：api.example.com, www.example.com

// preload
// - 申请加入浏览器的 HSTS 预加载列表
// - 浏览器出厂就知道这个域名必须用 HTTPS
```

### 服务器配置 HSTS

Nginx：

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # 添加 HSTS 头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # SSL 配置...
}
```

Express：

```javascript
app.use((req, res, next) => {
  if (req.secure) {
    // 只在 HTTPS 连接时添加 HSTS 头
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
});
```

---

## 问题 4：实施 HTTPS 重定向时需要注意什么？

### 1. 保持完整的 URL

```javascript
// ❌ 错误：丢失路径和查询参数
http://example.com/page?id=123
  ↓
https://example.com/  // 丢失了 /page?id=123

// ✅ 正确：保持完整 URL
http://example.com/page?id=123
  ↓
https://example.com/page?id=123
```

Nginx 正确配置：

```nginx
# 使用 $request_uri 保持完整路径
return 301 https://$host$request_uri;
```

### 2. 处理代理和负载均衡

当使用反向代理时，需要检查 `X-Forwarded-Proto` 头：

```javascript
// Express 示例
app.enable('trust proxy'); // 信任代理

app.use((req, res, next) => {
  // 检查协议
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  
  if (protocol !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }
  
  next();
});
```

### 3. 避免重定向循环

```javascript
// ❌ 可能导致循环
app.use((req, res, next) => {
  if (!req.secure) {
    // 如果代理已经处理了 HTTPS，这里会循环
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});

// ✅ 正确检查
app.use((req, res, next) => {
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https';
  
  if (!isSecure) {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});
```

### 4. HSTS 预加载注意事项

申请 HSTS 预加载前需要满足：

```nginx
# 1. 必须在根域名和所有子域名上启用 HTTPS
# 2. 必须重定向 HTTP 到 HTTPS
# 3. 必须在 HTTPS 响应中包含 HSTS 头

server {
    listen 443 ssl http2;
    server_name example.com *.example.com;
    
    # HSTS 头必须满足：
    # - max-age 至少 31536000 秒（1年）
    # - 必须包含 includeSubDomains
    # - 必须包含 preload
    add_header Strict-Transport-Security 
        "max-age=31536000; includeSubDomains; preload" always;
}
```

⚠️ **警告**：HSTS 预加载是不可逆的，一旦加入很难移除。

---

## 总结

**HTTPS 重定向最佳实践**：

### 1. 使用 301 永久重定向
- 告知浏览器和搜索引擎这是永久变更
- 保持完整的 URL（路径、查询参数）

### 2. 配置 HSTS 头
- 强制浏览器使用 HTTPS
- 防止首次访问的安全风险
- 考虑是否加入 HSTS 预加载列表

### 3. 注意事项
- 处理反向代理场景
- 避免重定向循环
- 确保所有子域名都支持 HTTPS
- 测试各种 URL 格式

---

## 延伸阅读

- [MDN - HTTP 重定向](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Redirections)
- [MDN - Strict-Transport-Security](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [HSTS Preload List](https://hstspreload.org/)
- [Let's Encrypt - 免费 SSL 证书](https://letsencrypt.org/)
- [SSL Labs - SSL 测试工具](https://www.ssllabs.com/ssltest/)
