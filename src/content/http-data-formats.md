---
title: HTTP 支持哪些常见的数据格式？
category: 网络
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  深入了解 HTTP 支持的各种数据格式，掌握 Content-Type 的使用，理解 JSON、表单、文件上传等不同格式的特点和应用场景，学会在实际开发中正确选择和处理数据格式。
tags:
  - HTTP
  - Content-Type
  - 数据格式
  - MIME类型
estimatedTime: 20 分钟
keywords:
  - HTTP数据格式
  - Content-Type
  - JSON
  - 表单数据
highlight: 掌握 HTTP 常见数据格式及其使用场景，理解 Content-Type 的作用
order: 210
---

## 问题 1：HTTP 中的 Content-Type 是什么？

**Content-Type** 是 HTTP 头部字段，用于指示资源的**媒体类型**（MIME 类型），告诉接收方如何解析数据。

### 基本格式

```http
Content-Type: type/subtype; parameter

示例：
Content-Type: application/json; charset=utf-8
Content-Type: text/html; charset=utf-8
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
```

### Content-Type 的组成

```javascript
const contentType = {
  // 主类型/子类型
  type: 'application',
  subtype: 'json',
  
  // 可选参数
  parameters: {
    charset: 'utf-8',          // 字符编码
    boundary: '----WebKit...'  // 多部分数据的分隔符
  },
  
  // 完整示例
  full: 'application/json; charset=utf-8'
};

// 主要类型分类
const mainTypes = {
  text: '文本类型',
  application: '应用程序数据',
  image: '图片',
  audio: '音频',
  video: '视频',
  multipart: '多部分数据',
  message: '消息封装'
};
```

---

## 问题 2：HTTP 支持哪些常见的数据格式？

### 1. JSON 格式

```javascript
// Content-Type: application/json
const jsonFormat = {
  contentType: 'application/json; charset=utf-8',
  
  // 请求示例
  request: {
    method: 'POST',
    url: '/api/users',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'John',
      age: 30,
      email: 'john@example.com'
    })
  },
  
  // 响应示例
  response: {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: {
      id: 123,
      name: 'John',
      createdAt: '2025-11-27T10:00:00Z'
    }
  }
};

// 使用 fetch
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John',
    age: 30
  })
});

// 使用 axios（自动设置 Content-Type）
axios.post('/api/users', {
  name: 'John',
  age: 30
});
// axios 自动设置: Content-Type: application/json
```

### 2. 表单数据（URL 编码）

```javascript
// Content-Type: application/x-www-form-urlencoded
const urlencodedFormat = {
  contentType: 'application/x-www-form-urlencoded',
  
  // 数据格式：key1=value1&key2=value2
  example: 'name=John&age=30&email=john%40example.com',
  
  // 特殊字符需要编码
  encoding: {
    space: '%20',
    '@': '%40',
    '&': '%26',
    '=': '%3D'
  }
};

// 使用 URLSearchParams
const params = new URLSearchParams();
params.append('name', 'John');
params.append('age', '30');
params.append('email', 'john@example.com');

fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params.toString()
  // 发送: name=John&age=30&email=john%40example.com
});

// 手动构造
const formData = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
};

const encoded = Object.keys(formData)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(formData[key])}`)
  .join('&');

fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: encoded
});
```

### 3. 多部分表单（文件上传）

```javascript
// Content-Type: multipart/form-data
const multipartFormat = {
  contentType: 'multipart/form-data; boundary=----WebKitFormBoundary',
  
  // 用于文件上传和混合数据
  structure: `
------WebKitFormBoundary
Content-Disposition: form-data; name="name"

John
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

[二进制数据]
------WebKitFormBoundary--
  `
};

// 使用 FormData
const formData = new FormData();
formData.append('name', 'John');
formData.append('age', '30');
formData.append('file', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  // ⚠️ 不要手动设置 Content-Type
  // 浏览器会自动设置，包括 boundary
  body: formData
});

// axios 使用
const formData = new FormData();
formData.append('file', file);
formData.append('description', 'Profile photo');

axios.post('/api/upload', formData, {
  headers: {
    // axios 会自动设置正确的 Content-Type
    // 'Content-Type': 'multipart/form-data; boundary=...'
  }
});
```

### 4. 纯文本

```javascript
// Content-Type: text/plain
const textFormat = {
  contentType: 'text/plain; charset=utf-8',
  
  example: 'This is plain text content',
  
  // 使用场景
  useCases: [
    '日志文件',
    '纯文本配置',
    '简单的文本消息'
  ]
};

