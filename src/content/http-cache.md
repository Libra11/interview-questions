---
title: 关于 HTTP 缓存你需要知道什么？
category: 网络
difficulty: 中级
updatedAt: 2025-11-17
summary: >-
  深入理解 HTTP 缓存机制，掌握强缓存和协商缓存的原理和区别，学习如何使用 Cache-Control、ETag 等缓存相关的 HTTP 头，优化网站性能和用户体验。
tags:
  - HTTP缓存
  - 强缓存
  - 协商缓存
  - Cache-Control
  - ETag
estimatedTime: 22 分钟
keywords:
  - HTTP缓存
  - 强缓存
  - 协商缓存
  - Cache-Control
  - ETag
  - Last-Modified
  - Expires
highlight: HTTP 缓存分为强缓存和协商缓存，合理使用缓存可以显著提升网站性能
order: 135
---

## 问题 1：什么是 HTTP 缓存？

HTTP 缓存是一种**存储资源副本**的机制，用于减少网络请求。

### 基本概念

```
客户端请求流程：

1. 浏览器发起请求
   ↓
2. 检查缓存
   ├─ 有缓存且未过期 → 使用缓存（强缓存）
   ├─ 有缓存但过期 → 向服务器验证（协商缓存）
   └─ 无缓存 → 请求服务器
   ↓
3. 服务器响应
   ├─ 304 Not Modified → 使用缓存
   └─ 200 OK → 返回新资源并缓存
```

### 缓存的优势

```javascript
// 缓存的好处：

// 1. 减少网络请求
// - 直接从缓存读取，不发送请求
// - 节省带宽

// 2. 加快页面加载
// - 本地读取比网络请求快得多
// - 提升用户体验

// 3. 降低服务器压力
// - 减少服务器处理请求的次数
// - 节省服务器资源

// 4. 离线访问
// - 即使断网也能访问缓存的资源
// - 提高应用可用性

// 示例：测量缓存效果
console.time('首次加载');
fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    console.timeEnd('首次加载'); // 可能需要 500ms
  });

// 第二次加载（使用缓存）
console.time('缓存加载');
fetch('/api/data')
  .then(res => res.json())
  .then(data => {
    console.timeEnd('缓存加载'); // 可能只需要 10ms
  });
```

---

## 问题 2：什么是强缓存？

强缓存是**不需要向服务器验证**的缓存。

### Expires（HTTP/1.0）

```http
# 服务器响应头
HTTP/1.1 200 OK
Content-Type: text/html
Expires: Wed, 21 Oct 2025 07:28:00 GMT

# 含义：资源在 2025-10-21 07:28:00 之前都是有效的
# 缺点：使用绝对时间，受客户端时间影响
```

```javascript
// Node.js 设置 Expires
const express = require('express');
const app = express();

app.get('/static/*', (req, res) => {
  // 设置过期时间为 1 天后
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  res.setHeader('Expires', expires.toUTCString());
  
  res.sendFile(req.path);
});
```

### Cache-Control（HTTP/1.1）

```http
# 服务器响应头
HTTP/1.1 200 OK
Content-Type: text/css
Cache-Control: max-age=3600

# 含义：资源在 3600 秒（1 小时）内有效
# 优点：使用相对时间，不受客户端时间影响
```

```javascript
// Cache-Control 的常用指令

// 1. max-age：缓存有效期（秒）
// Cache-Control: max-age=3600

// 2. no-cache：需要验证后才能使用缓存
// Cache-Control: no-cache

// 3. no-store：不缓存任何内容
// Cache-Control: no-store

// 4. public：可以被任何缓存（包括 CDN）缓存
// Cache-Control: public, max-age=3600

// 5. private：只能被浏览器缓存，不能被 CDN 缓存
// Cache-Control: private, max-age=3600

// 6. must-revalidate：过期后必须向服务器验证
// Cache-Control: max-age=3600, must-revalidate

// 7. immutable：资源永远不会改变
// Cache-Control: max-age=31536000, immutable

// Node.js 设置 Cache-Control
app.get('/static/*', (req, res) => {
  // 静态资源缓存 1 年
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(req.path);
});

app.get('/api/*', (req, res) => {
  // API 响应不缓存
  res.setHeader('Cache-Control', 'no-store');
  res.json({ data: 'dynamic content' });
});
```

