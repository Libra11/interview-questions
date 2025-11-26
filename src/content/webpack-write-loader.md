---
title: Webpack 手写 loader 有哪些重要 API 与注意事项
category: Webpack
difficulty: 高级
updatedAt: 2025-11-26
summary: >-
  深入学习如何编写自定义 Webpack loader。掌握 loader API、开发规范和最佳实践，
  能够开发满足项目需求的自定义 loader。
tags:
  - Webpack
  - Loader
  - 自定义开发
  - API
estimatedTime: 26 分钟
keywords:
  - 手写 loader
  - Loader API
  - this 上下文
  - loader 开发
highlight: 掌握 this 上下文 API、异步处理、缓存机制等核心概念
order: 216
---

## 问题 1：Loader 的基本结构是什么？

**Loader 本质是一个导出函数的 Node.js 模块**。

### 最简单的 Loader

```javascript
// simple-loader.js
module.exports = function(source) {
  // source: 源文件内容或上一个 loader 的输出
  
  // 处理内容
  const result = source.replace(/foo/g, 'bar');
  
  // 返回处理后的内容
  return result;
};
```

### 使用 Loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.txt$/,
        use: [
          {
            loader: path.resolve(__dirname, 'loaders/simple-loader.js')
          }
        ]
      }
    ]
  }
};
```

---

## 问题 2：重要的 this API 有哪些？

**Webpack 提供了丰富的 this 上下文 API**。

### this.callback

```javascript
// 返回多个值
module.exports = function(source) {
  const result = transform(source);
  const sourceMap = generateSourceMap(source, result);
  
  // this.callback(err, content, sourceMap, meta)
  this.callback(
    null,           // error: 错误信息
    result,         // content: 处理后的内容
    sourceMap,      // sourceMap: source map
    { ast: ast }    // meta: 额外的元数据
  );
  
  // 调用 callback 后不需要 return
};
```

### this.async

```javascript
// 异步处理
module.exports = function(source) {
  // 获取异步回调
  const callback = this.async();
  
  // 异步操作
  someAsyncOperation(source, (err, result) => {
    if (err) {
      return callback(err);
    }
    
    callback(null, result);
  });
  
  // 不需要 return
};

// 使用 Promise
module.exports = function(source) {
  const callback = this.async();
  
  processAsync(source)
    .then(result => callback(null, result))
    .catch(err => callback(err));
};

// 使用 async/await
module.exports = async function(source) {
  const callback = this.async();
  
  try {
    const result = await processAsync(source);
    callback(null, result);
  } catch (err) {
    callback(err);
  }
};
```

### this.cacheable

```javascript
// 控制缓存
module.exports = function(source) {
  // 设置是否可缓存（默认为 true）
  this.cacheable(true);
  
  // 如果 loader 的结果依赖外部因素，设置为 false
  // 例如：依赖当前时间、随机数等
  if (dependsOnExternalFactors) {
    this.cacheable(false);
  }
  
  return transform(source);
};
```

### this.addDependency

```javascript
// 添加文件依赖
module.exports = function(source) {
  const configPath = path.resolve(__dirname, 'config.json');
  
  // 添加依赖，当 config.json 变化时重新编译
  this.addDependency(configPath);
  
  const config = require(configPath);
  const result = transform(source, config);
  
  return result;
};

// 添加目录依赖
module.exports = function(source) {
  const dirPath = path.resolve(__dirname, 'templates');
  
  // 监听整个目录
  this.addContextDependency(dirPath);
  
  return source;
};
```

### this.emitFile

```javascript
// 输出文件
module.exports = function(source) {
  const fileName = 'output.txt';
  const content = 'Generated content';
  
  // 输出文件到 dist 目录
  this.emitFile(fileName, content);
  
  return source;
};

