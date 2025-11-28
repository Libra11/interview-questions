---
title: 长连接了解多少
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 HTTP 长连接（Keep-Alive）的原理、优势和配置方法，掌握如何优化网络性能
tags:
  - HTTP
  - 长连接
  - Keep-Alive
  - 性能优化
estimatedTime: 22 分钟
keywords:
  - 长连接
  - Keep-Alive
  - HTTP持久连接
  - TCP连接复用
highlight: HTTP 长连接通过复用 TCP 连接减少握手开销，显著提升网络性能
order: 8
---

## 问题 1：什么是 HTTP 长连接？

HTTP 长连接（HTTP Keep-Alive 或 HTTP Persistent Connection）是指在一个 TCP 连接上可以发送多个 HTTP 请求和响应，而不需要为每个请求都建立新的连接。

### 短连接 vs 长连接

```javascript
// 短连接（HTTP/1.0 默认）
// 每个请求都需要建立新的 TCP 连接

// 请求 1
1. TCP 三次握手
2. 发送 HTTP 请求
3. 接收 HTTP 响应
4. TCP 四次挥手（关闭连接）

// 请求 2
1. TCP 三次握手（重新建立连接）
2. 发送 HTTP 请求
3. 接收 HTTP 响应
4. TCP 四次挥手（关闭连接）

// ❌ 问题：每次都要握手和挥手，浪费时间和资源
```

```javascript
// 长连接（HTTP/1.1 默认）
// 一个 TCP 连接可以发送多个请求

1. TCP 三次握手
2. 发送 HTTP 请求 1
3. 接收 HTTP 响应 1
4. 发送 HTTP 请求 2（复用同一个连接）
5. 接收 HTTP 响应 2
6. 发送 HTTP 请求 3（继续复用）
7. 接收 HTTP 响应 3
8. TCP 四次挥手（所有请求完成后才关闭）

// ✅ 优势：减少了多次握手和挥手的开销
```

### 长连接的工作原理

```javascript
// HTTP/1.1 默认启用长连接
// 请求头
GET /api/users HTTP/1.1
Host: example.com
Connection: keep-alive  // 告诉服务器保持连接

// 响应头
HTTP/1.1 200 OK
Connection: keep-alive  // 服务器同意保持连接
Keep-Alive: timeout=5, max=100  // 连接参数
Content-Length: 1234

// timeout=5: 连接空闲 5 秒后关闭
// max=100: 这个连接最多处理 100 个请求
```

---

## 问题 2：长连接有什么优势？

### 1. 减少延迟

```javascript
// TCP 三次握手的时间开销
// RTT (Round Trip Time): 往返时间

// 短连接：每个请求都需要 1 个 RTT 的握手时间
请求 1: 握手(1 RTT) + 请求响应(1 RTT) = 2 RTT
请求 2: 握手(1 RTT) + 请求响应(1 RTT) = 2 RTT
请求 3: 握手(1 RTT) + 请求响应(1 RTT) = 2 RTT
总计: 6 RTT

// 长连接：只需要一次握手
请求 1: 握手(1 RTT) + 请求响应(1 RTT) = 2 RTT
请求 2: 请求响应(1 RTT) = 1 RTT
请求 3: 请求响应(1 RTT) = 1 RTT
总计: 4 RTT

// ✅ 节省了 2 个 RTT 的时间
```

### 2. 减少 CPU 和内存开销

```javascript
// 短连接的开销
// 每次建立连接都需要：
// - 分配内存存储连接状态
// - CPU 处理握手和挥手
// - 操作系统维护连接状态

// 示例：1000 个请求
短连接: 1000 次握手 + 1000 次挥手 = 2000 次额外操作
长连接: 1 次握手 + 1 次挥手 = 2 次额外操作

// ✅ 大幅减少服务器负载
```

### 3. 减少网络拥塞

