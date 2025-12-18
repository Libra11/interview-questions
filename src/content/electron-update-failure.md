---
title: 为什么自动更新失败？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  分析 Electron 自动更新失败的常见原因，包括网络问题、签名验证、
  权限问题以及相应的排查和解决方法。
tags:
  - Electron
  - 自动更新
  - 故障排查
  - electron-updater
estimatedTime: 12 分钟
keywords:
  - electron 更新失败
  - 自动更新问题
  - 更新排查
highlight: 掌握自动更新失败问题的排查思路和解决方案。
order: 345
---

## 问题 1：自动更新失败的常见原因

1. **网络问题** - 无法连接更新服务器
2. **签名验证失败** - 代码签名不匹配
3. **权限不足** - 无法写入安装目录
4. **版本号问题** - 配置不正确
5. **更新文件损坏** - 下载不完整

---

## 问题 2：如何添加详细的日志？

```javascript
const { autoUpdater } = require('electron-updater')
const log = require('electron-log')

// 配置日志
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'debug'

// 监听所有事件
autoUpdater.on('checking-for-update', () => {
  log.info('检查更新中...')
})

autoUpdater.on('update-available', (info) => {
  log.info('发现新版本:', info.version)
})

autoUpdater.on('update-not-available', (info) => {
  log.info('当前已是最新版本')
})

autoUpdater.on('download-progress', (progress) => {
  log.info(`下载进度: ${progress.percent.toFixed(1)}%`)
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('更新下载完成:', info)
})

autoUpdater.on('error', (error) => {
  log.error('更新错误:', error)
})
```

---

## 问题 3：如何排查网络问题？

```javascript
// 测试更新服务器连通性
async function testUpdateServer() {
  const url = 'https://updates.example.com/latest.yml'
  
  try {
    const response = await fetch(url, { timeout: 10000 })
    console.log('状态码:', response.status)
    const text = await response.text()
    console.log('响应内容:', text)
  } catch (error) {
    console.error('连接失败:', error)
  }
}

// 检查代理设置
const { session } = require('electron')
session.defaultSession.resolveProxy('https://updates.example.com')
  .then(proxy => console.log('代理设置:', proxy))
```

---

## 问题 4：如何解决签名问题？

```yaml
# electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name (TEAMID)"
  hardenedRuntime: true
  
win:
  signingHashAlgorithms:
    - sha256
  # 确保使用正确的证书
  sign: "./scripts/sign.js"

# 验证签名
# macOS: codesign -vv --deep MyApp.app
# Windows: signtool verify /pa MyApp.exe
```

---

## 问题 5：如何处理权限问题？

```javascript
// 检查更新目录权限
const { app } = require('electron')
const fs = require('fs')
const path = require('path')

function checkUpdatePermissions() {
  const updateDir = path.join(app.getPath('userData'), 'pending')
  
  try {
    fs.accessSync(updateDir, fs.constants.W_OK)
    return true
  } catch {
    console.error('无法写入更新目录:', updateDir)
    return false
  }
}

// Windows 需要管理员权限时
autoUpdater.on('error', (error) => {
  if (error.message.includes('EPERM')) {
    // 请求管理员权限重试
  }
})
```

---

## 问题 6：常见配置问题检查

```javascript
// 确保版本号格式正确
// package.json 中的 version 必须是语义化版本
console.log('当前版本:', app.getVersion())

// 确保更新 URL 正确
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://updates.example.com'
})

// 检查 latest.yml 格式
// version: 2.0.0
// path: MyApp-2.0.0.exe
// sha512: base64_encoded_hash
```

---

## 延伸阅读

- [electron-updater 文档](https://www.electron.build/auto-update)
- [代码签名指南](https://www.electronjs.org/docs/latest/tutorial/code-signing)
