---
title: Module Federation 中 Remote 与 Host 的概念？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Module Federation 中 Remote 和 Host 的角色和关系，掌握它们的配置方式。
tags:
  - Webpack
  - Module Federation
  - Remote
  - Host
estimatedTime: 12 分钟
keywords:
  - Remote
  - Host
  - 远程模块
  - 主机应用
highlight: Host 是消费远程模块的应用，Remote 是提供模块的应用，一个应用可以同时是 Host 和 Remote。
order: 798
---

## 问题 1：基本概念

### Host（主机/消费者）

**Host 是消费远程模块的应用**，它从 Remote 加载模块。

```javascript
// Host 配置
new ModuleFederationPlugin({
  name: "host",
  remotes: {
    // 声明要消费的远程应用
    remoteApp: "remoteApp@http://localhost:3001/remoteEntry.js",
  },
});
```

### Remote（远程/提供者）

**Remote 是提供模块的应用**，它暴露模块供 Host 使用。

```javascript
// Remote 配置
new ModuleFederationPlugin({
  name: "remoteApp",
  filename: "remoteEntry.js",
  exposes: {
    // 声明要暴露的模块
    "./Button": "./src/components/Button",
  },
});
```

---

## 问题 2：角色关系

```
Remote App (提供者)
    │
    │ 暴露 Button 组件
    ↓
remoteEntry.js
    │
    │ 通过 URL 加载
    ↓
Host App (消费者)
    │
    │ import('remoteApp/Button')
    ↓
使用 Button 组件
```

---

## 问题 3：双向关系

**一个应用可以同时是 Host 和 Remote**：

```javascript
// App A：既是 Host 也是 Remote
new ModuleFederationPlugin({
  name: "appA",
  filename: "remoteEntry.js",
  // 作为 Remote：暴露模块
  exposes: {
    "./Header": "./src/Header",
  },
  // 作为 Host：消费模块
  remotes: {
    appB: "appB@http://localhost:3002/remoteEntry.js",
  },
});
```

这样 App A 和 App B 可以互相使用对方的模块。

---

## 问题 4：配置详解

### Remote 配置

```javascript
new ModuleFederationPlugin({
  // 应用名称（全局唯一）
  name: "remoteApp",

  // 入口文件名
  filename: "remoteEntry.js",

  // 暴露的模块
  exposes: {
    "./Button": "./src/components/Button",
    "./utils": "./src/utils/index",
  },

  // 共享依赖
  shared: ["react", "react-dom"],
});
```

### Host 配置

```javascript
new ModuleFederationPlugin({
  name: "hostApp",

  // 远程应用配置
  remotes: {
    // 格式：name@url
    remoteApp: "remoteApp@http://localhost:3001/remoteEntry.js",

    // 也可以使用变量
    remoteApp: `remoteApp@${process.env.REMOTE_URL}/remoteEntry.js`,
  },

  shared: ["react", "react-dom"],
});
```

---

## 问题 5：使用远程模块

```javascript
// 在 Host 中使用 Remote 的模块
import React, { Suspense, lazy } from "react";

// 动态导入远程模块
const RemoteButton = lazy(() => import("remoteApp/Button"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoteButton onClick={() => alert("clicked")}>Click me</RemoteButton>
    </Suspense>
  );
}
```

---

## 问题 6：动态 Remote

```javascript
// 运行时动态加载 Remote
const loadRemote = async (url) => {
  await __webpack_init_sharing__("default");
  const container = await import(url);
  await container.init(__webpack_share_scopes__.default);
  return container;
};

// 使用
const remoteApp = await loadRemote("http://localhost:3001/remoteEntry.js");
const Button = await remoteApp.get("./Button");
```

## 延伸阅读

- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Dynamic Remotes](https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers)
