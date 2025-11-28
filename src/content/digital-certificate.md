---
title: 数字证书了解多少
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解数字证书的结构、作用和验证过程，掌握 HTTPS 安全通信的核心机制
tags:
  - 数字证书
  - SSL/TLS
  - HTTPS
  - 安全
estimatedTime: 25 分钟
keywords:
  - 数字证书
  - SSL证书
  - CA
  - 证书链
highlight: 数字证书是 HTTPS 安全的基石，通过 CA 签名验证服务器身份，建立加密通信
order: 14
---

## 问题 1：什么是数字证书？

数字证书（Digital Certificate）是由权威的证书颁发机构（CA）签发的电子文档，用于证明公钥持有者的身份，是 HTTPS 安全通信的核心组件。

### 数字证书的作用

```javascript
// 数字证书解决的问题

// 问题 1：如何确认服务器身份？
// 用户访问 https://bank.com
// 如何确认这真的是银行的服务器，而不是钓鱼网站？

// 解决：数字证书
// 1. 银行向 CA 申请证书
// 2. CA 验证银行身份后签发证书
// 3. 用户访问时，浏览器验证证书
// 4. 确认是真实的银行网站

// 问题 2：如何安全地交换密钥？
// 客户端和服务器需要协商加密密钥
// 如何防止中间人窃取密钥？

// 解决：公钥加密
// 1. 证书包含服务器的公钥
// 2. 客户端用公钥加密密钥
// 3. 只有服务器的私钥能解密
// 4. 中间人无法获取密钥
```

### 数字证书的内容

```javascript
// 数字证书包含的信息

{
  // 1. 证书版本
  "version": "v3",
  
  // 2. 序列号（唯一标识）
  "serialNumber": "12:34:56:78:90:ab:cd:ef",
  
  // 3. 签名算法
  "signatureAlgorithm": "SHA256-RSA",
  
  // 4. 颁发者（CA）
  "issuer": {
    "country": "US",
    "organization": "DigiCert Inc",
    "commonName": "DigiCert SHA2 Secure Server CA"
  },
  
  // 5. 有效期
  "validity": {
    "notBefore": "2024-01-01 00:00:00",
    "notAfter": "2025-01-01 23:59:59"
  },
  
  // 6. 主体（证书持有者）
  "subject": {
    "country": "US",
    "state": "California",
    "locality": "San Francisco",
    "organization": "Example Inc",
    "commonName": "www.example.com"  // 域名
  },
  
  // 7. 公钥信息
  "subjectPublicKeyInfo": {
    "algorithm": "RSA",
    "publicKey": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
  },
  
  // 8. 扩展信息
  "extensions": {
    // 主题备用名称（支持多个域名）
    "subjectAltName": [
      "www.example.com",
      "example.com",
      "*.example.com"  // 通配符证书
    ],
    // 密钥用途
    "keyUsage": ["digitalSignature", "keyEncipherment"],
    // 扩展密钥用途
    "extendedKeyUsage": ["serverAuth", "clientAuth"]
  },
  
  // 9. CA 的数字签名
  "signature": "3c:4d:5e:6f:7a:8b:9c:0d:1e:2f:3a:4b:5c:6d:7e:8f..."
}
```

---

## 问题 2：数字证书是如何工作的？

### 证书签发过程

```javascript
// 1. 服务器生成密钥对
// 服务器端操作
const { publicKey, privateKey } = generateKeyPair();

// 公钥：用于加密，可以公开
// 私钥：用于解密，必须保密

// 2. 创建证书签名请求（CSR）
const csr = createCSR({
  commonName: "www.example.com",
  organization: "Example Inc",
  country: "US",
  publicKey: publicKey
});

// CSR 包含：
// - 域名信息
// - 组织信息
// - 公钥
// - 签名（用私钥签名，证明拥有私钥）

// 3. 提交 CSR 给 CA
// 向 DigiCert、Let's Encrypt 等 CA 提交 CSR

// 4. CA 验证身份
// - 域名验证（DV）：验证域名所有权
// - 组织验证（OV）：验证组织真实性
// - 扩展验证（EV）：严格验证组织和法律实体

// 5. CA 签发证书
// CA 使用自己的私钥对证书签名
const certificate = ca.sign(csr, ca.privateKey);

// 6. 服务器安装证书
// 将证书和私钥配置到服务器
```

