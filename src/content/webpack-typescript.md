---
title: Webpack 如何与 TypeScript 一起使用？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 Webpack 中配置 TypeScript 的多种方式，包括 ts-loader 和 babel-loader。
tags:
  - Webpack
  - TypeScript
  - ts-loader
  - 配置
estimatedTime: 12 分钟
keywords:
  - TypeScript
  - ts-loader
  - babel-loader
  - 类型检查
highlight: Webpack 支持通过 ts-loader 或 babel-loader + @babel/preset-typescript 编译 TypeScript，各有优缺点。
order: 684
---

## 问题 1：使用 ts-loader

```javascript
module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
```

需要 tsconfig.json：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

---

## 问题 2：使用 babel-loader

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-typescript",
              "@babel/preset-react",
            ],
          },
        },
      },
    ],
  },
};
```

**注意**：babel-loader 不做类型检查，需要单独运行 `tsc --noEmit`。

---

## 问题 3：ts-loader vs babel-loader

| 特性       | ts-loader | babel-loader        |
| ---------- | --------- | ------------------- |
| 类型检查   | ✅ 内置   | ❌ 需要单独运行 tsc |
| 构建速度   | 较慢      | 较快                |
| Babel 插件 | ❌ 不支持 | ✅ 支持             |
| 配置复杂度 | 简单      | 中等                |

---

## 问题 4：加速 ts-loader

### transpileOnly 模式

```javascript
{
  loader: 'ts-loader',
  options: {
    transpileOnly: true,  // 跳过类型检查
  },
}
```

配合 fork-ts-checker-webpack-plugin 在单独进程检查类型：

```javascript
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  plugins: [new ForkTsCheckerWebpackPlugin()],
};
```

---

## 问题 5：使用 esbuild-loader（最快）

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2015",
        },
      },
    ],
  },
};
```

esbuild 速度极快，但不支持某些 TypeScript 特性（如 const enum）。

---

## 问题 6：完整配置示例

```javascript
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: "./tsconfig.json",
      },
    }),
  ],
};
```

## 延伸阅读

- [TypeScript](https://webpack.js.org/guides/typescript/)
- [ts-loader](https://github.com/TypeStrong/ts-loader)
