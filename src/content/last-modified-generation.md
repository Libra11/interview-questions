---
title: Last-Modified 响应头是如何生成的？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP Last-Modified 响应头的生成机制，掌握服务器如何确定资源的最后修改时间，了解 Last-Modified 在缓存验证中的作用，以及与 ETag 的配合使用。
tags:
  - HTTP
  - 缓存
  - Last-Modified
  - 条件请求
estimatedTime: 22 分钟
keywords:
  - Last-Modified
  - If-Modified-Since
  - HTTP缓存
  - 304响应
highlight: 掌握 Last-Modified 的生成原理和缓存验证机制，理解条件请求的工作流程
order: 466
---

## 问题 1：Last-Modified 是什么，有什么作用？

**Last-Modified** 是一个 HTTP 响应头，表示资源的**最后修改时间**，用于缓存验证和条件请求。

### 基本格式

```http
Last-Modified: Wed, 27 Nov 2025 10:30:00 GMT

格式：HTTP-date（RFC 7231 规定的日期格式）
时区：必须是 GMT（格林威治标准时间）
精度：秒级
```

### 工作流程

```javascript
// 完整的缓存验证流程

// 第一次请求
Client → Server: GET /api/data
Server → Client: 200 OK
                 Last-Modified: Wed, 27 Nov 2025 10:30:00 GMT
                 Cache-Control: no-cache
                 { "data": "..." }

// 浏览器缓存响应和 Last-Modified 值

// 第二次请求（带条件）
Client → Server: GET /api/data
                 If-Modified-Since: Wed, 27 Nov 2025 10:30:00 GMT

// 场景1：资源未修改
Server → Client: 304 Not Modified
                 // 没有响应体，使用缓存

// 场景2：资源已修改
Server → Client: 200 OK
                 Last-Modified: Wed, 27 Nov 2025 11:00:00 GMT
                 { "data": "new data" }
```

### 与 ETag 的对比

```javascript
const comparison = {
  LastModified: {
    type: '时间戳',
    precision: '秒级',
    generation: '基于文件修改时间',
    pros: '生成快，无需计算',
    cons: '精度低，可能不准确',
    example: 'Wed, 27 Nov 2025 10:30:00 GMT'
  },
  
  ETag: {
    type: '内容标识符',
    precision: '内容级别',
    generation: '基于内容哈希或版本号',
    pros: '精确，内容不变则不变',
    cons: '需要计算，有性能开销',
    example: '"5d41402abc4b2a76b9719d911017c592"'
  }
};

// 优先级：ETag > Last-Modified
// 如果两者都存在，服务器优先检查 ETag
```

---

## 问题 2：服务器如何生成 Last-Modified？

Last-Modified 的生成方式取决于资源类型和服务器实现。

### 1. 静态文件：使用文件系统时间

```javascript
// Node.js/Express 示例
const fs = require('fs');
const path = require('path');

app.get('/static/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', filename);
  
  // 获取文件状态
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).send('Not found');
    }
    
    // 获取文件的最后修改时间
    const lastModified = stats.mtime.toUTCString();
    
    // 检查 If-Modified-Since
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifModifiedSince && ifModifiedSince === lastModified) {
      // 文件未修改
      return res.status(304).end();
    }
    
    // 文件已修改或首次请求
    res.set({
      'Last-Modified': lastModified,
      'Cache-Control': 'no-cache'
    });
    res.sendFile(filePath);
  });
});

// 文件系统时间戳
const fileTimestamps = {
  mtime: 'Modified time - 内容修改时间',
  ctime: 'Change time - 元数据修改时间（权限、所有者等）',
  atime: 'Access time - 最后访问时间',
  birthtime: 'Birth time - 创建时间'
};

// 通常使用 mtime
```

### 2. 动态内容：使用数据库时间戳

