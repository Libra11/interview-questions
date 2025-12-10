---
title: Webpack5 的 Asset Modules 是什么？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 5 内置的资源模块类型，掌握如何替代 file-loader、url-loader 等。
tags:
  - Webpack
  - Webpack5
  - Asset Modules
  - 资源处理
estimatedTime: 12 分钟
keywords:
  - Asset Modules
  - 资源模块
  - file-loader
  - url-loader
highlight: Asset Modules 是 Webpack 5 内置的资源处理方式，无需额外 loader 即可处理图片、字体等资源文件。
order: 664
---

## 问题 1：什么是 Asset Modules？

**Asset Modules 是 Webpack 5 内置的资源处理模块**，用于替代 file-loader、url-loader、raw-loader。

```javascript
// Webpack 4：需要安装和配置 loader
{
  test: /\.(png|jpg|gif)$/,
  use: 'file-loader',
}

// Webpack 5：内置支持
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset/resource',
}
```

---

## 问题 2：四种资源模块类型

### asset/resource

输出文件，返回 URL（替代 file-loader）：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset/resource',
}

// import logo from './logo.png';
// logo = '/dist/images/logo.abc123.png'
```

### asset/inline

转为 Base64，内联到代码中（替代 url-loader 的 inline 模式）：

```javascript
{
  test: /\.svg$/,
  type: 'asset/inline',
}

// import icon from './icon.svg';
// icon = 'data:image/svg+xml;base64,...'
```

### asset/source

导出文件内容（替代 raw-loader）：

```javascript
{
  test: /\.txt$/,
  type: 'asset/source',
}

// import content from './file.txt';
// content = '文件内容字符串'
```

### asset

自动选择（替代 url-loader）：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024,  // 8KB 以下转 Base64
    },
  },
}
```

---

## 问题 3：配置输出路径和文件名

```javascript
module.exports = {
  output: {
    // 全局配置
    assetModuleFilename: "assets/[name].[hash:8][ext]",
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        type: "asset/resource",
        generator: {
          // 单独配置（优先级更高）
          filename: "images/[name].[hash:8][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf)$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash:8][ext]",
        },
      },
    ],
  },
};
```

---

## 问题 4：完整配置示例

```javascript
module.exports = {
  module: {
    rules: [
      // 图片
      {
        test: /\.(png|jpg|gif|webp)$/,
        type: "asset",
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 },
        },
        generator: {
          filename: "images/[name].[hash:8][ext]",
        },
      },
      // SVG 图标（内联）
      {
        test: /\.svg$/,
        type: "asset/inline",
      },
      // 字体
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash:8][ext]",
        },
      },
      // 文本文件
      {
        test: /\.txt$/,
        type: "asset/source",
      },
    ],
  },
};
```

---

## 问题 5：与旧 loader 的对应关系

| Webpack 4 Loader | Webpack 5 Asset Module |
| ---------------- | ---------------------- |
| file-loader      | asset/resource         |
| url-loader       | asset                  |
| raw-loader       | asset/source           |

迁移时只需将 loader 配置改为 type 配置即可。

## 延伸阅读

- [Asset Modules](https://webpack.js.org/guides/asset-modules/)
- [Asset Module Types](https://webpack.js.org/configuration/module/#ruletype)