### 强缓存的工作流程

```javascript
// 强缓存流程示例

// 1. 首次请求
fetch('https://example.com/style.css')
  .then(res => {
    // 服务器返回：
    // Cache-Control: max-age=3600
    // 浏览器缓存资源，记录缓存时间
  });

// 2. 第二次请求（1 小时内）
fetch('https://example.com/style.css')
  .then(res => {
    // 浏览器检查缓存：
    // - 缓存存在
    // - 未过期（距离首次请求不到 1 小时）
    // - 直接使用缓存，不发送请求
    // - 状态码：200 (from disk cache)
  });

// 3. 第三次请求（1 小时后）
fetch('https://example.com/style.css')
  .then(res => {
    // 浏览器检查缓存：
    // - 缓存存在
    // - 已过期（距离首次请求超过 1 小时）
    // - 需要向服务器验证（进入协商缓存）
  });
```

---

## 问题 3：什么是协商缓存？

协商缓存需要**向服务器验证**缓存是否可用。

### Last-Modified / If-Modified-Since

```http
# 1. 首次请求
GET /style.css HTTP/1.1

# 服务器响应
HTTP/1.1 200 OK
Last-Modified: Mon, 10 Jan 2024 10:00:00 GMT
Cache-Control: no-cache

# 2. 再次请求（带上 If-Modified-Since）
GET /style.css HTTP/1.1
If-Modified-Since: Mon, 10 Jan 2024 10:00:00 GMT

# 服务器响应（资源未修改）
HTTP/1.1 304 Not Modified

# 或服务器响应（资源已修改）
HTTP/1.1 200 OK
Last-Modified: Mon, 10 Jan 2024 15:00:00 GMT
```

```javascript
// Node.js 实现 Last-Modified
const fs = require('fs');
const path = require('path');

app.get('/static/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime.toUTCString();
  
  // 获取客户端发送的 If-Modified-Since
  const ifModifiedSince = req.headers['if-modified-since'];
  
  if (ifModifiedSince && ifModifiedSince === lastModified) {
    // 资源未修改，返回 304
    res.status(304).end();
  } else {
    // 资源已修改或首次请求，返回 200
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath);
  }
});
```

### ETag / If-None-Match

```http
# 1. 首次请求
GET /style.css HTTP/1.1

# 服务器响应
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: no-cache

# 2. 再次请求（带上 If-None-Match）
GET /style.css HTTP/1.1
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# 服务器响应（ETag 匹配）
HTTP/1.1 304 Not Modified

# 或服务器响应（ETag 不匹配）
HTTP/1.1 200 OK
ETag: "7b502c3a1f48c8609ae212cdfb639dee39673f5e"
```

```javascript
// Node.js 实现 ETag
const crypto = require('crypto');
const fs = require('fs');

app.get('/static/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  const content = fs.readFileSync(filePath);
  
  // 生成 ETag（使用文件内容的 MD5 哈希）
  const etag = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
  
  // 获取客户端发送的 If-None-Match
  const ifNoneMatch = req.headers['if-none-match'];
  
  if (ifNoneMatch && ifNoneMatch === etag) {
    // ETag 匹配，返回 304
    res.status(304).end();
  } else {
    // ETag 不匹配或首次请求，返回 200
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(content);
  }
});
```

### Last-Modified vs ETag

