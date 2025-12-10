---
title: Webpack file-loader 与 url-loader 区别？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  对比 file-loader 和 url-loader 的区别，理解 Webpack 5 资源模块的替代方案。
tags:
  - Webpack
  - file-loader
  - url-loader
  - 资源处理
estimatedTime: 10 分钟
keywords:
  - file-loader
  - url-loader
  - Base64
  - 资源模块
highlight: file-loader 输出文件返回 URL，url-loader 小文件转 Base64 大文件回退到 file-loader。
order: 615
---

## 问题 1：file-loader 的作用

**file-loader 将文件输出到输出目录，并返回文件的 URL**。

```javascript
// 配置
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

// 使用
import logo from './logo.png';
// logo 的值是：'/images/logo.abc12345.png'
```

file-loader 做了两件事：

1. 将文件复制到输出目录
2. 返回文件的公共 URL

---

## 问题 2：url-loader 的作用

**url-loader 在 file-loader 基础上增加了 Base64 转换功能**。

小于指定大小的文件会被转换为 Base64 Data URL，大于指定大小的文件则使用 file-loader 处理。

```javascript
{
  test: /\.(png|jpg|gif)$/,
  use: {
    loader: 'url-loader',
    options: {
      limit: 8192,  // 8KB 以下转 Base64
      name: '[name].[hash:8].[ext]',
      outputPath: 'images/',
    },
  },
}
```

---

## 问题 3：两者的核心区别

| 特性      | file-loader      | url-loader                    |
| --------- | ---------------- | ----------------------------- |
| 输出方式  | 始终输出文件     | 小文件 Base64，大文件输出文件 |
| HTTP 请求 | 每个文件一个请求 | 小文件无需请求                |
| 打包体积  | 不影响 JS 体积   | 小文件会增加 JS 体积          |
| 依赖关系  | 独立             | 依赖 file-loader              |

### Base64 的优缺点

**优点**：减少 HTTP 请求数量

**缺点**：Base64 编码会使文件体积增加约 33%

所以只适合小文件（通常 8KB 以下）。

---

## 问题 4：Webpack 5 的资源模块

**Webpack 5 内置了资源处理能力**，不再需要 file-loader 和 url-loader：

```javascript
// Webpack 5 配置
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',  // 自动选择
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024,  // 8KB
    },
  },
  generator: {
    filename: 'images/[name].[hash:8][ext]',
  },
}
```

资源模块类型：

| 类型           | 等价于                    |
| -------------- | ------------------------- |
| asset/resource | file-loader               |
| asset/inline   | url-loader（始终 Base64） |
| asset/source   | raw-loader                |
| asset          | url-loader（自动选择）    |

---

## 问题 5：迁移建议

如果你在使用 Webpack 5，建议直接使用资源模块：

```javascript
// ❌ 旧方式（Webpack 4）
{
  test: /\.(png|jpg|gif)$/,
  use: 'url-loader',
}

// ✅ 新方式（Webpack 5）
{
  test: /\.(png|jpg|gif)$/,
  type: 'asset',
}
```

资源模块是 Webpack 5 的内置功能，无需安装额外依赖，配置更简洁。

## 延伸阅读

- [Asset Modules](https://webpack.js.org/guides/asset-modules/)
- [file-loader](https://webpack.js.org/loaders/file-loader/)
- [url-loader](https://webpack.js.org/loaders/url-loader/)
