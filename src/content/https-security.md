---
title: https 如何保证安全的
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 HTTPS 的加密原理、证书验证机制和安全保障，掌握 HTTPS 如何保护数据传输安全
tags:
  - HTTPS
  - 加密
  - SSL/TLS
  - 安全
estimatedTime: 28 分钟
keywords:
  - HTTPS
  - SSL
  - TLS
  - 加密
  - 数字证书
highlight: HTTPS 通过加密、身份验证和数据完整性校验三重保障确保通信安全
order: 32
---

## 问题 1：HTTPS 是什么？

HTTPS（HyperText Transfer Protocol Secure）是 HTTP 的安全版本，通过 SSL/TLS 协议对数据进行加密传输。

### HTTP vs HTTPS

```javascript
// HTTP 的问题
// 1. 数据明文传输
用户 -> "username=admin&password=123456" -> 服务器
     ↑ 中间人可以看到所有内容

// 2. 无法验证服务器身份
用户 -> 请求 -> ??? -> 响应
     可能是真实服务器，也可能是钓鱼网站

// 3. 数据可能被篡改
用户 -> 请求 -> 中间人修改 -> 服务器
     用户收到的响应可能已被篡改
```

```javascript
// HTTPS 的保护
// 1. 数据加密传输
用户 -> "加密的乱码" -> 服务器
     ↑ 中间人无法解密

// 2. 验证服务器身份
用户 -> 验证证书 -> 确认是真实服务器

// 3. 数据完整性校验
用户 -> 请求 -> 服务器
     任何篡改都会被检测到
```

### HTTPS 的三大安全保障

```javascript
// 1. 加密性（Encryption）
// - 使用对称加密传输数据
// - 使用非对称加密交换密钥
// - 防止数据被窃听

// 2. 身份验证（Authentication）
// - 通过数字证书验证服务器身份
// - 防止中间人攻击和钓鱼网站

// 3. 完整性（Integrity）
// - 使用消息摘要算法（如 SHA-256）
// - 确保数据未被篡改
```

---

## 问题 2：HTTPS 的加密原理是什么？

HTTPS 结合了对称加密和非对称加密两种方式。

### 对称加密

使用相同的密钥进行加密和解密，速度快但密钥分发困难。

```javascript
// 对称加密示例（AES）
const crypto = require('crypto');

// 加密
function encrypt(text, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 解密
function decrypt(encrypted, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 使用相同的密钥
const key = 'my-secret-key';
const encrypted = encrypt('Hello World', key); // "加密后的内容"
const decrypted = decrypt(encrypted, key); // "Hello World"

// ⚠️ 问题：如何安全地将密钥传递给对方？
```

### 非对称加密

使用公钥加密、私钥解密，安全但速度慢。

```javascript
// 非对称加密示例（RSA）
const crypto = require('crypto');

// 生成密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// 使用公钥加密
function encryptWithPublicKey(text, publicKey) {
  return crypto.publicEncrypt(publicKey, Buffer.from(text)).toString('base64');
}

// 使用私钥解密
function decryptWithPrivateKey(encrypted, privateKey) {
  return crypto.privateDecrypt(privateKey, Buffer.from(encrypted, 'base64')).toString();
}

// 加密和解密
const encrypted = encryptWithPublicKey('Hello World', publicKey);
const decrypted = decryptWithPrivateKey(encrypted, privateKey); // "Hello World"

// ✅ 优势：公钥可以公开，只有私钥持有者能解密
// ❌ 劣势：加密速度慢，不适合大量数据
```

### HTTPS 的混合加密

```javascript
// HTTPS 结合两种加密方式的优势

// 1. 握手阶段（使用非对称加密）
客户端 -> 生成随机数（预主密钥）
       -> 使用服务器公钥加密
       -> 发送给服务器
服务器 -> 使用私钥解密
       -> 得到预主密钥

// 2. 双方使用预主密钥生成会话密钥（对称密钥）
客户端和服务器 -> 使用相同算法生成会话密钥

// 3. 数据传输阶段（使用对称加密）
客户端 <-> 使用会话密钥加密/解密数据 <-> 服务器

// ✅ 结合了两种加密的优势：
// - 非对称加密保证密钥交换安全
// - 对称加密保证数据传输效率
```

---

## 问题 3：HTTPS 握手过程是怎样的？

