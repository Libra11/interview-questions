---
title: http 中 HSTS 是什么
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 HTTP 严格传输安全（HSTS）机制，掌握如何强制使用 HTTPS 保护网站安全
tags:
  - HTTP
  - HTTPS
  - 安全
  - HSTS
estimatedTime: 20 分钟
keywords:
  - HSTS
  - HTTP Strict Transport Security
  - HTTPS
  - 安全
highlight: HSTS 是强制浏览器使用 HTTPS 的安全机制，有效防止中间人攻击和协议降级攻击
order: 4
---

## 问题 1：什么是 HSTS？

HSTS（HTTP Strict Transport Security，HTTP 严格传输安全）是一种 Web 安全策略机制，它告诉浏览器只能通过 HTTPS 访问网站，不允许使用不安全的 HTTP 协议。

### HSTS 的工作原理

```javascript
// 服务器通过响应头告诉浏览器启用 HSTS
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

// 浏览器收到这个响应头后：
// 1. 记录该域名必须使用 HTTPS
// 2. 在 max-age 指定的时间内（这里是1年）
// 3. 所有对该域名的 HTTP 请求都会自动转换为 HTTPS
```

### 没有 HSTS 的问题

```javascript
// ❌ 没有 HSTS 时的安全隐患

// 1. 用户在浏览器输入 example.com（没有指定协议）
// 2. 浏览器默认使用 HTTP 访问
// 3. 发送请求：http://example.com
// 4. 服务器返回 301 重定向到 https://example.com
// 5. ⚠️ 问题：第一次 HTTP 请求可能被中间人攻击

// 中间人可以在第一次 HTTP 请求时：
// - 窃取 Cookie
// - 篡改响应内容
// - 阻止重定向到 HTTPS
```

### 有 HSTS 的保护

```javascript
// ✅ 启用 HSTS 后

// 1. 用户首次访问 https://example.com
// 2. 服务器返回 HSTS 响应头
// 3. 浏览器记录该域名必须使用 HTTPS

// 之后的访问：
// 1. 用户输入 example.com 或 http://example.com
// 2. ✅ 浏览器自动转换为 https://example.com
// 3. ✅ 不发送 HTTP 请求，直接使用 HTTPS
// 4. ✅ 避免了中间人攻击的风险
```

---

## 问题 2：如何配置 HSTS？

### HSTS 响应头的语法

```javascript
Strict-Transport-Security: max-age=<seconds>; [includeSubDomains]; [preload]
```

**参数说明**：

- `max-age`：必需，指定 HSTS 策略的有效期（秒）
- `includeSubDomains`：可选，是否应用到所有子域
- `preload`：可选，是否加入 HSTS 预加载列表

### 服务器端配置示例

