---
title: 如何设计跨平台的自动更新系统？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍 Electron 跨平台自动更新系统的设计，包括不同平台的更新机制差异、
  回滚策略以及更新服务器的搭建。
tags:
  - Electron
  - 自动更新
  - 跨平台
  - 系统设计
estimatedTime: 18 分钟
keywords:
  - electron 跨平台更新
  - 自动更新设计
  - 更新服务器
highlight: 掌握跨平台自动更新系统的设计要点，确保各平台更新体验一致。
order: 101
---

## 问题 1：各平台更新机制有何不同？

| 平台 | 更新方式 | 特点 |
|------|----------|------|
| macOS | DMG/ZIP + Squirrel | 需要代码签名 |
| Windows | NSIS/Squirrel | 支持增量更新 |
| Linux | AppImage/deb/rpm | 无统一方案 |

---

## 问题 2：如何设计更新服务？

```javascript
// update-server/index.js
const express = require('express')
const app = express()

const releases = {
  darwin: { version: '2.0.0', url: 'https://...', sha512: '...' },
  win32: { version: '2.0.0', url: 'https://...', sha512: '...' },
  linux: { version: '2.0.0', url: 'https://...', sha512: '...' }
}

app.get('/update/:platform/:version', (req, res) => {
  const { platform, version } = req.params
  const release = releases[platform]
  
  if (!release || release.version === version) {
    res.status(204).end() // 无更新
    return
  }
  
  res.json(release)
})
```

---

## 问题 3：客户端更新流程如何实现？

```javascript
const { autoUpdater } = require('electron-updater')

class UpdateManager {
  constructor() {
    this.setupAutoUpdater()
  }
  
  setupAutoUpdater() {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://updates.example.com'
    })
    
    autoUpdater.on('checking-for-update', () => {
      this.emit('status', 'checking')
    })
    
    autoUpdater.on('update-available', (info) => {
      this.emit('status', 'available', info)
    })
    
    autoUpdater.on('download-progress', (progress) => {
      this.emit('progress', progress.percent)
    })
    
    autoUpdater.on('update-downloaded', (info) => {
      this.emit('status', 'ready', info)
    })
  }
  
  checkForUpdates() {
    return autoUpdater.checkForUpdates()
  }
  
  installUpdate() {
    autoUpdater.quitAndInstall()
  }
}
```

---

## 问题 4：如何实现更新回滚？

```javascript
class UpdateRollback {
  constructor() {
    this.backupDir = path.join(app.getPath('userData'), 'backup')
  }
  
  async backup() {
    const currentVersion = app.getVersion()
    const backupPath = path.join(this.backupDir, currentVersion)
    
    // 备份关键文件
    await fs.copy(app.getAppPath(), backupPath)
  }
  
  async rollback(version) {
    const backupPath = path.join(this.backupDir, version)
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup not found')
    }
    
    // 恢复备份
    await fs.copy(backupPath, app.getAppPath())
    
    // 重启应用
    app.relaunch()
    app.exit()
  }
}
```

---

## 问题 5：Linux 平台如何处理更新？

```javascript
// Linux 自定义更新
if (process.platform === 'linux') {
  const { spawn } = require('child_process')
  
  async function updateLinux(downloadUrl, newAppPath) {
    // 下载新版本 AppImage
    await downloadFile(downloadUrl, newAppPath)
    
    // 设置执行权限
    await fs.chmod(newAppPath, 0o755)
    
    // 替换旧版本
    const currentPath = process.env.APPIMAGE
    await fs.rename(newAppPath, currentPath)
    
    // 重启
    spawn(currentPath, { detached: true, stdio: 'ignore' })
    app.quit()
  }
}
```

---

## 延伸阅读

- [electron-updater 文档](https://www.electron.build/auto-update)
- [各平台代码签名](https://www.electronjs.org/docs/latest/tutorial/code-signing)
