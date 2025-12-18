---
title: Webpack 如何实现在高版本浏览器上使用 ES6 产物，在低版本上使用 ES5
category: Webpack
difficulty: 中级
updatedAt: 2025-11-26
summary: >-
  深入理解如何使用 Webpack 实现差异化打包，为现代浏览器提供 ES6+ 代码，
  为旧版浏览器提供 ES5 代码，优化加载性能和用户体验。
tags:
  - Webpack
  - Babel
  - 差异化打包
  - 浏览器兼容
estimatedTime: 24 分钟
keywords:
  - Webpack 差异化打包
  - ES6 ES5
  - module/nomodule
  - Babel
highlight: 通过 module/nomodule 模式实现现代浏览器加载 ES6，旧浏览器加载 ES5
order: 477
---

## 问题 1：为什么需要差异化打包？

**现代浏览器支持 ES6+，旧浏览器需要 ES5，差异化打包可以减小现代浏览器的包体积**。

### 问题场景

```javascript
// 传统方案：所有浏览器都加载 ES5 代码
// bundle.js (500KB) - 转译后的 ES5 代码

// 问题：
// 1. 现代浏览器（90%+ 用户）加载了不必要的 polyfill
// 2. 代码体积大，加载慢
// 3. 执行效率低
```

### 差异化打包方案

```javascript
// 现代浏览器加载 ES6+ 代码
// modern.js (300KB) - 原生 ES6+，体积小，执行快

// 旧浏览器加载 ES5 代码
// legacy.js (500KB) - 转译后的 ES5，兼容性好

// 优势：
// 1. 90%+ 用户体验更好
// 2. 减少 40% 的代码体积
// 3. 提升执行性能
```

---

## 问题 2：module/nomodule 模式是什么？

**利用 `<script type="module">` 实现浏览器自动选择**。

### 基本原理

```html
<!-- 现代浏览器加载 -->
<script type="module" src="modern.js"></script>

<!-- 旧浏览器加载 -->
<script nomodule src="legacy.js"></script>

<!-- 浏览器行为：
  - 支持 ES Module 的浏览器：
    * 加载 modern.js
    * 忽略 nomodule 脚本
  
  - 不支持 ES Module 的浏览器：
    * 忽略 type="module" 脚本
    * 加载 legacy.js
-->
```

### 浏览器支持

```javascript
// 支持 ES Module 的浏览器（现代浏览器）：
// - Chrome 61+
// - Firefox 60+
// - Safari 11+
// - Edge 16+

// 不支持的浏览器（旧浏览器）：
// - IE 11
// - Chrome < 61
// - Safari < 11
```

---

## 问题 3：如何配置 Webpack 实现差异化打包？

**创建两个 Webpack 配置，分别打包现代版和旧版**。

### 项目结构

```
project/
  ├── webpack.modern.js    # 现代浏览器配置
  ├── webpack.legacy.js    # 旧浏览器配置
  ├── webpack.common.js    # 公共配置
  └── src/
      └── index.js
```

### 公共配置

```javascript
// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ]
};
```

### 现代浏览器配置

```javascript
// webpack.modern.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    filename: 'modern.[contenthash].js'
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                // 只转译现代浏览器不支持的特性
                targets: {
                  esmodules: true
                },
                // 不需要 polyfill
                useBuiltIns: false,
                // 保留 ES Module
                modules: false
              }]
            ]
          }
        }
      }
    ]
  },
  
  target: ['web', 'es2015']
});
```

### 旧浏览器配置

```javascript
// webpack.legacy.js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    filename: 'legacy.[contenthash].js'
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                // 兼容旧浏览器
                targets: {
                  ie: '11'
                },
                // 按需引入 polyfill
                useBuiltIns: 'usage',
                corejs: 3
              }]
            ]
          }
        }
      }
    ]
  },
  
  target: ['web', 'es5']
});
```

### 打包脚本

```json
{
  "scripts": {
    "build:modern": "webpack --config webpack.modern.js",
    "build:legacy": "webpack --config webpack.legacy.js",
    "build": "npm run build:modern && npm run build:legacy"
  }
}
```

---

## 问题 4：如何自动注入 module/nomodule 标签？

**使用 HtmlWebpackPlugin 和自定义插件实现**。

### 自定义插件

