---
title: HTTP 请求和响应的报文结构是怎样的？
category: 网络
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  深入理解 HTTP 请求和响应报文的完整结构，掌握请求行、响应行、首部字段和消息体的组成，了解 HTTP 报文的解析过程，为深入学习 HTTP 协议打下坚实基础。
tags:
  - HTTP
  - 网络协议
  - 报文结构
  - Web基础
estimatedTime: 20 分钟
keywords:
  - HTTP报文
  - 请求报文
  - 响应报文
  - HTTP结构
highlight: 掌握 HTTP 报文的完整结构，理解请求和响应的组成部分
order: 478
---

## 问题 1：HTTP 请求报文的结构是怎样的？

HTTP 请求报文由四个部分组成：**请求行**、**请求头**、**空行**和**请求体**。

### 完整的请求报文示例

```http
POST /api/users HTTP/1.1                          ← 请求行
Host: api.example.com                             ← 请求头开始
User-Agent: Mozilla/5.0 (Windows NT 10.0)
Content-Type: application/json
Content-Length: 45
Accept: application/json
Cookie: sessionId=abc123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
                                                  ← 空行（CRLF）
{"name":"John","email":"john@example.com"}        ← 请求体
```

### 1. 请求行（Request Line）

```javascript
// 格式：方法 路径 协议版本
const requestLine = {
  format: 'Method Request-URI HTTP-Version CRLF',
  
  example: 'POST /api/users HTTP/1.1',
  
  parts: {
    method: 'POST',           // HTTP 方法
    requestURI: '/api/users', // 请求路径
    httpVersion: 'HTTP/1.1'   // 协议版本
  }
};

// 常见的 HTTP 方法
const methods = {
  GET: '获取资源',
  POST: '创建资源',
  PUT: '更新资源（完整）',
  PATCH: '更新资源（部分）',
  DELETE: '删除资源',
  HEAD: '获取响应头（不含响应体）',
  OPTIONS: '查询支持的方法',
  TRACE: '追踪请求路径',
  CONNECT: '建立隧道连接'
};
```

### 2. 请求头（Request Headers）

```javascript
// 请求头的分类
const requestHeaders = {
  // 通用首部
  general: {
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Date': 'Wed, 27 Nov 2025 10:00:00 GMT'
  },
  
  // 请求首部
  request: {
    'Host': 'api.example.com',           // 必需
    'User-Agent': 'Mozilla/5.0...',
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://example.com/page',
    'Cookie': 'sessionId=abc123',
    'Authorization': 'Bearer token'
  },
  
  // 实体首部
  entity: {
    'Content-Type': 'application/json',
    'Content-Length': '45',
    'Content-Encoding': 'gzip'
  }
};

// 示例：完整的请求头
const fullRequestHeaders = `
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: application/json
Content-Length: 45
Cookie: sessionId=abc123; userId=456
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
Origin: https://example.com
Referer: https://example.com/dashboard
`;
```

### 3. 空行（Blank Line）

```javascript
// 空行的作用
const blankLine = {
  format: 'CRLF (\\r\\n)',
  purpose: '分隔请求头和请求体',
  importance: '必需！即使没有请求体也要有空行',
  
  example: `
    POST /api/users HTTP/1.1
    Host: api.example.com
    Content-Type: application/json
    ← 这里是空行（\\r\\n）
    {"name":"John"}
  `
};
```

### 4. 请求体（Request Body）

```javascript
// 不同类型的请求体
const requestBodies = {
  // 1. JSON 数据
  json: {
    contentType: 'application/json',
    example: '{"name":"John","age":30}'
  },
  
  // 2. 表单数据（URL 编码）
  urlencoded: {
    contentType: 'application/x-www-form-urlencoded',
    example: 'name=John&age=30&email=john%40example.com'
  },
  
  // 3. 多部分表单（文件上传）
  multipart: {
    contentType: 'multipart/form-data; boundary=----WebKitFormBoundary',
    example: `
