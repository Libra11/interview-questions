---
title: Webpack Compiler 和 Compilation 的区别？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  理解 Webpack 核心对象 Compiler 和 Compilation 的区别，掌握它们各自的职责和生命周期。
tags:
  - Webpack
  - Compiler
  - Compilation
  - 构建原理
estimatedTime: 12 分钟
keywords:
  - Compiler
  - Compilation
  - Webpack 对象
  - 构建流程
highlight: Compiler 代表整个 Webpack 环境，全局唯一；Compilation 代表一次编译过程，每次构建都会创建新实例。
order: 756
---

## 问题 1：Compiler 是什么？

**Compiler 是 Webpack 的核心对象，代表完整的 Webpack 环境配置**。

它在 Webpack 启动时创建，**全局唯一**，包含了：

- 完整的 Webpack 配置（options）
- 文件系统访问（inputFileSystem、outputFileSystem）
- 所有注册的插件
- 构建的入口和输出信息

```javascript
class MyPlugin {
  apply(compiler) {
    // compiler 是全局唯一的
    console.log(compiler.options); // Webpack 配置
    console.log(compiler.context); // 项目根目录

    // compiler 的钩子贯穿整个生命周期
    compiler.hooks.run.tap("MyPlugin", () => {});
    compiler.hooks.done.tap("MyPlugin", () => {});
  }
}
```

---

## 问题 2：Compilation 是什么？

**Compilation 代表一次资源构建过程**。

每次文件变化触发重新编译时，都会创建新的 Compilation 实例。它包含了：

- 当前编译的模块（modules）
- 编译生成的资源（assets）
- 依赖关系图
- Chunk 信息

```javascript
compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
  // 每次编译都是新的 compilation 实例
  console.log(compilation.modules); // 所有模块
  console.log(compilation.assets); // 输出资源
  console.log(compilation.chunks); // 所有 chunk
});
```

---

## 问题 3：核心区别对比

| 特性       | Compiler             | Compilation        |
| ---------- | -------------------- | ------------------ |
| 生命周期   | Webpack 启动到结束   | 单次编译过程       |
| 实例数量   | 全局唯一             | 每次编译创建新实例 |
| 包含内容   | 配置、插件、文件系统 | 模块、资源、依赖图 |
| 主要职责   | 管理构建流程         | 执行具体编译       |
| watch 模式 | 始终同一个实例       | 每次变化创建新实例 |

---

## 问题 4：生命周期关系

```
Webpack 启动
    ↓
创建 Compiler（全局唯一）
    ↓
compiler.hooks.run
    ↓
┌─────────────────────────────┐
│  创建 Compilation（每次新建）│ ← 文件变化时重新创建
│      ↓                      │
│  compilation.hooks.build    │
│      ↓                      │
│  构建模块、生成资源          │
│      ↓                      │
│  compilation.hooks.seal     │
└─────────────────────────────┘
    ↓
compiler.hooks.emit（输出资源）
    ↓
compiler.hooks.done
```

---

## 问题 5：在插件中的使用

```javascript
class MyPlugin {
  apply(compiler) {
    // Compiler 钩子：全局事件
    compiler.hooks.run.tap("MyPlugin", (compiler) => {
      console.log("Webpack 开始运行");
    });

    // 获取 Compilation 对象
    compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
      // Compilation 钩子：编译过程事件
      compilation.hooks.buildModule.tap("MyPlugin", (module) => {
        console.log("构建模块:", module.resource);
      });

      compilation.hooks.seal.tap("MyPlugin", () => {
        console.log("模块构建完成，开始优化");
      });
    });

    // 在 emit 阶段访问 compilation.assets
    compiler.hooks.emit.tap("MyPlugin", (compilation) => {
      Object.keys(compilation.assets).forEach((filename) => {
        console.log("输出文件:", filename);
      });
    });
  }
}
```

理解这两个对象的区别，是编写 Webpack 插件的基础。

## 延伸阅读

- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
- [Compilation Object](https://webpack.js.org/api/compilation-object/)
