---
title: 如何查看 IPC 调用链？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  介绍在 Electron 中追踪和调试 IPC 调用的方法，包括构建 IPC 日志系统、
  使用中间件模式记录调用链以及可视化 IPC 通信过程。
tags:
  - Electron
  - IPC
  - 调试
  - 通信追踪
estimatedTime: 12 分钟
keywords:
  - electron ipc 调试
  - ipc 调用链
  - 进程通信追踪
highlight: 学会追踪和分析 Electron IPC 调用链，快速定位进程间通信问题。
order: 281
---

## 问题 1：为什么需要追踪 IPC 调用链？

复杂的 Electron 应用中，IPC 调用可能涉及多个来回通信，追踪调用链有助于：

- 定位通信失败的具体环节
- 分析性能瓶颈
- 理解数据流转过程

---

## 问题 2：如何构建 IPC 日志系统？

```javascript
// ipcLogger.js - 主进程
const { ipcMain } = require('electron')

class IPCLogger {
  constructor() {
    this.logs = []
    this.originalHandle = ipcMain.handle.bind(ipcMain)
    this.originalOn = ipcMain.on.bind(ipcMain)
  }
  
  wrap() {
    // 包装 handle
    ipcMain.handle = (channel, handler) => {
      return this.originalHandle(channel, async (event, ...args) => {
        const id = Date.now()
        this.log('handle', channel, 'request', args, id)
        
        try {
          const result = await handler(event, ...args)
          this.log('handle', channel, 'response', result, id)
          return result
        } catch (error) {
          this.log('handle', channel, 'error', error.message, id)
          throw error
        }
      })
    }
    
    // 包装 on
    ipcMain.on = (channel, handler) => {
      return this.originalOn(channel, (event, ...args) => {
        this.log('on', channel, 'received', args)
        handler(event, ...args)
      })
    }
  }
  
  log(type, channel, phase, data, id) {
    const entry = {
      id,
      timestamp: new Date().toISOString(),
      type,
      channel,
      phase,
      data: JSON.stringify(data).slice(0, 200)
    }
    this.logs.push(entry)
    console.log(`[IPC ${type}] ${channel} - ${phase}:`, data)
  }
}

module.exports = new IPCLogger()
```

---

## 问题 3：如何在 preload 中追踪 IPC？

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

const createTracedIPC = () => {
  const trace = (method, channel, ...args) => {
    console.log(`[IPC] ${method}(${channel})`, args)
  }
  
  return {
    invoke: async (channel, ...args) => {
      trace('invoke', channel, ...args)
      const start = Date.now()
      const result = await ipcRenderer.invoke(channel, ...args)
      console.log(`[IPC] invoke(${channel}) 完成，耗时 ${Date.now() - start}ms`)
      return result
    },
    send: (channel, ...args) => {
      trace('send', channel, ...args)
      ipcRenderer.send(channel, ...args)
    },
    on: (channel, callback) => {
      ipcRenderer.on(channel, (event, ...args) => {
        trace('receive', channel, ...args)
        callback(...args)
      })
    }
  }
}

contextBridge.exposeInMainWorld('ipc', createTracedIPC())
```

---

## 问题 4：如何可视化 IPC 调用？

```javascript
// main.js - 发送日志到专门的调试窗口
function createIPCDebugWindow() {
  const debugWin = new BrowserWindow({
    width: 600,
    height: 400,
    title: 'IPC Debug'
  })
  
  debugWin.loadURL('data:text/html,<pre id="log"></pre>')
  
  return {
    log: (entry) => {
      debugWin.webContents.executeJavaScript(`
        document.getElementById('log').innerHTML += 
          '${JSON.stringify(entry)}\\n'
      `)
    }
  }
}
```

---

## 延伸阅读

- [Electron IPC 官方文档](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [调试进程间通信](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)
