---
title: Webpack 内部执行原理
category: Webpack
difficulty: 高级
updatedAt: 2025-11-26
summary: >-
  深入理解 Webpack 的内部执行流程和核心原理。从初始化到输出文件，
  全面剖析 Webpack 的构建过程和关键机制。
tags:
  - Webpack
  - 构建原理
  - 编译流程
  - 核心机制
estimatedTime: 30 分钟
keywords:
  - Webpack 原理
  - 编译流程
  - 模块解析
  - 依赖图
highlight: Webpack 通过构建依赖图、编译模块、生成 bundle 完成打包过程
order: 220
---

## 问题 1：Webpack 的整体执行流程是什么？

**初始化 → 编译 → 输出三个主要阶段**。

### 执行流程概览

```
1. 初始化阶段
   ├── 读取配置文件
   ├── 合并配置
   ├── 创建 Compiler 对象
   └── 加载插件

2. 编译阶段
   ├── 确定入口
   ├── 编译模块
   ├── 完成模块编译
   └── 输出资源

3. 输出阶段
   ├── 确定输出内容
   ├── 写入文件系统
   └── 完成构建
```

---

## 问题 2：初始化阶段做了什么？

**读取配置、创建 Compiler、注册插件**。

### 初始化流程

```javascript
// 1. 读取配置文件
const config = require('./webpack.config.js');

// 2. 合并默认配置
const options = merge(defaultConfig, config);

// 3. 创建 Compiler 对象
const compiler = new Compiler(options);

// 4. 加载插件
if (options.plugins && Array.isArray(options.plugins)) {
  for (const plugin of options.plugins) {
    plugin.apply(compiler);
  }
}

// 5. 触发 environment 和 afterEnvironment 钩子
compiler.hooks.environment.call();
compiler.hooks.afterEnvironment.call();

// 6. 初始化内置插件
new EntryOptionPlugin().apply(compiler);
compiler.hooks.entryOption.call(options.context, options.entry);
```

### Compiler 对象

```javascript
class Compiler {
  constructor(context) {
    this.hooks = {
      // 生命周期钩子
      environment: new SyncHook([]),
      afterEnvironment: new SyncHook([]),
      entryOption: new SyncBailHook(['context', 'entry']),
      beforeRun: new AsyncSeriesHook(['compiler']),
      run: new AsyncSeriesHook(['compiler']),
      compile: new SyncHook(['params']),
      compilation: new SyncHook(['compilation', 'params']),
      make: new AsyncParallelHook(['compilation']),
      emit: new AsyncSeriesHook(['compilation']),
      done: new AsyncSeriesHook(['stats'])
    };
    
    this.options = {};
    this.context = context;
    this.inputFileSystem = null;
    this.outputFileSystem = null;
  }
  
  run(callback) {
    // 开始编译
  }
}
```

---

## 问题 3：编译阶段如何构建依赖图？

**从入口开始递归解析所有依赖模块**。

### 编译流程

```javascript
class Compiler {
  run(callback) {
    // 1. 触发 beforeRun 钩子
    this.hooks.beforeRun.callAsync(this, err => {
      if (err) return callback(err);
      
      // 2. 触发 run 钩子
      this.hooks.run.callAsync(this, err => {
        if (err) return callback(err);
        
        // 3. 开始编译
        this.compile(onCompiled);
      });
    });
  }
  
  compile(callback) {
    // 1. 创建 Compilation 对象
    const params = this.newCompilationParams();
    
    // 2. 触发 beforeCompile 钩子
    this.hooks.beforeCompile.callAsync(params, err => {
      if (err) return callback(err);
      
      // 3. 触发 compile 钩子
      this.hooks.compile.call(params);
      
      // 4. 创建 compilation
      const compilation = this.newCompilation(params);
      
      // 5. 触发 make 钩子，开始构建
      this.hooks.make.callAsync(compilation, err => {
        if (err) return callback(err);
        
        // 6. 完成构建
        compilation.finish(err => {
          if (err) return callback(err);
          
          // 7. 封装
          compilation.seal(err => {
            if (err) return callback(err);
            
            // 8. 触发 afterCompile 钩子
            this.hooks.afterCompile.callAsync(compilation, err => {
              if (err) return callback(err);
              
              return callback(null, compilation);
            });
          });
        });
      });
    });
  }
}
```

### 构建依赖图

