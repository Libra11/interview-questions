---
title: ETag 的值在什么情况下会发生变化？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP ETag 的生成机制和变化规则，掌握强 ETag 和弱 ETag 的区别，了解影响 ETag 值的各种因素，以及如何在实际应用中正确使用 ETag 进行缓存验证。
tags:
  - HTTP
  - ETag
  - 缓存
  - 条件请求
estimatedTime: 23 分钟
keywords:
  - ETag
  - 强ETag
  - 弱ETag
  - 缓存验证
highlight: 理解 ETag 的变化机制，掌握强弱 ETag 的使用场景和最佳实践
order: 470
---

## 问题 1：ETag 是什么，它是如何工作的？

**ETag**（Entity Tag）是 HTTP 响应头，用于标识资源的特定版本，是一个**内容指纹**。

### 基本概念

```http
ETag: "5d41402abc4b2a76b9719d911017c592"

特点：
- 字符串值，通常用双引号包裹
- 内容的唯一标识符
- 内容变化 → ETag 变化
- 内容不变 → ETag 不变
```

### 工作流程

```javascript
// 完整的 ETag 缓存验证流程

// 第一次请求
Client → Server: GET /api/user/123
Server → Client: 200 OK
                 ETag: "abc123"
                 Cache-Control: no-cache
                 { "name": "John", "age": 30 }

// 浏览器缓存响应和 ETag

// 第二次请求（带验证）
Client → Server: GET /api/user/123
                 If-None-Match: "abc123"

// 场景1：内容未变
Server → Client: 304 Not Modified
                 ETag: "abc123"
                 // 无响应体，使用缓存

// 场景2：内容已变
Server → Client: 200 OK
                 ETag: "def456"  // 新的 ETag
                 { "name": "John", "age": 31 }  // 更新的数据
```

### ETag 的优势

```javascript
const advantages = {
  // 1. 精确性
  precision: {
    description: '基于内容而非时间',
    example: `
      // 文件被重新保存但内容相同
      Last-Modified: 变化 ❌
      ETag: 不变 ✅
    `
  },
  
  // 2. 可靠性
  reliability: {
    description: '不受服务器时钟影响',
    example: `
      // 分布式系统中
      Server A: Last-Modified 可能不同 ❌
      Server A: ETag 基于内容，相同 ✅
    `
  },
  
  // 3. 灵活性
  flexibility: {
    description: '可以自定义生成规则',
    example: `
      // 可以基于：
      - 内容哈希
      - 版本号
      - 时间戳 + 内容大小
      - 自定义逻辑
    `
  }
};
```

---

## 问题 2：ETag 在什么情况下会发生变化？

ETag 的变化取决于生成算法和资源的实际变化。

### 1. 内容变化（最常见）

```javascript
// 基于内容哈希的 ETag
const crypto = require('crypto');

function generateETag(content) {
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
}

// 示例
const content1 = JSON.stringify({ name: 'John', age: 30 });
const etag1 = generateETag(content1);
// "5d41402abc4b2a76b9719d911017c592"

const content2 = JSON.stringify({ name: 'John', age: 31 });
const etag2 = generateETag(content2);
// "7b8f4654321abc9876543210fedcba98"  // 不同

// 内容变化 → ETag 变化 ✅
```

### 2. 版本号变化

```javascript
// 基于版本号的 ETag
app.get('/api/article/:id', async (req, res) => {
  const article = await Article.findByPk(req.params.id);
  
  // 使用数据库的版本号
  const etag = `"v${article.version}"`;
  
  // 每次更新时版本号递增
  // UPDATE articles SET version = version + 1 WHERE id = ?
  
  res.set('ETag', etag);
  res.json(article);
});

// 版本号变化 → ETag 变化
// v1 → v2 → v3
```

### 3. 文件属性变化

```javascript
// 基于文件属性的 ETag（Nginx 默认方式）
function generateFileETag(filePath) {
  const stats = fs.statSync(filePath);
  
  // 组合：修改时间 + 文件大小
  const mtime = stats.mtime.getTime().toString(16);
  const size = stats.size.toString(16);
  
  return `"${mtime}-${size}"`;
}

// 示例
const file1 = './data.json';
const etag1 = generateFileETag(file1);
// "18c5a2b3f4d-1a2b"

// 文件被修改（内容或大小变化）
fs.writeFileSync(file1, 'new content');
const etag2 = generateFileETag(file1);
// "18c5a2b3f5e-1a3c"  // 不同

// 文件修改 → ETag 变化 ✅
```

### 4. 压缩编码变化

