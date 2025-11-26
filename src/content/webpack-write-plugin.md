---
title: Webpack 手写 plugin 有哪些重要 API 与注意的地方
category: Webpack
difficulty: 高级
updatedAt: 2025-11-26
summary: >-
  深入学习如何编写自定义 Webpack plugin。掌握 Compiler 和 Compilation 对象、
  Tapable 钩子系统和插件开发的最佳实践。
tags:
  - Webpack
  - Plugin
  - 自定义开发
  - Tapable
estimatedTime: 28 分钟
keywords:
  - 手写 plugin
  - Compiler
  - Compilation
  - Tapable 钩子
highlight: 掌握 Compiler、Compilation 对象和 Tapable 钩子系统
order: 217
---

## 问题 1：Plugin 的基本结构是什么？

**Plugin 是一个包含 apply 方法的类或对象**。

### 最简单的 Plugin

```javascript
// SimplePlugin.js
class SimplePlugin {
  apply(compiler) {
    // compiler: Webpack 编译器对象
    
    compiler.hooks.done.tap('SimplePlugin', (stats) => {
      console.log('编译完成！');
    });
  }
}

module.exports = SimplePlugin;
```

### 使用 Plugin

```javascript
// webpack.config.js
const SimplePlugin = require('./plugins/SimplePlugin');

module.exports = {
  plugins: [
    new SimplePlugin()
  ]
};
```

---

## 问题 2：Compiler 和 Compilation 有什么区别？

**Compiler 代表整个 Webpack 环境，Compilation 代表一次编译过程**。

### Compiler 对象

```javascript
class MyPlugin {
  apply(compiler) {
    // Compiler 对象包含：
    // - options: Webpack 配置
    // - hooks: 编译器钩子
    // - inputFileSystem: 输入文件系统
    // - outputFileSystem: 输出文件系统
    
    console.log(compiler.options.entry);
    console.log(compiler.options.output);
    
    // Compiler 钩子在整个 Webpack 生命周期中只执行一次
    compiler.hooks.run.tap('MyPlugin', () => {
      console.log('开始编译');
    });
    
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('编译完成');
    });
  }
}
```

### Compilation 对象

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // Compilation 对象包含：
      // - modules: 所有模块
      // - chunks: 所有 chunk
      // - assets: 所有资源
      // - hooks: 编译钩子
      
      console.log(compilation.modules);
      console.log(compilation.chunks);
      console.log(compilation.assets);
      
      // Compilation 钩子在每次编译时都会执行
      // 例如：watch 模式下文件改变会触发新的 compilation
    });
  }
}
```

---

## 问题 3：Tapable 钩子系统如何使用？

**Webpack 使用 Tapable 提供的钩子系统**。

### 钩子类型

```javascript
const {
  SyncHook,              // 同步钩子
  SyncBailHook,          // 同步熔断钩子
  SyncWaterfallHook,     // 同步瀑布钩子
  AsyncSeriesHook,       // 异步串行钩子
  AsyncParallelHook      // 异步并行钩子
} = require('tapable');
```

### 同步钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // tap: 注册同步钩子
    compiler.hooks.compile.tap('MyPlugin', (params) => {
      console.log('开始编译');
    });
    
    // SyncBailHook: 返回非 undefined 会熔断
    compiler.hooks.shouldEmit.tap('MyPlugin', (compilation) => {
      // 返回 false 会阻止输出
      return true;
    });
  }
}
```