// 输出图片
module.exports = function(source) {
  const imageBuffer = processImage(source);
  const fileName = `images/${Date.now()}.png`;
  
  this.emitFile(fileName, imageBuffer);
  
  // 返回图片路径
  return `module.exports = "${fileName}"`;
};
```

### this.resourcePath 和 this.resourceQuery

```javascript
module.exports = function(source) {
  // 当前文件的绝对路径
  console.log(this.resourcePath);
  // /Users/project/src/index.js
  
  // 查询参数
  console.log(this.resourceQuery);
  // ?inline
  
  // 文件名
  console.log(path.basename(this.resourcePath));
  // index.js
  
  return source;
};
```

### this.getOptions

```javascript
const { getOptions } = require('loader-utils');

module.exports = function(source) {
  // 获取 loader 配置
  const options = getOptions(this) || {};
  
  console.log(options.name);
  console.log(options.flag);
  
  return transform(source, options);
};
```

---

## 问题 3：如何处理 Loader 配置？

**使用 loader-utils 和 schema-utils**。

### 获取和验证配置

```javascript
const { getOptions } = require('loader-utils');
const { validate } = require('schema-utils');

// 定义配置 schema
const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Name of the loader'
    },
    flag: {
      type: 'boolean',
      description: 'Enable feature flag'
    },
    options: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['development', 'production']
        }
      }
    }
  },
  additionalProperties: false
};

module.exports = function(source) {
  // 获取配置
  const options = getOptions(this);
  
  // 验证配置
  validate(schema, options, {
    name: 'My Loader',
    baseDataPath: 'options'
  });
  
  // 使用配置
  return transform(source, options);
};
```

---

## 问题 4：如何实现 Pitch Loader？

**Pitch 方法在 normal 执行前运行，可以实现熔断**。

### Pitch 基础

```javascript
module.exports = function(source) {
  console.log('normal phase');
  return source;
};

module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  console.log('pitch phase');
  
  // remainingRequest: 剩余的 loader 请求
  // precedingRequest: 已执行的 loader 请求
  // data: 与 normal 阶段共享的数据对象
  
  // 设置共享数据
  data.value = 'shared data';
};
```

### Pitch 熔断

```javascript
// style-loader 的简化实现
module.exports = function(source) {
  // normal 阶段：不会执行（被 pitch 熔断）
};

module.exports.pitch = function(remainingRequest) {
  // 返回值会熔断后续 loader
  return `
    var content = require(${JSON.stringify(remainingRequest)});
    var style = document.createElement('style');
    style.innerHTML = content;
    document.head.appendChild(style);
  `;
};
```

### 数据共享

```javascript
module.exports = function(source) {
  // 在 normal 阶段访问 pitch 设置的数据
  console.log(this.data.timestamp);
  console.log(this.data.config);
  
  return source;
};

module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  // 在 pitch 阶段设置数据
  data.timestamp = Date.now();
  data.config = loadConfig();
};
```

---

## 问题 5：如何处理二进制文件？

**设置 raw 属性处理 Buffer**。

### 处理二进制文件

```javascript
// image-loader.js
module.exports = function(source) {
  // source 是 Buffer
  console.log(Buffer.isBuffer(source));  // true
  
  // 处理图片
  const processedImage = processImage(source);
  
  // 输出文件
  const fileName = `images/${Date.now()}.png`;
  this.emitFile(fileName, processedImage);
  
  // 返回路径
  return `module.exports = "${fileName}"`;
};

// 标记为 raw loader
module.exports.raw = true;
```

### 文件转 Base64

```javascript
module.exports = function(source) {
  // source 是 Buffer
  const base64 = source.toString('base64');
  const mimeType = getMimeType(this.resourcePath);
  
  return `module.exports = "data:${mimeType};base64,${base64}"`;
};

module.exports.raw = true;

function getMimeType(filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

---

## 问题 6：Loader 开发的最佳实践有哪些？

**单一职责、无状态、链式调用**。

### 单一职责

```javascript
// ❌ 不好：一个 loader 做太多事
module.exports = function(source) {
  // 1. 转换语法
  const transpiled = babel.transform(source);
  
  // 2. 压缩代码
  const minified = terser.minify(transpiled);
  
  // 3. 添加注释
  const withComments = addComments(minified);
  
  return withComments;
};

// ✅ 好：每个 loader 只做一件事
// babel-loader: 转换语法
// terser-loader: 压缩代码
// comment-loader: 添加注释
```

### 无状态

```javascript
// ❌ 不好：使用全局状态
let counter = 0;

module.exports = function(source) {
  counter++;  // 有状态，不可预测
  return source + `\n// File ${counter}`;
};