fetch('/api/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: 'Error occurred at 10:30:00'
});
```

### 5. HTML

```javascript
// Content-Type: text/html
const htmlFormat = {
  contentType: 'text/html; charset=utf-8',
  
  example: `
<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
  `,
  
  // 服务器返回 HTML 页面
  serverResponse: {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  }
};

// Node.js/Express
app.get('/', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send('<h1>Hello World</h1>');
});
```

### 6. XML

```javascript
// Content-Type: application/xml 或 text/xml
const xmlFormat = {
  contentType: 'application/xml; charset=utf-8',
  
  example: `
<?xml version="1.0" encoding="UTF-8"?>
<user>
  <id>123</id>
  <name>John</name>
  <email>john@example.com</email>
</user>
  `,
  
  // 使用场景
  useCases: [
    'SOAP API',
    'RSS/Atom feeds',
    '配置文件'
  ]
};

fetch('/api/soap', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/xml'
  },
  body: `
<?xml version="1.0"?>
<soap:Envelope>
  <soap:Body>
    <GetUser>
      <UserId>123</UserId>
    </GetUser>
  </soap:Body>
</soap:Envelope>
  `
});
```

### 7. 二进制数据

```javascript
// Content-Type: application/octet-stream
const binaryFormat = {
  contentType: 'application/octet-stream',
  
  // 用于未知类型的二进制数据
  useCases: [
    '文件下载',
    '二进制 API 响应',
    '加密数据'
  ]
};

// 发送二进制数据
const arrayBuffer = new Uint8Array([1, 2, 3, 4, 5]);

fetch('/api/binary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  body: arrayBuffer
});

// 接收二进制数据
fetch('/api/download')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    // 处理二进制数据
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    // 下载文件
  });
```

---

## 问题 3：如何在不同场景下选择合适的数据格式？

### 场景对比

```javascript
const formatComparison = {
  // 1. API 通信（推荐 JSON）
  apiCommunication: {
    recommended: 'application/json',
    reason: '结构化、易解析、广泛支持',
    example: {
      request: { name: 'John', age: 30 },
      response: { id: 123, success: true }
    }
  },
  
  // 2. 表单提交（简单数据）
  simpleForm: {
    recommended: 'application/x-www-form-urlencoded',
    reason: '简单、兼容性好、适合少量数据',
    example: 'username=john&password=secret'
  },
  
  // 3. 文件上传
  fileUpload: {
    recommended: 'multipart/form-data',
    reason: '支持二进制文件、可混合文本和文件',
    example: 'FormData with files'
  },
  
  // 4. 大文件下载
  fileDownload: {
    recommended: 'application/octet-stream',
    reason: '通用二进制格式、触发浏览器下载',
    example: 'Binary file data'
  },
  
  // 5. 网页渲染
  webPage: {
    recommended: 'text/html',
    reason: '浏览器直接渲染',
    example: 'HTML document'
  }
};
```

### 实际应用示例

```javascript
// 1. RESTful API（JSON）
class UserAPI {
  // 创建用户
  static async create(userData) {
    return fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    }).then(res => res.json());
  }
  
  // 获取用户
  static async get(id) {
    return fetch(`/api/users/${id}`)
      .then(res => res.json());
  }
}

// 2. 登录表单（URL 编码）
async function login(username, password) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  
  return fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
}

// 3. 文件上传（multipart/form-data）
async function uploadFile(file, metadata) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title);
  formData.append('description', metadata.description);
  
  return fetch('/api/upload', {
    method: 'POST',
    body: formData  // 不设置 Content-Type，浏览器自动处理
  });
}

// 4. 混合场景：JSON + 文件
async function createPost(postData, images) {
  const formData = new FormData();
  
  // 添加 JSON 数据
  formData.append('data', JSON.stringify(postData));
  
  // 添加文件
  images.forEach((image, index) => {
    formData.append(`image${index}`, image);
  });
  
  return fetch('/api/posts', {
    method: 'POST',
    body: formData
  });
}
```

### 服务器端处理

```javascript
// Express 中间件处理不同格式
const express = require('express');
const multer = require('multer');
const app = express();

// 1. 解析 JSON
app.use(express.json());

app.post('/api/users', (req, res) => {
  console.log(req.body);  // { name: 'John', age: 30 }
  res.json({ success: true });
});

// 2. 解析 URL 编码
app.use(express.urlencoded({ extended: true }));

app.post('/api/login', (req, res) => {
  console.log(req.body);  // { username: 'john', password: 'secret' }
  res.json({ token: 'abc123' });
});

