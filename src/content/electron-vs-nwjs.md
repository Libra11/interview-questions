---
title: Electron 和 NW.js 的区别？
category: Electron
difficulty: 中级
updatedAt: 2025-12-11
summary: >-
  对比 Electron 和 NW.js 两个主流桌面应用框架的架构差异、入口方式、安全模型等核心区别。
tags:
  - Electron
  - NW.js
  - 框架对比
  - 桌面应用
estimatedTime: 10 分钟
keywords:
  - Electron vs NW.js
  - 框架选择
  - 架构对比
highlight: Electron 以 JavaScript 为入口，NW.js 以 HTML 为入口，两者架构理念不同
order: 4
---

## 问题 1：NW.js 是什么？

NW.js（原名 node-webkit）是另一个使用 Web 技术构建桌面应用的框架，由 Intel 开源。它比 Electron 出现得更早。

两者的目标相同：让 Web 开发者能够构建跨平台桌面应用。

---

## 问题 2：两者的核心区别是什么？

### 1. 应用入口不同

**Electron**：以 JavaScript 文件为入口

```json
// package.json
{
  "main": "main.js" // JavaScript 入口
}
```

```javascript
// main.js
const { app, BrowserWindow } = require("electron");

app.whenReady().then(() => {
  const win = new BrowserWindow();
  win.loadFile("index.html");
});
```

**NW.js**：以 HTML 文件为入口

```json
// package.json
{
  "main": "index.html" // HTML 入口
}
```

```html
<!-- index.html 直接作为应用入口 -->
<!DOCTYPE html>
<html>
  <body>
    <script>
      // 可以直接使用 Node.js API
      const fs = require("fs");
    </script>
  </body>
</html>
```

### 2. 进程模型不同

**Electron**：严格的多进程架构

```
主进程 (1个)
    │
    ├── 渲染进程 A (窗口1)
    ├── 渲染进程 B (窗口2)
    └── 渲染进程 C (窗口3)
```

**NW.js**：混合上下文模式

```
所有窗口共享同一个 Node.js 上下文
    │
    ├── 窗口 1
    ├── 窗口 2
    └── 窗口 3
```

### 3. Node.js 集成方式不同

**Electron**：

- 主进程完整 Node.js 访问
- 渲染进程默认隔离，需要通过 preload 暴露

```javascript
// Electron 渲染进程默认不能直接用 Node
// 需要通过 contextBridge 暴露
contextBridge.exposeInMainWorld("api", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
});
```

**NW.js**：

- 所有窗口都可以直接访问 Node.js API

```html
<!-- NW.js 中可以直接使用 -->
<script>
  const fs = require("fs");
  const content = fs.readFileSync("./file.txt", "utf-8");
</script>
```

---

## 问题 3：安全模型有什么区别？

### Electron 的安全设计

Electron 采用更严格的安全模型：

```javascript
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 默认禁用
    contextIsolation: true, // 默认启用
    sandbox: true, // 沙箱模式
    webSecurity: true, // Web 安全策略
  },
});
```

渲染进程被视为"不可信"环境，必须通过受控的 IPC 通道访问系统资源。

### NW.js 的安全设计

NW.js 默认允许渲染进程访问 Node.js，安全边界相对模糊：

```html
<!-- 任何加载的页面都能访问 Node.js -->
<script>
  // 如果加载了恶意脚本，它也能执行系统命令
  require("child_process").exec("rm -rf /");
</script>
```

---

## 问题 4：如何选择？

| 考虑因素 | Electron                | NW.js               |
| -------- | ----------------------- | ------------------- |
| 社区生态 | ⭐⭐⭐⭐⭐ 更活跃       | ⭐⭐⭐ 较小         |
| 安全性   | ⭐⭐⭐⭐⭐ 更严格       | ⭐⭐⭐ 较宽松       |
| 学习曲线 | ⭐⭐⭐ 需要理解进程模型 | ⭐⭐⭐⭐ 更简单直接 |
| 迁移成本 | 需要重构                | Web 应用可直接运行  |
| 代表应用 | VS Code, Slack          | 微信开发者工具      |

**选择 Electron**：

- 需要更好的安全性
- 项目规模较大
- 需要活跃的社区支持

**选择 NW.js**：

- 快速将现有 Web 应用打包成桌面应用
- 项目较简单，不需要复杂的进程管理

## 延伸阅读

- [Electron vs NW.js 官方对比](https://www.electronjs.org/docs/latest/development/electron-vs-nwjs)
- [NW.js 官方文档](https://nwjs.io/)
- [Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security)
