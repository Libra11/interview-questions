---
title: webpack 打包时 hash 码是如何生成的
category: Webpack
difficulty: 中级
updatedAt: 2025-11-27
summary: >-
  深入理解 webpack 中 hash、chunkhash 和 contenthash 的生成机制和区别，掌握如何利用 hash 实现浏览器缓存优化，了解 hash 在实际项目中的最佳实践。
tags:
  - Webpack
  - 缓存优化
  - Hash
  - 构建工具
estimatedTime: 22 分钟
keywords:
  - webpack hash
  - chunkhash
  - contenthash
  - 浏览器缓存
highlight: 理解三种 hash 的区别是优化浏览器缓存的关键，选对 hash 类型可以最大化缓存命中率
order: 2
---

## 问题 1：webpack 中的 hash 是什么？

### 基本概念

webpack 在打包时可以为输出文件生成一个唯一的 hash 值，这个 hash 值会添加到文件名中：

```javascript
// webpack.config.js
module.exports = {
  output: {
    filename: '[name].[hash].js', // 使用 hash
    path: path.resolve(__dirname, 'dist'),
  },
};

// 输出结果
// main.a3f5b8c9.js
```

### 为什么需要 hash？

**浏览器缓存优化**：

当我们更新代码后，如果文件名不变，浏览器可能会使用旧的缓存文件。通过在文件名中添加 hash，文件内容变化时文件名也会变化，强制浏览器下载新文件。

```javascript
// 第一次构建
main.a3f5b8c9.js  // 浏览器下载并缓存

// 代码更新后再次构建
main.f7e2d1a4.js  // 文件名变化，浏览器下载新文件
```

---

## 问题 2：hash、chunkhash 和 contenthash 有什么区别？

### 1. hash（全局 hash）

`hash` 是基于整个项目的构建生成的，只要项目中有任何文件发生变化，所有文件的 hash 都会改变。

```javascript
module.exports = {
  output: {
    filename: '[name].[hash].js',
  },
};

// 构建结果
// main.a3f5b8c9.js
// vendor.a3f5b8c9.js  // 注意：hash 值相同
```

**特点**：
- 所有文件共享同一个 hash 值
- 任何文件改变，所有文件的 hash 都会更新
- 缓存利用率最低

**适用场景**：
- 开发环境（不需要考虑缓存）
- 小型项目（文件较少）

### 2. chunkhash（chunk 级别的 hash）

`chunkhash` 是基于每个 chunk（代码块）的内容生成的，只有当前 chunk 的内容变化时，hash 才会改变。

```javascript
module.exports = {
  output: {
    filename: '[name].[chunkhash].js',
  },
};

// 构建结果
// main.a3f5b8c9.js
// vendor.f7e2d1a4.js  // hash 值不同
```

**chunk 的概念**：

```javascript
// entry chunk
// src/index.js
import './style.css';
console.log('main');

// vendor chunk（通过 splitChunks 分离）
// node_modules 中的第三方库
```

**特点**：
- 每个 chunk 有独立的 hash
- 只有当前 chunk 内容变化时 hash 才更新
- 缓存利用率较高

**适用场景**：
- JS 文件的命名
- 需要区分不同入口文件

### 3. contenthash（内容级别的 hash）

`contenthash` 是基于文件内容生成的，只有文件内容变化时 hash 才会改变。

```javascript
module.exports = {
  output: {
    filename: '[name].[contenthash].js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css', // CSS 使用 contenthash
    }),
  ],
};
```

**为什么需要 contenthash？**

考虑这个场景：

```javascript
// index.js
import './style.css';
console.log('Hello');

// 如果使用 chunkhash
// index.abc123.js
// style.abc123.css  // CSS 和 JS 的 hash 相同

// 只修改 JS 代码
console.log('Hello World'); // 修改这里

// 重新构建后
// index.def456.js  // JS hash 变化
// style.def456.css  // CSS hash 也变化（但内容没变！）
```

使用 `contenthash` 可以解决这个问题：

```javascript
// 使用 contenthash
// index.abc123.js
// style.xyz789.css  // CSS 有独立的 hash

// 只修改 JS 代码后
// index.def456.js  // JS hash 变化
// style.xyz789.css  // CSS hash 不变（内容没变）
```

**特点**：
- 基于文件内容生成
- 内容不变，hash 不变
- 缓存利用率最高

**适用场景**：
- CSS 文件
- 图片、字体等资源文件
- 需要最大化缓存利用率的场景

---

