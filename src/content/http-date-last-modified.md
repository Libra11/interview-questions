---
title: HTTP 缓存中的 Date 与 Last-Modified 有什么不同
category: 网络
difficulty: 中级
updatedAt: 2025-11-18
summary: >-
  深入理解 HTTP 缓存机制中 Date 和 Last-Modified 两个响应头的区别，掌握它们在缓存验证和时间同步中的不同作用
tags:
  - HTTP
  - 缓存
  - 响应头
  - 浏览器
estimatedTime: 20 分钟
keywords:
  - Date
  - Last-Modified
  - HTTP缓存
  - 条件请求
  - If-Modified-Since
highlight: Date 表示响应生成时间，Last-Modified 表示资源最后修改时间，两者配合实现缓存验证机制
order: 86
---

## 问题 1：Date 和 Last-Modified 分别表示什么？

### Date 响应头

`Date` 表示 HTTP 响应消息生成的时间，由服务器在发送响应时自动添加。

```http
HTTP/1.1 200 OK
Date: Mon, 18 Nov 2024 10:30:00 GMT
Content-Type: text/html
```

**作用**：
- 标识响应的生成时间
- 用于计算响应的新鲜度（配合 Cache-Control 的 max-age）
- 帮助客户端和服务器进行时间同步

### Last-Modified 响应头

`Last-Modified` 表示资源在服务器上最后一次被修改的时间。

```http
HTTP/1.1 200 OK
Date: Mon, 18 Nov 2024 10:30:00 GMT
Last-Modified: Mon, 18 Nov 2024 08:00:00 GMT
Content-Type: text/html
```

**作用**：
- 标识资源的实际修改时间
- 用于条件请求（配合 If-Modified-Since）
- 实现缓存验证机制

---

## 问题 2：它们在缓存验证中如何配合使用？

### 缓存验证流程

当浏览器缓存过期后，会使用 `Last-Modified` 进行条件请求：

```http
// 1. 首次请求，服务器返回资源和 Last-Modified
GET /api/data HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Date: Mon, 18 Nov 2024 10:00:00 GMT
Last-Modified: Mon, 18 Nov 2024 08:00:00 GMT
Cache-Control: max-age=3600
Content-Length: 1024

// 2. 缓存过期后，浏览器发起条件请求
GET /api/data HTTP/1.1
Host: example.com
If-Modified-Since: Mon, 18 Nov 2024 08:00:00 GMT

// 3a. 资源未修改，返回 304
HTTP/1.1 304 Not Modified
Date: Mon, 18 Nov 2024 11:30:00 GMT

// 3b. 资源已修改，返回新资源
HTTP/1.1 200 OK
Date: Mon, 18 Nov 2024 11:30:00 GMT
Last-Modified: Mon, 18 Nov 2024 11:00:00 GMT
Content-Length: 2048
```

### 关键区别

```javascript
// Date：每次响应都会更新，表示"现在"
// Last-Modified：只有资源修改时才更新，表示"资源的修改时间"

// 示例场景
// 第一次请求（10:00）
Date: Mon, 18 Nov 2024 10:00:00 GMT
Last-Modified: Mon, 18 Nov 2024 08:00:00 GMT  // 资源在 8:00 修改

// 第二次请求（11:00），资源未修改
Date: Mon, 18 Nov 2024 11:00:00 GMT           // Date 更新了
Last-Modified: Mon, 18 Nov 2024 08:00:00 GMT  // Last-Modified 不变
```

---

## 问题 3：为什么需要 Date 头？只用 Last-Modified 不够吗？

### Date 的独特作用

#### 1. 计算资源新鲜度

`Date` 配合 `Cache-Control: max-age` 计算资源是否过期：

```javascript
// 浏览器判断缓存是否新鲜
const responseDate = new Date('Mon, 18 Nov 2024 10:00:00 GMT');
const now = new Date();
const age = (now - responseDate) / 1000; // 秒
const maxAge = 3600; // Cache-Control: max-age=3600

if (age < maxAge) {
  // 缓存仍然新鲜，直接使用
  console.log('使用缓存');
} else {
  // 缓存过期，需要验证
  console.log('发起条件请求');
}
```

#### 2. 时间同步参考

当客户端和服务器时间不同步时，`Date` 提供服务器时间参考：

```javascript
// 客户端可能时间不准确
const clientTime = new Date(); // 可能快或慢
const serverTime = new Date(response.headers.get('Date'));

// 计算时间偏移
const timeOffset = serverTime - clientTime;

// 使用服务器时间进行缓存计算
const adjustedAge = age - (timeOffset / 1000);
```

#### 3. 区分响应时间和资源修改时间

```http
// 静态资源可能很久没修改，但响应是刚生成的
Date: Mon, 18 Nov 2024 10:00:00 GMT           // 刚才生成的响应
Last-Modified: Mon, 01 Jan 2024 00:00:00 GMT  // 资源半年前就没变过

// 这两个时间的差异有重要意义
```

---

## 问题 4：Last-Modified 有什么局限性？

### 主要局限

#### 1. 精度只到秒级

```javascript
// 如果资源在 1 秒内多次修改，Last-Modified 无法区分
// 2024-11-18 10:00:00.100 修改
// 2024-11-18 10:00:00.500 再次修改
// Last-Modified 都是 Mon, 18 Nov 2024 10:00:00 GMT
```

#### 2. 文件修改但内容未变

```bash
# 仅修改文件时间戳，内容没变
touch file.js

# Last-Modified 会更新，但文件内容实际没变
# 导致不必要的资源重新传输
```

#### 3. 依赖服务器时间准确性

```javascript
// 如果服务器时间不准确或回拨
// Last-Modified 可能出现逻辑错误

// 服务器 A 时间：2024-11-18 10:00:00
// 服务器 B 时间：2024-11-18 09:00:00（慢了1小时）

// 负载均衡切换服务器时，Last-Modified 可能倒退
```

### ETag 作为补充方案

为了解决这些问题，HTTP 引入了 `ETag`：

```http
HTTP/1.1 200 OK
Date: Mon, 18 Nov 2024 10:00:00 GMT
Last-Modified: Mon, 18 Nov 2024 08:00:00 GMT
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: max-age=3600

// ETag 基于内容生成，内容不变则 ETag 不变
// 优先级：ETag > Last-Modified
```

条件请求时的优先级：

```http
// 浏览器会同时发送两个条件头
GET /api/data HTTP/1.1
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-Modified-Since: Mon, 18 Nov 2024 08:00:00 GMT

// 服务器优先检查 ETag
// 只有 ETag 不存在时才检查 Last-Modified
```

---

## 总结

**核心区别**：

### Date
- 表示响应生成时间
- 每次响应都会更新
- 用于计算缓存新鲜度
- 提供时间同步参考

### Last-Modified
- 表示资源最后修改时间
- 只有资源修改时才更新
- 用于条件请求验证
- 配合 If-Modified-Since 实现 304 响应

### 配合使用
- Date + Cache-Control 判断是否需要验证
- Last-Modified + If-Modified-Since 进行缓存验证
- ETag 作为 Last-Modified 的补充，提供更精确的验证

---

## 延伸阅读

- [MDN - Date](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Date)
- [MDN - Last-Modified](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)
- [MDN - HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [RFC 7232 - Conditional Requests](https://tools.ietf.org/html/rfc7232)
- [RFC 7234 - HTTP Caching](https://tools.ietf.org/html/rfc7234)
