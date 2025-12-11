---
title: 为什么 Electron 可以使用 Node.js API？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  解析 Electron 如何将 Node.js 运行时集成到应用中，理解 Chromium 和 Node.js 事件循环的整合机制。
tags:
  - Electron
  - Node.js
  - 事件循环
  - 运行时
estimatedTime: 10 分钟
keywords:
  - Node.js 集成
  - 事件循环
  - libuv
highlight: Electron 通过整合 Chromium 和 Node.js 的事件循环实现了两者的无缝结合
order: 3
---

## 问题 1：Electron 是如何集成 Node.js 的？

Electron 并不是简单地在浏览器中"模拟" Node.js，而是真正将 Node.js 运行时嵌入到了应用中。

### 架构层面

```
┌────────────────────────────────────┐
│           Electron 应用            │
├────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ │
│  │   Chromium   │ │   Node.js    │ │
│  │   (V8 引擎)   │ │   (V8 引擎)  │ │
│  └──────────────┘ └──────────────┘ │
│           │              │         │
│           └──────┬───────┘         │
│                  ▼                 │
│         共享同一个 V8 实例          │
└────────────────────────────────────┘
```

关键点：Chromium 和 Node.js 都使用 V8 引擎执行 JavaScript，Electron 让它们共享同一个 V8 实例。

---

## 问题 2：事件循环是如何整合的？

这是 Electron 最核心的技术挑战之一。Chromium 和 Node.js 各自有独立的事件循环：

- **Chromium**：使用 MessageLoop 处理 UI 事件
- **Node.js**：使用 libuv 处理 I/O 事件

### 整合方案

Electron 采用了轮询的方式来整合两个事件循环：

```
┌─────────────────────────────────────────┐
│            Electron 事件循环             │
│                                         │
│   ┌─────────┐         ┌─────────┐      │
│   │Chromium │  轮询   │ Node.js │      │
│   │MessageLoop│◄────►│  libuv  │      │
│   └─────────┘         └─────────┘      │
│                                         │
│   1. 检查 Chromium 是否有待处理事件      │
│   2. 检查 Node.js 是否有待处理事件       │
│   3. 执行回调                           │
│   4. 重复                               │
└─────────────────────────────────────────┘
```

这意味着在 Electron 中，你可以同时使用：

```javascript
// Web API
setTimeout(() => console.log("Web timer"), 100);
fetch("/api/data");

// Node.js API
const fs = require("fs");
fs.readFile("/path/to/file", (err, data) => {
  console.log("File read complete");
});

// 两者的回调都能正常执行
```

---

## 问题 3：主进程和渲染进程的 Node.js 访问有何不同？

### 主进程

主进程天然运行在 Node.js 环境中，可以无限制地使用所有 Node.js API：

```javascript
// main.js - 完整的 Node.js 能力
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// 甚至可以使用原生模块
const sqlite3 = require("sqlite3");
```

### 渲染进程

出于安全考虑，渲染进程默认禁用了 Node.js 集成：

```javascript
// 创建窗口时的默认配置
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 默认禁用
    contextIsolation: true, // 默认启用
  },
});
```

如果启用 `nodeIntegration`（不推荐），渲染进程也能使用 Node.js：

```javascript
// ⚠️ 不推荐的做法
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
});

// 渲染进程中
const fs = require("fs"); // 可以使用，但有安全风险
```

---

## 问题 4：这种集成带来了什么能力？

### 突破浏览器沙箱限制

普通 Web 应用受限于浏览器沙箱，而 Electron 应用可以：

```javascript
// 读写本地文件
const fs = require("fs");
fs.writeFileSync("/path/to/file", "content");

// 执行系统命令
const { exec } = require("child_process");
exec("ls -la", (err, stdout) => console.log(stdout));

// 访问系统信息
const os = require("os");
console.log(os.platform(), os.cpus());

// 使用原生 C++ 模块
const addon = require("./native-addon.node");
```

### 使用 npm 生态

可以直接使用 npm 上的海量包：

```javascript
const axios = require("axios");
const lodash = require("lodash");
const moment = require("moment");
```

## 延伸阅读

- [Electron 内部原理](https://www.electronjs.org/docs/latest/development/electron-vs-nwjs)
- [Node.js 事件循环](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
- [libuv 文档](http://docs.libuv.org/)
