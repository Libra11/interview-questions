---
title: HTTP Content-Type 有哪些常见类型
category: 网络
difficulty: 入门
updatedAt: 2025-11-18
summary: >-
  全面了解 HTTP Content-Type 的作用和常见类型，掌握在不同场景下如何正确设置请求和响应的内容类型
tags:
  - HTTP
  - Content-Type
  - MIME类型
  - 请求头
estimatedTime: 18 分钟
keywords:
  - Content-Type
  - MIME
  - 媒体类型
  - application/json
  - multipart/form-data
highlight: Content-Type 指定 HTTP 消息体的媒体类型，帮助接收方正确解析数据
order: 287
---

## 问题 1：Content-Type 是什么，有什么作用？

### 基本概念

`Content-Type` 是 HTTP 头部字段，用于指示资源的媒体类型（MIME 类型）。

```http
// 请求头
POST /api/users HTTP/1.1
Content-Type: application/json

{"name": "张三", "age": 25}

// 响应头
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
<html>...</html>
```

### 作用

**告诉接收方如何解析数据**：

```javascript
// 服务器根据 Content-Type 决定如何解析请求体
app.post('/api/users', (req, res) => {
  const contentType = req.headers['content-type'];
  
  if (contentType === 'application/json') {
    // 解析为 JSON
    const data = JSON.parse(req.body);
  } else if (contentType === 'application/x-www-form-urlencoded') {
    // 解析为表单数据
    const data = querystring.parse(req.body);
  }
});
```

**浏览器根据 Content-Type 渲染内容**：

```http
// Content-Type: text/html → 浏览器渲染 HTML
// Content-Type: application/json → 浏览器显示 JSON 文本
// Content-Type: image/png → 浏览器显示图片
```

---

## 问题 2：常见的 Content-Type 有哪些？

### 文本类型

```http
Content-Type: text/plain       // 纯文本
Content-Type: text/html        // HTML 文档
Content-Type: text/css         // CSS 样式表
Content-Type: text/javascript  // JavaScript 代码
```

### 应用程序类型

#### application/json（最常用）

```javascript
// 前端发送 JSON
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '张三',
    email: 'zhangsan@example.com'
  })
});
```

#### application/x-www-form-urlencoded（表单默认）

```http
POST /api/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=zhangsan&password=123456
```

```html
<!-- HTML 表单默认使用这个类型 -->
<form action="/api/login" method="POST">
  <input name="username" value="zhangsan">
  <input name="password" value="123456">
  <button type="submit">登录</button>
</form>
```

#### multipart/form-data（文件上传）

```html
<!-- 文件上传必须使用 multipart/form-data -->
<form action="/api/upload" method="POST" enctype="multipart/form-data">
  <input type="text" name="username">
  <input type="file" name="avatar">
  <button type="submit">上传</button>
</form>
```

```javascript
// 使用 FormData 上传文件
const formData = new FormData();
formData.append('username', 'zhangsan');
formData.append('avatar', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  body: formData  // 浏览器自动设置 Content-Type
});
```

### 图片和媒体类型

```http
Content-Type: image/jpeg       // JPEG 图片
Content-Type: image/png        // PNG 图片
Content-Type: image/gif        // GIF 图片
Content-Type: image/svg+xml    // SVG 图片
Content-Type: audio/mpeg       // MP3 音频
Content-Type: video/mp4        // MP4 视频
```

---

## 问题 3：application/x-www-form-urlencoded 和 multipart/form-data 有什么区别？

### application/x-www-form-urlencoded

**特点**：
- 数据编码为键值对，用 `&` 分隔
- 特殊字符会被 URL 编码
- 适合简单的文本数据

```http
POST /api/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=zhang%20san&password=123456&email=test%40example.com
```

**使用场景**：
- 简单的登录表单
- 不包含文件的表单提交

```javascript
// 手动构造
const data = new URLSearchParams();
data.append('username', 'zhang san');
data.append('password', '123456');

fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: data.toString()
});
```

### multipart/form-data

**特点**：
- 数据分成多个部分，每部分有独立的 Content-Type
- 使用 boundary 分隔各部分
- 可以传输二进制数据（文件）

```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="username"

zhangsan
------WebKitFormBoundary
Content-Disposition: form-data; name="avatar"; filename="photo.jpg"
Content-Type: image/jpeg

[图片二进制数据]
------WebKitFormBoundary--
```

**使用场景**：
- 文件上传
- 同时提交文本和文件

```javascript
const formData = new FormData();
formData.append('username', 'zhangsan');
formData.append('avatar', fileInput.files[0]);
formData.append('resume', fileInput.files[1]);

fetch('/api/upload', {
  method: 'POST',
  body: formData  // 不要手动设置 Content-Type
});
```

### 对比总结

| 特性 | application/x-www-form-urlencoded | multipart/form-data |
|------|-----------------------------------|---------------------|
| 数据格式 | 键值对，URL 编码 | 多部分，支持二进制 |
| 文件上传 | ❌ 不支持 | ✅ 支持 |
| 数据大小 | 适合小数据 | 适合大数据 |
| 编码效率 | 文本高效 | 二进制高效 |

---

## 问题 4：Content-Type 中的 charset 参数有什么用？

### charset 指定字符编码

```http
Content-Type: text/html; charset=utf-8
Content-Type: application/json; charset=utf-8
```

### 为什么需要 charset

不同编码会导致乱码：

```javascript
// UTF-8 编码
const text = '你好';
// UTF-8: E4 BD A0 E5 A5 BD

// GBK 编码
// GBK: C4 E3 BA C3

// 如果服务器用 UTF-8 编码，但没有指定 charset
// 浏览器可能用 GBK 解码，导致乱码
```

### 正确设置 charset

服务器端：

```javascript
// Express
app.get('/api/data', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ message: '你好' });
});

// 或者使用 res.type()
res.type('json');  // 自动添加 charset=utf-8
```

前端：

```javascript
// 发送 JSON 时指定编码
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({ name: '张三' })
});
```

### 常见编码

- `utf-8`：最常用，支持所有语言
- `gbk`：中文编码（较旧）
- `iso-8859-1`：西欧语言

---

## 总结

**核心要点**：

### 1. Content-Type 的作用
- 告诉接收方数据的格式
- 决定如何解析和渲染内容

### 2. 常用类型选择
- **JSON 数据**：`application/json`
- **表单提交**：`application/x-www-form-urlencoded`
- **文件上传**：`multipart/form-data`
- **HTML 页面**：`text/html`

### 3. 注意事项
- 文件上传必须用 `multipart/form-data`
- 使用 FormData 时不要手动设置 Content-Type
- 文本类型建议添加 `charset=utf-8`

---

## 延伸阅读

- [MDN - Content-Type](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)
- [MDN - MIME 类型](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [IANA Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml)
- [MDN - FormData](https://developer.mozilla.org/zh-CN/docs/Web/API/FormData)
