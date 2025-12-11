---
title: 如何防止 asar 文件被反编译？
category: Electron
difficulty: 高级
updatedAt: 2025-12-11
summary: >-
  介绍保护 Electron 应用源码的方法，包括 ASAR 加密、代码混淆和其他保护策略。
tags:
  - Electron
  - ASAR
  - 源码保护
  - 安全
estimatedTime: 12 分钟
keywords:
  - ASAR加密
  - 源码保护
  - 代码混淆
highlight: ASAR 本身不提供加密，需要结合代码混淆、字节码编译等手段保护源码
order: 61
---

## 问题 1：ASAR 的保护程度

### 现实情况

```bash
# ASAR 可以被任何人轻松解包
npx asar extract app.asar ./source

# 解包后可以看到完整源码
# ASAR 只是归档，不是加密
```

---

## 问题 2：代码混淆

### 使用 JavaScript Obfuscator

```bash
npm install javascript-obfuscator --save-dev
```

```javascript
// obfuscate.js
const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");

const code = fs.readFileSync("dist/main.js", "utf8");

const obfuscated = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
});

fs.writeFileSync("dist/main.js", obfuscated.getObfuscatedCode());
```

### Webpack 集成

```javascript
// webpack.config.js
const WebpackObfuscator = require("webpack-obfuscator");

module.exports = {
  plugins: [
    new WebpackObfuscator(
      {
        rotateStringArray: true,
      },
      ["excluded_bundle.js"]
    ),
  ],
};
```

---

## 问题 3：编译为字节码

### 使用 bytenode

```bash
npm install bytenode --save-dev
```

```javascript
// compile.js
const bytenode = require("bytenode");
const fs = require("fs");

// 编译为 .jsc 字节码
bytenode.compileFile("dist/main.js", "dist/main.jsc");

// 删除源文件
fs.unlinkSync("dist/main.js");
```

### 加载字节码

```javascript
// main.js (入口文件)
require("bytenode");
require("./main.jsc");
```

---

## 问题 4：ASAR 加密方案

### 使用 asarmor

```bash
npm install asarmor --save-dev
```

```javascript
// 打包后处理
const asarmor = require("asarmor");

async function protect() {
  const archive = await asarmor.open("dist/app.asar");

  // 添加垃圾数据干扰解包
  archive.patch(asarmor.createBloatPatch(1024 * 1024));

  // 添加完整性检查
  archive.patch(asarmor.createTrashedHeaderPatch());

  await archive.write("dist/app.asar");
}
```

### 自定义加密（高级）

```javascript
// 需要修改 Electron 源码或使用 fork
// 在 ASAR 读取时解密
// 复杂度高，维护成本大
```

---

## 问题 5：综合保护策略

### 多层防护

```javascript
// 1. 代码混淆
// 2. 字节码编译
// 3. 关键逻辑放服务端
// 4. 使用原生模块

// 敏感逻辑示例
// ❌ 不要在客户端
const apiKey = "secret-key";

// ✅ 从服务端获取
const apiKey = await fetchFromServer("/api/key");
```

### 接受现实

```
完全防止反编译是不可能的：
- 代码最终要在用户机器运行
- 有足够时间和技术都能破解
- 重点保护敏感数据和业务逻辑
- 核心算法考虑放在服务端
```

## 延伸阅读

- [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)
- [bytenode](https://github.com/bytenode/bytenode)
- [asarmor](https://github.com/nicedoc/asarmor)
