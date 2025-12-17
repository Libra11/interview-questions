---
title: 如何使用 asar + obfuscation 混淆？
category: Electron
difficulty: 中级
updatedAt: 2025-12-17
summary: >-
  详细介绍结合 asar 打包和代码混淆技术保护 Electron 应用源码的具体实践。
tags:
  - Electron
  - asar
  - 代码混淆
  - 源码保护
estimatedTime: 12 分钟
keywords:
  - electron asar 混淆
  - 代码保护
  - obfuscation
highlight: 掌握 asar 打包与代码混淆的结合使用，提升源码保护效果。
order: 95
---

## 问题 1：标准的保护流程是什么？

```
源代码 → 代码混淆 → 打包构建 → asar 打包 → 分发
```

---

## 问题 2：如何配置 Webpack 混淆？

```javascript
// webpack.config.js
const JavaScriptObfuscator = require('webpack-obfuscator')

module.exports = {
  mode: 'production',
  entry: './src/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new JavaScriptObfuscator({
      // 基础混淆
      compact: true,
      identifierNamesGenerator: 'hexadecimal',
      
      // 字符串保护
      stringArray: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayThreshold: 0.75,
      stringArrayEncoding: ['base64'],
      
      // 控制流混淆
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      
      // 调试保护
      debugProtection: false, // 生产环境可开启
      
      // 自我保护
      selfDefending: true
    }, [])
  ]
}
```

---

## 问题 3：如何配置 electron-builder 使用 asar？

```yaml
# electron-builder.yml
asar: true
asarUnpack:
  - "**/*.node"  # 原生模块不打包进 asar
  - "**/node_modules/sharp/**"

files:
  - "dist/**/*"
  - "node_modules/**/*"
  - "!node_modules/**/test/**"
  - "!**/*.map"  # 排除 source map
```

---

## 问题 4：如何添加额外的 asar 保护？

```javascript
// scripts/protect-asar.js
const crypto = require('crypto')
const fs = require('fs')

// 对 asar 文件进行签名
function signAsar(asarPath, privateKey) {
  const content = fs.readFileSync(asarPath)
  const sign = crypto.createSign('SHA256')
  sign.update(content)
  const signature = sign.sign(privateKey, 'hex')
  
  // 保存签名
  fs.writeFileSync(asarPath + '.sig', signature)
}

// 运行时验证签名
function verifyAsar(asarPath, publicKey) {
  const content = fs.readFileSync(asarPath)
  const signature = fs.readFileSync(asarPath + '.sig', 'utf-8')
  
  const verify = crypto.createVerify('SHA256')
  verify.update(content)
  
  return verify.verify(publicKey, signature, 'hex')
}
```

---

## 问题 5：完整的构建脚本示例

```javascript
// scripts/build.js
const { execSync } = require('child_process')

async function build() {
  console.log('1. 清理构建目录')
  execSync('rm -rf dist')
  
  console.log('2. 编译 TypeScript')
  execSync('tsc')
  
  console.log('3. 打包并混淆')
  execSync('webpack --config webpack.prod.js')
  
  console.log('4. 构建 Electron 应用')
  execSync('electron-builder build')
  
  console.log('构建完成!')
}

build().catch(console.error)
```

---

## 延伸阅读

- [electron-builder asar 配置](https://www.electron.build/configuration/asar)
- [webpack-obfuscator 文档](https://github.com/javascript-obfuscator/webpack-obfuscator)
