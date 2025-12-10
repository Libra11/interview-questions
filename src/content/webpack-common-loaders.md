---
title: Webpack 常见 Loader 都有哪些？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  盘点 Webpack 中最常用的 Loader，包括 JavaScript、CSS、文件资源等各类 Loader 的作用和配置。
tags:
  - Webpack
  - Loader
  - babel-loader
  - css-loader
estimatedTime: 15 分钟
keywords:
  - 常见 Loader
  - babel-loader
  - css-loader
  - file-loader
highlight: 掌握 babel-loader、css-loader、style-loader、file-loader 等核心 Loader 的作用和配置方式。
order: 613
---

## 问题 1：JavaScript 相关 Loader

### babel-loader

将 ES6+ 代码转换为向后兼容的 JavaScript：

```javascript
{
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
    },
  },
}
```

### ts-loader

编译 TypeScript：

```javascript
{
  test: /\.tsx?$/,
  use: 'ts-loader',
  exclude: /node_modules/,
}
```

---

## 问题 2：CSS 相关 Loader

### css-loader

解析 CSS 文件，处理 `@import` 和 `url()`：

```javascript
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader'],
}
```

### style-loader

将 CSS 注入到 DOM 的 `<style>` 标签中：

```javascript
// 通常与 css-loader 配合使用
use: ["style-loader", "css-loader"];
```

### sass-loader / less-loader

编译 Sass/Less 为 CSS：

```javascript
{
  test: /\.scss$/,
  use: ['style-loader', 'css-loader', 'sass-loader'],
}
```

### postcss-loader

使用 PostCSS 处理 CSS（如自动添加前缀）：

```javascript
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader', 'postcss-loader'],
}
```

---

## 问题 3：文件资源 Loader

### file-loader

将文件输出到输出目录，返回文件 URL：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  use: {
    loader: 'file-loader',
    options: {
      name: '[name].[hash:8].[ext]',
      outputPath: 'images/',
    },
  },
}
```

### url-loader

小文件转为 Base64，大文件使用 file-loader：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  use: {
    loader: 'url-loader',
    options: {
      limit: 8192,  // 8KB 以下转 Base64
      fallback: 'file-loader',
    },
  },
}
```

### Webpack 5 资源模块

Webpack 5 内置了资源处理，不再需要 file-loader 和 url-loader：

```javascript
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',  // 自动选择
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024,  // 8KB
    },
  },
}
```

---

## 问题 4：其他常用 Loader

### vue-loader

处理 Vue 单文件组件：

```javascript
{
  test: /\.vue$/,
  use: 'vue-loader',
}
```

### html-loader

处理 HTML 文件中的资源引用：

```javascript
{
  test: /\.html$/,
  use: 'html-loader',
}
```

### raw-loader

将文件作为字符串导入：

```javascript
{
  test: /\.txt$/,
  use: 'raw-loader',
}
```

---

## 问题 5：Loader 配置速查表

| Loader         | 作用                            |
| -------------- | ------------------------------- |
| babel-loader   | ES6+ 转 ES5                     |
| ts-loader      | 编译 TypeScript                 |
| css-loader     | 解析 CSS                        |
| style-loader   | CSS 注入 DOM                    |
| sass-loader    | 编译 Sass                       |
| less-loader    | 编译 Less                       |
| postcss-loader | PostCSS 处理                    |
| file-loader    | 文件输出（Webpack 5 废弃）      |
| url-loader     | 小文件 Base64（Webpack 5 废弃） |
| vue-loader     | Vue 单文件组件                  |

## 延伸阅读

- [Loaders](https://webpack.js.org/loaders/)
- [Asset Modules](https://webpack.js.org/guides/asset-modules/)