```javascript
// 数据库模型（Sequelize 示例）
const Article = sequelize.define('Article', {
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
  updatedAt: DataTypes.DATE  // 自动维护
});

// API 端点
app.get('/api/articles/:id', async (req, res) => {
  const article = await Article.findByPk(req.params.id);
  
  if (!article) {
    return res.status(404).send('Not found');
  }
  
  // 使用数据库的 updatedAt 字段
  const lastModified = article.updatedAt.toUTCString();
  
  // 条件请求处理
  const ifModifiedSince = req.headers['if-modified-since'];
  
  if (ifModifiedSince) {
    const clientDate = new Date(ifModifiedSince);
    const resourceDate = new Date(article.updatedAt);
    
    // 比较时间（忽略毫秒）
    if (Math.floor(clientDate.getTime() / 1000) >= 
        Math.floor(resourceDate.getTime() / 1000)) {
      return res.status(304).end();
    }
  }
  
  res.set('Last-Modified', lastModified);
  res.json(article);
});
```

### 3. 聚合数据：使用最新项的时间

```javascript
// 列表资源：使用最新项的更新时间
app.get('/api/articles', async (req, res) => {
  const articles = await Article.findAll({
    order: [['updatedAt', 'DESC']],
    limit: 20
  });
  
  if (articles.length === 0) {
    return res.json([]);
  }
  
  // 使用最新文章的更新时间
  const lastModified = articles[0].updatedAt.toUTCString();
  
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince === lastModified) {
    return res.status(304).end();
  }
  
  res.set('Last-Modified', lastModified);
  res.json(articles);
});

// 或者使用数据库查询
app.get('/api/posts', async (req, res) => {
  // 查询最新的更新时间
  const result = await db.query(
    'SELECT MAX(updated_at) as last_modified FROM posts'
  );
  
  const lastModified = new Date(result[0].last_modified).toUTCString();
  
  // ... 条件请求处理
});
```

### 4. 计算资源：使用构建时间或版本号

```javascript
// 编译/构建的资源
app.get('/api/config', (req, res) => {
  const config = generateConfig();
  
  // 方式1：使用构建时间
  const buildTime = process.env.BUILD_TIME || new Date().toUTCString();
  
  // 方式2：使用配置文件的修改时间
  const configFilePath = './config.json';
  const stats = fs.statSync(configFilePath);
  const lastModified = stats.mtime.toUTCString();
  
  res.set('Last-Modified', lastModified);
  res.json(config);
});

// 部署时设置环境变量
// BUILD_TIME=$(date -u +"%a, %d %b %Y %H:%M:%S GMT")
```

### 5. 缓存资源：使用缓存更新时间

```javascript
// Redis 缓存示例
const redis = require('redis');
const client = redis.createClient();

app.get('/api/cached-data', async (req, res) => {
  const cacheKey = 'data:latest';
  const cacheTimeKey = 'data:latest:modified';
  
  // 获取缓存数据和修改时间
  const [data, lastModified] = await Promise.all([
    client.get(cacheKey),
    client.get(cacheTimeKey)
  ]);
  
  if (!data) {
    // 缓存未命中，从数据库获取
    const freshData = await fetchFromDatabase();
    const now = new Date().toUTCString();
    
    await Promise.all([
      client.set(cacheKey, JSON.stringify(freshData)),
      client.set(cacheTimeKey, now)
    ]);
    
    res.set('Last-Modified', now);
    return res.json(freshData);
  }
  
  // 缓存命中，检查条件请求
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince === lastModified) {
    return res.status(304).end();
  }
  
  res.set('Last-Modified', lastModified);
  res.json(JSON.parse(data));
});

// 更新缓存时同时更新时间戳
async function updateCache(key, data) {
  const now = new Date().toUTCString();
  await Promise.all([
    client.set(`data:${key}`, JSON.stringify(data)),
    client.set(`data:${key}:modified`, now)
  ]);
}
```

---

## 问题 3：如何正确处理 If-Modified-Since 条件请求？

### 完整的条件请求处理

