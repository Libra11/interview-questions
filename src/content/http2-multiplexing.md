---
title: http2 多路复用是什么, 原理是什么
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 HTTP/2 多路复用的原理和优势，掌握如何通过单一连接并发传输多个请求
tags:
  - HTTP/2
  - 多路复用
  - 性能优化
  - 网络协议
estimatedTime: 25 分钟
keywords:
  - HTTP/2
  - 多路复用
  - 二进制分帧
  - 流
highlight: HTTP/2 多路复用通过二进制分帧层实现单一连接上的并发传输，解决了 HTTP/1.x 的队头阻塞问题
order: 62
---

## 问题 1：什么是 HTTP/2 多路复用？

HTTP/2 多路复用（Multiplexing）是指在单个 TCP 连接上可以同时发送多个请求和响应，而不需要按照顺序一一对应。

### HTTP/1.1 的问题

```javascript
// HTTP/1.1 的队头阻塞（Head-of-Line Blocking）

// 场景：加载一个网页，需要请求多个资源
请求 1: index.html
请求 2: style.css
请求 3: script.js
请求 4: image.jpg

// HTTP/1.1 的处理方式（即使使用长连接）
连接 1: 请求 1 -> 等待响应 1 -> 请求 2 -> 等待响应 2
连接 2: 请求 3 -> 等待响应 3 -> 请求 4 -> 等待响应 4

// ❌ 问题：
// 1. 必须等待前一个响应完成才能发送下一个请求
// 2. 如果响应 1 很慢，会阻塞后续请求
// 3. 需要建立多个连接来并发请求（浏览器限制为 6 个）
```

### HTTP/2 的多路复用

```javascript
// HTTP/2 的多路复用

// 同样的场景，只需要一个连接
连接 1: 
  请求 1 -----> 响应 1
  请求 2 ---> 响应 2
  请求 3 ---------> 响应 3
  请求 4 -> 响应 4

// ✅ 优势：
// 1. 所有请求和响应可以并发传输
// 2. 不会相互阻塞
// 3. 只需要一个 TCP 连接
// 4. 响应可以乱序返回
```

### 对比示例

```javascript
// HTTP/1.1: 串行处理
时间线：
0s   1s   2s   3s   4s   5s   6s
|----请求1----|
              |----请求2----|
                            |----请求3----|

总耗时: 6 秒

// HTTP/2: 并行处理
时间线：
0s   1s   2s
|----请求1----|
|----请求2----|
|----请求3----|

总耗时: 2 秒

// ✅ 性能提升 3 倍
```

---

## 问题 2：HTTP/2 多路复用的原理是什么？

HTTP/2 通过二进制分帧层（Binary Framing Layer）实现多路复用。

### 核心概念

```javascript
// 1. 帧（Frame）
// HTTP/2 的最小通信单位
// 每个帧包含：
// - 帧类型（DATA, HEADERS, PRIORITY 等）
// - 帧长度
// - 标志位
// - 流 ID
// - 帧数据

Frame {
  Length: 16384,           // 帧长度
  Type: DATA,              // 帧类型
  Flags: END_STREAM,       // 标志位
  StreamID: 1,             // 流 ID
  Payload: "..."           // 数据
}
```

```javascript
// 2. 流（Stream）
// 一个请求-响应对应一个流
// 流由多个帧组成
// 每个流有唯一的 ID

Stream 1 (请求 index.html):
  Frame 1: HEADERS (请求头)
  Frame 2: DATA (响应头)
  Frame 3: DATA (响应体)

Stream 3 (请求 style.css):
  Frame 1: HEADERS (请求头)
  Frame 2: DATA (响应头)
  Frame 3: DATA (响应体)

Stream 5 (请求 script.js):
  Frame 1: HEADERS (请求头)
  Frame 2: DATA (响应头)
  Frame 3: DATA (响应体)
```

```javascript
// 3. 消息（Message）
// 一个完整的请求或响应
// 由一个或多个帧组成

Message (HTTP 请求):
  HEADERS Frame: GET /index.html HTTP/2
  DATA Frame: (请求体，如果有)

Message (HTTP 响应):
  HEADERS Frame: HTTP/2 200 OK
  DATA Frame: <html>...</html>
```

