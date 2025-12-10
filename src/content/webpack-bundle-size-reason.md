---
title: 为什么 Webpack 打包后文件这么大？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  分析 Webpack 打包文件过大的常见原因，掌握定位和解决问题的方法。
tags:
  - Webpack
  - 体积优化
  - 问题排查
  - 性能
estimatedTime: 12 分钟
keywords:
  - 打包体积
  - 文件过大
  - 问题排查
  - 优化
highlight: 打包文件过大通常由未配置 Tree-shaking、引入整个库、未压缩、Source Map 内联等原因导致。
order: 702
---

## 问题 1：常见原因

### 1. 未启用生产模式

```javascript
// ❌ 开发模式，不压缩
mode: "development";

// ✅ 生产模式，启用压缩和优化
mode: "production";
```

### 2. 引入了整个库

```javascript
// ❌ 引入整个 lodash（~70KB）
import _ from "lodash";

// ✅ 按需引入（~4KB）
import debounce from "lodash/debounce";
```

### 3. Tree-shaking 未生效

```javascript
// 检查 Babel 配置
// ❌ 转换为 CommonJS
modules: "commonjs";

// ✅ 保留 ES Module
modules: false;
```

### 4. Source Map 内联

```javascript
// ❌ 内联 Source Map
devtool: "inline-source-map";

// ✅ 生产环境不内联
devtool: "hidden-source-map";
```

---

## 问题 2：使用分析工具

```javascript
// webpack-bundle-analyzer
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

plugins: [new BundleAnalyzerPlugin()];
```

可视化查看每个模块的体积占比。

---

## 问题 3：检查清单

```
□ mode 是否为 'production'
□ devtool 是否正确配置
□ 是否按需引入第三方库
□ Babel modules 是否为 false
□ package.json 是否配置 sideEffects
□ 是否有重复的依赖
□ 是否引入了不必要的 polyfill
□ 图片等资源是否过大
```

---

## 问题 4：具体优化方案

### 代码分割

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
  },
}
```

### 按需加载

```javascript
const LazyComponent = lazy(() => import("./LazyComponent"));
```

### 使用更小的替代库

```javascript
// moment.js → dayjs（2KB vs 70KB）
// lodash → lodash-es + 按需引入
```

### 压缩优化

```javascript
optimization: {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: { drop_console: true },
      },
    }),
  ],
}
```

---

## 问题 5：分析命令

```bash
# 生成 stats 文件
webpack --profile --json > stats.json

# 使用在线工具分析
# https://webpack.github.io/analyse/

# 或使用 source-map-explorer
npx source-map-explorer dist/*.js
```

---

## 问题 6：体积预算

```javascript
// 设置体积警告
performance: {
  maxEntrypointSize: 250000,  // 入口文件最大 250KB
  maxAssetSize: 250000,       // 单个资源最大 250KB
  hints: 'warning',           // 超出时警告
}
```

## 延伸阅读

- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Performance](https://webpack.js.org/configuration/performance/)
