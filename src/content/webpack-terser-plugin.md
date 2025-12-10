---
title: Webpack terser-webpack-plugin 的作用？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 terser-webpack-plugin 的作用和配置，掌握 JavaScript 代码压缩的最佳实践。
tags:
  - Webpack
  - terser
  - 代码压缩
  - 性能优化
estimatedTime: 12 分钟
keywords:
  - terser-webpack-plugin
  - 代码压缩
  - 混淆
  - 优化
highlight: terser-webpack-plugin 是 Webpack 5 默认的 JavaScript 压缩工具，支持 ES6+ 语法，提供代码压缩、混淆和优化功能。
order: 677
---

## 问题 1：terser-webpack-plugin 的作用

**terser-webpack-plugin 用于压缩和优化 JavaScript 代码**：

```javascript
// 压缩前
function calculateTotal(items) {
  const total = items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);
  return total;
}

// 压缩后
function calculateTotal(t) {
  return t.reduce((t, e) => t + e.price, 0);
}
```

主要功能：

- **压缩**：移除空格、换行、注释
- **混淆**：缩短变量名
- **优化**：移除死代码、简化表达式

---

## 问题 2：基本配置

```javascript
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true, // 并行压缩
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
          },
        },
      }),
    ],
  },
};
```

---

## 问题 3：常用配置选项

```javascript
new TerserPlugin({
  // 并行压缩（提升速度）
  parallel: true,

  // 是否提取注释到单独文件
  extractComments: false,

  terserOptions: {
    // 压缩选项
    compress: {
      drop_console: true,      // 移除 console
      drop_debugger: true,     // 移除 debugger
      pure_funcs: ['console.log'],  // 移除指定函数
      passes: 2,               // 压缩次数
    },

    // 混淆选项
    mangle: {
      safari10: true,  // 兼容 Safari 10
    },

    // 输出选项
    output: {
      comments: false,  // 移除注释
      ascii_only: true, // 只输出 ASCII 字符
    },
  },
}),
```

---

## 问题 4：移除 console.log

```javascript
// 方法1：drop_console
compress: {
  drop_console: true,  // 移除所有 console
}

// 方法2：pure_funcs（更精确）
compress: {
  pure_funcs: ['console.log', 'console.info'],
  // 保留 console.error 和 console.warn
}
```

---

## 问题 5：排除特定文件

```javascript
new TerserPlugin({
  // 排除不需要压缩的文件
  exclude: /\/node_modules\/some-lib/,

  // 或使用 include
  include: /\.min\.js$/,
}),
```

---

## 问题 6：与其他压缩工具对比

| 工具      | 速度 | 压缩率 | ES6+ 支持 |
| --------- | ---- | ------ | --------- |
| terser    | 中等 | 好     | ✅        |
| esbuild   | 最快 | 中等   | ✅        |
| uglify-js | 慢   | 好     | ❌        |

Webpack 5 默认使用 terser，如需更快速度可考虑 esbuild-loader。

## 延伸阅读

- [TerserWebpackPlugin](https://webpack.js.org/plugins/terser-webpack-plugin/)
- [Terser Options](https://github.com/terser/terser#minify-options)