HTTPS 使用 TLS/SSL 协议进行握手，建立安全连接。

### TLS 握手流程（简化版）

```javascript
// 1. Client Hello - 客户端发起握手
客户端 -> 服务器
{
  "TLS版本": "TLS 1.3",
  "支持的加密套件": ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384"],
  "客户端随机数": "random_client_123",
  "支持的压缩方法": ["none"]
}

// 2. Server Hello - 服务器响应
服务器 -> 客户端
{
  "选择的TLS版本": "TLS 1.3",
  "选择的加密套件": "TLS_AES_256_GCM_SHA384",
  "服务器随机数": "random_server_456",
  "会话ID": "session_789"
}

// 3. Certificate - 服务器发送证书
服务器 -> 客户端
{
  "证书链": [
    "服务器证书",
    "中间证书",
    "根证书"
  ],
  "公钥": "server_public_key"
}

// 4. 客户端验证证书
客户端验证:
  ✅ 证书是否由可信CA签发
  ✅ 证书是否在有效期内
  ✅ 证书域名是否匹配
  ✅ 证书是否被吊销

// 5. Client Key Exchange - 客户端发送加密的预主密钥
客户端 -> 服务器
{
  "预主密钥": "使用服务器公钥加密的随机数"
}

// 6. 双方生成会话密钥
客户端和服务器使用:
  - 客户端随机数
  - 服务器随机数
  - 预主密钥
生成相同的会话密钥

// 7. Finished - 握手完成
客户端 -> 服务器: "Finished"（使用会话密钥加密）
服务器 -> 客户端: "Finished"（使用会话密钥加密）

// 8. 开始加密通信
客户端 <-> 服务器: 使用会话密钥加密所有数据
```

### 代码模拟握手过程

```javascript
// 简化的 TLS 握手模拟
class TLSHandshake {
  constructor() {
    this.clientRandom = this.generateRandom();
    this.serverRandom = null;
    this.preMasterSecret = null;
    this.masterSecret = null;
  }
  
  // 生成随机数
  generateRandom() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // 客户端：发送 Client Hello
  clientHello() {
    return {
      version: 'TLS 1.3',
      random: this.clientRandom,
      cipherSuites: ['TLS_AES_256_GCM_SHA384']
    };
  }
  
  // 服务器：响应 Server Hello
  serverHello() {
    this.serverRandom = this.generateRandom();
    return {
      version: 'TLS 1.3',
      random: this.serverRandom,
      cipherSuite: 'TLS_AES_256_GCM_SHA384'
    };
  }
  
  // 客户端：生成预主密钥并用服务器公钥加密
  generatePreMasterSecret(serverPublicKey) {
    this.preMasterSecret = this.generateRandom();
    // 使用服务器公钥加密
    return crypto.publicEncrypt(
      serverPublicKey,
      Buffer.from(this.preMasterSecret)
    );
  }
  
  // 双方：生成主密钥（会话密钥）
  generateMasterSecret() {
    const data = this.clientRandom + this.serverRandom + this.preMasterSecret;
    this.masterSecret = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
    return this.masterSecret;
  }
  
  // 使用会话密钥加密数据
  encrypt(data) {
    const cipher = crypto.createCipher('aes-256-gcm', this.masterSecret);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
```

---

## 问题 4：数字证书如何保证安全？

数字证书通过证书颁发机构（CA）的签名来验证服务器身份。

### 证书的内容

```javascript
// 数字证书包含的信息
{
  "版本": "v3",
  "序列号": "12:34:56:78:90",
  "签名算法": "SHA256-RSA",
  "颁发者": "DigiCert Inc",
  "有效期": {
    "开始": "2024-01-01",
    "结束": "2025-01-01"
  },
  "主体": {
    "国家": "US",
    "组织": "Example Inc",
    "域名": "www.example.com"
  },
  "公钥": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "CA签名": "数字签名（使用CA私钥签名）"
}
```

### 证书验证过程

