---
title: 什么是正向代理，反向代理
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解正向代理和反向代理的概念、工作原理和应用场景，掌握代理服务器的使用方法
tags:
  - 代理
  - 正向代理
  - 反向代理
  - Nginx
estimatedTime: 22 分钟
keywords:
  - 正向代理
  - 反向代理
  - 代理服务器
  - Nginx
highlight: 正向代理代表客户端访问服务器，反向代理代表服务器接收客户端请求
order: 67
---

## 问题 1：什么是正向代理？

正向代理（Forward Proxy）是代理客户端向服务器发送请求的服务器，客户端通过代理服务器访问互联网资源。

### 正向代理的工作原理

```javascript
// 没有代理的情况
客户端 -> 直接请求 -> 服务器

// 使用正向代理
客户端 -> 请求代理服务器 -> 代理服务器请求目标服务器 -> 返回给客户端

// 详细流程：
// 1. 客户端配置代理服务器地址
// 2. 客户端向代理服务器发送请求
// 3. 代理服务器代替客户端向目标服务器发送请求
// 4. 目标服务器返回响应给代理服务器
// 5. 代理服务器将响应转发给客户端

// ✅ 目标服务器只知道代理服务器的 IP，不知道真实客户端 IP
```

### 正向代理的特点

```javascript
// 1. 客户端明确知道代理的存在
// 客户端需要主动配置代理服务器

// 浏览器代理配置
设置 -> 网络 -> 代理服务器
  HTTP 代理: proxy.example.com:8080
  HTTPS 代理: proxy.example.com:8080

// 2. 代理服务器代表客户端
// 对于目标服务器来说，请求来自代理服务器

// 3. 隐藏客户端身份
// 目标服务器看到的是代理服务器的 IP
```

### 正向代理的应用场景

```javascript
// 1. 访问被限制的资源
// 例如：公司内网访问外网

客户端（公司内网）-> 正向代理服务器 -> 互联网
// 客户端无法直接访问互联网
// 通过代理服务器访问

// 2. 隐藏客户端 IP
// 保护隐私

客户端 -> 代理服务器 -> 目标网站
// 目标网站只能看到代理服务器的 IP

// 3. 缓存加速
// 代理服务器缓存常用资源

客户端 A -> 请求 image.jpg -> 代理服务器 -> 下载并缓存
客户端 B -> 请求 image.jpg -> 代理服务器 -> 直接返回缓存
// 减少带宽消耗，提高访问速度

// 4. 访问控制
// 公司限制员工访问某些网站

代理服务器:
  允许访问: work-related.com
  禁止访问: social-media.com, gaming.com
```

### 正向代理的实现

```javascript
// Node.js 实现简单的正向代理
const http = require('http');
const url = require('url');

const proxy = http.createServer((req, res) => {
  // 解析目标 URL
  const targetUrl = url.parse(req.url);
  
  // 构造代理请求
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 80,
    path: targetUrl.path,
    method: req.method,
    headers: req.headers
  };
  
  // 发送代理请求
  const proxyReq = http.request(options, (proxyRes) => {
    // 转发响应头
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // 转发响应体
    proxyRes.pipe(res);
  });
  
  // 转发请求体
  req.pipe(proxyReq);
  
  proxyReq.on('error', (err) => {
    res.writeHead(500);
    res.end('Proxy Error');
  });
});

proxy.listen(8080, () => {
  console.log('正向代理服务器运行在 8080 端口');
});
```

---

## 问题 2：什么是反向代理？

反向代理（Reverse Proxy）是代理服务器接收客户端请求，然后将请求转发给内部服务器，并将内部服务器的响应返回给客户端。

### 反向代理的工作原理

```javascript
// 使用反向代理
客户端 -> 请求反向代理服务器 -> 反向代理转发给内部服务器 -> 返回给客户端

// 详细流程：
// 1. 客户端向反向代理服务器发送请求（客户端不知道内部服务器的存在）
// 2. 反向代理服务器根据规则选择内部服务器
// 3. 反向代理服务器向内部服务器转发请求
// 4. 内部服务器处理请求并返回响应
// 5. 反向代理服务器将响应返回给客户端

// ✅ 客户端只知道反向代理服务器，不知道内部服务器
```

