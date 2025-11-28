---
title: 什么是DNS劫持
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 DNS 劫持的原理、类型、危害和防护方法，掌握网络安全的重要知识
tags:
  - DNS
  - 安全
  - 网络攻击
  - 防护
estimatedTime: 22 分钟
keywords:
  - DNS劫持
  - DNS污染
  - 网络安全
  - HTTPS
highlight: DNS 劫持是常见的网络攻击手段，了解其原理和防护方法对保障网络安全至关重要
order: 3
---

## 问题 1：什么是 DNS 劫持？

DNS 劫持（DNS Hijacking）是指攻击者通过某种手段篡改 DNS 解析结果，将用户访问的域名指向错误的 IP 地址，从而将用户引导到恶意网站。

### DNS 正常解析流程

```javascript
// 用户访问网站的正常流程
// 1. 用户在浏览器输入 www.example.com
// 2. 浏览器向 DNS 服务器查询域名对应的 IP
// 3. DNS 服务器返回正确的 IP：93.184.216.34
// 4. 浏览器向该 IP 发起请求
// 5. 用户成功访问网站

// 简化的 DNS 查询示例
async function normalDNSQuery(domain) {
  // 查询 DNS
  const ip = await dns.resolve(domain); // 返回 "93.184.216.34"
  // 访问网站
  const response = await fetch(`http://${ip}`);
  return response;
}
```

### DNS 劫持后的流程

```javascript
// DNS 被劫持后的流程
// 1. 用户在浏览器输入 www.example.com
// 2. 浏览器向 DNS 服务器查询域名对应的 IP
// 3. ❌ DNS 服务器被劫持，返回恶意 IP：123.45.67.89
// 4. 浏览器向恶意 IP 发起请求
// 5. ❌ 用户被引导到钓鱼网站或广告页面

async function hijackedDNSQuery(domain) {
  // DNS 被劫持
  const ip = await dns.resolve(domain); // ❌ 返回 "123.45.67.89"（恶意IP）
  // 访问到错误的网站
  const response = await fetch(`http://${ip}`);
  return response; // 返回钓鱼网站内容
}
```

### DNS 劫持的表现

用户可能遇到以下情况：

1. **访问正常网站却跳转到广告页面**
2. **访问银行网站却进入钓鱼网站**
3. **搜索结果被篡改**
4. **网页中插入额外的广告**

---

## 问题 2：DNS 劫持有哪些类型？

### 1. 本地 DNS 劫持

攻击者通过修改用户本地的 DNS 配置或 hosts 文件来劫持 DNS。

```bash
# 查看本地 hosts 文件（macOS/Linux）
cat /etc/hosts

# ❌ 被劫持的 hosts 文件示例
127.0.0.1       localhost
# 恶意添加的记录
123.45.67.89    www.bank.com    # 将银行网站指向恶意IP
123.45.67.89    www.example.com
```

```javascript
// 攻击者可能通过恶意软件修改 hosts 文件
// 用户访问 www.bank.com 时，会先查询本地 hosts
// 发现有记录，直接使用 123.45.67.89，不再查询 DNS 服务器
```

### 2. 路由器 DNS 劫持

攻击者入侵路由器，修改路由器的 DNS 设置。

```javascript
// 正常的路由器 DNS 配置
DNS服务器1: 8.8.8.8 (Google DNS)
DNS服务器2: 1.1.1.1 (Cloudflare DNS)

// ❌ 被劫持后的配置
DNS服务器1: 123.45.67.89 (攻击者的恶意DNS服务器)
DNS服务器2: 123.45.67.90
```

### 3. ISP DNS 劫持

运营商（ISP）在 DNS 服务器层面进行劫持，通常用于插入广告。

```javascript
// 用户查询不存在的域名
// 正常情况：返回 NXDOMAIN（域名不存在）
// ISP 劫持：返回运营商的广告页面 IP

// 示例：访问 nonexistent-site-12345.com
// ✅ 正常：浏览器显示"找不到该网站"
// ❌ 劫持：跳转到运营商的广告导航页
```

### 4. 中间人 DNS 劫持

攻击者在网络传输过程中拦截并篡改 DNS 请求和响应。

```javascript
// DNS 查询流程
用户 -> DNS请求 -> 攻击者（中间人）-> DNS服务器
                    ↓ 篡改响应
用户 <- 恶意IP <- 攻击者（中间人）<- 正确IP

// 攻击者可以在公共 WiFi 等不安全网络中实施
```

---

## 问题 3：DNS 劫持和 DNS 污染有什么区别？

### DNS 劫持（DNS Hijacking）

- **定义**：主动修改 DNS 解析结果
- **发起者**：攻击者、运营商、恶意软件
- **目的**：引导用户到特定网站（钓鱼、广告等）
- **影响范围**：可能只影响特定用户或网络

```javascript
// DNS 劫持示例
// 攻击者修改路由器配置
用户查询: www.bank.com
正常返回: 93.184.216.34
劫持返回: 123.45.67.89 (钓鱼网站)
```

### DNS 污染（DNS Poisoning/DNS Cache Poisoning）

- **定义**：向 DNS 缓存中注入错误的解析记录
- **发起者**：通常是网络审查或攻击者
- **目的**：阻止用户访问特定网站
- **影响范围**：可能影响大范围用户

```javascript
// DNS 污染示例
// 污染 DNS 缓存服务器
用户查询: www.blocked-site.com
正常返回: 1.2.3.4
污染返回: 127.0.0.1 或 0.0.0.0 (无法访问)
```

### 主要区别

| 特性 | DNS 劫持 | DNS 污染 |
|------|---------|---------|
| 目标 | 引导到恶意网站 | 阻止访问 |
| 返回结果 | 错误但可访问的 IP | 无效 IP 或错误 IP |
| 持续性 | 配置被修改前一直存在 | 缓存过期前存在 |
| 影响范围 | 通常较小 | 可能很大 |

---

## 问题 4：如何防止 DNS 劫持？

### 1. 使用 HTTPS

HTTPS 可以验证服务器身份，即使 DNS 被劫持，也能发现问题。

```javascript
// 即使 DNS 被劫持，HTTPS 也能保护用户
// 1. DNS 被劫持，返回恶意 IP
// 2. 浏览器尝试建立 HTTPS 连接
// 3. 恶意服务器无法提供有效的 SSL 证书
// 4. ❌ 浏览器显示证书错误，阻止访问