### 证书验证过程

```javascript
// 浏览器验证证书的步骤

// 1. 检查证书有效期
function checkValidity(cert) {
  const now = new Date();
  const notBefore = new Date(cert.validity.notBefore);
  const notAfter = new Date(cert.validity.notAfter);
  
  if (now < notBefore) {
    throw new Error('证书尚未生效');
  }
  
  if (now > notAfter) {
    throw new Error('证书已过期');
  }
  
  return true;
}

// 2. 检查域名匹配
function checkDomain(cert, hostname) {
  const certDomain = cert.subject.commonName;
  const altNames = cert.extensions.subjectAltName || [];
  
  // 精确匹配
  if (certDomain === hostname) {
    return true;
  }
  
  // 检查备用名称
  if (altNames.includes(hostname)) {
    return true;
  }
  
  // 通配符匹配
  // *.example.com 匹配 www.example.com
  const wildcardMatch = altNames.some(name => {
    if (name.startsWith('*.')) {
      const domain = name.substring(2);
      return hostname.endsWith(domain);
    }
    return false;
  });
  
  if (wildcardMatch) {
    return true;
  }
  
  throw new Error('域名不匹配');
}

// 3. 验证证书链
function verifyCertChain(certChain) {
  // 证书链：服务器证书 -> 中间证书 -> 根证书
  
  for (let i = 0; i < certChain.length - 1; i++) {
    const cert = certChain[i];
    const issuerCert = certChain[i + 1];
    
    // 使用上级证书的公钥验证当前证书的签名
    const isValid = verifySignature(
      cert.signature,
      cert.data,
      issuerCert.publicKey
    );
    
    if (!isValid) {
      throw new Error('证书签名验证失败');
    }
  }
  
  // 验证根证书是否在浏览器信任列表中
  const rootCert = certChain[certChain.length - 1];
  if (!isTrustedRoot(rootCert)) {
    throw new Error('根证书不受信任');
  }
  
  return true;
}

// 4. 检查证书吊销状态
async function checkRevocation(cert) {
  // 方法 1：CRL (Certificate Revocation List)
  const crl = await fetchCRL(cert.crlURL);
  if (crl.includes(cert.serialNumber)) {
    throw new Error('证书已被吊销');
  }
  
  // 方法 2：OCSP (Online Certificate Status Protocol)
  const ocspResponse = await checkOCSP(cert);
  if (ocspResponse.status === 'revoked') {
    throw new Error('证书已被吊销');
  }
  
  return true;
}
```

---

## 问题 3：证书链和信任链是什么？

### 证书链结构

```javascript
// 三级证书链

// 根证书（Root Certificate）
// - 自签名（自己给自己签名）
// - 预装在浏览器/操作系统中
// - 有效期很长（20-30年）
{
  issuer: "DigiCert Global Root CA",
  subject: "DigiCert Global Root CA",  // issuer = subject
  publicKey: "根证书公钥",
  signature: "用根证书私钥签名"
}

// ↓ 签名

// 中间证书（Intermediate Certificate）
// - 由根证书签名
// - 用于签发服务器证书
// - 有效期较长（5-10年）
{
  issuer: "DigiCert Global Root CA",
  subject: "DigiCert SHA2 Secure Server CA",
  publicKey: "中间证书公钥",
  signature: "用根证书私钥签名"
}

// ↓ 签名

// 服务器证书（Server Certificate）
// - 由中间证书签名
// - 用于网站 HTTPS
// - 有效期较短（1-2年）
{
  issuer: "DigiCert SHA2 Secure Server CA",
  subject: "www.example.com",
  publicKey: "服务器公钥",
  signature: "用中间证书私钥签名"
}
```