### 异步钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // tapAsync: 注册异步钩子（回调风格）
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      setTimeout(() => {
        console.log('异步操作完成');
        callback();  // 必须调用 callback
      }, 1000);
    });
    
    // tapPromise: 注册异步钩子（Promise 风格）
    compiler.hooks.emit.tapPromise('MyPlugin', async (compilation) => {
      await doSomethingAsync();
      console.log('异步操作完成');
    });
  }
}
```

---

## 问题 4：常用的 Compiler 钩子有哪些？

**从初始化到编译完成的各个阶段**。

### 主要钩子

```javascript
class MyPlugin {
  apply(compiler) {
    // 1. environment: 环境准备好
    compiler.hooks.environment.tap('MyPlugin', () => {
      console.log('1. 环境准备');
    });
    
    // 2. afterEnvironment: 环境准备完成
    compiler.hooks.afterEnvironment.tap('MyPlugin', () => {
      console.log('2. 环境准备完成');
    });
    
    // 3. entryOption: 处理 entry 配置
    compiler.hooks.entryOption.tap('MyPlugin', (context, entry) => {
      console.log('3. 处理入口配置');
    });
    
    // 4. beforeRun: 开始编译前
    compiler.hooks.beforeRun.tapAsync('MyPlugin', (compiler, callback) => {
      console.log('4. 开始编译前');
      callback();
    });
    
    // 5. run: 开始编译
    compiler.hooks.run.tapAsync('MyPlugin', (compiler, callback) => {
      console.log('5. 开始编译');
      callback();
    });
    
    // 6. compile: 创建 compilation 前
    compiler.hooks.compile.tap('MyPlugin', (params) => {
      console.log('6. 创建 compilation 前');
    });
    
    // 7. compilation: 创建 compilation
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      console.log('7. 创建 compilation');
    });
    
    // 8. make: 开始构建
    compiler.hooks.make.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('8. 开始构建');
      callback();
    });
    
    // 9. emit: 输出资源前
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('9. 输出资源前');
      callback();
    });
    
    // 10. afterEmit: 输出资源后
    compiler.hooks.afterEmit.tapAsync('MyPlugin', (compilation, callback) => {
      console.log('10. 输出资源后');
      callback();
    });
    
    // 11. done: 编译完成
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('11. 编译完成');
    });
  }
}
```

---

## 问题 5：常用的 Compilation 钩子有哪些？

**处理模块、优化、生成资源等**。

### 主要钩子

```javascript
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // 1. buildModule: 构建模块前
      compilation.hooks.buildModule.tap('MyPlugin', (module) => {
        console.log('构建模块:', module.resource);
      });
      
      // 2. succeedModule: 模块构建成功
      compilation.hooks.succeedModule.tap('MyPlugin', (module) => {
        console.log('模块构建成功:', module.resource);
      });
      
      // 3. optimize: 优化阶段
      compilation.hooks.optimize.tap('MyPlugin', () => {
        console.log('开始优化');
      });
      
      // 4. optimizeModules: 优化模块
      compilation.hooks.optimizeModules.tap('MyPlugin', (modules) => {
        console.log('优化模块');
      });
      
      // 5. optimizeChunks: 优化 chunk
      compilation.hooks.optimizeChunks.tap('MyPlugin', (chunks) => {
        console.log('优化 chunk');
      });
      
      // 6. optimizeAssets: 优化资源
      compilation.hooks.optimizeAssets.tapAsync('MyPlugin', (assets, callback) => {
        console.log('优化资源');
        callback();
      });
      
      // 7. processAssets: 处理资源
      compilation.hooks.processAssets.tap('MyPlugin', (assets) => {
        console.log('处理资源');
      });
    });
  }
}
```

---

## 问题 6：如何操作编译资源？

**通过 compilation.assets 操作输出文件**。

### 添加资源

```javascript
class AddFilePlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('AddFilePlugin', (compilation, callback) => {
      // 添加新文件
      const content = 'Hello from plugin!';
      
      compilation.assets['hello.txt'] = {
        source: () => content,
        size: () => content.length
      };
      
      callback();
    });
  }
}
```

### 修改资源

```javascript
class ModifyAssetPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('ModifyAssetPlugin', (compilation, callback) => {
      // 遍历所有资源
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.js')) {
          const asset = compilation.assets[filename];
          const source = asset.source();
          
          // 修改内容
          const newSource = `/* Modified */\n${source}`;
          
          // 更新资源
          compilation.assets[filename] = {
            source: () => newSource,
            size: () => newSource.length
          };
        }
      });
      
      callback();
    });
  }
}
```

### 删除资源

```javascript
class RemoveAssetPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('RemoveAssetPlugin', (compilation, callback) => {
      // 删除特定文件
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.LICENSE.txt')) {
          delete compilation.assets[filename];
        }
      });
      
      callback();
    });
  }
}
```

---

## 问题 7：如何处理 Plugin 配置？

**通过构造函数接收配置**。

### 接收配置

```javascript
class MyPlugin {
  constructor(options = {}) {
    this.options = {
      // 默认配置
      name: 'MyPlugin',
      enabled: true,
      ...options  // 合并用户配置
    };
  }
  
