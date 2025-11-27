---
title: webpack externals 作用是什么
category: Webpack
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  理解 webpack externals 配置的作用和使用场景,掌握如何通过 externals 减小打包体积、提升构建速度,以及如何配合 CDN 使用。
tags:
  - Webpack
  - externals
  - CDN
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - webpack externals
  - CDN
  - 打包优化
  - 第三方库
highlight: externals 让我们可以将第三方库从 bundle 中排除,通过 CDN 加载,减小打包体积
order: 13
---

## 问题 1:什么是 webpack externals?

### 基本概念

`externals` 配置用于告诉 webpack 哪些模块不需要打包,而是在运行时从外部获取。

```javascript
// webpack.config.js
module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};

// 效果:
// import React from 'react';
// webpack 不会打包 react
// 而是期望在运行时全局变量 React 存在
```

### 为什么需要 externals?

```javascript
// 没有使用 externals
// bundle.js 包含:
// - 你的代码 (100KB)
// - React (150KB)
// - ReactDOM (100KB)
// 总计: 350KB

// 使用 externals
// bundle.js 只包含:
// - 你的代码 (100KB)
// React 和 ReactDOM 从 CDN 加载
// 总计: 100KB

// 优势:
// 1. 减小 bundle 体积
// 2. 加快构建速度
// 3. 利用 CDN 缓存
// 4. 并行下载
```

---

## 问题 2:如何配置 externals?

### 1. 对象语法

```javascript
module.exports = {
  externals: {
    // key: 模块名
    // value: 全局变量名
    'jquery': 'jQuery',
    'lodash': '_',
    'react': 'React',
    'vue': 'Vue'
  }
};

// 代码中
import $ from 'jquery';  // 使用全局 jQuery
import _ from 'lodash';  // 使用全局 _
```

### 2. 字符串语法

```javascript
module.exports = {
  externals: {
    'react': 'React'
  }
};

// 等同于
module.exports = {
  externals: {
    react: {
      root: 'React',        // 浏览器全局变量
      commonjs: 'react',    // CommonJS
      commonjs2: 'react',   // CommonJS2
      amd: 'react'          // AMD
    }
  }
};
```

### 3. 数组语法

```javascript
module.exports = {
  externals: {
    'react': ['React', 'default']  // React.default
  }
};
```

### 4. 函数语法

```javascript
module.exports = {
  externals: function({ context, request }, callback) {
    // 自定义逻辑
    if (/^react(-dom)?$/.test(request)) {
      return callback(null, 'root ' + request);
    }
    callback();
  }
};
```

### 5. 正则表达式

```javascript
module.exports = {
  externals: [
    // 排除所有 @babel 开头的包
    /^@babel\//,
    
    // 排除所有 lodash 子模块
    /^lodash\//
  ]
};
```

---

## 问题 3:externals 的实际应用

### 1. 配合 CDN 使用

```javascript
// webpack.config.js
module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'axios': 'axios'
  }
};
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <!-- 从 CDN 加载 -->
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <!-- 你的 bundle -->
  <script src="bundle.js"></script>
</body>
</html>
```

### 2. 开发库时使用

```javascript
// 开发 React 组件库
// webpack.config.js
module.exports = {
  externals: {
    // 不打包 React,让使用者提供
    'react': {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom'
    }
  }
};

// package.json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 3. Monorepo 项目

```javascript
// packages/app/webpack.config.js
module.exports = {
  externals: {
    // 不打包内部包,从外部加载
    '@myapp/utils': '@myapp/utils',
    '@myapp/components': '@myapp/components'
  }
};
```

---

## 问题 4:externals 的不同模块格式

### UMD 格式

```javascript
module.exports = {
  externals: {
    'lodash': {
      root: '_',           // <script> 标签
      commonjs: 'lodash',  // require('lodash')
      commonjs2: 'lodash', // module.exports
      amd: 'lodash'        // define(['lodash'])
    }
  }
};
```

### CommonJS

```javascript
module.exports = {
  externals: {
    'fs': 'commonjs fs',  // const fs = require('fs');
    'path': 'commonjs path'
  }
};
```

### ES Module

```javascript
module.exports = {
  externals: {
    'react': 'module react'  // import React from 'react';
  }
};
```

---

## 问题 5:externals 的注意事项

### 1. 版本一致性

```javascript
// package.json
{
  "dependencies": {
    "react": "^18.2.0"  // 项目依赖 18.2.0
  }
}