### 二进制分帧过程

```javascript
// HTTP/1.1: 文本协议
GET /index.html HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0

// HTTP/2: 二进制协议
// 请求被分解为多个帧

// HEADERS 帧
Frame {
  Type: HEADERS,
  StreamID: 1,
  Payload: {
    ":method": "GET",
    ":path": "/index.html",
    ":scheme": "https",
    ":authority": "example.com",
    "user-agent": "Mozilla/5.0"
  }
}

// 如果有请求体，会有 DATA 帧
Frame {
  Type: DATA,
  StreamID: 1,
  Payload: "request body..."
}
```

### 多路复用的实现

```javascript
// 发送端：将多个请求交织发送

// 时间 T1: 发送 Stream 1 的 HEADERS 帧
Frame { StreamID: 1, Type: HEADERS, ... }

// 时间 T2: 发送 Stream 3 的 HEADERS 帧
Frame { StreamID: 3, Type: HEADERS, ... }

// 时间 T3: 发送 Stream 5 的 HEADERS 帧
Frame { StreamID: 5, Type: HEADERS, ... }

// 时间 T4: 发送 Stream 1 的 DATA 帧
Frame { StreamID: 1, Type: DATA, ... }

// 时间 T5: 发送 Stream 3 的 DATA 帧
Frame { StreamID: 3, Type: DATA, ... }

// 接收端：根据 StreamID 重组消息

Stream 1: Frame(T1) + Frame(T4) -> 完整的请求/响应
Stream 3: Frame(T2) + Frame(T5) -> 完整的请求/响应
Stream 5: Frame(T3) -> 等待更多帧...
```

---

## 问题 3：HTTP/2 多路复用有哪些优势？

### 1. 解决队头阻塞

```javascript
// HTTP/1.1 的队头阻塞
// 如果第一个响应很慢，会阻塞后续请求

请求 1 (大文件, 10MB) ----10秒----> 响应 1
                                    请求 2 (小文件, 10KB) --0.1秒--> 响应 2

// 总耗时: 10.1 秒
// 即使请求 2 很快，也要等待请求 1 完成

// HTTP/2 的多路复用
// 请求可以并发处理

请求 1 (大文件, 10MB) ----10秒----> 响应 1
请求 2 (小文件, 10KB) --0.1秒--> 响应 2

// 总耗时: 10 秒
// 请求 2 不需要等待请求 1
```

### 2. 减少连接数

```javascript
// HTTP/1.1: 需要多个连接
// 浏览器限制：每个域名 6 个并发连接

域名 example.com:
  连接 1: 请求 1, 请求 2
  连接 2: 请求 3, 请求 4
  连接 3: 请求 5, 请求 6
  连接 4: 请求 7, 请求 8
  连接 5: 请求 9, 请求 10
  连接 6: 请求 11, 请求 12

// 问题：
// - 每个连接都需要 TCP 握手（延迟）
// - 占用更多服务器资源
// - 慢启动影响性能

// HTTP/2: 只需要一个连接
连接 1: 请求 1-12 并发传输

// 优势：
// - 只需一次 TCP 握手
// - 减少服务器资源占用
// - 更好地利用带宽
```

### 3. 优先级控制

```javascript
// HTTP/2 支持流优先级
// 可以指定哪些资源更重要

// 设置优先级
Stream 1 (HTML): Priority = 256 (最高)
Stream 3 (CSS): Priority = 220
Stream 5 (JS): Priority = 200
Stream 7 (Image): Priority = 100 (最低)

// 服务器会优先发送高优先级的资源
// 确保关键资源先加载
```

```javascript
// 前端可以通过 Link 头设置优先级
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="important.js" as="script">

// 或通过 HTTP/2 PRIORITY 帧
// 浏览器会自动处理
```

### 4. 服务器推送

```javascript
// HTTP/2 支持服务器主动推送资源

// 客户端请求 index.html
GET /index.html HTTP/2

// 服务器响应 index.html，并主动推送相关资源
HTTP/2 200 OK
Content-Type: text/html

<html>
  <link rel="stylesheet" href="style.css">
  <script src="app.js"></script>
</html>

// 同时推送 style.css 和 app.js
PUSH_PROMISE Stream 2: /style.css
PUSH_PROMISE Stream 4: /app.js

// 客户端收到推送的资源，缓存起来
// 当解析 HTML 需要这些资源时，直接使用缓存
// 不需要再发送请求

// ✅ 减少往返次数，加快页面加载
```

