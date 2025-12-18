---
title: 全面了解 Tree Shaking
category: Webpack
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 Tree Shaking 的工作原理、使用条件、配置方法和注意事项,掌握如何通过 Tree Shaking 优化打包体积,删除无用代码。
tags:
  - Webpack
  - Tree Shaking
  - 代码优化
  - ES Module
estimatedTime: 25 分钟
keywords:
  - Tree Shaking
  - 死代码消除
  - ES Module
  - 副作用
highlight: Tree Shaking 依赖 ES Module 的静态结构,能在构建时删除未使用的代码,显著减小打包体积
order: 51
---

## 问题 1:什么是 Tree Shaking?

### 基本概念

Tree Shaking 是一种通过静态分析消除 JavaScript 中未使用代码的技术,就像摇树让枯叶掉落一样。

```javascript
// utils.js - 导出多个函数
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

// main.js - 只使用一个函数
import { add } from './utils';
console.log(add(1, 2));

// 打包结果(启用 Tree Shaking)
// 只包含 add 函数,subtract 和 multiply 被删除
function add(a,b){return a+b}console.log(add(1,2));
```

### 为什么需要 Tree Shaking?

```javascript
// 场景:使用 lodash
import { debounce } from 'lodash';

// 没有 Tree Shaking
// 整个 lodash 库被打包 (70KB+)

// 有 Tree Shaking
// 只打包 debounce 函数 (2KB)

// 体积减少 97%!
```

---

## 问题 2:Tree Shaking 的工作原理是什么?

### 依赖 ES Module 的静态结构

```javascript
// ES Module (支持 Tree Shaking)
// 静态导入,编译时确定依赖关系
import { func } from './module';

// CommonJS (不支持 Tree Shaking)
// 动态导入,运行时才知道依赖
const { func } = require('./module');

// 为什么 ES Module 可以?
// 1. import/export 必须在顶层
// 2. 导入导出的模块名必须是字符串常量
// 3. 依赖关系在编译时就能确定
```

### 标记和删除过程

```javascript
// 第一步:标记(Mark)
// Webpack 分析代码,标记哪些导出被使用

// utils.js
export function add(a, b) { /* 被使用 ✓ */ }
export function subtract(a, b) { /* 未使用 ✗ */ }

// 第二步:删除(Sweep)
// 压缩工具(如 Terser)删除未使用的代码

// 最终输出
function add(a,b){return a+b}
// subtract 函数被完全删除
```

### Webpack 的实现

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // 自动启用 Tree Shaking
  
  optimization: {
    usedExports: true, // 标记未使用的导出
    minimize: true,    // 启用压缩(删除未使用代码)
    sideEffects: true, // 识别无副作用的模块
  }
};
```

---

## 问题 3:什么是副作用(Side Effects)?

### 副作用的定义

副作用是指模块在导入时会执行一些影响外部环境的代码,即使没有使用模块的导出。

```javascript
// 有副作用的模块
// polyfill.js
// 修改全局对象
Array.prototype.includes = function() { /* ... */ };

// 即使没有导出任何东西,导入时也会执行
import './polyfill';

// 有副作用的模块
// analytics.js
// 发送统计数据
fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify({ page: 'home' })
});

export function track() { /* ... */ }
```

### 声明无副作用

```json
// package.json
{
  "name": "my-library",
  "sideEffects": false  // 所有模块都无副作用
}

// 或者指定有副作用的文件
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfill.js"
  ]
}
```

### 副作用的影响

```javascript
// utils.js
export function add(a, b) {
  return a + b;
}

// 有副作用(修改全局)
window.myUtils = { add };

// main.js
// 没有使用 add 函数
import './utils';

// 如果 sideEffects: false
// utils.js 会被完全删除(包括副作用代码)

// 如果 sideEffects: true 或未声明
// utils.js 会被保留(因为可能有副作用)
```

---

## 问题 4:如何正确配置 Tree Shaking?

### 1. 使用 ES Module

```javascript
// ✅ 正确 - 使用 ES Module
import { debounce } from 'lodash-es';

// ❌ 错误 - 使用 CommonJS
const { debounce } = require('lodash');

// Babel 配置
// .babelrc
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false  // 不转换 ES Module
    }]
  ]
}
```

### 2. 配置 package.json

```json
{
  "name": "my-package",
  
  // 声明副作用
  "sideEffects": false,
  
  // 指定 ES Module 入口
  "module": "dist/index.esm.js",
  
  // 指定 CommonJS 入口
  "main": "dist/index.cjs.js"
}
```

### 3. Webpack 配置

```javascript
module.exports = {
  mode: 'production',
  
  optimization: {
    // 标记未使用的导出
    usedExports: true,
    
    // 识别 package.json 中的 sideEffects
    sideEffects: true,
    
    // 启用压缩
    minimize: true,
    
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            // 删除未使用的代码
            unused: true,
            // 删除 debugger
            drop_debugger: true,
          }
        }
      })
    ]
  }
};
```

---

## 问题 5:Tree Shaking 的常见问题

### 1. 为什么有些代码没被删除?

```javascript
// 问题 1: 使用了 CommonJS
const utils = require('./utils'); // ❌ 不支持 Tree Shaking

