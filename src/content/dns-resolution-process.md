---
title: DNS解析过程
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 DNS 域名解析的完整过程，掌握递归查询、迭代查询和 DNS 缓存机制
tags:
  - DNS
  - 域名解析
  - 网络协议
  - 缓存
estimatedTime: 25 分钟
keywords:
  - DNS
  - 域名解析
  - 递归查询
  - 迭代查询
highlight: DNS 通过分层查询将域名转换为 IP 地址，是互联网访问的第一步
order: 17
---

## 问题 1：什么是 DNS？

DNS（Domain Name System，域名系统）是互联网的"电话簿"，将人类可读的域名（如 www.example.com）转换为计算机可识别的 IP 地址（如 93.184.216.34）。

### 为什么需要 DNS？

```javascript
// 没有 DNS 的情况
// 用户需要记住 IP 地址
访问 Google: http://142.250.185.46
访问 Facebook: http://157.240.241.35
访问 Amazon: http://54.239.28.85

// ❌ 问题：
// - IP 地址难以记忆
// - IP 地址可能变化
// - 无法表达网站含义

// 有 DNS 的情况
// 用户只需记住域名
访问 Google: https://www.google.com
访问 Facebook: https://www.facebook.com
访问 Amazon: https://www.amazon.com

// ✅ 优势：
// - 域名易于记忆
// - IP 变化时只需更新 DNS 记录
// - 域名有意义
```

### DNS 的层次结构

```javascript
// DNS 采用分层的树状结构

                        .（根域）
                         |
        +----------------+----------------+
        |                |                |
       com              org              cn
        |                |                |
    +---+---+        +---+---+        +---+---+
    |       |        |       |        |       |
 google  amazon   wikipedia  |      baidu  taobao
    |                        |
  www                       www

// 完整域名（FQDN）：www.google.com.
// 从右到左读取：
// . (根域) -> com (顶级域) -> google (二级域) -> www (三级域/主机名)
```

---

## 问题 2：DNS 解析的完整过程

### 解析流程

```javascript
// 用户访问 www.example.com 的完整 DNS 解析过程

// 1. 浏览器缓存
// 浏览器首先检查自己的 DNS 缓存
const cachedIP = browser.dnsCache.get('www.example.com');
if (cachedIP) {
  return cachedIP;  // 直接使用缓存
}

// 2. 操作系统缓存
// 检查操作系统的 DNS 缓存
const osCache = os.dnsCache.get('www.example.com');
if (osCache) {
  return osCache;
}

// 3. 本地 hosts 文件
// 检查 /etc/hosts (Linux/Mac) 或 C:\Windows\System32\drivers\etc\hosts (Windows)
// 127.0.0.1  localhost
// 192.168.1.100  myserver.local

// 4. 本地 DNS 服务器（递归查询）
// 通常是 ISP 提供的 DNS 服务器或配置的公共 DNS（如 8.8.8.8）
用户 -> 本地 DNS 服务器: "www.example.com 的 IP 是什么？"

// 5. 根 DNS 服务器（迭代查询）
本地 DNS -> 根 DNS 服务器: "www.example.com 的 IP 是什么？"
根 DNS -> 本地 DNS: "我不知道，但你可以问 .com 的 DNS 服务器"
// 返回 .com 顶级域 DNS 服务器的 IP

// 6. 顶级域 DNS 服务器
本地 DNS -> .com DNS 服务器: "www.example.com 的 IP 是什么？"
.com DNS -> 本地 DNS: "我不知道，但你可以问 example.com 的 DNS 服务器"
// 返回 example.com 权威 DNS 服务器的 IP

// 7. 权威 DNS 服务器
本地 DNS -> example.com DNS 服务器: "www.example.com 的 IP 是什么？"
example.com DNS -> 本地 DNS: "www.example.com 的 IP 是 93.184.216.34"

// 8. 返回结果并缓存
本地 DNS -> 用户: "93.184.216.34"
// 同时缓存结果，下次直接返回
```