  apply(compiler) {
    if (!this.options.enabled) {
      return;
    }
    
    compiler.hooks.done.tap(this.options.name, (stats) => {
      console.log(`${this.options.name} 完成`);
    });
  }
}

// 使用
new MyPlugin({
  name: 'CustomPlugin',
  enabled: true
});
```

### 配置验证

```javascript
const { validate } = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    enabled: {
      type: 'boolean'
    }
  },
  additionalProperties: false
};

class MyPlugin {
  constructor(options = {}) {
    // 验证配置
    validate(schema, options, {
      name: 'MyPlugin',
      baseDataPath: 'options'
    });
    
    this.options = options;
  }
  
  apply(compiler) {
    // ...
  }
}
```

---

## 问题 8：完整的 Plugin 示例

**实现一个文件列表生成插件**。

### FileListPlugin.js

```javascript
class FileListPlugin {
  constructor(options = {}) {
    this.options = {
      filename: 'filelist.md',
      ...options
    };
  }
  
  apply(compiler) {
    compiler.hooks.emit.tapAsync('FileListPlugin', (compilation, callback) => {
      // 生成文件列表
      let content = '# 文件列表\n\n';
      
      // 遍历所有资源
      const files = Object.keys(compilation.assets).sort();
      
      files.forEach(filename => {
        const asset = compilation.assets[filename];
        const size = asset.size();
        const sizeKB = (size / 1024).toFixed(2);
        
        content += `- ${filename} (${sizeKB} KB)\n`;
      });
      
      // 添加统计信息
      content += `\n## 统计\n\n`;
      content += `- 总文件数: ${files.length}\n`;
      
      const totalSize = files.reduce((sum, filename) => {
        return sum + compilation.assets[filename].size();
      }, 0);
      content += `- 总大小: ${(totalSize / 1024).toFixed(2)} KB\n`;
      
      // 添加到资源
      compilation.assets[this.options.filename] = {
        source: () => content,
        size: () => content.length
      };
      
      callback();
    });
  }
}

module.exports = FileListPlugin;
```

### 使用 Plugin

```javascript
// webpack.config.js
const FileListPlugin = require('./plugins/FileListPlugin');

module.exports = {
  plugins: [
    new FileListPlugin({
      filename: 'assets.md'
    })
  ]
};
```

---

## 总结

**核心概念**：

### 1. Plugin 结构
- apply 方法
- 接收 compiler 对象
- 注册钩子

### 2. 核心对象
- Compiler: 整个 Webpack 环境
- Compilation: 一次编译过程

### 3. Tapable 钩子
- tap: 同步钩子
- tapAsync: 异步钩子（回调）
- tapPromise: 异步钩子（Promise）

### 4. Compiler 钩子
- environment, compile, make
- emit, afterEmit, done

### 5. Compilation 钩子
- buildModule, optimizeModules
- optimizeChunks, processAssets

### 6. 资源操作
- compilation.assets: 访问资源
- source(): 获取内容
- size(): 获取大小

### 7. 最佳实践
- 配置验证
- 错误处理
- 性能优化
- 文档完善

## 延伸阅读

- [Plugin API 官方文档](https://webpack.js.org/api/plugins/)
- [编写 Plugin 指南](https://webpack.js.org/contribute/writing-a-plugin/)
- [Tapable 文档](https://github.com/webpack/tapable)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
