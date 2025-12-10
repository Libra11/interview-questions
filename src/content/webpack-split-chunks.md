---
title: Webpack SplitChunksPlugin 的配置？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 SplitChunksPlugin 的配置选项，掌握代码分割的核心策略。
tags:
  - Webpack
  - SplitChunks
  - 代码分割
  - 性能优化
estimatedTime: 18 分钟
keywords:
  - SplitChunksPlugin
  - 代码分割
  - chunks
  - cacheGroups
highlight: SplitChunksPlugin 通过 cacheGroups 配置分割策略，将公共代码和第三方库提取到单独的 chunk。
order: 624
---

## 问题 1：SplitChunksPlugin 是什么？

**SplitChunksPlugin 是 Webpack 内置的代码分割插件**，用于将代码拆分成多个 chunk，实现：

- 提取公共模块，避免重复打包
- 分离第三方库，利用浏览器缓存
- 按需加载，减少首屏体积

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all", // 开启代码分割
    },
  },
};
```

---

## 问题 2：基本配置选项

```javascript
optimization: {
  splitChunks: {
    // 对哪些 chunk 生效：'all' | 'async' | 'initial'
    chunks: 'all',

    // 生成 chunk 的最小体积（字节）
    minSize: 20000,

    // 拆分前必须共享模块的最小 chunks 数
    minChunks: 1,

    // 按需加载时的最大并行请求数
    maxAsyncRequests: 30,

    // 入口点的最大并行请求数
    maxInitialRequests: 30,

    // chunk 名称分隔符
    automaticNameDelimiter: '~',

    // 缓存组（核心配置）
    cacheGroups: {
      // ...
    },
  },
}
```

---

## 问题 3：chunks 选项详解

```javascript
// 'async'：只分割异步 chunk（默认）
chunks: 'async',
// import('./module') 会被分割

// 'initial'：只分割入口 chunk
chunks: 'initial',
// import 'lodash' 会被分割

// 'all'：所有 chunk 都分割（推荐）
chunks: 'all',
// 异步和同步都会被分割
```

---

## 问题 4：cacheGroups 配置

cacheGroups 是分割策略的核心：

```javascript
cacheGroups: {
  // 第三方库
  vendors: {
    test: /[\\/]node_modules[\\/]/,
    name: 'vendors',
    chunks: 'all',
    priority: 10,  // 优先级
  },

  // 公共模块
  common: {
    minChunks: 2,  // 至少被 2 个 chunk 引用
    name: 'common',
    chunks: 'all',
    priority: 5,
    reuseExistingChunk: true,  // 复用已存在的 chunk
  },

  // React 相关库单独打包
  react: {
    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
    name: 'react',
    chunks: 'all',
    priority: 20,  // 优先级高于 vendors
  },
}
```

**priority** 决定模块归属哪个 cacheGroup，数值越大优先级越高。

---

## 问题 5：实际项目配置示例

```javascript
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // React 生态
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
        name: 'react',
        priority: 30,
      },
      // UI 库
      antd: {
        test: /[\\/]node_modules[\\/]antd[\\/]/,
        name: 'antd',
        priority: 25,
      },
      // 其他第三方库
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
      // 业务公共代码
      common: {
        minChunks: 2,
        name: 'common',
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
  // 将 runtime 代码单独提取
  runtimeChunk: 'single',
}
```

输出结果：

```
dist/
├── react.js        # React 相关
├── antd.js         # Antd 组件库
├── vendors.js      # 其他第三方库
├── common.js       # 业务公共代码
├── runtime.js      # Webpack 运行时
└── main.js         # 业务代码
```

## 延伸阅读

- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Code Splitting](https://webpack.js.org/guides/code-splitting/)