### 反向代理的特点

```javascript
// 1. 客户端不知道代理的存在
// 客户端以为直接访问的就是目标服务器

// 客户端视角
访问: https://example.com
// 实际上访问的是反向代理服务器
// 反向代理再转发给内部服务器

// 2. 代理服务器代表服务器
// 对于客户端来说，代理服务器就是服务器

// 3. 隐藏内部服务器
// 客户端无法直接访问内部服务器
```

### 反向代理的应用场景

```javascript
// 1. 负载均衡
// 将请求分发到多台服务器

客户端 -> 反向代理 -> 服务器 1 (30% 流量)
                  -> 服务器 2 (30% 流量)
                  -> 服务器 3 (40% 流量)

// 2. 隐藏内部服务器
// 保护内部服务器不被直接访问

客户端 -> 反向代理 (公网 IP: 1.2.3.4)
       -> 内部服务器 (内网 IP: 192.168.1.10)

// 客户端无法直接访问 192.168.1.10

// 3. SSL 终止
// 反向代理处理 HTTPS，内部使用 HTTP

客户端 <--HTTPS--> 反向代理 <--HTTP--> 内部服务器
// 减轻内部服务器的 SSL 计算负担

// 4. 缓存静态资源
// 反向代理缓存图片、CSS、JS 等

客户端 -> 请求 logo.png -> 反向代理 (缓存命中) -> 直接返回
客户端 -> 请求 app.js -> 反向代理 (缓存未命中) -> 内部服务器

// 5. 统一入口
// 多个服务通过一个域名访问

客户端 -> example.com/api -> 反向代理 -> API 服务器
       -> example.com/admin -> 反向代理 -> 管理后台服务器
       -> example.com/static -> 反向代理 -> 静态资源服务器
```

### 反向代理的实现

```nginx
# Nginx 反向代理配置

# 1. 基本反向代理
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://localhost:3000;  # 转发到内部服务器
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 2. 负载均衡
upstream backend {
    server 192.168.1.10:3000 weight=3;  # 权重 3
    server 192.168.1.11:3000 weight=2;  # 权重 2
    server 192.168.1.12:3000 weight=1;  # 权重 1
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend;
    }
}

# 3. 路径分发
server {
    listen 80;
    server_name example.com;
    
    # API 请求转发到 API 服务器
    location /api/ {
        proxy_pass http://api-server:8080/;
    }
    
    # 管理后台转发到管理服务器
    location /admin/ {
        proxy_pass http://admin-server:8081/;
    }
    
    # 静态资源
    location /static/ {
        root /var/www;
    }
}

# 4. SSL 终止
server {
    listen 443 ssl;
    server_name example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        # HTTPS -> HTTP
        proxy_pass http://localhost:3000;
    }
}
```

```javascript
// Node.js 实现简单的反向代理
const http = require('http');
const httpProxy = require('http-proxy');

// 创建代理服务器
const proxy = httpProxy.createProxyServer({});

// 后端服务器列表
const backends = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003'
];

let current = 0;

// 简单的轮询负载均衡
function getBackend() {
  const backend = backends[current];
  current = (current + 1) % backends.length;
  return backend;
}

// 创建反向代理服务器
const server = http.createServer((req, res) => {
  const target = getBackend();
  console.log(`转发请求到: ${target}`);
  
  proxy.web(req, res, { target }, (err) => {
    console.error('代理错误:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  });
});

server.listen(80, () => {
  console.log('反向代理服务器运行在 80 端口');
});
```

---

## 问题 3：正向代理和反向代理有什么区别？

### 核心区别

```javascript
// 正向代理：代表客户端
客户端（知道代理）-> 正向代理 -> 服务器（不知道真实客户端）

// 反向代理：代表服务器
客户端（不知道代理）-> 反向代理 -> 服务器（客户端不知道）
```

### 详细对比

