---
title: 如何隔离渲染进程的业务逻辑？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  探讨渲染进程中业务逻辑的隔离策略，包括与 UI 层分离、使用服务层模式、
  以及如何让业务代码可在不同环境复用。
tags:
  - Electron
  - 渲染进程
  - 业务隔离
  - 架构设计
estimatedTime: 12 分钟
keywords:
  - electron 业务隔离
  - 渲染进程架构
  - 逻辑分层
highlight: 掌握渲染进程业务逻辑隔离的方法，提高代码的可测试性和复用性。
order: 290
---

## 问题 1：为什么要隔离渲染进程的业务逻辑？

将业务逻辑与 UI 层分离有以下好处：

- **可测试性**：业务逻辑可以独立单元测试
- **可复用性**：逻辑代码可在 Web 和 Electron 间复用
- **可维护性**：关注点分离，代码更清晰

---

## 问题 2：如何设计服务层？

```typescript
// services/userService.ts
// 纯业务逻辑，不依赖 Electron API
export class UserService {
  constructor(private api: IApiClient) {}
  
  async login(username: string, password: string) {
    const result = await this.api.post('/login', { username, password })
    return this.transformUserData(result)
  }
  
  private transformUserData(raw: any) {
    return {
      id: raw.id,
      name: raw.name,
      email: raw.email
    }
  }
}

// services/apiClient.ts
// 抽象 API 客户端
interface IApiClient {
  get(url: string): Promise<any>
  post(url: string, data: any): Promise<any>
}

// 实现可以是 fetch、axios 或 IPC
class ElectronApiClient implements IApiClient {
  async get(url: string) {
    return window.electronAPI.invoke('api:get', url)
  }
  
  async post(url: string, data: any) {
    return window.electronAPI.invoke('api:post', url, data)
  }
}
```

---

## 问题 3：如何与 UI 框架集成？

```typescript
// hooks/useUser.ts (React 示例)
import { useState, useCallback } from 'react'
import { userService } from '@/services'

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const userData = await userService.login(username, password)
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { user, loading, login }
}

// 组件只负责 UI
function LoginForm() {
  const { login, loading } = useUser()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    login(username, password)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## 问题 4：如何处理 Electron 特有的依赖？

```typescript
// adapters/platform.ts
interface IPlatformAdapter {
  openFile(path: string): Promise<string>
  saveFile(path: string, content: string): Promise<void>
}

// Electron 实现
class ElectronAdapter implements IPlatformAdapter {
  async openFile(path: string) {
    return window.electronAPI.invoke('file:read', path)
  }
  
  async saveFile(path: string, content: string) {
    return window.electronAPI.invoke('file:write', path, content)
  }
}

// Web 实现（用于开发或 Web 版本）
class WebAdapter implements IPlatformAdapter {
  async openFile(path: string) {
    // 使用 File API
    const input = document.createElement('input')
    input.type = 'file'
    // ...
  }
  
  async saveFile(path: string, content: string) {
    // 使用 download
    const blob = new Blob([content])
    // ...
  }
}

// 根据环境选择
export const platform: IPlatformAdapter = 
  window.electronAPI ? new ElectronAdapter() : new WebAdapter()
```

---

## 延伸阅读

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [领域驱动设计](https://martinfowler.com/bliki/DomainDrivenDesign.html)