```javascript
// 健壮的条件请求处理函数
function handleConditionalRequest(req, res, resource) {
  const lastModified = resource.modifiedAt.toUTCString();
  const ifModifiedSince = req.headers['if-modified-since'];
  const ifUnmodifiedSince = req.headers['if-unmodified-since'];
  
  // 1. 处理 If-Modified-Since（GET/HEAD 请求）
  if (ifModifiedSince) {
    try {
      const clientDate = new Date(ifModifiedSince);
      const resourceDate = new Date(resource.modifiedAt);
      
      // 比较时间（秒级精度）
      const clientTimestamp = Math.floor(clientDate.getTime() / 1000);
      const resourceTimestamp = Math.floor(resourceDate.getTime() / 1000);
      
      if (resourceTimestamp <= clientTimestamp) {
        // 资源未修改
        res.set('Last-Modified', lastModified);
        return res.status(304).end();
      }
    } catch (err) {
      // 日期格式错误，忽略条件
      console.warn('Invalid If-Modified-Since header:', ifModifiedSince);
    }
  }
  
  // 2. 处理 If-Unmodified-Since（PUT/DELETE 请求）
  if (ifUnmodifiedSince) {
    try {
      const clientDate = new Date(ifUnmodifiedSince);
      const resourceDate = new Date(resource.modifiedAt);
      
      if (resourceDate > clientDate) {
        // 资源已被修改，拒绝操作
        return res.status(412).send('Precondition Failed');
      }
    } catch (err) {
      console.warn('Invalid If-Unmodified-Since header:', ifUnmodifiedSince);
    }
  }
  
  // 3. 正常响应
  res.set('Last-Modified', lastModified);
  return null; // 继续处理
}

// 使用示例
app.get('/api/resource/:id', async (req, res) => {
  const resource = await getResource(req.params.id);
  
  if (!resource) {
    return res.status(404).send('Not found');
  }
  
  // 处理条件请求
  const conditionalResponse = handleConditionalRequest(req, res, resource);
  if (conditionalResponse) {
    return; // 已发送 304 或 412 响应
  }
  
  // 正常响应
  res.json(resource);
});
```

### 时间比较的注意事项

```javascript
// ⚠️ 常见陷阱
const timePitfalls = {
  // 1. 毫秒精度问题
  milliseconds: {
    problem: 'Last-Modified 只精确到秒，但 JavaScript Date 包含毫秒',
    solution: `
      // ❌ 错误：直接比较
      if (new Date(ifModifiedSince) >= new Date(lastModified)) { }
      
      // ✅ 正确：忽略毫秒
      const clientSec = Math.floor(new Date(ifModifiedSince).getTime() / 1000);
      const resourceSec = Math.floor(new Date(lastModified).getTime() / 1000);
      if (clientSec >= resourceSec) { }
    `
  },
  
  // 2. 时区问题
  timezone: {
    problem: 'Last-Modified 必须是 GMT，但服务器可能在其他时区',
    solution: `
      // ✅ 使用 toUTCString()
      const lastModified = new Date().toUTCString();
      
      // ❌ 不要使用 toString() 或 toLocaleString()
    `
  },
  
  // 3. 无效日期格式
  invalidDate: {
    problem: '客户端可能发送无效的日期格式',
    solution: `
      try {
        const date = new Date(ifModifiedSince);
        if (isNaN(date.getTime())) {
          // 无效日期，忽略条件
        }
      } catch (err) {
        // 解析失败，忽略条件
      }
    `
  }
};
```

### 与 ETag 的配合使用

