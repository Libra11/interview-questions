---
title: https 的证书验证过程是什么样的
category: 网络
difficulty: 中级
updatedAt: 2025-11-28
summary: >-
  深入理解 HTTPS 证书验证的完整流程，掌握证书链验证、吊销检查和安全机制
tags:
  - HTTPS
  - 证书验证
  - SSL/TLS
  - 安全
estimatedTime: 25 分钟
keywords:
  - 证书验证
  - 证书链
  - OCSP
  - CRL
highlight: 证书验证是 HTTPS 安全的关键环节，通过多重检查确保服务器身份的真实性
order: 116
---

## 问题 1：证书验证的目的是什么？

证书验证是 HTTPS 连接建立过程中的关键步骤，用于确认服务器的身份，防止中间人攻击和钓鱼网站。

### 为什么需要验证证书？

```javascript
// ❌ 没有证书验证的风险

// 场景：用户访问 https://bank.com
用户 -> 中间人（伪装成 bank.com）-> 真实的 bank.com

// 中间人攻击：
// 1. 中间人拦截用户请求
// 2. 中间人向用户发送自己的证书
// 3. 用户不验证证书，建立连接
// 4. 中间人可以窃取用户数据（密码、银行信息等）

// ✅ 有证书验证的保护

用户 -> 验证证书 -> 发现证书不是 bank.com 的
     -> 浏览器显示警告
     -> 阻止连接

// 证书验证确保：
// 1. 服务器身份真实
// 2. 证书由可信 CA 签发
// 3. 证书未过期
// 4. 证书未被吊销
```

---

## 问题 2：证书验证的完整流程

### 验证步骤

```javascript
// HTTPS 证书验证的完整流程

// 1. 服务器发送证书
// TLS 握手过程中，服务器发送证书链
服务器 -> 客户端: [
  服务器证书,
  中间证书,
  // 通常不包含根证书（客户端已有）
]

// 2. 验证证书链
function verifyCertificateChain(certChain) {
  // 从服务器证书开始，逐级验证到根证书
  
  for (let i = 0; i < certChain.length - 1; i++) {
    const cert = certChain[i];
    const issuerCert = certChain[i + 1];
    
    // 2.1 验证签名
    const isSignatureValid = verifySignature(
      cert.signature,
      cert.data,
      issuerCert.publicKey
    );
    
    if (!isSignatureValid) {
      throw new Error('证书签名验证失败');
    }
    
    // 2.2 验证颁发者
    if (cert.issuer !== issuerCert.subject) {
      throw new Error('证书链断裂');
    }
  }
  
  // 2.3 验证根证书
  const rootCert = certChain[certChain.length - 1];
  if (!isTrustedRootCert(rootCert)) {
    throw new Error('根证书不受信任');
  }
  
  return true;
}

// 3. 验证证书有效期
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

// 4. 验证域名匹配
function checkDomain(cert, hostname) {
  const certDomain = cert.subject.commonName;
  const altNames = cert.extensions.subjectAltName || [];
  
  // 4.1 精确匹配
  if (certDomain === hostname) {
    return true;
  }
  
  // 4.2 检查备用名称
  if (altNames.includes(hostname)) {
    return true;
  }
  
  // 4.3 通配符匹配
  // *.example.com 匹配 www.example.com
  const wildcardMatch = altNames.some(name => {
    if (name.startsWith('*.')) {
      const domain = name.substring(2);
      return hostname.endsWith(domain) && 
             hostname.split('.').length === domain.split('.').length + 1;
    }
    return false;
  });
  
  if (wildcardMatch) {
    return true;
  }
  
  throw new Error('域名不匹配');
}

// 5. 检查证书吊销状态
async function checkRevocation(cert) {
  // 方法 1: CRL (Certificate Revocation List)
  if (cert.crlURL) {
    const crl = await fetchCRL(cert.crlURL);
    if (crl.revokedCertificates.includes(cert.serialNumber)) {
      throw new Error('证书已被吊销（CRL）');
    }
  }
  
  // 方法 2: OCSP (Online Certificate Status Protocol)
  if (cert.ocspURL) {
    const ocspResponse = await checkOCSP(cert);
    if (ocspResponse.status === 'revoked') {
      throw new Error('证书已被吊销（OCSP）');
    }
  }
  
  return true;
}

// 6. 验证证书用途
function checkKeyUsage(cert) {
  const keyUsage = cert.extensions.keyUsage;
  const extKeyUsage = cert.extensions.extendedKeyUsage;
  
  // 检查是否允许用于服务器认证
  if (!extKeyUsage.includes('serverAuth')) {
    throw new Error('证书不允许用于服务器认证');
  }
  
  // 检查密钥用途
  if (!keyUsage.includes('digitalSignature') || 
      !keyUsage.includes('keyEncipherment')) {
    throw new Error('证书密钥用途不正确');
  }
  
  return true;
}
```

