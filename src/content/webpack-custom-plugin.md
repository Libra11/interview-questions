---
title: 如何编写一个 Webpack Plugin？
category: 工程化
difficulty: 高级
updatedAt: 2024-12-10
summary: >-
  学习如何编写自定义 Webpack Plugin，理解插件的结构、钩子机制和开发规范。
tags:
  - Webpack
  - Plugin
  - 自定义插件
  - Tapable
estimatedTime: 18 分钟
keywords:
  - 自定义 Plugin
  - Plugin 开发
  - Compiler
  - Compilation
highlight: Plugin 是一个带有 apply 方法的类，通过 Tapable 钩子介入 Webpack 构建流程的各个阶段。
order: 755
---

## 问题 1：Plugin 的基本结构

**Plugin 是一个带有 apply 方法的类**：

```javascript
class MyPlugin {
  // 构造函数接收配置选项
  constructor(options) {
    this.options = options;
  }

  // apply 方法会被 Webpack 调用
  apply(compiler) {
    // 在这里注册钩子
    compiler.hooks.done.tap("MyPlugin", (stats) => {
      console.log("构建完成！");
    });
  }
}

module.exports = MyPlugin;
```

使用：

```javascript
// webpack.config.js
const MyPlugin = require("./my-plugin");

module.exports = {
  plugins: [new MyPlugin({ name: "test" })],
};
```

---

## 问题 2：常用的 Compiler 钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 编译开始
    compiler.hooks.compile.tap("MyPlugin", () => {
      console.log("开始编译");
    });

    // 输出资源前（可以修改输出内容）
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      // compilation.assets 包含所有要输出的资源
      console.log("即将输出文件");
      callback();
    });

    // 输出完成后
    compiler.hooks.afterEmit.tap("MyPlugin", () => {
      console.log("文件已输出");
    });

    // 构建完成
    compiler.hooks.done.tap("MyPlugin", (stats) => {
      console.log("构建完成");
    });
  }
}
```

---

## 问题 3：实战示例：生成文件清单

```javascript
class FileListPlugin {
  constructor(options) {
    this.filename = options.filename || "filelist.md";
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("FileListPlugin", (compilation, callback) => {
      // 获取所有输出文件
      const files = Object.keys(compilation.assets);

      // 生成文件清单内容
      let content = "# 打包文件清单\n\n";
      files.forEach((file) => {
        const size = compilation.assets[file].size();
        content += `- ${file} (${(size / 1024).toFixed(2)} KB)\n`;
      });

      // 添加到输出资源
      compilation.assets[this.filename] = {
        source: () => content,
        size: () => content.length,
      };

      callback();
    });
  }
}

module.exports = FileListPlugin;
```

---

## 问题 4：同步与异步钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 同步钩子：使用 tap
    compiler.hooks.compile.tap("MyPlugin", (params) => {
      // 同步逻辑
    });

    // 异步钩子（回调方式）：使用 tapAsync
    compiler.hooks.emit.tapAsync("MyPlugin", (compilation, callback) => {
      setTimeout(() => {
        // 异步逻辑
        callback(); // 必须调用 callback
      }, 1000);
    });

    // 异步钩子（Promise 方式）：使用 tapPromise
    compiler.hooks.emit.tapPromise("MyPlugin", (compilation) => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  }
}
```

---

## 问题 5：访问 Compilation 对象

Compilation 包含了当前编译的所有信息：

```javascript
compiler.hooks.compilation.tap("MyPlugin", (compilation) => {
  // 访问模块
  compilation.hooks.buildModule.tap("MyPlugin", (module) => {
    console.log("正在构建模块:", module.resource);
  });

  // 优化阶段
  compilation.hooks.optimize.tap("MyPlugin", () => {
    console.log("开始优化");
  });

  // 访问 chunks
  compilation.hooks.afterOptimizeChunks.tap("MyPlugin", (chunks) => {
    chunks.forEach((chunk) => {
      console.log("Chunk:", chunk.name);
    });
  });
});
```

---

## 问题 6：Plugin 开发最佳实践

```javascript
class MyPlugin {
  static PLUGIN_NAME = "MyPlugin";

  constructor(options = {}) {
    // 验证选项
    this.options = this.validateOptions(options);
  }

  validateOptions(options) {
    // 参数校验逻辑
    return { ...defaultOptions, ...options };
  }

  apply(compiler) {
    // 使用常量作为插件名
    compiler.hooks.done.tap(MyPlugin.PLUGIN_NAME, (stats) => {
      // 错误处理
      if (stats.hasErrors()) {
        console.error("构建出错");
        return;
      }
      // 正常逻辑
    });
  }
}
```

## 延伸阅读

- [Writing a Plugin](https://webpack.js.org/contribute/writing-a-plugin/)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