---

## 问题 4：HTTP/2 多路复用有哪些限制？

### 1. TCP 层面的队头阻塞

```javascript
// HTTP/2 解决了 HTTP 层面的队头阻塞
// 但 TCP 层面仍然存在队头阻塞

// TCP 的可靠传输机制：
// 如果某个数据包丢失，后续数据包必须等待重传

数据包 1: 丢失 ❌
数据包 2: 已到达，等待数据包 1
数据包 3: 已到达，等待数据包 1
数据包 4: 已到达，等待数据包 1

// 即使数据包 2、3、4 属于不同的 HTTP/2 流
// 也必须等待数据包 1 重传成功

// 解决方案：HTTP/3 使用 QUIC 协议（基于 UDP）
// 在传输层实现多路复用，避免 TCP 队头阻塞
```

### 2. 单连接的风险

```javascript
// HTTP/2 只使用一个 TCP 连接
// 如果这个连接出现问题，所有请求都会受影响

// HTTP/1.1: 多个连接
连接 1: 请求 1, 2 (连接断开，只影响这两个请求)
连接 2: 请求 3, 4 (正常)
连接 3: 请求 5, 6 (正常)

// HTTP/2: 单个连接
连接 1: 请求 1-6 (连接断开，所有请求都失败)

// 缓解措施：
// - 使用多个域名分散风险
// - 实现快速重连机制
```

### 3. 服务器配置要求

```javascript
// HTTP/2 需要服务器支持
// 并且通常要求 HTTPS

// Nginx 配置
server {
    listen 443 ssl http2;  // 启用 HTTP/2
    server_name example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # HTTP/2 推送
    location / {
        http2_push /style.css;
        http2_push /app.js;
    }
}

// Node.js 配置
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

server.on('stream', (stream, headers) => {
  // 处理请求
  stream.respond({
    ':status': 200,
    'content-type': 'text/html'
  });
  stream.end('<html>...</html>');
});

server.listen(443);
```

### 4. 浏览器兼容性

```javascript
// 检测浏览器是否支持 HTTP/2
// 现代浏览器都支持，但需要 HTTPS

// 在开发者工具中查看
// Network 面板 -> Protocol 列会显示 "h2"

// 通过代码检测（间接方式）
async function supportsHTTP2() {
  try {
    const response = await fetch('https://example.com');
    // 检查响应头或其他特征
    return true;
  } catch (error) {
    return false;
  }
}

// 渐进增强策略
// 服务器同时支持 HTTP/1.1 和 HTTP/2
// 浏览器会自动协商使用最佳协议
```

---

## 总结

**核心概念总结**：

### 1. 多路复用的本质

- 在单个 TCP 连接上并发传输多个请求和响应
- 通过二进制分帧层实现
- 请求和响应可以交织传输，不会相互阻塞

### 2. 核心概念

- **帧（Frame）**：最小通信单位
- **流（Stream）**：一个请求-响应对
- **消息（Message）**：完整的请求或响应
- **二进制分帧**：将消息分解为帧

### 3. 主要优势

- 解决 HTTP 层面的队头阻塞
- 减少 TCP 连接数
- 支持优先级控制
- 支持服务器推送
- 提升页面加载性能

### 4. 注意事项

- TCP 层面仍存在队头阻塞
- 单连接的可靠性风险
- 需要服务器和 HTTPS 支持
- HTTP/3 进一步改进（使用 QUIC）

## 延伸阅读

- [MDN - HTTP/2](https://developer.mozilla.org/zh-CN/docs/Glossary/HTTP_2)
- [RFC 7540 - HTTP/2 规范](https://tools.ietf.org/html/rfc7540)
- [Google - HTTP/2 介绍](https://developers.google.com/web/fundamentals/performance/http2)
- [High Performance Browser Networking - HTTP/2](https://hpbn.co/http2/)
- [HTTP/2 explained](https://http2-explained.haxx.se/)