// 在代码中强制使用 HTTPS
if (window.location.protocol !== 'https:') {
  window.location.href = 'https://' + window.location.host + window.location.pathname;
}
```

### 2. 使用可信的 DNS 服务器

```bash
# 推荐的公共 DNS 服务器

# Google DNS
8.8.8.8
8.8.4.4

# Cloudflare DNS
1.1.1.1
1.0.0.1

# 阿里 DNS
223.5.5.5
223.6.6.6
```

```javascript
// 在应用中使用 DNS over HTTPS (DoH)
// 浏览器支持配置 DoH
// Chrome: 设置 -> 隐私和安全 -> 安全 -> 使用安全 DNS

// Node.js 中使用 DoH
const https = require('https');

function dohQuery(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cloudflare-dns.com',
      path: `/dns-query?name=${domain}&type=A`,
      headers: {
        'Accept': 'application/dns-json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        resolve(result.Answer[0].data); // 返回 IP 地址
      });
    }).on('error', reject);
  });
}
```

### 3. 使用 DNSSEC

DNSSEC（DNS Security Extensions）通过数字签名验证 DNS 响应的真实性。

```javascript
// DNSSEC 工作原理
// 1. DNS 服务器对解析记录进行数字签名
// 2. 客户端验证签名的有效性
// 3. 如果签名无效，拒绝使用该解析结果

// 检查域名是否支持 DNSSEC（命令行）
// dig +dnssec example.com
```

### 4. 定期检查本地配置

```bash
# macOS/Linux 检查 hosts 文件
cat /etc/hosts

# Windows 检查 hosts 文件
# C:\Windows\System32\drivers\etc\hosts

# 检查 DNS 配置
# macOS
scutil --dns

# Linux
cat /etc/resolv.conf

# Windows
ipconfig /all
```

### 5. 使用 VPN

VPN 可以加密 DNS 查询，防止中间人劫持。

```javascript
// VPN 保护 DNS 的原理
// 1. DNS 查询通过加密隧道发送
// 2. 中间人无法看到或篡改 DNS 请求
// 3. DNS 响应也通过加密隧道返回
```

### 6. 前端检测 DNS 劫持

```javascript
// 检测当前访问的 IP 是否正确
async function detectDNSHijacking() {
  try {
    // 1. 获取当前连接的服务器 IP
    const response = await fetch('/api/get-server-ip');
    const { serverIp } = await response.json();
    
    // 2. 与预期的 IP 列表对比
    const expectedIPs = ['93.184.216.34', '93.184.216.35'];
    
    if (!expectedIPs.includes(serverIp)) {
      console.warn('⚠️ 可能遭受 DNS 劫持！');
      // 提示用户或采取保护措施
      showWarning('检测到异常网络环境，请注意安全！');
    }
  } catch (error) {
    console.error('检测失败:', error);
  }
}

// 检查 SSL 证书
function checkSSLCertificate() {
  if (window.location.protocol !== 'https:') {
    console.warn('⚠️ 当前连接不安全，未使用 HTTPS');
    return false;
  }
  return true;
}

// 页面加载时执行检测
window.addEventListener('load', () => {
  checkSSLCertificate();
  detectDNSHijacking();
});
```

---

## 总结

**核心概念总结**：

### 1. DNS 劫持的本质

- 篡改 DNS 解析结果，将用户引导到恶意网站
- 可能发生在本地、路由器、ISP 或网络传输过程中
- 主要目的是钓鱼、插入广告或窃取信息

### 2. DNS 劫持的类型

- **本地劫持**：修改 hosts 文件或本地 DNS 配置
- **路由器劫持**：入侵路由器修改 DNS 设置
- **ISP 劫持**：运营商层面的劫持
- **中间人劫持**：拦截网络传输中的 DNS 请求

### 3. DNS 劫持 vs DNS 污染

- DNS 劫持：引导到恶意网站
- DNS 污染：阻止访问特定网站
- 两者都会篡改 DNS 解析结果

### 4. 防护措施

- **使用 HTTPS**：验证服务器身份
- **可信 DNS**：使用 Google、Cloudflare 等公共 DNS
- **DNS over HTTPS**：加密 DNS 查询
- **DNSSEC**：验证 DNS 响应真实性
- **VPN**：加密所有网络流量
- **定期检查**：检查本地配置是否被篡改

## 延伸阅读

- [MDN - DNS 介绍](https://developer.mozilla.org/zh-CN/docs/Glossary/DNS)
- [Cloudflare - 什么是 DNS 劫持](https://www.cloudflare.com/zh-cn/learning/dns/dns-security/)
- [Google - DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh)
- [DNSSEC 官方文档](https://www.dnssec.net/)
- [ICANN - DNS 安全](https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-zh)
