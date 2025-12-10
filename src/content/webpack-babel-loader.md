---
title: Webpack babel-loader 的作用是什么？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 babel-loader 在 Webpack 中的作用，掌握 Babel 转译 JavaScript 的核心配置。
tags:
  - Webpack
  - babel-loader
  - Babel
  - ES6
estimatedTime: 12 分钟
keywords:
  - babel-loader
  - Babel
  - ES6 转换
  - JavaScript 编译
highlight: babel-loader 是 Webpack 和 Babel 的桥梁，让 Webpack 能够使用 Babel 转译 JavaScript 代码。
order: 614
---

## 问题 1：babel-loader 的作用

**babel-loader 是 Webpack 和 Babel 之间的桥梁**。它让 Webpack 在打包过程中调用 Babel 来转译 JavaScript 代码。

```javascript
// 源代码（ES6+）
const fn = () => console.log("Hello");
const arr = [...[1, 2, 3]];

// babel-loader 转译后（ES5）
var fn = function () {
  console.log("Hello");
};
var arr = [].concat([1, 2, 3]);
```

主要作用：

- **语法转换**：将 ES6+ 语法转换为 ES5
- **Polyfill 注入**：为旧浏览器添加缺失的 API
- **JSX 转换**：将 React JSX 转换为 JavaScript

---

## 问题 2：基本配置

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // 排除 node_modules
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
};
```

通常会把 Babel 配置放在单独的配置文件中：

```javascript
// babel.config.js
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: "> 0.25%, not dead",
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
  ],
};
```

---

## 问题 3：常用的 Babel Preset

### @babel/preset-env

智能转换 ES6+ 语法：

```javascript
presets: [
  [
    "@babel/preset-env",
    {
      targets: {
        browsers: ["> 1%", "last 2 versions"],
      },
    },
  ],
];
```

### @babel/preset-react

转换 React JSX：

```javascript
presets: ["@babel/preset-env", "@babel/preset-react"];
```

### @babel/preset-typescript

转换 TypeScript（替代 ts-loader）：

```javascript
presets: ["@babel/preset-env", "@babel/preset-typescript"];
```

---

## 问题 4：性能优化配置

babel-loader 可能比较慢，可以通过以下方式优化：

```javascript
{
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      // 开启缓存，避免重复编译
      cacheDirectory: true,
      // 压缩缓存文件
      cacheCompression: false,
    },
  },
}
```

也可以使用 `include` 精确指定需要处理的目录：

```javascript
{
  test: /\.js$/,
  include: path.resolve(__dirname, 'src'),  // 只处理 src 目录
  use: 'babel-loader',
}
```

---

## 问题 5：babel-loader vs ts-loader

处理 TypeScript 时有两种选择：

| 特性     | babel-loader + preset-typescript | ts-loader       |
| -------- | -------------------------------- | --------------- |
| 类型检查 | ❌ 不检查                        | ✅ 检查         |
| 编译速度 | ✅ 更快                          | ❌ 较慢         |
| 配置统一 | ✅ 统一用 Babel                  | ❌ 需要两套配置 |

推荐：**使用 babel-loader，类型检查交给 IDE 或单独的 tsc 命令**。

## 延伸阅读

- [babel-loader](https://github.com/babel/babel-loader)
- [Babel 官方文档](https://babeljs.io/docs/)
- [@babel/preset-env](https://babeljs.io/docs/babel-preset-env)
