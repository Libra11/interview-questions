---
title: 如何使用 powerMonitor 监听系统休眠？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  详细介绍 Electron powerMonitor 模块的使用，包括监听系统休眠/唤醒、锁屏/解锁事件，
  以及在实际应用中如何优雅处理这些系统电源状态变化。
tags:
  - Electron
  - powerMonitor
  - 系统休眠
  - 电源管理
estimatedTime: 12 分钟
keywords:
  - electron powerMonitor
  - 系统休眠监听
  - 锁屏检测
highlight: 学会使用 powerMonitor 监听系统电源状态，优化应用在休眠/唤醒时的行为。
order: 81
---

## 问题 1：powerMonitor 是什么，有哪些常用事件？

`powerMonitor` 是 Electron 提供的电源状态监控模块，只能在主进程中使用。它可以监听系统的电源相关事件：

```javascript
const { powerMonitor } = require('electron')

// 必须在 app ready 之后使用
app.whenReady().then(() => {
  // 系统即将休眠
  powerMonitor.on('suspend', () => {
    console.log('系统即将休眠')
  })
  
  // 系统从休眠中恢复
  powerMonitor.on('resume', () => {
    console.log('系统已唤醒')
  })
  
  // 系统锁屏
  powerMonitor.on('lock-screen', () => {
    console.log('屏幕已锁定')
  })
  
  // 系统解锁
  powerMonitor.on('unlock-screen', () => {
    console.log('屏幕已解锁')
  })
  
  // 系统即将关机（Windows/Linux）
  powerMonitor.on('shutdown', () => {
    console.log('系统即将关机')
  })
})
```

---

## 问题 2：如何检测系统当前的电源状态？

除了监听事件，还可以主动查询系统的电源状态：

```javascript
const { powerMonitor } = require('electron')

app.whenReady().then(() => {
  // 获取当前系统空闲时间（秒）
  const idleTime = powerMonitor.getSystemIdleTime()
  console.log(`系统已空闲 ${idleTime} 秒`)
  
  // 获取系统空闲状态
  // 返回 'active' | 'idle' | 'locked' | 'unknown'
  const idleState = powerMonitor.getSystemIdleState(60) // 60秒阈值
  console.log(`当前状态: ${idleState}`)
  
  // macOS 特有：检测是否使用电池
  if (process.platform === 'darwin') {
    const isOnBattery = powerMonitor.isOnBatteryPower()
    console.log(`使用电池: ${isOnBattery}`)
  }
})
```

---

## 问题 3：监听休眠和唤醒有什么实际应用场景？

监听系统休眠/唤醒事件在实际应用中非常重要，主要用于以下场景：

```javascript
const { powerMonitor, BrowserWindow } = require('electron')

class PowerManager {
  constructor() {
    this.setupListeners()
  }
  
  setupListeners() {
    // 场景1：休眠前暂停后台任务
    powerMonitor.on('suspend', () => {
      this.pauseBackgroundTasks()
      this.pauseWebSocketConnections()
      this.saveApplicationState()
    })
    
    // 场景2：唤醒后恢复服务
    powerMonitor.on('resume', () => {
      this.resumeBackgroundTasks()
      this.reconnectWebSocket()
      this.syncDataWithServer()
      this.checkForUpdates()
    })
    
    // 场景3：锁屏时保护隐私
    powerMonitor.on('lock-screen', () => {
      this.hidePrivateWindows()
      this.pauseMediaPlayback()
    })
    
    // 场景4：解锁后恢复
    powerMonitor.on('unlock-screen', () => {
      this.showWindows()
    })
  }
  
  pauseWebSocketConnections() {
    // 暂停 WebSocket 连接，避免休眠时产生错误
    console.log('暂停 WebSocket 连接')
  }
  
  reconnectWebSocket() {
    // 唤醒后重新建立连接
    console.log('重新建立 WebSocket 连接')
  }
  
  syncDataWithServer() {
    // 休眠期间可能错过的数据同步
    console.log('同步服务器数据')
  }
  
  saveApplicationState() {
    // 保存应用状态，防止意外断电
    console.log('保存应用状态')
  }
  
  hidePrivateWindows() {
    // 隐藏包含敏感信息的窗口
    BrowserWindow.getAllWindows().forEach(win => {
      if (win.isVisible()) {
        win.hide()
      }
    })
  }
  
  showWindows() {
    BrowserWindow.getAllWindows().forEach(win => {
      win.show()
    })
  }
}
```

