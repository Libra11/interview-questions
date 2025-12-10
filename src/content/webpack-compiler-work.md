---
title: Webpack Compiler 是如何工作的？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  深入理解 Webpack Compiler 的工作原理，掌握编译器的核心流程和生命周期。
tags:
  - Webpack
  - Compiler
  - 原理
  - 源码
estimatedTime: 15 分钟
keywords:
  - Compiler
  - 编译器
  - 工作原理
  - 生命周期
highlight: Compiler 是 Webpack 的核心引擎，负责整个构建流程的调度，通过 Tapable 钩子系统驱动插件执行。
order: 694
---

## 问题 1：Compiler 的角色

**Compiler 是 Webpack 的编译器实例**，代表整个 Webpack 环境：

```javascript
const webpack = require("webpack");
const config = require("./webpack.config");

// 创建 Compiler 实例
const compiler = webpack(config);

// 执行构建
compiler.run((err, stats) => {
  console.log(stats.toString());
});
```

Compiler 负责：

- 配置解析
- 插件注册
- 构建调度
- 文件输出

---

## 问题 2：Compiler 的生命周期

```
初始化阶段
├── environment          # 环境准备
├── afterEnvironment     # 环境准备完成
├── entryOption          # 处理入口配置
├── afterPlugins         # 插件注册完成
└── afterResolvers       # 解析器准备完成

构建阶段
├── beforeRun            # 构建开始前
├── run                  # 开始构建
├── beforeCompile        # 编译开始前
├── compile              # 创建 Compilation
├── make                 # 从入口开始构建
├── afterCompile         # 编译完成
└── shouldEmit           # 是否输出

输出阶段
├── emit                 # 输出文件前
├── afterEmit            # 输出完成
└── done                 # 构建完成
```

---

## 问题 3：核心工作流程

```javascript
// 简化的 Compiler 工作流程
class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      run: new AsyncSeriesHook(["compiler"]),
      compile: new SyncHook(["params"]),
      make: new AsyncParallelHook(["compilation"]),
      emit: new AsyncSeriesHook(["compilation"]),
      done: new AsyncSeriesHook(["stats"]),
    };
  }

  run(callback) {
    // 1. 触发 run 钩子
    this.hooks.run.callAsync(this, (err) => {
      // 2. 开始编译
      this.compile((err, compilation) => {
        // 3. 输出文件
        this.emitAssets(compilation, (err) => {
          // 4. 触发 done 钩子
          this.hooks.done.callAsync(stats, callback);
        });
      });
    });
  }

  compile(callback) {
    // 创建 Compilation 对象
    const compilation = new Compilation(this);

    // 触发 make 钩子，开始构建模块
    this.hooks.make.callAsync(compilation, (err) => {
      // 构建完成
      callback(null, compilation);
    });
  }
}
```

---

## 问题 4：Compiler vs Compilation

| 特性     | Compiler          | Compilation        |
| -------- | ----------------- | ------------------ |
| 生命周期 | 整个 Webpack 运行 | 单次构建           |
| 实例数量 | 一个              | 每次构建一个       |
| 职责     | 调度、配置        | 模块构建、依赖分析 |
| 钩子     | 全局生命周期      | 构建过程钩子       |

---

## 问题 5：插件如何使用 Compiler

```javascript
class MyPlugin {
  apply(compiler) {
    // 注册钩子
    compiler.hooks.run.tap("MyPlugin", (compiler) => {
      console.log("构建开始");
    });

    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      // 在输出前修改资源
      console.log("即将输出文件");
      callback();
    });

    compiler.hooks.done.tap("MyPlugin", (stats) => {
      console.log("构建完成");
    });
  }
}
```

---

## 问题 6：Watch 模式

```javascript
// watch 模式下，Compiler 会监听文件变化
compiler.watch(
  {
    aggregateTimeout: 300,
    poll: undefined,
  },
  (err, stats) => {
    // 每次重新编译后调用
  }
);

// 触发的钩子
// watchRun → compile → make → emit → done
// 文件变化后重复上述流程
```

## 延伸阅读

- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Writing a Plugin](https://webpack.js.org/contribute/writing-a-plugin/)