### 递归查询 vs 迭代查询

```javascript
// 递归查询（Recursive Query）
// 用户 -> 本地 DNS 服务器
// 本地 DNS 负责完成所有查询工作，直到找到答案

用户: "www.example.com 的 IP 是什么？"
本地 DNS: "让我帮你查询..."
  -> 查询根 DNS
  -> 查询 .com DNS
  -> 查询 example.com DNS
  -> 找到答案
本地 DNS: "IP 是 93.184.216.34"

// 特点：
// - 用户只需发送一次请求
// - 本地 DNS 负责所有查询
// - 对用户友好

// 迭代查询（Iterative Query）
// 本地 DNS -> 其他 DNS 服务器
// 每次查询返回下一步应该查询的服务器

本地 DNS: "www.example.com 的 IP 是什么？"
根 DNS: "我不知道，去问 .com DNS (IP: 1.2.3.4)"

本地 DNS: "www.example.com 的 IP 是什么？"
.com DNS: "我不知道，去问 example.com DNS (IP: 5.6.7.8)"

本地 DNS: "www.example.com 的 IP 是什么？"
example.com DNS: "IP 是 93.184.216.34"

// 特点：
// - 需要多次查询
// - 每次返回下一步的提示
// - 减轻单个服务器负担
```

---

## 问题 3：DNS 记录类型

### 常见的 DNS 记录

```javascript
// 1. A 记录（Address Record）
// 将域名映射到 IPv4 地址
{
  type: 'A',
  name: 'www.example.com',
  value: '93.184.216.34',
  ttl: 3600  // 缓存时间（秒）
}

// 2. AAAA 记录
// 将域名映射到 IPv6 地址
{
  type: 'AAAA',
  name: 'www.example.com',
  value: '2606:2800:220:1:248:1893:25c8:1946',
  ttl: 3600
}

// 3. CNAME 记录（Canonical Name）
// 将域名映射到另一个域名（别名）
{
  type: 'CNAME',
  name: 'blog.example.com',
  value: 'example.github.io',
  ttl: 3600
}

// 用途：
// - CDN 加速
// - 域名迁移
// - 负载均衡

// 4. MX 记录（Mail Exchange）
// 指定邮件服务器
{
  type: 'MX',
  name: 'example.com',
  value: 'mail.example.com',
  priority: 10,  // 优先级（数字越小优先级越高）
  ttl: 3600
}

// 5. TXT 记录
// 存储文本信息，常用于验证和配置
{
  type: 'TXT',
  name: 'example.com',
  value: 'v=spf1 include:_spf.google.com ~all',  // SPF 记录
  ttl: 3600
}

// 用途：
// - 域名验证（Google、Let's Encrypt）
// - SPF（防止邮件伪造）
// - DKIM（邮件签名）

// 6. NS 记录（Name Server）
// 指定域名的权威 DNS 服务器
{
  type: 'NS',
  name: 'example.com',
  value: 'ns1.example.com',
  ttl: 86400
}

// 7. PTR 记录（Pointer Record）
// 反向 DNS 查询，IP 地址映射到域名
{
  type: 'PTR',
  name: '34.216.184.93.in-addr.arpa',
  value: 'www.example.com',
  ttl: 3600
}
```

### 查询 DNS 记录

```bash
# 使用 dig 命令查询 DNS 记录

# 查询 A 记录
dig www.example.com A

# 查询 AAAA 记录
dig www.example.com AAAA

# 查询 MX 记录
dig example.com MX

# 查询所有记录
dig www.example.com ANY

# 指定 DNS 服务器查询
dig @8.8.8.8 www.example.com

# 查看详细信息
dig www.example.com +trace
```

