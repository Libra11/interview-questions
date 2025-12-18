---
title: 如何防止 IPC 被恶意 Hook？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍保护 Electron IPC 通信安全的方法，包括通道验证、消息签名、
  防篡改检测等安全措施。
tags:
  - Electron
  - IPC 安全
  - 安全防护
  - Hook 防护
estimatedTime: 15 分钟
keywords:
  - electron ipc 安全
  - 防止 hook
  - 通信安全
highlight: 掌握 IPC 安全防护措施，防止恶意脚本劫持进程间通信。
order: 302
---

## 问题 1：IPC 被 Hook 的风险是什么？

恶意脚本可能通过以下方式劫持 IPC：

- 注入脚本覆盖 `window.electronAPI`
- 拦截 `ipcRenderer.send/invoke`
- 伪造 IPC 消息获取敏感数据

---

## 问题 2：如何使用白名单验证通道？

```javascript
// main.js
const ALLOWED_CHANNELS = new Set([
  'file:read',
  'file:write',
  'app:getVersion'
])

ipcMain.handle('*', (event, channel, ...args) => {
  if (!ALLOWED_CHANNELS.has(channel)) {
    console.error('非法通道:', channel)
    throw new Error('Unauthorized channel')
  }
})

// 更好的方式：只注册允许的通道
ALLOWED_CHANNELS.forEach(channel => {
  ipcMain.handle(channel, handlers[channel])
})
```

---

## 问题 3：如何验证消息来源？

```javascript
// main.js
ipcMain.handle('sensitive-action', (event, data) => {
  // 验证发送者
  const sender = event.sender
  const senderUrl = sender.getURL()
  
  // 检查是否来自可信页面
  if (!isAllowedOrigin(senderUrl)) {
    throw new Error('Untrusted origin')
  }
  
  // 检查 frame 是否是主 frame
  if (event.frameId !== 0) {
    throw new Error('Must be main frame')
  }
  
  return processAction(data)
})

function isAllowedOrigin(url) {
  const allowed = ['file://', 'app://']
  return allowed.some(origin => url.startsWith(origin))
}
```

---

## 问题 4：如何使用消息签名？

```javascript
// preload.js
const crypto = require('crypto')
const SECRET = process.env.IPC_SECRET

function signMessage(channel, data) {
  const payload = JSON.stringify({ channel, data, timestamp: Date.now() })
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')
  return { payload, signature }
}

contextBridge.exposeInMainWorld('api', {
  invoke: (channel, data) => {
    const { payload, signature } = signMessage(channel, data)
    return ipcRenderer.invoke('signed-call', payload, signature)
  }
})

// main.js
ipcMain.handle('signed-call', (event, payload, signature) => {
  // 验证签名
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')
  
  if (signature !== expected) {
    throw new Error('Invalid signature')
  }
  
  const { channel, data, timestamp } = JSON.parse(payload)
  
  // 检查时间戳防止重放攻击
  if (Date.now() - timestamp > 5000) {
    throw new Error('Message expired')
  }
  
  return handlers[channel](data)
})
```

---

## 问题 5：其他安全建议

```javascript
// 1. 冻结暴露的 API
contextBridge.exposeInMainWorld('api', Object.freeze({
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
}))

// 2. 使用 CSP 防止脚本注入
// index.html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">

// 3. 禁用 webview 标签
webPreferences: {
  webviewTag: false
}
```

---

## 延伸阅读

- [Electron 安全检查清单](https://www.electronjs.org/docs/latest/tutorial/security)
- [IPC 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/ipc)