------WebKitFormBoundary
Content-Disposition: form-data; name="name"

John
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[二进制数据]
------WebKitFormBoundary--
    `
  },
  
  // 4. 纯文本
  text: {
    contentType: 'text/plain',
    example: 'This is plain text'
  },
  
  // 5. XML
  xml: {
    contentType: 'application/xml',
    example: '<user><name>John</name><age>30</age></user>'
  }
};
```

---

## 问题 2：HTTP 响应报文的结构是怎样的？

HTTP 响应报文也由四个部分组成：**状态行**、**响应头**、**空行**和**响应体**。

### 完整的响应报文示例

```http
HTTP/1.1 200 OK                                   ← 状态行
Date: Wed, 27 Nov 2025 10:00:00 GMT               ← 响应头开始
Server: nginx/1.18.0
Content-Type: application/json; charset=utf-8
Content-Length: 58
Cache-Control: no-cache
ETag: "5d41402abc4b2a76b9719d911017c592"
Set-Cookie: sessionId=xyz789; HttpOnly; Secure
Access-Control-Allow-Origin: https://example.com
                                                  ← 空行（CRLF）
{"id":123,"name":"John","email":"john@example.com"}  ← 响应体
```

### 1. 状态行（Status Line）

```javascript
// 格式：协议版本 状态码 状态描述
const statusLine = {
  format: 'HTTP-Version Status-Code Reason-Phrase CRLF',
  
  example: 'HTTP/1.1 200 OK',
  
  parts: {
    httpVersion: 'HTTP/1.1',  // 协议版本
    statusCode: '200',        // 状态码
    reasonPhrase: 'OK'        // 状态描述
  }
};

// 常见状态码
const statusCodes = {
  // 1xx: 信息性状态码
  '100': 'Continue',
  '101': 'Switching Protocols',
  
  // 2xx: 成功状态码
  '200': 'OK',
  '201': 'Created',
  '204': 'No Content',
  
  // 3xx: 重定向状态码
  '301': 'Moved Permanently',
  '302': 'Found',
  '304': 'Not Modified',
  
  // 4xx: 客户端错误
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '403': 'Forbidden',
  '404': 'Not Found',
  
  // 5xx: 服务器错误
  '500': 'Internal Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable'
};
```

### 2. 响应头（Response Headers）

```javascript
// 响应头的分类
const responseHeaders = {
  // 通用首部
  general: {
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Date': 'Wed, 27 Nov 2025 10:00:00 GMT'
  },
  
  // 响应首部
  response: {
    'Server': 'nginx/1.18.0',
    'Set-Cookie': 'sessionId=xyz789; HttpOnly; Secure',
    'Location': 'https://example.com/new-url',  // 重定向
    'Retry-After': '120',                       // 重试时间
    'Access-Control-Allow-Origin': '*'          // CORS
  },
  
  // 实体首部
  entity: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': '58',
    'Content-Encoding': 'gzip',
    'Content-Language': 'zh-CN',
    'Last-Modified': 'Wed, 27 Nov 2025 09:00:00 GMT',
    'ETag': '"5d41402abc4b2a76b9719d911017c592"',
    'Expires': 'Wed, 27 Nov 2025 11:00:00 GMT'
  }
};
```

### 3. 响应体（Response Body）

```javascript
// 不同类型的响应体
const responseBodies = {
  // 1. JSON 数据（API 响应）
  json: {
    contentType: 'application/json',
    example: `
{
  "id": 123,
  "name": "John",
  "email": "john@example.com",
  "createdAt": "2025-11-27T10:00:00Z"
}
    `
  },
  
  // 2. HTML 页面
  html: {
    contentType: 'text/html; charset=utf-8',
    example: `
