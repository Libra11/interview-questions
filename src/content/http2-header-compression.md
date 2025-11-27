---
title: HTTP/2 的首部压缩是如何实现的？
category: 网络
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP/2 的 HPACK 首部压缩算法，掌握静态表和动态表的工作原理，了解霍夫曼编码的应用，以及首部压缩如何显著提升 HTTP/2 的性能。
tags:
  - HTTP/2
  - HPACK
  - 性能优化
  - 网络协议
estimatedTime: 25 分钟
keywords:
  - HTTP/2 首部压缩
  - HPACK
  - 静态表
  - 动态表
highlight: 掌握 HTTP/2 HPACK 压缩算法，理解如何通过首部压缩大幅减少网络传输
order: 203
---

## 问题 1：为什么 HTTP/2 需要首部压缩？

在 HTTP/1.x 中，请求和响应的首部（Headers）是**明文传输**且**未压缩**的，这导致了大量的带宽浪费。

### HTTP/1.x 的首部问题

```http
# 典型的 HTTP/1.1 请求首部（每次请求都要发送）
GET /api/users HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: sessionId=abc123; userId=456; preferences=xyz789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Referer: https://example.com/dashboard
Cache-Control: no-cache

# 这些首部大约 500-800 字节
# 如果页面有 100 个资源请求，就是 50-80 KB 的首部数据
```

### 首部冗余问题

```javascript
// 同一个页面的多个请求，首部高度重复
const requests = [
  {
    url: '/api/users',
    headers: {
      'Host': 'api.example.com',
      'User-Agent': 'Mozilla/5.0...',
      'Accept': 'application/json',
      'Cookie': 'sessionId=abc123',
      // ... 其他重复的首部
    }
  },
  {
    url: '/api/posts',
    headers: {
      'Host': 'api.example.com',        // 重复
      'User-Agent': 'Mozilla/5.0...',   // 重复
      'Accept': 'application/json',     // 重复
      'Cookie': 'sessionId=abc123',     // 重复
      // ... 90% 的首部都是重复的
    }
  }
];

// HTTP/1.x: 每次都完整发送所有首部
// HTTP/2: 只发送变化的部分
```

### 首部压缩的收益

```javascript
// 压缩效果示例
const compressionBenefit = {
  // 首次请求
  firstRequest: {
    original: '800 bytes',      // 原始首部大小
    compressed: '400 bytes',    // HPACK 压缩后
    ratio: '50%'
  },
  
  // 后续请求（大量重复首部）
  subsequentRequest: {
    original: '800 bytes',
    compressed: '50 bytes',     // 只发送索引和差异
    ratio: '93.75%'             // 压缩率极高
  },
  
  // 100 个请求的总节省
  totalSaving: {
    http1: '80 KB',
    http2: '5 KB',
    saved: '75 KB (93.75%)'
  }
};
```

---

## 问题 2：HPACK 压缩算法是如何工作的？

**HPACK** 是 HTTP/2 专门设计的首部压缩算法，它使用**静态表**、**动态表**和**霍夫曼编码**三种技术。

### HPACK 的三大核心技术

```javascript
// HPACK 压缩流程
function hpackCompress(headers) {
  const compressed = [];
  
  for (const [name, value] of Object.entries(headers)) {
    // 1. 查找静态表
    const staticIndex = findInStaticTable(name, value);
    if (staticIndex) {
      // 完全匹配：只发送索引
      compressed.push({ type: 'indexed', index: staticIndex });
      continue;
    }
    
    // 2. 查找动态表
    const dynamicIndex = findInDynamicTable(name, value);
    if (dynamicIndex) {
      compressed.push({ type: 'indexed', index: dynamicIndex });
      continue;
    }
    
    // 3. 部分匹配：名称在表中，值不在
    const nameIndex = findNameInTable(name);
    if (nameIndex) {
      // 发送名称索引 + 霍夫曼编码的值
      compressed.push({
        type: 'literal-with-indexing',
        nameIndex: nameIndex,
        value: huffmanEncode(value)
      });
      // 添加到动态表
      addToDynamicTable(name, value);
    } else {
      // 4. 完全不在表中：发送名称和值（都用霍夫曼编码）
      compressed.push({
        type: 'literal-with-indexing',
        name: huffmanEncode(name),
        value: huffmanEncode(value)
      });
      addToDynamicTable(name, value);
    }
  }
  
  return compressed;
}
```

### 1. 静态表（Static Table）

