---
title: 什么是代码分割？
category: 工程化
difficulty: 入门
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 代码分割的概念和作用，掌握实现代码分割的几种方式。
tags:
  - Webpack
  - 代码分割
  - 性能优化
  - 按需加载
estimatedTime: 12 分钟
keywords:
  - 代码分割
  - Code Splitting
  - 按需加载
  - 懒加载
highlight: 代码分割是将代码拆分成多个 bundle，实现按需加载，减少首屏加载时间，提升应用性能。
order: 645
---

## 问题 1：什么是代码分割？

**代码分割（Code Splitting）是将代码拆分成多个 bundle 的技术**，让用户只加载当前需要的代码。

```
没有代码分割：
bundle.js (500KB) → 用户等待加载全部代码

有代码分割：
main.js (100KB)     → 首屏立即加载
vendor.js (200KB)   → 首屏立即加载
lazy.js (200KB)     → 需要时才加载
```

---

## 问题 2：为什么需要代码分割？

### 1. 减少首屏加载时间

```javascript
// 不分割：用户需要等待所有代码加载完
// 分割后：只加载首屏需要的代码
```

### 2. 利用浏览器缓存

```javascript
// vendor.js 包含第三方库，很少变化
// main.js 包含业务代码，经常变化
// 分开后，vendor.js 可以长期缓存
```

### 3. 按需加载

```javascript
// 用户可能永远不会访问某些页面
// 这些页面的代码不需要提前加载
```

---

## 问题 3：代码分割的三种方式

### 1. 多入口分割

```javascript
module.exports = {
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
};
```

### 2. 动态导入

```javascript
// 使用 import() 语法
const LazyComponent = React.lazy(() => import("./LazyComponent"));

// 或者直接使用
button.onclick = async () => {
  const module = await import("./heavy-module");
  module.doSomething();
};
```

### 3. SplitChunksPlugin

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all", // 自动分割公共代码
    },
  },
};
```

---

## 问题 4：代码分割的效果

```
打包前：
src/
├── index.js (引用 React, lodash, 业务代码)
└── admin.js (引用 React, lodash, 管理代码)

打包后（有代码分割）：
dist/
├── main.js        # 首页业务代码
├── admin.js       # 管理页业务代码
├── vendors.js     # React, lodash（公共依赖）
└── common.js      # 公共业务代码
```

React 和 lodash 只打包一次，被多个入口共享。

---

## 问题 5：React 中的代码分割

```javascript
import React, { Suspense, lazy } from "react";

// 懒加载组件
const LazyComponent = lazy(() => import("./LazyComponent"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

路由级别的代码分割：

```javascript
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
</Routes>;
```

## 延伸阅读

- [Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [React.lazy](https://react.dev/reference/react/lazy)