### 完整验证流程

```javascript
// 浏览器验证证书的完整过程

async function validateCertificate(certChain, hostname) {
  try {
    const serverCert = certChain[0];
    
    // 步骤 1: 验证证书链
    console.log('1. 验证证书链...');
    verifyCertificateChain(certChain);
    
    // 步骤 2: 验证有效期
    console.log('2. 验证有效期...');
    checkValidity(serverCert);
    
    // 步骤 3: 验证域名
    console.log('3. 验证域名...');
    checkDomain(serverCert, hostname);
    
    // 步骤 4: 检查吊销状态
    console.log('4. 检查吊销状态...');
    await checkRevocation(serverCert);
    
    // 步骤 5: 验证证书用途
    console.log('5. 验证证书用途...');
    checkKeyUsage(serverCert);
    
    console.log('✅ 证书验证通过');
    return true;
  } catch (error) {
    console.error('❌ 证书验证失败:', error.message);
    // 浏览器显示警告页面
    showSecurityWarning(error);
    return false;
  }
}
```

---

## 问题 3：证书吊销检查机制

### CRL（证书吊销列表）

```javascript
// CRL 是一个包含所有被吊销证书序列号的列表

// CRL 结构
{
  "issuer": "DigiCert SHA2 Secure Server CA",
  "thisUpdate": "2024-11-28T00:00:00Z",
  "nextUpdate": "2024-12-05T00:00:00Z",
  "revokedCertificates": [
    {
      "serialNumber": "12:34:56:78:90:ab",
      "revocationDate": "2024-11-20T10:30:00Z",
      "reason": "keyCompromise"  // 吊销原因
    },
    {
      "serialNumber": "ab:cd:ef:12:34:56",
      "revocationDate": "2024-11-25T15:45:00Z",
      "reason": "superseded"
    }
  ]
}

// 检查 CRL
async function checkCRL(cert) {
  // 1. 从证书中获取 CRL URL
  const crlURL = cert.extensions.crlDistributionPoints[0];
  
  // 2. 下载 CRL
  const response = await fetch(crlURL);
  const crlData = await response.arrayBuffer();
  const crl = parseCRL(crlData);
  
  // 3. 检查证书序列号是否在列表中
  const isRevoked = crl.revokedCertificates.some(
    revoked => revoked.serialNumber === cert.serialNumber
  );
  
  if (isRevoked) {
    throw new Error('证书已被吊销');
  }
  
  return true;
}

// ❌ CRL 的问题：
// - CRL 文件可能很大（包含所有吊销的证书）
// - 下载耗时
// - 更新不及时（通常每周更新一次）
```

### OCSP（在线证书状态协议）

```javascript
// OCSP 实时查询单个证书的状态

// OCSP 请求
{
  "certID": {
    "hashAlgorithm": "SHA1",
    "issuerNameHash": "abc123...",
    "issuerKeyHash": "def456...",
    "serialNumber": "12:34:56:78:90:ab"
  }
}

// OCSP 响应
{
  "certStatus": "good",  // good | revoked | unknown
  "thisUpdate": "2024-11-28T10:00:00Z",
  "nextUpdate": "2024-11-28T11:00:00Z"
}

// 检查 OCSP
async function checkOCSP(cert) {
  // 1. 从证书中获取 OCSP URL
  const ocspURL = cert.extensions.authorityInfoAccess.ocsp;
  
  // 2. 构造 OCSP 请求
  const ocspRequest = buildOCSPRequest(cert);
  
  // 3. 发送请求
  const response = await fetch(ocspURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ocsp-request'
    },
    body: ocspRequest
  });
  
  // 4. 解析响应
  const ocspResponse = await response.arrayBuffer();
  const status = parseOCSPResponse(ocspResponse);
  
  if (status.certStatus === 'revoked') {
    throw new Error('证书已被吊销');
  }
  
  return true;
}

// ✅ OCSP 的优势：
// - 实时查询
// - 响应小
// - 更及时

// ❌ OCSP 的问题：
// - 增加延迟（需要额外的网络请求）
// - 隐私问题（CA 知道用户访问了哪些网站）
// - 可用性问题（OCSP 服务器宕机会影响访问）
```