静态表包含 61 个常用的首部字段，客户端和服务器都预先知道：

```javascript
// HPACK 静态表（部分示例）
const STATIC_TABLE = [
  { index: 1,  name: ':authority',                value: '' },
  { index: 2,  name: ':method',                   value: 'GET' },
  { index: 3,  name: ':method',                   value: 'POST' },
  { index: 4,  name: ':path',                     value: '/' },
  { index: 5,  name: ':path',                     value: '/index.html' },
  { index: 6,  name: ':scheme',                   value: 'http' },
  { index: 7,  name: ':scheme',                   value: 'https' },
  { index: 8,  name: ':status',                   value: '200' },
  { index: 9,  name: ':status',                   value: '204' },
  { index: 10, name: ':status',                   value: '206' },
  // ...
  { index: 15, name: 'accept-encoding',           value: 'gzip, deflate' },
  { index: 16, name: 'accept-language',           value: '' },
  // ...
  { index: 31, name: 'cookie',                    value: '' },
  { index: 32, name: 'date',                      value: '' },
  // ...
  { index: 61, name: 'www-authenticate',          value: '' }
];

// 使用示例
const headers = {
  ':method': 'GET',
  ':scheme': 'https',
  ':path': '/'
};

// 压缩后只需发送索引
const compressed = [
  { index: 2 },  // :method: GET
  { index: 7 },  // :scheme: https
  { index: 4 }   // :path: /
];
// 原始: 约 30 字节
// 压缩后: 约 3 字节
```

### 2. 动态表（Dynamic Table）

动态表用于存储连接期间出现的首部，会随着通信动态更新：

```javascript
// 动态表管理
class DynamicTable {
  constructor(maxSize = 4096) { // 默认 4KB
    this.entries = [];
    this.size = 0;
    this.maxSize = maxSize;
  }
  
  // 添加条目
  add(name, value) {
    const entry = { name, value };
    const entrySize = name.length + value.length + 32; // 32 字节开销
    
    // 如果新条目太大，清空表
    if (entrySize > this.maxSize) {
      this.entries = [];
      this.size = 0;
      return;
    }
    
    // 驱逐旧条目以腾出空间
    while (this.size + entrySize > this.maxSize) {
      const removed = this.entries.pop();
      this.size -= (removed.name.length + removed.value.length + 32);
    }
    
    // 添加到表头（最新的条目）
    this.entries.unshift(entry);
    this.size += entrySize;
  }
  
  // 查找条目
  find(name, value) {
    // 动态表索引从 62 开始（静态表占用 1-61）
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      if (entry.name === name && entry.value === value) {
        return 62 + i; // 返回索引
      }
    }
    return null;
  }
  
  // 查找名称
  findName(name) {
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].name === name) {
        return 62 + i;
      }
    }
    return null;
  }
}

// 使用示例
const dynamicTable = new DynamicTable();

// 第一个请求
dynamicTable.add('cookie', 'sessionId=abc123');
dynamicTable.add('authorization', 'Bearer token123');

// 第二个请求：相同的 cookie
// 直接使用索引 62（动态表第一个条目）
const compressed = { index: 62 }; // 代替完整的 cookie 字符串
```

### 3. 霍夫曼编码（Huffman Coding）

对于不能索引的字符串值，使用霍夫曼编码进一步压缩：

```javascript
// 霍夫曼编码示例（简化）
const HUFFMAN_TABLE = {
  // 常见字符使用更短的编码
  'a': '00',
  'e': '01',
  't': '100',
  'o': '101',
  // 不常见字符使用更长的编码
  'z': '11111110',
  'q': '111111110'
};

function huffmanEncode(str) {
  let bits = '';
  for (const char of str) {
    bits += HUFFMAN_TABLE[char] || '11111111'; // 默认编码
  }
  return bits;
}

// 实际效果
const original = 'accept-encoding';
const encoded = huffmanEncode(original);
// 原始: 15 字节 (120 bits)
// 编码后: 约 10 字节 (80 bits)
// 节省: 33%
```

---

## 问题 3：首部压缩的完整流程是怎样的？

让我们通过一个完整的例子来理解 HPACK 的工作流程。

### 场景：访问一个网页

