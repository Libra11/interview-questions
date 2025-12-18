---
title: HTTP 缓存策略有哪些
category: 网络
difficulty: 中级
updatedAt: 2025-12-01
summary: >-
  深入理解 HTTP 缓存机制,包括强缓存和协商缓存的工作原理、常用的缓存控制头部字段,以及如何在实际项目中合理运用缓存策略来提升网站性能。
tags:
  - HTTP
  - 缓存
  - 性能优化
  - 网络协议
estimatedTime: 25 分钟
keywords:
  - HTTP缓存
  - 强缓存
  - 协商缓存
  - Cache-Control
  - ETag
highlight: 掌握 HTTP 缓存的两大核心机制及其应用场景
order: 3
---

## 问题 1：什么是 HTTP 缓存

HTTP 缓存是一种保存资源副本并在下次请求时直接使用的技术。当浏览器请求资源时,如果缓存有效,就不需要再次向服务器请求,从而减少网络传输,提升页面加载速度。

**HTTP 缓存主要分为两类**:

### 1. 强缓存

浏览器直接从本地缓存读取资源,不与服务器通信。

### 2. 协商缓存

浏览器会向服务器询问缓存是否有效,服务器返回 304 表示可以使用缓存,返回 200 则返回新资源。

---

## 问题 2：强缓存是如何工作的

强缓存通过 HTTP 响应头来控制,主要有两个字段:

### 1. Expires (HTTP/1.0)

```http
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

- 指定资源的过期时间(绝对时间)
- 缺点:依赖客户端时间,如果客户端时间不准确会导致缓存失效

### 2. Cache-Control (HTTP/1.1)

```http
Cache-Control: max-age=3600
```

**常用指令**:

- `max-age=<秒>`: 资源在多少秒内有效(相对时间)
- `no-cache`: 不使用强缓存,需要协商缓存验证
- `no-store`: 不缓存任何内容
- `public`: 可以被任何缓存存储(包括 CDN)
- `private`: 只能被浏览器缓存,不能被 CDN 缓存

**优先级**: `Cache-Control` 优先级高于 `Expires`

**工作流程**:

1. 浏览器第一次请求资源,服务器返回资源和缓存头
2. 浏览器将资源和缓存信息存储在本地
3. 再次请求时,检查缓存是否过期
4. 未过期则直接使用缓存(状态码显示 200,from disk cache 或 from memory cache)

---

## 问题 3：协商缓存是如何工作的

当强缓存失效后,浏览器会使用协商缓存。协商缓存通过以下两对字段实现:

### 1. Last-Modified / If-Modified-Since

**首次请求**:

```http
// 服务器响应
Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT
```

**再次请求**:

```http
// 浏览器请求头
If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT
```

- 服务器比较资源修改时间
- 未修改返回 304 Not Modified
- 已修改返回 200 和新资源

**缺点**:

- 只能精确到秒级
- 文件内容未变但修改时间变了,会导致重新下载
- 某些服务器无法精确获取文件修改时间

### 2. ETag / If-None-Match

**首次请求**:

```http
// 服务器响应
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**再次请求**:

```http
// 浏览器请求头
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

- ETag 是资源的唯一标识符(通常是文件内容的哈希值)
- 服务器比较 ETag 值
- 相同返回 304,不同返回 200 和新资源

**优先级**: `ETag` 优先级高于 `Last-Modified`

---

## 问题 4：如何选择合适的缓存策略

不同类型的资源应该使用不同的缓存策略:

### 1. HTML 文件

```http
Cache-Control: no-cache
```

- 每次都需要向服务器验证
- 确保用户能及时获取最新内容

### 2. CSS/JS 文件(带版本号或哈希)

```http
Cache-Control: max-age=31536000, immutable
```

- 长期缓存(1 年)
- 文件名包含哈希值,内容变化时文件名也变化
- `immutable` 表示资源不会改变

### 3. 图片资源

```http
Cache-Control: max-age=86400, public
```

- 缓存 1 天
- 允许 CDN 缓存

### 4. API 接口

```http
Cache-Control: no-store
```

- 不缓存动态数据
- 确保数据实时性

**实际项目中的最佳实践**:

```javascript
// webpack 配置示例
output: {
  filename: '[name].[contenthash].js', // 文件名包含内容哈希
  chunkFilename: '[name].[contenthash].js'
}
```

---

## 问题 5：用户刷新操作对缓存的影响

不同的刷新方式对缓存的影响不同:

### 1. 正常访问(地址栏输入 URL)

- 强缓存有效则使用强缓存
- 强缓存失效则使用协商缓存

### 2. F5 刷新 / 点击刷新按钮

- 跳过强缓存
- 直接使用协商缓存验证

### 3. Ctrl+F5 强制刷新

- 跳过所有缓存
- 直接向服务器请求最新资源
- 请求头会带上 `Cache-Control: no-cache` 和 `Pragma: no-cache`

## 总结

**核心概念总结**:

### 1. 强缓存

- 通过 `Expires` 和 `Cache-Control` 控制
- 不与服务器通信,直接使用本地缓存
- 适用于不经常变化的静态资源

### 2. 协商缓存

- 通过 `Last-Modified/If-Modified-Since` 和 `ETag/If-None-Match` 控制
- 需要与服务器通信验证
- 适用于需要验证新鲜度的资源

### 3. 缓存策略选择

- HTML: 使用协商缓存
- 带哈希的静态资源: 长期强缓存
- 动态数据: 不缓存

## 延伸阅读

- [MDN - HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [Google Developers - HTTP 缓存](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching)
- [RFC 7234 - HTTP/1.1 缓存规范](https://tools.ietf.org/html/rfc7234)
- [Web.dev - 防止不必要的网络请求](https://web.dev/http-cache/)
