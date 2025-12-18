---
title: Webpack 与 Vite 在产物结果上有何区别
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入对比 Webpack 和 Vite 的打包产物差异。两者采用不同的构建策略，
  产生的文件结构、模块格式和优化方式都有所不同。
tags:
  - Webpack
  - Vite
  - 构建工具
  - 打包产物
estimatedTime: 22 分钟
keywords:
  - Webpack Vite 对比
  - 打包产物
  - ESM
  - Bundle
highlight: Webpack 打包成 bundle，Vite 保留 ESM 格式并优化依赖
order: 481
---

## 问题 1：Webpack 和 Vite 的产物结构有什么不同？

**Webpack 将所有模块打包成 bundle，Vite 在开发时保留 ESM，生产时优化打包**。

### Webpack 产物结构

```
dist/
  ├── index.html
  ├── main.abc123.js        # 主bundle（包含所有业务代码）
  ├── vendors.def456.js     # 第三方依赖bundle
  ├── runtime.ghi789.js     # Webpack运行时
  └── styles.jkl012.css     # 样式文件
```

### Vite 产物结构

```
dist/
  ├── index.html
  ├── assets/
  │   ├── index.abc123.js       # 入口文件
  │   ├── vendor.def456.js      # 预构建的依赖
  │   ├── Home.ghi789.js        # 代码分割的组件
  │   ├── About.jkl012.js       # 代码分割的组件
  │   └── index.mno345.css      # 样式文件
  └── vite.svg
```

---

## 问题 2：模块格式有什么区别？

**Webpack 使用自定义模块系统，Vite 使用原生 ESM**。

### Webpack 产物（简化）

```javascript
// Webpack 打包后的代码
(function(modules) {
  // Webpack 模块加载器
  function __webpack_require__(moduleId) {
    var module = { exports: {} };
    modules[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
  }
  
  // 执行入口模块
  return __webpack_require__(0);
})([
  // 模块 0
  function(module, exports, __webpack_require__) {
    const utils = __webpack_require__(1);
    console.log(utils.add(1, 2));
  },
  // 模块 1
  function(module, exports) {
    exports.add = (a, b) => a + b;
  }
]);
```

### Vite 产物（开发环境）

```javascript
// Vite 开发环境直接使用 ESM
// main.js
import { add } from './utils.js';
console.log(add(1, 2));

// utils.js
export const add = (a, b) => a + b;

// 浏览器直接加载，无需打包
```

### Vite 产物（生产环境）

```javascript
// Vite 生产环境使用 Rollup 打包
// 产物更接近原始代码结构
import { a as add } from './vendor.js';
console.log(add(1, 2));

// vendor.js
export const a = (t, e) => t + e;
```

---

## 问题 3：代码分割策略有什么不同？

**Webpack 基于配置分割，Vite 基于动态 import 自动分割**。

### Webpack 代码分割

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  }
};

// 产物：
// - main.js (业务代码)
// - vendors.js (所有依赖)
// - runtime.js (Webpack运行时)
```

### Vite 代码分割

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils-vendor': ['lodash', 'dayjs']
        }
      }
    }
  }
};

// 产物：
// - index.js (入口)
// - react-vendor.js (React相关)
// - utils-vendor.js (工具库)
// - 每个动态import的组件单独一个文件
```

---

## 问题 4：依赖处理有什么区别？

**Webpack 将依赖打包进 bundle，Vite 预构建依赖**。

### Webpack 依赖处理

```javascript
// 源代码
import React from 'react';
import { Button } from 'antd';

// Webpack 打包后
// 所有依赖都被打包进 bundle
// vendors.js 包含：
// - react (完整代码)
// - react-dom (完整代码)
// - antd (完整代码)
```

### Vite 依赖处理

```javascript
// 开发环境
// Vite 预构建依赖到 node_modules/.vite/deps/
node_modules/.vite/deps/
  ├── react.js          # 预构建的 React
  ├── react-dom.js      # 预构建的 React DOM
  └── antd.js           # 预构建的 Antd

// 浏览器加载
import React from '/node_modules/.vite/deps/react.js';
import { Button } from '/node_modules/.vite/deps/antd.js';

// 生产环境
// 使用 Rollup 打包，类似 Webpack
```

---

## 问题 5：文件大小和数量有什么区别？

**Webpack 产物文件少但单个文件大，Vite 产物文件多但单个文件小**。

### Webpack 产物

```
dist/
  ├── main.js (500KB)       # 业务代码
  ├── vendors.js (2MB)      # 所有依赖
  └── runtime.js (10KB)     # 运行时

总文件数：3个
总大小：2.5MB
```

### Vite 产物

```
dist/
  ├── index.js (50KB)           # 入口
  ├── Home.js (30KB)            # 首页组件
  ├── About.js (20KB)           # 关于页组件
  ├── react-vendor.js (150KB)   # React
  ├── ui-vendor.js (800KB)      # UI库
  ├── utils-vendor.js (100KB)   # 工具库
  └── ...

总文件数：10+个
总大小：2.3MB（通常更小）
```

---

## 问题 6：开发环境的产物有什么区别？

**Webpack 需要打包，Vite 无需打包直接使用 ESM**。

### Webpack 开发环境

```javascript
// webpack-dev-server
// 1. 打包所有模块到内存
// 2. 启动开发服务器
// 3. 浏览器加载打包后的 bundle

// 启动时间：10-30秒（大型项目）
// 热更新时间：1-5秒
```

### Vite 开发环境

```javascript
// Vite dev server
// 1. 预构建依赖（只需一次）
// 2. 启动开发服务器
// 3. 浏览器按需加载 ESM 模块

// 启动时间：<1秒
// 热更新时间：<100ms
```

---

## 问题 7：优化策略有什么不同？

**Webpack 依赖配置优化，Vite 内置智能优化**。

### Webpack 优化

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    // 需要手动配置
    minimize: true,
    minimizer: [new TerserPlugin()],
    splitChunks: { /* 复杂配置 */ },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    usedExports: true,
    sideEffects: true
  },
  
  plugins: [
    new CompressionPlugin(),
    new BundleAnalyzerPlugin()
  ]
};
```

### Vite 优化

```javascript
// vite.config.js
export default {
  build: {
    // 内置优化，配置简单
    minify: 'terser',  // 默认启用
    cssCodeSplit: true,  // 自动CSS分割
    sourcemap: false,
    
    rollupOptions: {
      // 可选的高级配置
      output: {
        manualChunks: { /* 简单配置 */ }
      }
    }
  }
};
```

---

## 总结

**核心区别**：

### 1. 产物结构
- Webpack：少量大文件
- Vite：多个小文件

### 2. 模块格式
- Webpack：自定义模块系统
- Vite：原生 ESM（开发）+ Rollup（生产）

### 3. 代码分割
- Webpack：基于配置
- Vite：基于动态 import

### 4. 依赖处理
- Webpack：打包进 bundle
- Vite：预构建 + 优化

### 5. 开发体验
- Webpack：需要打包，启动慢
- Vite：无需打包，启动快

### 6. 优化策略
- Webpack：手动配置
- Vite：内置智能优化

### 7. 适用场景
- Webpack：复杂项目，需要精细控制
- Vite：现代项目，追求开发体验

## 延伸阅读

- [Vite 官方文档](https://vitejs.dev/)
- [Webpack 官方文档](https://webpack.js.org/)
- [ESM vs Bundle](https://vitejs.dev/guide/why.html)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
