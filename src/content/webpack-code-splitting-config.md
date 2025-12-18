---
title: Webpack 代码分割中如何配置让所有外部依赖打成一个包，源码打成一个包
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  详细讲解如何使用 Webpack SplitChunksPlugin 实现源码和依赖的分离。
  通过合理的配置，将业务代码和第三方依赖分别打包，优化缓存策略。
tags:
  - Webpack
  - SplitChunks
  - 代码分割
  - 打包配置
estimatedTime: 20 分钟
keywords:
  - Webpack 代码分割
  - vendor 分离
  - SplitChunks 配置
  - 缓存优化
highlight: 通过 SplitChunksPlugin 的 cacheGroups 配置实现源码和依赖的完全分离
order: 501
---

## 问题 1：为什么要分离源码和依赖？

**业务代码频繁变化，依赖代码稳定，分离后可以充分利用浏览器缓存**。

### 缓存策略

```javascript
// 不分离的情况
// bundle.js (2MB)
// - 业务代码 (200KB) - 每天都在改
// - React (100KB) - 几个月不变
// - Lodash (50KB) - 几个月不变
// - 其他依赖 (1.65MB) - 几个月不变

// 问题：业务代码改动，用户需要重新下载整个 2MB

// 分离后
// main.js (200KB) - 业务代码，经常变化
// vendors.js (1.8MB) - 依赖代码，很少变化

// 优势：业务代码改动，用户只需下载 200KB
```

---

## 问题 2：如何配置基本的源码和依赖分离？

**使用 SplitChunksPlugin 的 cacheGroups 配置**。

### 基础配置

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',  // 对所有类型的 chunk 进行分割
      
      cacheGroups: {
        // 第三方依赖
        vendor: {
          test: /[\\/]node_modules[\\/]/,  // 匹配 node_modules
          name: 'vendors',                  // chunk 名称
          priority: 10,                     // 优先级
          reuseExistingChunk: true         // 复用已存在的 chunk
        },
        
        // 源代码（默认配置会自动处理）
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

### 打包结果

```
dist/
  ├── main.js        # 业务代码（源码）
  ├── vendors.js     # 所有第三方依赖
  └── index.html
```

---

## 问题 3：如何确保只分成两个包？

**禁用默认分组，只保留 vendor 和 main**。

### 精确配置

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      
      cacheGroups: {
        // 第三方依赖
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          enforce: true  // 强制执行
        },
        
        // 禁用默认分组
        default: false,
        defaultVendors: false
      }
    }
  }
};
```

---

## 问题 4：如何处理异步加载的模块？

**配置 chunks 参数控制分割范围**。

### chunks 配置详解

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      // all: 同步和异步模块都分割
      // async: 只分割异步模块（默认）
      // initial: 只分割同步模块
      chunks: 'all',
      
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',  // 可以单独配置
          priority: 10
        }
      }
    }
  }
};
```

### 示例

```javascript
// 源代码
// main.js
import React from 'react';  // 同步导入
import ReactDOM from 'react-dom';

// 异步导入
const Dashboard = () => import('./Dashboard');

// 配置 chunks: 'all'
// 结果：
// - main.js (业务代码)
// - vendors.js (React + ReactDOM + Dashboard 中的依赖)
// - Dashboard.chunk.js (Dashboard 组件代码)

// 配置 chunks: 'initial'
// 结果：
// - main.js (业务代码)
// - vendors.js (只有 React + ReactDOM)
// - Dashboard.chunk.js (Dashboard 组件 + 其依赖)
```

---

## 问题 5：如何处理 CSS 文件？

**CSS 也可以分离到单独的文件**。

### CSS 分离配置

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],
  
  optimization: {
    splitChunks: {
      cacheGroups: {
        // JavaScript 依赖
        vendor: {
          test: /[\\/]node_modules[\\/].*\.js$/,
          name: 'vendors',
          chunks: 'all'
        },
        
        // CSS 依赖
        vendorStyles: {
          test: /[\\/]node_modules[\\/].*\.css$/,
          name: 'vendor-styles',
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
};
```

---

## 问题 6：如何验证分离效果？

**使用 webpack-bundle-analyzer 查看打包结果**。

### 安装和配置

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html'
    })
  ]
};
```

### 验证要点

```javascript
// 打包后检查：
// 1. vendors.js 只包含 node_modules 中的代码
// 2. main.js 只包含 src 中的业务代码
// 3. 没有代码重复
// 4. 文件大小合理
```

---

## 问题 7：完整的配置示例

**生产环境的完整配置**。

### 完整配置

```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      
      cacheGroups: {
        // 第三方依赖
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        
        // 禁用默认分组
        default: false,
        defaultVendors: false
      }
    },
    
    // Runtime 代码单独提取
    runtimeChunk: {
      name: 'runtime'
    },
    
    // 模块 ID 使用确定性算法
    moduleIds: 'deterministic'
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false
    })
  ]
};
```

### 打包结果

```
dist/
  ├── index.html
  ├── runtime.abc123.js      # Webpack 运行时
  ├── vendors.def456.js      # 所有第三方依赖
  ├── main.ghi789.js         # 业务代码
  └── main.jkl012.css        # 样式文件
```

---

## 总结

**核心配置**：

### 1. 基本分离
```javascript
cacheGroups: {
  vendor: {
    test: /[\\/]node_modules[\\/]/,
    name: 'vendors'
  }
}
```

### 2. 关键配置项
- test: 匹配规则
- name: chunk 名称
- chunks: 分割范围
- priority: 优先级
- enforce: 强制执行

### 3. 最佳实践
- 分离第三方依赖
- 提取 runtime
- 使用 contenthash
- 禁用默认分组

### 4. 验证方法
- webpack-bundle-analyzer
- 检查文件内容
- 测试缓存效果

### 5. 优化建议
- 合理设置 priority
- 使用 reuseExistingChunk
- 配置 moduleIds
- 监控文件大小

## 延伸阅读

- [SplitChunksPlugin 官方文档](https://webpack.js.org/plugins/split-chunks-plugin/)
- [代码分割指南](https://webpack.js.org/guides/code-splitting/)
- [缓存策略](https://webpack.js.org/guides/caching/)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