```javascript
// 不同的 Content-Encoding 可能有不同的 ETag
app.get('/api/data', (req, res) => {
  const data = getData();
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    // gzip 压缩
    const compressed = zlib.gzipSync(JSON.stringify(data));
    const etag = `"${generateHash(compressed)}"`;
    
    res.set({
      'Content-Encoding': 'gzip',
      'ETag': etag
    });
    res.send(compressed);
  } else {
    // 未压缩
    const content = JSON.stringify(data);
    const etag = `"${generateHash(content)}"`;
    
    res.set('ETag', etag);
    res.send(content);
  }
  
  // 同一资源，不同编码 → 不同 ETag
});

// 更好的做法：使用弱 ETag
app.get('/api/data', (req, res) => {
  const data = getData();
  
  // 弱 ETag：基于原始内容
  const weakETag = `W/"${generateHash(JSON.stringify(data))}"`;
  
  res.set('ETag', weakETag);
  // 压缩与否不影响 ETag
  res.json(data);
});
```

### 5. 聚合资源的子资源变化

```javascript
// 列表资源：任何子项变化都会导致 ETag 变化
app.get('/api/articles', async (req, res) => {
  const articles = await Article.findAll();
  
  // 方式1：基于整个列表的哈希
  const content = JSON.stringify(articles);
  const etag = `"${generateHash(content)}"`;
  
  // 任何文章的任何字段变化 → ETag 变化
  
  res.set('ETag', etag);
  res.json(articles);
});

// 方式2：基于版本号的组合
app.get('/api/articles', async (req, res) => {
  const articles = await Article.findAll();
  
  // 所有文章版本号的组合
  const versionSum = articles.reduce((sum, a) => sum + a.version, 0);
  const etag = `"v${versionSum}"`;
  
  // 任何文章更新 → 版本号和变化 → ETag 变化
  
  res.set('ETag', etag);
  res.json(articles);
});
```

---

## 问题 3：强 ETag 和弱 ETag 有什么区别？

### 强 ETag（Strong ETag）

```javascript
// 强 ETag：字节级别完全相同
const strongETag = {
  format: '"abc123"',  // 无 W/ 前缀
  meaning: '资源的字节完全相同',
  
  example: `
    ETag: "5d41402abc4b2a76b9719d911017c592"
    
    // 任何字节变化都会导致 ETag 变化
    // 包括：
    - 内容变化
    - 空格变化
    - 换行符变化
    - 压缩编码变化
  `
};

// 生成强 ETag
app.get('/api/data', (req, res) => {
  const data = getData();
  const content = JSON.stringify(data);
  
  // MD5 哈希（字节级别）
  const hash = crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
  
  const strongETag = `"${hash}"`;
  
  res.set('ETag', strongETag);
  res.send(content);
});
```

### 弱 ETag（Weak ETag）

```javascript
// 弱 ETag：语义等价即可
const weakETag = {
  format: 'W/"abc123"',  // W/ 前缀
  meaning: '资源在语义上等价',
  
  example: `
    ETag: W/"abc123"
    
    // 以下变化不影响 ETag：
    - 压缩编码（gzip vs 原始）
    - 空格/换行符的微小变化
    - 不影响语义的格式变化
  `
};

// 生成弱 ETag
app.get('/api/data', (req, res) => {
  const data = getData();
  
  // 基于数据的语义内容
  const semanticContent = JSON.stringify(data, Object.keys(data).sort());
  const hash = crypto
    .createHash('md5')
    .update(semanticContent)
    .digest('hex');
  
  const weakETag = `W/"${hash}"`;
  
  res.set('ETag', weakETag);
  res.json(data);  // Express 会自动处理压缩
});
```

### 使用场景对比