```javascript
// ModernModePlugin.js
class ModernModePlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ModernModePlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        'ModernModePlugin',
        (data, cb) => {
          // 修改 script 标签
          data.bodyTags = data.bodyTags.map(tag => {
            if (tag.tagName === 'script' && tag.attributes.src) {
              const src = tag.attributes.src;
              
              if (src.includes('modern')) {
                // 现代浏览器脚本
                tag.attributes.type = 'module';
              } else if (src.includes('legacy')) {
                // 旧浏览器脚本
                tag.attributes.nomodule = true;
                tag.attributes.defer = true;
              }
            }
            return tag;
          });
          
          cb(null, data);
        }
      );
    });
  }
}

module.exports = ModernModePlugin;
```

### 使用插件

```javascript
// webpack.common.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModernModePlugin = require('./ModernModePlugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new ModernModePlugin()
  ]
};
```

### 生成的 HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- 现代浏览器加载 -->
  <script type="module" src="modern.abc123.js"></script>
  
  <!-- 旧浏览器加载 -->
  <script nomodule defer src="legacy.def456.js"></script>
</body>
</html>
```

---

## 问题 5：如何使用 webpack-plugin-modern-mode？

**使用现成的插件简化配置**。

### 安装

```bash
npm install --save-dev html-webpack-plugin-modern-mode
```

### 配置

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModernModePlugin = require('html-webpack-plugin-modern-mode');

module.exports = {
  entry: {
    app: './src/index.js'
  },
  
  output: {
    filename: '[name].[contenthash].js'
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    
    new ModernModePlugin({
      modern: {
        // 现代浏览器配置
        filename: 'modern.[contenthash].js',
        targets: { esmodules: true }
      },
      legacy: {
        // 旧浏览器配置
        filename: 'legacy.[contenthash].js',
        targets: { ie: 11 }
      }
    })
  ]
};
```

---

## 问题 6：如何处理 CSS 和其他资源？

**CSS 和资源文件通常不需要差异化处理**。

### CSS 处理

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer', {
                    // 根据目标浏览器添加前缀
                    overrideBrowserslist: [
                      'last 2 versions',
                      '> 1%',
                      'IE 11'
                    ]
                  }]
                ]
              }
            }
          }
        ]
      }
    ]
  },
  
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.[contenthash].css'
    })
  ]
};
```

### 图片和字体

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]'
        }
      }
    ]
  }
};
```

---

## 问题 7：差异化打包的注意事项有哪些？

**Safari 10.1 的 bug、重复加载、缓存策略等**。

### Safari 10.1 Bug

```html
<!-- Safari 10.1 会同时加载 module 和 nomodule -->
<!-- 解决方案：添加 polyfill -->

<script>
  !function() {
    var e = document,
        t = e.createElement("script");
    if (!("noModule" in t) && "onbeforeload" in t) {
      var n = !1;
      e.addEventListener("beforeload", function(e) {
        if (e.target === t) n = !0;
        else if (!e.target.hasAttribute("nomodule") || !n) return;
        e.preventDefault()
      }, !0),
      t.type = "module",
      t.src = ".",
      e.head.appendChild(t),
      t.remove()
    }
  }();
</script>

<!-- 现代浏览器脚本 -->
<script type="module" src="modern.js"></script>

<!-- 旧浏览器脚本 -->
<script nomodule src="legacy.js"></script>
```

### 避免重复加载

```javascript
// 确保资源只被加载一次
// 使用 contenthash 而不是 hash
output: {
  filename: '[name].[contenthash].js'
}

// 提取公共代码
optimization: {
  splitChunks: {
    chunks: 'all'
  }
}
```

### 缓存策略

```nginx
# Nginx 配置
location ~* \.(js|css)$ {
  # 根据文件名设置缓存
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

---

## 总结

**核心方案**：

### 1. module/nomodule 模式
- 现代浏览器加载 ES6+
- 旧浏览器加载 ES5
- 浏览器自动选择

### 2. Webpack 配置
- 两套配置文件
- 不同的 Babel 目标
- 自动注入标签

### 3. Babel 配置
- 现代版：targets: { esmodules: true }
- 旧版：targets: { ie: 11 }
- 按需 polyfill

### 4. 优化效果
- 减少 30-50% 体积
- 提升执行性能
- 改善用户体验

### 5. 注意事项
- Safari 10.1 bug
- 避免重复加载
- 合理的缓存策略

## 延伸阅读

- [Webpack 多配置](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations)
- [Babel preset-env](https://babeljs.io/docs/en/babel-preset-env)
- [module/nomodule 模式](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/)
- [现代化打包最佳实践](https://web.dev/publish-modern-javascript/)
