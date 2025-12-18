---
title: Webpack tree-shaking 原理
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack tree-shaking 的实现原理。tree-shaking 通过静态分析消除未使用的代码，
  是减小打包体积的重要优化手段。
tags:
  - Webpack
  - tree-shaking
  - 代码优化
  - ES Module
estimatedTime: 24 分钟
keywords:
  - tree-shaking
  - 死代码消除
  - ES Module
  - sideEffects
highlight: tree-shaking 基于 ES Module 的静态结构特性消除未使用的代码
order: 493
---

## 问题 1：什么是 tree-shaking？

**tree-shaking 是消除 JavaScript 上下文中未引用代码（dead code）的过程**。

### 基本概念

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

// main.js
import { add } from './utils.js';

console.log(add(1, 2));

// 没有 tree-shaking：
// 打包后包含 add、subtract、multiply 三个函数

// 有 tree-shaking：
// 打包后只包含 add 函数
// subtract 和 multiply 被移除
```

---

## 问题 2：tree-shaking 的实现原理是什么？

**基于 ES Module 的静态结构分析**。

### ES Module 的静态特性

```javascript
// ✅ ES Module - 静态结构
import { add } from './utils.js';  // 编译时确定
export function multiply(a, b) {   // 编译时确定
  return a * b;
}

// ❌ CommonJS - 动态结构
const utils = require('./utils.js');  // 运行时确定
module.exports = {                     // 运行时确定
  multiply: (a, b) => a * b
};

// ES Module 的优势：
// 1. import/export 必须在顶层
// 2. 导入导出的模块名必须是字符串常量
// 3. 编译时就能确定模块依赖关系
```

### tree-shaking 流程

```
1. 标记阶段（Mark）
   ↓
   分析模块导入导出
   ↓
   标记被使用的导出
   ↓
2. 清除阶段（Sweep）
   ↓
   删除未被标记的代码
   ↓
3. 压缩阶段（Minify）
   ↓
   使用 Terser 等工具压缩
```

---

## 问题 3：如何配置 Webpack 启用 tree-shaking？

**设置 mode 为 production 或手动配置**。

### 自动启用（生产模式）

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',  // 自动启用 tree-shaking
  
  // production 模式会自动设置：
  // - optimization.usedExports: true
  // - optimization.minimize: true
  // - optimization.sideEffects: true
};
```

### 手动配置

```javascript
// webpack.config.js
module.exports = {
  mode: 'development',
  
  optimization: {
    // 标记未使用的导出
    usedExports: true,
    
    // 启用压缩（移除未使用的代码）
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,      // 移除死代码
            unused: true          // 移除未使用的变量
          }
        }
      })
    ],
    
    // 识别 package.json 中的 sideEffects
    sideEffects: true
  }
};
```

---

## 问题 4：sideEffects 是什么？

**sideEffects 用于标记模块是否有副作用**。

### 什么是副作用

```javascript
// 有副作用的代码
import './polyfill.js';  // 修改全局对象
import './styles.css';   // 注入样式

window.myGlobal = 'value';  // 修改全局变量

// 无副作用的代码
export function add(a, b) {
  return a + b;
}

export const PI = 3.14159;
```

### package.json 配置

```json
{
  "name": "my-library",
  "sideEffects": false  // 所有模块都无副作用
}
```

```json
{
  "name": "my-library",
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfill.js"
  ]  // 只有这些文件有副作用
}
```

### 示例

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// 有副作用
console.log('utils.js loaded');  // 副作用！

// main.js
import { add } from './utils.js';

// package.json: "sideEffects": false
// 结果：console.log 会被移除（错误！）

// package.json: "sideEffects": ["./utils.js"]
// 结果：console.log 会保留（正确）
```

---

## 问题 5：为什么 CommonJS 不支持 tree-shaking？

**CommonJS 是动态的，无法在编译时确定依赖关系**。

### CommonJS 的动态特性

```javascript
// 动态导入
const moduleName = Math.random() > 0.5 ? 'moduleA' : 'moduleB';
const module = require(`./${moduleName}`);  // 运行时才知道导入哪个模块

// 条件导入
if (condition) {
  const utils = require('./utils');  // 可能导入，也可能不导入
}

// 动态导出
if (process.env.NODE_ENV === 'production') {
  module.exports = prodVersion;
} else {
  module.exports = devVersion;
}

// 这些都无法在编译时分析
```

### ES Module vs CommonJS

```javascript
// ✅ ES Module - 可以 tree-shaking
import { add } from './utils.js';

// ❌ CommonJS - 不能 tree-shaking
const { add } = require('./utils.js');

// ❌ 混用 - 不能 tree-shaking
import utils from './utils.js';  // utils 是 CommonJS 模块
```

---

## 问题 6：如何验证 tree-shaking 效果？

**使用 webpack-bundle-analyzer 分析打包结果**。

### 安装分析工具

```bash
npm install --save-dev webpack-bundle-analyzer
```

### 配置

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true
    })
  ]
};
```

### 对比测试

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  return a / b;
}

// main.js
import { add } from './utils.js';
console.log(add(1, 2));

// 打包后查看 bundle-report.html
// 应该只包含 add 函数
// subtract、multiply、divide 应该被移除
```

---

## 问题 7：tree-shaking 的注意事项有哪些？

**Babel 配置、副作用、第三方库等**。

### Babel 配置

```javascript
// .babelrc
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false  // 保留 ES Module，不转换为 CommonJS
    }]
  ]
}

// ❌ 错误配置
{
  "presets": [
    ["@babel/preset-env", {
      "modules": "commonjs"  // 转换为 CommonJS，无法 tree-shaking
    }]
  ]
}
```

### 避免副作用

```javascript
// ❌ 有副作用 - 无法 tree-shaking
export function add(a, b) {
  console.log('add called');  // 副作用
  return a + b;
}

// ✅ 无副作用 - 可以 tree-shaking
export function add(a, b) {
  return a + b;
}

// 如果需要日志，使用条件编译
export function add(a, b) {
  if (process.env.NODE_ENV === 'development') {
    console.log('add called');
  }
  return a + b;
}
```

### 第三方库

```javascript
// ❌ 导入整个库
import _ from 'lodash';
_.add(1, 2);

// ✅ 按需导入
import add from 'lodash/add';
add(1, 2);

// ✅ 使用支持 tree-shaking 的版本
import { add } from 'lodash-es';
add(1, 2);
```

### CSS tree-shaking

```javascript
// webpack.config.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const glob = require('glob');
const path = require('path');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin(),
    new PurgeCSSPlugin({
      paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
      safelist: ['html', 'body']  // 保留的类名
    })
  ]
};
```

---

## 总结

**核心原理**：

### 1. 基础概念
- 消除未使用的代码
- 基于 ES Module
- 编译时静态分析

### 2. 实现原理
- 标记使用的导出
- 清除未使用的代码
- 压缩优化

### 3. 配置要点
- mode: 'production'
- usedExports: true
- minimize: true
- sideEffects 配置

### 4. 注意事项
- 使用 ES Module
- Babel 不转换模块
- 标记副作用
- 第三方库按需引入

### 5. 优化效果
- 减小包体积 30-50%
- 提升加载速度
- 改善用户体验

## 延伸阅读

- [Webpack tree-shaking 官方文档](https://webpack.js.org/guides/tree-shaking/)
- [sideEffects 详解](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
- [Terser 文档](https://terser.org/)
- [PurgeCSS 文档](https://purgecss.com/)
