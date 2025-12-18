---
title: 如何调试主进程？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  全面介绍 Electron 主进程的调试方法，包括使用 VSCode 调试、Chrome DevTools 远程调试、
  命令行调试参数以及日志调试技巧。
tags:
  - Electron
  - 调试
  - 主进程
  - DevTools
estimatedTime: 15 分钟
keywords:
  - electron 调试主进程
  - node inspect
  - vscode electron 调试
highlight: 掌握多种主进程调试方法，提升 Electron 开发效率。
order: 278
---

## 问题 1：使用 VSCode 调试主进程

VSCode 是调试 Electron 主进程最常用的工具。需要配置 `.vscode/launch.json` 文件：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [
        ".",
        "--remote-debugging-port=9222"
      ],
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "console": "integratedTerminal",
      "protocol": "inspector"
    }
  ]
}
```

如果使用 TypeScript 或需要编译：

```json
{
  "name": "Debug Main (TypeScript)",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/src/main/index.ts",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "runtimeArgs": [
    "--remote-debugging-port=9222"
  ],
  "preLaunchTask": "build-main",
  "sourceMaps": true,
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

---

## 问题 2：使用 Chrome DevTools 远程调试

可以使用 Chrome DevTools 来调试主进程：

```bash
# 启动时添加调试参数
electron --inspect=5858 .

# 或者在代码入口处暂停
electron --inspect-brk=5858 .
```

然后在 Chrome 浏览器中：

1. 打开 `chrome://inspect`
2. 点击 "Configure" 添加 `localhost:5858`
3. 在 "Remote Target" 中找到 Electron 进程
4. 点击 "inspect" 打开 DevTools

也可以在代码中动态启用调试：

```javascript
// main.js
const { app } = require('electron')

// 在开发环境启用调试
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('inspect', '5858')
}
```

---

## 问题 3：使用 electron-devtools-installer

这个工具可以帮助安装各类 DevTools 扩展：

```bash
npm install electron-devtools-installer --save-dev
```

```javascript
const { app } = require('electron')

if (process.env.NODE_ENV === 'development') {
  app.whenReady().then(async () => {
    const { default: installExtension, REACT_DEVELOPER_TOOLS, VUEJS_DEVTOOLS } = 
      await import('electron-devtools-installer')
    
    try {
      // 安装 React DevTools
      await installExtension(REACT_DEVELOPER_TOOLS)
      console.log('React DevTools 安装成功')
      
      // 或安装 Vue DevTools
      // await installExtension(VUEJS_DEVTOOLS)
    } catch (err) {
      console.error('DevTools 安装失败:', err)
    }
  })
}
```

---

## 问题 4：使用日志进行调试

在生产环境或复杂场景下，日志调试非常有用：

```javascript
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

class Logger {
  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'logs')
    this.ensureLogDir()
  }
  
  ensureLogDir() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true })
    }
  }
  
  getLogFile() {
    const date = new Date().toISOString().split('T')[0]
    return path.join(this.logPath, `main-${date}.log`)
  }
  
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ')
    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`
  }
  
  log(level, message, ...args) {
    const formatted = this.formatMessage(level, message, ...args)
    
    // 输出到控制台
    console.log(formatted)
    
    // 写入文件
    fs.appendFileSync(this.getLogFile(), formatted + '\n')
  }
  
  info(message, ...args) {
    this.log('INFO', message, ...args)
  }
  
  warn(message, ...args) {
    this.log('WARN', message, ...args)
  }
  
  error(message, ...args) {
    this.log('ERROR', message, ...args)
  }
  
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, ...args)
    }
  }
}

const logger = new Logger()

// 使用示例
logger.info('应用启动')
logger.error('发生错误', { code: 500, message: 'Internal Error' })
```

推荐使用 `electron-log` 库：

```bash
npm install electron-log
```

```javascript
const log = require('electron-log')

// 配置日志
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

// 自动记录未捕获的异常
log.catchErrors()

// 使用
log.info('应用启动')
log.error('发生错误', new Error('test'))
```

---

## 问题 5：调试崩溃和未捕获异常

处理主进程中的崩溃和异常：

```javascript
const { app, dialog } = require('electron')
const log = require('electron-log')

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error)
  
  dialog.showErrorBox('应用错误', 
    `发生未预期的错误:\n\n${error.message}\n\n请重启应用。`
  )
  
  // 可选：收集错误信息后退出
  app.exit(1)
})

// 监听未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的 Promise 拒绝:', reason)
})

// 监听渲染进程崩溃
mainWindow.webContents.on('render-process-gone', (event, details) => {
  log.error('渲染进程崩溃:', details)
  
  // 可选：重新加载页面
  if (details.reason === 'crashed') {
    mainWindow.reload()
  }
})

// 监听 GPU 进程崩溃
app.on('gpu-process-crashed', (event, killed) => {
  log.error('GPU 进程崩溃:', { killed })
})
```

---

## 问题 6：使用 Debugger 语句

可以在代码中直接使用 `debugger` 语句：

```javascript
function complexFunction(data) {
  // 处理一些数据
  const processed = transformData(data)
  
  // 在这里暂停调试
  debugger
  
  // 继续执行
  return saveData(processed)
}
```

这需要配合 `--inspect-brk` 参数使用，调试器会在遇到 `debugger` 语句时暂停。

---

## 问题 7：多进程调试配置

同时调试主进程和渲染进程：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [".", "--remote-debugging-port=9222"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}",
      "sourceMaps": true
    }
  ],
  "compounds": [
    {
      "name": "Debug All",
      "configurations": ["Debug Main Process", "Debug Renderer Process"]
    }
  ]
}
```

---

## 延伸阅读

- [Electron 调试官方指南](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)
- [VSCode Node.js 调试文档](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [electron-log 文档](https://github.com/megahertz/electron-log)
- [Chrome DevTools 远程调试](https://developer.chrome.com/docs/devtools/remote-debugging/)
