---
title: Webpack DllPlugin 如何提升构建速度？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 DllPlugin 的工作原理，掌握它如何通过预编译第三方库来加速构建。
tags:
  - Webpack
  - DllPlugin
  - 构建优化
  - 预编译
estimatedTime: 15 分钟
keywords:
  - DllPlugin
  - DllReferencePlugin
  - 预编译
  - 构建加速
highlight: DllPlugin 将第三方库预先打包成 DLL 文件，主构建时直接引用，避免重复编译，加速构建。
order: 658
---

## 问题 1：DllPlugin 的作用

**DllPlugin 将不常变化的第三方库预先打包**，主构建时直接引用预编译的结果，避免重复编译。

```
传统构建：
每次构建都要处理 React、lodash 等库

使用 DLL：
预编译：React、lodash → vendor.dll.js（只执行一次）
主构建：业务代码 + 引用 vendor.dll.js（每次构建）
```

---

## 问题 2：配置步骤

### 步骤 1：创建 DLL 配置文件

```javascript
// webpack.dll.config.js
const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    vendor: ["react", "react-dom", "lodash"],
  },
  output: {
    path: path.resolve(__dirname, "dll"),
    filename: "[name].dll.js",
    library: "[name]_library",
  },
  plugins: [
    new webpack.DllPlugin({
      name: "[name]_library",
      path: path.resolve(__dirname, "dll/[name].manifest.json"),
    }),
  ],
};
```

### 步骤 2：执行 DLL 构建

```bash
webpack --config webpack.dll.config.js
```

生成文件：

```
dll/
├── vendor.dll.js        # 预编译的库
└── vendor.manifest.json # 模块映射表
```

### 步骤 3：主配置引用 DLL

```javascript
// webpack.config.js
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.DllReferencePlugin({
      manifest: require("./dll/vendor.manifest.json"),
    }),
  ],
};
```

### 步骤 4：HTML 中引入 DLL

```html
<script src="dll/vendor.dll.js"></script>
<script src="dist/main.js"></script>
```

---

## 问题 3：工作原理

```
DllPlugin 构建时：
react + react-dom + lodash
         ↓
    vendor.dll.js（打包后的代码）
    vendor.manifest.json（模块 ID 映射）

主构建时：
import React from 'react';
         ↓
    查找 manifest.json
         ↓
    发现 react 在 DLL 中
         ↓
    生成引用代码，不重新打包
```

---

## 问题 4：Webpack 5 中的替代方案

**Webpack 5 的持久化缓存使 DllPlugin 变得不那么必要**：

```javascript
// Webpack 5 配置
module.exports = {
  cache: {
    type: "filesystem",
  },
};
```

对比：

| 特性       | DllPlugin              | Webpack 5 Cache |
| ---------- | ---------------------- | --------------- |
| 配置复杂度 | 高（需要单独配置）     | 低（一行配置）  |
| 维护成本   | 高（库更新需重新构建） | 低（自动处理）  |
| 效果       | 好                     | 好              |
| 推荐度     | Webpack 4              | Webpack 5       |

---

## 问题 5：何时使用 DllPlugin？

### 适合使用

- Webpack 4 项目
- 第三方库很大且很少更新
- 需要极致的构建速度优化

### 不推荐使用

- Webpack 5 项目（使用内置缓存）
- 第三方库经常更新
- 项目较小，优化收益不明显

## 延伸阅读

- [DllPlugin](https://webpack.js.org/plugins/dll-plugin/)
- [Webpack 5 Persistent Caching](https://webpack.js.org/configuration/cache/)