// 3. 处理文件上传
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log(req.file);  // 文件信息
  console.log(req.body);  // 其他表单字段
  res.json({ filename: req.file.filename });
});

// 4. 处理原始数据
app.post('/api/binary', express.raw({ type: 'application/octet-stream' }), (req, res) => {
  console.log(req.body);  // Buffer
  res.send('Received');
});

// 5. 处理文本
app.post('/api/text', express.text({ type: 'text/plain' }), (req, res) => {
  console.log(req.body);  // 字符串
  res.send('Received');
});
```

---

## 问题 4：使用不同数据格式时有哪些注意事项？

### 1. 字符编码

```javascript
// 始终指定字符编码
const charsetBestPractices = {
  // ✅ 推荐：明确指定 UTF-8
  correct: {
    json: 'application/json; charset=utf-8',
    html: 'text/html; charset=utf-8',
    text: 'text/plain; charset=utf-8'
  },
  
  // ⚠️ 可能有问题：未指定编码
  risky: {
    json: 'application/json',  // 默认可能不是 UTF-8
    html: 'text/html'
  }
};

// Node.js 中设置
res.set('Content-Type', 'application/json; charset=utf-8');
res.json({ message: '你好' });  // 中文正确显示
```

### 2. Content-Length

```javascript
// 正确计算 Content-Length
const contentLengthIssues = {
  // ❌ 错误：字符数 ≠ 字节数
  wrong: {
    body: '你好',
    contentLength: 2  // 错误！中文字符占多个字节
  },
  
  // ✅ 正确：使用字节数
  correct: {
    body: '你好',
    contentLength: Buffer.byteLength('你好', 'utf8')  // 6 字节
  }
};

// Express 自动处理
app.post('/api/data', (req, res) => {
  const data = { message: '你好' };
  res.json(data);  // Express 自动设置正确的 Content-Length
});

// 手动设置
const body = JSON.stringify({ message: '你好' });
res.set({
  'Content-Type': 'application/json; charset=utf-8',
  'Content-Length': Buffer.byteLength(body, 'utf8')
});
res.send(body);
```

### 3. CORS 和 Content-Type

```javascript
// 简单请求 vs 预检请求
const corsContentType = {
  // 简单请求（不触发预检）
  simpleRequest: [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  
  // 非简单请求（触发预检）
  preflightRequest: [
    'application/json',  // ⚠️ 会触发 OPTIONS 预检
    'application/xml',
    'text/xml'
  ]
};

// 服务器需要处理 OPTIONS 请求
app.options('/api/users', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.status(204).end();
});
```

### 4. 安全性考虑

```javascript
// 验证 Content-Type
app.post('/api/users', (req, res) => {
  const contentType = req.headers['content-type'];
  
  // ✅ 验证 Content-Type
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      expected: 'application/json'
    });
  }
  
  // 处理请求...
});

// 限制请求体大小
app.use(express.json({ limit: '1mb' }));  // 限制 JSON 为 1MB
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 文件上传限制
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 5                     // 最多 5 个文件
  }
});
```

### 5. 性能优化

```javascript
// 压缩响应
const compression = require('compression');
app.use(compression());

// 只压缩特定类型
app.use(compression({
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type');
    // 只压缩文本类型
    return /text|json|javascript|css/.test(contentType);
  }
}));

// 流式传输大文件
app.get('/api/large-file', (req, res) => {
  res.set('Content-Type', 'application/octet-stream');
  
  const stream = fs.createReadStream('./large-file.zip');
  stream.pipe(res);
});
```

## 总结

**HTTP 数据格式核心要点**：

### 1. 常见格式

- **JSON**：API 通信首选（application/json）
- **URL 编码**：简单表单（application/x-www-form-urlencoded）
- **multipart**：文件上传（multipart/form-data）
- **二进制**：文件下载（application/octet-stream）

### 2. 选择原则

- API 通信优先使用 JSON
- 文件上传使用 multipart/form-data
- 简单表单可用 URL 编码
- 明确指定字符编码（charset=utf-8）

### 3. 注意事项

- 正确计算 Content-Length（字节数）
- 注意 CORS 预检请求
- 验证 Content-Type
- 限制请求体大小

### 4. 最佳实践

- 使用框架的内置解析器
- 启用响应压缩
- 大文件使用流式传输
- 安全验证和错误处理

## 延伸阅读

- [MDN - Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)
- [MIME Types - MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [IANA Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [FormData API](https://developer.mozilla.org/zh-CN/docs/Web/API/FormData)
- [Express Body Parser](https://expressjs.com/en/api.html#express.json)
