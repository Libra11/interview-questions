---
title: Webpack5 的模块联邦（Module Federation）是什么？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 5 模块联邦的概念和原理，掌握跨应用模块共享的实现方式。
tags:
  - Webpack
  - Webpack5
  - Module Federation
  - 微前端
estimatedTime: 18 分钟
keywords:
  - Module Federation
  - 模块联邦
  - 微前端
  - 跨应用共享
highlight: Module Federation 允许多个独立构建的应用在运行时动态共享代码，是实现微前端的强大工具。
order: 663
---

## 问题 1：什么是模块联邦？

**模块联邦（Module Federation）允许一个 JavaScript 应用在运行时动态加载另一个应用的代码**。

```
传统方式：
App A 和 App B 各自打包，无法共享代码

模块联邦：
App A 可以直接使用 App B 导出的组件
App B 可以直接使用 App A 导出的组件
无需重新打包，运行时动态加载
```

---

## 问题 2：基本配置

### 远程应用（提供模块）

```javascript
// app-b/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "appB",
      filename: "remoteEntry.js",
      exposes: {
        "./Button": "./src/components/Button",
        "./utils": "./src/utils",
      },
      shared: ["react", "react-dom"],
    }),
  ],
};
```

### 主应用（消费模块）

```javascript
// app-a/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "appA",
      remotes: {
        appB: "appB@http://localhost:3002/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  ],
};
```

---

## 问题 3：使用远程模块

```javascript
// app-a/src/App.js
import React, { Suspense, lazy } from "react";

// 动态导入远程模块
const RemoteButton = lazy(() => import("appB/Button"));

function App() {
  return (
    <Suspense fallback="Loading...">
      <RemoteButton />
    </Suspense>
  );
}
```

---

## 问题 4：核心概念

### Host（主机）

消费远程模块的应用。

### Remote（远程）

提供模块给其他应用使用的应用。

### Shared（共享）

多个应用共同使用的依赖，避免重复加载。

```javascript
shared: {
  react: {
    singleton: true,      // 只加载一个版本
    requiredVersion: '^18.0.0',
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^18.0.0',
  },
}
```

---

## 问题 5：工作原理

```
1. App B 构建时生成 remoteEntry.js（入口清单）

2. App A 运行时：
   - 加载 remoteEntry.js
   - 获取 App B 的模块信息
   - 按需加载具体模块

3. 共享依赖处理：
   - 检查 App A 是否已有 React
   - 如果有且版本兼容，复用
   - 如果没有，从 App B 加载
```

---

## 问题 6：典型应用场景

### 微前端架构

```
Shell App（主应用）
├── Header（来自 header-app）
├── Sidebar（来自 sidebar-app）
└── Content
    ├── Dashboard（来自 dashboard-app）
    └── Settings（来自 settings-app）
```

### 组件库共享

```javascript
// 组件库应用
exposes: {
  './Button': './src/Button',
  './Modal': './src/Modal',
  './Table': './src/Table',
}

// 业务应用直接使用
import Button from 'componentLib/Button';
```

## 延伸阅读

- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)
