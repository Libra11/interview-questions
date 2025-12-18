---
title: Webpack 多入口打包共享模块
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack 多入口应用的模块共享机制。通过 SplitChunksPlugin 配置，
  实现多个入口之间的代码复用，减小总体积。
tags:
  - Webpack
  - 多入口
  - 代码共享
  - SplitChunks
estimatedTime: 22 分钟
keywords:
  - Webpack 多入口
  - 共享模块
  - SplitChunks
  - 代码复用
highlight: 通过 SplitChunksPlugin 实现多入口应用的模块共享和优化
order: 516
---

## 问题 1：什么是多入口应用？

**多入口应用有多个独立的入口文件，生成多个 bundle**。

### 单入口 vs 多入口

```javascript
// 单入口应用（SPA）
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js'
  }
};

// 多入口应用（MPA）
module.exports = {
  entry: {
    index: './src/index.js',
    about: './src/about.js',
    contact: './src/contact.js'
  },
  output: {
    filename: '[name].bundle.js'
  }
};

// 输出：
// - index.bundle.js
// - about.bundle.js
// - contact.bundle.js
```

---

## 问题 2：为什么需要共享模块？

**多个入口可能使用相同的依赖，共享可以减小总体积**。

### 问题场景

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

// about.js
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

// contact.js
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

// 不共享的情况：
// index.bundle.js (500KB) = 业务代码 + React + ReactDOM + Lodash
// about.bundle.js (500KB) = 业务代码 + React + ReactDOM + Lodash
// contact.bundle.js (500KB) = 业务代码 + React + ReactDOM + Lodash
// 总计：1.5MB（重复代码占 1.2MB）

// 共享后：
// index.bundle.js (100KB) = 业务代码
// about.bundle.js (100KB) = 业务代码
// contact.bundle.js (100KB) = 业务代码
// vendors.bundle.js (300KB) = React + ReactDOM + Lodash
// 总计：600KB（节省 900KB）
```

---

## 问题 3：如何配置基本的模块共享？

**使用 SplitChunksPlugin 提取公共代码**。

### 基础配置

```javascript
module.exports = {
  entry: {
    index: './src/index.js',
    about: './src/about.js',
    contact: './src/contact.js'
  },
  
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',  // 对所有类型的 chunk 进行分割
      
      cacheGroups: {
        // 第三方依赖
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        
        // 公共代码
        common: {
          minChunks: 2,  // 至少被 2 个入口引用
          name: 'common',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

---

## 问题 4：如何细粒度控制共享模块？

**通过 cacheGroups 配置不同的共享策略**。

### 按库分离

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      
      cacheGroups: {
        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 30
        },
        
        // UI 库
        ui: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'ui-vendor',
          priority: 25
        },
        
        // 工具库
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|dayjs)[\\/]/,
          name: 'utils-vendor',
          priority: 20
        },
        
        // 其他第三方库
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        },
        
        // 业务公共代码
        common: {
          minChunks: 2,
          name: 'common',
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

### 按入口分组

```javascript
module.exports = {
  entry: {
    // 管理后台入口
    admin: './src/admin/index.js',
    adminUser: './src/admin/user.js',
    adminProduct: './src/admin/product.js',
    
    // 前台入口
    home: './src/home/index.js',
    product: './src/home/product.js'
  },
  
  optimization: {
    splitChunks: {
      cacheGroups: {
        // 管理后台公共代码
        adminCommon: {
          chunks: 'all',
          test: /[\\/]src[\\/]admin[\\/]/,
          name: 'admin-common',
          minChunks: 2,
          priority: 20
        },
        
        // 前台公共代码
        homeCommon: {
          chunks: 'all',
          test: /[\\/]src[\\/]home[\\/]/,
          name: 'home-common',
          minChunks: 2,
          priority: 20
        },
        
        // 全局公共代码
        common: {
          chunks: 'all',
          minChunks: 3,  // 至少被 3 个入口引用
          name: 'common',
          priority: 10
        }
      }
    }
  }
};
```

---

## 问题 5：如何配合 HtmlWebpackPlugin 使用？

**自动注入共享模块到 HTML**。

### 配置示例

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
    about: './src/about.js'
  },
  
  plugins: [
    // index 页面
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['index', 'vendors', 'common']  // 指定需要的 chunk
    }),
    
    // about 页面
    new HtmlWebpackPlugin({
      template: './public/about.html',
      filename: 'about.html',
      chunks: ['about', 'vendors', 'common']
    })
  ],
  
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },
        common: {
          minChunks: 2,
          name: 'common',
          chunks: 'all'
        }
      }
    }
  }
};
```

### 生成的 HTML

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Index</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- 自动注入的脚本 -->
  <script src="vendors.abc123.js"></script>
  <script src="common.def456.js"></script>
  <script src="index.ghi789.js"></script>
</body>
</html>
```

