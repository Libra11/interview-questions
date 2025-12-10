---
title: Webpack 如何构建依赖图？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 依赖图的构建过程，掌握模块解析和依赖收集的核心机制。
tags:
  - Webpack
  - 依赖图
  - 模块解析
  - 构建原理
estimatedTime: 15 分钟
keywords:
  - 依赖图
  - Dependency Graph
  - 模块解析
  - 递归构建
highlight: Webpack 从入口开始，递归解析每个模块的依赖，最终构建出完整的依赖图。
order: 627
---

## 问题 1：什么是依赖图？

**依赖图（Dependency Graph）是 Webpack 的核心数据结构**，它描述了项目中所有模块之间的依赖关系。

```
入口 index.js
    ├── import App from './App.js'
    │   ├── import Header from './Header.js'
    │   │   └── import './header.css'
    │   └── import Footer from './Footer.js'
    ├── import './global.css'
    └── import lodash from 'lodash'
```

Webpack 根据这个图来决定哪些模块需要打包，以及打包的顺序。

---

## 问题 2：依赖图的构建流程

### 1. 从入口开始

```javascript
// webpack.config.js
entry: "./src/index.js";

// Webpack 从这个文件开始分析
```

### 2. 解析模块路径

```javascript
// index.js
import App from "./App";

// Webpack 解析 './App' 的实际路径
// → /project/src/App.js
```

### 3. 读取并解析文件

```javascript
// 读取文件内容
const source = fs.readFileSync("/project/src/App.js");

// 使用 Parser 解析 AST，找出所有 import/require
const ast = parse(source);
const dependencies = findImports(ast);
// → ['./Header', './Footer', 'react']
```

### 4. 递归处理依赖

```javascript
// 对每个依赖重复步骤 2-4
dependencies.forEach((dep) => {
  buildModule(dep);
});
```

---

## 问题 3：模块解析规则

Webpack 使用 enhanced-resolve 库解析模块路径：

```javascript
// 相对路径
import "./utils"; // → /project/src/utils.js

// 绝对路径
import "/src/utils"; // → /project/src/utils.js

// 模块路径（node_modules）
import "lodash"; // → /project/node_modules/lodash/index.js

// 别名（需配置）
import "@/utils"; // → /project/src/utils.js
```

解析时会尝试多种扩展名：

```javascript
resolve: {
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
}
// import './App' 会依次尝试 App.js, App.jsx, App.ts...
```

---

## 问题 4：依赖图的数据结构

简化的依赖图结构：

```javascript
const dependencyGraph = {
  "/src/index.js": {
    id: 0,
    filename: "/src/index.js",
    dependencies: ["/src/App.js", "/src/global.css"],
    code: "...转换后的代码...",
  },
  "/src/App.js": {
    id: 1,
    filename: "/src/App.js",
    dependencies: ["/src/Header.js", "/src/Footer.js"],
    code: "...",
  },
  // ...更多模块
};
```

---

## 问题 5：构建过程的关键步骤

```
1. 初始化
   创建 Compiler，加载配置

2. 确定入口
   根据 entry 配置确定入口模块

3. 编译模块
   ├── 调用 Loader 转换模块内容
   ├── 使用 Parser 解析 AST
   └── 收集模块依赖

4. 递归构建
   对每个依赖重复步骤 3

5. 完成依赖图
   所有模块处理完毕，得到完整的依赖图

6. 生成 Chunk
   根据依赖图和配置，将模块组合成 Chunk

7. 输出文件
   将 Chunk 转换为最终的 Bundle 文件
```

依赖图是步骤 3-5 的产物，是后续生成 Chunk 和 Bundle 的基础。

## 延伸阅读

- [Dependency Graph](https://webpack.js.org/concepts/dependency-graph/)
- [Module Resolution](https://webpack.js.org/concepts/module-resolution/)
- [Under The Hood](https://webpack.js.org/concepts/under-the-hood/)
