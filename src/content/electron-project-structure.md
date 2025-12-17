---
title: 如何设计大型 Electron 项目的目录结构？
category: Electron
difficulty: 高级
updatedAt: 2025-12-17
summary: >-
  介绍大型 Electron 项目的目录结构设计原则，包括主进程、渲染进程、
  共享模块的组织方式以及模块化架构的实践。
tags:
  - Electron
  - 项目架构
  - 目录结构
  - 工程化
estimatedTime: 15 分钟
keywords:
  - electron 项目结构
  - 大型项目架构
  - 目录组织
highlight: 掌握大型 Electron 项目的目录结构设计，提升代码可维护性和团队协作效率。
order: 87
---

## 问题 1：推荐的项目目录结构是什么？

```
electron-app/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── index.ts          # 入口文件
│   │   ├── windows/          # 窗口管理
│   │   ├── services/         # 业务服务
│   │   ├── ipc/              # IPC 处理器
│   │   └── utils/            # 工具函数
│   │
│   ├── renderer/             # 渲染进程代码
│   │   ├── src/              # 前端源码
│   │   ├── public/           # 静态资源
│   │   └── index.html
│   │
│   ├── preload/              # preload 脚本
│   │   ├── index.ts
│   │   └── apis/             # 暴露的 API
│   │
│   └── shared/               # 共享代码
│       ├── types/            # 类型定义
│       ├── constants/        # 常量
│       └── utils/            # 通用工具
│
├── resources/                # 应用资源
│   ├── icons/
│   └── assets/
│
├── scripts/                  # 构建脚本
├── electron-builder.yml      # 打包配置
└── package.json
```

---

## 问题 2：主进程目录如何组织？

```
src/main/
├── index.ts                  # 应用入口
├── app.ts                    # 应用生命周期
│
├── windows/                  # 窗口管理
│   ├── index.ts              # 窗口管理器
│   ├── mainWindow.ts
│   └── settingsWindow.ts
│
├── services/                 # 业务服务
│   ├── fileService.ts
│   ├── updateService.ts
│   └── databaseService.ts
│
├── ipc/                      # IPC 通信
│   ├── index.ts              # 注册所有 handler
│   ├── fileHandlers.ts
│   └── systemHandlers.ts
│
└── utils/
    ├── logger.ts
    └── paths.ts
```

---

## 问题 3：如何组织渲染进程代码？

```
src/renderer/
├── src/
│   ├── main.tsx              # 前端入口
│   ├── App.tsx
│   │
│   ├── pages/                # 页面组件
│   ├── components/           # 通用组件
│   ├── hooks/                # 自定义 Hook
│   ├── stores/               # 状态管理
│   ├── services/             # API 服务层
│   └── styles/               # 样式文件
│
├── public/
│   └── index.html
│
└── vite.config.ts
```

---

## 问题 4：共享模块如何设计？

```typescript
// src/shared/types/ipc.ts
export interface IPCChannels {
  'file:read': { path: string }
  'file:write': { path: string; content: string }
}

// src/shared/constants/index.ts
export const APP_NAME = 'MyApp'
export const IPC_CHANNELS = {
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write'
} as const

// 主进程和渲染进程都可以引用
import { IPC_CHANNELS } from '@shared/constants'
```

---

## 问题 5：如何配置路径别名？

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"],
      "@preload/*": ["src/preload/*"]
    }
  }
}
```

---

## 延伸阅读

- [Electron Forge 项目结构](https://www.electronforge.io/)
- [electron-vite 最佳实践](https://electron-vite.org/)