<!DOCTYPE html>
<html>
<head>
  <title>Example Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
    `
  },
  
  // 3. 图片（二进制）
  image: {
    contentType: 'image/jpeg',
    example: '[二进制数据]'
  },
  
  // 4. 文件下载
  file: {
    contentType: 'application/octet-stream',
    headers: {
      'Content-Disposition': 'attachment; filename="document.pdf"'
    },
    example: '[二进制数据]'
  },
  
  // 5. 空响应体（204 No Content）
  empty: {
    statusCode: 204,
    contentLength: 0,
    example: ''
  }
};
```

---

## 问题 3：如何在代码中查看和构造 HTTP 报文？

### Node.js 中查看原始报文

```javascript
// 服务器端：查看请求报文
const http = require('http');

const server = http.createServer((req, res) => {
  // 1. 请求行
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('HTTP Version:', req.httpVersion);
  
  // 2. 请求头
  console.log('Headers:', req.headers);
  console.log('Host:', req.headers.host);
  console.log('User-Agent:', req.headers['user-agent']);
  
  // 3. 请求体
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('Body:', body);
    
    // 构造响应
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    
    res.end(JSON.stringify({
      message: 'Request received',
      receivedBody: body
    }));
  });
});

server.listen(3000);
```

### 浏览器中查看报文

```javascript
// 使用 fetch API 并查看
async function makeRequest() {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123'
    },
    body: JSON.stringify({
      name: 'John',
      email: 'john@example.com'
    })
  });
  
  // 查看响应状态
  console.log('Status:', response.status);
  console.log('Status Text:', response.statusText);
  
  // 查看响应头
  console.log('Headers:');
  response.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  
  // 查看响应体
  const data = await response.json();
  console.log('Body:', data);
}

// Chrome DevTools
// 1. Network 标签
// 2. 选择请求
// 3. Headers 标签：查看请求头和响应头
// 4. Payload 标签：查看请求体
// 5. Response 标签：查看响应体
// 6. 右键 → Copy → Copy as cURL：复制完整请求
```

### 使用 axios 拦截器查看

```javascript
// 请求拦截器：查看请求报文
axios.interceptors.request.use(config => {
  console.log('=== Request ===');
  console.log(`${config.method.toUpperCase()} ${config.url}`);
  console.log('Headers:', config.headers);
  console.log('Body:', config.data);
  return config;
});

// 响应拦截器：查看响应报文
axios.interceptors.response.use(response => {
  console.log('=== Response ===');
  console.log(`${response.status} ${response.statusText}`);
  console.log('Headers:', response.headers);
  console.log('Body:', response.data);
  return response;
});
```

### 构造原始 HTTP 报文

```javascript
// 使用 net 模块发送原始 HTTP 请求
const net = require('net');

const client = net.createConnection({ port: 80, host: 'example.com' }, () => {
  // 手动构造 HTTP 请求报文
  const request = [
    'GET /api/users HTTP/1.1',                    // 请求行
    'Host: example.com',                          // 请求头
    'User-Agent: CustomClient/1.0',
    'Accept: application/json',
    'Connection: close',
    '',                                           // 空行
    ''                                            // 请求体（GET 请求通常为空）
  ].join('\r\n');
  
  console.log('Sending request:');
  console.log(request);
  
  client.write(request);
});

client.on('data', (data) => {
  console.log('Received response:');
  console.log(data.toString());
});

client.on('end', () => {
  console.log('Connection closed');
});
```

---

## 问题 4：HTTP 报文有哪些常见的注意事项？

### 1. 请求头的大小限制

```javascript
// 不同服务器的限制
const headerLimits = {
  nginx: {
    default: '4KB-8KB',
    config: 'client_header_buffer_size 1k; large_client_header_buffers 4 8k;'
  },
  
  apache: {
    default: '8KB',
    config: 'LimitRequestFieldSize 8190'
  },
  
  nodejs: {
    default: '80KB',
    config: 'http.maxHeaderSize = 8192'
  }
};

// ❌ 避免：过大的请求头
const badPractice = {
  cookie: 'sessionData=' + 'x'.repeat(10000),  // 10KB Cookie
  authorization: 'Bearer ' + 'y'.repeat(50000) // 50KB Token
};

// ✅ 推荐：合理大小
const goodPractice = {
  cookie: 'sessionId=abc123',                   // 小巧的 session ID
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // JWT
};
```

