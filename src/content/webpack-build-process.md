---
title: Webpack 的构建流程是什么？
category: 工程化
difficulty: 中级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack 从启动到输出的完整构建流程，包括初始化、编译、输出三大阶段。
tags:
  - Webpack
  - 构建流程
  - 编译原理
  - 前端工程化
estimatedTime: 18 分钟
keywords:
  - Webpack 构建流程
  - 编译过程
  - 打包原理
highlight: Webpack 构建流程分为初始化、编译、输出三个阶段，理解这个流程是掌握 Webpack 的关键。
order: 604
---

## 问题 1：Webpack 构建流程概览

Webpack 的构建流程可以分为三个大阶段：

```
初始化阶段 → 编译阶段 → 输出阶段
```

每个阶段都有明确的任务和产出。

---

## 问题 2：初始化阶段做了什么？

初始化阶段主要完成**配置合并和环境准备**：

```javascript
// 1. 合并配置
// 命令行参数 + 配置文件 + 默认配置
const finalConfig = merge(defaultConfig, fileConfig, cliConfig);

// 2. 创建 Compiler 对象
// Compiler 是 Webpack 的核心对象，贯穿整个构建过程
const compiler = new Compiler(finalConfig);

// 3. 加载所有插件
// 调用每个插件的 apply 方法，注册钩子
plugins.forEach((plugin) => plugin.apply(compiler));

// 4. 确定入口
// 根据 entry 配置确定所有入口文件
```

**Compiler** 对象是这个阶段最重要的产出，它包含了完整的 Webpack 配置和构建方法。

---

## 问题 3：编译阶段做了什么？

编译阶段是 Webpack 的核心，主要完成**模块解析和依赖图构建**：

### 1. 创建 Compilation 对象

```javascript
// Compilation 代表一次编译过程
// 包含了当前编译的模块资源、编译生成的资源等
const compilation = new Compilation(compiler);
```

### 2. 从入口开始构建

```javascript
// 从入口文件开始
// 1. 解析文件路径
// 2. 读取文件内容
// 3. 调用对应的 Loader 处理
// 4. 解析处理后的代码，找出依赖
// 5. 递归处理所有依赖
```

### 3. 构建模块

对每个模块执行：

```javascript
// 伪代码展示构建过程
function buildModule(modulePath) {
  // 1. 读取源代码
  let source = fs.readFileSync(modulePath);

  // 2. 调用 Loader 链处理
  source = runLoaders(source, loaders);

  // 3. 解析 AST，找出依赖
  const ast = parse(source);
  const dependencies = findDependencies(ast);

  // 4. 递归处理依赖
  dependencies.forEach((dep) => buildModule(dep));
}
```

### 4. 完成依赖图

当所有模块都处理完成后，就得到了完整的**依赖图（Module Graph）**。

---

## 问题 4：输出阶段做了什么？

输出阶段将编译结果**转换为最终文件**：

### 1. 生成 Chunk

```javascript
// 根据入口和依赖关系，将模块组合成 Chunk
// 一个入口通常对应一个 Chunk
// 动态导入会产生额外的 Chunk
```

### 2. 生成最终代码

```javascript
// 将 Chunk 转换为最终的输出代码
// 包括：
// 1. 模块代码的包装
// 2. 运行时代码的注入
// 3. 模块间的连接代码
```

### 3. 写入文件系统

```javascript
// 根据 output 配置，将文件写入磁盘
// dist/
//   ├── main.js
//   ├── vendor.js
//   └── index.html
```

---

## 问题 5：整体流程图

```
┌─────────────────────────────────────────────────────┐
│                    初始化阶段                         │
│  合并配置 → 创建 Compiler → 加载插件 → 确定入口        │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    编译阶段                          │
│  创建 Compilation → 从入口构建 → Loader 处理          │
│       → 解析依赖 → 递归构建 → 完成依赖图               │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    输出阶段                          │
│  生成 Chunk → 生成代码 → 写入文件                     │
└─────────────────────────────────────────────────────┘
```

理解这个流程，对于编写 Loader 和 Plugin、排查构建问题都非常有帮助。

## 延伸阅读

- [Webpack 工作原理](https://webpack.js.org/concepts/under-the-hood/)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