```javascript
// 浏览器验证证书的步骤

// 1. 检查证书有效期
function checkValidity(cert) {
  const now = new Date();
  const notBefore = new Date(cert.validFrom);
  const notAfter = new Date(cert.validTo);
  
  if (now < notBefore || now > notAfter) {
    throw new Error('证书已过期或尚未生效');
  }
}

// 2. 检查域名匹配
function checkDomain(cert, hostname) {
  const certDomain = cert.subject.CN; // Common Name
  const altNames = cert.subjectAltName; // Subject Alternative Names
  
  if (certDomain !== hostname && !altNames.includes(hostname)) {
    throw new Error('证书域名不匹配');
  }
}

// 3. 验证证书链
function verifyCertChain(certChain) {
  // 从服务器证书开始，逐级验证到根证书
  for (let i = 0; i < certChain.length - 1; i++) {
    const cert = certChain[i];
    const issuerCert = certChain[i + 1];
    
    // 使用上级证书的公钥验证当前证书的签名
    if (!verifySignature(cert, issuerCert.publicKey)) {
      throw new Error('证书签名验证失败');
    }
  }
  
  // 验证根证书是否在浏览器信任列表中
  const rootCert = certChain[certChain.length - 1];
  if (!isTrustedRoot(rootCert)) {
    throw new Error('根证书不受信任');
  }
}

// 4. 检查证书是否被吊销
async function checkRevocation(cert) {
  // 方法1: 检查 CRL (Certificate Revocation List)
  const crl = await fetchCRL(cert.crlURL);
  if (crl.includes(cert.serialNumber)) {
    throw new Error('证书已被吊销');
  }
  
  // 方法2: 使用 OCSP (Online Certificate Status Protocol)
  const status = await checkOCSP(cert);
  if (status === 'revoked') {
    throw new Error('证书已被吊销');
  }
}
```

### 证书信任链

```javascript
// 证书信任链示例
根证书（Root CA）
  ↓ 签名
中间证书（Intermediate CA）
  ↓ 签名
服务器证书（Server Certificate）

// 验证过程：
// 1. 浏览器收到服务器证书
// 2. 使用中间证书的公钥验证服务器证书的签名 ✅
// 3. 使用根证书的公钥验证中间证书的签名 ✅
// 4. 检查根证书是否在浏览器的信任列表中 ✅
// 5. 所有验证通过，信任该服务器证书
```

### 前端查看证书信息

```javascript
// 在浏览器中查看证书
// 1. 点击地址栏的锁图标
// 2. 点击"证书"或"连接是安全的"
// 3. 查看证书详细信息

// 通过代码获取证书信息（Node.js）
const https = require('https');

https.get('https://www.example.com', (res) => {
  const cert = res.socket.getPeerCertificate();
  
  console.log('证书信息:');
  console.log('主体:', cert.subject);
  console.log('颁发者:', cert.issuer);
  console.log('有效期:', cert.valid_from, '-', cert.valid_to);
  console.log('指纹:', cert.fingerprint);
});
```

---

## 总结

**核心概念总结**：

### 1. HTTPS 的三大安全保障

- **加密性**：防止数据被窃听
- **身份验证**：防止钓鱼网站和中间人攻击
- **完整性**：防止数据被篡改

### 2. 加密机制

- **对称加密**：速度快，用于数据传输（AES）
- **非对称加密**：安全，用于密钥交换（RSA）
- **混合加密**：结合两者优势

### 3. TLS 握手过程

1. Client Hello：客户端发起握手
2. Server Hello：服务器响应并发送证书
3. 证书验证：客户端验证服务器身份
4. 密钥交换：使用非对称加密交换预主密钥
5. 生成会话密钥：双方生成相同的对称密钥
6. 加密通信：使用会话密钥加密所有数据

### 4. 数字证书

- 由可信的 CA 机构签发
- 包含服务器公钥和身份信息
- 通过证书链验证真实性
- 需要检查有效期、域名匹配和吊销状态

## 延伸阅读

- [MDN - HTTPS](https://developer.mozilla.org/zh-CN/docs/Glossary/HTTPS)
- [MDN - Transport Layer Security](https://developer.mozilla.org/zh-CN/docs/Web/Security/Transport_Layer_Security)
- [阮一峰 - SSL/TLS 协议运行机制的概述](https://www.ruanyifeng.com/blog/2014/02/ssl_tls.html)
- [阮一峰 - 图解 SSL/TLS 协议](https://www.ruanyifeng.com/blog/2014/09/illustration-ssl.html)
- [Cloudflare - What is SSL/TLS](https://www.cloudflare.com/zh-cn/learning/ssl/what-is-ssl/)
