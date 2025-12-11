---
title: 什么是 Electron？它的核心组成部分是什么？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 的基本概念和核心组成部分，理解它如何将 Chromium 和 Node.js 结合起来构建跨平台桌面应用。
tags:
  - Electron
  - 桌面应用
  - Chromium
  - Node.js
estimatedTime: 10 分钟
keywords:
  - Electron
  - 跨平台
  - 桌面应用开发
highlight: Electron 是一个使用 Web 技术构建跨平台桌面应用的框架
order: 1
---

## 问题 1：什么是 Electron？

Electron 是一个开源框架，允许开发者使用 HTML、CSS 和 JavaScript 等 Web 技术来构建跨平台的桌面应用程序。

它最初由 GitHub 开发，用于构建 Atom 编辑器，后来成为独立项目。现在很多知名应用都基于 Electron 构建，比如 VS Code、Slack、Discord 等。

**核心理念**：一套代码，三端运行（Windows、macOS、Linux）。

---

## 问题 2：Electron 的核心组成部分是什么？

Electron 由三个核心部分组成：

### 1. Chromium

Chromium 是 Chrome 浏览器的开源版本，负责渲染 UI 界面。它提供了：

- 完整的 Web 标准支持
- V8 JavaScript 引擎
- 强大的渲染能力

### 2. Node.js

Node.js 提供了访问操作系统底层能力的接口：

- 文件系统操作
- 网络请求
- 子进程管理
- 原生模块调用

### 3. Electron 自身 API

Electron 在 Chromium 和 Node.js 之上封装了一层原生桌面 API：

```javascript
// 创建原生窗口
const { BrowserWindow } = require('electron');
const win = new BrowserWindow({ width: 800, height: 600 });

// 系统托盘
const { Tray } = require('electron');
const tray = new Tray('/path/to/icon');

// 原生菜单
const { Menu } = require('electron');
const menu = Menu.buildFromTemplate([...]);

// 系统对话框
const { dialog } = require('electron');
dialog.showOpenDialog({ properties: ['openFile'] });
```

---

## 问题 3：Electron 的架构是怎样的？

Electron 采用多进程架构，类似于 Chrome 浏览器：

```
┌─────────────────────────────────────────┐
│              主进程 (Main)               │
│  ┌─────────────────────────────────┐    │
│  │         Node.js 环境            │    │
│  │  - 窗口管理                      │    │
│  │  - 系统 API                      │    │
│  │  - 应用生命周期                   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
          │           │           │
          ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  渲染进程 1  │ │  渲染进程 2  │ │  渲染进程 3  │
│  (窗口 A)   │ │  (窗口 B)   │ │  (窗口 C)   │
│  Chromium  │ │  Chromium  │ │  Chromium  │
└─────────────┘ └─────────────┘ └─────────────┘
```

- **主进程**：只有一个，负责管理所有窗口和系统级操作
- **渲染进程**：每个窗口一个，负责渲染 Web 页面

这种架构保证了一个窗口崩溃不会影响其他窗口和主进程。

## 延伸阅读

- [Electron 官方文档](https://www.electronjs.org/docs/latest/)
- [Electron 快速入门](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- [Chromium 项目](https://www.chromium.org/)
- [Node.js 官方文档](https://nodejs.org/docs/latest/api/)
