---
title: Webpack 如何优化产物大小
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  全面介绍 Webpack 优化打包体积的各种方法。从代码分割、压缩、tree-shaking 到资源优化，
  系统性地讲解如何减小打包产物的大小。
tags:
  - Webpack
  - 性能优化
  - 打包优化
  - 体积优化
estimatedTime: 28 分钟
keywords:
  - Webpack 优化
  - 打包体积
  - 代码分割
  - 压缩优化
highlight: 通过代码分割、压缩、tree-shaking 等多种手段优化打包体积
order: 213
---

## 问题 1：有哪些优化产物大小的方法？

**代码分割、压缩、tree-shaking、外部化依赖等**。

### 优化策略概览

```javascript
// 1. 代码分割（Code Splitting）
// 2. 压缩（Minification）
// 3. Tree Shaking
// 4. 外部化依赖（Externals）
// 5. 按需加载（Lazy Loading）
// 6. 资源优化（Asset Optimization）
// 7. Scope Hoisting
// 8. 移除无用代码
```

---

## 问题 2：如何使用代码分割优化？

**将代码分割成多个 chunk，按需加载**。

### SplitChunks 配置

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,        // 最小 20KB
      maxSize: 244000,       // 最大 244KB
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      
      cacheGroups: {
        // React 相关
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
          reuseExistingChunk: true
        },
        
        // UI 库
        ui: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: 'ui',
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

### 动态导入

```javascript
// 路由懒加载
const Home = () => import(/* webpackChunkName: "home" */ './pages/Home');
const About = () => import(/* webpackChunkName: "about" */ './pages/About');

// 条件加载
async function loadHeavyFeature() {
  if (needsFeature) {
    const module = await import(/* webpackChunkName: "heavy-feature" */ './HeavyFeature');
    module.init();
  }
}
```

---

## 问题 3：如何配置代码压缩？

**使用 TerserPlugin 和 CssMinimizerPlugin**。

### JavaScript 压缩

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,      // 移除 console
            drop_debugger: true,     // 移除 debugger
            pure_funcs: ['console.log']  // 移除特定函数
          },
          format: {
            comments: false          // 移除注释
          }
        },
        extractComments: false       // 不提取注释到单独文件
      })
    ]
  }
};
```

### CSS 压缩

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],
  
  optimization: {
    minimizer: [
      `...`,  // 保留默认的 JS 压缩
      new CssMinimizerPlugin()
    ]
  }
};
```

---

## 问题 4：如何启用 tree-shaking？

**配置 ES Module 和 sideEffects**。

### Webpack 配置

```javascript
module.exports = {
  mode: 'production',
  
  optimization: {
    usedExports: true,    // 标记未使用的导出
    sideEffects: true     // 识别无副作用的模块
  }
};
```

### package.json 配置

```json
{
  "name": "my-app",
  "sideEffects": false,  // 所有模块无副作用
  
  // 或指定有副作用的文件
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfill.js"
  ]
}
```

### Babel 配置

```javascript
// .babelrc
{
  "presets": [
    ["@babel/preset-env", {
      "modules": false  // 保留 ES Module
    }]
  ]
}
```

---

## 问题 5：如何优化第三方库？

**使用 externals、按需引入、CDN**。

### Externals 配置

```javascript
module.exports = {
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
    'lodash': '_'
  }
};
```

### 按需引入

```javascript
// ❌ 导入整个库
import _ from 'lodash';
import { Button } from 'antd';

// ✅ 按需导入
import debounce from 'lodash/debounce';
import Button from 'antd/es/button';

// ✅ 使用 babel-plugin-import
// .babelrc
{
  "plugins": [
    ["import", {
      "libraryName": "antd",
      "style": true
    }]
  ]
}
```

### DLL Plugin（已废弃，仅供参考）

```javascript
// 现代替代方案：使用 hard-source-webpack-plugin 或 cache
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};
```

---

## 问题 6：如何优化资源文件？

**图片压缩、字体优化、SVG 优化**。

### 图片优化

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024  // 小于 8KB 转 base64
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      }
    ]
  },
  
  plugins: [
    // 图片压缩
    new ImageMinimizerPlugin({
      minimizer: {
        implementation: ImageMinimizerPlugin.imageminMinify,
        options: {
          plugins: [
            ['gifsicle', { interlaced: true }],
            ['jpegtran', { progressive: true }],
            ['optipng', { optimizationLevel: 5 }],
            ['svgo', {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false
                }
              ]
            }]
          ]
        }
      }
    })
  ]
};
```

### 字体优化

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  }
};

// 使用 font-display
// CSS
@font-face {
  font-family: 'MyFont';
  src: url('./fonts/myfont.woff2') format('woff2');
  font-display: swap;  // 优化字体加载
}
```

---

## 问题 7：如何使用 Scope Hoisting？

**减少函数声明和内存开销**。

### ModuleConcatenationPlugin

```javascript
const webpack = require('webpack');

module.exports = {
  mode: 'production',  // production 模式自动启用
  
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ]
};
```

### 效果对比

```javascript
// 源代码
// moduleA.js
export function add(a, b) {
  return a + b;
}

// moduleB.js
import { add } from './moduleA';
export function calc() {
  return add(1, 2);
}

// 没有 Scope Hoisting
(function(modules) {
  // webpack 模块系统
})([
  function(module, exports) {
    // moduleA
    exports.add = function(a, b) { return a + b; };
  },
  function(module, exports, require) {
    // moduleB
    var moduleA = require(0);
    exports.calc = function() { return moduleA.add(1, 2); };
  }
]);

// 有 Scope Hoisting
(function() {
  function add(a, b) { return a + b; }
  function calc() { return add(1, 2); }
})();
```

---

## 问题 8：如何分析和监控打包体积？

**使用分析工具找出优化点**。

### webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: true,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    })
  ]
};
```

### speed-measure-webpack-plugin

```javascript
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
  // webpack 配置
});
```

### 体积预算

```javascript
module.exports = {
  performance: {
    maxAssetSize: 244000,      // 单个资源最大 244KB
    maxEntrypointSize: 244000, // 入口最大 244KB
    hints: 'warning',          // 超出时警告
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js');
    }
  }
};
```

---

## 总结

**优化策略**：

### 1. 代码分割
- SplitChunks 配置
- 动态导入
- 路由懒加载

### 2. 代码压缩
- TerserPlugin（JS）
- CssMinimizerPlugin（CSS）
- 移除 console 和注释

### 3. Tree Shaking
- 使用 ES Module
- 配置 sideEffects
- Babel 不转换模块

### 4. 第三方库优化
- Externals 外部化
- 按需引入
- 使用 ES Module 版本

### 5. 资源优化
- 图片压缩
- 小图片 base64
- 字体优化

### 6. 其他优化
- Scope Hoisting
- 缓存配置
- 体积预算

### 7. 分析工具
- webpack-bundle-analyzer
- speed-measure-webpack-plugin
- 性能监控

## 延伸阅读

- [Webpack 性能优化](https://webpack.js.org/guides/build-performance/)
- [代码分割指南](https://webpack.js.org/guides/code-splitting/)
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [优化最佳实践](https://web.dev/fast/)
