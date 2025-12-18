---
title: 如何使用 DI（依赖注入）管理业务模块？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍在 Electron 应用中使用依赖注入模式管理业务模块，提高代码的可测试性和可维护性。
tags:
  - Electron
  - 依赖注入
  - DI
  - 架构设计
estimatedTime: 15 分钟
keywords:
  - electron 依赖注入
  - DI 容器
  - 模块管理
highlight: 学会在 Electron 中使用依赖注入模式，构建松耦合的业务模块。
order: 288
---

## 问题 1：什么是依赖注入，为什么要用？

依赖注入（DI）是一种设计模式，通过外部传入依赖而非内部创建，实现模块解耦：

```typescript
// ❌ 紧耦合：直接创建依赖
class UserService {
  private db = new Database()  // 硬编码依赖
  
  getUser(id: string) {
    return this.db.query('users', id)
  }
}

// ✅ 松耦合：依赖注入
class UserService {
  constructor(private db: IDatabase) {}  // 注入依赖
  
  getUser(id: string) {
    return this.db.query('users', id)
  }
}
```

---

## 问题 2：如何实现简单的 DI 容器？

```typescript
// container.ts
class Container {
  private services = new Map<string, any>()
  private factories = new Map<string, () => any>()
  
  // 注册单例
  register<T>(token: string, instance: T) {
    this.services.set(token, instance)
  }
  
  // 注册工厂
  registerFactory<T>(token: string, factory: () => T) {
    this.factories.set(token, factory)
  }
  
  // 获取服务
  get<T>(token: string): T {
    if (this.services.has(token)) {
      return this.services.get(token)
    }
    
    const factory = this.factories.get(token)
    if (factory) {
      const instance = factory()
      this.services.set(token, instance)
      return instance
    }
    
    throw new Error(`Service not found: ${token}`)
  }
}

export const container = new Container()
```

---

## 问题 3：如何使用装饰器实现 DI？

```typescript
// decorators.ts
import 'reflect-metadata'

const INJECTABLE_KEY = Symbol('injectable')
const INJECT_KEY = Symbol('inject')

export function Injectable() {
  return function(target: any) {
    Reflect.defineMetadata(INJECTABLE_KEY, true, target)
  }
}

export function Inject(token: string) {
  return function(target: any, key: string, index: number) {
    const existing = Reflect.getMetadata(INJECT_KEY, target) || []
    existing.push({ index, token })
    Reflect.defineMetadata(INJECT_KEY, existing, target)
  }
}

// 使用
@Injectable()
class FileService {
  constructor(
    @Inject('Logger') private logger: ILogger,
    @Inject('Config') private config: IConfig
  ) {}
}
```

---

## 问题 4：实际项目中如何组织 DI？

```typescript
// main/bootstrap.ts
import { container } from './container'
import { DatabaseService } from './services/database'
import { FileService } from './services/file'
import { LoggerService } from './services/logger'

export function bootstrap() {
  // 注册基础服务
  container.register('Logger', new LoggerService())
  
  // 注册业务服务（依赖其他服务）
  container.registerFactory('Database', () => {
    const logger = container.get<LoggerService>('Logger')
    return new DatabaseService(logger)
  })
  
  container.registerFactory('File', () => {
    const logger = container.get<LoggerService>('Logger')
    return new FileService(logger)
  })
}

// main/index.ts
import { bootstrap } from './bootstrap'

app.whenReady().then(() => {
  bootstrap()
  // 使用服务
  const fileService = container.get<FileService>('File')
})
```

---

## 问题 5：推荐使用哪些 DI 库？

常用的 TypeScript DI 库：

- **tsyringe** - 微软出品，轻量级
- **inversify** - 功能完整，支持异步
- **typedi** - 简单易用

```typescript
// 使用 tsyringe 示例
import { container, injectable, inject } from 'tsyringe'

@injectable()
class ApiService {
  constructor(
    @inject('HttpClient') private http: IHttpClient
  ) {}
}

// 注册
container.register('HttpClient', { useClass: HttpClient })

// 解析
const api = container.resolve(ApiService)
```

---

## 延伸阅读

- [tsyringe GitHub](https://github.com/microsoft/tsyringe)
- [InversifyJS 文档](https://inversify.io/)
- [依赖注入设计模式](https://martinfowler.com/articles/injection.html)