```javascript
// Node.js Express
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

```nginx
# Nginx 配置
server {
    listen 443 ssl;
    server_name example.com;
    
    # 启用 HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # SSL 证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

```apache
# Apache 配置
<VirtualHost *:443>
    ServerName example.com
    
    # 启用 HSTS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # SSL 证书配置
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

### max-age 的选择

```javascript
// 不同的 max-age 值

// 测试阶段（1小时）
'Strict-Transport-Security: max-age=3600'

// 短期部署（1周）
'Strict-Transport-Security: max-age=604800'

// 中期部署（1个月）
'Strict-Transport-Security: max-age=2592000'

// 长期部署（1年，推荐）
'Strict-Transport-Security: max-age=31536000'

// 永久部署（2年，用于 preload）
'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload'
```

---

## 问题 3：includeSubDomains 和 preload 有什么作用？

### includeSubDomains

将 HSTS 策略应用到所有子域名。

```javascript
// 不使用 includeSubDomains
Strict-Transport-Security: max-age=31536000

// 只对 example.com 生效
// ✅ https://example.com - 强制 HTTPS
// ❌ https://api.example.com - 不强制
// ❌ https://www.example.com - 不强制
```

```javascript
// 使用 includeSubDomains
Strict-Transport-Security: max-age=31536000; includeSubDomains

// 对所有子域生效
// ✅ https://example.com - 强制 HTTPS
// ✅ https://api.example.com - 强制 HTTPS
// ✅ https://www.example.com - 强制 HTTPS
// ✅ https://admin.example.com - 强制 HTTPS
```

**注意事项**：

```javascript
// ⚠️ 使用 includeSubDomains 前要确保：
// 1. 所有子域都支持 HTTPS
// 2. 所有子域都有有效的 SSL 证书
// 3. 没有只能通过 HTTP 访问的子域

// ❌ 错误示例：某个子域不支持 HTTPS
// 设置了 includeSubDomains
// 用户访问 http://old.example.com
// 浏览器强制转换为 https://old.example.com
// 但该子域没有 SSL 证书，导致无法访问
```

### preload

将域名加入浏览器的 HSTS 预加载列表。

```javascript
// HSTS 预加载列表的作用
// 1. 浏览器内置了一个 HSTS 域名列表
// 2. 对于列表中的域名，浏览器从第一次访问就强制使用 HTTPS
// 3. 解决了"首次访问"的安全问题
```

**预加载的要求**：

```javascript
// 要加入预加载列表，必须满足：
// 1. 拥有有效的 SSL 证书
// 2. 所有 HTTP 请求重定向到 HTTPS
// 3. 所有子域都支持 HTTPS
// 4. HSTS 响应头包含：
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

// 5. max-age 至少为 2 年（63072000 秒）
```

**提交预加载**：

```javascript
// 1. 确保满足所有要求
// 2. 访问 https://hstspreload.org/
// 3. 输入域名并提交
// 4. 等待审核（可能需要几个月）
// 5. 审核通过后，会在下一个浏览器版本中生效

// ⚠️ 注意：从预加载列表移除非常困难，需要谨慎决定
```

---

## 问题 4：HSTS 有哪些注意事项和限制？

### 1. 首次访问问题

```javascript
// ❌ HSTS 无法保护首次访问
// 用户第一次访问网站时，浏览器还没有收到 HSTS 响应头
// 这次访问仍然可能使用 HTTP，存在安全风险

// 解决方案：
// 1. 使用 HSTS 预加载列表
// 2. 通过其他渠道（如广告、链接）引导用户使用 HTTPS
// 3. 在 HTTP 页面立即重定向到 HTTPS
```

### 2. 证书问题

```javascript
// ❌ HSTS 会让证书问题变得更严重
// 如果 SSL 证书过期或无效：
// - 没有 HSTS：浏览器显示警告，用户可以选择继续访问
// - 有 HSTS：浏览器直接阻止访问，用户无法继续

// 因此必须确保：
// 1. SSL 证书始终有效
// 2. 及时续期证书
// 3. 监控证书过期时间
```

### 3. 移除 HSTS

```javascript
// 如果需要移除 HSTS，需要：
// 1. 设置 max-age=0
res.setHeader('Strict-Transport-Security', 'max-age=0');

// 2. 等待之前设置的 max-age 时间过期
// 3. 如果已加入预加载列表，需要：
//    - 从预加载列表移除（可能需要数月）
//    - 等待新版本浏览器发布
```

### 4. 子域名问题

```javascript
// ⚠️ 使用 includeSubDomains 的风险
// 如果某个子域需要使用 HTTP：
// - 设置了 includeSubDomains 后无法访问
// - 需要等待 max-age 过期才能恢复

// 建议：
// 1. 在测试环境先使用较短的 max-age
// 2. 确认所有子域都支持 HTTPS 后再启用 includeSubDomains
// 3. 逐步增加 max-age 的值
```

### 5. 开发环境配置

```javascript
// 开发环境的 HSTS 配置建议
if (process.env.NODE_ENV === 'production') {
  // 生产环境：长期 HSTS
  app.use((req, res, next) => {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    next();
  });
} else {
  // 开发环境：短期 HSTS 或不启用
  app.use((req, res, next) => {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=300' // 5分钟
    );
    next();
  });
}
```

### 6. 检查 HSTS 状态

```javascript
// 在浏览器中检查 HSTS 状态

// Chrome:
// 访问 chrome://net-internals/#hsts
// 可以查询、添加、删除 HSTS 记录

// Firefox:
// 访问 about:config
// 搜索 SiteSecurityServiceState.txt

// 通过代码检查
fetch('https://example.com')
  .then(response => {
    const hsts = response.headers.get('strict-transport-security');
    console.log('HSTS 配置:', hsts);
  });
```

---

## 总结

**核心概念总结**：

### 1. HSTS 的作用

- 强制浏览器使用 HTTPS 访问网站
- 防止协议降级攻击和中间人攻击
- 自动将 HTTP 请求转换为 HTTPS

### 2. HSTS 配置

- `max-age`：策略有效期，推荐 1 年（31536000 秒）
- `includeSubDomains`：应用到所有子域
- `preload`：加入浏览器预加载列表

### 3. HSTS 的优势

- 提高安全性，防止中间人攻击
- 提升性能，减少重定向
- 保护用户隐私

### 4. 注意事项

- 首次访问仍有风险，可通过预加载解决
- 证书问题会导致网站完全无法访问
- 移除 HSTS 需要等待 max-age 过期
- 使用 includeSubDomains 前确保所有子域支持 HTTPS
- 开发环境使用较短的 max-age

## 延伸阅读

- [MDN - Strict-Transport-Security](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP - HTTP Strict Transport Security](https://owasp.org/www-community/Security_Headers)
- [HSTS Preload List](https://hstspreload.org/)
- [RFC 6797 - HSTS 规范](https://tools.ietf.org/html/rfc6797)
- [Chromium - HSTS 文档](https://www.chromium.org/hsts)