```javascript
// Last-Modified 的问题：

// 1. 精度问题：只能精确到秒
// 2. 时间问题：文件修改时间可能不准确
// 3. 内容未变但时间变了：会导致不必要的重新下载

// ETag 的优势：

// 1. 基于内容：内容不变，ETag 就不变
// 2. 精度高：可以识别任何细微的变化
// 3. 灵活性：可以自定义 ETag 生成规则

// 优先级：ETag > Last-Modified
// 如果同时存在，服务器会优先比较 ETag
```

---

## 问题 4：强缓存和协商缓存的区别是什么？

两者的**验证方式和性能**不同。

### 对比

```javascript
// 强缓存 vs 协商缓存

// 强缓存：
// - 不发送请求到服务器
// - 直接从缓存读取
// - 状态码：200 (from cache)
// - 速度最快
// - 相关头：Expires, Cache-Control

// 协商缓存：
// - 发送请求到服务器验证
// - 服务器判断是否使用缓存
// - 状态码：304 Not Modified 或 200 OK
// - 速度较快（不传输资源内容）
// - 相关头：Last-Modified, ETag
```

### 缓存策略选择

```javascript
// 不同资源的缓存策略

// 1. 静态资源（带版本号/哈希）
// Cache-Control: public, max-age=31536000, immutable
app.get('/static/:hash/*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(req.path);
});

// 2. HTML 文件
// Cache-Control: no-cache
app.get('*.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.send(content);
});

// 3. API 接口
// 频繁变化：no-store
// 不常变化：no-cache + ETag
app.get('/api/realtime', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(realtimeData);
});

// 4. 图片资源
// Cache-Control: public, max-age=86400
app.get('/images/*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(req.path);
});
```

---

## 问题 5：如何在实际项目中使用缓存？

了解**实际应用场景**和最佳实践。

### 前端资源缓存策略

```javascript
// 1. Webpack 配置
module.exports = {
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js'
  }
};

// 2. Nginx 配置示例
/*
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

location /api/ {
    add_header Cache-Control "no-store";
}
*/
```

### 缓存更新策略

```javascript
// 1. 文件名哈希（推荐）
// main.a3f2b1c4.js
// 内容变化，哈希就变化，自动处理缓存更新

// 2. 查询参数版本号
function loadScript(url, version) {
  const script = document.createElement('script');
  script.src = `${url}?v=${version}`;
  document.body.appendChild(script);
}

// 3. 手动清除缓存
function clearCache() {
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  window.location.reload(true);
}

// 4. 自动检测更新
async function checkUpdate() {
  const response = await fetch('/api/version');
  const { version } = await response.json();
  
  const currentVersion = localStorage.getItem('app-version');
  
  if (currentVersion && currentVersion !== version) {
    if (confirm('发现新版本，是否刷新页面？')) {
      localStorage.setItem('app-version', version);
      window.location.reload(true);
    }
  }
}
```

---

## 问题 6：缓存的注意事项有哪些？

了解缓存的**常见问题和最佳实践**。

### 常见问题

```javascript
// 1. 缓存过期问题
// ❌ 不好：HTML 也使用强缓存
// Cache-Control: max-age=3600

// ✅ 好：HTML 使用协商缓存
// Cache-Control: no-cache

// 2. 缓存雪崩
// 问题：大量缓存同时过期
// 解决：设置随机的过期时间
function setCache(key, value, baseTime = 3600) {
  const randomTime = baseTime + Math.random() * 600;
  const expires = Date.now() + randomTime * 1000;
  localStorage.setItem(key, JSON.stringify({ value, expires }));
}

// 3. 敏感信息缓存
// 用户信息：private
// 支付信息：no-store
app.get('/api/user/profile', (req, res) => {
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.json(userProfile);
});

app.get('/api/payment', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(paymentInfo);
});
```

### 最佳实践

