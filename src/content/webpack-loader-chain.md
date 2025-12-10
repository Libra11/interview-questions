---
title: Webpack Loader 是如何串联执行的？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack Loader 的链式调用机制，掌握多个 Loader 如何协同工作处理文件。
tags:
  - Webpack
  - Loader
  - 链式调用
  - 管道模式
estimatedTime: 12 分钟
keywords:
  - Loader 链式调用
  - Loader 串联
  - 管道模式
highlight: Loader 采用管道模式串联执行，前一个 Loader 的输出是后一个 Loader 的输入。
order: 611
---

## 问题 1：Loader 的链式调用

当配置多个 Loader 时，它们会**串联执行**，形成一个处理管道：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "style-loader", // 3. 将 CSS 注入 DOM
          "css-loader", // 2. 解析 CSS
          "sass-loader", // 1. 编译 Sass
        ],
      },
    ],
  },
};
```

执行流程：

```
.scss 文件
    ↓
sass-loader（Sass → CSS）
    ↓
css-loader（CSS → JS 模块）
    ↓
style-loader（注入 DOM）
    ↓
最终结果
```

---

## 问题 2：管道模式的工作原理

Loader 链采用**管道模式（Pipeline）**：

```javascript
// 伪代码展示执行过程
function runLoaders(source, loaders) {
  let result = source;

  // 从右到左（从后到前）执行
  for (let i = loaders.length - 1; i >= 0; i--) {
    result = loaders[i](result);
  }

  return result;
}

// 实际执行
const source = readFile("app.scss");
const result = runLoaders(source, [styleLoader, cssLoader, sassLoader]);
// 执行顺序：sassLoader → cssLoader → styleLoader
```

每个 Loader 只负责一件事，通过组合实现复杂的转换。

---

## 问题 3：Loader 之间如何传递数据？

### 1. 返回值传递

最常见的方式，前一个 Loader 的返回值作为下一个 Loader 的输入：

```javascript
// sass-loader 返回 CSS 字符串
module.exports = function (source) {
  const css = compileSass(source);
  return css; // 传给 css-loader
};

// css-loader 接收 CSS 字符串，返回 JS 模块
module.exports = function (source) {
  const jsModule = transformToModule(source);
  return jsModule; // 传给 style-loader
};
```

### 2. 通过 this.callback 传递额外信息

Loader 可以传递更多信息，如 source map：

```javascript
module.exports = function (source) {
  const result = transform(source);

  // 传递更多信息
  this.callback(
    null, // 错误信息
    result, // 转换后的内容
    sourceMap, // source map
    meta // 其他元数据
  );
};
```

---

## 问题 4：为什么要拆分成多个 Loader？

**单一职责原则**：每个 Loader 只做一件事，这样带来几个好处：

1. **可复用**：css-loader 可以和不同的预处理器 loader 组合
2. **可替换**：想换 Less？只需把 sass-loader 换成 less-loader
3. **易维护**：每个 Loader 代码简单，容易理解和调试

```javascript
// 灵活组合
// Sass 项目
use: ["style-loader", "css-loader", "sass-loader"];

// Less 项目
use: ["style-loader", "css-loader", "less-loader"];

// PostCSS 项目
use: ["style-loader", "css-loader", "postcss-loader"];
```

## 延伸阅读

- [Loader Interface](https://webpack.js.org/api/loaders/)
- [Pitching Loader](https://webpack.js.org/api/loaders/#pitching-loader)
