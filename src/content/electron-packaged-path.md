---
title: 为什么 packaged app 无法读取相对路径？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  分析 Electron 打包后相对路径失效的原因，以及如何正确处理
  开发和生产环境下的路径问题。
tags:
  - Electron
  - 打包
  - 路径问题
  - asar
estimatedTime: 10 分钟
keywords:
  - electron 路径问题
  - 打包后路径
  - 相对路径失效
highlight: 理解 Electron 打包后的文件结构变化，正确处理各种路径场景。
order: 353
---

## 问题 1：为什么相对路径在打包后失效？

打包后，文件结构发生变化：

**开发时：**
```
project/
├── main.js
├── resources/
│   └── config.json
└── package.json
```

**打包后：**
```
MyApp.app/
└── Contents/
    └── Resources/
        ├── app.asar        <- 代码在这里
        └── config.json     <- 资源在外面
```

`__dirname` 在 asar 内部，相对路径计算基于 asar 位置，导致路径不正确。

---

## 问题 2：如何正确获取路径？

```javascript
const { app } = require('electron')
const path = require('path')

// 应用安装目录
const appPath = app.getAppPath()
console.log('App Path:', appPath)

// 可执行文件所在目录
const exePath = path.dirname(app.getPath('exe'))
console.log('Exe Path:', exePath)

// 资源目录
const resourcesPath = process.resourcesPath
console.log('Resources Path:', resourcesPath)

// 判断是否打包
const isPacked = app.isPackaged
console.log('Is Packaged:', isPacked)
```

---

## 问题 3：如何处理不同环境的路径？

```javascript
const path = require('path')
const { app } = require('electron')

function getResourcePath(relativePath) {
  if (app.isPackaged) {
    // 生产环境：从 resources 目录读取
    return path.join(process.resourcesPath, relativePath)
  } else {
    // 开发环境：从项目目录读取
    return path.join(__dirname, relativePath)
  }
}

// 使用
const configPath = getResourcePath('config.json')
const iconPath = getResourcePath('assets/icon.png')
```

---

## 问题 4：如何配置 electron-builder 处理资源？

```yaml
# electron-builder.yml
extraResources:
  - from: "resources/"
    to: ""
    filter:
      - "**/*"

# 或针对特定文件
extraResources:
  - "config.json"
  - from: "assets/"
    to: "assets/"

# 不打包进 asar 的文件
asarUnpack:
  - "**/*.node"
  - "**/native-module/**"
```

---

## 问题 5：常见路径 API 总结

```javascript
const { app } = require('electron')

const paths = {
  // 应用目录（asar 内）
  appPath: app.getAppPath(),
  
  // 用户数据目录（可写）
  userData: app.getPath('userData'),
  
  // 可执行文件路径
  exe: app.getPath('exe'),
  
  // 临时目录
  temp: app.getPath('temp'),
  
  // 桌面
  desktop: app.getPath('desktop'),
  
  // 文档目录
  documents: app.getPath('documents'),
  
  // 资源目录
  resources: process.resourcesPath
}

console.log(paths)
```

---

## 问题 6：注意 asar 内文件的特殊性

```javascript
// asar 内的文件不能用原生模块直接访问
// ❌ 不工作
const data = someNativeModule.readFile(path.join(app.getAppPath(), 'file'))

// ✅ 解压到临时目录后访问
const fs = require('fs')
const content = fs.readFileSync(path.join(app.getAppPath(), 'file'))
const tempPath = path.join(app.getPath('temp'), 'file')
fs.writeFileSync(tempPath, content)
someNativeModule.readFile(tempPath)
```

---

## 延伸阅读

- [Electron app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
- [electron-builder 资源配置](https://www.electron.build/configuration/contents#extraresources)
- [asar 文档](https://github.com/electron/asar)