```javascript
// 1. 分层缓存策略
const cacheStrategies = {
  immutable: 'public, max-age=31536000, immutable', // 永久缓存
  longTerm: 'public, max-age=2592000', // 30 天
  shortTerm: 'private, max-age=300', // 5 分钟
  revalidate: 'no-cache', // 协商缓存
  noCache: 'no-store' // 不缓存
};

// 2. 使用 Vary 头处理不同版本
app.get('/api/data', (req, res) => {
  res.setHeader('Vary', 'Accept-Language');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(getData(req.headers['accept-language']));
});

// 3. 监控缓存效果
function monitorCache() {
  const resources = performance.getEntriesByType('resource');
  let cached = 0;
  
  resources.forEach(resource => {
    if (resource.transferSize === 0) cached++;
  });
  
  console.log(`缓存命中率: ${(cached / resources.length * 100).toFixed(2)}%`);
}
```

---

## 问题 7：如何调试和优化缓存？

掌握**缓存调试技巧**。

### 调试工具

```javascript
// 1. Chrome DevTools
// - Network 面板查看缓存状态
// - Size 列显示：(from disk cache) 或 (from memory cache)
// - 禁用缓存：Network → Disable cache

// 2. 强制刷新
// - Windows: Ctrl + F5
// - Mac: Cmd + Shift + R

// 3. 查看缓存内容
if ('caches' in window) {
  caches.keys().then((names) => {
    console.log('缓存列表:', names);
    
    names.forEach((name) => {
      caches.open(name).then((cache) => {
        cache.keys().then((requests) => {
          console.log(`${name}:`, requests.map(r => r.url));
        });
      });
    });
  });
}

// 4. 监控缓存命中率
let cacheHits = 0;
let cacheMisses = 0;

const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch(...args).then((response) => {
    if (response.headers.get('x-cache') === 'HIT') {
      cacheHits++;
    } else {
      cacheMisses++;
    }
    
    const hitRate = (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2);
    console.log(`缓存命中率: ${hitRate}%`);
    
    return response;
  });
};
```

### 优化建议

```javascript
// 1. 合理设置缓存时间
// - 静态资源：1 年
// - 图片字体：1 个月
// - API 数据：5 分钟
// - HTML：协商缓存

// 2. 使用 CDN
// - 加速资源分发
// - 减轻源站压力

// 3. 压缩资源
// - Gzip/Brotli 压缩
// - 减小传输大小

// 4. 预加载关键资源
// <link rel="preload" href="/critical.css" as="style">

// 5. 使用 Service Worker
// - 离线缓存
// - 自定义缓存策略
```

---

## 总结

**HTTP 缓存的核心要点**：

### 1. 基本概念
- 存储资源副本，减少网络请求
- 提升性能，降低服务器压力
- 分为强缓存和协商缓存

### 2. 强缓存
- **Expires**：HTTP/1.0，绝对时间
- **Cache-Control**：HTTP/1.1，相对时间
- 不发送请求，直接使用缓存
- 状态码：200 (from cache)

### 3. 协商缓存
- **Last-Modified / If-Modified-Since**：基于时间
- **ETag / If-None-Match**：基于内容
- 需要向服务器验证
- 状态码：304 Not Modified

### 4. Cache-Control 指令
- max-age、no-cache、no-store
- public、private
- must-revalidate、immutable

### 5. 缓存策略
- 静态资源：强缓存 + 长时间
- HTML：协商缓存
- API：根据数据特点选择
- 图片：强缓存 + 中等时长

### 6. 最佳实践
- 文件名哈希处理版本
- 分层缓存策略
- 使用 Vary 头
- 监控缓存效果

### 7. 注意事项
- 避免缓存敏感信息
- 防止缓存雪崩
- 合理设置过期时间
- 提供缓存更新机制

## 延伸阅读

- [MDN - HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [MDN - Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
- [Google - HTTP 缓存最佳实践](https://web.dev/http-cache/)
- [RFC 7234 - HTTP/1.1 Caching](https://tools.ietf.org/html/rfc7234)
