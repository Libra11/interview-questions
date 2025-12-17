---
title: 如何设计主进程与渲染进程的模块化架构？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  深入讲解 Electron 主进程和渲染进程的模块化设计，包括职责划分、
  通信层抽象以及如何保持代码的可维护性。
tags:
  - Electron
  - 模块化
  - 架构设计
  - 进程分离
estimatedTime: 18 分钟
keywords:
  - electron 模块化
  - 进程架构设计
  - 代码分层
highlight: 掌握 Electron 多进程模块化架构设计，构建可扩展的桌面应用。
order: 88
---

## 问题 1：主进程和渲染进程应该如何分工？

**主进程职责：**
- 窗口管理
- 系统 API 调用（文件、网络、硬件）
- 后台服务和定时任务
- 应用生命周期管理

**渲染进程职责：**
- UI 展示和用户交互
- 前端业务逻辑
- 状态管理

```javascript
// 主进程 - 服务化设计
// main/services/fileService.ts
class FileService {
  async readFile(path) {
    return fs.promises.readFile(path, 'utf-8')
  }
  
  async writeFile(path, content) {
    return fs.promises.writeFile(path, content)
  }
}

// 渲染进程 - 通过 IPC 调用
// renderer/services/fileApi.ts
export const fileApi = {
  read: (path) => window.api.invoke('file:read', path),
  write: (path, content) => window.api.invoke('file:write', path, content)
}
```

---

## 问题 2：如何抽象 IPC 通信层？

```typescript
// shared/ipc/channels.ts
export const IPC_CHANNELS = {
  FILE: {
    READ: 'file:read',
    WRITE: 'file:write'
  },
  WINDOW: {
    MINIMIZE: 'window:minimize',
    CLOSE: 'window:close'
  }
} as const

// main/ipc/index.ts
import { ipcMain } from 'electron'
import { fileHandlers } from './fileHandlers'
import { windowHandlers } from './windowHandlers'

export function registerIPCHandlers() {
  // 注册所有处理器
  Object.entries(fileHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler)
  })
  
  Object.entries(windowHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler)
  })
}

// main/ipc/fileHandlers.ts
export const fileHandlers = {
  'file:read': async (event, path) => {
    const service = container.get(FileService)
    return service.readFile(path)
  }
}
```

---

## 问题 3：如何设计渲染进程的服务层？

```typescript
// renderer/services/api.ts
class APIService {
  private invoke<T>(channel: string, ...args: any[]): Promise<T> {
    return window.electronAPI.invoke(channel, ...args)
  }
  
  file = {
    read: (path: string) => this.invoke<string>('file:read', path),
    write: (path: string, content: string) => 
      this.invoke<void>('file:write', path, content)
  }
  
  window = {
    minimize: () => this.invoke('window:minimize'),
    close: () => this.invoke('window:close')
  }
}

export const api = new APIService()

// 在组件中使用
import { api } from '@/services/api'

async function loadFile() {
  const content = await api.file.read('/path/to/file')
}
```

---

## 问题 4：如何实现模块的懒加载？

```javascript
// main/services/index.ts
const serviceModules = {
  file: () => import('./fileService'),
  database: () => import('./databaseService'),
  update: () => import('./updateService')
}

class ServiceLoader {
  private services = new Map()
  
  async get(name) {
    if (!this.services.has(name)) {
      const loader = serviceModules[name]
      if (!loader) throw new Error(`Unknown service: ${name}`)
      
      const module = await loader()
      this.services.set(name, new module.default())
    }
    return this.services.get(name)
  }
}
```

---

## 延伸阅读

- [Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [依赖注入模式](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
