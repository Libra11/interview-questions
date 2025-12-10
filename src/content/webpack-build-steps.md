---
title: Webpack 的构建流程分为哪几步？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  详解 Webpack 构建的完整流程，从初始化到输出的每个关键步骤。
tags:
  - Webpack
  - 构建流程
  - 编译原理
  - 前端工程化
estimatedTime: 15 分钟
keywords:
  - 构建流程
  - 编译步骤
  - Webpack 原理
highlight: Webpack 构建分为初始化、编译、输出三大阶段，包含配置合并、模块构建、代码生成等关键步骤。
order: 631
---

## 问题 1：构建流程概览

Webpack 的构建流程可以分为三个大阶段：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   初始化     │ →  │    编译     │ →  │    输出     │
└─────────────┘    └─────────────┘    └─────────────┘
```

每个阶段包含多个具体步骤。

---

## 问题 2：初始化阶段

### 1. 读取与合并配置

```javascript
// 合并来源：命令行参数 + 配置文件 + 默认配置
const config = merge(defaultConfig, webpackConfig, cliArgs);
```

### 2. 创建 Compiler 对象

```javascript
// Compiler 是 Webpack 的核心对象
const compiler = new Compiler(config);
```

### 3. 加载插件

```javascript
// 调用每个插件的 apply 方法
config.plugins.forEach((plugin) => {
  plugin.apply(compiler);
});
```

### 4. 确定入口

```javascript
// 根据 entry 配置确定入口模块
const entries = normalizeEntry(config.entry);
```

---

## 问题 3：编译阶段

### 1. 创建 Compilation 对象

```javascript
// 每次编译创建新的 Compilation
const compilation = new Compilation(compiler);
```

### 2. 从入口开始构建

```javascript
// 从入口模块开始递归构建
for (const entry of entries) {
  buildModule(entry);
}
```

### 3. 构建模块（核心步骤）

对每个模块执行：

```javascript
function buildModule(modulePath) {
  // a. 读取文件内容
  let source = fs.readFileSync(modulePath);

  // b. 调用 Loader 转换
  source = runLoaders(source, matchedLoaders);

  // c. 解析 AST，收集依赖
  const ast = parse(source);
  const dependencies = findDependencies(ast);

  // d. 递归构建依赖模块
  for (const dep of dependencies) {
    buildModule(dep);
  }
}
```

### 4. 完成模块构建

所有模块处理完毕，得到完整的**模块依赖图**。

---

## 问题 4：输出阶段

### 1. 生成 Chunk

```javascript
// 根据入口和依赖关系，将模块组合成 Chunk
// - 每个入口生成一个 Chunk
// - 动态导入生成额外的 Chunk
// - SplitChunks 可能产生公共 Chunk
```

### 2. 优化 Chunk

```javascript
// 执行各种优化
// - Tree-shaking
// - Scope Hoisting
// - 代码压缩
```

### 3. 生成代码

```javascript
// 将 Chunk 转换为最终的代码
// - 添加运行时代码
// - 模块包装
// - 生成 Source Map
```

### 4. 写入文件系统

```javascript
// 将生成的文件写入 output.path
fs.writeFileSync(outputPath, code);
```

---

## 问题 5：完整流程图

```
初始化阶段
├── 读取配置
├── 创建 Compiler
├── 加载插件
└── 确定入口
       ↓
编译阶段
├── 创建 Compilation
├── 从入口开始
│   ├── 读取文件
│   ├── Loader 转换
│   ├── 解析 AST
│   ├── 收集依赖
│   └── 递归构建
└── 完成依赖图
       ↓
输出阶段
├── 生成 Chunk
├── 优化处理
├── 生成代码
└── 写入文件
```

理解这个流程，有助于排查构建问题和编写插件。

## 延伸阅读

- [Under The Hood](https://webpack.js.org/concepts/under-the-hood/)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
