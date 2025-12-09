---
title: 什么是代码分割（code splitting）？
category: 工程化
difficulty: 中级
updatedAt: 2025-12-09
summary: >-
  理解代码分割的概念、实现方式和最佳实践。
tags:
  - Webpack
  - 代码分割
  - 性能优化
  - 工程化
estimatedTime: 10 分钟
keywords:
  - code splitting
  - dynamic import
  - lazy loading
  - bundle optimization
highlight: 代码分割将代码拆分成多个 bundle，按需加载，减少首屏加载时间。
order: 288
---

## 问题 1：什么是代码分割？

### 定义

将代码拆分成多个 **bundle**，按需加载而不是一次性加载所有代码。

```
没有代码分割：
main.js (2MB) → 用户等待 2MB 下载完成

有代码分割：
main.js (200KB) → 用户快速看到页面
page1.js (500KB) → 访问 page1 时加载
page2.js (500KB) → 访问 page2 时加载
```

### 好处

```javascript
// 1. 更快的首屏加载
// 2. 按需加载，节省带宽
// 3. 更好的缓存利用
// 4. 并行加载多个小文件
```

---

## 问题 2：实现方式

### 1. 入口分割

```javascript
// webpack.config.js
module.exports = {
  entry: {
    main: "./src/index.js",
    admin: "./src/admin.js",
  },
  output: {
    filename: "[name].bundle.js",
  },
};

// 生成：main.bundle.js, admin.bundle.js
```

### 2. 动态导入

```javascript
// 使用 import() 动态导入
button.addEventListener("click", async () => {
  const { heavyFunction } = await import("./heavy-module");
  heavyFunction();
});

// Webpack 自动分割成单独的 chunk
```

### 3. SplitChunks

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

## 问题 3：React 中的代码分割

### React.lazy

```jsx
import { lazy, Suspense } from "react";

// 懒加载组件
const Dashboard = lazy(() => import("./Dashboard"));
const Settings = lazy(() => import("./Settings"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### 命名 chunk

```javascript
// 使用 magic comments 命名
const Dashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard" */
    "./Dashboard"
  )
);

// 生成：dashboard.chunk.js
```

---

## 问题 4：分割策略

### 按路由分割

```jsx
// 每个路由一个 chunk
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
```

### 按功能分割

```jsx
// 大型功能模块单独分割
const Editor = lazy(() => import("./features/Editor"));
const Chart = lazy(() => import("./features/Chart"));
```

### 第三方库分割

```javascript
// webpack.config.js
optimization: {
  splitChunks: {
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        chunks: 'all'
      },
      lodash: {
        test: /[\\/]node_modules[\\/]lodash[\\/]/,
        name: 'lodash',
        chunks: 'all'
      }
    }
  }
}
```

---

## 问题 5：预加载和预获取

### prefetch（空闲时加载）

```javascript
const Dashboard = lazy(() =>
  import(
    /* webpackPrefetch: true */
    "./Dashboard"
  )
);

// 生成 <link rel="prefetch" href="dashboard.chunk.js">
// 浏览器空闲时下载
```

### preload（立即加载）

```javascript
const Dashboard = lazy(() =>
  import(
    /* webpackPreload: true */
    "./Dashboard"
  )
);

// 生成 <link rel="preload" href="dashboard.chunk.js">
// 与主 bundle 并行加载
```

### 区别

| 方式     | 加载时机 | 优先级 | 适用场景       |
| -------- | -------- | ------ | -------------- |
| prefetch | 空闲时   | 低     | 下一页可能需要 |
| preload  | 立即     | 高     | 当前页需要     |

## 总结

| 方式        | 说明             |
| ----------- | ---------------- |
| 入口分割    | 多入口配置       |
| 动态导入    | import() 语法    |
| SplitChunks | 自动分割公共代码 |
| React.lazy  | 组件级懒加载     |

## 延伸阅读

- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [React 代码分割](https://react.dev/reference/react/lazy)
