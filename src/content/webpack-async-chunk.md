---
title: 什么是 Webpack Async Chunk？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 中 Async Chunk 的概念，掌握异步 chunk 的生成方式和加载机制。
tags:
  - Webpack
  - Async Chunk
  - 动态导入
  - 代码分割
estimatedTime: 10 分钟
keywords:
  - Async Chunk
  - 异步 chunk
  - 动态加载
  - import()
highlight: Async Chunk 是通过动态导入 import() 产生的异步加载的代码块，在需要时才会被请求和执行。
order: 648
---

## 问题 1：什么是 Async Chunk？

**Async Chunk 是异步加载的代码块**，与入口 chunk（Initial Chunk）相对。

```javascript
// Initial Chunk：入口文件及其同步依赖
import React from "react"; // 打包到 initial chunk

// Async Chunk：动态导入的模块
const LazyModule = () => import("./LazyModule"); // 单独的 async chunk
```

---

## 问题 2：Async Chunk 如何产生？

主要通过 `import()` 动态导入：

```javascript
// 每个 import() 都会产生一个 async chunk
const chunk1 = () => import("./module1");
const chunk2 = () => import("./module2");

// 打包结果
// main.js (initial)
// module1.chunk.js (async)
// module2.chunk.js (async)
```

---

## 问题 3：Async Chunk 的加载机制

```javascript
// 用户点击按钮时
button.onclick = async () => {
  // 1. Webpack runtime 创建 script 标签
  // 2. 请求 async chunk 文件
  // 3. 执行模块代码
  // 4. 返回模块导出
  const module = await import("./heavy-module");
  module.doSomething();
};
```

Webpack 生成的加载代码（简化）：

```javascript
__webpack_require__.e = function (chunkId) {
  return new Promise((resolve) => {
    var script = document.createElement("script");
    script.src = __webpack_require__.p + chunkId + ".chunk.js";
    document.head.appendChild(script);
    script.onload = resolve;
  });
};
```

---

## 问题 4：Initial Chunk vs Async Chunk

| 特性      | Initial Chunk  | Async Chunk       |
| --------- | -------------- | ----------------- |
| 加载时机  | 页面加载时     | 需要时            |
| 产生方式  | entry 配置     | import() 动态导入 |
| HTML 引用 | 直接在 HTML 中 | 运行时动态加载    |
| 阻塞渲染  | 是             | 否                |

---

## 问题 5：SplitChunks 对 Async Chunk 的处理

```javascript
optimization: {
  splitChunks: {
    chunks: 'async',  // 默认值，只分割 async chunk
    chunks: 'all',    // 分割所有 chunk（推荐）
    chunks: 'initial', // 只分割 initial chunk
  },
}
```

`chunks: 'all'` 会将 async chunk 之间的公共依赖也提取出来：

```javascript
// module1.js 和 module2.js 都引用了 lodash
// chunks: 'all' 会将 lodash 提取到公共 chunk
// 避免重复打包
```

## 延伸阅读

- [Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
