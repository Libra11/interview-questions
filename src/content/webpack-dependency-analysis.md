---
title: Webpack 如何实现依赖分析？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 依赖分析的原理，掌握从入口文件到依赖图的构建过程。
tags:
  - Webpack
  - 依赖分析
  - AST
  - 原理
estimatedTime: 15 分钟
keywords:
  - 依赖分析
  - AST
  - 模块解析
  - 依赖图
highlight: Webpack 通过解析 AST 识别 import/require 语句，递归分析依赖，构建完整的模块依赖图。
order: 826
---

## 问题 1：依赖分析流程

```
入口文件
    │
    ↓
解析为 AST
    │
    ↓
遍历 AST，找到 import/require
    │
    ↓
解析模块路径
    │
    ↓
递归分析依赖
    │
    ↓
构建依赖图
```

---

## 问题 2：AST 解析

```javascript
// 源代码
import { add } from "./math";
import React from "react";
const lodash = require("lodash");

// 解析为 AST 后，识别出：
// ImportDeclaration: './math', 'react'
// CallExpression (require): 'lodash'
```

Webpack 使用 acorn 解析 JavaScript：

```javascript
const acorn = require("acorn");

const ast = acorn.parse(code, {
  sourceType: "module",
  ecmaVersion: 2020,
});
```

---

## 问题 3：依赖收集

```javascript
// 简化的依赖收集逻辑
function collectDependencies(ast) {
  const dependencies = [];

  walk(ast, {
    // ES Module
    ImportDeclaration(node) {
      dependencies.push(node.source.value);
    },
    // CommonJS
    CallExpression(node) {
      if (node.callee.name === "require") {
        dependencies.push(node.arguments[0].value);
      }
    },
    // 动态导入
    ImportExpression(node) {
      if (node.source.type === "Literal") {
        dependencies.push(node.source.value);
      }
    },
  });

  return dependencies;
}
```

---

## 问题 4：模块路径解析

```javascript
// 相对路径
import "./utils";
// → /project/src/utils.js

// 包名
import "lodash";
// → /project/node_modules/lodash/index.js

// 别名
import "@/utils";
// → /project/src/utils.js (根据 resolve.alias)
```

Webpack 的 enhanced-resolve 处理路径解析：

```javascript
const resolve = require("enhanced-resolve");

resolve("/project/src", "./utils", (err, result) => {
  // result: /project/src/utils.js
});
```

---

## 问题 5：递归构建依赖图

```javascript
// 简化的依赖图构建
function buildDependencyGraph(entry) {
  const graph = new Map();
  const queue = [entry];

  while (queue.length > 0) {
    const modulePath = queue.shift();

    if (graph.has(modulePath)) continue;

    const code = fs.readFileSync(modulePath, "utf-8");
    const ast = parse(code);
    const dependencies = collectDependencies(ast);

    graph.set(modulePath, {
      code,
      dependencies,
    });

    dependencies.forEach((dep) => {
      const resolvedPath = resolve(modulePath, dep);
      queue.push(resolvedPath);
    });
  }

  return graph;
}
```

---

## 问题 6：Webpack 中的实现

```javascript
// Webpack 内部使用 NormalModuleFactory 创建模块
// 使用 Parser 解析依赖

compilation.hooks.buildModule.tap("MyPlugin", (module) => {
  // 模块开始构建
});

compilation.hooks.succeedModule.tap("MyPlugin", (module) => {
  // 模块构建成功
  console.log("Dependencies:", module.dependencies);
});
```

依赖类型：

- `HarmonyImportDependency`：ES Module import
- `CommonJsRequireDependency`：CommonJS require
- `ImportDependency`：动态 import()

## 延伸阅读

- [Module Resolution](https://webpack.js.org/concepts/module-resolution/)
- [enhanced-resolve](https://github.com/webpack/enhanced-resolve)