```javascript
// 同时使用 Last-Modified 和 ETag
app.get('/api/resource/:id', async (req, res) => {
  const resource = await getResource(req.params.id);
  
  if (!resource) {
    return res.status(404).send('Not found');
  }
  
  // 生成 ETag 和 Last-Modified
  const etag = generateETag(resource);
  const lastModified = resource.updatedAt.toUTCString();
  
  // 检查条件请求（ETag 优先）
  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  
  // 1. 优先检查 ETag
  if (ifNoneMatch) {
    if (ifNoneMatch === etag) {
      res.set({
        'ETag': etag,
        'Last-Modified': lastModified
      });
      return res.status(304).end();
    }
  }
  // 2. 如果没有 ETag，检查 Last-Modified
  else if (ifModifiedSince) {
    const clientDate = new Date(ifModifiedSince);
    const resourceDate = new Date(resource.updatedAt);
    
    if (Math.floor(clientDate.getTime() / 1000) >= 
        Math.floor(resourceDate.getTime() / 1000)) {
      res.set({
        'ETag': etag,
        'Last-Modified': lastModified
      });
      return res.status(304).end();
    }
  }
  
  // 正常响应
  res.set({
    'ETag': etag,
    'Last-Modified': lastModified,
    'Cache-Control': 'no-cache'
  });
  res.json(resource);
});
```

---

## 问题 4：Last-Modified 有哪些局限性和注意事项？

### 1. 精度限制

```javascript
// 问题：1秒内多次修改无法检测
const precisionIssue = {
  scenario: '高频更新的资源',
  example: `
    10:30:00.100 - 第一次修改
    10:30:00.500 - 第二次修改
    10:30:00.900 - 第三次修改
    
    Last-Modified: Wed, 27 Nov 2025 10:30:00 GMT
    // 三次修改的时间戳相同！
  `,
  solution: '使用 ETag 代替或配合使用'
};

// ✅ 解决方案：使用版本号或 ETag
app.get('/api/high-frequency-data', async (req, res) => {
  const data = await getData();
  
  // 使用版本号作为 ETag
  const etag = `"v${data.version}"`;
  
  // 仍然提供 Last-Modified（兼容性）
  const lastModified = data.updatedAt.toUTCString();
  
  res.set({
    'ETag': etag,  // 主要验证方式
    'Last-Modified': lastModified  // 备用
  });
  res.json(data);
});
```

### 2. 内容相同但时间变化

```javascript
// 问题：文件内容未变但时间戳更新
const contentIssue = {
  scenario: '文件被重新保存但内容相同',
  example: `
    // 原文件
    content: "Hello World"
    mtime: 10:00:00
    
    // 重新保存（内容相同）
    content: "Hello World"  // 相同
    mtime: 11:00:00         // 变化
    
    // Last-Modified 变化，但内容实际未变
    // 导致不必要的重新下载
  `,
  solution: '使用基于内容的 ETag'
};

// ✅ 解决方案
const crypto = require('crypto');

app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'files', req.params.filename);
  const content = fs.readFileSync(filePath);
  const stats = fs.statSync(filePath);
  
  // 基于内容的 ETag
  const etag = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
  
  // 基于时间的 Last-Modified
  const lastModified = stats.mtime.toUTCString();
  
  // ETag 更准确，Last-Modified 作为备用
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === etag) {
    res.set({ 'ETag': etag, 'Last-Modified': lastModified });
    return res.status(304).end();
  }
  
  res.set({ 'ETag': etag, 'Last-Modified': lastModified });
  res.send(content);
});
```

### 3. 分布式系统的时钟同步

```javascript
// 问题：多台服务器时钟不同步
const distributedIssue = {
  scenario: '负载均衡环境',
  problem: `
    Server A: 10:00:00 (时钟快5秒)
    Server B: 09:59:55 (时钟慢5秒)
    
    请求1 → Server A: Last-Modified: 10:00:00
    请求2 → Server B: Last-Modified: 09:59:55
    
    // 同一资源，不同的 Last-Modified
    // 导致缓存失效
  `,
  solution: '使用统一的时间源或 ETag'
};

// ✅ 解决方案1：使用数据库时间戳（统一时间源）
app.get('/api/data', async (req, res) => {
  const data = await db.query(
    'SELECT *, updated_at FROM resources WHERE id = ?',
    [req.params.id]
  );
  
  // 使用数据库的时间戳（所有服务器一致）
  const lastModified = new Date(data.updated_at).toUTCString();
  
  res.set('Last-Modified', lastModified);
  res.json(data);
});

// ✅ 解决方案2：使用版本号
app.get('/api/data', async (req, res) => {
  const data = await getData();
  
  // 版本号在所有服务器上一致
  const etag = `"v${data.version}"`;
  
  res.set('ETag', etag);
  res.json(data);
});
```