## 问题 3：hash 是如何生成的？

### 生成机制

webpack 使用 Node.js 的 `crypto` 模块生成 hash：

```javascript
// webpack 内部实现（简化版）
const crypto = require('crypto');

function generateHash(content) {
  // 创建 hash 对象（默认使用 md4 算法）
  const hash = crypto.createHash('md4');
  
  // 更新 hash 内容
  hash.update(content);
  
  // 生成 hash 值（默认 20 位）
  return hash.digest('hex').substr(0, 20);
}
```

### hash 的计算过程

**1. hash（全局）**：

```javascript
// 收集所有模块的内容
const allModules = compilation.modules;
const content = allModules.map(m => m.source()).join('');

// 生成 hash
const hash = generateHash(content);
```

**2. chunkhash**：

```javascript
// 只收集当前 chunk 的模块内容
const chunkModules = chunk.getModules();
const content = chunkModules.map(m => m.source()).join('');

// 生成 hash
const chunkhash = generateHash(content);
```

**3. contenthash**：

```javascript
// 只使用文件自身的内容
const content = file.source();

// 生成 hash
const contenthash = generateHash(content);
```

### 自定义 hash 配置

```javascript
module.exports = {
  output: {
    // 自定义 hash 长度（默认 20）
    filename: '[name].[contenthash:8].js',
    
    // 自定义 hash 算法
    hashFunction: 'sha256',
    
    // 自定义 hash 摘要编码
    hashDigest: 'hex',
    
    // 自定义 hash 长度
    hashDigestLength: 20,
  },
};
```

---

## 问题 4：如何在项目中正确使用 hash？

### 最佳实践配置

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  output: {
    // JS 文件使用 contenthash
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  },
  
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          // 图片使用 contenthash
          filename: 'images/[name].[contenthash:8][ext]',
        },
      },
    ],
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      // CSS 文件使用 contenthash
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),
  ],
};
```

### 配合缓存策略

```javascript
// 分离第三方库（vendor）
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        // 第三方库单独打包
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    
    // 提取 runtime 代码
    runtimeChunk: {
      name: 'runtime',
    },
  },
};

// 构建结果
// runtime.abc123.js      // webpack runtime（经常变化）
// vendors.xyz789.js      // 第三方库（很少变化）
// main.def456.js         // 业务代码（经常变化）
```

### Nginx 缓存配置

```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  # 带 hash 的文件永久缓存
  if ($request_filename ~* \.[0-9a-f]{8}\.(js|css)$) {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  
  # 不带 hash 的文件不缓存
  expires -1;
  add_header Cache-Control "no-cache";
}
```

---

## 问题 5：hash 在开发和生产环境的使用策略

### 开发环境

开发环境不需要 hash，使用固定的文件名即可：

```javascript
// webpack.dev.js
module.exports = {
  mode: 'development',
  output: {
    filename: '[name].js', // 不使用 hash
    chunkFilename: '[name].chunk.js',
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css', // 不使用 hash
    }),
  ],
};
```

**原因**：
- 开发环境有热更新（HMR），不需要缓存
- 去掉 hash 可以加快构建速度
- 便于调试和查看文件

### 生产环境

生产环境必须使用 hash 优化缓存：

```javascript
// webpack.prod.js
module.exports = {
  mode: 'production',
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),
  ],
  
  optimization: {
    // 确保 vendor hash 稳定
    moduleIds: 'deterministic',
    
    // 提取 runtime
    runtimeChunk: 'single',
    
    // 分离第三方库
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
};
```

---

## 总结

**核心概念总结**：

### 1. 三种 hash 的选择

- **hash**：开发环境或小型项目
- **chunkhash**：区分不同的 chunk
- **contenthash**：最大化缓存利用率（推荐）

### 2. hash 生成原理

- 基于内容使用 crypto 模块生成
- 不同类型的 hash 计算范围不同
- 可自定义算法和长度

### 3. 最佳实践

- 生产环境使用 contenthash
- 分离 vendor 和 runtime
- 配合 HTTP 缓存策略
- 开发环境不使用 hash

## 延伸阅读

- [Webpack Caching 官方文档](https://webpack.js.org/guides/caching/)
- [Output filename 配置](https://webpack.js.org/configuration/output/#outputfilename)
- [深入理解 webpack hash](https://webpack.js.org/guides/caching/#output-filenames)
- [浏览器缓存策略](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [SplitChunksPlugin 文档](https://webpack.js.org/plugins/split-chunks-plugin/)