| 特性 | 正向代理 | 反向代理 |
|------|---------|---------|
| **代理对象** | 代理客户端 | 代理服务器 |
| **客户端是否知道** | 知道，需要配置 | 不知道，透明 |
| **服务器是否知道** | 不知道真实客户端 | 知道代理服务器 |
| **主要目的** | 访问外部资源、隐藏客户端 | 负载均衡、保护服务器 |
| **配置位置** | 客户端 | 服务器端 |
| **典型应用** | VPN、科学上网 | Nginx、CDN |

### 使用场景对比

```javascript
// 正向代理使用场景
// 1. 公司员工访问互联网
员工电脑 -> 公司代理服务器 -> 互联网

// 2. 爬虫隐藏 IP
爬虫 -> 代理 IP 池 -> 目标网站

// 3. 访问被屏蔽的网站
用户 -> VPN 服务器 -> 被屏蔽的网站
```

```javascript
// 反向代理使用场景
// 1. 网站负载均衡
用户 -> Nginx -> Web 服务器集群

// 2. CDN 加速
用户 -> CDN 节点（反向代理）-> 源服务器

// 3. API 网关
客户端 -> API 网关 -> 微服务集群
```

---

## 问题 4：代理服务器的安全性考虑

### 正向代理的安全问题

```javascript
// 1. 中间人攻击
// 恶意代理服务器可以窃取数据

客户端 -> 恶意代理 -> 目标服务器
         ↓
    窃取用户名、密码等敏感信息

// 防护措施：
// - 使用 HTTPS
// - 只使用可信的代理服务器
// - 使用 VPN 加密隧道
```

```javascript
// 2. 隐私泄露
// 代理服务器可以记录所有访问记录

// 防护措施：
// - 选择有隐私保护承诺的代理服务
// - 使用 Tor 等匿名网络
```

### 反向代理的安全配置

```nginx
# 1. 限制请求速率（防止 DDoS）
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

server {
    location / {
        limit_req zone=one burst=20;
        proxy_pass http://backend;
    }
}

# 2. IP 白名单/黑名单
# 只允许特定 IP 访问管理后台
location /admin/ {
    allow 192.168.1.0/24;  # 允许内网
    deny all;              # 拒绝其他所有
    proxy_pass http://admin-backend;
}

# 3. 隐藏服务器信息
server {
    # 隐藏 Nginx 版本号
    server_tokens off;
    
    # 隐藏后端服务器信息
    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;
}

# 4. 设置超时防止慢速攻击
server {
    client_body_timeout 10s;
    client_header_timeout 10s;
    
    location / {
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        proxy_pass http://backend;
    }
}

# 5. 防止 Host 头攻击
server {
    listen 80 default_server;
    server_name _;
    return 444;  # 拒绝未知的 Host
}

server {
    listen 80;
    server_name example.com www.example.com;  # 只接受指定域名
    
    location / {
        proxy_pass http://backend;
    }
}
```

---

## 总结

**核心概念总结**：

### 1. 正向代理

- 代理客户端访问服务器
- 客户端需要配置代理
- 隐藏客户端真实 IP
- 用于访问控制、隐私保护

### 2. 反向代理

- 代理服务器接收客户端请求
- 客户端不知道代理存在
- 隐藏内部服务器
- 用于负载均衡、安全防护

### 3. 主要区别

- **代理对象**：正向代理客户端，反向代理服务器
- **透明度**：正向代理客户端知道，反向代理客户端不知道
- **配置位置**：正向代理在客户端，反向代理在服务器端

### 4. 安全考虑

- 正向代理：防止中间人攻击，保护隐私
- 反向代理：限流、访问控制、隐藏服务器信息

## 延伸阅读

- [MDN - Proxy servers and tunneling](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling)
- [Nginx - Reverse Proxy](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Wikipedia - Proxy server](https://en.wikipedia.org/wiki/Proxy_server)
- [Cloudflare - What is a reverse proxy?](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/)
- [DigitalOcean - Understanding Nginx HTTP Proxying](https://www.digitalocean.com/community/tutorials/understanding-nginx-http-proxying-load-balancing-buffering-and-caching)
