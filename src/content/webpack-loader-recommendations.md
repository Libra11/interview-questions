---
title: Webpack Loader 推荐
category: Webpack
difficulty: 入门
updatedAt: 2025-11-27
summary: >-
  介绍 Webpack 中常用的 Loader,包括样式处理、文件处理、代码转换等各类 Loader 的使用场景和配置方法,帮助你快速搭建项目构建流程。
tags:
  - Webpack
  - Loader
  - 构建工具
  - 工程化
estimatedTime: 20 分钟
keywords:
  - Webpack Loader
  - babel-loader
  - css-loader
  - file-loader
highlight: Loader 是 Webpack 的核心概念,让 Webpack 能够处理各种类型的文件
order: 58
---

## 问题 1:什么是 Webpack Loader?

### 基本概念

Loader 是 Webpack 用来处理非 JavaScript 文件的转换器,让 Webpack 能够处理各种类型的文件。

```javascript
// Webpack 只能理解 JavaScript 和 JSON
// Loader 让 Webpack 能够处理其他类型的文件

// 例如:
import './style.css';  // css-loader 处理
import logo from './logo.png';  // file-loader 处理
import data from './data.json';  // 内置支持
```

### Loader 的执行顺序

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        // Loader 从右到左(从下到上)执行
        use: [
          'style-loader',  // 3. 将 CSS 插入到 DOM
          'css-loader',    // 2. 将 CSS 转换为 JS 模块
          'sass-loader'    // 1. 将 Sass 编译为 CSS
        ]
      }
    ]
  }
};
```

---

## 问题 2:样式相关的 Loader

### 1. css-loader 和 style-loader

```javascript
// 安装
npm install css-loader style-loader -D

// 配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',  // 将 CSS 插入到 <style> 标签
          'css-loader'     // 解析 @import 和 url()
        ]
      }
    ]
  }
};

// 使用
import './style.css';
```

### 2. sass-loader / less-loader

```javascript
// 安装
npm install sass-loader sass -D
npm install less-loader less -D

// 配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }
    ]
  }
};
```

### 3. postcss-loader

```javascript
// 安装
npm install postcss-loader autoprefixer -D

// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer')  // 自动添加浏览器前缀
  ]
};

// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'  // 在 css-loader 之前
        ]
      }
    ]
  }
};

// 效果
// 输入
.box {
  display: flex;
}

// 输出
.box {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}
```

### 4. MiniCssExtractPlugin.loader

```javascript
// 提取 CSS 到单独文件(生产环境)
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // 开发环境使用 style-loader
          // 生产环境使用 MiniCssExtractPlugin.loader
          process.env.NODE_ENV === 'production'
            ? MiniCssExtractPlugin.loader
            : 'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    })
  ]
};
```

---

## 问题 3:代码转换相关的 Loader

### 1. babel-loader

```javascript
// 安装
npm install babel-loader @babel/core @babel/preset-env -D

// 配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true  // 启用缓存
          }
        }
      }
    ]
  }
};

// .babelrc
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.25%, not dead",
      "useBuiltIns": "usage",
      "corejs": 3
    }]
  ]
}

// 效果:将 ES6+ 代码转换为 ES5
// 输入
const add = (a, b) => a + b;

// 输出
var add = function(a, b) { return a + b; };
```

### 2. ts-loader / esbuild-loader

```javascript
// TypeScript 转换
// 方式 1: ts-loader
npm install ts-loader typescript -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};

// 方式 2: esbuild-loader (更快)
npm install esbuild-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es2015'
        }
      }
    ]
  }
};
```

### 3. vue-loader

```javascript
// 处理 Vue 单文件组件
npm install vue-loader vue-template-compiler -D

const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      // 还需要配置 CSS loader
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};
```

---

## 问题 4:文件处理相关的 Loader

### 1. file-loader (Webpack 4)

```javascript
// 处理图片、字体等文件
npm install file-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash:8].[ext]',
            outputPath: 'images/'
          }
        }
      }
    ]
  }
};
```

### 2. url-loader (Webpack 4)

```javascript
// 小文件转 base64,大文件使用 file-loader
npm install url-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 8192,  // 小于 8KB 转 base64
            name: '[name].[hash:8].[ext]',
            outputPath: 'images/'
          }
        }
      }
    ]
  }
};
```

### 3. Asset Modules (Webpack 5)

```javascript
// Webpack 5 内置,无需安装
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',  // 自动选择
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024  // 8KB
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },
      {
        test: /\.svg$/,
        type: 'asset/resource'  // 总是输出文件
      },
      {
        test: /\.txt$/,
        type: 'asset/source'  // 导出源代码
      },
      {
        test: /\.png$/,
        type: 'asset/inline'  // 总是 base64
      }
    ]
  }
};
```

---

## 问题 5:其他常用 Loader

### 1. eslint-loader

```javascript
// 代码检查
npm install eslint-loader eslint -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',  // 在其他 loader 之前执行
        exclude: /node_modules/,
        use: 'eslint-loader'
      }
    ]
  }
};

// .eslintrc.js
module.exports = {
  extends: 'eslint:recommended',
  rules: {
    'no-console': 'warn'
  }
};
```

### 2. thread-loader

```javascript
// 多进程处理,加速构建
npm install thread-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: 4  // 进程数
            }
          },
          'babel-loader'
        ]
      }
    ]
  }
};
```

### 3. cache-loader

```javascript
// 缓存 loader 结果
npm install cache-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'cache-loader',  // 放在其他 loader 之前
          'babel-loader'
        ]
      }
    ]
  }
};

// Webpack 5 推荐使用内置缓存
module.exports = {
  cache: {
    type: 'filesystem'
  }
};
```

### 4. raw-loader

```javascript
// 将文件作为字符串导入
npm install raw-loader -D

module.exports = {
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: 'raw-loader'
      }
    ]
  }
};

// 使用
import content from './file.txt';
console.log(content);  // 文件内容字符串
```

---

## 问题 6:Loader 的配置技巧

### 1. 链式调用

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true  // 启用 CSS Modules
            }
          },
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  }
};
```

### 2. 条件配置

```javascript
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  }
};
```

### 3. 排除和包含

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),  // 只处理 src
        exclude: /node_modules/,  // 排除 node_modules
        use: 'babel-loader'
      }
    ]
  }
};
```

---

## 总结

**核心概念总结**:

### 1. 样式 Loader

- **css-loader**: 解析 CSS
- **style-loader**: 插入 DOM
- **sass-loader/less-loader**: 预处理器
- **postcss-loader**: 后处理器

### 2. 代码转换 Loader

- **babel-loader**: ES6+ 转换
- **ts-loader**: TypeScript 转换
- **vue-loader**: Vue 组件转换

### 3. 文件 Loader

- **file-loader**: 文件处理(Webpack 4)
- **url-loader**: 小文件 base64(Webpack 4)
- **Asset Modules**: 内置方案(Webpack 5)

### 4. 性能优化 Loader

- **thread-loader**: 多进程
- **cache-loader**: 缓存
- **esbuild-loader**: 更快的转换

## 延伸阅读

- [Webpack Loaders 官方文档](https://webpack.js.org/loaders/)
- [编写自定义 Loader](https://webpack.js.org/contribute/writing-a-loader/)
- [Loader API](https://webpack.js.org/api/loaders/)
- [常用 Loader 列表](https://webpack.js.org/loaders/)