```javascript
// 第一个请求：GET /index.html
const request1 = {
  ':method': 'GET',
  ':scheme': 'https',
  ':path': '/index.html',
  ':authority': 'www.example.com',
  'user-agent': 'Mozilla/5.0 Chrome/120.0',
  'accept': 'text/html',
  'accept-encoding': 'gzip, deflate, br',
  'cookie': 'sessionId=abc123'
};

// HPACK 压缩过程
const compressed1 = [
  { indexed: 2 },              // :method: GET (静态表)
  { indexed: 7 },              // :scheme: https (静态表)
  { indexed: 5 },              // :path: /index.html (静态表)
  { 
    literal: true,
    nameIndex: 1,              // :authority (静态表名称)
    value: huffman('www.example.com'),
    addToTable: true           // 添加到动态表 [62]
  },
  {
    literal: true,
    name: huffman('user-agent'),
    value: huffman('Mozilla/5.0 Chrome/120.0'),
    addToTable: true           // 添加到动态表 [63]
  },
  // ... 其他首部类似处理
];

// 压缩效果
// 原始大小: ~350 字节
// 压缩后: ~150 字节 (57% 压缩率)
```

```javascript
// 第二个请求：GET /style.css（同一个连接）
const request2 = {
  ':method': 'GET',
  ':scheme': 'https',
  ':path': '/style.css',        // 变化
  ':authority': 'www.example.com',
  'user-agent': 'Mozilla/5.0 Chrome/120.0',
  'accept': 'text/css',         // 变化
  'accept-encoding': 'gzip, deflate, br',
  'cookie': 'sessionId=abc123'
};

// HPACK 压缩（利用动态表）
const compressed2 = [
  { indexed: 2 },              // :method: GET
  { indexed: 7 },              // :scheme: https
  {
    literal: true,
    nameIndex: 4,              // :path (静态表名称)
    value: huffman('/style.css')
  },
  { indexed: 62 },             // :authority (动态表)
  { indexed: 63 },             // user-agent (动态表)
  {
    literal: true,
    nameIndex: 19,             // accept (静态表名称)
    value: huffman('text/css')
  },
  { indexed: 16 },             // accept-encoding (静态表)
  { indexed: 64 }              // cookie (动态表)
];

// 压缩效果
// 原始大小: ~350 字节
// 压缩后: ~50 字节 (85% 压缩率) ✨
```

### 动态表状态变化

```javascript
// 连接建立时
dynamicTable = [];

// 第一个请求后
dynamicTable = [
  { index: 62, name: ':authority', value: 'www.example.com' },
  { index: 63, name: 'user-agent', value: 'Mozilla/5.0 Chrome/120.0' },
  { index: 64, name: 'cookie', value: 'sessionId=abc123' },
  { index: 65, name: 'accept', value: 'text/html' }
];

// 第二个请求后（accept 值变化，添加新条目）
dynamicTable = [
  { index: 62, name: 'accept', value: 'text/css' },        // 新条目
  { index: 63, name: ':authority', value: 'www.example.com' },
  { index: 64, name: 'user-agent', value: 'Mozilla/5.0 Chrome/120.0' },
  { index: 65, name: 'cookie', value: 'sessionId=abc123' },
  { index: 66, name: 'accept', value: 'text/html' }
];
```

---

## 问题 4：首部压缩有哪些注意事项和安全问题？

### 1. CRIME 和 BREACH 攻击

首部压缩可能导致安全问题，特别是在 HTTPS 中：

```javascript
// CRIME/BREACH 攻击原理
// 攻击者可以通过观察压缩后的数据大小来推测秘密信息

// 场景：攻击者想窃取 Cookie
const secretCookie = 'sessionId=secret123';

// 攻击者注入不同的猜测值
const guess1 = 'sessionId=secret1';   // 压缩后: 较大
const guess2 = 'sessionId=secret12';  // 压缩后: 较大
const guess3 = 'sessionId=secret123'; // 压缩后: 较小 ✓ (匹配！)

// 如果猜测正确，由于重复，压缩率会更高，数据包更小
// 攻击者通过观察数据包大小可以逐字节破解秘密
```

### HPACK 的防护措施

```javascript
// HPACK 的安全设计
const securityMeasures = {
  // 1. 不压缩敏感首部（可选）
  neverIndexed: [
    'authorization',
    'cookie',
    'set-cookie'
  ],
  
  // 2. 使用 "Never Indexed" 标志
  sensitiveHeader: {
    literal: true,
    neverIndexed: true,  // 不添加到动态表
    name: 'authorization',
    value: 'Bearer token'
  },
  
  // 3. 限制动态表大小
  dynamicTableSize: {
    default: 4096,       // 4KB
    max: 65536,          // 64KB
    min: 0               // 可以完全禁用
  }
};

// 服务器配置示例（Nginx）
// http2_max_field_size 16k;
// http2_max_header_size 32k;
```