// ✅ 好：无状态
module.exports = function(source) {
  const fileName = path.basename(this.resourcePath);
  return source + `\n// File: ${fileName}`;
};
```

### 错误处理

```javascript
module.exports = function(source) {
  try {
    const result = transform(source);
    return result;
  } catch (error) {
    // 使用 this.emitError 报告错误
    this.emitError(new Error(`Transform failed: ${error.message}`));
    
    // 或使用 callback
    // this.callback(error);
    
    // 返回原始内容
    return source;
  }
};
```

### 性能优化

```javascript
module.exports = function(source) {
  // 1. 启用缓存
  this.cacheable(true);
  
  // 2. 避免重复计算
  const cached = cache.get(this.resourcePath);
  if (cached) {
    return cached;
  }
  
  // 3. 只处理必要的文件
  if (!shouldProcess(this.resourcePath)) {
    return source;
  }
  
  const result = expensiveTransform(source);
  cache.set(this.resourcePath, result);
  
  return result;
};
```

---

## 问题 7：完整的 Loader 示例

**实现一个 Markdown Loader**。

### markdown-loader.js

```javascript
const marked = require('marked');
const { getOptions } = require('loader-utils');
const { validate } = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    highlight: {
      type: 'boolean',
      description: 'Enable syntax highlighting'
    },
    wrapper: {
      type: 'string',
      description: 'Wrapper class name'
    }
  }
};

module.exports = function(source) {
  // 获取配置
  const options = getOptions(this) || {};
  
  // 验证配置
  validate(schema, options, {
    name: 'Markdown Loader',
    baseDataPath: 'options'
  });
  
  // 启用缓存
  this.cacheable(true);
  
  // 配置 marked
  if (options.highlight) {
    marked.setOptions({
      highlight: function(code, lang) {
        return highlightCode(code, lang);
      }
    });
  }
  
  // 转换 Markdown
  const html = marked(source);
  
  // 包装 HTML
  const wrapper = options.wrapper || 'markdown-content';
  const result = `
    export default function() {
      const div = document.createElement('div');
      div.className = '${wrapper}';
      div.innerHTML = ${JSON.stringify(html)};
      return div;
    }
  `;
  
  return result;
};

function highlightCode(code, lang) {
  // 实现代码高亮
  return code;
}
```

### 使用 Loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: [
          {
            loader: path.resolve(__dirname, 'loaders/markdown-loader.js'),
            options: {
              highlight: true,
              wrapper: 'markdown-body'
            }
          }
        ]
      }
    ]
  }
};
```

---

## 总结

**核心 API**：

### 1. 基础 API
- source: 输入内容
- return: 返回处理后的内容
- this.callback: 返回多个值

### 2. 异步处理
- this.async: 获取异步回调
- Promise/async-await 支持

### 3. 缓存和依赖
- this.cacheable: 控制缓存
- this.addDependency: 添加文件依赖
- this.addContextDependency: 添加目录依赖

### 4. 文件操作
- this.emitFile: 输出文件
- this.resourcePath: 文件路径
- this.resourceQuery: 查询参数

### 5. 配置处理
- getOptions: 获取配置
- schema-utils: 验证配置

### 6. 高级特性
- pitch: 熔断机制
- raw: 处理二进制
- data: 数据共享

### 7. 最佳实践
- 单一职责
- 无状态
- 错误处理
- 性能优化

## 延伸阅读

- [Loader API 官方文档](https://webpack.js.org/api/loaders/)
- [编写 Loader 指南](https://webpack.js.org/contribute/writing-a-loader/)
- [loader-utils](https://github.com/webpack/loader-utils)
- [schema-utils](https://github.com/webpack/schema-utils)
