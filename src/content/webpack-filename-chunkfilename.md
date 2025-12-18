---
title: Webpack output.filename 与 chunkFilename 的区别？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 中 filename 和 chunkFilename 的区别，以及它们分别控制哪些文件的命名。
tags:
  - Webpack
  - output
  - filename
  - chunk
estimatedTime: 10 分钟
keywords:
  - filename
  - chunkFilename
  - Webpack 输出
highlight: filename 控制入口 chunk 的文件名，chunkFilename 控制非入口 chunk（如动态导入）的文件名。
order: 737
---

## 问题 1：filename 是什么？

**filename 决定了入口 chunk 的输出文件名**。入口 chunk 就是由 entry 配置直接生成的 chunk。

```javascript
module.exports = {
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
  output: {
    filename: "[name].bundle.js",
    // 输出：main.bundle.js, admin.bundle.js
  },
};
```

---

## 问题 2：chunkFilename 是什么？

**chunkFilename 决定了非入口 chunk 的输出文件名**。非入口 chunk 主要包括：

1. **动态导入（import()）产生的 chunk**
2. **SplitChunksPlugin 分离出的公共 chunk**

```javascript
module.exports = {
  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[name].chunk.js",
  },
};

// 代码中使用动态导入
import("./module.js"); // 会生成 module.chunk.js
```

---

## 问题 3：两者的对比

```javascript
module.exports = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    filename: "[name].[contenthash].js",
    chunkFilename: "[name].[contenthash].chunk.js",
  },
};
```

| 配置项        | 控制的文件类型       | 示例                    |
| ------------- | -------------------- | ----------------------- |
| filename      | 入口 chunk           | main.abc123.js          |
| chunkFilename | 非入口 chunk（异步） | vendors.def456.chunk.js |

---

## 问题 4：实际输出示例

假设有以下代码：

```javascript
// index.js（入口文件）
import React from "react";
import("./LazyComponent"); // 动态导入
```

配置：

```javascript
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "[name].js",
    chunkFilename: "[id].async.js",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
};
```

输出结果：

```
dist/
├── main.js              # 入口 chunk（filename）
├── vendors.js           # splitChunks 分离的（可能用 filename 或 chunkFilename）
└── 1.async.js           # 动态导入的（chunkFilename）
```

---

## 问题 5：如何给异步 chunk 命名？

默认情况下，动态导入的 chunk 会用数字 ID 命名。可以通过魔法注释指定名称：

```javascript
// 使用 webpackChunkName 注释
import(/* webpackChunkName: "lazy-component" */ "./LazyComponent");

// 输出：lazy-component.chunk.js
```

这样配合 `chunkFilename: '[name].chunk.js'` 就能得到有意义的文件名。

## 延伸阅读

- [Output filename](https://webpack.js.org/configuration/output/#outputfilename)
- [Output chunkFilename](https://webpack.js.org/configuration/output/#outputchunkfilename)
- [Magic Comments](https://webpack.js.org/api/module-methods/#magic-comments)
