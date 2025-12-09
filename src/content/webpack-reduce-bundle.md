---
title: Webpack/ESBuild 如何减少 bundle 体积？
category: 工程化
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  掌握减少打包体积的各种方法，优化前端应用加载性能。
tags:
  - Webpack
  - ESBuild
  - 打包优化
  - 性能
estimatedTime: 15 分钟
keywords:
  - bundle size
  - tree shaking
  - code splitting
  - minification
highlight: 减少 bundle 体积的方法：Tree Shaking、代码分割、压缩、按需引入、外部化依赖。
order: 270
---

## 问题 1：Tree Shaking

### 原理

移除未使用的代码（Dead Code Elimination）。

```javascript
// math.js
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export function multiply(a, b) {
  return a * b;
}

// app.js
import { add } from "./math";
console.log(add(1, 2));

// 打包结果只包含 add，不包含 subtract 和 multiply
```

### 配置

```javascript
// webpack.config.js
module.exports = {
  mode: 'production',  // 生产模式自动启用
  optimization: {
    usedExports: true,  // 标记未使用的导出
    minimize: true,     // 压缩时移除
  }
};

// package.json
{
  "sideEffects": false  // 标记无副作用，允许 tree shaking
}
```

---

## 问题 2：代码分割

### 入口分割

```javascript
// webpack.config.js
module.exports = {
  entry: {
    main: "./src/index.js",
    vendor: "./src/vendor.js",
  },
};
```

### 动态导入

```javascript
// 自动分割
const Component = () => import("./Component");

// Webpack magic comments
import(
  /* webpackChunkName: "my-chunk" */
  "./Component"
);
```

### SplitChunks

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
};
```

---

## 问题 3：压缩代码

### JavaScript 压缩

```javascript
// webpack.config.js
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
            drop_debugger: true, // 移除 debugger
          },
        },
      }),
    ],
  },
};
```

### CSS 压缩

```javascript
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
};
```

---

## 问题 4：按需引入

### Lodash

```javascript
// ❌ 引入整个库
import _ from "lodash";
_.debounce();

// ✅ 按需引入
import debounce from "lodash/debounce";
debounce();

// 或使用 babel-plugin-lodash
import { debounce } from "lodash"; // 自动转换
```

### Ant Design

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      "import",
      {
        libraryName: "antd",
        libraryDirectory: "es",
        style: "css",
      },
    ],
  ],
};

// 使用
import { Button } from "antd"; // 只引入 Button
```

---

## 问题 5：外部化依赖

### externals

```javascript
// webpack.config.js
module.exports = {
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
  },
};

// index.html 使用 CDN
<script src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js"></script>;
```

---

## 问题 6：ESBuild 优化

### 基本配置

```javascript
// esbuild.config.js
import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  splitting: true, // 代码分割
  format: "esm",
  treeShaking: true,
  outdir: "dist",
});
```

### Vite 中使用

```javascript
// vite.config.js
export default {
  build: {
    minify: "esbuild", // 使用 esbuild 压缩
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
};
```

---

## 问题 7：分析工具

### webpack-bundle-analyzer

```javascript
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
```

### source-map-explorer

```bash
npx source-map-explorer dist/main.js
```

## 总结

| 方法         | 效果             |
| ------------ | ---------------- |
| Tree Shaking | 移除未使用代码   |
| 代码分割     | 按需加载         |
| 压缩         | 减小文件体积     |
| 按需引入     | 只引入需要的模块 |
| 外部化       | 使用 CDN         |

## 延伸阅读

- [Webpack 优化](https://webpack.js.org/guides/build-performance/)
- [ESBuild 文档](https://esbuild.github.io/)
