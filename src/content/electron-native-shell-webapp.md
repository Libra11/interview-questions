---
title: 如何让 Electron 作为 native shell 承载 WebApp？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍将 Electron 作为 Web 应用的原生容器使用，包括加载远程页面、
  本地能力注入以及混合架构设计。
tags:
  - Electron
  - Native Shell
  - WebApp
  - 混合应用
estimatedTime: 15 分钟
keywords:
  - electron native shell
  - webapp 容器
  - 混合架构
highlight: 了解 Electron 作为 Web 应用原生外壳的设计模式。
order: 329
---

## 问题 1：什么是 Native Shell 模式？

Native Shell 模式是指：

- Electron 仅作为外壳容器
- 主要内容加载远程 Web 应用
- 提供原生能力增强（文件访问、通知等）

适用场景：现有 Web 应用需要桌面版本。

---

## 问题 2：如何安全加载远程页面？

```javascript
const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    // 允许加载远程内容
    webSecurity: true
  }
})

// 加载远程 Web 应用
win.loadURL('https://webapp.example.com')

// 验证 URL
win.webContents.on('will-navigate', (event, url) => {
  if (!isAllowedUrl(url)) {
    event.preventDefault()
  }
})

function isAllowedUrl(url) {
  const allowed = ['https://webapp.example.com', 'https://auth.example.com']
  return allowed.some(base => url.startsWith(base))
}
```

---

## 问题 3：如何注入原生能力？

```javascript
// preload.js - 为远程页面提供原生能力
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('nativeAPI', {
  // 文件操作
  downloadFile: (url, filename) => 
    ipcRenderer.invoke('download', url, filename),
  
  // 系统通知
  notify: (title, body) => 
    ipcRenderer.invoke('notify', title, body),
  
  // 系统信息
  getPlatform: () => process.platform,
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // 标识是否在 Electron 中运行
  isElectron: true
})

// WebApp 中检测并使用
// if (window.nativeAPI?.isElectron) {
//   window.nativeAPI.notify('Hello', 'From Electron!')
// }
```

---

## 问题 4：如何处理离线场景？

```javascript
class OfflineHandler {
  constructor(win, fallbackPath) {
    this.win = win
    this.fallbackPath = fallbackPath
    this.setup()
  }
  
  setup() {
    this.win.webContents.on('did-fail-load', (event, code, desc) => {
      if (code === -106) { // 网络不可用
        this.showOfflinePage()
      }
    })
  }
  
  showOfflinePage() {
    this.win.loadFile(this.fallbackPath)
  }
  
  checkAndReload() {
    if (navigator.onLine) {
      this.win.loadURL('https://webapp.example.com')
    }
  }
}
```

---

## 问题 5：混合架构设计

```
┌─────────────────────────────────────┐
│         Electron Shell             │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │     Remote WebApp           │   │
│  │   (https://webapp.com)      │   │
│  └─────────────────────────────┘   │
│              │                      │
│     ┌────────┴────────┐            │
│     │   Preload API   │            │
│     └────────┬────────┘            │
│              │                      │
│     ┌────────┴────────┐            │
│     │   Main Process  │            │
│     │  (Native APIs)  │            │
│     └─────────────────┘            │
└─────────────────────────────────────┘
```

---

## 延伸阅读

- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [渐进式 Web 应用](https://web.dev/progressive-web-apps/)
