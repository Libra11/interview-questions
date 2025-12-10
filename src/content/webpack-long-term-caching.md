---
title: Webpack 长效缓存如何实现？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 Webpack 长效缓存的实现策略，包括 contenthash、代码分割和稳定的模块 ID。
tags:
  - Webpack
  - 缓存
  - contenthash
  - 性能优化
estimatedTime: 15 分钟
keywords:
  - 长效缓存
  - contenthash
  - 缓存策略
  - 缓存优化
highlight: 长效缓存通过 contenthash、代码分割、稳定的模块 ID 和 runtimeChunk 实现，让未变化的文件保持缓存。
order: 650
---

## 问题 1：什么是长效缓存？

**长效缓存是让浏览器长期缓存静态资源**，只有当文件内容变化时才重新请求。

```
用户第一次访问：
main.abc123.js  → 下载并缓存
vendor.def456.js → 下载并缓存

用户第二次访问（只修改了业务代码）：
main.xyz789.js  → 重新下载（hash 变了）
vendor.def456.js → 使用缓存（hash 没变）
```

---

## 问题 2：实现长效缓存的关键配置

### 1. 使用 contenthash

```javascript
output: {
  filename: '[name].[contenthash:8].js',
  chunkFilename: '[name].[contenthash:8].chunk.js',
}
```

### 2. 提取 runtime

```javascript
optimization: {
  runtimeChunk: 'single',
}
```

### 3. 分离第三方库

```javascript
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
}
```

### 4. 稳定的模块 ID

```javascript
optimization: {
  moduleIds: 'deterministic',
  chunkIds: 'deterministic',
}
```

---

## 问题 3：完整配置示例

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "production",
  output: {
    filename: "js/[name].[contenthash:8].js",
    chunkFilename: "js/[name].[contenthash:8].chunk.js",
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash:8].css",
    }),
  ],
  optimization: {
    runtimeChunk: "single",
    moduleIds: "deterministic",
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 10,
        },
        common: {
          minChunks: 2,
          name: "common",
          priority: 5,
        },
      },
    },
  },
};
```

---

## 问题 4：服务器缓存配置

配合 Nginx 设置缓存头：

```nginx
# 带 hash 的静态资源，长期缓存
location ~* \.[a-f0-9]{8}\.(js|css|png|jpg|gif|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# HTML 文件，不缓存
location ~* \.html$ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## 问题 5：验证缓存效果

修改业务代码后检查：

```bash
# 修改前
main.abc123.js
vendors.def456.js
runtime.ghi789.js

# 修改业务代码后
main.xyz000.js      # 变了
vendors.def456.js   # 没变 ✓
runtime.ghi789.js   # 可能变（如果模块映射变了）
```

如果 vendors 的 hash 也变了，说明配置有问题，需要检查 moduleIds 和 runtimeChunk。

## 延伸阅读

- [Caching](https://webpack.js.org/guides/caching/)
- [Output Filenames](https://webpack.js.org/configuration/output/#outputfilename)
