---
title: Webpack Chunk Graph 如何构建？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 的 ChunkGraph 数据结构，掌握从模块到 Chunk 的分组过程。
tags:
  - Webpack
  - ChunkGraph
  - Chunk
  - 原理
estimatedTime: 15 分钟
keywords:
  - ChunkGraph
  - Chunk
  - 代码分割
  - 打包原理
highlight: ChunkGraph 管理模块到 Chunk 的映射关系，决定哪些模块打包到同一个文件，是代码分割的核心。
order: 698
---

## 问题 1：什么是 ChunkGraph？

**ChunkGraph 管理模块（Module）和代码块（Chunk）之间的关系**：

```
ChunkGraph
├── Chunk: main
│   ├── Module: entry.js
│   ├── Module: utils.js
│   └── Module: config.js
├── Chunk: vendors
│   ├── Module: react
│   └── Module: lodash
└── Chunk: async-page
    └── Module: page.js
```

---

## 问题 2：Chunk 的类型

```javascript
// 1. Entry Chunk（入口 Chunk）
// 由 entry 配置产生
entry: {
  main: './src/index.js',
  admin: './src/admin.js',
}

// 2. Async Chunk（异步 Chunk）
// 由动态导入产生
import('./page.js');

// 3. Runtime Chunk
// 包含 Webpack 运行时代码
optimization: {
  runtimeChunk: 'single',
}
```

---

## 问题 3：构建过程

```
1. 创建入口 Chunk
   entry → EntryPoint → Chunk
       │
       ↓
2. 遍历模块依赖
   从入口模块开始，遍历 ModuleGraph
       │
       ↓
3. 分配模块到 Chunk
   同步依赖 → 同一个 Chunk
   异步依赖 → 新的 Chunk
       │
       ↓
4. 应用 SplitChunks
   根据配置拆分公共代码
       │
       ↓
5. 优化 Chunk
   合并小 Chunk，移除空 Chunk
```

---

## 问题 4：核心数据结构

```javascript
// ChunkGraph 的简化结构
class ChunkGraph {
  constructor() {
    // Chunk → ChunkGraphChunk
    this._chunks = new Map();

    // Module → ChunkGraphModule
    this._modules = new Map();
  }

  // 将模块连接到 Chunk
  connectChunkAndModule(chunk, module) {
    this._chunks.get(chunk).modules.add(module);
    this._modules.get(module).chunks.add(chunk);
  }

  // 获取 Chunk 包含的模块
  getChunkModules(chunk) {
    return this._chunks.get(chunk).modules;
  }

  // 获取模块所属的 Chunk
  getModuleChunks(module) {
    return this._modules.get(module).chunks;
  }
}
```

---

## 问题 5：SplitChunks 的影响

```javascript
optimization: {
  splitChunks: {
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
}

// 原始 Chunk：
// main: [entry.js, react, lodash, utils.js]

// 应用 SplitChunks 后：
// main: [entry.js, utils.js]
// vendors: [react, lodash]
```

---

## 问题 6：在插件中使用

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
      compilation.hooks.afterChunks.tap("MyPlugin", (chunks) => {
        const chunkGraph = compilation.chunkGraph;

        for (const chunk of chunks) {
          // 获取 Chunk 的模块
          const modules = chunkGraph.getChunkModules(chunk);

          console.log(`Chunk ${chunk.name}:`);
          for (const module of modules) {
            console.log(`  - ${module.identifier()}`);
          }
        }
      });
    });
  }
}
```

---

## 问题 7：Chunk 和 Bundle 的关系

```
Chunk（逻辑概念）
    │
    ↓ 渲染
Bundle（物理文件）

一个 Chunk 通常对应一个 Bundle
但也可能：
- 一个 Chunk → 多个 Bundle（如 JS + CSS）
- 多个 Chunk → 一个 Bundle（合并优化）
```

## 延伸阅读

- [ChunkGraph](https://webpack.js.org/api/compilation-object/#chunkgraph)
- [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
