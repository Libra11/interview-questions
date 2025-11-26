---
title: Webpack externals 是如何加载外部依赖的
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack externals 配置的作用和实现原理。externals 允许将某些依赖排除在打包之外，
  通过外部方式（如 CDN）加载，减小打包体积。
tags:
  - Webpack
  - externals
  - CDN
  - 打包优化
estimatedTime: 20 分钟
keywords:
  - Webpack externals
  - 外部依赖
  - CDN 加载
  - 打包优化
highlight: externals 将依赖从 bundle 中排除，通过全局变量或其他方式访问
order: 206
---

## 问题 1：externals 是什么？

**externals 配置用于告诉 Webpack 哪些模块不需要打包，而是从外部获取**。

### 基本配置

```javascript
// webpack.config.js
module.exports = {
  externals: {
    // key: 模块名称
    // value: 全局变量名
    'react': 'React',
    'react-dom': 'ReactDOM',
    'lodash': '_',
    'jquery': 'jQuery'
  }
};
```

### 使用场景

```javascript
// 源代码
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

// 没有 externals 配置：
// react、react-dom、lodash 都会被打包进 bundle

// 有 externals 配置：
// 这些库不会被打包，而是期望从全局变量获取
```

---

## 问题 2：externals 的实现原理是什么？

**Webpack 在解析模块时，遇到 externals 中的模块会生成特殊的代码**。

### 编译结果对比

```javascript
// 源代码
import React from 'react';

console.log(React.version);
```

```javascript
// 没有 externals 时的编译结果（简化）
const React = __webpack_require__('./node_modules/react/index.js');
console.log(React.version);
```

```javascript
// 有 externals 配置时的编译结果（简化）
const React = window.React;  // 从全局变量获取
console.log(React.version);
```

### 不同的 externals 类型

```javascript
module.exports = {
  externals: {
    // 1. 字符串：从全局变量获取
    'jquery': 'jQuery',
    // 编译为：const jquery = window.jQuery;
    
    // 2. 数组：嵌套的全局变量
    'react': ['React'],
    'react-dom': ['ReactDOM'],
    // 编译为：const react = window['React'];
    
    // 3. 对象：指定不同环境的值
    'lodash': {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_'
    },
    
    // 4. 函数：动态判断
    externals: function({ context, request }, callback) {
      if (/^react/.test(request)) {
        return callback(null, 'React');
      }
      callback();
    }
  }
};
```

---

## 问题 3：如何配合 CDN 使用？

**通过 CDN 加载外部依赖，减小打包体积**。

### HTML 引入 CDN

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- 通过 CDN 引入依赖 -->
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js"></script>
  
  <!-- 应用代码 -->
  <script src="dist/bundle.js"></script>
</body>
</html>
```

### Webpack 配置

```javascript
module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'lodash': '_'
  }
};
```

### 使用 HtmlWebpackPlugin 自动注入

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      // 自定义注入 CDN 链接
      cdn: {
        js: [
          'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
          'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js'
        ]
      }
    })
  ]
};
```

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- 注入 CDN -->
  <% for (var i in htmlWebpackPlugin.options.cdn && htmlWebpackPlugin.options.cdn.js) { %>
    <script src="<%= htmlWebpackPlugin.options.cdn.js[i] %>"></script>
  <% } %>
</body>
</html>
```

---

## 问题 4：externals 的不同配置方式有什么区别？

**支持字符串、对象、数组、函数等多种配置方式**。

### 字符串形式

```javascript
module.exports = {
  externals: {
    'jquery': 'jQuery'
  }
};

// 生成代码
module.exports = window.jQuery;
```

### 数组形式

```javascript
module.exports = {
  externals: {
    'react-dom': ['ReactDOM']
  }
};

