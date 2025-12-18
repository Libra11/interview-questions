---
title: 如何避免 JavaScript 源码被轻易查看？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  介绍保护 Electron 应用 JavaScript 源码的多种方法，包括代码混淆、
  asar 打包、V8 快照以及安全建议。
tags:
  - Electron
  - 源码保护
  - 代码混淆
  - 安全
estimatedTime: 12 分钟
keywords:
  - electron 源码保护
  - 代码混淆
  - asar 加密
highlight: 了解 Electron 源码保护的方法和局限性，合理选择保护策略。
order: 298
---

## 问题 1：为什么 Electron 源码容易被查看？

Electron 应用默认将 JavaScript 代码打包为明文：

- `app.asar` 可以直接解压
- 渲染进程代码可通过 DevTools 查看
- 主进程代码在 resources 目录中

**重要提醒**：完全保护客户端代码是不可能的，只能增加逆向成本。

---

## 问题 2：如何使用代码混淆？

```javascript
// 使用 JavaScript Obfuscator
const JavaScriptObfuscator = require('javascript-obfuscator')

const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, {
  // 压缩代码
  compact: true,
  // 控制流扁平化
  controlFlowFlattening: true,
  // 死代码注入
  deadCodeInjection: true,
  // 调试保护
  debugProtection: true,
  // 禁用控制台
  disableConsoleOutput: true,
  // 字符串数组加密
  stringArray: true,
  stringArrayEncoding: ['base64'],
  // 自我防护
  selfDefending: true
})
```

Webpack 配置：

```javascript
// webpack.config.js
const WebpackObfuscator = require('webpack-obfuscator')

module.exports = {
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true
    }, ['excluded_bundle.js'])
  ]
}
```

---

## 问题 3：如何加密 asar 文件？

使用 `asarmor` 或自定义加密：

```javascript
// 自定义 asar 加密
const crypto = require('crypto')
const asar = require('asar')

// 加密
function encryptAsar(asarPath, key) {
  const content = fs.readFileSync(asarPath)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()])
  fs.writeFileSync(asarPath + '.encrypted', encrypted)
}

// 运行时解密（需要修改 Electron 启动逻辑）
```

**注意**：密钥存储是难点，解密逻辑也可能被逆向。

---

## 问题 4：使用 V8 字节码编译

将 JavaScript 编译为 V8 字节码：

```javascript
// 使用 bytenode
const bytenode = require('bytenode')

// 编译
bytenode.compileFile('main.js', 'main.jsc')

// 运行
require('bytenode')
require('./main.jsc')
```

---

## 问题 5：综合保护策略

```javascript
// 多层保护
module.exports = {
  // 1. 代码混淆
  obfuscation: true,
  
  // 2. 敏感逻辑放服务端
  apiValidation: true,
  
  // 3. 禁用开发者工具
  disableDevTools: process.env.NODE_ENV === 'production',
  
  // 4. 运行时检测
  integrityCheck: true
}

// 禁用 DevTools
if (process.env.NODE_ENV === 'production') {
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools()
  })
}
```

---

## 延伸阅读

- [JavaScript Obfuscator](https://obfuscator.io/)
- [bytenode 文档](https://github.com/bytenode/bytenode)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
