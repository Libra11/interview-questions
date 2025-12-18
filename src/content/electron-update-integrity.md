---
title: 如何保证自动更新包未被篡改？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍确保 Electron 自动更新安全性的方法，包括代码签名验证、
  更新包哈希校验以及安全的更新流程设计。
tags:
  - Electron
  - 自动更新
  - 安全
  - 代码签名
estimatedTime: 12 分钟
keywords:
  - electron 更新安全
  - 代码签名
  - 更新包验证
highlight: 掌握自动更新安全机制，确保用户下载的更新包未被篡改。
order: 304
---

## 问题 1：自动更新可能面临哪些安全风险？

- **中间人攻击** - 替换下载的更新包
- **服务器被入侵** - 直接篡改源文件
- **DNS 劫持** - 重定向到恶意服务器

---

## 问题 2：如何使用代码签名？

```yaml
# electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  gatekeeperAssess: false
  
win:
  signingHashAlgorithms:
    - sha256
  certificateFile: "./certificate.pfx"
  certificatePassword: ${WIN_CERT_PASSWORD}

# electron-updater 会自动验证签名
```

---

## 问题 3：如何实现更新包哈希校验？

```javascript
// 服务端：生成更新清单
const crypto = require('crypto')

function generateManifest(filePath) {
  const content = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha512').update(content).digest('base64')
  
  return {
    version: '2.0.0',
    path: 'update.zip',
    sha512: hash,
    releaseDate: new Date().toISOString()
  }
}

// 客户端：验证下载的文件
async function verifyUpdate(filePath, expectedHash) {
  const content = fs.readFileSync(filePath)
  const actualHash = crypto.createHash('sha512').update(content).digest('base64')
  
  if (actualHash !== expectedHash) {
    throw new Error('Update file integrity check failed')
  }
  return true
}
```

---

## 问题 4：使用 electron-updater 的安全配置

```javascript
const { autoUpdater } = require('electron-updater')

// 强制使用 HTTPS
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://updates.example.com',
  useMultipleRangeRequest: false
})

// 自动验证签名（默认开启）
autoUpdater.on('update-downloaded', (info) => {
  console.log('更新已下载，签名验证通过')
  console.log('SHA512:', info.sha512)
})

autoUpdater.on('error', (error) => {
  // 签名验证失败会触发此事件
  console.error('更新错误:', error)
})
```

---

## 问题 5：安全更新流程设计

```javascript
class SecureUpdater {
  async checkAndUpdate() {
    // 1. 使用 HTTPS 获取更新信息
    const updateInfo = await this.fetchUpdateInfo()
    
    // 2. 验证更新信息签名
    if (!this.verifyManifestSignature(updateInfo)) {
      throw new Error('Update manifest signature invalid')
    }
    
    // 3. 下载更新包
    const updateFile = await this.downloadUpdate(updateInfo)
    
    // 4. 验证文件哈希
    if (!this.verifyFileHash(updateFile, updateInfo.sha512)) {
      fs.unlinkSync(updateFile)
      throw new Error('Update file corrupted')
    }
    
    // 5. 验证代码签名
    if (!await this.verifyCodeSignature(updateFile)) {
      fs.unlinkSync(updateFile)
      throw new Error('Code signature invalid')
    }
    
    // 6. 安装更新
    return this.installUpdate(updateFile)
  }
}
```

---

## 延伸阅读

- [Electron 代码签名指南](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [electron-updater 安全](https://www.electron.build/auto-update#security)