### OCSP Stapling

```javascript
// OCSP Stapling：服务器预先获取 OCSP 响应，随证书一起发送

// 工作流程：
// 1. 服务器定期向 OCSP 服务器查询证书状态
服务器 -> OCSP 服务器: "我的证书状态是什么？"
OCSP 服务器 -> 服务器: "good"（并签名）

// 2. 服务器缓存 OCSP 响应

// 3. TLS 握手时，服务器发送证书 + OCSP 响应
服务器 -> 客户端: {
  certificate: "...",
  ocspResponse: "good (signed by CA)"
}

// 4. 客户端验证 OCSP 响应的签名
客户端: 验证 CA 签名 -> 确认证书状态

// ✅ OCSP Stapling 的优势：
// - 不增加客户端延迟
// - 保护用户隐私（客户端不直接查询 OCSP）
// - 提高可用性（即使 OCSP 服务器宕机也不影响）

// Nginx 配置 OCSP Stapling
server {
    listen 443 ssl;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 启用 OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /path/to/chain.pem;
    
    # OCSP 响应缓存
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
}
```

---

## 问题 4：证书验证失败的情况

### 常见错误和处理

```javascript
// 1. 证书过期
// 错误：NET::ERR_CERT_DATE_INVALID

{
  error: 'CERT_HAS_EXPIRED',
  message: '证书已过期',
  validFrom: '2023-01-01',
  validTo: '2024-01-01',
  currentDate: '2024-11-28'
}

// 浏览器显示：
// "您的连接不是私密连接"
// "此网站的安全证书已过期"

// 解决方案：
// - 服务器管理员：续期证书
// - 用户：检查系统时间是否正确

// 2. 域名不匹配
// 错误：NET::ERR_CERT_COMMON_NAME_INVALID

{
  error: 'CERT_COMMON_NAME_INVALID',
  message: '证书域名不匹配',
  certDomain: 'www.example.com',
  requestedDomain: 'api.example.com'
}

// 浏览器显示：
// "此服务器无法证明它是 api.example.com"
// "其安全证书来自 www.example.com"

// 解决方案：
// - 使用通配符证书（*.example.com）
// - 使用多域名证书（SAN）
// - 为每个域名申请单独的证书

// 3. 证书不受信任
// 错误：NET::ERR_CERT_AUTHORITY_INVALID

{
  error: 'CERT_AUTHORITY_INVALID',
  message: '证书颁发机构不受信任',
  issuer: 'Unknown CA'
}

// 浏览器显示：
// "此网站的安全证书不受信任"

// 原因：
// - 自签名证书
// - 证书由不受信任的 CA 签发
// - 缺少中间证书

// 解决方案：
// - 使用受信任的 CA（Let's Encrypt、DigiCert）
// - 配置完整的证书链
// - 企业内部：在客户端安装根证书

// 4. 证书已被吊销
// 错误：NET::ERR_CERT_REVOKED

{
  error: 'CERT_REVOKED',
  message: '证书已被吊销',
  revocationDate: '2024-11-20',
  reason: 'keyCompromise'
}

// 浏览器显示：
// "此网站的安全证书已被吊销"

// 原因：
// - 私钥泄露
// - 证书信息错误
// - 证书被替换

// 解决方案：
// - 立即申请新证书
// - 调查泄露原因
```

### 开发环境处理

```javascript
// 开发环境中处理证书警告

// ⚠️ 仅用于开发环境，生产环境绝不能这样做

// Node.js: 忽略证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 或者在请求时设置
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: false  // 忽略证书验证
});

https.get('https://localhost:3000', { agent }, (res) => {
  // ...
});

// Chrome: 允许本地主机的无效证书
// chrome://flags/#allow-insecure-localhost

// curl: 忽略证书验证
curl -k https://localhost:3000

// ✅ 更好的做法：使用 mkcert 生成本地可信证书
// 1. 安装 mkcert
brew install mkcert

// 2. 安装本地 CA
mkcert -install

// 3. 生成证书
mkcert localhost 127.0.0.1 ::1

// 4. 使用生成的证书
const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
};

https.createServer(options, app).listen(3000);
```