### 4. 动态生成的内容

```javascript
// 问题：每次生成的内容都不同
const dynamicIssue = {
  scenario: '包含动态元素的页面',
  example: `
    // 页面包含：
    - 当前时间
    - 随机广告
    - 用户特定内容
    
    // 每次请求内容都不同
    // Last-Modified 应该如何设置？
  `,
  solution: '区分核心内容和动态元素'
};

// ✅ 解决方案：基于核心内容
app.get('/articles/:id', async (req, res) => {
  const article = await Article.findByPk(req.params.id);
  
  // 只基于文章内容的修改时间
  // 不考虑动态元素（评论、广告等）
  const lastModified = article.updatedAt.toUTCString();
  
  const ifModifiedSince = req.headers['if-modified-since'];
  if (ifModifiedSince === lastModified) {
    return res.status(304).end();
  }
  
  // 渲染页面（包含动态元素）
  const html = await renderArticlePage(article, {
    currentTime: new Date(),
    ads: getRandomAds(),
    userComments: await getComments(article.id)
  });
  
  res.set('Last-Modified', lastModified);
  res.send(html);
});
```

### 5. 最佳实践总结

```javascript
// ✅ 推荐的缓存策略
const cachingStrategy = {
  // 1. 静态文件：使用 Last-Modified
  staticFiles: {
    headers: {
      'Last-Modified': 'file mtime',
      'Cache-Control': 'public, max-age=31536000'
    },
    reason: '文件时间戳准确且高效'
  },
  
  // 2. API 数据：优先 ETag，备用 Last-Modified
  apiData: {
    headers: {
      'ETag': 'content hash or version',
      'Last-Modified': 'database timestamp',
      'Cache-Control': 'no-cache'
    },
    reason: 'ETag 更准确，Last-Modified 兼容性好'
  },
  
  // 3. 频繁变化的数据：只用 ETag
  frequentChanges: {
    headers: {
      'ETag': 'version number',
      'Cache-Control': 'no-cache'
    },
    reason: 'Last-Modified 精度不够'
  },
  
  // 4. 敏感数据：不缓存
  sensitiveData: {
    headers: {
      'Cache-Control': 'no-store, no-cache'
    },
    reason: '安全优先'
  }
};
```

## 总结

**Last-Modified 核心要点**：

### 1. 生成方式

- **静态文件**：使用文件系统的 mtime
- **数据库资源**：使用 updated_at 字段
- **聚合数据**：使用最新项的时间或查询 MAX(updated_at)
- **缓存数据**：维护单独的时间戳

### 2. 条件请求

- **If-Modified-Since**：GET/HEAD 请求，返回 304
- **If-Unmodified-Since**：PUT/DELETE 请求，返回 412
- 时间比较需要忽略毫秒
- 必须使用 GMT 时区

### 3. 局限性

- 精度只到秒级
- 内容未变但时间可能变
- 分布式系统时钟同步问题
- 不适合高频更新的资源

### 4. 最佳实践

- 静态文件优先使用 Last-Modified
- API 数据配合 ETag 使用
- 注意时间比较的精度问题
- 分布式环境使用统一时间源

## 延伸阅读

- [MDN - Last-Modified](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)
- [MDN - If-Modified-Since](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-Modified-Since)
- [RFC 7232 - Conditional Requests](https://datatracker.ietf.org/doc/html/rfc7232)
- [HTTP Caching - MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [ETag vs Last-Modified](https://stackoverflow.com/questions/824152/what-is-the-difference-between-etag-and-last-modified)
