---
title: Webpack 如何实现 import() 动态加载？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 动态导入的实现原理，掌握异步 Chunk 的加载机制。
tags:
  - Webpack
  - 动态导入
  - import()
  - 原理
estimatedTime: 15 分钟
keywords:
  - 动态导入
  - import()
  - 异步加载
  - JSONP
highlight: Webpack 将 import() 转换为运行时代码，通过 JSONP 方式动态创建 script 标签加载异步 Chunk。
order: 700
---

## 问题 1：编译时转换

```javascript
// 源代码
const module = await import("./lazy-module");

// Webpack 编译后（简化）
const module = await __webpack_require__
  .e("lazy-module")
  .then(__webpack_require__.bind(null, "./lazy-module.js"));
```

Webpack 将 `import()` 转换为运行时函数调用。

---

## 问题 2：运行时加载机制

```javascript
// Webpack 运行时代码（简化）
__webpack_require__.e = function (chunkId) {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (installedChunks[chunkId] === 0) {
      return resolve();
    }

    // 创建 script 标签
    var script = document.createElement("script");
    script.src = __webpack_require__.p + chunkId + ".bundle.js";

    // 加载完成回调
    script.onload = resolve;
    script.onerror = reject;

    // 插入页面
    document.head.appendChild(script);
  });
};
```

---

## 问题 3：JSONP 回调

```javascript
// 异步 Chunk 文件内容
// lazy-module.bundle.js
(self["webpackChunk"] = self["webpackChunk"] || []).push([
  ["lazy-module"],  // chunkId
  {
    "./lazy-module.js": (module, exports) => {
      // 模块代码
      exports.default = function() { ... };
    }
  }
]);

// 主 bundle 中的回调处理
self["webpackChunk"].push = function(data) {
  var chunkIds = data[0];
  var modules = data[1];

  // 注册模块
  for (var moduleId in modules) {
    __webpack_modules__[moduleId] = modules[moduleId];
  }

  // 标记 chunk 已加载
  chunkIds.forEach(id => {
    installedChunks[id] = 0;
  });
};
```

---

## 问题 4：完整加载流程

```
1. 执行 import('./lazy-module')
       │
       ↓
2. 调用 __webpack_require__.e('lazy-module')
       │
       ↓
3. 创建 <script src="lazy-module.bundle.js">
       │
       ↓
4. 浏览器下载并执行脚本
       │
       ↓
5. 脚本调用 webpackChunk.push()
       │
       ↓
6. 注册模块，resolve Promise
       │
       ↓
7. 调用 __webpack_require__ 获取模块
```

---

## 问题 5：Prefetch 和 Preload

```javascript
// 源代码
import(/* webpackPrefetch: true */ './future-module');
import(/* webpackPreload: true */ './critical-module');

// Webpack 生成
// Prefetch: 空闲时加载
<link rel="prefetch" href="future-module.bundle.js">

// Preload: 立即加载
<link rel="preload" href="critical-module.bundle.js" as="script">
```

---

## 问题 6：错误处理

```javascript
// 加载失败处理
__webpack_require__.e = function (chunkId) {
  return new Promise((resolve, reject) => {
    var script = document.createElement("script");

    // 超时处理
    var timeout = setTimeout(() => {
      reject(new Error("Loading chunk " + chunkId + " timed out"));
    }, 120000);

    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Loading chunk " + chunkId + " failed"));
    };

    document.head.appendChild(script);
  });
};
```

使用时：

```javascript
import("./lazy-module")
  .then((module) => module.default())
  .catch((err) => console.error("加载失败", err));
```

## 延伸阅读

- [Dynamic Imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)
- [Magic Comments](https://webpack.js.org/api/module-methods/#magic-comments)