---

## 问题 5：证书固定（Certificate Pinning）

### 什么是证书固定？

```javascript
// 证书固定：应用程序只信任特定的证书或公钥
// 防止中间人攻击，即使攻击者获得了有效的证书

// 传统方式：信任所有受信任 CA 签发的证书
// 问题：如果攻击者从其他 CA 获得证书，仍然可以攻击

// 证书固定：只信任指定的证书
// 即使攻击者有有效证书，也会被拒绝

// 实现方式 1：固定证书
const trustedCertFingerprint = 'sha256/abc123...';

function verifyCertificate(cert) {
  const fingerprint = calculateFingerprint(cert);
  if (fingerprint !== trustedCertFingerprint) {
    throw new Error('证书不匹配');
  }
}

// 实现方式 2：固定公钥（推荐）
const trustedPublicKeyHash = 'sha256/def456...';

function verifyPublicKey(cert) {
  const publicKeyHash = calculateHash(cert.publicKey);
  if (publicKeyHash !== trustedPublicKeyHash) {
    throw new Error('公钥不匹配');
  }
}

// ✅ 固定公钥的优势：
// - 证书更新时不需要更新固定值
// - 只要公钥不变，证书可以续期
```

### HTTP Public Key Pinning (HPKP)

```javascript
// HPKP 通过 HTTP 响应头实现证书固定
// ⚠️ 已废弃，不推荐使用

// 服务器响应头
Public-Key-Pins: 
  pin-sha256="abc123..."; 
  pin-sha256="def456..."; 
  max-age=5184000; 
  includeSubDomains

// 浏览器会记住这些公钥
// 后续访问时，如果证书的公钥不在列表中，拒绝连接

// ❌ HPKP 的问题：
// - 配置错误会导致网站永久无法访问
// - 难以恢复
// - 已被废弃，浏览器不再支持
```

### 移动应用中的证书固定

```javascript
// iOS (Swift)
let session = URLSession(
  configuration: .default,
  delegate: self,
  delegateQueue: nil
)

func urlSession(
  _ session: URLSession,
  didReceive challenge: URLAuthenticationChallenge,
  completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
) {
  guard let serverTrust = challenge.protectionSpace.serverTrust else {
    completionHandler(.cancelAuthenticationChallenge, nil)
    return
  }
  
  // 获取服务器证书
  let certificate = SecTrustGetCertificateAtIndex(serverTrust, 0)
  let serverPublicKey = SecCertificateCopyKey(certificate)
  
  // 比较公钥
  if serverPublicKey == trustedPublicKey {
    let credential = URLCredential(trust: serverTrust)
    completionHandler(.useCredential, credential)
  } else {
    completionHandler(.cancelAuthenticationChallenge, nil)
  }
}
```

```java
// Android (Java)
CertificatePinner certificatePinner = new CertificatePinner.Builder()
    .add("example.com", "sha256/abc123...")
    .add("example.com", "sha256/def456...")  // 备用公钥
    .build();

OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build();
```

---

## 总结

**核心概念总结**：

### 1. 证书验证的目的

- 确认服务器身份
- 防止中间人攻击
- 保护用户数据安全

### 2. 验证步骤

1. 验证证书链（签名和颁发者）
2. 检查有效期
3. 验证域名匹配
4. 检查吊销状态（CRL/OCSP）
5. 验证证书用途

### 3. 吊销检查

- **CRL**：证书吊销列表，文件大，更新慢
- **OCSP**：在线查询，实时但增加延迟
- **OCSP Stapling**：服务器预取，最优方案

### 4. 常见错误

- 证书过期
- 域名不匹配
- 证书不受信任
- 证书已被吊销

## 延伸阅读

- [RFC 5280 - X.509 证书规范](https://tools.ietf.org/html/rfc5280)
- [RFC 6960 - OCSP 规范](https://tools.ietf.org/html/rfc6960)
- [MDN - Certificate Transparency](https://developer.mozilla.org/en-US/docs/Web/Security/Certificate_Transparency)
- [SSL Labs - SSL Test](https://www.ssllabs.com/ssltest/)
- [OWASP - Certificate Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
