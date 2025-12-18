---
title: 304 是什么状态码,跟哪些 Header 有关
category: HTTP
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP 304 Not Modified 状态码的含义和工作原理,掌握与缓存相关的 HTTP 头部字段,了解如何利用 304 优化网站性能。
tags:
  - HTTP
  - 状态码
  - 缓存
  - 性能优化
estimatedTime: 20 分钟
keywords:
  - HTTP 304
  - Not Modified
  - 协商缓存
  - ETag
  - Last-Modified
highlight: 304 状态码表示资源未修改,浏览器可以使用缓存,是HTTP缓存机制的重要组成部分
order: 141
---

## 问题 1:304 状态码是什么?

### 基本概念

304 Not Modified 表示**资源未修改**,客户端可以继续使用缓存的版本。

```javascript
// 完整流程
// 1. 首次请求
GET /image.jpg HTTP/1.1
Host: example.com

// 响应
HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
ETag: "33a64df551425fcc55e"
Cache-Control: max-age=0, must-revalidate
Content-Length: 12345

[图片数据]

// 2. 再次请求(缓存过期)
GET /image.jpg HTTP/1.1
Host: example.com
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
If-None-Match: "33a64df551425fcc55e"

// 响应 304
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e"
Cache-Control: max-age=3600

// 没有响应体,节省带宽
```

### 304 的作用

```javascript
// 优势
// 1. 节省带宽 - 不传输文件内容
// 2. 加快速度 - 使用本地缓存
// 3. 减轻服务器负载 - 不需要读取文件

// 示例对比
// 200 响应: 传输 1MB 图片
// 304 响应: 只传输几百字节的头部

// 性能提升
// 200: 1MB / 1Mbps = 8秒
// 304: 500bytes / 1Mbps = 0.004秒
// 快了 2000 倍!
```

---

## 问题 2:Last-Modified 和 If-Modified-Since

### Last-Modified

```javascript
// 服务器返回资源的最后修改时间

// 响应头
HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
Content-Type: image/jpeg

// 格式: HTTP-date
// Wed, 21 Oct 2024 07:28:00 GMT
```

### If-Modified-Since

```javascript
// 客户端再次请求时,带上上次的 Last-Modified

// 请求头
GET /image.jpg HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT

// 服务器判断
const fileModifiedTime = getFileModifiedTime('/image.jpg');
const ifModifiedSince = request.headers['if-modified-since'];

if (fileModifiedTime <= new Date(ifModifiedSince)) {
  // 文件未修改
  response.status(304).end();
} else {
  // 文件已修改
  response.status(200).send(fileContent);
}
```

### Node.js 实现

```javascript
const fs = require('fs');
const path = require('path');

app.get('/image.jpg', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'image.jpg');
  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime.toUTCString();
  
  // 检查 If-Modified-Since
  const ifModifiedSince = req.headers['if-modified-since'];
  
  if (ifModifiedSince && ifModifiedSince === lastModified) {
    // 未修改,返回 304
    res.status(304).end();
  } else {
    // 已修改,返回 200
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
    res.sendFile(filePath);
  }
});
```

---

## 问题 3:ETag 和 If-None-Match

### ETag

```javascript
// ETag 是资源的唯一标识符
// 通常是文件内容的哈希值

// 响应头
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Content-Type: text/html

// 强 ETag vs 弱 ETag
// 强 ETag: "33a64df551425fcc55e"
// 弱 ETag: W/"33a64df551425fcc55e"

// 强 ETag: 字节级别完全相同
// 弱 ETag: 语义相同即可(如压缩版本)
```

### If-None-Match

```javascript
// 客户端再次请求时,带上 ETag

// 请求头
GET /index.html HTTP/1.1
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// 服务器判断
const currentETag = generateETag(fileContent);
const ifNoneMatch = request.headers['if-none-match'];

if (currentETag === ifNoneMatch) {
  // ETag 匹配,返回 304
  response.status(304).end();
} else {
  // ETag 不匹配,返回 200
  response.status(200).send(fileContent);
}
```

### 生成 ETag

```javascript
const crypto = require('crypto');
const fs = require('fs');

// 方式 1: 基于文件内容的哈希
function generateETag(filePath) {
  const content = fs.readFileSync(filePath);
  const hash = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
  
  return `"${hash}"`;
}

// 方式 2: 基于文件大小和修改时间
function generateWeakETag(filePath) {
  const stats = fs.statSync(filePath);
  const mtime = stats.mtime.getTime().toString(16);
  const size = stats.size.toString(16);
  
  return `W/"${size}-${mtime}"`;
}

// 使用
app.get('/file.txt', (req, res) => {
  const filePath = './file.txt';
  const etag = generateETag(filePath);
  
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
  } else {
    res.setHeader('ETag', etag);
    res.sendFile(filePath);
  }
});
```

---

## 问题 4:Last-Modified vs ETag

### 对比

