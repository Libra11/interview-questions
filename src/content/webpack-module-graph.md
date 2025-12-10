---
title: Webpack Module Graph 如何构建？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 5 的 ModuleGraph 数据结构，掌握模块图的构建过程。
tags:
  - Webpack
  - ModuleGraph
  - 原理
  - 数据结构
estimatedTime: 15 分钟
keywords:
  - ModuleGraph
  - 模块图
  - 依赖关系
  - Webpack5
highlight: ModuleGraph 是 Webpack 5 引入的数据结构，存储模块间的依赖关系，支持更高效的 Tree-shaking 和优化。
order: 697
---

## 问题 1：什么是 ModuleGraph？

**ModuleGraph 是 Webpack 5 中存储模块依赖关系的数据结构**：

```
ModuleGraph
├── Module A
│   ├── 依赖 → Module B
│   └── 依赖 → Module C
├── Module B
│   └── 依赖 → Module D
└── Module C
    └── 依赖 → Module D
```

它记录了：

- 模块之间的依赖关系
- 导出和导入的绑定关系
- 模块的使用情况（用于 Tree-shaking）

---

## 问题 2：构建过程

```
1. 从入口开始
   entry.js
       │
       ↓
2. 解析模块，创建 Module 对象
   NormalModule { resource: 'entry.js' }
       │
       ↓
3. 解析依赖，创建 Dependency 对象
   HarmonyImportDependency { request: './utils' }
       │
       ↓
4. 解析依赖模块，递归步骤 2-3
       │
       ↓
5. 建立 ModuleGraph 连接
   ModuleGraph.setParents(dependency, module)
```

---

## 问题 3：核心数据结构

```javascript
// ModuleGraph 的简化结构
class ModuleGraph {
  constructor() {
    // Module → ModuleGraphModule
    this._moduleMap = new Map();

    // Dependency → ModuleGraphConnection
    this._dependencyMap = new Map();
  }

  // 获取模块的图信息
  getModule(dependency) {
    return this._dependencyMap.get(dependency)?.module;
  }

  // 获取模块的所有依赖
  getOutgoingConnections(module) {
    return this._moduleMap.get(module)?.outgoingConnections;
  }

  // 获取依赖此模块的所有模块
  getIncomingConnections(module) {
    return this._moduleMap.get(module)?.incomingConnections;
  }
}
```

---

## 问题 4：ModuleGraphConnection

```javascript
// 表示模块间的连接关系
class ModuleGraphConnection {
  constructor(originModule, dependency, module) {
    this.originModule = originModule; // 来源模块
    this.dependency = dependency; // 依赖对象
    this.module = module; // 目标模块
  }
}

// 例如：
// entry.js 中 import { add } from './math'
// 会创建：
// {
//   originModule: entry.js 的 Module,
//   dependency: HarmonyImportDependency,
//   module: math.js 的 Module
// }
```

---

## 问题 5：在插件中使用

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
      compilation.hooks.finishModules.tap("MyPlugin", (modules) => {
        const moduleGraph = compilation.moduleGraph;

        for (const module of modules) {
          // 获取模块的导出信息
          const exports = moduleGraph.getExportsInfo(module);

          // 获取模块的依赖
          const connections = moduleGraph.getOutgoingConnections(module);

          // 检查导出是否被使用
          const isUsed = exports.isExportUsed("add");
        }
      });
    });
  }
}
```

---

## 问题 6：与 Tree-shaking 的关系

```javascript
// ModuleGraph 记录导出的使用情况
// 用于 Tree-shaking

// math.js
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;

// entry.js
import { add } from "./math";

// ModuleGraph 记录：
// math.js 的 'add' 导出被使用
// math.js 的 'sub' 导出未被使用
// → Tree-shaking 可以移除 sub
```

## 延伸阅读

- [ModuleGraph](https://webpack.js.org/api/compilation-object/#modulegraph)
- [Webpack 5 Release](https://webpack.js.org/blog/2020-10-10-webpack-5-release/)
