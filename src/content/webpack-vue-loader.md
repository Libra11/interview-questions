---
title: Webpack 如何配置 Vue 单文件组件（vue-loader）？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  掌握 vue-loader 的配置方法，理解 Vue 单文件组件的编译过程。
tags:
  - Webpack
  - Vue
  - vue-loader
  - 单文件组件
estimatedTime: 12 分钟
keywords:
  - vue-loader
  - Vue SFC
  - 单文件组件
  - Vue 配置
highlight: vue-loader 将 Vue 单文件组件（.vue）解析为 JavaScript 模块，需要配合 VueLoaderPlugin 使用。
order: 683
---

## 问题 1：基本配置

```javascript
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
```

安装依赖：

```bash
npm install vue-loader vue-template-compiler -D
# Vue 3
npm install vue-loader @vue/compiler-sfc -D
```

---

## 问题 2：vue-loader 的工作原理

```vue
<!-- App.vue -->
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  data() {
    return { message: "Hello" };
  },
};
</script>

<style scoped>
div {
  color: red;
}
</style>
```

vue-loader 将其拆分为三个请求：

```javascript
// 1. template → vue-loader?type=template
// 2. script → vue-loader?type=script
// 3. style → vue-loader?type=style
```

---

## 问题 3：处理 CSS 预处理器

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.scss$/,
        use: ["vue-style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.less$/,
        use: ["vue-style-loader", "css-loader", "less-loader"],
      },
    ],
  },
};
```

在 Vue 组件中使用：

```vue
<style lang="scss" scoped>
$color: red;
div {
  color: $color;
}
</style>
```

---

## 问题 4：配置 TypeScript

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
    ],
  },
};
```

在 Vue 组件中使用：

```vue
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return { count: 0 as number };
  },
});
</script>
```

---

## 问题 5：生产环境优化

```javascript
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : "vue-style-loader",
          "css-loader",
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    isProduction &&
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash:8].css",
      }),
  ].filter(Boolean),
};
```

---

## 问题 6：Vue 3 配置

```javascript
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    }),
  ],
};
```

## 延伸阅读

- [vue-loader](https://vue-loader.vuejs.org/)
- [Vue 3 Webpack 配置](https://v3.vuejs.org/guide/installation.html#webpack)