```javascript
// Node.js 查询 DNS
const dns = require('dns');

// 查询 A 记录
dns.resolve4('www.example.com', (err, addresses) => {
  console.log('IPv4 地址:', addresses);
  // ['93.184.216.34']
});

// 查询 AAAA 记录
dns.resolve6('www.example.com', (err, addresses) => {
  console.log('IPv6 地址:', addresses);
});

// 查询 MX 记录
dns.resolveMx('example.com', (err, addresses) => {
  console.log('邮件服务器:', addresses);
  // [{ exchange: 'mail.example.com', priority: 10 }]
});

// 查询 TXT 记录
dns.resolveTxt('example.com', (err, records) => {
  console.log('TXT 记录:', records);
});

// 反向查询（IP 到域名）
dns.reverse('93.184.216.34', (err, hostnames) => {
  console.log('域名:', hostnames);
});
```

---

## 问题 4：DNS 缓存机制

### 多级缓存

```javascript
// DNS 缓存的层次结构

// 1. 浏览器缓存
// - 缓存时间：通常几分钟到几小时
// - 查看 Chrome DNS 缓存：chrome://net-internals/#dns

// 2. 操作系统缓存
// - 缓存时间：由 TTL 决定
// - 清除缓存：
//   Windows: ipconfig /flushdns
//   Mac: sudo dscacheutil -flushcache
//   Linux: sudo systemd-resolve --flush-caches

// 3. 路由器缓存
// - 缓存时间：由 TTL 决定
// - 重启路由器可清除

// 4. ISP DNS 服务器缓存
// - 缓存时间：由 TTL 决定
// - 用户无法直接清除

// 5. 权威 DNS 服务器
// - 不缓存，直接返回最新记录
```

### TTL（Time To Live）

```javascript
// TTL 控制 DNS 记录的缓存时间

// 示例：查询结果
{
  name: 'www.example.com',
  type: 'A',
  value: '93.184.216.34',
  ttl: 3600  // 3600 秒 = 1 小时
}

// TTL 的作用：
// - 减少 DNS 查询次数
// - 降低 DNS 服务器负载
// - 加快域名解析速度

// TTL 的选择：
// - 短 TTL（60-300 秒）：
//   - 优势：更新快，适合频繁变化的记录
//   - 劣势：查询次数多，增加负载
//   - 适用：网站迁移、灰度发布

// - 长 TTL（3600-86400 秒）：
//   - 优势：查询次数少，性能好
//   - 劣势：更新慢
//   - 适用：稳定的生产环境

// 更新 DNS 记录时的策略：
// 1. 提前降低 TTL
// 2. 等待旧 TTL 过期
// 3. 更新 DNS 记录
// 4. 验证新记录生效
// 5. 恢复正常 TTL
```

### DNS 预取

```html
<!-- DNS Prefetch：提前解析域名 -->
<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="dns-prefetch" href="//api.example.com">

<!-- 浏览器会在空闲时预先解析这些域名 -->
<!-- 当真正请求时，DNS 已经解析完成，节省时间 -->
```

```javascript
// 在 JavaScript 中触发 DNS 预取
const link = document.createElement('link');
link.rel = 'dns-prefetch';
link.href = '//cdn.example.com';
document.head.appendChild(link);

// 适用场景：
// - 即将跳转的页面
// - 即将加载的资源
// - 第三方服务（分析、广告）
```

---

## 问题 5：DNS 安全和优化

### DNS 安全问题

```javascript
// 1. DNS 劫持
// 攻击者篡改 DNS 响应，将用户引导到恶意网站

// 防护措施：
// - 使用可信的 DNS 服务器（Google 8.8.8.8, Cloudflare 1.1.1.1）
// - 使用 HTTPS（即使 DNS 被劫持，证书验证也会失败）
// - 使用 DNSSEC

// 2. DNS 缓存投毒
// 攻击者向 DNS 服务器注入虚假记录

// 防护措施：
// - DNSSEC（DNS Security Extensions）
// - 随机化查询 ID 和端口

// 3. DNS 放大攻击（DDoS）
// 利用 DNS 响应比请求大的特点进行 DDoS 攻击

// 防护措施：
// - 限制响应大小
// - 限制查询速率
// - 使用 DNS 防火墙
```