---

## 问题 6：如何处理 Runtime 代码？

**提取 Webpack runtime 到单独文件**。

### Runtime 配置

```javascript
module.exports = {
  optimization: {
    // 提取 runtime 代码
    runtimeChunk: {
      name: 'runtime'
    },
    
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

// 输出：
// - runtime.js (Webpack 运行时代码)
// - vendors.js (第三方依赖)
// - index.js (业务代码)
```

### 单个 Runtime

```javascript
module.exports = {
  optimization: {
    runtimeChunk: 'single'  // 所有入口共享一个 runtime
  }
};
```

### 多个 Runtime

```javascript
module.exports = {
  optimization: {
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`
    }
  }
};

// 输出：
// - runtime-index.js
// - runtime-about.js
// - runtime-contact.js
```

---

## 问题 7：完整的多入口配置示例

**生产环境的完整配置**。

### 完整配置

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  
  entry: {
    index: './src/pages/index/index.js',
    about: './src/pages/about/index.js',
    contact: './src/pages/contact/index.js'
  },
  
  output: {
    filename: 'js/[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
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
  
  plugins: [
    // 提取 CSS
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    }),
    
    // 生成 HTML
    new HtmlWebpackPlugin({
      template: './src/pages/index/index.html',
      filename: 'index.html',
      chunks: ['runtime', 'vendors', 'common', 'index']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/about/index.html',
      filename: 'about.html',
      chunks: ['runtime', 'vendors', 'common', 'about']
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/contact/index.html',
      filename: 'contact.html',
      chunks: ['runtime', 'vendors', 'common', 'contact']
    })
  ],
  
  optimization: {
    // 提取 runtime
    runtimeChunk: 'single',
    
    // 模块 ID 使用确定性算法
    moduleIds: 'deterministic',
    
    // 代码分割
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,
      maxAsyncRequests: 10,
      
      cacheGroups: {
        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 30
        },
        
        // 其他第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20
        },
        
        // 公共代码
        common: {
          minChunks: 2,
          name: 'common',
          priority: 10,
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
  ├── index.html
  ├── about.html
  ├── contact.html
  ├── js/
  │   ├── runtime.abc123.js      # Webpack 运行时
  │   ├── react.def456.js        # React 相关
  │   ├── vendors.ghi789.js      # 其他第三方库
  │   ├── common.jkl012.js       # 公共代码
  │   ├── index.mno345.js        # index 页面代码
  │   ├── about.pqr678.js        # about 页面代码
  │   └── contact.stu901.js      # contact 页面代码
  └── css/
      ├── index.abc123.css
      ├── about.def456.css
      └── contact.ghi789.css
```

---

## 总结

**核心配置**：

### 1. 多入口配置
- entry: 定义多个入口
- output.filename: 使用 [name] 占位符

### 2. 模块共享
- splitChunks.chunks: 'all'
- cacheGroups: 定义共享规则
- minChunks: 最少引用次数

### 3. 优先级控制
- priority: 设置优先级
- test: 匹配规则
- name: chunk 名称

### 4. Runtime 处理
- runtimeChunk: 提取运行时
- 'single': 单个 runtime
- 函数: 自定义命名

### 5. HTML 生成
- HtmlWebpackPlugin: 生成 HTML
- chunks: 指定需要的 chunk
- 自动注入脚本

### 6. 最佳实践
- 按库分离
- 按入口分组
- 提取公共代码
- 使用 contenthash

## 延伸阅读

- [SplitChunksPlugin 官方文档](https://webpack.js.org/plugins/split-chunks-plugin/)
- [多页面应用配置](https://webpack.js.org/concepts/entry-points/#multi-page-application)
- [缓存策略](https://webpack.js.org/guides/caching/)
- [HtmlWebpackPlugin 文档](https://github.com/jantimon/html-webpack-plugin)