```javascript
const useCases = {
  // 强 ETag 适用场景
  strongETag: {
    scenarios: [
      '二进制文件（图片、视频、可执行文件）',
      '需要字节级别精确匹配的资源',
      '范围请求（Range requests）'
    ],
    
    example: `
      // 图片文件
      app.get('/images/:id', (req, res) => {
        const image = fs.readFileSync('./image.png');
        const etag = generateHash(image);
        
        res.set('ETag', \`"\${etag}"\`);  // 强 ETag
        res.send(image);
      });
    `
  },
  
  // 弱 ETag 适用场景
  weakETag: {
    scenarios: [
      'JSON/XML API 响应',
      '可能被压缩的文本资源',
      'HTML 页面（格式化可能变化）'
    ],
    
    example: `
      // API 响应
      app.get('/api/users', (req, res) => {
        const users = getUsers();
        const etag = generateHash(JSON.stringify(users));
        
        res.set('ETag', \`W/"\${etag}"\`);  // 弱 ETag
        res.json(users);
      });
    `
  }
};
```

### 条件请求中的差异

```javascript
// If-None-Match：强弱 ETag 都支持
app.get('/api/data', (req, res) => {
  const data = getData();
  const etag = `W/"${generateHash(JSON.stringify(data))}"`;
  
  const ifNoneMatch = req.headers['if-none-match'];
  
  // 弱比较：忽略 W/ 前缀
  if (ifNoneMatch) {
    const clientETag = ifNoneMatch.replace(/^W\//, '');
    const serverETag = etag.replace(/^W\//, '');
    
    if (clientETag === serverETag) {
      res.set('ETag', etag);
      return res.status(304).end();
    }
  }
  
  res.set('ETag', etag);
  res.json(data);
});

// If-Range：只支持强 ETag
app.get('/files/:id', (req, res) => {
  const file = getFile(req.params.id);
  const strongETag = `"${generateHash(file.content)}"`;
  
  const ifRange = req.headers['if-range'];
  const range = req.headers['range'];
  
  if (range && ifRange) {
    // If-Range 必须是强 ETag
    if (ifRange.startsWith('W/')) {
      // 弱 ETag，忽略 If-Range，返回完整文件
      res.set('ETag', strongETag);
      return res.send(file.content);
    }
    
    if (ifRange === strongETag) {
      // ETag 匹配，返回范围
      return sendRange(res, file, range);
    }
  }
  
  res.set('ETag', strongETag);
  res.send(file.content);
});
```

---

## 问题 4：如何在实际应用中正确生成和使用 ETag？

### 1. 选择合适的生成算法

```javascript
// 方式1：内容哈希（最准确）
function generateContentETag(content) {
  const hash = crypto
    .createHash('md5')  // 或 sha256
    .update(content)
    .digest('hex');
  return `"${hash}"`;
}

// 方式2：版本号（最高效）
function generateVersionETag(version) {
  return `"v${version}"`;
}

// 方式3：时间戳 + 大小（Nginx 默认）
function generateFileETag(stats) {
  const mtime = stats.mtime.getTime().toString(16);
  const size = stats.size.toString(16);
  return `"${mtime}-${size}"`;
}

// 方式4：自定义组合
function generateCustomETag(resource) {
  // 组合多个因素
  const parts = [
    resource.id,
    resource.version,
    resource.updatedAt.getTime()
  ];
  const combined = parts.join('-');
  const hash = crypto
    .createHash('md5')
    .update(combined)
    .digest('hex');
  return `"${hash}"`;
}

// 选择建议
const recommendations = {
  staticFiles: 'generateFileETag',      // 文件属性
  apiData: 'generateVersionETag',       // 版本号
  dynamicContent: 'generateContentETag', // 内容哈希
  hybrid: 'generateCustomETag'          // 自定义组合
};
```

### 2. 处理条件请求

```javascript
// 完整的 ETag 条件请求处理
class ETagHandler {
  // 生成 ETag
  static generate(resource, weak = false) {
    const content = JSON.stringify(resource);
    const hash = crypto
      .createHash('md5')
      .update(content)
      .digest('hex');
    
    return weak ? `W/"${hash}"` : `"${hash}"`;
  }
  
  // 比较 ETag
  static match(clientETag, serverETag, weakComparison = true) {
    if (!clientETag || !serverETag) {
      return false;
    }
    
    if (weakComparison) {
      // 弱比较：忽略 W/ 前缀
      const client = clientETag.replace(/^W\//, '');
      const server = serverETag.replace(/^W\//, '');
      return client === server;
    } else {
      // 强比较：必须完全相同
      return clientETag === serverETag;
    }
  }
  
  // 处理 If-None-Match
  static handleIfNoneMatch(req, res, resource) {
    const etag = this.generate(resource, true);
    const ifNoneMatch = req.headers['if-none-match'];
    
    if (ifNoneMatch) {
      // 支持多个 ETag（逗号分隔）
      const clientETags = ifNoneMatch.split(',').map(e => e.trim());
      
      for (const clientETag of clientETags) {
        if (this.match(clientETag, etag)) {
          res.set('ETag', etag);
          return res.status(304).end();
        }
      }
    }
    
    res.set('ETag', etag);
    return null;
  }
  
  // 处理 If-Match
  static handleIfMatch(req, res, resource) {
    const etag = this.generate(resource);
    const ifMatch = req.headers['if-match'];
    
    if (ifMatch) {
      if (ifMatch === '*') {
        // * 表示资源存在即可
        return null;
      }
      
      const clientETags = ifMatch.split(',').map(e => e.trim());
      let matched = false;
      
      for (const clientETag of clientETags) {
        if (this.match(clientETag, etag, false)) {  // 强比较
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        return res.status(412).send('Precondition Failed');
      }
    }
    
    return null;
  }
}

// 使用示例
app.get('/api/resource/:id', async (req, res) => {
  const resource = await getResource(req.params.id);
  
  if (!resource) {
    return res.status(404).send('Not found');
  }
  
  // 处理 If-None-Match
  const conditionalResponse = ETagHandler.handleIfNoneMatch(req, res, resource);
  if (conditionalResponse) {
    return;
  }
  
  res.json(resource);
});

app.put('/api/resource/:id', async (req, res) => {
  const resource = await getResource(req.params.id);
  
  if (!resource) {
    return res.status(404).send('Not found');
  }
  
  // 处理 If-Match（防止并发更新）
  const conditionalResponse = ETagHandler.handleIfMatch(req, res, resource);
  if (conditionalResponse) {
    return;
  }
  
  // 更新资源
  await updateResource(req.params.id, req.body);
  res.json({ success: true });
});
```

### 3. 性能优化

```javascript
// 缓存 ETag 值
const etagCache = new Map();

app.get('/api/expensive-data', async (req, res) => {
  const cacheKey = 'expensive-data';
  
  // 检查缓存
  let cached = etagCache.get(cacheKey);
  
  if (!cached || isCacheExpired(cached)) {
    // 重新计算
    const data = await getExpensiveData();
    const etag = generateETag(JSON.stringify(data));
    
    cached = {
      data,
      etag,
      timestamp: Date.now()
    };
    
    etagCache.set(cacheKey, cached);
  }
  
  // 条件请求
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch === cached.etag) {
    res.set('ETag', cached.etag);
    return res.status(304).end();
  }
  
  res.set('ETag', cached.etag);
  res.json(cached.data);
});

// 使用更快的哈希算法
function fastETag(content) {
  // xxhash 比 MD5 快得多
  const xxhash = require('xxhash');
  const hash = xxhash.hash64(Buffer.from(content), 0).toString(16);
  return `"${hash}"`;
}
```

### 4. 分布式系统中的 ETag

```javascript
// 确保多台服务器生成相同的 ETag
class DistributedETag {
  // ✅ 基于数据库版本号（推荐）
  static fromVersion(resource) {
    return `"v${resource.version}"`;
  }
  
  // ✅ 基于内容哈希
  static fromContent(resource) {
    // 确保 JSON 序列化顺序一致
    const content = JSON.stringify(resource, Object.keys(resource).sort());
    return generateETag(content);
  }
  
  // ❌ 避免：基于服务器本地时间
  static wrongWay(resource) {
    const timestamp = Date.now();  // 每台服务器不同！
    return `"${timestamp}"`;
  }
  
  // ❌ 避免：基于随机数
  static alsoWrong(resource) {
    const random = Math.random();  // 每次都不同！
    return `"${random}"`;
  }
}
```

## 总结

**ETag 变化机制核心要点**：

### 1. ETag 变化的情况

- **内容变化**：最常见，任何数据修改
- **版本号变化**：数据库版本号递增
- **文件属性变化**：修改时间或大小变化
- **子资源变化**：聚合资源的任何子项变化

### 2. 强 ETag vs 弱 ETag

- **强 ETag**：字节级别完全相同，用于二进制文件
- **弱 ETag**：语义等价即可，用于 API 响应
- **W/ 前缀**：标识弱 ETag
- **If-Range**：只支持强 ETag

### 3. 生成策略

- **内容哈希**：最准确但有性能开销
- **版本号**：最高效，需要数据库支持
- **文件属性**：适合静态文件
- **自定义组合**：灵活但需要仔细设计

### 4. 最佳实践

- API 响应使用弱 ETag
- 二进制文件使用强 ETag
- 分布式系统确保 ETag 一致性
- 配合 Cache-Control 使用
- 缓存 ETag 计算结果

## 延伸阅读

- [MDN - ETag](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)
- [MDN - If-None-Match](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/If-None-Match)
- [RFC 7232 - Conditional Requests](https://datatracker.ietf.org/doc/html/rfc7232)
- [Strong vs Weak ETags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag#directives)
- [HTTP Caching Best Practices](https://web.dev/http-cache/)