### 2. 行结束符（CRLF）

```javascript
// HTTP 报文使用 CRLF (\r\n) 作为行结束符
const lineEndings = {
  http: '\\r\\n (CRLF)',
  unix: '\\n (LF)',
  windows: '\\r\\n (CRLF)',
  
  // ⚠️ 必须使用 CRLF
  correct: 'GET /api/users HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n',
  wrong: 'GET /api/users HTTP/1.1\\nHost: example.com\\n\\n'  // 可能导致解析错误
};
```

### 3. Content-Length 的重要性

```javascript
// Content-Length 指示请求体/响应体的字节数
const contentLength = {
  // ✅ 正确：精确的字节数
  correct: {
    body: '{"name":"John"}',
    contentLength: 15  // 15 字节
  },
  
  // ❌ 错误：不匹配
  wrong: {
    body: '{"name":"John"}',
    contentLength: 10  // 错误！实际是 15 字节
    // 可能导致：
    // - 请求体被截断
    // - 连接挂起
    // - 解析错误
  },
  
  // 注意：多字节字符
  multibyte: {
    body: '{"name":"张三"}',  // 中文字符
    contentLength: Buffer.byteLength('{"name":"张三"}', 'utf8')  // 17 字节（不是 13）
  }
};

// Node.js 中正确设置
const body = JSON.stringify({ name: '张三' });
res.writeHead(200, {
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Length': Buffer.byteLength(body, 'utf8')  // 正确计算字节数
});
res.end(body);
```

### 4. 分块传输编码

```javascript
// 当不知道响应体大小时，使用 Transfer-Encoding: chunked
const chunkedEncoding = {
  // 不使用 Content-Length
  headers: {
    'Transfer-Encoding': 'chunked'
  },
  
  // 响应体格式
  format: `
4\\r\\n
Wiki\\r\\n
5\\r\\n
pedia\\r\\n
0\\r\\n
\\r\\n
  `,
  
  // 每个块的格式：
  // 1. 块大小（十六进制）
  // 2. CRLF
  // 3. 块数据
  // 4. CRLF
  // 最后一个块大小为 0
};

// Node.js 中使用
res.writeHead(200, {
  'Content-Type': 'text/plain',
  'Transfer-Encoding': 'chunked'
});

// 发送多个块
res.write('First chunk\n');
res.write('Second chunk\n');
res.write('Third chunk\n');
res.end();  // 自动发送结束块
```

## 总结

**HTTP 报文结构核心要点**：

### 1. 请求报文

- **请求行**：方法 + 路径 + 协议版本
- **请求头**：Host（必需）、User-Agent、Accept 等
- **空行**：CRLF 分隔符
- **请求体**：JSON、表单、文件等

### 2. 响应报文

- **状态行**：协议版本 + 状态码 + 状态描述
- **响应头**：Server、Content-Type、Set-Cookie 等
- **空行**：CRLF 分隔符
- **响应体**：JSON、HTML、二进制等

### 3. 关键要点

- 使用 CRLF (\r\n) 作为行结束符
- Content-Length 必须准确（字节数）
- 请求头有大小限制（通常 4-8KB）
- 支持分块传输编码

### 4. 调试工具

- Chrome DevTools Network 标签
- curl 命令行工具
- Postman/Insomnia
- axios/fetch 拦截器

## 延伸阅读

- [MDN - HTTP Messages](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Messages)
- [RFC 7230 - HTTP/1.1 Message Syntax](https://datatracker.ietf.org/doc/html/rfc7230)
- [HTTP Headers - MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers)
- [HTTP Status Codes](https://httpstatuses.com/)
- [curl Documentation](https://curl.se/docs/manpage.html)