### 信任链验证

```javascript
// 浏览器验证证书链的过程

// 1. 服务器发送证书链
服务器 -> 浏览器: [
  服务器证书,
  中间证书,
  // 通常不包含根证书（浏览器已有）
]

// 2. 浏览器验证
// 步骤 1：验证服务器证书
const serverCert = certChain[0];
const intermediateCert = certChain[1];

// 使用中间证书的公钥验证服务器证书的签名
const isServerCertValid = verifySignature(
  serverCert.signature,
  serverCert.data,
  intermediateCert.publicKey
);

// 步骤 2：验证中间证书
const rootCert = findRootCert(intermediateCert.issuer);

// 使用根证书的公钥验证中间证书的签名
const isIntermediateCertValid = verifySignature(
  intermediateCert.signature,
  intermediateCert.data,
  rootCert.publicKey
);

// 步骤 3：验证根证书是否可信
const isTrusted = trustedRootCerts.includes(rootCert);

// 所有验证通过，证书链有效
if (isServerCertValid && isIntermediateCertValid && isTrusted) {
  console.log('✅ 证书链验证通过');
}
```

### 为什么需要中间证书？

```javascript
// 1. 安全性
// 根证书的私钥非常重要，需要离线保存
// 如果根证书私钥泄露，所有信任该根证书的系统都会受影响

// 使用中间证书：
// - 根证书私钥离线保存，只用于签发中间证书
// - 中间证书私钥在线使用，用于签发服务器证书
// - 如果中间证书私钥泄露，只需吊销中间证书

// 2. 灵活性
// 可以为不同用途创建不同的中间证书
// 例如：
// - 用于网站的中间证书
// - 用于代码签名的中间证书
// - 用于邮件加密的中间证书

// 3. 负载分担
// 多个中间证书可以分担签发任务
```

---

## 问题 4：常见的证书类型和应用

### 证书类型

```javascript
// 1. DV 证书（Domain Validation）
// - 只验证域名所有权
// - 签发速度快（几分钟）
// - 价格便宜或免费（Let's Encrypt）
// - 适合个人网站、博客

// 申请方式：
// - 在域名 DNS 添加 TXT 记录
// - 或在网站根目录放置验证文件

// 2. OV 证书（Organization Validation）
// - 验证域名和组织信息
// - 签发需要 1-3 天
// - 价格中等
// - 适合企业网站

// 申请方式：
// - 提供营业执照
// - 验证组织真实性

// 3. EV 证书（Extended Validation）
// - 严格验证组织和法律实体
// - 签发需要 1-2 周
// - 价格较高
// - 浏览器地址栏显示组织名称（绿色）
// - 适合银行、电商等高安全要求网站

// 申请方式：
// - 提供详细的法律文件
// - 电话验证
// - 律师意见书
```

### 特殊类型证书

```javascript
// 1. 通配符证书（Wildcard Certificate）
// 支持一个域名及其所有子域

{
  commonName: "*.example.com",
  subjectAltName: ["*.example.com", "example.com"]
}

// 可以用于：
// - www.example.com
// - api.example.com
// - admin.example.com
// - 任何 *.example.com

// 2. 多域名证书（Multi-Domain Certificate / SAN Certificate）
// 一个证书支持多个不同的域名

{
  commonName: "example.com",
  subjectAltName: [
    "example.com",
    "www.example.com",
    "example.net",
    "example.org"
  ]
}

// 3. 自签名证书（Self-Signed Certificate）
// 自己给自己签名，不经过 CA

// 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

// ⚠️ 浏览器会显示警告
// 只适合开发环境或内部网络
```

