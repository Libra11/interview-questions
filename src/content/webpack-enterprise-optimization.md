---
title: 如何设计企业级 Webpack 优化方案？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  掌握企业级 Webpack 优化方案的设计思路，包括构建速度、产物体积和缓存策略。
tags:
  - Webpack
  - 企业级
  - 优化方案
  - 性能
estimatedTime: 20 分钟
keywords:
  - 企业级优化
  - 构建速度
  - 体积优化
  - 缓存策略
highlight: 企业级优化方案需要从构建速度、产物体积、缓存策略、监控分析四个维度综合考虑。
order: 693
---

## 问题 1：优化维度

```
企业级 Webpack 优化
├── 构建速度优化
│   ├── 开发环境
│   └── 生产环境
├── 产物体积优化
│   ├── 代码分割
│   ├── Tree-shaking
│   └── 压缩优化
├── 缓存策略
│   ├── 构建缓存
│   └── 浏览器缓存
└── 监控分析
    ├── 构建分析
    └── 运行时监控
```

---

## 问题 2：构建速度优化

```javascript
module.exports = {
  // 1. 持久化缓存
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },

  // 2. 缩小构建范围
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve("src"),
        use: [
          "thread-loader", // 3. 并行处理
          {
            loader: "babel-loader",
            options: { cacheDirectory: true },
          },
        ],
      },
    ],
    noParse: /jquery|lodash/, // 4. 跳过解析
  },

  // 5. 优化解析
  resolve: {
    extensions: [".js", ".jsx"],
    alias: { "@": path.resolve("src") },
    modules: [path.resolve("src"), "node_modules"],
  },
};
```

---

## 问题 3：产物体积优化

```javascript
module.exports = {
  optimization: {
    // 代码分割
    splitChunks: {
      chunks: "all",
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react",
          priority: 30,
        },
        antd: {
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          name: "antd",
          priority: 25,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
      },
    },

    // 压缩优化
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: { drop_console: true },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
};
```

---

## 问题 4：缓存策略

```javascript
module.exports = {
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
  },
  optimization: {
    moduleIds: "deterministic",
    chunkIds: "deterministic",
    runtimeChunk: "single",
  },
};
```

配合 CDN 和服务器缓存：

```nginx
# 带 hash 的资源，长期缓存
location ~* \.[a-f0-9]{8}\.(js|css)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

---

## 问题 5：监控分析

```javascript
// 构建分析
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
    process.env.MEASURE && new SpeedMeasurePlugin(),
  ].filter(Boolean),
};
```

---

## 问题 6：完整方案示例

```javascript
// 企业级 Webpack 配置
const config = {
  mode: "production",

  // 构建速度
  cache: { type: "filesystem" },
  parallelism: 4,

  // 产物优化
  optimization: {
    splitChunks: {
      /* 精细的分割策略 */
    },
    minimizer: [
      /* 压缩配置 */
    ],
    moduleIds: "deterministic",
    runtimeChunk: "single",
  },

  // 输出配置
  output: {
    filename: "[name].[contenthash:8].js",
    publicPath: "https://cdn.example.com/",
  },

  // 性能预算
  performance: {
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    hints: "warning",
  },
};
```

## 延伸阅读

- [Build Performance](https://webpack.js.org/guides/build-performance/)
- [Caching](https://webpack.js.org/guides/caching/)