// index.html
<!-- CDN 版本必须匹配 -->
<script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>

// 版本不匹配可能导致:
// - 类型错误
// - API 不兼容
// - 运行时错误
```

### 2. 全局变量污染

```javascript
// 使用 externals 会依赖全局变量
// 可能与其他库冲突

// 解决方案 1: 使用命名空间
window.MyApp = {
  React: React,
  ReactDOM: ReactDOM
};

module.exports = {
  externals: {
    'react': ['MyApp', 'React']
  }
};

// 解决方案 2: 使用 ES Module
<script type="module">
  import React from 'https://cdn.skypack.dev/react';
  window.React = React;
</script>
```

### 3. 开发环境处理

```javascript
// 开发环境可能不想使用 externals
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  externals: isProduction ? {
    'react': 'React',
    'react-dom': 'ReactDOM'
  } : {}
};
```

### 4. TypeScript 支持

```javascript
// 使用 externals 时,TypeScript 仍需要类型定义
// package.json
{
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "types": ["react", "react-dom"]
  }
}
```

---

## 问题 6:externals vs splitChunks

### externals

```javascript
// 完全不打包,从外部加载
module.exports = {
  externals: {
    'react': 'React'
  }
};

// 优点:
// - bundle 体积最小
// - 利用 CDN 缓存
// - 并行下载

// 缺点:
// - 依赖外部资源
// - 版本管理复杂
// - 可能有网络问题
```

### splitChunks

```javascript
// 打包但分离成独立文件
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};

// 优点:
// - 版本可控
// - 不依赖外部
// - 离线可用

// 缺点:
// - bundle 体积较大
// - 需要自己托管
```

### 混合使用

```javascript
module.exports = {
  // 大型稳定库使用 externals
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  
  // 其他库使用 splitChunks
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

---

## 问题 7:动态 externals

### HTML Webpack Plugin 集成

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

const cdnDependencies = {
  'react': {
    name: 'React',
    url: 'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js'
  },
  'react-dom': {
    name: 'ReactDOM',
    url: 'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js'
  }
};

module.exports = {
  externals: Object.keys(cdnDependencies).reduce((acc, key) => {
    acc[key] = cdnDependencies[key].name;
    return acc;
  }, {}),
  
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      cdnScripts: Object.values(cdnDependencies).map(dep => dep.url)
    })
  ]
};
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <% for (let script of htmlWebpackPlugin.options.cdnScripts) { %>
    <script src="<%= script %>"></script>
  <% } %>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

---

## 总结

**核心概念总结**:

### 1. externals 作用

- 排除模块不打包
- 从外部获取依赖
- 减小 bundle 体积
- 加快构建速度

### 2. 主要用途

- 配合 CDN 使用
- 开发库时排除依赖
- Monorepo 项目
- 优化性能

### 3. 配置方式

- 对象语法
- 字符串语法
- 函数语法
- 正则表达式

### 4. 注意事项

- 版本一致性
- 全局变量管理
- 开发环境处理
- TypeScript 支持

## 延伸阅读

- [Webpack Externals 官方文档](https://webpack.js.org/configuration/externals/)
- [使用 CDN 优化性能](https://web.dev/performance-optimizing-content-efficiency-loading-third-party-javascript/)
- [UMD 模块格式](https://github.com/umdjs/umd)
- [HTML Webpack Plugin](https://github.com/jantimon/html-webpack-plugin)