### 免费证书：Let's Encrypt

```bash
# 使用 Certbot 自动申请和续期证书

# 1. 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. 申请证书
sudo certbot --nginx -d example.com -d www.example.com

# 3. 自动续期（证书有效期 90 天）
sudo certbot renew --dry-run

# 4. 设置自动续期任务
sudo crontab -e
# 添加：每天检查一次
0 0 * * * certbot renew --quiet
```

```javascript
// Node.js 中使用 Let's Encrypt
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/example.com/fullchain.pem')
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('Hello HTTPS!');
}).listen(443);
```

---

## 问题 5：如何查看和调试证书？

### 浏览器中查看证书

```javascript
// Chrome / Edge
// 1. 点击地址栏的锁图标
// 2. 点击"证书"或"连接是安全的"
// 3. 查看证书详细信息

// 可以看到：
// - 颁发给：www.example.com
// - 颁发者：DigiCert Inc
// - 有效期：2024-01-01 至 2025-01-01
// - 公钥：RSA 2048 位
// - 签名算法：SHA256-RSA
// - 证书链
```

### 命令行查看证书

```bash
# 使用 OpenSSL 查看证书

# 1. 查看远程服务器证书
openssl s_client -connect example.com:443 -showcerts

# 2. 查看证书文件
openssl x509 -in cert.pem -text -noout

# 3. 验证证书
openssl verify -CAfile ca.pem cert.pem

# 4. 检查证书和私钥是否匹配
openssl x509 -noout -modulus -in cert.pem | openssl md5
openssl rsa -noout -modulus -in key.pem | openssl md5
# 两个 MD5 值应该相同

# 5. 查看证书过期时间
openssl x509 -in cert.pem -noout -enddate
```

### Node.js 中获取证书信息

```javascript
const https = require('https');
const tls = require('tls');

// 获取网站证书
https.get('https://www.example.com', (res) => {
  const cert = res.socket.getPeerCertificate();
  
  console.log('证书信息:');
  console.log('主体:', cert.subject);
  console.log('颁发者:', cert.issuer);
  console.log('有效期:', cert.valid_from, '-', cert.valid_to);
  console.log('序列号:', cert.serialNumber);
  console.log('指纹:', cert.fingerprint);
  console.log('备用名称:', cert.subjectaltname);
});

// 验证证书
const options = {
  host: 'www.example.com',
  port: 443,
  checkServerIdentity: (host, cert) => {
    // 自定义验证逻辑
    console.log('验证证书:', cert.subject.CN);
    return undefined;  // 返回 undefined 表示验证通过
  }
};

const socket = tls.connect(options, () => {
  console.log('连接已建立');
  console.log('授权:', socket.authorized);
  console.log('授权错误:', socket.authorizationError);
});
```

---

## 总结

**核心概念总结**：

### 1. 数字证书的作用

- 验证服务器身份
- 提供公钥用于加密
- 建立安全的 HTTPS 连接

### 2. 证书内容

- 域名信息
- 组织信息
- 公钥
- 有效期
- CA 签名

### 3. 证书链

- **根证书**：自签名，预装在系统中
- **中间证书**：由根证书签名
- **服务器证书**：由中间证书签名

### 4. 证书类型

- **DV**：域名验证，快速便宜
- **OV**：组织验证，适合企业
- **EV**：扩展验证，最高安全级别
- **通配符**：支持所有子域
- **多域名**：支持多个域名

## 延伸阅读

- [MDN - Digital Certificate](https://developer.mozilla.org/en-US/docs/Glossary/Digital_certificate)
- [Let's Encrypt 官网](https://letsencrypt.org/)
- [RFC 5280 - X.509 证书规范](https://tools.ietf.org/html/rfc5280)
- [SSL Labs - SSL Test](https://www.ssllabs.com/ssltest/)
- [Certificate Transparency](https://certificate.transparency.dev/)