```javascript
// TCP 慢启动（Slow Start）
// 新建立的连接会从较小的拥塞窗口开始
// 逐渐增加传输速度

// 短连接：每次都要重新慢启动
连接 1: 慢启动 -> 达到最佳速度 -> 关闭
连接 2: 慢启动 -> 达到最佳速度 -> 关闭
连接 3: 慢启动 -> 达到最佳速度 -> 关闭

// 长连接：只需要一次慢启动
连接: 慢启动 -> 达到最佳速度 -> 保持最佳速度传输所有数据

// ✅ 更快达到最佳传输速度
```

### 性能对比示例

```javascript
// 实际测试示例
// 加载一个包含 50 个资源的页面

// 短连接
// - 50 次 TCP 握手
// - 50 次 TCP 挥手
// - 总耗时: 约 5 秒

// 长连接（6 个并发连接）
// - 6 次 TCP 握手
// - 6 次 TCP 挥手
// - 总耗时: 约 2 秒

// ✅ 性能提升 60%
```

---

## 问题 3：如何配置和使用长连接？

### 客户端配置

```javascript
// 1. Fetch API（默认使用长连接）
fetch('https://api.example.com/users')
  .then(res => res.json())
  .then(data => console.log(data));

// 浏览器会自动管理连接池
// 对同一个域名的多个请求会复用连接

// 2. 显式设置 keep-alive（通常不需要）
fetch('https://api.example.com/users', {
  headers: {
    'Connection': 'keep-alive'
  }
});

// 3. 关闭长连接（如果需要）
fetch('https://api.example.com/users', {
  headers: {
    'Connection': 'close'
  }
});
```

```javascript
// Node.js 客户端
const http = require('http');

// 使用 Agent 管理连接池
const agent = new http.Agent({
  keepAlive: true,          // 启用长连接
  keepAliveMsecs: 1000,     // 初始延迟
  maxSockets: 50,           // 每个主机的最大连接数
  maxFreeSockets: 10,       // 空闲连接池大小
  timeout: 60000            // 连接超时时间
});

// 发送请求
http.get({
  hostname: 'api.example.com',
  path: '/users',
  agent: agent
}, (res) => {
  // 处理响应
});
```

### 服务器端配置

```javascript
// Node.js Express
const express = require('express');
const app = express();

// 设置 Keep-Alive 响应头
app.use((req, res, next) => {
  res.set({
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=5, max=1000'
  });
  next();
});

// 配置服务器
const server = app.listen(3000);
server.keepAliveTimeout = 5000; // 5 秒
server.headersTimeout = 6000;   // 必须大于 keepAliveTimeout
```

```nginx
# Nginx 配置
http {
    # 启用长连接
    keepalive_timeout 65;  # 超时时间（秒）
    keepalive_requests 100; # 单个连接最大请求数
    
    # 与上游服务器的长连接
    upstream backend {
        server backend1.example.com;
        server backend2.example.com;
        keepalive 32;  # 保持的空闲连接数
    }
    
    server {
        listen 80;
        
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";  # 清除 Connection 头
        }
    }
}
```

```apache
# Apache 配置
<IfModule mod_headers.c>
    # 启用长连接
    KeepAlive On
    
    # 最大请求数
    MaxKeepAliveRequests 100
    
    # 超时时间（秒）
    KeepAliveTimeout 5
</IfModule>
```

---

## 问题 4：长连接有哪些注意事项？

### 1. 连接超时管理

```javascript
// 问题：长连接不能永久保持
// 需要设置合理的超时时间

// ❌ 超时时间过长
// - 占用服务器资源
// - 可能导致连接泄漏
keepAliveTimeout: 300000  // 5 分钟，太长

// ❌ 超时时间过短
// - 频繁重建连接
// - 失去长连接的优势
keepAliveTimeout: 100  // 100 毫秒，太短

// ✅ 合理的超时时间
keepAliveTimeout: 5000  // 5 秒，适中
```

### 2. 连接数限制

```javascript
// 浏览器对同一域名的并发连接数有限制
// HTTP/1.1: 通常是 6 个并发连接

// 问题：如果页面有 100 个资源
// 只能同时下载 6 个，其他 94 个需要排队

// 解决方案：
// 1. 使用 CDN 分散资源到不同域名
<script src="https://cdn1.example.com/app.js"></script>
<script src="https://cdn2.example.com/lib.js"></script>

// 2. 合并资源减少请求数
// 将多个 JS 文件合并成一个

// 3. 使用 HTTP/2
// HTTP/2 支持多路复用，可以在一个连接上并发传输多个资源
```