---

## 问题 4：如何处理唤醒后的网络重连？

系统休眠后唤醒，网络连接通常需要重新建立：

```javascript
const { powerMonitor } = require('electron')

class NetworkManager {
  constructor() {
    this.isReconnecting = false
    this.reconnectAttempts = 0
    
    powerMonitor.on('resume', () => {
      // 延迟一段时间，等待网络恢复
      setTimeout(() => {
        this.handleResume()
      }, 2000)
    })
  }
  
  async handleResume() {
    // 检查网络状态
    const isOnline = await this.checkNetworkStatus()
    
    if (isOnline) {
      await this.reconnectAllServices()
    } else {
      // 网络未恢复，等待后重试
      this.scheduleReconnect()
    }
  }
  
  async checkNetworkStatus() {
    try {
      const response = await fetch('https://api.example.com/ping', {
        timeout: 5000
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async reconnectAllServices() {
    this.isReconnecting = true
    
    try {
      await Promise.all([
        this.reconnectWebSocket(),
        this.refreshAuthToken(),
        this.syncPendingData()
      ])
      
      this.reconnectAttempts = 0
      console.log('所有服务已重连')
    } catch (error) {
      console.error('重连失败:', error)
      this.scheduleReconnect()
    } finally {
      this.isReconnecting = false
    }
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts >= 5) {
      console.error('重连次数已达上限')
      return
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    
    setTimeout(() => {
      this.handleResume()
    }, delay)
  }
}
```

---

## 问题 5：如何阻止系统休眠？

有些场景下需要阻止系统进入休眠状态，比如视频播放、文件下载等：

```javascript
const { powerSaveBlocker } = require('electron')

class PowerBlocker {
  constructor() {
    this.blockerId = null
  }
  
  // 阻止系统休眠（保持屏幕常亮）
  preventDisplaySleep() {
    if (this.blockerId !== null) {
      return // 已经在阻止中
    }
    
    // 'prevent-display-sleep' - 阻止屏幕休眠
    // 'prevent-app-suspension' - 仅阻止应用挂起，屏幕可以关闭
    this.blockerId = powerSaveBlocker.start('prevent-display-sleep')
    console.log(`开始阻止休眠，ID: ${this.blockerId}`)
  }
  
  // 允许系统休眠
  allowSleep() {
    if (this.blockerId !== null) {
      powerSaveBlocker.stop(this.blockerId)
      console.log(`停止阻止休眠，ID: ${this.blockerId}`)
      this.blockerId = null
    }
  }
  
  // 检查是否正在阻止休眠
  isBlocking() {
    if (this.blockerId === null) {
      return false
    }
    return powerSaveBlocker.isStarted(this.blockerId)
  }
}

// 使用示例
const blocker = new PowerBlocker()

// 开始视频播放时
function onVideoPlay() {
  blocker.preventDisplaySleep()
}

// 视频暂停或结束时
function onVideoPause() {
  blocker.allowSleep()
}
```

---

## 问题 6：如何将电源状态变化通知到渲染进程？

由于 powerMonitor 只能在主进程使用，需要通过 IPC 通知渲染进程：

```javascript
// main.js
const { powerMonitor, BrowserWindow, ipcMain } = require('electron')

function setupPowerMonitor(mainWindow) {
  const events = ['suspend', 'resume', 'lock-screen', 'unlock-screen']
  
  events.forEach(event => {
    powerMonitor.on(event, () => {
      // 通知所有窗口
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('power-event', event)
        }
      })
    })
  })
  
  // 响应渲染进程的状态查询
  ipcMain.handle('get-idle-time', () => {
    return powerMonitor.getSystemIdleTime()
  })
}

// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('powerAPI', {
  onPowerEvent: (callback) => {
    ipcRenderer.on('power-event', (event, type) => callback(type))
  },
  getIdleTime: () => ipcRenderer.invoke('get-idle-time')
})

// renderer.js
window.powerAPI.onPowerEvent((eventType) => {
  console.log(`电源事件: ${eventType}`)
  
  switch (eventType) {
    case 'suspend':
      // 暂停视频播放等
      break
    case 'resume':
      // 恢复应用状态
      break
  }
})
```

---

## 延伸阅读

- [Electron powerMonitor 官方文档](https://www.electronjs.org/docs/latest/api/power-monitor)
- [Electron powerSaveBlocker 文档](https://www.electronjs.org/docs/latest/api/power-save-blocker)
- [处理网络断线重连的最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