### 2. 动态表大小管理

```javascript
// 动态表大小更新
class HTTP2Connection {
  constructor() {
    this.dynamicTableSize = 4096; // 默认 4KB
  }
  
  // 更新动态表大小（通过 SETTINGS 帧）
  updateDynamicTableSize(newSize) {
    if (newSize < this.dynamicTableSize) {
      // 缩小：需要驱逐条目
      this.evictEntries(newSize);
    }
    this.dynamicTableSize = newSize;
  }
  
  evictEntries(newSize) {
    let currentSize = this.calculateTableSize();
    while (currentSize > newSize && this.dynamicTable.length > 0) {
      const removed = this.dynamicTable.pop();
      currentSize -= (removed.name.length + removed.value.length + 32);
    }
  }
}
```

### 3. 首部大小限制

```javascript
// HTTP/2 首部大小限制
const headerLimits = {
  // 单个首部字段的最大大小
  maxFieldSize: 8192,      // 8KB (可配置)
  
  // 所有首部的总大小
  maxHeaderListSize: 16384, // 16KB (可配置)
  
  // 超过限制的处理
  handleOversized(headers) {
    const totalSize = calculateHeaderSize(headers);
    if (totalSize > this.maxHeaderListSize) {
      // 发送 REFUSED_STREAM 错误
      throw new HTTP2Error('REFUSED_STREAM', 'Header list too large');
    }
  }
};

// Node.js 服务器配置
const http2 = require('http2');
const server = http2.createSecureServer({
  settings: {
    maxHeaderListSize: 16384  // 16KB
  }
});
```

### 4. 实际应用建议

```javascript
// ✅ 最佳实践
const bestPractices = {
  // 1. 合理设置动态表大小
  dynamicTableSize: 4096,  // 对于大多数应用足够
  
  // 2. 敏感信息不索引
  sensitiveHeaders: ['authorization', 'cookie', 'set-cookie'],
  
  // 3. 避免过大的首部
  maxCookieSize: 4096,     // 限制 Cookie 大小
  
  // 4. 使用 HTTP/2 服务器推送时注意首部
  serverPush: {
    // 推送资源时复用主请求的首部
    reuseHeaders: true
  }
};

// ❌ 避免的做法
const antiPatterns = {
  // 1. 在 Cookie 中存储大量数据
  largeCookie: 'data=' + 'x'.repeat(10000), // 不要这样做
  
  // 2. 使用过多的自定义首部
  tooManyHeaders: {
    'x-custom-1': 'value1',
    'x-custom-2': 'value2',
    // ... 100 个自定义首部
  },
  
  // 3. 频繁变化的首部值
  randomHeader: {
    'x-request-id': Math.random() // 每次都不同，无法压缩
  }
};
```

## 总结

**HTTP/2 首部压缩核心要点**：

### 1. 压缩原理

- 使用 HPACK 算法专门为 HTTP/2 设计
- 结合静态表、动态表和霍夫曼编码
- 首次请求压缩 50%，后续请求压缩 90%+

### 2. 三大技术

- **静态表**：61 个预定义的常用首部
- **动态表**：连接期间动态维护的首部缓存
- **霍夫曼编码**：对字符串值进一步压缩

### 3. 安全考虑

- 敏感首部使用 "Never Indexed" 标志
- 合理设置动态表大小限制
- 注意 CRIME/BREACH 攻击风险
- 限制首部总大小

### 4. 最佳实践

- 优先使用 HTTP/2 的标准首部
- 避免过大或过多的自定义首部
- 敏感信息不要添加到动态表
- 合理配置服务器的首部大小限制

## 延伸阅读

- [RFC 7541 - HPACK: Header Compression for HTTP/2](https://datatracker.ietf.org/doc/html/rfc7541)
- [HTTP/2 规范 - RFC 7540](https://datatracker.ietf.org/doc/html/rfc7540)
- [HPACK Static Table](https://httpwg.org/specs/rfc7541.html#static.table.definition)
- [HTTP/2 Security Considerations](https://httpwg.org/specs/rfc7540.html#security)
- [Cloudflare - HTTP/2 Prioritization](https://blog.cloudflare.com/http-2-prioritization-with-nginx/)