### DNSSEC

```javascript
// DNSSEC 通过数字签名验证 DNS 响应的真实性

// 工作原理：
// 1. 权威 DNS 服务器对记录进行签名
{
  name: 'www.example.com',
  type: 'A',
  value: '93.184.216.34',
  signature: 'digital_signature...'  // 数字签名
}

// 2. 客户端验证签名
// - 使用公钥验证签名
// - 确保记录未被篡改

// 3. 信任链
// 根 DNS -> .com DNS -> example.com DNS
// 每一级都验证下一级的签名

// 启用 DNSSEC：
// - 在域名注册商处启用
// - 配置 DS 记录
// - 定期轮换密钥
```

### DNS over HTTPS (DoH)

```javascript
// DoH 通过 HTTPS 加密 DNS 查询
// 防止 ISP 监听和篡改

// 传统 DNS（明文）
用户 -> DNS 查询（明文）-> DNS 服务器
// ISP 可以看到所有查询

// DNS over HTTPS
用户 -> HTTPS 加密的 DNS 查询 -> DoH 服务器
// ISP 无法看到查询内容

// 使用 DoH
// Chrome: 设置 -> 隐私和安全 -> 使用安全 DNS
// Firefox: 设置 -> 网络设置 -> 启用 DNS over HTTPS

// Node.js 使用 DoH
const https = require('https');

function dohQuery(domain) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'cloudflare-dns.com',
      path: `/dns-query?name=${domain}&type=A`,
      headers: {
        'Accept': 'application/dns-json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        resolve(result.Answer[0].data);
      });
    }).on('error', reject);
  });
}

dohQuery('www.example.com').then(ip => {
  console.log('IP 地址:', ip);
});
```

### 性能优化

```javascript
// 1. 使用快速的 DNS 服务器
// - Google DNS: 8.8.8.8, 8.8.4.4
// - Cloudflare DNS: 1.1.1.1, 1.0.0.1
// - 阿里 DNS: 223.5.5.5, 223.6.6.6

// 2. 减少 DNS 查询
// - 减少不同域名的资源
// - 使用 CDN 合并资源

// 3. DNS 预取
<link rel="dns-prefetch" href="//cdn.example.com">

// 4. 使用长 TTL
// - 稳定的记录使用长 TTL（1 小时 - 1 天）

// 5. 使用 CDN
// - CDN 通常有更快的 DNS 解析
// - GeoDNS：根据用户位置返回最近的服务器

// 6. 监控 DNS 性能
const start = Date.now();
dns.resolve4('www.example.com', () => {
  const duration = Date.now() - start;
  console.log(`DNS 解析耗时: ${duration}ms`);
});
```

---

## 总结

**核心概念总结**：

### 1. DNS 的作用

- 将域名转换为 IP 地址
- 分层的树状结构
- 分布式数据库

### 2. 解析过程

- 浏览器缓存 -> OS 缓存 -> 本地 DNS -> 根 DNS -> 顶级域 DNS -> 权威 DNS
- 递归查询：用户到本地 DNS
- 迭代查询：本地 DNS 到其他 DNS

### 3. DNS 记录类型

- **A/AAAA**：域名到 IP
- **CNAME**：域名别名
- **MX**：邮件服务器
- **TXT**：文本信息

### 4. 缓存和安全

- 多级缓存机制
- TTL 控制缓存时间
- DNSSEC 防篡改
- DoH 加密查询

## 延伸阅读

- [RFC 1035 - DNS 规范](https://tools.ietf.org/html/rfc1035)
- [MDN - DNS](https://developer.mozilla.org/zh-CN/docs/Glossary/DNS)
- [Cloudflare - What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)
- [Google Public DNS](https://developers.google.com/speed/public-dns)
- [DNSSEC 介绍](https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-zh)
