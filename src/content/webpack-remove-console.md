---
title: Webpack 如何删除 console.log？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  掌握在 Webpack 构建中移除 console.log 的多种方法，优化生产环境代码。
tags:
  - Webpack
  - console
  - 代码优化
  - 生产环境
estimatedTime: 8 分钟
keywords:
  - 删除 console
  - drop_console
  - terser
  - 生产环境
highlight: 通过 terser-webpack-plugin 的 drop_console 或 pure_funcs 配置，可以在生产构建时自动移除 console 语句。
order: 808
---

## 问题 1：使用 TerserPlugin

### 方法 1：drop_console

```javascript
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除所有 console
          },
        },
      }),
    ],
  },
};
```

### 方法 2：pure_funcs（更精确）

```javascript
compress: {
  pure_funcs: ['console.log', 'console.info'],
  // 只移除 console.log 和 console.info
  // 保留 console.error 和 console.warn
}
```

---

## 问题 2：使用 Babel 插件

```javascript
// babel.config.js
module.exports = {
  presets: ["@babel/preset-env"],
  plugins: [
    process.env.NODE_ENV === "production" && [
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ],
  ].filter(Boolean),
};
```

安装：

```bash
npm install babel-plugin-transform-remove-console -D
```

---

## 问题 3：条件配置

```javascript
// webpack.config.js
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction, // 只在生产环境移除
          },
        },
      }),
    ],
  },
};
```

---

## 问题 4：保留特定 console

```javascript
// 使用 pure_funcs 精确控制
compress: {
  pure_funcs: [
    'console.log',
    'console.info',
    'console.debug',
    // 不包含 console.error 和 console.warn
  ],
}
```

或者在代码中使用特殊标记：

```javascript
// 这个会被保留
console.error("Critical error");

// 这个会被移除
console.log("Debug info");
```

---

## 问题 5：使用 DefinePlugin 替代

```javascript
const webpack = require("webpack");

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      "console.log": "(() => {})", // 替换为空函数
    }),
  ],
};
```

**注意**：这种方法不如 TerserPlugin 彻底，推荐使用 TerserPlugin。

## 延伸阅读

- [TerserWebpackPlugin](https://webpack.js.org/plugins/terser-webpack-plugin/)
- [babel-plugin-transform-remove-console](https://www.npmjs.com/package/babel-plugin-transform-remove-console)