```javascript
class Compilation {
  buildModule(module, callback) {
    // 1. 调用 loader 处理模块
    this.hooks.buildModule.call(module);
    
    module.build(this.options, this, this.resolverFactory, err => {
      if (err) return callback(err);
      
      // 2. 解析模块依赖
      this.processModuleDependencies(module, err => {
        if (err) return callback(err);
        
        callback(null, module);
      });
    });
  }
  
  processModuleDependencies(module, callback) {
    const dependencies = module.dependencies;
    
    // 递归处理所有依赖
    async.forEach(dependencies, (dependency, callback) => {
      // 解析依赖路径
      this.moduleFactory.create({
        dependency: dependency
      }, (err, dependencyModule) => {
        if (err) return callback(err);
        
        // 递归构建依赖模块
        this.buildModule(dependencyModule, callback);
      });
    }, callback);
  }
}
```

---

## 问题 4：模块是如何被解析和编译的？

**通过 Loader 转换，生成 AST，提取依赖**。

### 模块编译流程

```javascript
class NormalModule {
  build(options, compilation, resolver, callback) {
    // 1. 使用 loader 处理模块
    this.doBuild(options, compilation, resolver, err => {
      if (err) return callback(err);
      
      // 2. 解析源码，生成 AST
      const source = this._source.source();
      const ast = this.parser.parse(source);
      
      // 3. 遍历 AST，提取依赖
      this.parser.walkStatements(ast.body);
      
      callback();
    });
  }
  
  doBuild(options, compilation, resolver, callback) {
    // 获取 loader
    const loaders = this.getLoaders();
    
    // 执行 loader 链
    runLoaders({
      resource: this.resource,
      loaders: loaders,
      context: loaderContext,
      readResource: fs.readFile.bind(fs)
    }, (err, result) => {
      if (err) return callback(err);
      
      // 保存处理后的源码
      this._source = new RawSource(result.result[0]);
      
      callback();
    });
  }
}
```

### 依赖提取

```javascript
class Parser {
  parse(source) {
    // 使用 acorn 解析源码
    const ast = acorn.parse(source, {
      sourceType: 'module',
      ecmaVersion: 2020
    });
    
    return ast;
  }
  
  walkStatements(statements) {
    for (const statement of statements) {
      this.walkStatement(statement);
    }
  }
  
  walkStatement(statement) {
    if (statement.type === 'ImportDeclaration') {
      // 处理 import 语句
      const source = statement.source.value;
      this.addDependency(new ImportDependency(source));
    } else if (statement.type === 'CallExpression') {
      // 处理 require 调用
      if (statement.callee.name === 'require') {
        const source = statement.arguments[0].value;
        this.addDependency(new CommonJsRequireDependency(source));
      }
    }
  }
  
  addDependency(dependency) {
    this.module.addDependency(dependency);
  }
}
```

---

## 问题 5：Chunk 是如何生成的？

**根据入口和依赖关系生成 Chunk**。

### Chunk 生成流程

```javascript
class Compilation {
  seal(callback) {
    // 1. 触发 seal 钩子
    this.hooks.seal.call();
    
    // 2. 优化依赖
    this.hooks.optimizeDependencies.call(this.modules);
    
    // 3. 创建 Chunk
    this.createChunks();
    
    // 4. 优化 Chunk
    this.hooks.optimizeChunks.call(this.chunks);
    
    // 5. 优化模块顺序
    this.hooks.optimizeModuleOrder.call(this.modules);
    
    // 6. 生成模块 ID
    this.hooks.moduleIds.call(this.modules);
    
    // 7. 生成 Chunk ID
    this.hooks.chunkIds.call(this.chunks);
    
    // 8. 生成代码
    this.createChunkAssets();
    
    callback();
  }
  
  createChunks() {
    // 为每个入口创建 Chunk
    for (const [name, entrypoint] of this.entrypoints) {
      const chunk = this.addChunk(name);
      chunk.entryModule = entrypoint.module;
      
      // 将模块添加到 Chunk
      this.assignModulesToChunks(chunk);
    }
  }
  
  assignModulesToChunks(chunk) {
    const queue = [chunk.entryModule];
    const visited = new Set();
    
    while (queue.length > 0) {
      const module = queue.shift();
      
      if (visited.has(module)) continue;
      visited.add(module);
      
      // 将模块添加到 Chunk
      chunk.addModule(module);
      
      // 处理依赖
      for (const dependency of module.dependencies) {
        const depModule = dependency.module;
        if (depModule) {
          queue.push(depModule);
        }
      }
    }
  }
}
```