```javascript
// Last-Modified
// 优点:
// 1. 实现简单
// 2. 性能好(不需要计算哈希)

// 缺点:
// 1. 精度只到秒级
// 2. 文件内容未变但修改时间变了
// 3. 某些服务器无法获取精确修改时间

// ETag
// 优点:
// 1. 精确(基于内容)
// 2. 可以处理修改时间不准确的情况

// 缺点:
// 1. 计算开销大
// 2. 分布式环境下可能不一致
```

### 优先级

```javascript
// 同时存在时,ETag 优先级更高

// 请求
GET /file.txt HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
If-None-Match: "33a64df551425fcc55e"

// 服务器处理
if (req.headers['if-none-match']) {
  // 优先检查 ETag
  if (currentETag === req.headers['if-none-match']) {
    return res.status(304).end();
  }
} else if (req.headers['if-modified-since']) {
  // 其次检查 Last-Modified
  if (lastModified <= new Date(req.headers['if-modified-since'])) {
    return res.status(304).end();
  }
}

// 返回 200
res.status(200).send(content);
```

---

## 问题 5:Cache-Control 与 304

### must-revalidate

```javascript
// 强制验证缓存

// 响应头
Cache-Control: max-age=3600, must-revalidate

// 含义:
// 1. 缓存 1 小时
// 2. 过期后必须向服务器验证
// 3. 不能使用过期缓存

// 流程
// 0-3600秒: 直接使用缓存(200 from cache)
// 3600秒后: 发送请求验证
//   - 未修改: 304
//   - 已修改: 200
```

### no-cache

```javascript
// 每次都要验证

// 响应头
Cache-Control: no-cache

// 含义:
// 1. 可以缓存
// 2. 但每次使用前必须验证
// 3. 通常返回 304

// 流程
// 每次请求都发送:
GET /api/data HTTP/1.1
If-None-Match: "abc123"

// 服务器响应:
// 未修改: 304
// 已修改: 200
```

### max-age=0

```javascript
// 立即过期,需要验证

// 响应头
Cache-Control: max-age=0

// 等同于
Cache-Control: no-cache

// 流程
// 缓存立即过期
// 每次都需要验证
// 通常返回 304
```

---

## 问题 6:304 的完整流程

### 详细流程

```javascript
// 1. 首次请求
Client → Server: GET /image.jpg

Server → Client:
  HTTP/1.1 200 OK
  Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
  ETag: "abc123"
  Cache-Control: max-age=3600
  [图片数据]

// 2. 1小时内再次请求
// 直接使用缓存,不发送请求
// 200 (from disk cache)

// 3. 1小时后再次请求
Client → Server:
  GET /image.jpg
  If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
  If-None-Match: "abc123"

// 情况 A: 文件未修改
Server → Client:
  HTTP/1.1 304 Not Modified
  ETag: "abc123"
  Cache-Control: max-age=3600

// 浏览器使用缓存

// 情况 B: 文件已修改
Server → Client:
  HTTP/1.1 200 OK
  Last-Modified: Wed, 21 Oct 2024 08:30:00 GMT
  ETag: "def456"
  Cache-Control: max-age=3600
  [新的图片数据]

// 浏览器更新缓存
```

---

## 问题 7:实际应用

### Express 中间件

```javascript
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

// 自定义缓存中间件
function cacheMiddleware(req, res, next) {
  const filePath = req.path;
  
  try {
    const stats = fs.statSync(`.${filePath}`);
    const content = fs.readFileSync(`.${filePath}`);
    
    // 生成 ETag
    const etag = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');
    
    // 生成 Last-Modified
    const lastModified = stats.mtime.toUTCString();
    
    // 检查 If-None-Match
    if (req.headers['if-none-match'] === `"${etag}"`) {
      return res.status(304).end();
    }
    
    // 检查 If-Modified-Since
    if (req.headers['if-modified-since'] === lastModified) {
      return res.status(304).end();
    }
    
    // 设置响应头
    res.setHeader('ETag', `"${etag}"`);
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'max-age=3600, must-revalidate');
    
    res.send(content);
  } catch (error) {
    next(error);
  }
}

// 使用
app.use('/static', cacheMiddleware);
```

### Nginx 配置

```nginx
server {
    location /static/ {
        # 启用 ETag
        etag on;
        
        # 启用 Last-Modified
        if_modified_since exact;
        
        # 设置缓存
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
```

---

## 总结

**核心概念总结**:

### 1. 304 状态码

- 表示资源未修改
- 客户端使用缓存
- 节省带宽和时间

### 2. 相关 Header

- **Last-Modified / If-Modified-Since**: 基于时间
- **ETag / If-None-Match**: 基于内容
- **Cache-Control**: 缓存策略

### 3. 工作流程

- 首次请求返回 200
- 缓存过期后验证
- 未修改返回 304
- 已修改返回 200

### 4. 最佳实践

- 同时使用 ETag 和 Last-Modified
- 合理设置 Cache-Control
- 静态资源启用缓存
- 动态内容谨慎使用

## 延伸阅读

- [HTTP 304 MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status/304)
- [HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [ETag 规范](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)
- [Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
