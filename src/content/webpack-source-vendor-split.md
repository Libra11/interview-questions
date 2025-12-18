---
title: Webpack 在编译产物时如何区分 source 代码和外部依赖代码
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack 如何区分和处理源代码与第三方依赖。通过合理的代码分割配置，
  可以将业务代码和依赖代码分离，优化缓存策略和加载性能。
tags:
  - Webpack
  - 代码分割
  - SplitChunks
  - 打包优化
estimatedTime: 24 分钟
keywords:
  - Webpack 代码分割
  - SplitChunks
  - vendor 分离
  - 缓存优化
highlight: 通过 SplitChunksPlugin 配置 cacheGroups 实现源码和依赖的分离
order: 473
---

## 问题 1：为什么要区分源代码和依赖代码？

**分离源码和依赖可以优化缓存策略，提升加载性能**。

### 问题场景

```javascript
// 不分离的情况
// bundle.js (2MB)
// - 业务代码 (200KB) - 经常变化
// - React (100KB) - 很少变化
// - Lodash (50KB) - 很少变化
// - 其他依赖 (1.65MB) - 很少变化

// 问题：
// 1. 业务代码改动，整个 bundle 都要重新下载
// 2. 浏览器缓存失效
// 3. 用户体验差
```

### 分离后的效果

```javascript
// 分离后
// main.js (200KB) - 业务代码，经常变化
// vendor.js (1.8MB) - 第三方依赖，很少变化

// 优势：
// 1. 业务代码改动，只需重新下载 main.js
// 2. vendor.js 可以长期缓存
// 3. 并行加载，提升性能
```

---

## 问题 2：如何使用 SplitChunksPlugin 分离代码？

**通过 optimization.splitChunks 配置实现代码分离**。

### 基本配置

```javascript
// webpack.config.js
module.exports = {
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

### 打包结果

```
dist/
  ├── main.js          # 业务代码
  ├── vendors.js       # node_modules 中的依赖
  └── common.js        # 被多次引用的公共代码
```

---

## 问题 3：cacheGroups 的详细配置有哪些？

**cacheGroups 支持多种配置选项来精细控制代码分割**。

### 完整配置示例

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,        // 最小尺寸（字节）
      minRemainingSize: 0,   // 剩余最小尺寸
      minChunks: 1,          // 最少被引用次数
      maxAsyncRequests: 30,  // 最大异步请求数
      maxInitialRequests: 30, // 最大初始请求数
      
      cacheGroups: {
        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20
        },
        
        // UI 库
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          priority: 15
        },
        
        // 其他第三方库
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        
        // 公共代码
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

### 配置项说明

```javascript
{
  // test: 匹配规则
  test: /[\\/]node_modules[\\/]/,
  
  // name: chunk 名称
  name: 'vendors',
  
  // priority: 优先级（数字越大优先级越高）
  priority: 10,
  
  // minChunks: 最少被引用次数
  minChunks: 2,
  
  // minSize: 最小尺寸
  minSize: 20000,
  
  // maxSize: 最大尺寸（超过会继续分割）
  maxSize: 244000,
  
  // reuseExistingChunk: 复用已存在的 chunk
  reuseExistingChunk: true,
  
  // enforce: 强制执行
  enforce: true
}
```

---

## 问题 4：如何按库分离依赖？

**将不同的第三方库分离到不同的 chunk**。

### 按库分离

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        // React 生态
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20
        },
        
        // 状态管理
        redux: {
          test: /[\\/]node_modules[\\/](redux|react-redux|@reduxjs)[\\/]/,
          name: 'redux-vendor',
          priority: 20
        },
        
        // UI 组件库
        ui: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'ui-vendor',
          priority: 20
        },
        
        // 工具库
        utils: {
          test: /[\\/]node_modules[\\/](lodash|moment|dayjs)[\\/]/,
          name: 'utils-vendor',
          priority: 20
        },
        
        // 其他依赖
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        }
      }
    }
  }
};
```

### 打包结果

```
dist/
  ├── main.js              # 业务代码
  ├── react-vendor.js      # React 相关
  ├── redux-vendor.js      # Redux 相关
  ├── ui-vendor.js         # UI 组件库
  ├── utils-vendor.js      # 工具库
  └── vendor.js            # 其他依赖
```

---

## 问题 5：如何处理异步加载的模块？

**使用 chunks 配置控制分割范围**。

### chunks 配置

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
          chunks: 'all'  // 可以单独配置
        }
      }
    }
  }
};
```

### 异步加载示例

```javascript
// 源代码
// 异步加载组件
const Dashboard = () => import('./Dashboard');
const Profile = () => import('./Profile');

// 配置 chunks: 'async'
// 结果：Dashboard 和 Profile 中的依赖会被分离

// 配置 chunks: 'all'
// 结果：所有依赖都会被分离，包括同步和异步
```

---

## 问题 6：如何优化分割策略？

**根据项目特点调整分割粒度**。

### 粗粒度分割（简单项目）

```javascript
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

// 结果：只有两个文件
// - main.js (业务代码)
// - vendors.js (所有依赖)
```

### 细粒度分割（大型项目）

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,  // 增加初始请求数
      maxAsyncRequests: 10,
      
      cacheGroups: {
        // 按库分离
        react: {
          test: /[\\/]node_modules[\\/]react/,
          name: 'react',
          priority: 30
        },
        
        antd: {
          test: /[\\/]node_modules[\\/]antd/,
          name: 'antd',
          priority: 25
        },
        
        // 按大小分离
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
          minSize: 30000,
          maxSize: 200000  // 超过 200KB 继续分割
        }
      }
    }
  }
};
```

### 动态分割

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // 根据包名动态命名
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            
            return `npm.${packageName.replace('@', '')}`;
          },
          priority: 10
        }
      }
    }
  }
};

// 结果：每个包一个文件
// - npm.react.js
// - npm.react-dom.js
// - npm.lodash.js
```

---

## 问题 7：如何验证分割效果？

**使用 webpack-bundle-analyzer 分析打包结果**。

### 安装和配置

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',  // 生成静态 HTML 文件
      reportFilename: 'bundle-report.html',
      openAnalyzer: true
    })
  ]
};
```

### 分析指标

```javascript
// 查看打包结果
npm run build

// 分析报告会显示：
// 1. 每个 chunk 的大小
// 2. 每个模块的占比
// 3. 依赖关系
// 4. 重复模块

// 优化建议：
// - 如果某个 chunk 过大，考虑继续分割
// - 如果有重复模块，检查配置
// - 如果某些库很少使用，考虑按需引入
```

---

## 总结

**核心配置**：

### 1. 基本分离
- 使用 SplitChunksPlugin
- 配置 cacheGroups
- 区分 vendor 和 source

### 2. 配置选项
- test: 匹配规则
- name: chunk 名称
- priority: 优先级
- chunks: 分割范围

### 3. 分离策略
- 粗粒度：简单项目
- 细粒度：大型项目
- 按库分离：常用库
- 按大小分离：控制体积

### 4. 优化建议
- 合理设置优先级
- 控制 chunk 数量
- 使用分析工具
- 根据缓存策略调整

### 5. 最佳实践
- 框架库单独分离
- 业务代码独立
- 公共代码提取
- 异步模块优化

## 延伸阅读

- [SplitChunksPlugin 官方文档](https://webpack.js.org/plugins/split-chunks-plugin/)
- [代码分割指南](https://webpack.js.org/guides/code-splitting/)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [缓存策略优化](https://webpack.js.org/guides/caching/)