---

## 问题 6：如何生成最终的代码？

**根据模板生成 bundle 代码**。

### 代码生成

```javascript
class Compilation {
  createChunkAssets() {
    for (const chunk of this.chunks) {
      // 1. 生成文件名
      const filename = this.getPath(this.outputOptions.filename, {
        chunk: chunk
      });
      
      // 2. 生成代码
      const source = this.renderChunk(chunk);
      
      // 3. 添加到 assets
      this.assets[filename] = source;
    }
  }
  
  renderChunk(chunk) {
    // 使用模板生成代码
    const template = new MainTemplate(this.outputOptions);
    
    // 生成 bundle 代码
    const source = template.render(
      chunk.hash,
      chunk.modules,
      chunk.entryModule
    );
    
    return source;
  }
}
```

### Bundle 模板

```javascript
class MainTemplate {
  render(hash, modules, entryModule) {
    // 生成模块映射
    const moduleMap = this.renderModuleMap(modules);
    
    // 生成 bundle 代码
    return `
      (function(modules) {
        // Webpack 模块加载器
        function __webpack_require__(moduleId) {
          // 检查缓存
          if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
          }
          
          // 创建模块
          var module = installedModules[moduleId] = {
            id: moduleId,
            loaded: false,
            exports: {}
          };
          
          // 执行模块函数
          modules[moduleId].call(
            module.exports,
            module,
            module.exports,
            __webpack_require__
          );
          
          module.loaded = true;
          return module.exports;
        }
        
        // 加载入口模块
        return __webpack_require__("${entryModule.id}");
      })({
        ${moduleMap}
      });
    `;
  }
  
  renderModuleMap(modules) {
    return modules.map(module => {
      return `"${module.id}": function(module, exports, __webpack_require__) {
        ${module.source}
      }`;
    }).join(',\n');
  }
}
```

---

## 问题 7：输出阶段做了什么？

**将生成的资源写入文件系统**。

### 输出流程

```javascript
class Compiler {
  emitAssets(compilation, callback) {
    // 1. 触发 emit 钩子
    this.hooks.emit.callAsync(compilation, err => {
      if (err) return callback(err);
      
      // 2. 确定输出路径
      const outputPath = this.outputPath;
      
      // 3. 写入文件
      async.forEach(
        Object.keys(compilation.assets),
        (file, callback) => {
          const targetPath = path.join(outputPath, file);
          const source = compilation.assets[file];
          const content = source.source();
          
          // 写入文件系统
          this.outputFileSystem.writeFile(
            targetPath,
            content,
            callback
          );
        },
        err => {
          if (err) return callback(err);
          
          // 4. 触发 afterEmit 钩子
          this.hooks.afterEmit.callAsync(compilation, callback);
        }
      );
    });
  }
  
  onCompiled(err, compilation) {
    if (err) return finalCallback(err);
    
    // 输出资源
    this.emitAssets(compilation, err => {
      if (err) return finalCallback(err);
      
      // 触发 done 钩子
      this.hooks.done.callAsync(stats, err => {
        if (err) return finalCallback(err);
        
        return finalCallback(null, stats);
      });
    });
  }
}
```

---

## 总结

**核心流程**：

### 1. 初始化阶段
- 读取配置文件
- 创建 Compiler 对象
- 加载插件
- 触发初始化钩子

### 2. 编译阶段
- 创建 Compilation 对象
- 从入口开始构建
- 使用 Loader 转换模块
- 解析 AST 提取依赖
- 递归处理所有模块

### 3. 生成阶段
- 创建 Chunk
- 优化 Chunk
- 生成模块 ID
- 生成代码

### 4. 输出阶段
- 确定输出路径
- 写入文件系统
- 触发完成钩子

### 5. 核心概念
- Compiler: 编译器对象
- Compilation: 编译过程对象
- Module: 模块
- Chunk: 代码块
- Asset: 输出资源

## 延伸阅读

- [Webpack 架构概览](https://webpack.js.org/concepts/)
- [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
- [Compilation Hooks](https://webpack.js.org/api/compilation-hooks/)
- [Webpack 源码解析](https://github.com/webpack/webpack)
- [深入理解 Webpack](https://webpack.js.org/concepts/under-the-hood/)