// 生成代码
module.exports = window['ReactDOM'];
```

### 对象形式（指定模块类型）

```javascript
module.exports = {
  externals: {
    'lodash': {
      commonjs: 'lodash',      // require('lodash')
      commonjs2: 'lodash',     // module.exports = require('lodash')
      amd: 'lodash',           // define(['lodash'], ...)
      root: '_'                // window._
    }
  }
};
```

### 函数形式（动态判断）

```javascript
module.exports = {
  externals: function({ context, request }, callback) {
    // request: 模块名称
    // context: 模块所在目录
    
    // 所有以 react 开头的模块都外部化
    if (/^react/.test(request)) {
      return callback(null, 'React');
    }
    
    // 其他模块正常打包
    callback();
  }
};
```

### 正则形式

```javascript
module.exports = {
  externals: [
    // 匹配所有以 @babel/ 开头的模块
    /^@babel\//,
    
    // 匹配所有以 lodash/ 开头的模块
    /^lodash\//
  ]
};
```

---

## 问题 5：externals 在不同环境下如何配置？

**根据开发/生产环境使用不同的配置**。

### 开发环境

```javascript
// webpack.dev.js
module.exports = {
  mode: 'development',
  
  // 开发环境不使用 externals，方便调试
  externals: {}
};
```

### 生产环境

```javascript
// webpack.prod.js
module.exports = {
  mode: 'production',
  
  // 生产环境使用 externals，减小体积
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'lodash': '_'
  }
};
```

### 动态配置

```javascript
// webpack.config.js
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  externals: isProduction ? {
    'react': 'React',
    'react-dom': 'ReactDOM'
  } : {}
};
```

---

## 问题 6：externals 有什么注意事项？

**版本一致性、加载顺序、类型定义等**。

### 版本一致性

```javascript
// package.json
{
  "dependencies": {
    "react": "^18.2.0"
  }
}

// 确保 CDN 版本与 package.json 一致
// ❌ 错误：版本不一致
<script src="https://cdn.jsdelivr.net/npm/react@17/..."></script>

// ✅ 正确：版本一致
<script src="https://cdn.jsdelivr.net/npm/react@18.2.0/..."></script>
```

### 加载顺序

```html
<!-- ❌ 错误：依赖顺序错误 -->
<script src="react-dom.js"></script>
<script src="react.js"></script>  <!-- react-dom 依赖 react -->

<!-- ✅ 正确：先加载依赖 -->
<script src="react.js"></script>
<script src="react-dom.js"></script>
```

### TypeScript 类型定义

```typescript
// 使用 externals 后，仍需安装类型定义
npm install --save-dev @types/react @types/react-dom

// tsconfig.json
{
  "compilerOptions": {
    "types": ["react", "react-dom"]
  }
}
```

### 开发体验

```javascript
// 使用 webpack-dev-server 时
// 可以配置 proxy 代理 CDN 请求，避免跨域

module.exports = {
  devServer: {
    proxy: {
      '/cdn': {
        target: 'https://cdn.jsdelivr.net',
        changeOrigin: true,
        pathRewrite: { '^/cdn': '' }
      }
    }
  }
};
```

---

## 问题 7：如何优化 externals 的使用？

**按需外部化、fallback 机制、预加载等**。

### 按需外部化

```javascript
// 只在生产环境外部化大型库
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  externals: isProduction ? {
    // 只外部化大型库
    'react': 'React',
    'react-dom': 'ReactDOM',
    'lodash': '_',
    'moment': 'moment'
  } : {
    // 开发环境可以外部化一些稳定的库
    'react': 'React',
    'react-dom': 'ReactDOM'
  }
};
```

### Fallback 机制

```html
<script>
  // 检查 CDN 是否加载成功
  window.addEventListener('load', function() {
    if (!window.React) {
      // CDN 加载失败，使用本地备份
      var script = document.createElement('script');
      script.src = '/static/react.min.js';
      document.head.appendChild(script);
    }
  });
</script>
```

### 预加载和预连接

```html
<head>
  <!-- 预连接 CDN 域名 -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
  
  <!-- 预加载关键资源 -->
  <link rel="preload" as="script" href="https://cdn.jsdelivr.net/npm/react@18/...">
</head>
```

---

## 总结

**核心概念**：

### 1. externals 作用
- 排除依赖打包
- 减小 bundle 体积
- 利用 CDN 加速

### 2. 配置方式
- 字符串：全局变量
- 对象：多环境支持
- 数组：嵌套变量
- 函数：动态判断

### 3. 使用场景
- 大型第三方库
- 多项目共享依赖
- CDN 加速
- 减小打包时间

### 4. 注意事项
- 版本一致性
- 加载顺序
- 类型定义
- Fallback 机制

### 5. 最佳实践
- 生产环境使用
- 配合 CDN
- 预加载优化
- 监控加载失败

## 延伸阅读

- [Webpack externals 官方文档](https://webpack.js.org/configuration/externals/)
- [CDN 最佳实践](https://web.dev/content-delivery-networks/)
- [HtmlWebpackPlugin 文档](https://github.com/jantimon/html-webpack-plugin)
- [前端性能优化](https://web.dev/fast/)
