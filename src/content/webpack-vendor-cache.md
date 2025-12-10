---
title: 如何保证 Vendor Chunk 的缓存命中率？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握保证 vendor chunk 缓存稳定的配置策略，避免业务代码变化影响第三方库的缓存。
tags:
  - Webpack
  - 缓存
  - vendor
  - SplitChunks
estimatedTime: 12 分钟
keywords:
  - vendor 缓存
  - 缓存命中
  - splitChunks
  - 缓存优化
highlight: 通过 runtimeChunk、deterministic moduleIds、合理的 splitChunks 配置，确保 vendor chunk 的 hash 稳定。
order: 653
---

## 问题 1：Vendor Chunk 缓存失效的原因

常见的缓存失效原因：

### 1. 模块 ID 变化

```javascript
// 新增模块可能导致所有模块 ID 重新分配
// vendor 中的模块 ID 变了，hash 就变了
```

### 2. Runtime 代码内嵌

```javascript
// 默认 runtime 内嵌在入口 chunk
// 模块映射变化会影响入口 chunk 的 hash
```

### 3. 异步 chunk 引用变化

```javascript
// 新增动态导入可能影响 chunk ID
// 进而影响引用这些 chunk 的代码
```

---

## 问题 2：核心配置

```javascript
module.exports = {
  optimization: {
    // 1. 提取 runtime
    runtimeChunk: "single",

    // 2. 稳定的模块 ID
    moduleIds: "deterministic",

    // 3. 稳定的 chunk ID
    chunkIds: "deterministic",

    // 4. 分离 vendor
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
      },
    },
  },
};
```

---

## 问题 3：进一步优化：拆分大型库

将频繁更新的库和稳定的库分开：

```javascript
splitChunks: {
  cacheGroups: {
    // React 生态（非常稳定）
    react: {
      test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
      name: 'react',
      chunks: 'all',
      priority: 30,
    },
    // UI 库（较稳定）
    ui: {
      test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
      name: 'ui',
      chunks: 'all',
      priority: 25,
    },
    // 工具库（稳定）
    utils: {
      test: /[\\/]node_modules[\\/](lodash|moment|dayjs)[\\/]/,
      name: 'utils',
      chunks: 'all',
      priority: 20,
    },
    // 其他第三方库
    vendors: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all',
      priority: 10,
    },
  },
}
```

这样，更新某个库只会影响对应的 chunk。

---

## 问题 4：验证缓存稳定性

```bash
# 第一次构建
npm run build
# 记录 vendor 的 hash：vendors.abc123.js

# 修改业务代码
echo "// comment" >> src/index.js

# 第二次构建
npm run build
# 检查 vendor 的 hash 是否变化
# 如果还是 vendors.abc123.js，说明配置正确
```

---

## 问题 5：完整配置示例

```javascript
module.exports = {
  mode: "production",
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].chunk.js",
  },
  optimization: {
    runtimeChunk: "single",
    moduleIds: "deterministic",
    chunkIds: "deterministic",
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
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
        common: {
          minChunks: 2,
          name: "common",
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
