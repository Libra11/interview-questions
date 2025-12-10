---
title: Webpack 入口（entry）有哪些配置方式？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  详解 Webpack entry 的多种配置方式，包括字符串、数组、对象等形式及其适用场景。
tags:
  - Webpack
  - entry
  - 配置
  - 入口
estimatedTime: 12 分钟
keywords:
  - Webpack entry
  - 入口配置
  - 多入口
highlight: entry 支持字符串、数组、对象三种配置方式，对象形式最灵活，适合多页面应用。
order: 605
---

## 问题 1：字符串形式

最简单的配置方式，指定单个入口文件：

```javascript
module.exports = {
  entry: "./src/index.js",
};
```

等价于：

```javascript
module.exports = {
  entry: {
    main: "./src/index.js",
  },
};
```

**适用场景**：单页面应用（SPA），只有一个入口。

---

## 问题 2：数组形式

将多个文件打包到一个 bundle 中：

```javascript
module.exports = {
  entry: ["./src/polyfills.js", "./src/index.js"],
};
```

数组中的文件会按顺序执行，最终合并到一个 bundle。

**适用场景**：需要在入口前注入一些代码，如 polyfills。

---

## 问题 3：对象形式

最灵活的配置方式，支持多入口：

```javascript
module.exports = {
  entry: {
    // key 是 chunk 名称，value 是入口文件路径
    main: "./src/index.js",
    admin: "./src/admin.js",
    vendor: "./src/vendor.js",
  },
};
```

每个 key 会生成一个独立的 chunk。

**适用场景**：多页面应用（MPA）或需要分离特定代码。

---

## 问题 4：对象形式的高级配置

对象的值也可以是更复杂的配置：

```javascript
module.exports = {
  entry: {
    main: {
      import: "./src/index.js",
      // 依赖的其他入口，会先加载
      dependOn: "shared",
      // 指定输出文件名
      filename: "pages/[name].js",
    },
    admin: {
      import: "./src/admin.js",
      dependOn: "shared",
    },
    // 共享模块
    shared: ["lodash", "react"],
  },
};
```

**dependOn** 可以避免多个入口重复打包相同的依赖。

---

## 问题 5：函数形式

entry 也可以是一个函数，支持动态生成入口：

```javascript
module.exports = {
  entry: () => {
    // 可以根据环境动态返回入口配置
    if (process.env.NODE_ENV === "development") {
      return "./src/dev.js";
    }
    return "./src/index.js";
  },
};

// 也可以返回 Promise（异步）
module.exports = {
  entry: () =>
    new Promise((resolve) => {
      resolve({
        main: "./src/index.js",
      });
    }),
};
```

**适用场景**：需要根据环境或其他条件动态确定入口。

## 延伸阅读

- [Entry Points](https://webpack.js.org/concepts/entry-points/)
- [Entry 配置详解](https://webpack.js.org/configuration/entry-context/)
