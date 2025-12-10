---
title: 模块联邦如何实现微前端架构？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  学习如何使用 Module Federation 构建微前端架构，掌握实际项目中的最佳实践。
tags:
  - Webpack
  - Module Federation
  - 微前端
  - 架构设计
estimatedTime: 18 分钟
keywords:
  - 微前端
  - Module Federation
  - 架构设计
  - 应用集成
highlight: Module Federation 通过 Shell + 子应用的架构模式，实现微前端的独立开发、独立部署和运行时集成。
order: 671
---

## 问题 1：微前端架构模式

```
┌─────────────────────────────────────────────┐
│              Shell App (Host)                │
│  ┌─────────────────────────────────────────┐ │
│  │              Header (Remote)             │ │
│  └─────────────────────────────────────────┘ │
│  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Sidebar  │  │        Content           │ │
│  │ (Remote) │  │  ┌────────────────────┐  │ │
│  │          │  │  │   Feature App      │  │ │
│  │          │  │  │    (Remote)        │  │ │
│  │          │  │  └────────────────────┘  │ │
│  └──────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 问题 2：Shell App 配置

```javascript
// shell-app/webpack.config.js
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "shell",
      remotes: {
        header: "header@http://localhost:3001/remoteEntry.js",
        sidebar: "sidebar@http://localhost:3002/remoteEntry.js",
        dashboard: "dashboard@http://localhost:3003/remoteEntry.js",
        settings: "settings@http://localhost:3004/remoteEntry.js",
      },
      shared: {
        react: { singleton: true, eager: true },
        "react-dom": { singleton: true, eager: true },
        "react-router-dom": { singleton: true },
      },
    }),
  ],
};
```

---

## 问题 3：子应用配置

```javascript
// dashboard-app/webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "dashboard",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App",
        "./routes": "./src/routes",
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        "react-router-dom": { singleton: true },
      },
    }),
  ],
};
```

---

## 问题 4：Shell App 路由集成

```javascript
// shell-app/src/App.js
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Header = lazy(() => import("header/Header"));
const Sidebar = lazy(() => import("sidebar/Sidebar"));
const Dashboard = lazy(() => import("dashboard/App"));
const Settings = lazy(() => import("settings/App"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
        <div className="layout">
          <Sidebar />
          <main>
            <Routes>
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/settings/*" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Suspense>
    </BrowserRouter>
  );
}
```

---

## 问题 5：错误边界处理

```javascript
// 处理远程模块加载失败
class RemoteErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>子应用加载失败，请刷新重试</div>;
    }
    return this.props.children;
  }
}

// 使用
<RemoteErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
</RemoteErrorBoundary>;
```

---

## 问题 6：部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    └─────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Shell App    │ │ Dashboard App │ │ Settings App  │
│  (CDN/Server) │ │  (CDN/Server) │ │  (CDN/Server) │
└───────────────┘ └───────────────┘ └───────────────┘
```

每个应用独立部署，通过 URL 引用。

---

## 问题 7：最佳实践

```javascript
// 1. 统一的 shared 配置
const sharedDeps = require('@company/shared-deps');

// 2. 环境变量管理远程 URL
remotes: {
  dashboard: `dashboard@${process.env.DASHBOARD_URL}/remoteEntry.js`,
}

// 3. 版本管理
// 使用 semver 确保兼容性

// 4. 监控和日志
// 记录远程模块加载情况
```

## 延伸阅读

- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)
- [Micro Frontends](https://micro-frontends.org/)
