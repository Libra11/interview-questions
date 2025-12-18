---
title: HTTP ETag 是什么，如何使用
category: 网络
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  深入理解 HTTP ETag 缓存验证机制，掌握 ETag 的生成、验证流程以及与 Last-Modified 的区别和配合使用
tags:
  - HTTP
  - 缓存
  - ETag
  - 条件请求
estimatedTime: 20 分钟
keywords:
  - ETag
  - If-None-Match
  - HTTP缓存
  - 强验证
  - 弱验证
highlight: ETag 通过内容指纹实现精确的缓存验证，解决 Last-Modified 的时间精度和内容变化检测问题
order: 291
---

## 问题 1：ETag 是什么？

### 基本概念

`ETag` (Entity Tag) 是资源的唯一标识符，通常是资源内容的哈希值或版本号。

```http
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Content-Type: application/json

{"id": 1, "name": "张三"}
```

### 缓存验证流程

```http
// 1. 首次请求
GET /api/users/1 HTTP/1.1

HTTP/1.1 200 OK
ETag: "v1-abc123"
Cache-Control: max-age=3600

// 2. 缓存过期后，条件请求
GET /api/users/1 HTTP/1.1
If-None-Match: "v1-abc123"

// 3a. 资源未变化
HTTP/1.1 304 Not Modified

// 3b. 资源已变化
HTTP/1.1 200 OK
ETag: "v2-def456"
```

---

## 问题 2：ETag 如何生成？

### 常见生成方式

#### 内容哈希

```javascript
const crypto = require('crypto');

function generateETag(content) {
  const hash = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
  return `"${hash}"`;
}

// 示例
const etag = generateETag(JSON.stringify({ name: '张三' }));
// "5d41402abc4b2a76b9719d911017c592"
```

#### 文件元信息

```javascript
function generateETag(filePath) {
  const stats = fs.statSync(filePath);
  const mtime = stats.mtime.getTime().toString(16);
  const size = stats.size.toString(16);
  return `"${size}-${mtime}"`;
}
```

#### 版本号

```javascript
const user = {
  id: 1,
  name: '张三',
  version: 5  // 每次更新 +1
};

const etag = `"v${user.version}"`;  // "v5"
```

### 强 ETag vs 弱 ETag

```http
// 强 ETag：内容完全相同
ETag: "abc123"

// 弱 ETag：语义相同即可（W/ 前缀）
ETag: W/"abc123"
```

---

## 问题 3：如何在服务器端实现 ETag？

### Express 实现

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Express 默认支持 ETag
app.set('etag', 'strong');

// 手动实现
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  const content = JSON.stringify(user);
  
  // 生成 ETag
  const hash = crypto.createHash('md5').update(content).digest('hex');
  const etag = `"${hash}"`;
  
  // 检查 If-None-Match
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  res.setHeader('ETag', etag);
  res.json(user);
});
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;
    
    # 启用 ETag（默认开启）
    etag on;
    
    location /static/ {
        root /var/www;
        # Nginx 自动为静态文件生成 ETag
    }
}
```

---

## 问题 4：ETag 与 Last-Modified 有什么区别？

### 对比

| 特性 | ETag | Last-Modified |
|------|------|---------------|
| 基于 | 内容哈希/版本号 | 修改时间 |
| 精度 | 精确到内容变化 | 精确到秒 |
| 优先级 | 高 | 低 |
| 生成成本 | 较高（需计算哈希） | 低（读取时间戳） |

### ETag 的优势

#### 1. 解决秒级精度问题

```javascript
// 1 秒内多次修改，Last-Modified 无法区分
// 2024-11-18 10:00:00.100 修改
// 2024-11-18 10:00:00.500 再次修改
// Last-Modified 都是 10:00:00

// ETag 基于内容，可以区分
ETag: "hash1"  // 第一次修改
ETag: "hash2"  // 第二次修改
```

#### 2. 检测内容实际变化

```bash
# 仅修改时间戳，内容未变
touch file.js

# Last-Modified 会更新，但 ETag 不变
Last-Modified: Mon, 18 Nov 2024 11:00:00 GMT  # 更新了
ETag: "abc123"  # 内容未变，ETag 不变
```

#### 3. 避免时间同步问题

```javascript
// 分布式系统中，不同服务器时间可能不同
// ETag 基于内容，不依赖服务器时间
```

### 配合使用

```http
// 服务器同时返回两者
HTTP/1.1 200 OK
ETag: "abc123"
Last-Modified: Mon, 18 Nov 2024 10:00:00 GMT

// 客户端同时发送两个条件头
GET /api/data HTTP/1.1
If-None-Match: "abc123"
If-Modified-Since: Mon, 18 Nov 2024 10:00:00 GMT

// 服务器优先检查 ETag
// 只有 ETag 不存在时才检查 Last-Modified
```

---

## 问题 5：使用 ETag 需要注意什么？

### 1. 分布式系统中的 ETag 一致性

```javascript
// 问题：不同服务器生成的 ETag 可能不同
// 服务器 A：基于文件 inode 生成
// 服务器 B：基于文件 inode 生成（inode 不同）

// 解决方案：使用内容哈希
function generateETag(content) {
  // 只基于内容，不依赖文件系统
  return crypto.createHash('md5').update(content).digest('hex');
}
```

### 2. 计算成本

```javascript
// 大文件计算哈希成本高
// 可以使用弱 ETag 或缓存 ETag

const etagCache = new Map();

function getETag(filePath) {
  const stats = fs.statSync(filePath);
  const cacheKey = `${filePath}-${stats.mtime.getTime()}`;
  
  // 检查缓存
  if (etagCache.has(cacheKey)) {
    return etagCache.get(cacheKey);
  }
  
  // 计算新的 ETag
  const content = fs.readFileSync(filePath);
  const etag = generateETag(content);
  etagCache.set(cacheKey, etag);
  
  return etag;
}
```

### 3. 动态内容的 ETag

```javascript
// 包含时间戳的动态内容
app.get('/api/dashboard', (req, res) => {
  const data = {
    stats: getStats(),
    timestamp: Date.now()  // 每次都不同
  };
  
  // ❌ ETag 每次都不同，失去缓存意义
  
  // ✅ 只对核心数据生成 ETag
  const coreData = { stats: data.stats };
  const etag = generateETag(JSON.stringify(coreData));
  
  res.setHeader('ETag', etag);
  res.json(data);
});
```

---

## 总结

**核心要点**：

### ETag 的作用
- 资源的唯一标识符
- 用于精确的缓存验证
- 配合 If-None-Match 实现条件请求

### 生成方式
- 内容哈希（最精确）
- 文件元信息（性能好）
- 版本号（简单）

### 与 Last-Modified 的关系
- ETag 优先级更高
- ETag 更精确，但计算成本高
- 两者可以配合使用

### 注意事项
- 分布式系统保证 ETag 一致性
- 考虑计算成本，必要时使用弱 ETag
- 动态内容谨慎使用 ETag

---

## 延伸阅读

- [MDN - ETag](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)
- [MDN - If-None-Match](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-None-Match)
- [RFC 7232 - HTTP Conditional Requests](https://tools.ietf.org/html/rfc7232)
- [HTTP Caching - Google Developers](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)