### 3. 连接池管理

```javascript
// Node.js 客户端需要正确管理连接池

// ❌ 错误：每次创建新的 Agent
function makeRequest() {
  const agent = new http.Agent({ keepAlive: true });
  http.get({ agent }, callback);
  // 每次都创建新 Agent，无法复用连接
}

// ✅ 正确：复用同一个 Agent
const agent = new http.Agent({ keepAlive: true });

function makeRequest() {
  http.get({ agent }, callback);
  // 复用同一个 Agent，可以复用连接
}

// ✅ 使用完毕后销毁 Agent
agent.destroy();
```

### 4. 代理和负载均衡

```javascript
// 问题：长连接可能导致负载不均衡

// 场景：使用负载均衡器
客户端 -> 负载均衡器 -> 服务器 1
                    -> 服务器 2
                    -> 服务器 3

// 如果客户端与负载均衡器保持长连接
// 所有请求可能都被转发到同一台服务器
// 导致负载不均衡

// 解决方案：
// 1. 负载均衡器定期关闭长连接
// 2. 使用基于请求的负载均衡（而不是基于连接）
// 3. 设置较短的 keepAliveTimeout
```

### 5. 错误处理

```javascript
// 长连接可能在空闲时被服务器关闭
// 客户端需要处理连接关闭的情况

const agent = new http.Agent({ keepAlive: true });

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get({ url, agent }, (res) => {
      resolve(res);
    }).on('error', (err) => {
      // 如果是连接被关闭的错误，重试
      if (err.code === 'ECONNRESET') {
        console.log('连接被关闭，重试...');
        return makeRequest(url).then(resolve).catch(reject);
      }
      reject(err);
    });
  });
}
```

### 6. HTTP/2 的改进

```javascript
// HTTP/2 对长连接进行了改进

// HTTP/1.1 长连接的问题：
// - 请求必须按顺序处理（队头阻塞）
// - 一个连接同时只能处理一个请求

请求 1 -> 响应 1 -> 请求 2 -> 响应 2 -> 请求 3 -> 响应 3

// HTTP/2 多路复用：
// - 一个连接可以并发处理多个请求
// - 请求和响应可以交错进行

请求 1 -----> 响应 1
请求 2 ---> 响应 2
请求 3 ---------> 响应 3
// 所有请求在同一个连接上并发传输

// ✅ HTTP/2 更好地利用了长连接
```

---

## 总结

**核心概念总结**：

### 1. 长连接的本质

- 在一个 TCP 连接上发送多个 HTTP 请求
- HTTP/1.1 默认启用
- 通过 `Connection: keep-alive` 头控制

### 2. 长连接的优势

- **减少延迟**：避免多次 TCP 握手
- **降低开销**：减少 CPU 和内存消耗
- **提升性能**：避免 TCP 慢启动

### 3. 配置要点

- **超时时间**：通常设置 5-60 秒
- **最大请求数**：限制单个连接的请求数
- **连接池**：客户端需要管理连接池

### 4. 注意事项

- 设置合理的超时时间
- 注意浏览器并发连接数限制
- 正确管理连接池
- 处理连接关闭错误
- 考虑负载均衡的影响

## 延伸阅读

- [MDN - Connection management in HTTP/1.x](https://developer.mozilla.org/en-US/docs/Web/HTTP/Connection_management_in_HTTP_1.x)
- [RFC 7230 - HTTP/1.1 Message Syntax and Routing](https://tools.ietf.org/html/rfc7230)
- [Node.js - HTTP Keep-Alive](https://nodejs.org/api/http.html#http_class_http_agent)
- [Nginx - keepalive](http://nginx.org/en/docs/http/ngx_http_core_module.html#keepalive_timeout)
- [High Performance Browser Networking](https://hpbn.co/)
