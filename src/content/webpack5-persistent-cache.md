---
title: Webpack5 的持久化缓存是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 5 持久化缓存的原理和配置，掌握如何利用缓存加速构建。
tags:
  - Webpack
  - Webpack5
  - 持久化缓存
  - 构建优化
estimatedTime: 12 分钟
keywords:
  - 持久化缓存
  - filesystem cache
  - 构建加速
  - Webpack5
highlight: Webpack 5 持久化缓存将构建结果缓存到文件系统，二次构建时直接复用，大幅提升构建速度。
order: 662
---

## 问题 1：什么是持久化缓存？

**持久化缓存将 Webpack 的构建结果保存到文件系统**，下次构建时直接复用，避免重复工作。

```javascript
module.exports = {
  cache: {
    type: "filesystem", // 文件系统缓存
  },
};
```

效果：

- 首次构建：正常速度
- 二次构建：速度提升 50%-90%

---

## 问题 2：缓存了什么内容？

持久化缓存保存的内容包括：

```
缓存内容：
├── 模块解析结果（路径解析）
├── Loader 处理结果
├── 模块依赖关系
├── 生成的代码
└── 其他中间结果
```

比 cache-loader 和 HardSourceWebpackPlugin 更全面。

---

## 问题 3：详细配置

```javascript
const path = require("path");

module.exports = {
  cache: {
    // 缓存类型
    type: "filesystem",

    // 缓存目录
    cacheDirectory: path.resolve(__dirname, ".cache"),

    // 缓存名称
    name: "development-cache",

    // 构建依赖（这些文件变化时缓存失效）
    buildDependencies: {
      config: [__filename], // 配置文件
      tsconfig: [path.resolve(__dirname, "tsconfig.json")],
    },

    // 缓存版本（手动使缓存失效）
    version: "1.0",
  },
};
```

---

## 问题 4：缓存失效机制

缓存会在以下情况失效：

```javascript
// 1. 源文件变化
// 文件内容变了，对应的缓存失效

// 2. 配置文件变化
buildDependencies: {
  config: [__filename],  // webpack.config.js 变了
}

// 3. 依赖版本变化
// package.json 或 lock 文件变化

// 4. 手动更新版本
cache: {
  version: '2.0',  // 改变版本号使缓存失效
}
```

---

## 问题 5：开发与生产环境配置

```javascript
module.exports = (env, argv) => ({
  cache: {
    type: "filesystem",
    // 不同环境使用不同缓存
    name: argv.mode === "production" ? "production" : "development",
    buildDependencies: {
      config: [__filename],
    },
  },
});
```

---

## 问题 6：常见问题

### 缓存不生效

```javascript
// 检查 buildDependencies 是否正确配置
buildDependencies: {
  config: [__filename],  // 确保包含配置文件
}
```

### 缓存导致问题

```bash
# 清除缓存
rm -rf node_modules/.cache
# 或
rm -rf .cache
```

### CI/CD 中使用缓存

```yaml
# GitHub Actions 示例
- uses: actions/cache@v2
  with:
    path: .cache
    key: webpack-${{ hashFiles('**/package-lock.json') }}
```

## 延伸阅读

- [Webpack 5 Cache](https://webpack.js.org/configuration/cache/)
- [Persistent Caching](https://webpack.js.org/blog/2020-10-10-webpack-5-release/#persistent-caching)
