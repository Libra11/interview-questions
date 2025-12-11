---
title: app.asar 是什么？
category: Electron
difficulty: 入门
updatedAt: 2025-12-11
summary: >-
  介绍 Electron 的 ASAR 归档格式，包括其作用、优缺点和使用方法。
tags:
  - Electron
  - ASAR
  - 打包
  - 应用分发
estimatedTime: 10 分钟
keywords:
  - ASAR
  - 归档格式
  - 应用打包
highlight: ASAR 是 Electron 的归档格式，将应用文件打包成单个文件以提高性能和保护源码
order: 60
---

## 问题 1：什么是 ASAR？

### 定义

```
ASAR = Atom Shell Archive

特点：
├── 类似 tar 的归档格式
├── 将多个文件打包成单个文件
├── 支持随机访问（无需解压）
├── Electron 原生支持读取
└── 提供基本的源码保护
```

### 文件结构

```
打包前：
app/
├── main.js
├── preload.js
├── renderer/
│   ├── index.html
│   └── app.js
└── package.json

打包后：
app.asar  (单个文件)
```

---

## 问题 2：ASAR 的优点

### 性能提升

```javascript
// 不使用 ASAR：
// 读取文件需要多次系统调用
// Windows 上大量小文件会很慢

// 使用 ASAR：
// 单个文件，减少系统调用
// 文件索引在内存中，读取更快
```

### 源码保护

```javascript
// ASAR 提供基本保护
// 用户不能直接看到源文件
// 但不是加密，可以被解包

// 解包命令（任何人都可以）
// npx asar extract app.asar ./extracted
```

### 避免路径问题

```javascript
// Windows 路径长度限制 260 字符
// node_modules 嵌套可能超出限制
// ASAR 将所有文件打包，避免此问题
```

---

## 问题 3：如何配置 ASAR？

### 启用 ASAR（默认）

```json
// electron-builder.json
{
  "asar": true
}
```

### 禁用 ASAR

```json
{
  "asar": false
}
```

### 部分解包

```json
{
  "asar": true,
  "asarUnpack": ["**/*.node", "**/ffmpeg*", "resources/**"]
}
```

---

## 问题 4：ASAR 的限制

### 原生模块

```javascript
// 原生 .node 模块不能在 ASAR 中运行
// 需要解包
{
  "asarUnpack": ["**/*.node"]
}
```

### 子进程

```javascript
// 子进程无法直接执行 ASAR 中的文件
const { fork } = require("child_process");

// ❌ 不工作
fork("app.asar/worker.js");

// ✅ 需要解包或使用其他方式
```

### 某些 Node API

```javascript
// 这些 API 不支持 ASAR：
// - fs.access (同步检查)
// - child_process.execFile
// - 某些第三方库
```

---

## 问题 5：手动操作 ASAR

### 安装工具

```bash
npm install -g asar
```

### 打包

```bash
asar pack ./app app.asar
```

### 解包

```bash
asar extract app.asar ./extracted
```

### 列出内容

```bash
asar list app.asar
```

### 在代码中读取

```javascript
// Electron 自动支持读取 ASAR
const fs = require("fs");

// 直接读取 ASAR 中的文件
const content = fs.readFileSync("app.asar/config.json");

// 获取真实路径（如果需要）
const path = require("path");
const realPath = path.join(process.resourcesPath, "app.asar");
```

## 延伸阅读

- [ASAR 格式说明](https://github.com/electron/asar)
- [Electron ASAR 文档](https://www.electronjs.org/docs/latest/tutorial/asar-archives)
- [Electron Builder ASAR 配置](https://www.electron.build/configuration/configuration#asar)