// 解决: 使用 ES Module
import * as utils from './utils'; // ✅

// 问题 2: 导入了整个模块
import _ from 'lodash'; // ❌ 导入整个 lodash

// 解决: 按需导入
import debounce from 'lodash/debounce'; // ✅
import { debounce } from 'lodash-es'; // ✅

// 问题 3: 有副作用但未声明
// utils.js
console.log('module loaded'); // 副作用
export function add() {}

// 解决: 在 package.json 中声明
{
  "sideEffects": ["./src/utils.js"]
}
```

### 2. CSS 的 Tree Shaking

```javascript
// PurgeCSS - 删除未使用的 CSS
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const glob = require('glob');

module.exports = {
  plugins: [
    new PurgeCSSPlugin({
      paths: glob.sync('./src/**/*', { nodir: true }),
      // 保留的选择器
      safelist: ['active', 'disabled']
    })
  ]
};

// 效果
// 原始 CSS: 500KB
// PurgeCSS 后: 50KB
```

### 3. 第三方库的 Tree Shaking

```javascript
// lodash (不支持 Tree Shaking)
import _ from 'lodash';
_.debounce(fn, 100);

// lodash-es (支持 Tree Shaking)
import { debounce } from 'lodash-es';
debounce(fn, 100);

// antd (按需导入)
// 方式 1: 手动导入
import Button from 'antd/es/button';
import 'antd/es/button/style';

// 方式 2: 使用插件
// babel-plugin-import
{
  "plugins": [
    ["import", {
      "libraryName": "antd",
      "style": true
    }]
  ]
}

// 自动转换为
import Button from 'antd/es/button';
import 'antd/es/button/style';
```

---

## 问题 6:Tree Shaking 的最佳实践

### 1. 编写可 Tree Shaking 的代码

```javascript
// ✅ 好的实践 - 独立的纯函数
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// ❌ 不好的实践 - 有副作用
let count = 0;
export function add(a, b) {
  count++; // 副作用
  return a + b;
}

// ✅ 好的实践 - 明确的导出
export { add, subtract };

// ❌ 不好的实践 - 默认导出对象
export default {
  add,
  subtract
};
```

### 2. 使用支持 Tree Shaking 的库

```javascript
// 优先选择 ES Module 版本的库
// ✅ lodash-es
import { debounce } from 'lodash-es';

// ✅ date-fns
import { format } from 'date-fns';

// ✅ ramda
import { map } from 'ramda';

// 检查库是否支持 Tree Shaking
// 查看 package.json 中的 "module" 字段
{
  "main": "index.js",      // CommonJS
  "module": "index.esm.js" // ES Module ✓
}
```

### 3. 监控打包结果

```javascript
// 使用 webpack-bundle-analyzer
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
};

// 检查:
// 1. 是否有未使用的大型模块
// 2. 是否有重复打包的代码
// 3. Tree Shaking 是否生效
```

---

## 问题 7:Tree Shaking 的局限性

### 1. 无法处理动态导入

```javascript
// ❌ 无法 Tree Shake
const moduleName = 'utils';
import(`./${moduleName}`).then(module => {
  // 运行时才知道导入什么
});

// ✅ 可以 Tree Shake
import('./utils').then(module => {
  // 编译时就知道导入 utils
});
```

### 2. 类的方法难以 Tree Shake

```javascript
// 类的方法很难被 Tree Shake
class Utils {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}

export default new Utils();

// 即使只使用 add,subtract 也会被打包

// 解决: 使用独立函数
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
```

### 3. 需要工具链支持

```javascript
// Tree Shaking 需要:
// 1. ES Module 语法
// 2. Webpack/Rollup 等支持的打包工具
// 3. 压缩工具(Terser)删除死代码
// 4. 正确的配置

// 任何一环出问题都可能导致 Tree Shaking 失效
```

---

## 总结

**核心概念总结**:

### 1. Tree Shaking 原理

- 依赖 ES Module 的静态结构
- 编译时分析依赖关系
- 标记未使用的导出
- 压缩时删除死代码

### 2. 关键配置

- 使用 ES Module 语法
- 配置 sideEffects
- 启用 usedExports
- 使用压缩工具

### 3. 最佳实践

- 编写无副作用的纯函数
- 使用支持 Tree Shaking 的库
- 按需导入
- 监控打包结果

### 4. 注意事项

- 声明副作用
- 避免 CommonJS
- 注意第三方库的支持
- 理解局限性

## 延伸阅读

- [Webpack Tree Shaking 官方文档](https://webpack.js.org/guides/tree-shaking/)
- [你的 Tree-Shaking 并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)
- [深入理解 Tree Shaking](https://juejin.cn/post/6844903544756109319)
- [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
- [PurgeCSS 文档](https://purgecss.com/)
