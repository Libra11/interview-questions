---
title: Webpack Loader 的执行顺序是怎样的？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 Webpack Loader 从右到左、从下到上的执行顺序，以及 enforce 属性对执行顺序的影响。
tags:
  - Webpack
  - Loader
  - 执行顺序
  - enforce
estimatedTime: 12 分钟
keywords:
  - Loader 执行顺序
  - 从右到左
  - enforce
highlight: Loader 默认从右到左、从下到上执行，可通过 enforce 属性调整为 pre 或 post 阶段执行。
order: 612
---

## 问题 1：基本执行顺序

Loader 的执行顺序是**从右到左、从下到上**：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        // 从右到左执行：sass-loader → css-loader → style-loader
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};
```

如果使用对象形式配置多条规则：

```javascript
module.exports = {
  module: {
    rules: [
      // 从下到上执行
      { test: /\.css$/, use: "style-loader" }, // 3. 最后执行
      { test: /\.css$/, use: "css-loader" }, // 2. 其次执行
      { test: /\.css$/, use: "sass-loader" }, // 1. 最先执行
    ],
  },
};
```

---

## 问题 2：为什么是从右到左？

这是**函数组合（Function Composition）** 的惯例：

```javascript
// 函数组合通常从右到左
const compose = (f, g) => (x) => f(g(x));

// 类似于数学中的 f(g(x))
// 先执行 g，再执行 f
```

Webpack 的 Loader 链遵循这个惯例，让熟悉函数式编程的开发者更容易理解。

---

## 问题 3：enforce 属性

可以通过 `enforce` 属性改变 Loader 的执行阶段：

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: "eslint-loader",
        enforce: "pre", // 在其他 loader 之前执行
      },
      {
        test: /\.js$/,
        use: "babel-loader", // 正常阶段执行
      },
      {
        test: /\.js$/,
        use: "some-loader",
        enforce: "post", // 在其他 loader 之后执行
      },
    ],
  },
};
```

执行顺序分为四个阶段：

```
1. pre（前置）     - enforce: 'pre'
2. normal（正常）  - 默认
3. inline（内联）  - import 语句中指定的 loader
4. post（后置）    - enforce: 'post'
```

---

## 问题 4：实际执行顺序示例

```javascript
// 配置
rules: [
  { test: /\.js$/, use: "loader-a" }, // normal
  { test: /\.js$/, use: "loader-b", enforce: "post" }, // post
  { test: /\.js$/, use: "loader-c", enforce: "pre" }, // pre
  { test: /\.js$/, use: "loader-d" }, // normal
];

// 实际执行顺序：
// 1. loader-c (pre)
// 2. loader-d (normal，后定义的先执行)
// 3. loader-a (normal)
// 4. loader-b (post)
```

---

## 问题 5：常见的 enforce 使用场景

### pre：代码检查

```javascript
{
  test: /\.js$/,
  use: 'eslint-loader',
  enforce: 'pre',  // 在编译前先检查代码
}
```

### post：代码覆盖率

```javascript
{
  test: /\.js$/,
  use: 'istanbul-instrumenter-loader',
  enforce: 'post',  // 在所有转换后注入覆盖率代码
}
```

## 延伸阅读

- [Rule.enforce](https://webpack.js.org/configuration/module/#ruleenforce)
- [Loader Interface](https://webpack.js.org/api/loaders/)
