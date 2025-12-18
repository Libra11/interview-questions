---
title: 如何自定义一个 Webpack Loader？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  学习如何编写自定义 Webpack Loader，理解 Loader 的核心 API 和开发规范。
tags:
  - Webpack
  - Loader
  - 自定义 Loader
  - 前端工程化
estimatedTime: 18 分钟
keywords:
  - 自定义 Loader
  - Loader 开发
  - Loader API
highlight: Loader 本质是一个函数，接收源代码字符串，返回转换后的代码，可通过 this 访问 Webpack API。
order: 747
---

## 问题 1：Loader 的基本结构

**Loader 本质上是一个导出函数的模块**：

```javascript
// my-loader.js
module.exports = function (source) {
  // source 是文件的原始内容（字符串）
  // 返回转换后的内容
  return transformedSource;
};
```

最简单的 Loader 示例——给代码添加注释：

```javascript
// comment-loader.js
module.exports = function (source) {
  return `/* This file was processed by comment-loader */\n${source}`;
};
```

---

## 问题 2：在项目中使用自定义 Loader

```javascript
// webpack.config.js
const path = require("path");

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            // 使用绝对路径引用本地 loader
            loader: path.resolve(__dirname, "loaders/my-loader.js"),
            options: {
              // 传递给 loader 的选项
              name: "test",
            },
          },
        ],
      },
    ],
  },
  // 或者配置 resolveLoader 简化路径
  resolveLoader: {
    modules: ["node_modules", path.resolve(__dirname, "loaders")],
  },
};
```

---

## 问题 3：获取 Loader 选项

使用 `this.getOptions()` 获取配置的选项：

```javascript
module.exports = function (source) {
  // 获取 options
  const options = this.getOptions();

  console.log(options.name); // 'test'

  return source;
};
```

---

## 问题 4：异步 Loader

如果 Loader 需要执行异步操作，使用 `this.async()`：

```javascript
module.exports = function (source) {
  // 声明这是一个异步 loader
  const callback = this.async();

  // 异步操作
  someAsyncOperation(source)
    .then((result) => {
      // 第一个参数是错误，第二个是结果
      callback(null, result);
    })
    .catch((err) => {
      callback(err);
    });
};
```

---

## 问题 5：实战示例：Markdown Loader

一个将 Markdown 转换为 HTML 的 Loader：

```javascript
// markdown-loader.js
const marked = require("marked");

module.exports = function (source) {
  // 将 Markdown 转换为 HTML
  const html = marked.parse(source);

  // 返回一个 JS 模块
  return `export default ${JSON.stringify(html)}`;
};
```

使用：

```javascript
// 配置
{
  test: /\.md$/,
  use: './loaders/markdown-loader.js',
}

// 代码中使用
import content from './article.md';
document.innerHTML = content;
```

---

## 问题 6：Loader 开发的核心 API

| API               | 作用                          |
| ----------------- | ----------------------------- |
| this.getOptions() | 获取 loader 配置选项          |
| this.async()      | 声明异步 loader               |
| this.callback()   | 返回多个结果（如 source map） |
| this.emitFile()   | 输出文件                      |
| this.resourcePath | 当前处理文件的绝对路径        |
| this.rootContext  | 项目根目录                    |

```javascript
module.exports = function (source) {
  const callback = this.callback;

  // 返回多个值
  callback(
    null, // 错误
    result, // 转换后的内容
    sourceMap, // source map
    meta // 元数据
  );
};
```

## 延伸阅读

- [Writing a Loader](https://webpack.js.org/contribute/writing-a-loader/)
- [Loader Interface](https://webpack.js.org/api/loaders/)
- [Loader Utils](https://github.com/webpack/loader-utils)
